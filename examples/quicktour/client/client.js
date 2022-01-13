const m2m = require('m2m');

let client = new m2m.Client();

client.connect(() => {

  // access the remote device using an alias object
  let device = client.accessDevice(100);

  // capture 'random-number' data using a pull method
  device.getData('random-number', (data) => {
    console.log('getData random-number', data); // 97
  });

  // capture 'random-number' data using a push method
  device.watch('random-number', (data) => {
    console.log('watch random-number', data); // 81, 68, 115 ...
  });

  // update test-data
  device.sendData('test-data', 'node-m2m is awesome', (data) => {
    console.log('sendData test-data', data);
  });

  // capture updated test-data
  device.getData('test-data', (data) => {
    console.log('getData test-data', data); // node-m2m is awesome
  });

});
