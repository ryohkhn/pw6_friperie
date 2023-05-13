$(document).ready(function () {
    /**
     * Event handler sur le bouton de suppression du panier
     */
    $('.delete-basket-btn').on('click', function () {
        let parentDiv = $(this).closest('.row');
        let type = parentDiv.data('panier-type');
        let id, taille, accessoire, prix;
        const produitsId = [];

        // produit: on récupère l'id, la taille, le prix et l'accessoire
        // combinaison: l'id de la combi, les id de chaque produit ainsi que
        // les tailles et les accessoires associés
        id = parentDiv.data('panier-id');
        prix = parentDiv.data('panier-price');
        if (type === 'produit') {
            taille = parentDiv.data('panier-produittaille');
            accessoire = parentDiv.data('panier-accessoire');
        }
        else if (type === 'combinaison') {
            taille = [];
            // Si chaque produit a son propre accessoire
            accessoire = [];
            parentDiv.find('.row[data-panier-produitid]').each(function () {
                produitsId.push($(this).data('panier-produitid'));
                taille.push($(this).data('panier-produittaille'));
                accessoire.push($(this).data('panier-accessoire'));
            });
        }
        // envoie de la requête Ajax au serveur
        $.ajax({
            url: '/deletePanierAjax',
            method: 'POST',
            data: {
                type: type,
                id: id,
                taille: taille,
                accessoire: accessoire,
                prix: prix,
                produitsId: produitsId
            },
            success: function (response) {
                console.log(response);
                location.reload();
            }
        });
    });

    /**
     * Event handler sur l'envoi du formulaire de la page produit
     */
    $('#add-to-panier-form').on('submit', function (event) {
        // éviter la redirection par défaut du formulaire
        event.preventDefault();

        $.ajax({
            url: '/ajoutePanierAjax',
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                console.log(response);
            },
            error: function (xhr, status, error) {
                console.error('Erreur ajout produit au panier:', error);
            }
        });
    });

    /**
     * Event handler sur l'envoi du formulaire de la page des combinaisons
     */
    $('#add-to-panier-combinaison-form').on('submit', function (event) {
        // éviter la redirection par défaut du formulaire
        event.preventDefault();

        // récupération de l'id de la combinaison et des informations
        // de chaque produit (id,taille,accessoire)
        const combinaisonId = $('input[name="id_combi"]').val();
        const produitsData = [];
        $(this).find('.form-group').each(function (index, groupe) {
            const produitId = $(groupe).find('.id_produit').val();
            const taille = $(groupe).find('.taille-select').val();
            const accessoireId= $(groupe).find('.accessoire_lie').val() || null;
            produitsData.push({produitId, taille, accessoireId});
        });

        $.ajax({
            url: '/ajoutePanierCombiAjax',
            type: 'POST',
            data: {combinaisonId: combinaisonId, produits: produitsData},
            success: function (response) {
                console.log(response);
            },
            error: function (xhr, status, error) {
                console.error('Erreur ajout combinaison au panier:', error);
            }
        });
    });

    /**
     * Event handler sur le bouton d'ajout au panier pour actualiser
     * le prix total du panier
     */
    $('#add-to-panier-btn').on('click', function() {
        const prixProduitElem = document.getElementById('prix_produit');
        const prixProduit = parseFloat(prixProduitElem.textContent);

        $.ajax({
            url: '/update-total-Ajax',
            method: 'POST',
            data: {
                prix: prixProduit
            },
            success: function (response) {
                $('#total-panier').text(response.newTotal.toFixed(2) + ' €');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Erreur update du prix total:', errorThrown);
            }
        });
    });
});
