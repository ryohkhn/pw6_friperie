$(document).ready(function () {
    /**
     * Event handler sur le bouton de suppression des commades
     */
    $('.delete-order-btn').on('click', function () {
        const id_commande = $(this).closest('tr').data('order-id');
        console.log('Deleting Order ID:', id_commande);

        // supprime la commande depuis le serveur avec AJAX
        $.ajax({
            url: '/delete-order',
            method: 'POST',
            data: {
                id_commande: id_commande
            },
            success: function (response) {
                console.log(response);
                location.reload();
            },
            error: function (jqXHR, textStatus,errorThrown) {
                console.error('Erreur suppression commande:', errorThrown);
            }
        });
    });
});
