const fs = require('fs');
const m2m = require('m2m');
const sinon = require('sinon');
const assert = require('assert');
const { m2mTest } = require('../lib/client.js');

let totalTest = 0;
let totalPassed = 0;
let totalFailed = 0;
let test_result = ''; 

let xresult = 0;
let xresultPassed = 0;
let xresultFailed = 0;

function logTestResult(){

  const {wsTotal, wsPassed, wsFailed} = require('./ws.test.js');
  const {clientTotal, clientPassed, clientFailed} = require('./client.test.js');
  const {deviceTotal, devicePassed, deviceFailed} = require('./device.test.js');

  if(clientFailed || deviceFailed || wsFailed){
    test_result = 'failed *';
  }
  else{
    test_result = 'passed';
  }

  totalTest = clientTotal + deviceTotal + wsTotal + xresult;
  totalPassed = clientPassed + devicePassed + wsPassed + xresultPassed;
  totalFailed = clientFailed + deviceFailed + wsFailed + xresultFailed;
  
  // log test results
  m2mTest.logEvent('client: total ' + clientTotal+' fail '+clientFailed , '| device: total ' + deviceTotal+' fail '+deviceFailed, '| ws: total ' + wsTotal+' fail '+wsFailed, '|| m2m-test: ' + test_result);
  m2mTest.logEvent('total test ' + totalTest, '| total failed ' + totalFailed, '| total passed ' + totalPassed);
}

describe('\nset test stats ...', function() {
  before(function() {
    // runs once before the first test in this block
  });

  after(function() {
    // runs once after the last test in this block
  });

  beforeEach(function() {
    // runs before each test in this block
    xresult++;
  });

  afterEach(function() {
    // runs after each test in this block
    if (this.currentTest.state === 'passed') {
      xresultPassed++;
    }
    if (this.currentTest.state === 'failed') {
      xresultFailed++;
    }
  });

  describe('Prepare test summary result ...', function () {
    it('should log test summary result in /m2m_log/test_result.txt', function () {

      setTimeout(function(){
        logTestResult();
      }, 350);

      setTimeout(() => {
        process.exit();
      }, 3000);

    });
  });

});

