Magnet Max JavaScript SDK
==============

Magnet Max is a comprehensive, mobile-first messaging solution with enterprise grade capabilities for next generation mobile apps.

Learn more about Magnet Message [here](https://developer.magnet.com/).

### Installation

The SDK is available as a javascript file. The latest version can be downloaded from
 [Download Magnet Max JavaScript SDK](https://cdn.magnet.com/downloads/magnet-max-sdk.min.js). Once downloaded, install it into
 your web application by placing it in your HTML file with a script tag reference to the file.

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Web App</title>
    <script type="text/javascript" src="js/magnet-max-sdk.min.js"></script>
</head>
<body></body>
</html>
```

The quickest way to learn how to use the SDK is to follow the examples provided in the three sample apps. Start with the Get Started (`/samples/web/getstarted`)
for a simple tutorial, then move onto Messenger (`/samples/web/messenger`), a cool real-time messaging app built with Magnet Message and the [Ionic Framework](http://ionicframework.com/).

### Run Get Started sample app

1. go to directory `/samples/web/getstarted`
2. open `index.html` and change the clientId and clientSecret in `/samples/web/messenger/www/app.js` with the keys from an app created in the [Magnet Sandbox](https://sandbox.magnet.com/)
```
Max.init({
    clientId: '<your client id>',
    clientSecret: '<your client secret>',
    baseUrl: 'https://sandbox.magnet.com/mobile/api'
});
```
3. open `index.html` in a web browser.
4. from the [Magnet Sandbox Get Started page](https://sandbox.magnet.com/message/v2/#/welcome), send and receive messages between the two pages.

### Run Messenger sample app

1. install [Ionic Framework](http://ionicframework.com/)
2. edit the clientId and clientSecret in `/samples/web/messenger/www/app.js` with the keys from an app created in the [Magnet Sandbox](https://sandbox.magnet.com/)
```
Max.init({
    clientId: '<your client id>',
    clientSecret: '<your client secret>',
    baseUrl: 'https://sandbox.magnet.com/mobile/api'
});
```
3. go to directory `/samples/web/messenger`
4. run `ionic serve`
5. open a browser and go to `http://localhost:8100`.
6. register two users on two different web browsers, login, and start sending messages!

### Building the SDK:

#### Requirements

* [node.js](https://nodejs.org/)
* [grunt](http://gruntjs.com/)

#### Commands

First, install dependencies by running `npm install`

* build the SDK: go to `/js-sdk` directory and run `grunt`
* build minified SDK: go to `/js-sdk` directory and run `grunt min`
* build the SDK and documentation: `grunt docs`
* build the SDK, minified SDK, and documentation: `grunt full`
* build the SDK and run tests: `grunt test`

### Notes:

This is a beta version. Please support our development by creating issues with any bugs or feature requests.