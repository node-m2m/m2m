const fs = require('fs');
const m2m = require('m2m');
const sinon = require('sinon');
const assert = require('assert');
const { m2mTest } = require('../lib/client.js');

let dl = 200;
let wsTotal = 0;
let wsPassed = 0;
let wsFailed = 0;

describe('\nset test stats ...', function() {
before(function() {
  // runs once before the first test in this block
});

after(function() {
  // runs once after the last test in this block
});

beforeEach(function() {
  // runs before each test in this block
  wsTotal++;
});

afterEach(function() {
  // runs after each test in this block
  if (this.currentTest.state === 'passed') {
    wsPassed++;
  }
  if (this.currentTest.state === 'failed') {
    wsFailed++;
  }
});

function getTestResult(){
  let test_result = ''; 
  wsPassed++;
  const {clientTotal, clientPassed, clientFailed} = require('./client.test.js');
  const {deviceTotal, devicePassed, deviceFailed} = require('./device.test.js');
  if(clientFailed || deviceFailed || wsFailed){
    test_result = 'failed *';
  }
  else{
    test_result = 'passed';
  }
  //m2mTest.logEvent('m2m-test: ' + test_result, '| client: total ' + clientTotal+' fail '+clientFailed , '| device: total ' + deviceTotal+' fail '+deviceFailed, '| ws: total ' + wsTotal+' fail '+wsFailed);
  m2mTest.logEvent('client: total ' + clientTotal+' fail '+clientFailed , '| device: total ' + deviceTotal+' fail '+deviceFailed, '| ws: total ' + wsTotal+' fail '+wsFailed, '|| m2m-test: ' + test_result);
}

  // test cases
describe('\n*Websocket object test ...', function () {
  describe('*create a device object using a single argument device id of type integer', function () {
    it('should return an object with a property id of type integer', function () {
      const device = new m2m.Device(100);
      
      assert.strictEqual( typeof device, 'object' );
      assert.strictEqual( device.device, true );
      assert.strictEqual( Number.isInteger(device.id), true );

    });
  });
  describe('*create a client object w/o an argument', function () {
    it('should return an object with a property id of type string', function () {
      const client = new m2m.Client();
      id1 = client.id;

      assert.strictEqual( typeof client, 'object' );
      assert.strictEqual( client.client, true );
      assert.strictEqual( typeof client.id, 'string' );
      assert.strictEqual( client.id.length, 8 );

    });
  });
  describe('*Invoke internal websocket.wsReconnectAttempt() method', function () {
    it('should process the websocket.wsReconnectAttempt() method w/ valid parameters', function (done) {

      const { websocket } = require('../lib/client.js');
      //console.log('websocket', websocket);

      let e = 1006; // (e === 1006 || e === 1003)
      let args = {server:'https://www.node-m2m.com'};
      //let m2m = { id:100, _pid:'d-c', d:true, device:true, src:'device', reg:true };
      let m2m = {
        options: {
          userSettings: {
            name: 'Master App1',
            location: 'Boston, MA',
            description: 'Test App1'
          },
          restartable: true,
          m2mConfig: { code: 'test'},
          processFilename: 'client.js',
          nodemonConfig: true,
          startScript: 'nodemon client.js'
        },
        c: true,
        app: true,
        id: '73931f27',
        _pid: 'a-c',
        appId: '73931f27',
        src: 'client',
        appIds: [ 'c4e55f0a', 'd70fe91b', '2824e3cc', '73931f27' ],
        reg: true,
        restartable: true,
        _sid: 'm2m',
        tid: 1614449632258,
        systemInfo: {
          type: 'x64',
          mem: { total: '16781 MB', free: '1327 MB' },
          m2mv: 'v1.4.0',
          os: 'linux'
        }
      };

      let cb = function (err, result){
        if(result === 'success'){
          done();
        }
      };
     
      // wsReconnectAttempt(e, args, m2m, cb); 
      setTimeout(function(){
        assert.strictEqual( typeof websocket.wsReconnectAttempt, 'function' );
        websocket.wsReconnectAttempt(e, args, m2m, cb);
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.refreshConnection() method w/ "test" parameter', function () {
    it('should throw a "test" error ', function (done) {

      const { websocket } = require('../lib/client.js');

      // refreshConnection(test)
      setTimeout(function(){
        assert.strictEqual( typeof websocket.refreshConnection, 'function' );
        try{
          websocket.refreshConnection('test');
        }
        catch(e){
          assert.strictEqual( e, 'test');
          done();
        } 
      }, dl); 

    });
  });
  /*** device rx data ***/
  describe('*Invoke internal websocket.DeviceRxData() method w/ invalid rxd.id', function () {
    it('should throw an "invalid id" error', function (done) {

      const { websocket } = require('../lib/client.js');

      //if(rxd && rxd.id !== spl.id){
      let rxd = {id:120, src:'device', exit:true, stopEvent:true};
      let err = 'invalid id';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
          done();
        } 
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ invalid src:"device", rxd.deviceResponse, rxd.device', function () {
    it('should throw an "invalid payload" error' , function (done) {

      const { websocket } = require('../lib/client.js');

      //if(rxd.src === 'device' || rxd.deviceResponse || rxd.device){
      let rxd = {src:'device', exit:true, stopEvent:true};
      let err = 'invalid payload';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }
       
        rxd = {deviceResponse:true, exit:true, stopEvent:true}; 

        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }

        rxd = {device:true, exit:true, stopEvent:true}; 

        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
          done();
        }    
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ exit:true data ', function () {
    it('should not throw any error', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', appId:'app345', exit:true, stopEvent:true};
      
      let err = 'error'; // actual error is different

      // device.exit.deviceExitProcessFromClient(rxd);
      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
          //done();
        }
        done();    
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ valid channel data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', name:'test-data', event:true};
      let err = 'error'; // actual error is different
      
      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        // device.channel.deviceWatchChannelData(rxd);
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', name:'test-data', unwatch:true};

        // device.unwatchDeviceEvent(rxd);           
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        } 

        rxd = {src:'client', dst:'device', appId:'app345', name:'test-data'};

        // device.channel.getChannelDataEvent     
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
          //done();
        }
        done();
    
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ valid gpio input data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', input:true, pin:11, event:true};
      let err = 'error';
 
      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        // device.input.GetGpioInputState
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', input:true, pin:11, unwatch:true};

        // device.unwatchDeviceEvent
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        } 

        rxd = {src:'client', dst:'device', appId:'app345', input:true, pin:11};

        // device.input.GetGpioInputState
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
         } 
        done();
    
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ valid gpio output data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', output:true, pin:33, event:true};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        // device.output.GetGpioOutputState
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', output:true, pin:33, unwatch:true};

        // device.unwatchDeviceEvent
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        } 

        rxd = {src:'client', dst:'device', appId:'app345', output:true, pin:33};

        // device.output.GetGpioOutputState
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        } 
        done();
    
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.DeviceRxData() method w/ rxd.setupData, rxd.enable=false, rxd.enable=true payload data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', setupData:{}};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        // device.getDeviceSetupData
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', enable:false};

        // device.channel.deviceSuspendEventWatch
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        } 

        rxd = {src:'client', dst:'device', appId:'app345',  enable:true};

        // device.channel.deviceEnableEventWatch
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
        }

        done(); 
      }, dl); 

    });
  });
  /*describe('*Invoke internal websocket.DeviceRxData() method w/ rxd.restart, rxd.status, rxd.secureSystem', function () {
    it('should throw an ENOENT | Cannot convert undefined or null to object error', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', restart:true};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.DeviceRxData, 'function' );

        // sec.restartProcess
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', status:true};

        // sec.getEndPointStatus
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        } 

        rxd = {src:'client', dst:'device', appId:'app345',  secureSystem:true};

        // sec.secureSystem
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        }

        rxd = {src:'client', dst:'device', appId:'app345', updateCode:true};

        // sec.sec.updateCode
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        } 

        rxd = {src:'client', dst:'device', appId:'app345',  uploadCode:true};

        // sec.uploadCode
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        }

        rxd = {src:'client', dst:'device', appId:'app345',  uploadEventLog:true};

        // sec.uploadEventLog
        try{
          websocket.DeviceRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        }

        done(); 
      }, dl); 

    });
  });*/
  /*** client rx data ***/
  describe('*Invoke internal websocket.ClientRxData() method w/ rxd.activeStart, rxd.exit, rxd.getRegisteredDevices payload data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {id:'app345', appId:'app345', src:'client', dst:'device', activeStart:true};

      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'app345', appId:'app345', src:'client', dst:'device', exit:true};

        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
           assert.strictEqual( e, err);
         } 

        rxd = {id:'app345', appId:'app345', src:'client', dst:'device', getRegisteredDevices:true};

        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
           assert.strictEqual( e, err);
        } 
    
        done();
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.ClientRxData() method w/ valid channel data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {id:'app345', appId:'app345', src:'client', dst:'device', name:'channel-test', event:false, watch:false, unwatch:true};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        // rxd.id + rxd.name + rxd.event + rxd.watch + rxd.unwatch;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'app345', appId:'app345', src:'client', dst:'device', event:true, watch:true};

        // rxd.id + rxd.name + rxd.event + rxd.watch;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
           assert.strictEqual( e, err);
         } 
    
        done();
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.ClientRxData() method w/ valid gpio input/output data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {id:'app345', appId:'app345', src:'client', dst:'device', input:true, _pid:'gpio-input', pin:11, event:true, watch:true};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        // rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'app345', appId:'app345', src:'client', dst:'device', output:true, _pid:'gpio-output-on', pin:33, event:true, watch:true};

        // rxd.id + rxd._pid + rxd.pin + rxd.event + rxd.watch;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
           assert.strictEqual( e, err);
         } 
    
        done();
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.ClientRxData() method w/ rxd.setupData & rxd.getDevices payload data', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {id:'app345', appId:'app345', src:'client', dst:'device', setupData:true, _pid:'setupdata' };
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        //clientRxEventName = rxd.id + rxd._pid;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'app345', appId:'app345', src:'client', dst:'device', getDevices:true, _pid:'getDevices'};

        //clientRxEventName = rxd.id + rxd._pid;
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
           assert.strictEqual( e, err);
         } 
    
        done();
      }, dl); 

    });
  });
  describe('*Invoke internal websocket.ClientRxData() method w/ rxd.restart, rxd.status, rxd.secureSystem', function () {
    it('should throw an ENOENT | Cannot convert undefined or null to object error', function (done) {

      const { websocket } = require('../lib/client.js');

      let rxd = {src:'client', dst:'device', appId:'app345', restart:true};
      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        // sec.restartProcess
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        }
        
        rxd = {src:'client', dst:'device', appId:'app345', status:true};

        // sec.getEndPointStatus
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        } 

        rxd = {src:'client', dst:'device', appId:'app345',  secureSystem:true};

        // sec.secureSystem
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, "ENOENT: no such file or directory, open 'node_modules/m2m/lib/sec/ptk'");
        }

        rxd = {src:'client', dst:'device', appId:'app345', updateCode:true};

        // sec.sec.updateCode
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        } 

        rxd = {src:'client', dst:'device', appId:'app345',  uploadCode:true};

        // sec.uploadCode
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        }

        rxd = {src:'client', dst:'device', appId:'app345',  uploadEventLog:true};

        // sec.uploadEventLog
        try{
          websocket.ClientRxData(rxd);
        }
        catch(e){
          assert.strictEqual( e.message, 'Cannot convert undefined or null to object');
        }

        done(); 
      }, dl); 

    });
  });
  /*** initRxData ***/
  describe('*Invoke internal websocket.initRxData() method w/ valid rxd.code=100', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');
      
      let rxd = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', code:100, data:'test', path:'test/test.txt', reason:'test', app:true, c:true, src:'client', reg:true};
      let args = {server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'b1234'}
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};
      let count = 0;
      
      let cb = function (err, result){
        if(result === 'success'){
          console.log('result', result);
          if(count === 1){
            done();
          }
        }
      };

      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        try{
          websocket.initRxData(rxd, args, m2m, cb);
          count++;
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', code:101, data:'test', path:'test/test.txt', reason:'test', app:true, c:true, src:'client', reg:true};

        try{
          websocket.initRxData(rxd, args, m2m, cb);
          count++;
        }
        catch(e){
           assert.strictEqual( e, err);
        } 

      }, dl); 

    });
  });
  describe('*Invoke internal websocket.initRxData() method w/ valid rxd.code=110', function () {
    it('should not throw an error ', function (done) {

      const { websocket } = require('../lib/client.js');
      
      let rxd = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', code:110, data:'test', path:'test/test.txt', reason:'test', app:true, c:true, src:'client', reg:true};
      let args = {server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'b1234'}
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};
      let count = 0;
      
      let cb = function (err, result){
        if(result === 'success'){
          console.log('result', result);
          if(count === 0){
             assert.strictEqual( result, 'success' );
          }
        }
        else{
          console.log('err', err);
          assert.strictEqual( result, null );

          /* log test result/stats on m2m_log/test_result.txt */
          /*let test_result = ''; 
          wsPassed++;
          const {clientTotal, clientPassed, clientFailed} = require('./client.test.js');
          const {deviceTotal, devicePassed, deviceFailed} = require('./device.test.js');
          if(clientFailed || deviceFailed || wsFailed){
            test_result = 'failed';
          }
          else{
            test_result = 'passed';
          }
          m2mTest.logEvent('m2m-test: ' + test_result, '| client: total ' + clientTotal+' fail '+clientFailed , '| device: total ' + deviceTotal+' fail '+deviceFailed, '| ws: total ' + wsTotal+' fail '+wsFailed);*/
          getTestResult();

          done();
        }

      };

      let err = 'error';

      setTimeout(function(){
        assert.strictEqual( typeof websocket.ClientRxData, 'function' );

        try{
          websocket.initRxData(rxd, args, m2m, cb);
          count++;
        }
        catch(e){
          assert.strictEqual( e, err);
         }
        
        rxd = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', code:110, error:'test-error', data:'test', path:'test/test.txt', reason:'test', app:true, c:true, src:'client', reg:true};

        try{
          websocket.initRxData(rxd, args, m2m, cb);
          count++;
        }
        catch(e){
           assert.strictEqual( e, err);
        } 
        
      }, dl + 50); 

    });
  });

});

});
