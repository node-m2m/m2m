const fs = require('fs');
const m2m = require('m2m');
const sinon = require('sinon');
const assert = require('assert');
const { m2mTest } = require('../lib/client.js');

let totalTest = 0;
let totalPassed = 0;
let totalFailed = 0;
let test_result = ''; 

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

  totalTest = clientTotal + deviceTotal + wsTotal;
  totalPassed = clientPassed + devicePassed + wsPassed;
  totalFailed = clientFailed + deviceFailed + wsFailed;
  
  // log test results
  m2mTest.logEvent('client: total ' + clientTotal+' fail '+clientFailed , '| device: total ' + deviceTotal+' fail '+deviceFailed, '| ws: total ' + wsTotal+' fail '+wsFailed, '|| m2m-test: ' + test_result);
  m2mTest.logEvent('total test ' + totalTest, '| total failed ' + totalFailed, '| total passed ' + totalPassed);
}

describe('Prep test summary ...', function () {
  it('Log test results', function () {

    setTimeout(function(){
      logTestResult();
    }, 350);

    setTimeout(() => {
      process.exit();
    }, 3000);

  });
});

