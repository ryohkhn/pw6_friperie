const server = require('./express')
const db = require('./db');
const crypto = require('crypto');

server.get('/', (req, res) => {
    let request = `SELECT * FROM produits`;
    db.query(request,(err,result)=> {
        if (err){
            console.log(err);
            res.render('error.ejs',{errorcode: err});
        }
        console.log(result.rows);
        res.render('page.ejs',{elements:result.rows});
        /*
        else if(result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp;
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest();

            // remove the first '\x'
            const hexString = hashed_db_mdp.substring(2);
            // splits the string into groups of two characters each, using a regular expression and converts each group of two hexadecimal characters into a decimal number
            const byteArray = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
            const hashed_db_mdp_buff = Buffer.from(byteArray);

            // console.log(hashed_db_mdp_buff);
            // console.log(hashed_mdp);

            if (hashed_mdp.equals(hashed_db_mdp_buff)) {
                res.redirect("http://localhost:8080/");
            } else {
                res.render('login_page.ejs', {failed: true, login_type_val: login_type});
            }
        } else {
            res.render('login_page.ejs', {failed: true, login_type_val: login_type});
        }
         */
    });
});

server.get('/login', (req, res) => {
    res.render('login_page.ejs', {failed: false, login_type_val: "client"});
});

server.get('/gerant', (req, res) => {
    res.render('login_page.ejs', {failed: false, login_type_val: "gerant"});
});

server.get('/search',(req, res) => {

});

// Verify login/password
server.post('/verify_login', (req, res) => {
    const login = (req.body.username);
    const mdp = (req.body.password);
    const login_type = (req.body.login_type);
    console.log(login_type);
    let request;
    if (login_type==="gerant"){
        request = `SELECT *
                         FROM gerants
                         WHERE login = '${login}'`;
    }
    else if (login_type==="client"){
        request = `SELECT *
                         FROM clients
                         WHERE login = '${login}'`;
    }
    db.query(request,(err,result)=>{
        if (err) {
            console.log(err);
            res.render('error.ejs',{errorcode: err});
        }
        else if (result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp;
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest();

            // remove the first '\x'
            const hexString = hashed_db_mdp.substring(2);
            // splits the string into groups of two characters each, using a regular expression and converts each group of two hexadecimal characters into a decimal number
            const byteArray = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
            const hashed_db_mdp_buff = Buffer.from(byteArray);

            // console.log(hashed_db_mdp_buff);
            // console.log(hashed_mdp);

            if (hashed_mdp.equals(hashed_db_mdp_buff)) {
                res.redirect("http://localhost:8080/");
            } else {
                res.render('login_page.ejs', {failed: true,login_type_val: login_type});
            }
        } else {
            res.render('login_page.ejs', {failed: true,login_type_val: login_type});
        }
    });
});
