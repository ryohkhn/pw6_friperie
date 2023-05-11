const session = require('express-session');

module.exports = session({
    secret: 'secret',
    resave: false,
    cookie: {maxAge : 86400000},
    saveUninitialized: false
});