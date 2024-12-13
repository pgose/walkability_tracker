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
}

// Point data fetching logic; to be implemented
{
    // Both weights are filled with dummy data here
    points.airqualitypoints = [
        [47.40732367718309, 8.5067115379436],
        [47.40826030115247, 8.507353572484025],
        [47.40905868897751, 8.508273941199445],
        [47.40746275358585, 8.50573866884977],
        [47.407639100544955, 8.505608952611176],
        [47.408372900798106, 8.505992032343341],
        [47.408395615670564, 8.505696425097922],
        [47.41048373459909, 8.508608572066903],
        [47.410471134413356, 8.50858080341259],
        [47.41078340160497, 8.50760544831149],
        [47.40733032371296, 8.505460667405785],
        [47.406514304218454, 8.505744512274289]
        ]
    points.userratingpoints = [
        [47.40905999289648, 8.508094467481527],
        [47.40890268674375, 8.508103638587594],
        [47.4093556907983, 8.508355542671213],
        [47.40956983758197, 8.508471261067287],
        [47.41001150537563, 8.508814756642444],
        [47.41009825953661, 8.508717524995639],
        [47.409151877903646, 8.507957854077137],
        [47.40984252313423, 8.5088344422354],
        [47.40992302651176, 8.508721438999558]
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
