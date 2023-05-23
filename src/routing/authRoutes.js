const { server, express } = require('../express_config');
const db = require("../database_pool.local");
const crypto = require("crypto");
const utils = require('../utils/utils');
const middlewares = require("../middlewares/middlewares");

const router = express.Router();

/**
 * Si l'utilisateur est déjà authentifié, il est redirigé vers la page d'accueil.
 * Sinon, la page de connexion est rendue avec les informations nécessaires.
 *
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
router.get('/login', (req, res) => {
    if(utils.isAuthentificated(req)){
        res.redirect('/');
    }
    res.render('login_page.ejs', {
        failed: false,
        activeSession: utils.isAuthentificated(req),
        login_type_val: "clients",
        prixTotal: utils.getPrixTotalCookie(req)});
});

/**
 * Si l'utilisateur est déjà authentifié, il est redirigé vers la page d'accueil.
 * Sinon, la page d'inscription est rendue avec les informations nécessaires.
 *
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
router.get('/register', (req, res) => {
    if(utils.isAuthentificated(req)){
        res.redirect('/');
    }
    res.render('register_page.ejs', {
        erreurs: {},
        activeSession: utils.isAuthentificated(req),
        prixTotal: utils.getPrixTotalCookie(req)
    });
});

/**
 * Si l'utilisateur est déjà authentifié, il est redirigé vers la page d'accueil.
 * Sinon, la page de connexion est rendue avec les informations nécessaires pour les gérants.
 *
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
router.get('/gerant', (req, res) => {
    if(utils.isAuthentificated(req)){
        res.redirect('/');
    }
    res.render('login_page.ejs', {
        failed: false,
        login_type_val: "gerants",
        activeSession: utils.isAuthentificated(req),
        prixTotal: utils.getPrixTotalCookie(req)});
});

/**
 * Déconnexion de l'utilisateur.
 * Si l'utilisateur est authentifié, sa session est détruite.
 * Ensuite, l'utilisateur est redirigé vers la page d'accueil.
 *
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
router.get('/disconnect',(req, res) => {
    if(utils.isAuthentificated(req)){
        req.session.destroy(function(err) {
            if (err) {
              console.log(err);
            }
        });
    }
    res.redirect('/');
});

/**
 * Insère un produit dans la table produit_commande.
 * Si l'élément a un accessoire, l'ID de l'accessoire est inséré.
 * Sinon, la valeur NULL est insérée pour l'ID de l'accessoire.
 *
 * @param {Object} element - Élément à insérer.
 * @returns {Promise} - Résultat de la requête d'insertion.
 */
async function insertProduitCommande(element) {
    const id_access = (element.accessoireId.length === 0) ? 'NULL' : element.accessoireId;
    const reqProdCommande = `INSERT INTO produit_commande (id_produit, id_accessoire, taille)
                      VALUES ('${element.produitId}',${id_access},'${element.taille}')
                      RETURNING id_produit_commande`;
    return await db.query(reqProdCommande);
}


/**
 * Vérifie et traite les données du formulaire d'inscription.
 * Effectue différentes validations sur les champs du formulaire et
 * effectue l'insertion en base de données si les données sont valides.
 * Affiche les erreurs ou redirige vers la page de connexion en cas de succès.
 *
 * @param {Object} req - Objet de requête.
 * @param {Object} res - Objet de réponse.
 */
router.post('/verify_register', (req, res) => {
    const prenom = req.body.inputPrenom;
    const nom = req.body.inputNom;
    const email = req.body.inputEmail;
    const login = req.body.inputLogin;
    const num = req.body.inputNum;
    const password = req.body.inputPassword;
    const passwordVerif = req.body.inputPasswordVerif;
    const adresse = req.body.inputAdresse;
    const adresse2 = req.body.inputAdresse2;
    const ville = req.body.inputVille;
    const code = req.body.inputCode;

    // Expressions régulières pour les validations
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    const alphaRegex = /^[a-zA-Z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneNumberRegex = /^[0-9]{10}$/;
    const adresseRegex = /^[a-zA-Z0-9\s,'-]+$/;
    const codeRegex = /^\d{5}$/;

    let errors = {};

    // Validation des champs du formulaire
    if (!login.match(alphaNumericRegex)) {
        errors.loginLetters = "Le pseudo doit être composé de lettres et de chiffres.";
    }
    if (!prenom.match(alphaRegex)) {
        errors.prenom = "Le prénom doit être composé de lettres uniquement.";
    }
    if (!nom.match(alphaRegex)) {
        errors.nom = "Le nom doit être composé de lettres uniquement.";
    }
    if (!email.match(emailRegex)) {
        errors.email = "L'adresse e-mail est invalide.";
    }
    if (!num.match(phoneNumberRegex)) {
        errors.num = "Le numéro de téléphone doit être une combinaison de 8 chiffres.";
    }
    if (password.length < 8) {
        errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (password !== passwordVerif) {
        errors.passwordVerif = "Les mots de passe ne correspondent pas.";
    }
    if (!adresse.match(adresseRegex)) {
        errors.adresse = "L'adresse est invalide.";
    }
    if (adresse2) {
        if (!adresse2.match(adresseRegex)) {
            errors.adresse2 = "Les informations complémentaires contiennent des caractères invalides.";
        }
    }
    if (!ville.match(adresseRegex)) {
        errors.ville = "La ville est invalide.";
    }
    if (!code.match(codeRegex)) {
        errors.code = "Le code postal doit être composé de 5 chiffres.";
    }

    // Vérification de l'unicité du pseudo et de l'adresse e-mail
    let request = `SELECT * FROM gerants,clients WHERE gerants.login = '${login}' OR clients.login = '${login}' `;
    db.query(request, (err, result) => {
        if (err) {
            console.log(err);
            res.render('error.ejs', { errorCode: err });
        } else if (result.rows.length > 0) {
            errors.loginExists = "Le pseudo entré n'est pas disponible.";
        }
        let emailReq = `SELECT * FROM clients WHERE email = '${email}'`;
        db.query(emailReq, (err, result2) => {
            if (err) {
                console.log(err);
                res.render('error.ejs', { errorCode: err });
            } else if (result2.rows.length > 0) {
                errors.emailExists = "L'adresse mail entrée n'est pas disponible.";
            }

            if (Object.keys(errors).length === 0) {
                // Insertion des données en base de données
                const hashed_mdp = crypto.createHash('sha256').update(password).digest('hex');
                const reqInsert = `INSERT INTO clients (nom, prenom, tel, email, adresse, adresse2, ville, code, login, mdp)
                VALUES ('${nom}', '${prenom}', '${num}', '${email}', '${adresse}', '${adresse2}', '${ville}', '${code}', '${login}', '${hashed_mdp}');`

                db.query(reqInsert, (err, result3) => {
                    if (err) {
                        console.log(err);
                        res.render('error.ejs', { errorCode: err });
                    } else {
                        // Redirection vers la page de connexion en cas de succès
                        res.render('login_page.ejs', {
                            failed: false,
                            login_type_val: 'clients',
                            prixTotal: utils.getPrixTotalCookie(req),
                            activeSession: utils.isAuthentificated(req),
                        });
                    }
                });
            } else {
                // Affichage des erreurs sur la page d'inscription
                res.render('register_page.ejs', {
                    erreurs: errors,
                    activeSession: utils.isAuthentificated(req),
                    user: utils.isAuthentificated(req) ? req.session.user : {}
                });
            }
        });
    });
});


/**
 * Route pour la vérification du paiement
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
router.post('/verify_payment', async (req, res) => {
    // On récupère les données du formulaire
    const prenom = req.body.inputPrenom;
    const nom = req.body.inputNom;
    const heure = req.body.inputHeure;
    const num = req.body.inputNum;
    const email = req.body.inputEmail;
    const adresse = req.body.inputAdresse;
    const adresse2 = req.body.inputAdresse2;
    const ville = req.body.inputVille;
    const code = req.body.inputCode;

    // Expressions régulières pour la validation des champs.
    const alphaRegex = /^[a-zA-Z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneNumberRegex = /^[0-9]{10}$/;
    const adresseRegex = /^[a-zA-Z0-9\s,'-]+$/;
    const codeRegex = /^\d{5}$/;

    let errors = {};

    // On vérifie si le panier est vide.
    const panier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];
    if (panier.length === 0) {
        res.redirect('/');
        return;
    }

    try {
        // On vérifie les stocks des produits dans le panier.
        const verifPanier = await middlewares.verifStocks(panier);
        if (panier.length !== verifPanier.length) {
            res.redirect('/panier');
            return;
        }
    } catch (err) {
        console.log(err);
        res.render('error.ejs', { errorCode: err });
        return;
    }

    // On regarde si les champs du formulaire sont bien valides.
    if (!prenom.match(alphaRegex)) {
        errors.prenom = "Le prénom doit être composé de lettres uniquement.";
    }
    if (!nom.match(alphaRegex)) {
        errors.nom = "Le nom doit être composé de lettres uniquement.";
    }
    if (!email.match(emailRegex)) {
        errors.email = "L'adresse e-mail est invalide.";
    }
    if (!num.match(phoneNumberRegex)) {
        errors.num = "Le numéro de téléphone doit être une combinaison de 8 chiffres.";
    }
    if (!adresse.match(adresseRegex)) {
        errors.adresse = "L'adresse est invalide.";
    }
    if (adresse2) {
        if (!adresse2.match(adresseRegex)) {
            errors.adresse2 = "Les informations complémentaires contiennent des caractères invalides.";
        }
    }
    if (!ville.match(adresseRegex)) {
        errors.ville = "La ville est invalide.";
    }
    if (!code.match(codeRegex)) {
        errors.code = "Le code postal doit être composé de 5 chiffres.";
    }

    let emailReq = `SELECT * FROM clients WHERE email = '${email}'`;
    if (utils.isAuthentificated(req) && req.session.user.loginType === 'clients') {
        emailReq += ` AND id_client != '${req.session.user.id_client}'`;
    }

    try {
        // On vérifie si l'adresse e-mail existe déjà dans la base de données.
        const result = await db.query(emailReq);
        if (result.rows.length > 0) {
            errors.emailExists = "L'adresse mail entrée appartient à un utilisateur.";
        }

        // S'il n'y a pas d'erreurs de validation, on commence l'enregistrement de la commande.
        if (Object.keys(errors).length === 0) {
            const reqInsert = `INSERT INTO commandes (nom, prenom,
                                                      heureLivraison, tel,
                                                      email, adresse, adresse2,
                                                      ville, code)
                               VALUES ('${nom}', '${prenom}', '${heure}',
                                       '${num}', '${email}', '${adresse}',
                                       '${adresse2}', '${ville}', '${code}')
                               RETURNING id_commande`;
            const result3 = await db.query(reqInsert);
            const commandeId = result3.rows[0].id_commande;

            // On enregistre les produits du panier dans la commande
            for (const element of panier) {
                if (element.type === 'produit') {
                    // On insère le produit dans la table produits_uniques_commandes
                    const resultProdCommande = await insertProduitCommande(element);
                    const id_produit_commande = resultProdCommande.rows[0].id_produit_commande;

                    const reqProdUnique = `INSERT INTO produits_uniques_commandes (id_produit_commande, id_commande, quantite)
                                           VALUES ('${id_produit_commande}',
                                                   '${commandeId}',
                                                   '${element.quantity}');`;
                    const resultProdUnique = await db.query(reqProdUnique);

                    // Puis on met à jour les stocks du produit
                    const reqStock = `UPDATE dispo_tailles
                                      SET quantite = (quantite - ${element.quantity})
                                      WHERE id_produit = '${element.produitId}'
                                        AND taille = '${element.taille}';`;
                    const resStock = await db.query(reqStock);
                } else if (element.type === 'combinaison') {
                    // On insère les produits de la combinaison dans la table combinaisons_commandes
                    const resultProdCommande1 =
                        await insertProduitCommande(element.produits[0]);
                    const resultProdCommande2 =
                        await insertProduitCommande(element.produits[1]);
                    const resultProdCommande3 =
                        await insertProduitCommande(element.produits[2]);

                    // Et on ajoute la combinaison dans la base de données.
                    const reqCombi = `INSERT INTO combinaisons_commandes (id_combinaison,
                                                                          id_commande,
                                                                          id_produit_commande1,
                                                                          id_produit_commande2,
                                                                          id_produit_commande3,
                                                                          quantite)
                                      VALUES ('${element.combinaisonId}',
                                              '${commandeId}',
                                              '${resultProdCommande1.rows[0].id_produit_commande}
                                              ',
                                              '${resultProdCommande2.rows[0].id_produit_commande}
                                              ',
                                              '${resultProdCommande3.rows[0].id_produit_commande}
                                              ', '${element.quantity}')`;
                    const resultCombi = await db.query(reqCombi);

                    // On met ensuite à jour les stocks des produits de la combinaison.
                    const reqStock1 = `UPDATE dispo_tailles SET quantite = (quantite - ${element.quantity})
                    WHERE id_produit = ${element.produits[0].produitId} AND taille = '${element.produits[0].taille}';`;
                    const resStock1 = await db.query(reqStock1);

                    const reqStock2 = `UPDATE dispo_tailles SET quantite = (quantite - ${element.quantity})
                    WHERE id_produit = ${element.produits[1].produitId} AND taille = '${element.produits[1].taille}';`;
                    const resStock2 = await db.query(reqStock2);

                    const reqStock3 = `UPDATE dispo_tailles SET quantite = (quantite - ${element.quantity})
                    WHERE id_produit = ${element.produits[2].produitId} AND taille = '${element.produits[2].taille}';`;
                    const resStock3 = await db.query(reqStock3);
                }
            }

            // On efface les cookies du panier et du prix total
            res.clearCookie('panier');
            res.clearCookie('prixTotal');

            // Puis on affiche la page de confirmation de commande
            res.render('confirmation.ejs', {
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: utils.isAuthentificated(req),
                user: utils.isAuthentificated(req) ? req.session.user : {}
            });
            return;
        } else {
            // On réaffiche la page de paiement avec les erreurs de validation.
            res.render('paiement.ejs', {
                erreurs: errors,
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: utils.isAuthentificated(req),
                user: utils.isAuthentificated(req) ? req.session.user : {}
            });
            return;
        }
    } catch (err) {
        console.log(err);
        res.render('error.ejs', { errorCode: err });
    }
});


/**
 * Gestionnaire de route pour vérifier les informations d'identification de connexion.
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 */
router.post('/verify_login', async (req, res) => {
    try {
        const login = (req.body.username);
        const mdp = (req.body.password);
        const login_type = (req.body.login_type);

        // On vérifie le type de connexion
        const validLogins = ['gerants', 'clients'];
        if (!validLogins.includes(login_type)) {
            return res.status(400).send('Type de connexion invalide');
        }

        // On interroge la base de données pour l'utilisateur en fonction du type de connexion
        const request = `SELECT * FROM ${login_type} WHERE login = $1`;
        const result = await db.query(request, [login]);
        if (result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp.substring(2);
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest('hex');

            // On vérifie si le mot de passe correspond à celui stocké dans la base de données
            if (hashed_mdp === hashed_db_mdp) {
                if (login_type === 'clients') {
                    // Puis on stocke les informations de l'utilisateur dans la session en tant qu'utilisateur client
                    req.session.user = {
                        loginType: login_type,
                        id_client: result.rows[0].id_client,
                        nom: result.rows[0].nom,
                        prenom: result.rows[0].prenom,
                        tel: result.rows[0].tel,
                        email: result.rows[0].email,
                        adresse: result.rows[0].adresse,
                        adresse2: result.rows[0].adresse2,
                        ville: result.rows[0].ville,
                        code: result.rows[0].code
                    };
                } else {
                    // On stocke l'ID de l'utilisateur dans la session en tant qu'utilisateur gérant
                    req.session.user = {
                        loginType: login_type,
                        userId: result.rows[0].id,
                    };
                }
                res.redirect('/');
            } else {
                // Le mot de passe ne correspond pas, on affiche la page de connexion avec un échec de connexion
                res.render('login_page.ejs', {
                    failed: true,
                    login_type_val: login_type,
                    prixTotal: utils.getPrixTotalCookie(req),
                    activeSession: utils.isAuthentificated(req),
                });
            }
        } else {
            // L'utilisateur n'existe pas, on affiche la page de connexion avec un échec de connexion
            res.render('login_page.ejs', {
                failed: true,
                login_type_val: login_type,
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: utils.isAuthentificated(req),
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur interne du serveur');
    }
});

module.exports = router;