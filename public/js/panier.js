$(document).ready(function () {
    $('.delete-basket-btn').on('click', function () {
        const id_produit = $(this).closest('tr').data('basket-id');
        const size = $(this).closest('tr').data('basket-size');
        const id_accessoire = $(this).closest('tr').data('basket-accessoire');
        const prix=$(this).closest('tr').data('basket-prix');
        console.log('Deleting Product ID:', id_produit);


        // Supprimer la commande depuis le serveur avec AJAX
        $.ajax({
            url: '/delete-basket',
            method: 'POST',
            data: {
                id_produit: id_produit,
                size: size,
                id_accessoire: id_accessoire,
                prix: prix
            },
            success: function (response) {
                console.log(response);
                location.reload();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error deleting order:', errorThrown);
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
