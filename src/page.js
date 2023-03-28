const express = require('express');
const server = express();
const port = "8080";

server.use(express.static('../public')); 
server.set('view engine', 'ejs'); 
server.use(express.urlencoded({extended:true}));

server.get('/', (req, res) => {
    res.render('page.ejs');
});

server.listen(port);