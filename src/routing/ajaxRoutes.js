const { server, express } = require('../express_config');
const utils = require("../utils/utils");
const db = require("../database_pool.local");

const router = express.Router();

/**
 * Récupère la quantité disponible pour une taille spécifique d'un produit donné.
 * @param {number} productId - L'ID du produit.
 * @param {string} taille - La taille du produit.
 * @returns {Promise<Array>} - Un tableau contenant les résultats de la requête.
 */
async function getQuantiteTailleProduit(productId,taille) {
    const disposReq = `SELECT *
                       FROM dispo_tailles
                       WHERE id_produit = $1 AND taille = $2`;
    const result = await db.query(disposReq, [productId,taille]);
    return result.rows;
}

/**
 * Ajoute une quantité spécifiée à la taille d'un produit donné dans la table de disponibilité des tailles.
 * @param {number} productId - L'ID du produit.
 * @param {string} taille - La taille du produit.
 * @param {number} quantite - La quantité à ajouter.
 * @returns {Promise<Array>} - Un tableau contenant les résultats de la requête.
 */
async function addQuantiteToTaille(productId,taille,quantite){
    const disposReq = `UPDATE dispo_tailles SET
                       quantite = quantite + $1 
                       WHERE id_produit = $2 AND taille = $3`;
    const result = await db.query(disposReq, [quantite,productId,taille]);
    return result.rows;
}

/**
 * Insère une quantité spécifiée pour une taille d'un produit donné dans
 * la table de disponibilité des tailles.
 * @param {number} productId - L'ID du produit.
 * @param {string} taille - La taille du produit.
 * @param {number} quantite - La quantité à insérer.
 * @returns {Promise<Array>} - Un tableau contenant les résultats de la requête.
 */
async function insertQuantiteToTaille(productId,taille,quantite){
    const disposReq = `INSERT INTO dispo_tailles VALUES ($1,$2,$3)`;
    const result = await db.query(disposReq, [productId,taille,quantite]);
    return result.rows;
}

/**
 * Routage pour les requêtes POST d'ajout de stock à la base de données
 * Le serveur reçoit l'id du produit, la taille ainsi que la quantité demandée
 * @param {Object} req - Requête HTTP reçue.
 * @param {Object} res - Réponse HTTP à renvoyer.
 * @returns {Object} - Objet JSON contenant la nouvelle valeur du
 * stock ({ nouveauStock: quantite }).
 * En cas d'erreur, renvoie une réponse d'erreur avec le statut 500 et
 * un objet JSON ({ error: 'Internal server error' }).
 */
router.post('/ajouterStockAjax', async (req, res) => {
    try {
        const id = req.body.id;
        const taille = req.body.taille;
        const quantite = req.body.quantite;

        // On récupère les informations sur les tailles disponibles
        // avec cet id et cette taille
        const tailles_dispos = await getQuantiteTailleProduit(id,taille);
        // S'il existe déjà une quantité pour la taille on l'incrémente,
        // sinon on insère la valeur
        if(tailles_dispos.length>0){
            await addQuantiteToTaille(id,taille,quantite);
            // On retourne la valeur au client pour mettre à jour la valeur
            res.json({ nouveauStock: tailles_dispos[0].quantite
                    + parseInt(quantite, 10)});
        }
        else{
            await insertQuantiteToTaille(id,taille,quantite);
            // On retourne la valeur au client pour mettre à jour la valeur
            res.json({ nouveauStock: quantite});
        }
    } catch (error) {
        console.error('Erreur suppression commande:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

/**
 * Route ajax pour ajouter un produit au panier et mettre à jour le cookie.
 * @param {Object} req - Requête HTTP reçue.
 * @param {Object} res - Réponse HTTP à renvoyer.
 * @returns {number} - Statut de succès (200) en cas de réussite.
 */
router.post('/ajoutePanierAjax', function(req, res) {
    const id = req.body.id_produit;
    const valTaille = req.body.taille;
    const accessoireId = req.body.accessoire;

    // On récupère le panier courant
    const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier):[];

    // On crée l'objet pour le comparer à ceux des cookies
    const produit = {
        produitId: id,
        taille: valTaille,
        quantity: 1,
        accessoireId: accessoireId,
    };

    // On ajoute le nouveau produit au cookie
    const updatedPanier = utils.updatePanier(currentPanier, produit);

    // On remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000});

    res.sendStatus(200);
});

/**
 * Route pour ajouter une combinaison au panier et mettre à jour le cookie.
 * @param {Object} req - Requête HTTP reçue.
 * @param {Object} res - Réponse HTTP à renvoyer.
 * @returns {number} - Statut de succès (200) en cas de réussite.
 */
router.post('/ajoutePanierCombiAjax', function(req, res) {
    const combinaisonData = req.body;
    combinaisonData.quantity = 1;

    // On récupère le panier courant
    const currentPanier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    // On ajoute le nouveau produit au cookie
    const updatedPanier = utils.updatePanierCombinaisons(currentPanier, combinaisonData);

    // On remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    res.sendStatus(200);
});

/**
 * Vérifie si deux tableaux de produits sont identiques.
 * @param {Array} prod1 - Premier tableau de produits.
 * @param {Array} prod2 - Deuxième tableau de produits.
 * @returns {boolean} - True si les tableaux de produits sont identiques,
 * False sinon.
 */
function sameProduits(prod1, prod2) {
    if (prod1.length !== prod2.length) return false;

    // On compare les id des produits, des tailles et de l'accessoire
    for (let i = 0; i < prod1.length; i++) {
        const p1 = prod1[i];
        const p2 = prod2.find(p => p.produitId === p1.produitId && p.taille === p1.taille && p.accessoireId === p1.accessoireId);
        if (!p2) return false;
    }

    return true;
}

/**
 * Supprime un élément du panier en ajustant la quantité ou en
 * le supprimant complètement.
 * @param {Array} panier - Le panier contenant les éléments.
 * @param {Object} element - L'élément à supprimer.
 * @returns {Array} Le panier mis à jour.
 */
function deleteElement(panier, element) {
    const index = panier.findIndex((p) => {
        if (p.type === 'produit') {
            return p.produitId === element.produitId && p.taille ===
                element.taille && p.accessoireId === element.accessoireId;
        }
        else if (p.type === 'combinaison') {
            // Vérifier si la combinaison a le même id et les mêmes produits
            return p.combinaisonId === element.combinaisonId
                && sameProduits(p.produits, element.produits);
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

/**
 * Supprime un élément du panier via une requête Ajax.
 * @param {Object} req - Requête HTTP contenant les informations de l'élément à supprimer.
 * @param {Object} res - Réponse HTTP renvoyée au client.
 */
router.post('/deletePanierAjax', function(req, res) {
    const type = req.body.type;
    const id = req.body.id;
    const taille = req.body.taille;
    const accessoire = req.body.accessoire;
    const prix = req.body.prix;

    // On récupère le panier courant
    let currentPanier = req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    let element = {};

    // On reproduit comment l'élément est stocké dans le cookie
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
            produits: taille.map((val, index) => ({produitId: produitsId[index],
                taille: val, accessoireId: accessoire[index]})),
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

/**
 * Met à jour le prix total du panier via une requête Ajax.
 * @param {Object} req - Requête HTTP contenant les informations sur le prix à ajouter.
 * @param {Object} res - Réponse HTTP renvoyée au client.
 */
router.post('/update-total-Ajax', function (req, res) {
    const prix = parseFloat(req.body.prix);

    const currentPrixTotal = utils.getPrixTotalCookie(req);
    //  On récupère le prix total du panier courant
    const newPrixTotal = currentPrixTotal + prix;

    // On met à jour le cookie
    res.cookie('prixTotal', newPrixTotal, {maxAge: 86400000, sameSite: 'lax'});

    // On retourne au client le nouveau prix total pour le mettre à jour sur la page
    res.json({newTotal: newPrixTotal});
});

/**
 * Supprime une commande via une requête Ajax.
 * @param {Object} req - Requête HTTP contenant l'ID de la commande à supprimer.
 * @param {Object} res - Réponse HTTP renvoyée au client.
 */
router.post('/delete-order', async (req, res) => {
    const id_commande = req.body.id_commande;

    const requete = `
        UPDATE commandes SET archived = True WHERE id_commande = $1
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
