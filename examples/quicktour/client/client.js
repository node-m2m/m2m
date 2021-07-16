const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);

  // create a remote device object from client accessDevice method
  let device = client.accessDevice(100);

  // capture 'random-number' data using a one-time function call
  device.getData('random-number', function(err, data){
    if(err) return console.error('getData random-number error:', err.message);
    console.log('random data', data); // 97
  });

  // capture 'random-number' data using a push method
  // the remote device will scan/poll the data every 5 secs (default)
  // if the value changes, it will push/send the data to the client
  device.watch('random-number', function(err, data){
    if(err) return console.error('watch random-number error:', err.message);
    console.log('watch random data', data); // 81, 68, 115 ...
  });
});
