/*!
 * m2m
 * 
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const os = require('os');
const colors = require('colors');
const m2mv = require('../package.json');
const {deviceAccess, setApi, setData, setGpio, getDevices,  startConnect} = require('./client.js');
const {defaultNode, emitter, m2mUtil, m2mStart, m2mRestart, userOptionsValidate, rid, testOption, readTknPl, setPkgConfig, getPkgConfig} = require('./client.js');
const processArgs = process.argv.slice(2);
var pl = {options:{}}, clientArgs = {}, remoteServer = null, userSettings = null, processFilename = null;

m2mUtil.st();

/**
 * client/device system information
 */
/* istanbul ignore next */
const m2minfo = function(){
console.log('\n***************************************');
console.log('   m2m ver:', m2mv.version);
console.log('   OS:', process.platform);
console.log('   H/W type:', os.arch());
if(pl.device){
	console.log('   Application: device');
}
else {
	console.log('   Application: client');
}
console.log('   Server:', colors.brightBlue(remoteServer), '\n***************************************');
};

/**
 *  client's device access method 
 */
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

/**
* server application constructor
*/
const Server = exports.Server = function(){
  let arg = null;

  if(arguments.length === 1 && ( Number.isInteger(arguments[0]) || typeof arguments[0] === 'string' || typeof arguments[0] === 'object' )){
    arg = arguments[0];
  }
  else{
    throw new Error('invalid arguments'); 
  }

  if((Number.isInteger(arg) || typeof arg === 'string') && arg.toString().length > 9){
    throw new Error('server/device id should not exceed 8 digits');
  }
  if(Number.isInteger(arg)){
    pl.id = arg;
  }
  if(typeof arg === 'string'){
    pl.id = parseInt(arg);
  }

  if(typeof arg === 'object' && typeof arg === 'object' ){
    pl.id = arg.id;
    pl.name = arg.name;
    this.name = arg.name;
  }
  
  pl.d = true;
  pl._pid = 'd-c';
  pl.device = true;
  pl.src = 'device';
  this.id = pl.id;
  this.server = true;
  this.getApi = setApi;
  this.postApi = setApi;
  this.connect = connect;
  this.setData = setData;
  this.setChannel = setData;
  this.setOption = userOptionsValidate;
  this.setOptions = userOptionsValidate;
};

/**
 * device application constructor
 */
const Device = exports.Device = function(){
  this.device = true;
 	Server.call(this, arguments[0]);
};

Device.prototype.setGpio = setGpio;

/**
 * client application constructor
 */
const Client = exports.Client = function(){
  let rpl = readTknPl();
  if(rpl){
    pl = rpl;
    pl._pid = 'a-c';
  }
  else{
    pl.c = true;
    pl.app = true;
    pl.id = rid(4);
    let appIds = m2mUtil.trackClientId(pl.id);
    pl._pid = 'a-c';
    pl.appId = pl.id;
    pl.src = 'client';
    this.id = pl.appId;
    this.client = true;
    if(appIds){
      pl.appIds = JSON.parse(appIds);
    }
  } 
  if(arguments.length > 0){
    clientArgs = arguments;
  }
  if(arguments.length === 1 && typeof arguments[0] === 'object'){
    //userOptionsValidate(arguments[0]);
    pl.userSettings = arguments[0];
  }
  //this.connect = connect;
  //this.getDevices = getDevices;
};

Client.prototype.connect = connect;
Client.prototype.getDevices = getDevices;
Client.prototype.setOption = userOptionsValidate;
Client.prototype.setOptions = userOptionsValidate;
Client.prototype.accessServer = accessDevice;
Client.prototype.accessDevice = accessDevice;

/**
 * m2m connection and authentication method
 * default server:https://www.node-m2m.com
 */
function connect(args, cb){
  if(typeof args === 'function'){
    cb = args;
    args = null;
  }
  if(typeof cb === 'function'){
    startConnect(cb); 
  }
  else{
    throw new Error('invalid arguments');
  }

  // remote m2m server information 
  if(args && typeof args === 'object' && args.server){
    remoteServer = args.server;
  }
  else if(args && typeof args === 'string'){
    remoteServer = args;
  }
  else{
    remoteServer = defaultNode;
  }

 	m2minfo(pl);

  pl.reg = true;
 
  if(processArgs[0] === '-config'){
    return setPkgConfig(pl);
  }

  getPkgConfig(pl);

  /* istanbul ignore next */
  if(processArgs[0] === '-nsc'){
    pl.nsc = true;
    return m2mStart(args, pl, cb);
  }

  // prompt user credentials for authentication
  /* istanbul ignore next */
  if(processArgs[0] === '-r'){
    return m2mStart(args, pl, cb);
  }

  // user credentials are provided as options for test
  if(args && typeof args === 'object' && args.userid && args.pw){
    return m2mStart(args, pl, cb);
  }

  // use available token for authentication
  // if token is not available/valid, prompt user credentials 
  m2mRestart(args, pl, cb);
}

exports.connect = connect;


