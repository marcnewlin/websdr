class WaterfallPlot {
  constructor(width=1024, height=500, bins=1024, parent=document.querySelector("#plot")) {

    this.bins = bins;

    /* setup the histogram canvas */
    this.hist = document.createElement("canvas");
    this.hist.width = this.width = width;
    this.hist.height = this.height = height;
    this.hist.id = "fft-canvas";
    parent.appendChild(this.hist);
    this.histCtx = this.hist.getContext("2d");
    this.histCtx.clearRect(0, 0, this.width, this.height);
    this.histCtx.beginPath();
    this.histCtx.fillStyle = "black";
    this.histCtx.strokeStyle = "limegreen";
    this.histCtx.fillRect(0, 0, this.width, this.height);
    this.histCtx.stroke();  
  }

  async drawFrame(magnitudes) {
    await Promise.all([this.drawHistogramFrame(magnitudes)]);
  }

  async drawHistogramFrame(magnitudes) {

    /* clear the histogram */
    this.histCtx.beginPath();
    this.histCtx.fillRect(0, 0, this.width, this.height);

    /* draw the frequency plot, scaled to the canvas dimensions */
    for(let x = 0; x < this.bins; x++) {

      /* get the canvas-scaled (x, y) values for this bin */
      let x2 = ((x + this.bins/2) % this.bins) * this.width / this.bins;
      let y2 = this.height-((100+magnitudes[x])*(this.height/100));

      /* conditionally wrap the line at 0 and bins/2 */
      if(x === 0 || x == this.bins/2) { this.histCtx.moveTo(x2, y2); }
      
      /* add the next point */
      this.histCtx.lineTo(x2, y2);
    }

    /* draw the line */
    this.histCtx.stroke();
  }
}

export { WaterfallPlot }
