const session = require('express-session');

// configuration du module de sessions
module.exports = session({
    secret: 'secret',
    resave: false,
    cookie: {maxAge : 86400000},
    saveUninitialized: false
});