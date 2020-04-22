#!/usr/bin/env python3

from flask import Flask, send_from_directory
app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory("./", "test.html")

@app.route('/main.js')
def main_js():
    return send_from_directory("./", "main.js")

@app.route('/pluto.js')
def pluto_js():
    return send_from_directory("./", "pluto.js")

@app.route('/plot.js')
def plot_js():
    return send_from_directory("./", "plot.js")

@app.route('/test.js')
def test_js():
    return send_from_directory("./", "test.js")

@app.route('/main.wasm')
def main_wasm():
    return send_from_directory("./", "main.wasm")

@app.route('/test.iq')
def test_iq():
    return send_from_directory("./", "test.iq")

if __name__ == "__main__":
    app.templates_auto_reload = True
    app.debug = True
    app.run()