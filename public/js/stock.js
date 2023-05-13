$(document).ready(function() {
    // For each size selector
    $('select[id^="taille-select-"]').each(function() {
        // Get the product ID from the size selector's id
        const productId = $(this).attr('id').split('-')[2];

        // On size change
        $(this).change(function() {
            // Get the selected size
            const selectedSize = $(this).val();

            // Get the stock for the selected size
            const stock = $(this).find(`option[value=${selectedSize}]`).data('stock');

            // Update the stock display
            $(`#stock-${productId}`).text(`Stock: ${stock}`);
        });

        // Trigger change event on page load to display the stock of the first size
        $(this).trigger('change');
    });

    $('button[id^="add-button-"]').click(function () {
        // on récupère l'id du produit dont le stock dont le stock a été ajouté
        const productId = $(this).attr('id').split('-')[2];

        // on récupère la taille et la quantité demandée
        const taille = $(`#taille-select-${productId}`).val();
        const quantite = $(`#quantite-select-${productId}`).val();

        // Send AJAX request to your specific route
        $.ajax({
            url: '/ajouterStockAjax', // Replace with your specific route
            type: 'POST',
            data: {
                id: productId,
                taille: taille,
                quantite: quantite
            },
            success: function (res) {
                const nouveauStock = res.nouveauStock;
                // on met à jour le stock dynamiquement
                $(`#stock-${productId}`).text(`Stock: ${nouveauStock}`);

                // on met à jour la valeur data cachée dans le selecteur des tailles
                $(`#taille-select-${productId} option:selected`).data('stock', nouveauStock);
            },
            error: function (xhr, status, error) {
                console.error('Erreur d`ajout de stock à la BD:', error);
            }
        });
    });
});