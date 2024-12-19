from flask import Flask, jsonify, request, redirect, render_template, url_for
from Backend.max_id import get_max_id
from Backend.backend import data_analysis
import warnings # to suppress warnings

warnings.filterwarnings("ignore")
app = Flask(__name__, static_folder='static')

@app.route("/")
def hello_world():
    return render_template('walk.html')

@app.route("/walk")
def walk():
    return render_template('walk.html')

@app.route("/heatmap")
def heatmap():
    return render_template('heatmap.html')

@app.route("/debug")
def debug():
    return render_template('debug.html')

@app.route("/js/max_id")
def max_id():
    return jsonify(get_max_id())

@app.route("/js/data_analysis_trigger")
def data_analysis_trigger():
    return data_analysis()

def create_app():
    return app

if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8989)
