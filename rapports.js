// ============================================================
//  rapports.js — Calcul du salaire journalier
//
//  Règles métier :
//  - 8 rondes attendues par nuit
//  - Chaque ronde oubliée retire 5% du salaire journalier
//  - Incident réel validé par l'admin : prime de 1/4 (25%) de la journée
// ============================================================
const API_URL = "http://localhost:3000";

const estAdmin = localStorage.getItem("is_admin") === "true";
const userId = localStorage.getItem("userId");

// ============================================================
//  CONSTANTES DES RÈGLES MÉTIER
//  On les regroupe ici pour ne pas éparpiller les chiffres
//  dans le code — bonne pratique !
// ============================================================
const REGLES = {
    nbRondesAttendues: 8,       // rondes attendues par nuit
    penaliteParRondeOubliee: 0.05, // 5% du salaire/jour par ronde oubliée
    tauxPrimeRisque: 0.25       // 25% (1/4) du salaire/jour si incident validé
};

// ============================================================
//  POINT D'ENTRÉE
// ============================================================
$(document).ready(function () {
    // On charge agents + rondes en même temps
    Promise.all([
        fetch(API_URL + "/users").then(r => r.json()),
        fetch(API_URL + "/rondes").then(r => r.json())
    ])
        .then(function (resultats) {
            let agents = resultats[0];
            let rondes = resultats[1];
            remplirFiltreAgents(agents);
            afficherRapport(rondes, agents);
        })
        .catch(function (erreur) {
            console.error("Erreur chargement rapports :", erreur);
        });

    // Écouteurs sur les filtres
    $("#filtreAgent").on("change", filtrer);
    $("#filtreIncident").on("change", filtrer);
});

// ============================================================
//  REMPLIR LE FILTRE DES AGENTS
//  Si l'utilisateur n'est pas admin, il ne voit que lui-même
// ============================================================
function remplirFiltreAgents(agents) {
    let select = $("#filtreAgent");
    if (estAdmin) {
        // L'admin voit tous les agents
        agents.forEach(function (agent) {
            select.append(`<option value="${agent.id}">${agent.name}</option>`);
        });
    } else {
        // Un agent ne voit que ses propres pointages : on pré-sélectionne et on désactive
        let moi = agents.find(function (a) { return a.id === userId; });
        if (moi) {
            select.append(`<option value="${moi.id}" selected>${moi.name}</option>`);
            select.prop("disabled", true); // on ne peut pas changer le filtre
        }
    }
}

// ============================================================
//  CALCULER LE SALAIRE D'UN POINTAGE
//
//  Paramètres :
//    - salaireJour    : salaire journalier de base de l'agent
//    - nbEffectue     : nombre de rondes effectuées cette nuit-là
//    - incidentValide : true si un incident réel a été validé par l'admin
//
//  Retourne un objet avec le détail du calcul
// ============================================================
function calculerSalaire(salaireJour, nbEffectue, incidentValide) {
    // Nombre de rondes oubliées (jamais négatif)
    let rondesOubliees = REGLES.nbRondesAttendues - nbEffectue;
    if (rondesOubliees < 0) rondesOubliees = 0;

    // Pénalité : 5% du salaire par ronde oubliée
    let penalite = salaireJour * REGLES.penaliteParRondeOubliee * rondesOubliees;

    // Prime de risque : 25% du salaire si incident réel validé par l'admin
    let prime = 0;
    if (incidentValide) {
        prime = salaireJour * REGLES.tauxPrimeRisque;
    }

    // Total = salaire de base - pénalité + prime éventuelle
    let total = salaireJour - penalite + prime;

    // On retourne un objet avec tous les détails
    return {
        salaireBase: salaireJour,
        penalite: penalite,
        prime: prime,
        total: total
    };
}

// ============================================================
//  AFFICHER LE TABLEAU DE RAPPORT
// ============================================================
function afficherRapport(rondes, agents) {
    let tbody = $("#tableRapports");
    let totalGeneral = 0;
    tbody.empty();

    if (rondes.length === 0) {
        tbody.html(`<tr><td colspan="7" class="text-center text-muted py-4">Aucun pointage trouvé.</td></tr>`);
        $("#totalGeneral").text("0 DH");
        return;
    }

    rondes.forEach(function (ronde) {
        // On cherche l'agent du pointage
        let agent = agents.find(function (a) { return a.id === ronde.agentId; });
        // Si l'agent n'existe plus (supprimé), on saute ce pointage
        if (!agent) return;

        // On calcule le salaire avec notre fonction
        let calcul = calculerSalaire(
            agent.salaireJour,
            ronde.nbEffectue,
            ronde.incidentValide
        );

        // On additionne au total général
        totalGeneral += calcul.total;

        // Affichage de la pénalité : si pas de pénalité, on affiche un tiret
        let affichagePenalite = calcul.penalite > 0
            ? `<span class="text-danger">-${formaterDH(calcul.penalite)}</span>`
            : `<span class="text-muted">—</span>`;

        // Affichage de la prime : si pas de prime, on affiche un tiret
        let affichagePrime = calcul.prime > 0
            ? `<span class="text-success">+${formaterDH(calcul.prime)}</span>`
            : `<span class="text-muted">—</span>`;

        tbody.append(`
      <tr>
        <td>${ronde.date}</td>
        <td>${agent.name}</td>
        <td>${ronde.nbEffectue} / ${REGLES.nbRondesAttendues}</td>
        <td>${formaterDH(calcul.salaireBase)}</td>
        <td>${affichagePenalite}</td>
        <td>${affichagePrime}</td>
        <td><strong>${formaterDH(calcul.total)}</strong></td>
      </tr>
    `);
    });

    // On affiche le total général dans le pied de tableau
    $("#totalGeneral").html(`<strong>${formaterDH(totalGeneral)}</strong>`);
}

// ============================================================
//  FILTRER LE TABLEAU
// ============================================================
function filtrer() {
    let agentChoisi = $("#filtreAgent").val();
    let incidentChoisi = $("#filtreIncident").val();

    Promise.all([
        fetch(API_URL + "/users").then(r => r.json()),
        fetch(API_URL + "/rondes").then(r => r.json())
    ])
        .then(function (resultats) {
            let agents = resultats[0];
            let rondes = resultats[1];
            // On filtre les pointages selon les critères choisis
            let resultatsFiltres = rondes.filter(function (r) {
                let okAgent = (agentChoisi === "") || (r.agentId === agentChoisi);
                let okIncident = true;
                if (incidentChoisi === "valide") {
                    okIncident = r.incidentValide === true;
                } else if (incidentChoisi === "penalise") {
                    okIncident = r.nbEffectue < REGLES.nbRondesAttendues;
                }
                return okAgent && okIncident;
            });
            afficherRapport(resultatsFiltres, agents);
        });
}

// ============================================================
//  RÉINITIALISER LES FILTRES
// ============================================================
function resetFiltres() {
    // On ne réinitialise le filtre agent que si l'utilisateur est admin
    if (estAdmin) {
        $("#filtreAgent").val("");
    }
    $("#filtreIncident").val("");
    // On recharge tout
    Promise.all([
        fetch(API_URL + "/users").then(r => r.json()),
        fetch(API_URL + "/rondes").then(r => r.json())
    ])
        .then(function (resultats) {
            afficherRapport(resultats[1], resultats[0]);
        });
}

// ============================================================
//  FORMATER UN NOMBRE EN DIRHAMS
//  Ex: 114.5 → "114,50 DH"
// ============================================================
function formaterDH(montant) {
    return montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}
