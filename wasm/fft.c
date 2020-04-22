#include "fft.h"

/* FFT state */
fft_state_t * fft_init(int n) {
  fft_state_t * state = malloc(sizeof(fft_state_t));
  state->n = n;
  state->cache = malloc(sizeof(fc32) * n);
  state->buffer = malloc(sizeof(fc32) * n);
  for(int x = 0; x < n; x++) {
    state->cache[x] = cexp(-I * M_PI * x / n);
  }
  return state;
}

/* 

  "Float like a float bot, sting like an automatic stinging machine."
  - Bender

*/
void _fft(fc32 output[], fc32 input[], fft_state_t * state, int step)
{
  static fc32 t;
	if (step < state->n) {
        
    /* compute out from buf for step*2 */
    _fft(input, output, state, step * 2);
    _fft(input + step, output + step, state, step * 2);
 
    /* using the recursive result, update buf */
		for (int i = 0; i < state->n; i += 2 * step) {
		  t = state->cache[i] * input[i + step];
			output[i / 2]     = input[i] + t;
			output[(i + state->n)/2] = input[i] - t;
		}
	}
}

/* update the state with the input buffer, and kick off round 1 */
void fft(fc32 buf[], fft_state_t * state)
{
  memcpy(state->buffer, buf, state->n*sizeof(fc32));
	_fft(buf, state->buffer, state, 1);
}