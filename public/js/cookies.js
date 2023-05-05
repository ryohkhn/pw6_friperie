$(document).ready(function () {

    function createCookie(nom, valeur, jours) {
        var date = new Date();
        date.setTime(date.getTime() + (jours * 24 * 60 * 60 * 1000));
        var expires = "expires=" + date.toUTCString();
        document.cookie = nom + "=" + valeur + ";" + expires + ";path=/";
    }

    function deleteCookie(nom) {
        document.cookie = nom + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    function getCookie(nom) {
        var name = nom + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function getAllBasketCookies() {
        var cookies = [];
        if (document.cookie && document.cookie !== '') {
            var cookiesArray = document.cookie.split(';');
            for (var i = 0; i < cookiesArray.length; i++) {
                var cookie = cookiesArray[i].trim();
                var cookieName = cookie.split('=')[0];
                if (cookieName.substring(0, 7) === 'produit') {
                    var cookieValue = decodeURIComponent(cookie.split('=')[1]);
                    cookies.push(cookieValue);
                }
            }
        }
        return cookies;
    }

    createCookie("Produit1", "1", 1);
    let table = document.getElementById('table');
    var panier = getAllBasketCookies();
    if (panier.length() === 0) {
        table.append('<p class="w-25 text-center">Aucun produit dans le panier</p>');
    } else {
        for (let i = 0; i < elements.length; i++) {
            if (panier.includes(elements[i].id_produit)) {
                table.append('<tr class="text-center"><td><img src="/src" class="" alt="products image"></td><td class="w-25 align-middle"><h5>' + elements[i].nom_produit + '</h5></td><td class="w-25 align-middle">' + elements[i].prix + '€</td><td class="w-25 align-middle"><a href="#" class="btn btn-primary">Supprimer</a></td></tr>');
            }
        }
    }
});