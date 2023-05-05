$(document).ready(function () {
    $('.delete-order-btn').on('click', function () {
        const id_commande = $(this).closest('tr').data('order-id');
        console.log('Deleting Order ID:', id_commande);

        // Supprimer la commande depuis le serveur avec AJAX
        $.ajax({
            url: '/delete-order',
            method: 'POST',
            data: {
                id_commande: id_commande
            },
            success: function (response) {
                console.log(response);
                // location.reload(); // Reload the page to see the updated list of orders
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error deleting order:', errorThrown);
            }
        });
    });
});
