import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import {
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
function config() {
  let raw = "";
  try {
    raw = readFileSync("env.txt", "utf8");
  } catch {}
  return {
    url: process.env.TURSO_DATABASE_URL || raw.match(/libsql:\/\/[^\s]+/)?.[0],
    token: process.env.TURSO_AUTH_TOKEN || raw.match(/turos\s*:\s*(\S+)/i)?.[1],
    resend: process.env.RESEND_API_KEY || raw.match(/resend\s*:\s*(\S+)/i)?.[1],
  };
}
export const settings = config();
export const db = createClient({
  url: settings.url || "file:stocky.db",
  authToken: settings.url?.startsWith("file:") ? undefined : settings.token,
});
let ready: Promise<unknown> | undefined;
export function init() {
  return (ready ||= (async () => {
    await db.batch(
      [
        "CREATE TABLE IF NOT EXISTS stocky_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, role TEXT NOT NULL, created TEXT DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS stocky_sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS stocky_otps (email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER DEFAULT 0, requested INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS stocky_stores (id TEXT PRIMARY KEY, owner TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, status TEXT DEFAULT 'pending')",
        "CREATE TABLE IF NOT EXISTS stocky_products (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, stock INTEGER NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, image TEXT, status TEXT DEFAULT 'pending', demo INTEGER DEFAULT 0)",
        "CREATE TABLE IF NOT EXISTS stocky_orders (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, customer TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT DEFAULT 'new', created TEXT DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS stocky_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, entity TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS stocky_pin_attempts (id TEXT PRIMARY KEY, count INTEGER NOT NULL, started INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS stocky_passwords (user_id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS stocky_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS stocky_requests (id TEXT PRIMARY KEY, owner TEXT NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, status TEXT DEFAULT 'new', reply TEXT DEFAULT '', created TEXT DEFAULT CURRENT_TIMESTAMP)",
      ],
      "write",
    );
    for (const sql of [
      "ALTER TABLE stocky_stores ADD COLUMN description TEXT DEFAULT ''",
      "ALTER TABLE stocky_stores ADD COLUMN logo TEXT DEFAULT ''",
      "ALTER TABLE stocky_stores ADD COLUMN cover TEXT DEFAULT ''",
      "ALTER TABLE stocky_stores ADD COLUMN address TEXT DEFAULT ''",
      "ALTER TABLE stocky_stores ADD COLUMN governorate TEXT DEFAULT ''",
      "ALTER TABLE stocky_stores ADD COLUMN whatsapp TEXT DEFAULT ''",
    ]) {
      try {
        await db.execute(sql);
      } catch (e) {
        if (!String(e).toLowerCase().includes("duplicate column")) throw e;
      }
    }
  })().catch((e) => {
    ready = undefined;
    throw e;
  }));
}
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");

type EmailMessage = {
  to: string | string[];
  subject: string;
  heading: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
};

export async function sendEmail(message: EmailMessage) {
  if (!settings.resend)
    throw new Error("Le service de vérification e-mail n’est pas configuré.");
  const recipients = (Array.isArray(message.to) ? message.to : [message.to])
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  if (!recipients.length) throw new Error("Destinataire e-mail invalide.");
  const from = process.env.RESEND_FROM || "Stocky <onboarding@resend.dev>";
  const action =
    message.actionLabel && message.actionUrl
      ? `<p style="margin:28px 0"><a href="${message.actionUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#7d242c;color:#fff;text-decoration:none;font-weight:700">${message.actionLabel}</a></p>`
      : "";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f4f1;font-family:Arial,sans-serif;color:#282220"><div style="max-width:600px;margin:32px auto;padding:0 18px"><div style="padding:18px 24px;border-radius:12px 12px 0 0;background:#211918;color:#ffbd59;font-size:22px;font-weight:800">STOCKY</div><div style="padding:32px 24px;border:1px solid #e6ded8;border-top:0;border-radius:0 0 12px 12px;background:#fff"><h1 style="margin:0 0 16px;font-size:24px;color:#57191e">${message.heading}</h1><p style="margin:0;line-height:1.7;color:#625853">${message.body}</p>${action}<p style="margin:30px 0 0;padding-top:18px;border-top:1px solid #eee5df;color:#958984;font-size:12px">Stocky Downy · Mode circulaire en Tunisie</p></div></div></body></html>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.resend}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: message.subject,
      html,
      text: `${message.heading}\n\n${message.body}${message.actionUrl ? `\n\n${message.actionUrl}` : ""}`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend refuse l’envoi (${response.status}): ${detail.slice(0, 240)}`);
  }
  return response.json();
}

export async function notifyEmail(message: EmailMessage) {
  try {
    await sendEmail(message);
    return true;
  } catch (error) {
    console.error("Stocky notification email failed", error);
    return false;
  }
}

export function adminNotificationEmail() {
  return (
    process.env.NOTIFICATION_EMAIL ||
    (process.env.SUPERADMIN_EMAILS || "").split(",")[0]?.trim() ||
    ""
  );
}
export async function passwordLogin(
  email: string,
  password: string,
  register: boolean,
) {
  await init();
  if (
    (process.env.SUPERADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .includes(email)
  )
    throw new Error("Cette adresse utilise un accès administrateur dédié.");
  if (password.length < 10 || password.length > 128)
    throw new Error(
      "Le mot de passe doit contenir entre 10 et 128 caractères.",
    );
  const now = Date.now(),
    key = "password:" + hash(email);
  await db.execute({
    sql: "INSERT INTO stocky_pin_attempts(id,count,started) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN started<? THEN 1 ELSE count+1 END,started=CASE WHEN started<? THEN excluded.started ELSE started END",
    args: [key, now, now - 900000, now - 900000],
  });
  const attempts = (
    await db.execute({
      sql: "SELECT count FROM stocky_pin_attempts WHERE id=?",
      args: [key],
    })
  ).rows[0];
  if (Number(attempts.count) > 10)
    throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
  let user = (
    await db.execute({
      sql: "SELECT * FROM stocky_users WHERE email=?",
      args: [email],
    })
  ).rows[0];
  if (register) {
    if (user) throw new Error("Ce compte existe déjà. Connectez-vous.");
    const id = randomBytes(16).toString("hex"),
      salt = randomBytes(16).toString("hex");
    await db.batch(
      [
        {
          sql: "INSERT INTO stocky_users(id,email,role) VALUES(?,?,'seller')",
          args: [id, email],
        },
        {
          sql: "INSERT INTO stocky_passwords(user_id,salt,hash) VALUES(?,?,?)",
          args: [id, salt, scryptSync(password, salt, 64).toString("hex")],
        },
      ],
      "write",
    );
    user = (
      await db.execute({
        sql: "SELECT * FROM stocky_users WHERE id=?",
        args: [id],
      })
    ).rows[0];
  } else {
    const credentials = user
      ? (
          await db.execute({
            sql: "SELECT * FROM stocky_passwords WHERE user_id=?",
            args: [String(user.id)],
          })
        ).rows[0]
      : undefined;
    const actual = scryptSync(
      password,
      String(credentials?.salt || "unavailable"),
      64,
    );
    if (
      !credentials ||
      !timingSafeEqual(actual, Buffer.from(String(credentials.hash), "hex"))
    )
      throw new Error("E-mail ou mot de passe incorrect.");
  }
  const token = randomBytes(32).toString("hex");
  await db.execute({
    sql: "INSERT INTO stocky_sessions(hash,user_id,expires) VALUES(?,?,?)",
    args: [hash(token), String(user.id), now + 604800000],
  });
  (await cookies()).set("stocky_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
  await db.execute({
    sql: "DELETE FROM stocky_pin_attempts WHERE id=?",
    args: [key],
  });
}
export async function pinLogin(pin: string) {
  await init();
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO stocky_pin_attempts(id,count,started) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN started<? THEN 1 ELSE count+1 END,started=CASE WHEN started<? THEN excluded.started ELSE started END",
    args: ["admin", now, now - 900000, now - 900000],
  });
  const attempts = (
    await db.execute("SELECT count FROM stocky_pin_attempts WHERE id='admin'")
  ).rows[0];
  if (Number(attempts.count) > 10)
    throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
  if (
    !process.env.SUPERADMIN_PIN_HASH ||
    hash(pin) !== process.env.SUPERADMIN_PIN_HASH
  )
    throw new Error("PIN incorrect.");
  const email = (process.env.SUPERADMIN_EMAILS || "").split(",")[0];
  if (!email) throw new Error("Compte administrateur non configuré.");
  await db.execute({
    sql: "INSERT INTO stocky_users(id,email,role) VALUES(?,?,'superadmin') ON CONFLICT(email) DO UPDATE SET role='superadmin'",
    args: [randomBytes(16).toString("hex"), email],
  });
  const user = (
    await db.execute({
      sql: "SELECT id FROM stocky_users WHERE email=?",
      args: [email],
    })
  ).rows[0];
  const token = randomBytes(32).toString("hex");
  await db.execute({
    sql: "INSERT INTO stocky_sessions(hash,user_id,expires) VALUES(?,?,?)",
    args: [hash(token), String(user.id), now + 28800000],
  });
  (await cookies()).set("stocky_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
  });
  await db.execute("DELETE FROM stocky_pin_attempts WHERE id='admin'");
}
export async function identity() {
  await init();
  const token = (await cookies()).get("stocky_session")?.value;
  if (!token) return null;
  const result = await db.execute({
    sql: "SELECT u.* FROM stocky_users u JOIN stocky_sessions s ON s.user_id=u.id WHERE s.hash=? AND s.expires>?",
    args: [hash(token), Date.now()],
  });
  return result.rows[0] || null;
}
export async function requestOtp(email: string) {
  await init();
  const now = Date.now();
  const previous = await db.execute({
    sql: "SELECT requested FROM stocky_otps WHERE email=?",
    args: [email],
  });
  if (previous.rows[0] && now - Number(previous.rows[0].requested) < 60000)
    throw new Error("Veuillez patienter une minute avant de réessayer.");
  if (!settings.resend)
    throw new Error("Le service de vérification e-mail n’est pas configuré.");
  const otp = String(randomInt(100000, 1000000));
  await db.execute({
    sql: "INSERT OR REPLACE INTO stocky_otps(email,hash,expires,requested,attempts) VALUES(?,?,?,?,0)",
    args: [email, hash(email + otp), now + 600000, now],
  });
  try {
    await sendEmail({
      to: email,
      subject: `${otp} · Votre code de vérification Stocky`,
      heading: "Vérifiez votre adresse e-mail",
      body: `Votre code de vérification est <strong style="font-size:24px;letter-spacing:5px;color:#7d242c">${otp}</strong>. Il expire dans 10 minutes et ne peut être utilisé qu’une seule fois.`,
    });
  } catch (error) {
    await db.execute({ sql: "DELETE FROM stocky_otps WHERE email=?", args: [email] });
    throw error;
  }
}
export async function verifyOtp(email: string, code: string) {
  await init();
  await consumeOtp(email, code);
  const id = randomBytes(16).toString("hex");
  const adminEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  await db.execute({
    sql: "INSERT INTO stocky_users(id,email,role) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role",
    args: [id, email, adminEmails.includes(email) ? "superadmin" : "seller"],
  });
  const user = (
    await db.execute({
      sql: "SELECT * FROM stocky_users WHERE email=?",
      args: [email],
    })
  ).rows[0];
  await createSession(String(user.id), 604800000);
  return user;
}

async function consumeOtp(email: string, code: string) {
  const result = await db.execute({
    sql: "SELECT * FROM stocky_otps WHERE email=?",
    args: [email],
  });
  const otp = result.rows[0];
  if (!otp || Number(otp.expires) < Date.now() || Number(otp.attempts) >= 5)
    throw new Error("Code expiré. Demandez un nouveau code.");
  await db.execute({
    sql: "UPDATE stocky_otps SET attempts=attempts+1 WHERE email=?",
    args: [email],
  });
  if (otp.hash !== hash(email + code)) throw new Error("Code incorrect.");
  const removed = await db.execute({
    sql: "DELETE FROM stocky_otps WHERE email=? AND hash=?",
    args: [email, hash(email + code)],
  });
  if (!removed.rowsAffected) throw new Error("Code déjà utilisé.");
}

async function createSession(userId: string, duration: number) {
  const token = randomBytes(32).toString("hex");
  await db.execute({
    sql: "INSERT INTO stocky_sessions(hash,user_id,expires) VALUES(?,?,?)",
    args: [hash(token), userId, Date.now() + duration],
  });
  (await cookies()).set("stocky_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(duration / 1000),
  });
}

export async function registerWithOtp(
  email: string,
  password: string,
  code: string,
) {
  await init();
  if (password.length < 10 || password.length > 128)
    throw new Error(
      "Le mot de passe doit contenir entre 10 et 128 caractères.",
    );
  const existing = await db.execute({
    sql: "SELECT id FROM stocky_users WHERE email=?",
    args: [email],
  });
  if (existing.rows.length)
    throw new Error("Ce compte existe déjà. Connectez-vous.");
  await consumeOtp(email, code);
  const id = randomBytes(16).toString("hex");
  const salt = randomBytes(16).toString("hex");
  await db.batch(
    [
      {
        sql: "INSERT INTO stocky_users(id,email,role) VALUES(?,?,'seller')",
        args: [id, email],
      },
      {
        sql: "INSERT INTO stocky_passwords(user_id,salt,hash) VALUES(?,?,?)",
        args: [id, salt, scryptSync(password, salt, 64).toString("hex")],
      },
    ],
    "write",
  );
  await createSession(id, 604800000);
  await notifyEmail({
    to: email,
    subject: "Bienvenue sur Stocky Downy",
    heading: "Votre e-mail est vérifié",
    body:
      "Votre compte professionnel est prêt. Vous pouvez maintenant créer votre boutique, ajouter son identité visuelle et proposer votre première collection.",
    actionLabel: process.env.NEXT_PUBLIC_APP_URL ? "Créer ma boutique" : undefined,
    actionUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
}
