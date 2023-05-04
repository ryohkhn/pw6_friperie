function navigateToPage(page){
    const currentPath = window.location.pathname;
    window.location.href = currentPath + "?page=" + page;
}

$(document).ready(function () {
    // Call this function initially to set the correct visibility of the buttons
    let currentPage = parseInt($('#current-page').val());
    let totalPages = parseInt($('#total-pages').val());
    updateButtonsVisibility(currentPage,totalPages);

    // Function to update the visibility of the buttons
    function updateButtonsVisibility(currentPage,totalPages) {
        $("#prev-btn").prop("disabled", currentPage === 1);
        $("#next-btn").prop("disabled", currentPage === totalPages);
    }

    // Gérer le déclenchement du bouton page précédente
    $('#prev-btn').click(function () {
        if (currentPage > 1) {
            currentPage--;
            navigateToPage(currentPage);
        }
        updateButtonsVisibility(currentPage,totalPages);
    });

    // Gérer le déclenchement du bouton page suivante
    $('#next-btn').click(function () {
        if (currentPage < totalPages) {
            currentPage++;
            navigateToPage(currentPage);
        }
        updateButtonsVisibility(currentPage,totalPages);
    });
});