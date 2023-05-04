const server = require('./express_config')
const db = require('./database_pool.local');
const authRoutes = require('./routing/authRoutes');
const middlewares = require('./middlewares/middlewares');

// routage pour l'authentification
server.use(authRoutes);

server.get('/',(req, res) => {
    res.redirect('/accueil');
});

async function getPaginatedItems(type, page, limit = 5) {
    // on recupère la page courante
    const currentPage = parseInt(page) || 1;
    // on calcule l'offset de la requête SQL en fonction de la page courante et de la limite
    const offset = (currentPage - 1) * limit;
    let totalItemsResult;
    let itemsResult;

    try {
        if (type === 'all') {
            totalItemsResult = await db.query(`SELECT *
                                               FROM produits`);
            itemsResult = await db.query('SELECT * FROM produits ORDER BY createddate LIMIT $1 OFFSET $2', [limit, offset]);
        } else {
            totalItemsResult = await db.query(`SELECT *
                                               FROM produits
                                               WHERE type_produit = $1`, [type]);
            itemsResult = await db.query('SELECT * FROM produits WHERE type_produit=$1 ORDER BY createddate LIMIT $2 OFFSET $3', [type, limit, offset]);
        }

        const totalItems = totalItemsResult.rows.length;
        const totalPages = Math.ceil(totalItems / limit);
        const items = itemsResult.rows;

        return {
            items,
            totalPages,
            currentPage,
        };
    } catch (err) {
        console.error(err);
        throw new Error('Internal server error');
    }
}

server.get('/accueil', async (req, res) => {
    try {
        const {items, totalPages, currentPage} = await getPaginatedItems('all', req.query.page);

        if (currentPage < 1) {
            return res.redirect('/accueil?page=1');
        } else if (currentPage > totalPages) {
            return res.redirect('/accueil?page=' + totalPages);
        }

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
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


server.get('/search',(req, res) => {

});

// routage sur les catégories de vêtements
server.get('/:type',middlewares.validateCategory,async (req, res) => {
    try {
        const {items, totalPages, currentPage} = await getPaginatedItems(req.params.type, req.query.page);

        if (currentPage < 1) {
            return res.redirect(`/${req.params.type}?page=1`);
        }
        else if (currentPage > totalPages) {
            return res.redirect(`/${req.params.type}?page=${totalPages}`);
        }

        res.render('page.ejs', {elements: items, totalPages: totalPages, currentPage: currentPage});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});