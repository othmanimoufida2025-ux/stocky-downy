import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  db,
  init,
  identity,
  requestOtp,
  hash,
  pinLogin,
  passwordLogin,
  registerWithOtp,
  notifyEmail,
  adminNotificationEmail,
} from "@/lib/backend";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await init();
    const user = await identity();
    const admin = user?.role === "superadmin";
    const products = await db.execute(
      admin
        ? "SELECT p.*,s.name AS store FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id"
        : {
            sql: "SELECT p.*,s.name AS store FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id WHERE (p.status='active' AND s.status='active') OR s.owner=?",
            args: [String(user?.id || "")],
          },
    );
    const stores = await db.execute(
      admin
        ? "SELECT * FROM stocky_stores"
        : {
            sql: "SELECT id,name,status,description,logo,cover,governorate,CASE WHEN owner=? THEN owner ELSE '' END AS owner FROM stocky_stores WHERE status='active' OR owner=?",
            args: [String(user?.id || ""), String(user?.id || "")],
          },
    );
    const orders = user
      ? await db.execute(
          admin
            ? "SELECT * FROM stocky_orders ORDER BY created DESC"
            : {
                sql: "SELECT o.* FROM stocky_orders o JOIN stocky_stores s ON s.id=o.store_id WHERE s.owner=? ORDER BY o.created DESC",
                args: [String(user.id)],
              },
        )
      : { rows: [] };
    const requests = user
      ? await db.execute(
          admin
            ? "SELECT * FROM stocky_requests ORDER BY created DESC"
            : {
                sql: "SELECT * FROM stocky_requests WHERE owner=? ORDER BY created DESC",
                args: [String(user.id)],
              },
        )
      : { rows: [] };
    const audit = admin
      ? await db.execute(
          "SELECT a.*,u.email FROM stocky_audit a LEFT JOIN stocky_users u ON u.id=a.actor ORDER BY a.id DESC LIMIT 100",
        )
      : { rows: [] };
    const users = admin
      ? await db.execute(
          "SELECT id,email,role,created FROM stocky_users ORDER BY created DESC",
        )
      : { rows: [] };
    const config = await db.execute(
      "SELECT value FROM stocky_settings WHERE id='public'",
    );
    return NextResponse.json(
      {
        user,
        products: products.rows,
        stores: stores.rows,
        orders: orders.rows,
        requests: requests.rows,
        audit: audit.rows,
        users: users.rows,
        config: config.rows[0]
          ? JSON.parse(String(config.rows[0].value))
          : {
              title: "Une nouvelle histoire pour chaque pièce.",
              deliveryFee: 0,
              commission: 10,
            },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Connexion à la base de données indisponible." },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host"))
    return NextResponse.json(
      { error: "Origine non autorisée" },
      { status: 403 },
    );
  try {
    const body = await req.text();
    if (body.length > 64000) throw new Error("Requête trop volumineuse.");
    const b = JSON.parse(body);
    await init();
    if (b.action === "pin") {
      await pinLogin(String(b.pin || ""));
      return NextResponse.json({ ok: true });
    }
    if (b.action === "login") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new Error("E-mail invalide.");
      await passwordLogin(
        email,
        String(b.password || ""),
        false,
      );
      return NextResponse.json({ ok: true });
    }
    if (b.action === "otp") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new Error("Adresse e-mail invalide.");
      await requestOtp(email);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "verifyRegister") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new Error("Adresse e-mail invalide.");
      await registerWithOtp(
        email,
        String(b.password || ""),
        String(b.code || ""),
      );
      return NextResponse.json({ ok: true });
    }
    const user = await identity();
    if (b.action === "track") {
      const found = (
        await db.execute({
          sql: "SELECT id,status,total,items,created FROM stocky_orders WHERE id=? AND phone=?",
          args: [String(b.id || ""), String(b.phone || "")],
        })
      ).rows[0];
      if (!found)
        throw new Error(
          "Commande introuvable. Vérifiez la référence et le téléphone.",
        );
      return NextResponse.json({ ok: true, order: found });
    }
    if (b.action === "checkout") {
      if (
        !Array.isArray(b.items) ||
        !b.items.length ||
        b.items.length > 30 ||
        !String(b.customer || "").trim() ||
        !String(b.phone || "").trim() ||
        !String(b.address || "").trim()
      )
        throw new Error("Complétez les coordonnées de livraison et le panier.");
      const tx = await db.transaction("write");
      try {
        const grouped = new Map<
          string,
          {
            id: string;
            name: string;
            quantity: number;
            price: number;
          }[]
        >();
        for (const item of b.items) {
          if (
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 100
          )
            throw new Error("Quantité invalide");
          const p = (
            await tx.execute({
              sql: "SELECT p.* FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id WHERE p.id=? AND p.status='active' AND s.status='active'",
              args: [String(item.id)],
            })
          ).rows[0];
          if (!p || Number(p.stock) < item.quantity)
            throw new Error("Un article du panier est indisponible.");
          await tx.execute({
            sql: "UPDATE stocky_products SET stock=stock-? WHERE id=?",
            args: [item.quantity, String(p.id)],
          });
          const lines = grouped.get(String(p.store_id)) || [];
          lines.push({
            id: String(p.id),
            name: String(p.name),
            quantity: item.quantity,
            price: Number(p.price),
          });
          grouped.set(String(p.store_id), lines);
        }
        const ids: string[] = [];
        const createdOrders: { id: string; store: string }[] = [];
        const configRow = (
          await tx.execute(
            "SELECT value FROM stocky_settings WHERE id='public'",
          )
        ).rows[0];
        const deliveryFee = configRow
          ? Number(JSON.parse(String(configRow.value)).deliveryFee || 0)
          : 0;
        if (Number(b.deliveryFee || 0) !== deliveryFee)
          throw new Error(
            "Le tarif de livraison a changé. Rechargez votre panier avant de confirmer.",
          );
        for (const [store, lines] of grouped) {
          const id = randomUUID();
          ids.push(id);
          createdOrders.push({ id, store });
          await tx.execute({
            sql: "INSERT INTO stocky_orders(id,store_id,customer,phone,address,items,total) VALUES(?,?,?,?,?,?,?)",
            args: [
              id,
              store,
              String(b.customer).slice(0, 100),
              String(b.phone).slice(0, 30),
              String(b.address).slice(0, 500),
              JSON.stringify(lines),
              lines.reduce(
                (sum, p) => sum + p.price * p.quantity,
                Math.round(deliveryFee * 1000),
              ),
            ],
          });
        }
        await tx.commit();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
        await Promise.all(
          createdOrders.map(async ({ id, store }) => {
            const owner = (
              await db.execute({
                sql: "SELECT u.email,s.name FROM stocky_stores s JOIN stocky_users u ON u.id=s.owner WHERE s.id=?",
                args: [store],
              })
            ).rows[0];
            if (!owner?.email) return;
            await notifyEmail({
              to: String(owner.email),
              subject: `Nouvelle commande Stocky · ${id.slice(0, 8)}`,
              heading: "Vous avez une nouvelle commande",
              body: `Une nouvelle commande attend votre confirmation dans l’espace boutique. Référence : <strong>${id.slice(0, 8)}</strong>.`,
              actionLabel: "Ouvrir mes commandes",
              actionUrl: appUrl,
            });
          }),
        );
        const adminEmail = adminNotificationEmail();
        if (adminEmail)
          await notifyEmail({
            to: adminEmail,
            subject: `Stocky · ${ids.length} nouvelle(s) commande(s)`,
            heading: "Nouvelles commandes enregistrées",
            body: `${ids.length} commande(s) viennent d’être créées sur la plateforme.`,
            actionLabel: "Ouvrir le superadmin",
            actionUrl: `${appUrl}/superadmin`,
          });
        return NextResponse.json({ ok: true, orders: ids });
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
    }
    if (b.action === "logout") {
      const token = (await cookies()).get("stocky_session")?.value;
      if (token)
        await db.execute({
          sql: "DELETE FROM stocky_sessions WHERE hash=?",
          args: [hash(token)],
        });
      (await cookies()).delete("stocky_session");
      return NextResponse.json({ ok: true });
    }
    if (!user)
      return NextResponse.json(
        { error: "Connexion requise." },
        { status: 401 },
      );
    const admin = user.role === "superadmin";
    const own = (
      await db.execute({
        sql: "SELECT * FROM stocky_stores WHERE owner=?",
        args: [String(user.id)],
      })
    ).rows[0];
    if (b.action === "request") {
      if (
        !["Upcycling", "Liquidation", "Redesign", "Support"].includes(b.type) ||
        String(b.message || "").trim().length < 10
      )
        throw new Error("Décrivez votre demande en au moins 10 caractères.");
      await db.execute({
        sql: "INSERT INTO stocky_requests(id,owner,type,message) VALUES(?,?,?,?)",
        args: [
          randomUUID(),
          String(user.id),
          b.type,
          String(b.message).slice(0, 5000),
        ],
      });
      const adminEmail = adminNotificationEmail();
      if (adminEmail)
        await notifyEmail({
          to: adminEmail,
          subject: `Nouvelle demande Stocky · ${String(b.type)}`,
          heading: "Une boutique demande votre aide",
          body: "Une nouvelle demande professionnelle est disponible dans le centre de contrôle.",
          actionLabel: "Voir les demandes",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin}/superadmin`,
        });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "requestReply") {
      if (!admin)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      if (!["new", "processing", "resolved"].includes(b.status))
        throw new Error("Statut invalide.");
      const target = (
        await db.execute({
          sql: "SELECT u.email FROM stocky_requests r JOIN stocky_users u ON u.id=r.owner WHERE r.id=?",
          args: [String(b.id)],
        })
      ).rows[0];
      await db.execute({
        sql: "UPDATE stocky_requests SET reply=?,status=? WHERE id=?",
        args: [String(b.reply || "").slice(0, 5000), b.status, String(b.id)],
      });
      if (target?.email)
        await notifyEmail({
          to: String(target.email),
          subject: "Mise à jour de votre demande Stocky",
          heading: "Votre demande a reçu une réponse",
          body: "Consultez votre espace boutique pour lire la réponse et suivre son statut.",
          actionLabel: "Ouvrir mon espace",
          actionUrl: process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin,
        });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "config") {
      if (!admin)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      if (
        !String(b.title || "").trim() ||
        !Number.isFinite(b.deliveryFee) ||
        b.deliveryFee < 0 ||
        b.deliveryFee > 100 ||
        !Number.isFinite(b.commission) ||
        b.commission < 0 ||
        b.commission > 100
      )
        throw new Error("Paramètres invalides.");
      await db.batch(
        [
          {
            sql: "INSERT OR REPLACE INTO stocky_settings(id,value) VALUES('public',?)",
            args: [
              JSON.stringify({
                title: String(b.title).slice(0, 150),
                deliveryFee: b.deliveryFee,
                commission: b.commission,
              }),
            ],
          },
          {
            sql: "INSERT INTO stocky_audit(actor,action) VALUES(?,?)",
            args: [String(user.id), "settings updated"],
          },
        ],
        "write",
      );
      return NextResponse.json({ ok: true });
    }
    if (b.action === "archive") {
      const changed = await db.execute({
        sql: "UPDATE stocky_products SET status='archived' WHERE id=? AND (?=1 OR store_id=?)",
        args: [String(b.id), admin ? 1 : 0, String(own?.id || "")],
      });
      if (!changed.rowsAffected)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "orderStatus") {
      const order = (
        await db.execute({
          sql: "SELECT * FROM stocky_orders WHERE id=?",
          args: [String(b.id)],
        })
      ).rows[0];
      if (!order || (!admin && order.store_id !== own?.id))
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      const transitions: Record<string, string[]> = {
        new: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["shipped"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: [],
      };
      if (!transitions[String(order.status)]?.includes(String(b.status)))
        throw new Error("Transition de commande invalide.");
      const tx = await db.transaction("write");
      try {
        const changed = await tx.execute({
          sql: "UPDATE stocky_orders SET status=? WHERE id=? AND status=?",
          args: [b.status, b.id, order.status],
        });
        if (!changed.rowsAffected)
          throw new Error("Commande modifiée. Rechargez la page.");
        if (b.status === "cancelled") {
          for (const item of JSON.parse(String(order.items)))
            await tx.execute({
              sql: "UPDATE stocky_products SET stock=stock+? WHERE id=?",
              args: [item.quantity, item.id],
            });
        }
        await tx.execute({
          sql: "INSERT INTO stocky_audit(actor,action,entity) VALUES(?,?,?)",
          args: [String(user.id), String(b.status), String(b.id)],
        });
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
      return NextResponse.json({ ok: true });
    }
    if (b.action === "inventory") {
      if (!Number.isInteger(b.stock) || b.stock < 0 || b.stock > 100000)
        throw new Error("Stock invalide.");
      const result = await db.execute({
        sql: "UPDATE stocky_products SET stock=? WHERE id=? AND (?=1 OR store_id=?)",
        args: [b.stock, String(b.id), admin ? 1 : 0, String(own?.id || "")],
      });
      if (!result.rowsAffected)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      return NextResponse.json({ ok: true });
    }
    if (b.action === "seedDemo") {
      if (!admin)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      await db.execute(
        "INSERT OR IGNORE INTO stocky_stores(id,owner,name,phone,status) VALUES('demo-store','demo-owner','Atelier Démo','DEMO','active')",
      );
      const samples = [
        ["Robe satin terracotta", 45000, 8, "Femme"],
        ["Veste workwear", 78000, 5, "Homme"],
        ["Sac textile upcyclé", 55000, 12, "Accessoires"],
        ["Chemise en lin", 39000, 7, "Homme"],
        ["Coussin tissé", 33000, 6, "Maison"],
        ["Manteau sable", 119000, 3, "Femme"],
      ];
      await db.batch(
        samples.map((p, i) => ({
          sql: "INSERT OR IGNORE INTO stocky_products(id,store_id,name,price,stock,category,description,image,status,demo) VALUES(?,'demo-store',?,?,?,?,?,'','active',1)",
          args: [
            "demo-" + i,
            ...p,
            "Produit de démonstration — stock textile revalorisé.",
          ],
        })),
        "write",
      );
      return NextResponse.json({ ok: true });
    }
    if (b.action === "store") {
      if (!String(b.name || "").trim() || !String(b.phone || "").trim())
        throw new Error("Nom et téléphone requis.");
      const media = (value: unknown) =>
        /^\/api\/media\?id=[a-f0-9-]{36}$/.test(String(value || ""))
          ? String(value)
          : "";
      await db.execute({
        sql: "INSERT INTO stocky_stores(id,owner,name,phone,description,logo,cover,address,governorate,whatsapp) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,phone=excluded.phone,description=excluded.description,logo=CASE WHEN excluded.logo='' THEN logo ELSE excluded.logo END,cover=CASE WHEN excluded.cover='' THEN cover ELSE excluded.cover END,address=excluded.address,governorate=excluded.governorate,whatsapp=excluded.whatsapp",
        args: [
          randomUUID(),
          String(user.id),
          String(b.name).slice(0, 100),
          String(b.phone).slice(0, 30),
          String(b.description || "").slice(0, 2000),
          media(b.logo),
          media(b.cover),
          String(b.address || "").slice(0, 500),
          String(b.governorate || "").slice(0, 80),
          String(b.whatsapp || "").slice(0, 30),
        ],
      });
      if (!own) {
        const adminEmail = adminNotificationEmail();
        if (adminEmail)
          await notifyEmail({
            to: adminEmail,
            subject: "Nouvelle boutique à valider sur Stocky",
            heading: "Une nouvelle boutique vient d’être créée",
            body: "Vérifiez son identité, sa couverture et ses informations avant de la publier.",
            actionLabel: "Modérer la boutique",
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin}/superadmin`,
          });
      }
    } else if (b.action === "product") {
      if (!own) throw new Error("Créez votre boutique avant de publier.");
      if (
        !b.name ||
        !Number.isFinite(b.price) ||
        b.price <= 0 ||
        !Number.isInteger(b.stock) ||
        b.stock < 0
      )
        throw new Error("Vérifiez le nom, le prix et le stock.");
      await db.execute({
        sql: "INSERT INTO stocky_products(id,store_id,name,price,stock,category,description,image) VALUES(?,?,?,?,?,?,?,?)",
        args: [
          randomUUID(),
          String(own.id),
          String(b.name).slice(0, 150),
          Math.round(b.price * 1000),
          b.stock,
          String(b.category || "Mode"),
          String(b.description || "").slice(0, 5000),
          /^\/api\/media\?id=[a-f0-9-]{36}$/.test(String(b.image))
            ? String(b.image)
            : "",
        ],
      });
      const adminEmail = adminNotificationEmail();
      if (adminEmail)
        await notifyEmail({
          to: adminEmail,
          subject: "Nouveau produit à modérer sur Stocky",
          heading: "Un produit attend votre validation",
          body: "Une boutique a ajouté un produit. Contrôlez sa photo, son prix et sa description avant publication.",
          actionLabel: "Ouvrir la modération",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin}/superadmin`,
        });
    } else if (b.action === "moderate") {
      if (!admin)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      const table = b.entity === "store" ? "stocky_stores" : "stocky_products";
      if (!["active", "pending", "suspended"].includes(b.status))
        throw new Error("Statut invalide");
      const target = (
        await db.execute({
          sql:
            b.entity === "store"
              ? "SELECT u.email FROM stocky_stores s JOIN stocky_users u ON u.id=s.owner WHERE s.id=?"
              : "SELECT u.email FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id JOIN stocky_users u ON u.id=s.owner WHERE p.id=?",
          args: [String(b.id)],
        })
      ).rows[0];
      await db.batch(
        [
          {
            sql: `UPDATE ${table} SET status=? WHERE id=?`,
            args: [b.status, b.id],
          },
          {
            sql: "INSERT INTO stocky_audit(actor,action,entity) VALUES(?,?,?)",
            args: [String(user.id), b.status, b.id],
          },
        ],
        "write",
      );
      if (target?.email)
        await notifyEmail({
          to: String(target.email),
          subject: "Mise à jour de publication Stocky",
          heading: b.status === "active" ? "Votre contenu est publié" : "Statut de publication mis à jour",
          body: `Le statut de votre ${b.entity === "store" ? "boutique" : "produit"} est maintenant : <strong>${String(b.status)}</strong>.`,
          actionLabel: "Ouvrir mon espace",
          actionUrl: process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin,
        });
    } else if (b.action === "deleteDemo") {
      if (!admin)
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      await db.batch(
        [
          "DELETE FROM stocky_products WHERE demo=1",
          {
            sql: "INSERT INTO stocky_audit(actor,action) VALUES(?,?)",
            args: [String(user.id), "delete demo products"],
          },
        ],
        "write",
      );
    } else throw new Error("Action non reconnue.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur inattendue" },
      { status: 400 },
    );
  }
}
