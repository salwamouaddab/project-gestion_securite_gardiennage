$(document).ready(() => {
    // ILA KAN UTILISATEUR DEJA CONNECTÉ, REDIRECTION DIRECT VERS DASHBOARD
    if (localStorage.getItem("username") !== null) {
        window.location.href = "dashboard.html";
    }

    // VERIFIER SI UN EMAIL A ÉTÉ SAUVEGARDÉ (SE SOUVENIR DE MOI)
    if (localStorage.getItem("email") !== null) {
        $("#l-email").val(localStorage.getItem("email"));
        $("#remember").prop("checked", true);
    }

    // ============================================================
    //  INSCRIPTION (REGISTER)
    // ============================================================
    $("#registerBtn").click((event) => {
        let errors = 0;
        // reset validation messages
        $(".feedbak").text('');
        $(".formItem").removeClass('is-invalid');

        // Validation Nom
        let nom = $("#r-nom");
        let regexNom = /^[a-zA-Z\s]+$/;
        if (nom.val() === '') {
            $("#invalid-nom-feedbak").text('Veuillez entrer un nom');
            nom.addClass('is-invalid');
            errors++;
        }
        else if (!regexNom.test(nom.val())) {
            $("#invalid-nom-feedbak").text('Le nom ne doit contenir que des lettres et des espaces');
            nom.addClass('is-invalid');
            errors++;
        }

        // Validation salaire journalier
        let salaire = $("#r-salaire");
        if (salaire.val() === '' || Number(salaire.val()) <= 0) {
            $("#invalid-salaire-feedbak").text('Veuillez entrer un salaire journalier valide');
            salaire.addClass('is-invalid');
            errors++;
        }

        // validation email
        let email = $("#r-email");
        let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.val() === '') {
            $("#invalid-email-feedbak").text('Veuillez entrer une adresse email');
            email.addClass('is-invalid');
            errors++;
        } else if (!regexEmail.test(email.val())) {
            $("#invalid-email-feedbak").text('Veuillez entrer une adresse email valide');
            email.addClass('is-invalid');
            errors++;
        }

        // validation mot de passe
        let password = $("#r-password");
        let confirmPassword = $("#r-password-confirm");
        if (password.val() === '') {
            $("#invalid-password-feedbak").text('Veuillez entrer un mot de passe');
            password.addClass('is-invalid');
            errors++;
        }
        if (confirmPassword.val() === '') {
            $("#invalid-password-confirm-feedbak").text('Veuillez confirmer votre mot de passe');
            confirmPassword.addClass('is-invalid');
            errors++;
        } else if (password.val() !== confirmPassword.val()) {
            $("#invalid-password-confirm-feedbak").text('Les mots de passe ne correspondent pas');
            confirmPassword.addClass('is-invalid');
            errors++;
        }

        if (errors === 0) {
            hashPassword(password.val()).then(passwordHache => {
                let nouvelAgent = {
                    name: nom.val(),
                    email: email.val(),
                    password: passwordHache,
                    salaireJour: Number(salaire.val()),
                    is_admin: false
                };

                // Enregistrer l'agent dans json-server
                fetch("http://localhost:3000/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nouvelAgent)
                })
                .then(response => response.json())
                .then(() => {
                    alert("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
                    resetForms();
                    switchTab('login');
                })
                .catch(erreur => {
                    console.error("Erreur lors de l'inscription :", erreur);
                    alert("Erreur de connexion au serveur.");
                });
            });
        }
    });

    // ============================================================
    //  CONNEXION (LOGIN)
    // ============================================================
    $("#loginBtn").click((event) => {
        let errors = 0;
        $(".feedbak").text('');
        $(".formItem").removeClass('is-invalid');

        let email = $("#l-email");
        let password = $("#l-password");
        let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // validation email
        if (email.val() === '') {
            $("#invalid-login-email-feedbak").text('Veuillez entrer une adresse email');
            email.addClass('is-invalid');
            errors++;
        } else if (!regexEmail.test(email.val())) {
            $("#invalid-login-email-feedbak").text('Veuillez entrer une adresse email valide');
            email.addClass('is-invalid');
            errors++;
        }

        // validation mot de passe
        if (password.val() === '') {
            $("#invalid-login-password-feedbak").text('Veuillez entrer un mot de passe');
            password.addClass('is-invalid');
            errors++;
        }

        if (errors === 0) {
            if ($("#remember").get(0).checked) {
                localStorage.setItem("email", $("#l-email").val());
            } else {
                localStorage.removeItem("email");
            }

            hashPassword(password.val()).then(passwordHache => {
                let user = {
                    email: email.val(),
                    password: passwordHache
                };
                loginUser(user);
            });
        }
    });

    // ============================================================
    //  FONCTION : EXECUTER LA CONNEXION
    // ============================================================
    function loginUser(user) {
        fetch("http://localhost:3000/users")
            .then(response => response.json())
            .then(users => {
                // Recherche de l'utilisateur avec email et password hashé correspondants
                let trouve = users.find(u => u.email === user.email && u.password === user.password);

                if (trouve) {
                    // Sauvegarde des informations dans la session locale
                    localStorage.setItem("username", trouve.name);
                    localStorage.setItem("userId", trouve.id);
                    localStorage.setItem("is_admin", trouve.is_admin.toString());

                    // Redirection immédiate vers le Dashboard
                    window.location.href = "dashboard.html";
                } else {
                    $("#invalid-login-password-feedbak").text("Email ou mot de passe incorrect !");
                    $("#l-password").addClass('is-invalid');
                }
            })
            .catch(erreur => {
                console.error("Erreur lors de la connexion :", erreur);
                alert("Impossible de se connecter au serveur. Vérifiez que json-server est bien lancé !");
            });
    }

    // ============================================================
    //  FONCTIONS UTILITAIRES (HASH & RESET)
    // ============================================================
    async function hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    resetForms = () => {
        document.getElementById("registerForm").reset();
        document.getElementById("loginForm").reset();
        $(".feedbak").text('');
        $(".formItem").removeClass('is-invalid');
    };
});
