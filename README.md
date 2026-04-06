# Livraison Frontend - Service de coursier urbain

Application React pour le service de coursier urbain avec authentification par OTP.

## Fonctionnalités

- ✅ Authentification par numéro de téléphone
- ✅ Vérification OTP avec interface intuitive
- ✅ Dashboard utilisateur
- ✅ Design moderne et responsive
- ✅ Gestion d'état avec Context API
- ✅ Protection des routes privées

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer l'URL de l'API (optionnel) :
Créer un fichier `.env` à la racine :
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. Démarrer l'application :
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## Structure du projet

```
livraison-frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Login.js              # Page de connexion
│   │   ├── Login.css
│   │   ├── OTPVerification.js    # Page de vérification OTP
│   │   ├── OTPVerification.css
│   │   ├── Dashboard.js          # Tableau de bord
│   │   ├── Dashboard.css
│   │   └── PrivateRoute.js       # Route protégée
│   ├── context/
│   │   └── AuthContext.js        # Contexte d'authentification
│   ├── services/
│   │   └── api.js                # Service API
│   ├── App.js                    # Composant principal
│   ├── App.css
│   ├── index.js                  # Point d'entrée
│   └── index.css
└── package.json
```

## Utilisation

### Connexion
1. Entrer le numéro de téléphone (format: +22796648383)
2. Cliquer sur "Envoyer le code OTP"
3. Entrer le code reçu par SMS
4. Accéder au dashboard

### Numéro de test
Le numéro +22796648383 est pré-rempli par défaut pour faciliter les tests.

## Technologies utilisées

- React 18
- React Router DOM
- Axios
- Context API
- CSS3 (animations et gradients)

## Notes

- L'application utilise un proxy vers `http://localhost:5000` pour les requêtes API
- Le token JWT est stocké dans le localStorage
- Les routes sont protégées et redirigent vers `/login` si non authentifié

