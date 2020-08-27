var assert = require('assert');
var sinon = require('sinon');

const m2m = require('m2m');
const c = require('../lib/client.js');

let id1 = null;
let id2 = null;

/*
before(() => {
  sinon.stub(console, 'log'); 
  sinon.stub(console, 'info'); 
  sinon.stub(console, 'warn');
  sinon.stub(console, 'error'); 
});*/

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

  describe('Set Device Option', function () {
    it('set a module option using the .setOption() method', function () {
      let options = {code:{allow:true, filename:'device.js'}};

      const device = new m2m.Device(100);
      assert.strictEqual( typeof device, 'object' );

      device.setOption(options);
      assert.strictEqual( options,  c.options );

    });

  });

  describe('\nCreating a device object ...', function () {
    describe('create a device object using a single argument device id of type integer', function () {
      it('should return an object with a property id of type integer', function () {
        const device = new m2m.Device(100);
        
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.device, true );
        assert.strictEqual( Number.isInteger(device.id), true );

      });
    });

    describe('create a device object using a single argument device id of type string', function () {
      it('should return an object with a property id of type integer', function () {
        const device = new m2m.Device('100');

        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( device.device, true );
        assert.strictEqual( Number.isInteger(device.id), true );
  
      });
    });

    describe('create a device object using a single argument of type object', function () {
      it('should return an object with a property id of type integer', function () {
        const device = new m2m.Device({id:100, name:'server1'});
        
        assert.strictEqual( typeof device, 'object' );
        assert.strictEqual( Number.isInteger(device.id), true );
        assert.strictEqual( device.name, 'server1');
        assert.strictEqual( device.device, true );

      });
    });

    describe('Set channel data using .setChannel() method', function () {
      it('should throw an error if 1st argument is not a string', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
          device.setChannel(1020);
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
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
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let channelName = 'device-test'
        let eventName = channelName + device.id;

        device.setChannel({name:channelName, id:device.id}, function(err, data){
          assert.strictEqual( err, null );
          //console.log('data', data);
          assert.strictEqual( typeof data, 'object' );
          done();
        });

        c.emitter.emit(eventName, {event:true, id:device.id, name:channelName, result:'passed' });
      });
    });

    describe('Set gpio data using the .setGpio() method', function () {
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
      it('should throw an error if pin property is missing', function (done) {
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
      it('should throw an error if mode property is missing', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        try{
         device.setGpio({pin:11, type:'simulation'});
        }
        catch(e){
          assert.strictEqual( e.message, 'invalid arguments');
          done();
        }
      });
      it('set a simulated gpio input if arguments are valid', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'input', pin:11, type:'simulation'});
        done();
      });
      it('set multiple simulated gpio inputs if pin property is an array', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'input', pin:[11,13], type:'simulation'});
        done();
      });
      it('set a simulated gpio output if arguments are valid', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'output', pin:33, type:'simulation'});
        done();
      });
      it('set multiple simulated gpio outputs if pin property is an array', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'output', pin:[33,35], type:'simulation'});
        done();
      });
      it('set an external gpio output with external type property', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'output', pin:33, type:'external'});
        done();
      });
      it('set multiple external gpio outputs with external type property', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        device.setGpio({mode:'output', pin:[33,35], type:'external'});
        done();
      });
      it('set multiple simulated gpio inputs if an optional callback is provided', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
        }
        device.setGpio({mode:'input', pin:[11,13], type:'simulation'}, callback );
        done();
      });
      it('set multiple simulated gpio outputs if an optional callback is provided', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );
        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
        }
        device.setGpio({mode:'output', pin:[33, 35], type:'simulation'}, callback );
        done();
      });
      it('*set multiple simulated gpio inputs and execute callback if a valid gpio data is available', function (done) {
        const device = new m2m.Device(300);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          assert.strictEqual( gpio.state, gpio.state ? true : false );
          done();
        }

        device.setGpio({mode:'input', pin:[11, 13], type:'simulation' , id:device.id }, callback );

        c.emitter.emit(eventName, {id:device.id, input:true, pin:11, state:true});
      });
      it('*set multiple simulated gpio outputs and execute callback if a valid gpio data is available', function (done) {
        const device = new m2m.Device(200);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Output' + device.id + 33;

        let callback = function (err, gpio){
          console.log('gpio', gpio);
          assert.strictEqual( typeof gpio, 'object' );
          assert.strictEqual( gpio.state, true );
          done();
        }

        device.setGpio({mode:'output', pin:[33, 35], type:'simulation' , id:device.id }, callback );
        
        c.emitter.emit(eventName, {id:device.id, output:true, pin:33, state:true});
      });
      it('*set multiple external gpio inputs and execute callback if a valid gpio data is available', function (done) {
        const device = new m2m.Device(100);
        assert.strictEqual( typeof device, 'object' );

        let eventName = 'gpio-Input' + device.id + 11;

        let callback = function (err, gpio){
          assert.strictEqual( typeof gpio, 'object' );

          let rn = Math.floor(( Math.random() * 20) + 5); 

          if(rn > 15){
            gpio.state = true;
          }else{
            gpio.state = false;
          }

          console.log('gpio', gpio);
          
          assert.strictEqual( gpio.state, gpio.state ? true : false );
          //gpio.send({id:device.id, input:true, pin:11, state:true});
          done();
        }

        device.setGpio({mode:'input', pin:[11, 13], type:'external' , id:device.id }, callback );

        c.emitter.emit(eventName, {id:device.id, input:true, pin:11, state:true});
      });
    });
  });

