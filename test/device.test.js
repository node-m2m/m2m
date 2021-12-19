/* Note: Some sections of this test module requires a raspberry pi as test device. */
const os = require('os');
const fs = require('fs');
const m2m = require('m2m');
const sinon = require('sinon');
const assert = require('assert');
const { m2mTest } = require('../lib/client.js');

let dl = 100;
let deviceTotal = 0;
let devicePassed = 0;
let deviceFailed = 0;

describe('\nset test stats ...', function() {
  before(function() {
    // runs once before the first test in this block
  });

  after(function() {
    // runs once after the last test in this block
  });

  beforeEach(function() {
    // runs before each test in this block
    deviceTotal++;
  });

  afterEach(function() {
    // runs after each test in this block
    if (this.currentTest.state === 'passed') {
      devicePassed++;
    }
    if (this.currentTest.state === 'failed') {
      deviceFailed++;
    }
    exports.deviceTotal = deviceTotal;
    exports.devicePassed = devicePassed;
    exports.deviceFailed = deviceFailed;

  });

  // test cases
  describe('\nDevice object test ...', function () {
    describe('create a device object using a single argument device id of type integer', function () {
      it('should return an object with a property id of type integer', function (done) {
        const device = new m2m.Device(100);
        
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.device, true );
        assert.strictEqual( Number.isInteger(device.id), true );
        done();

      });
    });
    describe('create a device object using a single argument device id of type string', function () {
      it('should return an object with a property id of type integer', function (done) {
        const device = new m2m.Device('100');

        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.device, true );
        assert.strictEqual( Number.isInteger(device.id), true );
        done();

      });
    });
    describe('create a device object using a single argument of type object', function () {
      it('should return an object with a property id of type integer', function (done) {
        const device = new m2m.Device({id:100, name:'server1'});
        
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( Number.isInteger(device.id), true );
        assert.strictEqual( device.name, 'server1');
        assert.strictEqual( device.device, true );
        done();

      });
    });
    describe('create a device object using a single argument w/ large device id', function () {
      it('should throw an error if device id provided is too large', function (done) {
        try{
          const device = new m2m.Device(9999999999999999);
          device.connect(function(){});
          device.setChannel('test-channel', function(){});
        }
        catch(e){
          assert.strictEqual( e.message, 'server/device id should not exceed 8 digits');
          done();
        }
      });
    });
    describe('create a device object w/ invalid arguments', function () {
      it('should throw an error if device argument is invalid', function (done) {
        try{
          const device = new m2m.Server(function(){});
          device.connect(function(){});
          device.setChannel('test-channel', function(){});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }
      });
    });
    /*describe('create a device object and attempt to start connecting ...', function () {
		  it('start connecting if 1st argument is a string w/ a callback', function (done) {
		    const device = new m2m.Device(1000); // failing for 100
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(result){
          assert.strictEqual( result, 'success' );
				  done();
		    }
		    device.connect('https://www.node-m2m.com', callback);
		  });
		  it('start connecting if 1st argument is an object and a callback is provided', function (done) {
		    const device = new m2m.Device(2000); // failing for 200
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(result){
          assert.strictEqual( result, 'success'); 
				  done();
		    }
		    device.connect({server:'https://www.node-m2m.com'}, callback);
		  });
		  it('start connecting if only a callback argument is provided', function (done) {
		    const device = new m2m.Device(200);
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(result){
          assert.strictEqual( result, 'success' ); 
				  done();
		    }
		    device.connect(callback);
		  });
	  });*/
	  describe('Using getApi() ...', function () {
      it('should throw an error if route argument is not a string ...', function (done) {

        let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		    m2mTest.enable(spl);

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
        }

        try{
        	device.getApi(33, callback );
    		}
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
				  done();
        } 
      });
      it('should start connecting w/ valid arguments ...', function (done) {

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'random' + device.id;

        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
          done();
        }

        try{
        	device.getApi('test-passed', callback );
		    }
        catch(e){
          throw e;
        } 
      });
    });
    describe('Using postApi() ...', function () {
      it('should start connecting w/ valid arguments', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'random' + device.id;

        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
          done();
        }

        try{
        	device.postApi('test-passed', callback );
		    }
        catch(e){
          throw e;
        } 
      });
    });
    describe('Using setData() ...', function () {
      it('should throw an error if callback is not a function', function (done) {

        let spl = {id:150, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		    m2mTest.enable(spl);

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.id, 150 );

        try{
        	device.setData('test', {});
     		}
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
			    done();
        } 
      });
      it('should throw an error if callback is missing', function (done) {

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.id, 150 );

        try{
        	device.setData('test');
     		}
        catch(e){
          assert.strictEqual( e.message, 'invalid callback argument');
			    done();
        } 
      });
      it('should throw an error if object argument has a missing channel property', function (done) {

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
        }

        try{
        	device.setData({method:'get'}, callback );
    		}
        catch(e){
          assert.strictEqual( e.message, 'invalid argument, missing channel/method property');
			    done();
        } 
      });
      it('should throw an error if object argument has a missing method property', function (done) {

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
        }

        try{
        	device.setData({channel:'/test'}, callback );
    		}
        catch(e){
          assert.strictEqual( e.message, 'invalid argument, missing channel/method property');
			    done();
        } 
      });
      it('should throw an error if channel argument is not a string', function (done) {

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );

        try{
          device.setData(120, ()=>{}); 
    		}
        catch(e){
          assert.strictEqual(e.message, 'invalid arguments');
          done();
        }
      });
      it('should start connecting if string or object argument is valid', function (done) {

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );

        let count = 0;
        let callback = function (data){
          assert.strictEqual( typeof data, 'object' );
          assert.strictEqual(data.name, 'test-passed' );
          if(count === 0){
          	data.send('test-data');
          	done(); count++;
          }
        }
        //let eventName = 'test-random' + device.id;
        try{
          device.setData('test-passed', callback); // string args
          device.setData({channel:'test-passed', method:'sendData'}, callback); // object args
    		}
        catch(e){
          throw e;
        }
      });
    });
    describe('Using setGpio() - input simulation ...', function () {
      it('should throw an error if pin and mode property is missing', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object');
        try{
          device.setGpio({});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }
      });
      it('should throw an error if pin property is missing in simulation type', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
         	device.setGpio({mode:'output', type:'simulation'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }
      });
      it('should throw an error if mode property is missing in simulation type', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        try{
         	device.setGpio({pin:11, type:'simulation'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
        }

        try{
         	device.setGpio({pin:55, type:'simulation'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }

      });
      it('should set a simulated gpio input w/o error if arguments are valid', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
        	device.setGpio({mode:'input', pin:11, type:'simulation'});
        }
        catch(e){
          throw e;
        }
        done();
      });
      it('should set multiple simulated gpio inputs w/o error if pin property is an array', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
			  try{
        	device.setGpio({mode:'input', pin:[11,13], type:'simulation'});
			  }
			  catch(e){
          throw e;
        }
        done();
      });
      it('should set multiple simulated gpio inputs if an optional callback is provided', function (done) {

        let spl = {id:230, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        m2mTest.setTestParam('valid');

        const device = new m2m.Device(230);
        assert.strictEqual( typeof device, 'object' );
        let eventName = 'gpio-Input' + device.id + 13;
     
        let count = 0;
        let callback = function (gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          if(count == 0){
					  done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11,13], type:'simulation'}, callback );

        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:'state', pin:13, state:true});
      });
      it('Should create a single gpio input object if a valid single pin argument is provided', function (done) {

        m2mTest.setTestParam('valid'); 

        const device = new m2m.Device(230);

        let eventName = 'gpio-Input' + device.id + 19;

        let count = 0;
        let callback = function (gpio){
          if(count === 0){
          	done();count++;
          }
        }

        device.setGpio({mode:'input', pin:19, type:'simulation' }, callback);
      });
      it('should set multiple simulated gpio inputs, invoke callback if a valid gpio data is available', function (done) {
      
        let spl = {id:240, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(240);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (gpio){
          
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
            done();count++;
          }
        }

        device.setGpio({mode:'input', pin:[11, 13], type:'simulation'}, callback );

        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:true, pin:11, state:true });
      });
    });
    describe('Using setGpio() - output simulation  ...', function () {
      it('should set a simulated gpio output w/o error if arguments are valid', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
        	device.setGpio({mode:'output', pin:33, type:'simulation'});
        }
        catch(e){
          throw e;
        }
        done();
      });
      it('should set multiple simulated gpio outputs w/o error if pin property is an array', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
        	device.setGpio({mode:'output', pin:[33,35], type:'simulation'});
        }
        catch(e){
          throw e;
        }
        done();
      });
      it('should set multiple simulated gpio outputs if an optional callback is provided', function (done) {

        let spl = {id:153, _pid:'r-d', d:true, device:true, src:'device', reg:true};
        m2mTest.enable(spl);

        m2mTest.setTestParam('valid');

        const device = new m2m.Device(153);
        assert.strictEqual( typeof device, 'object' );

        let count = 0;
        let callback = function (gpio){
          if(count === 0){ 
            assert.strictEqual( gpio.state, true );
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[36, 35], type:'simulation'}, callback );
      });
      
      it('should set multiple simulated gpio outputs if an optional callback is not provided', function (done) {

        let spl = {id:153, _pid:'r-d', d:true, device:true, src:'device', reg:true};
        m2mTest.enable(spl);

        m2mTest.setTestParam('valid');

        const device = new m2m.Device(153);
        assert.strictEqual( typeof device, 'object' );

        try{
        	device.setGpio({mode:'output', pin:[33,35], type:'simulation'});
          done();
        }
        catch(e){
          throw e;
        }
       });
   });
   describe('Using setGpio() - input (raspberry pi) ...', function () {
      it('should throw an error if arguments are invalid', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (gpio){
          assert.strictEqual( typeof gpio, 'object' );
        }

        try{
        	device.setGpio('input', callback );

				  m2mTest.testEmitter.emit(eventName, {id:device.id, input:true, pin:13, state:true});
			  }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
				  done();
        } 

      });
      it('should invoke callback w/ error object if pin is invalid', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:250, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );
           
        let callback = function (gpio){}

        try{
          device.setGpio({mode:'input', pin:43}, callback );
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid pin' );
				  done();
        }

      });
      it('should invoke callback w/ gpio object w/ valid pin 15', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Input' + device.id + 15;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
            assert.strictEqual( typeof gpio, 'object' );
            assert.strictEqual( gpio.state, false );
	         	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'input', pin:15}, callback );
        }
        catch(e){
          throw e; 
        }

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:'state', pin:15, state:false});

      });
      it('should invoke callback w/ error object w/ invalid pin 41', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Input' + device.id + 41;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
            assert.strictEqual( gpio, null );
	         	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'input', pin:41}, callback );
        }
        catch(e){
          throw e; 
        }

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:'state', pin:41, state:false});

      });
      it('should set multiple gpio inputs if rcvd data is valid', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
            done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:true, pin:11, state:true });
      });
      it('should set multiple gpio inputs (event-based) if rcvd data is valid', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 13;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
             done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );

        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:'state', pin:13, state:true , initValue:true});
      });
      /*it('should invoke callback w/ error if rcvd data has an error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (gpio){
    
        }
        done();count++;
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );

        m2mTest.testEmitter.emit(eventName, {error:'invalid test', event:true, id:device.id, input:'state', pin:11, state:true});
      });*/
    });
	  describe('Using setGpio() - output (raspberry pi) ...', function () {
      /*it('should invoke callback w/ error if rcvd data has error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:250, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 35;

        let count = 0; 
        let callback = function (gpio){
        }
        done();count++;
        device.setGpio({mode:'output', pin:[33, 35], id:device.id }, callback );

        m2mTest.testEmitter.emit(eventName, {error:'invalid test', event:false, id:device.id, output:'state', pin:35, state:true});
      });*/
      it('should invoke callback w/ error object using invalid pin 43 (w/o test emitter)', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
    
        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 43;

        let callback = function (gpio){}

        try{
        	device.setGpio({mode:'output', pin:43}, callback );
        }
        catch(e){
				  assert.strictEqual( e.message, 'invalid pin' );
          done();
        }
        
      });
      it('should invoke callback w/ error object using invalid pin 41 (w/ test emitter)', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Output' + device.id + 41;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
            assert.strictEqual( gpio, null );
          	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'output', pin:41}, callback );
        }
        catch(e){
          throw e; 
        }
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:41, state:false});

      });
      it('should invoke callback w/o error if rvcd data is valid', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 35;

        let count = 0; 
        let callback = function (gpio){
          if(count === 0){
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[33, 35], id:device.id}, callback );

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:35, state:false});
      });
      it('should invoke callback w/o error w/ valid rcvd "on" data', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
 
        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let count = 0; 
        let callback = function (gpio){
         	assert.strictEqual( typeof gpio, 'object' );
          if(count === 0){
            assert.strictEqual( gpio.state, true );
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[33, 35], id:device.id}, callback );

        m2mTest.testEmitter.emit(eventName, {event:false, on:true, state:true, id:device.id, output:'on', pin:33});
      });
      it('should invoke callback w/o error w/ valid rcvd "off" data', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let count = 0; 
        let callback = function (gpio){
         	assert.strictEqual( typeof gpio, 'object' );
          if(count === 0){
            assert.strictEqual( gpio.state, false );
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:33}, callback );

        m2mTest.testEmitter.emit(eventName, {event:false, off:true, state:false, id:device.id, output:'off', pin:33});
      });
    });
	  describe('Using setGpio() in non-raspberry pi device', function () {
      it("should throw a 'Sorry, gpio control is not available on your device' error", function (done) {

        if(os.arch() === 'arm'){
          done();
          return console.log('test module is for non-raspberry pi device'); 
        }

        const device = new m2m.Device(250);

        assert.strictEqual( typeof device, 'object' );

        // callback should not be invoked
        let callback = function (gpio){
          assert.strictEqual( gpio, 'invalid test' );          
        };

        // no type property
        try{   
        	device.setGpio({mode:'output', pin:55}, callback );
        }
        catch(e){
				  assert.strictEqual(e.message, 'Sorry, gpio control is not available on your device');
        }

        // type 'int'
        try{   
        	device.setGpio({mode:'output', pin:55, type:'int'}, callback );
        }
        catch(e){
				  assert.strictEqual(e.message, 'Sorry, gpio control is not available on your device');
        }
   
        // type 'internal'
        try{   
        	device.setGpio({mode:'input', pin:55, type:'internal'}, callback );
        }
        catch(e){
				  assert.strictEqual(e.message, 'Sorry, gpio control is not available on your device');
          done();
        }
       
      });
    });
    describe('Invoking internal removeDataEvent() method using exit data', function () {
      it('should return true if exit data is valid ...', function (done) {

        const device = require('../lib/client.js');
        // device => {m2mUtil, client, device, sec, websocket} // valid for method w/ exports
        // not valid for device return {method:method} 

        let rxd = {appId:'acb234', exit:true, stopEvent:true};
        let arrayData = [{appId:'acb234', watchTimeout:{}}, {appId:'acb678', watchTimeout:{}}];

        setTimeout(function(){
          assert.strictEqual(typeof device.removeDataEvent, 'function'); 

          device.removeDataEvent(rxd, arrayData, function(result){
            if(result){
              done();
            }
          });
        }, dl);
           
      });
    });
    describe('Invoking internal removeDataEvent() method using channel data', function () {
      it('should return true if channel data is valid ...', function (done) {

        const device = require('../lib/client.js');

        let rxd = {id:'acb678', appId:'acb678', unwatch:true, name:'channel-data', src:'client', dst:'device'};
        let arrayData = [{id:'acb678', appId:'acb678', name:'channel-data', watchTimeout:{}}, {id:'wrt543', appId:'wrt543', name:'channel-data', watchTimeout:{}}];

        setTimeout(function(){
          assert.strictEqual(typeof device.removeDataEvent, 'function'); 

          device.removeDataEvent(rxd, arrayData, function(result){
            assert.strictEqual( result, true); 
            if(result){
              done();
            }
          });
        }, dl);
           
      });
    });
    describe('Invoking internal removeDataEvent() method using gpio pin data', function () {
      it('should return true if gpio pin data is valid ...', function (done) {

        const device = require('../lib/client.js');

        let rxd = {id:'asd678', appId:'asd678', unwatch:true, pin:33, src:'client', dst:'device'};
        let arrayData = [{id:'asd678', appId:'asd678', pin:33, watchTimeout:{}}, {id:'wrt543', appId:'wrt543', name:'channel-data', watchTimeout:{}}];

        setTimeout(function(){
          assert.strictEqual(typeof device.removeDataEvent, 'function'); 

          device.removeDataEvent(rxd, arrayData, function(result){
            assert.strictEqual( result, true); 
            if(result){
              done();
            }
          });
        }, dl);
           
      });
    });
    describe('Invoking internal iterateDataEvent() method using channel data', function () {
      it('should process the channel data ...', function (done) {

        const device = require('../lib/client.js');

        // note: data in arraydata => .src & .dst is required for emitter.emit('emit-send', rxd);
        let arrayData = [{id:'wrt543', appId:'wrt543', src:'client', dst:'device', event:true, name:'channel-data', initValue:'55', 
        value:'25'}, {id:'asd678', appId:'asd678', event:false, input:true, unwatch:true, pin:33, state:false, src:'client', dst:'device'}];

        setTimeout(function(){
          assert.strictEqual(typeof device.iterateDataEvent, 'function'); 

          device.iterateDataEvent(arrayData, function(data){
            assert.strictEqual( data.id, 'wrt543');
            assert.strictEqual( data.event, true); 
            assert.strictEqual( data.name, 'channel-data');
            assert.strictEqual( data.value, '25');
            done(); 
          });
        }, dl);
      });
    });
    describe('Invoking internal iterateDataEvent() method using gpio output data', function () {
      it('should process the gpio output data ...', function (done) {

        const device = require('../lib/client.js');

        // note: data in arraydata => .src & .dst is required for emitter.emit('emit-send', rxd);
        let arrayData = [{id:'wrt543', appId:'wrt543', src:'client', dst:'device', event:false, name:'channel-data', value:'25'}, 
        {id:'asd678', appId:'asd678', event:true, output:true, initValue:true, pin:33, state:false, src:'client', dst:'device'}];

        setTimeout(function(){
          assert.strictEqual(typeof device.iterateDataEvent, 'function'); 

          // iterateDataEvent(arrayData, cb) // function(rxd){
          device.iterateDataEvent(arrayData, function(data){
            assert.strictEqual( data.id, 'asd678');
            assert.strictEqual( data.event, true); 
            assert.strictEqual( data.output, true);
            assert.strictEqual( data.pin, 33);
            assert.strictEqual( data.state, false);
            done(); 
          });
        }, dl);
      });
    });
    describe('Invoking internal iterateDataEvent() method using gpio input data', function () {
      it('should process the gpio input data ...', function (done) {

        const device = require('../lib/client.js');
        // device => {m2mUtil, client, device, sec, websocket} // valid for method w/ exports
        // not valid for device return {method:method} 

        // note: data in arraydata => .src & .dst is required for emitter.emit('emit-send', rxd);
        let arrayData = [{id:'wrt543', appId:'wrt543', src:'client', dst:'device', event:false, name:'channel-data', value:'25'}, 
        {id:'asd678', appId:'asd678', event:true, input:true, initValue:false, pin:11, state:true, src:'client', dst:'device'}];

        setTimeout(function(){
          assert.strictEqual(typeof device.iterateDataEvent, 'function'); 

          // iterateDataEvent(arrayData, cb) // function(rxd){
          device.iterateDataEvent(arrayData, function(data){
            assert.strictEqual( data.id, 'asd678');
            assert.strictEqual( data.event, true); 
            assert.strictEqual( data.input, true);
            assert.strictEqual( data.pin, 11);
            assert.strictEqual( data.state, true);
            done(); 
           
          });
        }, dl);
      });
    });
    describe('Invoking internal exit object method properties', function () {
      it('should process the exit object method properties ...', function (done) {

        const { device } = require('../lib/client.js'); 
        /*let exit = {
          gpioExitProces: gpioExitProces,
          deviceExitProcess: deviceExitProcess,
          deviceExitProcessFromClient: deviceExitProcessFromClient,
        }*/

        setTimeout(function(){
          assert.strictEqual(typeof device.exit, 'object'); 
          assert.strictEqual(typeof device.exit.gpioExitProcess, 'function');
          assert.strictEqual(typeof device.exit.deviceExitProcess, 'function');
          assert.strictEqual(typeof device.exit.deviceExitProcessFromClient, 'function');
        
          device.exit.gpioExitProcess();
          device.exit.deviceExitProcess();
          device.exit.deviceExitProcessFromClient({appId:'app234'});
          done();

        }, dl);
      });
    });
    describe('Invoking internal input object method properties', function () {
      it('should process the input object method properties ...', function (done) {

        const { device } = require('../lib/client.js');
        /*let input = {
            getGpioInputSetup: getGpioInputSetup,
            GetGpioInputState: GetGpioInputState,
            deviceWatchGpioInputState: deviceWatchGpioInputState,
          };
        */
        let rxd = {id:100, src:'client', input:true, dst:'device', pin:13, state:true};

        setTimeout(function(){
          assert.strictEqual(typeof device.input, 'object'); 
          assert.strictEqual(typeof device.input.getGpioInputSetup, 'function');
          assert.strictEqual(typeof device.input.GetGpioInputState, 'function');
          assert.strictEqual(typeof device.input.deviceWatchGpioInputState, 'function');

          device.input.getGpioInputSetup();
          device.input.GetGpioInputState(rxd); 
          device.input.deviceWatchGpioInputState(rxd);
          done();

        }, dl);
      });
    });
    describe('Invoking internal output object method properties', function () {
      it('should process the output object method properties ...', function (done) {

        const { device } = require('../lib/client.js');
        /*let output = {
          GetGpioOutputState: GetGpioOutputState,
          getGpioOutputSetup: getGpioOutputSetup,
          deviceWatchGpioOutputState: deviceWatchGpioOutputState,
        };
        */
        let rxd = {id:100, src:'client', output:true, dst:'device', pin:33, state:false};

        setTimeout(function(){
          assert.strictEqual(typeof device.output, 'object'); 
          assert.strictEqual(typeof device.output.GetGpioOutputState, 'function');
          assert.strictEqual(typeof device.output.getGpioOutputSetup, 'function');
          assert.strictEqual(typeof device.output.deviceWatchGpioOutputState, 'function');

          device.output.getGpioOutputSetup();
          device.output.GetGpioOutputState(rxd);
          device.output.deviceWatchGpioOutputState(rxd);
          done();

        }, dl);
      });
    });
    describe('Invoking internal resources object method properties', function () {
      it('should process the resources object method properties ...', function (done) {

        const os = require('os');
        const { device } = require('../lib/client.js');
        /*let resources = {
          setApi: setApi,
          getApi:getApi,
          postApi:postApi,
          setData: setData,
          setGpio: setGpio,
        };
        */
        let args = {id:100, src:'client', channel:true, dst:'device', name:'test-channel', value:'test'};

        let cb = (data) => {
          console.log('===> data', data);
          done();
        };  

        setTimeout(function(){
          assert.strictEqual(typeof device.resources, 'object'); 
          assert.strictEqual(typeof device.resources.setApi, 'function');
          assert.strictEqual(typeof device.resources.getApi, 'function');
          assert.strictEqual(typeof device.resources.postApi, 'function');
          assert.strictEqual(typeof device.resources.setData, 'function');
          assert.strictEqual(typeof device.resources.setGpio, 'function');
         
          try{
            device.resources.setApi({route:'/myapi', method:'get'}, cb); // oject args
            device.resources.getApi('/get', cb); // string args
            device.resources.postApi('/post', cb); // string args
            device.resources.setData('test-channel', cb); // string args
            device.resources.setData({channel:'test-channel', method:'sendData'}, cb); // oject args
            device.resources.setGpio(args, cb); // object args
          }
          catch(e){
            if(os.arch() !== 'arm'){ 
              console.log(e.message, 'Sorry, gpio control is not available on your device');
            }
          }

          let eventName = 'set-device-resources';

          m2mTest.testEmitter.emit( eventName, { args });

          done();

        }, dl + 50);
      });
    });

  });

});

