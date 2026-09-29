"use client";
import { useState } from "react";
import { Button } from "./ui/button";
export type ServiceRequest = {
  id: string;
  type: string;
  message: string;
  reply: string;
  status: string;
  created: string;
};
export type Configuration = {
  title: string;
  deliveryFee: number;
  commission: number;
};
export type OperationsData = {
  requests: ServiceRequest[];
  users: { id: string; email: string; role: string; created: string }[];
  audit: {
    id: number;
    email: string;
    action: string;
    entity: string;
    created: string;
  }[];
  config: Configuration;
};
export function Operations({
  data,
  act,
  initialTab = "Demandes",
}: {
  data: OperationsData;
  act: (b: Record<string, unknown>) => Promise<unknown>;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <section className="mt-10">
      <h2 className="mb-5 text-2xl font-semibold">Opérations</h2>
      <nav className="flex flex-wrap gap-2 mb-5">
        {["Demandes", "Utilisateurs", "Journal", "Paramètres"].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "outline"}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </nav>
      {tab === "Demandes" && (
        <div className="space-y-4">
          {data.requests.map((r) => (
            <form
              className="p-card p-card-body"
              key={r.id}
              onSubmit={(e) => {
                e.preventDefault();
                act({
                  action: "requestReply",
                  id: r.id,
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              <strong>
                {r.type} · {r.created}
              </strong>
              <p>{r.message}</p>
              <label>
                Réponse
                <textarea
                  name="reply"
                  defaultValue={r.reply}
                  className="w-full border border-input rounded-md p-3"
                />
              </label>
              <select
                name="status"
                defaultValue={r.status}
                className="border border-input rounded-md p-3"
              >
                <option value="new">Nouvelle</option>
                <option value="processing">En cours</option>
                <option value="resolved">Résolue</option>
              </select>
              <Button>Enregistrer la réponse</Button>
            </form>
          ))}
          {!data.requests.length && <p>Aucune demande en attente.</p>}
        </div>
      )}
      {tab === "Utilisateurs" && (
        <div className="p-table">
          <table>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>Inscription</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "Journal" && (
        <div className="p-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Administrateur</th>
                <th>Action</th>
                <th>Entité</th>
              </tr>
            </thead>
            <tbody>
              {data.audit.map((a) => (
                <tr key={a.id}>
                  <td>{a.created}</td>
                  <td>{a.email}</td>
                  <td>{a.action}</td>
                  <td>{a.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "Paramètres" && (
        <form
          className="p-card p-card-body max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Object.fromEntries(new FormData(e.currentTarget));
            act({
              action: "config",
              ...v,
              deliveryFee: Number(v.deliveryFee),
              commission: Number(v.commission),
            });
          }}
        >
          <label>
            Titre de la page d’accueil
            <input
              name="title"
              defaultValue={data.config.title}
              required
              className="w-full border border-input rounded-md p-3 mt-2"
            />
          </label>
          <label>
            Livraison par boutique (DT)
            <input
              name="deliveryFee"
              type="number"
              step="0.001"
              min="0"
              max="100"
              defaultValue={data.config.deliveryFee}
              required
              className="w-full border border-input rounded-md p-3 mt-2"
            />
          </label>
          <label>
            Commission indicative (%)
            <input
              name="commission"
              type="number"
              min="0"
              max="100"
              defaultValue={data.config.commission}
              required
              className="w-full border border-input rounded-md p-3 mt-2"
            />
          </label>
          <Button>Enregistrer les paramètres</Button>
        </form>
      )}
    </section>
  );
}
export function Services({
  requests,
  act,
  authenticated,
  onLogin,
}: {
  requests: ServiceRequest[];
  act: (b: Record<string, unknown>) => Promise<unknown>;
  authenticated: boolean;
  onLogin: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <section>
      <p className="eyebrow">VALORISER VOTRE STOCK</p>
      <h1 className="text-4xl font-semibold mb-5">Services & accompagnement</h1>
      <div className="p-grid mb-8">
        {["Upcycling", "Liquidation", "Redesign"].map((t) => (
          <article className="p-card p-card-body" key={t}>
            <h2 className="text-xl font-semibold">{t}</h2>
            <p>
              Confiez votre projet à notre équipe et suivez les échanges dans
              votre espace.
            </p>
          </article>
        ))}
      </div>
      {authenticated ? (
        <form
          className="p-card p-card-body max-w-2xl"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const result = await act({
              action: "request",
              ...Object.fromEntries(new FormData(f)),
            });
            if (result) {
              setDone(true);
              f.reset();
            }
          }}
        >
          <label>
            Type
            <select
              name="type"
              className="w-full border border-input rounded-md p-3 mt-2"
            >
              {["Upcycling", "Liquidation", "Redesign", "Support"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Votre demande
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={5000}
              className="w-full border border-input rounded-md p-3 mt-2"
            />
          </label>
          <Button>Envoyer la demande</Button>
          {done && <p role="status">Votre demande est enregistrée.</p>}
        </form>
      ) : (
        <Button onClick={onLogin}>
          Connectez votre boutique pour déposer une demande
        </Button>
      )}
      {authenticated && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Mes demandes</h2>
          {requests.map((r) => (
            <article className="p-card p-card-body" key={r.id}>
              <strong>
                {r.type} · {r.status}
              </strong>
              <p>{r.message}</p>
              {r.reply && (
                <blockquote className="border-l-2 border-primary pl-4">
                  {r.reply}
                </blockquote>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export function Tracking({
  act,
}: {
  act: (
    b: Record<string, unknown>,
  ) => Promise<{
    order?: { id: string; status: string; total: number; created: string };
  } | null>;
}) {
  const [result, setResult] = useState<{
    id: string;
    status: string;
    total: number;
    created: string;
  }>();
  return (
    <section>
      <h1 className="text-3xl font-semibold mb-6">Suivre ma commande</h1>
      <form
        className="p-card p-card-body max-w-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await act({
            action: "track",
            ...Object.fromEntries(new FormData(e.currentTarget)),
          });
          if (r?.order) setResult(r.order);
        }}
      >
        <label>
          Référence de commande
          <input
            name="id"
            required
            className="w-full border border-input rounded-md p-3 mt-2"
          />
        </label>
        <label>
          Téléphone utilisé lors de la commande
          <input
            name="phone"
            type="tel"
            required
            className="w-full border border-input rounded-md p-3 mt-2"
          />
        </label>
        <Button>Afficher le suivi</Button>
      </form>
      {result && (
        <article className="p-card p-card-body mt-6">
          <h2>{result.id}</h2>
          <p>Statut : {result.status}</p>
          <p>Total : {(result.total / 1000).toFixed(2)} DT</p>
          <p>Créée le {result.created}</p>
        </article>
      )}
    </section>
  );
}
