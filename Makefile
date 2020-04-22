all: main

main:
	emcc -O0 -o main.html main.c fft.c -s 'EXTRA_EXPORTED_RUNTIME_METHODS=["ccall", "cwrap", "getValue", "setValue"]' -s EXPORTED_FUNCTIONS="['_fft_fc32', '_main']" -s ASSERTIONS=1