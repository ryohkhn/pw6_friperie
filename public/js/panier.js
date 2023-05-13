$(document).ready(function () {
    $('.delete-basket-btn').on('click', function () {
        let parentDiv = $(this).closest('.row');
        let type = parentDiv.data('panier-type');
        let id, taille, accessoire, prix;
        const produitsId = [];

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

    $('#add-to-panier-combinaison-form').on('submit', function (event) {
        // éviter la redirection par défaut du formulaire
        event.preventDefault();

        const combinaisonId = $('input[name="id_combi"]').val();
        const produitsData = [];
        $(this).find('.form-group').each(function (index, groupe) {
            const produitId = $(groupe).find('.id_produit').val();
            const taille = $(groupe).find('.taille-select').val();
            const accessoireId = $(groupe).find('.accessoire_lie').val() || null;
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
