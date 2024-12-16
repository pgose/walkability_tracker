// Defines a container for where the point datasets will live.
let points = {
    emissionspoints: [],
    treepoints: [],
    userratingpoints: [],
    temperaturepoints: [],
}

// Defines a container for where the weights will live, defaults to 5
let weights = {
    emissionsrating: 5,
    treerating: 5,
    userrating: 5,
    temperaturerating: 5,
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
    var treesslider = document.getElementById("treeRating");
    var emissionsslider = document.getElementById("emissionsRating");
    var userratingslider = document.getElementById("userRating");
    var temperatureslider = document.getElementById("temperatureRating");
    var displayedvalues = [document.getElementById("emissionsvalue"),document.getElementById("treevalue"), document.getElementById("userratingvalue"),document.getElementById("temperaturevalue")]
    var previousweights = [,weights.emissionsrating, weights.treerating, weights.userrating, weights.temperaturerating]

    emissionsslider.oninput = function() {
        weights.emissionsrating = this.value;
        displayedvalues[0].innerHTML = weights.emissionsrating;
        renderheatmap();
    }

    treesslider.oninput = function() {
        weights.treerating = this.value;
        displayedvalues[1].innerHTML = weights.treerating;
        renderheatmap();
    }

    userratingslider.oninput = function() {
        weights.userrating = this.value;
        displayedvalues[2].innerHTML = weights.userrating;
        renderheatmap();
    }

    temperatureslider.oninput = function() {
        weights.temperaturerating = this.value;
        displayedvalues[3].innerHTML = weights.temperaturerating;
        renderheatmap();
    }

    // Shows the weights menu when the menu button is pressed
    function weightmenu() {
        [emissionsslider.value, treesslider.value, userratingslider.value,temperatureslider.value] = [weights.emissionsrating,weights.treerating, weights.userrating, weights.temperaturerating];
        [displayedvalues[0].innerHTML, displayedvalues[1].innerHTML, displayedvalues[2].innerHTML,displayedvalues[3].innerHTML] = [weights.emissionsrating, weights.treerating, weights.userrating, weights.temperaturerating];
        weightdialog.showModal();
    }
    // If the cancel button is pressed, it closes the popup
    cancelbutton.addEventListener("click", function() {
        console.log(previousweights[0])
        weights.emissionsrating = previousweights[0];
        weights.treerating = previousweights[1];
        weights.userrating = previousweights[2];
        weights.temperaturerating = previousweights[3];
        weightdialog.close()
        renderheatmap();
    })

    setbutton.addEventListener("click", function() {
        previousweights = [weights.emissionsrating, weights.treerating, weights.userrating, weights.temperaturerating]
        weightdialog.close()
    })
    
// Info buttons
// Info button triggers

// Emissions rating info
// Get modal and close button elements

const emissions_info_Modal = document.getElementById("info-modal-emissions");
const info_emissions_icon = document.getElementById("info-icon-emissions");
const info_emissions_closeModal = document.getElementById("emissions-close-modal");

// Show the modal when help icon is clicked
info_emissions_icon.addEventListener("click", function () {
emissions_info_Modal.showModal();
});

// Hide the modal when the close button is clicked
info_emissions_closeModal.addEventListener("click", function () {
emissions_info_Modal.close();
});

// Hide the modal when clicking outside of the modal content
window.addEventListener("click", function (event) {
if (event.target === emissions_info_Modal) {
    emissions_info_Modal.close();
}
});

// Tree rating info
// Get modal and close button elements

const trees_info_Modal = document.getElementById("info-modal-trees");
const info_trees_icon = document.getElementById("info-icon-trees");
const info_trees_closeModal = document.getElementById("trees-close-modal");

// Show the modal when help icon is clicked
info_trees_icon.addEventListener("click", function () {
trees_info_Modal.showModal();
});

// Hide the modal when the close button is clicked
info_trees_closeModal.addEventListener("click", function () {
trees_info_Modal.close();
});

// Hide the modal when clicking outside of the modal content
window.addEventListener("click", function (event) {
if (event.target === trees_info_Modal) {
    trees_info_Modal.close();
}
});

// Userrating info
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

// Temperaturerating info
// Get modal and close button elements

const temperature_info_Modal = document.getElementById("info-modal-temperature");
const info_temperature_icon = document.getElementById("info-icon-temperature");
const info_temperature_closeModal = document.getElementById("temperature-close-modal");

// Show the modal when help icon is clicked
info_temperature_icon.addEventListener("click", function () {
temperature_info_Modal.showModal();
});

// Hide the modal when the close button is clicked
info_temperature_closeModal.addEventListener("click", function () {
temperature_info_Modal.close();
});

// Hide the modal when clicking outside of the modal content
window.addEventListener("click", function (event) {
if (event.target === temperature_info_Modal) {
    temperature_info_Modal.close();
}
});

}

// Point data fetching logic; to be implemented
{
    // Both weights are filled with dummy data here
    points.emissionspoints = [
    ]
    points.treepoints = [
    ]
    points.userratingpoints = [
    ]
    points.temperaturepoints = [
    ]
}

// This code block will implement heatmap rendering using leaflet.heat
{
    function renderheatmap() {
        heatmap.clearLayers()
        console.log(points.treepoints)
        heatmappoints = points.emissionspoints.map((x) => [x[0], x[1],x[2] ,x[3],weights.emissionsrating/2.5]).concat(points.treepoints.map((x) => [x[0], x[1],x[2] ,x[3] ,weights.treerating/2.5])).concat(
            points.userratingpoints.map((x) => [x[0], x[1],x[2] ,x[3] ,weights.userrating/2.5])).concat(
                points.temperaturepoints.map((x) => [x[0], x[1],x[2] ,x[3] ,weights.temperaturerating/2.5]));
        var heat = L.heatLayer(heatmappoints, {radius: 25}).addTo(heatmap);
    }

    function onload() {
        renderheatmap();
    }
}
