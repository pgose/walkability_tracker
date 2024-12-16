// Defines a container for where the point datasets will live.
let points = {
    airqualitypoints: [],
    userratingpoints: [],
}

// Defines a container for where the weights will live, defaults to 5
let weights = {
    airquality: 5,
    userrating: 5,
}

let heatmap = L.layerGroup()

// This code block initializes the map and the layer for the heatmap
{
    // Initializes Leaflet map. For more Info see Leaflet documentation online.
    var map = L.map('map').setView([47.408375, 8.507669], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
    }).addTo(map);
    map.addLayer(heatmap)
}

// Help Menu

document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const backButtons = document.querySelectorAll('.back-button');
    const pages = document.querySelectorAll('.help-page');

    const introductionPage = document.getElementById('help-introduction');
    const troubleshootingPage = document.getElementById('help-troubleshooting');
    const contactPage = document.getElementById('help-contact');
    const mainPage = document.getElementById('help-main');

    const introductionButton = document.getElementById('introduction-btn');
    const troubleshootingButton = document.getElementById('troubleshooting-btn');
    const contactButton = document.getElementById('contact-btn');

    // Function to show a specific page
    function showPage(pageToShow) {
        pages.forEach((page) => page.classList.add('hidden')); // Hide all pages
        pageToShow.classList.remove('hidden'); // Show the selected page
    }

    // Close modal
    closeButtons.forEach((button) =>
        button.addEventListener('click', () => helpModal.close())
    );

    // Navigate to pages
    introductionButton.addEventListener('click', () => showPage(introductionPage));
    troubleshootingButton.addEventListener('click', () => showPage(troubleshootingPage));
    contactButton.addEventListener('click', () => showPage(contactPage));

    // Navigate back to the main page
    backButtons.forEach((button) =>
        button.addEventListener('click', () => showPage(mainPage))
    );
});
document.addEventListener('DOMContentLoaded', () => {
    const helpIcon = document.getElementById('help-icon');
    const helpModal = document.getElementById('help-modal');

    // Open Help Modal
    helpIcon.addEventListener('click', () => {
        helpModal.showModal();
    });

    // Ensure close buttons are working
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach((button) => {
        button.addEventListener('click', () => helpModal.close());
    });
});


// This code block implements the weights menu
{
    // Define the hook for the weightdialog
    const weightdialog = document.querySelector("dialog");
    const cancelbutton = weightdialog.querySelector(".cancel-btn");
    const setbutton = weightdialog.querySelector(".set-btn");
    var airqualityslider = document.getElementById("airQuality");
    var userratingslider = document.getElementById("userRating");
    var displayedvalues = [document.getElementById("airqualityvalue"), document.getElementById("userratingvalue")]
    var previousweights = [weights.airquality, weights.userrating]



    airqualityslider.oninput = function() {
        weights.airquality = this.value;
        displayedvalues[0].innerHTML = weights.airquality;
        renderheatmap();
    }

    userratingslider.oninput = function() {
        weights.userrating = this.value;
        displayedvalues[1].innerHTML = weights.userrating;
        renderheatmap();
    }
    // Shows the weights menu when the menu button is pressed
    function weightmenu() {
        [airqualityslider.value, userratingslider.value] = [weights.airquality, weights. userrating];
        [displayedvalues[0].innerHTML, displayedvalues[1].innerHTML] = [weights.airquality, weights.userrating];
        weightdialog.showModal();
    }
    // If the cancel button is pressed, it closes the popup
    cancelbutton.addEventListener("click", function() {
        console.log(previousweights[0])
        weights.airquality = previousweights[0];
        weights.userrating = previousweights[1];
        weightdialog.close()
        renderheatmap();
    })

    setbutton.addEventListener("click", function() {
        previousweights = [weights.airquality, weights.userrating]
        weightdialog.close()
    })
    
// Info buttons
// Info button triggers

// Air quality rating info
// Get modal and close button elements

const air_quality_info_Modal = document.getElementById("info-modal-airquality");
const info_airquality_icon = document.getElementById("info-icon-air-quality");
const info_airquality_closeModal = document.getElementById("airquality-close-modal");

// Show the modal when help icon is clicked
info_airquality_icon.addEventListener("click", function () {
air_quality_info_Modal.showModal();
});

// Hide the modal when the close button is clicked
info_airquality_closeModal.addEventListener("click", function () {
air_quality_info_Modal.close();
});

// Hide the modal when clicking outside of the modal content
window.addEventListener("click", function (event) {
if (event.target === air_quality_info_Modal) {
    air_quality_info_Modal.close();
}
});

// Air quality rating info
// Get modal and close button elements

const userrating_info_Modal = document.getElementById("info-modal-userrating");
const info_userrating_icon = document.getElementById("info-icon-user-rating");
const info_userrating_closeModal = document.getElementById("userrating-close-modal");

// Show the modal when help icon is clicked
info_userrating_icon.addEventListener("click", function () {
userrating_info_Modal.showModal();
});

// Hide the modal when the close button is clicked
info_userrating_closeModal.addEventListener("click", function () {
userrating_info_Modal.close();
});

// Hide the modal when clicking outside of the modal content
window.addEventListener("click", function (event) {
if (event.target === userrating_info_Modal) {
    userrating_info_Modal.close();
}
});

}

// Point data fetching logic; to be implemented
{
    // Both weights are filled with dummy data here
    points.airqualitypoints = [
    ]
    points.userratingpoints = [
    ]
}

// This code block will implement heatmap rendering using leaflet.heat
{
    function renderheatmap() {
        heatmap.clearLayers()
        console.log(points.airqualitypoints)
        heatmappoints = points.airqualitypoints.map((x) => [x[0], x[1], weights.airquality/2.5]).concat(
            points.userratingpoints.map((x) => [x[0], x[1], weights.userrating/2.5]));
        var heat = L.heatLayer(heatmappoints, {radius: 25}).addTo(heatmap);
    }

    function onload() {
        renderheatmap();
    }
}
