const m2m = require('m2m');

// create a device object with a device id of 100
// this id must must be registered with node-m2m server
let device = new m2m.Device(100); 

// connect your device for server authentication, you will be prompted to enter your credentials
device.connect(function(err, result){
    if(err) return console.error('connect error:', err.message);
 
    console.log('result:', result);
 
    // if credentials are valid, channel 'random' data will be setup
    device.setChannel('random', function(err, data){
      if(err) return console.error('channel random error:', err.message); 
 
      data.value =   Math.floor(( Math.random() * 100) + 25); 
      console.log('random value', data.value); 
    });

     // Set GPIO pin 33 as simulated output as indicated by the "type" property
    device.setGpio({mode:'output', pin:33, type: 'simulation'}, function (err, gpio){
      if(err) return console.log('setGpioData pin 33 error:', err.message);

      console.log('** gpio output', gpio.pin, 'state', gpio.state);
    });
});  
