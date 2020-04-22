# websdr - a hacky proof-of-concept using a PlutoSDR from a web browser

## how to use this

1. clone the repo
2. `make`
3. `./server.py`
4. http://127.0.0.1:5000/

Assuming nothing broke, you'll see something like the below screenshot (defaulting to 10MS/s sample rate, and a 915MHz center frequency).

![screenshot](img/screenshot.png)

## how does this work?

I hacked together a libiio-like driver using WebUSB, am streaming IQ to the browser, computing an FFT with a simple Wasm implementation, and displaying a histogram by drawing lines on a canvas.