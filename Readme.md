# m2m

m2m is a client module for machine-to-machine communication framework  [node-m2m](https://www.node-m2m.com).

The module's API is a FaaS (Function as a Service) also called "serverless" making it easy for everyone to develop m2m applications such as telematics, data acquisition, process automation, IoT network gateways and many other machine-to-machine solutions.

Each user can create multiple remote devices/servers accessible through its user assigned device *id's* and multiple client applications. Communications between client and device applications are encrypted using TLS protocol. Access to remote devices/servers is restricted to authenticated and authorized users only.

To use this module, user must create an account and register their devices with [node-m2m](https://www.node-m2m.com).

[](https://raw.githubusercontent.com/EdoLabs/src/master/m2mSystem2.svg?sanitize=true)

# Table of contents
1. [Supported Devices](#supported-devices)
2. [Node.js version requirement](#node-version)
3. [Installation](#installation)
4. [Quick Tour](#quicktour)
5. [Examples](#examples)
   - [Example 1 - Using MCP 9808 Temperature Sensor](#example1)
   - [Example 2 - GPIO Input/Output Control](#example2)
   - [Example 3 - Remote Machine Control](#example3)
   - [Example 4 - Sending Data to Remote Device/Server](#example4)
6. [Http REST API Simulation](#http-rest-api-simulation)
7. [Browser Interaction](#browser-interaction)
   - [Online Code Editing](#online-code-editing)
   - [Restarting Application or Auto Restart Setup](#auto-restart-setup)
8. [Other FaaS functions](#other-faas-functions)
   - [Client request to get all available remote devices](#get-all-devices)
   - [Client request to get each device resources setup](#device-setup)


## Supported Devices <a name="supported-devices"></a>

* Raspberry Pi Models: B+, 2, 3, Zero & Zero W, Compute Module 3, 3B+, 3A+ (generally all 40-pin models)
* Linux Computer
* Windows PC
* Mac Computer

## Node.js version requirement <a name="node-version"></a>

* Node.js Versions: 8.x, 9.x, 10.x, 11.x, 12.x

## Installation <a name="installation"></a>
```js
$ npm install m2m
```

This module uses array-gpio for Raspberry Pi peripheral access (GPIO, I2C, SPI and PWM).

You need to install it as a separate module for Raspberry Pi devices.
```js
$ npm install array-gpio
```

## Quick Tour <a name="quicktour"></a>

For this quick tour, we will use two computers communicating with each other using the internet.

One computer will act as the *remote device* that will generate random numbers and simulate a GPIO output using pin 33.

The other computer will host a *client application* that will access the random numbers and control the GPIO output using a console.

![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour.svg?sanitize=true)
[](quicktour.svg)

Before you start, create an account and register your remote device with node-m2m server.

### Remote Device Setup

Create a device project directory and install m2m.
```js
$ npm install m2m
```
Create the file below as device.js within your device project directory.
```js
const m2m = require('m2m');

// create a device object with a device id of 100
// this id must must be registered with node-m2m
let device = new m2m.Device(100);

// authenticate and connect with node-m2m server
device.connect(function(err, result){
    if(err) return console.error('connect error:', err);

    console.log('result:', result);

    device.setChannel('random', function(err, data){
      if(err) return console.error('setData random error:', err.message);

      let value =   Math.floor(( Math.random() * 100) + 25);
      data.send(value);
    });

    device.setGpio({type:'simulation', mode:'output', pin:33 }, function (err, gpio){
      if(err) return console.error('setGpio output pin 33 error:', err.message);

      console.log('gpio output pin', gpio.pin, 'state', gpio.state);
    });
});
```

Start your device application.
```js
$ node device.js
```

The first time you run your application, it will ask for your credentials.
```js
? Enter your userid (email):
? Enter your password:
? Enter your security code:

```
The next time you run your application, it will start automatically without asking for your credentials. It will use a saved user token for authentication.

At anytime you can renew your user token using the command line argument **-r** when you restart your application.
```js
$ node device.js -r
```
It will ask you to enter your credentials again. Enter your credentials to renew your token.

### Client Application Setup
Similar with the remote device setup, create a client project directory and install m2m.
```js
$ npm install m2m
```
Create the file below as client.js within your client project directory.
```js
const m2m = require('m2m');

// create a client application object
let client = new m2m.Client();

client.connect(function(err, result){
    if(err) return console.error('connect error:', err);

    console.log('result:', result);

    // create a local device object with access to remote device 100
    let device = client.accessDevice(100);

    // capture 'random' data using a function call
    device.channel('random').getData(function(err, value){
        if(err) return console.error('getData random error:', err.message);
        console.log('random value', value); // 97
    });

    // capture 'random' data using an event-based method
    // data value will be pushed from the remote device if 'random' data value changes
    // the remote device will scan/poll the data every 5 secs for any value changes
    device.channel('random').watch(function(err, value){
        if(err) return console.error('watch random error:', err.message);
        console.log('watch random value', value); // 97, 101, 115 ...
    });

    // Turn ON gpio output pin 33
    device.gpio({mode:'out', pin:33}).on();

    // Turn OFF gpio pin 33 with 2 secs delay
    device.gpio({mode:'out', pin:33}).off(2000);

    // or

    // Turn ON gpio output pin 33
    device.output(33).on();

    // Turn OFF gpio pin 33 with 2 secs delay
     device.output(33).off(2000);

});
```
Start your application.
```js
$ node client.js or node client.js -r
```
Similar with remote device setup, you will be prompted to enter your credentials.

You should get a similar output result as shown below.
```js
...
random value 97
watch random value 81
remote device output pin 33 ON true
remote device output pin 33 OFF false
watch random value 68
watch random value 115
...
```

<a name="examples"></a>
## Example 1 <a name="example1"></a>

![](https://raw.githubusercontent.com/EdoLabs/src2/master/example1.svg?sanitize=true)
[](example1.svg)
#### Remote Device Setup in Tokyo

```js
$ npm install m2m array-gpio
```
```js
const m2m = require('m2m');

// using a built-in MCP9808 i2c library using array-gpio
// you can also create your own 9808 library using other npm modules
const i2c = require('./node_modules/m2m/examples/i2c/9808.js');

let device = new m2m.Device(110);

// explicitly connecting to default node-m2m server
device.connect('https://www.node-m2m.com', function(err, result){
  // device application logic
});

// or

// implicitly connecting to default node-m2m server
device.connect(function(err, result){
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  device.setChannel('temperature', function(err, data){
    if(err) return console.error('set temperature error:', err.message);

    let value =  i2c.getTemp();
    data.send(value);
  });
});
```

#### Client application in Boston
```js
$ npm install m2m
```
```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  let device = client.accessDevice(110);

  device.channel('temperature').watch(function(err, value){
    if(err) return console.error('temperature error:', err.message);
    console.log('temperature value', value); // 23.51, 23.49, 23.11
  });

  // or

  client.accessDevice(110, function (err, device){
    if(err) return console.error('accessDevice 110 error:', err.message);

    device.channel('temperature').watch(function(err, value){
      if(err) return console.error('temperature error:', err.message);
      console.log('temperature value', value); // 23.51, 23.49, 23.11
    });
  });

});
```
#### Client application in London
```js
$ npm install m2m
```

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  let device = client.accessDevice(110);

  // watch temperature data
  // the remote server will scan/poll it every 15 secs for any value changes
  device.channel('temperature').watch({interval:15000}, function(err, value){
    if(err) return console.error('temperature error:', err.message);
    console.log('temperature value', value); // 23.51, 23.49, 23.11
  });

  // unwatch temperature data after 5 minutes
  // client will stop receiving temperature data from the remote device
  setTimeout(function(){
    device.channel('temperature').unwatch();
  }, 5*60*1000);
});
```

## Example 2 <a name="example2"></a>

![](https://raw.githubusercontent.com/EdoLabs/src2/master/example2.svg?sanitize=true)

### Configure device1 for GPIO input monitoring
Install array-gpio both on device1 and device2 for GPIO monitoring and control
```js
$ npm install m2m array-gpio
```

```js
const m2m = require('m2m');

let device = new m2m.Device(120);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err);

  console.log('result:', result);

  // set GPIO inputs with a callback to execute any custom logic
  // optional callback will be executed if any of the input pin state changes
  // as triggered by any sensor/switch connected to pin 11 and 13
  device.setGpio({mode:'input', pin:[11, 13]}, function(err, gpio){
    if(err) return console.error('setGpio input error:', err.message);

    console.log('input pin', gpio.pin, 'state', gpio.state);
    // add your custom logic here

  });
});
```

### Configure device2 for GPIO output control
```js
$ npm install m2m array-gpio
```
```js
const m2m = require('m2m');

let device = new m2m.Device(130);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err);

  console.log('result:', result);

  // set gpio with an optional callback, it will be executed
  // if any of the output pin state changes as controlled by the client
  device.setGpio({mode:'output', pin:[33, 35]}, function(err, gpio){
    if(err) return console.error('setGpio output error:', err.message);

    // pin 33 is ON
    if(gpio.pin === 33 && gpio.state === true ){
      console.log('logic 1', 'input pin', gpio.pin, 'state', gpio.state);
      // execute custom logic 1 here
    }
    // pin 33 is OFF
    if(gpio.pin === 33 && gpio.state === false ){
      console.log('logic 2', 'input pin', gpio.pin, 'state', gpio.state);
      // execute custom logic 2 here
    }
    // pin 35 is ON
    if(gpio.pin === 35 && gpio.state === true ){
      console.log('logic 3', 'input pin', gpio.pin, 'state', gpio.state);
      // execute custom logic 3 here
    }
    // pin 35 is OFF
    if(gpio.pin === 35 && gpio.state === false ){
      console.log('logic 4', 'input pin', gpio.pin, 'state', gpio.state);
      // execute custom logic 4 here
    }
  });
});
```

### Client application to control device1 and device2
```js
$ npm install m2m
```

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
    if(err) return console.error('connect error:', err);
    console.log('result:', result);

    let device1 = client.accessDevice(120);
    let device2 = client.accessDevice(130);

    // using gpio() method for gpio control
    device1.gpio({mode:'in', pin:13}).watch(function(err, state){
      if(err) return console.error('watch pin 13 error:', err.message);
      console.log('device1 input 13 state', state);

      if(state){
        device2.gpio({mode:'out', pin:33}).on();
      }
      else{
        device2.gpio({mode:'out', pin:33}).off();
      }
    });

    // using in/input() or out/output() method for gpio control
    device1.in(11).watch(function(err, state){
      if(err) return console.error('watch pin 11 error:', err.message);
      console.log('device1 input 11 state', state);

      if(state){
        device2.out(35).off();
      }
      else{
        device2.out(35).on();
      }
    });
});
```

## Example 3 <a name="example3"></a>

![](https://raw.githubusercontent.com/EdoLabs/src2/master/example3.svg?sanitize=true)
[](example3.svg)

#### Configure each remote machine's embedded rpi microcontroller with a unique device *id* and set pin 40 for GPIO output control

Install array-gpio on all remote machines for GPIO output control
```js
$ npm install m2m array-gpio
```
```js
const m2m = require('m2m');

// assign 1001, 1002 and 1003 respectively for each remote machine
let device = new m2m.Device(1001);

device.connect((err, result) => {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);
  // set pin 40 as digital output to activate the actuator
  device.setGpio({mode:'output', pin:40});
});
```

#### Client application to control the remote machines
```js
$ npm install m2m
```

```js
const m2m = require('m2m');

const client = new m2m.Client();

let interval;

client.connect((err, result) => {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  // accessing multiple devices using an array object
  let devices = client.accessDevice([1001, 1002, 1003]);

  clearInterval(interval);
  machineControl(devices);
  // iterate over the remote machines every 15 secs
  // turn on each actuator one by one every 2 seconds
  // then, turning them off likewise
  interval = setInterval(machineControl, 15000, devices);

  // or

  client.accessDevice([1001, 1002, 1003], (err, devices) => {
    if(err) return console.error('accessDevice error:', err.message);

    clearInterval(interval);
    machineControl(devices);
    interval = setInterval(machineControl, 15000, devices);
  });
});

function machineControl(devices){
  let t = 0;    // initial output time delay
  let pin = 40; // actuator gpio output pin
  devices.forEach((device) => {
    t += 2000;
    // turn ON device gpio output pin 40
    device.output(pin).on(t, (err, state) => {
      if(err) return console.error('actuator ON err:', err.message);
      console.log('machine ', device.id, ' pin ', pin, ' output ON', state);
      // turn OFF device gpio output pin 40
      device.output(pin).off(t + 400, (err, state) => {
        if(err) return console.error('actuator OFF err:', err.message);
        console.log('machine ', device.id, ' pin ', pin, ' output OFF', state);
      });
    });
  });
}
```
## Example 4 <a name="example4"></a>
[](https://raw.githubusercontent.com/EdoLabs/src2/master/example4.svg?sanitize=true)
[](example1.svg)
### Sending Data To Remote Device or Server

#### Client
```js
const m2m = require('m2m');
const fs = require('fs');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  let server = client.accessDevice(500);

  let file = fs.readFileSync('myFile.txt', 'utf8');

  server.channel('send-file').sendData( file , function(err, result){
    if(err) return console.error('send-file error:', err.message);

    console.log('send-file', result); // {result: 'success'}
  });

  let mydata = [{name:'Ed'}, {name:'Jim', age:30}, {name:'Kim', age:42, address:'Seoul, South Korea'}];

  server.channel('send-data').sendData( mydata , function(err, result){
    if(err) return console.error('send-data error:', err.message);

    console.log('send-data', result); // {data: 'valid'}
  });

  let num = 1.2456;
  // send a data w/o a response
  server.channel('number').sendData(num);

});
```


#### Device/Server
```js
const m2m = require('m2m');
const fs = require('fs');

let server = new m2m.Device(500);

server.connect(function(err, result){
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  server.setChannel('send-file', function(err, data){
    if(err) return console.error('send-file error:', err.message);

    let file = data.payload;

    fs.writeFile('myFile.txt', file, function (err) {
      if (err) throw err;
      console.log('file has been saved!');
      // send a response
      data.send({result: 'success'});
    });
  });

  server.setChannel('send-data', function(err, data){
    if(err) return console.error('send-data error:', err.message);

    // data.payload  [{name:'Ed'}, {name:'Jim', age:30}, {name:'Kim', age:42, address:'Seoul, South Korea'}];
    console.log('data.payload', data.payload);

    // send a response
    if(Array.isArray(data.payload)){
      data.send({data: 'valid'});
    }
    else{
      data.send({data: 'invalid'});
    }
  });

  server.setChannel('number', function(err, data){
    if(err) return console.error('number error:', err.message);

    console.log('data.payload', data.payload); // 1.2456
  });

});
```


### Http REST API Simulation <a name="http-rest-api-simulation"></a>

#### Client GET and POST method request
```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  // access server 300 using a callback
  client.accessServer(300, (err, server) => {
    if(err) return console.error('accessDevice 300 error:', err.message);

    // GET method api request
    server.api('/random').get((err, result) => {
      if(err) return console.error('/random error:', err.message);
      console.log('/random result', result); // 24
    });

    // POST method api request
    server.api('/findData').post({name:'ed'}, (err, result) => {
      if(err) return console.error('/findData error:', err.message);
      console.log('/findData result', result); // {result: 'ok'}
    });
  });

});
```

#### Server GET and POST method setup
```js
const m2m = require('m2m');

const server = new m2m.Server(300);

server.connect((err, result) => {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  // GET method api setup
  server.getApi('/random', (err, data) => {
    if(err) return console.error('/random error:', err.message);

    data.send(Math.floor(( Math.random() * 100) + 25));
  });

  // POST method api setup
  server.postApi('/findData', (err, data) => {
    if(err) return console.error('/findData error:', err.message);
    setTimeout(() => {
      // received a data.body
      console.log('data.body', data.body); // {name:'ed'}
      // send a response
      data.send({result: 'ok'});
    }, 5000);
  });
});
```

## Browser Interaction <a name="browser-interaction"></a>

### Application Online Code Editing <a name="online-code-editing"></a>

Using the browser, you can download, edit and upload your client/device application code from or into your remote devices from anywhere.

To allow the browser to communicate with your application, you need to set a *code* permission option as shown below.
```js
{code:{allow:true, filename:'myAppFileName.js'}}
```
You need to set the property *allow* to true and provide the *filename* of your application.

Also for client application, you can set a *name*, *location* and *description* property option
especially if you have multiple clients to monitor as shown below. For device application, you do not need to set these properties.
```js
{code:{allow:true, filename:'myAppFilename.js'}, name:'myAppName', location:'myAppLocation', description:'myAppDescription'}}
```
#### Example

##### Client Application

```js
// client.js

const m2m = require('m2m');

const client = new m2m.Client();

client.connect(function (err, result) {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  client.setOption({code:{allow:true, filename:'client.js'}, name:'Master App', location:'New York, NY', description:'Main App'});

  // client application logic ...
});
```
##### Device Application
```js
// device.js

const m2m = require('m2m');

const device = new m2m.Device(1000);

device.connect(function (err, result) {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  // Don't set the name, location and description properties
  // You will provide them during device registration
  device.setOption({code:{allow:true, filename:'device.js'}});

  // device application logic ...
});
```
### Restarting Application or Auto Restart Setup <a name="auto-restart-setup"></a>

During browser interaction, your client/device application process will need to be restarted after a module update, application code update, remote command restart etc.

Node-m2m uses nodemon to restart your application process. You can add the following section in your project's package.json as a basic auto restart configuration.
```js
"scripts": {
  "start": "nodemon device.js --delay 2000ms"
},
"nodemonConfig": {
  "verbose": true,
  "restartable": "rs",
  "ignore": [".git", "public"],
  "ignoreRoot": [".git", "public"],
  "execMap": {"js": "node"},
  "watch": ["node_modules/m2m/mon"],
  "env": {"NODE_ENV": "development"},
  "ext": "js,json"
}
```
From the configuration section above, the filename of your application is *device.js*. Replace it with the actual filename of your application.
 Start your application using npm start.
```js
$ npm start
```
For other custom nodemon configuration, please read nodemon documentation.

## Other FaaS functions <a name="other-faas-functions"></a>

### Client request to get all available remote devices <a name="get-all-devices"></a>
```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  // user request to get all registered devices
  client.getDevices((err, devices) => {
    if(err) return console.error('getDevices err:', err);
    console.log('devices', devices);
    // devices output
    /*[
      { id: 100, name: 'Machine1', location: 'Seoul, South Korea' },
      { id: 200, name: 'Machine2', location: 'New York, US' },
      { id: 300, name: 'Machine3', location: 'London, UK' }
    ]*/
  });
});
```

### Client request to get each device resources setup <a name="device-setup"></a>
```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err);
  console.log('result:', result);

  client.accessDevice(300, (err, device) => {
    if(err) return console.error('accessDevice 300 error:', err.message);

    // client request to get device 300 resources
    // e.g. gpio input/output pins, available channels, system information
    device.setupInfo(function(err, data){
      if(err) return console.log('device1 setup error:', err.message);
      console.log('device1 setup data', data);
      // data output
      /*{
        id: 300,
        systemInfo: {
          cpu: 'arm',
          os: 'linux',
          m2mv: '1.2.5',
          totalmem: '4096 MB',
          freemem: '3160 MB'
        },
        gpio: {
          input: { pin: [11, 13], type: 'simulation' },
          output: { pin: [33, 35], type: 'rpi' }
        },
        channel: { name: [ 'voltage', 'gateway1', 'tcp' ] }
      }*/
    });  
  });
});
```
