/**!
 * m2m.js
 * v2.5.1
 *
 * Copyright(c) 2020 Ed Alegrid
 */

'use strict';

const { authConnection } = require('./endpoint.js');
const m2m = Object.create(null);
let pl = {}, m2mInstance = 0;

/***********************************************************************************
 *
 *  Create an m2m endpoint from one the following endpoint types. 
 *  Only one m2m endpoint instance is allowed for each m2m application or project.
 *
 ***********************************************************************************/

if(m2mInstance > 0){
  return;
}
m2mInstance++;

/**
 * M2M Server Endpoint
 *
 * usage e.g. const server = new m2m.Server(id);
 * where id is a user assigned virtual port
 */
const Server = m2m.Server = function ServerEndpoint(arg){
  const { server } = require('./endpoint.js');
  const ep = server();
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
    throw new Error('server/server id should not exceed 8 digits');
  }

  pl.arg = arg;
  pl.server = true;
  ep.connect = connect;
  ep.authenticate = connect;
  return Object.freeze(ep);  
}

/**
 * M2M Device Endpoint
 * (alias for Server)
 * 
 * usage e.g. const device = new m2m.Device(id);
 */
m2m.Device = Server;

/**
 * M2M Client Endpoint 
 *  
 * usage e.g. const client = new m2m.Client();
 */
m2m.Client = function ClientEndpoint(arg){
  const { client } = require('./endpoint.js');
  const ep = client();
  pl.arg = arg;
  pl.client = true;
  ep.connect = connect;
  ep.authenticate = connect;
  m2m.getServers = ep.getServers;
  m2m.getCurrentServers = ep.getServers;
  return Object.freeze(ep);
}

/**
 * M2M Gateway Endpoint
 *
 * usage e.g. const m2m = new ep.Gateway();
 */
m2m.Gateway = function GatewayEndpoint(arg){
  if(arg && arg.type === 'client'){
    return m2m.Client();
  }
  else if(arg && arg.type === 'server'){
    return m2m.Server(arg.id);
  }
  else{
    const ep = Object.create(null);

    function client(){
      if(arg.name){
        return m2m.Client({name:arg.name});
      }
      return m2m.Client();
    }

    function server(id){
      return m2m.Server(id);
    }

    ep.client = client;
    ep.server = server;
    return Object.freeze(ep);  
  }
}

/**
 * M2M User Endpoint
 *
 * usage e.g. const user = new m2m.User();
 */
m2m.User = function UserEndpoint(arg){
  const { user } = require('./endpoint.js');
  const ep = user();
  pl.arg = arg;
  pl.user = true;
  ep.connect = connect;
  ep.authenticate = connect;
  return Object.freeze(ep);
}

/**
 * M2M Edge Endpoint
 *
 * usage e.g. const edge = new m2m.Edge();
 */
m2m.Edge = function EdgeEndpoint(arg){
  const { edge } = require('./endpoint.js');
  const ep = edge();
  if(pl && (pl.server||pl.client||pl.user)){
    // edge as subcomponent of m2m client/server/user endpoints 
    pl.edgeEp = true; 
  }  
  else{
    // standalone edge endpoint
    pl.arg = arg; 
    pl.edgeUser = true;
  }
  pl.user = true;
  ep.connect = connect;
  ep.authenticate = connect;
  return Object.freeze(ep);
}

/**
 * m2m connect/authentication method
 * default demo server:https://www.node-m2m.com
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
        resolve(result);
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
    });
  });
}

m2m.connect = connect;
m2m.authenticate = connect;

module.exports = m2m;

