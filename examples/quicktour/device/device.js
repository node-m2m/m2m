const m2m = require('m2m');

// create a device object with a device id of 100
// this id must must be registered with node-m2m
let device = new m2m.Device(100);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err);

  console.log('result:', result);

  // set 'random-number' channel as resource  
  device.setData('random-number', function(err, data){
    if(err) return console.error('setData random-number error:', err.message);

    let rd = Math.floor(Math.random() * 100);
    data.send(rd);
  });
});
