const express = require('express');
const server = express();
const port = "8080";

server.use(express.static('../public')); 
server.set('view engine', 'ejs');

server.use(express.urlencoded({extended:true}));

server.listen(port);

module.exports = server;
