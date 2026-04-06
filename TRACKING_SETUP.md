# Configuration du suivi en temps réel

## Installation de Leaflet (optionnel)

Le système de suivi utilise Leaflet pour afficher les cartes. Leaflet est chargé dynamiquement via CDN, donc aucune installation n'est requise.

Si vous préférez installer Leaflet localement :

```bash
npm install leaflet react-leaflet
```

Puis modifier `TrackingMap.js` pour utiliser `react-leaflet` au lieu du chargement CDN.

## Fonctionnalités

### Pour le coursier :
1. **Dashboard coursier** (`/dashboard` pour coursier)
   - Voir les statistiques
   - Accéder aux commandes

2. **Page des commandes** (`/coursier/commandes`)
   - Voir les commandes assignées
   - Voir les commandes disponibles
   - Accepter des commandes
   - Démarrer une livraison
   - Marquer comme livrée
   - Accéder au suivi en temps réel

3. **Suivi en temps réel** (`/coursier/tracking/:id`)
   - Carte interactive avec position du coursier
   - Historique du trajet
   - Mise à jour automatique de la localisation

### Pour les clients (particuliers/entreprises) :
- **Suivi de commande** (`/tracking/:id`)
  - Voir la position du coursier en temps réel
  - Suivre le trajet sur la carte

### Pour l'admin :
- Accès au suivi de toutes les commandes via l'interface admin

## Permissions de géolocalisation

Le système demande automatiquement la permission de géolocalisation au coursier pour :
- Mettre à jour sa position en temps réel
- Enregistrer l'historique du trajet

## Notes techniques

- La localisation est mise à jour toutes les 5 secondes
- L'historique conserve les 100 dernières positions
- Les coordonnées GPS sont stockées dans la base de données
- La carte utilise OpenStreetMap (gratuit, pas besoin de clé API)

