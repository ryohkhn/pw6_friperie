const express = require('express');
const db = require("../database_pool.local");
const crypto = require("crypto");
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login_page.ejs', {failed: false, login_type_val: "clients"});
});

router.get('/register', (req, res) => {
    res.render('register_page.ejs', {failed: false});
});

router.get('/gerant', (req, res) => {
    res.render('login_page.ejs', {failed: false, login_type_val: "gerants"});
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

router.post('/verify_register', (req, res) => {
    const prenom = (req.body.inputPrenom);
    const nom = (req.body.inputNom);
    const email = (req.body.inputEmail);
    const login = (req.body.inputLogin);
    const password = (req.body.inputPassword);
    const passwordVerif = (req.body.inputPasswordVerif);
    const adresse = (req.body.inputAdresse);
    const adresse2 = (req.body.inputAdresse2);
    const ville = (req.body.inputVille);
    const code = (req.body.inputCode);

    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    const alphaRegex = /^[a-zA-Z]+$/;
    const emailRegex = /\S+@\S+\.\S+/;
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
    if (!ville.match(alphaRegex)) {
        errors.ville= "La ville doit être composée de lettres uniquement.";
    }
    if (!code.match(codeRegex)) {
        errors.code = "Le code postal doit être composé de 5 chiffres.";
    }


    let request=`SELECT * FROM gerants,clients WHERE login = '${login}'`;
    db.query(request,(err,result)=>{
        if (err) {
            console.log(err);
            res.render('error.ejs',{errorcode: err});
        }
        else if (result.rows.length > 0) {
            errors.loginExists = "Le pseudo entré n'est pas disponible.";
        }
        let emailReq = `SELECT * FROM gerants,clients WHERE email = '${email}'`;
        db.query(emailReq, (err, result2) => {
            if (err) {
                console.log(err);
                res.render('error.ejs',{errorcode: err});
            }else if (result2.rows.length > 0) {
                errors.emailExists = "L'adresse mail entrée n'est pas disponible.";
            }
            if(Object.keys(errors).length === 0){
                //TODO : créer la session et ajouter dans la base de données
                res.render('/');
            }else{
                res.render('register_page.ejs',{erreurs:errors});
            }
        });
    });
}
);

// Verify login/password
router.post('/verify_login', async (req, res) => {
    try {
        const login = (req.body.username);
        const mdp = (req.body.password);
        const login_type = (req.body.login_type);
        console.log(login_type);

        const validLogins = ['gerants', 'clients'];
        if (!validLogins.includes(login_type)) {
            return res.status(400).send('Invalid login type');
        }

        const request = `SELECT * FROM ${login_type} WHERE login = $1`;
        const result = await db.query(request, [login]);
        if (result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp;
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest();

            // remove the first '\x'
            const hexString = hashed_db_mdp.substring(2);
            // splits the string into groups of two characters each
            // using a regular expression and converts each group of two hexadecimal characters into a decimal number
            const byteArray = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
            const hashed_db_mdp_buff = Buffer.from(byteArray);

            // console.log(hashed_db_mdp_buff);
            // console.log(hashed_mdp);

            if (hashed_mdp.equals(hashed_db_mdp_buff)) {
                res.redirect("/");
            }
            else {
                res.render('login_page.ejs', {failed: true, login_type_val: login_type});
            }
        }
        else {
            res.render('login_page.ejs', {failed: true, login_type_val: login_type});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;