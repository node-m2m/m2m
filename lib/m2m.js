/*!
 * m2m
 *
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const os = require('os'), colors = require('colors');
const {m2mUtil, client, device, sec, m2mTest} = require('./client.js');
const m2mv = require('../package.json'), processArgs = process.argv.slice(2);
var pl = {options:{}}, remoteServer = null, userSettings = null, m2mInstance = 0;

m2mUtil.st();

if(m2mInstance > 0){
  return;
}

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
    if(pl.id){
      console.log('   deviceId:', pl.id);
    }
  } 
  else {
    console.log('   Application: client');
    if(pl.appId){
      console.log('   clientId:', pl.appId);
    }
  }
  console.log('   Server:', colors.brightBlue(remoteServer), '\n***************************************');
};

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
  this.getApi = device.resources.getApi;
  this.postApi = device.resources.postApi;
  this.get = device.resources.getApi;
  this.post = device.resources.postApi;
  this.connect = connect;
  this.setData = device.resources.setData;
  this.setChannel = device.resources.setData;
  this.setOption = sec.userOptionsValidate;
  this.setOptions = sec.userOptionsValidate;
  if(!pl.options){
    pl.options = {};
  }
};

/**
 * device application constructor
 */
const Device = exports.Device = function(){
  this.device = true;
  Server.call(this, arguments[0]);
};

Device.prototype.setGpio = device.resources.setGpio;

/**
 * client application constructor
 */
const Client = exports.Client = function(){
  let appIds = null, rpl = sec.readCtk(), id = m2mUtil.rid(4);
  if(rpl){
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
    pl.src = 'client';
    appIds = m2mUtil.trackClientId(pl.id);
    if(appIds){
      pl.appIds = JSON.parse(appIds);
    }
  }
  pl._pid = 'a-c';
  this.client = true;
  this.id = id;
  if(!pl.options){
    pl.options = {};
  }
  if(arguments.length > 0 && typeof arguments[0] === 'object'){
    //sec.userOptionsValidate(arguments[0]);
    pl.options.userSettings = arguments[0];
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      this.userSettings = arguments[0];
    }
  }
};

Client.prototype.connect = connect;
Client.prototype.gpio = client.gpio;
Client.prototype.get = client.getApi;
Client.prototype.post = client.postApi;
Client.prototype.input = client.input;
Client.prototype.watch = client.watch;
Client.prototype.output = client.output;
Client.prototype.getApi = client.getApi;
Client.prototype.unwatch = client.unwatch;
Client.prototype.postApi = client.postApi;
Client.prototype.getData = client.getData;
Client.prototype.logData = m2mUtil.logData;
Client.prototype.sendData = client.sendData;
Client.prototype.getDevices = client.getDevices;
Client.prototype.setOption = sec.userOptionsValidate;
Client.prototype.setOptions = sec.userOptionsValidate;
Client.prototype.accessServer = client.accessDevice;
Client.prototype.accessDevice = client.accessDevice;

/**
 * m2m connection and authentication method
 * default server:https://www.node-m2m.com
 */
function connect(args, cb){
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
    remoteServer = m2mUtil.defaultNode;
  }
  /* istanbul ignore next */
  if(!m2mTest.option.enabled){
    m2minfo(pl);
  }

  pl.reg = true;

  if(processArgs[0] === '-config' || processArgs[0] === '-cp'){
    return sec.setPkgConfig(pl);
  }

  sec.getPkgConfig(pl);

  /* istanbul ignore next */
  if(processArgs[0] === '-nsc'){
    pl.nsc = true;
    return sec.m2mStart(args, pl, cb);
  }

  // prompt user credentials for authentication
  /* istanbul ignore next */
  if(processArgs[0] === '-r'){
    return sec.m2mStart(args, pl, cb);
  }

  // user credentials are provided as options for test
  if(args && typeof args === 'object' && args.userid && args.pw){
    return sec.m2mStart(args, pl, cb);
  }

  // use available token for authentication
  // if token is not available/valid, prompt user credentials
  sec.m2mRestart(args, pl, cb);
}

exports.connect = connect;

