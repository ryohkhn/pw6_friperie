const { server, express } = require('../express_config');
const db = require('../database_pool.local');
const middlewares = require("../middlewares/middlewares");
const utils = require("../utils/utils");

const router = express.Router();

/**
 * Fonction qui retourne tous les accessoires de la base de données.
 * @returns {Promise<*>} les colonnes résultats de la requête
 */
async function getAccessoires() {
    const accessoiresReq = `SELECT *
                            FROM accessoires`;
    const result = await db.query(accessoiresReq);
    return result.rows;
}

/**
 * Fonction qui retourne tous les éléments d'une combinaison.
 * @param combiId l'id de la combinaison
 * @returns {Promise<*>} les colonnes résultats de la requête
 */
async function getCombinaisonAll(combiId) {
    const request = `SELECT c.id_combinaison,
                            c.type,
                            c.prix,
                            c.image,
                            p.id_produit,
                            p.nom_produit,
                            p.type_produit,
                            p.marque,
                            p.genre,
                            p.image AS prodimg
                     FROM combinaisons c
                              JOIN combinaisons_parts cp ON c.id_combinaison = cp.id_combi
                              JOIN produits p ON cp.id_produit = p.id_produit
                     WHERE c.id_combinaison = $1
                     ORDER BY c.id_combinaison, cp.id_partie`;
    const result = await db.query(request, [combiId]);
    return result.rows;
}

/**
 * Fonction qui retourne toutes les tailles d'un produit.
 * @param productId l'id du produit
 * @returns {Promise<*>} les colonnes résultats de la requête
 */
async function getTaillesProduit(productId) {
    const disposReq = `SELECT *
                       FROM dispo_tailles
                       WHERE id_produit = $1 AND quantite <> 0`;
    const result = await db.query(disposReq, [productId]);
    return result.rows;
}

/**
 * Fonction qui retourne l'accessoire lié à un produit.
 * @param productId l'id du produit
 * @returns {Promise<*>} les colonnes résultats de la requête
 */
async function getAccessoireLie(productId) {
    const accLieReq = `SELECT *
                       FROM produits_accessoires
                       WHERE id_produit = $1`;
    const result = await db.query(accLieReq, [productId]);
    return result.rows;
}

/**
 * Fonction qui ajoute un produit au cookie du panier
 * @param produit le produit à ajouter
 * @returns {Promise<*&{taille: *, quantity: (number|*), type: string, id_accessoire: string}>}
 * Un objet composé du produit, son accessoire, son type, sa taille et quantité
 */
async function processCookieProduit(produit) {
    const resultatProduit = await utils.getProduit(produit.produitId);

    // Ajoute les informations d'un accessoire si le produit est ajouté
    // au panier avec un accessoire
    let resultatAccessoire;
    if (produit.accessoireId !== '') {
        resultatAccessoire = await utils.getSpecificAccessoires(produit.accessoireId);
    }
    else {
        resultatAccessoire = [{ id_accessoire: '' }];
    }

    // Combine les éléments du premier tableau avec ceux du deuxième, le type
    // la taille et la quantité
    return {
        ...resultatProduit[0],
        ...resultatAccessoire[0],
        type: 'produit',
        taille: produit.taille,
        quantity: produit.quantity,
    };
}

/**
 * Routage de `/` qui redirige vers celui de l'accueil
 */
router.get('/',(req, res) => {
    res.redirect('/accueil');
});

/**
 * Routage de l'accueil qui affiche tous les produits de la base de données
 */
router.get('/accueil', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/**
 * Routage des combinaisons qui affiche chaque combinaisons de la base de données
 */
router.get('/combinaisons', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/**
 * Routage des commandes qui affiche chaque commande pour le gérant
 */
router.get('/commandes', middlewares.isGerant,middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/**
 * Routage de la barre de recherche qui affiche les produits qui contiennent
 * le mot recherché
 */
router.get('/search', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/**
 * Routage de la gestion du stock des produits pour le gérant
 */
router.get('/stock', middlewares.isGerant,middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/**
 * Routage du panier qui affiche tous éléments du cookie panier
 */
router.get('/panier', async (req, res) => {
    try {
        // On récupère les éléments du panier courant
        const panier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

        // Si le panier est vide, on affiche la page panier avec un tableau vide.
        if (panier.length === 0) {
            res.render('panier.ejs', {
                pbStock:false,
                elements: [],
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: utils.isAuthentificated(req),
                user: utils.isAuthentificated(req) ? req.session.user : {}
            });
        }
        else {
            const tab = [];
            // On vérifie le stock disponible et modifie le panier en fonction.
            const verifPanier = await middlewares.verifStocks(panier);
            let stock=false;
            res.cookie('panier', JSON.stringify(verifPanier), {maxAge: 86400000 });
            if(panier.length !== verifPanier.length){
                stock=true;
            }
            var newPrixTotal=0;
            // Pour chaque élément du cookie panier, on va chercher les
            // valeurs dont on a besoin dans la base de données et ajouter
            // chaque produit et chaque combi au tableau.
            for (const element of verifPanier) {
                if (element.type === 'produit') {
                    const processedProduit = await processCookieProduit(element);
                    tab.push(processedProduit);
                    newPrixTotal+=(processedProduit.prix*processedProduit.quantity);
                }
                else if (element.type === 'combinaison') {
                    const produits = [];
                    const combi = await utils.getCombinaison(element.combinaisonId);
                    element.nom = combi[0].type;
                    element.image = combi[0].image;
                    element.prix = combi[0].prix;
                    newPrixTotal+=(combi[0].prix * element.quantity);

                    for (const produit of element.produits) {
                        const processedProduit = await processCookieProduit(produit);
                        produits.push(processedProduit);
                    }
                    const combinaisonElement = { ...element, produits };
                    tab.push(combinaisonElement);
                }
            }
            res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});
            // On affiche le panier avec les bonnes informations 
            res.render('panier.ejs', {
                pbStock:stock,
                elements: tab,
                prixTotal: newPrixTotal,
                activeSession: utils.isAuthentificated(req),
                user: utils.isAuthentificated(req) ? req.session.user : {}
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

/**
 * Routage pour le formulaire de paiement.
 */
router.get('/paiement', async (req, res) => {
    const panier = utils.getPrixTotalCookie(req);

    if (panier === 0) {
        res.redirect('/');
        return;
    }
    res.render("paiement.ejs",{
        activeSession: utils.isAuthentificated(req),
        user: utils.isAuthentificated(req) ? req.session.user : {},
        prixTotal: utils.getPrixTotalCookie(req),
        erreurs:{}
    });
});

/**
 * Routage sur chaque produit de paramètre `num`.
 * Num correspond à l'id du produit dans la base de données.
 */
router.get('/produit/:num', async (req, res) => {
    try {
        const productId = req.params.num;

        // On récupère le produit, l'accessoire choisi ou lié ainsi que
        // les tailles disponibles
        const result = await utils.getProduit(productId);
        const result2 = await getAccessoires();
        const result3 = await getTaillesProduit(productId);
        const result4 = await getAccessoireLie(productId);

        res.render('produit.ejs', {idprod: productId,
            elements: result, accessoires: result2,
            tailles:result3, accLie:result4,
            prixTotal: utils.getPrixTotalCookie(req),
            activeSession: utils.isAuthentificated(req),
            user: utils.isAuthentificated(req) ? req.session.user : {}});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

/**
 * Routage sur chaque combinaison de paramètre `num`.
 * Num correspond à l'id de la combinaison dans la base de données.
 */
router.get('/combinaison/:num', async (req, res) => {
    try {
        const combiId = req.params.num;

        // On récupère tous les éléments qui composent la combinaison
        const result = await getCombinaisonAll(combiId);
        // On formate les résultats de la requête
        const combinedCombinaison = utils.combineCombinaisons(result);
        // Pour chaque produit on ajoute les tailles disponibles
        // ainsi l'accessoire lié si présent
        for (const produit of combinedCombinaison[0].products) {
            produit.tailles = await getTaillesProduit(produit.id_produit);
            const accLie = await getAccessoireLie(produit.id_produit);
            let acc = [];
            if(accLie.length>0){
                acc = await utils.getSpecificAccessoires(accLie[0].id_accessoire);
            }
            produit.accessoire = acc;
        }
        res.render('combinaisons_produits.ejs', {
            combinedCombinaison: combinedCombinaison[0],
            prixTotal: utils.getPrixTotalCookie(req),
            activeSession: utils.isAuthentificated(req),
            user: utils.isAuthentificated(req) ? req.session.user : {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

/**
 * Routage sur les catégories de vêtements, le middleware `validateCategory`
 * redirige vers l'accueil s'il ne s'agit pas d'une catégorie connnue
 */
router.get('/:type', middlewares.validateCategory, middlewares.handleRendering,
 (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

module.exports = router;