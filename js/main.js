// Defines some global variables
let appstate = {
    // is true when recording has started, or button was "press"ed
    press: false,
    // is true when there's been a gap in recording, called a "timeout"
    timeout: false,
    // is true when there's still a trajectory "save"d in localStorage
    saved: false,
    // This holds the marker for the user's current location & radius
    marker: L.layerGroup()
}

// Initializes Leaflet map. For more Info see Leaflet documentation online.
var map = L.map('map').setView([47.408375, 8.507669], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
}).addTo(map);

var line = new L.Polyline([], {color: 'red',
    weight: 10,
    opacity: 1,
    smoothFactor: 1,
    stroke: false
})
var dots = new L.Polyline([], {color: 'red',
    weight: 5,
    opacity: 1,
    smoothFactor: 1,
    stroke: true
})

map.addLayer(appstate.marker);
line.addTo(map);
dots.addTo(map);



// Is called if user is sharing data.
function geosuccess(position) {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    latlng = L.latLng(lat, lng);
    accuracy = position.coords.accuracy;
    time = Date.now();

    // This renders the user's current location and accuracy as a circle
    {appstate.marker.clearLayers();

    let circle = L.circle(latlng, {
        radius: accuracy,
        color: '#c17561',
        opacity: 0.3
    });
    appstate.marker.addLayer(circle);
    }
    // At present the map is centered at the ETH Hönggerberg, this way I center my map to the user's position
    // So that we aren't too far away from the point, its zoom level was set to 18
    if (map) {
        map.setView([lat,lng],18);
    }

    // Checks if the button has been pressed yet
    if (appstate.press == false) {
        console.log("geosuccess called before button press, waiting.")
        return
    }


    // Creates a timeout message from the user, alerting them how long
    // the recording was stopped.
    if (appstate.timeout == true) {
        // Removes the nogps error message
        document.getElementById("nogps").innerHTML = ""

        // the "timeout" is over
        appstate.timeout = false;

        // Compares current time to last recorded time from trajectories.
        trj = JSON.parse(localStorage["trajectory"]);
        let offlinetime = (Date.now() - (trj[trj.length - 1][2]))/1000
        // Alerts the user to how much time has passed
        alert("Tracking timed out for " + offlinetime + " seconds")
    };

    console.log("geosuccess was called, with appstate.press =", appstate.press);


    // This section records gps locations into the trajectory
    {if ('trajectory' in localStorage) {
        console.log("trajectory is in localStorage.")
        //Append a new Point to the list of current points named "trajectory"
        let newtrajectory = JSON.parse(localStorage["trajectory"]);
        newtrajectory.push([latlng, accuracy, time]);
        localStorage.setItem("trajectory", JSON.stringify(newtrajectory));
        console.log("trajectory is currently as follows:", localStorage["trajectory"])
    }

    else {
        // Start recording a new Trajectory
        console.log("starting record")
        let firstpoint = JSON.stringify([[latlng, accuracy, time]]);
        console.log("writing firstpoint into trajectory:", firstpoint)
        localStorage.setItem("trajectory", firstpoint)
    }}

    // Render a Polyline that shows the users trajectory on the map
    trj = JSON.parse(localStorage["trajectory"]);
    pointlist = trj.map((x) => x[0]);
    console.log("pointlist is:", pointlist);

    line.setLatLngs(pointlist);

    dots.setLatLngs(pointlist);
};

// This function is called when the location data stops being provided.
function geoerror() {
    console.log("no location data provided, calling geoError");
    // Sets timeout to true, so that the user can be notified about the gap
    // in recording using an alert in geosuccess.
    appstate.timeout = true;
    document.getElementById("nogps").innerHTML = "GPS Tracking disabled!"
};

let geooptions = {
    enableHighAccuracy: true,
    // These values are probably lower than they can be.^
    maximumAge: 15000,  // The maximum age of a cached location (10 seconds).
    timeout: 12000   // A maximum of 5 seconds before timeout.
};




// This function is called from HTML when Start is pressed.
function start() {
    console.log("start button has been pressed");
    // Clears the currently cached trajectory
    localStorage.clear();
    downloadlink.innerHTML = ""

    // Sets "press" to true, which makes geosuccess start doing its thing
    appstate.press = true;
    console.log("appstate.press has been set to", appstate.press);

    // Changes the Start button into a Stop button
    startbutton.innerHTML = "Stop";
    startbutton.onclick = stop;
}

// This is called when the Stop button is pressed
function stop() {
    console.log("Stop button has been pressed")

    // Reverts "press" back to false, which stops geosuccess in its tracks
    appstate.press = false;
    startbutton.innerHTML = "Start";
    startbutton.onclick = start;
    downloadlink.innerHTML = "download csv";
    localStorage['saved'] = true;
}


// This part allows you to download a csv of your trackpoints
// Mostly copied & adapted lecture code; I don't know how jquery works. mfg Philip
$('a#download').click(function() {
    let firstrow = "time;lat;lon;accuracy%0D%0A";
    let alldata = firstrow;
    trj = JSON.parse(localStorage["trajectory"]);
    let i;
    for (i = 0; i < trj.length; i++) {
        alldata = alldata + trj[i][2] + ";" + trj[i][0].lat + ";" + trj[i][0].lng + ";" + trj[i][1] + "%0D%0A";
    }
    this.href = "data:text/csv;charset=UTF-8," + alldata;
    });


// This function is called when the document loads
function onload() {
    var trj = []
    startbutton = document.getElementById("startbutton");
    downloadlink = document.getElementById("download")
    // If there's already a trajectory, recording picks up where it left off.
    if ('saved' in localStorage) {
        downloadlink.innerHTML = "download csv";
        startbutton.innerHTML = "Start";
        startbutton.onclick = start;
    }
    else if ('trajectory' in localStorage) {
        appstate.timeout = true;
        appstate.press = true;
        console.log("page loaded successfully.");
        console.log("appstate is:", appstate.press);
        startbutton.innerHTML = "Stop";
        startbutton.onclick = stop;
    }
    // Otherwise the button is populated as normal
    else {
        console.log("page loaded. No trajectory in localstorage")
        startbutton.innerHTML = "Start";
        startbutton.onclick = start;
    };

    // Checks if the user is sharing location data in the first place
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(geosuccess, geoerror, geooptions)
    }
}

