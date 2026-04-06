# Guide de démarrage rapide - Frontend

## Installation et démarrage

1. **Installer les dépendances** :
```bash
cd "C:\projet Livraison\livraison-frontend"
npm install
```

2. **Démarrer le serveur de développement** :
```bash
npm start
```

L'application s'ouvrira automatiquement sur `http://localhost:3000`

## Prérequis

- Le backend doit être démarré sur `http://localhost:5000`
- Node.js et npm installés
- MongoDB en cours d'exécution

## Test avec le numéro +22796648383

1. Sur la page de connexion, le numéro `+22796648383` est pré-rempli
2. Cliquer sur "Envoyer le code OTP"
3. Entrer le code reçu par SMS (ou vérifier la console du backend en mode dev)
4. Accéder au dashboard après vérification

## Structure des pages

- `/login` - Page de connexion (numéro de téléphone)
- `/verify-otp` - Page de vérification OTP
- `/dashboard` - Tableau de bord utilisateur (protégé)

## Configuration

Si le backend est sur un autre port, créer un fichier `.env` :
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Scripts disponibles

- `npm start` - Démarrer en mode développement
- `npm build` - Créer une version de production
- `npm test` - Lancer les tests

