/* unit tests for validating messaging features */

var Max = Max || require('../../target/magnet-sdk');

describe('start', function() {

    afterEach(function() {
        Max.setConnection(null);
    });

    it('should start receiving messages', function(done){
        Max.setConnection({});
        Max.start();
        expect(Max.App.receiving).toEqual(true);
        expect(Max.getConnection().priority).toEqual(0);
        done();
    });

    it('should stop receiving messages', function(done){
        Max.setConnection({});
        Max.stop();
        expect(Max.App.receiving).toEqual(false);
        expect(Max.getConnection().priority).toEqual(-255);
        done();
    });

});

describe('registerListener', function() {
    var xml;
    beforeEach(function() {
        xml = "<message></message>";
    });

    it('should register a listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            }
        });
        var messageStub = sinon.stub(Max.Message.prototype, 'formatMessage');
        messageStub.callsArg(1);
        var testHandlerId = 'testHandler';
        var listener = new Max.MessageListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.prototype.formatMessage.restore();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.handler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });
});

describe('unregisterListener', function() {
    var xml;
    beforeEach(function() {
        xml = "<message></message>";
    });
    afterEach(function() {
        Max.setConnection(null);
    });

    it('should unregister a listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            },
            deleteHandler: function() {

            }
        });
        var messageStub = sinon.stub(Max.Message.prototype, 'formatMessage');
        messageStub.callsArg(1);
        var testHandlerId = 'testHandler';
        var listener = new Max.MessageListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.prototype.formatMessage.restore();
            Max.unregisterListener(testHandlerId);
            expect(Max.getStore()[listener.id]).toBeUndefined();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.handler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });
});

describe('MMXClient connect', function() {

    beforeEach(function() {
        Max.setUser({});
        Max.setDevice({});
        Max.setConnection(null);
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setDevice(null);
        Max.setConnection(null);
    });

    it('should connect a client successfully', function(done){
        var connectStub = sinon.stub(Strophe.Connection.prototype, 'connect');
        connectStub.callsArgWith(2, 5);
        var sendStub = sinon.stub(Strophe.Connection.prototype, 'send', function(pres) {
            expect(pres+'').toEqual("<presence xmlns='jabber:client'/>");
        });
        var userId = 'test-user-id';
        var accessToken = 'test-access-token';
        Max.on('authenticated', function(status) {
            expect(status).toEqual('ok');
        });
        Max.MMXClient.connect(userId, accessToken).success(function() {
            expect(Max.getCurrentUser().connected).toEqual(true);
            expect(sendStub.calledOnce).toEqual(true);
            Strophe.Connection.prototype.connect.restore();
            Strophe.Connection.prototype.send.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Strophe.Connection.prototype.connect.restore();
            Strophe.Connection.prototype.send.restore();
            done();
        });
    });

    it('should fail connecting a client', function(done){
        var connectStub = sinon.stub(Strophe.Connection.prototype, 'connect');
        connectStub.callsArgWith(2, 4);
        var sendSpy = sinon.spy(Strophe.Connection.prototype, 'send');
        var userId = 'test-user-id';
        var accessToken = 'test-access-token';
        Max.MMXClient.connect(userId, accessToken).success(function(res) {
            expect(res).toEqual('failed-test');
            Strophe.Connection.prototype.connect.restore();
            Strophe.Connection.prototype.send.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('not-authorized');
            expect(Max.getCurrentUser().connected).toBeFalsy();
            expect(sendSpy.calledOnce).toEqual(false);
            Strophe.Connection.prototype.connect.restore();
            Strophe.Connection.prototype.send.restore();
            done();
        });
    });

    it('should disconnect a client', function(done){
        var connectStub = sinon.stub(Strophe.Connection.prototype, 'connect');
        connectStub.callsArgWith(2, 6);
        var sendStub = sinon.stub(Strophe.Connection.prototype, 'send');
        var logoutStub = sinon.stub(Max.User, 'logout');
        var userId = 'test-user-id';
        var accessToken = 'test-access-token';
        Max.MMXClient.connect(userId, accessToken);
        expect(Max.getCurrentUser().connected).toBeFalsy();
        Strophe.Connection.prototype.connect.restore();
        Strophe.Connection.prototype.send.restore();
        Max.User.logout.restore();
        done();
    });

});

describe('MMXClient registerDeviceAndConnect', function() {
    var testUserId = 'test-user-id';
    var testDeviceId = 'test-device-id';
    var accessToken = 'test-access-token';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setDevice({
            deviceId: testDeviceId
        });
        Max.setConnection(null);
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setDevice(null);
        Max.setConnection(null);
    });

    it('should connect a client successfully', function(done){
        var regDef = new Max.Deferred();
        var registerStub = sinon.stub(Max.Device, 'register', function() {
            setTimeout(function() {
                regDef.resolve();
            }, 5);
            return regDef.promise;
        });
        var connectDef = new Max.Deferred();
        var connectStub = sinon.stub(Max.MMXClient, 'connect', function() {
            setTimeout(function() {
                connectDef.resolve();
            }, 5);
            return connectDef.promise;
        });
        Max.MMXClient.registerDeviceAndConnect(testUserId, accessToken).success(function(user, device) {
            expect(user.userIdentifier).toEqual(testUserId);
            expect(device.deviceId).toEqual(testDeviceId);
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            done();
        });
    });

});

describe('MMXClient getBaredJid', function() {

    it('should return a bared Jid', function (done) {
        Max.App.appId = 'test-app-id';
        Max.Config.mmxDomain = 'mmx';
        var uid = 'test-user-id';
        expect(Max.MMXClient.getBaredJid(uid)).toEqual('test-user-id%test-app-id@mmx');
        done();
    });

});

xdescribe('Message', function() {

    it('should instantiate a new Message object', function (done) {
        var recipients = [''];
        Max.Config.mmxDomain = 'mmx';
        var uid = 'test-user-id';
        expect(Max.MMXClient.getBaredJid(uid)).toEqual('test-user-id%test-app-id@mmx');
        done();
    });

});