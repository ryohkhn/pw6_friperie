function makeAjaxRequest(url, method, data, successCallback, errorCallback) {
    $.ajax({
        url: url,
        method: method,
        data: data,
        success: successCallback,
        error: errorCallback
    });
}

$(document).ready(function () {
    // Call this function initially to set the correct visibility of the buttons
    let currentPage = $('#current-page').val();
    let totalPages = $('#total-pages').val();
    updateButtonsVisibility(currentPage,totalPages);

    // Function to update the visibility of the buttons
    function updateButtonsVisibility(currentPage,totalPages) {
        console.log(currentPage);
        console.log(totalPages);
        if (currentPage === 1) {
            $('#prev-btn').hide();
        }
        else {
            $('#prev-btn').show();
        }

        if (currentPage === totalPages) {
            $('#next-btn').hide();
        }
        else {
            $('#next-btn').show();
        }
    }

    // Handle the click event of the Previous button
    $('#prev-btn').click(function () {
        // const currentPage = $('#current-page').val();
        // const totalPages = $('#total-pages').val();
        console.log(currentPage);
        console.log(totalPages);
        if (currentPage > 1) {
            currentPage--;
            /* makeAjaxRequest("/accueil", "GET", {page: currentPage}, function (data) {
                console.log("Success: ", data);
            }, function (jqXHR, textStatus, errorThrown) {
                console.log("Error: ", textStatus, errorThrown);
            });
             */
        }
        updateButtonsVisibility(currentPage,totalPages);
    });

    // Handle the click event of the Next button
    $('#next-btn').click(function () {
        // const currentPage = $('#current-page').val();
        // const totalPages = $('#total-pages').val();
        console.log(currentPage);
        console.log(totalPages);
        if (currentPage < totalPages) {
            currentPage++;
            /*
            makeAjaxRequest("/accueil", "GET", {page: currentPage}, function (data) {
                console.log("Success: ", data);
            }, function (jqXHR, textStatus, errorThrown) {
                console.log("Error: ", textStatus, errorThrown);
            });
             */
        }
        updateButtonsVisibility(currentPage,totalPages);
    });
});