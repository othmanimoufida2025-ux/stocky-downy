# Backend Stocky Downy

Le backend Next.js utilise Turso/libSQL. Les tables `stocky_*` sont créées et migrées automatiquement, sans modifier les autres tables de la base.

## Variables d'environnement

Copier les noms présents dans `.env.example` vers `.env.local` en local et vers les variables du projet Vercel en production :

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SUPERADMIN_EMAILS`
- `SUPERADMIN_PIN_HASH`
- `OTP_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_APP_URL`

`RESEND_API_KEY` est requis pour vérifier l'adresse e-mail lors de l'inscription d'une boutique. `RESEND_FROM` est obligatoire et doit appartenir à un domaine vérifié chez Resend en production. `NOTIFICATION_EMAIL` reçoit les alertes superadmin et `NEXT_PUBLIC_APP_URL` construit les liens présents dans les e-mails. `OTP_SECRET` signe les codes de vérification et doit être une valeur aléatoire longue. `CRON_SECRET` protège la maintenance planifiée Vercel. Après vérification OTP, les connexions suivantes utilisent l'e-mail et le mot de passe.

## Fonctionnalités connectées

- sessions sécurisées par cookie HttpOnly ;
- inscription des propriétaires avec OTP Resend obligatoire, puis connexion sécurisée par mot de passe ;
- e-mails transactionnels pour la création de compte, les commandes, les nouvelles boutiques, les produits à modérer, les demandes et les décisions de modération ;
- file d'envoi e-mail persistante avec reprises automatiques et idempotence ;
- création et modification d'une boutique ;
- upload du logo, de la couverture et des photos produit dans Turso ;
- création, stock et modération des produits ;
- panier et commande avec recalcul serveur du prix et du stock ;
- lignes de commande immuables, comptabilité de commission et décrément de stock atomique ;
- suivi des commandes et demandes de service ;
- contrôle superadmin protégé par PIN, rôles et journal d'audit ;
- données de démonstration supprimables depuis le superadmin.
- catalogue public paginé et mis en cache, données privées sans cache et maintenance quotidienne des sessions/OTP expirés.

## Domaine Resend

Pour envoyer les OTP et notifications à n'importe quel propriétaire de boutique, ajoutez puis vérifiez un domaine dans Resend et configurez `RESEND_FROM`, par exemple `Stocky <connexion@votre-domaine.tn>`. Le domaine de test Resend ne peut envoyer qu'à l'adresse propriétaire du compte.

Les paiements en ligne et les transporteurs externes nécessitent les identifiants de leurs fournisseurs. Le paiement à la livraison fonctionne sans fournisseur externe.

## Commandes

```bash
npm run dev
npm run build
npm start
```
