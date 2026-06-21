# 🛡️ Projet de synthèse : Gestion Sécurité / Gardiennage

**Gestion Sécurité / Gardiennage** est un projet de synthèse conçu pour les **stagiaires de première année en développement web (JavaScript) à l'OFPPT**. Il permet de mettre en pratique les concepts fondamentaux du développement Front-end moderne et de l'interaction avec une API simulée.

L'objectif est de gérer le pointage des rondes de nuit d'une société de gardiennage et de calculer automatiquement le salaire journalier de chaque agent selon les rondes effectuées et les incidents validés. Tout le code est volontairement **simple, commenté et accessible aux débutants**.

---

## 🚀 Objectifs Pédagogiques

Ce projet met en pratique les compétences suivantes :

* **Manipulation du DOM :** Création dynamique d'interfaces pour l'affichage des rondes et des statistiques.
* **Objets JavaScript :** Modélisation des données (Agents, Rondes) et gestion de la logique métier.
* **Appels Asynchrones (Fetch / Promise) :** Communication avec une API REST simulée pour lire et persister les données.
* **Gestion des Événements :** Interactivité utilisateur (formulaires, filtres, validation).
* **Logique Algorithmique :** Calcul des pénalités sur rondes manquées et de la prime de risque.
* **Gestion des droits :** Différenciation Admin / Agent pour l'accès aux fonctionnalités.

---

## 🛠️ Règles Métier (Logique de Calcul du Salaire)

L'application intègre un moteur de calcul basé sur le pointage de chaque nuit :

| Élément | Règle |
| --- | --- |
| **Rondes attendues** | 8 rondes par nuit |
| **Ronde oubliée** | Chaque ronde manquante retire **5%** du salaire journalier |
| **Incident réel validé** | Si l'agent signale un incident et que l'**admin le valide**, il reçoit une prime égale à **1/4 (25%)** de sa journée |

> **Salaire final :** Salaire journalier de base − pénalités (rondes oubliées) + prime de risque (si incident validé par l'admin).

---

## 📂 Structure des Données

Le projet utilise un fichier `db.json` à la racine faisant office de base de données :

* **`users`** : `id`, `name`, `email`, `password` (hashé SHA-256), `salaireJour`, `is_admin`.
* **`rondes`** : `id`, `agentId`, `nbEffectue`, `nbIncidents`, `incidentValide`, `date`.

---

## 🗂️ Structure du Projet

```
gestion_securite_gardiennage/
├── assets/
│   └── css/
│       └── styles.css
├── pages/
│   ├── dashboard.html      → Tableau de bord (statistiques)
│   ├── rondes.html         → Pointage des rondes (CRUD)
│   ├── rapports.html       → Calcul du salaire journalier
│   └── agents.html         → Gestion des agents (admin only)
├── scripts/
│   ├── index.js            → Connexion / Inscription
│   ├── conntectedUser.js   → Gestion de session
│   ├── dashboard.js        → Logique tableau de bord
│   ├── rondes.js           → Logique gestion des rondes
│   ├── rapports.js         → Logique calcul du salaire
│   └── agents.js           → Logique gestion des agents
├── db.json                 → Base de données simulée
├── index.html              → Page d'accueil / Authentification
└── readme.md
```

> 📌 **Note :** Bootstrap, Bootstrap Icons et jQuery sont chargés via CDN (voir les balises `<link>` et `<script>` dans chaque page HTML) plutôt que stockés en local dans `assets/`, pour simplifier l'installation.

---

## 💻 Installation et Lancement

### 1. Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :

- [Node.js](https://nodejs.org/) (version 16 ou supérieure)
- [VS Code](https://code.visualstudio.com/)
- L'extension **Live Server** sur VS Code (voir étape 4)

Pour vérifier que Node.js est bien installé, ouvrez un terminal et tapez :

```bash
node -v
```

Vous devez voir un numéro de version s'afficher (ex: `v20.0.0`).

---

### 2. Cloner ou télécharger le projet

Si vous avez Git installé :

```bash
git clone https://github.com/votre-compte/gestion_securite_gardiennage.git
cd gestion_securite_gardiennage
```

Sinon, téléchargez le projet en ZIP et extrayez-le dans un dossier de votre choix.

---

### 3. Installer json-server

`json-server` est l'outil qui simule une vraie API à partir du fichier `db.json`.

Ouvrez un terminal **à la racine du projet** et tapez :

```bash
npm install -g json-server
```

Pour vérifier que l'installation a réussi :

```bash
json-server --version
```

---

### 4. Lancer le serveur API (json-server)

Dans le terminal, **à la racine du projet**, lancez :

```bash
json-server --watch db.json --port 3000
```

Si tout fonctionne, vous verrez :

```
Resources
  http://localhost:3000/users
  http://localhost:3000/rondes
```

> ⚠️ **Important :** Laissez ce terminal ouvert pendant toute la durée de votre travail. Si vous le fermez, l'API s'arrête.

---

### 5. Installer l'extension Live Server sur VS Code

1. Ouvrez VS Code
2. Allez dans l'onglet **Extensions** (`Ctrl+Shift+X`)
3. Recherchez **Live Server** (par *Ritwick Dey*)
4. Cliquez sur **Install**

---

### 6. Lancer l'application

1. Ouvrez le dossier du projet dans VS Code (`Fichier > Ouvrir le dossier`)
2. Dans l'explorateur de fichiers VS Code, faites un **clic droit** sur `index.html`
3. Cliquez sur **"Open with Live Server"**
4. Le navigateur s'ouvre automatiquement sur `http://127.0.0.1:5500/index.html`

> ✅ L'application est prête. Vous pouvez vous connecter avec les identifiants ci-dessous.

---

## 🔐 Comptes de test

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| **Administrateur** | kelfassi@gmail.com | 100900 |

---

## ✅ Fonctionnalités réalisées

* [x] Authentification (connexion / inscription) avec hash SHA-256
* [x] Gestion de session (localStorage) et redirection automatique
* [x] Tableau de bord avec statistiques et classement des agents
* [x] Pointage des rondes — affichage, ajout, modification, suppression
* [x] Filtres sur les rondes (agent, incident, date)
* [x] Calcul automatique du salaire selon les rondes effectuées
* [x] Pénalité automatique de -5% par ronde oubliée
* [x] Prime de risque automatique (+25% si incident validé par l'admin)
* [x] Gestion des agents — modification du salaire journalier (admin uniquement)
* [x] Contrôle des droits Admin / Agent sur toutes les pages

---

**Développé dans le cadre du module JavaScript — Formation Développement Web · OFPPT**
