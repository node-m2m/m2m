/*!
 * m2m.js
 * v2.3.6
 *
 * Copyright(c) 2020 Ed Alegrid
 *
 */

'use strict';

const colors = require('colors'), os = require('os'); 
const m2mv = require('../package.json'), processArgs = process.argv.slice(2);
const { m2mUtil, dm, sec, http, m2mTest } = require('./client.js');

var pl = {options:{}}, m2mInstance = 0;

if(m2mInstance > 0){
  return;
}

const m2m = {};

/**
 * Server Endpoint
 *
 * usage e.g: const server = new m2m.Server(100);
 */
const Server = m2m.Server = function remoteServer(){
  const { device } = require('./client.js');
  const serverApp = this;
  let arg = null, rpl = sec.ctk.readCtk();

  if(arguments.length === 1 && ( Number.isInteger(arguments[0]) || typeof arguments[0] === 'string' || typeof arguments[0] === 'object' )){
    arg = arguments[0];
  }
  else{
    throw new Error('invalid arguments');
  }

  if(rpl && rpl.device){
    pl = rpl;
  }

  if(arg.toString().length > 9){
    throw new Error('server/device id should not exceed 8 digits');
  }
  else if(Number.isInteger(arg)){
    pl.id = arg;
  }
  else if(typeof arg === 'string'){
    pl.id = parseInt(arg);
  }
  else if(typeof arg === 'object' && typeof arg === 'object' ){
    pl.id = arg.id;
    pl.name = arg.name;
    serverApp.name = arg.name;
  }

  pl.d = true;
  pl.deviceId = pl.id;
  pl.srcId = pl.id;
  pl._pid = 'd-c';
  pl.device = true;
  pl.active = true;
  pl.enable = true;
  pl.src = 'device';

  serverApp.id = pl.id;
  serverApp.server = true;
  serverApp.connect = connect;
  serverApp.on = m2mUtil.errorEvent;

  serverApp.get = device.resources.getApi;
  serverApp.post = device.resources.postApi;
  serverApp.setHttpGet = serverApp.get;
  serverApp.setHttpPost = serverApp.post;

  serverApp.dataSource = device.resources.setDataSource;
  serverApp.publish = device.resources.setPublishData;
  serverApp.pub = device.resources.setPublishData;

  serverApp.setOption = sec.validateUserOptions;
  serverApp.setOptions = serverApp.setOption;

  serverApp.monFile = m2mUtil.monApp.monExtFile;
  serverApp.monitorFile = serverApp.monFile;
  serverApp.monFileSync = m2mUtil.monApp.monExtFileSync;
  serverApp.monitorFileSync = serverApp.monFileSync;

  serverApp.stopMonFile = m2mUtil.monApp.stopMonExtFile;
  serverApp.stopMonitorFile = serverApp.stopMonFile;
  serverApp.stopMonFileSync = m2mUtil.monApp.stopMonExtFileSync;
  serverApp.stopMonitorFileSync = serverApp.stopMonFileSync;

  if(!pl.options){
    pl.options = {};
  }  
}

/**
 * Device Endpoint
 *
 * usage e.g: const device = new m2m.Device(100);
 */
m2m.Device = function remoteDevice(){
  const { device } = require('./client.js');
  const deviceApp = this;
  Server.call(deviceApp, arguments[0]);
  
  deviceApp.device = true;
  deviceApp.setGpio = device.resources.setGpio;
  deviceApp.setGpioData = deviceApp.setGpio;  
}

/**
 * Client Endpoint
 * 
 * usage e.g: const client = new m2m.Client();
 */
m2m.Client = function remoteClient(arg){
  const { client } = require('./client.js');
  const clientApp = this;
  let appIds = null, rpl = sec.ctk.readCtk(), id = m2mUtil.rid(4);

  if(rpl && rpl.app){
    pl = rpl;   
  }
  else{
    if(typeof id !== 'string'){
      throw new Error('invalid client id');
    }
    pl.c = true;
    pl.app = true;
    pl.id = id;
    pl.appId = id;
    pl.srcId = id;
    pl.src = 'client';
    appIds = dm.trackClientId(pl.id);
    if(appIds){
      pl.appIds = JSON.parse(appIds);
    }
  }
  pl._pid = 'a-c';
  pl.active = true;
  pl.enable = true;

  clientApp.client = true;
  clientApp.id = id;
 
  clientApp.cli = client.cli;
  clientApp.connect = connect;
  //clientApp.connect = http.connect;
  clientApp.httpGet = http.getApi;
  clientApp.httpPost = http.postApi;

  clientApp.in = client.gpioApi.input;
  clientApp.out = client.gpioApi.output;
  clientApp.input = clientApp.in;
  clientApp.output = clientApp.out;
  clientApp.gpio = client.gpioApi.gpio;

  clientApp.get = client.clientHttpApi.getApi;
  clientApp.post = client.clientHttpApi.postApi;

  clientApp.watch = client.clientChannelApi.watch;
  clientApp.subscribe = clientApp.watch;
  clientApp.sub = clientApp.watch;

  clientApp.unwatch = client.clientChannelApi.unwatch;
  clientApp.unsubscribe = clientApp.unwatch; 
  clientApp.unsub = clientApp.unwatch; 

  clientApp.getData = client.clientChannelApi.getData;
  clientApp.read = clientApp.getData;
  
  clientApp.sendData = client.clientChannelApi.sendData;
  clientApp.write = clientApp.sendData;  

  clientApp.monFile = m2mUtil.monApp.monExtFile;
  clientApp.monitorFile = clientApp.monFile;

  clientApp.stopMonFile = m2mUtil.monApp.stopMonExtFile;
  clientApp.stopMonitorFile = clientApp.stopMonFile;

  clientApp.on = m2mUtil.errorEvent;
  clientApp.logData = dm.logData;
  
  clientApp.setOption = sec.validateUserOptions;
  clientApp.setOptions = sec.validateUserOptions;

  clientApp.getDevices = client.device.getDevices;

  clientApp.access = client.device.accessDevice;
  clientApp.accessServer = client.device.accessDevice;
  clientApp.accessDevice = client.device.accessDevice;

  clientApp.resourcesInfo = client.device.resourcesInfo;
  clientApp.getResources = client.device.resourcesInfo;

  if(!pl.options){
    pl.options = {};
  }
  if(arg && typeof arg === 'object'){
    pl.options.userSettings = arg;
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      clientApp.userSettings = arg;
    }
  }  
}

/**
 * User Endpoint (Secure Access Endpoint)
 *
 * usage e.g: const user = new m2m.User();
 */
m2m.User = function secureAccessEndpoint(arg){
  //const { user } = require('./client.js');
  const userApp = this;
  let rpl = sec.ctk.readCtk(), id = m2mUtil.rid(4);
  
  if(rpl && rpl.user){
    pl = rpl;
  }
  else{
    if(typeof id !== 'string'){
      throw new Error('invalid user id');
    }
    pl.u = true;
    pl.user = true;
    pl.id = id;
    pl.userId = id;
    pl.srcId = id;
    pl.src = 'user';
  }
  pl._pid = 'u-r';
  pl.active = true;
  pl.enable = true;

  userApp.logData = dm.logData;
  userApp.setOption = sec.validateUserOptions;
  userApp.setOptions = sec.validateUserOptions;  
  userApp.user = true;
  userApp.id = id;
  userApp.connect = connect;

  if(!pl.options){
    pl.options = {};
  }
  if(arg && typeof arg === 'object'){
    pl.options.userSettings = arg;
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      userApp.userSettings = arg;
    }
  }
}

/**
 * Edge Endpoint
 *
 * usage e.g: const edge = new m2m.Edge();
 */
m2m.Edge = function remoteEdge(){
  const { edge } = require('./client.js');
  const edgeApp = this;
  if(!pl.id){
    throw 'invalid edge instance'
  }

  edge.edgeConnect(pl);

  edgeApp.client = edge.createClient;
  edgeApp.createServer = edge.createServer;
}

function startConnection(args, cb){
  let serverName = null;

  if(!m2mTest.option.enabled){
    if(m2mInstance > 0){
      return;
    }
    m2mInstance++;
  }
  if(typeof args === 'function'){
    cb = args;
    args = null;
  }
  if(typeof cb === 'function'){
    m2mUtil.startConnect(cb);
  }
  if(!cb){
    // no callback provided
  }
  if(!pl.device && !pl.app && !pl.user){
    return
  }

  // check hashed credential file (HFC)
  let hcf = sec.m2mApp.m2mStartHCF(args, pl, cb);
  if(hcf){
    return;
  }

  // remote m2m server information
  if(args && typeof args === 'object' && args.server){
    serverName = args.server;
  }
  else if(args && typeof args === 'string'){
    serverName = args;
  }
  else{
    serverName = m2mUtil.defaultNode;
  }
  /* istanbul ignore next */
  if(!m2mTest.option.enabled){
    m2mUtil.systemConfig.m2mInfo(pl, serverName);
  }

  pl.reg = true;

  if(processArgs[0] === '-config' || processArgs[0] === '-cp'){
    return sec.setPkgConfig(pl);
  }

  sec.getPkgConfig(pl);

  /* istanbul ignore next */
  if(processArgs[0] === '-nsc'){
    pl.nsc = true;
    return sec.m2mApp.m2mStart(args, pl, cb);
  }
  // prompt user credentials for authentication
  /* istanbul ignore next */
  if(processArgs[0] === '-r'){
    return sec.m2mApp.m2mStart(args, pl, cb);
  }
  // user credentials are provided as options for test
  if(args && typeof args === 'object' && args.userid && args.pw){
    return sec.m2mApp.m2mStart(args, pl, cb);
  }
  // use available token for authentication
  // if token is not available/valid, prompt user for credentials
  sec.m2mApp.m2mRestart(args, pl, cb);
}

/**
 * m2m connect/authentication method
 * default server:https://www.node-m2m.com
 * 
 * promise based api 9/8/23
 */
function connect(args, cb){
    if(cb){
        return startConnection(args, cb)
    } 

    return new Promise(function (resolve, reject) { 
        startConnection(args, (data) => {
            resolve(data)
        })
    })
}

module.exports = m2m;

