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
const {defaultNode, emitter, m2mUtil, m2mStart, m2mRestart, setAttributes, rid, testOption} = require('./client.js');

const processArgs = process.argv.slice(2);
var m2m = {}, clientArgs = {}, remoteServer = null;

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
if(m2m.device){
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

  if(clientArgs.length === 1){
    console.log('remote device',  clientArgs, m2mUtil.et());
  }
  else{
    console.log('remote devices',  clientArgs, m2mUtil.et());
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
    m2m.id = arg;
  }
  if(typeof arg === 'string'){
    m2m.id = parseInt(arg);
  }

  if(typeof arg === 'object' && typeof arg === 'object' ){
    m2m.id = arg.id;
    m2m.name = arg.name;
    this.name = arg.name;
  }
  
  m2m.d = true;
  m2m._pid = 'd-c';
  m2m.device = true;
  m2m.src = 'device';
  this.id = m2m.id;
  this.server = true;
  this.getApi = setApi;
  this.postApi = setApi;
  this.connect = connect;
  this.setData = setData;
  this.setChannel = setData;
  this.setOption = setAttributes;
  this.setOptions = setAttributes;
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
  m2m.c = true;
  m2m.app = true;
  m2m.id = rid(4);
  m2m._pid = 'a-c';
  m2m.appId = m2m.id;
  m2m.src = 'client';
  this.id = m2m.appId;
  this.client = true;

  if(arguments.length > 0){
    clientArgs = arguments;
  }

  if(arguments.length === 1 && typeof arguments[0] === 'object'){
    m2m.options = arguments[0];
    setAttributes(arguments[0]);
  }
};

Client.prototype.connect = connect;
Client.prototype.getDevices = getDevices;
Client.prototype.setOption = setAttributes;
Client.prototype.setOptions = setAttributes;
Client.prototype.accessServer = accessDevice;
Client.prototype.accessDevice = accessDevice;

/**
 * m2m user authentication method
 * encrypted user credentials is sent to a default m2m server
 * default m2m server: https://www.node-m2m.com
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

 	m2minfo();

  m2m.reg = true;

  /* istanbul ignore next */
  if(processArgs[0] === '-nsc'){
    m2m.nsc = true;
    return m2mStart(args, m2m, cb);
  }

  // prompt user for credentials to register
  /* istanbul ignore next */
  if(processArgs[0] === '-r'){
    return m2mStart(args, m2m, cb);
  }

  // userid and password are provided as options for test
  if(args && typeof args === 'object' && args.userid && args.pw){
    return m2mStart(args, m2m, cb);
  }

  // register user if token is available
  // if token is not available/valid, prompt user for credentials 
  m2mRestart(args, m2m, cb);
}

exports.connect = connect;


