const fs = require('fs');
const m2m = require('m2m');
const sinon = require('sinon');
const assert = require('assert');
const { m2mTest } = require('../lib/client.js');

let dl = 100;
let clientTotal = 0;
let clientPassed = 0;
let clientFailed = 0;

describe('\nset test stats ...', function() {
  before(function() {
    // runs once before the first test in this block
    sinon.stub(console, 'log'); 
    sinon.stub(console, 'info'); 
    sinon.stub(console, 'warn');
    sinon.stub(console, 'error'); 

    let spl = {id:'12ab8c92', appId:'12ab8c92', _pid:'r-a', m2mTest:true, app:true, src:'client', reg:true};
    m2mTest.enable(spl);

  });

  after(function() {
    // runs once after the last test in this block
  });

  beforeEach(function() {
    // runs before each test in this block
    clientTotal++;
  });

  afterEach(function() {
    // runs after each test in this block
    if (this.currentTest.state === 'passed') {
      clientPassed++;
    }
    if (this.currentTest.state === 'failed') {
      clientFailed++;
    }
    exports.clientTotal = clientTotal;
    exports.clientPassed = clientPassed;
    exports.clientFailed = clientFailed;

  });

  // test cases
  describe('\nQuick m2m object test ...', function () {
    describe('requiring m2m module', function () {
      it('should return an object with 4 methods', function (done) {

        m2mTest.enable();

        assert.strictEqual( m2m instanceof Object, true);
        assert.strictEqual( typeof m2m, 'object');
        assert.strictEqual( typeof m2m.Server, 'function');
        assert.strictEqual( typeof m2m.Device, 'function');
        assert.strictEqual( typeof m2m.Client, 'function');
        assert.strictEqual( typeof m2m.connect, 'function');
        done();

      });
    });
  });

  describe('\nClient object test ...', function () {
    describe('create a client object w/o an argument', function () {
      it('should return an object with a property id of type string', function (done) {
        const client = new m2m.Client();

        let id = client.id;

        assert.strictEqual( typeof client, 'object' );
        assert.strictEqual( client.client, true );
        assert.strictEqual( typeof id, 'string' );
        assert.strictEqual( id.length, 8 );
        done();   

      });
    });
    describe('create a device object using a single argument device id', function () {
      it('should return an object if argument type is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);

        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( Number.isInteger(device.id), true );
        assert.strictEqual( device.id, 100 );
        done();

      });
      it('create a device object if the argument provided is an array w/ a single element', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        client.accessDevice([100], function (err, device){
				  if(err) throw err;
          assert.strictEqual( typeof device, 'object' );
          assert.strictEqual( device.id, 100 );
          assert.notStrictEqual( Array.isArray(device), true );
          done();
        });
      });
    });
    describe('create an array device object using an array argument', function () {
      it('w/o callback it should return an array object', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let arg = [100, 200, 300];
        let device = client.accessDevice(arg);
        
        assert.strictEqual( Array.isArray(device), true );
        assert.strictEqual( device instanceof Array, true );
        assert.strictEqual( arg.length, device.length );
        done();

      });
      it('w/ callback it should return an array object as well', function (done) {
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
      it('w/o callback it should throw an error if argument is not an array (more than 1 integer argument)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        try{
        	let device = client.accessDevice(100, 200, 300);
        }
        catch(e){
				  assert.strictEqual( e.message, 'access id more than 1 must be contained in an array');
          done();
        }
      });
       it('w/ callback it should throw an error if argument is not an array (more than 1 integer argument) as well', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        try{
        	client.accessDevice(100, 200, 300, function (err, device){});
        }
			  catch(e){
				  assert.strictEqual( e.message, 'access id more than 1 must be contained in an array');
          done();
        }
      });
      it('callback should return w/ a device object if client constructor has an object argument', function (done) {

        const client = new m2m.Client({});
        assert.strictEqual( typeof client, 'object' );

       	client.accessDevice(100, function (err, device){
          if(err) throw err;
          console.log('device', device);
          assert.strictEqual( device._index, 0);
          assert.strictEqual( device.id, 100);
          done();
        });
      });
    });
    describe('test local device object method - getData()', function () {
      it('should throw an error if a callback argument is not provided', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.getData('test1');
        }
        catch(e){
          assert.strictEqual(typeof e, 'object');
          // 'path: test1 - initial callback is required'
          // assert.strictEqual( e.message, 'callback argument is required');
          done();
        }
        
      });
      it('should throw an error if channel argument is not a string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.getData(120, function(err, data){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid channel/path');
				  done();
        }
      });
      it('should throw an error if channel argument is not an alpha numeric/has an invalid characters', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.getData('$get', function(err, data){
            assert.strictEqual( err.message, 'invalid channel/path');
            assert.strictEqual( data, null);
            done();
          });
        }
        catch(e){
          throw e;
        }
      });
      it('should throw an error if callback is not a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.getData('test-getData', 'invalid callback');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should execute the method w/o error if payload argument is a string and w/ a valid callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.getData('test-passed', (err, data) => {
            if(err) throw err;
            assert.strictEqual( err, null );
            assert.strictEqual( data, 'test-passed' );
            done();
          });
        }
        catch(e){
          throw e;
        }
      });
    });
    describe('test local device object method - get()', function () {
      /*it('should throw an error if a callback argument is not provided', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.get('test1');
        }
        catch(e){
          assert.strictEqual( e.message, 'callback argument is required');
          done();
        }
        
      });*/
      it('should throw an error if channel argument is not a string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.get(120, function(err, data){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid channel/path');
				  done();
        }
      });
      it('should throw an error if callback is not a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.get('test-get', 'invalid callback');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
    });

    describe('test local device object method - sendData()', function () {
      it('should throw an error if channel argument is not a string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData(120, '2.5', function(err, data){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid channel/path');
				  done();
        }
      });
      it('should throw an error if payload argument is not provided', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test1');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid/missing payload');
          done();
        }
      });
      it('should throw an error if payload argument is not a string, number or object', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test1', function(){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid payload/body');
          done();
        }
      });
      it('should throw an error if channel argument is not an alpha numeric/has an invalid characters', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('$invalid channel', '23.45', function(err, data){
            assert.strictEqual( err.message, 'invalid channel/path');
            assert.strictEqual( data, null);
            done();
          });
        }
        catch(e){
          throw e;
        }
      });
      /*it('should throw an error if payload argument is not an alpha numeric/has an invalid characters', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test-invalid-payload', '&invalid', function(err, data){
            assert.strictEqual( err.message, 'invalid payload/body');
            assert.strictEqual( data, null);
            done();
          });
        }
        catch(e){
          throw e;
        }
      });*/
      it('should throw an error if a callback is not function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test1', {temp:25.45}, '() => {}');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should execute the method w/o error if payload argument is a string and w/o a callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test-passed', '25.45');
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method w/o error if payload argument is a number and w/o a callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test1', 25.45);
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method w/o error if payload argument is an object and w/ a callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.sendData('test1', {temp:25.45}, () => {});
          done();
        }
        catch(e){
          throw e;
        }
      });
      
    });

    describe('test local device object method - post()', function () {
      it('should throw an error if channel argument is not a string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post(120, '2.5', function(err, data){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid channel/path');
				  done();
        }
      });
      it('should throw an error if payload argument is not provided', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid/missing body');
          done();
        }
      });
      it('should throw an error if body argument(body is a function) is not a string or object', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1', function(){});
        }
        catch(e){
          //assert.strictEqual( e.message, 'invalid payload/body');
          done();
        }
      });
      it('should throw an error if body argument(body is a number) is not a string or object', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1', 25.45);
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid payload/body');
          done();
        }
      });
      it('should throw an error if a callback is not function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1', {temp:25.45}, {});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should execute the method w/o error if body argument is a string and w/o a callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1', 'string body');
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method w/o error if body argument is an object and w/ a callback', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.post('test1', {temp:25.45}, () => {});
          done();
        }
        catch(e){
          throw e;
        }
      });
    });
    describe('test local device object method - watch()', function () {
		  it('should throw an error if channel argument is not string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(210);
        assert.strictEqual( typeof device, 'object' );

        // api
        // device.watch(channel, interval, cb);
        try{
		      device.watch(125, function(err, result){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid channel/path');
          done();
        }
      });
      it('should throw an error if interval argument is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(210);
        assert.strictEqual( typeof device, 'object' );

        // api
        // device.watch(channel, interval, cb);
        try{
		      device.watch('test-channel', '6000', function(err, result){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid interval');
          done();
        }
      });
      it('should execute the method w/o error if channel argument is valid', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(220);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.watch('test-passed', function(err, result){ 
				    if(err) throw err;
            assert.strictEqual( err, null );
            done();
          });
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method w/o error if interval argument is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(230);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.watch('test-passed', 6000, function(err, result){ 
				    if(err) throw err;
            assert.strictEqual( err, null );
            done();
          });
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method w/ only a valid channel argument and w/o a callback argument', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(240);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.watch('test-passed', ()=>{}); // initialize w/ a callback
        }
        catch(e){
          throw e;
        }

        try{
          device.watch('test-passed'); // no callback required
          done();
        }
        catch(e){
          throw e;
        }

      });
      it('should execute the method w/ valid channel and interval argument and w/o a callback argument', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(240);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.watch('test-passed', ()=>{}); // initial call requires a callback
         }
        catch(e){
          throw e;
        }

        try{
          device.watch('test-passed', 7000); // subsequent calls, no callback is required 
          done();
        }
        catch(e){
          throw e;
        }

      });
    });
    describe('local device object test - gpio()', function () {
      it('should throw an error if argument type is not an object', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio('33');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid argument');
          done();
        }
      });
      it('should throw an error if argument has a missing pin property', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({mode:'input'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid/missing pin');
          done();
        }
      });
      it('should throw an error if pin argument is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({mode:'input', pin:'33'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid pin');
          done();
        }
      });
      it('should throw an error if argument has a missing mode property', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({pin:33});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid/missing mode (input or output?)');
          done();
        }
      });
      it('should throw an error if mode argument is not a string', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({pin:33, mode:{}});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid mode');
          done();
        }
      });
      it('should throw an error if argument mode property is not input or output', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({mode:'watch', pin:33});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid mode');
          done();
        }
      });
    });
    describe('local device object test - input gpio().getState()', function () {
      it('should throw an error if callback argument is not a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

        let callback = function(err, result){
          assert.notStrictEqual(result, null);
        }

        try{
          device.gpio({mode:'in', pin:33}).getState('callback');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should throw an error if callback argument is missing', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(110);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:13}).getState();
          done();
        }
        catch(e){
          assert.strictEqual( e.message, 'callback argument is required');
          done();
        }
      });
      it('should execute the method if the callback argument is valid', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:13}).getState(()=>{});
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if callback has an error', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'in', pin:16}).state(function(err, state){ 
          //console.log('err, data );
          assert.strictEqual( err.message, 'invalid input data');
          assert.strictEqual( state, null);
          done();
        });
      });
      it('should execute the method if callback has a valid data (using an internal input test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(200);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'in', pin:11}).getState(function(err, state){ 
          //console.log(err, state );
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
    });
    describe('local device object test - input gpio().watch()', function () {
      it('should throw an error if poll interval is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:13}).watch('6000');
          done();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid poll interval');
          done();
        }
      });
      it('should throw an error if callback argument is not a function without poll interval', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(300);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:13}).watch({});
          done();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid poll interval');
          done();
        }
      });
      it('should throw an error if callback argument is not a function w/ poll interval', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(310);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:13}).watch(7000, {});
          done();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should execute the method if callback has an error', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

        // don't use pin 11 and 13 
        device.gpio({mode:'in', pin:16}).watch(function(err, state){ 
          //console.log('err, data );
          assert.strictEqual( err.message, 'invalid input data');
          assert.strictEqual( state, null);
          done();
        });
      });
      // duplicate test
      /*it('should execute the method if callback has an error data (using an external test emitter)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(330);
        assert.strictEqual( typeof device, 'object' );

        // don't use pin 11 and 13 
        let pin = 15; _pid = 'gpio-input';
        let eventName = device.id + _pid + pin + true + true;

        device.gpio({mode:'in', pin:16}).watch(function(err, state){ 
          //console.log('err, data );
          assert.strictEqual( err.message, 'invalid input data');
          assert.strictEqual( state, null);
          done();
        });
        m2mTest.testEmitter.emit(eventName, { id:device.id, pin:pin, _pid:_pid, input:true, state:true, error:'invalid input data' });
      });*/
      it('should execute the method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(320);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'input', pin:13}).watch(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
    });
    describe('local device object test - input gpio().unwatch()', function () {
      it('should throw an error if callback argument is not a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

       try{
          device.gpio({mode:'input', pin:13}).unwatch({});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }

      });
      it('should execute the method if callback argument is not provided', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'input', pin:11}).unwatch();
          done()
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if callback has a valid data (using an internal test, true)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'input', pin:13}).unwatch(function(err, result){ 
          assert.strictEqual( err, null);
          assert.strictEqual( result, true);
          done();
        });
      });
      it('should execute the method if callback has a valid data (using an internal test, false)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'input', pin:16}).unwatch(function(err, result){ 
          assert.strictEqual( err, null);
          assert.strictEqual( result, false);
          done();
        });
      });
    });

    describe('local device object test - output gpio().getState()', function () {   
      it('should throw an error if callback argument is missing', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.gpio({mode:'out', pin:33}).getState();
        }
        catch(e){
          assert.strictEqual( e.message, 'callback argument is required');
          done();
        }
      });
      it('should throw an error if callback argument is not a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:33}).getState({});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
          done();
        }
      });
      it('should execute the method if callback has a valid error data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'out', pin:16}).getState(function(err, state){ 
          //console.log(err, state)
          assert.strictEqual( err.message, 'invalid output data');
          assert.strictEqual( state, null);
          done();
        });
      });
      it('should execute the method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'output', pin:33}).getState(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
    });

    describe('local device object test - output gpio().off()', function () {
      it('should throw an error if argument time delay is not an integer or function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:33}).off('33');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid time delay');
          done();
        }
      });
      it('should execute the method if argument time delay is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:33}).off(3000);
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if argument time delay is a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:35}).off(()=>{});
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if callback has a valid error data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'out', pin:16}).off(function(err, state){ 
          //console.log(err, state)
          assert.strictEqual( err.message, 'invalid output data');
          assert.strictEqual( state, null);
          done();
        });
      });
      it('should execute the method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'output', pin:33}).off(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
      it('should execute the output.off() method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.output(33).off(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
    });
    describe('local device object test - input()', function () {
      it('should throw an error if pin argument is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );


        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.input('11').watch();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid pin');
          done();
        }
      });
      it('should throw an error if on method is executed', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.input(11).on();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid input method');
          done();
        }
      });
      it('should throw an error if off method is executed', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.input(13).off();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid input method');
          done();
        }
      });
      it('should execute the method if pin argument is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(150);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.input(11).watch();
          done();
        }
        catch(e){
          throw e;
        }
      });
    });
    describe('local device object test - output gpio().on()', function () {
      it('should throw an error if argument time delay is not an integer or function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(100);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:33}).on('33');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid time delay');
          done();
        }
      });
      it('should execute the method if argument time delay is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(120);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:33}).on(3000);
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if argument time delay is a function', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.gpio({mode:'out', pin:35}).on(()=>{});
          done();
        }
        catch(e){
          throw e;
        }
      });
      it('should execute the method if callback has a valid error data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'out', pin:16}).on(function(err, state){ 
          //console.log(err, state)
          assert.strictEqual( err.message, 'invalid output data');
          assert.strictEqual( state, null);
          done();
        });
      });
      it('should execute the method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        device.gpio({mode:'output', pin:33}).on(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
      it('should execute the output.on() method if callback has a valid data (using an internal test)', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        device.output(33).on(function(err, state){ 
          assert.strictEqual( err, null);
          assert.strictEqual( state, true);
          done();
        });
      });
    });
    describe('local device object test - output()', function () {
      it('should throw an error if pin argument is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.output('33').getState();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid pin');
          done();
        }
      });
      it('should throw an error if watch method is executed', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );


        let device = client.accessDevice(130);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.output(33).watch();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid output method');
          done();
        }
      });
      it('should throw an error if unwatch method is executed', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );


        let device = client.accessDevice(140);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.output(35).unwatch();
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid output method');
          done();
        }
      });
      it('should execute the method if pin argument is an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        let device = client.accessDevice(150);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.output(35).on();
          done();
        }
        catch(e){
          throw e;
        }
      });
    });
    describe('client connecting to remote server', function () {
      it('should throw an error if arguments provided is invalid', function () {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

        try{
          client.connect(function(){}); 
        	client.accessDevice(100, 200);
        }
			  catch(e){
          assert.strictEqual( e.message, 'access id more than 1 must be contained in an array' );
        }
      });
      // no test coverage improvement
      it('should throw an error if argument is not an integer', function (done) {
        const client = new m2m.Client();
        assert.strictEqual( typeof client, 'object' );

			  client.connect(function(err, result){});

        let count = 0;
	      try{
	        let device = client.accessDevice(100.5);
	      }
			  catch(e){
				  assert.strictEqual( e.message, 'server id must be an integer number' );
          if(count === 0){
	        	done();count++;
          }
	      }
      });
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
      it('start connecting if the connect method 1st argument is a string w/ a callback', function (done) {
        const client = new m2m.Client();
        let count = 0;
        assert.strictEqual( typeof client, 'object' );
        let callback = function(err, result){
          if(count === 0 && result === 'success'){
					  done(); count++;
          }
        }
        client.connect('https://www.node-m2m.com', callback);
      });
      it('start connecting if the connect method 1st argument is an object and a callback is provided', function (done) {
        const client = new m2m.Client();

        assert.strictEqual( typeof client, 'object' );
        let callback = function(err, result){
          assert.strictEqual( err, null );
          assert.strictEqual( result, 'success' );
				  done();
        }
        client.connect({server:'https://www.node-m2m.com'}, callback);
      });
      it('start connecting if the connect method callback argument is provided', function (done) {
        const client = new m2m.Client();

        assert.strictEqual( typeof client, 'object' );
        let callback = function(err, result){
          assert.strictEqual( err, null );
          assert.strictEqual( result, 'success' );
				  done();
        }
        client.connect(callback);
      });
    });
    describe('create a device object w/ setupInfo() w/ valid recvd data', function () {
      it('should return w/o an error object', function (done) {

        m2mTest.setTestParam('valid');

        const client = new m2m.Client();

        client.connect(function(err, result){

		      let device = client.accessDevice(200);

          device.setupInfo(function(err, data){
            if(err) throw err;
            assert.strictEqual(err, null);
            //assert.strictEqual(data, true);
            assert.strictEqual(data[0], 100);
            done();
      		});
    
        	/*try{
		      	m2mTest.testEmitter.emit(device.id + 'setupData', {id:device.id, _pid:'setupData', setupData:true});
				  }
				  catch(e){
					  throw e;
		      }*/

      	});
    	});
   	});
    describe('create a device object w/ setupInfo() w/ error', function () {
      it('should return w/ an error object', function (done) {

        m2mTest.setTestParam('invalid'); 

        const client = new m2m.Client();

        client.connect(function(err, result){

		      let device = client.accessDevice(200);

          device.setupInfo(function(err, data){
            if(err){
              assert.strictEqual(data, null);
              assert.strictEqual(err.message, 'invalid');
             	done();
            }
      		});
    
        	/*try{
		      	m2mTest.testEmitter.emit(device.id + 'setupData', {id:device.id, error:'invalid devices', _pid:'setupData', setupData:true, devices:[100, 200]});
				  }
				  catch(e){
					  throw e;
		      }*/

      	});
    	});
   	});
    describe('create a device object invoking device.setupInfo() w/o a callback', function () {
      it('should throw an error since callback is required', function (done) {

        const client = new m2m.Client();

        client.connect(function(err, result){

		      let device = client.accessDevice(200);
    
        	try{
            device.setupInfo();
				  }
				  catch(e){
            assert.strictEqual(e.message, 'callback is required');
					  done();
		      }
      	});
    	});
   	});
    describe('create a client object invoking .getDevices() method', function () {
      it('should return the available devices', function (done) {

        const client = new m2m.Client();

        client.connect(function(err, result){
          client.getDevices(function(err, devices){
      	    if(err) return console.error('getDevices err:', err);
      	    console.log('devices', devices);
            assert.strictEqual(Array.isArray(devices), true);
            done();
          });

      	});
     	});
   	});
    describe('create a client object invoking internal .getRegisteredDevices() method', function () { //Array.isArray([1, 2, 3])
      it('should return the available devices', function (done) {

        const { client } = require('../lib/client.js');
        const c1 = new m2m.Client();

        c1.connect(function(err, result){
          setTimeout(function(){
		      client.getRegisteredDevices(function(devices){
      	    console.log('devices', devices);
            assert.strictEqual(Array.isArray(devices), true);
            done();
          });
          }, dl);
      	});
    	});
   	});
    describe('create a client object invoking internal .setGetDeviceIdListener() method w/ valid data', function () {
      it('should accept the data internally if data is an integer or array', function () {
        const { client } = require('../lib/client.js');
        const c1 = new m2m.Client();

        c1.connect(function(err, result){
          assert.strictEqual( err, null );
          let eventName = 'getDeviceId';
          m2mTest.testEmitter.emit(eventName, [100, 200]);
          m2mTest.testEmitter.emit(eventName, 200);
          
      	});
     	});
   	});
    describe('create a client object invoking internal .getRemoteDevices() method w/ valid array data', function () {
      it('should return a valid id internally if array data is valid', function (done) {
        const { client } = require('../lib/client.js');
        const c1 = new m2m.Client();

        let count = 0;
        let rxd = {devices:[{id:100}, {id:200}, {id:300}]};
        c1.connect(function(err, result){
		      client.getRemoteDevices(rxd, function(id){
      	    console.log('id', id);
            assert.strictEqual(typeof id, 'number');
            setTimeout(function(){
              if(count === 0){
                done();
                count++;
              }
            }, dl + 25);
          });
      	});
     	});
   	});
  });

});







