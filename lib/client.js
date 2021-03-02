/*!
 * client library
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
class StateEmitter extends EventEmitter {};
const emitter = new StateEmitter();
const m2mv = require('../package.json');
const processArgs = process.argv.slice(2);
var spl = {}, options = {};

emitter.setMaxListeners(2);

/****************************************

        APPLICATION UTILITY OBJECT 
    (common utility/support functions)

 ****************************************/
/* istanbul ignore next */
var m2mUtil = exports.m2mUtil = (() => {
  let d1 = null, d2 = null, defaultNode = "https://www.node-m2m.com"; 
  let ctkpath = 'node_modules/m2m/lib/sec/', ptk = ctkpath + 'ptk', rtk = ctkpath + 'tk', rpk = ctkpath + 'pk';

  function setSecTk(){
    fs.writeFileSync(ptk, rtk);
    fs.writeFileSync(rpk, 'node-m2m');
  }
  
  function initLog(cb){
    fs.mkdir('m2m_log/', (e) => {
      if(e){
        //console.log('e', e);
        return;
      } 
      fs.writeFileSync('m2m_log/log.txt', '   Date' + '                           Application events');
      if(cb){
        cb();
      }  
    });
  }
  initLog();

  function initSec(){
    fs.mkdir(ctkpath, (e) => { 
      if(e){
        //console.log('e', e);
        return;
      } 
      setSecTk();
    });
  }
  initSec();

  function getPtk(){
    return ptk;
  }

  function getRtk(){
    return rtk;
  }
  
  function getRpk(){
    return rpk;
  }

  const systemInfo = { 
    type: os.arch(),
    mem: {total: (os.totalmem()/1000000).toFixed(0) + ' ' + 'MB' , free: (os.freemem()/1000000).toFixed(0) + ' ' + 'MB'},
    m2mv: 'v' + m2mv.version,
    os: os.platform()
  };

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

  function rid(n){
    return crypto.randomBytes(n).toString('hex');
  }

  //function eventLog(filepath, msg, data1, data2, data3){
  function logEvent(msg, data1, data2, data3, data4, data5, data6){
    let filepath = 'm2m_log/log.txt', file_size = 25000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();

    if(!data1){
      data1 = '';
    }
    if(!data2){
      data2 = '';
    }
    if(!data3){
      data3 = '';
    }
    if(!data4){
      data4 = '';
    }
    if(!data5){
      data5 = '';
    }
    if(!data6){
      data6 = '';
    }

    try{ 
      fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 ); 
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
      };
    }
    fs.stat(filepath, (e, stats) => {
      if(e && e.code === 'ENOENT'){
        initLog();
      }
      if(stats.size > file_size){
        fs.writeFileSync(filepath, '   Date' + '                           Application events');
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );  
      }
    });
  }

  function trackClientId(appId){
    let data = [];
    try{
      data = fs.readFileSync('m2m_log/client_active_link');
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift(); 
      }
      data.push(appId);
      data = data.filter(function(e){return e});
      data = JSON.stringify(data);
      fs.writeFileSync('m2m_log/client_active_link', data);
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
        data = fs.writeFileSync('m2m_log/client_active_link', JSON.stringify(data));
      } 
    }
    finally{
      return data;
    } 
  }

  function getClientActiveLinkData(){
    let data = [];
    try{
      data = fs.readFileSync('m2m_log/client_active_link');
      data = JSON.parse(data);
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog(); 
      } 
    }
    finally{
      return data;
    } 
  }

  function trackClientIdAsync(appId, cb){
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
        process.nextTick(cb, data);
      }
    });
  }

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

  function startConnect(cb){
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
  }
  
  function setTestOption(val, s) {
    testOption.enable = val;
    if(s){
      spl = s;
    }
  }

  return {
    st: st,
    et: et,
    rid: rid,
    getPtk: getPtk,
    getRtk: getRtk,
    getRpk: getRpk,
    initSec: initSec,
    logEvent: logEvent,
    systemInfo: systemInfo,
    defaultNode: defaultNode,
    startConnect: startConnect,
    setDataEvent: setDataEvent,
    trackClientId: trackClientId,
    getClientActiveLinkData: getClientActiveLinkData
  }

})(); // m2mUtil


/********************************************

                CLIENT OBJECT

 ********************************************/
const client = exports.client = (() => {
  let activeTry = 0, td = 1000, http = false, clientChannelDataListener = null, clientInputEventListener = null;
  let clientArgs = {}, userDevices = [], clientDeviceId = [], activeSyncGpioData = [], activeSyncChannelData = [], invalidDevices = [];
  
  // validate remote device/server
  function validateDevice(args, next){
    td = td + 50;
    if(m2mTest.option.enabled){
      next();
    }  
    else{
      setTimeout(() => {
        for (let i = 0; i < invalidDevices.length; i++) {
          if(invalidDevices[i] === args.id){
            return;  
          }
        }
        if(next){
          process.nextTick(next);  
        }
      }, td); 
    }
  }

  function getClientDeviceId(){
    return clientDeviceId;
  }

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
        m2mUtil.logEvent('device', data.error);
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
      m2mUtil.logEvent('remote', 'device['+ rxd.id +'] is online');
      activeTry++;
    }
  }

  function clientDeviceOffLineProcess(rxd){
    process.nextTick(deviceOffline, rxd, activeSyncChannelData);
    process.nextTick(deviceOffline, rxd, activeSyncGpioData);
    console.log('device['+ rxd.id +'] is offline');
    m2mUtil.logEvent('remote', 'device['+ rxd.id +'] is offline');
    activeTry = 0;
  }

  function removeActiveSyncDataEvent(rxd, arrayData, cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        try{
          if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
          if(arrayData[i] && rxd.input && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
          if(arrayData[i] && rxd.output && rxd.unwatch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin){
            arrayData.splice(i,1);
            return process.nextTick(cb, null, true);
          }
        }
        catch(e){
          cb(e, null);
        }
      }
    }
  }

  function testFunction(pl,eventName){
    if(m2mTest.option.enabled){
      if(pl.name === 'watch-fail' || pl.name === 'fail' || pl.name === 'test-fail'|| pl.name === 'error'){
        if(pl.unwatch){
          emitter.emit(eventName, { id:pl.id, unwatch:true, name:pl.name, error:'fail'});
        }
        else{
          emitter.emit(eventName, { id:pl.id, name:pl.name, error:'fail'});
        }
      }
      else if(pl.name === 'test-value'){
        emitter.emit(eventName, { id:pl.id, name:pl.name, value:{test:'passed'}});
      }
      else if(pl.unwatch){
        emitter.emit(eventName, { id:pl.id, name:pl.name, unwatch:true, result:{test:'passed'}});
      }
      else{
        emitter.emit(eventName, { id:pl.id, name:pl.name, result:{test:'passed'}});
      }
    }
  }

  /*******************************************
  
          Device Access Constructor

  ********************************************/
  function deviceAccess(i, id){
    this.id = id;
    this._index = i;
  }

  /***************************************************
  
      Device Access Channel Data Support Functions

  ****************************************************/
  function setChannelDataListener(pl, cb){
    let eventName = pl.id + pl.name + pl.event + pl.watch;
    clientChannelDataListener = function (data) {
      if(!data.unwatch && data.id === pl.id && data.name === pl.name){
        if(cb){
          process.nextTick(() => {
            if(data.error){
              return cb(new Error(data.error), null);
            }
            if(data.result){
              return cb(null, data.result);
            }
            if(data.value){
              return cb(null, data.value);
            }
          });
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

    if(m2mTest.option.enabled){
      testFunction(pl,eventName);
    }
  }

  // get/watch channel data
  function getChannelData(pl, cb){
    if(!pl.name || typeof pl !== 'object') {
      throw new Error('invalid arguments');
    }
    if((pl.get || pl.getData)  && !cb){
      throw new Error('callback argument is required');
    }
    pl.dst = 'device';
    pl.channel = true;
    pl.frequency = null;
    pl._pid = 'channel-data';

    if(cb && typeof cb === 'function'){
      setChannelDataListener(pl, cb);
    }
    websocket.send(pl);
  }

  function setUnwatchChannelDataListener(pl, cb){
    let eventName = pl.id + pl.name + pl.event + pl.watch + pl.unwatch;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data.name === pl.name){
          if(cb){
            if(data.error){
              return cb(new Error(data.error), null);
            }
            // valid unwatch channel, successfully unwatch channel name, returns true
            cb(null, data.unwatch);
            if(data.unwatch){
              removeActiveSyncDataEvent(data, activeSyncChannelData, (err, status) => {
                if(err){ return cb(err, null);}
                // remove watch listener, not unwatch listener
                emitter.removeListener(eventName,  clientChannelDataListener);
              });
            }
          }
        }
      });
    }

    if(m2mTest.option.enabled){
      testFunction(pl,eventName);
    }
  }  

  // stop/unwatch channel data
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

    if(cb && typeof cb === 'function'){
      setUnwatchChannelDataListener(pl, cb);
    }
    websocket.send(pl);
  }

  /*****************************************
    
      Device Access Channel Data Methods

   *****************************************/
  // non-event property data capture only
  const getData = function(cb){
    websocket.initCheck();
    let args = Object.assign({}, spl);
    args.id = this.id;
    args.event = false;
    args.watch = false;
    args.name = this.args; 
    args.rcvd = true;
    args.getData = true;

    validateDevice(args, () => {
      getChannelData(args, cb);
    });
  };

  // non-event property data capture w/ payload
  const sendData = function(payload, cb){
    websocket.initCheck();
    if(typeof payload !== 'string' && typeof payload !== 'object' && typeof payload !== 'number'){
      throw new Error('invalid arguments');
    }
    let args = Object.assign({}, spl);
    args.id = this.id;
    args.event = false;
    args.watch = false;
    args.sendData = true;
    args.name = this.args;
    args.payload = payload;
  
    validateDevice(args, () => {
      getChannelData(args, cb);
    });
  };

  const get = function(cb){
    websocket.initCheck();
    let args = Object.assign({}, spl);
    args.id = this.id;
    args.event = false;
    args.watch = false;
    args.get = true;
    args.api = this.args;
    args.name = this.args;

    validateDevice(args,  () => {
      getChannelData(args, cb);
    });
  };

  // non-event properties http post sim data capture
  const post = function(body, cb){
    websocket.initCheck();
    if(typeof body !== 'string' && typeof body !== 'object'){
      throw new Error('invalid arguments');
    }
    let args = Object.assign({}, spl);
    args.body = body;
    args.id = this.id;
    args.event = false;
    args.watch = false;
    args.post = true;
    args.api = this.args;
    args.name = this.args;

    validateDevice(args, () => {
      getChannelData(args, cb);
    });
  };

  function Channel(id, args){
    this.id = id;
    this.args = args;
  }
 
  Channel.prototype = { 
    constructor: Channel,

    // http simulation properies
    get:get,
    post:post,

    // non-event properties
    getData:getData,
    sendData:sendData,

    unwatch:function(cb){
      websocket.initCheck();
      let args = {};
      args.id = this.id;
      args.event = false;
      args.name = this.args; 

      validateDevice(args, () => {
        unwatchChannelData(args, cb);
      });
    },

    // event-based property
    watch: function(o, cb){
      websocket.initCheck();
      let args = Object.assign({}, spl);
      args.event = true;
      args.watch = true;
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
          else if(o.poll && Number.isInteger(o.poll)){
            args.interval = o.poll;
          }
        }
        else{
          throw new Error('invalid arguments');
        }
      }

      validateDevice(args, () => {
        getChannelData(args, cb);
      });
    },
  };

  /************************************************
  
      Device Access GPIO Input Support Functions

  *************************************************/
  function setInputGpioListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    // input emitter event listener
    clientInputEventListener = function (data){
      if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
        if(cb){
          process.nextTick(() => {
            if(data.error){
              return cb(new Error(data.error), null);
            }
            cb(null, data.state);
          });
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

  // get/watch gpio input data
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
    
    if(cb && typeof cb === 'function'){
      setInputGpioListener(pl, cb);
    }
    websocket.send(pl); 
  }

  function setUnwatchInputGpioListener(pl, cb){
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
              cb(null, data.unwatch);
              removeActiveSyncDataEvent(data, activeSyncGpioData, (err, status) => { 
                if(err){ return cb(err, null); }
                // remove watch listener, not unwatch listener
                emitter.removeListener(eventName,  clientInputEventListener);
              });
            }
          }
        }
      });
    }
  }  

  // stop/unwatch gpio input data
  function unwatchGpioInputData(args, cb){
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
      setUnwatchInputGpioListener(pl, cb);
    }
    websocket.send(pl);
  }

  /****************************************
    
      Device Access Gpio Input Methods

  *****************************************/
  const inputState = function(cb){
    websocket.initCheck();
    let args = {};
    args.id = this.id;
    args.pin = this.pin;
    args.event = false;
    args._pid = 'gpio-input-state';

    validateDevice(args, () => {
      getGpioInputData(args, cb); 
    }); 
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

      validateDevice(args, () => {
        unwatchGpioInputData(args, cb);
      }); 
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
          if(o.poll && Number.isInteger(o.interval)){ 
            args.interval = o.poll;
          }
        }
        else{
          throw new Error('invalid arguments');
        }
      }

      validateDevice(args, () => {
        getGpioInputData(args, cb); 
      });
    }
  }; 

  /**************************************************
    
      Device Access Gpio Output Support Functions

  ***************************************************/
  function setGpioOutputListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
          if(cb){
            process.nextTick(() => {
              if(data.error){
                return cb(new Error(data.error), null);
              }
              cb(null, data.state);
            });
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

  /*******************************************
    
      Device Access Gpio Output Methods

  *******************************************/

  // GPIO Output get output pin state or status 
  const outputState = function(cb){
    websocket.initCheck();
    if(!cb){
      throw new Error('callback argument is required');
    }
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
    
    if(cb && typeof cb === 'function'){
      setGpioOutputListener(pl, cb);
    }

    let data = JSON.stringify(pl);

    validateDevice(pl, () => {
      websocket.send(data);
    });
  }; 

  function Output(id, pin){
    websocket.initCheck();
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
        setGpioOutputListener(pl, cb);
      }

      validateDevice(pl, () => {
        GpioControl(t, pl);
      });
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
        setGpioOutputListener(pl, cb);
      }

      validateDevice(pl, () => {
        GpioControl(t, pl);
      });
    }, 
  };

  /******************************************
  
          Device Accesss Properties

  *******************************************/
  function setupInfo(cb){
    websocket.initCheck();
    if(!cb){
      throw new Error('callback is required');
    }
    let pl = Object.assign({}, spl); 
    pl.id = this.id;
    pl.dst = 'device';
    pl.setupData = true;
    pl._pid = 'setupData';

    if(typeof cb === 'function'){
      let eventName = pl.id + pl._pid;
      if(emitter.listenerCount(eventName) < 1){
        emitter.once(eventName, (data) => {
          if(data.id === pl.id && data.setupData){ 
            if(cb){   
              process.nextTick(() => {
                if(data.error){
                  return cb(new Error(data.error), null);
                }
                cb(null, data.setupData);
              });
            }
          }
        });
      }
    }

    validateDevice(pl, () => {
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
        throw new Error('invalid arguments');
      }
      if(!args.pin||!args.mode){
        throw new Error('invalid arguments');
      }

      if(args.mode === 'input' || args.mode === 'in'){
        return new Input(this.id, args.pin);
      }
      else if(args.mode === 'output' || args.mode === 'out'){
        return new Output(this.id, args.pin);
      }
      else{
        throw new Error('invalid arguments');
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
    getData: function(o, cb){
      websocket.initCheck();
      if(typeof cb !== 'function'){
        throw new Error('callback argument is required');
      }
      let args = Object.assign({}, spl);
      args.id = this.id;
      args.event = false;
      args.watch = false;
      if(typeof o === 'string'){
        args.name = o;
      }
      else if(typeof o === 'object' && o.name && typeof o.name === 'string'){
        args.name = o.name;
      }
      else{
        throw new Error('invalid arguments');
      } 
      args.rcvd = true;
      args.getData = true;

      validateDevice(args, () => {
        getChannelData(args, cb);
      });
    },

    // e.g. device.unwatch 
    unwatch: function(args, cb){
      websocket.initCheck();

      validateDevice(args, () => {
         unwatchChannelData(args, cb);
      });
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
    watch: function(o, cb){
      websocket.initCheck();
      if(typeof cb !== 'function'){
        throw new Error('callback argument is required');
      }
      
      let args = Object.assign({}, spl);
      args.event = true;
      args.watch = true;
      args.id = this.id;
      args.interval = 5000;
      if(typeof o === 'string'){
        args.name = o;
      }
      else if(typeof o === 'object' && o.name && typeof o.name === 'string'){
        args.name = o.name; 
        if(o.interval && Number.isInteger(o.interval)){
          args.interval = o.interval;
        }
        if(o.poll && Number.isInteger(o.poll)){
          args.interval = o.poll;
        }
      } 
      else{
        throw new Error('invalid arguments');
      }

      validateDevice(args, () => {
        getChannelData(args, cb);
      });
    },
  };

  /*********************************************************
  
      Accesss Remote Devices/Resources Support Functions

  **********************************************************/
  function getRemoteDevices(rxd, cb){
    if(clientDeviceId.length > 0 && rxd && rxd.devices && rxd.devices.length > 0){ 
      let validServerID = [];
      clientDeviceId.forEach((id) => {
        rxd.devices.forEach((vd) => {
          if(id === vd.id){
            validServerID[id] = id;
          }
        });  
      });
      setImmediate(() => {
        clientDeviceId.forEach((id) => {
          if(!validServerID[id]){
            invalidDevices.push(id);
            console.log( '* device id',id,'is invalid, device is not registered!');
            if(cb){
              return cb('invalid id');
            }
          }
          else{
            console.log('Accessing device',id,'...');
            if(cb){
              return cb(id);
            }
          }
        });
      });
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

  function getRegisteredDevices(cb){ 
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
    if(cb){
      cb(userDevices);
    }
  }
  
  function getDevices(cb){
    websocket.initCheck();
    if(userDevices && userDevices.length > 0){
      cb(null, userDevices);
    }
    let pl = Object.assign({}, spl);
    pl._pid = 'getDevices';
    pl.getDevices = true;
    let eventName = pl.id + pl._pid;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data._pid === pl._pid){
          if(cb){
            process.nextTick(() => {
              if(data.error){
                return cb(new Error(data.error), null);
              }
              userDevices =  data.devices;
              cb(null, data.devices);
            });
          }
        }
      });
    }
    websocket.send(pl);
  }

  /************************************

      client device access method 

  *************************************/
  function accessDevice(){
    let cb = null, clientServer = [];

    if(arguments.length > 1 && typeof arguments[0] === 'number' && typeof arguments[1] === 'number'){
      console.log('client.accessDevice(',arguments[0],',',arguments[1],', ...) - invalid arguments');
      throw new Error('access id more than 1 must be contained in an array');
    }

    if(typeof arguments[0] === 'number'){
      clientArgs = [arguments[0]];
    }

    if(Array.isArray(arguments[0])){
      clientArgs = arguments[0];
    }

    for (let x = 0; x < clientArgs.length; x++) { 
      if(Number.isInteger(clientArgs[x])){
        clientServer[x] = new deviceAccess(x, clientArgs[x]);
        if( clientArgs.length === 1){
          emitter.emit('getDeviceId',  clientArgs[0]);
        }
        if( clientArgs.length > 1){
          emitter.emit('getDeviceId',  clientArgs);
        }
      }
      else{ 
        console.log('invalid server id: ' + clientArgs[x]);
        throw new Error('server id must be an integer number');
      }
    }
    // sync accessDevice, returns the remote device/devices or server/servers
    // e.g. const device = client.accessDevice(100) or const devices = client.accessDevice([100, 120])
    if(arguments.length === 1 && typeof arguments[0] !== 'function'){
      if(clientServer.length > 1 ){
        return clientServer;
      }
      else {
        return clientServer[0];
      }
    }
    else{
      // async accessDevice  
      // clientArgs bypassed, server id provided w/ callback, e.g. client.accessDevice(100, cb) or client.accessDevice([100, 120], cb)
      cb = arguments[1];
      if(clientServer.length > 1 ){
        setImmediate(cb, null, clientServer);
      }
      else {
        setImmediate(cb, null, clientServer[0]);
      }
    }
  }

  return {
    getDevices: getDevices,
    deviceAccess: deviceAccess,
    accessDevice: accessDevice,
    getRemoteDevices: getRemoteDevices,
    getClientDeviceId: getClientDeviceId,
    getRegisteredDevices: getRegisteredDevices,
    clientDeviceOffLineProcess: clientDeviceOffLineProcess,
    clientDeviceActiveStartProcess: clientDeviceActiveStartProcess,
  }

})(); // client


/********************************************
 
                DEVICE OBJECT

 ********************************************/
const device = exports.device = (() => {
  let deviceInputEventnameHeader = 'gpio-Input', deviceOutputEventnameHeader ='gpio-Output', dataEventName = null,  outputGpioInterval = null;
  let gpioData = [], deviceGpioInput = [], deviceGpioOutput = [], watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  let arrayGpio = null, enable = true, scanInterval = 5000, inputPin = 0, outputPin = 0, extInputPin = 0, extOutputPin = 0, simInputPin = 0, simOutputPin = 0;
  let deviceSetup = {id: spl.id , systemInfo: m2mUtil.systemInfo, gpio:{ input:{pin:[],type:null}, output:{pin:[],type:null}}, channel:{name:[]}, watchChannel:{name:[]}};

  function getEnableStatus(){
    return enable;
  }

  function setEnableStatus(value){
    enable = value;
  }

  function resetWatchData(){
    watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  }

  function getDeviceSetupData(rxd){
    rxd.setupData = deviceSetup;
    rxd.active = true;
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function gpioExitProcess(){
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
    process.nextTick(() => {
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

  /*const iterateDataEvent2 = exports.iterateDataEvent2 = function (arrayData, cb){
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
        if(m2mTest.option.enabled && cb){
          process.nextTick(checkDataChange, rxd);
          return cb(rxd);
        }
        process.nextTick(checkDataChange, rxd);
      }
    });
  }*/

  const iterateDataEvent = exports.iterateDataEvent = function (arrayData, cb){
    arrayData.forEach((rxd) => {
      if(rxd.name && rxd.event){  
        let eventName = rxd.name + rxd.id;
        if(dataEventName){
          eventName = dataEventName;
        }
        emitter.emit(eventName, rxd);
      }
      if(rxd.input && rxd.event){ 
        let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd); 
      }
      if(rxd.output && rxd.event){ 
        let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
        emitter.emit(eventName, rxd);
      }
      if(rxd.event){
        if(m2mTest.option.enabled && cb){
          process.nextTick(checkDataChange, rxd);
          return cb(rxd);
        }
        process.nextTick(checkDataChange, rxd);
      }
    });
  }
 
  const startWatch = exports.startWatch = function (rxd, arrayData){
    if(arrayData && arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i]){
          if(arrayData[i].appId === rxd.appId){
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
  }

  const enableWatch = exports.enableWatch = function (arrayData){
    if(arrayData && arrayData.length > 0){
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

  const removeDataEvent = exports.removeDataEvent = function (rxd, arrayData, cb){
    if(rxd.unwatch && (rxd.pin || rxd.name)){
      if(arrayData.length > 0){
        for (let i = 0; i < arrayData.length; i++ ) {
          if(arrayData[i]){
            // unwatch/remove a gpio input/output pin event per client request  
            if(arrayData[i] && rxd.pin && rxd.unwatch && arrayData[i].pin === rxd.pin && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
              m2mUtil.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'pin ' + rxd.pin);
              clearTimeout(arrayData[i].watchTimeout);
              // send confirmation result back to client 
              emitter.emit('emit-send', rxd);
              if(cb){
                return process.nextTick(cb, true);
              }
            }
            // unwatch/remove a channel event per client request 
            else if(arrayData[i] && rxd.name && rxd.unwatch && arrayData[i].name === rxd.name && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId ){
              m2mUtil.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'channel ' + rxd.name);
              clearTimeout(arrayData[i].watchTimeout);
              // send confirmation result back to client 
              emitter.emit('emit-send', rxd);
              if(cb){
                return process.nextTick(cb, true);
              }
            }
          }
        }
      }
    }
    if(rxd.exit && rxd.stopEvent){
      //remove all channel & gpio events per client exit process 
      if(arrayData.length > 0){
        for (let i = 0; i < arrayData.length; i++ ) {
          if(arrayData[i] && arrayData[i].appId === rxd.appId){
            clearTimeout(arrayData[i].watchTimeout);
            if(cb){
              process.nextTick(cb, true);
            }
          }
        }
      }
      m2mUtil.logEvent('remote client', 'unwatch/stop all events', rxd.appId);
      arrayData = arrayData.filter(function(e){return e});
      return;
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
  };

  /***************************************
   
            Channel Data Setup

  ***************************************/ 
  const getChannelDataEvent = exports.getChannelDataEvent = function (rxd){
    let v = null;
    let eventName = rxd.name + rxd.id;
    if(dataEventName){
      v = emitter.emit(dataEventName, rxd);
    }
    else{   
      v = emitter.emit(eventName, rxd);
    }
    if(!v){
      rxd.error = 'invalid channel';
      if(rxd.api){
        rxd.error = 'invalid api';
      }
      setImmediate(() => {
        emitter.emit('emit-send', rxd);
      });
    }
    return v;
  }

  function deviceWatchChannelData(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    if(!getChannelDataEvent(rxd)){
      return;
    }

    watchDeviceChannelData = watchDeviceChannelData.filter(function(e){return e}); 
    
    // don't add existing data during client refresh
    if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i] && watchDeviceChannelData[i].name === rxd.name && watchDeviceChannelData[i].appId === rxd.appId){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch channel event', rxd.appId, rxd.name);
          return setImmediate(startWatch, rxd, watchDeviceChannelData);
        }
      }
    }
    
    if(!rxd.interval){
      rxd.interval = scanInterval;
    }
   
    let dataObject = { id:rxd.id, name:rxd.name, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.name = rxd.name;

    if(rxd.result){
      rxd.initValue = rxd.result;
    }
    else if(rxd.value){
      rxd.initValue = rxd.value;
    }

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceChannelData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceChannelData);
    });
     
    m2mUtil.logEvent('remote client' , 'start watch channel event', rxd.appId, rxd.name);
  }

  function deviceUnwatchChannelData(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceChannelData);
  }

  /******************************************
   
              GPIO Input Setup

  ******************************************/ 
  function GetGpioInputState(rxd){
    let eventName = deviceInputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
    }
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
    return v;  
  }

  function deviceWatchGpioInputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return;
    }

    if(!GetGpioInputState(rxd)){
      return;
    }

    watchDeviceInputData = watchDeviceInputData.filter(function(e){return e});
    
    // don't add existing data during client refresh
    if(watchDeviceInputData.length > 0){
      for (let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i] && watchDeviceInputData[i].pin === rxd.pin && watchDeviceInputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch gpio input event', rxd.appId , rxd.pin);
          return setImmediate(startWatch, rxd, watchDeviceInputData);
        }
      }
    }
    
    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceInputData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceInputData);
    });

    m2mUtil.logEvent('remote client' ,'start watch gpio input event' , rxd.appId, rxd.pin);
    
  }

  function deviceUnwatchGpioInputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceInputData);
  }

  /******************************************
   
              GPIO Output Setup

  ******************************************/ 
  function GetGpioOutputState(rxd){
    let eventName = deviceOutputEventnameHeader + rxd.id +  rxd.pin;
    let v = emitter.emit(eventName, rxd);
    if(!v){
      rxd.error = 'invalid pin';
    }
    process.nextTick(() => {
      emitter.emit('emit-send', rxd);
    });
    return v;
  }

  function deviceWatchGpioOutputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.b){
      return; 
    }

    if(!GetGpioOutputState(rxd)){
      return;
    }  

    watchDeviceOutputData = watchDeviceOutputData.filter(function(e){return e});
    
    // don't add existing data during client refresh
    if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i] && watchDeviceOutputData[i].pin === rxd.pin && watchDeviceOutputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
          m2mUtil.logEvent('remote client', 'reset watch gpio output event', rxd.appId , rxd.pin);
          return setImmediate(startWatch, rxd, watchDeviceOutputData);
        }
      }
    }
   
    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    //dataObject.pin = rxd.pin;

    rxd.initValue = rxd.state;

    // m2mUtil.setDataEvent(rxd, dataObject.watchEventData);
    setImmediate(function(){
      dataObject.watchEventData.push(rxd);
      watchDeviceOutputData.push(dataObject);
      setImmediate(startWatch, rxd, watchDeviceOutputData);
    });

    m2mUtil.logEvent('remote client' ,'start watch gpio output event' , rxd.appId, rxd.pin);
  }
 
  function deviceUnwatchGpioOutputState(rxd){
    if(rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceInputData);
  }

  // unwatch/stop device specific/individual event
  // as requested by a client
  function unwatchDeviceEvent(rxd){
    if(rxd.name && rxd.unwatch){
      if(watchDeviceChannelData.length > 0){
        return deviceUnwatchChannelData(rxd);
      }
      else{
      	rxd.unwatch = false;
      	return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.input && rxd.unwatch && rxd.pin){
      if(watchDeviceInputData.length > 0){
        return deviceUnwatchGpioInputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
    else if(rxd.output && rxd.unwatch && rxd.pin){
      if(watchDeviceOutputData.length > 0){
        return deviceUnwatchGpioOutputState(rxd);
      }
      else{
        rxd.unwatch = false;
        return emitter.emit('emit-send', rxd);
      }
    }
  }

  // stop all device events
  function stopEventWatch(){
    if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i]){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
        }
      }
    }

    if(watchDeviceInputData.length > 0){
      for(let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i]){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
        }
      }
    }

    if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i]){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
        }
      }
    }
    clearTimeout(outputGpioInterval);
  }

  // stop all events from ws reset/server offline
  function deviceExitProcess(){
    if(spl.device){
      stopEventWatch();
    }
  }

  // stop specific event from client exit/offline
  function deviceExitProcessFromClient(rxd){
    if(watchDeviceChannelData.length > 0){
      process.nextTick(deviceUnwatchChannelData, rxd);
    }
    if(watchDeviceInputData.length > 0){
      process.nextTick(deviceUnwatchGpioInputState, rxd);
    }
    if(watchDeviceOutputData.length > 0){
      process.nextTick(deviceUnwatchGpioOutputState, rxd);
    }
    console.log('client['+ rxd.appId +'] is offline');
  }
  
  // temporarily suspend event watching
  function deviceSuspendEventWatch(rxd){
    stopEventWatch();
    enable = false;
    rxd.active = true;
    console.log('device event watch is suspended ...');
  }
	
  // resumes/restart event watching
  function deviceEnableEventWatch(rxd){
    process.nextTick(enableWatch, watchDeviceChannelData);
    process.nextTick(enableWatch, watchDeviceInputData);
    process.nextTick(enableWatch, watchDeviceOutputData);
    enable = true;
    rxd.active = true;
    console.log('device event watch is enabled ...');
  }

  function removeDuplicateInArray(arr){
    return Array.from(new Set(arr));
  }

  function setDeviceResourcesListener(cb){
    let eventName = 'set-device-resources';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        deviceSetup.id = data.id;
        if(cb){
          process.nextTick(function(){ 
            cb(deviceSetup);
            exports.deviceSetup = deviceSetup;
          });
        }
      });	 
    }
  }

  function setDeviceResourcesWatchData(args){
    process.nextTick(function(){
      if(typeof args === 'string' || args instanceof String){ 
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.watchChannel.name.push(args);
          deviceSetup.watchChannel.name = removeDuplicateInArray(deviceSetup.watchChannel.name);
        }
      }
      if(typeof args === 'object' || args instanceof Object){
        if(typeof args.name === 'string'){
          deviceSetup.watchChannel.name.push(args);
          deviceSetup.watchChannel.name = removeDuplicateInArray(deviceSetup.watchChannel.name);
        }
      }
    });
  }

  function setDeviceResourcesData(args){
    process.nextTick(function(){
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
        if(simInputPin > 0){
          deviceSetup.gpio.input.type = 'simulation';
        }
        if(extInputPin > 0){
          deviceSetup.gpio.input.type = 'external';
        }
				if(inputPin > 0 && os.arch() === 'arm'){ 
          deviceSetup.gpio.input.type = 'rpi';
        }
        if(simOutputPin > 0){
          deviceSetup.gpio.output.type = 'simulation';
        }
        if(extOutputPin > 0){
          deviceSetup.gpio.output.type = 'external';
        }
        if(outputPin > 0 && os.arch() === 'arm'){
          deviceSetup.gpio.output.type = 'rpi';
        }
      }
    });
  }

  // client gpio simulation test
  /* istanbul ignore next */ 
  function setSimGpioProcess(args, eventName, cb){
    let pins = [], pinState = [];

    args.pin.forEach((pin, index) => {
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
        GpioState('set', gpio.pin, gpio.state);
      }
      else if(gpio.output && gpio.off){
        gpio.state = false;
        GpioState('set', gpio.pin, gpio.state);
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
              if(data.event && data.state === data.initValue ){
                return;
              }
              if(cb){
                process.nextTick(() => {
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                });
              }
            }
          });
        }
      }
    }
  }
    
  function getGpioInputSetup(){
    return inputPin;
  }
  
  // gpio input monitoring using array-gpio for raspberry pi
  function setRpiGpioInput(args, eventName, cb){
		if(m2mTest.option.enabled){
      inputPin = 0;
      if(args.pin[0] === 41){
        inputPin = 1;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(inputPin === 0){
      inputPin++;
      if(args.mode === 'input' || args.mode === 'in'){
        deviceGpioInput = arrayGpio.input({pin:pins, index:'pin'});  
      }
    }

    function watchInput(gpio){
      if(gpio.event && gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].unwatch();
        deviceGpioInput[gpio.pin].watch((state) => {
          gpio.state = state; gpio.rpi = true;
          emitter.emit('emit-send', gpio);
          // outbound/outgoing optional callback for event-based input monitoring
          // e.g. input(11).watch()
          if(cb){
            process.nextTick(cb, null, gpio);
          }
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

    function setGpioInput(gpio){
      if(!deviceGpioInput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else{
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
              setGpioInput(data);
              // optional callback for inbound/incoming non-event input client resquest
              // e.g. input(11).getState()
              // input state request/initialization
              if(cb){
                process.nextTick(() => {
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                });
              }
            }
          });
        }
      }
    }
  }
  
  function getGpioOutputSetup(){
    return outputPin;
  }
  
  // gpio output control using array-gpio for raspberry pi
  function setRpiGpioOutput(args, eventName, cb){
    if(m2mTest.option.enabled){
      if(args.pin[0] === 43){
      	outputPin = 0;arrayGpio = null;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(outputPin === 0){
      outputPin++;
      if(args.mode === 'output' || args.mode === 'out'){
        deviceGpioOutput = arrayGpio.out({pin:pins, index:'pin'}); 
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
              setGpioOutputState(data);
              // optional inbound/incoming output state request/initialization
              if(cb){
                process.nextTick(() => {
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                });
              }
            }
          });
        }
      }
    }
  }

  // gpio control using an external module
  /* istanbul ignore next */ 
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
              emitter.emit('emit-send', data);
            }
            if(data.event && data.input && data.state !== data.initValue){
              data.initValue = data.state;
            }
            data.send = data.json = data.response = response;
            if(data.id === spl.id && data.pin === args.pin[i]){
              if(cb){
                process.nextTick(() => {
                  if(data.error){
                    return cb(new Error(data.error), null);
                  }
                  cb(null, data);
                });
              }
            }
          });
        }
      }
    }
  }

  function setChannelData(args, eventName, cb){
    let channelName = null, response = null;

    if(eventName === 'getData' || eventName === 'setData'  ){
      dataEventName = eventName;
      channelName = eventName;
    }
    else if(typeof args === 'object' || args instanceof Object){
      channelName = args.name; 
    }
    else if((typeof args === 'string' || args instanceof String) && typeof cb === 'function'){ 
      channelName = args; 
    }
    
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        response = (result) => {
          data.result = result;
          emitter.emit('emit-send', data);
        }
        if(data.event && data.name && data.result && data.result !== data.initValue){
					data.initValue = data.result;
          setDeviceResourcesWatchData(args);
        }
        data.send = data.json = data.response = response;
        if(data.id === spl.id && data.name === channelName){
          if(cb){
            process.nextTick(() => {
              if(data.error){
                return cb(new Error(data.error), null);
              }
              cb(null, data);
            });
          }
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
  function setData(args, cb){
    websocket.initCheck();
    let eventName = null;

    if((typeof args === 'string' || args instanceof String) && typeof cb !== 'function'){ 
      throw new Error('invalid arguments, requires a callback argument');
    }
    else if(typeof args === 'function' && !cb){ 
      cb = args;
      eventName = 'setData';
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
    else{
      throw new Error('invalid arguments');
    }
    setChannelData(args, eventName, cb);
  }

  function setApi(args, cb){
    websocket.initCheck();
    let o = {};let eventName = null;
    if((typeof args === 'string' || args instanceof String) && typeof cb === 'function'){
      o.name = args;o.api = args;
      eventName = o.name + spl.id; 
      setChannelData(o, eventName, cb);
    }
    else if(typeof args === 'object' || args instanceof Object){
      if(typeof args.name !== 'string'){
        throw new Error('name property parameter must be a string');
      }
      eventName = args.name + spl.id; 
      setChannelData(args, eventName, cb);
    }
    else{
      throw new Error('1st parameter must be a string or object');
    }
  }

  function setGpio(args, cb){
    websocket.initCheck();
    // system arch  
    let sa = null;

    if(m2mTest.option.enabled && args.pin === 55){
       sa = 'x64';
    }
    else{
       sa = os.arch();
    }

    if(sa !== 'arm' && (!args.type || args.type === 'int'|| args.type === 'internal')){
      throw new Error('Sorry, gpio control is not available on your device');
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
    if(args.mode === 'input' || args.mode === 'in' || args.mode === 'output' || args.mode === 'out'){
      if(typeof args.pin === 'number' && Number.isInteger(args.pin) ){
        args.pin = [args.pin];
      }
      if(Array.isArray(args.pin)){
				for (let i = 0; i < args.pin.length; i++ ) {
          if(args.pin[i]){ 
            if(!Number.isInteger(args.pin[i])){
              throw new Error('pin element must be an integer');
            }
          }
        }
        if((sa === 'arm') && (!args.type || args.type === 'int' || args.type === 'internal')) { 
          // using the built-in gpio support
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
          // using an external gpio function
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
          // using the internal gpio simulation for x86/ other non-arm devices
          let eventName;
          if(args.mode === 'input' || args.mode === 'in'){
            eventName = deviceInputEventnameHeader + spl.id;
          }
          else if(args.mode === 'output' || args.mode === 'out'){
            eventName = deviceOutputEventnameHeader + spl.id;
          }
          setSimGpioProcess(args, eventName, cb);
        }
      }
    }
    else{ // invalid args.mode
      throw new Error('invalid arguments');
    }
  }

  // invoking setDeviceResourcesListener() to setup listener
  setDeviceResourcesListener((deviceSetup) => {
    deviceSetup.gpio.input.pin = removeDuplicateInArray(deviceSetup.gpio.input.pin);
    deviceSetup.gpio.output.pin = removeDuplicateInArray(deviceSetup.gpio.output.pin);
    deviceSetup.channel.name = removeDuplicateInArray(deviceSetup.channel.name);
    deviceSetup.watchChannel.name = removeDuplicateInArray(deviceSetup.watchChannel.name);
    setImmediate(() => {
      if(deviceSetup.gpio.input.pin.length > 0){
      	console.log('Gpio input', deviceSetup.gpio.input);
      }
      if(deviceSetup.gpio.output.pin.length > 0){ 
      	console.log('Gpio output', deviceSetup.gpio.output);
      }
      if(deviceSetup.watchChannel.name.length > 0){ 
      	console.log('Watch Channel data', deviceSetup.watchChannel.name);
      }
      if(deviceSetup.channel.name.length > 0){ 
      	console.log('Channel data', deviceSetup.channel.name);
      }
    });
  });

  let resources = {
    setApi: setApi,
    setData: setData,
    setGpio: setGpio,
  };

  let input = {
    getGpioInputSetup: getGpioInputSetup,
    GetGpioInputState: GetGpioInputState,
    deviceWatchGpioInputState: deviceWatchGpioInputState,
  };

  let output = {
    GetGpioOutputState: GetGpioOutputState,
    getGpioOutputSetup: getGpioOutputSetup,
    deviceWatchGpioOutputState: deviceWatchGpioOutputState,
  };

  let channel = {
    deviceEnableEventWatch: deviceEnableEventWatch,
    getChannelDataEvent: getChannelDataEvent,
    deviceWatchChannelData: deviceWatchChannelData,
    deviceSuspendEventWatch: deviceSuspendEventWatch,
  };

  let exit = {
    gpioExitProcess: gpioExitProcess,
    deviceExitProcess: deviceExitProcess,
    deviceExitProcessFromClient: deviceExitProcessFromClient,
  }

  return {
    exit: exit,
    input: input,
    output: output,
    channel: channel, 
    resources: resources,
    resetWatchData: resetWatchData,
    setEnableStatus: setEnableStatus,
    getEnableStatus: getEnableStatus,
    unwatchDeviceEvent: unwatchDeviceEvent,
    getDeviceSetupData: getDeviceSetupData,
  }

})(); // device


/*****************************************

                SEC OBJECT

 *****************************************/
/* istanbul ignore next */
const sec = exports.sec = (() => {

  const rsl = new RegExp(/\//), rbsl = new RegExp(/\\/);
  let serverTimeout = null, serverResponseTimeout = 7000, tp = {}, sd = {}; 
  let ptk = m2mUtil.getPtk(), rtk = m2mUtil.getRtk(), rpk = m2mUtil.getRpk();
  let rkpl = {_sid:'ckm', _pid:null, rk:true, nodev:process.version, m2mv:m2mv.version, rid:m2mUtil.rid(4)}, processFilename = null, restartStatus = true;
  const useridVldn = { regex:/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/, msg:'Invalid userid. It must follow a valid email format.'};
  const pwVldn = { regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*()\\[\]{}\-_+=~|:;<>,./? ])(?=.{6,})/, 
  msg: 'Password must be 8 characters minimum\nwith at least one number, one lowercase letter,\none uppercase letter, and one special character.'};
  

  (function setProcessName(){
    let mfn = require.main.filename, st = 0;
    if(process.platform === 'win32'){
      st = mfn.lastIndexOf("\\");
    }
    else{
      st = mfn.lastIndexOf("/");
    }
    processFilename = mfn.slice(st+1,st+50);
  })();

  function parseCtk(){
    try{
      let ctk = fs.readFileSync(ptk, 'utf8');
      return ctk.slice(0, 27); 
    }
    catch(e){
      if(e.code === 'ENOENT'){
        m2mUtil.initSec(); 
      }
    }
  }    
  
  function readCtk(){
    let data = null;
    try{
      data = JSON.parse(Buffer.from(fs.readFileSync(parseCtk(), 'utf8'), 'base64').toString('utf8'));
    }
    catch(e){
      //console.log('missing ctk');
    }
    finally{
      return data;
    }
  }

  function resetCtk(){
    setTimeout(function(){
      fs.writeFileSync(ptk, rpk); 
    }, 15*60000);
  }

  function getCtk(){
    let data = null;
    try{
      data = fs.readFileSync(rtk, 'utf8');
    }
    catch(e){
      //console.log('missing ctk');
    }
    finally{
      return data;
    }
  }

  function setCtk(path, data){
    return fs.writeFileSync(path, data);
  }

  function restoreCtk(){
    resetCtk();
    return fs.writeFileSync(ptk, rtk);
  }

  function restartProcess(rxd){
    rxd.active = true;
    rxd.result = 'fail';
    rxd.restartable = false;
    restoreCtk();
    if(process.env.npm_package_nodemonConfig_restartable && restartStatus){
      console.log('Restarting application ...');
      rxd.result = 'success';
      rxd.restartable = true;
      fs.writeFileSync('node_modules/m2m/mon', 'restart');
      m2mUtil.logEvent('process restarted remotely');
    }  
    emitter.emit('emit-send', rxd);
  }

  function getEndPointStatus(rxd){
    if(rxd._pid === 'client-status'){
      let appIds = null;
      if(m2mTest.option.enabled && rxd.options){
        options = rxd.options
      }
      try{
        appIds = fs.readFileSync('m2m_log/client_active_link', 'utf8');
      }
      catch(e){
        rxd.error = 'missing appIds file';
        appIds = [rxd.appId];
      }
      rxd.appIds = JSON.parse(appIds);
      rxd.clientDeviceId = client.getClientDeviceId(); 
    }

    if(rxd._pid === 'device-status'){
      rxd.enable = device.getEnableStatus();
    }

    rxd.active = true;
    rxd.systemInfo = m2mUtil.systemInfo;
    rxd.ctk = sec.getCtk();
    if(process.env.npm_package_nodemonConfig_restartable){
      rxd.restartable = true;
    }
    if(options && Object.keys(options).length > 0){
      rxd.options = options;
    }
    emitter.emit('emit-send', rxd); 
  }

  function secureSystem(rxd){
    rxd.active = true;
    console.log('secure system process ...');
    restoreCtk(); 
    if(rxd.on){
      restartStatus = false;
    }
    rxd.result = 'success';
    m2mUtil.logEvent('process', 'secure system');
    emitter.emit('emit-send', rxd);
  }

  function getCodeData(filename, rxd){
    let connectOption = websocket.getConnectionOptions();
    fs.readFile(filename, 'utf8', (err, data) => {
      if(err){
        if (err.code === 'ENOENT') {
          rxd.appData = 'filename does not exist.';
        }
        else{
          rxd.appData = err;
        }
        rxd.error = {permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      let bcode = Buffer.from(data); 
      if(connectOption && connectOption.pw){
        rxd.error = {pw:true, permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      } 
      rxd.success = true;
      restoreCtk();
      if(rxd.enc){
        encryptData(rxd, data);
      }
      else{
        rxd.appData = bcode.toString('base64');
        emitter.emit('emit-send', rxd);
      }
    });
  }

  function uploadCode(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadCode && options && options.m2mConfig.code){
      if(options.m2mConfig.code.allow && options.m2mConfig.code.filename){
        return getCodeData(options.m2mConfig.code.filename, rxd);
      }
      else{
        rxd.error = {permission:true, file:null};
        return emitter.emit('emit-send', rxd);
      }
    }
    rxd.error = {permission:false};
    emitter.emit('emit-send', rxd);
  }

  function updateCode(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(!rxd.appData){
      rxd.appData = 'filename does not exist.';
      rxd.error = {permission:true, file:null};
      return emitter.emit('emit-send', rxd);
    }
    if(rxd.updateCode && options && options.m2mConfig.code){
      if(options.m2mConfig.code.allow){ 
        if(options.m2mConfig.code.filename){
          if(process.env.npm_package_nodemonConfig_restartable){
            rxd.restartable = true;
          } 
          let utf8_appData = Buffer.from(rxd.appData, 'base64').toString('utf8');
          return fs.writeFile(options.m2mConfig.code.filename, utf8_appData, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                rxd.appData = 'filename does not exist.';
              }else{
                rxd.appData = err;
              }
              m2mUtil.logEvent('application code update error', err.message); 
              rxd.error = {permission:true, file:null};
              return emitter.emit('emit-send', rxd);
            }
            delete rxd.appData;
            rxd.success = true;
            emitter.emit('emit-send', rxd);
            restoreCtk();
            m2mUtil.logEvent('application code updated', options.m2mConfig.code.filename);
            console.log('code filename ', options.m2mConfig.code.filename, ' updated ...');
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
    return emitter.emit('emit-send', rxd);
  }

  function getEventLogData(rxd){
    let connectOption = websocket.getConnectionOptions();
    fs.readFile(rxd.filename, 'utf8', (err, data) => {
      if(err){
        if (err.code === 'ENOENT') {
          rxd.eventLogData = 'filename does not exist.';
        }
        else{
          rxd.eventLogData = err;
        }
        rxd.error = {permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      }
      let bcode = Buffer.from(data); 
      if(connectOption && connectOption.pw){
        rxd.error = {pw:true, permission:false, file:null};
        return emitter.emit('emit-send', rxd);
      } 
      rxd.success = true;
      if(rxd.enc){
        encryptData(rxd, data);
      }
      else{
        rxd.eventLogData = bcode.toString('base64');
        emitter.emit('emit-send', rxd);
      }
    });
  }

  function uploadEventLog(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadEventLog){
      return getEventLogData(rxd);
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
              restoreCtk();
              m2mUtil.logEvent('m2m module updated', 'v'+rxd.ver);
              if(rxd.restartable){
                setTimeout(() => { 
                  fs.writeFileSync('node_modules/m2m/mon', 'm2m module update'); 
                }, 1000);
              }
            }
          }
          catch (err) {
           m2mUtil.logEvent('m2m module update error', err);
           console.log('m2m module update error', err);
          }
        }
      });
    }	 
  })();

  function userOptionsValidate(args){
    try{
      if(args && ((typeof args !== 'object') || !(args instanceof Object))){
         throw new Error('invalid arguments');
      }
      // m2mConfig
      if(args.m2mConfig && args.m2mConfig.code && typeof args.m2mConfig.code === 'object' && args.m2mConfig.code.allow && args.m2mConfig.code.filename){
        if(args.m2mConfig.code.filename.length > 30){
          throw new Error('code filename is more than the maximum of 30 characters long');
        }
      }
      if(args.m2mConfig && args.m2mConfig.code && ((typeof args.m2mConfig.code !== 'object') || !(args.m2mConfig.code instanceof Object))){
        throw new Error('code option must be an object');
      }
      // userSettings
      if(args.userSettings && args.userSettings.name && args.userSettings.name.length > 20){
        args.userSettings.name = args.userSettings.name.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option name length');
        }
      }
      if(args.userSettings && args.userSettings.location && args.userSettings.location.length > 20){
        args.userSettings.location = args.userSettings.location.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option location name length');
        }
      }
      if(args.userSettings && args.userSettings.description && args.userSettings.description.length > 20){
        args.userSettings.description = args.userSettings.description.slice(0, 20);
        if(m2mTest.option.enabled) {
          throw new Error('Invalid option description name length');
        }
      }
    }
    catch(e){
      m2mUtil.logEvent('userOptionsValidate()', args , JSON.stringify(e));
      throw e;
    }
  }

  // additional options setup
  function UserProcessSetup(pl){

    // options validation check 
    userOptionsValidate(pl.options);
    // check if process is restartable (npm start) 
    if(process.env. npm_package_nodemonConfig_restartable){
      pl.restartable = true;
      if(pl.options){
        pl.options.restartable = true;
      }
    }
    else{
      pl.restartable = false;
      if(pl.options){
        pl.options.restartable = false;
      }
    }
  }

  /**
   * set m2m package.json configuration (auto config)
   */
  function setPkgConfig(pl){
    let pkgjsn = {}, startScript = {}, startScriptDelay = 2000, filename = processFilename, m2mConfig = false, nodemonConfig = false, pkgScript = false;
    let tsl = rsl.test(filename), tbsl = rbsl.test(filename);
    let sl = filename.indexOf("/"), bsl = filename.indexOf("\\");
  
    if(tbsl||tsl){
      console.log('* package.json auto config failed');
      console.log('* Please configure manually your package.json');
      return;   
    }
    
    if(bsl !== -1||sl !== -1){
      console.log('** package.json auto config failed');
      console.log('** Please configure manually your package.json');
      return;
    }

    if(pl && !pl.options){
      pl.options = {};
    }
    try{
      pkgjsn = require('../../../package.json');
    }
    catch(e){
      if(e.code == 'MODULE_NOT_FOUND'){
        // console.log('No package.json found.');
        // setup m2m application basic properties
        pkgjsn['name'] = "m2m-application";
        pkgjsn['version'] = "1.0.0";
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
    }
    finally{
      console.log('\nConfiguring package.json for m2m ...\n');
      // setup m2mConfig property
      pkgjsn['m2mConfig'] = {"code":{"allow":true, "filename":filename}};
      pl.options.m2mConfig = pkgjsn['m2mConfig'];
      pl.options.processFilename = filename;
      m2mConfig = true; 
      // setup nodemonConfig property
      pkgjsn['nodemonConfig'] = {"delay":"2000", "verbose":true,"restartable":"rs","ignore":[".git","public"],"ignoreRoot":[".git","public"],"execMap":{"js":"node"},"watch":["node_modules/m2m/mon"],"ext":"js,json"};
      pl.options.nodeConfig = true;
      pl.options.nodemonConfig = true;
      nodemonConfig = true; 
      // setup scripts.start property using nodemon
      startScript = "nodemon " + filename;  
      pkgjsn['scripts'] = {}; 
      pkgjsn['scripts'].start = startScript; 
      pl.options.startScript = startScript; 

      if(processArgs[1] === '-test'){
        pkgjsn['scripts'].test = "nyc --reporter=html --reporter=text mocha --throw-deprecation node_modules/m2m/test/*.test.js";
      }
      // update to latest 
      if(pkgjsn['dependencies'].m2m){
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
           
      pkgScript = true;

      // create package.json
      fs.writeFileSync('package.json', JSON.stringify(pkgjsn, null, 2)); 
      // quick package.json validation check 
      if(!m2mConfig||!nodemonConfig||!pkgScript){
        console.log(colors.brightRed('Configuration fail') + '.' + ' Please configure your package.json manually.\n');
      }
      else{
        console.log(colors.brightGreen('Configuration done') + '.' + ' Please verify your package.json.\n');
        console.log('Restart your application using', colors.brightGreen('npm start')+'.\n');
      } 
      setImmediate(process.exit);
    }
  }

  /**
   * get m2m package.json current configuration
   */
  function getPkgConfig(pl){
    if(m2mTest.option.enabled){
      return;
    }

    if(!pl.options){
      pl.options = {};
    }

    // set client name, location, description, restartable option independent of code editing setup  
    // setup options.userSettings (client only) and options.restartable properties  
    UserProcessSetup(pl);

    let m2mConfig = false, nodemonConfig = false, pkgScript = false, startScript = {}, filename = processFilename;
    let tsl = rsl.test(filename), tbsl = rbsl.test(filename);
    
    function misConfigProp(propName, property){
      console.log('\nYou have a misconfigured package.json as shown below:');
      console.log(propName, property);
      console.log('\nYou can try fixing it by starting your application using the -config flag.\n');
      process.exit();
    }

    try{
      let pkgjsn = require('../../../package.json');
      if(pkgjsn){
        // m2mConfig validation 
        if(pkgjsn['m2mConfig']){
          if(tbsl||tsl){
            console.log('Your package.json m2mConfig filename is invalid =>', pkgjsn['m2mConfig']);
            console.log('\nPlease configure your package.json manually for code editing and auto start\n');
            process.exit(); 
          } 

          if(pkgjsn['m2mConfig'].code && pkgjsn['m2mConfig'].code.allow === false|true && pkgjsn['m2mConfig'].code.filename && pkgjsn['m2mConfig'].code.filename === filename){
            pl.options.m2mConfig = pkgjsn['m2mConfig'];
            pl.options.processFilename = filename;
            m2mConfig = true;
          }
          if(!m2mConfig){
            misConfigProp('m2mConfig', pkgjsn['m2mConfig']);
          }
        }
        // nodemonConfig validation
        if(pkgjsn['nodemonConfig'] && pkgjsn['nodemonConfig'].watch && pkgjsn['nodemonConfig'].ignore){
          if(pkgjsn['nodemonConfig'].watch[0] == "node_modules/m2m/mon" && pkgjsn['nodemonConfig'].ignore[0] === '.git' && pkgjsn['nodemonConfig'].ignore[1] === 'public'){
            if(pkgjsn['nodemonConfig'].ignoreRoot[0] === '.git' && pkgjsn['nodemonConfig'].ignoreRoot[1] === 'public'){
              if(pkgjsn['nodemonConfig'].execMap.js && pkgjsn['nodemonConfig'].execMap.js === 'node'){
                if(pkgjsn['nodemonConfig'].ext && pkgjsn['nodemonConfig'].ext === 'js,json'){
                  if(pkgjsn['nodemonConfig'].delay && pkgjsn['nodemonConfig'].delay === '2000'){
                    pl.options.nodemonConfig = true;
                    nodemonConfig = true;
                  }
                }
              }
            }
          }
          if(!nodemonConfig){
            misConfigProp('nodemonConfig', pkgjsn['nodemonConfig']);
          } 
        }
        // scripts validation and auto configuration
        if(pkgjsn['scripts']){
          let nodemonScript = {};
          if(pkgjsn['scripts'].start){
            pl.options.startScript = pkgjsn['scripts'].start; 
            let startString = pkgjsn['scripts'].start;
            if(pkgjsn['nodemonConfig'].delay && pkgjsn['nodemonConfig'].delay === '2000'){
              nodemonScript = startString.match('nodemon ' + filename);
            }
            else{
              nodemonScript = startString.match('nodemon ' + '--delay 2000ms ' + filename);
            }
            if(nodemonScript && nodemonScript[0]){
              pl.options.startScript = nodemonScript[0];
              pkgScript = true;
            }
          }
          if(!pkgScript){
            misConfigProp('scripts', pkgjsn['scripts']);
          } 
        }
      }
    }
    catch(e){
      if(e.code == 'MODULE_NOT_FOUND'){
        //console.log('No package.json found ...');
        //console.log('You can setup your m2m package.json using the -config flag.');
      }
    }
  }

  function responseTimeout(){
    serverTimeout = setTimeout(() => {
      console.log('There was no response from the server.\nPlease confirm if you are connecting to a valid server.\n' );
      process.kill(process.pid, 'SIGINT');
    }, serverResponseTimeout); 
  }

  function getCK(kt, cb){
    let ws = null;
    let server = websocket.getCurrentServer();
    tp.v = crypto.createVerify('SHA256');tp.v.update(m2mUtil.defaultNode);tp.v.end();
    rkpl._pid = kt;
    responseTimeout();
    if(server){
      try{
        ws =  new _WebSocket(server + "/ckm", {origin:server});
      }
      catch(e){
        m2mUtil.logEvent('getCK invalid server', JSON.stringify(e));
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
        ws.send(JSON.stringify(rkpl), (e) => {
        if(e){
          m2mUtil.logEvent('getCK ws open send error', JSON.stringify(e));
          return console.log('getCK send error',e);
         }
        });
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
          m2mUtil.logEvent('getCK ws message error', JSON.stringify(e));
          //console.log(e);
          tp = null;
          if(cb){return cb(e, null);}
          throw new Error(e);
        }
        finally{
          ws.close();setTimeout(() => {ck = null}, 5000);
        }
      }
    }); 
    ws.on("error",(e) => {
      m2mUtil.logEvent('getCK ws error', JSON.stringify(e));
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
      tp.cipkey1 = crypto.pbkdf2Sync(tp.csec, tp.slt1, tp.rnd, 32, 'sha256');
      if(cb){
        return crypto.pbkdf2(tp.csec, tp.slt1, tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
          tp.cipkey1 = dkey;
          process.nextTick(cb, null, tp);
        });
      }
    }
    catch(e){
      m2mUtil.logEvent('setTmpKey()', JSON.stringify(e));
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
      m2mUtil.logEvent('encryptUser()', JSON.stringify(e));
      if(cb){
        return cb(e, null);
      }
      //console.log(e);
    }
    finally{
      setTimeout(() => {
        user = null;tp = null;m2m = null;
      }, 1000);
    }
  }

  function ckSetup(cb){
    getCK('dck',(err, ck) => {
      if (err) throw err;
      try{
        if(ck){
          setTmpKey(tp, ck, (err, tp) => {
            if (err) throw err;
            if(cb){
              return process.nextTick(cb, null, tp);
            }
            return tp;
          });
        }
      }
      catch(e) {
        //console.log(e);
        m2mUtil.logEvent('ckSetup()', JSON.stringify(e));
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
      if(err) throw err;
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
          tp.pkg.edata = crypto.publicEncrypt(tp.dpk, Buffer.from(m2mUtil.defaultNode));
        }
        delete tp.pkg.cdata;
        delete rxd.ad;
        rxd.pkg = tp.pkg;
        rxd.idn = tp.slt2;
        emitter.emit('emit-send', rxd);
      }
      catch(e){
        m2mUtil.logEvent('encryptData()', JSON.stringify(e));
        //console.log(e);
      }
    });
  }

  function authenticate(args, user, m2m, cb){

    let uv = user.name.search(useridVldn.regex); 
    let pv = user.password.search(pwVldn.regex); 

    if(user.name.length < 5 || user.name.length > 20){
      if(cb){
        return cb(new Error('Userid must be 5 characters minimum and 20 characters maximum.'), null); 
      }
      throw new Error('Userid must be 5 characters minimum and 20 characters maximum.');
    }

    if(user.password.length < 8 || user.password.length > 50){
      if(cb){
        return cb(new Error('Password must be 8 characters minimum and 50 characters maximum.'), null); 
      }
      throw new Error('Password must be 8 characters minimum and 50 characters maximum.');
    }

    if(uv < 0){
      if(cb){
        return cb(new Error('Invalid userid credential.'), null); 
      }
      throw new Error('Invalid userid credential.');
    }

    if(pv < 0){
      if(cb){
        return cb(new Error('Invalid pw credential.'), null); 
      }
      throw new Error('Invalid pw credential.');
    }

    if(user.sc && user.sc.length !== 4){
      if(cb){
        return cb(new Error('Invalid security code credential.'), null); 
      }
      throw new Error('Invalid security code credential.');
    }

    setTimeout(() => {
      encryptUser(user, m2m, (err, m2m) => {
        if(err) {
          m2mUtil.logEvent('authenticate encryptUser()', JSON.stringify(err));
          throw err;
        }
        console.log('\nConnecting to remote server ...');
        websocket.connect(args, m2m, cb);
        //http.connect(args, m2m, cb);
      });
    }, 1000);
  }

  function userPrompt(args, m2m, cb){
    console.log('\nPlease provide your credentials ...\n');

    if(m2m.app){
      if(m2m.uid){
        delete m2m.uid;delete m2m.ak;delete m2m.aid;
      }
      let clientActiveLink = m2mUtil.getClientActiveLinkData(), match = false;
      for (let i = 0; i < clientActiveLink.length; i++) {
        if(clientActiveLink[i] && clientActiveLink[i] === m2m.appId){
          match = true;
        }
      }
      if(!match){
        m2mUtil.trackClientId(m2m.appId);
      }
    }
 
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

    if(m2mTest.option.enabled) {
      let user_val = validate_userid(args.userid);
      let pw_val = validate_password(args.pw);    
      let sc_val = validate_sc(args.sc);

      if(user_val !== true){
        throw new Error(user_val);
      }
      else if(pw_val !== true){
        throw new Error(pw_val);
      }
      else if(sc_val !== true){
        throw new Error(sc_val);
      }
      else{   
        if(cb){
          return cb(null, 'success');
        }
      }
    }
  
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
        m2mUtil.logEvent('decSC()', JSON.stringify(e));
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

  function m2mStart(args, m2m, cb){
    if(m2m.options){
      options = m2m.options;
    }
       
    if(args && typeof args === 'object' && (!args.userid || !args.pw || !args.sc)){
      //console.log('Credential option is not provided ...');
    } 

    let user = {};
    m2m._sid = 'm2m';
    m2m.tid = Date.now();

    if(m2m.app){
      if(!m2m.appIds){
        let appIds = m2mUtil.trackClientId(m2m.appId);
        m2m.appIds = JSON.parse(appIds);
      }
    }

    websocket.setServer(args);

    if(m2mTest.option.enabled) {
      if(cb){
        if(args && args.final){
          // continue
        }
        else if(args && args.auth){
          user.name = args.userid;
          user.password = args.pw;
          user.sc = args.sc;
          return authenticate(args, user, m2m, cb);
        }
        else{   
          return cb(null, 'success');
        }
      }
    }

    getCK('dck',(err, ck) => {
      if(err) {
        m2mUtil.logEvent('getCK()', JSON.stringify(err));
        throw err;
      } 
      if(ck.puk && ck.sk){ 
        setTmpKey(tp, ck);
        if(m2m.nsc||m2m.reg){
          crypto.pbkdf2(tp.csec, tp.slt2 , tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
            tp.cipkey2 = dkey;
          });
        }
        if(m2m.nsc||m2m.reg){
          sd = tp;
        }
      }

      if(processArgs[0] !== '-r' && args && typeof args === 'object' && args.userid){ 
        console.log('current user:', args.userid, '\n');
      }
      if(args && typeof args === 'object' && args.userid && args.pw && args.sc){
        if(args.userid && args.pw && args.sc){
          if(args.trial){
            m2m.trial = args.trial;
            m2m.startDate = Date.now();
          }

          user.name = args.userid;
          user.password = args.pw;
          user.sc = args.sc;

          if(processArgs[0] === '-r'){
            return userPrompt(args, m2m, cb);
          }
          return authenticate(args, user, m2m, cb);
        }
        else{
          if(cb){
            return cb(new Error('invalid credentials'));
          }
        }
      }
      if(m2mTest.option.enabled) {
        if(args && args.final){
          process.exit(0);
        }
        else {
          if(cb){
            return cb(null, 'success');
          }
        }
      }
      userPrompt(args, m2m, cb);
    });
  }

  function m2mRestart(args, m2m, cb){
    try{
      let path = null;
      // set options for new m2m 
      if(m2m.options){
        options = m2m.options;
      }

      if(m2mTest.option.enabled && m2m.start){
      	path = 'test/sec/test/start/tk';
      }
      else if(m2mTest.option.enabled && m2m.restart){
      	path = 'test/sec/test/restart/tk';
      }
      else if(m2mTest.option.enabled && m2m.dtc){
      	path = 'test/sec/device/tk';
      }
      else if(m2mTest.option.enabled && m2m.ctd){
      	path = 'test/sec/client/tk';
      }
      else if(m2mTest.option.enabled && m2m.device){
      	path = 'test/sec/device/tk';
      }
      else if(m2mTest.option.enabled && m2m.app){
        path = 'test/sec/client/tk';
      }
      else{
        path = parseCtk();
      }
   
      let clientActiveLink = null, tk = fs.readFileSync(path, 'utf8'), data = JSON.parse(Buffer.from(tk, 'base64').toString('utf8'));

      if(m2m.app){
        clientActiveLink = m2mUtil.getClientActiveLinkData();
      }

      if(m2mTest.option.enabled && m2m.mid){
        delete data.id;
      }
      if(m2m.app && data.id && typeof data.id === 'number'){
        console.log('Application has changed from device to client, you need to register your new client application.');
        return m2mStart(args, m2m, cb);
      }
      if(m2m.app && data.appId && data.appId !== m2m.appId){
        console.log('Client id has changed from',data.id,'to',m2m.id, 'you need to register your new client application.');
        return m2mStart(args, m2m, cb);
      } 
      if(m2m.app && clientActiveLink && clientActiveLink.length > 0){ 
        let match = false, activeLinkId = null;
        for (let i = 0; i < clientActiveLink.length; i++) {
          if(clientActiveLink[i] && clientActiveLink[i] === data.appId){
            match = true; activeLinkId = data.appId;
          }
        }
        if(!match){
          console.log('\nClient id has changed, you need to register your new client application.');
          return m2mStart(args, m2m, cb);
        }
      }
      if(m2m.device && data.id && typeof data.id === 'string'){
        console.log('Application has changed from client to device, you need to register your new device.');
        return m2mStart(args, m2m, cb);
      } 
      if(m2m.device && data.id && data.id !== m2m.id){
        console.log('Device id has changed from',data.id,'to',m2m.id, 'you need to register your new device application.');
        return m2mStart(args, m2m, cb);
      }

      if(m2m.device && !data.id){
        console.log('Registering new device.\n');
        return m2mStart(args, m2m, cb);
      }
      if(m2m.user && m2m.u){
        //console.log('Verify user ...', m2m);
      }
     
      console.log('\nConnecting to remote server ...\n');
      data.options = m2m.options;
      data.restartable = m2m.restartable;
      m2m = data;
      process.nextTick(websocket.connect, args, m2m, cb);
      //process.nextTick(http.connect, args, m2m, cb);
    }
    catch(e){
      // redirect user to register w/ credentials
      // console.log('Register new user.\n');
      if(e){
        if (e.code === 'ENOENT') {
          //return m2mStart(args, m2m, cb);
        }
        return m2mStart(args, m2m, cb);
      }
    }
  }

  return  {
    decSC: decSC,
    getCtk: getCtk,
    setCtk: setCtk,
    readCtk: readCtk,
    m2mStart: m2mStart,
    restoreCtk: restoreCtk,
    m2mRestart: m2mRestart,
    userPrompt: userPrompt,
    uploadCode: uploadCode,
    updateCode: updateCode,
    getPkgConfig: getPkgConfig,
    setPkgConfig: setPkgConfig, 
    authenticate: authenticate,
    secureSystem: secureSystem,
    uploadEventLog: uploadEventLog,
    restartProcess: restartProcess,
    getEndPointStatus: getEndPointStatus,
  }

})(); // sec


/*****************************************

              HTTP OBJECT

 *****************************************/
/* istanbul ignore next */
const http = exports.http = (() => {
  let http = require('https');
  let n = null, port = 443, hostname = null;  
  try{
    n = m2mUtil.defaultNode.search("www");
    if(n === -1){
      http = require('http');
      n = m2mUtil.defaultNode.search("http");
      port = 3000;
    }
    else{
      port = 443;
    }
    hostname = m2mUtil.defaultNode.slice(n, 35);
  }
  catch(e){
    m2mUtil.logEvent('http()', JSON.stringify(e));
    console.log('invalid hostname', e);
  }

  function request(http, data){
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        cb(null, JSON.parse(chunk));
      });
      res.on('end', () => {
        //console.log('End of response.');
      });
    });

    req.on('error', (e) => {
      console.error(`http request error: ${e.message}`);
    });

    req.write(data);
    req.end();

  } 

  function connect(args, m2m, cb){
    let data = JSON.stringify(m2m);
    let path = '/m2m/usr/connect';
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    request(http, data);
  }

  function postApi(path, m2m, cb){
    let data = JSON.stringify(m2m);
    
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    request(http, data);
  }

  return  {
    connect: connect,
  }

})(); // http


/************************************************

            WEBSOCKET CLIENT OBJECT

 ************************************************/
/* istanbul ignore next */
const websocket = exports.websocket = (() => {
  let dogTimer = null, clientRxEventName = null, connectOption = null, THRESHOLD = 1024;
  let initialTimer = 3*3600000, dogTimerInterval = initialTimer, server = m2mUtil.defaultNode;
  let rxd = {}, ws = null, reg = false, clientActive = 0, registerAttempt = 0, wsConnectAttempt = 0;

  function init(value){
    reg = value;
  }

  function getInit(){
    return reg;
  }
    
  function initCheck(){
    if(!reg){
      if(m2mTest.option.enabled){
        //throw new Error('process terminated');
      }
      else{
        process.kill(process.pid, 'SIGINT');
      }
    }
  }

  function currentSocket(){
    return ws;
  }

  function setSocket(s){
    ws = s;
    return ws;
  }

  function setDogTimerInterval(i){
    dogTimerInterval = i;
    return i;
  }

  function getCurrentServer(){
    return server;
  }

  function getConnectionOptions(){
    return connectOption;
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
        server = m2mUtil.defaultNode;
      }
    }
    else if(args && typeof args === 'string'){
      server  = args;
    }
    else{
      server = m2mUtil.defaultNode;
    }
    return args;
  }

  function wsReconnectAttempt(e, args, m2m, cb){
    let server = m2mUtil.defaultNode;
    let randomInterval = Math.floor(( Math.random() * 20000) + 1000); 
    
    if(spl.device){
      device.exit.deviceExitProcess();
    }

    if(e === 1006 || e === 1003){
      if(args && typeof args === 'object'){
        if(args.server){
          server = args.server;
        }
        else{
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

      let timeout = setTimeout(connect, randomInterval, args, m2m, cb);
      wsConnectAttempt++;

      if(m2mTest.option.enabled) {
        clearTimeout(timeout);
        if(cb){
          return cb(null, 'success');
        }
      }
    } 
  }

  function refreshConnection(test){
    websocket.initCheck();
    if(test){
      ws = {};
      ws.readyState = 1;
    }    
    if(ws.readyState === 1){
      try{
        let pl = Object.assign({}, spl);
        if(pl.c){
          pl._pid = 'client-renew-ws';
        }
        else{
          pl._pid = 'device-renew-ws';
        }
        if(test){
          throw 'test';
        }
        websocket.send(pl);
      }
      catch(e){
        m2mUtil.logEvent('refreshConnection()', JSON.stringify(e));
        console.log('refreshConnection error', e);
        if(test){  
          throw 'test';
        }
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
      if(m2mTest.option.enabled) {
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

  function wsOpenEventProcess(m2m){
    send(m2m);
    clientActive++;
    wsConnectAttempt = 0;
    setDogTimer(dogTimer, dogTimerInterval);
    m2mUtil.logEvent('websocket', 'open and active');
  }

  function exitEventProcess(){
    delete spl.options;delete spl.systemInfo;delete spl.userSettings;
    delete spl.ctk;delete spl.tid;delete spl.ak;delete spl.reg;delete spl.restartable;
    let pl = Object.assign({}, spl);
    pl._pid = 'exit';pl.exit = true;pl.active = false;
    process.on('exit', (code) => {
      m2mUtil.logEvent('process', 'exit', ''+code);
      ws.send(JSON.stringify(pl));
      if(spl.device){
        device.exit.gpioExitProcess();
      }
      console.log('exit process ...\n', code);
    });
    process.on('SIGINT', (s) => {
      m2mUtil.logEvent('process', 'exit', s);
      process.exit();
    });
  }
  
  function reconnectProcess(rxd){
    rxd.active = true;
    // console.log('Reconnect process ...');
    emitter.emit('connect', 'reconnect process');
    rxd.result = 'success';
    m2mUtil.logEvent('process', 'reconnect app');
    emitter.emit('emit-send', rxd);
  }

  function commonRxData(rxd){
    if(rxd.restart){
      return sec.restartProcess(rxd);
    }
    else if(rxd.status){
      return sec.getEndPointStatus(rxd);
    }
    else if(rxd.secureSystem){
      return sec.secureSystem(rxd);
    }
    else if(rxd.updateCode){
      return sec.updateCode(rxd);
    }
    else if(rxd.uploadCode){
      return sec.uploadCode(rxd);
    }
    else if(rxd.uploadEventLog){
      return sec.uploadEventLog(rxd);
    }
  }

  /*****************************************

  		Device Received Data Router (rxd)
  
  ******************************************/
  function DeviceRxData(rxd){
    try{
      if(rxd && rxd.id && rxd.id !== spl.id) {
        if(m2mTest.option.enabled) {
        	//throw new Error('invalid id');
          throw 'invalid id';
        }
        m2mUtil.logEvent('DeviceRxData invalid id', rxd.id, spl.id);
        return;
      }
      if(rxd.src === 'device' || rxd.deviceResponse || rxd.device){
        if(m2mTest.option.enabled) {
        	//throw new Error('invalid payload');
          throw 'invalid payload';
        }
        //m2mUtil.logEvent('DeviceRxData invalid payload', rxd, spl);
        return;
      }
      else if(rxd.exit){
        return device.exit.deviceExitProcessFromClient(rxd);
      } 
      else if(rxd.channel || rxd.name){
        if(rxd.event){
          return device.channel.deviceWatchChannelData(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
       	return device.channel.getChannelDataEvent(rxd);
      }
      else if(rxd.gpioInput || rxd.input){
        if(rxd.event){
          if(device.input.getGpioInputSetup()){ 
            return device.input.GetGpioInputState(rxd);
          }
          return device.input.deviceWatchGpioInputState(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        return device.input.GetGpioInputState(rxd);
      }
      else if(rxd.gpioOutput || rxd.output){
        if(rxd.event){
          if(device.output.getGpioOutputSetup()){
            return device.output.GetGpioOutputState(rxd);
          }
          return device.output.deviceWatchGpioOutputState(rxd); 
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        return device.output.GetGpioOutputState(rxd);
      }
      else if(rxd.setupData){
        return device.getDeviceSetupData(rxd);
      }
      else if(rxd.enable === false){
        return device.channel.deviceSuspendEventWatch(rxd);
      }
      else if(rxd.enable === true){
        return device.channel.deviceEnableEventWatch(rxd);
      }
      commonRxData(rxd);
    }
    catch(e){
      if(e && m2mTest.option.enabled){
        throw e;
      }
      m2mUtil.logEvent('DeviceRxData error:', e);
    }
  }

  /******************************************

      Client Received Data Router (rxd)
  
  *******************************************/
  function ClientRxData(rxd){
    try{
      if(rxd.activeStart){
        return client.clientDeviceActiveStartProcess(rxd);
      }
      else if(rxd.exit){
        return client.clientDeviceOffLineProcess(rxd);
      }
      else if(rxd.getRegisteredDevices){
        return client.getRemoteDevices(rxd);
      }
      else{
        commonRxData(rxd);
      }

      if(rxd.channel || rxd.name){
        if(rxd.unwatch){
        	clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch + rxd.unwatch;
        }
        else{
          clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch;
        } 
      }
      else if(rxd.gpioInput || rxd.input){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      }
      else if(rxd.gpioOutput || rxd.output){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
      }
      else if(rxd.setupData){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(rxd.getDevices){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(!rxd.error){
        clientRxEventName = rxd.id + rxd._pid;
      }
      emitter.emit(clientRxEventName, rxd);
    }
    catch(e){
      if(e && m2mTest.option.enabled){
        throw e; 
      }
      m2mUtil.logEvent('ClientRxData error:', e);
    }
  }

  function initRxData(rxd, args, m2m, cb){
    try{
      if(m2mTest.option.enabled) {
        if(rxd.ca){
          clientActive = rxd.ca;
        }
        if(rxd.ra){
          registerAttempt = rxd.ra;
        }
        ws.close = ()=> {};
		  }
      if(rxd.code === 10 && rxd.reason === 'open-test'){
        return;
      }
      if(rxd.code === 100 || rxd.code === 101 || rxd.code === 102){
        delete rxd.ctk;delete rxd.code;
        sec.setCtk(rxd.path, rxd.data);
        delete rxd.appData;delete rxd.path;delete rxd.data;
        m2m = rxd; registerAttempt = 0;init(true);spl = Object.assign({}, rxd);
        if(clientActive === 1){ 
          exitEventProcess();
        }
        if(rxd.user){
          return emitter.emit('connect', rxd.reason);
        }
        m2mUtil.logEvent('register', rxd.code, rxd.reason); 
        return connect(args, m2m, cb);
      }
      if(rxd.code === 110){
        if(rxd.data && !rxd.error){
          sec.setCtk(rxd.path, rxd.data);
          console.log('Access token updated ...');
          m2mUtil.logEvent('token updated', 'success');
          delete rxd.code;delete rxd.path;delete rxd.data;
        }
        else{
          console.log('Access token update fail ...');
          m2mUtil.logEvent('token update fail', rxd.error );
        }
        delete rxd.code;delete rxd.path;delete rxd.data;registerAttempt = 0;
        init(true);m2m = rxd;spl = Object.assign({}, rxd);connect(args, m2m, cb);
      }
      if(rxd.code === 150 ){
        return emitter.emit('m2m-module-update', rxd);
      }
      if(rxd.code === 200 || rxd.code === 210){
        sec.restoreCtk();
        registerAttempt = 0;
        init(true);
        if(clientActive === 1){ 
          exitEventProcess();
        }
        if(m2m.user){
          return emitter.emit('connect', rxd.reason);
        } 
        emitter.emit('connect', rxd.reason);
        m2mUtil.logEvent('reconnect', rxd.code, rxd.reason); 
        if(m2m.app){
          return setImmediate(client.getRegisteredDevices);
        }
        else {
        	return runActiveProcess();
        }
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
            console.log('You provided an invalid credentials. \n');
            m2mUtil.logEvent('invalid credentials', rxd.code, rxd.reason);
          }
          else{ 
            console.log('\n'+rxd.reason);
            m2mUtil.logEvent('connect fail', rxd.reason);
          }
          if(m2mTest.option.enabled){
            if(cb){
              return cb(null, rxd.reason);
            }
          }
          process.kill(process.pid, 'SIGINT');
        }
      }
      if(rxd.code === 530){
        init(false);
        console.log('\nresult:', rxd.reason);
        console.log('Device id ' + spl.id + ' is not valid or is not registered. \n');
        m2mUtil.logEvent('Device id ' + spl.id + ' is not valid or is not registered.', rxd.code, rxd.reason);
        if(m2mTest.option.enabled) {
          if(cb){
            return cb(null, rxd.reason);
          }
        }
        process.kill(process.pid, 'SIGINT');
      }
      if(rxd.code === 600){
        init(false);
        console.log('\nresult: success');
        if(rxd.reason){
          if(m2mTest.option.enabled){
            if(cb){
              return cb(null, rxd.reason);
            }
          }
          sec.decSC(rxd, (err, data)=> {
            if(err) return console.error(err);
            console.log(rxd.reason+':', data, '\n');
            m2mUtil.logEvent('renew security code', 'success', rxd.code);
            process.kill(process.pid, 'SIGINT');
          });
        }
      }
    }
    catch(e){
      if(m2mTest.option.enabled){
        throw e;
      }
      m2mUtil.logEvent('initRxData error:', e);
    }
  }

  function connect(args, m2m, cb){
    m2mUtil.st();

    if(ws){
      ws.close();
    }

    if(m2m.options){
      options = m2m.options;
    }

    if(m2m.device){
      device.resetWatchData();
      if(dogTimerInterval < 5400000){
        dogTimerInterval = dogTimerInterval + 60000;
      }
      else{
        dogTimerInterval = initialTimer;
      }
    }
    else if(m2m.app){
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

    m2m.systemInfo = m2mUtil.systemInfo;
    args = setServer(args);

    if(m2mTest.option.enabled) {
      if(cb){
        if(m2m.error){
          return cb(new Error(m2m.error), null);
        }
        return cb(null, 'success');
      }
    }

    try{
      ws = new _WebSocket(server + "/m2m", {origin:server});
    }
    catch(e){
      throw new Error('error starting new ws', e.message);
    }

    ws.on("open", () => {
      wsOpenEventProcess(m2m);
    });

    ws.on("message", (data) => {
      try{
        if(ws.readyState === 1) {
          rxd = JSON.parse(data);
          if(!Array.isArray(rxd) && Object.keys(rxd).length > 0){ 
            initRxData(rxd, args, m2m, cb);
            if(m2m.device){
              process.nextTick(DeviceRxData, rxd);
            }
          }
          else if(Array.isArray(rxd) && Object.keys(rxd[0]).length > 0){ 
            if(m2m.app){
              rxd = rxd[0];
              process.nextTick(ClientRxData, rxd);
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
        console.log('m2m server is not responding ...\nPlease ensure m2m server is valid.\n');
        if(!reg && clientActive < 1){
          process.kill(process.pid, 'SIGINT');
        }
      }
    });
  }

  function send(data){
    if(ws && ws.readyState === 1 && ws.bufferedAmount < THRESHOLD){
      process.nextTick(() => {
        ws.send(JSON.stringify(data), (e) => {if(e) return console.log('emit-send error:', e.message)});
      });
    }
  }

  const setEmitSendListener = (() => {
    let eventName = 'emit-send';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        let enable = device.getEnableStatus();
        if(!data.src){
          throw new Error('invalid data.src');
        }
        if(!data.dst){
          throw new Error('invalid data.dst');
        }
        if(data.src === 'client' || data.src === 'browser'){
          data.dst = data.src;
        }
        if(spl.device){
          data.src = 'device';
        }
        if(spl.app){
          data.src = 'client';
        }
        data.response = true;
        if(enable){
          send(data);
        }
        if(enable === false && data._pid === 'device-status'){
          send(data);
        }
      });	 
    }
  })();

  return {
    init:init,
    send: send,
    connect: connect,
    getInit: getInit,
    initCheck: initCheck,
    setServer: setServer,
    setSocket: setSocket,
    initRxData: initRxData,
    setDogTimer: setDogTimer,
    DeviceRxData, DeviceRxData, 
    ClientRxData, ClientRxData,
    currentSocket: currentSocket,
    getCurrentServer: getCurrentServer,
    refreshConnection: refreshConnection,
    wsReconnectAttempt: wsReconnectAttempt,
    setDogTimerInterval: setDogTimerInterval,
    getConnectionOptions: getConnectionOptions
  }

})(); // websocket

/* m2m test option */
/* istanbul ignore next */
var m2mTest = exports.m2mTest = (() => {
  let option = {}, testEmitter = emitter; 
  
  function enable(s) {
    option.enabled = true;
    if(s){
      spl = s;
    }
  }

  function logEvent(msg, data1, data2, data3, data4, data5, data6){
    let filepath = 'm2m_log/test_result.txt', file_size = 10000, d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();

    if(!data1){
      data1 = '';
    }
    if(!data2){
      data2 = '';
    }
    if(!data3){
      data3 = '';
    }
    if(!data4){
      data4 = '';
    }
    if(!data5){
      data5 = '';
    }
    if(!data6){
      data6 = '';
    }

    try{ 
      fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 ); 
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
      };
    }
    fs.stat(filepath, (e, stats) => {
      if(e && e.code === 'ENOENT'){
        initLog();
      }
      if(stats.size > file_size){
        fs.writeFileSync(filepath, '   Date' + '                           Application events');
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 ); 
      }
    });
  }

  return {
    option: option,
    enable: enable,
    logEvent: logEvent,
    testEmitter: testEmitter,
  }

})(); 


