// ============================================================
//  agents.js — Gestion des agents (admin uniquement)
//  Concepts utilisés : fetch, DOM, vérification droits admin
// ============================================================
const API_URL = "http://localhost:3000";

// On récupère les infos de l'utilisateur connecté depuis le localStorage
const estAdmin = localStorage.getItem("is_admin") === "true";
const userId = localStorage.getItem("userId");

// Variable globale pour stocker l'id de l'agent à supprimer
let idAgentASupprimer = null;

// ============================================================
//  POINT D'ENTRÉE
// ============================================================
$(document).ready(function () {
    // Si l'utilisateur n'est pas admin, on masque le contenu
    // et on affiche le message d'accès refusé
    if (!estAdmin) {
        $("#contenuAdmin").hide();
        $("#messageAccesRefuse").show();
        return; // on arrête ici, pas besoin de charger les données
    }
    // L'utilisateur est admin : on charge la liste des agents
    chargerAgents();
});

// ============================================================
//  CHARGER ET AFFICHER LES AGENTS
// ============================================================
function chargerAgents() {
    fetch(API_URL + "/users")
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function (agents) {
            afficherAgents(agents);
        })
        .catch(function (erreur) {
            console.error("Erreur chargement agents :", erreur);
        });
}

// ============================================================
//  AFFICHER LES AGENTS dans le tableau HTML
// ============================================================
function afficherAgents(agents) {
    let tbody = $("#tableAgents");
    tbody.empty();

    agents.forEach(function (agent) {
        // Badge pour le rôle (Admin ou Agent)
        let badgeRole = agent.is_admin
            ? `<span class="badge bg-dark">Admin</span>`
            : `<span class="badge bg-secondary">Agent</span>`;

        // Le bouton supprimer est désactivé si c'est l'admin connecté lui-même
        // On ne peut pas se supprimer soi-même
        let btnSupprimer = agent.id === userId
            ? `<button class="btn btn-sm btn-outline-danger" disabled title="Impossible de se supprimer soi-même">
           <i class="bi bi-trash"></i>
         </button>`
            : `<button class="btn btn-sm btn-outline-danger" onclick="demanderSuppression('${agent.id}')">
           <i class="bi bi-trash"></i>
         </button>`;

        tbody.append(`
      <tr>
        <td><strong>${agent.name}</strong></td>
        <td style="font-size:.85rem;color:#666;">${agent.email}</td>
        <td>${agent.salaireJour ? agent.salaireJour + ' DH/j' : '—'}</td>
        <td>${badgeRole}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary me-1"
            onclick="ouvrirModalModification('${agent.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          ${btnSupprimer}
        </td>
      </tr>
    `);
    });
}

// ============================================================
//  OUVRIR LA MODALE DE MODIFICATION
// ============================================================
function ouvrirModalModification(idAgent) {
    // On va chercher les données de l'agent dans l'API
    fetch(API_URL + "/users/" + idAgent)
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function (agent) {
            // On pré-remplit le formulaire
            $("#agent-id").val(agent.id);
            $("#agent-nom").val(agent.name);
            $("#agent-salaire").val(agent.salaireJour);
            // On efface les erreurs éventuelles
            $("#err-salaire").text("");
            // On ouvre la modale
            let modal = new bootstrap.Modal(document.getElementById("modalAgent"));
            modal.show();
        });
}

// ============================================================
//  VALIDER LE FORMULAIRE
// ============================================================
function validerFormulaire() {
    let erreurs = 0;
    $("#err-salaire").text("");

    let salaire = Number($("#agent-salaire").val());
    if ($("#agent-salaire").val() === "" || salaire <= 0) {
        $("#err-salaire").text("Veuillez entrer un salaire valide (supérieur à 0).");
        erreurs++;
    }

    return erreurs === 0;
}

// ============================================================
//  SAUVEGARDER LES MODIFICATIONS D'UN AGENT (requête PATCH)
//  On utilise PATCH et non PUT car on ne modifie qu'1 champ
//  PUT remplacerait tout l'objet, PATCH ne met à jour que ce qu'on envoie
// ============================================================
function sauvegarderAgent() {
    if (!validerFormulaire()) return;

    let id = $("#agent-id").val();
    // On envoie uniquement le champ modifiable
    let modifications = {
        salaireJour: Number($("#agent-salaire").val())
    };

    fetch(API_URL + "/users/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modifications)
    })
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function () {
            bootstrap.Modal.getInstance(document.getElementById("modalAgent")).hide();
            chargerAgents(); // on recharge la liste
        })
        .catch(function (erreur) {
            console.error("Erreur modification agent :", erreur);
        });
}

// ============================================================
//  DEMANDER LA SUPPRESSION
// ============================================================
function demanderSuppression(idAgent) {
    idAgentASupprimer = idAgent;
    let modal = new bootstrap.Modal(document.getElementById("modalSupprimer"));
    modal.show();
}

// ============================================================
//  CONFIRMER ET EXÉCUTER LA SUPPRESSION
// ============================================================
function confirmerSuppression() {
    fetch(API_URL + "/users/" + idAgentASupprimer, {
        method: "DELETE"
    })
        .then(function () {
            bootstrap.Modal.getInstance(document.getElementById("modalSupprimer")).hide();
            idAgentASupprimer = null;
            chargerAgents();
        })
        .catch(function (erreur) {
            console.error("Erreur suppression agent :", erreur);
        });
}
