const server = require('./express_config')
const db = require('./database_pool.local');

const authRoutes = require('./routing/authRoutes');
const middlewares = require('./middlewares/middlewares');

// routage pour l'authentification
server.use(authRoutes);

server.get('/',(req, res) => {
    res.redirect('/accueil');
});

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
            console.log("commandes");
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
        const items = itemsResult.rows;

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
        if (currentPage > totalPages) {
            return res.redirect('/commandes?page=' + totalPages);
        }

        res.render('commandes.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

server.get('/panier', async (req, res) => {
    try {
        const request = `SELECT * FROM produits `;
        const result = await db.query(request);
        console.log(result.rows);
        res.render('panier.ejs', {elements: result.rows});
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