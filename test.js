import { PlutoSDR } from "./pluto.js";
import { WaterfallPlot } from "./plot.js";

var pluto = null;

window.addEventListener("DOMContentLoaded", async() => {

  var spec = new WaterfallPlot(1100, 200);

  // document.querySelector("#dothing").addEventListener("click", async() => {
    pluto = new PlutoSDR();
    await pluto.init(spec);
    console.log(pluto.serialNumber);
    // console.log(pluto.deviceMeta);
    console.log(pluto);
  // }, false);

}, false);