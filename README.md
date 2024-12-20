![alt text](static/Logo.png)

## Overview
WalkACity is a web application designed to allow for user surveys with the goal to collect data about how walkable different areas of a city are, and visualize said data. This implementation is designed to be used in the city of Zurich,
though it could be modified to work anywhere. Our approach essentially combines the routes that users frequently take, the score they assign to that route, and a combination of publicly available datasets from the city of Zurich, to
assess and map walkability in Zurich. This app is intended for use by planners and policymakers to find walkability blindspots. These are places with much foot traffic, but insufficient accommodation for this foot traffic.


## Table of Contents
1. [UI & Frontend](#ui-&-frontend)
2. [Backend](#backend)
3. [Pre Processing](#pre-processing)
4. [Visualization](#visualization)
5. [Deploying](#deploying)
6. [Credits](#credits)
7. [Sources](#sources)

## UI & Frontend

The UI & Frontend are relatively straight forward HTML web pages. 

## Backend

The backend functions mainly through Flask, which is implemented within `app.py`. Flask serves the different pages and static resources to the client. By default, Flask serves the `templates/walk.html` under /walk, or / as the home page. `templates/heatmap.html` is then served under heatmap. Beyond this, `app.py` only imports functions from `Backend/backend.py` and `Backend/max_id.py` to make them callable from JavaScript through AJAX GET requests, under paths that begin with `/js/`. 
Other than that, the GeoServer, hosted at `https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA24_project/wms` is used to process the raster heatmap that is viewable under `/heatmap`. How this is done is explained in the following chapter.

## Pre Processing
The Datasets used are all from the [Open Data Catalogue of the city of Zurich](https://data.stadt-zuerich.ch/). Pre Processing was done using QGIS, Python3.11, and SQL through pgAdmin.
Our Database is hosted at ikgpgis.ethz.ch, and was provided to us by the TA's of the lecture. At the moment, our credentials are hard coded into the project. To change the server, or the credentials, you will have to change them under
`Backend/max_id.py`, as well as `Backend/backend.py`. In both files, they are defined near the top, and stored in the variable `db_credentials`. Make sure to change this if you deploy the project, unless you would like to write into
our database. 


In QGIS:

1. Import city of Zurich districts shapefile and set coordinate system

2. Stadtkreise shp dissolved, for Raster clipping

3. Import raster dataset with emmission values "ugz_luftqualitaet_emissionen_100m_2022"
--> imported > upsampled and aligned with 25X25m cells  (method: "Raster anpassen"/"Align Raster")
--> Extent: 2676220.0000000004656613,1241580.0000000002328306 : 2689620.0000000004656613,1254280.0000000002328306
[EPSG:2056]


4. Import raster dataset with PET (physiological equivalent temperature) "LH_KLIMA_PET_14H"
--> import > reprojection to correct coordinate system --> resampled to have 25X25m cells >aligned with above mentioned extent
--> masked raster to show only city of Zurich --> "Clip raster by mask layer" with "Stadtkreise" --> Export

5. Import vector datatset with the inventory of trees in the city of Zurich "gsz.baumkataster_baumstandorte"
--> Import > install > Plug-In "Density Analysis" > apply method "Styled heatmap (kernel density estimation)" with following parameters: Cell/Pixel dimension in measurement unit = 25, Kernel radius in measurement units = 25, Measurement unit = Meters, rest are default values (MAximum width or height dimensions of output image: 20000, Kernel shape: Quartic, Decay ration: 0, Output value scaling: Raw, Interpolation: linear, Mode: Quantile; Number of gradient colors: 15)


6. Reproject all three rasters to WGS84 4326 with the following parameters: "Abtastmethode: Nächster Nachbar"; > export

------------------------------
Continue in Python
1. Load all three rasters
2. merge all 12 channels in the emmission raster to one channel (normalize each channel and sum them up; later on the sum is normalized again, after summing, otherwise we have values higher than 1, not good for comparability)
3. Normalize values of all rasters between 0 and 1 to ensure comparability and to have the same scale for all contextual data; used formula: (value - min_value) / (max_value-min_value)
Important: set no data values to np.nan, otherwise getting minimal value not easy
4. Create new raster with the same profile as the PET raster (it actually doesn't matter, important is to have the right dimensions), and change number of channels to 3
5. Populate the created raster with the datasets: each channel represents on dataset
6. Export to local file storage

------------------------------
Continue in command line and pgAdmin:
1. Import raster to pgAdmin with the command "raster2pgsql" with the following parameters: 
"raster2pgsql -s 4326 -C -I -x -t auto C:\Users\angel\Documents\contextual_data.tif gta_p3.contextual_data |  psql -U gta_p3 -d gta -h ikgpgis.ethz.ch -p 5432"

--> Result: raster called "conextual_data" 

Since not directly showing the channels and since intersection between raster and polygons difficult - do step 2:

2. In pgAdmin, transform raster to a table, in which each row is a polygonized raster cell, adding columns for each channel. The following SQL request is made: 
"CREATE TABLE walkability_scoring AS (SELECT pp.geom, pp.tree, pp.emmission, pp.climate
  FROM gta_p3.contextual_data AS r
    CROSS JOIN LATERAL
    ROWS FROM (
      ST_PixelAsPolygons(rast, 1, exclude_nodata_value => false ),
      ST_PixelAsPolygons(rast, 2, exclude_nodata_value => false),
      ST_PixelAsPolygons(rast, 3, exclude_nodata_value => false )
      ) AS pp(geom, tree, x1, y1,
        g2, emmission, x2, y2,
        g3, climate, x3, y3 ))"

--> Result: table "walkability_scoring"

3. Add column with unique indices per row
ALTER TABLE gta_p3.walkability_scoring
ADD COLUMN idx INT GENERATED BY DEFAULT AS IDENTITY;

4. Set values in created column with indices as primary keys
ALTER TABLE gta_p3.walkability_scoring ADD PRIMARY KEY (idx);

5. Add two new columns to be populated automatically in the data analysis workflow:
"ALTER TABLE walkability_scoring
ADD count_pts FLOAT,
ADD user_rating FLOAT"

Change all 'Nan' values in the column tree to '0' (error occured with nan values during testing)
"UPDATE gta_p3.walkability_scoring
SET tree = NULL
WHERE tree = 'NaN'"

With this, we have a table including all the information needed --> simplifies call with WMS to calculate the weighted sum dynamically, without having to write a new table, as explained below.

______________________________________________________________
AUTOMATIC DATA ANALYSIS

1. Import necessary packages and libraries
2. Define credentials for database connection
3. Connect to database and create cursor
4. Load and save the tables "walkability_scoring" (result from pre-processing) and table "trajectory_table" with GeoPandas into variables --> as GeoPandas dataframes
IMPORTANT: Since the deployed app cannot handle data over a certain volume, the perimeter needs to be redefined by selecting alls cell polygons within a minimum bounding box

5. Do spatial join/intersection with both GeoPandas dataframes (inner join to have both tables' keys, but only the geometry column of the table named first)
6. Count how many collected data points (trackpoints) are within the cell polygon with "df.groupyby('column_to_be_grouped_by')['any_column'].count()" and save the result into a Geopandas dataframe, to be able to index it later

7. Calculate average rating of the collected data points within the cell polygon with "df.groupyby('column_to_be_grouped_by')['rating_column'].mean()" and save the result into a Geopandas dataframe, to be able to index it later

8. Iterate through created GeoPandas dataframes with the count and the average rating and update the table "walkability_scoring" in the database with a SQL query

9. Once completed, commit changes and close connection to database

## Visualisation

## Deploying

## Credits

## Sources
