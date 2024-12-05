// Defines some global variables
let appstate = {
    // is true when recording has started, or button was "press"ed
    press: false,
    // is true when there's been a gap in recording, called a "timeout"
    timeout: false,
    // is true when there's still a trajectory "saved" in localStorage
    saved: false,
    // This holds the "marker" for the user's current location & radius
    marker: L.layerGroup(),
    // is true when the the viewport should "follow" the user's location.'
    follow: true,
}
// The location of the geoserver
let wfs = 'https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA24_project/wfs';

// This code block initializes the map and all of its layers (markers and path)
{
    // Initializes Leaflet map. For more Info see Leaflet documentation online.
    var map = L.map('map').setView([47.408375, 8.507669], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
    }).addTo(map);

    // This is supposed to render one trajectory that shows just the dots with weight 10
    // and one trajectory with weight 5 that shows the segments too.
    // I tried implementing this with "stroke" true and false, but it doesn't seem to work
    // Feel free to remove one of the polylines (but also remove the part that updates it
    // in geosuccess)
    var line = new L.Polyline([], {color: '#007bff',
        weight: 10,
        opacity: 1,
        smoothFactor: 1,
        stroke: false
    })
    var dots = new L.Polyline([], {color: '#007bff',
        weight: 5,
        opacity: 1,
        smoothFactor: 1,
        stroke: true
    })

    map.addLayer(appstate.marker);
    line.addTo(map);
    dots.addTo(map);
}

// This code block defines geosuccess, geoerror and geooptions for navigator.geolocation.watchPosition().
{
    // Is called if user is sharing data.
    function geosuccess(position) {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;
        latlng = L.latLng(lat, lng);
        accuracy = position.coords.accuracy;
        time = Date.now();

        // This renders the user's current location and accuracy as a circle
        {appstate.marker.clearLayers(); // clear old marker

        let circle = L.circle(latlng, {
            radius: accuracy,
            color: '#007bff', // Border color for accuracy circle
            fillColor: '#007bff', // Fill color for accuracy circle
            fillOpacity: 0.2, // Transparency of the fill
            weight: 2 // Border thickness
        });
        appstate.marker.addLayer(circle);

        // Update user location marker with icon and heading
        let userIconWithArrow = L.divIcon({
            className: 'user-location-icon',
            html: `
                <div id="dot"/>
            `,
            iconSize: [20, 20], // constant size
            iconAnchor: [10, 10] // central
        });

        let userMarkerWithArrow = L.marker(latlng, { icon: userIconWithArrow });
        appstate.marker.addLayer(userMarkerWithArrow);

        // turn the arrow
        // if (position.coords.heading != null) {
        //    const heading = position.coords.heading; // direction
        //    document.querySelector('.user-icon-container').style.transform = `rotate(${heading}deg)`;
        // }

        }

        console.log(appstate.follow, "appstate initialized?")
        if (appstate.follow == true) {
            appstate.follow = false;
            // At present the map is centered at the ETH Hönggerberg, this way I center my map to the user's position
            // So that we aren't too far away from the point, its zoom level was set to 18
            if (map) {
            map.setView([lat,lng],18);
            }
        }

        // Checks if the button has been pressed yet
        if (appstate.press == false) {
            console.log("geosuccess called before button press, waiting.")
            return
        }


        // Creates a timeout message for the user, alerting them how long
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
        document.getElementById("nogps").innerHTML = "GPS disabled!"
    };

    geooptions = {
        enableHighAccuracy: true,
        // These values are probably lower than they can be.^
        maximumAge: 15000,  // The maximum age of a cached location (10 seconds).
        timeout: 12000   // A maximum of 5 seconds before timeout.
    };
}

// This code block implements the button & dialog logic
{
    // Function to switch to Start mode (green)
    function setStartMode() {
        startButton.classList.remove("stop");
        startButton.classList.add("start");
        startButton.innerHTML = "Start";
        startButton.onclick = start; // Set click event to start tracking
    }

    // Function to switch to Stop mode (red)
    function setStopMode() {
        startButton.classList.remove("start");
        startButton.classList.add("stop");
        startButton.innerHTML = "Stop";
        startButton.onclick = stop; // Set click event to stop tracking
    }

    // This function is called from HTML when Start is pressed.
    function start() {
        console.log("start button has been pressed");
        // Clears the currently cached trajectory
        localStorage.clear();
        //downloadlink.innerHTML = ""

        // Sets "press" to true, which makes geosuccess start doing its thing
        appstate.press = true;
        console.log("appstate.press has been set to", appstate.press);
        setStopMode();  // Switch button to Stop mode
    }

    // This is called when the Stop button is pressed
    function stop() {
        console.log("Stop button has been pressed")

        // Reverts "press" back to false, which stops geosuccess in its tracks
        appstate.press = false;
        startbutton.innerHTML = "Start";
        setStartMode();  // Switch button to Start mode
        //downloadlink.innerHTML = "download csv";
        localStorage['saved'] = true;
    }


    // Button reference and default state
    const startButton = document.getElementById("startbutton");
    setStartMode();  // Initialize button in Start mode


    // This code block implements the dialogs.
    {
        // This is where the popup window is triggered and made interactive
        // The querySelector finds the very first element that has the type dialog
        const dialog = document.querySelector("dialog");
        const are_you_sure_dialog = document.querySelector("#are_you_sure");
       
        document.getElementById("startbutton").addEventListener("click", function(){
            // It seems counterintuitive but by checking if the inner HTML of the button is
            // "Start" we are able to directly target the state change from Start to Stop
            // Why? Because when we click stop, the inner HTML becomes "start" AND
            // Because the addEventListener is click based, the edge case when the page is loaded
            // and the inner HTML is "start", it will be ignored
            if (startButton.innerHTML == "Start") {
                dialog.showModal();  // Show the dialog when disabled
            }

        });
        // If the cancel button is pressed, it closes the popup
        dialog.querySelector(".close-btn").addEventListener("click", function(){
            are_you_sure_dialog.showModal();
        });
        // If the submit button is pressed, only then does the download commence
        dialog.querySelector(".submit-btn").addEventListener("click", function(){
            console.log("Submit button clicked");

            if (!localStorage["trajectory"]) {
                console.warn("No trajectory data is available in local storage.");
                alert("There is no trajectory data available for download.");
                
            } else {
                // This function sends everything to the geoserver and conversely to the database
                console.log("There are trajectories in the local storage");
                insertTrajectory();
            }
            dialog.close();
        }, false);


        var slider = document.getElementById("myRange");
        var output = document.getElementById("value");
        output.innerHTML = slider.value;

        slider.oninput = function() {
        output.innerHTML = this.value;
        }

        // If the No button of the are you sure popup is pressed, it closes the popup and returns to the original popup
        are_you_sure_dialog.querySelector(".close-btn").addEventListener("click", function(){
            are_you_sure_dialog.close();
        });
        // If the yes button is pressed it closes the pop up completely
        are_you_sure_dialog.querySelector(".submit-btn").addEventListener("click", function(){
            are_you_sure_dialog.close();
            dialog.close();
        });


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
}

// This code block implements the trajectory download and the push to the geoserver.
{
    // To generate the id of the trajectory with a specific amount of decimals
    function getRandomID(length) {

        return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1));
    }


    // A different Version to download the file
    function download(filename) {

        //creating an invisible element
        // Why invisible? Because this element should be clicked at the same time as the submit button
        // So we have to secretly press it ;)
        // ATTENTION, currently the format of the csv file is NOT accurate to the UML, since the user rating is missing
        // And of course it is not connected to the geoserver

        if (!localStorage["trajectory"]) {
            console.warn("No trajectory data is available in localStorage.");
            alert("No trajectory data is available for download.");
            return;
        }



        let firstrow = "trajectory_id;point_id;time_stamp;lat;lon;rating%0D%0A";
        let alldata = firstrow;
        trj = JSON.parse(localStorage["trajectory"]);
        let i;
        // PK of the trajectory and in order to concatinate it has to be a string
        let trj_id = getRandomID(9).toString();

        // Currently generates a new id per trajectory and creates point_id iteratively
        for (i = 0; i < trj.length; i++) {
            alldata = alldata + trj_id + ";" + i.toString() + ";" + trj[i][2] + ";" + trj[i][0].lat + ";" + trj[i][0].lng + ";" + (slider.value).toString()+ "%0D%0A";
        }

        let element = document.createElement('a');
        element.setAttribute('href',
            "data:text/csv;charset=UTF-8," + alldata);
        element.setAttribute('download', filename);
        document.body.appendChild(element);
        element.click();

        document.body.removeChild(element);
    }

    // Instead of local download, we want to send this to the geoserver
    // This is done with WFS-T
    function insertTrajectory() {
        trj = JSON.parse(localStorage["trajectory"]);
        let i;
        // PK of the trajectory and in order to concatinate it has to be a string
        // TODO: CREATE A CHECK FOR DUPLICATES
        let geo_trj_id = getRandomID(9).toString();

        // The xml file that is sent to the geoserver
        let postData =
            '<wfs:Transaction\n'
          + '  service="WFS"\n'
          + '  version="1.0.0"\n'
          + '  xmlns="http://www.opengis.net/wfs"\n'
          + '  xmlns:wfs="http://www.opengis.net/wfs"\n'
          + '  xmlns:gml="http://www.opengis.net/gml"\n'
          + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
          + '  xmlns:GTA24_project="https://www.gis.ethz.ch/GTA24_project" \n'
          + '  xsi:schemaLocation="https://www.gis.ethz.ch/GTA24_project \n https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA24_project/wfs?service=WFS&amp;version=1.0.0&amp;request=DescribeFeatureType&amp;typeName=GTA24_project%3Atrajectory_table \n'
          + '                      http://www.opengis.net/wfs\n'
          + '                      https://baug-ikg-gis-01.ethz.ch:8443/geoserver/schemas/wfs/1.0.0/WFS-basic.xsd">\n';

        // By now iteratively creating the insert request we create the xml file content needed by WFS-T to update the table
        for (i = 0; i < trj.length; i++) {
            postData = postData
                + '  <wfs:Insert>\n'
                + '    <GTA24_project:trajectory_table>\n'
                + '      <trajectory_id>'+geo_trj_id+'</trajectory_id>\n'
                + '      <time_stamp>'+trj[i][2]+'</time_stamp>\n'
                + '      <lat>'+trj[i][0].lat+'</lat>\n'
                + '      <lon>'+trj[i][0].lng+'</lon>\n'
                + '      <rating>'+(slider.value).toString()+'</rating>\n'
                + '      <geometry>\n'
                + '        <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">\n'
                + '          <gml:coordinates xmlns:gml="http://www.opengis.net/gml" decimal="." cs="," ts=" ">'+trj[i][0].lng+ ',' +trj[i][0].lat+'</gml:coordinates>\n'
                + '        </gml:Point>\n'
                + '      </geometry>\n'
                + '    </GTA24_project:trajectory_table>\n'
                + '  </wfs:Insert>\n';
        }
        postData = postData
          + '</wfs:Transaction>';

        $.ajax({
            method: "POST",
            url: wfs,
            dataType: "xml",
            contentType: "text/xml",
            data: postData,
            success: function() {
                //Success feedback
                console.log("Success from AJAX, data sent to Geoserver");

                // Do something to notisfy user
                alert("Your trajectory has been successfully sent to the database");
            },
            error: function (xhr, errorThrown) {
                //Error handling
                console.log("Error from AJAX");
                console.log(xhr.status);
                console.log(errorThrown);
              }
        });
    }
}

// This function is called when the document loads
function onload() {
    var trj = []
    startbutton = document.getElementById("startbutton");
    downloadlink = document.getElementById("download")
    // If there's already a trajectory, recording picks up where it left off.
    if ('saved' in localStorage) {
        //downloadlink.innerHTML = "download csv";
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
        setStopMode();
    }
    // Otherwise the button is populated as normal
    else {
        console.log("page loaded. No trajectory in localstorage")
        startbutton.innerHTML = "Start";
        startbutton.onclick = start;
        setStartMode();
    };

    // Checks if the user is sharing location data in the first place
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(geosuccess, geoerror, geooptions)
    }
}
