const fs = require('fs');
const m2m = require('m2m');
const assert = require('assert');
const c = require('../lib/client.js');

describe('\nSecurity object test ...', function () {
  describe('Create a server object using server.connect() method', function () {

    c.setTestOption(true);

    const server = new m2m.Server(100);

    it('It should connect and return a "success" result', function () {

      server.connect({server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'c123'}, function(err, result){
				if(err) return console.error('connect error:', err);

        assert.strictEqual(result, 'success');

      });
    });
  });
  describe('Using sec.m2mRestart() - 1st registration (no args & no tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
      let spl = {id:100, _pid:'r-d', d:true, device:true, src:'device', reg:true};
  		c.setTestOption(true, spl);
      let m2m = {id:100, _pid:'d-c', d:true, start:true, src:'device',reg:true};
      let args = null; 
      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() - 1st registration (string args & no tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
       let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
      let m2m = {id:100, _pid:'d-c', d:true, start:true, src:'device',	reg:true};
      let args = c.defaultNode;
      c.sec.m2mRestart(args, m2m, cb);
    });
  });
  describe('Using sec.m2mRestart() - 1st registration (no args & corrupted tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:100, _pid:'d-c', d:true, restart:true, src:'device',	reg:true};

      let args = null;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() - 1st registration (string args & corrupted tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:100, _pid:'d-c', d:true, restart:true, src:'device',	reg:true};

      let args = c.defaultNode;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
	describe('Using sec.m2mRestart() - 1st registration (object args & corrupted tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:100, _pid:'d-c', d:true, restart:true, src:'device',	reg:true};

      let args = {server:c.defaultNode};

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() - m2m.device (no args & device tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:100, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

      let args = null;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() method - m2m.device w/ missing id...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:100, _pid:'d-c', d:true, mid:true, device:true, src:'device',	reg:true};

      let args = c.defaultNode;

      c.sec.m2mRestart(args, m2m, cb);

    });
  });
  describe('Using sec.m2mRestart() method - device w/ diffrent device.id...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:200, _pid:'d-c', d:true, device:true, src:'device',	reg:true};

      let args = c.defaultNode;

      c.sec.m2mRestart(args, m2m, cb);

    });
  });
  describe('Using sec.m2mRestart() method - change app from device to client ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };

      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', dtc:true, app:true, c:true, src:'client', reg:true};

      let args = c.defaultNode;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() method - change app from client to device ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:200, _pid:'d-c', d:true, ctd:true, device:true, src:'device',	reg:true};

      let args = c.defaultNode;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.m2mRestart() - m2m.device (no args & device tk) ...', function () {
    it('It should prompt for credentials/redirected to sec.m2mStart()', function (done) {
 
      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};

      let args = null;

      c.sec.m2mRestart(args, m2m, cb);
   
    });
  });
  describe('Using sec.setAttributes() w/ valid argument ...', function () {
    it('It should set the options/attributes using the argument...', function (done) {
 
     let args = {
        code: { allow: true, filename: 'test/device.js' },
				name: 'Master App',
				location: 'Boston, MA',
				description: 'Test App'
      };

      c.setAttributes(args);

      try{
      	c.setAttributes(args);
      } 
      catch(e){
				throw 'invalid test';
      }
        
      done();
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid null argument ...', function () {
    it('It should throw an error ...', function (done) {

      try{
      	c.setAttributes(null);
      } 
      catch(e){
        assert.strictEqual(e.message, "Cannot read property 'code' of null"); 
        done();
      }
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid code filename ...', function () {
    it('It should set the options/attributes using arguments...', function (done) {

      let args = {
        code: { allow: true, filename: 'test/MyDeviceFileNameIsInvalid.js' },
				name: 'Master App',
				location: 'Boston, MA',
				description: 'Production Test'
      };

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'code filename is more than the maximum of 30 characters long'); 
        done();
      }
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid argument (non-object) ...', function () {
    it('It should throw an error...', function (done) {

      let args = 'test/device.js';

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'invalid arguments, it must be an object'); 
        console.log('e.message', e.message);
        done();
      }
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid code argument (non-object) ...', function () {
    it('It should throw an error...', function (done) {

      let args = {
        code: 'test/device.js',
				name: 'Master Application in Testing Lab',
				location: 'Boston, MA',
				description: 'Production Test Application Description'
      };

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'code option must be an object'); 
        console.log('e.message', e.message);
        done();
      }
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid option name argument length ...', function () {
    it('It should throw an error...', function (done) {

      let args = {
        code: { allow: true, filename: 'test/device.js' },
				name: 'Master Application in Testing Lab',
				location: 'Boston, MA',
				description: 'Production Test Application Description'
      };

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'Invalid option name length'); 
        console.log('e.message', e.message);
        done();
      }
   
    });
  });
	describe('Using sec.setAttributes() w/ invalid description argument length ...', function () {
    it('It should throw an error...', function (done) {

      let args = {
        code: { allow: true, filename: 'test/device.js' },
				name: 'Master App',
				location: 'Boston, MA',
				description: 'Production Test Application Description'
      };

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'Invalid option description name length'); 
        console.log('e.message', e.message);
        done();
      }
   
    });
  });
  describe('Using sec.setAttributes() w/ invalid location argument length ...', function () {
    it('It should throw an error...', function (done) {

      let args = {
        code: { allow: true, filename: 'test/device.js' },
				name: 'Master App',
				location: 'National Testing Center, Boston, MA',
				description: 'Production Test'
      };

      try{
      	c.setAttributes(args);
      } 
      catch(e){
        assert.strictEqual(e.message, 'Invalid option location name length'); 
        console.log('e.message', e.message);
        done();
      }
   
    });
  });
	describe('Using sec.userPrompt() w/ valid credentials ...', function () {
    it('It should prompt the user for credentials ...', function (done) {

      let count = 0; 
      let cb = function(err, result){
		    if(err) throw err;
		    assert.strictEqual(result, 'success');
        if(count === 0){
		      done();count++;
        }
		  };
 
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};
 
      let args = {server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'b123'}

      try{
      	c.sec.userPrompt(args, m2m, cb);
      } 
      catch(e){}

    });
  });
	describe('Using sec.userPrompt() w/ invalid userid credential ...', function () {
    it('It should throw an error ...', function (done) {

      let cb = function(err, result){
		    if(err) throw err;
		  };
 
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};
 
      let args = {server:'https://www.node-m2m.com', userid:'js@m2m', pw:'!JonSnow20', sc:'b123'}

      try{
      	c.sec.userPrompt(args, m2m, cb);
      } 
      catch(e){
        assert.strictEqual(e.message, 'Invalid userid. It must follow a valid email format.');
        done();
      }

    });
  });
  describe('Using sec.userPrompt() w/ invalid pw credential ...', function () {
    it('It should throw an error ...', function (done) {

      let cb = function(err, result){
		    if(err) throw err;
		  };
 
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};

      let args = {server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'JonSnow20', sc:'b123'}

      try{
      	c.sec.userPrompt(args, m2m, cb);
      } 
      catch(e){
     		// assert.strictEqual(e.message, '-Password must be 8 characters minimum
     		// -with at least one number, one lowercase letter,
     		// -one uppercase letter, and one special character.');
        done();
      }

    });
  });
  describe('Using sec.userPrompt() w/ invalid pw credential ...', function () {
    it('It should throw an error ...', function (done) {

      let cb = function(err, result){
		    if(err) throw err;
		  };
 
      let m2m = {id:'12ab8c91', appId:'12ab8c91', _pid:'r-a', app:true, c:true, src:'client', reg:true};
 
      let args = {server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'b1234'}

      try{
      	c.sec.userPrompt(args, m2m, cb);
      } 
      catch(e){
     		assert.strictEqual(e.message, 'Invalid security code credential.');
        done();
      }

    });
  });
  describe('Use client.connect() method w/ invalid pw', function () {
    const client = new m2m.Client();
    it('It should throw an error', function (done) {

      client.connect({auth:true, server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'JonSnow20', sc:'c123'}, function(err, result){
        if(err){
  				assert.strictEqual(err.message, 'Invalid pw credential.');
					done();
        }  
 
      });
    });
  });
  describe('Use client.connect() method w/ invalid pw length', function () {
    const client = new m2m.Client();
    it('It should throw an error', function (done) {

      client.connect({auth:true, server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'JonSnowFromTheGameOfThrones-TheDragonSlayer-SlayThemAllBloodyFools19', sc:'c123'}, function(err, result){
        if(err){
  				assert.strictEqual(err.message, 'Password must be 8 characters minimum and 50 characters maximum.');
					done();
        }  
      });
    });
  });
  describe('Use client.connect() method w/ invalid userid', function () {
    const client = new m2m.Client();
    it('It should throw an error', function () {

      client.connect({auth:true, server:'https://www.node-m2m.com', userid:'js@m2m', pw:'!JonSnow20', sc:'c123'}, function(err, result){
        if(err){
  				assert.strictEqual(err.message, 'Invalid userid credential.');
        }  
 
      });
    });
  });
  describe('Use client.connect() method w/ invalid userid length', function () {
    const client = new m2m.Client();
    it('It should throw an error', function () {

      client.connect({auth:true, server:'https://www.node-m2m.com', userid:'johnsnowdragonslayergameofthrones@m2m', pw:'!JonSnow20', sc:'c123'}, function(err, result){
        if(err){
  				assert.strictEqual(err.message, 'Userid must be 5 characters minimum and 20 characters maximum.');
        }  
 
      });
    });
  });
  describe('Use client.connect() method w/ invalid sc', function () {
    const client = new m2m.Client();
    it('It should throw an error', function () {

      client.connect({auth:true, server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'c94355'}, function(err, result){
        if(err){
  				assert.strictEqual(err.message, 'Invalid security code credential.');
        }  
 
      });
    });
  });
  describe('Create a client object and use client.connect() method', function () {
    const client = new m2m.Client();
    it('It should return a success result', function () {

      client.connect({server:'https://www.node-m2m.com', userid:'js@m2m.com', pw:'!JonSnow20', sc:'c123', final:true}, function(err, result){
				if(err) return console.error('connect error:', err);

        assert.strictEqual(result, 'success');
        console.log('result', result);
        setTimeout(() => {
         	process.exit();
        }, 3000);
 
      });
    });
  });
});