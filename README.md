# Stocky Downy

Marketplace e-commerce Next.js 15 pour les boutiques tunisiennes, avec interface publique, espace boutique et administration privée.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`. L'administration privée se trouve sur `http://localhost:3000/superadmin` et n'est pas liée depuis l'interface publique.

## Déploiement Vercel

1. Importer ce dossier dans un projet Vercel.
2. Conserver le preset **Next.js**.
3. Ajouter les variables décrites dans `.env.example` et `BACKEND.md`.
4. Déployer.

Le projet inclut `vercel.json`, les en-têtes de sécurité, les routes serveur, la persistance Turso et un build de production validé.

## Interface

- thème clair pastel basé sur les composants shadcn ;
- police Vazirmatn ;
- français par défaut et anglais selon la langue du navigateur ;
- logo Stocky Downy et mise en page responsive ;
- inscription boutique guidée : compte, boutique, identité visuelle et premier produit.

Voir [BACKEND.md](./BACKEND.md) pour le détail des fonctions serveur et des variables nécessaires.
