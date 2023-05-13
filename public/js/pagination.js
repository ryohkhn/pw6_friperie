/**
 * Fonction pour récupérer la valeur d'un paramètre get en URL
 * @param name
 * @returns {string}
 */
function getQueryParam(name) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(name);
}

/**
 * Fonction qui redirige vers la page suivante en fonction du path
 * @param page numéro de pagination
 */
function navigateToPage(page){
    const currentPath = window.location.pathname;
    // on récupère la valeur de la recherche si il y en a une
    const searchTerm=getQueryParam("recherche");
    if(searchTerm){
        window.location.href = currentPath + '?recherche=' +
            encodeURIComponent(searchTerm) + '&page=' + page;
    }
    else{
        window.location.href = currentPath + "?page=" + page;
    }
}

$(document).ready(function () {
    // initialisation de la visibilité des boutons
    let currentPage = parseInt($('#current-page').val());
    let totalPages = parseInt($('#total-pages').val());
    console.log(currentPage);
    console.log(totalPages);
    updateButtonsVisibility(currentPage,totalPages);

    /**
     * Fonction pour faire gérer la visibilité des boutons en fonction des pages
     * @param currentPage la page courante
     * @param totalPages le nombre de pages au total
     */
    function updateButtonsVisibility(currentPage,totalPages) {
        $("#prev-btn").prop("disabled", currentPage === 1);
        $("#next-btn").prop("disabled", currentPage === totalPages);
    }

    /**
     * Gérer le déclenchement du bouton page précédente
     */
    $('#prev-btn').click(function () {
        if (currentPage > 1) {
            currentPage--;
            navigateToPage(currentPage);
        }
        updateButtonsVisibility(currentPage,totalPages);
    });

    /**
     * Gérer le déclenchement du bouton page suivante
     */
    $('#next-btn').click(function () {
        if (currentPage < totalPages) {
            currentPage++;
            navigateToPage(currentPage);
        }
        updateButtonsVisibility(currentPage,totalPages);
    });
});