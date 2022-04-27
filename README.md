# M2M Quick Tour
   1. [Client-Server](#client-server)
   2. [Using a Browser Client](#browser-client)
   3. [Raspberry Pi Remote Control](#raspberry-pi-remote-control)
   4. [Monitor Data from Remote C/C++ Application through IPC (inter-process communication)](https://github.com/EdAlegrid/cpp-ipc-application-demo)
   5. [Integration with http web application](https://github.com/EdAlegrid/m2m-web-application-demo)
   5. [Http web application using only a browser client](https://github.com/EdAlegrid/m2m-browser-client-demo)
   6. [Monitor Data from Remote C# Application through IPC (inter-process communication)](https://github.com/EdAlegrid/csharp-ipc-application-demo)

<br>

[API Reference](https://github.com/EdAlegrid/m2m-api)

---
### 1. Client-Server
[](quicktour.svg)
![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour.svg?sanitize=true)

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

If you are accessing only one remote device from your client application, you can use this api. Create an *alias* object using the client's *accessDevice* method as shown in the code below.

```js
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
  device.watchData('random-number', (data) => {
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
```

**Method 2**

If you are accessing multiple remote devices from your client application, you can use this api. Instead of creating an alias, you can just provide the *device id* through the various data access methods from the client object.

```js
const m2m = require('m2m');

let client = new m2m.Client();

client.connect(() => {

  // capture 'random-number' data using a pull method
  client.getData({id:100, channel:'random-number'}, (data) => {
    console.log('getData random-number', data); // 97
  });

  // capture 'random-number' data using a push method
  client.watchData({id:100, channel:'random-number'}, (data) => {
    console.log('watch random-number', data); // 81, 68, 115 ...
  });

  // update test-data
  client.sendData({id:100, channel:'test-data', payload:'node-m2m is awesome'}, (data) => {
    console.log('sendData test-data', data);
  });

  // capture updated test-data
  client.getData({id:100, channel:'test-data'}, (data) => {
    console.log('getData test-data', data); // node-m2m is awesome
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
getData random-number 25
watch random-number 76
sendData test-data node-m2m is awesome
getData test-data node-m2m is awesome

```

### 2. Browser Client

Using the same device setup from client-server quicktour, we will access the channel data resources using a client from the browser.
#### Browser Client Setup

##### 1. Login to [node-m2m](https://www.node-m2m.com/m2m/account/login) to create an access token. From the manage security section, generate an access token.

##### 2. Install m2m.

Copy the minimized file `node-m2m.min.js` from `node_modules/m2m/dist` directory to your server's public javascript directory.

Include `node-m2m.min.js` on your HTML file `<script src="YOUR_SCRIPT_PATH/node-m2m.min.js"></script>`.
This will create a global **NodeM2M** object.

##### 3. Create a client object instance from the global NodeM2M object.
You can now access the resources from your remote devices from the various available methods from the client instance as shown below.

```js
<script> 

// Protect your access token at all times  
var tkn = 'fce454138116159a6ad9a4234e71de810a1087fa9e7fbfda74503d9f52616fc5';
 
var client = new NodeM2M.Client(); 

client.connect(tkn, () => {

  // capture 'random-number' data using a pull method
  client.getData({id:100, channel:'random-number'}, (data) => {
    console.log('getData random-number', data); // 97
  });

  // capture 'random-number' data using a push method
  client.watchData({id:100, channel:'random-number'}, (data) => {
    console.log('watch random-number', data); // 81, 68, 115 ...
  });

  // update test-data
  client.sendData({id:100, channel:'test-data', payload:'node-m2m is awesome'}, (data) => {
    console.log('sendData test-data', data);
  });

  // capture updated test-data
  client.getData({id:100, channel:'test-data'}, (data) => {
    console.log('getData test-data', data); // node-m2m is awesome
  });

});

</script>
```

Using your browser dev tools, you should get similar results as shown below. 
```js
getData random-number 25
watch random-number 76
sendData test-data node-m2m is awesome
getData test-data node-m2m is awesome
```
<br>

Check the [m2m browser client web application quick tour](https://github.com/EdAlegrid/m2m-browser-client-demo) for a complete web application using a browser client.

<br>

### 3. Raspberry Pi Remote Control
![](https://raw.githubusercontent.com/EdoLabs/src2/master/quicktour2.svg?sanitize=true)
[](quicktour.svg)

In this quick tour, we will install two push-button switches ( GPIO pin 11 and 13 ) on the remote client, and an led actuator ( GPIO pin 33 ) on the remote device.

The client will attempt to turn *on* and *off* the remote device's actuator and receive a confirmation response of *true* to signify the actuator was indeed turned **on** and *false* when the actuator is turned **off**.

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

device.connect(() => {
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

client.connect(() => {

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

