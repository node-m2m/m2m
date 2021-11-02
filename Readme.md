# m2m

[![Version npm](https://img.shields.io/npm/v/m2m.svg?logo=npm)](https://www.npmjs.com/package/m2m)
![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.node-m2m.com%2Fm2m%2Fbuild-badge%2F2021)

m2m is a lightweight real-time communication library for developing client-server or pub-sub applications using the machine-to-machine framework [node-m2m](https://www.node-m2m.com).

It uses a FaaS (Function-as-a-Service) API also called *serverless* allowing anyone to easily create, prototype and test applications in IoT, telematics, data acquisition, process automation and a lot more.

You can deploy multiple private device servers on the fly from anywhere without the usual heavy infrastructure involved in provisioning an on-premise physical servers. Your device servers will be instantly available and accessible through its user-assigned *device id* from your client applications.

You can set multiple *Channel*, *HTTP* and *GPIO* ( for Raspberry Pi devices ) resources on your remote device for client consumption.

Access to clients and devices is restricted to authenticated and authorized users only. All communications traffic between clients and devices are fully encrypted using TLS.

To use this library, users will need to <a href="https://www.node-m2m.com/m2m/account/create" target="_blank">register</a> with node-m2m.

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
5. [Device Orchestration](#device-orchestration)
    * [Remote Machine Monitoring](#remote-machine-monitoring)
6. [Using the Browser Interface](#using-the-browser-interface)
   * [Enable Application Code Editing](#remote-application-code-editing)
   * [Enable Application Auto Restart](#application-auto-restart)
   * [Automatic Configuration for Code Editing and Auto Restart](#code-edit-and-auto-restart-automatic-configuration)
   * [Naming your Client Application for Tracking Purposes](#naming-your-client-application-for-tracking-purposes)
7. [API](https://github.com/EdAlegrid/m2m-api)
## Supported Platform

* Raspberry Pi Models: B+, 2, 3, Zero & Zero W, Compute Module 3, 3B+, 3A+, 4B (generally all 40-pin models)
* Linux
* Windows
* Mac

## Node.js version requirement

* Node.js versions: 10.x, 11.x, 12.x, 14.x, 16.x. Ideally the latest LTS version.

## Installation
```js
$ npm install m2m
```

![]()
###  Raspberry Pi peripheral access (GPIO, I2C, SPI and PWM). <a name="rpi-peripheral-access"></a>
For projects requiring raspberry pi peripheral access such as GPIO, I2C, SPI and PWM, you will need to install *array-gpio* module.
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

Using a *push-method*, the client will watch the value of the random numbers. The remote device will check the random value every 5 seconds. If the value changes, it will send or *push* the new value to the client.   

Before you start, [create an account](https://www.node-m2m.com/m2m/account/create) and register your remote device. You also need a [node.js](https://nodejs.org/en/) installation on your client and device computers.

#### Remote Device Setup

##### 1. Create a device project directory and install m2m inside the directory.

```js
$ npm install m2m
```

##### 2. Save the code below as device.js within your device project directory.

```js
const m2m = require('m2m');

// create a device object with a device id of 100
// this id must must be registered with node-m2m
let device = new m2m.Device(100);

device.connect((result) => {
  console.log('result', result);

  // set a channel data resourse named 'random-number'  
  device.setData('random-number', (data) => {
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

However, after a grace period of 15 minutes, you need to provide your *security code* to restart your application.

Also at anytime, you can re-authenticate with an *-r* flag with full credentials if you're having difficulty or issues restarting your application as shown below.
```js
$ node device.js -r
```

#### Remote Client Setup

##### 1. Create a client project directory and install m2m inside the directory.

```js
$ npm install m2m
```

##### 2. Save the code below as client.js within your client project directory.

**Method 1**

To access resources from your remote device, create an *alias* object using the client's *accessDevice* method as shown in the code below. The object created `device` becomes an *alias* of the remote device you are trying to access as indicated by its device id argument. In this case, the device id is `100`.

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect((result) => {
  console.log('result', result);

  // access the remote device using an alias object
  let device = client.accessDevice(100);

  // capture 'random-number' data using a pull method
  device.getData('random-number', (data) => {
    console.log('random data', data); // 97
  });

  // capture 'random-number' data using a push method
  device.watch('random-number', (data) => {
    console.log('watch random data', data); // 81, 68, 115 ...
  });
});
```

**Method 2**

Instead of creating an alias, you can just provide the *device id* through the various methods from the client object to access channel data, GPIO object and HTTP API resources from your remote devices. 

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect((result) => {
  console.log('result', result);

  // capture 'random-number' data using a pull method
  client.getData(100, 'random-number', (data) => {
    console.log('random data', data); // 97
  });

  // capture 'random-number' data using a push method
  client.watch(100, 'random-number', (data) => {
    console.log('watch random data', data); // 81, 68, 115 ...
  });
});
```

##### 3. Start your application.
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

In this quick tour, we will install two push-button switches ( GPIO pin 11 and 13 ) on the remote client, and an led actuator ( GPIO pin 33 ) on the remote device.

The client will attempt to turn **on** and **off** the remote device's actuator and receive a confirmation response of *true* to signify the actuator was indeed turned **on** and *false* when the actuator is turned **off**.

The client will also show an on/off response times providing some insight on the responsiveness of the remote control system.     

#### Remote Device Setup

##### 1. Create a device project directory and install m2m and array-gpio inside the directory.
```js
$ npm install m2m array-gpio
```
##### 2. Save the code below as device.js in your device project directory.

```js
const { Device } = require('m2m');

let device = new Device(200);

device.connect((result) => {
  console.log('result', result);
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
const { setInput } = require('array-gpio');

let sw1 = setInput(11); // ON switch
let sw2 = setInput(13); // OFF switch

let client = new Client();

client.connect((result) => {
  console.log('result', result);

  let t1 = null;
  let device = client.accessDevice(200);

  sw1.watch(1, (state) => {
    if(state){
      t1 = new Date();
      console.log('turning ON remote actuator');
      device.output(33).on((data) => {
        let t2 = new Date();
        console.log('ON confirmation', data, 'response time', t2 - t1, 'ms');
      });
    }
  });

  sw2.watch(1, (state) => {
    if(state){
      t1 = new Date();
      console.log('turning OFF remote actuator');
      device.output(33).off((data) => {
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

##### 1. Create a device project directory and install m2m inside the directory.
```js
$ npm install m2m
```
##### 2. Save the code below as device.js in your device project directory.
```js
'use strict';

const net = require('net');
const { Device } = require('m2m');

const device = new Device(300);

device.connect((result) => {
  console.log('result', result);

  device.setData('ipc-channel', (data) => {

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

#### C/C++ Application Setup on Remote Device

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
#### Remote Client Setup

##### 1. Create a client project directory and install m2m.
```js
$ npm install m2m
```
##### 2. Save the code below as client.js in your client project directory.
```js
const { Client } = require('m2m');

let client = new Client();

client.connect((result) => {
  console.log('result', result);

  let device = client.accessDevice(300);

  // test payload
  let payload = {type:'random'};

  device.sendData('ipc-channel', payload, (data) => {
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
device.connect((result) => {
  console.log('result', result);

  device.setData('machine-status', function(data){

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

client.connect((result) => {
  console.log('result', result);

  client.accessDevice([100, 200, 300], function(devices){
    let t = 0;
    devices.forEach((device) => {
      t = t + 100;
      setTimeout(() => {
        // device watch interval is every 10 secs
        device.watch('machine-status', 10000, (data) => {
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

client.connect((result) => {
  ...
});
```

