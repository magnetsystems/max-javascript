/* unit tests for validating User class */

var Max = Max || require('../../target/magnet-sdk');

describe('User', function() {

    it('should instantiate a new User', function(done) {
        var userObj = {
            userName: 'jack.doe',
            firstName: 'Jack',
            lastName: 'Doe',
            password: 'magnet',
            email: 'jack.doe@magnet.com'
        };
        var user = new Max.User(userObj);
        expect(user.userName).toEqual(userObj.userName);
        expect(user.firstName).toEqual(userObj.firstName);
        expect(user.lastName).toEqual(userObj.lastName);
        expect(user.password).toEqual(userObj.password);
        expect(user.email).toEqual(userObj.email);
        done();
    });

    it('should instantiate a new User given displayName', function(done) {
        var userObj = {
            displayName: 'jack doe',
            userId: 'jack.doe%mmx'
        };
        var user = new Max.User(userObj);
        expect(user.userName).toEqual('jack doe');
        expect(user.firstName).toEqual('jack');
        expect(user.lastName).toEqual('doe');
        done();
    });

});

describe('User register', function() {
    var xhr, requests;

	beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
	});

	afterEach(function() {
        xhr.restore();
	});

    it('should register a new user', function(done) {
        var userObj = {
            userName: 'jack.doe',
            firstName: 'Jack',
            lastName: 'Doe',
            password: 'magnet',
            email: 'jack.doe@magnet.com'
        };
        Max.User.register(userObj).success(function(user) {
            expect(user.userName).toEqual(userObj.userName);
            expect(user.firstName).toEqual(userObj.firstName);
            expect(user.email).toEqual(userObj.email);
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
                "challengePreferences": null,
                "clientId": "76b4e8f6-1066-49e0-a537-160d436ce78c",
                "email": userObj.email,
                "externalUserId": null,
                "firstName": userObj.firstName,
                "lastName": userObj.lastName,
                "otpCode": "n/a",
                "password": "n/a",
                "roles": [
                    "USER"
                ],
                "tags": null,
                "userAccountData": null,
                "userIdentifier": "4028ba81531e7be0015333f9440e0017",
                "userName": userObj.userName,
                "userRealm": "DB",
                "userStatus": "ACTIVE"
            }));
        }, 5);
    });

    it('should fail registration', function(done) {
        var err = 'existing user';
        var userObj = {
            userName: 'jack.doe',
            firstName: 'Jack',
            lastName: 'Doe',
            password: 'magnet',
            email: 'jack.doe@magnet.com'
        };
        Max.User.register(userObj).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual(err);
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(409, {
                'Content-Type': 'text/plain'
            }, err);
        }, 5);
    });

});

describe('User login', function() {
    var xhr, requests;

	beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
	});

	afterEach(function() {
        xhr.restore();
	});

    it('should login a new user', function(done) {
        var userObj = {
            userName: 'jack.doe',
            password: 'magnet'
        };
        var regClient = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect');
        var def = new Max.Deferred();
        regClient.returns(def.promise);
        Max.User.login(userObj).success(function(res) {
            expect(res).toEqual('ok');
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify({
                user: {
                    userName: 'jack.doe',
                    firstName: 'Jack',
                    lastName: 'Doe',
                    password: 'magnet',
                    email: 'jack.doe@magnet.com'
                }
            }));
            def.resolve('ok');
        }, 5);
    });

    it('should fail login given incorrect credentials', function(done) {
        var userObj = {
            userName: 'jack.doe',
            password: 'magnet2'
        };
        Max.User.login(userObj).success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('incorrect credentials');
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(401, {
                'Content-Type': 'text/plain'
            }, 'incorrect credentials');
        }, 5);
    });

});

describe('User loginWithRefreshToken', function() {
    var xhr, requests;

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
    });

    afterEach(function () {
        xhr.restore();
    });

    it('should login user with refresh token', function (done) {
        Max.Cookie.create('magnet-max-refresh-token', 'test-refresh-token', 1);
        var regClient = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect');
        var def = new Max.Deferred();
        regClient.returns(def.promise);
        Max.User.loginWithRefreshToken().success(function (res) {
            expect(res).toEqual('ok');
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify({
                "token_type": "USER",
                "expires_in": 7200,
                "access_token": "q2Q0MONci01arwnG1554SrktHnbOTS",
                "user": {
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
                }
            }));
            def.resolve('ok');
        }, 5);
    });

    it('should fail login', function (done) {
        Max.Cookie.create('magnet-max-refresh-token', 'test-refresh-token', 1);
        var regClient = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect');
        var def = new Max.Deferred();
        regClient.returns(def.promise);
        Max.User.loginWithRefreshToken().success(function (res) {
            expect(res).toEqual('failed-test');
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('incorrect credentials');
            expect(Max.Cookie.get('magnet-max-refresh-token')).toEqual(null);
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(401, {
                'Content-Type': 'text/plain'
            }, 'invalid token');
            def.reject('failed');
        }, 5);
    });

});

describe('User loginWithAccessToken', function() {
    beforeEach(function () {
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
    });

    it('should return error if token missing', function (done) {
        Max.Cookie.remove('magnet-max-auth-token');
        Max.User.loginWithAccessToken(function(e) {
            expect(e).toEqual('auth token missing');
            done();
        });
    });

    it('should return error if unable to get user info', function (done) {
        Max.Cookie.create('magnet-max-auth-token', 'test-token', 1);
        var err = 'connection failure';
        var getUserInfoStub = sinon.stub(Max.User, 'getUserInfo', function() {
            var d = new Max.Deferred();
            setTimeout(function(){d.reject(err) }, 0);
            return d.promise;
        });
        Max.User.loginWithAccessToken(function(e) {
            expect(e).toEqual(err);
            Max.User.getUserInfo.restore();
            done();
        });
    });

    it('should return error if unable to connect to mmx', function (done) {
        Max.Cookie.create('magnet-max-auth-token', 'test-token', 1);
        var err = 'auth failure';
        var getUserInfoStub = sinon.stub(Max.User, 'getUserInfo', function() {
            var d = new Max.Deferred();
            setTimeout(function(){d.resolve() }, 0);
            return d.promise;
        });
        var registerDeviceAndConnectStub = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect', function() {
            var d = new Max.Deferred();
            setTimeout(function(){d.reject(err) }, 0);
            return d.promise;
        });
        Max.User.loginWithAccessToken(function(e) {
            expect(e).toEqual(err);
            Max.User.getUserInfo.restore();
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        });
    });

    it('should return error if unable to connect to mmx', function (done) {
        Max.Cookie.create('magnet-max-auth-token', 'test-token', 1);
        var getUserInfoStub = sinon.stub(Max.User, 'getUserInfo', function() {
            var d = new Max.Deferred();
            setTimeout(function(){d.resolve() }, 0);
            return d.promise;
        });
        var registerDeviceAndConnectStub = sinon.stub(Max.MMXClient, 'registerDeviceAndConnect', function() {
            var d = new Max.Deferred();
            setTimeout(function(){d.resolve() }, 0);
            return d.promise;
        });
        Max.User.loginWithAccessToken(function(e) {
            expect(e).toBeUndefined();
            Max.User.getUserInfo.restore();
            Max.MMXClient.registerDeviceAndConnect.restore();
            done();
        });
    });

});

describe('User getUserInfo', function() {
    beforeEach(function () {
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
    });

    it('should login user with refresh token', function (done) {
        var userId = "40288192510694f6015106960150000a";
        var userName = "jack.doe";
        var clientId = "a7a9e901-abc5-4485-af1c-0b088b34f44d";
        var requestStub = sinon.stub(Max, 'Request', function(req, cb) {
            setTimeout(function() {
                cb({
                    "userIdentifier": userId,
                    "clientId": clientId,
                    "firstName": "Jack",
                    "lastName": "Doe",
                    "email": "jack.doe@magnet.com",
                    "userName": userName,
                    "password": "n/a",
                    "userRealm": "DB",
                    "roles": [
                        "USER"
                    ],
                    "otpCode": "n/a",
                    "userAccountData": {}
                });
            }, 0);
            return new Max.Deferred();
        });
        Max.User.getUserInfo().success(function (user) {
            expect(user.userId).toEqual(userId);
            expect(user.userName).toEqual(userName);
            expect(user.clientId).toEqual(clientId);
            Max.Request.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

});

describe('User getUsersByUserNames', function() {
    var xhr, requests;

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
    });

    afterEach(function () {
        xhr.restore();
    });

    it('should return a list of users', function(done) {
        Max.User.getUsersByUserNames(['jack.doe', 'jane.doe']).success(function (users) {
            expect(users.length).toEqual(2);
            var user1 = users[0];
            expect(user1.userName).toEqual('jack.doe');
            var user2 = users[1];
            expect(user2.userName).toEqual('jane.doe');
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify([{
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
                }, {
                    "userIdentifier": "4028819251069sf6015106960150000a",
                    "clientId": "a7a9e901-abc5-4485-af1c-0b088b34f44d",
                    "firstName": "Jane",
                    "lastName": "Doe",
                    "email": "jane.doe@magnet.com",
                    "userName": "jane.doe",
                    "password": "n/a",
                    "userRealm": "DB",
                    "roles": [
                        "USER"
                    ],
                    "otpCode": "n/a",
                    "userAccountData": {}
                }]));
        }, 5);
    });

});

describe('User search', function() {
    var xhr, requests;

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.Config.baseUrl = 'http://localhost:7777/api';
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
    });

    afterEach(function () {
        xhr.restore();
    });

    it('should return a list of users', function (done) {
        Max.User.search({
            limit: 7,
            offset: 1,
            orderby: {
                userId: 'desc'
            },
            query: {
                userName: '*'
            }
        }).success(function (users) {
            expect(users.length).toEqual(1);
            var user1 = users[0];
            expect(user1.userName).toEqual('jack.doe');
            expect(requests[0].url)
                .toEqual('http://localhost:7777/api/com.magnet.server/user/query' +
                '?take=7&skip=1&sort=userIdentifier:desc&q=userName:*');
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify([{
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
            }]));
        }, 5);
    });

});

describe('User getToken', function() {
    var xhr, requests;

    beforeEach(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
    });

    afterEach(function () {
        xhr.restore();
    });

    it('should return a list of users', function (done) {
        Max.User.getToken().success(function(meta) {
            expect(meta['mms-application-endpoint']).toEqual('http://192.168.58.1:8443/api');
            expect(meta['mmx-host']).toEqual('192.168.58.1');
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'application/json'
            }, JSON.stringify({
                "mms-application-endpoint": "http://192.168.58.1:8443/api",
                "mmx-host": "192.168.58.1",
                "mmx-port": "5222",
                "security-policy": "RELAXED",
                "tls-enabled": "false",
                "mmx-domain": "mmx"
            }));
        }, 5);
    });
});

describe('User logout', function() {
    var xhr, requests;
    var userName = 'test-user';
    var userId = 'test-id';

    beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
        Max.setUser({
            userName: userName,
            userId: userId
        });
    });

    afterEach(function() {
        xhr.restore();
        Max.setUser({
            userName: userName,
            userIdentifier: userId
        });
    });

    it('should succeed logout user and clear session data', function(done) {
        Max.Cookie.create('magnet-max-refresh-token', 'test-refresh-token', 1);
        Max.User.logout().success(function() {
            expect(Max.Cookie.get('magnet-max-refresh-token')).toEqual(null);
            expect(Max.getCurrentUser()).toEqual(null);
            expect(Max.App.hatCredentials).toEqual(null);
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(200, {
                'Content-Type': 'text/plain'
            }, 'ok');
        }, 5);
    });

    it('should fail logout user and clear session data', function(done) {
        Max.Cookie.create('magnet-max-refresh-token', 'test-refresh-token', 1);
        Max.User.logout().error(function() {
            expect(Max.Cookie.get('magnet-max-refresh-token')).toEqual(null);
            expect(Max.getCurrentUser()).toEqual(null);
            expect(Max.App.hatCredentials).toEqual(null);
            done();
        });
        setTimeout(function () {
            expect(requests.length).toEqual(1);
            requests[0].respond(400, {
                'Content-Type': 'text/plain'
            }, 'error');
        }, 5);
    });

});


describe('User clearSession', function() {
    var userName = 'test-user';
    var userId = 'test-id';

    beforeEach(function () {
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
        Max.setUser({
            userName: userName,
            userIdentifier: userId
        });
    });

    afterEach(function () {
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
        Max.setUser({
            userName: userName,
            userIdentifier: userId
        });
    });

    it('should succeed logout user and clear session data', function (done) {
        Max.Cookie.create('magnet-max-refresh-token', 'test-refresh-token', 1);
        Max.User.clearSession();
        expect(Max.Cookie.get('magnet-max-auth-token')).toEqual(null);
        expect(Max.getCurrentUser()).toEqual(null);
        expect(Max.App.hatCredentials).toEqual(null);
        done();
    });

});