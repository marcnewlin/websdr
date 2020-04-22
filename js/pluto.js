const PlutoSDR_USB_VID = 0x0456;
const PlutoSDR_USB_PID = 0xb673;
const IIO_USD_CMD_RESET_PIPES = 0;
const IIO_USD_CMD_OPEN_PIPE = 1;
const IIO_USD_CMD_CLOSE_PIPE = 2;
const IIO_USB_INTERFACE = 5;

class PlutoSDR {

  /* private instance variable declarations */
  #serialNumber // serial number
  #xmlMeta      // xml metadata

  /* device property getters/setters */
  get serialNumber() { return this.#serialNumber; }
  get xmlMeta() { return this.#xmlMeta; }

  /* center frequency getters/setters */
  async getCenterFreq() { 
    let rx = parseInt(await this.readReg("altvoltage0", "OUTPUT", "frequency"));
    let tx = parseInt(await this.readReg("altvoltage1", "OUTPUT", "frequency"));
    if(rx !== tx) throw `RX and TX center frequencies don't match. (${rx} !== ${tx})`;
    return rx;
  }
  async setCenterFreq(freq) {
    let fs = `${freq}`;
    await this.writeOutput("altvoltage0", "frequency", fs);
    await this.writeOutput("altvoltage1", "frequency", fs);
  }

  /* constructor */
  constructor() {
    this.pluto = null;
    this.te = new TextEncoder();
    this.td = new TextDecoder();
  }

  async executeVendorCommand(command, value=0) {
    let result = await this.pluto.controlTransferOut({
      requestType: "vendor",
      recipient: "interface",
      request: command,
      value: value,
      index: IIO_USB_INTERFACE,
      data: null  
    });
    if(result.status !== "ok") { throw "Vendor command " + command + " failed!"; }
  }

  async readInt() {
    var result = await this.pluto.transferIn(0x06, 10);
    if(result.status !== "ok") {
      throw "readInt() failed";
    }  
    return parseInt(this.td.decode(result.data.buffer));
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async sendCommands(commands, out_ep=0x04, in_ep=0x06) {
    await this.asyncForEach(commands, async(command) => {
        await this.executeCommandNoResponse(command, out_ep);
    });
    let res = await this.pluto.transferIn(in_ep, 10);
    if(res.status !== "ok") throw "sendCommands(): reading response code failed";
    var val = parseInt(this.td.decode(res.data.buffer));
    return val;
  }

  async writeReg(channel, direction, register, value) {
    let ntval = `${value}\x00`;
    let writeCommand = `WRITE iio:device1 ${direction} ${channel} ${register} ${ntval.length}\r\n`;
    var val = await this.sendCommands([writeCommand, ntval]);
    if(val !== ntval.length) throw "writeReg() failed, bad length";
  }

  async readReg(channel, direction, register) {
    
    /* send the READ command to the device */
    let readCommand = `READ iio:device1 ${direction} ${channel} ${register}\r\n`;
    var len = await this.sendCommands([readCommand]);
    if(len < 0) throw `readReg() failed with error code ${len}`;
    
    /* read in the response */
    let result = await this.pluto.transferIn(0x06, 1024);
    console.log(result);
    if(result.status !== "ok") { throw "READ response read failed"; }
    let data = this.td.decode(result.data.buffer);

    /* return the data as an ArrayBuffer */
    return data;
  }   

  async writeInput(channel, register, value) {
    await this.writeReg(channel, "INPUT", register, value);
  }

  async writeOutput(channel, register, value) {
    await this.writeReg(channel, "OUTPUT", register, value);
  }  

  async getXmlMeta() {

    /* send the PRINT command, which returns the XML length */
    let dataLen = await this.sendCommands(["PRINT\r\n"]);

    /* read in the XML */
    let result = await this.pluto.transferIn(0x06, dataLen);
    if(result.status !== "ok") { throw "PRINT response read failed"; }
    let data = this.td.decode(result.data.buffer);

    /* read in the terminating newline */
    result = await this.pluto.transferIn(0x06, 10);
    if(result.status !== "ok") { throw "PRINT failed reading terminating newline"; }

    /* parse the XML */
    let parser = new DOMParser();
    this.#xmlMeta = parser.parseFromString(data, "text/xml");

    console.log(this.#xmlMeta);
    console.log(data);
  }

  async executeCommandNoResponse(command, ep=0x04) {

    let te = new TextEncoder();
    let result = await this.pluto.transferOut(ep, te.encode(command));
    if(result.status !== "ok") throw "command '" + command + "'failed";
    return result;
  }

  async openDevice(pipe, dev, sampleCount, channelMask, timeout) {

    /* open the pipe */
    await this.executeVendorCommand(IIO_USD_CMD_OPEN_PIPE, pipe);

    /* configure the channel */
    let command = `OPEN ${dev} ${sampleCount} ${channelMask}`;
    let ret = await this.sendCommands([`${command}\r\n`], 0x04+pipe, 0x06+pipe);
    if(ret !== 0) throw `${command} failed with code ${ret}`;

    /* set the I/O timeout */
    command = `TIMEOUT ${timeout}`;
    ret = await this.sendCommands([`${command}\r\n`], 0x04+pipe, 0x06+pipe);
    if(ret !== 0) throw `${command} failed with code ${ret}`;   
  }

  async init(plot) {

    // enumerate connected device we have permission to access
    let devices = await navigator.usb.getDevices();
    devices.forEach(device => {
      
      // select the first PlutoSDR
      if(this.pluto === null) {
        if(device.vendorId == PlutoSDR_USB_VID && 
          device.productId == PlutoSDR_USB_PID) {
          this.pluto = device;
        }
      }
    });

    // if we couldn't find an authorized PlutoSDR, request access
    if(this.pluto === null) {

      // request device by USB VID/PID
      let device;
      try {
        device = await navigator.usb.requestDevice({ filters: [{
          vendorId: PlutoSDR_USB_VID,
          productId: PlutoSDR_USB_PID
        }]});
      } catch (err) {
    
        // error requesting the PlutoSDR
        console.log("ERROR REQUESTING USB DEVICE:")
        console.log(err);
      }
    
      // select the device
      if (device !== undefined) {
        this.pluto = device;
      }
    }

    // report failure if we couldn't find a PlutoSDR
    if(this.pluto === null) {
      alert("No PlutoSDR found!");
      return;
    }

    /* update the serial number */
    this.#serialNumber = this.pluto.serialNumber;

    /* setup the USB device */
    await this.pluto.open();
    await this.pluto.selectConfiguration(1);
    await this.pluto.claimInterface(5);    
    await this.executeVendorCommand(IIO_USD_CMD_RESET_PIPES, 0);
    await this.executeVendorCommand(IIO_USD_CMD_OPEN_PIPE, 0);

    /* read the XML config */
    this.getXmlMeta();

    /* initial configuration */
    let config = {
      devices: [{
        name: "device1",
        channels: [{
          name: "voltage0",
          input: {
            rf_port_select: "A_BALANCED",
            rf_bandwidth: "10000000",
            sampling_frequency: "10000000",
          },
          outut: {
            rf_port_select: "A",
            rf_bandwidth: "10000000",
            sampling_frequency: "10000000",
          }
        }]
      }]
    };

    /* iterate and set the initial configuration */
    for(let x in config.devices) {
      let d = config.devices[x];
      for(let y in d.channels) {
        let channel = d.channels[y];
        for(let register in channel.input) {
          await this.writeInput(channel.name, register, channel.input[register]);
        }
        for(let register in channel.output) {
          await this.writeOutput(channel.name, register, channel.output[register]);
        }
      }
    }
    let conf = {
      centerFrequency: 915e6
    }

    /* update the CF */
    await this.setCenterFreq(conf.centerFrequency);

    /* configure the RX channel */
    await this.openDevice(1, "iio:device4", 262144, "00000003", 2500);
    
    /* sample counts and buffers */
    let sampleCount = 262144;
    let byteCount_fc32 = sampleCount * 8;
    var buffer_in_fc32 = Module._malloc(byteCount_fc32);
    var buffer_out_fc32 = Module._malloc(byteCount_fc32);

    for(let count = 0; count < 1000; count++) {
  
      /* send commands to read 1MB of IQ */
      let ret = await this.sendCommands(["READBUF iio:device4 1048576\r\n"], 0x05, 0x07);
      if(ret !== 1048576) throw `READBUF iio:device4 1048576 failed with code ${ret}`;
      let res = await this.pluto.transferIn(0x07, 1024);
      if(res.status !== "ok") throw "IQ RX reading response code failed";
      let val = parseInt(this.td.decode(res.data.buffer));
      if(val != 3) throw "read got " + val + " expected 3"

      /* read in the IQ */
      ret = await this.pluto.transferIn(0x07, 1048576);
      let view = new Int16Array(ret.data.buffer);

      /* marshal IQ to wasm */
      for(let x = 0; x < sampleCount*2; x++) {
        Module.setValue(buffer_in_fc32+x*2, view[x], 'i16');
      }

      /* compute FFT, producing float magnitude output */
      console.log(Module.ccall('fft_fc32', null, ['number', 'number', 'number', 'number'], [buffer_in_fc32, 262144, buffer_out_fc32, 1024]));

      /* update the histogram */
      let mags = new Float32Array(1024);
      for(let o = 0; o < 100; o++) {

        /* read out 1024 magnitude values */
        for(let n = 0; n < 1024; n++) mags[n] = Module.getValue(buffer_out_fc32+(n*4)+(o*4096), 'float');

        /* draw the next frame */
        await plot.drawFrame(mags);
      }
    }
  }
}

export { PlutoSDR }

