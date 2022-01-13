const m2m = require('m2m');

let testData = 'node-m2m';

// create a device object with a device id of 100
// this id must must be registered with node-m2m
let device = new m2m.Device(100);

device.connect(() => {
  // set 'random-number' channel data resource  
  device.setData('random-number', (data) => {
    let rn = Math.floor(Math.random() * 100);
    data.send(rn);
  });
  // set 'test-data' channel data resource  
  device.setData('test-data', (data) => {
    if(data.payload){
      testData =  data.payload;
    }
    data.send(testData);
  });
});
