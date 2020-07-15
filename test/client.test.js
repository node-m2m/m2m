var assert = require('assert');
var sinon = require('sinon');

const m2m = require('..');
const c = require('../lib/client.js');

let id1 = null;
let id2 = null;

before(() => {
  sinon.stub(console, 'log'); 
  sinon.stub(console, 'info'); 
  sinon.stub(console, 'warn');
  sinon.stub(console, 'error'); 
});

describe('\nStarting m2m ...', function () {
  describe('requiring m2m module', function () {
    it('should return an object with 4 method properties', function () {
      
      c.setTestOption(true);

      assert.strictEqual( m2m instanceof Object, true);
      assert.strictEqual( typeof m2m, 'object');
      assert.strictEqual( typeof m2m.Server, 'function');
      assert.strictEqual( typeof m2m.Device, 'function');
      assert.strictEqual( typeof m2m.Client, 'function');
      assert.strictEqual( typeof m2m.connect, 'function');

    });
  });
});

describe('\nCreating a client object ...', function () {
  describe('create a client object w/o an argument', function () {
    it('should return an object with a property id of type string', function () {
      const client = new m2m.Client();
      id1 = client.id;

      assert.strictEqual( typeof client, 'object' );
      assert.strictEqual( client.client, true );
      assert.strictEqual( typeof client.id, 'string' );
      assert.strictEqual( client.id.length, 8 );

    });
  });

  describe('Set Client Option', function () {
    it('set the module options using the constructor', function () {
      let options = {code:{allow:true, filename:'client1.js'}, name:'Test App', location:'New York, NY', description:'New Test App'};

      const client = new m2m.Client(options);
      assert.strictEqual( typeof client, 'object' );
      assert.strictEqual( options,  c.options );

    });
    it('should override the constructor option using the .setOption() method', function () {
      let newOptions = {code:{allow:true, filename:'client1.js'}, name:'Test App', location:'New York, NY', description:'New Test App'};

      const client = new m2m.Client({code:{allow:false, filename:'client.js'}, name:'Master App', location:'Boston, MA', description:'Test App'});
      assert.strictEqual( typeof client, 'object' );

      client.setOption(newOptions);
      assert.strictEqual( newOptions,  c.options );

    });
  });

  describe('create another client object with an option argument in the constructor', function () {
    it('should return an object with a new unique id', function () {
      const client = new m2m.Client({code:{allow:true, filename:'client.js'}, name:'Master App', location:'Boston, MA', description:'Test App'});
      id2 = client.id;

      assert.strictEqual( typeof client, 'object' );
      assert.strictEqual( client.client, true );
      assert.strictEqual( typeof client.id, 'string' );
      assert.strictEqual( client.id.length, 8 );
      assert.notStrictEqual(id1, id2); 

    });
  });

  describe('create a device object using a single argument device id', function () {
    it('should return an object if argument type is an integer', function () {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);

      assert.strictEqual( typeof device, 'object' );
      assert.strictEqual( Number.isInteger(device.id), true );
      assert.strictEqual( device.id, 100 );

    });
    it('should return undefined if argument is not an integer', function () {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100.5);
      assert.strictEqual( typeof device, 'undefined' );

    });
    it('should return undefined if number of arguments is more than 1', function () {

      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100, 200);
      assert.strictEqual( typeof device, 'undefined' );

    });
    it('create a device object if a callback argument is provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      client.accessDevice(100, function (err, device){

        assert.strictEqual( err, null );
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.id, 100 );
        assert.notStrictEqual( Array.isArray(device), true );
        done();

      });
    });
  });

  describe('create an array device object using an array argument', function () {
    it('should return an array object', function () {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let arg = [100, 200, 300];
      let device = client.accessDevice(arg);

      assert.strictEqual( typeof device, 'object' );
      assert.strictEqual( Array.isArray(device), true );
      assert.strictEqual( device instanceof Array, true );
      assert.strictEqual( device[0].id, 100 );
      assert.strictEqual( device[1].id, 200 );
      assert.strictEqual( device[2].id, 300 );

    });
    it('should return an array object with a length equal to argument.length', function () {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let arg = [100, 200, 300];
      let device = client.accessDevice(arg);
      
      assert.strictEqual( Array.isArray(device), true );
      assert.strictEqual( device instanceof Array, true );
      assert.strictEqual( arg.length, device.length );

    });
    it('should return undefined if argument is not an array', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100, 200, 300);
      assert.strictEqual( typeof device, 'undefined' );
      done();

    });
    it('create an array object if a callback argument is provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let arg = [100, 200, 300];
      client.accessDevice(arg, function (err, device){

        assert.strictEqual( err, null );
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( Array.isArray(device), true );
        assert.strictEqual( device instanceof Array, true );
        assert.strictEqual( arg.length, device.length );
        assert.strictEqual( device[0].id, 100 );
        assert.strictEqual( device[1].id, 200 );
        assert.strictEqual( device[2].id, 300 );
        done();
      });
    });
    it('returns undefined if argument is not an array when using a callback', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      client.accessDevice(100, 200, 300, function (err, device){
      
        assert.strictEqual( typeof device, 'undefined' );

      });
      done();
    });
  });

  describe('Connecting to remote server', function () {
    it('should throw an error if 1st argument is a string w/o a callback', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );
      try{
        client.connect('https://www.node-m2m.com');
       }
       catch(e){
         assert.strictEqual( e.message, 'invalid arguments');
         done();
      }
    });
    it('should throw an error if 1st argument is an object w/o a callback', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );
      try{
        client.connect({server:'https://www.node-m2m.com'});
       }
       catch(e){
         assert.strictEqual( e.message, 'invalid arguments');
         done();
      }
    });
    it('start connecting if 1st argument is a string w/ a callback', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );
      let callback = function(err, result){
        done();  
      }
      client.connect('https://www.node-m2m.com', callback);
    });
    it('start connecting if 1st argument is an object and a callback is provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );
      let callback = function(err, result){
        done();  
      }
      client.connect({server:'https://www.node-m2m.com'}, callback);
    });
    it('start connecting if only a callback argument is provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );
      let callback = function(err, result){
        done();  
      }
      client.connect(callback);
    });
  });

  describe('Test a local device object property - channel().watch()', function () {
    it('should not throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.channel('test').watch();
       }
       catch(e){
         throw new Error('invalid test');
      }
      done();
    });
    it('should execute the callback if a valid data is available', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'watch-test', event = true, watch = true;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).watch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result.test, 'passed');
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, result:{test:'passed'} });
      done();
    });
    it('should execute callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'watch-fail', event = true, watch = true;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).watch(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, error:'failed' });
    });
    it('should not throw an error if a callback argument is provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'watch-test', event = true, watch = true;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).watch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result.test, 'passed');
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, result:{test:'passed'} });
      done();
    });
  });

  describe('Test a local device object property - channel().unwatch()', function () {
    it('should execute callback and return the result argument as true if watch channel name is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'watch-test', event = false, watch = 'undefined';
      let eventName = device.id + channelName + event + watch + true;

      device.channel(channelName).unwatch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, unwatch:true, name:channelName, result:{test:'passed'} });
    });
    it('should execute callback and return the error argument as "invalid channel" if watch channel name is invalid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'watch-fail', event = false, watch = 'undefined';
      let eventName = device.id + channelName + event + watch + true;

      device.channel(channelName).unwatch(function(err, result){ 
        assert.strictEqual( err.message, 'invalid channel');
        assert.strictEqual( result, null);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, unwatch:true, name:channelName, error:'invalid channel' });
    });
  });
    
  describe('Test a local device object property - channel().getData()', function () {
    it('should throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.channel('test').getData();
       }
       catch(e){
         assert.strictEqual( e.message, 'callback argument is required');
      }
      done();
    });
    it('should create an object if a valid callback argument is provided', function (done) {

      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'getData-test', event = false, watch = false;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).getData(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result.test, 'passed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, result:{test:'passed'}});
    });
    it('should execute callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'getData-fail', event = false, watch = false;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).getData(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, error:'failed' });
    });
  });
  
  describe('Test a local device object property - channel().sendData()', function () {
    it('should throw an error if a 1st argument(payload) is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.channel('test').sendData();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid arguments');
      }
      done();
    });
    it('should not throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.channel('test').sendData('test');
       }
       catch(e){
         throw new Error('invalid callback');
      }
      done();
    });
    it('should create an object if all arguments are provided', function (done) {

      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let callback = function(err, result){
        assert.strictEqual( err, null);
        assert.notStrictEqual( result, null);
      }
       
      device.channel('sendData-test').sendData({payload:'test'},function(err, result){
        assert.strictEqual( err, null);
        assert.strictEqual( result.test, 'passed');
        done();
      });

      c.emitter.emit('100sendData-testfalsefalse', { id:100, name:'sendData-test', result:{test:'passed'} });
      
    });
    it('should execute callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let channelName = 'sendData-fail', event = false, watch = false;
      let eventName = device.id + channelName + event + watch;

      device.channel(channelName).sendData('test', function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:channelName, error:'failed' });
    });
  });

  describe('Test a local device object property - api().get()', function () {
    it('should throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.api('/get-api').get();
      }
      catch(e){
        assert.strictEqual( e.message, 'callback argument is required');
      }
      done();
    });
    it('should create an object if callback argument is provided', function (done) {

      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let api = '/get-test', event = false, watch = false;
      let eventName = device.id + api + event + watch;

      device.api(api).get(function(err, result){
        assert.strictEqual( err, null);
        assert.strictEqual( result.test, 'passed');
        done();
      });

      c.emitter.emit(eventName, { id:device.id, name:api, result:{test:'passed'} });
    });
    it('should execute callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let api = '/get-fail', event = false, watch = false;
      let eventName = device.id + api + event + watch;

      device.channel(api).get(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:api, error:'failed' });
    });
  });

  describe('Test a local device object property - api().post()', function () {
    it('should throw an error if a 1st argument(payload) is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.channel('/post-api').post();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid arguments');
      }
      done();
    });
    it('should throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.channel('post-api').post('test');
       }
       catch(e){
         assert.strictEqual( e.message, 'invalid arguments');
      }
      done();
    });
    it('should create an object if all arguments are provided', function (done) {

      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let callback = function(err, result){
        assert.strictEqual( err, null);
        assert.notStrictEqual( result, null);
      }
       
      let api = '/post-test', event = false, watch = false;
      let eventName = device.id + api + event + watch;

      device.channel(api).post({body:'test'},function(err, result){
        assert.notStrictEqual( result, null);
        assert.strictEqual( result.test, 'passed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:api, result:{test:'passed'} });
      
    });
    it('should execute callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );


      let api = '/post-fail', event = false, watch = false;
      let eventName = device.id + api + event + watch;

      device.api(api).post({body:'test'}, function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, name:api, error:'failed' });
    });
    it('should not throw an error if a callback argument is not provided', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.channel('/post-api').post('test');
       }
       catch(e){
        throw new Error('invalid callback');
      }
      done();
    });
  });

  describe('Test a local device object property - gpio()', function () {
    it('should throw an error if .gpio().on() argument is missing a mode property', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.gpio({pin:33}).on();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid argument');
        done();
      }
      
    });
    it('should throw an error if .gpio().on() argument is missing a pin property', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.gpio({mode:'output'}).on();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid argument');
        done();
      }
    });
    it('should process .gpio().on() if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.gpio({mode:'output', pin:33}).on();
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('should throw an error if .gpio().off() argument is missing a mode property', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.gpio({pin:33}).off();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid argument');
        done();
      }
      
    });
    it('should throw an error if .gpio().off() argument is missing a pin property', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.gpio({mode:'output'}).off();
      }
      catch(e){
        assert.strictEqual( e.message, 'invalid argument');
        done();
      }
    });
    it('should process .gpio().off() if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.gpio({mode:'output', pin:33}).off();
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('should process output .gpio().state(cb) if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let callback = function(err, result){
        assert.notStrictEqual( result, null);
      }

      try{
        device.gpio({mode:'output', pin:33}).state(callback);
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('should execute output .gpio().on() callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-on';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).on(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, output:true, error:'failed' });
    });
    it('should execute output .gpio().on() callback if gpio output state is true or ON', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-on';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).on(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:true });
    });
    it('should execute output .gpio().off() callback if gpio output state is false or OFF', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 15; _pid = 'gpio-output-off';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).off(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, false);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:false });
    });
    it('should execute output .gpio().state() callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).state(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, output:true, error:'failed' });
    });
    it('should execute output .gpio().state() callback if a valid data is rcvd', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).state(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:true });
    });
    it('should execute output gpio().getState() callback and return the passed error argument', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 15; _pid = 'gpio-output-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).getState(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, output:true, error:'failed' });

    });
    it('execute output gpio().getState() callback for valid data', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(400);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'output', pin:pin}).getState(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:true });
    });

    it('process input .gpio().state() if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let callback = function(err, result){
        assert.notStrictEqual( result, null);
      }

      try{
        device.gpio({mode:'input', pin:33}).state(callback);
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('should execute input .gpio().state() callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-input-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'input', pin:pin}).state(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, input:true, error:'failed' });
    });
    it('execute input .gpio().state() callback for valid data', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-input-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'input', pin:pin}).state(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, state:true });
    });
    it('execute input gpio().getState() callback and return an error argument for invalid data', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(400);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-input-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'input', pin:pin}).getState(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, error:'failed' });
    });
    it('execute input gpio().getState() callback if returned data is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(500);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-input-state';
      let eventName = device.id + _pid + pin + false + false;

      device.gpio({mode:'input', pin:pin}).getState(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, state:true });
    });

    it('execute input gpio().watch() callback for valid returned data', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 11, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + true + true;

      device.gpio({mode:'input', pin:pin}).watch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, false);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, state:false });
    });

    it('execute input gpio().unwatch() callback and return the result argument as true for valid watch pin', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 11, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + false + 'undefined';

      device.gpio({mode:'input', pin:pin}).unwatch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, unwatch:true, _pid:_pid, input:true, state:false });
    });
    it('execute input gpio().unwatch() callback and return the error argument as "invalid pin" for invalid watch pin', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 11, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + false + 'undefined';

      device.gpio({mode:'input', pin:pin}).unwatch(function(err, result){ 
        assert.strictEqual( err.message, 'invalid input');
        assert.strictEqual( result, null);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, unwatch:true, _pid:_pid, error:'invalid input', input:true, state:false });
    });
  });

  describe('Test a local device object property - device.in()', function () {
    it('should throw an error if in().state() callback argument is missing', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.in(13).state();
      }
      catch(e){
        assert.strictEqual( e.message, 'callback argument is required');
        done();
      }
      
    });
    it('execute in().getState() callback if gpio input state is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 11; _pid = 'gpio-input-state';
      let eventName = device.id + _pid + pin + false + false;

      device.in(pin).getState(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, state:true });
    });
    it('execute in().watch() callback if gpio input pin is valid pin', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 15, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + true + true;

      device.in(pin).watch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, false);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin,  _pid:_pid, input:true, state:false });
    });
    it('execute in().unwatch() callback and return the result argument as true if watch pin is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 15, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + false + 'undefined';

      device.in(pin).unwatch(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, unwatch:true, _pid:_pid, input:true, state:false });
    });
    it('execute in().unwatch() callback and return the error argument as "invalid pin" for invalid watch pin', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(300);
      assert.strictEqual( typeof device, 'object' );

      let pin = 15, _pid = 'gpio-input';
      let eventName = device.id + _pid + pin + false + 'undefined';

      device.in(pin).unwatch(function(err, result){ 
        assert.strictEqual( err.message, 'invalid input');
        assert.strictEqual( result, null);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, unwatch:true, _pid:_pid, error:'invalid input', input:true, state:false });
    });
  });
  describe('Test a local device object property - device.out()', function () {
    it('should throw an error if out().state() callback argument is missing', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.out(33).state();
      }
      catch(e){
        assert.strictEqual( e.message, 'callback argument is required');
        done();
      }
      
    });
    it('should throw an error if out().getState() callback argument is missing', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );
      try{
        device.out(33).getState();
      }
      catch(e){
        assert.strictEqual( e.message, 'callback argument is required');
        done();
      }
    });
    it('process out().on() if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.out(33).on();
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('process out().off() if argument is valid', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      try{
        device.out(33).off();
      }
      catch(e){
        throw new Error('invalid test');
      }
      done();
    });
    it('execute out().on() callback if a valid data with error is returned', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-on';
      let eventName = device.id + _pid + pin + false + false;

      device.out(pin).on(function(err, result){ 
        assert.strictEqual( result, null);
        assert.strictEqual( err.message, 'failed');
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, output:true, error:'failed' });
    });
    it('execute out().on() callback if a gpio output is true or ON', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-on';
      let eventName = device.id + _pid + pin + false + false;

      device.out(pin).on(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:true });
    });
    it('execute out().off() callback if a gpio output is false or OFF', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 35; _pid = 'gpio-output-off';
      let eventName = device.id + _pid + pin + false + false;

      device.out(pin).off(function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, false);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:false });
    });
    it('execute out().on(t) callback if a delay time is provided and a gpio output is true or ON', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(200);
      assert.strictEqual( typeof device, 'object' );

      let pin = 13; _pid = 'gpio-output-on';
      let eventName = device.id + _pid + pin + false + false;

      device.out(pin).on(100, function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, true);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:true });
    });
    it('execute out().off(t) callback if a delay time is provided and gpio output is false or OFF', function (done) {
      const client = new m2m.Client();
      assert.strictEqual( typeof client, 'object' );

      let device = client.accessDevice(100);
      assert.strictEqual( typeof device, 'object' );

      let pin = 35; _pid = 'gpio-output-off';
      let eventName = device.id + _pid + pin + false + false;

      device.out(pin).off(100, function(err, result){ 
        assert.strictEqual( err, null);
        assert.strictEqual( result, false);
        done();
      });
      
      c.emitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid,  output:true, state:false });
    });
  }); 
});