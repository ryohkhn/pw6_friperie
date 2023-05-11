const express = require('express');
const cookieParser = require('cookie-parser');
const server = express();
const port = "8080";

server.use(express.static('../public')); 
server.set('view engine', 'ejs');
server.use(cookieParser());

server.use(express.urlencoded({extended:true}));

server.listen(port);

module.exports = {server, express};
