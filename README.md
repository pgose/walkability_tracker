![alt text](static/Logo.png)

## Overview
WalkACity is a web application designed to allow for user surveys with the goal to collect data about how walkable different areas of a city are, and visualize said data. This implementation is designed to be used in the city of Zurich,
though it could be modified to work anywhere. Our approach essentially combines the routes that users frequently take, the user rating they assign to that route, and a combination of publicly available datasets from the city of Zurich, to
assess and map walkability in Zurich. This app is intended for use by planners and policymakers to find walkability blindspots. These are places with much foot traffic, but insufficient accommodation for this foot traffic.


## Table of Contents
1. [UI & Frontend](#ui-&-frontend)
2. [Backend](#backend)
3. [Pre Processing](#pre-processing)
4. [geoserver](#geoserver)
5. [Deploying](#deploying)
6. [Credits](#credits)
7. [Sources](#sources)

## UI & Frontend

The user interface (UI) & the frontend are relatively straight forward HTML web pages. The main tab under `/walk` allows recording of new trajectories, and subsequent rating of the finished path. The other tab under `/heatmap` visualizes the user data in a
clear and concise manner. This is done interactively, through the slider menu, triggered by pressing the button in the top right, which allows the user to set custom weights and see how scaling different factors affects walkability
scores. The pages are styled through `static/style.css`, and made interactive through `static/main.js` for `/walk` and `static/heatmap.js` for `/heatmap` respectively. 

To visualize all of this on an interactive map, the [Leaflet JavaScript library](https://leafletjs.com/) was used, along with the bundled css styling it necessitates to display properly. 

## Backend

The backend functions mainly through Flask, which is implemented within `app.py`. Flask serves the different pages and static resources to the client. By default, Flask serves the `templates/walk.html` under /walk, or / as the home page.
`templates/heatmap.html` is then served under heatmap. Beyond this, `app.py` only imports functions from `Backend/backend.py` and `Backend/max_id.py` to make them callable from JavaScript through AJAX GET requests, under paths that begin 
with `/js/`. Other than that, the GeoServer, hosted at `https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA24_project/wms` is used to process the raster heatmap that is viewable under `/heatmap`. To use a different GeoServer, simply switch
out the link at the beginning of the `statis/heatmap.js` file. How the Geoserver handles requests is explained in the [chapter of the same title](#geoserver)

## Pre Processing
The Datasets used are all from the [Open Data Catalogue of the city of Zurich](https://data.stadt-zuerich.ch/). See the [Sources](#sources) for information on which datasets were used. Pre Processing was done using QGIS, Python3.11, and 
SQL through pgAdmin. Our database is hosted at ikgpgis.ethz.ch, and was provided to us by the teaching assistants of the lecture “Geoinformationstechnologien und -analysen HS2024” [103-0717-00L], Autumn semester 2024. At the moment, our credentials are hard coded into the project. To change the server, or the credentials, you will have to 
change them under `Backend/max_id.py`, as well as `Backend/backend.py`. In both files, they are defined near the top, and stored in the variable `db_credentials`. Make sure to change this if you deploy the project, unless you would like 
to read/write directly into our database. 


In QGIS:

1. Import city of Zurich districts shapefile and set coordinate system

2. Dissolve vector file "Stadtkreise" for later steps, when clipping the raster of the emission dataset (shows the whole canton, just city of Zurich needed)

3. Import raster dataset with emission values "ugz_luftqualitaet_emissionen_100m_2022" <br>
$\rightarrow$ imported <br>
$\rightarrow$ upsampled and aligned with 25X25m cells  (method: "Raster anpassen"/"Align Raster") <br>
$\rightarrow$ chosen extent: 2676220.0000000004656613,1241580.0000000002328306 : 2689620.0000000004656613,1254280.0000000002328306 [EPSG:2056] <br>


5. Import raster dataset with PET (physiological equivalent temperature) "LH_KLIMA_PET_14H"
$\rightarrow$ import and reprojection to correct coordinate system <br>
$\rightarrow$ resampled to have 25X25m cells and aligned with above mentioned extent <br>
$\rightarrow$ masked raster to show only city of Zurich --> "Clip raster by mask layer" with "Stadtkreise" <br>
$\rightarrow$ Export <br>

6. Import vector datatset with the inventory of trees in the city of Zurich "gsz.baumkataster_baumstandorte"
$\rightarrow$ Import <br>
$\rightarrow$ install Plug-In "Density Analysis" <br>
$\rightarrow$ apply method "Styled heatmap (kernel density estimation)" with following parameters: <br>
$\rightarrow \rightarrow$ Cell/Pixel dimension in measurement unit = 25 <br>
$\rightarrow \rightarrow \rightarrow$ Kernel radius in measurement units = 25 <br>
$\rightarrow \rightarrow \rightarrow$ Measurement unit = Meters <br>
$\rightarrow \rightarrow \rightarrow$ Default values: Maximum width or height dimensions of output image: 20000, Kernel shape: Quartic, Decay ration: 0, Output value scaling: Raw, Interpolation: linear, Mode: Quantile, Number of gradient colors: 15) <br>

7. Reproject all three rasters to WGS84 4326 with the following parameters: "Abtastmethode: Nächster Nachbar" and export

------------------------------
Continue in Python
1. Load all three rasters
2. merge all 12 channels in the emmission raster to one channel <br>
$\rightarrow$ normalize each channel and sum them up $\rightarrow$ later on the sum is normalized again, after summing, otherwise we have values higher than 1, not good for comparability) <br>
3. Normalize values of all rasters between 0 and 1 to ensure comparability and to have the same scale for all contextual data; used formula: (value - min_value) / (max_value-min_value)
$\rightarrow$ Important: set no data values to np.nan, otherwise getting minimal value not easy <br>
4. Create new raster with the same profile as the PET raster (it actually doesn't matter, important is to have the right dimensions), and change number of channels to 
5. Populate the created raster with the datasets: each channel represents on dataset
6. Export to local file storage

------------------------------
Continue in command line and pgAdmin:
1. Import raster to pgAdmin with the command "raster2pgsql" with the following parameters: 
$\rightarrow$ "raster2pgsql -s 4326 -C -I -x -t auto C:\Users\angel\Documents\contextual_data.tif gta_p3.contextual_data |  psql -U gta_p3 -d gta -h ikgpgis.ethz.ch -p 5432" <br>
$\rightarrow$ Result: raster called "contextual_data"  <br>

2. Since not directly showing the channels and since intersection between raster and polygons difficult, transform raster to a table in pgAdmin, in which each row is a polygonized raster cell, adding columns for each channel. The following SQL request is made: <br>
"CREATE TABLE walkability_scoring AS (SELECT pp.geom, pp.tree, pp.emmission, pp.climate <br>
  FROM gta_p3.contextual_data AS r <br>
    CROSS JOIN LATERAL <br>
    ROWS FROM ( <br>
      ST_PixelAsPolygons(rast, 1, exclude_nodata_value => false ), <br>
      ST_PixelAsPolygons(rast, 2, exclude_nodata_value => false), <br>
      ST_PixelAsPolygons(rast, 3, exclude_nodata_value => false ) <br>
      ) AS pp(geom, tree, x1, y1, <br>
        g2, emmission, x2, y2, <br>
        g3, climate, x3, y3 ))" <br>

$\rightarrow$ Result: table "walkability_scoring" <br>

3. Add column with unique indices per row <br>
ALTER TABLE gta_p3.walkability_scoring <br>
ADD COLUMN idx INT GENERATED BY DEFAULT AS IDENTITY; <br>

4. Set values in created column with indices as primary keys: <nr>
"ALTER TABLE gta_p3.walkability_scoring ADD PRIMARY KEY (idx);"

5. Add two new columns to be populated automatically in the data analysis workflow: <br>
"ALTER TABLE walkability_scoring <br>
ADD count_pts FLOAT, <br>
ADD user_rating FLOAT" <br>

Change all 'Nan' values in the column tree to '0' (error occured with nan values during testing): <br>
"UPDATE gta_p3.walkability_scoring <br>
SET tree = NULL <br>
WHERE tree = 'NaN'" <br>

With this, we have a table including all the information needed. It simplifies call with WMS to calculate the weighted sum dynamically, without having to write a new table, as explained below.

______________________________________________________________
AUTOMATIC DATA ANALYSIS

1. Import necessary packages and libraries
2. Define credentials for database connection
3. Connect to database and create cursor
4. Load and save the tables "walkability_scoring" (result from pre-processing) and table "trajectory_table" with GeoPandas into variables --> as GeoPandas dataframes
$\rightarrow$ IMPORTANT: Since the deployed app cannot handle data over a certain volume, the perimeter needs to be redefined by selecting alls cell polygons within a minimum bounding box <br>

5. Do spatial join/intersection with both GeoPandas dataframes (inner join to have both tables' keys, but only the geometry column of the table named first)
6. Count how many collected data points (trackpoints) are within the cell polygon with "df.groupyby('column_to_be_grouped_by')['any_column'].count()" and save the result into a Geopandas dataframe, to be able to index it later

7. Calculate average rating of the collected data points within the cell polygon with "df.groupyby('column_to_be_grouped_by')['rating_column'].mean()" and save the result into a Geopandas dataframe, to be able to index it later

8. Iterate through created GeoPandas dataframes with the count and the average rating and update the table "walkability_scoring" in the database with a SQL query

9. Once completed, commit changes and close connection to database

## GeoServer
The GeoServer is using what's called a Web Map Service, or 'wms' for short. The GeoServer receives weights from `heatmap.js`, to generate a Raster made of polygons that is then rendered on top of the leaflet map. It applies these
weights to the different attributes of the raster generated in pre-processing, and then returns this element back to `heatmap.js`, where it is rendered accordingly over the map.
The GeoServer is located at 'https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA24_project/wms'. To request from a different address, simply change this address at the top of `heatmap.js`.

## Deploying

Our Server started out being deployed on [Vercel](https://vercel.com/), but was then switched to [Railway](https://railway.app/), because the free Vercel plan didn't allow for more than 250MB storage, and this was needed because
GeoPandas is a very large package. If you are willing to pay for a vercel subscription, this project will run as is on Vercel, seeing that all necessary configuration is containted in `vercel.json`. 
For Railway, we needed to add the `Dockerfile`, which also means this project would likely be deployable through Docker. `requirements.txt` contains all packages needed for the python backend to do its job.

1. For local deployment, clone the project from github using
`git clone https://github.com/pgose/walkacity`

2. Create a new Python environment using your preferred Python environment manager, and then install the required dependencies by running
`pip install -r requirements.txt`
from within the project folder

3. Flask should also get installed this way. In your active environment, you can then run the following command inside the folder to deploy the Flask web server locally.
`python app.py`

## Credits
Project Team:
* Allyna Dachler – Software (UI), Software (GeoServer)
* Angelika Nogueira Bhushan – Software (Pre-Processing, Data Analysis), Formal analysis
* Philip Gosset – Software (UI), Software (Flask)
* Zhihe Yu – Software (UI)
* All - Conceptualization, Methodology, Validation, Investigation, Resources, Data Curation, Writing - Original Draft, Writing - Review & Editing, Visualization, Project administration
* Not applicable – Funding acquisition

Supervisors:
* Prof. Dr. Martin Raubal – Supervision
* Dr. Peter Kiefer – Supervision
* Ye Hong – Supervision
* Nina Wiedemann – Supervision
* Tianyi Xiao – Supervision
* Yiwei Wang – Supervision
* Ayda Grisiute – Supervision
* Shupeng Wang – Supervision
* Dr. Sailin Zhong – Supervision
* Mischa Bauckhage – Supervision
* Andreas Dombos – Supervision

## Sources
