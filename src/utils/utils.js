const db = require("../database_pool.local");

/**
 * Fonction qui retourne la valeur du total du panier
 * @param req
 * @returns {number|number} la valeur du panier
 */
function getPrixTotalCookie(req){
    return req.cookies.prixTotal ? parseFloat(req.cookies.prixTotal) : 0;
}

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

/**
 * Fonction qui combine le résultat de la requête des combinaisosn de la base de données
 * @param rows colonnes résultat de la requête
 * @returns {unknown[]} l'object combinaison créé
 */
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

async function getCombinaison(combiId){
     const request = `SELECT *
                     FROM combinaisons 
                     WHERE id_combinaison = $1`;
    const result = await db.query(request, [combiId]);
    return result.rows;
}

async function getProduit(productId) {
    const request = `SELECT *
                     FROM produits
                     WHERE id_produit = $1`;
    const result = await db.query(request, [productId]);
    return result.rows;
}

async function getSpecificAccessoires(accessoireId) {
    const accessoiresReq = `SELECT *
                            FROM accessoires
                            WHERE id_accessoire = $1`;
    const result = await db.query(accessoiresReq, [accessoireId]);
    return result.rows;
}

/**
 * Fonction qui vérifie dans la session que l'utilisateur est connecté
 * @param req
 * @returns {*} un booléen
 */
function isAuthentificated(req){
    return((req.session && req.session.user));
}


module.exports = {
    getPrixTotalCookie,
    updatePanier,
    updatePanierCombinaisons,
    deleteProduit,
    combineCombinaisons,
    getCombinaison,
    getProduit,
    getSpecificAccessoires,
    isAuthentificated,
};