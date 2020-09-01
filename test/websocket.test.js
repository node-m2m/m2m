const fs = require('fs');
const m2m = require('m2m');
const assert = require('assert');
const c = require('../lib/client.js');

describe('\nWebsocket object test ...', function () {
  /*describe('Check reg value using .init() and .initCheck() methods', function () {
    it('should throw an error if reg is false', function (done) {

      let spl = {
				id: '12ab8c91',
				appId: '12ab8c91',
				_pid: 'r-a',
				c: true,
				app: true,
				src: 'client',
				reg: true,
				_sid: 'm2m',
				tid: 1596133962344,
				appIds: [ '9bc8fec8', 'e9b28d97', 'b40d39b0', '12ab8c91' ],
			};
     
      c.setTestOption(true, spl);
      
      try{
				c.websocket.init(true);
				c.websocket.initCheck();
      	c.websocket.init(false);
      	c.websocket.initCheck();
      }
      catch(e){
				assert.strictEqual(e.message, 'process terminated');
		    done();
      }  
    });

  });*/
  describe('Quickly invoke public websocket methods', function () {
    it('should complete the process w/o error', function (done) {

      let spl = {
				id: '12ab8c91',
				appId: '12ab8c91',
				_pid: 'r-a',
				c: true,
				app: true,
				src: 'client',
				reg: true,
				_sid: 'm2m',
				tid: 1596133962344,
				appIds: [ '9bc8fec8', 'e9b28d97', 'b40d39b0', '12ab8c91' ],
			};
     
      c.setTestOption(true, spl);

      c.websocket.getInit();
			c.websocket.init(true);
			c.websocket.initCheck();
      c.websocket.send('test');
	    c.websocket.setServer();
			c.websocket.setServer({});
 			c.websocket.currentSocket();
			c.websocket.getCurrentServer();
			c.websocket.getConnectionOptions();
      c.websocket.setServer('https://www.node-m2m.com');
      c.websocket.setServer({server:'https://www.node-m2m.com'});
 			
      done();

    });
  });
  describe('Using websocket.connect() method w/ src.client & dogTimer = 1800002 ...', function () {
    it('It should connect w/o an error', function (done) {

      let spl = {id:'90cc8ed8', appId:'90cc8ed8', _pid:'r-a', c:true, app:true, src:'client', reg:true};
			c.setTestOption(true, spl);

			let dogTimer = 1800002;
			c.websocket.setDogTimerInterval(dogTimer);

			let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
		    done();
		  };

      let m2m = {id:'90cc8ed8', appId:'90cc8ed8', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

      let args = c.defaultNode;
      try{
		  	c.websocket.connect(args, m2m, cb);  
      }
      catch(e){
				throw 'invalid test';
      }   
 
    });
  });
  describe('Using websocket.connect() method w/ src.client & dogTimer = 18000 ...', function () {
    it('It should connect w/o an error', function (done) {

      let spl = {id:'90cc8ed8', appId:'90cc8ed8', _pid:'r-a', c:true, app:true, src:'client', reg:true};
			c.setTestOption(true, spl);

			let dogTimer = 18000;
			c.websocket.setDogTimerInterval(dogTimer);

			let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
		    done();
		  };

      let m2m = {id:'90cc8ed8', appId:'90cc8ed8', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

      let args = c.defaultNode;
		  try{
		  	c.websocket.connect(args, m2m, cb);  
      }
      catch(e){
				throw 'invalid test';
      }     
 
    });
  });
  describe('Using websocket.connect() method w/ src.device & dogTimer = 54000010 ...', function () {
    it('It should connect w/o an error', function (done) {
      			
      let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			c.setTestOption(true, spl);

		  let dogTimer = 54000010;
			c.websocket.setDogTimerInterval(dogTimer);

		  let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
		    done();
		  };

      let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

      let args = c.defaultNode;

		  try{
		  	c.websocket.connect(args, m2m, cb);  
      }
      catch(e){
				throw 'invalid test';
      }     
 
    });
  });
  describe('Using websocket.connect() method w/ src.device & dogTimer = 540000 ...', function () {
    it('It should connect w/o an error', function (done) {
      			
      let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
			c.setTestOption(true, spl);

		  let dogTimer = 540000;
			c.websocket.setDogTimerInterval(dogTimer);

		  let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
		    done();
		  };

      let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

      let args = c.defaultNode;

		  try{
		  	c.websocket.connect(args, m2m, cb);  
      }
      catch(e){
				throw 'invalid test';
      }     
 
    });
  });
  describe('Using setEmitSendListener w/ spl.src = client & rxd.src = client...', function () {
    it('It should connect w/o an error', function () {

      let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
      c.setTestOption(true, spl);

      try{
      	c.emitter.emit('emit-send', { src:'client', dst:'device', c:true, enforce:function(){}, id:100, pin:33, _pid:'gpio-output',  output:true, state:false });
  		}
			catch(e){
				throw 'invalid test';
      }

    });
  });
  describe('Using setEmitSendListener w/ spl.src = client & rxd.src = browser...', function () {
    it('It should connect w/o an error', function () {

      try{
      	c.emitter.emit('emit-send', { src:'browser', dst:'device', enforce:function(){}, id:100, pin:33, _pid:'gpio-output',  output:true, state:false });
			}
			catch(e){
				throw 'invalid test';
			}
 
    });
  });
  describe('Using setEmitSendListener w/ spl.src = device & rxd.src = client...', function () {
    it('It should connect w/o an error', function () {

      let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
 			c.setTestOption(true, spl);

		  try{ 
		    c.emitter.emit('emit-send', { src:'client', dst:'device', response:true, d:true, enforce:function(){}, id:100, pin:33, _pid:'gpio-output',  output:true, state:false });
		  }
		  catch(e){
				throw 'invalid test';
		  }  
 
    });
  });
  describe('Using setEmitSendListener w/ spl.src = device &  missing rxd.src ...', function () {
    it('should throw an error', function (done) {

		  try{ 
		    c.emitter.emit('emit-send', {c:true, enforce:function(){}, id:100, pin:33, _pid:'gpio-output', output:true, state:false });
		  }
		  catch(e){
        assert.strictEqual(e.message, 'invalid data.src');
 				done();  
		  }  

    });
  });
	describe('Using setEmitSendListener w/ spl.src = device & missing rxd.dst ...', function () {
    it('should throw an error', function (done) {

		  try{ 
		    c.emitter.emit('emit-send', { src:'client', c:true, enforce:function(){}, id:100, pin:33, _pid:'gpio-output',  output:true, state:false });
		  }
		  catch(e){
        assert.strictEqual(e.message, 'invalid data.dst');
 				done();  
		  }  

    });
  });
  describe('Using websocket.setDogTimer() method w/ device & ws.readyState = 1 ...', function () {
    it('It should set the dogTimer interval ...', function (done) {
 
      let spl = {	id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true };
 			c.setTestOption(true, spl);

      c.websocket.setDogTimer(null, 100);

      done(); 
   
    });
  });
  describe('Using websocket.initRxData() method in client w/ code 10 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	  };

    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;
    
    let rxd = {code:10, reason:'open-test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.initRxData() method in client w/ code 100 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let count = 0;
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
      if(count == 0){
    		done();count++;
    	}
	  };

    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 
 
	  let args = c.defaultNode;

    let rxd = {code:100, ca:1, path:'node_modules/m2m/lib/sec/tk', data:'test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  describe('Using websocket.initRxData() method in client w/ code 110 (access token updated) w/ clientActive = 1 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
      done();
	  };

    let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 
    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:110, ca:1, path:'node_modules/m2m/lib/sec/tk', data:'test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
	describe('Using websocket.initRxData() method in client w/ code 200 (reconnection) clientActive = 0 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
			throw 'invalid test';
	  };

    let count = 0;
    let m2m = {id:'12ab8c921', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:200, ca:0 , reason:'success'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    if(count == 0){
    	done();count++;
    }
   
    });
  });
  describe('Using websocket.initRxData() method in client w/ code 200 (reconnection) clientActive = 1 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
			throw 'invalid test';
	  };

    let count = 0;
    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let m2m = {id:'12ab8c921', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:200, ca:1 , reason:'success'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    if(count == 0){
    	done();count++;
    }
   
    });
  });
  describe('Using websocket.initRxData() method in client w/ code 200 (reconnection) w/ spl.app ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    throw 'invalid test';
	  };

		let count = 0;
    let args = {server:'https://www.node-m2m.com'};

    let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

    let rxd = {code:200, reason:'success', ca:1};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    } 
    if(count == 0){
    	done();count++;
    }

    });
  });
	describe('Using websocket.initRxData() method in client w/ code 300 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
      done();
	  };

    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let m2m = {aid:'1234', uid:'1234', ak:'1234', id:'90cc8ed8', appId:'90cc8ed8', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:300, aid:'1234', uid:'1234', ak:'1234'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  // this test should proceed code 500 and below
  describe('Using websocket.initRxData() method in client w/ code 510 - invalid credentials ...', function () {
    it('It should not initialize the client, result is authentication fail ...', function (done) {
 
    let count = 0;
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'authentication fail');
      if(count === 0){
	    	done();count++;
			}
	  };

		let m2m = {aid:'1234', uid:'1234', ak:'1234', id:'90cc8ed8', appId:'90cc8ed8', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

    let args = c.defaultNode;

    let rxd = {code:510, reason:'authentication fail'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  // device
  describe('Using websocket.initRxData() method in device w/ code 10 ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	  };

    let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;
    
    let rxd = {code:10, reason:'open-test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
	describe('Using websocket.initRxData() method in device w/ code 100 ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let count = 0;
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
      if(count == 0){
    		done();count++;
    	}
	  };

    let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};
	  let args = c.defaultNode;

    let rxd = {code:100, ca:1, path:'node_modules/m2m/lib/sec/tk', data:'test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 110 (token update success) ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {

    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
      done();
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};
    
    let args = c.defaultNode;

    let rxd = {code:110, path:'node_modules/m2m/lib/sec/tk', data:'test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 150 (m2m module update) ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    throw 'invalid test';
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};
    let args = c.defaultNode;

    let rxd = {code:150, aid:'123'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 110 (token update fail) ...', function () {
    it('It should invoke cb w/ error ...', function (done) {
 
    let cb = function(err, result){
      if(err){  
      	done();
      }
	  };

     let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};
    
    let args = c.defaultNode;

    let rxd = {code:110, error:'update-fail', path:'node_modules/m2m/lib/sec/tk', data:'test'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 200 (reconnection) clientActive = 1 ...', function () {
    it('It should initialize the client according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
			throw 'invalid test';
	  };

    let count = 0;
    let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:200, ca:1 , reason:'success'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }

    if(count == 0){
    	done();count++;
    }
   
    });
  });
	describe('Using websocket.initRxData() method in device w/ code 200 (reconnection) clientActive = 0 ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
			throw 'invalid test';
	  };

		let count = 0;

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = {server:'https://www.node-m2m.com'};

    let rxd = {code:200, ca:0 , reason:'success'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
    if(count == 0){
    	done();count++;
    }
   
    });
  });
  // this test should proceed code 500 and below
  describe('Using websocket.initRxData() method in device w/ code 510 - invalid credentials ...', function () {
    it('It should not initialize the device, result is authentication fail ...', function (done) {
 
    let count = 0;
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'authentication fail');
      if(count === 0){
	    	done();count++;
			}
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;

    let rxd = {code:510, reason:'authentication fail'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 500 - invalid credentials ...', function () {
    it('It should not initialize the device, result is authentication fail ...', function (done) {
 
		let count = 0;
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'authentication fail');
	    if(count === 0){
	    	done();count++;
			}
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};
    let args = c.defaultNode;
    
    let rxd = {code:500, reason:'authentication fail'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    } 
   
    });
  });
	describe('Using websocket.initRxData() method in device w/ code 500 w/ clientActive > 1 ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
	    done();
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;
    
    let rxd = {code:500, ca:2, reason:'authentication fail'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    } 
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 530 - invalid device ...', function () {
    it('It should not initialize the device, result is invalid device ...', function (done) {

    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'invalid device');
	    done();
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;
    
    let rxd = {code:530, reason:'invalid device'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    } 
   
    });
  });
  describe('Using websocket.initRxData() method in device w/ code 600 - sc renew ...', function () {
    it('It should initialize the device according to rcvd code ...', function (done) {
 
    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'sc-renew success');
	    done();
	  };

    let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

    let args = c.defaultNode;
    
    let rxd = {code:600, reason:'sc-renew success'};

    try{ 
    	c.websocket.initRxData(rxd, args, m2m, cb);
    }
		catch(e){
			throw 'invalid test';
    }
   
    });
  });
  // DeviceRxData
	describe('Using websocket.DeviceRxData(rxd) method w/ src.device ...', function () {
    it('It should throw an error ...', function (done) {

    let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);
    
    let rxd = {id:100, src:'device', device:true};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			 assert.strictEqual(e.message, 'invalid payload');
			 done(); 
    }

    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.restart ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

    let rxd = {id:100, restart:true, src:'browser', dst:'device'};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();      

    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ spl.id = rxd.id ..', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.channel & rxd.event = true ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:true, watch:true, name:'test-data'};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
	describe('Using websocket.DeviceRxData(rxd) method w/ rxd.channel ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', name:'test-data'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
	describe('Using websocket.DeviceRxData(rxd) method w/ rxd.output & rxd.event = true ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:true, output:true, pin:33};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.output & rxd.unwatch ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:false, unwatch:true, output:true, pin:33};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.output ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', output:true, pin:33};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.input & rxd.event = true  ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:true, input:true, pin:11};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.channel & rxd.event = true  ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:true, watch:true, name:'test-data'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.channel & rxd.unwatch ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:false, unwatch:true, name:'test-data'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.input & rxd.unwatch  ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:false, unwatch:true, input:true, pin:11};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.input & rxd.unwatch for watchInputData = 0 ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, src:'client', dst:'device', event:false, unwatch:true, input:true, pin:11};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.wsReconnectAttempt(e, args, m2m, cb) method w/ device 1st attempt ...', function () {
    it('It should warn user of closed ws...', function (done) {

    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
	  };

    let spl = {	id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true };
	  c.setTestOption(true, spl);

    let m2m = { id:100, _pid:'d-c', d:true, device:true, src:'device', reg:true };

    let args = {server:'https://www.node-m2m.com'};

    // 1003 or 1006
    let e = 1006;
    c.websocket.wsReconnectAttempt(e, args, m2m, cb);

    done(); 
   
    });
  });
  describe('Using websocket.wsReconnectAttempt(e, args, m2m, cb) method w/ device 2nd attempt ...', function () {
    it('It should warn user of closed ws...', function (done) {

    let cb = function(err, result){
	    if(err) throw err;
	    assert.strictEqual(result, 'success');
	  };

    let m2m = { id:100, _pid:'d-c', d:true, device:true, src:'device', reg:true };

    let args = {server:'https://www.node-m2m.com'};

    // 1003 or 1006
    let e = 1006;

    // 2nd attempt 
    c.websocket.wsReconnectAttempt(e, args, m2m, cb);

    // 3rd attempt
    c.websocket.wsReconnectAttempt(e, args, m2m, cb);

    done(); 
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method  w/ rxd.setupData ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

		let rxd = {id:100, setupData:true, src:'client', dst:'device'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.status w/ options...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };
    
		let rxd = {id:100, status:true, src:'client', dst:'device', options:options};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
	describe('Using websocket.DeviceRxData(rxd) method w/ rxd.status w/o options ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {
    
		let rxd = {id:150, status:true, src:'client', dst:'device'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
      done();
    }
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.restart ...', function () {
    it('It should process the device data according to rcvd data ...', function (done) {

    let rxd = {id:100, restart:true, src:'browser', dst:'device'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.uploadCode but w/ rxd.options = {} ...', function () {
    it('It should upload the code ...', function (done) {

    let rxd = {id:100, uploadCode:true, src:'browser', dst:'device', options:{}};

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.uploadCode but w/ different rxd.id ...', function () {
    it('It should throw an error ...', function (done) {

    let options = {
      code: { allow: true, filename: 'test/device.js' },
			name: 'Master App',
			location: 'Waterloo, ON',
			description: 'Test App'
    };

    let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let rxd = {id:200, uploadCode:true, src:'browser', dst:'device', options:options};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
			assert.strictEqual(e.message, 'invalid id');
      done();
    }
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method rxd.uploadCode & valid options  ...', function () {
    it('It should upload the code ...', function (done) {

    let options = {
      code: { allow: true, filename: 'test/device.js' },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:100, uploadCode:true, src:'browser', dst:'device', options:options, appData:'test'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done();
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.updateCode & different rxd.id  ...', function () {
    it('It should throw an error ...', function (done) {

    let options = {
      code: { allow: true, filename: 'test/device.js' },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:200, updateCode:true, src:'browser', dst:'device', options:options, appData:'test'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
			assert.strictEqual(e.message, 'invalid id');
      done();
    }
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.updateCode = true ...', function () {
    it('It should update the code ...', function (done) {

    let options = {
      code: { allow: true, filename: 'test/device.js' },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:100, updateCode:true, src:'browser', dst:'device', options:options, appData:'test'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.updateCode w/o rxd.appData ...', function () {
    it('It should not update the code ...', function (done) {

    let options = {
      code: { allow: true, filename: 'test/device.js' },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:100, updateCode:true, src:'browser', dst:'device', options:options };

    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.updateCode w/o filename ...', function () {
    it('It should not update the code ...', function (done) {

    let options = {
      // options w/o filename 
      /*code: { allow: true, filename: 'test/device.js' },*/
      code: { allow: true },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:100, updateCode:true, src:'browser', dst:'device', options:options, appData:'test'};
    try{
    	c.websocket.DeviceRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  // ClientRxData
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.input ...', function () {
    it('It should process/start watching the channel data ...', function (done) {

    let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
 		c.setTestOption(true, spl);

    let rxd = {id:300, event:true, src:'browser', dst:'device', input:true, pin:13};

    c.websocket.ClientRxData(rxd);

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.enable = false ...', function () {
    it('It should disable/suspend device channel data or input pins watching ...', function (done) {

    let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let rxd = {id:300, enable:false, src:'browser',dst:'device'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done();
       
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.enable = true ...', function () {
    it('It should start watching again the device channel data or input pins ...', function (done) {

    let spl = {id:310, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let rxd = {id:310, enable:true, src:'browser', dst:'device'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done();
       
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.input = true ...', function () {
    it('It should start watching again the device channel data or input pins ...', function (done) {

    let spl = {id:310, _pid:'r-d', d:true, device:true, src:'device', reg:true};
		c.setTestOption(true, spl);

    let rxd = {id:310, input:true, event:true, src:'browser', dst:'device'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done();
       
    });
  });
  describe('Using websocket.DeviceRxData(rxd) method w/ rxd.exit ...', function () {
    it('It should unwatch device channel data and input pins ...', function (done) {

    let spl = {id:300, _pid:'r-d', d:true, device:true, src:'device', reg:true};
 		c.setTestOption(true, spl);

    let rxd = {id:300,  exit:true, src:'browser', dst:'device'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done(); 
   
    });
  });
  // **clientRxData**
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.channel ...', function () {
    it('It should process/start watching the channel data ...', function (done) {

		let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let rxd = {id:'12ab8c91', appId:'12ab8c91', activeStart:true, src:'browser', dst:'device'};

    try{  
    	c.websocket.DeviceRxData(rxd);
    }
    catch(e){
      throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.activeStart ...', function () {
    it('It should process the data accordingly...', function (done) {

		let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let rxd = {id:'12ab8c91', appId:'12ab8c91', activeStart:true, src:'browser', dst:'device'};
   
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();  
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.channel ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', name:'test-data'};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.channel ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', name:'test-data'};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.channel & rxd.unwatch() ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', event:false, unwatch:true, src:'browser', dst:'device', name:'test-data'};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.input ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'gpio-input', event:true, watch:true, input:true, pin:15};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.input & rxd.unwatch ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'gpio-input', unwatch:true, input:true, pin:15};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
	describe('Using websocket.ClientRxData(rxd) method w/ rxd.output ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'gpio-output', event:false, watch:false, output:true, pin:35};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.output & rxd.event ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'gpio-output', event:true, output:true, pin:35};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.output & rxd.unwatch ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'gpio-output', event:false, unwatch:true, output:true, pin:35};
    try{
    	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();
   
    });
  });
	describe('Using websocket.ClientRxData(rxd) method w/ rxd.setupData ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'setup', setupData:true};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();
   
    });
  });
  // this is the same w/ client.test  
	/*describe('Using websocket.ClientRxData(rxd) method w/ rxd.getDevices ...', function () {
    it('It should process the data accordingly...', function (done) {

    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
    c.setTestOption(true, spl);

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'getDevices', getDevices:true};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done();   
    });
  });*/
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.status w/ options ...', function () {
    it('It should process the data accordingly...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };
    
    let rxd = {id:'12ab8c91', appId:'12ab8c91', options:options, src:'browser', dst:'device', _pid:'client-status', status:true};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.status w/o or invalid options...', function () {
    it('It should process the data accordingly...', function (done) {
    
    let rxd = {id:'12ab8c91', appId:'12ab8c91', options:{}, src:'browser', dst:'device', _pid:'client-status', status:true};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.restart ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'client-restart', restart:true};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.updateCode but w/ options = {} ...', function () {
    it('It should not update the code ...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'updateCode', updateCode:true, options:{}, appData:'test-data'};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.updateCode ...', function () {
    it('It should process the data accordingly...', function (done) {

		let options = {
      code: { allow: true, filename: 'test/client.js' },
			name: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'updateCode', updateCode:true, options:options, appData:'test-data'};
    try{
    	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.updateCode w/o filename ...', function () {
    it('It should not update the code ...', function (done) {

    // no filename
		let options = {
      code: { allow: true },
			location: 'Boston, MA', 
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'updateCode', updateCode:true, options:options, appData:'test-data'};
    try{
     	 c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.updateCode w/o appData ...', function () {
    it('It should not update the code...', function (done) {

		let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'updateCode', updateCode:true, options:options, appData:null};
    try{
     	 c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.uploadCode ...', function () {
    it('It should process the data accordingly...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'uploadCode', uploadCode:true, options:options };
    try{
     	 c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.uploadCode but w/ different rxd.id ...', function () {
    it('It should not upload the code ...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };
 
    let rxd = {id:'12ab8c92', appId:'12ab8c91', src:'browser', dst:'device', _pid:'uploadCode', uploadCode:true, options:options };
   
    try{
			c.websocket.ClientRxData(rxd);
    }
		catch(e){
			assert.strictEqual(e.message, 'invalid id');
			done(); 
    }
       
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.uploadCode and w/ options = {} ...', function () {
    it('It should not upload the code ...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'uploadCode', uploadCode:true, options:{}};
    try{
    	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.getRegisteredDevices ...', function () {
    it('It should process the data accordingly...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'getRegisteredDevices', options:options, getRegisteredDevices:true};
    try{
    	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
	describe('Using websocket.ClientRxData(rxd) method w/ rxd.getRegisteredDevices (2nd attempt) ...', function () {
    it('It should process the data accordingly...', function (done) {

    let options = {
      code: { allow: true },
			ame: 'Master App',
			location: 'Boston, MA',
			description: 'Test App'
    };

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'getRegisteredDevices', devices:[100, 200], options:options, getRegisteredDevices:true};
    try{
    	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ rxd.exit ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', exit:true, src:'browser', dst:'device'};
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.ClientRxData(rxd) method w/ no rxd.error ...', function () {
    it('It should process the data accordingly...', function (done) {

    let rxd = {id:'12ab8c91', appId:'12ab8c91', src:'browser', dst:'device', _pid:'test' };
    try{
     	c.websocket.ClientRxData(rxd);
    }
		catch(e){
			throw 'invalid test';
    }
    done(); 
   
    });
  });
  describe('Using websocket.wsReconnectAttempt(e, args, m2m, cb) method w/ client ...', function () {
    it('It should warn user of closed ws...', function (done) {

		let cb = function(err, result){
		  if(err) throw err;
		  assert.strictEqual(result, 'success');
		};

		let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};
		c.setTestOption(true, spl);

		let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'a-c', c:true, app:true, src:'client', reg:true}; 

		let args = {}; 

		// 1003 or 1006
		let e = 1003;
			    
		try{
	 	  c.websocket.wsReconnectAttempt(e, args, m2m, cb);
		}
		catch(e){
			throw 'invalid test';
		}
		done(); 
   
    });
  });
  describe('Using websocket.refreshConnection() method w/ client ...', function () {
    it('It should refresh the ws...', function (done) {
 
    let spl = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', c:true, app:true, src:'client', reg:true};

		c.setTestOption(true, spl);
    
    try{
   	 	c.websocket.refreshConnection();
	  }
		catch(e){
			throw 'invalid test';
	  }
		done(); 
   
    });
  });
  describe('Using websocket.refreshConnection() method w/ device ...', function () {
    it('It should throw an error ...', function (done) {
 
    let spl = {	id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true };

		c.setTestOption(true, spl);
    
    try{
   	 	c.websocket.refreshConnection('test');
	  }
		catch(e){
			throw 'invalid test';
	  }
		done(); 
   
    });
  });
});