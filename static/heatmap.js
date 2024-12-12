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

{
    // Get modal and close button elements
    const helpModal = document.getElementById("help-modal");
    const closeModal = document.getElementById("close-modal");
    const helpIcon = document.getElementById("help-icon");

    // Show the modal when help icon is clicked
    helpIcon.addEventListener("click", function () {
    helpModal.showModal();
    });

    // Hide the modal when the close button is clicked
    closeModal.addEventListener("click", function () {
    helpModal.close();
    });

    // Hide the modal when clicking outside of the modal content
    window.addEventListener("click", function (event) {
    if (event.target === helpModal) {
        helpModal.close();
    }
    });
}

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
