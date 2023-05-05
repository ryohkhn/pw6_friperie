const server = require('./express_config')
const db = require('./database_pool.local');

const authRoutes = require('./routing/authRoutes');
const middlewares = require('./middlewares/middlewares');
const cookieParser = require('cookie-parser');


// routage pour l'authentification
server.use(authRoutes);

server.use(cookieParser());

server.get('/',(req, res) => {
    res.redirect('/accueil');
});

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

async function getPaginatedItems(type, currentPage, searchTerm, limit = 5) {
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
        else {
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

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
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

        res.render('commandes.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// Ajoute un produit au panier
server.post('/ajoutePanier', function(req, res) {
    const produitId = req.body.id_produit;
    const valTaille = req.body.taille; // Récupère la valeur de la liste déroulante
    res.cookie(`Produit${produitId}`, valTaille, { maxAge: 86400000 }); // expire après 1 jour
    res.redirect('/panier');
});

server.post('/supprimePanier/:num', function(req, res) {
    const produitId = req.body.id_produit;
    const valTaille = req.body.taille; // Récupère la valeur de la liste déroulante
    res.cookie(`Produit${produitId}`, valTaille, { maxAge: 86400000 }); // expire après 1 jour
    res.redirect('/panier');
});

server.get('/panier', async (req, res) => {
    try {

        var request = `SELECT * FROM produits WHERE `;
        var acc=0;
        

        // Ajoute les ID de produit au filtre de la requête SQL
        for (const cookieName in req.cookies) {
            if (cookieName.startsWith("Produit")) {
                if(acc!=0){
                    request += ' OR ';
                }
                acc++;
                var id=cookieName.substring(7);
                request += `id_produit=${id}`;
            }
        }
        if(acc===0){
            res.render('panier.ejs', {elements: []});
        }else{
            const result = await db.query(request);
            res.render('panier.ejs', {elements: result.rows});
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

        res.render('produit.ejs', {idprod: req.params.num,
            elements: result.rows, accessoires: result2.rows});
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

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
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

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});