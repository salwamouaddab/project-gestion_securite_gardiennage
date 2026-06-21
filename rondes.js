// ============================================================
//  rondes.js — Gestion des rondes
//  Concepts utilisés : fetch, DOM, événements, tableaux (.map, .filter)
// ============================================================
// URL de base de notre fausse API (json-server)
const API_URL = "http://localhost:3000";

const NB_RONDES_ATTENDUES = 8; // nombre de rondes attendues par nuit

// On récupère si l'utilisateur connecté est admin (stocké au login)
// localStorage.getItem() retourne une string, on compare à "true"
const estAdmin = localStorage.getItem("is_admin") === "true";
const userId = localStorage.getItem("userId");

// Variable globale pour stocker l'id de la ronde à supprimer
// On en a besoin dans deux fonctions différentes
let idRondeASupprimer = null;

// ============================================================
//  POINT D'ENTRÉE : s'exécute quand la page est prête
// ============================================================
$(document).ready(function () {
    // Si l'utilisateur est admin, on affiche la colonne "Actions"
    if (estAdmin) {
        $("#colonneActions").show();
    }

    // On charge les agents en premier, puis les rondes
    // (on a besoin des agents pour afficher leur nom dans le tableau)
    chargerAgents().then(function () {
        chargerRondes();
    });

    // Écouteurs sur les filtres : à chaque changement, on refiltre
    $("#filtreAgent").on("change", filtrerRondes);
    $("#filtreIncident").on("change", filtrerRondes);
    $("#filtreDate").on("input", filtrerRondes);

    // Afficher/masquer la case "incident validé" selon le rôle et le nombre d'incidents
    $("#ronde-nbIncidents").on("input", function () {
        let nb = Number($(this).val());
        // La validation d'incident n'a de sens que si admin ET qu'il y a au moins 1 incident
        if (estAdmin && nb > 0) {
            $("#champ-incidentValide").show();
        } else {
            $("#champ-incidentValide").hide();
            $("#ronde-incidentValide").prop("checked", false);
        }
    });
});

// ============================================================
//  VARIABLE GLOBALE : liste de tous les agents
//  On la stocke ici pour ne pas refaire un appel API à chaque fois
// ============================================================
let listeAgents = [];

// ============================================================
//  CHARGER LES AGENTS depuis l'API
// ============================================================
function chargerAgents() {
    // fetch() envoie une requête HTTP GET à notre API
    // .then() s'exécute quand la réponse arrive
    return fetch(API_URL + "/users")
        .then(function (reponse) {
            return reponse.json(); // on convertit la réponse en tableau JS
        })
        .then(function (agents) {
            // On sauvegarde la liste pour l'utiliser ailleurs
            listeAgents = agents;
            // On remplit le filtre "Tous les agents"
            agents.forEach(function (agent) {
                $("#filtreAgent").append(
                    `<option value="${agent.id}">${agent.name}</option>`
                );
            });
            // On remplit aussi le select dans le formulaire d'ajout/modification
            agents.forEach(function (agent) {
                $("#ronde-agent").append(
                    `<option value="${agent.id}">${agent.name}</option>`
                );
            });
        })
        .catch(function (erreur) {
            console.error("Erreur chargement agents :", erreur);
        });
}

// ============================================================
//  CHARGER LES RONDES depuis l'API
// ============================================================
function chargerRondes() {
    fetch(API_URL + "/rondes")
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function (rondes) {
            // On affiche toutes les rondes au chargement
            afficherRondes(rondes);
        })
        .catch(function (erreur) {
            console.error("Erreur chargement rondes :", erreur);
            $("#tableRondes").html(
                `<tr><td colspan="7" class="text-center text-danger">Impossible de charger les rondes.</td></tr>`
            );
        });
}

// ============================================================
//  AFFICHER LES RONDES dans le tableau HTML
// ============================================================
function afficherRondes(rondes) {
    let tbody = $("#tableRondes");
    tbody.empty(); // on vide le tableau avant de le remplir

    // Si aucune ronde à afficher
    if (rondes.length === 0) {
        tbody.html(
            `<tr><td colspan="7" class="text-center text-muted py-4">Aucune ronde trouvée.</td></tr>`
        );
        return;
    }

    // Pour chaque ronde, on crée une ligne HTML
    rondes.forEach(function (ronde) {
        // On cherche l'agent correspondant dans notre liste
        let agent = listeAgents.find(function (a) {
            return a.id === ronde.agentId;
        });
        // Si on ne trouve pas l'agent (données incohérentes), on affiche "Inconnu"
        let nomAgent = agent ? agent.name : "Inconnu";
        // Badge coloré selon le statut de l'incident
        let badgeIncident = creerBadgeIncident(ronde);

        // Colonne Actions : uniquement pour l'admin
        let colonneActions = "";
        if (estAdmin) {
            colonneActions = `
        <td>
          <button class="btn btn-sm btn-outline-secondary me-1"
            onclick="ouvrirModalModification('${ronde.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger"
            onclick="demanderSuppression('${ronde.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
        }

        // On construit la ligne HTML avec les données de la ronde
        let ligne = `
      <tr>
        <td><code>${ronde.id}</code></td>
        <td>${ronde.date}</td>
        <td>${nomAgent}</td>
        <td>${ronde.nbEffectue} / ${NB_RONDES_ATTENDUES}</td>
        <td>${ronde.nbIncidents}</td>
        <td>${badgeIncident}</td>
        ${colonneActions}
      </tr>
    `;
        tbody.append(ligne);
    });
}

// ============================================================
//  CRÉER UN BADGE coloré selon le statut de l'incident
// ============================================================
function creerBadgeIncident(ronde) {
    if (ronde.nbIncidents === 0) {
        return `<span class="text-muted">—</span>`;
    }
    if (ronde.incidentValide) {
        return `<span class="badge bg-success">Validé (+25%)</span>`;
    }
    return `<span class="badge bg-warning text-dark">En attente</span>`;
}

// ============================================================
//  FILTRER LES RONDES
//  Appelée à chaque changement d'un filtre
// ============================================================
function filtrerRondes() {
    let agentChoisi = $("#filtreAgent").val();
    let incidentChoisi = $("#filtreIncident").val();
    let dateChoisie = $("#filtreDate").val();

    // On recharge toutes les rondes depuis l'API puis on filtre
    fetch(API_URL + "/rondes")
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function (rondes) {
            // .filter() garde uniquement les rondes qui passent tous les critères
            let resultats = rondes.filter(function (ronde) {
                // Vérifie l'agent (si un filtre est sélectionné)
                let okAgent = (agentChoisi === "") || (ronde.agentId === agentChoisi);
                // Vérifie la date (si un filtre est sélectionné)
                let okDate = (dateChoisie === "") || (ronde.date === dateChoisie);
                // Vérifie le statut de l'incident (si un filtre est sélectionné)
                let okIncident = true;
                if (incidentChoisi === "avec") {
                    okIncident = ronde.nbIncidents > 0;
                } else if (incidentChoisi === "valide") {
                    okIncident = ronde.incidentValide === true;
                } else if (incidentChoisi === "sans") {
                    okIncident = ronde.nbIncidents === 0;
                }
                // La ronde est gardée seulement si les 3 conditions sont vraies
                return okAgent && okDate && okIncident;
            });
            afficherRondes(resultats);
        });
}

// ============================================================
//  RÉINITIALISER LES FILTRES
// ============================================================
function resetFiltres() {
    $("#filtreAgent").val("");
    $("#filtreIncident").val("");
    $("#filtreDate").val("");
    chargerRondes(); // on recharge toutes les rondes
}

// ============================================================
//  OUVRIR LA MODALE en mode AJOUT
// ============================================================
function ouvrirModalAjout() {
    // On remet le formulaire à zéro
    $("#formRonde")[0].reset();
    $("#ronde-id").val(""); // pas d'id = c'est un ajout
    $("#modalRondeTitre").text("Pointer une ronde");
    $("#champ-incidentValide").hide();
    effacerErreurs();
}

// ============================================================
//  OUVRIR LA MODALE en mode MODIFICATION
// ============================================================
function ouvrirModalModification(idRonde) {
    // On va chercher les données de la ronde dans l'API
    fetch(API_URL + "/rondes/" + idRonde)
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function (ronde) {
            // On change le titre de la modale
            $("#modalRondeTitre").text("Modifier le pointage");
            // On pré-remplit le formulaire avec les données existantes
            $("#ronde-id").val(ronde.id);
            $("#ronde-agent").val(ronde.agentId);
            $("#ronde-date").val(ronde.date);
            $("#ronde-nbEffectue").val(ronde.nbEffectue);
            $("#ronde-nbIncidents").val(ronde.nbIncidents);
            $("#ronde-incidentValide").prop("checked", ronde.incidentValide === true);
            // On affiche la case de validation seulement si admin et incident(s) signalé(s)
            if (estAdmin && ronde.nbIncidents > 0) {
                $("#champ-incidentValide").show();
            } else {
                $("#champ-incidentValide").hide();
            }
            effacerErreurs();
            // On ouvre la modale
            let modal = new bootstrap.Modal(document.getElementById("modalRonde"));
            modal.show();
        });
}

// ============================================================
//  VALIDER LE FORMULAIRE
//  Retourne true si tout est valide, false sinon
// ============================================================
function validerFormulaire() {
    let erreurs = 0;
    effacerErreurs();

    if ($("#ronde-agent").val() === "") {
        $("#err-agent").text("Veuillez choisir un agent.");
        erreurs++;
    }
    if ($("#ronde-date").val() === "") {
        $("#err-date").text("Veuillez choisir une date.");
        erreurs++;
    }
    let nbEffectue = Number($("#ronde-nbEffectue").val());
    if ($("#ronde-nbEffectue").val() === "" || nbEffectue < 0 || nbEffectue > NB_RONDES_ATTENDUES) {
        $("#err-nbEffectue").text(`Veuillez entrer un nombre entre 0 et ${NB_RONDES_ATTENDUES}.`);
        erreurs++;
    }
    let nbIncidents = Number($("#ronde-nbIncidents").val());
    if ($("#ronde-nbIncidents").val() === "" || nbIncidents < 0) {
        $("#err-nbIncidents").text("Veuillez entrer un nombre d'incidents valide.");
        erreurs++;
    }

    // S'il n'y a aucune erreur, le formulaire est valide
    return erreurs === 0;
}

// ============================================================
//  EFFACER LES MESSAGES D'ERREUR
// ============================================================
function effacerErreurs() {
    $("#err-agent").text("");
    $("#err-date").text("");
    $("#err-nbEffectue").text("");
    $("#err-nbIncidents").text("");
}

// ============================================================
//  SAUVEGARDER UNE RONDE (ajout ou modification)
// ============================================================
function sauvegarderRonde() {
    // On valide d'abord le formulaire
    if (!validerFormulaire()) return;

    // On construit l'objet ronde avec les valeurs du formulaire
    let ronde = {
        agentId: $("#ronde-agent").val(),
        date: $("#ronde-date").val(),
        nbEffectue: Number($("#ronde-nbEffectue").val()),
        nbIncidents: Number($("#ronde-nbIncidents").val()),
        // Seul l'admin peut valider un incident ; sinon on garde false
        incidentValide: estAdmin ? $("#ronde-incidentValide").is(":checked") : false
    };

    let idExistant = $("#ronde-id").val();
    // Si un id est présent dans le champ caché → c'est une modification (PUT)
    // Sinon → c'est un ajout (POST)
    if (idExistant !== "") {
        modifierRonde(idExistant, ronde);
    } else {
        ajouterRonde(ronde);
    }
}

// ============================================================
//  AJOUTER UNE RONDE (requête POST)
// ============================================================
function ajouterRonde(ronde) {
    fetch(API_URL + "/rondes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ronde)   // on convertit l'objet en texte JSON
    })
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function () {
            // On ferme la modale
            bootstrap.Modal.getInstance(document.getElementById("modalRonde")).hide();
            // On recharge la liste
            chargerRondes();
        })
        .catch(function (erreur) {
            console.error("Erreur ajout ronde :", erreur);
        });
}

// ============================================================
//  MODIFIER UNE RONDE (requête PUT)
// ============================================================
function modifierRonde(id, ronde) {
    fetch(API_URL + "/rondes/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ronde)
    })
        .then(function (reponse) {
            return reponse.json();
        })
        .then(function () {
            bootstrap.Modal.getInstance(document.getElementById("modalRonde")).hide();
            chargerRondes();
        })
        .catch(function (erreur) {
            console.error("Erreur modification ronde :", erreur);
        });
}

// ============================================================
//  DEMANDER LA SUPPRESSION (ouvre la modale de confirmation)
// ============================================================
function demanderSuppression(idRonde) {
    // On sauvegarde l'id pour l'utiliser dans confirmerSuppression()
    idRondeASupprimer = idRonde;
    // On ouvre la modale de confirmation
    let modal = new bootstrap.Modal(document.getElementById("modalSupprimer"));
    modal.show();
}

// ============================================================
//  CONFIRMER ET EXÉCUTER LA SUPPRESSION (requête DELETE)
// ============================================================
function confirmerSuppression() {
    fetch(API_URL + "/rondes/" + idRondeASupprimer, {
        method: "DELETE"
    })
        .then(function () {
            // On ferme la modale de confirmation
            bootstrap.Modal.getInstance(document.getElementById("modalSupprimer")).hide();
            idRondeASupprimer = null;
            chargerRondes();
        })
        .catch(function (erreur) {
            console.error("Erreur suppression ronde :", erreur);
        });
}
