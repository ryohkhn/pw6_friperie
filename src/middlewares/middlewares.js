const db = require("../database_pool.local");
const utils = require('../utils/utils');

/**
 *
 * @param data
 * @returns {*}
 */
function combineCommandes(data) {
    return data.reduce((acc, item) => {
        const existing = acc.find(x => x.id_commande === item.id_commande);

        if (existing) {
            existing.produits.push({nom_produit: item.nom_produit, quantite: item.quantite});
        }
        else {
            acc.push({
                id_client: item.id_client,
                id_commande: item.id_commande,
                produits: [{nom_produit: item.nom_produit, quantite: item.quantite}]
            });
        }

        return acc;
    }, []);
}

async function queryItems(queryString, params) {
    const result = await db.query(queryString, params);
    return result.rows;
}

async function getSearchItems(searchTerm, limit, offset) {
    const commonQuery = `FROM produits p
                         WHERE LOWER(nom_produit) LIKE LOWER($1)
                           AND p.id_produit NOT IN
                               (SELECT id_produit
                                FROM combinaisons_parts cp
                                WHERE cp.id_produit = p.id_produit)`;
    const countQuery = `SELECT * ${commonQuery}`;
    const itemsQuery = `SELECT * ${commonQuery} ORDER BY createddate LIMIT $2 OFFSET $3`;

    const totalResult = await queryItems(countQuery, [`%${searchTerm}%`]);
    const itemsResult = await queryItems(itemsQuery, [`%${searchTerm}%`, limit, offset]);

    return { totalResult, itemsResult };
}

async function getAccueilItems(limit, offset) {
    const commonQuery = `FROM produits p
                         WHERE p.id_produit NOT IN
                               (SELECT id_produit
                                FROM combinaisons_parts cp
                                WHERE cp.id_produit = p.id_produit)`;
    const countQuery = `SELECT * ${commonQuery}`;
    const itemsQuery = `SELECT * ${commonQuery} ORDER BY createddate LIMIT $1 OFFSET $2`;

    const totalResult = await queryItems(countQuery, []);
    const itemsResult = await queryItems(itemsQuery, [limit, offset]);

    return { totalResult, itemsResult };
}

async function getStockItems(limit, offset) {
    const commonQuery = `FROM produits p`;
    const countQuery = `SELECT * ${commonQuery}`;
    const itemsQuery = `SELECT * ${commonQuery} ORDER BY createddate LIMIT $1 OFFSET $2`;

    const totalResult = await queryItems(countQuery, []);
    const itemsResult = await queryItems(itemsQuery, [limit, offset]);

    // on récupère et ajoute les tailles associées aux produits
    for (let i = 0; i < itemsResult.length; i++) {
        const sizesQuery = `SELECT * FROM dispo_tailles WHERE id_produit=${itemsResult[i].id_produit}`;
        itemsResult[i].tailles = await queryItems(sizesQuery, []);
    }

    return { totalResult, itemsResult };
}

async function getCommandesItems(limit, offset) {
    const countQuery = `SELECT c.id_commande, p.nom_produit, pc.quantite
                        FROM commandes c
                                 JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                 JOIN produits p ON pc.id_produit = p.id_produit
                        ORDER BY c.id_commande;`;
    const itemsQuery = `SELECT c.nom, c.prenom, c.id_commande, p.nom_produit, pc.quantite
                        FROM commandes c
                                 JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                 JOIN produits p ON pc.id_produit = p.id_produit
                        ORDER BY c.id_commande
                        LIMIT $1 OFFSET $2`;

    const totalResult = await queryItems(countQuery, []);
    const itemsResult = await queryItems(itemsQuery, [limit, offset]);

    return { totalResult, itemsResult };
}

async function getCombinaisonsItems(limit, offset) {
    const countQuery = `SELECT *
                        FROM combinaisons`;
    const itemsQuery = `SELECT c.id_combinaison,
                               c.type,
                               c.prix,
                               c.image,
                               p.id_produit,
                               p.nom_produit,
                               p.type_produit,
                               p.marque,
                               p.genre
                        FROM combinaisons c
                                 JOIN combinaisons_parts cp ON c.id_combinaison = cp.id_combi
                                 JOIN produits p ON cp.id_produit = p.id_produit
                        ORDER BY c.id_combinaison, cp.id_partie`;

    const totalResult = await queryItems(countQuery, []);
    const itemsResult = await queryItems(itemsQuery, []);

    return { totalResult, itemsResult };
}

/**
 * Fonction pour récupérer les produits d'un certain type
 * @param type type de produit
 * @param limit la nombre de produits à récupérer
 * @param offset le décalage de pagination
 * @returns {Promise<{totalResult: *, itemsResult: *}>}
 */
async function getDefaultItems(type, limit, offset) {
    const commonQuery = `FROM produits p
                         WHERE type_produit = $1
                           AND p.id_produit NOT IN
                               (SELECT id_produit
                                FROM combinaisons_parts cp
                                WHERE cp.id_produit = p.id_produit)`;
    const countQuery = `SELECT * ${commonQuery}`;
    const itemsQuery = `SELECT * ${commonQuery} ORDER BY createddate LIMIT $2 OFFSET $3`;

    const totalResult = await queryItems(countQuery, [type]);
    const itemsResult = await queryItems(itemsQuery, [type, limit, offset]);

    return { totalResult, itemsResult };
}

async function getPaginatedItems(type, currentPage, searchTerm, limit = 10) {
    const offset = (currentPage - 1) * limit;
    let totalResult;
    let itemsResult;

    try {
        switch (type) {
            case 'search':
                ({totalResult, itemsResult} = await getSearchItems(searchTerm, limit, offset));
                break;
            case 'accueil':
                ({totalResult, itemsResult} = await getAccueilItems(limit, offset));
                break;
            case 'commandes':
                ({totalResult, itemsResult} = await getCommandesItems(limit, offset));
                break;
            case 'combinaisons':
                ({totalResult, itemsResult} = await getCombinaisonsItems(limit, offset));
                break;
            case 'stock':
                ({totalResult, itemsResult} = await getStockItems(limit, offset));
                console.log(itemsResult);
                break;
            default:
                ({totalResult, itemsResult} = await getDefaultItems(type, limit, offset));
        }

        const totalLength = totalResult.length;
        const totalPages = Math.ceil(totalLength / limit);

        let items;
        if (type === 'commandes') {
            items = combineCommandes(itemsResult);
        }
        else if (type === 'combinaisons') {
            items = utils.combineCombinaisons(itemsResult);
        }
        else {
            items = itemsResult;
        }

        return {
            items,
            totalPages,
        };
    } catch (err) {
        console.error(err);
        throw new Error('Internal server error');
    }
}

/**
 *
 * Fonction pour gérer la redirection en fonction du nom de routage
 * @param routeName routage à analyser
 * @param search_input entrée de la recherche si présente
 * @param page numéro de pagination
 * @returns {string}
 */
function getRedirectUrl(routeName, search_input, page) {
    if (routeName === 'search') {
        return `/search?recherche=${encodeURIComponent(search_input)}&page=${page}`;
    }
    else if(routeName === 'accueil'){
        return `/${routeName}?page=${page}`;
    }
}

async function setResLocals(req, res, routeName, items, totalPages, currentPage) {
    res.locals = {
        elements: items,
        totalPages: totalPages,
        currentPage: currentPage,
        activeSession: isAuthentificated(req),
        user: isAuthentificated(req) ? req.session.user : {},
        prixTotal: utils.getPrixTotalCookie(req),
        lieu: routeName
    };

    // on change le routeName pour le bon rendering dans le routage correspondant
    if (routeName === 'accueil' || routeName === 'search' || req.params.type) {
        res.locals.viewName = 'page';
    }
    else {
        res.locals.viewName = routeName;
    }
}

// fonction middleware pour gérer le render des fichiers EJS et la pagination
async function handleRendering(req, res, next) {
    try {
        // on récupère le nom de routage sans le /
        const routeName = req.params.type || req.route.path.slice(1);
        // on récupère le getter de recherche si présent
        const search_input = req.query.recherche || '';

        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect(getRedirectUrl(routeName, search_input, 1));
        }

        // on récupère une partie des données en fonction de la page courage
        const {items, totalPages} = await getPaginatedItems(routeName, currentPage, search_input);
        if (currentPage > totalPages && items.length !== 0) {
            return res.redirect(getRedirectUrl(routeName, search_input, totalPages));
        }

        await setResLocals(req, res, routeName, items, totalPages, currentPage);

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

/**
 * Fonction qui vérifie que le path demandé correspond à une des catégories
 * Redirige vers la page principale sinon
 * @param req
 * @param res
 * @param next
 */
function validateCategory(req, res, next) {
    const allowedCategories = ['pantalons', 'shorts', 'chemises','vestes','pulls','costumes','manteaux','robes','chaussettes'];
    const type = req.params.type;

    if (allowedCategories.includes(type)) {
        next();
    } else {
        res.redirect('/');
    }
}

function isAuthentificated(req){
    return((req.session && req.session.user));
}

function hasRole(requiredRole) {

}

module.exports = {
    validateCategory,
    isAuthentificated,
    hasRole,
    handleRendering,
};