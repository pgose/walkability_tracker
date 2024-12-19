# Import needed packages
import os # for data paths
import psycopg2 # for database connection
import geopandas as gpd # for analysis
import numpy as np

# Define function returning the result


def data_analysis():
    # CONNECT
    # Define credentials
    db_credentials = {
        "user": "gta_p3",
        "password": "wbNw8q9T",
        "host": "ikgpgis.ethz.ch",
        "port": "5432",
        "dbname": "gta"
    }
    # Establish database connection
    conn = psycopg2.connect(**db_credentials)
    cur = conn.cursor()

    # RETRIEVE DATA FROM DATABASE
    # define sql query statement and use it to retrieve the trackpoints from the database via the method "geopandas.GeoDataFrame.to_postgis", defining the index column same as the column 'point id'
    query_trackpts = "SELECT t.point_id, t.rating, t.geometry FROM gta_p3.trajectory_table as t"
    trackpts = gpd.GeoDataFrame.from_postgis(query_trackpts, conn, geom_col='geometry',index_col='point_id')

    # define sql query statement and use it to retrieve the contextual data table (not raster) from the database via the method "geopandas.GeoDataFrame.to_postgis", defining the index column same as the column 'idx'
    query_context = "SELECT w.idx, w.geom FROM gta_p3.walkability_scoring as w"
    walk_idx = gpd.GeoDataFrame.from_postgis(query_context, conn, geom_col='geom',index_col='idx' ) #Create geodataframe from contextual data table

    # APPLY SPATIAL JOIN ON DATA COLLECTED AND CONTEXTUAL DATA
    # use the method df.sjoin(geom a, geom b, how = '...')
    merged = gpd.sjoin(trackpts, walk_idx, how='inner')

    print("this is what merged looks like:")
    print(merged)
    print("------------------------")


    # CALCULATE AVERAGE USER RATING AND COUNT PER CELL/POLYGON
    # get the average rating by implementing the method "df.groupby('by_this_index')['on_this_column'].mean()" 
    avg_rating = merged.groupby('index_right')['rating'].mean()
    # Transform current panda series "avg_rating" to a proper dataframe in order to be able to index both columns
    avg_rating = avg_rating.to_frame()

    # get the count of points within a cell (here as a polygon) by implementing the method "df.groupby('by_this_index')['on_this_column'].count()" 
    count_pt = merged.groupby('index_right')['rating'].count()
    # Transform current panda series "count_pt" to a proper dataframe in order to be able to index both columns
    count_pt = count_pt.to_frame()


    # Added for smoother processing and in order to avoid problems while connected to database
    conn.rollback()


    # WRITE CALCULATED VALUES INTO TABLE IN DATABASE
    # Write calculated average into the walkability_scoring table in the correct row by using the below written "WHERE"-statement
    # Method: iterate through the generated dataframes, define the query and execute the query to update "user_rating" in the right row
    for index, row in avg_rating.iterrows():
        query = 'UPDATE gta_p3.walkability_scoring SET user_rating = %s WHERE idx = %s'
        cur.execute(query, (int(row.iloc[0])/10, index)) # divided by 10 in order to normalize to number between 0 an 1; maximal value for user rating is 10
        

    # Write calculated count into the walkability_scoring table in the correct row by using the below written "WHERE"-statement
    # Method: iterate through the generated dataframes, define the query and execute the query to update "count_pts" in the right row
    for index, row in count_pt.iterrows():
        query = 'UPDATE gta_p3.walkability_scoring SET count_pts = %s WHERE idx = %s'

        # normalize count between 0 and 1 by using the formula "(value - min_value) /(max_value - min_value)"
        min_val = 0 # the minimum is 0, since the count cannot be negative
        max_val = count_pt.max() # extract the maximum value in the whole dataframe
        norm_count = (int(row.iloc[0]) - min_val) / (max_val - min_val) # apply mentioned formula
        
        cur.execute(query, (norm_count[0], index))

        # commit changes in the database and close connection
    conn.commit()
    conn.close()

    return "success"
