/* unit tests for validating Device class */

var Max = Max || require('../../target/magnet-sdk');

describe('Device getCurrentDevice', function() {

    it('should return currently registered device', function(done){
        var deviceId = "js-5debf7f5-0501-4c61-d721-4235813fffdf";
        var label = "Chrome 48.0.2564.97 (48) ";
        Max.setDevice({
            "clientId": "40a0501e-7205-4917-bc79-5b201a172052",
            "deviceId": deviceId,
            "deviceStatus": "ACTIVE",
            "deviceToken": null,
            "label": label,
            "os": "ANDROID",
            "osVersion": null,
            "pushAuthority": null,
            "tags": null,
            "userId": "ff8080815315854a015316e6955d0013"
        });
        var device = Max.Device.getCurrentDevice();
        expect(device.deviceId).toEqual(deviceId);
        expect(device.label).toEqual(label);
        done();
    });

});

describe('Device register', function() {

    var xhr, requests;

	beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.initialized = true;
	});

	afterEach(function() {
        xhr.restore();
	});

    it('should register a device', function(done) {
        var deviceId = "js-5debf7f5-0501-4c61-d721-4235813fffdf";
        var label = "Chrome 48.0.2564.97 (48) ";
        Max.setDevice({
            "clientId": "40a0501e-7205-4917-bc79-5b201a172052",
            "deviceId": deviceId,
            "deviceStatus": "ACTIVE",
            "deviceToken": null,
            "label": label,
            "os": "ANDROID",
            "osVersion": null,
            "pushAuthority": null,
            "tags": null,
            "userId": "ff8080815315854a015316e6955d0013"
        });
        Max.Device.register().success(function(meta) {
            expect(meta.deviceId).toEqual(deviceId);
            expect(meta.label).toEqual(label);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify({
            "clientId": "40a0501e-7205-4917-bc79-5b201a172052",
            "deviceId": deviceId,
            "deviceStatus": "ACTIVE",
            "deviceToken": null,
            "label": label,
            "os": "ANDROID",
            "osVersion": null,
            "pushAuthority": null,
            "tags": null,
            "userId": "ff8080815315854a015316e6955d0013"
        }));
        }, 5);
    });

});

describe('Device collectDeviceInfo', function() {

    it('should obtain device information', function(done) {
        var deviceId = 'test-device-id';
        Max.Cookie.create('magnet-max-device-id', deviceId, 1);
        Max.Device.collectDeviceInfo(function(e, deviceInfo) {
            expect(deviceInfo.deviceId).toEqual(deviceId);
            expect(deviceInfo.label).toEqual('Safari 538.1 (538) ');
            expect(deviceInfo.osVersion).toEqual('Mac OS X');
            done();
        });
    });

    it('should create device id if not exist', function(done) {
        var deviceId = 'test-device-id';
        Max.Cookie.remove('magnet-max-device-id');
        Max.Device.collectDeviceInfo(function(e, deviceInfo) {
            expect(deviceInfo.deviceId).not.toEqual(deviceId);
            expect(deviceInfo.label).toEqual('Safari 538.1 (538) ');
            expect(deviceInfo.osVersion).toEqual('Mac OS X');
            done();
        });
    });

});

describe('Device checkInWithDevice', function() {
    var xhr, requests;
    var testDeviceId = "test-device-id-checkInWithDevice";

	beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = null;
        Max.App.initialized = false;
        Max.setUser(null);
	});

	afterEach(function() {
        xhr.restore();
        Max.Device.collectDeviceInfo.restore();
        Max.App.initialized = true;
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
	});

    it('should check-in a device', function(done) {
        var deviceId = 'test-device-id';
        var catToken = "rtFOCj89_Zu4qccwUReg3FEsvDYMAJaxjgeJMvFdQJ-v1PnKPp3yK3RE19cBYY9JCy" +
                    "tV-y1cFfhNuJdMSfarFrztNwb5in1SjMkqaGD9Lq_WH7S5rd2JNmVubgHdRzYoQK-1XwXM9gqt1Ho1dz2ISd" +
                    "M0Skf_0nKXrTLei6bknyjQU1QKnKKFwdrlAFva4sY7LxT10TkaonVKPC_Ea-2bcHP0T0PaYbfKUzBl-G-G0D3j" +
                    "qOGCmKy5wK2yW5PZQ0Gm7i-0Tuv4geiNNZgdlPS24auDeysZ-ZSdZBH2ia_LCxk";
        var baseUrl = "http://localhost:7777/api/test";
        var mmxHost = "192.168.58.1";
        Max.Cookie.remove('magnet-max-auth-token');
        Max.Cookie.create('magnet-max-device-id', deviceId, 1);
        var collectDeviceInfo = sinon.stub(Max.Device, 'collectDeviceInfo');
        collectDeviceInfo.callsArgWith(0, null, {
            "deviceId": testDeviceId,
            "deviceStatus": "ACTIVE",
            "label": "Safari 538.1 (538) ",
            "os": "ANDROID",
            "osVersion": "Mac OS X"
        });
        var requestStub = sinon.stub(Max, 'Request', function(res, cb) {
            cb({
                "applicationToken": {
                    "mmx_app_id": "j8cil1dmjt8",
                    "scope": "ANONYMOUS",
                    "token_type": "APPLICATION",
                    "expires_in": "10368000",
                    "access_token": catToken
                },
                "config": {
                    "mms-application-endpoint": baseUrl,
                    "mmx-host": mmxHost,
                    "mmx-port": "5222",
                    "security-policy": "RELAXED",
                    "tls-enabled": "false",
                    "mmx-domain": "mmx"
                },
                "device": {
                    "clientId": "40a0501e-7205-4917-bc79-5b201a172052",
                    "deviceId": testDeviceId,
                    "deviceStatus": "ACTIVE",
                    "label": "Safari 538.1 (538) ",
                    "os": "ANDROID",
                    "osVersion": "Mac OS X",
                    "deviceToken": null,
                    "pushAuthority": null,
                    "tags": null
                }
            });
        });
        Max.Device.checkInWithDevice(function() {
            expect(Max.App.catCredentials.access_token).toEqual(catToken);
            expect(Max.Config.baseUrl).toEqual(baseUrl);
            expect(Max.Config.mmxHost).toEqual(mmxHost);
            expect(Max.Device.getCurrentDevice().deviceId).toEqual(testDeviceId);
            expect(Max.App.hatCredentials).toEqual(null);
            Max.Request.restore();
            done();
        });
    });

    xit('should check-in a device and create session', function(done) {
        var deviceId = 'test-device-id';
        Max.Cookie.create('magnet-max-device-id', deviceId, 1);
        var collectDeviceInfo = sinon.stub(Max.Device, 'collectDeviceInfo');
        collectDeviceInfo.callsArgWith(0, null, {
            "deviceId": testDeviceId,
            "deviceStatus": "ACTIVE",
            "label": "Safari 538.1 (538) ",
            "os": "ANDROID",
            "osVersion": "Mac OS X"
        });
        var searchClient = sinon.stub(Max.User, 'search');
        var searchDef = new Max.Deferred();
        searchClient.returns(searchDef.promise);
        var regClient = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect');
        var regDef = new Max.Deferred();
        regClient.returns(regDef.promise);
        Max.Device.checkInWithDevice();
        var catToken = "rtFOCj89_Zu4qccwUReg3FEsvDYMAJaxjgeJMvFdQJ-v1PnKPp3yK3RE19cBYY9JCy" +
                    "tV-y1cFfhNuJdMSfarFrztNwb5in1SjMkqaGD9Lq_WH7S5rd2JNmVubgHdRzYoQK-1XwXM9gqt1Ho1dz2ISd" +
                    "M0Skf_0nKXrTLei6bknyjQU1QKnKKFwdrlAFva4sY7LxT10TkaonVKPC_Ea-2bcHP0T0PaYbfKUzBl-G-G0D3j" +
                    "qOGCmKy5wK2yW5PZQ0Gm7i-0Tuv4geiNNZgdlPS24auDeysZ-ZSdZBH2ia_LCxk";
        var baseUrl = "http://localhost:7777/api/test";
        var mmxHost = "192.168.58.1";
        var authToken = 'test-auth-token';
        Max.Cookie.create('magnet-max-auth-token', authToken, 1);
        var requestStub = sinon.stub(Max, 'Request', function(res, cb) {
            cb({
                "applicationToken": {
                    "mmx_app_id": "j8cil1dmjt8",
                    "scope": "ANONYMOUS",
                    "token_type": "APPLICATION",
                    "expires_in": "10368000",
                    "access_token": catToken
                },
                "config": {
                    "mms-application-endpoint": baseUrl,
                    "mmx-host": mmxHost,
                    "mmx-port": "5222",
                    "security-policy": "RELAXED",
                    "tls-enabled": "false",
                    "mmx-domain": "mmx"
                },
                "device": {
                    "clientId": "40a0501e-7205-4917-bc79-5b201a172052",
                    "deviceId": testDeviceId,
                    "deviceStatus": "ACTIVE",
                    "label": "Safari 538.1 (538) ",
                    "os": "ANDROID",
                    "osVersion": "Mac OS X",
                    "deviceToken": null,
                    "pushAuthority": null,
                    "tags": null,
                    "userId": "ff8080815315854a015316e6955d0013"
                }
            });
        });
        expect(Max.App.catCredentials.access_token).toEqual(catToken);
        expect(Max.Config.baseUrl).toEqual(baseUrl);
        expect(Max.Config.mmxHost).toEqual(mmxHost);
        expect(Max.Device.getCurrentDevice().deviceId).toEqual(testDeviceId);
        expect(Max.App.hatCredentials.access_token).toEqual(authToken);
        expect(Max.App.initialized).toEqual(false);
        searchDef.resolve([{
            "userIdentifier": "40288192510694f6015106960150000a",
            "clientId": "a7a9e901-abc5-4485-af1c-0b088b34f44d",
            "firstName": "Jack",
            "lastName": "Doe",
            "email": "jack.doe@magnet.com",
            "userName": "jack.doe",
            "password": "n/a",
            "userRealm": "DB",
            "roles": [
                "USER"
            ],
            "otpCode": "n/a",
            "userAccountData": {}
        }]);
        setTimeout(function() {
            expect(Max.App.initialized).toEqual(false);
            expect(Max.getCurrentUser().userName).toEqual('jack.doe');
            expect(Max.getCurrentUser().userId).toEqual('40288192510694f6015106960150000a');
            regDef.resolve('ok');
            setTimeout(function() {
                expect(Max.App.initialized).toEqual(true);
                Max.MMXClient.registerDeviceAndConnect.restore();
                Max.User.search.restore();
                done();
            }, 5);
        }, 5);
    });

});