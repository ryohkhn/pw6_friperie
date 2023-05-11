const { server, express } = require('../express_config');
const utils = require("../utils/utils");
const db = require("../database_pool.local");

const router = express.Router();

function getCookiePanierIndex(panier, produit) {
    // on vérifie qu'il s'agit bien du même produit dans le panier
    return panier.findIndex(produitPanier => produitPanier.type === 'produit' && produitPanier.produitId === produit.produitId
        && produitPanier.taille === produit.taille && produitPanier.accessoireId === produit.accessoireId);
}

function getCookiePanierCombinaisonIndex(panier, newCombinaison) {
    // on retourne l'index de l'élément qui correspondant à la règle
    return panier.findIndex(combinaison => {
        // on vérifie qu'il s'agit bien du même id de combinaison
        if ( combinaison.type !== 'combinaison' || combinaison.combinaisonId !== newCombinaison.combinaisonId) {
            return false;
        }

        // on vérifie que les tailles sont les même pour les produits de la même combinaison
        for (let i = 0; i < combinaison.produits.length; i++) {
            const produitCombi = combinaison.produits[i];
            const produitCorrespondant = newCombinaison.produits.find(p => p.produitId === produitCombi.produitId);

            if (!produitCorrespondant || produitCombi.taille !== produitCorrespondant.taille) {
                return false;
            }
        }

        return true;
    });
}

function updatePanier(panier, newProduit) {
    newProduit.type = 'produit';
    const index = getCookiePanierIndex(panier, newProduit);

    if (index !== -1) {
        // augmente la quantité si existant
        panier[index].quantity += 1;
    }
    else {
        // ajoute le produit au cookie du panier
        panier.push(newProduit);
    }

    return panier;
}

function updatePanierCombinaisons(panier, newCombinaison) {
    newCombinaison.type = 'combinaison';
    const index = getCookiePanierCombinaisonIndex(panier, newCombinaison);

    if (index !== -1) {
        // augmente la quantité si existant
        panier[index].quantity += 1;
    }
    else {
        // ajoute la combinaison au cookie du panier
        panier.push(newCombinaison);
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

router.post('/ajoutePanierAjax', function(req, res) {
    const id = req.body.id_produit;
    const valTaille = req.body.taille;
    const accessoireId = req.body.accessoire;

    // on récupère le panier courant
    const currentPanier= req.cookies.panier ? JSON.parse(req.cookies.panier) : [];

    const produit = {
        produitId: id,
        taille: valTaille,
        quantity: 1,
        accessoireId: accessoireId,
    };

    // on ajoute le nouveau produit au cookie
    const updatedPanier = updatePanier(currentPanier, produit);

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
    const updatedPanier = updatePanierCombinaisons(currentPanier, combinaisonData);

    // on remplace l'ancien cookie par le nouveau
    res.cookie('panier', JSON.stringify(updatedPanier), {maxAge: 86400000 });

    // Return the product price instead of redirecting
    res.sendStatus(200);
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
    const updatedPanier = deleteProduit(currentPanier, produit);
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
