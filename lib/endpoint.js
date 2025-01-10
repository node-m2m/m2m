/**!
 * endpoint.js
 * v2.4.9
 *
 * Copyright(c) 2020 Ed Alegrid
 */

'use strict';

const { sec, emitter, m2mUtil, fimManager, systemConfig, dataManager, wsCreate, setDefaults } = require('./supportLib.js');
let m2mLib = {}, spl = {}, edge = null, client = null, server = null, http = null, processRuntime = 0, processArgs = process.argv.slice(2);

/****************************
 * 
 *    ENDPOINT BASE OBJECT 
 * 
 ****************************/
function BaseEp(type){
  this.baseEp = true;
  this[type] = true;
}

BaseEp.prototype = {
  constructor:BaseEp,
  log:m2mUtil.logData,
  on:m2mUtil.setEpErrorEvent, 
  fim:systemConfig.setFim  
};

/*********************
 * 
 *    USER OBJECT
 * 
 *********************/
m2mLib.user = () => {
  const userEp = new BaseEp('user');
  return userEp;
}

/*******************
 * 
 *    EDGE CLASS
 * 
 *******************/
m2mLib.edge = () => {
  const ep = {}, Edge = require('node-edge');
  
  ep.startCreateClient = (arg) => {
    return Edge.createClient;
  }

  ep.startCreateServer = (arg) => {
    return Edge.createServer;
  }

  ep.accessEp = (rxd) => {
    try{
      if(rxd.id === spl.id){
        if(spl.server){
          rxd.server = true;
        } 
        else if(spl.client){
          rxd.client = true;
        }
        else if(spl.user){
          rxd.user = true;
        }
        rxd.result = Edge.accessNode(rxd);
    		setTimeout(() => emitter.emit('ws-emit-send', rxd), 1000);
      }
      else{
        rxd.error = 'invalid user';
      }
    }
    catch(e){
      m2mUtil.logEvent('accessEdge error:', e.message);
    }
  }
  
  ep.createClient = Edge.createClient;
  ep.createServer = Edge.createServer;
  edge = ep;

  const edgeEp = new BaseEp('edge');

  edgeEp.client = Edge.createClient;
  edgeEp.server = Edge.createServer;
  edgeEp.createServer = Edge.createServer;

  return edgeEp;
} // edge

/*********************
 * 
 *    CLIENT CLASS
 * 
 *********************/
m2mLib.client = () => {
  const httpApi = {}, channelApi = {};
  let rateL = false, activeSyncTry = 0, accessArg = {};  
  let activeSyncData = [], clientChannelDataListener = null; 
  let channelAccessRate = 0, clientAccessState = true, clientRawAccessData = [];
    
  setTimeout(() => {
    if(channelAccessRate > 5){
      rateL = true;
    }
  }, 5000);
    
  /*******************************
    
      client utility functions
    
   *******************************/
  function stopClientDataAccess(){
    setTimeout(() => {
      clientAccessState = false;
    }, 60000);
  }  

  function captureClientRawAccessData(arg){
    if(activeSyncTry === 0){
      if(!clientAccessState){ 
        return;
      }  
      if(arg.unwatch){
        return;
      }
      clientRawAccessData.push(arg); 
    }
  }

  function getClientRawAccessData(){
    return clientRawAccessData;
  }

  function findActiveSyncEvent(rxd, cb){
    let result = null;
    activeSyncData.forEach((pl, i) => {
      if((pl.id === rxd.id||pl.srcId === rxd.srcId) && pl.aid === rxd.aid){ 
	cb(pl, i);	
      }
    });
    return result;
  }

  function removeActiveSyncDataEvent(rxd){
    let result = null;
    findActiveSyncEvent(rxd, (pl, i) => {
      try{
	activeSyncData.splice(i, 1);
        result = true;
        m2mUtil.logEvent('activeSyncData removed', pl.id, pl.topic, pl.srcId);
      }
      catch(e){
	m2mUtil.logEvent('removeActiveSyncDataEvent activeSyncData.splice(i, 1) error:', e.message);
      }
     });
     return result;
  }

  function activateServerActiveSyncOnlineEvent(rxd){
    if(activeSyncData.length > 0){
      setTimeout(() => {
 	//console.log('m2m client attempting to restart subscriber events ...');
	activeSyncData.forEach((pl) => {
	//socket.send(pl);
        setImmediate(socket.send, pl);
	});
      }, 1000);
    }
  }

  function startServerActiveSyncOnlineEvent(rxd){
    if(activeSyncTry === 0){
      activeSyncTry++;
    }
    findActiveSyncEvent(rxd, (pl) => {
      let msg = 'server['+ rxd.id +'] is online';
      console.log(msg); 
      //socket.send(pl);
      setImmediate(socket.send, pl);
      m2mUtil.logEvent('remote', msg);
      m2mUtil.logEvent('ActiveSyncOnLine', pl.dstId, pl.topic, pl.srcId);
    });
  }

  function startServerActiveSyncOffLineEvent(rxd){
    findActiveSyncEvent(rxd, (pl) => {
      let msg = 'server['+ rxd.id +'] is offline';
      console.log(msg);
      rxd.error = msg;
      let v = emitter.emit('node-m2m-error', new Error(msg));
      m2mUtil.logEvent('remote', msg);
      m2mUtil.logEvent('ActiveSyncOffLine', pl.dstId, pl.topic, pl.srcId);
      activeSyncTry = 0;
    });
  }

  function validateServerId(pl){
    let valid = false;
    let validServers = systemConfig.getValidServers();
    if(validServers){
      validServers.forEach((id) => { 
        if(id === pl.id){
          valid = true;
        }  
      });    
    }
    else if(pl.servers){
      pl.servers.forEach((id) => { 
        if(id === pl.id){
          valid = true;
        }
      });
    }
    else{
      m2mUtil.logEvent('Invalid server id');
      throw new Error('Invalid server id');
    }

    if(valid){
      captureClientRawAccessData(pl); 
    }
    else{
      if(!rateL){
        valid = false;
      }
    }
    return valid;
  }

  function setCommonEventName(pl){
    let plId = null;
    if(pl.dstId){
      plId = pl.dstId;
    }
    else if(pl.id){
      plId = pl.id;
    }
    return plId + pl.name + pl.event + pl.watch + pl.unwatch + pl.method;
  }

  /*******************************

      setClientEventListener

   *******************************/
  function setClientEventListener(pl, cb, resolve, reject){
    let dataId = null, listenerId = null, eventName = null;
    // server-as-client
    if(pl.server){
      listenerId = pl.srcId;
      eventName = setCommonEventName(pl);
    }
    // client
    else{
      listenerId = pl.id;
      eventName = setCommonEventName(pl);
    }
    clientChannelDataListener = function (data) {
      try{
        if(data.dst == 'server-as-client'||data.src == 'server-as-client'){
	  dataId = data.srcId;
	}
        else{
	  dataId = data.id;
        }

	if(dataId === listenerId && data.name === pl.name){
          if(data.error){
            m2mUtil.setError(data.error, cb, reject, resolve);
          }
          else if(data.value){
            if(cb){
              if(data.watch){
                setImmediate(cb, data.value); 
              }
              else{
                if(pl.eventId === data.eventId){
                  setImmediate(cb, data.value); 
                }
              }
            }
            else if(resolve){
              if(pl.eventId === data.eventId){ 
                setImmediate(resolve, data.value);
              }
            }
          }
          else if(data.unwatch){
            if(removeActiveSyncDataEvent(data)){
              // Note: remove emitter sub/watch event listener (not unsub/unwatch event listener)
              emitter.removeListener(eventName,  clientChannelDataListener);
            }
            if(cb){
              if(pl.eventId === data.eventId){
                setImmediate(cb, data.result); 
              }
            }
            else if(resolve){
              if(pl.eventId === data.eventId){ 
                setImmediate(resolve, data.result);
              }
            }    
          }
          else if(data.result){
            if(cb){
              if(data.watch){
                setImmediate(cb, data.result); 
              }
              else{
                if(pl.eventId === data.eventId){
                  //cb(data.result); 
		  setImmediate(cb, data.result);
                }
              }
            }
            else if(resolve){
              if(pl.eventId === data.eventId){ 
                //resolve(data.result);
       		setImmediate(resolve, data.result);
              }
            }
          }
        }
      }
      catch(e){
        m2mUtil.logEvent('setClientEventListener error:', e.message);
      }
    };

    if(pl.event && pl.watch){
      let duplicate = systemConfig.setActiveSyncData(pl, activeSyncData);
      if(duplicate){
        emitter.removeListener(eventName, clientChannelDataListener);
      }
    }

    if(pl.event && pl.watch){
      // only 1 listener is allowed
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
  }

  /*********************************************
    
      setClientPayloadData helper functions

   *********************************************/
  function validateDataApiPayload(pl){
    if(!pl._pid){
      throw new Error('system error - client data invalid/missing pl._pid');
    }
    if(!pl.name){
      throw new Error('system error - client data invalid/missing pl.name');
    }
    if(!pl.eventId){
      throw new Error('system error - client data invalid/missing pl.eventId');
    }
    if(pl.get||pl.post){
      if(!pl.path){
        throw new Error('system error - client data invalid/missing pl.path');
      }
      if(pl.post){
        if(!pl.body){
          throw new Error('system error - client data invalid/missing pl.body');
        }
      }
    }
    else {
      if(!pl.channel){
        throw new Error('system error - client data invalid/missing pl.channel');
      }
      if(pl.write){
        if(!pl.payload){
          throw new Error('system error - client data invalid/missing pl.payload');
        }
      }
      if(pl.watch){
        if(!pl.interval){
          throw new Error('system error - client data invalid/missing pl.interval');
        }
      }
    }
  }
  
  /*****************************************
    
      Prepare client data request payload

   *****************************************/
  function setClientPayloadData(o, method, cb, resolve, reject){
    try{
      if(typeof o !== 'object'){
        throw new Error('system error - client data invalid (o) object arg');
      }
      if(typeof method !== 'string'){
        throw new Error('system error - client data invalid method');
      }
      if(!o.id){
        throw new Error('system error - client data invalid/missing (o) object arg - id');
      }
      if(spl.client && !spl.clientId){
        throw new Error('system error - client data invalid/missing spl.client - clientId');
      }
      
      let pl = Object.assign({}, spl, o);

      pl.dst = 'server';
      pl.eventId = m2mUtil.rid(8);

      if(pl.server){ // server-as-client
        if(!pl.srcId){
          pl.srcId = pl.id;
        }
        pl.src = 'server-as-client';
        pl.dstId = pl.id;
      }
      else{ // client
        if(!pl.srcId){
          pl.srcId = pl.clientId; 
        }
        if(!pl.dstId){ 
          pl.dstId = pl.id; 
        }
      }

      pl[method] = true;
      pl.method = method;

      // http api - pl.get||pl.post
      if(pl.get||pl.post){
        pl._pid = 'http-data';
        pl.http = true;
        pl.name = o.path;
        pl = m2mUtil.getUrlKeys(pl, pl.path);
      }
      // channel/topic api - pl.read||pl.write||pl.watch||pl.unwatch
      else {
        pl._pid = 'channel-data';
        if(pl.channel){
          pl.name = pl.channel;
          pl.topic = pl.channel;
        }
        else if(pl.topic){
          pl.name = pl.topic;
          pl.channel = pl.topic;
        }

        pl = m2mUtil.getSubTopic(pl, pl.topic);

        if(pl.watch){
          if(pl.polling){
            pl.interval = pl.polling;
          }
          else if(pl.poll){
            pl.interval = pl.poll;
          }

          if(pl.interval){
            if(pl.interval < 1000){
              pl.interval = 5000;
            }
          }
          else{
            pl.interval = 5000;
          }
        }
      }

      if(!pl.name){
        throw new Error('system error - client data invalid/missing pl.name');
      }
       
      if(pl.watch){
        pl.watch = true;
        pl.event = true;
      }
      else{
        pl.watch = false;
        pl.event = false;
      }
      
      m2mUtil.validateNameAndPayload(pl);

      // validate server-as-client payload 
      if(pl.id === pl.dstId && pl.srcId === pl.dstId){
        throw new Error('Invalid server id that will cause a race condition. Server client cannot access its own server resources. ');
      }

      validateDataApiPayload(pl);

      if(cb && typeof cb !== 'function'){
        throw new Error('invalid client request data callback argument');
      }

      channelAccessRate++;

      if(validateServerId(pl)){
        setClientEventListener(pl, cb, resolve, reject);
        //socket.send(pl);
        setImmediate(socket.send, pl);
      }
      else{
        let err = 'server['+pl.id+'] - id '+pl.id+' is not registered';
        // Note: cb is the local callback or the promise handler (not yet resolved) provided for each client method
        m2mUtil.setError(err, cb, reject);
      }
    }
    catch(e){
      m2mUtil.logEvent('setClientPayloadData error:', JSON.stringify(e));
      throw e;
    }
  }

  /***********************************************

      Accesss Remote Server Resources Functions

   ***********************************************/
  channelApi.read = function(id, channel, cb) {
    return m2mUtil.validateClientApi(id, channel, null, null, this.id, 'read', cb, setClientPayloadData);
  }

  channelApi.write = function(id, channel, payload, cb) {
    return m2mUtil.validateClientApi(id, channel, payload, null, this.id, 'write', cb, setClientPayloadData);
  }

  channelApi.watch = function(id, channel, interval, cb) {
    return m2mUtil.validateClientApi(id, channel, null, interval, this.id, 'watch', cb, setClientPayloadData);
  }

  channelApi.unwatch = function(id, channel, cb) {
    return m2mUtil.validateClientApi(id, channel, null, null, this.id, 'unwatch', cb, setClientPayloadData);
  }

  httpApi.get = function(id, path, cb) {
    return m2mUtil.validateClientApi(id, path, null, null, this.id, 'get', cb, setClientPayloadData);
  }

  httpApi.post = function(id, path, body, cb) {
    return m2mUtil.validateClientApi(id, path, body, null, this.id, 'post', cb, setClientPayloadData);
  }

  function cli(id, payload, cb){
    const channel = 'sec-cli';

    if(typeof id === 'object' && typeof payload === 'function'){
      id.channel = channel;
      id.topic = channel;
      cb = payload;
      if(id.cmd){
        id.payload = id.cmd;
      }
      if(id.command){
        id.payload = id.command;
      }
    }

    // alias
    if(typeof id === 'string' && typeof payload === 'function'){
      cb = payload;
    }
    if(typeof id === 'string'){
      payload = id;
      id = this.id;
    }

    return m2mUtil.validateClientApi(id, channel, payload, null, null, this.id, 'write', cb, setClientPayloadData);
  }
  
  function setClientApiListener(pl, cb){
    const eventName = pl.id + pl._pid;

    return new Promise(function (resolve, reject) {
      if(!spl){
        let err = pl._pid + ' request';
        m2mUtil.setError(err, cb, reject);
      }
      else{
        if(emitter.listenerCount(eventName) < 1){
          emitter.once(eventName, (data) => {
            if(data.id === pl.id && data._pid === pl._pid){
              if(data.error){
                m2mUtil.setError(data.error, cb, reject);
              }
              else{
                if(cb){
                  if(data.serverSetup){
                    setImmediate(cb, data.serverSetup);
                  }
                  else if(data.epServers){
                    setImmediate(cb, data.epServers);
                  }
                }
                else if(resolve){
                  if(data.serverSetup){
                    setImmediate(resolve, data.serverSetup);
                  }
                  else if(data.epServers){
                    setImmediate(resolve, data.epServers);
                  }
                }  
              }
            }
          });
        } 
        socket.send(pl);
      }
    });
  }

  function getServerInfo(id, cb){
    try{
      const pl = Object.assign({}, spl);
      if(typeof id === 'function'){
        cb = id;
        pl.id = this.id;
      }
      else if(!id && !cb){
        pl.id = this.id;
      }
      else{
        pl.id = id;
      }
      pl.dst = 'server';
      pl._pid = 'serverSetup';
      pl.serverSetup = true;
      pl.serverSystemInfo = true;

      return setClientApiListener(pl, cb);
    }
    catch(e){
      m2mUtil.logEvent('getServerInfo error:', e.message);
      throw e;
    }
  }
  
  function getServers(cb) {
    try{
      const pl = Object.assign({}, spl);
      pl._pid = 'get-available-servers';
      pl.getServers = true;
      if(this.id){
        pl.id = this.id;
      }
      else{
        pl.id = pl.clientId;
      }
      return setClientApiListener(pl, cb);
    }
    catch(e){
      m2mUtil.logEvent('getServers error:', e.message);
    }
  }

  function RemoteServerAccess(id){
    this.id = id;
  }

  RemoteServerAccess.prototype = {
    constructor: RemoteServerAccess,
    cli,
    getServers,
    getServerInfo,
    get: httpApi.get,
    post: httpApi.post,
    read: channelApi.read,
    write: channelApi.write,
    unsub: channelApi.unwatch,
    unsubscribe: channelApi.unwatch,
    sub: channelApi.watch,
    subscribe: channelApi.watch,
  };

  /**********************************************************************************

      Access server/server resources using an alias for remote server/server

      api - const server = client.accessServer(100) or client.accessServer(100, cb)
      api - const servers = client.accessServer([100, 120], cb) 

  ***********************************************************************************/
  function accessServer(arg, cb){
    let remoteServer = [];
    try{
      if(Number.isInteger(arg)){
        accessArg = [arg];
      }
      else if(typeof arg === 'object'){
        if(arg.id){
          accessArg = [arg.id];
        } 
      }
      else if(Array.isArray(arg)){
        accessArg = arg; 
      }

      // create an instance of RemoteServerAccess 
      for (let x = 0; x < accessArg.length; x++) {
        if(Number.isInteger(accessArg[x])){
          remoteServer[x] = new RemoteServerAccess(accessArg[x]); 
        }
        else{
          console.log('invalid server id: ' + accessArg[x]);
          throw new Error('server id must be an integer number');
        }
      }

      // return the alias object (remoteServer) with access to remote server/server
      // synchronous api - client.accessServer(100) or client.accessServer([100, 120])
      if(!cb){ 
        if(remoteServer.length === 1 ){
          return remoteServer[0];
        }
        else {
          return remoteServer;
        }
      }
      // asynchronous w/ callback api - client.accessServer(100, cb) or client.accessServer([100, 120], cb)
      else if(cb){
        if(remoteServer.length > 1 ){
          // cb(remoteServer)
          setImmediate(cb, remoteServer);
        }
        else {
          // cb(remoteServer[0]) 
          setImmediate(cb, remoteServer[0]);
        }
      }
    }
    catch(e){
      throw e;
    }
  }

  /**********************************

    Received Client Endpoint Data

  ***********************************/
  function rxEpClientData(rxd){
    let clientRxEventName = null;
    try{
      if(rxd.activeStart){
        startServerActiveSyncOnlineEvent(rxd);
      }
      else if(rxd.exit){
        startServerActiveSyncOffLineEvent(rxd);
      }
      else if(rxd.getServers){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(rxd.serverSetup){
        clientRxEventName = rxd.id + rxd._pid;
      }
      else if(rxd.channel||rxd.name){
        clientRxEventName = setCommonEventName(rxd);
      }
      else{
        sec.rxCommonData(rxd, client, server, edge); 
      }

      if(clientRxEventName){
        process.nextTick(() => emitter.emit(clientRxEventName, rxd));
      }
    }
    catch(e){
      m2mUtil.logEvent('rxEpClientData error:', e.message);
    }

    if(processArgs[0] === '-s'){
      setTimeout(() => process.exit(), 300);
    }
  }

  client = {
    cli,
    httpApi,
    channelApi,
    getServers,
    accessServer,
    getServerInfo,
    rxEpClientData,
    setCommonEventName,
    stopClientDataAccess,
    getClientRawAccessData,
		startServerActiveSyncOnlineEvent,
    startServerActiveSyncOffLineEvent,
    activateServerActiveSyncOnlineEvent
  };

  const clientEp = new BaseEp('client');
  clientEp.cli = cli;
  clientEp.httpGet = http.get;
  clientEp.httpPost = http.post;
  clientEp.get = httpApi.get;
  clientEp.post = httpApi.post;
  clientEp.read = channelApi.read;
  clientEp.write = channelApi.write;  
  clientEp.sub = channelApi.watch;
  clientEp.subscribe = channelApi.watch;
  clientEp.unsub = channelApi.unwatch;
  clientEp.unsubscribe = channelApi.unwatch;
  clientEp.access = accessServer;
  clientEp.accessServer = accessServer;
  clientEp.getServers = getServers;
  clientEp.getServerInfo = getServerInfo;
  return clientEp;
} // client

/**********************
 * 
 *    SERVER CLASS
 * 
 **********************/
m2mLib.server = () => {
  let randomNumber = Math.floor((Math.random() * 5000) + 1000);
  let browserWatch = {reset:null, timeout:30*60000+randomNumber}, scanInterval = 5000;
  let baseInfoResources = {id: spl.id, systemInfo: m2mUtil.systemInfo, cli:{cmd:[]}, 
      get:{path:[]}, post:{path:[]}, read:{name:[]}, write:{name:[]}, dataSource:{name:[]}, publish:{name:[]}};
  let serverSetup = Object.assign({}, baseInfoResources), watchServerChannelData = [];

  const resources = {
    httpGet,
    httpPost,
    setReadData,
    setWriteData,
    setDataSource,
    setPublishData,
    setChannelApi,
    getServerResources,
  };

  const exit = {
    serverExitProcess,
    stopWatchEventOnClientExit,
  };

  /******************************
    
      Server Helper functions
    
   ******************************/
  function getServerSetup(rxd){
    rxd.serverSetup = serverSetup;
    rxd.active = true;
    process.nextTick(() => {
      emitter.emit('ws-emit-send', rxd);
    });
  }
  
  function setServerResourcesListener(cb){
    let eventName = 'set-server-resources';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        serverSetup.id = data.id;
        if(cb){
          process.nextTick(function(){
            cb(serverSetup);
          });
        }
      });
    }
  }

  function setServerResources(arg, method){
    process.nextTick(function(){
      try{
        if(method === 'watch'||method === 'publish'||method === 'read'||method === 'write'||method === 'dataSource'){ 
          if(typeof arg === 'string'){
            if(arg !== 'sec-cli'){
              serverSetup.channel.name.push(arg);
            }
          }
          else if(typeof arg === 'object'){
            if(typeof arg.channel === 'string'||typeof arg.name === 'string'){
              if(arg.channel === 'sec-cli'){
                if(arg.payload){
                  serverSetup.cli.cmd.push(arg.payload);
                }
              }
              else { 
                if(arg.method === 'read'){
                  serverSetup.read.name.push(arg.channel);
                }
                else if(arg.method === 'write'){
                  serverSetup.write.name.push(arg.channel);
                }
                else if(arg.method === 'dataSource'){
                  serverSetup.dataSource.name.push(arg.channel);
                }
                else if(arg.method === 'watch'||arg.method === 'publish'){
                  serverSetup.publish.name.push(arg.channel);
                }
              }
            }
          }

          serverSetup.publish.name = m2mUtil.removeDuplicateInArray(serverSetup.publish.name);
          serverSetup.read.name = m2mUtil.removeDuplicateInArray(serverSetup.read.name);
          serverSetup.write.name = m2mUtil.removeDuplicateInArray(serverSetup.write.name);
          serverSetup.dataSource.name = m2mUtil.removeDuplicateInArray(serverSetup.dataSource.name);
        }
      }
      catch(e){
      	console.log('setServerResources error:', e);
        m2mUtil.logEvent('setServerResources error:', e.message);
      }
    });
  }

  // helper function secure cli
  function exeClientServerCli(cmd, cb){
    const { spawn } = require('child_process');
    const cli = spawn(cmd, {shell:true});
    cli.stdout.on('data', (data) => {
      cb(data);
    });
    cli.stderr.on('data', (data) => {
      cb(data);
    });
    cli.on('close', (code) => {
      cb(code);
    });
    cli.on('node-m2m-error', (err) => {
      cb(err);
    });
  }

  // client to server secure cli
  setTimeout(() => {
    resources.setChannelApi('sec-cli', 'read', (data) => {
      exeClientServerCli(data.payload, (result) => {
        if(result){
          data.send(result.toString());
        } 
      });
    });
  }, 100);

  /************************************
  
      Http-like api helper functions 
  
  *************************************/
  function setServerHttpResources(arg, method){
    serverSetup.get.path = [], serverSetup.post.path = [];
    process.nextTick(function(){
      try{
        if(method === 'get'||method === 'post'){
          if(typeof arg === 'string'){
            if(method === 'get'){
              serverSetup.get.path.push(arg);
            }
            else if(method === 'post'){
              serverSetup.post.path.push(arg);
            }
          }
          else if(typeof arg === 'object'){
            if(typeof arg.name === 'string'){
              if(method === 'get'){
                serverSetup.get.path.push(arg.name);
              }
              else if(method === 'post'){
                serverSetup.post.path.push(arg.name);
              }
            }
          }

          serverSetup.get.path = m2mUtil.removeDuplicateInArray(serverSetup.get.path);
          serverSetup.post.path = m2mUtil.removeDuplicateInArray(serverSetup.post.path);
        }
      }
      catch(e){
        m2mUtil.logEvent('setServerHttpResources error:', e.message);
      }
    });
  }

  function handleResponse(cb, data, req, res){
    if(data && data.error){
      m2mUtil.setError(data.error, cb);
    }
    else if(data){
      // cb(data)
      setImmediate(cb, data);
    }
    else if(req && res){
      // cb(req, res)
      setImmediate(cb, req, res);
    }
  }

  function resetServerSetup(){
    serverSetup = Object.assign({}, baseInfoResources);
  }

  setServerResourcesListener((serverSetup) => {
    let rd = m2mUtil.removeDuplicateInArray;

    serverSetup.get.path = rd(serverSetup.get.path);
    serverSetup.post.path = rd(serverSetup.post.path);

    serverSetup.publish.name = rd(serverSetup.publish.name);
    serverSetup.read.name = rd(serverSetup.read.name);
    serverSetup.write.name = rd(serverSetup.write.name);
    serverSetup.dataSource.name = rd(serverSetup.dataSource.name);

    setImmediate(() => {
      try{
        let resources = {};
        resources.id = serverSetup.id;

        if(serverSetup.publish.name[0]){
          resources.publish = serverSetup.publish.name;
        }
        if(serverSetup.dataSource.name[0]){
          resources.dataSource = serverSetup.dataSource.name;
        }
        if(serverSetup.get.path[0]){
          resources.get = serverSetup.get.path;
        }
        if(serverSetup.post.path[0]){
          resources.post = serverSetup.post.path;
        }
        if(serverSetup.read.name[0]){
          resources.read = serverSetup.read.name;
        }
        if(serverSetup.write.name[0]){
          resources.write = serverSetup.write.name;
        }
	if(serverSetup.id && Object.keys(resources).length > 1){
          console.log('m2m server resources', resources);
	}
      }
      catch(e){
        m2mUtil.logEvent('m2m server resources error:', e.message);
      }
    });
  });

  function getServerResources(){
    if(spl.id){
      serverSetup.id = spl.id;
    }  
    return serverSetup;
  }

  /********************************************
    
      Server watch/publish helper functions    
    
   ********************************************/
   function setChannelResourcesEventName(o){
    // unique eventname for each channel method
    return o.id + o.method + o.channel;
  }

  function findWatchChannelEvent(rxd, cb){
    let result = null
    watchServerChannelData.forEach((data, i) => {
      if(data.name === rxd.name && data.srcId === rxd.srcId){
	cb(data, i);	
      }
    });
    return result;
  }		

  function resetWatchData(){
    watchServerChannelData = [];
  }

  // monitor watch data values for changes
  function monitorDataChange(wo){
    try{
      // wo.value or wo.result can be of type string, number or object 
      // using integrated response method to detect changes
      if(wo.value && wo.name && JSON.stringify(wo.value) !== JSON.stringify(wo.initValue)){
        wo.initValue = wo.value;
      }
      else if(wo.result && wo.name && JSON.stringify(wo.result) !== JSON.stringify(wo.initValue)){
        wo.initValue = wo.result;
      }
    }
    catch(e){
      m2mUtil.logEvent('monitorDataChange  error:', e.message);
    }
  }

  // watch event iterator
	function iterateWatchEvent(wd, cb){
    try{
      let dst = wd.dst;
      let src = wd.src;
      //let eventName = wd.id + wd.method + wd.channel; 
      let eventName = setChannelResourcesEventName(wd);
      if(wd.src === 'server'){ 
				wd.dst = src;
        wd.src = dst;
      }
      emitter.emit(eventName, wd);

      if(cb){
        //cb(wo);
        process.nextTick(cb, wd);
      }
      else{
        process.nextTick(monitorDataChange, wd);
      }
    }
    catch(e){
      m2mUtil.logEvent('iterateWatchEvent  error:', e.message);
      throw e;
    }
  }

  function watchChannelEvent(wo){
    clearTimeout(wo.watchTimeout);
    wo.watchTimeout = setTimeout(function watch() {
      iterateWatchEvent(wo.watchData); // w/o callback
      //iterateWatchEvent(wo.watchData, (data) => monitorDataChange(data)); // with callback
      wo.watchTimeout = setTimeout(watch, wo.interval);
    }, wo.interval);
  }

  function startWatchingChannelEvent(rxd, arrayData){
    arrayData.forEach((wo) => { 
      if(wo.srcId === rxd.srcId && wo.eventId === rxd.eventId){
        wo.interval = rxd.interval;
        watchChannelEvent(wo);
      }
    });
  }

  function reWatchChannelEvent(rxd, wo){  
    wo.eventId = rxd.eventId;
    wo.watchData = rxd;
    wo.interval = rxd.interval;
    watchChannelEvent(wo);
  }

  function enableWatch(arrayData){ 
    arrayData.forEach((wo) => {
      watchChannelEvent(wo);
    });
  }

  function removeWatchEvent(rxd, eventObject, arrayData, i){
    // destroy event, a new watch event will be created
    if(rxd.remove){
      clearTimeout(eventObject.watchTimeout);
      try{
        arrayData.splice(i, 1);
        rxd.result = true;
        emitter.emit('ws-emit-send', rxd);
      }
      catch(e){
        m2mUtil.logEvent('removeWatchEvent destroy error:', e.message);
      }
    }
    // clear event timeout, can be re-use again
    else if(eventObject.watchTimeout){
      if(eventObject.watchTimeout._destroyed){
        clearTimeout(eventObject.watchTimeout);
        rxd.result = false;
        emitter.emit('ws-emit-send', rxd);
      }
      else{
        clearTimeout(eventObject.watchTimeout);
        rxd.result = true;
        emitter.emit('ws-emit-send', rxd);
      }
    }
  }

  function findWatchEventToRemove(rxd, arrayData){
    let match = null;
    try{
      // remove a specific channel/topic as per client request
      if(rxd.unwatch && (rxd.name||rxd.pin)){
        findWatchChannelEvent(rxd, (data, i) => {
	  removeWatchEvent(rxd, data, arrayData, i);
	  m2mUtil.logEvent('client unwatch/unsub - topic event', rxd.id, rxd.name, rxd.srcId);
          match = true;
	});
	if(!match){
	  rxd.error = 'unwatch invalid channel/topic';
	  rxd.result = false;
	  emitter.emit('ws-emit-send', rxd); 
        }
      }
      else if(rxd.exit && rxd.stopEvent){
        // remove all channel/topic events upon client exit
	findWatchChannelEvent(rxd, (data, i) => {
	  match = true;
          removeWatchEvent(rxd, data, arrayData, i);
	  m2mUtil.logEvent('client exit - stop all events', rxd.id, data.name, rxd.srcId);
	});
        if(!match){
          m2mUtil.logEvent('*client exit stop all events fail', rxd.id, rxd.srcId);
        }
      }
    }
    catch(e){
      m2mUtil.logEvent('findWatchEventToRemove error:', e.message);
    }
  }
  
  function stopWatchingChannelEvent(arrayData){
    arrayData.forEach((data) => {
      clearTimeout(data.watchTimeout);
    })
  }

  // stop all server/server watch events
  function stopWatchServices(){
    try{
      stopWatchingChannelEvent(watchServerChannelData);
    }
    catch(e){
      m2mUtil.logEvent('stopWatchServices error:', e.message);
    }
  }

  // start all server/server watch events
  function startWatchServices(){
    if(watchServerChannelData[0]){
      process.nextTick(enableWatch, watchServerChannelData);
    }
  }

  /****************************
    
      Exit helper functions
    
   ****************************/
  // stop all watch events from ws reset or server offline
  function serverExitProcess(){
    if(spl.server){
      stopWatchServices();
    }
  }

  // stop a specific watch event from client exit/offline
  function stopWatchEventOnClientExit(rxd){
    if(watchServerChannelData.length > 0){
      findWatchEventToRemove(rxd, watchServerChannelData);
    }
  }

  /*************************************************

      Process Channel/topic Data Resource/Service

  **************************************************/
  // capture client event data 
  function setServerEventResources(rxd){
    try{
      let v = null;
      if(rxd.srcId === spl.id && rxd.dstId === spl.id){
        // m2m system error check
        rxd.error = {error:'invalid id - causing a race condition', channel:rxd.channel, serverId:rxd.id}; 
        m2mUtil.logEvent('setServerEventResources error causing a race condition', 'srcId:', rxd.srcId, 'dstId:', rxd.dstId);
        return emitter.emit('ws-emit-send', rxd);
      }

      if(rxd.http){
        v = emitter.emit(rxd.id + rxd.method + rxd.path, rxd);
        if(!v){
          v = emitter.emit(rxd.id + rxd.method + rxd.baseUrl, rxd);
        }
      }
      else if(rxd.channel){ 
        if(rxd.method === 'watch'){ // initial watch/pub data result
          // use watch default method
          v = emitter.emit(rxd.id + rxd.method + rxd.channel, rxd); 
          if(!v){
            v = emitter.emit(rxd.id + rxd.method + rxd.baseTopic, rxd);
          }
        }
        else{
          // 1. use 'dataSource' method first
          let method = 'dataSource'; 
          v = emitter.emit(rxd.id + method + rxd.channel, rxd); 
          if(!v){
            v = emitter.emit(rxd.id + method + rxd.baseTopic, rxd);
          }
          // 2. then use read/write method
          if(!v){
            v = emitter.emit(rxd.id + rxd.method + rxd.channel, rxd);
          }
          if(!v){
            v = emitter.emit(rxd.id + rxd.method + rxd.baseTopic, rxd);
          }
        }
      }

      if(!v){
        if(rxd.http){
	  rxd.error = 'server['+rxd.id+'] - path['+rxd.baseUrl+'] does not exist'; // 404 - not found';
        }
        else if(rxd.channel){ 
	  rxd.error = 'server['+rxd.id+'] - topic['+rxd.name+'] does not exist';
        }
        setImmediate(() => {
          emitter.emit('ws-emit-send', rxd);
        });
      }
      return v;
    }
    catch(e){
      m2mUtil.logEvent('setServerEventResources error:', e.message);
    }
  }
  
  // start publish/subscribe data monitoring/polling
  function publishEventResources(rxd){
    try{
      if(!rxd.event){
        return;
      }

      if(rxd.src === 'browser' && rxd.b){
        // browser access
      }

      if(!setServerEventResources(rxd)){
        return;
      }

      if(!rxd.interval){
        rxd.interval = scanInterval;
      }

      let match = null;

      if(rxd.src === 'browser' && rxd.b){
        setTimeout(() => browserWatch.reset(rxd), browserWatch.timeout);
      }
   
      // option 1: remove previous subscriber watch topic object and create a new one
      if(rxd.remove){
	findWatchChannelEvent(rxd, (data, i) => {
	  clearTimeout(data.watchTimeout);
          try{
            watchServerChannelData.splice(i, 1);
	    m2mUtil.logEvent('client remove channel/topic event', rxd.topic, rxd.id, rxd.srcId, rxd.src); 	
          }
          catch(e){
	    m2mUtil.logEvent('publishEventResources.splice(i, 1) error:', rxd.topic, rxd.srcId, e.message); 
          }
	});
      }

      // option 2: re-use existing subscriber watch topic object
      findWatchChannelEvent(rxd, (data, i) => {
	match = true; 
        clearTimeout(data.watchTimeout);
        m2mUtil.logEvent('client reWatchChannelEvent channel/topic event', rxd.topic, rxd.id, rxd.srcId, rxd.src);
        reWatchChannelEvent(rxd, data);
      });

      if(match){
	return;
      }

      // watch object to track new subscribers
      let wo = { id:rxd.id, name:rxd.name, srcId:rxd.srcId, watchData:null, watchTimeout:null, interval:rxd.interval };

      if(rxd.eventId){
        wo.eventId = rxd.eventId;
      }

      if(rxd.result||rxd.result === false){
        rxd.initValue = rxd.result;
      }
      else if(rxd.value||rxd.value === false){
        rxd.initValue = rxd.value;
      }

      if(rxd.src === 'browser' && rxd.b){
        browserWatch.reset = function(rxd){
          rxd.unwatch = true;
          findWatchEventToRemove(rxd, watchServerChannelData);
        }
      }
      
      if(rxd.response){
	return
      }

      wo.watchData = rxd;																			// 1. Set new subscriber topic to monitor pub/sub resources
      watchServerChannelData.push(wo); 												// 2. Track client subscriber based on topic  
      startWatchingChannelEvent(rxd, watchServerChannelData);	// 3. Start monitoring publish data values for the new subscriber
      m2mUtil.logEvent('client' , 'startWatchingChannelEvent channel/topic event', rxd.topic, rxd.id, rxd.srcId, rxd.src); 
       
    }
    catch(e){
      m2mUtil.logEvent('publishEventResources error:', e.message);
    }
  }

  function unpublishEventResources(rxd){
    if(watchServerChannelData.length > 0){
      findWatchEventToRemove(rxd, watchServerChannelData);
    }
    else{
      rxd.unwatch = false;
      emitter.emit('ws-emit-send', rxd);
    }
  }

  // setup read/write/publish/unpublish channel/topic resources
  function setChannelDataListener(arg, eventName, method, cb){
    let channel = null, response = null;
    if(typeof arg === 'string' && typeof cb === 'function'){
      channel = arg; 
    }
    else if(typeof arg === 'object'){
      channel = arg.channel; 
    }

    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        try{
          // m2m system error check
          if(data.id !== spl.id){
            throw 'invalid server id';
          }
          // for server-as-client request data  
          if(data.srcId && data.dstId && data.srcId === data.dstId){
            m2mUtil.logEvent('setChannelDataListener - invalid data causing a race condition', 'data.srcId:' + data.srcId, 'data.dstId:' + data.dstId);
            throw 'invalid data causing a race condition';
          }
          setImmediate(m2mUtil.validateNameAndPayload, data); // incoming data validation
          if(dataManager){
            dataManager.resources.collectAccessData(data);
          }
  
          // prepare server response function  
          response = (resourceData) => {
            try{
              setImmediate(m2mUtil.validateNameAndPayload, resourceData); // outgoing payload validation
              data.result = resourceData;
              if(data.watch && data.result && data.initValue && (JSON.stringify(data.result) == JSON.stringify(data.initValue))){ 
                // continue monitoring changes in data values in the next iteration
              }
              else{
                // read/write/publish/unpublish topic
              	setImmediate(() => emitter.emit('ws-emit-send', data));
              }
            }
            catch(e){
              m2mUtil.logEvent('setChannelDataListener response error:', JSON.stringify(e));
              throw e;
            }
          }

          // e.g. ws.send(resourceData) or ws.json(resourceData)
          data.send = data.json = response;

          data.topic = data.name;

          // read/write/publish topic response 
          handleResponse(cb, data); 

          // watch/publish data will be sent only if the result has changed
          if(data.watch && data.result && data.name && JSON.stringify(data.result) !== JSON.stringify(data.initValue)){
            data.initValue = data.result;
          }
          // using optional ws.value instead of using ws.send
          // e.g. ws.value = resourceData
          if(data.value){
            if(data.watch && data.value && data.name && JSON.stringify(data.value) !== JSON.stringify(data.initValue)){ 
              setImmediate(() => {
                emitter.emit('ws-emit-send', data);
                data.initValue = data.value;
              });
            }
          }
        }
        catch(e){
          data.result = null; 
          if(e.message){
            data.error = e.message;  
          }
          else{
            data.error = e;  
          }
          // m2m log system failure
          m2mUtil.logEvent('setChannelDataListener error:', JSON.stringify(e), JSON.stringify(data));
        }
      });
      setServerResources(arg, method);
    }
  }

  // check param http path
  // extract param baseUrl from path
  function checkPathForParam(path){
    try{
      let pos = path.indexOf('/:', 1);
      if(pos){
        path = path.substring(0, pos);
        if(path.includes('/:')){
          let error = '\nsystem error - http path ['+path+'] is invalid, still has param /: included';
          throw error;
        }
        return path;
      }
      return null;
    }
    catch(e){
      throw e;
    }
  }

  // setup get/post http resources
  function setHttpDataListener(arg, eventName, cb, method){
    let res = null,  req = null, path = null, response = null; 
    if(typeof arg === 'string' && typeof cb === 'function'){
      path = arg; 
    }
    else if(typeof arg === 'object'){
      path = arg.path; 
    }

    // capture raw/unmodified path 
    setServerHttpResources(path, method);

    try{
      let serverPath = m2mUtil.getParamKeys(path);
 
      if(checkPathForParam(path)){
        path = checkPathForParam(path);
        if(path === serverPath.baseUrl){
          eventName = spl.id + method + path;
        }
      }

      // check/validate path baseUrl - it should not include param keys 
      if(Object.keys(serverPath.params).length > 0 && serverPath.baseUrl !== path){
        let error = '\nhttp path ['+path+'] is invalid';
        console.log(error);
        throw error;
      }

      if(emitter.listenerCount(eventName) < 1){
        emitter.on(eventName, (data) => {
          if(data.id !== spl.id){
            throw 'invalid serverId';
          }
          // incoming data validation
          setImmediate(m2mUtil.validateNameAndPayload, data);
          if(dataManager){
            dataManager.resources.collectAccessData(data);
          }  
          response = (httpDataSource) => {
            try{
              // outgoing payload validation
              setImmediate(m2mUtil.validateNameAndPayload, httpDataSource);
              data.result = httpDataSource;
              setImmediate(() => emitter.emit('ws-emit-send', data));
            }
            catch(e){
              m2mUtil.logEvent('setHttpDataListener response error:', JSON.stringify(e));
              throw e;
            }
          }

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

          data.send = data.json = response;

          if(data.id === spl.id && (data.baseUrl === serverPath.baseUrl||data.path === path)){
            if(method === 'get' && (data.body || data.post)){
              data.error = 'Invalid get request, received a post body';
              return emitter.emit('ws-emit-send', data);
            }
            else if(method === 'post' && (!data.body || data.get)){
              data.error = 'Invalid post request, missing post body';
              return emitter.emit('ws-emit-send', data);
            }

            // create the request object
            req = Object.assign({}, data);
            delete req.send;delete req.json;

            req.params = {};
            
            if(data.urlPathKeys.length === serverPath.urlPathKeys.length){
              serverPath.paramKeys.forEach((value, i) => {
                if(value.key === serverPath.params[value.key]){
                  req.params[value.key] = data.urlPathKeys[value.index].slice(1, data.urlPathKeys[value.index].length);
                }
              });
            }

            // create the response object
            res = Object.assign({}, data);

            if(method === 'post' && res.body){
              delete res.body;
            }

            handleResponse(cb, null, req, res);
          }
        });
      }
    }
    catch(e){
      m2mUtil.logEvent('setHttpDataListener error:', e.message);
    }
  }

  /*******************************************

     Server Endpoint Service/Resources API

  ********************************************/
  function setChannelApi(arg, method, cb){
    const o = {};
    try{
      if(typeof cb !== 'function'){
        throw new Error('invalid callback');
      }
      if(typeof arg === 'string' && typeof cb === 'function'){
	o.id = spl.id;
        o.method = method;      
	o.channel = arg;
      }
      else if(typeof arg === 'object'){
        o = arg;
      }
      else{
        throw new Error('invalid arguments');
      }

      if(!o.channel||!o.method){
        throw new Error('invalid argument, missing channel/method property');
      }
      if(typeof o.channel !== 'string'){
        throw new Error('channel property argument must be a string');
      }
      if(typeof o.method !== 'string'){
        throw new Error('method property argument must be a string');
      }
      //let eventName = o.id + o.method + o.channel;
      let eventName = setChannelResourcesEventName(o);
      setChannelDataListener(o, eventName, method, cb);
    }  
    catch(e){
      m2mUtil.logEvent('setChannelApi error:', e.message);
      throw e;
    }  
  }

  function setPublishData(arg, cb){
    setChannelApi(arg, 'watch', cb);
  }

  function setReadData(arg, cb){
    setChannelApi(arg, 'read', cb);
  }

  function setWriteData(arg, cb){
    setChannelApi(arg, 'write', cb);
  }

  function setDataSource(arg, cb){
    setChannelApi(arg, 'dataSource', cb);
  }

  function validateHttpPath(arg, method){
    if(!arg.startsWith('/')){
      let error = '\nhttp.'+method+' path ['+arg+'] should start with a slash /';
      console.log(new Error(error));
      process.exit(1);
    }
    else if(arg.startsWith('/:')){
      let error = '\nhttp.'+method+' path ['+arg+'] starting with param /: is not allowed';
      console.log(new Error(error));
      process.exit(1);
    }
  }

  function setHttpApi(arg, method, cb){
    if(!arg){
      throw new Error('invalid/missing path argument');
    }
    if(typeof cb !== 'function'){
      throw new Error('invalid callback argument');
    }
    validateHttpPath(arg, method);
    if(typeof arg === 'string' && typeof cb === 'function'){
      let eventName = spl.id + method + arg;  
      setHttpDataListener(arg, eventName, cb, method);
    }
    else{
      throw new Error('invalid arguments');
    }
  }

  function httpGet(arg, cb){
    setHttpApi(arg, 'get', cb);
  }

  function httpPost(arg, cb){
    setHttpApi(arg, 'post', cb);
  }

  // server-as-client method
  function serverClient(){
    // filtered server validated client instance methods  
    const { read, write, subscribe, sub, unsubscribe, unsub, get, post, access } = m2mLib.client();
    return { read, write, subscribe, sub, unsubscribe, unsub, get, post, access };
  }

  /************************************

  		Received Server Endpoint Data

  *************************************/
  function rxEpServerData(rxd){
    try{
      if(rxd.server && rxd.dstId && rxd.error){
        let error = 'server topic ' +rxd.name + ' error: ' + rxd.error;   
        console.log(error);
        m2mUtil.logEvent(rxd.id, 'error:', error);
      }
      else if(client && rxd.server && rxd.activeStart){
        client.startServerActiveSyncOnlineEvent(rxd);
      }
      else if(client && rxd.server && rxd.exit){ 	
        client.startServerActiveSyncOffLineEvent(rxd);
      }
      // nodejs server-as-client instance result only
      else if(client && rxd.server && rxd.dst === 'server-as-client'){
        let eventName = client.setCommonEventName(rxd)
        emitter.emit(eventName, rxd);
      } 
      else if(rxd.client && rxd.exit){ 
        stopWatchEventOnClientExit(rxd);
      }
      // nodejs client, browser client and server-as-client accessing server resources
      else if(rxd.channel||rxd.name && rxd.dst === 'server'){
        // server publish resources
        if(rxd.watch){
          publishEventResources(rxd);
        }
        // server unpublish resources
        else if(rxd.unwatch){
          unpublishEventResources(rxd);
        }
        // server read/write/get/post resources    
        else{
       	  setServerEventResources(rxd);
        }
      }
      else if(rxd.serverSetup){
        getServerSetup(rxd);
      }
      else{
      	sec.rxCommonData(rxd, client, server, edge);
      }
    }
    catch(e){
      m2mUtil.logEvent('rxEpServerData error:', e.message);
    }
  }

  server = {
    exit,
    resources,
    serverSetup,
    rxEpServerData,
    resetWatchData,
    resetServerSetup,
    stopWatchServices,
    startWatchServices,
  };

   const serverEp = new BaseEp('server');	
  // server methods
  serverEp.get = resources.httpGet;
  serverEp.post = resources.httpPost;
  serverEp.read = resources.setReadData;
  serverEp.write = resources.setWriteData;
  serverEp.dataSource = resources.setDataSource;
  serverEp.publish = resources.setPublishData;
  serverEp.pub = resources.setPublishData;
  // server-as-client
  serverEp.Client = serverClient;
  serverEp.createClient = serverClient;
  return serverEp;
} // server

/*********************
 * 
 *    HTTP OBJECT
 * 
 *********************/
const httpLib = () => {
  let Https = require('https');
  let server = null, port = 443, hostname = null;
  let auid = m2mUtil.rid(12); 

  function getCurrentServerUrl(){
    try{
      server = systemConfig.getCurrentServer();
      let n = server.search("node-m2m");
      if(n === -1){
        Https = require('http');
        port = 3000;
      }
      else{
        port = 443;
      }
      return server;
    }
    catch(e){
      m2mUtil.logEvent('http erorr:', JSON.stringify(e));
      console.log('invalid hostname', e.message);
    }
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
            let pd = JSON.parse(d)
            setImmediate(cb, pd);
          }
          catch(e){
            cb('invalid received JSON data, ' + e.message);
          } 
        }
      });
    });
    req.on('node-m2m-error', (e) => {
      console.error('http get request error:', e.message);
      m2mUtil.logEvent('http get request error:', e.message);
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
            let pd = JSON.parse(d)
            //cb(pd);
            setImmediate(cb, pd);
          }
          catch(e){
            cb('invalid received JSON data', e.message);
          } 
        }
      });
    });
    req.on('node-m2m-error', (e) => {
      console.error('http post request error:', e.message);
      m2mUtil.logEvent('http post request error:', e.message);
    });
    // post body
    req.write(data);
    req.end();
  }
    
  // internal test only
  // e.g. client.getTest('/m2m/usr/http-get', (data) => {})
  function getTest(path, cb){
    server = getCurrentServerUrl();
    let url = new URL(server);
    const options = {
      hostname: url.hostname,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }
    getRequest(Https, options, cb);
  }
  
  // internal test only
  // e.g. client.postTest('/m2m/usr/http-post', {name:'ed', age:35}, (data) => {}) 
  function postTest(path, body, cb){
    server = getCurrentServerUrl();
    let url = new URL(server);
    let data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
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
  
  function get(o, cb){
    server = getCurrentServerUrl();
    let tkn = '', apiKey = '';
    let url = new URL(server);

    if(!o.id){
      return cb('missing serverId');
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
      hostname: url.hostname,
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
    
  function post(o, cb){
    server = getCurrentServerUrl();
    let tkn = '', apiKey = '', body = null;
    let url = new URL(server);

    if(!o.id){
      return cb('missing serverId');
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
      hostname: url.hostname,
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
    server = getCurrentServerUrl();
    let tkn = '', apiKey = '', method = 'GET', body = null;
    let url = new URL(server); 

    if(!o.id){
      return cb('missing serverId');
    }
    if(!o.path){
      return cb('missing http path');
    }
    if(!o.tkn){
      tkn = spl.clientId; 
    }
    if(!o.apiKey){
      apiKey = spl.clientId;
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
      hostname: url.hostname,
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
  
  function connect(pl, cb){
    server = getCurrentServerUrl();
    let data = JSON.stringify(pl);
    let path = '/m2m/usr/connect';
    let url = new URL(server);

    const options = {
      hostname: url.hostname,
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

  return {
    get,
    post,
    request,
    connect,
    getTest,
    postTest,
  };
} // httpLib
http = httpLib();

/**********************
 * 
 *    SOCKET OBJECT
 * 
 **********************/
const socket = (() => {
  let THRESHOLD = 1024, connectOption = null;
  let dogTimer = null, dogTimerInterval = 3600000; 
  let ws = null, clientActive = 0, registerAttempt = 0, wsConnectAttempt = 0 , reconnectStatus = null;

  function send(pl){
    if(typeof pl === 'string'){
      throw new Error('ws send error:invalid/string payload');
    }
    if(!pl._pid){
      throw new Error('ws send error:invalid/missing pl._pid');
    }
    if(ws && ws.readyState === 1 && ws.bufferedAmount < THRESHOLD){
      setImmediate(() => {
        ws.send(JSON.stringify(pl), (e) => {
          if(e){
            console.log('ws send error:', e.message);
            m2mUtil.logEvent('ws send error:', e.message);
          }  
        });
      });
    }
  }

  function setEmitSendListener(){
    let eventName = 'ws-emit-send';
    if(emitter.listenerCount(eventName) < 1){
      emitter.on(eventName, (data) => {
        try{
          if(data._pid === 'v-ep'){
            //m2mUtil.logEvent('invalid residual response', data._pid);
            return;
          }
          if(!data._pid){
            m2mUtil.logEvent('invalid/missing data._pid', JSON.stringify(data));
            throw new Error('invalid/missing data._pid');
          }
          if(!data.src){
            m2mUtil.logEvent('invalid/missing data.src', JSON.stringify(data)); 
            throw new Error('invalid/missing data.src');
          }
          if(!data.dst){
            m2mUtil.logEvent('invalid/missing data.dst', JSON.stringify(data)); 
            throw new Error('invalid/missing data.dst');
          }

          if(data.initValue){
	    delete data.initValue;
          }
					
          let src = data.src;
	  let dst = data.dst;
          
          data.dst = src;
          data.src = dst;

          data.response = true;

          process.nextTick(send, data);
        }
        catch(e){
          m2mUtil.logEvent('socket setEmitSendListener error:', e.message);
        }
      });
    }
  }
  setEmitSendListener();

  function currentSocket(){
    return ws;
  }

  function setSocket(s){
    ws = s;
    return ws;
  }

  function wsReconnectAttempt(e, arg, pl, cb){
    const colors = require('colors');
    let randomInterval = null;
    let currentServer = systemConfig.getCurrentServer();
    try{
      if(pl.server){
        randomInterval = Math.floor((Math.random() * 5000) + 1000); // wait 1000 to 6000 ms
      }
      else{
        randomInterval = Math.floor((Math.random() * 10000) + 7000); // wait 7000 to 17000 ms
      }  
      if(e === 1006 || e === 1003){
        if(wsConnectAttempt === 0){
          console.log('node-m2m server', colors.brightBlue(currentServer),'is not ready.\nAttempt to reconnect 1 ...');
	  if(pl.server){
	    server.stopWatchServices();
	    if(fimManager){
	      fimManager.closeAllWatcher();
	    }
	    if(dataManager){
	      dataManager.resources.stopMonitorAccessRate(m2mUtil);
	    }
	  }
	  else if(pl.client){
	    // add client process
	  }
        }
        if(wsConnectAttempt === 1){
          console.log(colors.brightRed('There is no response from the server'), '\nAttempt to reconnect 2 ...');
        }
        if(wsConnectAttempt === 2){
          console.log(colors.brightRed('Cannot establish connection with the server'));
        }
        if(wsConnectAttempt === 3){
          console.log('Waiting for the server to be up and running ...');
          console.log(colors.green('Attempt to reconnect will continue in the background'));
          m2mUtil.logEvent('node-m2m server', server ,'is not ready', 'Error('+ e + ').');
        }
        pl = sec.readCtk();

        if(fimManager){
          fimManager.stopMonEpFS();
          fimManager.stopMonEpApp(); // 1/24/24
        }
        if(m2mUtil.getRestartStatus()){
          // console.log('restart npm ...');
          // add npm script
        }
        else{
          // console.log('reconnect m2m ...');
          // add other methods to process 
        }
        
        reconnectStatus = true;
        
        let timeout = setTimeout(connect, randomInterval, arg, pl, cb);
        wsConnectAttempt++;
        //console.log('Waiting ...')  
      }
    }  
    catch(e){
      m2mUtil.logEvent('wsReconnectAttempt error:', JSON.stringify(e));
    }
  }

  function refreshConnection(){
    if(ws.readyState === 1){
      try{
        let pl = Object.assign({}, spl);
        pl._pid = 'v-ep';
        send(pl);
      }
      catch(e){
        m2mUtil.logEvent('refreshConnection error:', e.message);
        throw e;
      }
    }
  }

  function renewConnection(){
    if(ws.readyState === 1){
      try{
        let pl = Object.assign({}, spl);
        pl._pid = 'renew-ws';
        send(pl);
      }
      catch(e){
        m2mUtil.logEvent('renewConnection error:', e.message);
        throw e;
      }
    }
  }

  function dogTimerProcess(){
    if(ws.readyState === 1){
      renewConnection();
      //refreshConnection();
      dogTimer = setTimeout(dogTimerProcess, dogTimerInterval);
    }
  }

  function setDogTimer(){
    let rn = Math.floor(( Math.random() * 60000) + 20000);
    dogTimerInterval = dogTimerInterval + rn;
    setTimeout(dogTimerProcess, dogTimerInterval);
  }

  function runActiveProcess(){
    if(spl.server){
      console.log('Server['+ spl.id +'] is ready', m2mUtil.et());
      emitter.emit('set-server-resources', spl);
    }
  }

  function cleanRcvdData(rxd){
    delete rxd.code;delete rxd.appData;delete rxd.path;delete rxd.data;
  }
 
  /**********************************

      Received configuration data
      (setup/handshake/init data)

  ***********************************/
  function rxConfigData(rxd, arg, pl, cb){
    try{
      if(rxd.code === 10 && rxd.reason === 'open-test'){
        // acknowledge open-test code
	sec.verifyTestCode(rxd);
      }
      else if(rxd.code === 100 || rxd.code === 101 || rxd.code === 102){
        sec.validateArg(arg, rxd)
        sec.setCtk(rxd.path, rxd.data);
  	m2mUtil.logEvent('register', rxd.code, rxd.reason);
        cleanRcvdData(rxd);
	connect(systemConfig.getCurrentServer(), rxd, cb);
      }
      else if(rxd.code === 110){
        if(rxd.data && !rxd.error){
          sec.setCtk(rxd.path, rxd.data);
          m2mUtil.logEvent('token update', 'success');
          delete rxd.code;delete rxd.path;delete rxd.data;
        }
        else{
          m2mUtil.logEvent('token update fail', rxd.error);
        }
        registerAttempt = 0;
        if(pl.server){
          if(server){
            server.resetServerSetup();
            server.stopWatchServices();
          }
          setImmediate(connect, arg, spl, cb);
        }
      }
      else if(rxd.code === 200 || rxd.code === 210 || rxd.code === 220){
        spl = Object.assign({}, pl);
        setDefaults(spl, socket);

        sec.setFimConfig();
 
        registerAttempt = 0;
       
        if(processRuntime === 0){
	  if(clientActive > 0){
	    systemConfig.setExitEvent(pl);
            ++processRuntime
	  }
        }

	m2mUtil.logEvent('reconnection -', rxd.reason, '('+rxd.code+')');
	      
	m2mUtil.m2mInfo(pl, systemConfig.getCurrentServer());

	if(cb){ 
	  let el = emitter.emit('emit-connect', rxd.reason);
	  //cb(rxd.reason); // same as above
	}
	else{
	  console.log('connection:', rxd.reason);
	}

        if(rxd.servers){
          systemConfig.setValidServers(rxd.servers);
        }
                
        if(spl.client){
          if(client){
            client.id = spl.clientId;
            client.stopClientDataAccess();

          }
        }
        else if(spl.server){ 
          setImmediate(runActiveProcess);
          if(server){
            server.serverSetup.id = spl.id;
            server.id = spl.id;
            if(dataManager){
              setImmediate(dataManager.resources.startMonitorAccessRate, server, m2mUtil);
            }
          }
        }
        else if(spl.user){
          // user is already authenticated here
          // add other user processes here  
        }
        
        // add other ep processes here

        // validate edge instance
        if(spl.edgeEp||spl.edgeUser){
          edge.accessEp(spl);
        }  
        // set endpoint security policy/options
        systemConfig.setInitEpSecPolicy(rxd);
      }
      else if(rxd.code === 300){
        if(rxd.aid === pl.aid && rxd.uid === pl.uid && rxd.ak === pl.ak){
          registerAttempt = 0;
          connect(arg, pl, cb);
        }
      }
      else if(rxd.code === 500 || rxd.code === 510 || rxd.code === 520){
        if(clientActive > 1 && registerAttempt < 3 ){
          registerAttempt++;
          console.log('Connect attempt', registerAttempt);
          setTimeout(() => connect(arg, pl, cb), (registerAttempt-1)*100);
        }
        else{
          if(rxd.code === 500){
            console.log('')
            console.log(rxd.reason);
            m2mUtil.logEvent('auth fail', rxd.code, rxd.reason);
            process.kill(process.pid, 'SIGINT');
          }
        }
      }
      else if(rxd.code === 530){
        console.log('\nresult:', rxd.reason);
        console.log('Server id ' + pl.id + ' is invalid/not registered.\n');
        m2mUtil.logEvent('Server id ' + pl.id + ' is invalid/not registered.', rxd.code, rxd.reason);
        process.kill(process.pid, 'SIGINT');
      }
    }
    catch(e){
      m2mUtil.logEvent('rxConfigData error:', e.message);
    }
  }

  /************************************

     Startup connect payload options 

   ************************************/
  function setConnectOption(pl){
    try{
      systemConfig.setDefaultSecConfig(pl);

      if(pl.server){
        if(server){
          server.resetWatchData();
          server.serverSetup.id = pl.id;
        }
      }

      pl.systemInfo = m2mUtil.systemInfo;
      
      if(m2mUtil.getRestartStatus()){
        pl.restartable = true;
      }
      else{
        pl.restartable = false;
      }

      if(pl && clientActive === 0){
        console.log('\nConnecting to remote server ...');  
      }
    }
    catch(e){
      m2mUtil.logEvent('setConnectOption error:', e.message);
    }
  }

  function wsOpenProcess(pl){
    setConnectOption(pl);
    clientActive++;
    wsConnectAttempt = 0;
    setDogTimer();
    m2mUtil.logEvent('ws socket open and active', ws.readyState);
    send(pl);
  }

  function wsRcvdMsgProcess(msg, arg, pl, cb){
    try{
      let rxd = JSON.parse(msg);
      //console.log('rxd', rxd)
      if(Array.isArray(rxd) && Object.keys(rxd[0]).length > 0){
	  if(pl.client||pl.user||pl.edgeUser){
	    rxd = rxd[0];
	    if(client){
	      process.nextTick(client.rxEpClientData, rxd);
	    }
	    else if(edge){ 
	      process.nextTick(sec.rxCommonData, rxd, null, null, edge);
	    }
	  }
       }
       else if(Object.keys(rxd).length > 0){
	  if(rxd.code){   
	    rxConfigData(rxd, arg, pl, cb);
	  }
	  else if(pl.server && server){
	    process.nextTick(server.rxEpServerData, rxd);
	  }
       }
    }
    catch(e){
      m2mUtil.logEvent('wsRcvdMsgProcess - ws.on(msg) JSON.parse error:', e.message);
    }
  }

  function wsErrorProcess(e){
    if(e.code === 'ENOTFOUND'||e.code ==='ECONNREFUSED'){
      console.log('server is not responding ...\nPlease ensure you are connecting to a valid server.\n');
      if(clientActive < 1){
        process.kill(process.pid, 'SIGINT');
      }
    }
  }

  /*****************

      httpConnect

   *****************/
  function httpConnect(arg, pl, cb){
    http.connect(pl, (rxd) => {
      rxConfigData(rxd, arg, pl, cb);
    });
  }

  /****************

      wsConnect

   ****************/
  function wsConnect(arg, pl, cb){
    if(ws){
      ws.close();
    }

    try{
      let server = systemConfig.getCurrentServer();
      let s = server.replace('https', 'wss');
      //ws = new _WebSocket(s + "/m2m");
      ws = new wsCreate(s + "/m2m");
    }
    catch(e){
      throw new Error('error starting new ws', e.message);
    }

    ws.on("open", () => {
      if(ws.readyState === 1) {
        wsOpenProcess(pl);
        if(pl.client){
          client.activateServerActiveSyncOnlineEvent(pl);
        }
      }
    });

    ws.on("message", (msg) => {
    	if(ws.readyState === 1) {
      	wsRcvdMsgProcess(msg, arg, pl, cb);
      }
    });

    ws.on("close", (e) => {
      clearTimeout(dogTimer);
      wsReconnectAttempt(e, arg, pl, cb);
    });

    ws.on("error", (e) => {
      wsErrorProcess(e);
    });
  }

  /**********************************

      authenticate/verify endpoint

   **********************************/
  function connect(arg, pl, cb){
    m2mUtil.st();
    if(pl._pid === 'r-ep'){
      return httpConnect(arg, pl, cb);
    }
    else{
      return wsConnect(arg, pl, cb);
    }
  }

  return {
    send,
    connect,
    setSocket,
    currentSocket,
    refreshConnection,
  }
})(); // socket

/**************
 * 
 *    MAIN
 * 
 **************/
function main(){  
  /**
   * @param {string|object} arg - if not provided, defaults to demo node-m2m server; if provided, it will use it as user custom server
   * @param {callback} cb - function to be executed after authentication
   * @returns {boolean} success|true, if authentication is successful; fail|false, otherwise
   */
  function authConnection(arg, pl, cb){
    if(typeof arg === 'function'){
      cb = arg , arg = null;
    }

    if(typeof cb === 'function'){
      m2mUtil.startConnect(server, cb);
    }

    setDefaults(null, socket);

    systemConfig.setCurrentServer(arg);
  
    if(!pl.server && !pl.client && !pl.user && !pl.ep){
      throw new Error('invalid m2m instance - missing an endpoint server');
    }
    
    if(m2mUtil.argv[0] === '-config' || m2mUtil.argv[0] === '-cp'){
      systemConfig.setPkgConfig(pl);
      return;
    }
    
    systemConfig.getPkgConfig(pl); 
 
    // After initial authentication, authenticate/renew user token w/ userid & pw.
    if(m2mUtil.argv[0] === '-r'){
      sec.m2mStart(arg, pl, socket, cb);
      return;
    }
  
    // After initial authentication, authenticate/renew user token using sc only.
    if(m2mUtil.argv[0] === '-sc'){
      sec.m2mStart(arg, pl, socket, cb);
      return;
    }
  
    // authenticate/renew user token as credential object option for test only
    if(arg && typeof arg === 'object' && arg.userid && arg.pw){
      sec.m2mStart(arg, pl, socket, cb);
      return;
    }

    // Start app using the available/existing token for authentication.
    // If token is not valid or available, user will be prompted for valid credentials.
    sec.m2mRestart(arg, pl, socket, cb);
  }

  m2mLib.authConnection = authConnection;
}    

main();

module.exports = m2mLib;

