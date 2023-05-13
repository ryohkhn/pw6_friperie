/**
 * Fonction qui retourne la valeur du total du panier
 * @param req
 * @returns {number|number} la valeur du panier
 */
function getPrixTotalCookie(req){
    return req.cookies.prixTotal ? parseFloat(req.cookies.prixTotal) : 0;
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

module.exports = {
    getPrixTotalCookie,
    combineCombinaisons,
};