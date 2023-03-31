const { Client } = require('pg');

const client = new Client({
    user: 'ryoh',
    host: 'localhost',
    database: 'pw6',
    password: '',
    port: 5432,
});

client.connect();

module.exports = client;