#include <emscripten.h>

#include "fft.h"

#include <stdio.h>
#include <string.h>
#include <math.h>
#include <complex.h>


/* global FFT state */ 
fft_state_t * fft_state;


/* FFT on complex float input, float magnitude output */
int fft_fc32(int16_t * input, int32_t sample_count, float * output, int32_t bins) {
  
  // convert from SC16 to FC32
  for(int x = 0; x < sample_count*2; x++) {
    output[x] = (double)input[x] / 2048.0 /* 2**11 */;
  }

  // compute FFT
  for(int x = 0; x < sample_count/bins; x++) {
    fft((fc32 *)&output[x*2*bins], fft_state);
  }

  // compute magnitude in decibels
  fc32 * oc = (fc32 *)output;
  double b2 = bins/2.0;
  double mag;
  for(int x = 0; x < sample_count; x++)
  {
    mag = cabsf(oc[x]);
    if(mag != mag) mag = 0;
    output[x] = 20*log10(mag/b2);
  }

  return bins;
}


/* main function; initialize the FFT state */
int main() { 
  fft_state = fft_init(1024);
}