$(document).ready(() => {
    let username = localStorage.getItem("username");
    let uri = window.location.pathname;
    // Est-ce qu'on est sur la page d'accueil ?
    let surPageAccueil = uri.endsWith("index.html") || uri.endsWith("/");
    if (username != undefined) {
        // Utilisateur connecté : on affiche son nom et on cache le bouton connexion
        $("#connexionBtn").hide();
        $("#navbarDarkDropdownMenuLink").text(`Bonjour ${username}`);
        $("#navbarNavDarkDropdown").show();
    } else {
        // Utilisateur non connecté
        $("#navbarNavDarkDropdown").hide();
        $("#connexionBtn").show();
        // Si on n'est pas sur la page d'accueil, on redirige
        if (!surPageAccueil) {
            window.location.href = "../index.html";
        }
    }
});

function deconnexion() {
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("is_admin");
    window.location.href = "../index.html";
}
