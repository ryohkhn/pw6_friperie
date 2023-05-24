const { server, express } = require('./express_config');
const db = require('./database_pool');

const sessionConfig = require('./session_config');
const middlewares = require('./middlewares/middlewares');
const utils = require('./utils/utils');

const authRoutes = require('./routing/authRoutes');
const ajaxRoutes = require('./routing/ajaxRoutes');
const generalRoutes = require('./routing/generalRoutes');

// on charge la configuration de session
server.use(sessionConfig);

// routage pour l'authentification
server.use(authRoutes);

// routage pour l'accueil, les produits, les catégories et les différentes options
server.use(generalRoutes);

// routage pour les requêtes AJAX
server.use(ajaxRoutes);