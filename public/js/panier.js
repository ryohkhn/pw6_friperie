$(document).ready(function () {
    $('.delete-basket-btn').on('click', function () {
        const id_produit = $(this).closest('tr').data('basket-id');
        console.log('Deleting Product ID:', id_produit);

        // Supprimer la commande depuis le serveur avec AJAX
        $.ajax({
            url: '/delete-basket',
            method: 'POST',
            data: {
                id_produit: id_produit
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
});
