/*!
 * m2m
 *
 * Copyright(c) 2020 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const os = require('os'), colors = require('colors');
const {m2mUtil, client, device, sec, http, m2mTest} = require('./client.js');
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
  pl.active = true;
  pl.enable = true;
  pl.src = 'device';
  this.id = pl.id;
  this.server = true;
  this.connect = connect;
  this.on = m2mUtil.errorEvent;
  this.watchFile = m2mUtil.monFile;
  this.get = device.resources.getApi;
  this.post = device.resources.postApi;
  this.getApi = device.resources.getApi;
  this.postApi = device.resources.postApi;
  this.setData = device.resources.setData;
  this.setOption = sec.userOptionsValidate;
  this.setOptions = sec.userOptionsValidate;
  this.setChannel = device.resources.setData;
  if(!pl.options){
    pl.options = {};
  }
};

/**
 * device application constructor
 */
const Device = exports.Device = function(){
  Server.call(this, arguments[0]);
  this.device = true;
  this.setGpio = device.resources.setGpio;
};

//Device.prototype.setGpio = device.resources.setGpio;

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
  pl.active = true;
  pl.enable = true;
  this.client = true;
  this.id = id;
  if(!pl.options){
    pl.options = {};
  }
  if(arguments.length > 0 && typeof arguments[0] === 'object'){
    pl.options.userSettings = arguments[0];
    /* istanbul ignore next */
    if(m2mTest.option.enabled){
      this.userSettings = arguments[0];
    }
  }
  this.in = client.input;
  this.out = client.output;
  this.cli = client.cli;
  this.connect = connect;
  this.path = client.path;
  this.gpio = client.gpio;
  //this.get = http.request;
  //this.post = http.request;
  this.get = client.getApi;
  this.post = client.postApi;
  this.input = client.input;
  this.watch = client.watch;
  this.output = client.output;
  this.getApi = client.getApi;
  this.access = client.access;
  this.getTest = http.getTest;
  this.postTest = http.postTest;
  this.on = m2mUtil.errorEvent;
  this.channel = client.channel,
  this.httpGet = client.httpGet;
  this.unwatch = client.unwatch;
  this.postApi = client.postApi;
  this.getData = client.getData;
  this.logData = m2mUtil.logData;
  this.httpPost = client.httpPost;
  this.sendData = client.sendData;
  this.getDevices = client.getDevices;
  this.getResources = client.getResources;
  this.accessServer = client.accessDevice;
  this.accessDevice = client.accessDevice;
  this.setOption = sec.userOptionsValidate;
  this.setOptions = sec.userOptionsValidate;
  this.resourcesInfo = client.resourcesInfo;
};

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
  if(!cb){
    // no callback provided
  }

  // check hashed credential file (HFC)
  let hcf = sec.m2mStartHCF(args, pl, cb);
  if(hcf){
    return;
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

