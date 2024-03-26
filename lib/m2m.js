/**!
 * m2m.js
 * v2.3.9
 *
 * Copyright(c) 2020 Ed Alegrid
 */

'use strict';

const { authConnection } = require('./endpoint.js');
const m2m = Object.create(null);
let pl = {}, m2mInstance = 0;

/**
 *  Create endpoint from one the following endpoint types. 
 *  Only one endpoint instance is allowed for each m2m application or project.
 */
if(m2mInstance > 0){
  return;
}
m2mInstance++;

/**
 * M2M Device Endpoint
 *
 * usage e.g. const device = m2m.Device(id); // or Server({port:100, ip:'private'}) 
 * where id is a user assigned virtual port
 */
const Device = m2m.Device = function DeviceEndpoint(arg){
  const { device } = require('./endpoint.js');
  const ep = device();
  if(Number.isInteger(arg)){
    pl.id = arg;
  }
  else if(typeof arg === 'string'){
    pl.id = parseInt(arg);
  }
  else if(typeof arg === 'object'){
    if(arg.id){
      pl.id = arg.id;
    }
    if(arg.port){
      pl.id = arg.port;
    }
    if(arg.ip){
      pl.ip = arg.ip;
    }
    if(arg.name){
      pl.name = arg.name;
      ep.name = arg.name;
    }
  }
  if(pl.id && pl.id.toString().length > 9){
    throw new Error('server/device id should not exceed 8 digits');
  }
  pl.device = true;
  pl.arg = arg;
  ep.connect = connect;
  return Object.freeze(ep);  
}

/**
 * M2M Server Endpoint
 * (alias for Device)
 * 
 * usage e.g. const server = m2m.Server(id);
 */
m2m.Server = Device;

/**
 * M2M Client Endpoint 
 *  
 * usage e.g. const client = m2m.Client();
 */
m2m.Client = function ClientEndpoint(arg){
  const { client } = require('./endpoint.js');
  const ep = client();
  pl.client = true;
  pl.arg = arg;
  ep.connect = connect;
  m2m.getServers = ep.getServers;
  m2m.getCurrentServers = ep.getServers;
  return Object.freeze(ep);
}

/**
 * M2M Gateway Endpoint
 *
 * usage e.g. const m2m = ep.Gateway();
 */
m2m.Gateway = function GatewayEndpoint(arg){
  if(arg && arg.type === 'client'){
    return m2m.Client();
  }
  else if(arg && arg.type === 'server'){
    return m2m.Device(arg.id);
  }
  else{
    const ep = Object.create(null);

    function client(){
      if(arg.name){
        return m2m.Client({name:arg.name});
      }
      return m2m.Client();
    }

    function device(id){
      return m2m.Device(id);
    }

    ep.client = client;
    ep.server = device;
    ep.device = device;
    return Object.freeze(ep);  
  }
}

/**
 * M2M User Endpoint
 *
 * usage e.g. const user = m2m.User();
 */
m2m.User = function UserEndpoint(arg){
  const { user } = require('./endpoint.js');
  const ep = user();
  pl.user = true;
  pl.arg = arg;
  ep.connect = connect;
  return Object.freeze(ep);
}

/**
 *  After creating an m2m endpoint instance you can also create an edge endpoint.
 */

/**
 * Edge Endpoint
 *
 * usage e.g. const edge = m2m.Edge();
 */
m2m.Edge = function EdgeEndpoint(arg){
  const { edge } = require('./endpoint.js');
  const ep = edge();
  if(pl && (pl.device||pl.client||pl.user)){
    pl.edgeEp = true;
  }  
  else{
    pl.edgeUser = true;
  }
  pl.user = true;
  pl.arg = arg;
  ep.connect = connect;
  return Object.freeze(ep);
}

/**
 * m2m connect/authentication method
 * default demo server:https://www.node-m2m.com
 * 
 * w/ promise based option
 */
function connect(arg, cb){
  let r = 0;

  if(Object.entries(pl).toString() === Object.entries({}).toString()){
    throw 'invalid endpoint - please create an m2m endpoint';
  }  

  if(cb){
    authConnection(arg, pl, cb);
    return;
  } 
  return new Promise(function (resolve, reject) { 
    authConnection(arg, pl, (result) => {
      if(result){
        resolve(result); // success
      }
      if(r > 0){
        if(cb){
          cb(result);  
        }
        else{
          console.log(result);
        }
      }
      r = 1;
    })
  })
}

m2m.connect = connect;

module.exports = m2m;

