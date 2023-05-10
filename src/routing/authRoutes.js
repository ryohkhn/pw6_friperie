const express = require('express');
const db = require("../database_pool.local");
const crypto = require("crypto");
const router = express.Router();

router.get('/login', (req, res) => {
    if(isAuthentificated(req)){
        res.redirect('/');
    }
    res.render('login_page.ejs', {
        failed: false,
        activeSession: isAuthentificated(req),
        login_type_val: "clients",
        prixTotal: getPrixTotalCookie(req)});
});

router.get('/register', (req, res) => {
    if(isAuthentificated(req)){
        res.redirect('/');
    }
    res.render('register_page.ejs', {erreurs:{},activeSession: isAuthentificated(req), prixTotal: getPrixTotalCookie(req)});
});

router.get('/gerant', (req, res) => {
    if(!isAuthentificated(req) || req.session.user.loginType!=='gerants'){
        res.redirect('/');
    }
    res.render('login_page.ejs', {
        failed: false,
        login_type_val: "gerants",
        activeSession: isAuthentificated(req),
        prixTotal: getPrixTotalCookie(req)});
});

router.get('/disconnect',(req, res) => {
    if(isAuthentificated(req)){
        req.session.destroy(function(err) {
            if (err) {
              console.log(err);
            }
        });
    }
    res.redirect('/');

});

function fullLetter(text){
    var letters = /^[A-Za-z]+$/;
    if(text.value.match(letters)){
        return true;
    }else{
        alert('Username must have alphabet characters only');
        text.focus();
        return false;
    }
}

function getPrixTotalCookie(req){
    return (req.cookies ? (req.cookies.prixTotal ? parseFloat(req.cookies.prixTotal) : 0) : 0);
}

function isAuthentificated(req){
    return((req.session && req.session.user));
}

router.post('/verify_register', (req, res) => {
    const prenom = (req.body.inputPrenom);
    const nom = (req.body.inputNom);
    const email = (req.body.inputEmail);
    const login = (req.body.inputLogin);
    const num = (req.body.inputNum);
    const password = (req.body.inputPassword);
    const passwordVerif = (req.body.inputPasswordVerif);
    const adresse = (req.body.inputAdresse);
    const adresse2 = (req.body.inputAdresse2);
    const ville = (req.body.inputVille);
    const code = (req.body.inputCode);

    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    const alphaRegex = /^[a-zA-Z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneNumberRegex = /^[0-9]{10}$/;
    const adresseRegex = /^[a-zA-Z0-9\s,'-]+$/;
    const codeRegex = /^\d{5}$/;


    let errors = {};

    if (!login.match(alphaNumericRegex)) {
        errors.loginLetters= "Le pseudo doit être composé de lettres et de chiffres.";
    }
    if (!prenom.match(alphaRegex)) {
        errors.prenom ="Le prénom doit être composé de lettres uniquement.";
    }
    if (!nom.match(alphaRegex)) {
        errors.nom = "Le nom doit être composé de lettres uniquement.";
    }
    if (!email.match(emailRegex)) {
        errors.email= "L'adresse e-mail est invalide.";
    }
    if (!num.match(phoneNumberRegex)){
        errors.num= "Le numéro de téléphone doit être une combinaison de 8 chiffres.";
    }
    if (password.length < 8) {
        errors.password= "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (password !== passwordVerif) {
        errors.passwordVerif ="Les mots de passe ne correspondent pas.";
    }
    if (!adresse.match(adresseRegex)) {
        errors.adresse = "L'adresse est invalide.";
    }
    if(adresse2){
        if (!adresse2.match(adresseRegex)) {
            errors.adresse2="Les informations complémentaires contiennent des caractères invalides.";
        }
    }
    if (!ville.match(adresseRegex)) {
        errors.ville= "La ville est invalide.";
    }
    if (!code.match(codeRegex)) {
        errors.code = "Le code postal doit être composé de 5 chiffres.";
    }


    let request=`SELECT * FROM gerants,clients WHERE gerants.login = '${login}' OR clients.login = '${login}' `;
    db.query(request,(err,result)=>{
        if (err) {
            console.log(err);
            res.render('error.ejs',{errorCode: err});
        }
        else if (result.rows.length > 0) {
            errors.loginExists = "Le pseudo entré n'est pas disponible.";
        }
        let emailReq = `SELECT * FROM clients WHERE email = '${email}'`;
        db.query(emailReq, (err, result2) => {
            if (err) {
                console.log(err);
                res.render('error.ejs',{errorCode: err});
            }else if (result2.rows.length > 0) {
                errors.emailExists = "L'adresse mail entrée n'est pas disponible.";
            }
            if(Object.keys(errors).length === 0){
                const hashed_mdp = crypto.createHash('sha256').update(password).digest('hex');                //TODO : créer la session et ajouter dans la base de données
                const reqInsert = `INSERT INTO clients (nom, prenom, tel, email, adresse, adresse2, ville, code, login, mdp)
                VALUES ('${nom}', '${prenom}', '${num}','${email}', '${adresse}', '${adresse2}', '${ville}', '${code}','${login}', '${hashed_mdp}');`

                db.query(reqInsert,(err, result3) => {
                    if (err) {
                        console.log(err);
                        res.render('error.ejs',{errorCode: err});
                    }else{
                        res.render('login_page.ejs', {
                            failed: false,
                            login_type_val:'clients',
                            prixTotal: getPrixTotalCookie(req),
                            activeSession: isAuthentificated(req),                        });
                    }
                });

            }else{
                res.render('register_page.ejs',{
                    erreurs:errors,
                    activeSession: isAuthentificated(req),
                    user: isAuthentificated(req) ? req.session.user : {}
                });
            }
        });
    });
}
);

router.post('/verify_payment', (req, res) => {
    const prenom = (req.body.inputPrenom);
    const nom = (req.body.inputNom);
    const heure = (req.body.inputHeure);
    const num = (req.body.inputNum);
    const email = (req.body.inputEmail);
    const adresse = (req.body.inputAdresse);
    const adresse2 = (req.body.inputAdresse2);
    const ville = (req.body.inputVille);
    const code = (req.body.inputCode);

    const alphaRegex = /^[a-zA-Z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneNumberRegex = /^[0-9]{10}$/;
    const adresseRegex = /^[a-zA-Z0-9\s,'-]+$/;
    const codeRegex = /^\d{5}$/;


    let errors = {};

    if (!prenom.match(alphaRegex)) {
        errors.prenom ="Le prénom doit être composé de lettres uniquement.";
    }
    if (!nom.match(alphaRegex)) {
        errors.nom = "Le nom doit être composé de lettres uniquement.";
    }
    if (!email.match(emailRegex)) {
        errors.email= "L'adresse e-mail est invalide.";
    }
    if (!num.match(phoneNumberRegex)){
        errors.num= "Le numéro de téléphone doit être une combinaison de 8 chiffres.";
    }
    if (!adresse.match(adresseRegex)) {
        errors.adresse = "L'adresse est invalide.";
    }
    if(adresse2){
        if (!adresse2.match(adresseRegex)) {
            errors.adresse2="Les informations complémentaires contiennent des caractères invalides.";
        }
    }
    if (!ville.match(adresseRegex)) {
        errors.ville= "La ville est invalide.";
    }
    if (!code.match(codeRegex)) {
        errors.code = "Le code postal doit être composé de 5 chiffres.";
    }

    let emailReq = `SELECT * FROM clients WHERE email = '${email}'`;
    console.log(req.session);
    if(isAuthentificated(req)){
        emailReq += ` AND id_client != '${req.session.user.id_client}'`
    }
        db.query(emailReq, (err, result) => {
            if (err) {
                console.log(err);
                res.render('error.ejs',{errorCode: err});
            }else if (result.rows.length > 0) {
                errors.emailExists = "L'adresse mail entrée appartient à un utilisateur.";
            }
            if(Object.keys(errors).length === 0){

                const reqInsert = `INSERT INTO commandes (nom, prenom, heureLivraison, tel, email, adresse, adresse2, ville, code)
                VALUES ('${nom}', '${prenom}', '${heure}', '${num}','${email}', '${adresse}', '${adresse2}', '${ville}', '${code}');`

                db.query(reqInsert,(err, result3) => {
                    if (err) {
                        console.log(err);
                        res.render('error.ejs',{errorCode: err});
                    }else{
                       // res.render('confirmation.ejs', {mail:email});
                       res.clearCookie('panier');
                       res.clearCookie('prixTotal');
                       res.redirect('/');
                    }
                });

            }else{
                
                res.render('paiement.ejs',{
                    erreurs:errors,
                    prixTotal: getPrixTotalCookie(req),
                    activeSession: isAuthentificated(req),
                    user: isAuthentificated(req) ? req.session.user : {}
                });
            }
        });
}
);

// Verify login/password
router.post('/verify_login', async (req, res) => {
    try {
        const login = (req.body.username);
        const mdp = (req.body.password);
        const login_type = (req.body.login_type);
        

        const validLogins = ['gerants', 'clients'];
        if (!validLogins.includes(login_type)) {
            return res.status(400).send('Invalid login type');
        }

        const request = `SELECT * FROM ${login_type} WHERE login = $1`;
        const result = await db.query(request, [login]);
        if (result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp.substring(2);
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest('hex'); 

            if (hashed_mdp===hashed_db_mdp) {
                if(login_type==='clients'){
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
                }else{
                    req.session.user = {
                        loginType: login_type,
                        userId: result.rows[0].id,
                    };
                }
                if (req.session) {
                    console.log(req.session);
                }
                res.redirect('/');
            }
            else {
                res.render('login_page.ejs', {
                    failed: true,
                    login_type_val: login_type,
                    prixTotal: getPrixTotalCookie(req),
                    activeSession: isAuthentificated(req),
                });
            }
        }
        else {
            res.render('login_page.ejs', {
                failed: true,
                login_type_val: login_type,
                prixTotal: getPrixTotalCookie(req),
                activeSession: isAuthentificated(req),
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;