const { server, express } = require('../express_config');
const utils = require("../utils/utils");
const db = require("../database_pool.local");

const router = express.Router();

async function getQuantiteTailleProduit(productId,taille) {
    const disposReq = `SELECT *
                       FROM dispo_tailles
                       WHERE id_produit = $1 AND taille = $2`;
    const result = await db.query(disposReq, [productId,taille]);
    return result.rows;
}

async function addQuantiteToTaille(productId,taille,quantite){
    const disposReq = `UPDATE dispo_tailles SET
                       quantite = quantite + $1 
                       WHERE id_produit = $2 AND taille = $3`;
    const result = await db.query(disposReq, [quantite,productId,taille]);
    return result.rows;
}

async function insertQuantiteToTaille(productId,taille,quantite){
    const disposReq = `INSERT INTO dispo_tailles VALUES ($1,$2,$3)`;
    const result = await db.query(disposReq, [productId,taille,quantite]);
    return result.rows;
}

/**
 * Routage pour les requêtes POST d'ajout de stock à la base de données
 * Le serveur reçoit l'id du produit, la taille ainsi que la quantité demandée
 */
router.post('/ajouterStockAjax', async (req, res) => {
    try {
        const id = req.body.id;
        const taille = req.body.taille;
        const quantite = req.body.quantite;

        // on récupère les informations sur les tailles disponibles avec cet id et cette taille
        const tailles_dispos = await getQuantiteTailleProduit(id,taille);
        // s'il existe déjà une quantité pour la taille on l'incrémente, sinon on insère la valeur
        if(tailles_dispos.length>0){
            await addQuantiteToTaille(id,taille,quantite);
            // on retourne la valeur au client pour mettre à jour la valeur
            res.json({ nouveauStock: tailles_dispos[0].quantite + parseInt(quantite, 10)});
        }
        else{
            await insertQuantiteToTaille(id,taille,quantite);
            // on retourne la valeur au client pour mettre à jour la valeur
            res.json({ nouveauStock: quantite});
        }
    } catch (error) {
        console.error('Erreur suppression commande:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/ajoutePanierAjax', function(req, res) {
    const id = req.body.id_produit;
    const valTaille = req.body.taille;
    const accessoireId = req.body.accessoire;

    // on récupère le panier courant
    const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    // on crée l'objet pour le comparer à ceux des cookies
    const produit = {
        produitId: id,
        taille: valTaille,
        quantity: 1,
        accessoireId: accessoireId,
    };

    // on ajoute le nouveau produit au cookie
    const updatedPanier = utils.updatePanier(currentPanier, produit);

    // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    // on retourne success
    res.sendStatus(200);
});

router.post('/ajoutePanierCombiAjax', function(req, res) {
    const combinaisonData = req.body;
    combinaisonData.quantity = 1;

    // on récupère le panier courant
    const currentPanier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    // on ajoute le nouveau produit au cookie
    const updatedPanier = utils.updatePanierCombinaisons(currentPanier, combinaisonData);

    // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    res.sendStatus(200);
});

// Vérifier si deux tableaux de produits sont les mêmes
function sameProduits(prod1, prod2) {
    if (prod1.length !== prod2.length) return false;

    for (let i = 0; i < prod1.length; i++) {
        const p1 = prod1[i];
        const p2 = prod2.find(p => p.produitId === p1.produitId && p.taille === p1.taille && p.accessoireId === p1.accessoireId);
        if (!p2) return false;
    }

    return true;
}

function deleteElement(panier, element) {
    const index = panier.findIndex((p) => {
        if (p.type === 'produit') {
            return p.produitId === element.produitId && p.taille === element.taille && p.accessoireId === element.accessoireId;
        }
        else if (p.type === 'combinaison') {
            // Vérifier si la combinaison a le même id et les mêmes produits
            return p.combinaisonId === element.combinaisonId && sameProduits(p.produits, element.produits);
        }
        return false;
    });

    if (index !== -1) {
        panier[index].quantity -= element.quantity;
        if (panier[index].quantity < 1){
            panier.splice(index, 1);
        }
    }

    return panier;
}

router.post('/deletePanierAjax', function(req, res) {
    const type = req.body.type;
    const id = req.body.id;
    const taille = req.body.taille;
    const accessoire = req.body.accessoire;
    const prix = req.body.prix;

    // On récupère le panier courant
    let currentPanier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    let element = {};

    if (type === 'produit') {
        element = {
            type: type,
            produitId: id,
            taille: taille,
            quantity: 1,
            accessoireId: accessoire,
        };
    }
    else if (type === 'combinaison') {
        const produitsId = req.body.produitsId;
        element = {
            type: type,
            combinaisonId: id,
            produits: taille.map((val, index) => ({produitId: produitsId[index], taille: val, accessoireId: accessoire[index]})),
            quantity: 1,
        };
    }

    // On supprime l'élément du cookie
    currentPanier = deleteElement(currentPanier, element);

    // On remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(currentPanier), {maxAge: 86400000 });

    // Calcul du nouveau prix total
    const currentPrixTotal = utils.getPrixTotalCookie(req);
    const newPrixTotal = currentPrixTotal - parseFloat(prix);
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    res.json({ status: "success" });
});

router.post('/delete-basket', function(req, res) {
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
    const updatedPanier = utils.deleteProduit(currentPanier, produit);
     // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    const currentPrixTotal = utils.getPrixTotalCookie(req);
    const newPrixTotal = currentPrixTotal - parseFloat(prix);
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    const productPrice = 0;
    res.json({ price: productPrice });
});

router.post('/update-total-Ajax', function (req, res) {
    const prix = parseFloat(req.body.prix);

    const currentPrixTotal = utils.getPrixTotalCookie(req);
    //  on récupère le prix total du panier courrant
    const newPrixTotal = currentPrixTotal + prix;

    // on met à jour le cookie
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    // on retourne au client le nouveau prix total pour le mettre à jour sur la page
    res.json({newTotal: newPrixTotal});
});


router.post('/delete-order', async (req, res) => {
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

module.exports = router;
