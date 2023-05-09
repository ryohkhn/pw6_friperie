const server = require('./express_config')
const db = require('./database_pool.local');

const authRoutes = require('./routing/authRoutes');
const middlewares = require('./middlewares/middlewares');
const cookieParser = require('cookie-parser');
const session = require('express-session');

server.use(session({
    secret: 'secret',
    resave: false,
    cookie: {maxAge : 86400000},
    saveUninitialized: false
}));

// routage pour l'authentification
server.use(authRoutes);

server.use(cookieParser());

server.get('/',(req, res) => {
    res.redirect('/accueil');
});

async function getAccessoires() {
    const accessoiresReq = `SELECT *
                            FROM accessoires`;
    const result = await db.query(accessoiresReq);
    return result.rows;
}

async function getSpecificAccessoires(accessoireId) {
    const accessoiresReq = `SELECT *
                            FROM accessoires
                            WHERE id_accessoire = $1`;
    const result = await db.query(accessoiresReq, [accessoireId]);
    return result.rows;
}

async function getProduit(productId) {
    const request = `SELECT *
                     FROM produits
                     WHERE id_produit = $1`;
    const result = await db.query(request, [productId]);
    return result.rows;
}

async function getCombinaison(combiId) {
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

function getPrixTotalCookie(req){
    return req.cookies.prixTotal ? parseFloat(req.cookies.prixTotal) : 0;
}

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

function combineCombinaisons(rows) {
    const combinaisons = {};
    rows.forEach(row => {
        if (!combinaisons[row.id_combinaison]) {
            combinaisons[row.id_combinaison] = {
                id_combinaison: row.id_combinaison,
                prix: row.prix,
                type: row.type,
                image: row.image,
                products: []
            };
        }
        combinaisons[row.id_combinaison].products.push({
            id_produit: row.id_produit,
            nom_produit: row.nom_produit,
            type_produit: row.type_produit,
            marque: row.marque,
            image_prod: row.prodimg,
            genre: row.genre
        });
    });
    return Object.values(combinaisons);
}

async function getPaginatedItems(type, currentPage, searchTerm, limit = 10) {
    // on calcule l'offset de la requête SQL en fonction de la page courante et de la limite
    const offset = (currentPage - 1) * limit;
    let totalResult;
    let itemsResult;

    try {
        if (type === 'search') {
            totalResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE LOWER(nom_produit) LIKE LOWER($1)
                                            AND p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)`, [`%${searchTerm}%`]);

            itemsResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE LOWER(nom_produit) LIKE LOWER($1)
                                            AND p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)
                                          ORDER BY createddate
                                          LIMIT $2 OFFSET $3 `,
                [`%${searchTerm}%`, limit, offset]);
        }
        else if (type === 'accueil') {
            totalResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)`);

            itemsResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)
                                          ORDER BY createddate
                                          LIMIT $1 OFFSET $2`, [limit, offset]);
        }
        else if (type === 'commandes') {
            totalResult = await db.query(`SELECT c.id_commande, p.nom_produit, pc.quantite
                                          FROM commandes c
                                                   JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                                   JOIN produits p ON pc.id_produit = p.id_produit
                                          ORDER BY c.id_commande;`);
            itemsResult = await db.query(`SELECT c.nom, c.prenom, c.id_commande, p.nom_produit, pc.quantite
                                          FROM commandes c
                                                   JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                                   JOIN produits p ON pc.id_produit = p.id_produit
                                          ORDER BY c.id_commande
                                          LIMIT $1 OFFSET $2`, [limit, offset]);
        }
        else if (type === 'combinaisons') {
            totalResult = await db.query(`SELECT *
                                          FROM combinaisons`);
            itemsResult = await db.query(`SELECT c.id_combinaison,
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
                                          ORDER BY c.id_combinaison, cp.id_partie`);
        }
        else {
            totalResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE type_produit = $1
                                            AND p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)`, [type]);
            itemsResult = await db.query(`SELECT *
                                          FROM produits p
                                          WHERE type_produit = $1
                                            AND p.id_produit NOT IN
                                                (SELECT id_produit
                                                 FROM combinaisons_parts cp
                                                 WHERE cp.id_produit = p.id_produit)
                                          ORDER BY createddate
                                          LIMIT $2 OFFSET $3`, [type, limit, offset]);
        }

        const totalLength = totalResult.rows.length;
        const totalPages = Math.ceil(totalLength / limit);
        let items;
        if(type === 'commandes') {
            items = combineCommandes(itemsResult.rows);
        }
        else if(type === 'combinaisons') {
            items = combineCombinaisons(itemsResult.rows);
        }
        else{
            items = itemsResult.rows;
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

// fonction pour gérer la redirection en fonction du nom de routage
function getRedirectUrl(routeName, search_input, page) {
    if (routeName === 'search') {
        return `/search?recherche=${encodeURIComponent(search_input)}&page=${page}`;
    }
    else if(routeName === 'accueil'){
        return `/${routeName}?page=${page}`;
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

        res.locals = {
            elements: items,
            totalPages: totalPages,
            currentPage: currentPage,
            prixTotal: getPrixTotalCookie(req),
        };

        // on change le routeName pour le bon rendering dans le routage correspondant
        if (routeName === 'accueil' || routeName === 'search' || req.params.type) {
            res.locals.viewName = 'page';
        }
        else {
            res.locals.viewName = routeName;
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

server.get('/accueil', handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

server.get('/combinaisons', handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

server.get('/commandes', handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

server.get('/search', handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/*
server.get('/accueil', async (req, res) => {
    try {
        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect('/accueil?page=1');
        }

        const {items, totalPages} = await getPaginatedItems('all',currentPage ,'');
        if (currentPage > totalPages) {
            return res.redirect('/accueil?page=' + totalPages);
        }

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage,prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/combinaisons', async (req, res) => {
    try {
        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect('/combinaisons?page=1');
        }

        const {items, totalPages} = await getPaginatedItems('combinaisons',currentPage ,'');
        if (currentPage > totalPages) {
            return res.redirect('/combinaisons?page=' + totalPages);
        }

        res.render('combinaisons.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage,prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/commandes', async (req, res) => {
    try {
        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect('/commandes?page=1');
        }

        const {items, totalPages} = await getPaginatedItems('orders',currentPage ,'');

        if (currentPage > totalPages && items.length !== 0) {
            return res.redirect('/commandes?page=' + totalPages);
        }

        res.render('commandes.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage,prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// routage du formulaire de la barre de recherche
server.get('/search',async (req, res) => {
    // on récupère la valeur du formulaire
    const search_input = req.query.recherche;
    try {
        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect('/search?recherche=' + encodeURIComponent(search_input) + '&page=1');
        }

        // on récupère les informations de la base de données en fonciton de la page courante et du formulaire
        const {items, totalPages} = await getPaginatedItems('search',currentPage,search_input);
        if (currentPage > totalPages && items.length !== 0) {
            return res.redirect('/search?recherche=' + encodeURIComponent(search_input) + '&page=' + totalPages);
        }

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage,prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});
 */

function getCookiePanierIndex(panier, produit) {
    return panier.findIndex(produitPanier => produitPanier.produitId === produit.produitId
        && produitPanier.size === produit.size && produitPanier.accessoireId === produit.accessoireId);
}

function updatePanier(panier, newProduit) {
    const index = getCookiePanierIndex(panier, newProduit);

    if (index !== -1) {
        // augment la quantité si existant
        panier[index].quantity += newProduit.quantity;
    }
    else {
        // Add the new product to the basket data
        panier.push(newProduit);
    }

    return panier;
}

function deleteProduit(panier, deleteProduct) {
    const index = getCookiePanierIndex(panier, deleteProduct);

    if (index !== -1) {
        panier[index].quantity -= deleteProduct.quantity;
        if(panier[index].quantity<1){
            panier.splice(index,1);
        }
    }

    return panier;
}

// gère la requête AJAX de l'ajout au panier d'un produit
server.post('/ajoutePanierAjax', function(req, res) {
    const id = req.body.id_produit;
    const valTaille = req.body.taille;
    const accessoireId = req.body.accessoire;

    // on récupère le panier courant
    const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    const produit = {
        produitId: id,
        size: valTaille,
        quantity: 1,
        accessoireId: accessoireId,
    };

    // on ajoute le nouveau produit au cookie
    const updatedPanier = updatePanier(currentPanier, produit);

    // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    // Return the product price instead of redirecting
    const productPrice = 0;
    res.json({ price: productPrice });
});

server.post('/ajoutePanierCombiAjax', function(req, res) {
    console.log(req.body);
    /*
    const id = req.body.id_produit;
    const valTaille = req.body.taille;
    const accessoireId = req.body.accessoire;

    // on récupère le panier courant
    const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    const produit = {
        produitId: id,
        size: valTaille,
        quantity: 1,
        accessoireId: accessoireId,
    };

    // on ajoute le nouveau produit au cookie
    const updatedPanier = updatePanier(currentPanier, produit);

    // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    // Return the product price instead of redirecting
    const productPrice = 0;
    res.json({ price: productPrice });
     */
});

server.post('/delete-basket', function(req, res) {
    const id_produit = req.body.id_produit;
    const valTaille = req.body.size;
    const accessoireId = req.body.id_accessoire;
    const prix = req.body.prix;

     // on récupère le panier courant
     const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

     const produit = {
         produitId: id_produit,
         size: valTaille,
         quantity: 1,
         accessoireId: accessoireId,
     };
 
     // on ajoute le nouveau produit au cookie
    const updatedPanier = deleteProduit(currentPanier, produit);
     // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    const currentPrixTotal = getPrixTotalCookie(req);
    const newPrixTotal = currentPrixTotal - parseFloat(prix);
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    const productPrice = 0;
    res.json({ price: productPrice });
});

server.post('/update-total-Ajax', function (req, res) {
    const prix = parseFloat(req.body.prix);

    const currentPrixTotal = getPrixTotalCookie(req);
    //  on récupère le prix total du panier courrant
    const newPrixTotal = currentPrixTotal + prix;

    // on met à jour le cookie
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    // on retourne au client le nouveau prix total pour le mettre à jour sur la page
    res.json({newTotal: newPrixTotal});
});

server.get('/panier', async (req, res) => {
    try {
        const panier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

        if (panier.length === 0) {
            res.render('panier.ejs', {elements: [],prixTotal: getPrixTotalCookie(req)});
        }
        else {
            const tab = [];

            for (const produit of panier) {
                // on récupère le produit correspondant
                const resultatProduit = await getProduit(produit.produitId);

                let resultatAccessoire;
                if (produit.accessoireId !== "-1") {
                    resultatAccessoire = await getSpecificAccessoires(produit.accessoireId);
                }
                else {
                    resultatAccessoire = [{ id_accessoire: -1 }];
                }

                // on combine les éléments du premier tableau avec ceux du dexuième ainsi que le reste des éléments
                const element = {
                    ...resultatProduit[0],
                    ...resultatAccessoire[0],
                    size: produit.size,
                    quantity: produit.quantity,
                };
                console.log(element);

                tab.push(element);
            }
            res.render('panier.ejs', {elements: tab, prixTotal: getPrixTotalCookie(req)});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/paiement', async (req, res) => {
    if(req.session && req.session.userInfos){
        res.render("paiement.ejs",{activeSession:true, userinfos:req.session.userInfos, prixTotal: getPrixTotalCookie(req), erreurs:{}});
    }else{
        res.render("paiement.ejs",{activeSession:false, prixTotal: getPrixTotalCookie(req), erreurs:{}});
    }
});

server.get('/produit/:num', async (req, res) => {
    try {
        const productId = req.params.num;

        const result = await getProduit(productId);
        const result2 = await getAccessoires();
        const result3 = await getTaillesProduit(productId);
        const result4 = await getAccessoireLie(productId);

        res.render('produit.ejs', {idprod: productId,
            elements: result, accessoires: result2, tailles:result3, accLie:result4, prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/combinaison/:num', async (req, res) => {
    try {
        const combiId = req.params.num;

        const result = await getCombinaison(combiId);
        const combinedCombinaison = combineCombinaisons(result);
        for (const produit of combinedCombinaison[0].products) {
            produit.tailles = await getTaillesProduit(produit.id_produit);
            const accLie = await getAccessoireLie(produit.id_produit);
            let acc = [];
            if(accLie.length>0){
                acc = await getSpecificAccessoires(accLie[0].id_accessoire);
            }
            produit.accessoire = acc;
        }
        res.render('combinaisons_produits.ejs', {combinedCombinaison: combinedCombinaison[0],prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.post('/delete-order', async (req, res) => {
    const id_commande = req.body.id_commande;

    const requete = `
        WITH deleted_commandes AS (
            DELETE FROM commandes WHERE id_commande = $1 RETURNING id_commande)
        DELETE
        FROM produits_commandes
        WHERE id_commande IN (SELECT id_commande FROM deleted_commandes);
    `;

    try {
        await db.query(requete, [id_commande]);
        res.json({success: true});
    } catch (error) {
        console.error('Erreur suppression commande:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// routage sur les catégories de vêtements
server.get('/:type', middlewares.validateCategory, handleRendering, (req, res) => {
    res.render(`${res.locals.viewName}.ejs`, res.locals);
});

/*

// routage sur les catégories de vêtements
server.get('/:type',middlewares.validateCategory,async (req, res) => {
    try {
        // on récupère la page courante
        const currentPage = parseInt(req.query.page) || 1;
        if (currentPage < 1) {
            return res.redirect(`/${req.params.type}?page=1`);
        }

        const {items, totalPages} = await getPaginatedItems(req.params.type,currentPage,'');
        if (currentPage > totalPages) {
            return res.redirect(`/${req.params.type}?page=${totalPages}`);
        }

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage,prixTotal: getPrixTotalCookie(req)});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});
 */