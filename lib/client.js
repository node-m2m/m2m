/*!
 * client library
 *
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const fs = require('fs');
const os = require('os');
//const ip = require('ip');
const crypto = require('crypto');
const _WebSocket = require('ws');
const colors = require('colors');
const inquirer = require('inquirer');
const EventEmitter = require('events');
class StateEmitter extends EventEmitter {};
const emitter = new StateEmitter();
const { spawn, spawnSync, execFileSync } = require('child_process');
const processArgs = process.argv.slice(2);
emitter.setMaxListeners(5);
var m2mv = require('../package.json');
var spl = {}, options = {};

/********************************************

                Data Manager

 ********************************************/
const dm = exports.dm = (() => {
  let deviceAccessFlag = true, clientAccessData = [], roundN = 1, deviceResources = {};
  let accessRateFlag = true, accessRatePerMin = 60000, monitorAccessRateTimeout = null;
  let monAccessRateCounter = 1, iterationCount = 60, monStatus = {}, d = {r:'r', w:'w'};
  let channelWatchRate = [], channelGetDataRate = [], httpGetRate = [], httpPostRate = [];
  let inputWatchRate = [], inputGetStateRate = [], outputOnRate = [], outputOffRate = [], accessRateData = [];
  let eLogP = 'm2mConfig/eLog', file_size = 35000, deviceTotalAccessRate = {}, resourceAccessRateContainer = []; 
  let eventLogHeader = '                  Date' + '                                           Event';

  /********************************

                Device

   ********************************/
  function getDeviceAccessRateData(){
    //console.log('deviceTotalAccessRate', deviceTotalAccessRate);
    return deviceTotalAccessRate;
  }

  function resetDeviceAccessRateData(){
    deviceTotalAccessRate = {};
  }

  function collectAccessData(data){
    if(accessRateFlag){
      resourceAccessRateContainer.push(data);
    }
  }
  
  function resetTotalCount(){
    channelWatchRate = [], channelGetDataRate = [], httpGetRate = [], httpPostRate = [];
    inputWatchRate = [], inputGetStateRate = [], outputOnRate = [], outputOffRate = [], accessRateData = [], deviceTotalAccessRate = {};
  }

  function accessFile(ops){
    let path = 'm2mConfig/ar', s_enc = 'base64', t_enc = 'utf8';  
    try{
      if(ops === 'r'){
        let rF = fs.readFileSync(path, 'utf8');
        if(rF){
          deviceTotalAccessRate = JSON.parse(Buffer.from(rF, s_enc).toString(t_enc)); 
        }  
      }
      else if(ops === 'w'){
        if(Object.keys(deviceTotalAccessRate).length > 0){
          if(deviceTotalAccessRate.accessRateData && deviceTotalAccessRate.accessRateData[0]){
            let arFile = JSON.stringify(deviceTotalAccessRate);
            let wF = Buffer.from(arFile, t_enc).toString(s_enc);
            //console.log('deviceTotalAccessRate is not empty'); 
            fs.writeFileSync(path, wF);
          }
          else{
            //console.log('accessRateData is empty');
          }       
        }
        else{
          //console.log('deviceTotalAccessRate is empty = {}');
        }
      }
    }
    catch(e){
      //console.log('accessFile error', e.message);
      dm.logEvent('accessFile error', e.message);
    }
  }

  setTimeout(() => {
    //console.log('deviceSetup', device.resources.getDeviceResources());
  }, 1000);

  function stopMonitorAccessRate(){
    //console.log('stopMonitor');
    monAccessRateCounter = 1;
    accessRateFlag = false;
    resetTotalCount();
    deviceTotalAccessRate.accessCounter = 1; 
    deviceTotalAccessRate.monStatus = false;
    clearTimeout(monitorAccessRateTimeout);
    dm.logEvent('resource access rate monitoring:', accessRateFlag);
  }
  

  function startMonitorAccessRate(ops){
    //console.log('startMonitor');
    accessFile(d.r);
    accessRateFlag = true;
    //monitorAccessRate();
    setImmediate(monitorAccessRate);
    dm.logEvent('resource access rate monitoring:', accessRateFlag);
  }

  function initChannelData(channelName, accessRate){
    channelName.forEach((name, x) => {
      let data = {id:spl.id, name: name, cpm: 0, tcpm:0, arpm:0};             
      accessRate.push(data);
    });
  }

  function initGpioPin(gpioPin, accessRate){
    gpioPin.forEach((pin, x) => {
      let data = {id:spl.id, pin: pin, cpm: 0, tcpm:0, arpm:0};             
      accessRate.push(data);
    });
  }

  function setAccessCount(resourceCount){
    resourceCount.forEach((object, x) => {
      object.tcpm = object.tcpm + object.cpm;
      object.arpm = (object.tcpm/monAccessRateCounter).toFixed(roundN);
      object.iteration = monAccessRateCounter;
      let data = Object.assign({}, object);
      if(object.tcpm){
        accessRateData.push(data);
      }
      object.cpm = 0;   
    });
  } 

  function monitorAccessRate(){
    accessRateFlag = true;
    deviceTotalAccessRate.monStatus = true;
    //console.log('deviceSetup', device.resources.getDeviceResources());
    deviceResources = device.resources.getDeviceResources();

    let channelName = deviceResources.channel.name;
    let watchChannelData = deviceResources.watchChannel.name;
    let getPath = deviceResources.httpApi.getPath;
    let postPath = deviceResources.httpApi.postPath;
    let inputPin = deviceResources.gpio.input.pin;
    let outputPin = deviceResources.gpio.output.pin;

    if(monAccessRateCounter === 1){
      initChannelData(channelName, channelWatchRate);
      initChannelData(channelName, channelGetDataRate);

      initChannelData(getPath, httpGetRate);
      initChannelData(postPath, httpPostRate);

      initGpioPin(inputPin, inputWatchRate);
      initGpioPin(inputPin, inputGetStateRate);

      initGpioPin(outputPin, outputOnRate);
      initGpioPin(outputPin, outputOffRate);
    }

    accessRateData = [];

    monitorAccessRateTimeout = setTimeout(() => {
      accessRateFlag = false;
      clearTimeout(monitorAccessRateTimeout);
       
      resourceAccessRateContainer.forEach((dataObject, x) => {
        try{
          if(dataObject.name && dataObject.watch && dataObject.method === 'watch'){
            channelWatchRate.forEach((object, x) => {
              if(object.name === dataObject.name){
                object.cpm++;
                object.watch = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.name && dataObject.getData && dataObject.method === 'getData'){
            channelGetDataRate.forEach((object, x) => {

              if(object.name === dataObject.name){
                object.cpm++;
                object.getData = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.name && dataObject.get && dataObject.method === 'get'){
            httpGetRate.forEach((object, x) => {
              if(object.name === dataObject.name){
                object.cpm++;
                object.get = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.name && dataObject.post && dataObject.method === 'post'){
            httpPostRate.forEach((object, x) => {
              if(object.name === dataObject.name){
                object.cpm++;
                object.post = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.gpioInput && dataObject.watch && dataObject.pin){
            inputWatchRate.forEach((object, x) => {
              if(object.pin === dataObject.pin){
                object.cpm++;
                object.input = true;
                object.watch = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.gpioInput && dataObject.getState && dataObject.pin){
            inputGetStateRate.forEach((object, x) => {
              if(object.pin === dataObject.pin){
                object.cpm++;
                object.input = true;
                object.getState = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            

            });
          }
          if(dataObject.gpioOutput && dataObject.on && dataObject.pin){
            outputOnRate.forEach((object, x) => {
              if(object.pin === dataObject.pin){
                object.cpm++;
                object.output = true;
                object.on = true;
                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
          if(dataObject.gpioOutput && dataObject.off && dataObject.pin){
            outputOffRate.forEach((object, x) => {
              if(object.pin === dataObject.pin){
                object.cpm++;
                object.output = true;
                object.off = true;

                if(object.cpm === 1){
                  //object.data = dataObject;
                }
              }            
            });
          }
        }
        catch(e){
          //console.log('accessRateMonitoring error', e.message);
          dm.logEvent('accessRateMonitoring error', e.message);
        }
      });

      setAccessCount(channelWatchRate);
      setAccessCount(channelGetDataRate);
      setAccessCount(httpGetRate);
      setAccessCount(httpPostRate);
      setAccessCount(inputWatchRate);
      setAccessCount(inputGetStateRate);
      setAccessCount(outputOnRate);
      setAccessCount(outputOffRate);

      setImmediate(() => {
        deviceTotalAccessRate = {accessRateData:accessRateData, monStatus:true, accessCounter:monAccessRateCounter};
        resourceAccessRateContainer = []; 
        setTimeout(() => {

          if(monAccessRateCounter < iterationCount){
            //console.log('access rate monitoring is active', monAccessRateCounter);
            accessFile(d.w);
            monAccessRateCounter++;
            monitorAccessRate();
          }
          else{
            //console.log('access rate monitoring stopped', monAccessRateCounter);
            stopMonitorAccessRate();
            accessFile(d.w);
            setTimeout(monitorAccessRate, 25);
          }
        }, 1000);
      });
    }, accessRatePerMin);
  }

  /******************************

               Client

   ******************************/
  function setDeviceAccess(args, arrayData){
    let match = false;
    if(args.unwatch){
      return;
    }
    if(!arrayData){
      arrayData = clientAccessData;
    }  
    if(arrayData.length > 0){
        setImmediate(() => {
          for (let i = 0; i < arrayData.length; i++ ) {
            if(arrayData[i]){
              if(arrayData[i].name && arrayData[i].getData === args.getData && arrayData[i].id === args.id && arrayData[i].name === args.name){
                match = true;
                break;  
              }
              else if(arrayData[i].name && arrayData[i].watch === args.watch && arrayData[i].id === args.id && arrayData[i].name === args.name){
                match = true;
                break; 
              }
              else if(arrayData[i].name && arrayData[i].get === args.get && arrayData[i].id === args.id && arrayData[i].name === args.name){
                match = true;
                break; 
              }
              else if(arrayData[i].name && arrayData[i].post === args.post && arrayData[i].id === args.id && arrayData[i].name === args.name){
                match = true;
                break; 
              }
              else if(arrayData[i].pin && arrayData[i].gpioInput && arrayData[i].getState === args.getState && arrayData[i].id === args.id && arrayData[i].pin === args.pin){
                match = true;
                break; 
              }
              else if(arrayData[i].pin && arrayData[i].gpioInput && arrayData[i].watch === args.watch && arrayData[i].id === args.id && arrayData[i].pin === args.pin){
                match = true;
                break; 
              }
              else if(arrayData[i].pin && arrayData[i].gpioOutput && arrayData[i].on === args.on && arrayData[i].id === args.id && arrayData[i].pin === args.pin){
                match = true;
                break; 
              }
              else if(arrayData[i].pin && arrayData[i].gpioOutput && arrayData[i].off === args.off && arrayData[i].id === args.id && arrayData[i].pin === args.pin){
                match = true;
                break; 
              }
            }
          }
      });
    }
    setImmediate(() => {
      if(!match){
        arrayData.push(args);
      }
    });
  }

  function getClientAccessData(){
    let newArray = [], arrayData = clientAccessData;
    let validDeviceId = client.device.getValidDeviceId();
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i]){
          if(validDeviceId.includes(arrayData[i].id)){
            newArray.push(arrayData[i]);
          }
        }
      }
    }
    return newArray;
  }  

  function stopDeviceAccess(){
    if(spl.app){  
      setTimeout(() => {
        deviceAccessFlag = false;
      }, 60000);
    }
  }   

  function getDeviceAccessFlag(){
    return deviceAccessFlag;
  } 

  /******************************

    Log Files Support Functions

   ******************************/
  function initLog(filepath, cb){
    fs.mkdir('m2mConfig/', (e) => {
      if(e){
        //console.log('initLog fs.mkdir error', e);
        return;
      }

      if(filepath){ 
        fs.writeFileSync(filepath, eventLogHeader);
      }
      else{
        fs.writeFileSync(eLogP, eventLogHeader); 
      }

      if(cb){
        cb();
      }
    });
  }
  initLog();
  
  function setDataFile(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6){
    fs.open(filepath, 'r', (e, fd) => {
      if(e) {
        if (e.code === 'ENOENT') {
          //console.error('filepath does not exist');
          fs.writeFileSync(filepath, eventLogHeader); 
        }
      }
      fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
    });

    fs.stat(filepath, (e, stats) => {
      if(e && e.code === 'ENOENT'){
        initLog();
      }
      if(stats && stats.size > file_size){
        fs.writeFileSync(filepath, eventLogHeader); 
        fs.appendFileSync(filepath, '\n' + date + '  ' + msg + '  ' + data1 + '  ' + data2 + '  ' + data3 + '  ' + data4 + '  ' + data5 + '  ' + data6 );
      }
    });
  }

  function commonLogEvent(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6){
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
    setDataFile(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function logEvent(msg, data1, data2, data3, data4, data5, data6){
    let date = new Date();
    //let d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString();
    //let d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString('en-US');
    commonLogEvent(eLogP, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function logData(filepath, msg, data1, data2, data3, data4, data5, data6){
    let date = new Date();
    //let d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString(); 
    //let d = new Date(), date = d.toDateString() + ' ' + d.toLocaleTimeString('en-US');
    commonLogEvent(filepath, file_size, date, msg, data1, data2, data3, data4, data5, data6);
  }

  function trackClientId(appId){
    let data = [];
    try{
      data = fs.readFileSync('m2mConfig/active_link');
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift();
      }
      data.push(appId);
      data = data.filter(function(e){return e});
      data = JSON.stringify(data);
      fs.writeFileSync('m2mConfig/active_link', data);
    }
    catch(e){
      if(e && e.code === 'ENOENT'){
        initLog();
        data = fs.writeFileSync('m2mConfig/active_link', JSON.stringify(data));
      }
    }
    finally{
      return data;
    }
  }

  function trackClientIdAsync(appId, cb){
    fs.readFile('m2mConfig/active_link', (err, data) => {
      if(err && err.code === 'ENOENT'){
        let d = [];
        d.push(appId);
        return fs.writeFileSync('m2mConfig/active_link', JSON.stringify(d));
      }
      data = JSON.parse(data);
      if(data.length > 3){
        data.shift();
      }
      data.push(appId);
      data = JSON.stringify(data);
      fs.writeFileSync('m2mConfig/active_link', data);
      if(cb){
        process.nextTick(cb, data);
      }
    });
  }

  function getClientActiveLinkData(){
    let data = [];
    try{
      data = fs.readFileSync('m2mConfig/active_link');
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

  let resources = {
    setDeviceAccess: setDeviceAccess,
    stopDeviceAccess: stopDeviceAccess,
    collectAccessData: collectAccessData,
    getClientAccessData: getClientAccessData,
    getDeviceAccessFlag: getDeviceAccessFlag,
    stopMonitorAccessRate: stopMonitorAccessRate,
    startMonitorAccessRate: startMonitorAccessRate,
    getDeviceAccessRateData: getDeviceAccessRateData,
    resetDeviceAccessRateData: resetDeviceAccessRateData,
  }

  return {
    logData: logData,
    logEvent: logEvent,
    resources: resources,
    trackClientId: trackClientId,
    eventLogHeader: eventLogHeader,
    getClientActiveLinkData: getClientActiveLinkData,
  }

})(); // dm

/****************************************

        APPLICATION UTILITY OBJECT
    (common utility/support functions)

 ****************************************/
/* istanbul ignore next */
const m2mUtil = exports.m2mUtil = (() => {
  let defaultNode = "https://www.node-m2m.com", npmv = null, monFileTrackingNumber = 0; 
  let m2mF = 'node_modules/m2m/lib/m2m.js', clientF = 'node_modules/m2m/lib/client.js';
  let bpath = 'm2mConfig', scpath = 'm2mConfig/scfg/sconfig', scpath2 = bpath + '/sec/sconfig'; 
  let ctkpath = bpath + '/sec/', ptk = ctkpath + 'ptk', rtk = ctkpath + 'tk', rpk = ctkpath + 'pk', cpid = process.pid;
  let d1 = null, d2 = null, m2mWatcher = null, clientWatcher = null, userCodeWatcher = null,  fileWatcher = null, restartable = false;
  
  if(process.env.npm_lifecycle_event === 'start' || process.env.npm_package_nodemonConfig_restartable){
    restartable = true;
  }
  else{
    restartable = false;
  }

  function setSecTk(){
    fs.writeFileSync(ptk, rtk);
    fs.writeFileSync(rpk, 'node-m2m');
  }

  function initSec(){
    fs.mkdir(ctkpath, (e) => {
      if(e){
        //console.log('initSec fs.mkdir error', e);
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

  function isContainer(){
    let cpL = cpid.toString().length; 
    if(cpL > 1){
      return false;
    }
    else{
      dm.logEvent('process running in container', true);
      return true;
    }
  }

  if(os.platform() === 'linux'){
    npmv = execFileSync('npm', ['-v']);
  }
  else if(os.platform() === 'win32'){
    npmv = execFileSync('npm -v', {shell:true});
  }
  else{
    npmv = execFileSync('npm', ['-v']);
  }  

  const systemInfo = {
    //nodev: 'v' + process.versions.node,
    nodev: process.version,
    npmv: npmv.toString('utf8'), 
    type: os.arch(),
    mem: {total: (os.totalmem()/1000000).toFixed(0) + ' ' + 'MB' , free: (os.freemem()/1000000).toFixed(0) + ' ' + 'MB'},
    m2mv: 'v' + m2mv.version,
    os: os.platform(),
    container: isContainer(),
    //ip: ip.address()
  };

  function st(){
    d1 = new Date();
    return d1;
  }

  function et(){
    d2 = new Date();
    let eT = d2-d1;
    return (eT + ' ms');
  }

  function rid(n){
    return crypto.randomBytes(n).toString('hex');
  }
  
  function getRestartStatus(){
    return restartable; 
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
    let eventName = 'emit-connect';
    device.resetDeviceSetup();
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        if(!cb){
          console.log(data);
        }
        if(cb){
          if(cb.length > 0){
            if(Array.isArray(data)){
              return cb('registration fail');
            }
            //cb(data);
            setImmediate(cb, data);  
          }
          else{
            if(Array.isArray(data)){
              return console.log('registration fail');
            }
            console.log('connection:', data);
            //cb(data);
            setImmediate(cb); 
          }
        }
      });
    }
  }

  function removeDuplicateInArray(arr){
    return Array.from(new Set(arr));
  }

  function getSystemConfig(rxd){
    let cfg = {}; 
    if(rxd && rxd.path){
      scpath = rxd.path;
    }
    try{
      cfg = JSON.parse(Buffer.from(fs.readFileSync(scpath, 'utf8'), 'base64').toString());
    }
    catch(e){
      fs.mkdir('m2mConfig/scfg', { recursive: true }, (err) => {
        if(err) return console.log('getSystemConfig mkdir error', err);
      });
      try{
        cfg = JSON.parse(Buffer.from(fs.readFileSync(scpath2, 'utf8'), 'base64').toString());
      }
      catch(e){
        //console.log('JSON.parse scpath2 error:', e);
      }
    } 
    return cfg;
  }

  function setSystemConfig(cfg){
    let bdata = null;
    try{
      bdata = Buffer.from(JSON.stringify(cfg)).toString('base64'); 
      fs.writeFileSync(scpath, bdata);fs.writeFileSync(scpath2, bdata);
    }
    catch(e){
      //console.log('writeFileSync scpath2 error:', e);
    }
    return bdata;
  }

  function setTestOption(val, s) {
    testOption.enable = val;
    if(s){
      spl = s;
    }
  }

  function startActiveResponse(sc){
    if(sc && sc.activeRes){
      //console.log('Disable endpoint');
      sec.m2mApp.suspend({enable:false});
    }
    if(sc && sc.activeRes1){
      //console.log('\nShutting down due to unauthorized file changes');
      process.kill(process.pid, 'SIGINT');
    }
    if(sc && sc.activeRes2){
      // check file integrity
      // repair/refresh user/system files 
    }
  }

  function sendFile(filename, ft, fn, result){
    let file = null;
    try{
      file = fs.readFileSync(filename); 
    }
    catch(e){
      if(e.code === 'EISDIR'){
        //console.log('filename is a directory');
      }
    }  
    let sc = getSystemConfig();
    if(sc.monCode){
      let pl = Object.assign({}, spl);
      pl._pid = 'fi-change';
      pl.filename = filename;
      if(sc.activeRes||sc.activeRes1||sc.activeRes2){
        sc.enable = false;
        pl.enable = false;
      }
      pl.sconfig = sc;
      if(ft === 'af'){
        pl.af = true;
      }
      if(ft === 'sf'){
        pl.sf = true;
      }
      if(ft === 'wf'){
        pl.wf = true;
      }
      if(fn){
        pl.fn = fn;
      }
      if(file){
        pl.file = file;
      }
      if(result){
        pl.result = result;
      }
      //http.connect(pl);
      websocket.send(pl);
      startActiveResponse(sc);
    }
  }
  
  let monFileStore = [], monFileError = [], monFileResult = [];  
  let opt = {date:'track-date', tn:'track-number'};

  function closeAllWatcher(){
    monFileStore.forEach((watcher, x) => {
      watcher.fileWatcher.close();
    });
  }

  function setWatchFile(data, arrayData){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && arrayData[i].filename && data.filename && arrayData[i].filename === data.filename){
          arrayData[i] = data;
          return;
        }
      }
    }
    arrayData.push(data);
  }

  function removeWatchFile(filename, arrayData){ // removeWatchFile(filename, monFileStore)
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && arrayData[i].filename && filename && arrayData[i].filename === filename){
          try{
            arrayData.splice(i, 1);
          }
          catch(e){
            console.log('remove monFile error', e.message)
          }
          return true;
        }
      }
    }
    return false;
  }

  function checkWatchFile(filename, arrayData){ // checkWatchFile(filename, monFileStore)
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && arrayData[i].filename && filename && arrayData[i].filename === filename){
          //console.log('file already being watch', filename);
          return true;
        }
      }
    }
    return false;
  }

  function stopMonFile(){
    if(fileWatcher){
      fileWatcher.close();
    }
  }

  function closeExtWatchFile(filename, arrayData, cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && arrayData[i].filename && filename && arrayData[i].filename === filename){
          try{
            arrayData[i].fileWatcher.close();
            arrayData.splice(i, 1);
            if(cb){
              cb(true);
            }
          }
          catch(e){
            console.log('close monFile error', e.message)
          }
        }
      }
    }
  }

  function stopMonExtFile(filename, cb){
    try{
      fs.statSync(filename);
      closeExtWatchFile(filename, monFileStore, cb);
    }
    catch(err){
      console.log('stopWatchFile error:', err.code, filename);
      console.log('file or directory does not exists!');
      return;
    } 
  }

  // synchronous close File watching
  function closeExtWatchFileSync(filename, arrayData, cb){
    if(arrayData.length > 0){
      for (let i = 0; i < arrayData.length; i++ ) {
        if(arrayData[i] && arrayData[i].filename && filename && arrayData[i].filename === filename){
          try{
            arrayData[i].fileWatcher.close();
            if(cb){
              cb(true);
            }
          }
          catch(e){
            console.log('close monFile error', e.message)
          }
        }
      }
    }
  }

  // synchronous stop File watching
  function stopMonExtFileSync(filename, cb){
    try{
      fs.statSync(filename);
      closeExtWatchFileSync(filename, monFileStore, cb);
    }
    catch(err){
      console.log('stopWatchFile error:', err.code, filename);
      console.log('file or directory does not exists!');
      return;
    } 
  }

  /******************************************

      Common file watching error handler 
  
   ******************************************/
  function sendFileErrorBeacon(err, filename, monFileError, d1, result, cb){
    let logResult = '*file or directory not found  ' +d1+' '+ err.path;    
    if(monFileError[filename] === 1){
      console.log( err.message, monFileError[filename]);
      monFileError[filename]++;
      result = d1 +' '+ 'no such file or directory' +' '+ err.path;
      sendFile(filename, 'wf', null, result);
      dm.logEvent(logResult);
      dm.logData(ctkpath + 'watchLog.txt', logResult);
    }
    else{
      if(!monFileError[filename]){
        monFileError[filename] = 1;
        result = d1 +' '+ 'no such file or directory' +' '+ err.path;
        dm.logEvent(logResult);
        dm.logData(ctkpath + 'watchLog.txt', logResult);
      }
      monFileError[filename]++;
      if(monFileError[filename] === 30){
        monFileError[filename] = 1;
        result = '';
      }
    }
    if(cb){
      result = d1 +' '+ 'no such file or directory' +' '+ err.path;
      setTimeout( ()=> {
        sendFile(filename, 'wf', null, result);
      }, 10000);
      cb(result);
    }
    return result;  
  }

  /***********************************************************

      Asynchronous standalone device file monitoring method
      (not to be used for client watching/tracking)

   ***********************************************************/
  // e.g. monExtFile({filename:'/tmp/myFile', prepend: 'track-date', recursive:true})
  function monExtFile(o, cb){
    //console.log('monExtFile');
    let watchF = true;
    let result = null;
    let filename = null;
    let recursive = false;
    let fileWatcher = null;
    let fwData = {fileWatcher:'', filename:''};

    let d1 = Date.now(); // prepend result w/ ECMAScript 5 Date object
    let d2 = new Date(); // prepend result w/ javascript std Date object

    if(typeof o === 'string'){
      filename = o;
    }
    else if(typeof o === 'object'){
      filename = o.filename;
      if(o.recursive && (os.platform() === 'win32')){
        recursive = o.recursive;
      }
    }
    else{
      throw 'monFile() - invalid argument';
    }

    try{
      fs.statSync(filename);
    }
    catch(err){
      if(err){
        return sendFileErrorBeacon(err, filename, monFileError, d1, result, cb);
      }
    }

    function resetFileWatch(){
      setTimeout(() => {
        monFileResult[filename] = '';
        if(cb){
          monExtFile(filename, cb);
        }
        else{
          setFileWatcher();
        }
      }, 5000);
    }  
     
    function alertAction(fn){
       closeExtWatchFile(filename, monFileStore, (r) => {
        result = d1 +' '+ filename;
        if(o.prepend && o.prepend === opt.date){
          result = d2 +' '+ filename;
        }
        if(o.prepend && o.prepend === opt.tn){
          result = monFileTrackingNumber +' '+ filename;
        }
        dm.logEvent('*unauthorized file change detected', result);
        dm.logData(ctkpath + 'watchLog.txt', '*file change detected', result);
        sendFile(filename, 'wf', fn, result);
        monFileResult[filename] = result;
        if(cb){
          cb(result);
        }
        //alternate file rewatch method
        resetFileWatch();
      });
    }

    function setFileWatcher(){
      try{
        fileWatcher = fs.watch(filename, {persistent:false, recursive: recursive}, (eventType, fn) => {
          // windows only w/ recursive directory monitoring
          //console.log('monExtFile change detected!!!', eventType);
          if(eventType === 'change' && watchF && os.platform() === 'win32'){
            watchF = false;
            //alertAction(fn);
            setImmediate(alertAction, fn);
          }
          // linux only w/o recursive directory monitoring 
          else if(watchF && (eventType === 'rename' || eventType === 'change')){
            watchF = false;
            //alertAction(fn);
            setImmediate(alertAction, fn);
          }
        });
      }
      catch(e){
        if(e){
          //console.log('fs.watch error', e.message);
        }
      }
      fileWatcher.on('close', () => {
        // alternate re-watch file method
        //resetFileWatch();
      });
      fileWatcher.on('error', (err) => {
        console.log('fileWatcher event error', err.message);
      });
    }

    if(checkWatchFile(filename, monFileStore)){
      //console.log('file ready result', monFileResult[filename])
      return monFileResult[filename];
    }

    monFileTrackingNumber++;
    //console.log('reset file watching ...')
    setFileWatcher();

    fwData = {fileWatcher: fileWatcher, filename: filename};

    if(fileWatcher){
      setWatchFile(fwData, monFileStore);
      //console.log(' end result', monFileResult[filename])
      return monFileResult[filename]; 
    }
  }

  /************************************************

      Synchronous device file monitoring method
      (for client watching/tracking used only)

   ************************************************/
  // e.g. monExtFileSync({filename:'/tmp/myFile', prepend: 'track-date', recursive:true})
  function monExtFileSync(o){
    //console.log('monExtFileSync');
    let watchF = true;
    let result = null;
    let filename = null;
    let recursive = false;
    let fileWatcher = null;
    let fwData = {fileWatcher:'', filename:''};

    let d1 = Date.now(); // prepend result w/ ECMAScript 5 Date object
    let d2 = new Date(); // prepend result w/ javascript std Date object

    if(typeof o === 'string'){
      filename = o;
    }
    else if(typeof o === 'object'){
      filename = o.filename;
      if(o.recursive && (os.platform() === 'win32')){
        recursive = o.recursive;
      }
    }
    else{
      throw 'monFile() - invalid argument';
    }

    try{
      fs.statSync(filename);
    }
    catch(err){
      if(err){
        return sendFileErrorBeacon(err, filename, monFileError, d1, result);
      }
    }

    function resetFileWatchSync(){
      fileWatcher.close();
      setTimeout(() => {
        monFileResult[filename] = '';
        //setFileWatcher();
      }, 5000);
    }    
     
    function alertAction(fn){
      closeExtWatchFile(filename, monFileStore, (r) => {
        result = d1 +' '+ filename;
        if(o.prepend && o.prepend === opt.date){
          result = d2 +' '+ filename;
        }
        if(o.prepend && o.prepend === opt.tn){
          result = monFileTrackingNumber +' '+ filename;
        }
        dm.logEvent('*unauthorized file change detected', result);
        dm.logData(ctkpath + 'watchLog.txt', '*file change detected', result);
        sendFile(filename, 'wf', fn, result);
        monFileResult[filename] = result;
        resetFileWatchSync();
      });
    }

    function setFileWatcher(){
      try{
        fileWatcher = fs.watch(filename, {persistent:false, recursive: recursive}, (eventType, fn) => {
          // windows only w/ recursive directory monitoring
          //console.log('monExtFileSync change detected!!!', eventType);
          if(eventType === 'change' && watchF && os.platform() === 'win32'){
            watchF = false;
            //alertAction(fn);
            setImmediate(alertAction, fn);
          }
          // linux only w/o recursive directory monitoring 
          else if(watchF && (eventType === 'rename' || eventType === 'change')){
            watchF = false;
            //alertAction(fn);
            setImmediate(alertAction, fn);
          }
        });
      }
      catch(e){
        if(e){
          //console.log('fs.watch error', e.message);
        }
      }
      fileWatcher.on('close', () => {
        // alternate re-watch file method
        //resetFileWatchSync();
      });
      fileWatcher.on('error', (err) => {
        console.log('fileWatcher event error', err.message);
      });
    }

    if(checkWatchFile(filename, monFileStore)){
      //console.log('file ready result', monFileResult[filename])
      return monFileResult[filename];
    }

    monFileTrackingNumber++;
    //console.log('reset file watching ...')
    setFileWatcher();

    fwData = {fileWatcher: fileWatcher, filename: filename};

    if(fileWatcher){
      setWatchFile(fwData, monFileStore);
      //console.log(' end result', monFileResult[filename])
      return monFileResult[filename]; 
    }
  }

  /**************************************

      internal file system monitoring

   **************************************/
  function stopMonFS(){
    if(clientWatcher){
      clientWatcher.close();
    }
    if(m2mWatcher){
      m2mWatcher.close();
    }
  }

  function monFS(){
    let watchF = true;
    function sendAlert(filename, fn){
      stopMonFS();
      dm.logEvent('*unauthorized file system access', filename);
      dm.logData(ctkpath + 'watchLog.txt', '*unauthorized file system access', filename);
      sendFile(filename, 'sf', fn);
      setTimeout(() => {
        monFS();
      }, 5000);
    } 
    clientWatcher = fs.watch(clientF, {persistent:false}, (eventType, fn) => {
      //console.log('mon filesystem change detected!!!', eventType);
      if(eventType === 'change'){
        watchF = false;
        setImmediate(sendAlert, clientF, fn);
      }
    });
    m2mWatcher = fs.watch(m2mF, {persistent:false}, (eventType, fn) => {
      if(eventType === 'change'){
        watchF = false;
        setImmediate(sendAlert, m2mF, fn);
      }
    });
  }

  function stopMonUsrApp(){
    if(userCodeWatcher){
      userCodeWatcher.close();
    }
  }

  function monUsrApp(filename){
    //console.log('monitor user app file', filename);
    let watchF = true;

    try{
      fs.readFileSync(filename);
    }
    catch(e){
      console.log('monUsrApp error', e);
      return;
    }
    function sendAlert(filename, fn){
      stopMonUsrApp();
      dm.logEvent('*unauthorized user application code access', filename);
      sendFile(filename, 'af', fn);
      setTimeout(() => {
        monUsrApp(filename);
      }, 5000);
    } 
    userCodeWatcher = fs.watch(filename, {persistent:false}, (eventType, fn) => {
      //console.log('user app change detected!!!', eventType);
      if(eventType === 'change' && watchF){
        watchF = false;
        setImmediate(sendAlert, filename, fn);
      }
    });
  }

  // error event listener
  function errorEvent(eventName, cb){
    if(eventName !== 'error'){
      throw new Error('invalid error listener');
    } 
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (rxd) => {
        if(typeof rxd === 'object'){
          if(rxd.aid === spl.aid){
            if(rxd && rxd.error){
              if(rxd.name){
                return cb(rxd.name + ' ' + rxd.error);
              }
              return cb(rxd.error);
            }
          }
          return cb(rxd);
        }
        if(typeof rxd === 'string'){
          cb(rxd);
        }
      });
    }
  }

  let secTkn = {
    getPtk: getPtk,
    getRtk: getRtk,
    getRpk: getRpk,
    initSec: initSec,
  }

  let monApp = {
    monFS: monFS,
    monExtFile: monExtFile,
    monUsrApp: monUsrApp,
    stopMonFS: stopMonFS,
    stopMonUsrApp: stopMonUsrApp,
    monExtFileSync: monExtFileSync,
    stopMonExtFile: stopMonExtFile,
    closeAllWatcher: closeAllWatcher,
    stopMonExtFileSync: stopMonExtFileSync,
  }

  let systemConfig = {
    systemInfo: systemInfo,
    getSystemConfig: getSystemConfig,
    setSystemConfig: setSystemConfig,
  }

  return {
    st: st,
    et: et,
    rid: rid,
    monApp: monApp,
    secTkn: secTkn,
    errorEvent: errorEvent,
    defaultNode: defaultNode,
    startConnect: startConnect,
    setDataEvent: setDataEvent,
    systemConfig: systemConfig,
    getRestartStatus: getRestartStatus,
    removeDuplicateInArray: removeDuplicateInArray,
  }

})(); // m2mUtil

/********************************************

                CLIENT OBJECT

 ********************************************/
const client = exports.client = (() => {
  const regexName = /^[A-Za-z0-9-_\/]*$/, regexPayload = /^[A-Za-z0-9 \[\]"{}':,._-]*$/;
  let activeTry = 0, clientArgs = {}, userDevices = [], validDeviceId = [], clientAliasDeviceId = [], clientObjectDeviceId = [], clientValidatedDeviceId = [], invalidDeviceId = []; 
  let clientChannelDataListener = null, clientInputEventListener = null, clientOutputEventListener = null, activeSyncGpioData = [], activeSyncChannelData = [];

  // validate remote device/server
  function validateDevice(args, next){
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      next();
    }
    else{
      if(dm.resources.getDeviceAccessFlag()){ 
        if(activeTry < 1){
          //dm.resources.setDeviceAccess(args);
        }
      }
      for (let i = 0; i < invalidDeviceId.length; i++) {
        if(invalidDeviceId[i] === args.id){
          return;
        }
      }
      if(next){
        next();
      }
    }
  }

  function resetSystem(){
    //console.log('reset client system');
    activeTry = 0, clientArgs = {}, userDevices = [], validDeviceId = [], clientAliasDeviceId = [], clientObjectDeviceId = [], clientValidatedDeviceId = [], invalidDeviceId = []; 
    clientChannelDataListener = null, clientInputEventListener = null, clientOutputEventListener = null, activeSyncGpioData = [], activeSyncChannelData = [];
  }

  function getValidDeviceId(){
    return m2mUtil.removeDuplicateInArray(validDeviceId);
  } 

  function getClientDeviceId(){
    return m2mUtil.removeDuplicateInArray(clientValidatedDeviceId);
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
        dm.logEvent('device', data.error);
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
      dm.logEvent('remote', 'device['+ rxd.id +'] is online');
      activeTry++;
    }
  }

  function clientDeviceOffLineProcess(rxd){
    process.nextTick(deviceOffline, rxd, activeSyncChannelData);
    process.nextTick(deviceOffline, rxd, activeSyncGpioData);
    if(Number.isInteger(rxd.id)){
       console.log('device['+ rxd.id +'] is offline');
       dm.logEvent('remote', 'device['+ rxd.id +'] is offline');
    }
    activeTry = 0;
  }

  function removeActiveSyncDataEvent(rxd, arrayData, cb){
    if(arrayData.length > 0){
      setImmediate(() => {
        for (let i = 0; i < arrayData.length; i++ ) {
          try{
            if(arrayData[i]){
              if(arrayData[i].channel && arrayData[i].watch && arrayData[i].id === rxd.id && arrayData[i].name === rxd.name && rxd.unwatch ){
                arrayData.splice(i,1);
                return process.nextTick(cb, null, true);
              }
              if(arrayData[i].gpioInput && arrayData[i].watch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin && rxd.input && rxd.unwatch ){
                arrayData.splice(i,1);
                return process.nextTick(cb, null, true);
              }
              if(arrayData[i].gpioOutput && arrayData[i].watch && arrayData[i].id === rxd.id && arrayData[i].pin === rxd.pin && rxd.output && rxd.unwatch ){
                arrayData.splice(i,1);
                return process.nextTick(cb, null, true);
              }
            }
          }
          catch(e){
            cb(e, null);
          }
        }
      });
    }
  }

  /*******************************************

          Device Access Constructor

  ********************************************/
  function deviceAccess(i, id){
    this.id = id;
    this._index = i;
  }

  /************************************************

      Device Access GPIO Input Support Functions

  *************************************************/
  function setGpioInputListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    //let eventName = pl.id + pl.pin + pl.eventId; // generates unique eventName everytime
    clientInputEventListener = function (data){
      if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
        setImmediate(() => {
          if(data.error){
            try{   
              emitter.emit('error', data);
            }
            catch(e){
              if(cb){
                cb(data.error);
              }
            }
            return;
          }
          else if(data.unwatch){
            if(cb){  
              cb(data.result);
            }
            removeActiveSyncDataEvent(data, activeSyncGpioData, (err, status) => {
              if(err){
                if(cb){ 
                  return cb(err, null);
                }
              }
              // remove watch listener, not unwatch listener
              emitter.removeListener(eventName,  clientInputEventListener);
            });
          }
          else{
            // true/false
            if(cb){
              cb(data.state);
            }
          }
        });
      }
    };

    if(pl.event && pl.watch){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncGpioData);
      if(duplicate){
        emitter.removeListener(eventName,  clientInputEventListener);
        //emitter.removeAllListeners(eventName);
      }
      if(emitter.listenerCount(eventName) < 1){ 
        emitter.on(eventName, clientInputEventListener);
      }
    }
    else{
      if(emitter.listenerCount(eventName) < 5){ 
        emitter.once(eventName, clientInputEventListener);
      }
    }

    // internal input test
    if(m2mTest.option.enabled){
      if(pl.pin === 11 || pl.pin === 13){
        if(pl.unwatch){
          pl.result = true;
        }
        else{
          pl.state = true;
        }
      }
      else if(pl.pin === 16){
        if(pl.unwatch){
          pl.result = false;
        }
        else{
          pl.error = 'invalid input data';
        }
      }
      emitter.emit(eventName, pl);
    }
  }

  /*******************************************************

      Set/send Client Gpio Input Data to Device Server

  ********************************************************/
  function setGpioInputPayload(id, pin, method, interval, cb){
    websocket.initCheck();
    try {
      if(arguments.length !== 5){
        throw new Error('invalid no. of arguments');
      }
      
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }

      let args = Object.assign({}, spl);

      args.input = true;
      args.gpioInput = true;
      args.dst = 'device';
      args.eventId = m2mUtil.rid(8);

      if(args.device){
        if(!args.srcId){
          args.srcId = args.id;
        }
        args.src = 'device-as-client';
      }
      else{
        if(!args.srcId){
          args.srcId = args.id;
        }
      }

      if(typeof id === 'object'){
        let  o = id;
        if(pin && typeof pin === 'object'){
          o = pin;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
          args.dstId = o.id;
        }
        if(o.pin){
          args.pin = o.pin;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(pin){
          args.pin = pin;
        }
      }

      if(!Number.isInteger(args.id)){
        throw new Error('invalid id');
      }

      if(!Number.isInteger(args.pin)){
        throw new Error('invalid pin');
      }

      if(args.id === args.dstId && args.srcId === args.dstId){
        //console.log('*invalid payload', args);
        return;
      }

      if(method === 'getState'){
        args._pid = 'gpio-input-state';
        args.getState = true;
        if(!cb){
          throw new Error('callback argument is required');
        }
      }
      else if(method === 'unwatch'){
        args._pid = 'gpio-input';
        args.unwatch = true;
      }
      else if(method === 'watch'){
        args._pid = 'gpio-input';
        args.watch = true;
        args.interval = 5000;
      }
      else{
        throw new Error('invalid argugment');
      }

      if(args._pid !== 'gpio-input-state'){
        args._pid = 'gpio-input';
      }

      if(args.watch){
        args.watch = true;
        args.event = true;
        args.interval = 5000;
      }
      else{
        args.watch = false;
        args.event = false;
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(interval && Number.isInteger(interval)){
        args.interval = interval;
      }
      if(interval && !Number.isInteger(interval)){
        throw new Error('invalid poll interval');
      }

      if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }
    
      setGpioInputListener(args, cb);

      validateDevice(args, () => websocket.send(args));

      return args;
    }
    catch(e){
      console.error('input.'+method, e);
      throw e;
    }
  }

  /****************************************

      Device Access Gpio Input Methods
      (Using an alias from client)

  *****************************************/
  // input state property
  const inputState = function(cb){
    setGpioInputPayload(this.id, this.pin, 'getState', null, cb);
  };

  const unwatchState = function(cb){
    setGpioInputPayload(this.id, this.pin, 'unwatch', null, cb);
  };

  const watchState = function(interval, cb){
    if(typeof interval === 'function'){
      cb = interval;
      interval = null;
    }
    setGpioInputPayload(this.id, this.pin, 'watch', interval, cb);
  };

  const invalidInputMethod = function(){
    try{
      throw new Error('invalid input method');
    }
    catch(e){
      console.error('input', e);
      throw e;
    }
  };

  function Input(id, pin) {
    this.id = id;
    this.pin = pin;
  }

  Input.prototype = {
    constructor: Input,

    // GPIO invalid input method properties
    on: invalidInputMethod,
    off: invalidInputMethod,

    // GPIO input non-event properties
    state: inputState,
    getState: inputState,
    
    unwatch: unwatchState,
    unwatchState: unwatchState,

    // GPIO input event-based property
    watch: watchState,
    watchState: watchState,
  };

  /**************************************************

      Device Access Gpio Output Support Functions

  ***************************************************/
  function setGpioOutputListener(pl, cb){
    let eventName = pl.id +  pl._pid + pl.pin + pl.event + pl.watch;
    //let eventName = pl.id + pl.pin + pl.eventId; // generates unique eventName everytime
    clientOutputEventListener = function (data){
      if(data.id === pl.id && data.pin === pl.pin && data._pid === pl._pid){
        setImmediate(() => {
          if(data.error){
            try{   
              emitter.emit('error', data);
            }
            catch(e){
              if(cb){
                cb(data.error);
              }
            }
            return;
          }
          else if(data.unwatch){
            if(cb){
              cb(data.result);
            }
            removeActiveSyncDataEvent(data, activeSyncGpioData, (err, status) => {
              if(err){
                if(cb){ 
                  return cb(err, null);
                }
              }
              // remove watch listener, not unwatch listener
              emitter.removeListener(eventName,  clientOutputEventListener);
            });
          }
          else{
            // true/false
            if(cb){
              cb(data.state);
            }
          }
        });
      }
    };

    if(pl.event && pl.watch){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncGpioData);
      if(duplicate){
        emitter.removeListener(eventName,  clientOutputEventListener);
        //emitter.removeAllListeners(eventName);
      }
      if(emitter.listenerCount(eventName) < 1){
        emitter.on(eventName, clientOutputEventListener);
      }
    }
    else{
      if(emitter.listenerCount(eventName) < 5){
        emitter.once(eventName, clientOutputEventListener);
      }
    }

    // internal output test
    if(m2mTest.option.enabled){
      if(pl.pin === 33 || pl.pin === 35){
        pl.state = true;
      }
      else if(pl.pin === 16){
        pl.error = 'invalid output data';
      }
      emitter.emit(eventName, pl);
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

  /*******************************************************

      Set/send Client Gpio Output Data to Device Server

  ********************************************************/
  function setGpioOutputPayload(id, pin, method, t, cb){
    websocket.initCheck();
    try{
      if(arguments.length !== 5){
        throw new Error('invalid no. of arguments');
      }
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }

      let args = Object.assign({}, spl);

      args.gpioOutput = true;
      args.state = null;
      args.event = false;
      args.watch = false;
      args.dst = 'device';
      args.eventId = m2mUtil.rid(8);

      if(args.device){
        if(!args.srcId){
          args.srcId = args.id;
        }
        args.src = 'device-as-client';
      }
      else{
        if(!args.srcId){
          args.srcId = args.id;
        }
      }

      if(typeof id === 'object'){
        let o = id;
        if(pin && typeof pin === 'object'){
          o = pin;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
          args.dstId = o.id;
        }
        if(o.pin){
          args.pin = o.pin;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(pin){
          args.pin = pin;
        }
      }

      if(!Number.isInteger(args.id)){
        throw new Error('invalid id');
      }
      if(!Number.isInteger(args.pin)){
        throw new Error('invalid pin');
      }

      if(args.id === args.dstId && args.srcId === args.dstId){
        //console.log('*invalid payload', args);
        return;
      }

      if(method === 'state'){
        args._pid = 'gpio-output-state';
        args.output = 'state';
        if(!cb){
          throw new Error('callback argument is required');
        }
      }
      else if(method === 'on'){
        args._pid = 'gpio-output-on';
        args.output = 'on';
        args.on = true;
      }
      else if(method === 'off'){
        args._pid = 'gpio-output-off';
        args.output = 'off';
        args.off = true;
      }
      else{
        throw new Error('invalid method argument');
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(t && typeof t === 'number'){
        args.t = t;
      }
      if(t && typeof t === 'function'){
        cb = t;
      }
      if(t && !Number.isInteger(t) && typeof t !== 'function' ){
        throw new Error('invalid time delay');
      }

      if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }

      setGpioOutputListener(args, cb);

      validateDevice(args, () => GpioControl(t, args));

      return args;
    }
    catch(e){
      console.error('output.'+method, e);
      throw e;
    }
  }

  /*****************************************

      Device Access Gpio Output Methods
      (Using an alias from client)

  ******************************************/
  const invalidOutputMethod = function(){
    try{
      throw new Error('invalid output method');
    }
    catch(e){
      console.error('output', e);
      throw e;
    }
  };

  // output state property
  const outputState = function(cb){
    setGpioOutputPayload(this.id, this.pin, 'state', null, cb);
  };

  function Output(id, pin){
    this.id = id;
    this.pin = pin;
  }

  Output.prototype = {
    constructor: Output,

    // GPIO invalid output method properties
    watch: invalidOutputMethod,
    unwatch: invalidOutputMethod,

    // GPIO Output get output pin state or status
    state: outputState,
    getState: outputState,

    // GPIO output ON pin control
    on: function(t, cb){
      setGpioOutputPayload(this.id, this.pin, 'on', t, cb);
    },

    // GPIO Output OFF pin control
    off: function(t, cb){
      setGpioOutputPayload(this.id, this.pin, 'off', t, cb);
    },
  };

  /***************************************************

      Device Access Channel Data Support Functions

  ****************************************************/
  function setChannelEventListener(pl, cb){
    let listenerId = null, eventName = null; 

    if(pl.device){
      listenerId = pl.srcId;
      eventName = pl.dstId + pl.name + pl.event + pl.watch + pl.unwatch + pl.method;
    }
    else{
      listenerId = pl.id;
      eventName = listenerId + pl.name + pl.event + pl.watch + pl.unwatch + pl.method;
      // generates a unique eventName everytime
      //eventName = listenerId + pl.name + pl.eventId;
    }
   
    clientChannelDataListener = function (data) {
      //if(data.id === pl.id && data.name === pl.name){
      if(data.id === listenerId && data.name === pl.name){ // 4/20/22
        setImmediate(() => {
          if(data.error){
            try{   
              emitter.emit('error', data);
            }
            catch(e){
              if(cb){
                cb(data.error);
              }
            }
            return;
          }
          else if(data.unwatch){
            if(cb){
              cb(data.result);
            }
            removeActiveSyncDataEvent(data, activeSyncChannelData, (err, status) => {
              if(err){
                if(cb){
                  return cb(err, null);
                }
              }
              // remove watch listener, not unwatch listener
              emitter.removeListener(eventName,  clientChannelDataListener);
            });
          }
          else if(data.value){
            if(cb){ 
              cb(data.value);
            }
          }
          else if(data.result){
            if(cb){            
              cb(data.result);
            }
          }
        });
      }
    };

    if(pl.event && pl.watch){
      let duplicate = m2mUtil.setDataEvent(pl, activeSyncChannelData);
      if(duplicate){
        emitter.removeListener(eventName, clientChannelDataListener);
        //emitter.removeAllListeners(eventName);
      }
    }

    // eventName = pl.id + pl.name + pl.event + pl.watch + pl.unwatch + pl.method;
    if(pl.event && pl.watch){
      // only 1 listener allowed using the eventName above
      if(emitter.listenerCount(eventName) < 1){
        emitter.on(eventName, clientChannelDataListener);
      }
    }
    else{
      // refresh http response everytime for web app integration
      if(emitter.listenerCount(eventName) < 5){
        emitter.once(eventName, clientChannelDataListener); 
      }
    }
    
    // using eventName = pl.id + pl.name + pl.eventId; 
    /*if(pl.event && pl.watch){
      // can use more the 1 listener for the eventName above 
      // emits a warning if more the 5 listeners are set
      emitter.on(eventName, clientChannelDataListener);
    }
    else{
      // refresh http response everytime for web app integration
      emitter.once(eventName, clientChannelDataListener); 
    }*/

    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(pl.name === 'test-passed'){
        pl.value = pl.name;
        emitter.emit(eventName, pl);
      }
      if(pl.name === 'test-failed'){
        pl.error = pl.name;
        emitter.emit(eventName, pl);
      }
    }
  }

  /*******************************************************

      Set/send Client Channel/API Data to Device Server

  ********************************************************/
  // setClientDataPayload helper
  function validateNamePayload(args, cb){
    let p = true, data = null;
    if(args.name){
      if(typeof args.name !== 'string'){
        p = false;
      }
      if(args.name.length > 65){
        p = false;
      }
      if(!args.name.match(regexName)){
        //update w/ query strings on http path
        //p = false;
      }
      if(!p){
        if(cb){
          try{
            emitter.emit('error', 'invalid channel/path');
          }
          catch(e){
            cb('invalid channel/path');
          }
          return; 
        }
        throw new Error('invalid channel/path');
      }
    }

    if(args){
      if(args.payload || args.body){
        if(args.payload){
          data = args.payload;
          if(typeof data === 'number' || typeof data === 'object' || typeof data === 'string'){
            //continue
          }
          else{
            p = false;
          }
        }
        else if(args.body){
          data = args.body;
          if(typeof data !== 'string' && typeof data !== 'object'){
            p = false;
          }
        }
      }
      else if(!args._pid){
        data = args;
      }

      if(data){
        data = JSON.stringify(data);

        if(data && data.length > 200){
          //p = false;
        }
        if(data && !data.match(regexPayload)){
          //p = false;
        }
        if(!p){
          if(args.payload){
            args.payload = null;
            dm.logEvent('sendData - invalid payload data', data);
          }
          if(args.body){
            args.body = null;
            dm.logEvent('post - invalid body data', data);
          }
          if(cb){
            try{
              emitter.emit('error', 'invalid payload/body');
            }
            catch(e){
              cb('invalid payload/body');
            }
            return;
          }
          throw new Error('invalid payload/body');
        }
      }
    }
    return p;
  }

  function getUrlKeys(data, url){
    let queryString = null, ep = null;
    const urlRoutesIndex = [], urlKeys = [], queryObject = {};

    let start = url.startsWith("/");
    if(!start){
      let error = 'invalid url, it must begin with a slash /';
      console.log(error);
      throw error;
    }
    /********************
    
      get query strings

    *********************/
    let queryPartIndex = url.indexOf("?", 1);
    if(queryPartIndex !== -1){
      queryString = url.substring(queryPartIndex+1, url.length);
    }

    let querySearchParams = new URLSearchParams(queryString);

    querySearchParams.forEach(function(value, key) {
      //console.log(value, key);
      queryObject[key] = value;
    });

    /*************************************
    
      get url keys starting with a slash

    **************************************/
    let qi = url.indexOf("?");
    if(qi !== -1){
      url = url.slice(0, qi);
    }

    for (let index = 0; index < url.length; index++) {
      if (url[index] === '/') {
        urlRoutesIndex.push(index);
      }
    }

    urlRoutesIndex.forEach((value, i) => {
      // get base url
      if(value == 0 && urlRoutesIndex[i+1]){
        //let key = url.slice(urlRoutesIndex[i]+1, urlRoutesIndex[i+1]); // no slash
        let key = url.slice(urlRoutesIndex[i], urlRoutesIndex[i+1]); // w/ slash
        urlKeys.push(key);
      }
      // other url routes
      else if(value !== 0 && urlRoutesIndex[i] && urlRoutesIndex[i+1]){
        //let key = url.slice(urlRoutesIndex[i]+1, urlRoutesIndex[i+1]); // no slash
        let key = url.slice(urlRoutesIndex[i], urlRoutesIndex[i+1]); // w/ slash
        urlKeys.push(key); 
      }
      else{
        //let key = url.slice(urlRoutesIndex[i]+1, url.length); // no slash
        let key = url.slice(urlRoutesIndex[i], url.length); // w/ slash
        urlKeys.push(key);
      }
    });

    /*********************
    
      get url components

    **********************/
    let cp = urlKeys[0].length;
    ep = url.indexOf("?");
    if(ep === -1){
      ep = url.length;
    }
    let pathUrl = url.slice(cp, ep);

    data.urlPathKeys = urlKeys;
    data.baseUrl = urlKeys[0];
    data.pathUrl = pathUrl;
    data.queryString = queryString;
    data.query = queryObject;
    return data;
  }

  function setClientDataPayload(id, name, pl, method, interval, cb){
    websocket.initCheck();
    try{
      if(arguments.length !== 6){
        throw new Error('invalid no. of arguments');
      }
      if(!Number.isInteger(id) && typeof id !== 'object'){
        throw new Error('invalid id');
      }
      // when id is an object, name becomes a function
      if(name && typeof name !== 'string' && typeof name !== 'function'){
        throw new Error('invalid channel/path');
      }
      if(typeof method !== 'string'){
        throw new Error('invalid method');
      }
      if(interval && !Number.isInteger(interval)){
        throw new Error('invalid interval');
      }

      let args = Object.assign({}, spl);
      
      args.dst = 'device';
      args.eventId = m2mUtil.rid(8);

      if(args.device){
        if(!args.srcId){
          args.srcId = args.id;
        }
        args.src = 'device-as-client';
      }
      else{
        if(!args.srcId){
          args.srcId = args.id;
        }
      }

      if(typeof id === 'object' || typeof name === 'object'){
        let o = id;
        if(name && typeof name === 'object'){
          o = name;
          o.id = id;
        }
        if(o.id){
          args.id = o.id;
          args.dstId = o.id;
        }
        if(o.channel){
          args.name = o.channel;
          args.channel = o.channel;
        }
        if(o.path){
          args.name = o.path;
          args.path = o.path;
          args.originalUrl = o.path;
          getUrlKeys(args, o.path);
        }
        if(o.payload){
          args.payload = o.payload;
          pl = o.payload;
        }
        if(o.body){
          args.body = o.body;
          pl = o.body;
        }
        if(o.interval){
          args.interval = o.interval;
        }
        if(o.poll){
          args.interval = o.poll;
        }
      }
      else{
        if(id){
          args.id = id;
        }
        if(name){
          args.name = name;
        }
      }

      if(args.id === args.dstId && args.srcId === args.dstId){
        if(cb){
          cb({error:'invalid id that may cause a race condition', id:args.dstId, channel:args.name, method:method});
        }
        else{
          console.log({error:'invalid id that may cause a race condition', id:args.dstId, channel:args.name, method:method});
        }
        //throw new Error('invalid id that may cause a race condition');
        throw 'invalid id that may cause a race condition';
      }

      // channel api
      if(method === 'getData'){
        args._pid = 'channel-data';
        args.channel = args.name;
        args.getData = true;
        args.method = 'getData';
      }
      else if(method === 'sendData'){
        args._pid = 'channel-data';
        args.channel = args.name;
        args.sendData = true;
        args.method = 'sendData';
        if(pl){
          args.payload = pl;
        }
        if(!args.payload){
          throw new Error('invalid/missing payload');
        }
      }
      else if(method === 'watch'){
        args._pid = 'channel-data';
        args.channel = args.name;
        args.watch = true;
        args.method = 'watch';
        args.interval = 5000;
      }
      else if(method === 'unwatch'){
        args._pid = 'channel-data';
        args.channel = args.name;
        args.unwatch = true;
        args.method = 'unwatch';
      }
      // http api
      else if(method === 'get'){
        args._pid = 'http-data';
        args.http = true;
        args.api = args.name;
        args.get = true;
        args.method = 'get';
      }
      else if(method === 'post'){
        args._pid = 'http-data';
        args.http = true;
        args.api = args.name;
        args.post = true;
        args.method = 'post';
        if(pl){
          args.body = pl;
        }
        if(!args.body){
          throw new Error('invalid/missing body');
        }
      }
      else{
        throw new Error('invalid argument');
      }

      validateNamePayload(args, cb);

      if(interval && Number.isInteger(interval)){
        args.interval = interval;
      }

      if(!args._pid){
        throw new Error('invalid _pid');
      }

      if(args.watch){
        args.watch = true;
        args.event = true;
      }
      else{
        args.watch = false;
        args.event = false;
      }

      //args.method = method;
      //args[method] = true;

      if(cb && typeof cb !== 'function'){
        throw new Error('invalid callback argument');
      }

      setChannelEventListener(args, cb);

      validateDevice(args, () => websocket.send(args));
      
      return args;

    }
    catch(e){
      console.error(method, e);
      throw e;
    }
  }

  /*****************************************

      Device Access Channel Method

  ******************************************/
  function Channel(id, channel){
    this.id = id;
    this.channel = channel;
  }

  Channel.prototype = {
    constructor: Channel,

    getData: function (cb){
      setClientDataPayload(this.id, this.channel, null, 'getData', null, cb); 
    },

    sendData: function (payload, cb){
      setClientDataPayload(this.id, this.channel, payload, 'sendData', null, cb);
    },

    watch: function (cb){
      setClientDataPayload(this.id, this.channel, null, 'watch', interval, cb);
    },

    unwatch: function (cb){
      setClientDataPayload(this.id, this.channel, null, 'unwatch', null, cb);
    },
  };

  /*****************************************

      Device Access Http Method

  ******************************************/
  function Http(id, path){
    this.id = id;
    this.path = path;
  }

  Http.prototype = {
    constructor: Http,

    get: function (cb){
      setClientDataPayload(this.id, this.path, null, 'get', null, cb);
    },

    post: function (body, cb){
      setClientDataPayload(this.id, this.path, body, 'post', null, cb);
    },
  };


  /******************************************

          Device Accesss Properties

  *******************************************/
  // setupInfo property
  function setupInfo(id, cb){
    websocket.initCheck();
    let pl = Object.assign({}, spl);
    if(typeof id === 'function' && !cb){
      cb = id;
      pl.id = this.id;
    }
    else if(typeof id === 'number' && typeof cb === 'function'){
      pl.id = id;
    }
    if(!cb){
      throw new Error('callback is required');
    }
    pl.dst = 'device';
    pl.deviceSetup = true;
    pl._pid = 'deviceSetup';

    let eventName = pl.id + pl._pid;

    if(typeof cb === 'function'){
      if(emitter.listenerCount(eventName) < 1){
        emitter.once(eventName, (data) => {
          if(data.id === pl.id && data.deviceSetup){
            if(cb){
              setImmediate(() => {
                if(data.error){
                  try{   
                    emitter.emit('error', data);
                  }
                  catch(e){
                    cb(data.error);
                  }
                  return;
                }
                cb(data.deviceSetup);
              });
            }
          }
        });
      }
    }

    validateDevice(pl, () => websocket.send(pl));

    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(spl.testParam === 'valid')
        emitter.emit(eventName, {_pid:pl._pid, id:pl.id, deviceSetup:[100, 200]});
      else{
        emitter.emit(eventName, {_pid:pl._pid, id:pl.id, deviceSetup:['100', '200'], error:spl.testParam});
      }
    }
  }
  
  /******************************************

          Device Accesss Constructor
          (Using an alias from client)

  *******************************************/

  // gpio output property
  const GpioOutput = function(pin){
    return new Output(this.id, pin);
  };

  // gpio input property
  const GpioInput = function(pin){
    return new Input(this.id, pin);
  };

  // get channel data
  const ChannelGetData = function(channel, cb){
    setClientDataPayload(this.id, channel, null, 'getData', null, cb);
  };

  // send channel data
  const ChannelSendData = function(channel, payload, cb){
    setClientDataPayload(this.id, channel, payload, 'sendData', null, cb);
  };

  // http get property
  const HttpGet = function(path, cb){
    setClientDataPayload(this.id, path, null, 'get', null, cb);
  };

  // http post property
  const HttpPost = function(path, body, cb){
    setClientDataPayload(this.id, path, body, 'post', null, cb);
  };

  // watch channel data
  const ChannelWatchData = function(channel, interval, cb){
    if(typeof channel === 'object'){
      setClientDataPayload(channel, channel.channel, null, 'watch', null, interval);
    }
    else if(typeof interval === 'function'){
      cb = interval;
      setClientDataPayload(this.id, channel, null, 'watch', null, cb);
    }
    else {
      setClientDataPayload(this.id, channel, null, 'watch', interval, cb);
    }
  };

  // unwatch channel data
  const ChannelUnwatchData = function(channel, cb){
    setClientDataPayload(this.id, channel, null, 'unwatch', null, cb);
  };

  deviceAccess.prototype = {
    constructor: deviceAccess,

    // get system information and available resources from a particular remote device
    // setupInfo: setupInfo,
    resourcesInfo: setupInfo,
    // common input/output gpio property
    // e.g. device.gpio
    gpio: function(args){
      try{
        if(typeof args !== 'object'){
          throw new Error('invalid argument');
        }
        if(!args.pin){
          throw new Error('invalid/missing pin');
        }
        if(args.pin && !Number.isInteger(args.pin)){
          throw new Error('invalid pin');
        }
        if(!args.mode){
          throw new Error('invalid/missing mode (input or output?)');
        }
        if(args.mode && typeof args.mode !== 'string'){
          throw new Error('invalid mode');
        }

        if(args.mode === 'input' || args.mode === 'in'){
          return new Input(this.id, args.pin);
        }
        else if(args.mode === 'output' || args.mode === 'out'){
          return new Output(this.id, args.pin);
        }
        else{
          throw new Error('invalid mode');
        }
      }
      catch(e){
        console.error('gpio', e);
        throw e;
      }
    },

    // gpio output property
    // e.g. device.output or device.out
    out: GpioOutput,
    output: GpioOutput,

    // gpio input property
    // e.g device.input or device.in
    in: GpioInput,
    input: GpioInput,

    // e.g. device.getData
    getData: ChannelGetData,
    getChannelData: ChannelGetData,

    // e.g. device.sendData
    sendData: ChannelSendData,
    sendChannelData: ChannelSendData,

    // http api e.g. device.get
    get: HttpGet,
    getRequest: HttpGet,

    // http api e.g. device.post
    post: HttpPost,
    postRequest: HttpPost,

    // e.g. device.unwatch
    unwatch: ChannelUnwatchData,
    unwatchData: ChannelUnwatchData,
    unwatchChannelData: ChannelUnwatchData,

    // event-based properties
    // e.g. device.watch
    watch: ChannelWatchData,
    watchData: ChannelWatchData,
    watchChannelData: ChannelWatchData,

    // e.g. device.cli
    cli: function(payload, cb){
      const channel = 'sec-cli';
      setClientDataPayload(this.id, channel, payload, 'sendData', null, cb);
    },

  };

  /*********************************************************

      Accesss Remote Devices/Resources Support Function

  **********************************************************/
  function validateAccessDevices(rxd){
    setTimeout(() => {
      if(rxd && rxd.devices && rxd.devices.length > 0){
        validDeviceId = rxd.devices;
      }
      if(clientAliasDeviceId.length > 0 && validDeviceId.length > 0){
        clientAliasDeviceId.forEach((id) => {
          if(!validDeviceId.includes(id)){
            invalidDeviceId.push(id);
            try{
              emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
            }
            catch(e){
              console.log('invalid device id',id,'error - device is not registered!');
            }
          }
          else{
            clientValidatedDeviceId.push(id);
          }
        });
        clientAliasDeviceId = [];
      }
      validateUserDevices();
    }, 200);
  }

  function validateUserDevices(){
    if(clientObjectDeviceId.length > 0 && validDeviceId.length > 0){
      clientObjectDeviceId.forEach((id) => {
        if(!validDeviceId.includes(id)){
          invalidDeviceId.push(id);
          try{
            emitter.emit('error', 'invalid device id ' + id + ', device is not registered');
          }
          catch(e){
            console.log('invalid device id',id,'error - device is not registered!');
          }
        }
        else{
          clientValidatedDeviceId.push(id);
        }
      });
      clientObjectDeviceId = [];
    }
  }

  function setGetDeviceIdListener(){
    let eventName = 'getDeviceId';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        setImmediate(() => {
          if(Array.isArray(data) && data.length > 0){
            clientAliasDeviceId = data;
          }
          else if(Number.isInteger(data)){
            clientAliasDeviceId.push(data);
          }
        });
      });
    }
  }
  setGetDeviceIdListener();

  function getDevices(cb){
    websocket.initCheck();
    if(userDevices && userDevices.length > 0){
      return cb(userDevices);
    }
    let pl = Object.assign({}, spl);
    pl._pid = 'getDevices';
    pl.getDevices = true;

    let eventName = pl.id + pl._pid;
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(data.id === pl.id && data._pid === pl._pid){
          userDevices =  data.devices;
          if(cb){
            setImmediate(() => {
              if(data.error){
                try{   
                  emitter.emit('error', data);
                }
                catch(e){
                  cb(data.error);
                }
                return;
              }
              cb(data.devices);
            });
          }
        }
      });
    }

    websocket.send(pl);

    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      emitter.emit(eventName, {_pid:'getDevices', id:pl.id, devices:[100, 200]});
    }
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
        setImmediate(cb, clientServer);
      }
      else {
        setImmediate(cb, clientServer[0]);
      }
    }
  }

  let access = accessDevice;

  function validateApiDeviceId(arg, cb){
    let id = null;
    if(typeof arg === 'object' && Number.isInteger(arg.id)){
      id = arg.id;
    }
    else if(Number.isInteger(arg)){
      id = arg;
    }
    clientObjectDeviceId.push(id);
    setImmediate(validateUserDevices); 
  }

  /**********************************************************

      Access device resources directly from client object
      (device id must be provided everytime)

   **********************************************************/  
  // gpio input/output
  // e.g. client.gpio({id:100, mode:'out', pin:33}).on()/off()
  function gpio(args){
    validateApiDeviceId(args.id);
    if(args.mode === 'input' || args.mode === 'in'){
      return new Input(args.id, args.pin);
    }
    else if(args.mode === 'output' || args.mode === 'out'){
      return new Output(args.id, args.pin);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  // gpio input
  // e.g client.input(200, 13).watch(cb) or client.input({id:200, pin:33}).watch(cb)
  function input(id, pin){
    validateApiDeviceId(id);
    return new Input(id, pin);
  }

  // gpio output
  // e.g client.output(200, 33).on(cb) or client.output({id:200, pin:33}).on(cb)
  function output(id, pin){
    validateApiDeviceId(id);
    return new Output(id, pin);
  }

  // non-event property getData
  // e.g. client.getData(100, 'test-channel', cb) or client.getData({id:100, channel:'test-channel'}, cb)
  function getData(id, channel, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, channel, null, 'getData', null, cb);
  }

  // non-event property sendData w/ payload
  // e.g. client.sendData(100, 'test-channel', 25, cb) or client.sendData({id:100, channel:'test-channel', payload:25}, cb)
  function sendData(id, channel, payload, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, channel, payload, 'sendData', null, cb);
  }

  // event based property
  // e.g. client.unwatch(300, 'test-channel', cb) or client.unwatch({id:300, channel:'test-channel'}, cb)
  function unwatch(id, channel, cb){
    if(typeof id === 'object'){
      cb = channel;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, channel, null, 'unwatch', null, cb);
  }

  // event-based property for data watching/monitoring
  // e.g. client.watch(300, 'test-channel', cb) or client.watch({id:300, channel:'test-channel', interval:10000}, cb)
  function watch(id, channel, interval, cb){
    if(typeof id === 'object'){
      cb = channel;
      channel = id.channel; // 4/15/22
      if(id.interval){
        interval = id.interval;
      }
      if(id.poll){
        interval = id.poll;
      }
    }
    else if(typeof interval === 'function'){
      cb = interval;
      interval = null;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, channel, null, 'watch', interval, cb);
  }

  // Using Channel prototype
  // e.g. client.channel(100, 'test-channel').getData(cb) or client.channel(100, 'test-channel').sendData(payload, cb)
  function channel(id, channel){
    validateApiDeviceId(id);
    return new Channel(id, channel);
  } 

  // http-like api
  // e.g. client.get(100, 'test-channel', cb) or client.get({id:100, path:'test-channel'}, cb)
  function getApi(id, path, cb){
    if(typeof id === 'object'){
      cb = path;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, path, null, 'get', null, cb);
  }

  // http-like api
  // e.g. client.post(100, 'test-channel', 25, cb) or client.post({id:100, path:'test-channel', body:25}, cb)
  function postApi(id, path, body, cb){
    if(typeof id === 'object'){
      cb = path;
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, path, body, 'post', null, cb);
  }

  // Using Http-like path prototype
  // e.g. client.path(100, 'test-channel').get(cb) or client.path(100, 'test-channel').post(body, cb) 
  function path(id, path){
    validateApiDeviceId(id);
    return new Http(id, path);
  } 

  function cli(id, payload, cb){
    const channel = 'sec-cli';
    if(typeof id === 'object'){
      id.channel = channel;
      cb = payload;
      if(id.cmd){
        id.payload = id.cmd;
      }
      if(id.command){
        id.payload = id.command;
      }
    }
    validateApiDeviceId(id);
    setClientDataPayload(id, channel, payload, 'sendData', null, cb);
  }    

  // get remote device resources info
  function resourcesInfo(id, cb){
    validateApiDeviceId(id);
    setImmediate(() => {
      setupInfo(id, cb);
    });
  }

  let device = {
    getDevices: getDevices,
    accessDevice: accessDevice,
    resourcesInfo: resourcesInfo,
    getValidDeviceId: getValidDeviceId,
    getClientDeviceId: getClientDeviceId,
    validateAccessDevices: validateAccessDevices,
    clientDeviceOffLineProcess: clientDeviceOffLineProcess,
    clientDeviceActiveStartProcess: clientDeviceActiveStartProcess,  
  }

  let clientChannelApi = {
    path: path,
    watch: watch,
    unwatch: unwatch,
    channel: channel,
    getData: getData,
    sendData: sendData,
  }

  let clientHttpApi = {
    getApi: getApi,
    postApi: postApi,
  }

  let gpioApi = {
    gpio: gpio,
    input: input,
    output: output,
  }

  return {
    cli:cli,
    access: access,
    device: device,
    gpioApi: gpioApi,
    resetSystem: resetSystem,
    deviceAccess: deviceAccess,
    clientHttpApi: clientHttpApi,
    clientChannelApi: clientChannelApi,
    validateNamePayload: validateNamePayload,
  }

})(); // client


/********************************************

                DEVICE OBJECT

 ********************************************/
const device = exports.device = (() => {
  let deviceSetup = {id: spl.id, systemInfo: m2mUtil.systemConfig.systemInfo, gpio:{input:{pin:[]}, output:{pin:[]}}, httpApi:{}, channel:{name:[]}, watchChannel:{name:[]}};
  let gpioData = [], deviceGpioInput = [], deviceGpioOutput = [], watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  let deviceInputEventnameHeader = 'gpio-Input', deviceOutputEventnameHeader ='gpio-Output', arrayGpio = null;
  let scanInterval = 5000, rpiGpioInput = 0, rpiGpioOutput = 0, simInputPin = 0, simOutputPin = 0;

  function resetWatchData(){
    watchDeviceInputData = [], watchDeviceOutputData = [], watchDeviceChannelData = [];
  }

  function getDeviceSetup(rxd){
    rxd.deviceSetup = deviceSetup;
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

  function resetSystem(){
    //console.log('reset device system');
    deviceSetup = {id: spl.id, systemInfo: m2mUtil.systemConfig.systemInfo, gpio:{input:{pin:[]}, output:{pin:[]}}, httpApi:{}, channel:{name:[]}, watchChannel:{name:[]}};
    scanInterval = 5000, rpiGpioInput = 0, rpiGpioOutput = 0, simInputPin = 0, simOutputPin = 0;
  }

  function checkDataChange(objectData){
    process.nextTick(() => {
      // objectData.value or objectData.result type can be a string, number or object
      // use callback to send the channel value
      if(objectData.value && objectData.name && objectData.value !== objectData.initValue){
        // emitter.emit('emit-send', objectData);
        objectData.initValue = objectData.value;
      }
      // use integrated response method
      else if(objectData.result && objectData.name && objectData.result !== objectData.initValue){
        // emitter.emit('emit-send', objectData);
        objectData.initValue = objectData.result;
      }
      // for gpio input/output
      // objectData.state is a boolean value
      else if(objectData.input && objectData.state !== objectData.initValue){
        emitter.emit('emit-send', objectData);
        objectData.initValue = objectData.state;
      }
      else if(objectData.output && objectData.state !== objectData.initValue){
        emitter.emit('emit-send', objectData);
        objectData.initValue = objectData.state;
      }
    });
  }

  const iterateDataEvent = exports.iterateDataEvent = function (arrayData, cb){
    arrayData.forEach((objectData) => {
      if(objectData.event && objectData.name){
        //let eventName = objectData.name + objectData.id; // old
        let eventName = objectData.id + objectData.name; // 5/2/2022 
        emitter.emit(eventName, objectData);
      }
      else if(objectData.event && objectData.input){
        let eventName = deviceInputEventnameHeader + objectData.id +  objectData.pin;
        emitter.emit(eventName, objectData);
      }
      else if(objectData.event && objectData.output){
        let eventName = deviceOutputEventnameHeader + objectData.id +  objectData.pin;
        emitter.emit(eventName, objectData);
      }

      if(objectData.event){
        /* istanbul ignore next */
        if(m2mTest.option.enabled && cb){
          process.nextTick(checkDataChange, objectData);
          return cb(objectData);
        }
        // use only process.nextTick
        process.nextTick(checkDataChange, objectData);
      }
    });
  }

  const startWatch = exports.startWatch = function (rxd, arrayData){
    arrayData.forEach((objectData, index) => {
      if(objectData.appId === rxd.appId && objectData.eventId === rxd.eventId){
        clearTimeout(objectData.watchTimeout);
        objectData.interval = rxd.interval;
        objectData.watchTimeout = setTimeout(function tick() {
          iterateDataEvent(objectData.watchEventData);
          objectData.watchTimeout = setTimeout(tick, objectData.interval);
        }, objectData.interval);
      }
    });
  }

  const reWatch = exports.reWatch = function (rxd, objectData){
    clearTimeout(objectData.watchTimeout);
    objectData.eventId = rxd.eventId;
    objectData.watchEventData[0] = rxd;
    objectData.interval = rxd.interval;
    objectData.watchTimeout = setTimeout(function tick() {
      iterateDataEvent(objectData.watchEventData);
      objectData.watchTimeout = setTimeout(tick, objectData.interval);
    }, objectData.interval);
  }

  const enableWatch = exports.enableWatch = function (arrayData){
    arrayData.forEach((objectData, index) => {
      clearTimeout(objectData.watchTimeout);
      objectData.watchTimeout = setTimeout(function tick() {
        iterateDataEvent(objectData.watchEventData);
        objectData.watchTimeout = setTimeout(tick, objectData.interval);
      }, objectData.interval); 
    });
  }

  function removeWatchEvent(rxd, arrayDataObject, cb){
    if(arrayDataObject.watchTimeout){
      clearTimeout(arrayDataObject.watchTimeout);
      //arrayDataObject.watchTimeout = null;
      rxd.result = true;
    }
    else{
      rxd.result = false;
    }
    //console.log('watch event removed', arrayDataObject.watchTimeout._destroyed);
    emitter.emit('emit-send', rxd);
    if(cb){
      return process.nextTick(cb, true);
    }
  }

  const removeDataEvent = exports.removeDataEvent = function (rxd, arrayData, cb){
    if(rxd.unwatch && (rxd.pin || rxd.name)){
      if(arrayData.length > 0){
        for (let i = 0; i < arrayData.length; i++ ) {
          if(arrayData[i]){
            // unwatch/remove a gpio input/output pin event per client request
            if(arrayData[i].pin && arrayData[i].pin === rxd.pin && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId && rxd.unwatch ){
              dm.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'pin ' + rxd.pin);
              return removeWatchEvent(rxd, arrayData[i], cb);
            }
            // unwatch/remove a channel event per client request
            else if(arrayData[i].name && arrayData[i].name === rxd.name && arrayData[i].id === rxd.id && arrayData[i].appId === rxd.appId && rxd.unwatch ){
              dm.logEvent('remote client', 'unwatch/stop event', rxd.appId, 'channel ' + rxd.name);
              return removeWatchEvent(rxd, arrayData[i], cb);
            }
          }
        }
      }
    }
    if(rxd.exit && rxd.stopEvent){
      //remove all channel & gpio events upon client exit process
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
      dm.logEvent('remote client', 'unwatch/stop all events', rxd.appId);
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

            Channel/Http Data Setup

  ***************************************/
  const getChannelDataEvent = exports.getChannelDataEvent = function (rxd){
    if(rxd.srcId === spl.id && rxd.dstId === spl.id){
      rxd.error = {error:'invalid id causing a race condition', channel:rxd.name, deviceId:rxd.id}; // 4/29/22
      dm.logEvent('getChannelDataEvent error causing a race condition', 'srcId:', rxd.srcId, 'dstId:', rxd.dstId);
      return emitter.emit('emit-send', rxd);
    }

    let v = null, eventName = null;

    if(rxd.http){
      eventName = rxd.id + rxd.originalUrl + rxd.method;
      v = emitter.emit(eventName, rxd);
      if(!v){
        eventName = rxd.id + rxd.baseUrl + rxd.method;
        v = emitter.emit(eventName, rxd);
      }
    }
    else{ // rxd.channel
      //eventName = rxd.id + rxd.name; // old
      eventName = rxd.id + rxd.channel; 5/12/22
      v = emitter.emit(eventName, rxd);
    }

    if(!v){
      if(rxd.http){
        //rxd.error = '404 - not found';
        rxd.error = {deviceId:rxd.id, error:'404 - not found'};
      }
      else{
        //rxd.error = 'channel is not available';
        rxd.error = {deviceId:rxd.id, error:'channel is not available'};
      }
      setImmediate(() => {
        emitter.emit('emit-send', rxd);
      });
    }
    return v;
  }

  function watchChannelData(rxd){
    //console.log('watchChannelData')
    if(!rxd.event){
      return;
    }

    if(rxd.src === 'browser' && rxd.b){
      return;
    }

    if(!getChannelDataEvent(rxd)){
      return;
    }

    watchDeviceChannelData = watchDeviceChannelData.filter(function(e){return e});

    // option 1: remove previous watch channel data object
    /*if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i] && watchDeviceChannelData[i].name === rxd.name && watchDeviceChannelData[i].appId === rxd.appId){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
          watchDeviceChannelData.splice(i,1);
        }
      }
    }*/

    // option2: re-use existing watch channel data object
    if(watchDeviceChannelData.length > 0){
      for (let i = 0; i < watchDeviceChannelData.length; i++ ) {
        if(watchDeviceChannelData[i] && watchDeviceChannelData[i].name === rxd.name && watchDeviceChannelData[i].appId === rxd.appId){
          clearTimeout(watchDeviceChannelData[i].watchTimeout);
          dm.logEvent('remote client', 'reset watch channel event', rxd.appId, rxd.name);
          return reWatch(rxd, watchDeviceChannelData[i]);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, name:rxd.name, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    if(rxd.eventId){
      dataObject.eventId = rxd.eventId;
    }

    if(rxd.result||rxd.result === false){
      rxd.initValue = rxd.result;
    }
    else if(rxd.value||rxd.value === false){
      rxd.initValue = rxd.value;
    }

    dataObject.watchEventData.push(rxd);
    watchDeviceChannelData.push(dataObject);
    setImmediate(startWatch, rxd, watchDeviceChannelData);

    dm.logEvent('remote client' , 'start watch channel event', rxd.appId, rxd.name);
  }

  function deviceUnwatchChannelData(rxd){
    if(rxd.src === 'browser' && rxd.b){
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

  function watchGpioInputState(rxd){
    if(!rxd.event){
      return;
    }

    if(rxd.src === 'browser' && rxd.b){
      return;
    }

    if(!GetGpioInputState(rxd)){
      return;
    }

    watchDeviceInputData = watchDeviceInputData.filter(function(e){return e});

    // option1: remove previous simulation watch gpio input object eventId 12/2/2021    
    /*if(watchDeviceInputData.length > 0){
      for (let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i] && watchDeviceInputData[i].pin === rxd.pin && watchDeviceInputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
          watchDeviceInputData.splice(i,1);
        }
      }
    }*/

    // option2: re-use existing watch gpio input data object
    if(watchDeviceInputData.length > 0){
      for (let i = 0; i < watchDeviceInputData.length; i++ ) {
        if(watchDeviceInputData[i] && watchDeviceInputData[i].pin === rxd.pin && watchDeviceInputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceInputData[i].watchTimeout);
          dm.logEvent('remote client', 'reset watch gpio input event', rxd.appId , rxd.pin);
          return reWatch(rxd, watchDeviceInputData[i]);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    if(rxd.eventId){
      dataObject.eventId = rxd.eventId;
    }

    rxd.initValue = rxd.state;

    dataObject.watchEventData.push(rxd);
    watchDeviceInputData.push(dataObject);
    setImmediate(startWatch, rxd, watchDeviceInputData);
    dm.logEvent('remote client' ,'start watch gpio input event' , rxd.appId, rxd.pin);
  }

  function deviceUnwatchGpioInputState(rxd){
    if(rxd.src === 'browser' && rxd.b){
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

  function watchGpioOutputState(rxd){
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

    // option1: remove previous simulation watch gpio output object eventId 12/2/2021    
    /*if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i] && watchDeviceOutputData[i].pin === rxd.pin && watchDeviceOutputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
          watchDeviceOutputData.splice(i,1);
        }
      }
    }*/

    // option2: re-use existing watch gpio output data object
    if(watchDeviceOutputData.length > 0){
      for (let i = 0; i < watchDeviceOutputData.length; i++ ) {
        if(watchDeviceOutputData[i] && watchDeviceOutputData[i].pin === rxd.pin && watchDeviceOutputData[i].appId === rxd.appId){
          clearTimeout(watchDeviceOutputData[i].watchTimeout);
          dm.logEvent('remote client', 'reset watch gpio output event', rxd.appId , rxd.pin);
          return reWatch(rxd, watchDeviceOutputData[i]);
        }
      }
    }

    if(!rxd.interval){
      rxd.interval = scanInterval;
    }

    let dataObject = { id:rxd.id, pin:rxd.pin, event:rxd.event, appId:rxd.appId, watchEventData:[], watchTimeout:null, interval:rxd.interval };
    if(rxd.eventId){
      dataObject.eventId = rxd.eventId;
    }

    rxd.initValue = rxd.state;

    dataObject.watchEventData.push(rxd);
    watchDeviceOutputData.push(dataObject);
    setImmediate(startWatch, rxd, watchDeviceOutputData);
    dm.logEvent('remote client' ,'start watch gpio output event' , rxd.appId, rxd.pin);
  }

  function deviceUnwatchGpioOutputState(rxd){
    if(rxd.src === 'browser' && rxd.b){
      return;
    }
    removeDataEvent(rxd, watchDeviceInputData);
  }

  // stop/unwatch device specific/individual event as requested by a client
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

  // stop/unwatch all device events
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
  }

  function startEventWatch(){
    if(watchDeviceChannelData[0]||watchDeviceInputData[0]){
      process.nextTick(enableWatch, watchDeviceChannelData);
      process.nextTick(enableWatch, watchDeviceInputData);
      process.nextTick(enableWatch, watchDeviceOutputData);
    }
    else{
      sec.ctk.restoreCtk();
      fs.writeFileSync('node_modules/m2m/mon', 'enable');
    }
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
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.watchChannel.name.push(args);
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          deviceSetup.watchChannel.name.push(args.name);
        }
      }
      deviceSetup.watchChannel.name = m2mUtil.removeDuplicateInArray(deviceSetup.watchChannel.name);
    });
  }

  function setDeviceHttpApiData(args, method){
    deviceSetup.httpApi.api = [];deviceSetup.httpApi.getPath = [];deviceSetup.httpApi.postPath = [];
    process.nextTick(function(){
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          deviceSetup.httpApi.api.push(args);
          if(method === 'get'){
            deviceSetup.httpApi.getPath.push(args);
          }
          else{
            deviceSetup.httpApi.postPath.push(args);
          }
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          deviceSetup.httpApi.api.push(args.name);
          if(method === 'get'){
            deviceSetup.httpApi.getPath.push(args.name);
          }
          else{
            deviceSetup.httpApi.postPath.push(args.name);
          }
        }
      }
      deviceSetup.httpApi.api = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.api);
      deviceSetup.httpApi.getPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.getPath);
      deviceSetup.httpApi.postPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.postPath);
    });
  }

  function setDeviceResourcesData(args){
    //deviceSetup.channel.name = [];deviceSetup.gpio.input.pin = [];deviceSetup.gpio.output.pin = [];deviceSetup.watchChannel.name = [];
    process.nextTick(function(){
      if(typeof args === 'string'){
        if(args !== 'input' && args !== 'in' && args !== 'output' && args !== 'out' && args !== '' && args !== null && args !== undefined ){
          if(args !== 'sec-cli'){
            deviceSetup.channel.name.push(args);
          }
        }
      }
      if(typeof args === 'object'){
        if(typeof args.name === 'string'){
          if(args.name !== 'sec-cli'){
            deviceSetup.channel.name.push(args);
          }
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
				if(rpiGpioInput > 0 && (os.arch() === 'arm' || os.arch() === 'arm64')){
          deviceSetup.gpio.input.type = 'rpi';
        }
        if(simOutputPin > 0){
          deviceSetup.gpio.output.type = 'simulation';
        }
        if(rpiGpioOutput > 0 && (os.arch() === 'arm' || os.arch() === 'arm64')){
          deviceSetup.gpio.output.type = 'rpi';
        }
        deviceSetup.gpio.input.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.input.pin);
        deviceSetup.gpio.output.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.output.pin);
        deviceSetup.channel.name = m2mUtil.removeDuplicateInArray(deviceSetup.channel.name);
      }
    });
  }

  // client gpio simulation test
  /* istanbul ignore next */
  function setSimGpioProcess(args, eventName, cb){
    let pins = [], pinState = [], EventName;

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
        EventName = eventName + args.pin[i];
        if(emitter.listenerCount(EventName) < 1){
          emitter.on(EventName, (data) => {

            dm.resources.collectAccessData(data);

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
                setImmediate(() => {
                  if(data.error){
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }

    if(m2mTest.option.enabled){
      let pl = {event:false, id:spl.id, pin:args.pin[0]};
      if(spl.testParam === 'valid'){
        pl.state = true;
      }
      else if(spl.testParam === 'invalid'){
        pl.error = spl.testParam;
        pl.state = null;
      }
      emitter.emit(EventName, pl);
    }
  }

  function getGpioInputSetup(){
    return rpiGpioInput;
  }

  // gpio input monitoring using array-gpio for raspberry pi
  function setRpiGpioInput(args, eventName, cb){
    /* istanbul ignore next */
		if(m2mTest.option.enabled){
      rpiGpioInput = 0;
      if(args.pin[0] === 41){
        rpiGpioInput = 1;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(rpiGpioInput === 0){
      rpiGpioInput++;
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
          dm.resources.collectAccessData(gpio);
          // outbound/outgoing optional callback for event-based input monitoring
          // e.g. input(11).watch()
          if(cb){
            setImmediate(cb, gpio);
          }
        });
      }
    }

    function unwatchInput(gpio){
      if(gpio.unwatch && gpio.pin && gpio.input){
        deviceGpioInput[gpio.pin].unwatch();
        gpio.result = true;
        gpio.state = 'unwatch';
        emitter.emit('emit-send', gpio);
        /*if(cb){
          setImmediate(cb, gpio);
        }*/
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

    function setGpioInput(gpio){
      if(!deviceGpioInput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else if(gpio.unwatch){
				unwatchInput(gpio);
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
                setImmediate(() => {
                  if(data.error){
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }
  }

  function getGpioOutputSetup(){
    return rpiGpioOutput;
  }

  // gpio output control using array-gpio for raspberry pi
  function setRpiGpioOutput(args, eventName, cb){
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      if(args.pin[0] === 43){
      	rpiGpioOutput = 0;arrayGpio = null;
      }
    }

    if(!arrayGpio){
      arrayGpio = require('array-gpio');
    }

    let pins = args.pin;

    if(rpiGpioOutput === 0){
      rpiGpioOutput++;
      if(args.mode === 'output' || args.mode === 'out'){
        deviceGpioOutput = arrayGpio.out({pin:pins, index:'pin'});
      }
    }

    function setGpioOutputState(gpio){
      if(!deviceGpioOutput[gpio.pin]){
        gpio.error = 'invalid pin ' + gpio.pin;
      }
      else{
        dm.resources.collectAccessData(gpio);
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
                setImmediate(() => {
                  if(data.error){
                    try{   
                      emitter.emit('error', data);
                    }
                    catch(e){
                      cb(data.error);
                    }
                    return;
                  }
                  cb(data);
                });
              }
            }
          });
        }
      }
    }
  }

  function setChannelData(args, eventName, cb, method){
    let channel = null, response = null, validData = true;

    if(typeof args === 'string' && typeof cb === 'function'){
      channel = args;
    }
    else if(typeof args === 'object'){
      channel = args.channel; 
    }

    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        let dt = Math.floor(Math.random() * 500);
        dm.resources.collectAccessData(data);
        response = (result, cb2) => {
          try{
            client.validateNamePayload(result);
          }
          catch(e){
            if(e.message === 'invalid payload/body'){
              data.error = 'invalid data';
              validData = null;
              data.result = null;
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                if(cb2){
                  cb2(data.error);
                }
              }
              return;
            }
          }
          if(data.srcId && data.dstId && data.srcId === data.dstId){
            dm.logEvent('setChannelData - invalid data causing a race condition', 'data.srcId:' + data.srcId, 'data.dstId:' + data.dstId);
            return;
          }
          if(validData){
            data.result = result;
          }
          if(data.event && data.result && data.name && data.result === data.initValue){
            return;
          }
          else{
            // response(), send(), json()
            setTimeout(() => {
              //console.log('send appId', data.name, data.appId, data.result, data.initValue, dt);
              emitter.emit('emit-send', data);
            }, dt);
          }
        } // response

        data.send = data.json = data.response = response;

        //if(data.id === spl.id && data.name === channel){ // old
        if(data.id === spl.id && data.channel === channel){ // 5/12/22

          // cb is already validated
          setImmediate(() => {
            if(data.error){
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                cb(data.error);
              }
              return;
            }

            setImmediate(() => {
              cb(data);
            });
            
            // watch data condition
            if(data.event && data.result && data.name && data.result !== data.initValue){
  				    data.initValue = data.result;
              setDeviceResourcesWatchData(args);
            }
            // using data.value if used in the api instead of data.send
            setImmediate(() => {
              if(data.value){
                if(data.value && data.name && data.value !== data.initValue ){
                  emitter.emit('emit-send', data);
                  data.initValue = data.value;
                }
              }
            });
          });
        }
      });
    }

    /* istanbul ignore next */
    if(m2mTest.option.enabled){

      let pl = {id:spl.id, src:'browser', dst:'device', name:channel, event:false, name:'test'};

      if(method === 'post'){
        pl.body = {}
      }

      if(channel === 'test-passed'){
        pl.name = 'test-passed';
      }
      else if(channel === 'test-failed'){
        pl.name = 'test-failed';
        pl.error = 'test-failed';
      }
      emitter.emit(eventName, pl);
    }

    setDeviceResourcesData(args);
  }

  // set http route params name and index container
  // the result should match with client's getUrlKeys method result
  function getParamKeys(url){
    const urlRoutesIndex = [], urlKeys = [], params = {}, paramKeys = [];
    
    let obj = {};

    for (let i = 0; i < url.length; i++) {
      if (url[i] === '/') {
        urlRoutesIndex.push(i);
      }
    }

    urlRoutesIndex.forEach((value, i) => {
      if(value == 0 && urlRoutesIndex[i+1]){
        //let key = url.slice(urlRoutesIndex[i]+1, urlRoutesIndex[i+1]); // w/o slash
        let key = url.slice(urlRoutesIndex[i], urlRoutesIndex[i+1]); // w/ slash
        urlKeys.push(key);
      }
      else if(value !== 0 && urlRoutesIndex[i] && urlRoutesIndex[i+1]){
        //let key = url.slice(urlRoutesIndex[i]+1, urlRoutesIndex[i+1]); // w/o slash
        let key = url.slice(urlRoutesIndex[i], urlRoutesIndex[i+1]); // w/ slash
        urlKeys.push(key); 
      }
      else{
        //let key = url.slice(urlRoutesIndex[i]+1, url.length); // w/o slash
        let key = url.slice(urlRoutesIndex[i], url.length); // w/ slash
        urlKeys.push(key);
      }
    });
    
    // get params names and index
    urlKeys.forEach((value, i) => {
      if(value.startsWith('/:')){
        let pn = value.slice(2, value.length);
        let o = {key:pn, index:i};
        params[pn] = pn;
        paramKeys.push(o);
      }
    });

    //console.log('urlKeys', urlKeys)
    //console.log('params', params)

    obj.params = params;
    obj.urlKeys = urlKeys;
    obj.baseUrl = urlKeys[0];
    obj.paramKeys = paramKeys;
    
    return obj;
  }

  function setHttpData(args, eventName, cb, method){
    let response = null, validData = true; 
    let res = null,  req = null, pathString = null;

    if(!args.startsWith('/')){
      let error = '\nhttp ['+method+'] url path ['+args+'] should start with a slash /';
      console.log(error);
      throw error;
    }
    else if(args.startsWith('/:')){
      let error = '\nhttp ['+method+'] url path ['+args+'] must have a base path\nurl path starting with a route param /: is not allowed';
      console.log(error);
      throw error;
    }

    let deviceObject = getParamKeys(args);

    if(Object.keys(deviceObject.params).length > 0){
      let st = args;
      let pos = st.indexOf("/:", 1);
      if(pos !== -1){
        args = st.substring(0, pos);
        eventName = spl.id + args + method;
      }
    }

    if(Object.keys(deviceObject.params).length > 0 && deviceObject.baseUrl !== args){
      let error = '\nhttp ['+method+'] url path ['+args+'] is invalid';
      console.log(error);
      throw error;
    }    

    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        let dt = Math.floor(Math.random() * 200);
        dm.resources.collectAccessData(data);

        // create the response method
        response = (result, cb2) => {
          try{
            client.validateNamePayload(result);
          }
          catch(e){
            if(e.message === 'invalid payload/body'){
              data.error = 'invalid data';
              validData = null;
              data.result = null;
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                if(cb2){
                  cb2(data.error);
                }
              }
              return;
            }
          }
          if(data.srcId && data.dstId && data.srcId === data.dstId){
            dm.logEvent('setChannelData - invalid data causing a race condition', 'data.srcId:' + data.srcId, 'data.dstId:' + data.dstId);
            return;
          }
          if(validData){
            data.result = result;
          }
          if(data.event && data.result && data.name && data.result === data.initValue){
            return;
          }
          else{
            // response(), send(), json()
            setTimeout(() => {
              //console.log('send appId', data.name, data.appId, data.result, data.initValue, dt);
              emitter.emit('emit-send', data);
            }, dt);
          }
        } // response method

        if(data.method === 'post' && data.body && data.body.data){
          if(typeof data.body.data === 'string'){
            try{
              data.body = JSON.parse(data.body.data);
            }
            catch(e){
              data.body = data.body.data;
            } 
          }
        } 

        data.send = data.json = data.response = response;

        if(data.id === spl.id && (data.baseUrl === args||data.originalUrl === args)){

          if(method === 'get' && (data.body || data.post)){
            data.error = 'Invalid get request, received a post body';
            return emitter.emit('emit-send', data);
          }
          else if(method === 'post' && (!data.body || data.get)){
            data.error = 'Invalid post request, missing post body';
            return emitter.emit('emit-send', data);
          }

          // build the req object
          req = Object.assign({}, data);
          delete req.response; delete req.send;delete req.json;

          req.params = {};
          
          if(data.urlPathKeys.length === deviceObject.urlKeys.length){
            deviceObject.paramKeys.forEach((value, i) => {
              if(value.key === deviceObject.params[value.key]){
                req.params[value.key] = data.urlPathKeys[value.index].slice(1, data.urlPathKeys[value.index].length);
                //req.params[value.key] = data.urlPathKeys[value.index]; // no need to remove slash, still getting some issues
              }
            });
          }

          // build the res object
          res = Object.assign({}, data);

          if(method === 'post' && res.body){
            delete res.body;
          }

          // cb is already validated
          setImmediate(() => {
            if(data.error){
              try{   
                emitter.emit('error', data);
              }
              catch(e){
                cb(data.error);
              }
              return;
            }

            setImmediate(() => {
              cb(req, res);
            });
          });
        }
      });
    }

    /* istanbul ignore next */
    if(m2mTest.option.enabled){

      let pl = {id:spl.id, src:'browser', dst:'device', name:args, event:false, name:'test'};

      if(method === 'post'){
        pl.body = {}
      }

      if(args === 'test-passed'){
        pl.name = 'test-passed';
      }
      else if(args === 'test-failed'){
        pl.name = 'test-failed';
        pl.error = 'test-failed';
      }
      emitter.emit(eventName, pl);
    }

    setDeviceHttpApiData(args, method);
  }

  /***************************************************

        Device Application Setup Property Methods

  ****************************************************/
  function setData(args, cb){
    // websocket.initCheck();
    let eventName = null;
     
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      //eventName = args + spl.id;
      eventName = spl.id + args;
    }
    else if(typeof args === 'object'){
      if(!args.channel||!args.method){
        throw new Error('invalid argument, missing channel/method property');
      }
      if(typeof args.channel !== 'string'){
        throw new Error('channel property argument must be a string');
      }
      if(typeof args.method !== 'string'){
        throw new Error('method property argument must be a string');
      }
      //eventName = args.channel + spl.id;
      eventName = spl.id + args.channel;
    }
    else{
      throw new Error('invalid arguments');
    }
    setChannelData(args, eventName, cb);
  }

  function setApi(args, cb){
    websocket.initCheck();
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'object'){
      if(!args.route||!args.method){
        throw new Error('invalid argument, missing channel/method property');
      }
      if(typeof args.route !== 'string'){
        throw new Error('route property argument must be a string');
      }
      if(typeof args.method !== 'string'){
        throw new Error('method property argument must be a string');
      }
      //let eventName = args.route + spl.id + args.method;
      let eventName = spl.id + args.route + args.method;
      setHttpData(args, eventName, cb);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function getApi(args, cb){
    websocket.initCheck();
    let method = 'get';
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      //let eventName = args + spl.id + method;
      let eventName = spl.id + args + method;  
      setHttpData(args, eventName, cb, method);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function postApi(args, cb){
    websocket.initCheck();
    let method = 'post';
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    if(typeof args === 'string' && typeof cb === 'function'){
      //let eventName = args + spl.id + method;
      let eventName = spl.id + args + method;
      setHttpData(args, eventName, cb, method);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function setGpio(args, cb){
    websocket.initCheck();
    // system arch
    let sa = null;

    sa = os.arch();

    if(typeof args !== 'object'){
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
        if((sa === 'arm' || sa === 'arm64' ) && (!args.type || args.type === 'int' || args.type === 'internal')) {
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
        else{
          throw new Error('Sorry, gpio control is not available on your device');
        }
      }
    }
    else{
      // invalid args.mode
      throw new Error('invalid arguments');
    }
  }

  function resetDeviceSetup(){
    deviceSetup.httpApi.api = [];
    deviceSetup.channel.name = [];
    deviceSetup.gpio.input.pin = [];
    deviceSetup.gpio.output.pin = [];
    deviceSetup.httpApi.getPath = [];
    deviceSetup.httpApi.postPath = [];
    deviceSetup.watchChannel.name = [];
  }

  // setup setDeviceResourcesListener() listener
  setDeviceResourcesListener((deviceSetup) => {
    deviceSetup.httpApi.api = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.api);
    deviceSetup.channel.name = m2mUtil.removeDuplicateInArray(deviceSetup.channel.name);
    deviceSetup.gpio.input.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.input.pin);
    deviceSetup.gpio.output.pin = m2mUtil.removeDuplicateInArray(deviceSetup.gpio.output.pin);
    deviceSetup.httpApi.getPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.getPath);
    deviceSetup.httpApi.postPath = m2mUtil.removeDuplicateInArray(deviceSetup.httpApi.postPath);
    deviceSetup.watchChannel.name = m2mUtil.removeDuplicateInArray(deviceSetup.watchChannel.name);
    setImmediate(() => {
      if(deviceSetup.gpio.input.pin.length > 0){
      	//console.log('Gpio input', deviceSetup.gpio.input);
        console.log('Gpio input resources', deviceSetup.gpio.input);
      }
      if(deviceSetup.gpio.output.pin.length > 0){
      	//console.log('Gpio output', deviceSetup.gpio.output);
        console.log('Gpio output resources', deviceSetup.gpio.output);
      }
      if(deviceSetup.watchChannel.name.length > 0){
      	console.log('Watch Channel data', deviceSetup.watchChannel.name);
      }
      if(deviceSetup.channel.name.length > 0){
      	//console.log('Channel data', deviceSetup.channel.name);
        console.log('Channel resources', deviceSetup.channel.name);
      }
      // use get and post for more detail
      if(deviceSetup.httpApi.api.length > 0){
      	//console.log('Http api data', deviceSetup.httpApi.api);
      }
      if(deviceSetup.httpApi.getPath.length > 0){
        //console.log('Http get api', deviceSetup.httpApi.getPath);
        console.log('Http get resources', deviceSetup.httpApi.getPath);
      }
      if(deviceSetup.httpApi.postPath.length > 0){
        //console.log('Http post api', deviceSetup.httpApi.postPath);
        console.log('Http post resources', deviceSetup.httpApi.postPath);
      }
    });
  });

  function getDeviceResources(){
    return deviceSetup;
  }

  let resources = {
    setApi: setApi,
    getApi: getApi,
    postApi: postApi,
    setData: setData,
    setGpio: setGpio,
    getDeviceResources: getDeviceResources,
  };

  let input = {
    getGpioInputSetup: getGpioInputSetup,
    GetGpioInputState: GetGpioInputState,
    watchGpioInputState: watchGpioInputState,
  };

  let output = {
    GetGpioOutputState: GetGpioOutputState,
    getGpioOutputSetup: getGpioOutputSetup,
    watchGpioOutputState: watchGpioOutputState,
  };

  let channel = {
    watchChannelData: watchChannelData,
    getChannelDataEvent: getChannelDataEvent,
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
    deviceSetup: deviceSetup,
    resetSystem: resetSystem,
    stopEventWatch: stopEventWatch,
    resetWatchData: resetWatchData,
    getDeviceSetup: getDeviceSetup,
    startEventWatch: startEventWatch,
    resetDeviceSetup: resetDeviceSetup,
    unwatchDeviceEvent: unwatchDeviceEvent,
  }

})(); // device


/*****************************************

                SEC OBJECT

 *****************************************/
/* istanbul ignore next */
const sec = exports.sec = (() => {
  const rsl = new RegExp(/\//), rbsl = new RegExp(/\\/), brCliStore = [], file_size = 1000000; //1MB or 50000 50KB
  const usridvdn = { regex:/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/, msg:'Invalid userid. It must follow a valid email format.'};
  const pwvdn = { regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*()\\[\]{}\-_+=~|:;<>,./? ])(?=.{6,})/,
  msg: 'Password must be 8 characters minimum\nwith at least one number, one lowercase letter,\none uppercase letter, and one special character.'};
  let rkpl = {_sid:'ckm', _pid:null, rk:true, nodev:process.version, m2mv:m2mv.version, rid:m2mUtil.rid(4)};
  let serverTimeout = null, serverResponseTimeout = 7000, rsTO = 15, tp = {}, sd = {}, enable = true, restartStatus = true;
  let ptk = m2mUtil.secTkn.getPtk(), rtk = m2mUtil.secTkn.getRtk(), rpk = m2mUtil.secTkn.getRpk(), processFilename = null, newRsTO = null, appIds = null;

  if(processArgs[0] === '-rs' && processArgs[1]){
    newRsTO = parseInt(processArgs[1]);
    if(Number.isInteger(newRsTO)){
      rsTO = newRsTO;
    }
    if(newRsTO > 120){
      rsTO = 120;
    }
  }

  try{
    let s = getOpStat();
  }
  catch(e){
    if(e.code === 'ENOENT'){
      setOpStat({});
    }
  }

  let cfg = m2mUtil.systemConfig.getSystemConfig();
  //console.log('cfg', cfg);
  function setProcessName(){
    let mfn = require.main.filename, st = 0;
    if(process.platform === 'win32'){
      st = mfn.lastIndexOf("\\");
    }
    else{
      st = mfn.lastIndexOf("/");
    }
    processFilename = mfn.slice(st+1,st+50);
  }
  setProcessName();

  function parseCtk(){
    try{
      let ctk = fs.readFileSync(ptk, 'utf8');
      return ctk.slice(0, 27);
    }
    catch(e){
      if(e.code === 'ENOENT'){
        m2mUtil.secTkn.initSec();
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
    if(cfg.zta||cfg.zta === undefined){
      setTimeout(function(){
        fs.writeFileSync(ptk, rpk);
      }, rsTO*60000);
    }
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

  function restartCtk(){
    return fs.writeFileSync(ptk, rtk);
  }

  function getOpStat(){
    let op = fs.readFileSync('m2mConfig/op_stat');
    let op_stat = JSON.parse(op);
    return op_stat; 
  }

  function setOpStat(opstat){
    fs.writeFileSync('m2mConfig/op_stat', JSON.stringify(opstat));
  }

  function setEnableStatus(v){
    enable = v;
    return enable;
  }

  function getEnableStatus(){
    return enable;
  }

  function restartProcess(rxd){
    rxd.active = true;
    rxd.result = 'fail';
    rxd.restartable = false;
    rxd.enable = enable;
    if(m2mUtil.getRestartStatus()){
      restoreCtk();
      m2mUtil.monApp.stopMonFS();
      if(rxd.data){
        sec.ctk.setCtk(rxd.path, rxd.data);
      }
      rxd.result = 'success';
      rxd.restartable = true;
      dm.logEvent('process restarted remotely');
      setTimeout(() => {
        fs.writeFileSync('node_modules/m2m/mon', 'restart');
      }, 1000);
    }
    emitter.emit('emit-send', rxd);
  }

  function autoRestart(){
    if(spl.device){
      fs.writeFileSync('node_modules/m2m/mon', 'restart');
    }
    else{
      setTimeout(() => {
        fs.writeFileSync('node_modules/m2m/mon', 'restart');
      }, 1000);
    }
  }

  function restartReconnectProcess(rxd){
    device.resetDeviceSetup();
    rxd.active = true;
    rxd.result = 'fail';
    rxd.restartable = false;
    if(m2mUtil.getRestartStatus()){
      rxd.restartable = true;
      try{
        let data = readCtk();
        setTimeout(() => { 
          websocket.connect(m2mUtil.defaultNode, data, null);
          rxd.result = 'success';
        }, 2000);
      }
      catch(e){
        return console.log('restartReconnect error', e.message);
      }
    }
    emitter.emit('emit-send', rxd);
  }

  function getEndpointStatus(rxd){
    rxd.options = options;
    rxd.systemInfo = m2mUtil.systemConfig.systemInfo;
    rxd.active = true;
    rxd.enable = enable;
    rxd.containerized = m2mUtil.systemConfig.systemInfo.container;

    try{
      let pkgJson = fs.readFileSync('node_modules/m2m/package.json', 'utf8');
      let pkgFile = JSON.parse(pkgJson);
      rxd.systemInfo.m2mv = 'v' + pkgFile.version;
    }
    catch(e){
      console.log('read package.json error:', e);
    }

    rxd.brCliStore = sec.cli.getBrCliStore();  

    let cfg = m2mUtil.systemConfig.getSystemConfig(rxd);
    if(cfg){
      rxd.cfg = cfg;
    }
    if(m2mUtil.getRestartStatus()){
      rxd.restartable = true;
    }
    if(rxd._pid === 'client-status'){
      rxd.clientDeviceId = client.device.getClientDeviceId();
      rxd.clientAccessData = dm.resources.getClientAccessData();
    }
    if(rxd._pid === 'device-status'){
      if(device.deviceSetup){
        rxd.deviceSetup = device.deviceSetup;
      }
    }
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function getUserResources(rxd){
    rxd.active = true;
    rxd.enable = enable;

    if(spl.device && rxd.startAccessRateMonitor){
      return dm.resources.startMonitorAccessRate();
    }
    else if(spl.device && rxd.stopAccessRateMonitor){
      return dm.resources.stopMonitorAccessRate();
    } 
    else if(spl.device && rxd.getUserResources){ 
      rxd.deviceSetup = device.deviceSetup;
      rxd.deviceTotalAccessRate = dm.resources.getDeviceAccessRateData();
    }
    else if(spl.app && rxd.getUserResources){
      rxd.clientAccessData = dm.resources.getClientAccessData();
    }
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function suspend(rxd){
    let sc = m2mUtil.systemConfig.getSystemConfig();
    if(rxd.enable === false && enable){
      if(spl.device){   
        device.stopEventWatch();
      }
      enable = false;
      sc.enable = false;
      dm.resources.stopMonitorAccessRate(); 
      dm.logEvent('Endpoint is disabled');
    }
    else if(rxd.enable === true && !enable){
      if(spl.device){   
        device.startEventWatch();
      }
      enable = true;
      sc.enable = true;
      dm.resources.startMonitorAccessRate(); 
      dm.logEvent('Endpoint is enabled');
    }
    m2mUtil.systemConfig.setSystemConfig(sc); 
  }

  function secureSystem(rxd){
    rxd.active = true;
    restoreCtk();
    if(rxd.on){
      restartStatus = false;
    }
    rxd.result = 'success';
    dm.logEvent('process', 'secure system enabled');
    emitter.emit('emit-send', rxd);
  }

  function enableAutoConfig(rxd){
     if(m2mUtil.getRestartStatus()){
       return;
     } 
     let stdio = rxd.stdio; 
     try{
       if(Object.keys(options).length == 0){
          sec.setPkgConfig({});
       }
       if(Object.keys(options).length > 0){
         if(options.m2mConfig && options.processFilename && options.nodemonConfig && options.startScript){
           //console.log('already configured');
         }
         else{  
           sec.setPkgConfig({});
         }
       }
       spawnSync(rxd.cmd[1], {stdio:null, shell:true});
       spawnSync(rxd.cmd[2], {stdio:stdio, shell:true});
     }
     catch(e){
       console.log('enableAutoConfig error', e);
     }
  }

  function setSysCfg(rxd){
    //console.log('setSysCfg', rxd);
    let cfg = m2mUtil.systemConfig.getSystemConfig();
    if(rxd.id){
      cfg.id = rxd.id;
    }
    if(rxd.dst == 'device'){
      cfg.device = rxd.dst;
    }
    if(rxd.dst == 'client'){
      cfg.client = rxd.dst;
    }
    //if(rxd.monCode === true||rxd.monCode === false){
    if(Object.hasOwn(rxd, 'monCode')){ 
      cfg.monCode = rxd.monCode;
      if(cfg && cfg.monCode === true){
        m2mUtil.monApp.monUsrApp(require.main.filename); 
        m2mUtil.monApp.monFS();
        dm.logEvent('enable user app & fs monitoring');
        rxd.result = true;
      } 
      else if(cfg && cfg.monCode === false){
        cfg.eAlert = false;
        cfg.activeRes = false;
        m2mUtil.monApp.stopMonUsrApp(); 
        m2mUtil.monApp.stopMonFS();
        dm.logEvent('*stop user app & fs monitoring', '- verify event if user initiated');
        rxd.result = true;
      }
      else{
        if(rxd.monCode){
          m2mUtil.monApp.monUsrApp(require.main.filename);
          m2mUtil.monApp.monFS();
          dm.logEvent('enable user app & fs monitoring');
          rxd.result = true;
        }
      }
    }
    //if(rxd.eAlert === true||rxd.eAlert === false){
    if(Object.hasOwn(rxd, 'eAlert')){ 
      cfg.eAlert = rxd.eAlert;
    }
    //if(rxd.activeRes === true||rxd.activeRes === false){
    if(Object.hasOwn(rxd, 'activeRes')){ 
      cfg.activeRes = rxd.activeRes;
    }
    //if(rxd.zta === true||rxd.zta === false){
    if(Object.hasOwn(rxd, 'zta')){
      cfg.zta = rxd.zta;
      if(cfg.zta === false){fs.writeFileSync(ptk, rtk);}
      else{fs.writeFileSync(ptk, rpk);}
    }
    m2mUtil.systemConfig.setSystemConfig(cfg);
    rxd.cfg = cfg;
    setImmediate(() => {
      emitter.emit('emit-send', rxd);
    });
  }

  function execCliCom(rxd){
    try{ 
     for (var i = 0; i < rxd.payload.length; i++ ) {
       spawn(rxd.payload[i], {stdio:'inherit', shell:true});
     }
    }
    catch(e){
     //console.log('execCliCom error', e);
    }
  }

  function getBrCliStore(){
    return brCliStore;
  }

  function setDate(){
    return new Date();
  }

  function showLine(n){
    var x = '';for(var i = 0; i < n; i++){ x = x + '=';}return x; 
  }

  let cliLogHeader = showLine(60)+'\n'+setDate()+'\n'+showLine(60);

  function checkCliLogFile(rxd){
    let data = null;
    try{
      data = fs.readFileSync(rxd.filename, 'utf8');
      if(data.length > file_size){
        fs.writeFileSync(rxd.filename, '');     
      }
    }
    catch(e){
      fs.writeFileSync(rxd.filename, '');  
    }  
  }

  function processCliResult(rxd, msg, cb){
    checkCliLogFile(rxd);
    fs.appendFileSync(rxd.filename, cliLogHeader + '\n'+'command [ '+rxd.cli+' ]\n');
    setTimeout(() => {
      fs.appendFileSync(rxd.filename, msg);
      rxd.brCliStore = brCliStore;
      loadCliLogData(rxd);
      setImmediate(cb, rxd);
    }, 500);     
  }    

  function exeBrCli(rxd, c, cb){
    let result = '', option = null;
    try{
      if(rxd.opt){
        option = rxd.opt;
      }
      let cli = spawn(c, {stdio:option, shell:true});
      let cliObject = {cli:cli, cmd:rxd.cli, pid:cli.pid, killed:cli.killed, cliId:rxd.cliId};
      brCliStore.push(cliObject);
      c = null; rxd.success = true;
      if(process.platform !== 'win32'){
        cli.stdout.on('data', (data) => {
          //console.log(`cli stdout: ${data}`);
          result = result + data.toString();
        });
        cli.stderr.on('data', (data) => {
          //console.error(`cli stderr: ${data}`); // buffer type
          let np = data.toString().search('no password was provided');
          let pf = data.toString().search('password for');
          if(np !== -1){return;}
          if(pf !== -1){return;}
          result = result + data.toString();
        });
      }
      cli.on('close', (code, signal) => {
        //console.log(`cli close with code ${code}`);
        if(signal){
          result = result + 'Command aborted\n';
        }
        rxd.code = code;
        removeCliProcess(rxd);
        processCliResult(rxd, result+'\n', cb);
      });
      cli.on('exit', (code, signal) => {
        //console.log(`cli exit code ${code}`);
        //console.log(`cli exit signal ${signal}`);
      });
      cli.on('error', (err) => {
        //console.log(`cli failed to start ${err}`);
        dm.logEvent('cli execution error - ', err.toString());
        processCliResult(rxd, result + 'error: ' + err.toString() + '\n', cb);
      });
      cli.stdin.end();
    }
    catch(e){
      //console.log('exeBrCli error', e.message);
      dm.logEvent('cli execution error - ', e.message); 
      processCliResult(rxd, 'Execution error. Please try again later.\n\n', cb);
     }
  }

  function processBrCli(rxd){
    if(rxd.dst === 'device'){
      rxd.src = 'device';
    } 
    if(rxd.dst === 'client'){
      rxd.src = 'client';
    } 
    rxd.dst = 'browser';
    rxd.response = true;
    rxd.pl = null;
    websocket.send(rxd);
  }
  
  // browser to client/device
  function eCli(rxd){
    if(rxd.ers){
      restoreCtk();
      enableAutoConfig(rxd);
    }
    let pl = Buffer.from(rxd.pl, 'base64').toString('utf8');
    exeBrCli(rxd, pl, (rxd) => {
      processBrCli(rxd);
    });
  }

  function removeCliProcess(rxd, cb){
    let match = false;
    try{ 
      if(brCliStore.length > 0){
        for(var x = 0; x < brCliStore.length; x++){
          if(brCliStore[x] && brCliStore[x].cmd && rxd.cli && brCliStore[x].cliId === rxd.cliId && brCliStore[x].cmd === rxd.cli) {
            match = true; 
            rxd.completed = true;
            if(cb){ 
              cb(true, x);
            }
            return setTimeout(() => {
              brCliStore.splice(x, 1);
            }, 100);
          }
        }
      }
      if(!match){
        if(cb){
          cb(false);
        }
      }
    }
    catch(e){
      setTimeout(() => {
        rxd.result = 'Command [ '+rxd.cli+' ] execution error. Please try again later.\n';
        dm.logEvent('removeCliProcess error', e.message);   
        processBrCli(rxd);
      }, 500); 
    }
  }

  function aCli(rxd){
    rxd.success = true;
    removeCliProcess(rxd, (result, x) => {
      if(result){
        brCliStore[x].cli.kill('SIGSTOP');
        if(!brCliStore[x].cli.killed){
          processCliResult(rxd, 'Abort fail\n\n', processBrCli);          
        }
        else{
          processCliResult(rxd, 'Aborted\n\n', processBrCli);   
        }
      }
      else{
        processCliResult(rxd, 'Already executed, nothing to abort\n\n', processBrCli);  
      }
    });
  }

  function exeClientDeviceCli(c, cb){
    const cli = spawn(c, {shell:true});
    cli.stdout.on('data', (data) => {
      //console.log(`cli stdout: ${data}`);
      cb(data);
    });
    cli.stderr.on('data', (data) => {
      //console.error(`cli stderr: ${data}`);
      cb(data);
    });
    cli.on('close', (code) => {
      //console.log(`cli exited with code ${code}`);
      cb(code);
    });
    cli.on('error', (err) => {
      //console.log(`cli failed to start ${err}`);
      cb(err);
    });
  }

  // client to device
  setTimeout(() => {
    device.resources.setData('sec-cli', (data) => {
      exeClientDeviceCli(data.payload, (result) => {
        if(result){
          data.send(result.toString());
        } 
      });
    });
  }, 1500);

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
    /* istanbul ignore next */
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadCode && options && options.m2mConfig.code){
      if(options.m2mConfig.code.allow && options.m2mConfig.code.filename){
        rxd.processFilename = options.m2mConfig.code.filename;
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
          if(m2mUtil.getRestartStatus()){
            rxd.restartable = true;
          }
          m2mUtil.monApp.stopMonUsrApp();
          let utf8_appData = Buffer.from(rxd.appData, 'base64').toString('utf8');
          /*let r = utf8_appData.includes("require('m2m')", 0);
          if(r === false){
            console.log('code update error: code not in utf8 format');
            return;
          }*/
          return fs.writeFile(options.m2mConfig.code.filename, utf8_appData, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                rxd.appData = 'filename does not exist.';
              }else{
                rxd.appData = err;
              }
              dm.logEvent('application code update error', err.message);
              rxd.error = {permission:true, file:null};
              return emitter.emit('emit-send', rxd);
            }
            delete rxd.appData;
            rxd.success = true;
            emitter.emit('emit-send', rxd);
            m2mUtil.monApp.monUsrApp(options.m2mConfig.code.filename);
            restoreCtk();
            dm.logEvent('application code updated', options.m2mConfig.code.filename);
            setImmediate(() => {
              fs.writeFileSync('node_modules/m2m/mon', 'code-update');
            });
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

  function msgBundle(msg, rxd){
    try{
      let bcode = Buffer.from(msg); 
      if(rxd.uploadEventLog){
        rxd.eventLogData = bcode.toString('base64');
      } 
      else if(rxd.uploadCliLog||rxd.scli){
        rxd.cliLogData = bcode.toString('base64');
      }
      rxd.success = true;
    }
    catch(e){
      rxd.error = 'The was an error loading the log file. You can try again later.';
      dm.logEvent('Log file error', e.message);
    }
    finally{
      emitter.emit('emit-send', rxd);
    }
  }

  function logFileError(err, rxd){
    if(err.code === 'ENOENT') {
      let msg = 'Log file not found';
      dm.logEvent(msg, err.message);
      return msgBundle(msg, rxd);
    }
    let msg = 'Log file error';
    dm.logEvent(msg, err.message);
    return msgBundle(msg, rxd);
  }

  function truncateLogFile(data, rxd){
    let header = cliLogHeader +'\nLog file has reached its max. allowable size.\nFile is truncated ...' + '\n\n';
    let tData = data.slice(-10000);
    let newData =  header + tData;
    fs.writeFileSync(rxd.filename, newData);
    return newData; 
  }

  function getLogData(rxd){
    fs.readFile(rxd.filename, 'utf8', (err, data) => {
      if(err){
        return logFileError(err, rxd);
      }
      if(data.length > file_size){
        let newData = truncateLogFile(data, rxd); 
        return msgBundle(newData, rxd);
      }
      if(rxd.enc){
        return encryptData(rxd, data);
      }
      msgBundle(data, rxd);
    });
  }

  var getEventLogData = getLogData;
  var getCliLogData = getLogData;

  function loadCliLogData(rxd){
    let data = null;
    try{
      data = fs.readFileSync(rxd.filename, 'utf8');
      if(data.length > file_size){
        data = truncateLogFile(data, rxd); 
      }
      let bcode = Buffer.from(data);
      rxd.cliLogData = bcode.toString('base64');
    }
    catch(err){
      logFileError(err, rxd);
    }
  }

  function clearLogData(rxd){
    let h = '';
    if(rxd.clearEventLog){
      h = dm.eventLogHeader;
    }
    fs.writeFile(rxd.filename, h, (err) => {
      if(err){
        return logFileError(err, rxd);
      }
      rxd.success = true;
      return emitter.emit('emit-send', rxd);
    });
  }

  var clearEventLogData = clearLogData;
  var clearCliLogData = clearLogData;

  function clearLogFile(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    try{
      let rn = m2mUtil.rid(4);
      let tmpLogFile = fs.readFileSync(rxd.filename, 'utf8');
      let filename = 'm2mConfig/log'+rn+'.txt'; 
      return setTimeout(() => {
        if(rxd.clearCliLog){ 
          clearCliLogData(rxd);
        }
        else if(rxd.clearEventLog){
          clearEventLogData(rxd);
        }
      }, 300);
    }
    catch(e){
      dm.logEvent('clearCliLog error', e.message);
      rxd.error = 'Cannot clear log file';
      return emitter.emit('emit-send', rxd);
    }
  }

  var clearEventLog = clearLogFile;
  var clearCliLog = clearLogFile;

  function uploadEventLog(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadEventLog){
      getEventLogData(rxd);
    }
  }

  function uploadCliLog(rxd){
    rxd.active = true;
    if(m2mTest.option.enabled && Object.keys(rxd.options).length > 0){
      options = rxd.options;
    }
    if(rxd.uploadCliLog){
      getCliLogData(rxd);
    }
  }

  function setModuleUpdateListener(){
    let eventName = 'm2m-module-update';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (rxd) => {
        if(rxd.aid === spl.aid) {
          try{
            let pkg = JSON.parse(rxd.file.package);
          }
          catch(e){
            console.log('pkg parse error', e);
            dm.logEvent('pkg parse error', ''+err);
            return;
          }
          m2mUtil.monApp.stopMonFS();
          try {
            let client = rxd.file.client;
            let m2m = rxd.file.m2m;
            let pkgFile = rxd.file.package;
            let path = rxd.path;
            if(client && m2m && pkgFile && path){
              fs.writeFileSync(path.client, client);
              fs.writeFileSync(path.m2m, m2m);
              fs.writeFileSync(path.package, pkgFile);
              rxd.active = true;
              rxd.update = 'success';
              restoreCtk();
              if(m2mUtil.getRestartStatus()){
                rxd.restartable = true;
              }
              delete rxd.file;delete rxd.code;
              emitter.emit('emit-send', rxd);
              dm.logEvent('m2m module updated', 'v'+rxd.ver);

              if(rxd.restartable){
                setTimeout(() => {
                  fs.writeFileSync('node_modules/m2m/mon', 'm2m module update');
                }, 1000);
              }
            }
          }
          catch (err) {
           dm.logEvent('m2m module update error', err);
           console.log('m2m module update error', err);
          }
        }
      });
    }
  }
  setModuleUpdateListener();
  
  function validateUserOptions(args){
    try{
      if(args && typeof args !== 'object'){
         throw new Error('invalid arguments');
      }
      // m2mConfig
      if(args.m2mConfig && args.m2mConfig.code && typeof args.m2mConfig.code === 'object' && args.m2mConfig.code.allow && args.m2mConfig.code.filename){
        if(args.m2mConfig.code.filename.length > 30){
          throw new Error('code filename is more than the maximum of 30 characters long');
        }
      }
      if(args.m2mConfig && args.m2mConfig.code && typeof args.m2mConfig.code !== 'object'){
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
      dm.logEvent('validateUserOptions() error', args , JSON.stringify(e));
      throw e;
    }
  }

  // additional options setup
  function UserProcessSetup(pl){
    // options validation check
    validateUserOptions(pl.options);
  }

  /**
   * set m2m package.json configuration (auto config)
   */
  function setPkgConfig(pl){
    let pkgjsn = {}, pkgjsnCopy = null, startScript = null, startScriptDelay = 2000;
    let filename = processFilename, m2mConfig = false, nodemonConfig = false, pkgScript = false;
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
      pkgjsnCopy = fs.readFileSync('package.orig.json');
    }
    catch(e){
      if(e.code === 'MODULE_NOT_FOUND'){
        // console.log('No package.json found.');
        pkgjsn['name'] = "m2m-application";
        pkgjsn['version'] = "1.0.0";
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
      //backup existing package.json once
      if(e.code === 'ENOENT' && e.path === 'package.orig.json'){
        fs.writeFileSync('package.orig.json', JSON.stringify(pkgjsn, null, 2));
      }
    }
    finally{
      console.log('\nConfiguring your package.json for code editing and auto-restart ...\n');
      if(pkgjsn){
        if(!pkgjsn.name){
          pkgjsn['name'] = "m2m-application";
        }
        if(!pkgjsn.version){
          pkgjsn['version'] = "1.0.0";
        }
      }
      // update m2m dependency to latest
      if(pkgjsn && pkgjsn['dependencies']){
        pkgjsn['dependencies'].m2m = "^" + m2mv.version;
      }
      else{
        pkgjsn['dependencies'] = {"m2m":"^" + m2mv.version};
      }
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
      // setup devDependencies & test script
      if(processArgs[1] === '-test'){
        if(pkgjsn['devDependencies']){
          pkgjsn['devDependencies'].mocha = "^8.0.1";
          pkgjsn['devDependencies'].nyc = "^15.1.0";
          pkgjsn['devDependencies'].sinon = "^9.0.2";
        }
        else{
          pkgjsn['devDependencies'] = {"mocha": "^8.0.1", "nyc": "^15.1.0", "sinon": "^9.0.2"};
        }
        pkgjsn['scripts'].test = "nyc --reporter=html --reporter=text mocha --throw-deprecation node_modules/m2m/test/*.test.js";
      }
      pkgScript = true;

      // create package.json
      fs.writeFileSync('package.json', JSON.stringify(pkgjsn, null, 2));
      // package.json validation check
      if(!m2mConfig||!nodemonConfig||!pkgScript){
        console.log(colors.brightRed('Configuration fail') + '.' + ' Please configure your package.json manually.');
      }
      else{
        console.log(colors.brightGreen('Configuration done.'));
        if(pkgjsn){
          console.log('\nPlease verify the changes in your package.json.');
        }
        if(pkgjsnCopy){
          console.log('\nYou can revert to your original existing package.json\nusing the backup copy('+colors.brightGreen('package.orig.json')+').');
        }
        console.log('\nYou can now restart your application using', colors.brightGreen('npm start')+'.\n');
      }
      //setImmediate(process.exit);
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

        if(options && pl.options){
          options = pl.options;
        }
      }
    }
    catch(e){
      if(e.code == 'MODULE_NOT_FOUND'){
        //console.log('no package.json found ...');
      }
    }
  }

  function responseTimeout(){
    serverTimeout = setTimeout(() => {
      console.log('There was no response from the server.\nEither the server is down or you are connecting to an invalid server.\n' );
      process.kill(process.pid, 'SIGINT');
    }, serverResponseTimeout);
  }

  function getCK(kt, cb){
    let ws = null;
    let server = websocket.getCurrentServer();
    tp.v = crypto.createVerify('SHA256');tp.v.update(m2mUtil.defaultNode);tp.v.end();
    rkpl._pid = kt;
    rkpl.node = m2mUtil.defaultNode;
    responseTimeout();
    let s = server.replace('https', 'wss');
    if(server){
      try{
        ws =  new _WebSocket(s + "/ckm", {origin:server});
      }
      catch(e){
        dm.logEvent('getCK invalid server error', JSON.stringify(e));
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
          dm.logEvent('getCK ws open send error', JSON.stringify(e));
          return console.log('getCK send error', e);
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
          dm.logEvent('getCK ws message error', JSON.stringify(e));
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
      dm.logEvent('setTmpKey() error', JSON.stringify(e));
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
      m2m.be = Buffer.from(user.be).toString('base64');
      if(cb){
        process.nextTick(cb, null, m2m);
      }
    }
    catch(e){
      dm.logEvent('encryptUser() error', JSON.stringify(e));
      if(cb){
        return cb(e, null);
      }
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
        dm.logEvent('ckSetup() error', JSON.stringify(e));
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
        dm.logEvent('encryptData() error', JSON.stringify(e));
      }
    });
  }

  function authenticate(args, user, m2m, cb){
    let uv = null, pv = null;
    let invalidCredential = 'One of your credentials is invalid';

    if(user.name && user.password){
      uv = user.name.search(usridvdn.regex);
      pv = user.password.search(pwvdn.regex);
      
      if(user.name.length < 5 || user.name.length > 50){
        throw new Error('Userid must be 5 characters minimum and 50 characters maximum.');
      }

      if(user.password.length < 8 || user.password.length > 50){
        throw new Error('Password must be 8 characters minimum and 50 characters maximum.');
      }
      
      if(uv !== 0||pv !== 0||user.sc.length !== 4){
        throw new Error(invalidCredential);
      }
    }

    user.be = JSON.stringify({u:user.name,p:user.password,s:user.sc}); 
    
    setTimeout(() => {
      encryptUser(user, m2m, (err, m2m) => {
        if(err) {
          dm.logEvent('authenticate encryptUser() error', JSON.stringify(err));
          throw err;
        }
        websocket.connect(args, m2m, cb);
        //http.connect(args, m2m, cb);
      });
    }, 1000);
  }

  function userPrompt(args, m2m, cb){

    let promptMsg = '\nPlease provide your credentials ...\n';

    if(m2m.app){
      let clientActiveLink = dm.getClientActiveLinkData(), match = false;
      for (let i = 0; i < clientActiveLink.length; i++) {
        if(clientActiveLink[i] && clientActiveLink[i] === m2m.appId){
          match = true;
        }
      }
      if(!match){
        dm.trackClientId(m2m.appId);
      }
    }

    if((m2m._pid ==='r-a'||m2m._pid === 'r-d') && (m2m.reg||m2m.nsc)){
      if(m2m.device){
        m2m._pid = 'd-c';
      }
      if(m2m.app){
        m2m._pid = 'a-c';
      }
    }

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
          return cb('success');
        }
      }
    }

    const validate_userid = (value) => {
      if (value.search(usridvdn.regex) < 0) {
        return usridvdn.msg;
      }
      return true;
    };

    const validate_password = (value) => {
      if (value.search(pwvdn.regex) < 0) {
        return pwvdn.msg;
      }
      return true;
    };

    const validate_sc = (value) => {
      if(value.length !== 4){
        return 'Invalid security code';
      }
      return true;
    };

    let s = getOpStat();

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

    schema.push({
      type: 'password',
      message: 'Enter your security code:',
      name: 'sc',
      mask: '*',
      validate: validate_sc
    });

    if(!m2m.tkUpdate && m2m.uid && processArgs[0] !== '-r' && (s.sc < 6 || s.sc === undefined)){
      promptMsg = '\nPlease provide your credential ...\n';  
      schema = [{
        type: 'password',
        message: 'Enter your security code:',
        name: 'sc',
        mask: '*',
        validate: validate_sc
      }];
    }   

    console.log(promptMsg);

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
        dm.logEvent('decSC() error', JSON.stringify(e));
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

  function setDefaultServer(args){
    if(args && typeof args === 'object'){
      if(args && args.server){
        m2mUtil.defaultNode = args.server;
      }
    }
    else if(args && typeof args === 'string'){
      m2mUtil.defaultNode = args; 
    }
  }

  function m2mStart(args, m2m, cb){
    let user = {};
    m2m._sid = 'm2m';
    m2m.tid = Date.now();

    setDefaultServer(args);
    websocket.setServer(args);

    if(m2m.app){
      if(!m2m.appIds){
        let appIds = dm.trackClientId(m2m.appId);
        m2m.appIds = JSON.parse(appIds);
      }
    }

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
          return cb('success');
        }
      }
    }

    getCK('dck', (err, ck) => {
      if(err) {
        dm.logEvent('getCK()', JSON.stringify(err));
        throw err;
      }
      if(ck.puk && ck.sk){
        setTmpKey(tp, ck);
        if(m2m.nsc||m2m.reg){
          crypto.pbkdf2(tp.csec, tp.slt2 , tp.rnd, 32, 'sha256', (err, dkey) => {
          if (err) throw err;
            tp.cipkey2 = dkey;
          });
          sd = tp;
        }
      }

      if(processArgs[0] !== '-r' && args && typeof args === 'object' && args.userid){
        console.log('current user:', args.userid, '\n');
      }

      if(args && typeof args === 'object'){
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
            return cb('success');
          }
        }
      }
      userPrompt(args, m2m, cb);
    });
  }

  function connectToServer(args, m2m, data, clientActiveLink, cb){
    if(m2m.app && data.id && typeof data.id === 'number'){
      console.log('Application has changed from device to client, please register your new client.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.app && data.appId && data.appId !== m2m.appId){
      console.log('Client id has changed from',data.id,'to',m2m.id, 'please register your new client.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.app && clientActiveLink && clientActiveLink.length > 0){
      let match = false, activeLinkId = null;
      for (let i = 0; i < clientActiveLink.length; i++) {
        if(clientActiveLink[i] && clientActiveLink[i] === data.appId){
          match = true; activeLinkId = data.appId;
        }
      }
      if(!match){
        console.log('\nClient id has changed, please register your new client.');
        return m2mStart(args, m2m, cb);
      }
    }
    else if(m2m.device && data.id && typeof data.id === 'string'){
      console.log('Application has changed from client to device, please register your new device.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.device && data.id && data.id !== m2m.id){
      console.log('Device id has changed from',data.id,'to',m2m.id, 'please register your new device.');
      return m2mStart(args, m2m, cb);
    }
    else if(m2m.device && !data.id){
      console.log('Registering new device.\n');
      return m2mStart(args, m2m, cb);
    }
    //websocket.connect(args, data, cb);
    process.nextTick(websocket.connect, args, data, cb);
  }

  function m2mRestart(args, m2m, cb){
    try{
      let p = null;
      if(m2mTest.option.enabled){
      	p = m2mTest.secTest(m2m);
      }
      else{
        p = parseCtk();
      }
      
      setDefaultServer(args);
      websocket.setServer(args);

      let clientActiveLink = null, tk = fs.readFileSync(p, 'utf8'), data = JSON.parse(Buffer.from(tk, 'base64').toString('utf8'));

      if(m2m.app){
        clientActiveLink = dm.getClientActiveLinkData();
      }

      if(m2mTest.option.enabled && m2m.mid){
        delete data.id;
      }
      setImmediate(() => {
        connectToServer(args, m2m, data, clientActiveLink, cb);
      });
    }
    catch(e){
      try{
        let rtk = fs.readFileSync(m2mUtil.secTkn.getRtk(), 'utf8'), spl = JSON.parse(Buffer.from(rtk, 'base64').toString('utf8')); 
        let pl = Object.assign({}, spl);
        m2mStart(args, pl, cb);
      }
      catch(e){
        m2mStart(args, m2m, cb);
      }
    }
  }

  function m2mStartHCF(args, m2m, cb){
    let hcf = null, user = {};
    try{
      hcf = fs.readFileSync('m2mConfig/auth/hcf', 'utf8');
      if(hcf){
        m2m.uid = m2mUtil.rid(16); 
        m2m._sid = 'm2m';
        m2m._pid = 'hcf';
        m2m.hcf = hcf;
        setImmediate(() => { 
          websocket.connect(args, m2m, cb);
        });
        return hcf;
      }
    }
    catch(e){
      if(e.code === 'ENOENT'){
        //console.log('no hcf');
      }
      return hcf;
    }
  }

  let ctk = {
    getCtk: getCtk,
    setCtk: setCtk,
    readCtk: readCtk,
    restoreCtk: restoreCtk,
    restartCtk: restartCtk,
  }

  let status = {
    setEnableStatus: setEnableStatus,
    getEnableStatus: getEnableStatus,
    getEndpointStatus: getEndpointStatus,
  }

  let eventLog = {
    clearEventLog: clearEventLog,
    uploadEventLog: uploadEventLog,
  }

  let cli = {
    eCli: eCli,
    aCli: aCli,
    clearCliLog: clearCliLog,
    uploadCliLog: uploadCliLog,
    getBrCliStore: getBrCliStore,
  }

  let appCode = {
    setSysCfg: setSysCfg,
    uploadCode: uploadCode,
    updateCode: updateCode,
  }

  let m2mApp = {
    suspend: suspend,
    m2mStart: m2mStart,
    m2mRestart: m2mRestart,
    autoRestart: autoRestart,
    m2mStartHCF: m2mStartHCF,
    secureSystem: secureSystem,
    restartProcess: restartProcess,
    getUserResources: getUserResources,
  }

  return  {
    cli: cli,
    ctk: ctk,
    decSC: decSC,
    m2mApp: m2mApp,
    status: status,
    appCode: appCode,
    eventLog: eventLog,
    getOpStat: getOpStat,
    setOpStat: setOpStat,
    userPrompt: userPrompt,
    getPkgConfig: getPkgConfig,
    setPkgConfig: setPkgConfig,
    validateUserOptions: validateUserOptions,
  }
})(); // sec


/************************************************

            WEBSOCKET CLIENT OBJECT

 ************************************************/
/* istanbul ignore next */
const websocket = exports.websocket = (() => {
  let clientRxEventName = null, connectOption = null, THRESHOLD = 1024;
  let dogTimer = null, server = m2mUtil.defaultNode, dogTimerInterval = 3600000*4; 
  let rxd = {}, ws = null, reg = false, clientActive = 0, registerAttempt = 0, wsConnectAttempt = 0 , reconnectStatus = null;

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
    let randomInterval = null;
    if(m2m.device){
      randomInterval = Math.floor((Math.random() * 5000) + 1000); // wait 1000 to 6000 ms
    }
    else{
      randomInterval = Math.floor((Math.random() * 10000) + 7000); // wait 7000 to 17000 ms
    }  
    if(e === 1006 || e === 1003){
      if(wsConnectAttempt === 0){
        console.log('Server', colors.brightBlue(server),'is not ready.\nAttempt to reconnect 1 ...');
      }
      if(wsConnectAttempt === 1){
        console.log(colors.brightRed('There is no response from server'), '\nAttempt to reconnect 2 ...');
      }
      if(wsConnectAttempt === 2){
        console.log(colors.brightRed('Cannot establish connection with the server'));
      }
      if(wsConnectAttempt === 3){
        console.log('Waiting for the server to be up and running ...');
        console.log(colors.green('Attempt to reconnect will continue in the background'));
        dm.logEvent('server', server ,'is not ready', 'Error('+ e + ').');
      }
      sec.ctk.restoreCtk();
      m2m = sec.ctk.readCtk();
      m2mUtil.monApp.stopMonFS();

      if(m2mUtil.getRestartStatus()){
        //console.log('restart npm ...');
      }
      else{
        //console.log('reconnect m2m ...');
      }

      reconnectStatus = true;
      
      if(m2m.device){
        //device.resetSystem();
        device.stopEventWatch();
        m2mUtil.monApp.closeAllWatcher();
        dm.resources.stopMonitorAccessRate();
      }
      else if(m2m.app){
        //client.resetSystem();
      }
 
      let timeout = setTimeout(connect, randomInterval, args, m2m, cb);
      /*let timeout = setTimeout(() => {
        connect(args, m2m, cb);
      }, randomInterval);*/

      wsConnectAttempt++;
      if(m2mTest.option.enabled) {
        clearTimeout(timeout);
        if(cb){
          return cb('success');
        }
      }
    }
  }

  function dogTimerProcess(){
    if(ws.readyState === 1){
      refreshConnection();
      dogTimer = setTimeout(dogTimerProcess, dogTimerInterval);
    }
    else if(m2mTest.option.enabled) {
      clearTimeout(dogTimer);
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
        dm.logEvent('refreshConnection()', ''+e);
        console.log('refreshConnection error', e);
        if(test){
          throw 'test';
        }
      }
    }
  }

  function setDogTimer(){
    let rn = Math.floor(( Math.random() * 60000) + 20000);
    dogTimerInterval = dogTimerInterval + rn;
    setTimeout(dogTimerProcess, dogTimerInterval);
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
    setDogTimer();
    dm.logEvent('communication socket', '- open and active');
  }

  let pc = true;
  function processExitEvent(pl){
    let eventName = 'exit-process';
    if(emitter.listenerCount(eventName) < 1){
      emitter.once(eventName, (data) => {
        if(pc){
          processOnExit(pl);
          pc = false;
        }
      });
    }
  }

  function processOnExit(pl){
    const msg = 'process exited ('+process.pid+')';
    dm.logEvent(msg, '');
    ws.send(JSON.stringify(pl));
    if(spl.device){
      device.exit.gpioExitProcess();
    }
    m2mUtil.monApp.stopMonFS();
    m2mUtil.monApp.stopMonUsrApp();
    //console.log('\n'+msg+'\n');
  }

  function exitEventProcess(){
    delete spl.options;delete spl.systemInfo;delete spl.userSettings;delete spl.sconfig;
    delete spl.ctk;delete spl.tid;delete spl.ak;delete spl.reg;delete spl.restartable;
    let pl = Object.assign({}, spl);pl._pid = 'exit';pl.exit = true;pl.active = false;
    processExitEvent(pl);
    process.on('exit', () => {
      //console.log(`\nProcess exited (${process.pid})\n`);
      console.log('');
    });
    process.on('SIGINT', (s) => {
      //console.log(`SIGINT process pid ${process.pid}`, pc);
      emitter.emit('exit-process');
      setTimeout(() => {
        process.exit();
      }, 100);
    });
  }

  function reconnectProcess(rxd){
    rxd.active = true;
    emitter.emit('emit-connect', 'reconnect process');
    rxd.result = 'success';
    dm.logEvent('process', '- reconnection success');
    emitter.emit('emit-send', rxd);
  }

  function commonRxData(rxd){
    if(rxd.restart){
      return sec.m2mApp.restartProcess(rxd);
    }
    else if(rxd.status){
      return sec.status.getEndpointStatus(rxd);
    }
    else if(rxd.secureSystem){
      return sec.m2mApp.secureSystem(rxd);
    }
    else if(rxd.updateCode){
      return sec.appCode.updateCode(rxd);
    }
    else if(rxd.uploadCode){
      return sec.appCode.uploadCode(rxd);
    }
    else if(rxd.uploadEventLog){
      return sec.eventLog.uploadEventLog(rxd);
    }
    else if(rxd.clearEventLog){
      return sec.eventLog.clearEventLog(rxd);
    }
    else if(rxd.uploadCliLog){
      return sec.cli.uploadCliLog(rxd);
    }
    else if(rxd.clearCliLog){
      return sec.cli.clearCliLog(rxd);
    }
    else if(rxd.scli){
      return sec.cli.eCli(rxd);
    }
    else if(rxd.acli){
      return sec.cli.aCli(rxd);
    }
    else if(rxd.acid){
      return sec.appCode.setSysCfg(rxd);
    }
    else if(rxd.monAppCode){
      //return sec.appCode.monAppCode(rxd);
      return sec.appCode.setSysCfg(rxd);
    }
    else if(rxd.suspend){
      return sec.m2mApp.suspend(rxd);
    }
    else if(rxd.getUserResources){
      return sec.m2mApp.getUserResources(rxd);
    }
    else if(rxd.startAccessRateMonitor||rxd.stopAccessRateMonitor){
      return sec.m2mApp.getUserResources(rxd);
    }
  }

  /*****************************************

  		Device Received Data Router (rxd)

  ******************************************/
  function DeviceRxData(rxd){
    try{
      if(rxd.device && rxd.dstId && rxd.error){
        console.log('channel', rxd.name, rxd.error);
        return; 
      }
      if(rxd && rxd.id && rxd.id !== spl.id) {
        if(m2mTest.option.enabled) {
          throw 'invalid id';
        }
        dm.logEvent('DeviceRxData invalid id', rxd.id, spl.id);
        return;
      }
      if(rxd.exit){
        return device.exit.deviceExitProcessFromClient(rxd);
      }
      else if(rxd.channel || rxd.name){
        if(rxd.event){
          return device.channel.watchChannelData(rxd);
        }
        else if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        else if(rxd.src === 'device' && rxd.result){
          //let eventName = rxd.id + rxd.name + rxd.eventId;
          let eventName = rxd.dstId + rxd.name + rxd.event + rxd.watch + rxd.unwatch + rxd.method;
          return emitter.emit(eventName, rxd);
        } 
       	return device.channel.getChannelDataEvent(rxd);
      }
      else if(rxd.gpioInput || rxd.input){
        if(rxd.event){
          if(device.input.getGpioInputSetup()){ // rpi
            return device.input.GetGpioInputState(rxd);
          }
          return device.input.watchGpioInputState(rxd);
        }
        if(rxd.unwatch){
          if(device.input.getGpioInputSetup()){ // rpi
            return device.input.GetGpioInputState(rxd);
          }
          return device.unwatchDeviceEvent(rxd);
        }
        return device.input.GetGpioInputState(rxd);
      }
      else if(rxd.gpioOutput || rxd.output){
        if(rxd.event){
          if(device.output.getGpioOutputSetup()){
            return device.output.GetGpioOutputState(rxd);
          }
          return device.output.watchGpioOutputState(rxd);
        }
        if(rxd.unwatch){
          return device.unwatchDeviceEvent(rxd);
        }
        return device.output.GetGpioOutputState(rxd);
      }
      else if(rxd.deviceSetup){
        return device.getDeviceSetup(rxd);
      }
      commonRxData(rxd);
    }
    catch(e){
      if(e && m2mTest.option.enabled){
        throw e;
      }
      dm.logEvent('DeviceRxData error:', e);
    }
  }

  /******************************************

      Client Received Data Router (rxd)

  *******************************************/
  function ClientRxData(rxd){
    try{
      if(rxd.activeStart){
        return client.device.clientDeviceActiveStartProcess(rxd);
      }
      else if(rxd.exit){
        return client.device.clientDeviceOffLineProcess(rxd);
      }
      else{
        commonRxData(rxd);
      }

      if(rxd.channel || rxd.name || rxd.api){
        clientRxEventName = rxd.id + rxd.name + rxd.event + rxd.watch + rxd.unwatch + rxd.method;
        //clientRxEventName = rxd.id + rxd.name + rxd.eventId;
      }
      else if(rxd.gpioInput || rxd.input){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
        //clientRxEventName = rxd.id + rxd.pin + rxd.eventId;
      }
      else if(rxd.gpioOutput || rxd.output){
        clientRxEventName = rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
        //clientRxEventName = rxd.id + rxd.pin + rxd.eventId;
      }
      else if(rxd.deviceSetup){
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
      dm.logEvent('ClientRxData error:', e);
    }

    if(processArgs[0] === '-s'){
      setTimeout(() => {
        process.exit();    
      }, 300);
    }

  }

  function startAutoConfig(){
    if(m2mUtil.getRestartStatus()){
      return;
    } 
    //console.log('startAutoConfig ...');
    try{ 
      if(Object.keys(options).length == 0){
        sec.setPkgConfig({});
      }
      if(Object.keys(options).length > 0){
        if(options.m2mConfig && options.processFilename && options.nodemonConfig && options.startScript){
          //console.log('already configured');
        }
        else{  
          //console.log('incomplete configuration, setPkgConfig');
          sec.setPkgConfig({});
        }
      }
      spawnSync('npm i nodemon', {stdio:null, shell:true});
      //spawnSync('npm', ['i', 'nodemon'], {stdio:null});
      spawnSync('npm start', {stdio:'inherit', shell:true});
      //spawnSync('npm', ['start'], {stdio:'inherit'});
      dm.logEvent('startAutoConfig initiated', processArgs[0]);
    }
    catch(e){
      console.log('startAutoConfig', e);
    }
  }

  function setCfgOption(rxd){
    let sc = m2mUtil.systemConfig.getSystemConfig();
    if(Object.keys(sc).length > 0){
      //console.log('rxd.fim', Object.hasOwn(rxd, 'fim'));
      //if(rxd.fim === true||rxd.fim === false ){
      if(Object.hasOwn(rxd, 'fim')){
        if(rxd.fim){
          sc.monCode = true;sc.eAlert = true;sc.activeRes = true;
        }
        else{
          sc.monCode = false;sc.eAlert = false;sc.activeRes = false;
        }
      }
      //console.log('rxd.zta', Object.hasOwn(rxd, 'zta'));
      //if(rxd.zta === true||rxd.zta === false ){
      if(Object.hasOwn(rxd, 'zta')){
        sc.zta = rxd.zta;
      }

      if(sc.monCode){
        m2mUtil.monApp.monFS();
        m2mUtil.monApp.monUsrApp(require.main.filename);  
      } 
      if(sc.otherConfig){
        // execute otherConfig
      }
    }

    setImmediate(() => {
      m2mUtil.systemConfig.setSystemConfig(sc);
    });
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
      else if(rxd.code === 10 && rxd.reason === 'open-test'){
        return;
      }
      else if(rxd.code === 100 || rxd.code === 101 || rxd.code === 102){
        sec.ctk.setCtk(rxd.path, rxd.data);
        dm.logEvent('register', rxd.code, rxd.reason);
        delete rxd.ctk;delete rxd.code;delete rxd.appData;delete rxd.path;delete rxd.data;
        registerAttempt = 0;init(true);spl = Object.assign({}, rxd);
        if(clientActive === 1){
          exitEventProcess();
        }
        if(rxd.user){
          return emitter.emit('emit-connect', rxd.reason);
        }
        return connect(args, rxd, cb);
      }
      else if(rxd.code === 110){
        if(rxd.data && !rxd.error){
          sec.ctk.setCtk(rxd.path, rxd.data);
          dm.logEvent('token update', 'success');
          delete rxd.code;delete rxd.path;delete rxd.data;
        }
        else{
          dm.logEvent('token update fail', rxd.error );
        }
        registerAttempt = 0;init(true);spl = Object.assign({}, rxd); 
        sec.ctk.readCtk()
        if(m2m.device){
          device.resetDeviceSetup();
          device.stopEventWatch();
          setImmediate(() => {
            connect(args, spl, cb);
          });
        }
        return;
      }
      else if(rxd.code === 150 ){
        return emitter.emit('m2m-module-update', rxd);
      }
      else if(rxd.code === 200 || rxd.code === 210 || rxd.code === 220){
        if(reconnectStatus){
          //console.log('server lost connection, attempt to restart the process');
          reconnectStatus = null;
          if(m2mUtil.getRestartStatus()){
            //console.log('restart npm');
            return sec.m2mApp.autoRestart();
          }
          //console.log('reconnecting ...');
        }
        //console.log('rcvd rxd config', rxd); 
        sec.ctk.restoreCtk();sec.setOpStat({});
        registerAttempt = 0;
        init(true);

        if(clientActive === 1){
          exitEventProcess();
        }

        setCfgOption(rxd);        

        dm.logEvent('reconnection -', rxd.reason, '('+rxd.code+')');
        if(m2m.app){
          dm.resources.stopDeviceAccess();
          setImmediate(client.device.validateAccessDevices, rxd);
        }
        if(m2m.user){
          return emitter.emit('emit-connect', rxd.reason);
        }
        if(cb){
          emitter.emit('emit-connect', rxd.reason);
          //cb(rxd.reason); // same as above
        }
        if(!cb){
          console.log('connection:', rxd.reason);
        }
        if(m2m.device){ 
          runActiveProcess();
          setImmediate(dm.resources.startMonitorAccessRate);
        }  
        return;
      }
      else if(rxd.code === 300){
        if(rxd.aid === m2m.aid && rxd.uid === m2m.uid && rxd.ak === m2m.ak){
          registerAttempt = 0;
          init(true);
          return connect(args, m2m, cb);
        }
      }
      else if(rxd.code === 500 || rxd.code === 510 || rxd.code === 520){
        if(clientActive > 1 && registerAttempt < 3 ){
          registerAttempt++;
          console.log('server is ready, attempt', registerAttempt);
          setTimeout(function(){
            connect(args, m2m, cb);
          }, (registerAttempt-1)*100);
        }
        else{
          init(false);
          if(m2mTest.option.enabled){
            if(cb){
              return cb(rxd.reason);
            }
          }
          if(rxd.code === 500){
            let stat = sec.getOpStat();
            stat.sc++;
            dm.logEvent('auth fail', rxd.code, rxd.reason);
            sec.setOpStat(stat);
          }
          dm.logEvent('auth fail', rxd.code, rxd.reason);
          setTimeout(() => process.kill(process.pid, 'SIGINT'), 100);
          if(cb && cb.length > 0){
            cb(rxd.reason);
          }
          else{
            console.log(rxd.reason);
          }
        }
      }
      else if(rxd.code === 530){
        init(false);
        console.log('\nresult:', rxd.reason);
        console.log('Device id ' + spl.id + ' is not valid or is not registered. \n');
        dm.logEvent('Device id ' + spl.id + ' is not valid or is not registered.', rxd.code, rxd.reason);
        if(m2mTest.option.enabled) {
          if(cb){
            return cb(rxd.reason);
          }
        }
        process.kill(process.pid, 'SIGINT');
      }
      else if(rxd.code === 600){
        init(false);
        console.log('\nresult: success');
        if(rxd.reason){
          if(m2mTest.option.enabled){
            if(cb){
              return cb(rxd.reason);
            }
          }
          sec.decSC(rxd, (err, data)=> {
            if(err) return console.error(err);
            console.log(rxd.reason+':', data, '\n');
            dm.logEvent('renew security code', 'success', rxd.code);
            process.kill(process.pid, 'SIGINT');
          });
        }
      }
    }
    catch(e){
      if(m2mTest.option.enabled){
        throw e;
      }
      dm.logEvent('initRxData error:', e);
    }
  }

  // startup connect payload option 
  function connectPayloadOption(args, m2m){
    if(Object.keys(options).length > 0){
      m2m.options = options;
    }
    let sc = m2mUtil.systemConfig.getSystemConfig();
    if(sc){
      m2m.sconfig = sc;
      if(sc.enable === false){
        m2m.enable = false;
        sec.status.setEnableStatus(false);
        if(m2m._pid === 'r-a' || m2m._pid === 'r-d'){
          setTimeout(() => {
            if(spl.device){
              console.log('\nDevice is disabled\n');
            }
            else{
              console.log('\nClient is disabled\n');
            }
          }, 1000);
        }
      }
      else{
        m2m.enable = true;
        sec.status.setEnableStatus(true);
      }
    }
    else{
      let sc = {id:m2m.id, src:m2m.src, monCode:true, eAlert:false, activeRes:false, enable:true};
      m2mUtil.systemConfig.setSystemConfig(sc);
    }
 
    if(m2m.device){
      device.resetWatchData();
    }

    m2m.systemInfo = m2mUtil.systemConfig.systemInfo;
    
    if(m2mUtil.getRestartStatus()){
      m2m.restartable = true;
    }
    else{
      m2m.restartable = false;
    }

    if(m2m && clientActive === 0){
      spl = Object.assign({}, m2m);
      console.log('\nConnecting to remote server ...\n');  
    }

    if(m2mTest.option.enabled) {
      if(cb){
        if(m2m.error){
          return cb(new Error(m2m.error));
        }
        return cb('success');
      }
    }
  }

  // startup handshake connection 
  function connect(args, m2m, cb){
    m2mUtil.st();

    args = setServer(args);

    if(ws){
      ws.close();
    }

    if(m2m._pid === 'd-c' || m2m._pid === 'r-d'){
      if(m2m.device){
        //console.log('connect device');
      }
      else{
        //console.log('connect client');
      }
    }

    connectPayloadOption(args, m2m);
        
    let s = server.replace('https', 'wss');

    try{
      ws = new _WebSocket(s + "/m2m", {origin:server});
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
            if(rxd.code){   
              initRxData(rxd, args, m2m, cb);
            }
            else if(m2m.device){
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
        dm.logEvent('ws.on(message) JSON.parse error:', e.message);
      }
    });

    ws.on("close", (e) => {
      clearTimeout(dogTimer);
      wsReconnectAttempt(e, args, m2m, cb);
    });

    ws.on("error", (e) => {
      if(e.code === 'ENOTFOUND'){
        console.log('server is not responding ...\nPlease ensure you area connecting to a valid server.\n');
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

  function setEmitSendListener(){
    let eventName = 'emit-send';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        if(!data.src){
          throw new Error('invalid data.src');
        }
        if(!data.dst){
          throw new Error('invalid data.dst');
        }
        if(data.src === 'device-as-client'){
          data.dst = data.src;
          data.src = 'device';
        }
        if(data.src === 'client' || data.src === 'browser' ){
          data.dst = data.src;
        }
        if(data.src === 'browser-client'){
          data.dst = data.src;
        }
        if(spl.device){
          data.src = 'device';
        }
        if(spl.app){
          data.src = 'client';
        }
        data.response = true;
        send(data);
      });
    }
  }
  setEmitSendListener();

  return {
    init:init,
    send: send,
    connect: connect,
    getInit: getInit,
    initCheck: initCheck,
    setServer: setServer,
    setSocket: setSocket,
    initRxData: initRxData,
    DeviceRxData, DeviceRxData,
    ClientRxData, ClientRxData,
    currentSocket: currentSocket,
    getCurrentServer: getCurrentServer,
    refreshConnection: refreshConnection,
    getConnectionOptions: getConnectionOptions
  }

})(); // websocket

/*****************************************

              http OBJECT

 *****************************************/
/* istanbul ignore next */
const http = exports.http = (() => {
  let Https = require('https');
  let port = 443, hostname = null;
  let auid = m2mUtil.rid(12); 

  try{
    let n = m2mUtil.defaultNode.search("node-m2m");
    if(n === -1){
      Https = require('http');
      port = 3000;
    }
    else{
      port = 443;
    }
  }
  catch(e){
    dm.logEvent('http()', JSON.stringify(e));
    console.log('invalid hostname', e);
  }

  function getRequest(Https, options, cb){
    const req = Https.request(options, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        d += chunk;
      });
      res.on('end', () => {
        if(cb){
          try{
            cb(JSON.parse(d));
          }
          catch(e){
            cb('invalid received JSON data, ' + e.message);
          } 
        }
      });
    });

    req.on('error', (e) => {
      console.error(`http get request error: ${e.message}`);
      dm.logEvent('http get request error', e.message);
    });

    req.end();
  }

  function postRequest(Https, options, data, cb){
    const req = Https.request(options, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        d += chunk;
        //process.stdout.write(d);
      });
      res.on('end', () => {
        if(cb){
          try{
            cb(JSON.parse(d));
          }
          catch(e){
            cb('invalid received JSON data, ' + e.message);
          } 
        }
      });
    });

    req.on('error', (e) => {
      console.error(`http post request error: ${e.message}`);
      dm.logEvent('http post request error', e.message);
    });

    // post body
    req.write(data);
    req.end();
  }
  

  // for test only
  // e.g. client.getTest('/m2m/usr/http-get', (data) => {})
  function getTest(path, cb){
    let url = new URL(m2mUtil.defaultNode);

    const options = {
      hostname: url.hostname, //m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }
    getRequest(Https, options, cb);
  }

  // for test only
  // e.g. client.postTest('/m2m/usr/http-post', {name:'ed', age:35}, (data) => {}) 
  function postTest(path, body, cb){
    let url = new URL(m2mUtil.defaultNode);
    let data = JSON.stringify(body);

    const options = {
      hostname: url.hostname, //m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }
    postRequest(Https, options, data, cb);
  }

  function getApi(o, cb){
    let tkn = '', apiKey = '';
    let url = new URL(m2mUtil.defaultNode); 

    if(!o.id){
      return cb('missing deviceId');
    }
    if(!o.path){
      return cb('missing http path');
    }
    if(o.tkn){
      tkn = o.tkn;
    }
    if(o.apiKey){
      apiKey = o.apiKey;
    }

    const options = {
      hostname: url.hostname, // m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: '/custom-api/'+auid+'?path='+o.path+'&id='+o.id,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ tkn,
        'X-API-Key': apiKey,
        'x-spl': JSON.stringify(spl),      
      }
    }
    getRequest(Https, options, cb);
  }

  function postApi(o, cb){
    let tkn = '', apiKey = '', body = null;
    let url = new URL(m2mUtil.defaultNode);

    if(!o.id){
      return cb('missing deviceId');
    }
    if(!o.path){
      return cb('missing http path');
    }
    if(!o.body){
      return cb('missing post body');
    }
    if(o.tkn){
      tkn = o.tkn;
    }
    if(o.apiKey){
      apiKey = o.apiKey;
    }  

    if(o.body && typeof o.body === 'object'){
      body = JSON.stringify(o.body);
    } 
    else if(o.body && typeof o.body === 'string'){
      body = JSON.stringify({data:o.body});
    }

    const options = {
      hostname: url.hostname, //m2mUtil.defaultNode.slice(8, 35), 
      port: port,
      path: '/custom-api/'+auid+'?path='+o.path+'&id='+o.id,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Bearer '+ tkn,
        'X-API-Key': apiKey,
        'x-spl': JSON.stringify(spl),      
      }
    }
    postRequest(Https, options, body, cb);
  }

  function request(o, cb){
    let tkn = '', apiKey = '', method = 'GET', body = null;
    let url = new URL(m2mUtil.defaultNode); 

    if(!o.id){
      return cb('missing deviceId');
    }
    if(!o.path){
      return cb('missing http path');
    }
    if(!o.tkn){
      tkn = spl.appId;
    }
    if(!o.apiKey){
      apiKey = spl.appId;
    }
    if(o.tkn){
      tkn = o.tkn;
    }
    if(o.apiKey){
      apiKey = o.apiKey;
    }

    if(o.body && typeof o.body === 'object'){
      body = JSON.stringify(o.body);
      method = 'POST';
    } 
    else if(o.body && typeof o.body === 'string'){
      body = JSON.stringify({data:o.body});
      method = 'POST';
    }

    const options = {
      hostname: url.hostname, //m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: '/custom-api/'+auid+'?path='+o.path+'&id='+o.id,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+ tkn,
        'X-API-Key': apiKey,
        'x-spl': JSON.stringify(spl),   
      }
    }

    if(method === 'GET'){
      getRequest(Https, options, cb);
    } 
    else if(method === 'POST' && body){
      options.headers['Content-Length'] = Buffer.byteLength(body);
      postRequest(Https, options, body, cb);
    }
  }    

  function connect(m2m, cb){
    let data = JSON.stringify(m2m);
    let path = '/m2m/usr/connect';
    let url = new URL(m2mUtil.defaultNode);

    const options = {
      hostname: url.hostname, //m2mUtil.defaultNode.slice(8, 35),
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }
    postRequest(Https, options, data, cb);
  }

  return  {
    getApi: getApi,
    postApi: postApi,
    request: request,
    connect: connect,
    getTest: getTest,
    postTest: postTest,
  }

})(); // http

/* m2m test option */
/* istanbul ignore next */
const m2mTest = exports.m2mTest = (() => {
  let option = {}, testEmitter = emitter;
  
  let logEvent = dm.logEvent;

  function enable(s) {
    option.enabled = true;
    if(s){
      spl = s;
    }
  }

  function setTestParam(pv) {
    if(pv){
      spl.testParam = pv;
    }
  }

  function secTest(m2m){
    let p = null;
    if(m2m.start){
    	p = 'test/sec/test/start/tk';
    }
    else if(m2m.dtc){
    	p = 'test/sec/device/tk';
    }
    else if(m2m.ctd){
    	p = 'test/sec/client/tk';
    }
    else if(m2m.app){
      p = 'test/sec/client/tk';
    }
    else if(m2m.device){
    	p = 'test/sec/device/tk';
    }
    else if(m2m.restart){
    	p = 'test/sec/test/restart/tk';
    }
    return p;
  }

  return {
    option: option,
    enable: enable,
    secTest: secTest,
    logEvent: logEvent,
    testEmitter: testEmitter,
    setTestParam:setTestParam,
  }

})(); //m2mTest

