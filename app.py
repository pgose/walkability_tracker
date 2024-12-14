from flask import Flask, jsonify, request, redirect, render_template, url_for
from Backend import max_id

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

@app.route("/max_id")
def max_id():
    return max_id.get_max_id()

if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8989)
