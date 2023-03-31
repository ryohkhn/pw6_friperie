const server = require('./express')
const db = require('./db');
const crypto = require('crypto');

server.get('/', (req, res) => {
    res.render('page.ejs');
});

server.get('/gerant', (req, res) => {
    res.render('gerant.ejs');
});

server.post('/verify', (req, res) => {
    const login = (req.body.username);
    const mdp = (req.body.password);
    const request = `SELECT * FROM gerants WHERE login = '${login}'`;
    db.query(request, (err, result) => {
        if (err) {
            console.log(err);
        }
        else if (result.rows.length === 1) {
            const hashed_db_mdp = result.rows[0].mdp;
            const hashed_mdp = crypto.createHash('sha256').update(mdp).digest();
            console.log(hashed_db_mdp);
            console.log(hashed_mdp);

// remove the \x prefix and convert the hexadecimal string to binary data
            /*
            const binaryHash = Buffer.from(hashedPasswordFromDatabase.slice(2), 'hex');



            if (hashedPassword.equals(binaryHash)) {
                // passwords match
            } else {
                // passwords do not match
            }
             */
            res.send("Succeed!");
        } else {
            // TODO remettre le form avec une erreur
            res.send("Failed to login");
        }
    });
});
