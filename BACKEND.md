# Backend Stocky Downy

Le backend Next.js utilise Turso/libSQL. Les tables `stocky_*` sont créées et migrées automatiquement, sans modifier les autres tables de la base.

## Variables d'environnement

Copier les noms présents dans `.env.example` vers `.env.local` en local et vers les variables du projet Vercel en production :

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SUPERADMIN_EMAILS`
- `SUPERADMIN_PIN_HASH`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_APP_URL`

`RESEND_API_KEY` est requis pour vérifier l'adresse e-mail lors de l'inscription d'une boutique. `RESEND_FROM` doit appartenir à un domaine vérifié chez Resend en production. `NOTIFICATION_EMAIL` reçoit les alertes superadmin et `NEXT_PUBLIC_APP_URL` construit les liens présents dans les e-mails. Sans `RESEND_FROM`, le mode de test Resend `onboarding@resend.dev` est utilisé et ne peut envoyer qu'à l'adresse du propriétaire du compte Resend. Après vérification OTP, les connexions suivantes utilisent l'e-mail et le mot de passe.

## Fonctionnalités connectées

- sessions sécurisées par cookie HttpOnly ;
- inscription des propriétaires avec OTP Resend obligatoire, puis connexion sécurisée par mot de passe ;
- e-mails transactionnels pour la création de compte, les commandes, les nouvelles boutiques, les produits à modérer, les demandes et les décisions de modération ;
- création et modification d'une boutique ;
- upload du logo, de la couverture et des photos produit dans Turso ;
- création, stock et modération des produits ;
- panier et commande avec recalcul serveur du prix et du stock ;
- suivi des commandes et demandes de service ;
- contrôle superadmin protégé par PIN, rôles et journal d'audit ;
- données de démonstration supprimables depuis le superadmin.

Les paiements en ligne et les transporteurs externes nécessitent les identifiants de leurs fournisseurs. Le paiement à la livraison fonctionne sans fournisseur externe.

## Commandes

```bash
npm run dev
npm run build
npm start
```
