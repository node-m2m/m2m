const m2m = require('m2m');

// create a client application object
let client = new m2m.Client();

// enter your credentials for server authentication
client.connect(function(err, result){
    if(err) return console.error('connect error:', err.message);

    console.log('result:', result);

    // create a device object from client with access to remote device 100
    let remoteDevice = client.accessDevice(100); 

    // using a simple function call data capture
    remoteDevice.getData('random', function(err, value){
        if(err) return console.error('getData random error:', err.message);

        console.log('getData random value', value); // 97
    });

    // using an event-based data capture, data will be pushed   
    // from the remote device if 'random' data value changes 
    // 'random' data will be scanned/polled every 5 secs 
    // by the remote device for any value changes 
    remoteDevice.watch('random', function(err, value){
        if(err) return console.error('watch random error:', err.message);

        console.log('watch random value', value); // 97, 101, 115 ... 
    });

    // Turn ON pin 33 of the remote device 
    // state value will be true confirming the remote device was ON
    remoteDevice.output(33).on(function(err, state){
        if(err) return console.error('remote device output pin 33 ON error:', err.message);

        console.log('remote device output pin 33 ON', state);  // true
    });

    // Turn OFF pin 33 after 2 secs delay
    // state value will be false confirming the remote device was OFF
    remoteDevice.output(33).off(2000, function(err, state){
        if(err) return console.error('remote device output pin 33 OFF error:', err.message);

        console.log('remote device output pin 33 OFF', state); // false
    });
});  
