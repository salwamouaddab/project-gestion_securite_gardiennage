// ============================================================
//  dashboard.js — Tableau de bord
//  Concepts utilisés : fetch, Promise.all, .filter, .reduce
// ============================================================
const API_URL = "http://localhost:3000";

const NB_RONDES_ATTENDUES = 8; // nombre de rondes attendues par nuit

// ============================================================
//  POINT D'ENTRÉE
// ============================================================
$(document).ready(function () {
    // On affiche le nom de l'utilisateur connecté (stocké au login)
    let nomConnecte = localStorage.getItem("username");
    $("#nomUtilisateur").text(nomConnecte);

    // On charge les données du tableau de bord
    chargerDashboard();
});

// ============================================================
//  CHARGER TOUTES LES DONNÉES DU DASHBOARD
//  On utilise Promise.all() pour envoyer les 2 requêtes EN MÊME TEMPS
//  et attendre que les deux soient terminées avant de continuer
// ============================================================
function chargerDashboard() {
    Promise.all([
        fetch(API_URL + "/rondes").then(r => r.json()),
        fetch(API_URL + "/users").then(r => r.json())
    ])
        .then(function (resultats) {
            let rondes = resultats[0];
            let agents = resultats[1];
            afficherStatistiques(rondes);
            afficherDernieresRondes(rondes, agents);
            afficherClassementAgents(rondes, agents);
        })
        .catch(function (erreur) {
            console.error("Erreur chargement dashboard :", erreur);
        });
}

// ============================================================
//  AFFICHER LES STATISTIQUES (les 4 cartes en haut)
// ============================================================
function afficherStatistiques(rondes) {
    // Nombre total de rondes pointées (somme des nbEffectue)
    let total = rondes.reduce(function (acc, r) { return acc + r.nbEffectue; }, 0);
    // Nombre de rondes manquées par rapport au quota de 8/nuit
    let manquees = rondes.reduce(function (acc, r) {
        let manque = NB_RONDES_ATTENDUES - r.nbEffectue;
        return acc + (manque > 0 ? manque : 0);
    }, 0);
    // Nombre total d'incidents signalés
    let incidents = rondes.reduce(function (acc, r) { return acc + r.nbIncidents; }, 0);
    // Nombre de pointages avec un incident validé par l'admin
    let valides = rondes.filter(function (r) { return r.incidentValide === true; }).length;

    $("#stat-total").text(total);
    $("#stat-manquees").text(manquees);
    $("#stat-incidents").text(incidents);
    $("#stat-valides").text(valides);
}

// ============================================================
//  AFFICHER LES 5 DERNIÈRES RONDES POINTÉES
// ============================================================
function afficherDernieresRondes(rondes, agents) {
    let tbody = $("#tableDernieresRondes");
    tbody.empty();

    // On prend les 5 derniers éléments du tableau avec .slice()
    let dernieres = rondes.slice(-5).reverse(); // reverse() pour avoir le plus récent en premier

    dernieres.forEach(function (ronde) {
        // On cherche l'agent correspondant
        let agent = agents.find(function (a) { return a.id === ronde.agentId; });
        let nomAgent = agent ? agent.name : "Inconnu";
        // Badge incident
        let badgeIncident = creerBadgeIncident(ronde);
        tbody.append(`
      <tr>
        <td>${ronde.date}</td>
        <td>${nomAgent}</td>
        <td>${ronde.nbEffectue} / ${NB_RONDES_ATTENDUES}</td>
        <td>${badgeIncident}</td>
      </tr>
    `);
    });
}

// ============================================================
//  AFFICHER LE CLASSEMENT DES AGENTS
//  On calcule le taux de fiabilité (rondes effectuées / attendues)
// ============================================================
function afficherClassementAgents(rondes, agents) {
    let conteneur = $("#listeAgents");
    conteneur.empty();

    agents.forEach(function (agent) {
        // .filter() pour ne garder que les rondes de cet agent
        let rondesAgent = rondes.filter(function (r) {
            return r.agentId === agent.id;
        });
        let nbPointages = rondesAgent.length;
        // Total des rondes effectuées et attendues sur la période
        let totalEffectue = rondesAgent.reduce(function (acc, r) { return acc + r.nbEffectue; }, 0);
        let totalAttendu = nbPointages * NB_RONDES_ATTENDUES;
        // Taux de fiabilité en pourcentage
        let tauxFiabilite = totalAttendu > 0
            ? Math.round((totalEffectue / totalAttendu) * 100)
            : 0;

        conteneur.append(`
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <p class="mb-0" style="font-size:.9rem;font-weight:500;">${agent.name}</p>
          <small class="text-muted">${nbPointages} pointage(s)</small>
        </div>
        <span class="badge bg-${tauxFiabilite >= 90 ? 'success' : (tauxFiabilite >= 70 ? 'warning' : 'danger')}">
          ${tauxFiabilite}% fiabilité
        </span>
      </div>
    `);
    });
}

// ============================================================
//  CRÉER UN BADGE pour l'incident (même logique que rondes.js)
// ============================================================
function creerBadgeIncident(ronde) {
    if (ronde.nbIncidents === 0) {
        return `<span class="text-muted">—</span>`;
    }
    if (ronde.incidentValide) {
        return `<span class="badge bg-success">Validé</span>`;
    }
    return `<span class="badge bg-warning text-dark">En attente</span>`;
}
