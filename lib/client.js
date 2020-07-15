/*!
 * client library
 * 
 * Note: client, device/server application objects are all m2m clients
 * communicating with m2m server for routing services.  
 *
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const _WebSocket = require('ws');
const colors = require('colors');
const inquirer = require('inquirer');
const EventEmitter = require('events');
class StateEmitter extends EventEmitter {}
const emitter = exports.emitter = new StateEmitter();
const m2mv = require('../package.json');
emitter.setMaxListeners(2);

const processArgs = process.argv.slice(2);
const defaultNode = exports.defaultNode = "https://www.node-m2m.com", THRESHOLD = 1024;
const systemInfo = { 
  type: os.arch(),
  mem: {total: (os.totalmem()/1000000).toFixed(0) + ' ' + 'MB' , free: (os.freemem()/1000000).toFixed(0) + ' ' + 'MB'},
  m2mv: 'v' + m2mv.version,
  os: os.platform()
};
var spl = {}, options = {}, testOption = {};

/****************************************

        APPLICATION UTILITY OBJECT 
    (common utility/support functions)

 ****************************************/
const m2mUtil = exports.m2mUtil = (() => {

  let d1 = null, d2 = null;

  function st(){
    d1 = new Date();
    return d1; 
  }

  function et(m){
    d2 = new Date();
    let eT = d2-d1;
    if(m === 1){
      console.log(eT + ' ms');
    }
    else if(m === undefined){
      return (eT + ' ms');
    }
  }

  fs.stat('m2m_log', (err, stats) => {
    if (err) {
      if(err.code === 'ENOENT'){
        fs.mkdir('m2m_log', { recursive: true }, (err) => {
          if (err) { return console.log('m2mlog fs.mkdir err', err);}
          fs.appendFileSync('m2m_log/log.txt', '       Date' + '                           Activity');
        });
      }
    }
  });

  function log(filepath, msg, data){
    let file_size = 10000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString(); 
    fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data); 
    fs.stat('m2m_log/log.txt', (err, stats) => {
      if (err) { return console.log('m2mlog fs.stat err', err);}
      if(stats.size > file_size){
        fs.writeFileSync('m2m_log/log.txt', '   Date' + '                           Activity');
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data); 
      }
    });
  }

  function trackClientId(appId, cb){
    fs.readFile('m2m_log/client_active_link', (err, data) => {
      if(err && err.code === 'ENOENT'){
        let d = []; 
        d.push(appId); 
        return fs.writeFileSync('m2m_log/client_active_link', JSON.stringify(d));
      } 
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift(); 
      }
      data.push(appId);
      data = JSON.stringify(data); 
      fs.writeFileSync('m2m_log/client_active_link', data);
      if(cb){
        setImmediate(cb, data);
      }
    });
  }

  const rid = exports.rid = (n) => {
    return crypto.randomBytes(n).toString('hex');
  };

  function setDataEvent(rxd, arrayData){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && rxd.name && rxd.event && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name){
          return true; 
        }
        if(arrayData[i] && rxd.input && rxd.event && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
          return true;
        }
        if(arrayData[i] && rxd.output && rxd.event && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
          return true;
        }
      }
    }
    arrayData.push(rxd);
    return false;
  }

  const startConnect = exports.startConnect = (cb) => {
    let eventName = 'connect';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        if(cb){
          if(Array.isArray(data)){
            return cb(null, 'registration fail');
          }
          cb(null, data);
        }
      });	 
    }
  };

  return {
    st: st,
    et: et,
    log: log,
    rid: rid,
    setDataEvent: setDataEvent,
    trackClientId: trackClientId
  }

})(); // m2mUtil


/********************************************

          APPLICATION CLIENT OBJECT

 ********************************************/
const client = (() => {
  let userDevices = [], clientDeviceId = [], activeSyncGpioData = [], activeSyncChannelData = [];
  let activeTry = 0, http = false, clientChannelDataListener = null, clientInputEventListener = null;

  function activeSync(data, arrayData){
    if(arrayData.length < 1){
    return;
    }
    arrayData.forEach(function(pl){
      if(pl.id === data.id && data.active){
        pl.aid = data.aid;
        if(!pl.device && pl.event && (pl.name || pl.input)){
          websocket.send(pl);
        }
      }
    });
  }

  function deviceOffline(data, arrayData){
    arrayData.forEach((pl) => {
      if(pl.id === data.id){
        data = Object.assign({}, pl); 
        data.error = 'device['+pl.id+'] is off-line';
        if(pl.name){
          data.name = pl.name;
          let eventName = pl.id + pl.name + pl.event + pl.watch;
          emitter.emit(eventName, data);
        }
        else if(pl.input){
          data.input = pl.input;
          let eventName = pl.id + pl._pid + pl.pin + pl.event + pl.watch;
          emitter.emit(eventName, data);
        } 
      }
    });
  }
  
  function clientDeviceActiveStartProcess(rxd){
    process.nextTick(activeSync, rxd, activeSyncChannelData);
    process.nextTick(activeSync, rxd, activeSyncGpioData);
    if(activeTry === 0){
      console.log('device['+ rxd.id +'] is online');
      activeTry++;
    }
  }

  function clientDeviceOffLineProcess(rxd){
    process.nextTick(deviceOffline, rxd, activeSyncChannelData);
    process.nextTick(deviceOffline, rxd, activeSyncGpioData);
    console.log('device['+ rxd.id +'] is offline');
    activeTry = 0;
  }

  function removeActiveSyncDataEvent(rxd, arrayData,  cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        try{
          if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name){
            arrayData.splice(i,1);
            return setImmediate(cb, null, true);
          }
          if(arrayData[i] && rxd.input && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return setImmediate(cb, null, true);
          }
          if(arrayData[i] && rxd.output && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return setImmediate(cb, null, true);
          }
        }
        catch(e){
          cb(e, null);
        }
      }
    }
  }

  function getClientStatus(rxd){
    let appIds = fs.readFileSync('m2m_log/client_active_link', 'utf8');
    rxd.active = true;
    rxd.appId = rxd.id;
    rxd.appIds = JSON.parse(appIds);
    rxd.systemInfo = systemInfo;
    rxd.clientDeviceId = clientDeviceId;
    if(options && Object.keys(options).length > 0){
      rxd.options = options;
    }
    else{
      rxd.options = {};
      rxd.options.name = 'n/a';
      rxd.options.location = 'n/a';
    }
    emitter.emit('emit-send', rxd); 
  }

  /*******************************************
  
          Device Access Constructor

  ********************************************/
  const deviceAccess = exports.deviceAccess = function (i, id) { 
    this.id = id;
    this._index = i;
    this.in = this.input; 
    this.out = this.output;
    this.getSystemInfo = this.setupInfo;
   };

  /***************************************
  
      Channel Access Support Functions

  ****************************************/
  function setClientDataListener(pl, cb){
    let eventName = pl.id + pl.name + pl.event + pl.watch;
    clientChannelDataListener = function (data) {
      if(!data.unwatch && data.id === pl.id && data.name === pl.name){
        if(cb){
          if(data.error){
            return cb(new Error(data.error), null);
          }
          if(data.result){
            return cb(null, data.result);
          }
          if(data.value){
            return cb(null, data.value);
          }
        }
      }
    };

    if(pl.event){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncChannelData);
      if(duplicate){
        return;
      } 
    }

    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, clientChannelDataListener);
    }
  }

  function getChannelData(args, cb){
    if(!args.name || typeof args !== 'object') {
      throw new Error('invalid arguments');
    }
    let poll = null, interval = null, frequency = null;
    let pl = Object.assign({}, spl);
    pl.id = args.id;
    pl.channel = true;
    pl.name = args.name;
    pl.event = args.event;
    pl.frequency = frequency;
    pl._pid = 'channel-data';

    pl.dst = 'device';

    if(pl.event === false){
      pl.watch = false;
    }
    if(pl.event){
      pl.watch = true;
      pl.frequency = args.frequency;
      pl.interval = args.interval;
    }
   
    if(args.getData){
      pl.getData = true;
    }
    if(args.sendData){
      pl.sendData = true;
      pl.payload = args.payload;
    }
    // http get simulation
    if(args.get){
      pl.api = pl.name;
      pl.get = true; 
    }
    // http post simulation
    if(args.post){
      pl.api = pl.name;
      pl.post = true; 
      pl.body = args.body;
    }
       
    if((pl.get || pl.getData)  && !cb){
      throw new Error('callback argument is required');
    }  
    setClientDataListener(pl, cb);
    websocket.send(pl);
  }

  function unwatchChannelData(args, cb){
    if(!args.name || typeof args !== 'object') {
      throw new Error('invalid arguments');
    }
    let pl = Object.assign({}, spl); 
    pl._pid = 'channel-data';
    pl.id = args.id;
    pl.name = args.name;
    pl.channel = true;
    pl.event = false;
    pl.unwatch = true;
    pl.dst = 'device';

    let eventName = pl.id + pl.name + pl.event + pl.watch + pl.unwatch;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data.name === pl.name){
          if(cb){
            if(data.error){
              return cb(new Error(data.error), null);
            }
            // valid unwatch channel, successfully unwatch channel name, returns true
            if(data.unwatch){
              removeActiveSyncDataEvent(data, activeSyncChannelData, (err, status) => {
                if(err){
                  return cb(err, null);
                }
                cb(null, data.unwatch);
                // remove watch listener, not unwatch listener
                emitter.removeListener(eventName,  clientChannelDataListener);
              });
            }
          }
        }
      });
    }
    websocket.send(pl);
  }

  /************************************************
    
      Device Channel Access Property Constructor

   ************************************************/
  // non-event property data capture only
  const getData = function(cb){
    websocket.initCheck();
    let args = {};
    args.id = this.id;
    args.event = false;
    args.name = this.args; 
    args.rcvd = true;
    args.getData = true;
    getChannelData(args, cb);
  };

  // non-event property data capture w/ payload
  const sendData = function(payload, cb){
    websocket.initCheck();
    if(typeof payload !== 'string' && typeof payload !== 'object' && typeof payload !== 'number'){
      throw new Error('invalid arguments');
    }
    let args = {};
    args.id = this.id;
    args.event = false;
    args.sendData = true;
    args.name = this.args;
    args.payload = payload;
    getChannelData(args, cb);
  };

  const get = function(cb){
    websocket.initCheck();
    let args = {};
    args.id = this.id;
    args.event = false;
    args.get = true;
    args.api = this.args;
    args.name = this.args;
    getChannelData(args, cb);
  };

  // non-event properties http post sim data capture
  const post = function(body, cb){
    websocket.initCheck();
    if(typeof body !== 'string' && typeof body !== 'object'){
      throw new Error('invalid arguments');
    }
    let args = {};
    args.body = body;
    args.id = this.id;
    args.event = false;
    args.post = true;
    args.api = this.args;
    args.name = this.args;
    getChannelData(args, cb);
  };

  function Channel(id, args){
    this.id = id;
    this.args = args;
  }

  Channel.prototype = { 
    constructor: Channel,

    // http simulation properies
    get:get,
    post: post,

    // non-event properties
    getData: getData,
    sendData: sendData,

    unwatch: function(cb){
      websocket.initCheck();
      let args = {};
      args.id = this.id;
      args.event = false;
      args.name = this.args; 
      unwatchChannelData(args, cb);
    },

    // event-based property
    watch: function(o, cb){
      websocket.initCheck();
      let args = {};
      args.event = true;
      args.id = this.id;
      args.name = this.args;
      args.interval = 5000;
      if(arguments.length === 1 && typeof o === 'function'){
        cb = o;
      }
      else if(arguments.length === 2 && typeof cb === 'function'){
        if(Number.isInteger(o)){
          args.interval = o;
        }
        else if(typeof o === 'object'){
          if(o.interval && Number.isInteger(o.interval)){
            args.interval = o.interval;
          }
          if(o.poll){
            args.interval = o.poll;
          }
        }
        else{
          throw new Error('invalid arguments');
        }
      }
      getChannelData(args, cb);
    },
  };

   /****************************************
  
      GPIO Input Access Support Functions

   *****************************************/
  function setClientInputGpioListener (pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    // input emitter event listener
    clientInputEventListener = function (data){
      if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
        if(cb){
          if(data.error){
            return cb(new Error(data.error), null);
          }
          cb(null, data.state);
        }
      }
    };
    if(pl.event){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncGpioData);
      if(duplicate){
        return;
      } 
    }     
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, clientInputEventListener);
    }
  }

  function getGpioInputData(args, cb){
    if(!args.pin || !args._pid || typeof args !== 'object'){
      throw new Error('invalid arguments');
    }
    if(!cb){
      throw new Error('callback argument is required');
    }

    let pl = Object.assign({}, spl); 
    pl._pid = args._pid;
    pl.id = args.id;
    pl.pin = args.pin;
    pl.input = true;
    pl.gpioInput = true;
    pl.event = args.event;

    pl.dst = 'device';

    if(pl.event === false){
      pl.getState = true;
      pl.watch = false;
    }
    else if(pl.event){
      pl.watch = true;
      pl.frequency = args.frequency;
      pl.interval = args.interval;
    }

    setClientInputGpioListener(pl, cb);
    websocket.send(pl);  
  }

  function unwatchGpioInputPin(args, cb){
    if(!args.pin || typeof args !== 'object'){
      throw new Error('invalid arguments');
    }
    let pl = Object.assign({}, spl); 
    pl._pid = args._pid;
    pl.id = args.id;
    pl.pin = args.pin;
    pl.input = true;
    pl.gpioInput = true;
    pl.event = false;
    pl.unwatch = true;

    pl.dst = 'device';

    if(cb && typeof cb === 'function'){
      let eventName = pl.id + pl._pid + pl.pin + pl.event + pl.watch;
      if(emitter.listenerCount(eventName) < 1){
        emitter.once(eventName, (data) => {
          if(data.id === pl.id && data.pin === pl.pin){
            if(cb){
              if(data.error){
                return cb(new Error(data.error), null);
              }
              // valid unwatch pin, successfully unwatch an input pin, returns true
              if(data.unwatch){
                removeActiveSyncDataEvent(data, activeSyncGpioData, (err, status) => { 
                  if(err){
                    return cb(err, null);
                  }
                  cb(null, data.unwatch);
                  // remove watch listener, not unwatch listener
                  emitter.removeListener(eventName,  clientInputEventListener);
                });
              }
            }
          }
        });
      }
    }
    websocket.send(pl);
  }

  /**********************************************
    
      Device Input Access Property Constructor

   **********************************************/

  const inputState = function(cb){
    websocket.initCheck();
    let args = {};
    args.id = this.id;
    args.pin = this.pin;
    args.event = false;
    args._pid = 'gpio-input-state';
    getGpioInputData(args, cb);
  };
  
  function Input(id, pin) {
      this.id = id;
      this.pin = pin;
  }

  Input.prototype = { 
    constructor: Input,

    // GPIO input non-event properties
    state: inputState,
    getState: inputState,

    unwatch: function(cb){
      websocket.initCheck();
      let args = {};
      args.id = this.id;
      args.pin = this.pin;
      args.event = false;
      args._pid = 'gpio-input';
      unwatchGpioInputPin(args, cb);
    },

    // GPIO input event-based property
    watch: function(o, cb){
      websocket.initCheck();
      let args = {};
      args.event = true;
      args.id = this.id;
      args.pin = this.pin;
      args.interval = 5000;
      args._pid = 'gpio-input';
      if(arguments.length == 1 && typeof o === 'function'){
        cb = o;
      }
      else if(arguments.length  === 2 && typeof cb === 'function'){
        if(Number.isInteger(o)){
          args.interval = o;
        }
        else if(typeof o === 'object'){
          if(o.interval && Number.isInteger(o.interval)){
            args.interval = o.interval;
          }
          if(o.poll){
            args.interval = o.poll;
          }
        }
        else{
          throw new Error('invalid arguments');
        }
      }
      getGpioInputData(args, cb);
   }
  }; 
  /**********************************************
    
      Device Output Access Support Functions

   **********************************************/
  function setClientGpioOutputListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
          if(cb){
            if(data.error){
              return cb(new Error(data.error), null);
            }
            cb(null, data.state);
          }
        }
      });
    }
  }

  function GpioControl(t, pl){ 
    if(typeof t === 'number'){
      if(t === 0){
        return websocket.send(pl);
      }
      return setTimeout(websocket.send, t, pl); 
    }
    websocket.send(pl);
  }

  /***********************************************
    
      Device Output Access Property Constructor

   ***********************************************/

   // GPIO Output get output pin state or status 
   const outputState = function(cb){
    if(!cb){
      throw new Error('callback argument is required');
    }
    websocket.initCheck();
    let pl = Object.assign({}, spl); 
    pl._pid = 'gpio-output-state';
    pl.id = this.id;
    pl.pin = this.pin;
    pl.output = 'state';
    pl.gpioOutput = true;
    pl.state = null;
    pl.event = false;
    pl.watch = false;
    pl.dst = 'device';

    let data = JSON.stringify(pl);
    
    if(cb && typeof cb === 'function'){
      setClientGpioOutputListener(pl, cb);
    }
    websocket.send(data);
  }; 

  function Output(id, pin){
      this.id = id;
      this.pin = pin;
  }

  Output.prototype = { 
    constructor: Output,

    // GPIO Output get output pin state or status 
    state:outputState,
    getState:outputState,

    // GPIO output ON pin control
    on: function(t, cb){
      websocket.initCheck();
      let pl = Object.assign({}, spl);
      pl._pid = 'gpio-output-on';
      pl.id = this.id;
      pl.pin = this.pin;
      pl.output = 'on'; 
      pl.gpioOutput = true;
      pl.on = true;
      pl.state = null;
      pl.event = false;
      pl.watch = false;
      pl.dst = 'device';
      if(typeof t === 'number'){ 
        pl.t = t;
      }
      if(typeof t === 'function'){
        cb = t;
      } 
      if(cb && typeof cb === 'function'){
        setClientGpioOutputListener(pl, cb);
      }
      GpioControl(t, pl);
    },

    // GPIO Output OFF pin control
    off: function(t, cb){
      websocket.initCheck();
      let pl = Object.assign({}, spl);
      pl._pid = 'gpio-output-off';
      pl.id = this.id;
      pl.pin = this.pin;
      pl.output = 'off';
      pl.gpioOutput = true;
      pl.off = true;
      pl.state = null;
      pl.event = false;
      pl.watch = false;
      pl.dst = 'device';
      if(typeof t === 'number'){ 
        pl.t = t;
      }
      if(typeof t === 'function'){
        cb = t;
      } 
      if(cb && typeof cb === 'function'){
        setClientGpioOutputListener(pl, cb);
      }
      GpioControl(t, pl);
    }, 
  };

  /******************************************
  
          Accesss Device Properties

  *******************************************/
  function setupInfo(cb){
    websocket.initCheck();
    let pl = Object.assign({}, spl); 
    pl._pid = 'setupData';
    pl.id = this.id;
    pl.setupData = true;
    pl.dst = 'device';
    if(typeof cb === 'function'){
      let eventName = pl.id + pl._pid;
      if(emitter.listenerCount(eventName) < 1){
        emitter.once(eventName, (data) => {
          if(data.id === pl.id && data.setupData){
            setImmediate(() => {
              if(cb){   
                if(data.error){
                  return cb(new Error(data.error), null);
                }
                cb(null, data.setupData);
              }
            });
          }
        });
      }
    }
    setImmediate(() => {  
      websocket.send(pl);
    });
  }

  // gpio output property
  const GpioOutput = function(pin){
    websocket.initCheck();
    return new Output(this.id, pin);
  };

  // gpio input property
  const GpioInput = function(pin){
    websocket.initCheck();
    return new Input(this.id, pin);
  };

  deviceAccess.prototype = { 
    constructor: deviceAccess,

    // get available resources and system information of a particular remote device
    setupInfo: setupInfo,

    // common input/output gpio property
    // e.g. device.gpio
    gpio: function(args){
      websocket.initCheck();
      if(typeof args !== 'object'){
        throw new Error('invalid argument');
      }
      if(!args.pin||!args.mode){
        throw new Error('invalid argument');
      }
      if(args.mode === 'input' || args.mode === 'in'){
        return new Input(this.id, args.pin);
      }
      if(args.mode === 'output' || args.mode === 'out'){
        return new Output(this.id, args.pin);
      }
      else{
        throw new Error('invalid argument');
      }
    },

    // gpio output property
    // e.g. device.output or device.out 
    out:GpioOutput,
    output:GpioOutput,
    // gpio input property
    // e.g device.input or device.in
    in:GpioInput,
    input:GpioInput,

    // channel data non-event properties
    // e.g. device.channel
    channel: function(args){
      websocket.initCheck();
      return new Channel(this.id, args);
    },

    // e.g. device.getData
    getData: function(args, cb){
      websocket.initCheck();
      getChannelData(args, cb);
    },

    // e.g. device.unwatch 
    unwatch: function(args, cb){
      websocket.initCheck();
      unwatchChannelData(args, cb);
    },

    // http get/post method simulation
    // e.g. device.api
    api: function(args){
      websocket.initCheck();
      http = true;
      return new Channel(this.id, args);
    },

    // channel data event-based properties
    // e.g. device.watch
    watch: function(args, cb){
      websocket.initCheck();
      getChannelData(args, cb);
    },

    on: function(args, cb){
      websocket.initCheck();
      getChannelData(args, cb);
    },
  };

  function getUserDevices(){
    return  userDevices;
  }

  function setUserDevices(value){
    userDevices = value;
  }

  function getRemoteDevices(rxd){
    if(clientDeviceId.length > 0 && rxd && rxd.devices && rxd.devices.length > 0){ 
      let validServerID = [];
      clientDeviceId.forEach((ud) => {
        rxd.devices.forEach((vd) => {
          if(ud === vd){
            validServerID[ud] = ud;
          }
        });  
      });
      try{
        clientDeviceId.forEach((ud)=>{
          if(validServerID[ud] === undefined){
            console.log('**device',ud,'is offline or invalid!');
          }
        });
      }
      catch(e){
        console.log(e);
      }
    }
  }

  const setGetDeviceIdListener = (() => {
    let eventName = 'getDeviceId';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        setImmediate(() => {
          if(Array.isArray(data) && data.length > 0){
            clientDeviceId = data;
          }
          else if(Number.isInteger(data)){
            clientDeviceId.push(data);
          }
        }); 
      });	 
    }
  })();

  const getRegisteredDevices = exports.getRegisteredDevices = function (){
    websocket.initCheck();
    if(userDevices){
      if(userDevices.length > 0){
        clientDeviceId = userDevices;
      }
    }
    let pl = Object.assign({}, spl);
    pl._pid = 'getRegisteredDevices';
    pl.getRegisteredDevices = true;
    websocket.send(pl);
  };
 
  const initGetDevices = exports.initGetDevices = function (cb){
    websocket.initCheck();
    setImmediate(() => {
      if(userDevices && userDevices.length > 0){
        return cb(null, userDevices);
      }
      cb(new Error('unable to retrieve list of devices, try with -r option'));
    });
  };

  const getDevices = exports.getDevices = function (cb){
    websocket.initCheck();
    if(userDevices && userDevices.length > 0){
      return cb(null, userDevices);
    }
    let pl = Object.assign({}, spl);
    pl._pid = 'getDevices';
    pl.getDevices = true;
    let eventName = pl.id + pl._pid;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data._pid === 'getDevices'){
          setImmediate(() => {
            if(cb){
              if(data.error){
                return cb(new Error(data.error), null);
              }
              userDevices =  data.devices;
              cb(null, data.devices);
            }
          });
        }
      });
    }
    websocket.send(pl);
  };

  return {
    getUserDevices: getUserDevices,
    setUserDevices: setUserDevices,
    getClientStatus: getClientStatus,
    getRemoteDevices:  getRemoteDevices,
    getRegisteredDevices:  getRegisteredDevices,
    clientDeviceOffLineProcess: clientDeviceOffLineProcess,
    clientDeviceActiveStartProcess: clientDeviceActiveStartProcess,
  }

})(); // client

/********************************************
 
          APPLICATION DEVICE OBJECT

 ********************************************/
const device = (() => {
  let gpioData = [], deviceGpioInput = [], deviceGpioOutput = [], watchInputData = [], watchOutputData = [], watchChannelData = [];
  let deviceInputEventnameHeader = 'gpio-Input', deviceOutputEventnameHeader ='gpio-Output', dataEventName = null,  outputGpioInterval = null;
  let r = null, enable = true, scanInterval = 5000, intInputPin = 0, intOutputPin = 0, extInputPin = 0, extOutputPin = 0, simInputPin = 0, simOutputPin = 0;
  let deviceSetup = { id: spl.id , systemInfo: {cpu: os.arch(), os: os.platform(), m2mv: m2mv.version, totalmem: ((os.totalmem()/1000000)).toFixed(0) + ' '
  + 'MB', freemem: ((os.freemem()/1000000)).toFixed(0) + ' ' + 'MB'}, gpio:{ input:{pin:[],type:null}, output:{pin:[],type:null}}, channel:{name:[]}};

  function getDeviceEnabledStatus(){
    return enable;
  }

  function setDeviceEnabledStatus(value){
    enable = value;
  }

  function resetWatchData(){
    watchInputData = [], watchOutputData = [], watchChannelData = [];
  }

  function getDeviceSetupData(rxd){
    rxd.setupData = deviceSetup;
    rxd.active = true;
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function gpioExitProces(){
    if(deviceGpioInput.length > 0){
      for(let x in deviceGpioInput){
        deviceGpioInput[x].close();      
      }
    }
    if(deviceGpioOutput.length > 0){
      for(let x in deviceGpioOutput){
        deviceGpioOutput[x].close();
      }
    }
  }

  function checkDataChange(rxd){
    setImmediate(() => {
      // rxd.value or rxd.result could be a string, number or object
      if(rxd.name && rxd.value && rxd.value !== rxd.initValue){
        // for channel data.value = sensor.data
        emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.value;
      }
      // for gpio input/output
      // rxd.state is a boolean value
      else if(rxd.input && rxd.state !== rxd.initValue){
        emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.state;
      }
      else if(rxd.output && rxd.state !== rxd.initValue){
        emitter.emit('emit-send', rxd);
        rxd.initValue = rxd.state;
      }
    });
  }

  function iterateDataEvent(arrayData){
    arrayData.forEach((rxd) => {
      if(rxd.name && rxd.event){  
        let eventName = rxd.name + rxd.id;
        if(dataEventName){
          eventName = dataEventName;
        }
        emitter.emit(eventName, rxd);
      }
      else if(rxd.input && rxd.event){ 
        let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd); 
      }
      else if(rxd.output && rxd.event){ 
        let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd);
      }
      if(rxd.event){
        process.nextTick(checkDataChange, rxd);
      }
    });
  }

  function startWatch(arrayData){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i]){
          clearTimeout(arrayData[i].watchTimeout);
          arrayData[i].watchTimeout = setTimeout(function tick() {
            if(arrayData[i]){
              iterateDataEvent(arrayData[i].watchEventData); 
              arrayData[i].watchTimeout = setTimeout(tick,  arrayData[i].interval);
            }
          }, arrayData[i].interval);
        }
      }
    }
  }

  function removeDataEvent(rxd, arrayData, cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        // remove a gpio input/output pin event as requested by a specific client  
        if(arrayData[i] && rxd.pin && rxd.unwatch && arrayData[i].pin === rxd.pin && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
          clearTimeout(arrayData[i].watchTimeout);
          arrayData.splice(i,1);
          emitter.emit('emit-send', rxd);
          if(cb){
            return setImmediate(cb, true);
          }
        }
        // remove a channel event as requested by a specific client 
        else if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].name === rxd.name && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
          clearTimeout(arrayData[i].watchTimeout);
          arrayData.splice(i,1);
          emitter.emit('emit-send', rxd);
          if(cb){
            return setImmediate(cb, true);
          }
        }
        // remove all device events per device id when a specific client goes offline
        else if(arrayData[i] && rxd.exit && rxd.stopEvent && arrayData[i].appId === rxd.appId){
          clearTimeout(arrayData[i].watchTimeout);
          arrayData[i] = null;
          return setImmediate(() => {
            arrayData = arrayData.filter(function(e){return e});
          });
        }
      }
    } 
    // no event, invalid watch event, nothing to unwatch
    if(rxd.channel){
      rxd.error = 'invalid channel';
    }
    else if(rxd.input){
      rxd.error = 'invalid input';
    }
    else if(rxd.output){
      rxd.error = 'invalid output';
    }
    emitter.emit('emit-send', rxd);
  }

  /***************************************
   
            Channel Data Setup

  ***************************************/ 
  function deviceGetDataEvent(rxd){
    let v = null;
    let eventName = rxd.name + rxd.id;

    if(dataEventName){
      v = emitter.emit(dataEventName, rxd);
    }else{   
      v = emitter.emit(eventName, rxd);
    }

    if(!v){
      rxd.error = 'invalid channel';
      if(rxd.api){
        rxd.error = 'invalid api';
      }
      return emitter.emit('emit-send', rxd);
    }
  }

  function deviceWatchChannelData(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    // don't add existing channel data during client refresh
    if(watchChannelData.length > 0){
      for (let i = 0; i < watchChannelData.length; i++ ) {
        if(watchChannelData[i] && watchChannelData[i].name === rxd.name && watchChannelData[i].appId === rxd.appId ){
          return;
        }
      }
    }

    deviceGetDataEvent(rxd);
    
    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    dataObject.name = rxd.name;

    if(rxd.result){
      rxd.initValue = rxd.result;
    }
    else if(rxd.value){
      rxd.initValue = rxd.value;
    }
    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    dataObject.watchEventData.push(rxd);
    watchChannelData.push(dataObject);
    setImmediate(startWatch, watchChannelData);
  }

  function deviceUnwatchChannelData(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchChannelData, (status) => setImmediate(startWatch, watchChannelData));
  }

  /******************************************
   
              GPIO Input Setup

  ******************************************/ 
  function deviceGetGpioInputState(rxd){
    let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;

    let v = emitter.emit(eventName, rxd);

    if(!v){
      rxd.error = 'invalid pin';
    }

    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function deviceWatchGpioInputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    // don't add existing input data during client refresh
    if(watchInputData.length > 0){
      for (let i = 0; i < watchInputData.length; i++ ) {
        if(watchInputData[i] && watchInputData[i].pin === rxd.pin && watchInputData[i].appId === rxd.appId ){
          return;
        }
      }
    }

    deviceGetGpioInputState(rxd);

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    dataObject.watchEventData.push(rxd);
    watchInputData.push(dataObject);
    setImmediate(startWatch, watchInputData);
  }

  function deviceUnwatchGpioInputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchInputData, (status) => setImmediate(startWatch, watchInputData));
  }

  /******************************************
   
              GPIO Output Setup

  ******************************************/ 
  function deviceGetGpioOutputState(rxd){
    let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
    }
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function deviceWatchGpioOutputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return; 
    }  

    // don't add existing output data during client refresh
    if(watchOutputData.length > 0){
      for (let i = 0; i < watchOutputData.length; i++ ) {
        if(watchOutputData[i] && watchOutputData[i].pin === rxd.pin && watchOutputData[i].appId === rxd.appId ){
          return;
        }
      }
    }
    deviceGetGpioOutputState(rxd);

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    dataObject.watchEventData.push(rxd);
    watchOutputData.push(dataObject);
    setImmediate(startWatch, watchOutputData);
  }

  function deviceUnwatchGpioOutputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchOutputData, (status) => setImmediate(startWatch, watchOutputData));
  }

  function unwatchAll(rxd){
    if(rxd.name && rxd.unwatch){
      if(watchChannelData.length > 0){
        return deviceUnwatchChannelData(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.input && rxd.unwatch && rxd.pin){
      if(watchInputData.length > 0){
        return deviceUnwatchGpioInputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.output && rxd.unwatch && rxd.pin){
      if(watchOutputData.length > 0){
        return deviceUnwatchGpioOutputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
  }

  function deviceExitProcess(){
    if(spl.device){
      if(watchChannelData.length > 0){
        for (let i = 0; i < watchChannelData.length; i++ ) {
          if( watchChannelData[i] ){
            clearTimeout(watchChannelData[i].watchTimeout);
          }
        }
      }
      if(watchInputData.length > 0){
        for (let i = 0; i < watchInputData.length; i++ ) {
          if(watchInputData[i]){
            clearTimeout(watchInputData[i].watchTimeout);
          }
        }
      }
      clearTimeout(outputGpioInterval);
    }
  }

  function deviceExitProcessFromClient(rxd){
    if(watchChannelData.length > 0){
      setImmediate(deviceUnwatchChannelData, rxd);
    }
    if(watchInputData.length > 0){
      setImmediate(deviceUnwatchGpioInputState, rxd);
    }
    if(watchOutputData.length > 0){
      setImmediate(deviceUnwatchGpioOutputState, rxd);
    }
    console.log('client['+ rxd.appId +'] is offline');
  }

  function getDeviceStatus(rxd){
    rxd.active = true;
    rxd.systemInfo = systemInfo;
    if(options && Object.keys(options).length > 0){
      rxd.options = options;
    }
    rxd.enable = enable;
    emitter.emit('emit-send', rxd);
  }

  function deviceSuspendEventWatch(rxd){
    if(watchChannelData.length > 0){
      for (let i = 0; i < watchChannelData.length; i++ ) {
        if(watchChannelData[i]){
          clearTimeout(watchChannelData[i].watchTimeout);
        }
      }
    }

    if(watchInputData.length > 0){
      for (let i = 0; i < watchInputData.length; i++ ) {
        if(watchInputData[i]){
          clearTimeout(watchInputData[i].watchTimeout);
        }
      }
    }

    if(watchOutputData.length > 0){
      for (let i = 0; i < watchOutputData.length; i++ ) {
        if(watchOutputData[i]){
          clearTimeout(watchOutputData[i].watchTimeout);
        }
      }
    }
    clearTimeout(outputGpioInterval);
    enable = false;
    rxd.active = true;
    console.log('device event watch is suspended ...');
  }

  function deviceEnableEventWatch(rxd){
    process.nextTick(startWatch, watchChannelData);
    process.nextTick(startWatch, watchInputData);
    process.nextTick(startWatch, watchOutputData);
    enable = true;
    rxd.active = true;
    console.log('device event watch is enabled ...');
  }

  /*************************************
   
       OLD GPIO output setup methods
              
  **************************************/
  function checkGpioEventState(rxd){
    if(rxd.initValue !== rxd.state){
      rxd.initValue = rxd.state;
      emitter.emit('emit-send', rxd);
    }
  }

  function setGpioOutputEventData(rxd){
    if(gpioData.length > 0){
      for (let i = 0; i < gpioData.length; i++ ) {
        if(gpioData[i] && gpioData[i].pin === rxd.pin && rxd.output && rxd.event){
          gpioData[i] = rxd;
          return; 
        }
      }
    }
    gpioData.push(rxd);
  }

  function pushGpioOutputEvent(){
    gpioData.forEach((rxd) => {
      if(rxd.output && rxd.event){ 
        let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd);
        setImmediate(checkGpioEventState, rxd);
      }
    });
  }

  function GpioOutputEventProcess(rxd){
    if(!rxd.event){
      return;
    }
    let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
      return emitter.emit('emit-send', rxd);
    }
    setImmediate(() => {
      rxd.initValue = rxd.state;
      setGpioOutputEventData(rxd);
      if(!rxd.interval){
        rxd.interval = scanInterval;
      }
      clearTimeout(outputGpioInterval);
      outputGpioInterval = setTimeout(function tick() {
        pushGpioOutputEvent(); 
        outputGpioInterval = setTimeout(tick, rxd.interval); 
      }, rxd.interval);
    });
  }

  function removeDuplicateInArray(arr){
    return Array.from(new Set(arr));
  }

  function setDeviceResourcesListener(cb){
    let eventName = 'set-device-resources';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        setImmediate(function(){ 
	        deviceSetup.id = data.id;
          if(cb){
            cb(deviceSetup);
            exports.deviceSetup = deviceSetup;
          }
        });
      });	 
    }
  }

  function setDeviceResourcesData(args){
    setImmediate(function(){
      if(typeof args === 'string' || args instanceof String){ 
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.channel.name.push(args);
        }
      }

      if(typeof args === 'object' || args instanceof Object){
        if(typeof args.name === 'string'){
          deviceSetup.channel.name.push(args);
        }

        if(Array.isArray(args.pin)){
          for (let i = 0; i < args.pin.length; i++) {
            if(args.pin[i]){
              if(args.mode === 'input' || args.mode === 'in'){
                deviceSetup.gpio.input.pin.push(args.pin[i]);
              }
              else if(args.mode === 'output' || args.mode === 'out'){
                deviceSetup.gpio.output.pin.push(args.pin[i]);
              }
            }
          }
        }
        else if(Number.isInteger(args.pin)){
          if(args.mode === 'input' || args.mode === 'in'){
 	          deviceSetup.gpio.input.pin.push(args.pin[i]);
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            deviceSetup.gpio.output.pin.push(args.pin[i]);
          }
        }
	          
        if(simInputPin > 0){
          deviceSetup.gpio.input.type = 'simulation';
        }
        if(extInputPin > 0){
          deviceSetup.gpio.input.type = 'external';
        }
        if(simOutputPin > 0){
          deviceSetup.gpio.output.type = 'simulation';
        }
        if(extOutputPin > 0){
          deviceSetup.gpio.output.type = 'external';
        }
        if(intInputPin > 0 && os.arch() === 'arm'){ 
          deviceSetup.gpio.input.type = 'rpi';
        }
        if(intOutputPin > 0 && os.arch() === 'arm'){
          deviceSetup.gpio.output.type = 'rpi';
        }
      }
    });
  }

  // gpio control using an external module 
  function setExtGpioProcess(args, eventName, cb){
    let pins = [], pinState = [], response = null;

    args.pin.forEach((pin,index) => {
      pins[pin] = pin;
      pinState[pin] = false;
    });

    if(extInputPin === 0 && (args.mode === 'input' || args.mode === 'in')){
      extInputPin++;
    }

    if(extOutputPin === 0 && (args.mode === 'output' || args.mode === 'out')){
      extOutputPin++;
    }

    function setGpioState(pin, state){ 
      pinState[pin] = state;
      return pinState[pin];
    }

    function getGpioState(pin, state){ 
      state = pinState[pin];
      return state;
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ) {
      if(args.pin[i]){
        let EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            data.setGpioState = setGpioState;
            data.getGpioState = getGpioState;
            delete data.systemInfo;
            response = (result) => {
              data.result = result;
              if(data.event && data.input && data.state !== data.initValue){
                setImmediate(() => {
                  emitter.emit('emit-send', data);
                  data.initValue = data.state;
                }); 
              }
              else if(!data.event){
                setImmediate(() => {
                  emitter.emit('emit-send', data);
                }); 
              }
            }
            data.send = data.json = data.response = response;
            if(data.id === spl.id && data.pin === args.pin[i]){
              setImmediate(() => {
                if(cb){
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                }
              });
            }
          });
        }
      }
    }
  }

  // client gpio simulation test 
  function setSimGpioProcess(args, eventName, cb){
    let pins = [];
    let pinState = [];

    args.pin.forEach((pin,index) => {
      pins[pin] = pin;
      pinState[pin] = false;
    });
    
    if(simInputPin === 0 && (args.mode === 'input' || args.mode === 'in')){
      simInputPin++;
    }

    if(simOutputPin === 0 && (args.mode === 'output' || args.mode === 'out')){
      simOutputPin++;
    }

    function GpioState(mode, pin, state){
      if(mode === 'set'){
        pinState[pin] = state;
        return pinState[pin];
      }else{
        state = pinState[pin];
        return state;
      }
    }

    function GpioInputState(gpio){
      if(gpio.input){
        let rn = Math.floor(( Math.random() * 20) + 5); 
        if(rn > 15){
          gpio.state = true;
        }else{
          gpio.state = false;
        }
      }
    }

    function GpioOutputState(gpio){
      if(gpio.output && gpio.on){
        gpio.state = true;
      }
      else if(gpio.output && gpio.off){
        gpio.state = false;
      }
      else if(gpio.output && gpio.output === 'state'){
        gpio.state = GpioState('get', gpio.pin, gpio.state);
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ) {
      if(args.pin[i]){
        let EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pins[data.pin]){
              if(args.mode === 'input' || args.mode === 'in'){
                GpioInputState(data);
              }
              else if(args.mode === 'output' || args.mode === 'out'){
                GpioOutputState(data);
              }
              // execute callback only if there's a change in data value
              if(data.event &&  data.state === data.initValue ){
                return;
              }
              if(cb){
                if(data.error){
                  return cb(new Error(data.error), null);
                }
                cb(null, data);
              }
            }
          });
        }
      }
    }
  }

  // gpio input monitoring using array-gpio for raspberry pi
  function setRpiGpioInput(args, eventName, cb){
    if(!r){
      r = require('array-gpio');
    }
    let pins = args.pin;
    function watchInput(gpio){
      if(gpio.event && gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].unwatch();
        deviceGpioInput[gpio.pin].watch((err, state) => {
          gpio.state = state; gpio.rpi = true;
          emitter.emit('emit-send', gpio);
          // outbound/outgoing optional callback for event-based input monitoring
          // e.g. input(11).watch()
          setImmediate(() => {
            if(cb){
              if(err){
                return cb(new Error(err), null);
              }
              cb(null, gpio);
            }
          });
        });
      }
    }

    function getPinState(gpio){
      if(gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].setR(0);
        gpio.state = deviceGpioInput[gpio.pin].state;
        gpio.validate = true;
      }
    }

    if(intInputPin === 0){
      intInputPin++;
      if(args.mode === 'input' || args.mode === 'in'){
        deviceGpioInput = r.input({ pin: pins, index: 'pin' , array:true }); 
      }
    }

    function setGpioInput(gpio){
      if(!deviceGpioInput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }else{
        getPinState(gpio);
        watchInput(gpio);
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ) {
      if(args.pin[i]){
        let pin = args.pin[i];
        let EventName = eventName + pin;
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pin){
              if(args.mode === 'input' || args.mode === 'in'){
                setGpioInput(data);
                // optional callback for inbound/incoming non-event input client resquest
                // e.g. input(11).getState()
                // input state request/initialization
                setImmediate(() => {
                  if(cb){
                    if(data.error){
                      return cb(new Error(data.error), null);
                    }
                    cb(null, data);
                  }
                });
              }
            }
          });
        }
      }
    }
  }
  
  function getArmInputSetup(){
    return intInputPin;
  }

  // gpio output control using array-gpio for raspberry pi
  function setRpiGpioOutput(args, eventName, cb){
    if(!r){
      r = require('array-gpio');
    }
    let pins = args.pin;

    if(intOutputPin === 0){
      intOutputPin++;
      if(args.mode === 'output' || args.mode === 'out'){
        deviceGpioOutput = r.out({ pin: pins, index:'pin', array:true }); 
      }
    }

    function setGpioOutputState(gpio){
      if(!deviceGpioOutput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else{
        if(gpio.pin && gpio.output === 'state'){
          gpio.state = deviceGpioOutput[gpio.pin].state;
          return gpio.state;
        }
        else if(gpio.pin && gpio.output === 'on'){
          gpio.state = deviceGpioOutput[gpio.pin].on();
          return gpio.state;
        }
        else if(gpio.pin && gpio.output === 'off'){
          gpio.state = deviceGpioOutput[gpio.pin].off();
          return gpio.state;
        }
      }
    }

    setDeviceResourcesData(args);

    for (let i = 0; i < args.pin.length; i++ ){
    if(args.pin[i]){
      let pin = args.pin[i];
      let EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {
            if(data.id === spl.id && data.pin === pin){
              if((args.mode === 'output' || args.mode === 'out') && !data.error){ 
                setGpioOutputState(data);
              }
              // optional inbound/incoming output state request/initialization
              setImmediate(() => {
                if(cb){
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                }
              });
            }
          });
        }
      }
    }
  }

  function getArmOutputSetup(){
    return intOutputPin;
  }

  function setChannelDataProcess(args, eventName, cb){
    let channelName = null, response = null;

    if(eventName === 'getData' || eventName === 'setData'  ){
      dataEventName = eventName;
    }
    
    if((typeof args === 'string' || args instanceof String) && typeof cb === 'function'){ 
      channelName = args; 
    }
    else if(typeof args === 'object' || args instanceof Object){
      channelName = args.name; 
    }
    
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        response = (result) => {
          data.result = result;
          if(data.event && data.name && data.result && data.result !== data.initValue){
            setImmediate(() => {
              emitter.emit('emit-send', data);
              data.initValue = data.result;
            });
          }
          else if(!data.event){
            setImmediate(() => {
              emitter.emit('emit-send', data);
            });
          }  
        }
        data.send = data.json = data.response = response;
        if(data.id === spl.id && data.name === channelName){
          setImmediate(() => {
            if(cb){
              if(data.error){
                return cb(new Error(data.error), null);
              }
              cb(null, data);
            }
          });
        }
      });
    }
    if(args.api){
      return;
    }
      
    setDeviceResourcesData(args);
  }

  /***************************************************
   
        Device Application Setup Property Methods

  ****************************************************/
  const setData = exports.setData = function(args, cb){
    websocket.initCheck();
    let eventName = null;

    if(testOption.enable) {
      spl.id = args.id;
    }

    if((typeof args === 'string' || args instanceof String) && typeof cb !== 'function'){ 
      throw new Error('invalid arguments, requires a callback argument');
    }
    else if(typeof args === 'object' || args instanceof Object){
      if(typeof args.name !== 'string'){
        throw new Error('name property parameter must be a string');
      }
      eventName = args.name + spl.id; 
    }
    else if((typeof args === 'string' || args instanceof String) && typeof cb === 'function'){ 
      eventName = args + spl.id; 
    }
    else if(typeof args === 'function' && !cb){ 
      cb = args;
      eventName = 'setData';
    }
    else{
      throw new Error('invalid arguments');
    }
    setChannelDataProcess(args, eventName, cb);
  };

  const setApi = exports.setApi = function(args, cb){
    websocket.initCheck();
    let o = {};let eventName = null;
    if((typeof args === 'string' || args instanceof String) && typeof cb === 'function'){
      o.name = args;o.api = args;
      eventName = o.name + spl.id; 
      setChannelDataProcess(o, eventName, cb);
    }
    else if(typeof args === 'object' || args instanceof Object){
      if(typeof args.name !== 'string'){
        throw new Error('name property parameter must be a string');
      }
      eventName = args.name + spl.id; 
      setChannelDataProcess(args, eventName, cb);
    }
    else{
      throw new Error('1st parameter must be a string');
    }
  };

  const setGpio = exports.setGpio = function(args, cb){
    websocket.initCheck();

    if(testOption.enable) {
      spl.id = args.id;
    }

    if(typeof args !== 'object' || !(args instanceof Object)){
      throw new Error('invalid arguments');
    }  

    if(!args.pin || !args.mode){
      throw new Error('invalid arguments');
    } 
    if(typeof args.mode !== 'string'){
      throw new Error('mode property must be a string');
    }
    if(os.arch() !== 'arm' && !args.type){
      throw new Error('invalid arguments or a feature is not available on your device');
    }
    if(args.mode === 'input' || args.mode === 'in' || args.mode === 'output' || args.mode === 'out'){
      if(Array.isArray(args.pin)){
        for (let i = 0; i < args.pin.length; i++ ) {
          if(args.pin[i]){ 
            if(!Number.isInteger(args.pin[i])){
              throw new Error('pin element must be an integer');
            }
          }
        }
      }
      if(typeof args.pin === 'number' && Number.isInteger(args.pin) ){
        args.pin = [args.pin];
      }
      if(Array.isArray(args.pin)){
        if((os.arch() === 'arm') && (!args.type || args.type === 'int' || args.type === 'internal')) { 
          /* using the built-in gpio support */
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
            setRpiGpioInput(args, eventName, cb);
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
            setRpiGpioOutput(args, eventName, cb);
          }
        }
        else if(args.type === 'ext' || args.type === 'external'){ 
          /* using an external gpio function */
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
          }
          setExtGpioProcess(args, eventName, cb);
        }
        else if(args.type === 'sim' || args.type === 'simulation'){ 
          /* using the internal gpio simulation for x86/ other non-arm devices */
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
          }
          setSimGpioProcess(args, eventName, cb);
        }
        else if((os.arch() !== 'arm') && (!args.type || args.type === 'int' || args.type === 'internal')) { 
          console.log('Sorry, GPIO control using array-gpio is only available for Raspberry Pi devices.');
          process.kill(process.pid, 'SIGINT');
        }
      }
    }
    else{
      throw new Error('invalid arguments');
    }
  };

  setDeviceResourcesListener((deviceSetup) => {
    deviceSetup.gpio.input.pin = removeDuplicateInArray(deviceSetup.gpio.input.pin);
    deviceSetup.gpio.output.pin = removeDuplicateInArray(deviceSetup.gpio.output.pin);
    deviceSetup.channel.name = removeDuplicateInArray(deviceSetup.channel.name);
    if(deviceSetup.gpio.input.pin.length > 0){
    	console.log('Gpio input', deviceSetup.gpio.input);
    }
    if(deviceSetup.gpio.output.pin.length > 0){ 
    	console.log('Gpio output', deviceSetup.gpio.output);
    }
    if(deviceSetup.channel.name.length > 0){ 
    	console.log('Channel data', deviceSetup.channel.name);
    }
  });

  return {
    unwatchAll: unwatchAll,
    resetWatchData: resetWatchData,
    gpioExitProces: gpioExitProces,
    getDeviceStatus: getDeviceStatus,
    getArmInputSetup: getArmInputSetup,
    getArmOutputSetup: getArmOutputSetup,
    deviceExitProcess: deviceExitProcess,
    deviceGetDataEvent: deviceGetDataEvent,
    getDeviceSetupData: getDeviceSetupData,
    setDeviceEnabledStatus: setDeviceEnabledStatus,
    getDeviceEnabledStatus: getDeviceEnabledStatus,
    deviceEnableEventWatch: deviceEnableEventWatch,
    deviceWatchChannelData: deviceWatchChannelData,
    deviceSuspendEventWatch: deviceSuspendEventWatch,
    deviceGetGpioInputState: deviceGetGpioInputState,
    deviceGetGpioOutputState: deviceGetGpioOutputState,
    deviceWatchGpioInputState: deviceWatchGpioInputState,
    deviceWatchGpioOutputState: deviceWatchGpioOutputState,
    deviceExitProcessFromClient: deviceExitProcessFromClient,
  }

})(); // device

/*****************************************

        APPLICATION SECURITY OBJECT

 *****************************************/
const sec = (() => {
  let serverTimeout = null, serverResponseTimeout = 7000, tp = {}, sd = {};
  let rkpl = {_sid:'ckm', _pid:null, rk:true, nodev:process.version, m2mv:m2mv.version, rid:m2mUtil.rid(4)};
  const useridVldn = { regex:/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/, msg:'Invalid userid. It must follow a valid email format.'};
  const pwVldn = { regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*()\\[\]{}\-_+=~|:;<>,./? ])(?=.{6,})/, 
  msg: 'Password must be 8 characters minimum\nwith at least one number, one lowercase letter,\none uppercase letter, and one special character.'};

  const setAttributes = exports.setAttributes = (args) => {
    try{
      if(args.code && typeof args.code === 'object' && args.code.allow && args.code.filename){
        if(args.code.filename && args.code.filename.length > 30){
          throw new Error('code filename is more than 30 characters long, please make it shorter');
        }
      }
      if(args && ((typeof args !== 'object') || !(args instanceof Object))){
        console.log('   *setOptions('+ args +')');
        throw new Error('invalid options parameter, options must be an object');
      }
      if(args.code && ((typeof args.code !== 'object') || !(args.code instanceof Object))){
        console.log('   *setOptions({code:'+ args.code +'})');
        throw new Error('invalid code option parameter, code option must be an object');
      }
      if(args.name && args.name.length > 20){
        args.name = args.name.slice(0, 20);
      }
      if(args.location && args.location.length > 20){
        args.location = args.location.slice(0, 20);
      }
      if(args.description && args.description.length > 20){
        args.description = args.description.slice(0, 20);
      }
      if(options){
        options = args;
        exports.options = options;
      }
      //return  options;
    }
    catch(e){
        throw new Error('setAttributes error', e);
    }
  };
  
  function responseTimeout(){
    serverTimeout = setTimeout(()=> {
      console.log('There was no response from the server.\nPlease confirm if you are connecting to a valid server.\n' );
      process.kill(process.pid, 'SIGINT');
    }, serverResponseTimeout); 
  }

  function getCK(kt, cb){
    let ws = null;
    let server = websocket.getCurrentServer();
    tp.v = crypto.createVerify('SHA256');tp.v.update(defaultNode);tp.v.end();
    rkpl._pid = kt;
    responseTimeout();
    if(server){
      try{
        ws =  new _WebSocket(server + "/ckm", {origin:server});
      }
      catch(e){
        console.log('\nInvalid remote server address ...\nPlease confirm if you are connecting to a valid server.\n' );
        process.kill(process.pid, 'SIGINT');
      }
    }
    if(kt ==='dck'){
      tp.edh = crypto.createECDH('secp521r1');
      tp.edhpk = tp.edh.generateKeys();
      rkpl.bk = tp.edhpk.toString('base64');
    }
    ws.on("open", () => {
      if(ws.readyState === 1) {
        ws.send(JSON.stringify(rkpl), (e) => {if(e) return console.log('getCK send error',e);});
      }
    });
    ws.on("message", (ck) => {
      clearTimeout(serverTimeout);
      if(ws.readyState === 1) {
        try{
          ck = JSON.parse(ck);
          if(cb){
            if(kt === 'dck'){
              tp.vrfd = tp.v.verify(ck.puk, Buffer.from(ck.bk,'base64'));
              if(tp.vrfd){ 
                process.nextTick(cb, null, ck);
              }
            }
          }
        }
        catch(e){
          console.log(e);tp = null;
          if(cb){return cb(e, null);}
          throw new Error(e);
        }
        finally{
          ws.close();setTimeout(()=>{ck = null}, 5000);
        }
      }
    }); 
    ws.on("error",(e) => {
      if(e.message === 'Unexpected server response: 502'){
        console.log(colors.yellow('\nRemote server is not responding'),' ...\nPlease try again later ...\n');
        process.kill(process.pid, 'SIGINT');
      }
    });
  }

  function setTmpKey(tp, ck, cb){
    tp.dpk = ck.puk;
    tp.algo = 'aes-256-gcm';
    tp.rnd = 10000;
    tp.nk = Buffer.from(ck.nk,'hex');
    tp.st = Buffer.from(ck.st,'hex');
    tp.slt1 = ck.nk;
    tp.slt2 = ck.st;
    try{
      tp.csec = tp.edh.computeSecret(Buffer.from(ck.sk,'base64'));
      if(cb){
        return crypto.pbkdf2(tp.csec, tp.slt1, tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
          tp.cipkey1 = dkey;
          setImmediate(cb, null, tp);
        });
      }
      tp.cipkey1 = crypto.pbkdf2Sync(tp.csec, tp.slt1, tp.rnd, 32, 'sha256');
    }
    catch(e){
      tp = null;ck = null;
      if(cb){
        return cb(e, null);
      }
      return null;
    }
  }

  function encryptUser(user, m2m, cb){
    try{
      tp.uc = {};tp.at = {};
      tp.uc.userid =  user.name;
      tp.uc.userpw =  user.password;
      tp.at.aad = Buffer.from(m2mUtil.rid(12), 'hex');
      tp.cp = crypto.createCipheriv(tp.algo, tp.cipkey1,tp.nk,{authTagLength:16});
      tp.cp.setAAD(tp.at.aad, {plaintextLength: Buffer.byteLength(JSON.stringify(tp.uc))});
      tp.uc = tp.cp.update(JSON.stringify(tp.uc),'utf8');
      tp.cp.final();
      tp.at.tag = tp.cp.getAuthTag();
      m2m.euc =  tp.uc.toString('hex');
      m2m.att = tp.at.aad.toString('hex') + tp.at.tag.toString('hex');
      if(m2m.nsc||m2m.reg){
        tp.sc = {};  
        tp.sccp = crypto.createCipheriv(tp.algo, tp.cipkey2, tp.nk, {authTagLength:16});
        tp.sc.esc = tp.sccp.update(user.sc,'utf8');
        tp.sccp.final();
        tp.sc.stag = tp.sccp.getAuthTag();
        m2m.esc = Buffer.from(JSON.stringify(tp.sc),'utf8').toString('hex'); 
      }
      m2m.uid = tp.slt1;
      m2m.idn = tp.slt2;
      if(cb){
        process.nextTick(cb, null, m2m);
      } 
    }
    catch(e){
      if(cb){
        return cb(e, null);
      }
      console.log(e);
    }
    finally{
      setTimeout(() => {
        user = null;tp = null;m2m = null;
      }, 1000);
    }
  }

  function ckSetup(cb){
    getCK('dck',(err, ck) => {
      if(err) return console.log('getCK error', err);
      try{
        if(ck){
          setTmpKey(tp, ck, () => {
            if(err) return console.log('setTmpKey error', err);
            if(cb){
              return process.nextTick(cb, null, tp);
            }
            return rxd;
          });
        }
      }
      catch(e) {
        console.log(e);
        if(cb){
          cb('error', null);
        } 
      }
      finally {
        ck = null;
        setTimeout(() => {tp = {}}, 2000);
      }
    });
  }

  function encryptData(rxd, data) {
    ckSetup((err, tp) => {
      if(err) return console.log('ckSetup err', err);
      try{
        tp.pkg = {};
        tp.cp = crypto.createCipheriv(tp.algo, tp.cipkey1, tp.nk, {authTagLength:16});
        tp.aa = Buffer.from(m2mUtil.rid(12),'hex');
        tp.aad = tp.aa.toString('hex');
        tp.cp.setAAD(tp.aa);
        tp.pkg.cdata = tp.cp.update(data,'utf8');
        tp.pkg.cdata = tp.pkg.cdata.toString('hex');
        rxd.cd = tp.aad + tp.pkg.cdata;
        rxd.cl = rxd.cd.length;
        tp.cp.final();
        rxd.tg = tp.cp.getAuthTag().toString('hex');
        rxd.tl = rxd.tg.toString('hex').length;              
        if(tp.dpk){
          tp.pkg.edata = crypto.publicEncrypt(tp.dpk, Buffer.from(defaultNode));
        }
        delete tp.pkg.cdata;
        delete rxd.ad;
        rxd.pkg = tp.pkg;
        rxd.idn = tp.slt2;
        emitter.emit('emit-send', rxd);
      }
      catch(e){
        console.log(e);
      }
    });
  }

  function authenticate(args, user, m2m, cb){
    if(m2m.options){args
      setImmediate(() => {
        setAttributes(m2m.options);
      });
    } 
    let uv = user.name.search(useridVldn.regex); 
    let pv = user.password.search(pwVldn.regex); 
    if(user.name.length < 5 || user.name.length > 20){
      if(args && args.userid && processArgs[0] !== '-r'){
        console.log('userid:', colors.yellow(user.name), ' <--', 'Error: Incorrect userid in options\n');
      }
      if(args && !args.userid || processArgs[0] === '-r' || (!args)){
        console.log( colors.green('Entered userid:'), colors.yellow(user.name));
      }
      console.log('\nUserid must be 5 characters minimum and 20 characters maximum.\n');
      process.kill(process.pid, 'SIGINT');
    }

    if(user.password.length < 8 || user.password.length > 50){
      if(args && args.pw && processArgs[0] !== '-r'){
        console.log('password:', colors.yellow(user.password), ' <--', 'Error: Incorrect password in options\n');
      }
      if(args && !args.pw || processArgs[0] === '-r' || (!args)){
        console.log( colors.green('Entered password:'), colors.yellow(user.password));
      }
      console.log('\nInvalid password.\n');
      process.kill(process.pid, 'SIGINT');
    }

    if(uv < 0){
      console.log( colors.green('Entered userid:'), colors.yellow(user.name));
      console.log('\n',useridVldn.msg,'\n');
      process.kill(process.pid, 'SIGINT');
    }

    if(pv < 0){
      console.log( colors.green('Entered password:'), colors.yellow(user.password));
      console.log('\n',pw_validattion.msg,'\n');
      process.kill(process.pid, 'SIGINT');
    }

    if(user.sc && user.sc.length !== 4){
      console.log('\nInvalid security code credential.\n');
      process.kill(process.pid, 'SIGINT');
    }

    encryptUser(user, m2m, (err, m2m) => {
      if(err) throw err;
        console.log('\nConnecting to remote server ...');
        websocket.connect(args, m2m, cb);
    });
  }

  function userPrompt(args, m2m, authenticate, cb){
    console.log('\nPlease provide authentication credentials ...\n');

    const validate_userid = (value) => {
      if (value.search(useridVldn.regex) < 0) {
        return useridVldn.msg;
      }
      return true;
    };

    const validate_password = (value) => {
      if (value.search(pwVldn.regex) < 0) {
        return pwVldn.msg; 
      }
      return true;
    };

    const validate_sc = (value) => {
      if(value.length !== 4){
        return 'Invalid security code credential.';
      }
      return true;
    };

    let schema = [
        {
          type: 'input',
          message: 'Enter your userid (email):',
          name: 'name',
          validate: validate_userid
        },
        {
          type: 'password',
          message: 'Enter your password:',
          name: 'password',
          mask: '*',
          validate: validate_password
        }
    ];

    if(m2m.nsc||m2m.reg){
      schema.push({
          type: 'password',
          message: 'Enter your security code:',
          name: 'sc',
          mask: '*',
          validate: validate_sc
      }); 
    }

    inquirer
    .prompt(schema)
    .then(user => {
      authenticate(args, user, m2m, cb);
    });
  }

  function decSC(rxd, cb){
    if(sd && Object.keys(sd).length > 0){
      try{
        sd.dec = crypto.createCipheriv(sd.algo,sd.cipkey2,sd.nk,{authTagLength:16});
        sd.decData = sd.dec.update(rxd.edata, 'hex', 'utf8');
        sd.decData += sd.dec.final('utf8');
        if(cb){
          return cb(null, sd.decData);
        }
      }
      catch(e){
        if(cb){
          return cb(e, null);
        }
      }
      finally{
        setTimeout(() => {
          sd = null;rxd = null;   
        }, 2000);
      }
    }
  }

  const m2mStart = exports.m2mStart = function(args, m2m, cb){
    if(testOption.enable) {
      if(cb){
        return cb(args, cb);
      }
    }
    let user = {};
    m2m._sid = 'm2m';
    m2m.tid = Date.now();
    
    websocket.setServer(args);

    if(m2m.app){
      m2mUtil.trackClientId(m2m.id, (appIds) => { 
        m2m.appIds = JSON.parse(appIds);
      });
    } 

    if(m2m.options){
      setImmediate(() => {
        setAttributes(m2m.options);
      });
    }

    getCK('dck',(err, ck) => {
      if(err) throw err;
      if(ck.puk && ck.sk){ 
        setTmpKey(tp, ck);
        if(m2m.nsc||m2m.reg){
          crypto.pbkdf2(tp.csec, tp.slt2 , tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;tp.cipkey2 = dkey;
          });
        }
        if(m2m.nsc||m2m.reg){
          sd = tp;
        }
      }

      if(processArgs[0] !== '-r' && args && typeof args === 'object' && args.userid){ 
        console.log('userid:', args.userid, '\n');
      }

      if(args && typeof args === 'object' && args.userid && args.pw){
        if(args.userid && args.pw){
          if(args.trial){
            m2m.trial = args.trial;
            m2m.startDate = Date.now();
          }
          user.name = args.userid;
          user.password = args.pw;
          if(processArgs[0] === '-r'){
            return userPrompt(args, m2m, authenticate, cb);
          }
          return authenticate(args, user, m2m, cb);
        }
        else{
          if(cb){
            return cb(new Error('invalid credentials'));
          }
        }
      }
      else{
        if(testOption.enable) {
          if(cb){
            return cb(null, 'success');
          }
        }
        userPrompt(args, m2m, authenticate, cb);
      }    
    });
  };
 
  const m2mRestart = exports.m2mRestart = function(args, m2m, cb){
    let path = 'node_modules/m2m/lib/sec/tk';
    if(m2m.options){
      setImmediate(() => {
        setAttributes(m2m.options);
      });
    }
    fs.readFile(path, 'utf8', (err, tk) => {
      if(err){ if (err.code === 'ENOENT') {return m2mStart(args, m2m, cb);}
      }
      try{
        let data = JSON.parse(Buffer.from(tk, 'base64').toString('utf8'));

        // check changes w/ existing client/device module 
        if(m2m.app && data.id && typeof data.id === 'number'){
          console.log('Application has changed from device to client.\nPlease register your new client application.');
          return m2mStart(args, m2m, cb);
        } 
        if(m2m.device && data.id && typeof data.id === 'string'){
          console.log('Application has changed from client to device.\nPlease register your device.');
          return m2mStart(args, m2m, cb);
        } 
        if(m2m.device && data.id && data.id !== m2m.id){
          console.log('Device id has changed from',data.id,'to',m2m.id, '\nPlease register your new device.');
          return m2mStart(args, m2m, cb);
        }
        if(m2m.device && !data.id){
          console.log('Registering new device.\n');
          return m2mStart(args, m2m, cb);
        }
        console.log('\nConnecting to remote server ...\n');

        if(m2m.app){
          data.id = m2m.id;
          data.appId = m2m.id;
        }
        m2m = data; 
        m2m.options = options;
        m2m.ut = true;
        
        if(m2m.app){
          m2mUtil.trackClientId(m2m.id, (appIds) => { 
            m2m.appIds = JSON.parse(appIds);
            setImmediate(websocket.connect, args, m2m, cb);
          });
        }   
        else{
          setImmediate(websocket.connect, args, m2m, cb);
        }
      }
      catch(e){
        // no token found, redirect user to register w/ credentials
        console.log('Registering new user.\n');
        m2mStart(args, m2m, cb); 
      }
    });
  };

  return  {
    decSC: decSC
  }

})(); // sec

/************************************************

       APPLICATION WEBSOCKET CLIENT OBJECT

 ************************************************/
const websocket = (() => {

  let dogTimer = null, clientRxEventName = null, connectOption = null;
  let initialTimer = 3*3600000, dogTimerInterval = initialTimer, server = defaultNode;
  let rxd = {}, ws = null, reg = false, clientActive = 0, registerAttempt = 0, wsConnectAttempt = 0;

  function init(value){
    reg = value;
  }

  function getInit(){
    return reg;
  }
  
  function initCheck(){
    if(!reg){
      process.kill(process.pid, 'SIGINT');
    }
  }

  function currentSocket(){
    return ws;
  }

  function getCurrentServer(){
    return server;
  }

  function getConnectionOptions(){
    return connectOption;
  }

  function send(data){
    // let ws = websocket.currentSocket();
    if(typeof data === 'object'){
      delete data.enforce;
      data = JSON.stringify(data);
    }
    if(ws && ws.readyState === 1){
      if (ws.bufferedAmount < THRESHOLD) {
        setImmediate(() => {
          ws.send(data, (e) => {if(e) return console.log('Send error:', e.message)});
        });
      }
    }
  }

  function setServer(args){
    if(args){
      connectOption = args;
    }
    if(args && typeof args === 'object'){
      if(args && args.server){
        server = args.server;
      }
      else{
        server = defaultNode;
      }
    }
    else if(args && typeof args === 'string'){
      server  = args;
    }
    else{
      server = defaultNode;
    }
    return args;
  }

  function wsReconnectAttempt(e, args, m2m, cb){
    let server = defaultNode;
    let randomInterval = Math.floor(( Math.random() * 20000) + 1000); 
    
    if(device){
      device.deviceExitProcess();
    }

    if(e === 1006 || e === 1003){
      if(args){
        if(args.server){
          server = args.server;
        }else{
          server = args;
        }
      }
      if(wsConnectAttempt < 1){
        console.log('server', colors.brightBlue(server) ,'is not ready.\n\nAttempting to reconnect ...');
      }
      if(wsConnectAttempt < 2){
        console.log('Cannot establish connection', colors.brightRed('Error('+ e + ').'), '\nAttempting to reconnect ...');
        console.log('server', colors.brightBlue(server) ,'is not ready.');
      }
      if(wsConnectAttempt === 3){
        console.log(colors.green('Attempt to reconnect will continue in the background ...\n'));
        randomInterval = randomInterval + 5000;
      }
      setTimeout(connect, randomInterval, args, m2m, cb);
      wsConnectAttempt++;
    } 
  }

  function refreshConnection(){
    websocket.initCheck();
    if(ws.readyState === 1){
      try{
          let pl = Object.assign({}, spl);
          if(pl.c){
            pl._pid = 'client-renew-ws';
          }
          else{
            pl._pid = 'device-renew-ws';
          }
          websocket.send(pl);
      }
      catch(e){
          console.log('refreshConnection error', e);
      }
    }
  }

  function setDogTimer(dogTimer, dogTimerInterval){
    clearInterval(dogTimer); 
    dogTimer = setInterval(() => {
      if(ws.readyState === 1){
        refreshConnection();
      }
      else{
        clearInterval(dogTimer);
      }
    }, dogTimerInterval);
  }

  function runActiveProcess(){
    if(spl.device){ 
      console.log('Device ['+ spl.id +'] is ready', m2mUtil.et());
      emitter.emit('set-device-resources', spl);
    }
  }

  function exitEventProcess(){
    delete spl.options;delete spl.systemInfo;
    let pl = Object.assign({}, spl); 
    pl._pid = 'exit';
    pl.exit = true;
    pl.active = false;
    process.on('SIGINT', () => {
      ws.send(JSON.stringify(pl));
      if(spl.device){
        device.gpioExitProces();
      }
      console.log('exit process ...\n')
      process.exit();
    });
  }

  function restartProcess(){
    rxd.restart = 'success';
    rxd.active = true;
    if(process.env.npm_package_nodemonConfig_restartable){
      console.log('Restarting application ...');
      rxd.restartable = true;
      fs.writeFileSync('node_modules/m2m/mon', 'restart');
      m2mUtil.log('m2m_log/log.txt','- application process', 'remote restarted');
    }  
    emitter.emit('emit-send', rxd);
  }

  function getCodeData(filename, rxd){
    let connectOption = websocket.getConnectionOptions();
    fs.readFile(filename, 'utf8', (err, data) => {
      if(err){
        if (err.code === 'ENOENT') {
          rxd.appData = 'filename does not exist.';
        }else{
          rxd.appData = err;
        }
        console.log('getCodeData error', err);
        rxd.error = {permission:true, file:null};
        return emitter.emit('emit-send', rxd);
      }
      let bcode = Buffer.from(data); 
      if(connectOption && connectOption.pw){
        rxd.error = {pw:true, permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      } 
      rxd.success = true;
      if(process.env. npm_package_nodemonConfig_restartable){
        rxd.restartable = true;
      }
      if(rxd.enc){
        encryptData(rxd, data);
      }
      else{
        rxd.appData = bcode.toString('base64');
        emitter.emit('emit-send', rxd);
      }
    });
  }

  function codeUpload(rxd){
    if(spl.id !== rxd.id){
      rxd.error = {permission:false};
      return emitter.emit('emit-send', rxd);
    }
    if(rxd.uploadCode && options && options.code){
      if(options.code.allow){
        if(options.code.filename){
          return getCodeData(options.code.filename, rxd);
        }
        else{
          rxd.error = {permission:true, file:null};
          return emitter.emit('emit-send', rxd);
        }
      }
    }
    rxd.error = {permission:false};
    emitter.emit('emit-send', rxd);
  }

  function codeUpdate(rxd){
    if(spl.id !== rxd.id){
      rxd.error = {permission:false};
      return emitter.emit('emit-send', rxd);
    }
    if(rxd.updateCode && options && options.code){
      if(options.code.allow){ 
        if(options.code.filename){
          if(process.env.npm_package_nodemonConfig_restartable){
            rxd.restartable = true;
          } 
          let utf8_appData = Buffer.from(rxd.appData, 'base64').toString('utf8');
          return fs.writeFile(options.code.filename, utf8_appData, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                rxd.appData = 'filename does not exist.';
              }else{
                rxd.appData = err;
              }
              m2mUtil.log('m2m_log/log.txt', '- application code update error', err.message); 
              console.log('codeUpdate fs.writeFile error', err);
              rxd.error = {permission:true, file:null};
              return emitter.emit('emit-send', rxd);
            }
            delete rxd.appData;
            rxd.success = true;
            emitter.emit('emit-send', rxd);
            m2mUtil.log('m2m_log/log.txt','- application code updated', options.code.filename);
            console.log('code filename ', options.code.filename, ' updated ...');
            fs.writeFileSync('node_modules/m2m/mon', 'code-update');  
          });
        }
        else{
          rxd.error = {permission:true, file:null};
          return emitter.emit('emit-send', rxd);
        }
      }
    }
    rxd.error = {permission:false};
    emitter.emit('emit-send', rxd);
  }

  const setModuleUpdateListener = (() => {
    let eventName = 'm2m-module-update';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (rxd) => {
        if(rxd.aid === spl.aid) {
          let pkg = JSON.parse(rxd.file.json);
          let client = rxd.file.client;
          let m2m = rxd.file.m2m;
          let jsonFile = rxd.file.json;
          let path = rxd.path;
          delete rxd.file.client;
          delete rxd.file.m2m;
          delete rxd.file.json;
          delete rxd.path; 
          try {
            if(jsonFile && client && m2m){
              fs.writeFileSync(path.client, client);
              fs.writeFileSync(path.m2m, m2m);
              fs.writeFileSync(path.json, jsonFile);
              rxd.active = true; 
              rxd.update = 'success';
              if(process.env. npm_package_nodemonConfig_restartable){
                rxd.restartable = true;
              }  
              emitter.emit('emit-send', rxd);
              console.log('m2m module updated ...');
              m2mUtil.log('m2m_log/log.txt', '- m2m module updated', 'v'+rxd.ver);
              if(rxd.restartable){
                setTimeout(() => { 
                  fs.writeFileSync('node_modules/m2m/mon', pkg.data); 
                }, 1000);
              }
            }
          }
          catch (err) {
           m2mUtil.log('m2m_log/log.txt', '- m2m module update error', err);
           console.log('m2m module update error', err);
          }
        }
      });
    }	 
  })();

  /****************************************************

            Device Received Data Router (rxd)
  
  *****************************************************/
  function DeviceRxData(rxd){
    if(!device){
      throw new Error('invalid device object');
    }
    if(rxd.src === 'device' || rxd.deviceResponse || rxd.device){
      return;
    }
    else if(rxd.exit){
        return device.deviceExitProcessFromClient(rxd);
    } 
    else if(rxd && rxd.id === spl.id){
      if(rxd.channel || rxd.name){
        setImmediate(() => {
          if(rxd.event){
            return device.deviceWatchChannelData(rxd);
          }
          else{
            if(rxd.unwatch){
              return device.unwatchAll(rxd);
            }
            return device.deviceGetDataEvent(rxd);
          }
        });
      }
      else if(rxd.gpioInput || rxd.input){
        setImmediate(() => {
          if(rxd.event){
            if(!device.getArmInputSetup()){ 
              return device.deviceWatchGpioInputState(rxd);
            }
            else{
              return device.deviceGetGpioInputState(rxd);
            }
          }
          else{
            if(rxd.unwatch){
              device.unwatchAll(rxd);
            }
            return device.deviceGetGpioInputState(rxd);
          }
        });
      }
      else if(rxd.gpioOutput || rxd.output){
        setImmediate(() => {
          if(rxd.event){
            if(!device.getArmOutputSetup()){
              return device.deviceWatchGpioOutputState(rxd);
            }
          }
          else{
            if(rxd.unwatch){
              return device.unwatchAll(rxd);
            }
            return device.deviceGetGpioOutputState(rxd);
          }
        });
      }
      else if(rxd.setupData){
        return setImmediate(device.getDeviceSetupData, rxd);
      }
      else if(rxd.status){
        return setImmediate(device.getDeviceStatus, rxd);
      }
      else if(rxd.restart){
        return setImmediate(restartProcess, rxd);
      }
      else if(rxd.updateCode){
        return setImmediate(codeUpdate, rxd);
      }
      else if(rxd.uploadCode){
        return setImmediate(codeUpload, rxd);
      }
      else if(rxd.enable === false){
        return setImmediate(device.deviceSuspendEventWatch, rxd);
      }
      else if(rxd.enable === true){
        return setImmediate(device.deviceEnableEventWatch, rxd);
      }
    }
  }

  /****************************************************

            Client Received Data Router (rxd)
  
  *****************************************************/
  function ClientRxData(rxd){
    if(!client){
      throw new Error('invalid client object');
    }
    if(rxd.activeStart){
      return client.clientDeviceActiveStartProcess(rxd);
    }
    else if(rxd.exit){
      return client.clientDeviceOffLineProcess(rxd);
    }
    if(rxd.channel || rxd.name){
      if(!rxd.unwatch){
        clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch;
      }
      else if(rxd.unwatch){
        clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch + rxd.unwatch;
      } 
      return setImmediate(() => {
        emitter.emit(clientRxEventName, rxd);
      });
    }
    else if(rxd.gpioInput || rxd.input){
      clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      return setImmediate(() => {
        emitter.emit(clientRxEventName, rxd);
      });
    }
    else if(rxd.gpioOutput || rxd.output){
      clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      return setImmediate(() => {
        emitter.emit(clientRxEventName, rxd);
      });
    }
    else if(rxd.setupData){
      clientRxEventName = rxd.id + rxd._pid;
      return setImmediate(() => {
          emitter.emit(clientRxEventName, rxd);
      });
    }
    else if(rxd.getDevices){
      clientRxEventName = rxd.id + rxd._pid;
      return setImmediate(() => {
        emitter.emit(clientRxEventName, rxd);
      });
    }
    else if(rxd.status){
      return setImmediate(client.getClientStatus, rxd);
    }
    else if(rxd.restart){
      return setImmediate(restartProcess, rxd);
    }
    else if(rxd.updateCode){
      return setImmediate(codeUpdate, rxd);
    }
    else if(rxd.uploadCode){
      return setImmediate(codeUpload, rxd);
    }
    else if(rxd.getRegisteredDevices){
      return setImmediate(client.getRemoteDevices, rxd);
    }
    else if(!rxd.error){
      clientRxEventName = rxd.id + rxd._pid;
      return emitter.emit(clientRxEventName, rxd);
    }
  }

  function initRxData(rxd, args, m2m, cb){
    if(rxd.code === 100 || rxd.code === 101 || rxd.code === 102){
      fs.writeFileSync(rxd.path, rxd.data);
	    delete rxd.code;delete rxd.appData;delete rxd.path;delete rxd.data;
      m2m = rxd;registerAttempt = 0;
      init(true);
      spl = Object.assign({}, rxd);
      if(clientActive === 1){ 
        exitEventProcess();
      }
      // console.log('connection success', clientActive);
      return connect(args, m2m, cb);
    }
    if(rxd.code === 200 || rxd.code === 210){
      registerAttempt = 0;
      init(true);
      if(clientActive === 1){ 
        exitEventProcess();
      }
      // console.log('reconnection success', clientActive);
      emitter.emit('connect', rxd.reason);
      if(client){
        setImmediate(client.getRegisteredDevices);
      }
      return runActiveProcess();
    }
    if(rxd.code === 110 ){
      if(rxd.data && !rxd.error){
        fs.writeFileSync(rxd.path, rxd.data);
        console.log('Access token updated ...');
        m2mUtil.log('m2m_log/log.txt', '- token updated', 'success');
        delete rxd.code;delete rxd.path;delete rxd.data;
      }
      else{
        console.log('Access token update fail ...');
        m2mUtil.log('m2m_log/log.txt', '- token update fail', rxd.error );
      }
      delete rxd.code;delete rxd.path;delete rxd.data;registerAttempt = 0;
      init(true);
      m2m = rxd;
      spl = Object.assign({}, rxd);
      connect(args, m2m, cb);
    }
    if(rxd.code === 150 ){
      return emitter.emit('m2m-module-update', rxd);
    }
    if(rxd.code === 300){
      if(rxd.aid === m2m.aid && rxd.uid === m2m.uid && rxd.ak === m2m.ak){
        registerAttempt = 0;
        init(true);
        return connect(args, m2m, cb);
      }
    }
    if(rxd.code === 500 || rxd.code === 510 || rxd.code === 520){
      if(clientActive > 1 && registerAttempt < 3 ){
        registerAttempt++;
        console.log('server is ready, attempt', registerAttempt);
        setTimeout(function(){
          connect(args, m2m, cb);
        }, (registerAttempt-1)*100);
      }
      else{
        init(false);
        if(rxd.code === 500){
          console.log('\nresult: authentication fail');
          console.log('Please provide your valid credentials.\n');
          m2mUtil.log('m2m_log/log.txt','- '+rxd.reason, 'invalid credentials');
        }else{ 
          console.log('\n'+rxd.reason);
          m2mUtil.log('m2m_log/log.txt', '- connect fail', rxd.reason);
        }
        process.kill(process.pid, 'SIGINT');
      }
    }
    if(rxd.code === 530){
      init(false);
      console.log('\nresult:', rxd.reason);
      console.log('Device id ' + spl.id + ' is not valid or is not registered. \n');
      process.kill(process.pid, 'SIGINT');
    }
    if(rxd.code === 600){
      init(false);
      console.log('\nresult: success');
      if(rxd.reason){
        sec.decSC(rxd, (err, data)=> {
          if(err) return console.error(err);
          console.log(rxd.reason+':', data, '\n');
          m2mUtil.log('m2m_log/log.txt', '- renew security code', 'success');
          process.kill(process.pid, 'SIGINT');
        });
      }
    }
    if(rxd.code === 10 && rxd.reason === 'open-test'){
      return;
    }
  }

  function connect(args, m2m, cb){
    m2mUtil.st();

    if(ws){
      ws.close();
    }

    device.resetWatchData();

    if(spl.device){
      if(dogTimerInterval < 5400000){
        dogTimerInterval = dogTimerInterval + 60000;
      }
      else{
        dogTimerInterval = initialTimer;
      }
    }
    else if(spl.app){
      if(dogTimerInterval > 1800000){
        dogTimerInterval = dogTimerInterval - 60000;
      }
      else{
        dogTimerInterval = initialTimer;
      }
    }

    if(m2m && clientActive === 0){
      spl = Object.assign({}, m2m);
    }

    m2m.systemInfo = systemInfo;

    args = setServer(args);

    if(testOption.enable) {
      if(cb){
        return cb(args, m2m, null);
      }
    }

    try{
      ws =  new _WebSocket(server + "/m2m", {origin:server});
    }
    catch(e){
      throw new Error('error starting new ws', e.message);
    }

    ws.on("open", () => {
      websocket.send(m2m);
      clientActive++;
      wsConnectAttempt = 0;
      setDogTimer(dogTimer, dogTimerInterval);
    });

    ws.on("message", (data) => {
      try{
        if(ws.readyState === 1) {
          rxd = JSON.parse(data);
          if(!Array.isArray(rxd) && Object.keys(rxd).length){ 
            initRxData(rxd, args, m2m, cb, connect);
            if(spl.device){
              return DeviceRxData(rxd);
            }
          }
          else if(Array.isArray(rxd) && Object.keys(rxd[0]).length){ 
            if(spl.app){
              rxd = rxd[0];
              return ClientRxData(rxd);
            }
          }
        }
      }
      catch(e){
        console.log('invalid data', e);
      }
    }); 

    ws.on("close", (e) => {
      wsReconnectAttempt(e, args, m2m, cb);
    });

    ws.on("error", (e) => {
      if(e.code === 'ENOTFOUND'){
        console.log('m2m server is not responding ...\nPlease ensure m2m server is valid.\n' );
        if(!reg && clientActive < 1){
          process.kill(process.pid, 'SIGINT');
        }
      }
    });
  }

  const setEmitSendListener = (() => {
    let eventName = 'emit-send';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        let ws = websocket.currentSocket();
        if(data.src === 'client' || data.src === 'browser'){
          data.dst = data.src;
        }
        if(!data.dst){
          if(data.c){
            data.dst = 'client';
          }
          if(data.b){
            data.dst = 'browser';
          }
        }
        if(data.enforce){
          delete data.enforce;
        }
        if(spl.device){
          data.src = 'device';
        }
        if(spl.app){
          data.src = 'client';
        }
        if(!data.src || !data.dst ){
          throw new Error('invalid data.src/dst');
        }
        data.response = true;
        let enable = device.getDeviceEnabledStatus();
        if(ws && ws.readyState === 1 && enable){
          if (ws.bufferedAmount < THRESHOLD) {
            setImmediate(() => {
              ws.send(JSON.stringify(data), (e) => {if(e) return console.log('emit-send error:', e.message)});
            });
          }
        }
      });	 
    }
  })();

  return {
    init:init,
    send: send,
    connect: connect,
    initCheck: initCheck,
    setServer: setServer,
    currentSocket: currentSocket,
    getCurrentServer: getCurrentServer,
    getConnectionOptions: getConnectionOptions
  }

})(); // websocket

exports.setTestOption = (val) => {
  testOption.enable = val;
  websocket.init(val);
  module.exports = {
    client:client,
    device:device
  }
}