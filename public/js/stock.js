$(document).ready(function() {
    /**
     * Event handler sur le selecteur de taille de chaque produit.
     * A chaque changement, le stock correspondant est dynamiquement changé.
     */
    $('select[id^="taille-select-"]').each(function() {
        const productId = $(this).attr('id').split('-')[2];

        // event handler sur le selecteur
        $(this).change(function() {
            const selectedSize = $(this).val();

            // on récupère le stock correspondant à la taille
            const stock =
                $(this).find(`option[value=${selectedSize}]`).data('stock');

            // changement dynamique du stock
            $(`#stock-${productId}`).text(`Stock: ${stock}`);
        });

        // affiche le stock sur la première taille au chargement de la page
        $(this).trigger('change');
    });

    /**
     * Event handler sur le bouton d'ajout de stock
     */
    $('button[id^="add-button-"]').click(function () {
        // on récupère l'id du produit dont le stock dont le stock a été ajouté
        const productId = $(this).attr('id').split('-')[2];

        // on récupère la taille et la quantité demandée
        const taille = $(`#taille-select-${productId}`).val();
        const quantite = $(`#quantite-select-${productId}`).val();

        // envoi de la requête Ajax au serveur
        $.ajax({
            url: '/ajouterStockAjax',
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
                $(`#taille-select-${productId} option:selected`)
                    .data('stock', nouveauStock);
            },
            error: function (xhr, status, error) {
                console.error('Erreur d`ajout de stock à la BD:', error);
            }
        });
    });
});