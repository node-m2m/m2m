# m2m

[![Version npm](https://img.shields.io/npm/v/m2m.svg?logo=npm)](https://www.npmjs.com/package/m2m)
![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.node-m2m.com%2Fm2m%2Fbuild-badge%2F2021)

m2m is a lightweight communication library for developing client-server applications using the machine-to-machine framework [node-m2m](https://www.node-m2m.com).

It uses a FaaS (Function-as-a-Service) API also called *serverless* allowing anyone to easily create, prototype and test applications in IoT, telematics, data acquisition, process automation and a lot more.

You can deploy multiple public device servers on the fly from anywhere without the usual heavy infrastructure involved in provisioning a public server. Your device servers will be accessible through its user-assigned *device id* from client applications.

You can set multiple *Channel Data* or *HTTP API* resources from your device servers as well as *GPIO* resources from Raspberry Pi devices.

Access to clients and devices is restricted to authenticated and authorized users only. All communications traffic between clients and devices are fully encrypted using TLS.

To use this library, users will need to <a href="https://www.node-m2m.com/m2m/account/create" target="_blank">register</a> with node-m2m .

Start your first m2m application using the [quick tour](#quick-tour) guide.

[](https://raw.githubusercontent.com/EdoLabs/src/master/m2mSystem2.svg?sanitize=true)

# Table of contents
1. [Supported Platform](#supported-platform)
2. [Node.js version requirement](#nodejs-version-requirement)
3. [Installation](#installation)
4. [Quick Tour](#quick-tour)
   1. [Capturing and Watching Data](#capturing-and-watching-data)
   2. [Raspberry Pi Remote Control](#raspberry-pi-remote-control)
   3. [Capturing Data from Remote C/C++ Application through IPC (inter-process communication)](#capturing-data-from-remote-application-through-IPC)
5. [Channel Data Resources](#channel-data-resources)
   * [Set Channel Data Resources on Your Device](#set-channel-data-resources-on-your-device)
   * [Capture Channel Data from Device](#capture-channel-data-from-device)
   * [Watch Channel Data from Device](#watch-channel-data-from-device)
   * [Sending Data to Device](#sending-data-to-device)
   * [Example - Using MCP 9808 Temperature Sensor](#using-mcp-9808-temperature-sensor)
6. [GPIO Resources for Raspberry Pi](#gpio-resources-for-raspberry-pi)  
   * [Set GPIO Input Resources on Your Device](#set-gpio-input-resources-on-your-device)
   * [Set GPIO Output Resources on Your Device](#set-gpio-output-resources-on-your-device)
   * [Capture/Watch GPIO Input Resources from Device](#capture-and-watch-gpio-input-resources-from-device)
   * [Control (On/Off) GPIO Output Resources from Device](#control-gpio-output-resources-from-device)
   * [Using Channel Data API for GPIO Input/Output Resources](#using-channel-data-api-for-gpio-resources)
   * [Example - GPIO Input Monitoring and Output Control](#gpio-input-monitoring-and-output-control)
7. [HTTP API Resources](#http-api)
    * [Set HTTP GET and POST Resources on Your Device](#device-get-and-post-method-setup)
    * [Client HTTP GET and POST Request](#client-get-and-post-request)
8. [Device Orchestration](#device-orchestration)
    * [Remote Machine Monitoring](#remote-machine-monitoring)
9. [Using the Browser Interface](#using-the-browser-interface)
   * [Remote Code Editing](#remote-application-code-editing)
   * [Application Process Auto Restart](#application-auto-restart)
   * [Configure your Application for Remote Code Editing and Auto Restart](#code-edit-and-auto-restart-automatic-configuration)
   * [Naming your Client Application for Tracking Purposes](#naming-your-client-application-for-tracking-purposes)
10. [Get all available remote devices](#server-query-to-get-all-available-remote-devices-per-user)
11. [Get the available resources from a specific device](#client-request-to-get-the-available-resources-from-a-specific-device)
12. [Connecting to other server](#connecting-to-other-m2m-server)

## Supported Platform

* Raspberry Pi Models: B+, 2, 3, Zero & Zero W, Compute Module 3, 3B+, 3A+, 4B (generally all 40-pin models)
* Linux
* Windows
* Mac OS

## Node.js version requirement

* Node.js versions: 10.x, 11.x, 12.x, 14.x. Ideally the latest 14.x LTS version.

## Installation
```js
$ npm install m2m
```

![]()
###  Raspberry Pi peripheral access (GPIO, I2C, SPI and PWM). <a name="rpi-peripheral-access"></a>
For projects requiring raspberry pi peripheral access such as GPIO, I2C, SPI and PWM, you will need to install *array-gpio* as a separate module.
```js
$ npm install array-gpio
```

![]()
## Quick Tour

### Capturing and Watching Data
![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour.svg?sanitize=true)
[](quicktour.svg)

In this quick tour, we will create a simple server application that generates random numbers as its sole service and a client application that will access the random numbers using a *pull* and *push* method.

Using a *pull-method*, the client will capture the random numbers as one time function call.

Using a *push-method*, the client will watch the value of the random numbers every 5 seconds. If the value changes, the remote device will send or *push* the new value to our remote client.   

Before you start, [create an account](https://www.node-m2m.com/m2m/account/create) and register your remote device. You also need a [node.js](https://nodejs.org/en/) installation on your client and device computers.

#### Remote Device Setup

##### 1. Create a device project directory and install m2m.

```js
$ npm install m2m
```

##### 2. Save the code below as device.js within your device project directory.`

```js
const m2m = require('m2m');

// create a device object with a device id of 100
// this id must must be registered with node-m2m
let device = new m2m.Device(100);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);

  // set 'random-number' as channel data resource  
  device.setData('random-number', function(err, data){
    if(err) return console.error('setData random-number error:', err.message);

    let rn = Math.floor(Math.random() * 100);
    data.send(rn);
  });
});
```
##### 3. Start your device application.

```js
$ node device.js
```

The first time you run your application, it will ask for your full credentials.
```js
? Enter your userid (email):
? Enter your password:
? Enter your security code:

```
The next time you run your application, it will start automatically using a saved user token.

However, if your application is running for more than 15 minutes, it becomes immutable. Any changes to your application code will require you to re-authenticate for security reason.

Restart your application using `$ node device.js` or with the *-r* flag as shown below.

At anytime, you can re-authenticate with full credentials using an *-r* flag.
```js
$ node device.js -r
```

### Remote Client Setup
**1. Create a client project directory and install m2m.**

To access resources from your remote device, create an *alias* object using the client's *accessDevice* method as shown in the code below. The object created `device` becomes an *alias* of the remote device you are trying to access as indicated by its device id argument. In this case, the device id is `100`.

The *alias* object provides various methods to access channel data, GPIO object and HTTP API resources from your remote devices.

**2. Save the code below as client.js within your client project directory.**
```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);

  // access the remote device using an alias object
  let device = client.accessDevice(100);

  // capture 'random-number' data using a pull method
  device.getData('random-number', function(err, data){
    if(err) return console.error('getData random-number error:', err.message);
    console.log('random data', data); // 97
  });

  // capture 'random-number' data using a push method
  device.watch('random-number', function(err, data){
    if(err) return console.error('watch random-number error:', err.message);
    console.log('watch random data', data); // 81, 68, 115 ...
  });
});
```
**3. Start your application.**
```js
$ node client.js
```
Similar with remote device setup, you will be prompted to enter your credentials.

You should get a similar output result as shown below.
```js
random data 97
watch random data 81
watch random data 68
watch random data 115
```

### Raspberry Pi Remote Control
![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour2.svg?sanitize=true)
[](quicktour.svg)

In this quick tour, we will use two raspberry pi's as remote client and device. We will install two push-button switches ( GPIO pin 11 and 13 ) on the remote client, and an led actuator ( GPIO pin 33 ) on the remote device.

The client will attempt to turn **on** and **off** the remote device's actuator and receive a confirmation response of *true* value to signify the status of the actuator was indeed turned **on** and a *false* value when the actuator is turned **off**.

The client will also show an on/off response times providing some insight on the responsiveness of the remote control system.     

#### Remote Device Setup

##### 1. Create a device project directory and install m2m and array-gpio.
```js
$ npm install m2m array-gpio
```
##### 2. Save the code below as device.js in your device project directory.

```js
const { Device } = require('m2m');

let device = new Device(200);

device.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  device.setGpio({mode:'output', pin:33});
});
```

##### 3. Start your device application.
```js
$ node device.js
```
#### Remote Client Setup

##### 1. Create a client project directory and install m2m and array-gpio.
```js
$ npm install m2m array-gpio
```
##### 2. Save the code below as client.js in your client project directory.

```js
const { Client } = require('m2m');
const { setInput, watchInput } = require('array-gpio');

let sw1 = setInput(11); // ON switch
let sw2 = setInput(13); // OFF switch

let client = new Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let t1 = null;
  let device = client.accessDevice(200);

  sw1.watch(1, (state)=> {
    if(state){
      t1 = new Date();
      console.log('turning ON remote actuator');
      device.output(33).on(function(err, data){
        if(err) return console.error('led-control on error:', err.message);
        let t2 = new Date();
        console.log('ON confirmation', data, 'response time', t2 - t1, 'ms');
      });
    }
  });

  sw2.watch(1, (state)=> {
    if(state){
      t1 = new Date();
      console.log('turning OFF remote actuator');
      device.output(33).off(function(err, data){
        if(err) return console.error('led-control off error:', err.message);
        let t2 = new Date();
        console.log('OFF confirmation', data, 'response time', t2 - t1, 'ms');
      });
    }
  });
});
```
##### 3. Start your application.
```js
$ node client.js
```
The led actuator from remote device should toggle on and off as you press the corresponding ON/OFF switches from the client.

### Capturing Data from Remote Application through IPC
![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour3.svg?sanitize=true)
[](quicktour.svg)

In this quick tour, the client will attempt to send and capture data from a C/C++ application through inter-process communication (ipc) using *tcp* with the remote device.

The client will send a *json* data { type:"random", value:"" } and should receive a random value from the remote device e.g. { type:"random", value: 26 };

We will use the nlohmann-json (https://github.com/nlohmann/json) library for *json* data interchange with C/C++ application.

#### Remote Device Setup

##### 1. Create a device project directory and install m2m.
```js
$ npm install m2m
```
##### 2. Save the code below as device.js in your device project directory.
```js
'use strict';

const net = require('net');
const m2m = require('m2m');

const device = new m2m.Device(300);

device.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  device.setData('ipc-channel', (err, data) => {
    if(err) return console.error('tcp-ipc-channel error:', err.message);

    let pl = null;

    if(typeof data.payload === 'object'){
      pl = JSON.stringify(data.payload);
    }
    else if(typeof data.payload === 'string'){
      pl = data.payload;
    }
    else{
      data.send('invalid payload');
      return;
    }

    TcpClient('127.0.0.1', 5300, pl, (err, d) => {
      if(err) return console.error('TcpClient error:', err.message);
      if(d){
        data.send(d);
      }
    });
  });

});

function TcpClient(ip, port, payload, cb){
  const client = new net.Socket();
  client.connect(port, ip);

  client.setEncoding('utf8');

  client.on("connect", () => {
    if(payload){
      client.write(payload);
    }
  });

  client.on('error', (error) => {
    console.log("Tcp client socket error:", error);
    if(error && cb){
      cb(error, null);
    }
    client.destroy();
  });

  client.on("data", (data) => {		
    if(cb){
      setImmediate(cb, null, data);
    }
    client.end();
  });

  client.on("close", (error) => {
    if(error && cb){
      console.log("Tcp client socket is closed:", error);
      cb(error, null);
    }
  });

  client.on("end", (error) => {
    if(error && cb){
      console.log("Tcp client socket connection is terminated:", error);
      cb(error, null);
    }
    client.unref();
  });
};
```
##### 3. Start your device application.
```js
$ node device.js
```

#### Remote C/C++ Application Setup on Remote Device

##### 1. Download the *m2mQuicktour3* example project.
```js
$ git clone https://github.com/EdAlegrid/m2mQuicktour3.git
```
Check the *main.cpp* source file inside the *m2mQuicktour3* directory as shown below. 
```js
/*
 * File:   main.ccp
 * Author: Ed Alegrid
 *
 * Use any Linux C++11 compliant compiler or IDE.
 *
 */

#include <string>  
#include <memory>
#include <iostream>
#include <nlohmann/json.hpp>
#include "tcp/server.h"

using namespace std;
using json = nlohmann::json;

int main()
{
  cout << "\n*** Remote C/C++ Application ***\n" << endl;

  auto server = make_shared<Tcp::Server>(5300);

  for (;;)
  {
      // listen for new client connection
      // set socket listener to true for continous loop
      server->socketListen(true);

      // generate random number 1 ~ 100
      int rn = rand() % 100 + 1;

      // read data from client
      auto data = server->socketRead();
      cout << "rcvd client data: " << data << endl;

      // parse received json data
      try{
        auto j = json::parse(data);

        if(j["type"] == "random"){
          j["value"] = rn;
          cout << "send back json data: " << server->socketWrite(j.dump()) << endl;
        }
        else{
          cout << "send back invalid json data: " << server-> socketWrite("invalid json data") << endl;
        }
      }
      catch (json::parse_error& ex)
      {
        cerr << "parse error at byte " << ex.byte << endl;
        cout << "send back string data: " << server->socketWrite(data) << endl;
      }

      cout << "waiting for client data ...\n\n";
      server->socketClose();
  }
  return 0;
}
```
##### 2. Install nlohmann-json library for *json* data interchange.  
```js
$ sudo apt-get install nlohmann-json3-dev
```
##### 3. Compile the *main.cpp* source file inside of the *m2mQuicktour3* directory.
```js
$ cd m2mQuicktour3
```
```js
$ g++ -Wall -g -o bin/main main.cpp -pthread
```
##### 3. Run the main application.
```js
$ ./bin/main
```
Once the C/C++ Application is up and running, you should see a server output as shown below.
```js
*** Remote C/C++ Application ***

Server listening on: 127.0.0.1:5300
```
### Remote Client Setup
##### 1. Create a client project directory and install m2m.
```js
$ npm install m2m
```
##### 2. Save the code below as client.js in your client project directory.
```js
const { Client } = require('m2m');

let client = new Client();

client.connect((err, result) => {
//client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device = client.accessDevice(300);

  // test payload
  let payload = {type:'random'};

  device.sendData('ipc-channel', payload, (err, data) => {
    if(err) return console.error('watch tcp-channel error:', err.message);

    try{
      let jd = JSON.parse(data);
      console.log('rcvd json data:', jd);
    }
    catch (e){
      console.log('rcvd string data:', data);
    }
  });
});
```
##### 3. Run your client application.
```js
$ node client.js -s
```
The client should receive a *json* data with the random value property from the remote C/C++ application.

## Channel Data Resources

### Set Channel Data Resources on Your Device

```js
const { Device } = require('m2m');

let device = new Device(deviceId);

device.connect(function(err, result){
  ...

  /*
   * Set a name for your channel data. You can use any name you want.
   * In the example below, 'my-channel' is the name of channel data.
   */
  device.setData('my-channel', function(err, data){
    if(err) return console.error('setData my-channel error:', err.message);

    /*
     * Provide a data source for your channel data.
     * Your data source can be of type string, number or object.
     *
     * It could be a value from a sensor device, database, inventory,
     * metrics, machine status or any performance data from a business application  
     *
     * Below is a pseudocode DataSource() function that returns the value of a data source.
     */
    let ds = DataSource();
    data.send(ds);

  });
});
```
### Capture Channel Data from Device
```js
const { Client } = require('m2m');

let client = new Client();

client.connect(function(err, result){
  ...

  /**
   *  Capture channel data using a device alias
   */

  // Access the remote device you want to access by creating an alias object
  let device = client.accessDevice(deviceId);

  device.getData('my-channel', function(err, data){
    if(err) return console.error('my-channel error:', err.message);

    // data is the value of 'my-channel' data source
    console.log(data);
  });

  /**
   *  Capture channel data directly from the client object
   */

  // Provide the deviceId of the remote device you want to access
  client.getData(deviceId, 'my-channel', function(err, data){
    if(err) return console.error('my-channel error:', err.message);

    // data is the value of 'my-channel' data source
    console.log(data);
  });
});
```

### Watch Channel Data from Device
```js
const { Client } = require('m2m');

let client = new Client();

client.connect(function(err, result){
  ...

 /**
  *  Watch channel data using a device alias
  */

  // Create an alias object for the remote device you want to access
  let device = client.accessDevice(deviceId);

  // watch using a default poll interval of 5 secs
  device.watch('my-channel', function(err, data){
    if(err) return console.error('my-channel error:', err.message);

    // data is the value of 'my-channel' data source
    console.log(data);
  });

  // watch using a 1 minute poll interval
  device.watch('my-channel', 60000, function(err, data){
    if(err) return console.error('my-channel error:', err.message);
    console.log(data);
  });

  // unwatch channel data at a later time
  setTimeout(()=>{
    device.unwatch('my-channel');
  }, 5*60000);

  // watch again using the default poll interval
  setTimeout(()=>{
    device.watch('my-channel');
  }, 10*60000);

  // watch again using a 1 min poll interval
  setTimeout(()=>{
    device.watch('my-channel', 60000);
  }, 15*60000);


  /**
   *  Watch channel data directly from the client object
   */

  // Provide the device id of the remote device you want to access
  // as 1st argument of watch method

  // watch using a default poll interval of 5 secs
  client.watch(deviceId, 'my-channel', function(err, data){
    if(err) return console.error('channel-data error:', err.message);

    // data is the value of 'my-channel' data source
    console.log('my-channel', data);
  });

  // watch using 30000 ms or 30 secs poll interval
  client.watch(deviceId, 'my-channel', 30000, function(err, data){
    if(err) return console.error('channel-data error:', err.message);
    console.log(data);
  });

  // unwatch channel data at a later time
  setTimeout(()=>{
    client.unwatch(deviceId, 'my-channel');
  }, 5*60000);

  // watch again at a later time using the default poll interval
  setTimeout(()=>{
    client.watch(deviceId, 'my-channel');
  }, 10*60000);

  // watch again at a later time using 30 secs poll interval
  setTimeout(()=>{
    client.watch(deviceId, 'my-channel', 30000);
  }, 15*60000);

});
```
### Sending Data to Device

Instead of capturing or receiving data from remote devices, we can send data to device channel resources for updates and data migration, as control signal, or for whatever purposes you may need it in your application.  

#### Set Channel Data on Your Device
```js
const m2m = require('m2m');
const fs = require('fs');

let server = new m2m.Device(deviceId);

server.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  server.setData('echo-server', function(err, data){
    if(err) return console.error('echo-server error:', err.message);
    // send back the payload to client
    data.send(data.payload);
  });

  server.setData('send-file', function(err, data){
    if(err) return console.error('send-file error:', err.message);

    let file = data.payload;

    fs.writeFile('myFile.txt', file, function (err) {
      if (err) throw err;
      console.log('file has been saved!');
      // send a response
      data.send({result: 'success'});
    });
  });

  server.setData('send-data', function(err, data){
    if(err) return console.error('send-data error:', err.message);

    console.log('data.payload', data.payload);
    // data.payload  [{name:'Ed'}, {name:'Jim', age:30}, {name:'Kim', age:42, address:'Seoul, South Korea'}];

    // send a response
    if(Array.isArray(data.payload)){
      data.send({data: 'valid'});
    }
    else{
      data.send({data: 'invalid'});
    }
  });

  server.setData('number', function(err, data){
    if(err) return console.error('number error:', err.message);

    console.log('data.payload', data.payload); // 1.2456
  });
});
```
#### Send Channel Data to Device
```js
const fs = require('fs');
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let server = client.accessDevice(deviceId);

  // sending a simple string payload data to 'echo-server' channel
  let payload = 'hello server';

  server.sendData('echo-server', payload , function(err, data){
    if(err) return console.error('echo-server error:', err.message);

    console.log('echo-server', data); // 'hello server'
  });

  // sending a text file
  let myfile = fs.readFileSync('myFile.txt', 'utf8');

  server.sendData('send-file', myfile , function(err, data){
    if(err) return console.error('send-file error:', err.message);

    console.log('send-file', data); // {result: 'success'}
  });

  // sending a json data
  let mydata = [{name:'Ed'}, {name:'Jim', age:30}, {name:'Kim', age:42, address:'Seoul, South Korea'}];

  server.sendData('send-data', mydata , function(err, data){
    if(err) return console.error('send-data error:', err.message);

    console.log('send-data', data); // {data: 'valid'}
  });

  // sending data w/o a response
  let num = 1.2456;

  server.sendData('number', num);
});
```

### Using MCP 9808 Temperature Sensor

![](https://raw.githubusercontent.com/EdoLabs/src2/master/example1.svg?sanitize=true)
[](example1.svg)
#### Remote Device Setup in Tokyo

Using a built-in MCP9808 i2c library from array-gpio
```js
$ npm install array-gpio
```
```js
const m2m = require('m2m');
const i2c = require('./node_modules/m2m/examples/i2c/9808.js');

let device = new m2m.Device(110);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  device.setData('sensor-temperature', function(err, data){
    if(err) return console.error('set sensor-temperature error:', err.message);

    // temperature data
    let td =  i2c.getTemp();
    data.send(td);
  });
});
```
Using *i2c-bus* npm module to setup MCP 9808 temperature sensor
```js
$ npm install i2c-bus
```
[Configure I2C on Raspberry Pi.](https://github.com/fivdi/i2c-bus/blob/HEAD/doc/raspberry-pi-i2c.md)
\
\
After configuration, setup your device using the following code.
```js
const m2m = require('m2m');
const i2c = require('i2c-bus');

const MCP9808_ADDR = 0x18;
const TEMP_REG = 0x05;

const toCelsius = rawData => {
  rawData = (rawData >> 8) + ((rawData & 0xff) << 8);
  let celsius = (rawData & 0x0fff) / 16;
  if (rawData & 0x1000) {
    celsius -= 256;
  }
  return celsius;
};

const i2c1 = i2c.openSync(1);
const rawData = i2c1.readWordSync(MCP9808_ADDR, TEMP_REG);

let device = new m2m.Device(110);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  device.setData('sensor-temperature', function(err, data){
    if(err) return console.error('set sensor-temperature error:', err.message);

    // temperature data
    let td =  toCelsius(rawData);
    data.send(td);
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
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device = client.accessDevice(110);

  device.watch('sensor-temperature', function(err, data){
    if(err) return console.error('sensor-temperature error:', err.message);
    console.log('sensor temperature data', data); // 23.51, 23.49, 23.11
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
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device = client.accessDevice(110);

  // scan/poll the data every 15 secs instead of the default 5 secs
  device.watch('sensor-temperature', 15000, function(err, data){
    if(err) return console.error('sensor-temperature error:', err.message);
    console.log('sensor temperature data', data); // 23.51, 23.49, 23.11
  });

  // unwatch temperature data after 5 minutes
  setTimeout(function(){
    device.unwatch('sensor-temperature');
  }, 5*60000);

  // watch temperature data again using the default poll interval
  setTimeout(function(){
    device.watch('sensor-temperature');
  }, 10*60000);
});
```

## GPIO Resources for Raspberry Pi

### Set GPIO Input Resources on Your Device

Install array-gpio on your Raspberry Pi device
```js
$ npm install array-gpio
```

GPIO input object resources are *read-only*. Clients can read/capture and watch its current state in real-time but they *cannot set or change it*.

```js
const { Device }  = require('m2m');

let device = new Device(deviceId);

device.connect(function(err, result){
  ...

  // Set a GPIO input resource using pin 11
  device.setGpio({mode:'input', pin:11});

  // Set GPIO input resources using pin 11, 13, 15 and 19
  device.setGpio({mode:'input', pin:[11, 13, 15, 19]});

  // Set GPIO input resources w/ a callback argument
  device.setGpio({mode:'input', pin:[15, 19]}, function(err, gpio){
    if(err) return console.error('setGpio input error:', err.message);

    /*
     * If there is no error, the callback will return a gpio object
     * with a pin and a state property that you can use for additional
     * data processing/filtering with a custom logic
     */
    console.log('pin', gpio.pin, 'state', gpio.state);

    // add custom logic here
  });
});
```

#### Set Simulated GPIO Input Resources on Non-Raspberry Device

You can set GPIO input objects in simulation on Windows or Linux computers for trial. It behaves similarly as if you are using a Raspberry Pi but only in simulation. Set the GPIO input object  resources as usual with a callback and add a *type* property with a value of `sim` or `simulation` from the object argument.  

```js
const { Device }  = require('m2m');

let device = new Device(deviceId);

device.connect(function(err, result){
  ...

  device.setGpio({mode:'input', pin:[15, 19], type:'sim'}, function(err, gpio){
    if(err) return console.error('setGpio input error:', err.message);

    console.log('input pin', gpio.pin, 'state', gpio.state);

  });
});
```

### Set GPIO Output Resources on Your Device

Install array-gpio on your Raspberry Pi device
```js
$ npm install array-gpio
```

GPIO output object resources are both *readable* and *writable*. Clients can read/capture and control (on/off) its current state in real-time. At present, you *cannot watch* the state of GPIO output objects.
```js
const { Device }  = require('m2m');

let device = new Device(deviceId);

device.connect(function(err, result){
  ...

  // Set a GPIO output resource using pin 33
  device.setGpio({mode:'output', pin:33});

  // Set GPIO output resources using pin 33, 35, 36 and 37
  device.setGpio({mode:'output', pin:[33, 35, 36, 37]});

  // Set GPIO output resources w/ a callback argument
  device.setGpio({mode:'output', pin:[36, 37]}, function(err, gpio){
    if(err) return console.error('setGpio input error:', err.message);

    /*
     * If there is no error, the callback will return a gpio object
     * with a pin and a state property that you can use for additional
     * data processing/filtering with a custom logic
     */
    console.log('pin', gpio.pin, 'state', gpio.state);

    // add custom logic here
  });
});
```
#### Set Simulated GPIO Output Resources on Non-Raspberry Device

Similar with input objects, you can set GPIO output objects in simulation for Windows or Linux computers for trial. Set the GPIO output objects as usual with a callback and add a *type* property with a value of `sim` or `simulation` from the object argument.    

```js
const { Device }  = require('m2m');

let device = new Device(deviceId);

device.connect(function(err, result){
  ...

  device.setGpio({mode:'output', pin:[33, 35], type:'sim'}, function(err, gpio){
    if(err) return console.error('setGpio output error:', err.message);

    console.log('output pin', gpio.pin, 'state', gpio.state);

  });
});
```

### Capture and Watch GPIO Input Resources from Device

There are two ways we can capture and watch GPIO input resources from remote devices.


```js
const { Client } = require('m2m');

let client = new Client();

client.connect(function(err, result){
  ...

  let device = client.accessDevice(deviceId);

  /**
   *  Using .gpio() method
   */

  // get current state of input pin 11
  device.gpio({mode:'in', pin:11}).getState(function(err, state){
    if(err) return console.error('getState input pin 11 error:', err.message);

    // returns the state of pin 11
    console.log(state);
  });

  // watch input pin 13, default scan interval is 100 ms
  device.gpio({mode:'in', pin:13}).watch(function(err, state){
    if(err) return console.error('watch input pin 13 error:', err.message);

    console.log(state);
  });

  /**
   *  Using .input()/output() method
   */

  // get current state of input pin 13
  device.input(13).getState(function(err, state){
    if(err) return console.error('getState input pin 13 error:', err.message);

    // returns the state of pin 13
    console.log(state);
  });

  // watch input pin 15, default scan interval is 100 ms
  device.input(15).watch(function(err, state){
    if(err) return console.error('watch input pin 15 error:', err.message);

    console.log(state);
  });
});
```

### Control GPIO Output Resources from Device

Similar with GPIO input access, there are two ways we can set or control (on/off) the GPIO output state from remote devices.

```js
const { Client } = require('m2m');

let client = new Client();

client.connect(function(err, result){
  ...

  let device = client.accessDevice(deviceId);

  /**
   *  Using .gpio() method
   */

  // Applies both for on/off methods

  // turn ON output pin 33
  device.gpio({mode:'out', pin:33}).on();

  // turn OFF output pin 33 w/ a callback for state confirmation and
  // for additional data processing/filtering with a custom logic
  device.gpio({mode:'out', pin:33}).off(function(err, state){
    if(err) return console.error('turn OFF output pin 33 error:', err.message);

    console.log(state);

    // add custom logic here
  });

  /**
   *  Using .input()/output() method
   */

  // Applies both for on/off methods

  // turn OFF output pin 35
  device.output(35).off();

  // turn ON output pin 35 w/ a callback for state confirmation and
  // for additional data processing/filtering with a custom logic
  device.output(35).on(function(err, state){
    if(err) return console.error('turn ON output pin 35 error:', err.message);

    console.log(state);

    // add custom logic here
  });  
});
```
### GPIO Input Monitoring and Output Control

![](https://raw.githubusercontent.com/EdoLabs/src2/master/example2.svg?sanitize=true)
Install array-gpio both on device1 and device2
```js
$ npm install array-gpio
```
#### Configure GPIO input resources on device1
```js
const m2m = require('m2m');

let device = new m2m.Device(120);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);

  // Set GPIO input resources using pin 11 and 13
  device.setGpio({mode:'input', pin:[11, 13]});

});
```

#### Configure GPIO output resources on device2

```js
const m2m = require('m2m');

let device = new m2m.Device(130);

device.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);

  console.log('result:', result);

  // Set GPIO output resources using pin 33 and 35
  device.setGpio({mode:'output', pin:[33, 35]});

});
```
#### Access GPIO input/output resources from device1 and device2

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device1 = client.accessDevice(120);
  let device2 = client.accessDevice(130);

  // get current state of input pin 13
  device1.input(13).getState(function(err, state){
    if(err) return console.error('get input pin 13 state error:', err.message);

    // show current state of pin 13
    console.log(state);
  });

  // watch input pin 13
  device1.input(13).watch(function(err, state){
    if(err) return console.error('watch pin 13 error:', err.message);

    if(state){
      // turn OFF output pin 35
      device2.output(35).off();
    }
    else{
      // turn ON output pin 35
      device2.output(35).on();
    }
  });

  // get current state of input pin 11
  device1.input(11).getState(function(err, state){
    if(err) return console.error('get input pin 11 state error:', err.message);

    // show current state of pin 11
    console.log(state);
  });

  // watch input pin 11
  device1.input(11).watch(function(err, state){
    if(err) return console.error('watch pin 11 error:', err.message);

    if(state){
      // turn ON output pin 33
      device2.output(33).on();
    }
    else{
      // turn OFF output pin 33
      device2.output(33).off();
    }
  });

});
```
### Using Channel Data API for GPIO Resources

If the standard API for setting GPIO resources does not meet your requirements, you can use the channel data API to set GPIO input/output resources.

In this example, we will use the API of the *array-gpio* module to watch an input object and control (on/off) an output object. If you are familar with other *npm* GPIO library, you can use it instead.     

#### Device setup
```js
const m2m = require('m2m');
const { setInput, setOutput } = require('array-gpio');

// set pin 11 as input sw1
const sw1 = setInput(11);

// set pin 33 as output led
const led = setOutput(33);

const server = new m2m.Device(200);

server.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  // set 'sw1-state' resource
  server.setData('sw1-state', function(err, data){
    if(err) return console.error('sw1-state error:', err.message);

    data.send(sw1.state);  
  });

  // set 'led-state' resource
  server.setData('led-state', function(err, data){
    if(err) return console.error('led-state error:', err.message);

    data.send(led.state);
  });

  // set 'led-control' resource
  server.setData('led-control', function(err, data){
    if(err) return console.error('led-control error:', err.message);
    let ledState = null;

    if(data.payload === 'on'){
      ledState = led.on();
    }
    else{
      ledState = led.off();
    }
    data.send(ledState);
  });
});
```

#### Client setup
```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(function(err, result){
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device = client.accessDevice(200);

  // monitor sw1 state transitions every 5 secs
  device.watch('sw1-state', function(err, data){
    if(err) return console.error('sw1-state error:', err.message);

    console.log('sw1-state value', data);

    if(data === true){
      device.sendData('led-control', 'on', function(err, data){
        if(err) return console.error('led-control on error:', err.message);

        console.log('led-control on', data); // true
      });
    }
    else{
      device.sendData('led-control', 'off', function(err, data){
        if(err) return console.error('led-control off error:', err.message);

        console.log('led-control off', data); // false
      });
    }
  });

  // monitor led state transitions every 5 secs
  device.watch('led-state', function(err, data){
    if(err) return console.error('led-state error:', err.message);

    console.log('led-state value', data);
  });
});
```
## HTTP API

### Device GET and POST method setup
```js
const m2m = require('m2m');

const server = new m2m.Server(deviceId);

server.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let myData = {name:'Jim', age:34};

  // set a GET method resource
  server.get('data/current', (err, data) => {
    if(err) return console.error('data/current error:', err.message);
    // send current data
    data.send(myData);
  });

  // set a POST method resource
  server.post('data/update', (err, data) => {
    if(err) return console.error('data/update error:', err.message);

    myData = data.payload;
    // send a 'success' response
    data.send('success');
  });
});
```
### Client GET and POST request
```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let server = client.accessServer(deviceId);

  // GET method request
  server.get('data/current', (err, data) => {    
    if(err) return console.error('data/current error:', err.message);

    console.log('data/current', data); // {name:'Jim', age:34}
  });

  // POST method request
  server.post('data/update', {name:'ed', age:35} , (err, data) => {   
    if(err) return console.error('data/update error:', err.message);

    console.log('data/update', data); // 'success'
  });

  // get data after update
  server.get('data/current'); // data/current {name:'ed', age:35}
  // using the 'data/current' initial callback for the result

});
```
## Device Orchestration

### Remote Machine Monitoring

Install array-gpio for each remote machine.
```js
$ npm install array-gpio
```
#### Server setup
Configure each remote machine's rpi microcontroller with the following GPIO input/output and channel data resources
```js
const { Device } = require('m2m');
const { setInput, setOutput, watchInput } = require('array-gpio');

const sensor1 = setInput(11); // connected to switch sensor1
const sensor2 = setInput(13); // connected to switch sensor2

const actuator1 = setOutput(33); // connected to alarm actuator1
const actuator2 = setOutput(35); // connected to alarm actuator2

// assign 1001, 1002 and 1003 respectively for each remote machine
const device = new Device(1001);

let status = {};

// Local I/O machine control process
watchInput(() => {
  // monitor sensor1
  if(sensor1.isOn){
    actuator1.on();
  }
  else{
    actuator1.off();
  }
  // monitor sensor2
  if(sensor2.isOn){
    actuator2.on();
  }
  else{
    actuator2.off();
  }
});

// m2m device application
device.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  device.setData('machine-status', function(err, data){
    if(err) return console.error('machine-status error:', err.message);

    status.sensor1 = sensor1.state;
    status.sensor2 = sensor2.state;

    status.actuator1 = actuator1.state;
    status.actuator2 = actuator2.state;

    console.log('status', status);

    data.send(JSON.stringify(status));
  });
});
```
#### Client application to monitor the remote machines
In this example, the client will iterate over the remote machines once and start watching each machine's sensor and actuactor status. If one of the sensors and actuator's state changes, the status will be pushed to the client.     
```js
const { Client } = require('m2m');

const client = new Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  client.accessDevice([100, 200, 300], function(err, devices){
    let t = 0;
    devices.forEach((device) => {
      t = t + 100;
      setTimeout(() => {
        // device watch interval is every 10 secs
        device.watch('machine-status', 10000, (err, data) => {
          if(err) return console.error(device.id, 'machine-status error:', err.message);
          console.log(device.id, 'machine-status', data); // 200 machine-status {"sensor1":false,"sensor2":false,"actuator1":false,"actuator2":true}
          /* If one of the machine's status has changed,
           * it will receive only the status from the affected machine
           *
           * Add logic to process the 'machine-status' channel data
           */
        });
      }, t);
    });
  });
});
```
## Using the Browser Interface

### Remote Application Code Editing

Using the browser interface, you can download, edit and upload your application code from your remote clients and devices from anywhere.

To allow the browser to communicate with your application, add the following *m2mConfig* property to your project's package.json.

```js
"m2mConfig": {
  "code": {
    "allow": true,
    "filename": "device.js"
  }
}
```
Set the property *allow* to true and provide the *filename* of your application.

From the example above, the filename of the application is *device.js*. Replace it with the actual filename of your application.


### Application Auto Restart
Using the browser interface, you may need to restart your application after a module update, code edit/update, or a remote restart command.

Node-m2m uses **nodemon** to restart your application.
```js
$ npm install nodemon
```

You can add the following *nodemonConfig* and *scripts* properties in your project's npm package.json as *auto-restart configuration*.
```js
"nodemonConfig": {
  "delay":"2000",
  "verbose": true,
  "restartable": "rs",
  "ignore": [".git", "public"],
  "ignoreRoot": [".git", "public"],
  "execMap": {"js": "node"},
  "watch": ["node_modules/m2m/mon"],
  "ext": "js,json"
}
"scripts": {
  "start": "nodemon device.js"
},
```
From the example above, the filename of the application is *device.js*. Replace it with the actual filename of your application when adding the scripts property. Then restart your node process using *npm start* command as shown below.
```js
$ npm start
```
For other custom nodemon configuration, please read the nodemon documentation.

## Code Edit and Auto Restart Automatic Configuration
Install nodemon.
```js
$ npm install nodemon
```
To configure your package.json for code editing and auto-restart without manual editing of package.json, start your node process with *-config* flag.

*m2m* will attempt to configure your package.json by adding/creating the *m2mConfig*, *nodemonConfig*, and *scripts* properties to your existing project's package.json. If your m2m project does not have an existing package.json, it will create a new one.  

Assuming your application filename is *device.js*, start your node application as shown below.
```js
$ node device -config
```

Stop your node process using *ctrl-c*. Check and verify your package.json if it was properly configured.

If the configuration is correct, you can now run your node process using *npm start* command.
```js
$ npm start
```
Your application should restart automatically after a remote *code update*, an *npm module update*, a remote *restart command* from the browser interface.

### Naming your Client Application for Tracking Purposes

Unlike the *device/server* applications, users can create *client* applications without registering it with the server.

Node-m2m tracks all client applications through a dynamic *client id* from the browser.
If you have multiple clients, tracking all your clients by its *client id* is not easy.

You can add a *name*, *location* and a *description* properties to your clients as shown below.

This will make it easy to track all your clients from the browser interface.
```js
const m2m = require('m2m');

const client = new m2m.Client({name:'Main client', location:'Boston, MA', description:'Test client app'});

client.connect((err, result) => {
  ...
});
```

### Server query to get all available remote devices per user
```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  // server request to get all registered devices
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
### Client request to get the available resources from a specific device

```js
const m2m = require('m2m');

const client = new m2m.Client();

client.connect((err, result) => {
  if(err) return console.error('connect error:', err.message);
  console.log('result:', result);

  let device = client.accessDevice(300);

  // request to get device 300 resources
  // GPIO input/output objects, available channels and HTTP url paths, system information etc.
  device.resourcesInfo(function(err, data){
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
```
## Connecting to other m2m server
### You can connect to a different server by providing the url of the server you want to use
```js
...
// By default without a url argument, the connect method will use the 'https://www.node-m2m.com' server
.connect(function(err, result){
  // application logic
});

// To connect to a different server, provide a url argument to the connect method
// e.g. using the 'https://www.my-m2m-server.com' server
.connect('https://www.my-m2m-server.com', function(err, result){
  // application logic
});
```
