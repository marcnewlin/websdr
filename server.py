#!/usr/bin/env python3

from flask import Flask, send_from_directory
app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory("./html", "test.html")

@app.route('/main.js')
def main_js():
    return send_from_directory("./build", "main.js")

@app.route('/pluto.js')
def pluto_js():
    return send_from_directory("./js", "pluto.js")

@app.route('/plot.js')
def plot_js():
    return send_from_directory("./js", "plot.js")

@app.route('/test.js')
def test_js():
    return send_from_directory("./js", "test.js")

@app.route('/main.wasm')
def main_wasm():
    return send_from_directory("./build", "main.wasm")

if __name__ == "__main__":
    app.templates_auto_reload = True
    app.debug = True
    app.run()