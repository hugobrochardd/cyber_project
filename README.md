# Projet de sensibilisation cybersécurité - Netlify + Neon

## 🎯 Objectif
Simuler une attaque par phishing via QR code pour sensibiliser les étudiants aux risques de cybersécurité, tout en collectant des KPI pour mesurer l'efficacité de la campagne.

## 📊 Architecture

### Frontend
- **landing.html** : Page d'information sur la "Semaine anti-gaspillage"
- **index.html** : Faux ENT (formulaire de connexion)
- **admin.html** : Tableau de bord des statistiques KPI

### Backend (Netlify Functions)
- **kpi.mjs** : Enregistrement des événements dans Neon (Postgres)
- **kpi_stats.mjs** : Récupération des statistiques agrégées

### Base de données (Neon)
Tables :
- `kpi_sessions` : Sessions anonymes par utilisateur
- `kpi_events` : Événements trackés

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer en local avec Netlify Dev
npm run dev
```

## 📈 KPIs trackés

1. **qr_scan** : Arrivée sur landing.html
2. **ent_button_click** : Clic sur "Se connecter avec l'ENT"
3. **start_typing** : Début de saisie (≥3 caractères)
4. **modal_shown** : Affichage de la modale de sensibilisation
5. **modal_closed** : Fermeture de la modale
6. **cyber_training_click** : Clic sur un lien de formation

## 🔧 Configuration Netlify

Les variables d'environnement suivantes sont automatiquement configurées par Netlify :
- `NETLIFY_DATABASE_URL` : URL de connexion à Neon

## 📱 Utilisation

1. Scanner le QR code → landing.html
2. Cliquer sur "Se connecter avec l'ENT" → loading.html → index.html
3. Commencer à taper un identifiant → Modale de sensibilisation
4. Consulter les stats sur admin.html

## ⚠️ Note importante

Aucune donnée personnelle n'est collectée. Seuls des identifiants de session anonymes (UUID) sont utilisés pour suivre le parcours utilisateur.

## 🎓 Projet universitaire

Université de Corse - Master Cybersécurité
Partenaires : Crous de Corse, Too Good To Go
