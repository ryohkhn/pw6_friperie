function updateTotalBasket(price) {
  const totalBasketElement = document.getElementById('total-basket');
  const currentTotal = parseFloat(totalBasketElement.textContent);
  const newTotal = currentTotal + price;

  totalBasketElement.textContent = newTotal + '€';
}

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

    $('#add-to-panier-form').on('submit', function (event) {
        event.preventDefault();

        $.ajax({
            url: '/ajoutePanierAjax',
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                updateTotalBasket(response.price);
            },
            error: function (xhr, status, error) {
                console.error('Erreur ajout produit au panier:', error);
            }
        });
    });

    $('#add-to-panier-btn').on('click', function() {
        const productPrice = parseFloat(document.getElementById('product-price').value);

        updateTotalBasket(productPrice);
    });
});
