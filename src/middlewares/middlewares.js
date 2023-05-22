const db = require("../database_pool.local");
const utils = require('../utils/utils');
const {getCombinaison, getProduit} = require("../utils/utils");

/**
 * Fonction qui effectue la requête `queryString` avec les paramètres `params`
 * à la base de données
 * @param queryString requête à effectuer
 * @param params paramètres de la requête
 * @returns {Promise<*>} le résultat de la requête
 */
async function queryItems(queryString, params) {
    const result = await db.query(queryString, params);
    return result.rows;
}

/**
 * Fonction qui génère la requête pour le résultat de la barre de recherche
 * @param searchTerm le pattern à chercher
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
 */
async function getSearchItems(searchTerm, limit, offset) {
    const commonQuery = `FROM produits p
                         WHERE LOWER(nom_produit) LIKE LOWER($1)
                           AND p.id_produit NOT IN
                               (SELECT id_produit
                                FROM combinaisons_parts cp
                                WHERE cp.id_produit = p.id_produit)`;
    const countQuery = `SELECT * ${commonQuery}`;
    const itemsQuery = `SELECT * ${commonQuery} ORDER BY createddate 
                        LIMIT $2 OFFSET $3`;

    const totalResult = await queryItems(countQuery, [`%${searchTerm}%`]);
    const itemsResult = await queryItems(itemsQuery,
        [`%${searchTerm}%`, limit, offset]);

    return { totalResult, itemsResult };
}

/**
 * Fonction qui génère la requête pour la page d'accueil
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
 */
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

/**
 * Fonction qui génère la requête pour la gestion du stock
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
 */
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

async function getProduitCommande(idProduitCommande) {
    const produitCommande = `SELECT * FROM produit_commande pc
                                 WHERE pc.id_produit_commande = $1`;
    const produitCommandeRes = await queryItems(produitCommande, [idProduitCommande]);
    const produitId = produitCommandeRes[0].id_produit;
    const accessoireId = produitCommandeRes[0].id_accessoire;

    // on récupère seulement un élément car on attend un seul produit
    const produitRes = (await utils.getProduit(produitId))[0];
    let accessoireRes;
    if(accessoireId !== null){
        // on récupère seulement un élément car on attend un seul accessoire
        accessoireRes = (await utils.getSpecificAccessoires(accessoireId))[0];
    }
    return {
        id_produit_commande: produitCommandeRes[0].id_produit_commande,
        produit: produitRes,
        accessoire: accessoireRes,
        taille: produitCommandeRes[0].taille
    };
}

async function getCommandeItems(id_commande) {
    const commandeQuery = `SELECT *
                           FROM commandes c
                           WHERE c.id_commande = $1`;
    const combinaisonCommande = `SELECT id_combinaison,
                                        id_produit_commande1,
                                        id_produit_commande2,
                                        id_produit_commande3,
                                        quantite
                                 FROM combinaisons_commandes
                                 WHERE id_commande = $1`;
    const produitsCommande = `SELECT quantite, id_produit_commande
                              FROM produits_uniques_commandes
                              WHERE id_commande = $1`;
    const commandeResult = await queryItems(commandeQuery,[id_commande]);
    const combinaisonsResult = await queryItems(combinaisonCommande, [id_commande]);
    const produitsResult = await queryItems(produitsCommande, [id_commande]);
    commandeResult.combis = [];
    commandeResult.produits = [];

    // If there are combinaisonResults, fetch the products and add them to the array
    for (const combi of combinaisonsResult) {
        const produit1 = await getProduitCommande(combi.id_produit_commande1);
        const produit2 = await getProduitCommande(combi.id_produit_commande2);
        const produit3 = await getProduitCommande(combi.id_produit_commande3);
        const quantite = combi.quantite;
        commandeResult.combis.push({produit1,produit2,produit3,quantite});
    }
    // If there are produitsResults, add them to the array
    for (const prod of produitsResult) {
        const produit = await getProduitCommande(prod.id_produit_commande);
        const quantite = prod.quantite;
        commandeResult.produits.push({produit,quantite})
    }
    // console.log(commandeResult.produits);

    return commandeResult;
}

/**
 * Fonction qui génère la requête pour la gestion des commandes
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
 */
async function getCommandesItems(limit, offset) {
    const countQuery = `SELECT COUNT(DISTINCT id_commande) FROM commandes WHERE NOT archived`;
    const commandesQuery = `SELECT id_commande FROM commandes c
                        WHERE NOT archived ORDER BY c.id_commande DESC
                        LIMIT $1 OFFSET $2`;

    const totalResult = await queryItems(countQuery, []);
    const commandesResult = await queryItems(commandesQuery, [limit, offset]);

    let itemsResult = [];
    for (let commande of commandesResult) {
        let tempRes = await getCommandeItems(commande.id_commande);
        itemsResult.push(tempRes);
    }

    return { totalResult, itemsResult };
}

/**
 * Fonction qui génère la requête pour la page de la combinaison
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
 */
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
    let itemsResult = await queryItems(itemsQuery, []);

    itemsResult = utils.combineCombinaisons(itemsResult);

    return { totalResult, itemsResult };
}

/**
 * Fonction qui génère la requête pour chaque type de produit
 * @param type type de produit
 * @param limit le nombre d'éléments à récupérer pour la pagination
 * @param offset le décalage en fonction de la page courante
 * @returns {Promise<{totalResult: *, itemsResult: *}>} résultat de la requête
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

/**
 * Fonction qui retourne les données en fonction de la page courante
 * @param type type de données demandées
 * @param currentPage la page courante
 * @param searchTerm le terme cherché s'il s'agit du type recherche
 * @param limit le nombre de produits demandés, 10 initialement
 * @returns {Promise<{totalPages: number, itemsResult}>} les données récupérées
 */
async function getPaginatedItems(type, currentPage, searchTerm, limit = 10) {
    // on calcule le décalage en fonction de la page courante et
    // le nombre d'éléments à afficher
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
                break;
            default:
                ({totalResult, itemsResult} = await getDefaultItems(type, limit, offset));
        }

        // on calcule le nombre d'éléments dans la requête pour connaître
        // le nombre total de pages
        const totalLength = totalResult.length;
        const totalPages = Math.ceil(totalLength / limit);

        return {
            itemsResult,
            totalPages,
        };
    } catch (err) {
        console.error(err);
        throw new Error('Internal server error');
    }
}

/**
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
    else{
        return `/${routeName}?page=${page}`;
    }
}

/**
 * Fonction qui met à jour les variables locales de la réponse res
 * @param req
 * @param res
 * @param routeName le path d'origine
 * @param itemsResult les données récupérées
 * @param totalPages le nombre total de pages
 * @param currentPage la page courante
 * @returns {Promise<void>}
 */
async function setResLocals(req, res, routeName, itemsResult, totalPages, currentPage) {
    res.locals = {
        elements: itemsResult,
        totalPages: totalPages,
        currentPage: currentPage,
        activeSession: isAuthentificated(req),
        user: isAuthentificated(req) ? req.session.user : {},
        prixTotal: utils.getPrixTotalCookie(req),
        lieu: routeName
    };

    // on change le routeName pour afficher le bon fichier EJS
    if (routeName === 'accueil' || routeName === 'search' || req.params.type) {
        res.locals.viewName = 'page';
    }
    else {
        res.locals.viewName = routeName;
    }
}

/**
 * Fonction qui gère le render des fichiers EJS couplé à la pagination
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
async function handleRendering(req, res, next) {
    try {
        // on récupère le nom de routage sans le '/'
        const routeName = req.params.type || req.route.path.slice(1);
        // on récupère le getter de recherche si présent
        const search_input = req.query.recherche || '';

        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect(getRedirectUrl(routeName, search_input, 1));
        }

        // on récupère une partie des données en fonction de la page courage
        const {itemsResult, totalPages} = await getPaginatedItems(routeName, currentPage, search_input);
        if (currentPage > totalPages && totalPages !== 0) {
            return res.redirect(getRedirectUrl(routeName, search_input, totalPages));
        }

        await setResLocals(req, res, routeName, itemsResult, totalPages, currentPage);

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

/**
 * Fonction qui vérifie que le path demandé correspond à une des catégories
 * et redirige vers la page principale sinon
 * @param req
 * @param res
 * @param next
 */
function validateCategory(req, res, next) {
    const allowedCategories = ['pantalons', 'shorts', 'chemises','vestes',
        'pulls','costumes','manteaux','robes','chaussettes'];
    const type = req.params.type;

    if (allowedCategories.includes(type)) {
        next();
    } else {
        res.redirect('/');
    }
}

/**
 * Fonction qui vérifie dans la session que l'utilisateur est connecté
 * @param req
 * @returns {*} un booléen
 */
function isAuthentificated(req){
    return((req.session && req.session.user));
}

async function verifStocks(panier) {
        const stockDisponible = {};
        const panierFinal = [];

        for (const element of panier) {
            if (element.type === 'produit') {
                const key = `${element.produitId}_${element.taille}`;

                if (!stockDisponible[key]) {
                    const reqDispo = `SELECT quantite FROM dispo_tailles WHERE id_produit = ${element.produitId} AND taille = '${element.taille}'`;
                    const resultDispo = await db.query(reqDispo);

                    if (resultDispo.rows.length > 0) {
                        stockDisponible[key] = resultDispo.rows[0].quantite;
                    } else {
                        stockDisponible[key] = 0;
                    }
                }

                if (element.quantity <= stockDisponible[key]) {
                    stockDisponible[key] -= element.quantity;
                    panierFinal.push(element);
                }
            } else if (element.type === 'combinaison') {
                let isAvailable = true;

                for (const produit of element.produits) {
                    const key = `${produit.produitId}_${produit.taille}`;

                    if (!stockDisponible[key]) {
                        const reqDispo = `SELECT quantite FROM dispo_tailles WHERE id_produit = ${produit.produitId} AND taille = '${produit.taille}'`;
                        const resultDispo = await db.query(reqDispo);

                        if (resultDispo.rows.length > 0) {
                            stockDisponible[key] = resultDispo.rows[0].quantite;
                        } else {
                            stockDisponible[key] = 0;
                        }
                    }

                    if (element.quantity > stockDisponible[key]) {
                        isAvailable = false;
                        break;
                    }
                }

                if (isAvailable) {
                    for (const produit of element.produits) {
                        const key = `${produit.produitId}_${produit.taille}`;
                        stockDisponible[key] -= element.quantity;
                    }

                    panierFinal.push(element);
                }
            }
        }

        return panierFinal;
}

function hasRole(requiredRole) {

}

module.exports = {
    validateCategory,
    isAuthentificated,
    verifStocks,
    hasRole,
    handleRendering,
};