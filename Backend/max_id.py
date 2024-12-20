import psycopg2
# establish database connection via the credentials of our group database for later use
db_credentials = {"dbname": "gta",
                  "port": "5432",
                  "user": "gta_p3",
                  "password": "wbNw8q9T",
                  "host": "ikgpgis.ethz.ch"}

def get_max_id():
    """Gets the current maximal trajectory ID in trajectory_table. This value will be incremented
       by one when generating the trajectory to give to the geoserver."""
    # Initialise the connection
    conn = psycopg2.connect(**db_credentials)

    # Initialise cursor
    cur = conn.cursor()
    # SQL Query: get the current highest ID value
    cur.execute("SELECT max(trajectory_id) FROM trajectory_table")
    
    # Since we do not wish to change the table yet, we don't commit the changes
    max_id = cur.fetchall()

    # Close the connection to the database since we are in no need of it anymore
    conn.close()

    # Handle edge case of empty Database;
    if max_id[0][0] == None:
        # return 0 instead of None.
        return 0
    else:
        # return the integer
        return max_id[0][0]

