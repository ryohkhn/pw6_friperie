const { server, express } = require('../express_config');
const db = require('../database_pool.local');
const middlewares = require("../middlewares/middlewares");
const utils = require("../utils/utils");

const router = express.Router();

async function getAccessoires() {
    const accessoiresReq = `SELECT *
                            FROM accessoires`;
    const result = await db.query(accessoiresReq);
    return result.rows;
}

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

async function getTaillesProduit(productId) {
    const disposReq = `SELECT *
                       FROM dispo_tailles
                       WHERE id_produit = $1`;
    const result = await db.query(disposReq, [productId]);
    return result.rows;
}

async function getAccessoireLie(productId) {
    const accLieReq = `SELECT *
                       FROM produits_accessoires
                       WHERE id_produit = $1`;
    const result = await db.query(accLieReq, [productId]);
    return result.rows;
}

async function processCookieProduit(produit) {
    const resultatProduit = await utils.getProduit(produit.produitId);

    let resultatAccessoire;
    if (produit.accessoireId !== '') {
        resultatAccessoire = await utils.getSpecificAccessoires(produit.accessoireId);
    }
    else {
        resultatAccessoire = [{ id_accessoire: '' }];
    }

    // Combine the elements of the first array with those of the second as well as the rest of the elements
    return {
        ...resultatProduit[0],
        ...resultatAccessoire[0],
        type: 'produit',
        taille: produit.taille,
        quantity: produit.quantity,
    };
}

router.get('/',(req, res) => {
    res.redirect('/accueil');
});

router.get('/accueil', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

router.get('/combinaisons', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

router.get('/commandes', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

router.get('/search', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

router.get('/stock', middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

router.get('/panier', async (req, res) => {
    try {
        const panier = req.cookies.panier ? JSON.parse(req.cookies.panier) : {};

        if (panier.length === 0) {
            res.render('panier.ejs', {
                pbStock:false,
                elements: [],
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: middlewares.isAuthentificated(req),
                user: middlewares.isAuthentificated(req) ? req.session.user : {}
            });
        }
        else {
            const tab = [];
            console.log(panier);
            const verifPanier = await middlewares.verifStocks(panier);
            let stock=false;
            if(panier.length !== verifPanier.length){
                res.cookie('panier', JSON.stringify(verifPanier), {maxAge: 86400000 });
                // Calcul du nouveau prix total
                //const currentPrixTotal = utils.getPrixTotalCookie(req);
                //const newPrixTotal = currentPrixTotal - parseFloat(prix);
                //res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});
                stock=true;
            }

            for (const element of verifPanier) {
                if (element.type === 'produit') {
                    const processedProduit = await processCookieProduit(element);
                    tab.push(processedProduit);
                }
                else if (element.type === 'combinaison') {
                    const produits = [];
                    const combi = await utils.getCombinaison(element.combinaisonId);
                    element.nom = combi[0].type;
                    element.image = combi[0].image;
                    element.prix = combi[0].prix;

                    for (const produit of element.produits) {
                        const processedProduit = await processCookieProduit(produit);
                        produits.push(processedProduit);
                    }
                    const combinaisonElement = { ...element, produits };
                    tab.push(combinaisonElement);
                }
            }
            res.render('panier.ejs', {
                pbStock:stock,
                elements: tab,
                prixTotal: utils.getPrixTotalCookie(req),
                activeSession: middlewares.isAuthentificated(req),
                user: middlewares.isAuthentificated(req) ? req.session.user : {}
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

router.get('/paiement', async (req, res) => {
    res.render("paiement.ejs",{
        activeSession: middlewares.isAuthentificated(req),
        user: middlewares.isAuthentificated(req) ? req.session.user : {},
        prixTotal: utils.getPrixTotalCookie(req),
        erreurs:{}
    });
});

router.get('/produit/:num', async (req, res) => {
    try {
        const productId = req.params.num;

        const result = await utils.getProduit(productId);
        const result2 = await getAccessoires();
        const result3 = await getTaillesProduit(productId);
        const result4 = await getAccessoireLie(productId);

        res.render('produit.ejs', {idprod: productId,
            elements: result, accessoires: result2,
            tailles:result3, accLie:result4,
            prixTotal: utils.getPrixTotalCookie(req),
            activeSession: middlewares.isAuthentificated(req),
            user: middlewares.isAuthentificated(req) ? req.session.user : {}});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

router.get('/combinaison/:num', async (req, res) => {
    try {
        const combiId = req.params.num;

        const result = await getCombinaisonAll(combiId);
        const combinedCombinaison = utils.combineCombinaisons(result);
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
            activeSession: middlewares.isAuthentificated(req),
            user: middlewares.isAuthentificated(req) ? req.session.user : {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// routage sur les catégories de vêtements
router.get('/:type', middlewares.validateCategory, middlewares.handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

module.exports = router;