# m2m

[![Version npm](https://img.shields.io/npm/v/m2m.svg?logo=npm)](https://www.npmjs.com/package/m2m)
![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.node-m2m.com%2Fm2m%2Fbuild-badge%2F2021)

m2m is a lightweight real-time communication library for developing client-server or pub-sub applications using the machine-to-machine framework [node-m2m](https://www.node-m2m.com).

Your application will be composed of two or more independent service modules running on their own processes similar to microservices pattern. 

Deploy private device servers on the fly from anywhere without the usual heavy infrastructure involved in provisioning an on-premise physical servers. 

Your device servers will be instantly available and accessible through its user-assigned *device id* from your client applications from anywhere.

Create *Channel*, *HTTP* and *GPIO* ( for Raspberry Pi devices ) resources and services on your remote devices for client consumption.

Access to clients and devices is restricted to authenticated and authorized users only. All communications traffic between clients and devices are fully encrypted using TLS.

To use this library, users will need to <a href="https://www.node-m2m.com/m2m/account/create" target="_blank">register</a> with node-m2m.

Start your first m2m application from the [quick tour](https://github.com/EdAlegrid/m2m-quicktour) guide.

[](https://raw.githubusercontent.com/EdoLabs/src/master/m2mSystem2.svg?sanitize=true)

# Table of contents
1. [Supported Platform](#supported-platform)
2. [Node.js version requirement](#nodejs-version-requirement)
3. [Installation](#installation)
4. [Quick Tour](https://github.com/Node-M2M/M2M-Quicktour)
5. [API](https://github.com/Node-M2M/M2M-API)
<!--6. [Capturing and Watching Data](#capturing-and-watching-data)
   7. [Raspberry Pi Remote Control](#raspberry-pi-remote-control)
   8. [Capturing Data from Remote C/C++ Application through IPC (inter-process communication)](https://github.com/EdAlegrid/m2m-ipc-application-demo)
   9. [m2m integration with http web application](https://github.com/EdAlegrid/m2m-web-application-demo)
   10. [m2m integration with websocket  application](https://github.com/EdAlegrid/m2m-websocket-application-demo)-->
<!--11. [Using the Browser Interface](#using-the-browser-interface)
   * [Enable Application Code Editing](#remote-application-code-editing)
   * [Enable Application Auto Restart](#application-auto-restart) 
   * [Automatic Configuration for Code Editing and Auto Restart](#code-edit-and-auto-restart-automatic-configuration)
   * [Naming your Client Application for Tracking Purposes](#naming-your-client-application-for-tracking-purposes) -->

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
###  Raspberry Pi peripheral access (GPIO, I2C, SPI and PWM). <a name="rpi-peripheral-access"></a>
For projects requiring raspberry pi peripheral access such as GPIO, I2C, SPI and PWM, you will need to install *array-gpio* module.
```js
$ npm install array-gpio
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

client.connect(() => {
  ...
});
```
