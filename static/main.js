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
        weight: 15,
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

        }

        if (appstate.follow == true) {
            console.log("setting follow user to false.")
            appstate.follow = false;
            // At present the map is centered at the ETH Hönggerberg, this way I center my map to the user's position
            // So that we aren't too far away from the point, its zoom level was set to 18
            if (map) {
            map.setView([lat,lng],18);
            }
        }

        // Checks if the button has been pressed yet
        if (appstate.press == false) {
            // Removes the nogps error message for when it appears before recording
            document.getElementById("nogps").innerHTML = "";
            console.log("geosuccess called before button press, waiting.")
            return
        }


        // Creates a timeout message for the user, alerting them how long
        // the recording was stopped.
        if (appstate.timeout == true) {
            // Removes the nogps error message
            document.getElementById("nogps").innerHTML = "";

            // the "timeout" is over
            appstate.timeout = false;

            // Compares current time to last recorded time from trajectories.
            trj = JSON.parse(localStorage["trajectory"]);
            let offlinetime = (Date.now() - (trj[trj.length - 1][2]))/1000;
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

// ATTENTION: This piece of code currently does not get called anywhere and doesn't do much as it is. Maybe rewrite it somewhere else or remove it entirely
// Note that when appstate.follow = true, geosuccess sets it to false again. The intended functionality would be for appstate.follow to be trueby default,
// And Javascript listening for a click on the map element on the page. If it hears you clicking, appstate.follow is automatically set to false and the
// follow button stops being highlighted, until you press it again, appstate.follow is set back to true, and the follow button is, again highlighted. Please
// Consider this when implementing a feature like that. Also, please implement within the code block for button & dialog logic, instead of outside of any
// code blocks, to keep code clean and readable. Thanks. - Philip

//Implemented the center button
function centerMyLocation(){
    map.panTo(latlng);//UserCords = user current latitude, longitude. I suppose you have them!!!
    appstate.follow = true;
}

// This code block implements the button & dialog logic
{
    // Switch button to Stop mode
    function setStopMode() {
        startbutton.innerHTML = "Stop";
        startbutton.classList.remove("start"); // Remove Start-related styles
        startbutton.classList.add("stop", "pulsing"); // Add Stop mode and pulsing animation
        startbutton.onclick = stop; // Set the click handler to stop()
    }

    // Switch button to Start mode
    function setStartMode() {
        startbutton.innerHTML = "Start";
        startbutton.classList.remove("stop", "pulsing"); // Remove Stop-related styles and pulsing animation
        startbutton.classList.add("start"); // Add Start mode styles
        startbutton.onclick = start; // Set the click handler to start()
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

    // This is called when the user presses x after pressing stop and continues recording
    function continue_recording() {
        console.log("The recording continues");
        // We do not clear the local storage since we wish to continue the recording

        // Sets "press" to true, which makes geosuccess start doing its thing
        appstate.press = true;
        console.log("appstate.press has been set to", appstate.press);
        setStopMode();  // Switch button to Stop mode
    }

    // Button reference and default state
    const startButton = document.getElementById("startbutton");
    setStartMode();  // Initialize button in Start mode


    document.addEventListener('DOMContentLoaded', () => {
        const walkIcon = document.querySelector('#walk-icon');
        const heatmapIcon = document.querySelector('#heatmap-icon');
        const switchWarningDialog = document.getElementById('switch-warning');
        const confirmSwitchButton = document.getElementById('confirm-switch');
        const cancelSwitchButton = document.getElementById('cancel-switch');
    
        let targetHref = null; // Store the target href for navigation
    
        // Function to handle navigation with confirmation
        function handleNavigation(event, href) {
            if (appstate.press) {
                event.preventDefault(); // Stop navigation
                targetHref = href; // Save the target href
                switchWarningDialog.showModal(); // Show the warning dialog
            }
        }
    
        // Attach event listeners to navigation icons
        walkIcon.addEventListener('click', (event) => handleNavigation(event, walkIcon.href));
        heatmapIcon.addEventListener('click', (event) => handleNavigation(event, heatmapIcon.href));
    
        // Handle dialog buttons
        confirmSwitchButton.addEventListener('click', () => {
            switchWarningDialog.close();
            if (targetHref) {
                window.location.href = targetHref; // Navigate to the saved href
            }
        });
    
        cancelSwitchButton.addEventListener('click', () => {
            switchWarningDialog.close(); // Close the dialog without navigation
            targetHref = null; // Reset target href
        });
    });



    // This code block implements the dialogs.
    {
        // This is where the popup window is triggered and made interactive
        // The querySelector finds the very first element that has the type dialog
        const dialog = document.querySelector("dialog");
        const are_you_sure_dialog = document.querySelector("#are_you_sure");
        const continue_trajectory = document.getElementById("continue_trajectory");
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

                // Check the SQL Database through Flask to read the current highest ID of all trajectories
                // This is done at the address /js/max_id which was set through Flask.
                // See /Backend/max_id.py for more info on how this works
                $.ajax({
                    url: '/js/max_id',
                    type: 'GET',
                    dataType: 'JSON',
                    success: function (data) {
                        new_id = data+1
                        // Call the insertTrajectory function to actually write the trajectory into the database.
                        insertTrajectory(new_id);
                        console.log('Trajectory number', new_id, 'has been added to the database')
                    },
                    error: function (data) { console.log('trajectory is', data); },
                })

            // Call the Data_Analysis function from the backend. This function returns nothing to JavaScript directly, it is only triggered to
            // Make the Data Analysis happen in the background.
            $.ajax({
                url: '/js/data_analysis_trigger',
                success: function (data) {console.log('data analysis called successfuly, returned', data)},
                error: function (data) {console.log('ERROR: data analysis has failed')}
            })
            }
            dialog.close();
        }, false);

        // Hide the pop up when the close button is clicked and the user wishes to continue
        // Then continue recording
        continue_trajectory.addEventListener("click", function () {
            dialog.close();
            console.log("it has been closed without any submitting")
            continue_recording()
            });

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
    }
}

// This code block implements the trajectory download and the push to the geoserver.
{
    // We want to send the trajectory to the GeoServer
    // This is done with WFS-T
    function insertTrajectory(maxid) {
        trj = JSON.parse(localStorage["trajectory"]);
        let i;
        // PK of the trajectory and in order to concatinate it has to be a string
        let geo_trj_id = maxid


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
