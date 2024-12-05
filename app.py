import numpy as np

import pyproj

from flask import Flask, jsonify, request, redirect, render_template, url_for


app = Flask(__name__, static_folder='static')

@app.route("/")
def hello_world():
    return render_template('landing.html')

@app.route("/walk")
def walk():
    return render_template('walk.html')

@app.route("/heatmap")
def heatmap():
    return render_template('heatmap.html')

@app.route("/debug")
def debug():
    return render_template('debug.html')

@app.route("/test")
def test():
    return "<h1>Test Pog</h1><p>This is merely a test :)</p>"


app.run(debug=True, host="localhost", port=8989)
