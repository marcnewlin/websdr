import { PlutoSDR } from "./pluto.js";
import { WaterfallPlot } from "./plot.js";

var pluto = null;

window.addEventListener("DOMContentLoaded", async() => {

  var spec = new WaterfallPlot(1024, 500);
  pluto = new PlutoSDR();
  await pluto.init(spec);
  console.log(pluto.serialNumber);
  console.log(pluto);

}, false);