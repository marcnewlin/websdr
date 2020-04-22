#ifndef FFT_H
#define FFT_H

#include <emscripten.h>
#include <complex.h>
#include <math.h>
#include <string.h>

typedef float complex fc32;

typedef struct {
  int n;
  fc32 * cache;
  fc32 * buffer;
} fft_state_t;

fft_state_t * fft_init(int n);
void _fft(fc32 buf[], fc32 out[], fft_state_t * state, int step);
void fft(fc32 buf[], fft_state_t * state);

#endif // FFT_H