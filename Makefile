all: main

main:
	mkdir -p build
	emcc -O0 -o build/main.html wasm/main.c wasm/fft.c -s 'EXTRA_EXPORTED_RUNTIME_METHODS=["ccall", "cwrap", "getValue", "setValue"]' -s EXPORTED_FUNCTIONS="['_fft_fc32', '_main']" -s ASSERTIONS=1