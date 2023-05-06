const server = require('./express_config')
const db = require('./database_pool.local');

const authRoutes = require('./routing/authRoutes');
const middlewares = require('./middlewares/middlewares');
const cookieParser = require('cookie-parser');
const session = require('express-session');

server.use(session({
    secret: 'secret',
    resave:false,
    cookie: {maxAge : 86400000},
    saveUninitialized: false
}));

// routage pour l'authentification
server.use(authRoutes);

server.use(cookieParser());

server.get('/',(req, res) => {
    res.redirect('/accueil');
});

function getPrixTotalCookie(req){
    return req.cookies.prixTotal ? parseFloat(req.cookies.prixTotal) : 0;
}

function combineCommandes(data) {
    return data.reduce((acc, item) => {
        const existing = acc.find(x => x.id_commande === item.id_commande);

        if (existing) {
            existing.produits.push({nom_produit: item.nom_produit, quantite: item.quantite});
        } else {
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
                type: row.type,
                prix_combi: row.prix,
                products: []
            };
        }
        combinaisons[row.id_combinaison].products.push({
            id_produit: row.id_produit,
            nom_produit: row.nom_produit,
            type_produit: row.type_produit,
            marque: row.marque,
            genre: row.genre,
            prix: row.prix,
        });
    });
    return Object.values(combinaisons);
}

async function getPaginatedItems(type, currentPage, searchTerm, limit = 20) {
    // on calcule l'offset de la requête SQL en fonction de la page courante et de la limite
    const offset = (currentPage - 1) * limit;
    let totalResult;
    let itemsResult;

    try {
        if (type === 'search') {
            totalResult = await db.query(`SELECT * FROM produits
                                               WHERE LOWER(nom_produit) LIKE LOWER($1)`, [`%${searchTerm}%`]);
            itemsResult = await db.query(`SELECT * FROM produits
                                          WHERE LOWER(nom_produit) LIKE LOWER($1) ORDER BY createddate
                                          LIMIT $2 OFFSET $3`, [`%${searchTerm}%`, limit, offset]);
        }
        else if (type === 'all') {
            totalResult = await db.query(`SELECT * FROM produits`);
            itemsResult = await db.query('SELECT * FROM produits ORDER BY createddate LIMIT $1 OFFSET $2', [limit, offset]);
        }
        else if (type === 'orders') {
            totalResult = await db.query(`SELECT c.id_client, c.id_commande, p.nom_produit,pc.quantite
                                          FROM commandes c
                                              JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                              JOIN produits p ON pc.id_produit = p.id_produit
                                          ORDER BY c.id_commande;`);
            itemsResult = await db.query(`SELECT c.id_client, c.id_commande, p.nom_produit,pc.quantite
                                          FROM commandes c
                                              JOIN produits_commandes pc ON c.id_commande = pc.id_commande
                                              JOIN produits p ON pc.id_produit = p.id_produit
                                          ORDER BY c.id_commande LIMIT $1 OFFSET $2`, [limit, offset]);
        }
        else if(type === 'combinaisons') {
            totalResult = await db.query(`SELECT * FROM combinaisons`);
            itemsResult = await db.query(`SELECT c.id_combinaison, c.type, c.prix, cp.id_partie, p.id_produit, p.nom_produit, p.type_produit, p.marque, p.genre
                                  FROM combinaisons c
                                  JOIN combinaisons_parts cp ON c.id_combinaison = cp.id_combi
                                  JOIN produits p ON cp.id_produit = p.id_produit
                                  ORDER BY c.id_combinaison, cp.id_partie
                                  LIMIT $1 OFFSET $2`, [limit, offset]);
        }
        else {
            totalResult = await db.query(`SELECT * FROM produits
                                               WHERE type_produit = $1`, [type]);
            itemsResult = await db.query(`SELECT * FROM produits
                                          WHERE type_produit = $1 ORDER BY createddate
                                          LIMIT $2 OFFSET $3`, [type, limit, offset]);
        }

        const totalLength = totalResult.rows.length;
        const totalPages = Math.ceil(totalLength / limit);
        let items;
        if(type === 'orders') {
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


function updatePanier(panier, newProduit) {
    const index = panier.findIndex(product => product.produitId === newProduit.produitId && product.size === newProduit.size && product.accessoireId === newProduit.accessoireId);

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
    const index = panier.findIndex(product => product.produitId === deleteProduct.produitId && product.size === deleteProduct.size && product.accessoireId === deleteProduct.accessoireId);
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
                const resultatProduit = await db.query(`SELECT * FROM produits WHERE id_produit = $1`,
                    [produit.produitId]);

                // on récupère l'accessoire correspondant
                const resultatAccessoire = await db.query(`SELECT * FROM accessoires WHERE id_accessoire = $1`,
                    [produit.accessoireId]);

                // on combine les éléments du premier tableau avec ceux du dexuième ainsi que le reste des éléments
                const element = {
                    ...resultatProduit.rows[0],
                    ...resultatAccessoire.rows[0],
                    size: produit.size,
                    quantity: produit.quantity,
                };

                tab.push(element);
            }

            res.render('panier.ejs', {elements: tab,prixTotal: getPrixTotalCookie(req)});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/produit/:num', async (req, res) => {
    try {
        const request = `SELECT * FROM produits WHERE id_produit = $1`;
        const result = await db.query(request, [req.params.num]);

        const accessoiresReq = `SELECT * FROM accessoires`;
        const result2 = await db.query(accessoiresReq);

        const disposReq = `SELECT * FROM dispo_tailles WHERE id_produit = $1`;
        const result3 = await db.query(disposReq,[req.params.num]);

        const accLieReq = `SELECT * FROM produits_accessoires WHERE id_produit = $1`;
        const result4 = await db.query(accLieReq,[req.params.num]);

        res.render('produit.ejs', {idprod: req.params.num,
            elements: result.rows, accessoires: result2.rows, tailles:result3.rows,accLie:result4.rows,prixTotal: getPrixTotalCookie(req)});
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