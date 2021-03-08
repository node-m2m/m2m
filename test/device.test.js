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
    describe('create a device object and attempt to start connecting ...', function () {
		  it('start connecting if 1st argument is a string w/ a callback', function (done) {
		    const device = new m2m.Device(100);
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(err, result){
          assert.strictEqual( result, 'success' );
				  done();
		    }
		    device.connect('https://www.node-m2m.com', callback);
		  });
		  it('start connecting if 1st argument is an object and a callback is provided', function (done) {
		    const device = new m2m.Device(100);
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(err, result){
          assert.strictEqual( result, 'success' ); 
				  done();
		    }
		    device.connect({server:'https://www.node-m2m.com'}, callback);
		  });
		  it('start connecting if only a callback argument is provided', function (done) {
		    const device = new m2m.Device(200);
		    assert.strictEqual( typeof device, 'object' );
		    let callback = function(err, result){
          assert.strictEqual( result, 'success' ); 
				  done();
		    }
		    device.connect(callback);
		  });
	  });
    describe('set channel data using .setChannel()', function () {
      it('should throw an error if 1st argument is not a string', function (done) {
        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.connect(function(){});
          device.setChannel(1020);
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }
      });
      it('should throw an error if invalid argument is provided', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.setChannel(1005);
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments' );
          done();
        }
      });
      it('should throw an error if no callback argument is provided', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.setChannel('test');
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments, requires a callback argument' );
          done();
        }
      });
      it('set a channel data if arguments are valid', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let channelName = 'device-test'
        let eventName = channelName + device.id;

        device.setChannel({name:channelName}, function(err, data){
          assert.strictEqual( err, null );
          assert.strictEqual( typeof data, 'object' );
          done();
        });
        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, name:channelName, result:'passed' });
      });
    });
    describe('set gpio using .setGpio() w/ empty object as argument', function () {
      it('should throw an error if pin and mode properties are missing', function (done) {

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
      it('should invoke callback w/ error if rcvd simulated input data has an error', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Input' + device.id + 15;

        let callback = function (err, gpio){
          if(err){
            assert.strictEqual( gpio, null );
            assert.strictEqual( err.message, 'invalid data');
            done(); 
          } 
        }

        try{
          device.setGpio({mode:'input', pin:15, type:'simulation'}, callback);
          m2mTest.testEmitter.emit(eventName, {error:'invalid data', event:true, id:device.id, input:true, pin:15, state:true});
        }
        catch(e){
          throw 'invalid test';
        }
      });
      it('should set a simulated gpio input w/o error if arguments are valid', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
        	device.setGpio({mode:'input', pin:11, type:'simulation'});
        }
        catch(e){
          throw 'invalid test';
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
          throw 'invalid test';
        }
        done();
      });
      it('should set a simulated gpio output w/o error if arguments are valid', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
			  try{
        	device.setGpio({mode:'output', pin:33, type:'simulation'});
			  }
			  catch(e){
          throw 'invalid test';
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
          throw 'invalid test';
        }
        done();
      });
      it('should set an external gpio output w/o error using external type', function (done) {
        const device = new m2m.Device(252);
        assert.strictEqual( typeof device, 'object' );
        let eventName = 'gpio-Output' + device.id + 33;
			  try{
        	device.setGpio({mode:'output', pin:33, type:'external'});
			  }
			  catch(e){
          throw 'invalid test';
        }
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:true, pin:33, state:true});
        done();
      });
      it('should set multiple external gpio outputs in external type', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
			  try{
        	device.setGpio({mode:'output', pin:[33,35], type:'external'});
			  }
			  catch(e){
          throw 'invalid test';
        }
        done();
      });
      it('should set multiple simulated gpio inputs if an optional callback is provided', function (done) {
        let spl = {id:210, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(210);
        assert.strictEqual( typeof device, 'object' );
        let eventName = 'gpio-Input' + device.id + 13;
     
        let count = 0;
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          if(count == 0){
					  done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11,13], type:'simulation'}, callback );
        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:'state', pin:13, state:true});
      });
      it('should set multiple simulated gpio outputs if an optional callback is provided', function (done) {
      
			  let spl = {id:153, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);
    
		    const device = new m2m.Device(153);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 36;

        count = 0;
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          if(count === 0){
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[36, 35], type:'simulation'}, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:36, state:true});
      });
      it('Should create a single gpio input object if a valid single pin argument is provided', function (done) {
      
        let spl = {id:250, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(250);

        let eventName = 'gpio-Input' + device.id + 19;

        let count = 0;
        let callback = function (err, gpio){
          if(count === 0){
          	done();count++;
          }
        }

        device.setGpio({mode:'input', pin:19, type:'simulation', id:device.id }, callback);
        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:'state', pin:19, state:true});
      });
      it('should set multiple simulated gpio inputs, invoke callback if a valid gpio data is available', function (done) {
      
        let spl = {id:245, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(245);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (err, gpio){
          
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
          	assert.strictEqual( gpio.state, gpio.state ? true : false );
            done();count++;
          }
        }

        device.setGpio({mode:'input', pin:[11, 13], type:'simulation' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:true, pin:11, state:true });
      });
      it('should set multiple simulated gpio outputs, invoke callback if a valid gpio data is available', function (done) {
      
        let spl = {id:270, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable( spl);

        const device = new m2m.Device(270);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let count = 0; 
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          assert.strictEqual( gpio.state, gpio.state ? true : false );
          if(count === 0){
          	done(); count++;
          }
        }

        device.setGpio({mode:'output', pin:[33, 35], type:'simulation' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:33, state:true });
      });
      it('should set multiple simulated gpio outputs, invoke callback if a valid gpio "off" data is received', function (done) {
   
        let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(300);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 35;

        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          assert.strictEqual( gpio.state, false );
          done();
        }

        device.setGpio({mode:'output', pin:[33, 35], type:'simulation' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {id:device.id, output:true, off:true, pin:35, state:false});
      });
      it('should set multiple simulated gpio outputs, invoke callback if a valid gpio "on" data is received', function (done) {
   
        let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;
        
        let count = 0;
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          if(count === 0){ 
          	assert.strictEqual( gpio.state, true );
          	done();count++;
          }
        }

        device.setGpio({mode:'output', pin:[33, 35], type:'simulation' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {state:false, id:device.id, output:true, on:true, pin:33, state:true});
      });
      it('should invoke callback if external gpio input rcvd data has error', function (done) {

        let spl = {id:400, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(400);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          if(err){
           assert.strictEqual(gpio, null);
           assert.strictEqual(err.message, 'invalid data');
           done();
          }
        }

        device.setGpio({mode:'input', pin:[11, 13], type:'external' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {error:'invalid data', event:true, id:device.id, input:true, pin:11, state:true});
      });
      it('should set multiple external gpio outputs if data rcvd is valid', function (done) {

   			let spl = {id:350, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);
    
        const device = new m2m.Device(350);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );
          gpio.setGpioState(gpio.pin, gpio.state);
          gpio.getGpioState(gpio.pin, gpio.state);
          gpio.send({pin:gpio.pin, state:true, src:'device', dst:'client'});
          done();
        }

        device.setGpio({mode:'output', pin:[33, 35], type:'external' , id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, src:'device', dst:'client', id:device.id, output:true, pin:33, state:true});
      });
    });
    describe('should set external gpio inputs w/ invalid mode', function () {
      it('should throw an error', function (done) {

        let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);
    

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 13;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );
        }

        try{
        	device.setGpio({mode:{}, pin:[11, 13], type:'external' , id:device.id }, callback );
			  }
        catch(e){
          assert.strictEqual( e.message, 'mode property must be a string');
				  done();
        } 
      });
    });
    describe('should set gpio inputs w/ invalid arguments', function () {
      it('should throw an error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
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
    });
    describe('should set external gpio inputs w/ invalid mode - channel', function () {
      it('should throw an error', function (done) {

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );
        }

        try{
        	device.setGpio({mode: 'channel', pin:[11, 13], type:'external' , id:device.id }, callback );
          m2mTest.testEmitter.emit(eventName, {id:device.id, input:true, pin:13, state:true});
			  }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
				  done();
        } 
      });
    });
    describe('should set external gpio inputs w/ invalid mode - integer arg', function () {
      it('should throw an error', function (done) {

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );
        }

        try{
        	device.setGpio({mode: 100, pin:[11, 13], type:'external' , id:device.id }, callback );
          m2mTest.testEmitter.emit(eventName, {id:device.id, input:true, pin:13, state:true});
			  }
        catch(e){
          assert.strictEqual( e.message, 'mode property must be a string');
				  done();
        } 
      });
    });
    describe('should set external gpio inputs w/ invalid argument - not an object', function () {
      it('should throw an error', function (done) {

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        // callback should not be invoked
        let callback = function (err, gpio){
          assert.strictEqual( err, 'invalid test' );
          assert.strictEqual( gpio, 'invalid test' );
        }

        try{
        	device.setGpio('input', callback );
          //m2mTest.testEmitter.emit(eventName, {id:device.id, input:true, pin:13, state:true});
			  }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
				  done();
        } 
      });
    });
    describe('should set external gpio inputs w/ invalid pin elements', function () {
      it('should throw an error', function (done) {

			  let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);
    
        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );
        }

        try{
        	device.setGpio({mode:'input', pin:['11', '13'], type:'external' , id:device.id }, callback );
				  m2mTest.testEmitter.emit(eventName, {id:device.id, input:true, pin:13, state:true});
			  }
        catch(e){
          assert.strictEqual( e.message, 'pin element must be an integer');
				  done();
        } 
      });
    });
	  describe('Using getApi() w/ valid name', function () {
      it('should start connecting ...', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'random' + device.id;

        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
          done();
        }

        try{
        	device.getApi('random', callback );
          m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, name:'random', result:'201' });
			  }
        catch(e){
          assert.strictEqual(e,null);
        } 

      });
    });
    describe('Using getApi() w/ object args and a valid name', function () {
      it('should start connecting ...', function (done) {

   			let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'random' + device.id;

        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
				  done();
        }

        try{
        	device.getApi({name:'random'}, callback );
          m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, name:'random', result:'passed'});
			  }
        catch(e){
          throw 'invalid test';
        } 

      });
    });
    describe('Using getApi() w/ object args and an invalid name', function () {
      it('should throw an error ...', function (done) {
        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'random' + device.id;

        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
        }

        try{
        	device.getApi({name:33}, callback );
          m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, name:33, result:'passed'});
    		}
        catch(e){
          assert.strictEqual( e.message, 'name property parameter must be a string');
				  done();
        } 
      });
    });
	  describe('Using getApi() w/ invalid args', function () {
      it('should throw an error ...', function (done) {
        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
        }

        try{
        	device.getApi(33, callback );
    		}
        catch(e){
          assert.strictEqual( e.message, '1st parameter must be a string or object');
				  done();
        } 
      });
    });
    describe('Using setData() w/o args', function () {
      it('should start connecting ...', function (done) {

        let spl = {id:150, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(150);
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.id, 150 );

			  let count = 0;
        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
				  if(count === 0){  
          	done();count++;
          }
        }

        let eventName = 'setData';

        try{
        	device.setData(callback);
          m2mTest.testEmitter.emit( eventName, {event:true, id:device.id, name:eventName, result:'passed', initValue:'109' });
    		}
        catch(e){
          throw 'invalid test';
        } 
                  
      });
    });
    describe('Using setData() string args', function () {
      it('should start connecting ...', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);
    
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

			  let count = 0;
        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
          if(count === 0){  
          	done();count++;
          }
        }
     
			  let channelName = 'random-data';
        let eventName = channelName + device.id;

        try{
        	device.setData(channelName, callback);
          m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, name:channelName, initValue:'55', result:'109' });
    		}
        catch(e){
          throw 'invalid test';
        } 
           
      });
    });
    describe('Using setData() w/ object args and an invalid name', function () {
      it('should throw an error ...', function (done) {

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
        }

        let eventName = 33 + device.id;

        try{
        	device.setData({name:33}, callback );
    		}
        catch(e){
          assert.strictEqual( e.message, 'name property parameter must be a string');
				  done();
        } 
      });
    });
	  describe('Using setData() w/ valid arguments', function () {
      it('should return w/ error connecting ...', function (done) {

        let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(300);
        assert.strictEqual( typeof device, 'object' );

        let callback = function (err, data){
          if(err){
            assert.strictEqual(data, null);
            assert.strictEqual(err.message, 'error-test');
          	done();
          }
        }

        let eventName = 'test' + device.id; 

        try{
        	device.setData({name:'test', id:300}, callback);
    		}
        catch(e){
          throw 'invalid test';
        } 

        m2mTest.testEmitter.emit( eventName, {event:true, id:device.id, name:'test', error:'error-test', result:'passed' });          
      });
    });
    describe('Using setData() w/ valid non-event args object', function () {
      it('should start connecting ...', function (done) {

        let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(300);
        assert.strictEqual( typeof device, 'object' );

        let count = 0;
        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
          assert.strictEqual(data.id, device.id );
          assert.strictEqual(data.name, 'test-random1' );
          if(count === 0){
          	data.send('test-data');
          	done(); count++;
          }
        }

        let eventName = 'test-random1' + device.id;

        try{
        	device.setData({name:'test-random1', id:300}, callback);
    		}
        catch(e){
          throw 'invalid test';
        }
        m2mTest.testEmitter.emit(eventName, {event:false, src:'browser', dst:'device', id:device.id, name:'test-random1', initValue:'109', result:'245' }); 
      });
    });
    describe('Using setData() w/ valid event-based args object', function () {
      it('should start connecting ...', function (done) {

        let spl = {id:200, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let count = 0;
        let callback = function (err, data){
          assert.strictEqual( typeof data, 'object' );
          assert.strictEqual(data.id, device.id );
          assert.strictEqual(data.name, 'test-random' );
          if(count === 0){
          	data.send('test-data');
          	done(); count++;
          }
        }

        let eventName = 'test-random' + device.id;

        try{
        	device.setData({name:'test-random', id:200}, callback);
    		}
        catch(e){
          throw 'invalid test';
        }

        m2mTest.testEmitter.emit(eventName, {event:true, src:'browser', dst:'device', id:device.id, name:'test-random', initValue:'109', result:'245' }); 
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an input w/ invalid pin', function () {
      it('should invoke callback w/ error object', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:231, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(231);
        assert.strictEqual( typeof device, 'object' );
           
        let callback = function (err, gpio){}

        try{
          device.setGpio({mode:'input', pin:43}, callback );
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid pin' );
				  done();
        }

      });
    });
    describe('Using setGpio() in Raspberry Pi to create an input w/ valid pin 15', function () {
      it('should invoke callback w/ gpio object', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:233, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(233);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Input' + device.id + 15;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
					  assert.strictEqual( err, null );
            assert.strictEqual( typeof gpio, 'object' );
            assert.strictEqual( gpio.state, false );
	         	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'input', pin:15}, callback );
        }
        catch(e){
          throw 'invalid test'; 
        }

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:'state', pin:15, state:false});

      });
    });
    describe('Using setGpio() in Raspberry Pi to create an input w/ valid pin 41', function () {
      it('should invoke callback w/ error object', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:233, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(233);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Input' + device.id + 41;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
            assert.strictEqual( gpio, null );
					  assert.strictEqual( err.message, 'invalid pin ' + 41 );
	         	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'input', pin:41}, callback );
        }
        catch(e){
          throw 'invalid test'; 
        }

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:'state', pin:41, state:false});

      });
    });

    describe('Using setGpio() in Raspberry Pi to create a non-event input w/ valid rcvd data', function () {
      it('should set multiple gpio inputs', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:250, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(250);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
            done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, input:true, pin:11, state:true });
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an event-based input w/ valid rcvd data', function () {
      it('should set multiple gpio inputs', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:350, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(350);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 13;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
          	//assert.strictEqual( gpio.state, gpio.state ? true : false );
            done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {event:true, id:device.id, input:'state', pin:13, state:true , initValue:true});
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an event-based input w/ error in rcvd data', function () {
      it('should invoke callback w/ error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:450, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(450);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let count = 0; 
        let callback = function (err, gpio){
          if(err && count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
            done();count++;
          }
        }
        device.setGpio({mode:'input', pin:[11, 13], id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {error:'invalid test', event:true, id:device.id, input:'state', pin:11, state:true});
      });
    });
	  describe('Using setGpio() in Raspberry Pi to create an output w/ error in rcvd data', function () {
      it('should invoke callback w/ error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:400, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(400);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 35;

        let count = 0; 
        let callback = function (err, gpio){
          if(err && count === 0){
            console.log('gpio', gpio);
          	assert.strictEqual( typeof gpio, 'object' );
            done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[33, 35], id:device.id }, callback );
        m2mTest.testEmitter.emit(eventName, {error:'invalid test', event:false, id:device.id, output:'state', pin:35, state:true});
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an output w/ invalid pin 43 (w/o test emitter)', function () {
      it("should throw an 'invalid pin' error", function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:232, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(232);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 43;

        let callback = function (err, gpio){}

        try{
        	device.setGpio({mode:'output', pin:43}, callback );
        }
        catch(e){
				  assert.strictEqual( e.message, 'invalid pin' );
          done();
        }
        
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an output w/ invalid pin 41 (w/ test emitter)', function () {
      it('should invoke callback w/ error object', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:234, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(234);
        assert.strictEqual( typeof device, 'object' );

			  let eventName = 'gpio-Output' + device.id + 41;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
            assert.strictEqual( gpio, null );
            assert.strictEqual( err.message, 'invalid pin ' + 41 );
          	done();count++;
          }
        }

        try{
        	device.setGpio({mode:'output', pin:41}, callback );
        }
        catch(e){
          throw 'invalid test'; 
        }

        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:41, state:false});

      });
    });
    describe('Using setGpio() in Raspberry Pi to create an output w/ valid rcvd  get "state" data', function () {
      it('should invoke callback w/o error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:230, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(230);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 35;

        let count = 0; 
        let callback = function (err, gpio){
          if(count === 0){
          	done();count++;
          }
        }

        device.setGpio({mode:'output', pin:[33, 35], id:device.id}, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, id:device.id, output:'state', pin:35, state:false});
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an output w/ valid rcvd "on" data', function () {
      it('should invoke callback w/o error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:235, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(235);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let count = 0; 
        let callback = function (err, gpio){
         	assert.strictEqual( typeof gpio, 'object' );
          if(count === 0){
            assert.strictEqual( gpio.state, true );
          	done();count++;
          }
        }
        device.setGpio({mode:'output', pin:[33, 35], id:device.id}, callback );
        m2mTest.testEmitter.emit(eventName, {event:false, on:true, state:true, id:device.id, output:'on', pin:33});
      });
    });
    describe('Using setGpio() in Raspberry Pi to create an output w/ valid rcvd "off" data', function () {
      it('should invoke callback w/o error', function (done) {

        if(os.arch() !== 'arm'){
          done();
          return console.log('this test module requires a raspberry pi as test device'); 
        }
      
        let spl = {id:240, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(240);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let count = 0; 
        let callback = function (err, gpio){
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
      
        let spl = {id:255, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			  m2mTest.enable(spl);

        const device = new m2m.Device(255);

        assert.strictEqual( typeof device, 'object' );

        // no need for test emitter
        //let eventName = 'gpio-Output' + device.id + 55;

        // callback should not be invoked
        let callback = function (err, gpio){
          assert.strictEqual( err, 'invalid test' );
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

        // should throw an error 'Sorry, gpio control is not available on your device' w/o test emitter
        //m2mTest.testEmitter.emit(eventName, {event:false, off:true, state:false, id:device.id, output:'off', pin:55});
       
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
              //exports.deviceTotal = deviceTotal;
              //const {clientTotal, clientPassed} = require('./client.test.js');
              //m2mTest.logEvent('m2m-test:passed', 'clientTotal:' + clientTotal, 'deviceTotal:' + deviceTotal);
              //console.log('passed')
              
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

        const { device } = require('../lib/client.js'); // return objects
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
          device.exit.deviceExitProcessFromClient({appId:'app234'}); // (rxd)
          done();

        }, dl);
      });
    });
    describe('Invoking internal input object method properties', function () {
      it('should process the input object method properties ...', function (done) {

        const { device } = require('../lib/client.js'); // return objects
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
          device.input.GetGpioInputState(rxd);          // rxd
          device.input.deviceWatchGpioInputState(rxd);  //rxd
          done();

        }, dl);
      });
    });
    describe('Invoking internal output object method properties', function () {
      it('should process the output object method properties ...', function (done) {

        const { device } = require('../lib/client.js'); // return objects
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
          device.output.GetGpioOutputState(rxd); // rxd
          device.output.deviceWatchGpioOutputState(rxd); //rxd
          done();

        }, dl);
      });
    });
    describe('Invoking internal channel object method properties', function () {
      it('should process the channel object method properties ...', function (done) {

        const { device } = require('../lib/client.js'); // return objects
        /*let channel = {
          deviceEnableEventWatch: deviceEnableEventWatch,
          getChannelDataEvent: getChannelDataEvent,
          deviceWatchChannelData: deviceWatchChannelData,
          deviceSuspendEventWatch: deviceSuspendEventWatch,
        };
        */
        let rxd = {id:100, src:'client', channel:true, dst:'device', name:'test-channel', value:'test'};

        setTimeout(function(){
          assert.strictEqual(typeof device.channel, 'object'); 
          assert.strictEqual(typeof device.channel.deviceEnableEventWatch, 'function');
          assert.strictEqual(typeof device.channel.getChannelDataEvent, 'function');
          assert.strictEqual(typeof device.channel.deviceWatchChannelData, 'function');
          assert.strictEqual(typeof device.channel.deviceSuspendEventWatch, 'function'); //deviceSuspendEventWatch

          device.channel.deviceEnableEventWatch(rxd);
          device.channel.getChannelDataEvent(rxd);
          device.channel.deviceWatchChannelData(rxd);
          device.channel.deviceSuspendEventWatch(rxd);
          done();

        }, dl);
      });
    });
    describe('Invoking internal resources object method properties', function () {
      it('should process the resources object method properties ...', function (done) {

        const os = require('os');
        const { device } = require('../lib/client.js'); // return objects
        /*let resources = {
          setApi: setApi,
          setData: setData,
          setGpio: setGpio,
        };
        */
        let args = {id:100, src:'client', channel:true, dst:'device', name:'test-channel', value:'test'};

        let cb = (err, data) => {
          if(err){
            return console.log('===> err', err);
          }  
          console.log('===> data', data);
        };  
        /*device.getApi('/getData', function(err, data){
          if(err) return console.error('/getData error:', err.message); 
          data.send(getData);
          console.log('data.result', data.result); 
        });
        // http post api simulation
        device.postApi('/findData', function(err, data){
          if(err) return console.error('/findData error:', err.message); 
          setTimeout(() => {
            console.log('data.body', data.body);
            data.response({postApi: 'ok'});
            console.log('data.result', data.result); // {postApi:'ok'}
          }, 8000);
        });*/

        setTimeout(function(){
          assert.strictEqual(typeof device.resources, 'object'); 
          assert.strictEqual(typeof device.resources.setApi, 'function');
          assert.strictEqual(typeof device.resources.setData, 'function');
          assert.strictEqual(typeof device.resources.setGpio, 'function');

          device.resources.setApi('/myapi', cb);  // setApi('api', cb)
          device.resources.setApi(args, cb);      // setApi(args, cb)
          device.resources.setData(args, cb);     // setData(args, cb)

          try{
            device.resources.setGpio(args, cb);   // setGpio(args, cb)
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

