/* unit tests for validating message class */

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
        messageStub.callsArg(2);
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
        messageStub.callsArg(2);
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
    var testUserId = 'test-user-id';
    beforeEach(function() {
        Max.setUser({
            userId: testUserId
        });
        Max.setDevice({});
        Max.setConnection(null);
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setDevice(null);
        Max.setConnection(null);
        Max.MMXClient.connectionEmitter = null;
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
            expect(Max.getCurrentUser().jid).toContain(testUserId);
            expect(Max.getCurrentUser().userId).toEqual(testUserId);
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
            expect(e).toEqual('not authorized');
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
            userId: testUserId
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
                Max.setConnection(null);
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
        var connectStropheStub = sinon.stub(Strophe.Connection.prototype, 'connect');
        connectStropheStub.callsArgWith(2, 5);
        Max.MMXClient.registerDeviceAndConnect(testUserId, accessToken).success(function(user, device) {
            expect(user.userId).toEqual(testUserId);
            expect(device.deviceId).toEqual(testDeviceId);
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            Strophe.Connection.prototype.connect.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            Strophe.Connection.prototype.connect.restore();
            done();
        });
    });

    it('should disconnect a connected a client then connect successfully', function(done){
        var regDef = new Max.Deferred();
        var bindDisconnectStub = sinon.stub(Max.MMXClient, 'bindDisconnect');
        bindDisconnectStub.callsArg(0);
        var disconnectSpy = sinon.stub(Max.MMXClient, 'disconnect');
        var registerStub = sinon.stub(Max.Device, 'register', function() {
            setTimeout(function() {
                Max.setConnection({
                });
                Max.MMXClient.connectionEmitter = {};
                Max.Events.create(Max.MMXClient.connectionEmitter);

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
            expect(user.userId).toEqual(testUserId);
            expect(device.deviceId).toEqual(testDeviceId);
            expect(disconnectSpy.calledOnce).toEqual(true);
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            Max.MMXClient.bindDisconnect.restore();
            Max.MMXClient.disconnect.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Device.register.restore();
            Max.MMXClient.connect.restore();
            Max.MMXClient.bindDisconnect.restore();
            Max.MMXClient.disconnect.restore();
            done();
        });
    });

});

describe('MMXClient connectionHandler', function() {

    it('should fire connection error callback', function (done) {
        Max.MMXClient.connectionHandler(0, function(status) {
            expect(status).toEqual('connection error');
            done();
        });
    });

    it('should fire connection failed callback', function (done) {
        Max.MMXClient.connectionHandler(2, function(status) {
            expect(status).toEqual('connection failed');
            done();
        });
    });

    it('should fire not authorized callback', function (done) {
        Max.MMXClient.connectionHandler(4, function(status) {
            expect(status).toEqual('not authorized');
            done();
        });
    });

    it('should fire connection error callback', function (done) {
        Max.MMXClient.connectionHandler(5, function(status) {
            expect(status).toBeUndefined();
            done();
        });
    });

});

describe('MMXClient bindDisconnect', function() {

    it('should fire connection error callback', function (done) {
        var logoutStub = sinon.stub(Max.User, 'logout');
        Max.MMXClient.connectionEmitter = {};
        Max.Events.create(Max.MMXClient.connectionEmitter);
        Max.MMXClient.bindDisconnect(function() {
            expect(Max.MMXClient.connectionEmitter).toEqual(null);
            expect(logoutStub.calledOnce).toEqual(true);
            Max.User.logout.restore();
            done();
        });
        Max.MMXClient.connectionEmitter.invoke(6);
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

describe('Message', function() {

    it('should instantiate a new Message object', function (done) {
        var testUserId = 'test-user-id-1';
        var messageContent = 'test-message';
        Max.setUser({
            userId: testUserId
        });
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }, {
            userName: 'userName2',
            userId: 'test-user-id-2'
        }];
        var msg = new Max.Message(content, recipients);
        expect(msg.recipients.length).toEqual(2);
        expect(msg.recipients[0].userId).toEqual(testUserId);
        expect(msg.messageContent.my).toEqual(messageContent);
        done();
    });

    it('should instantiate a new Message object with single recipient', function (done) {
        var testUserId = 'test-user-id-1';
        var messageContent = 'test-message';
        Max.setUser({
            userId: testUserId
        });
        var content = {
            my: messageContent
        };
        var recipient = {
            userName: 'userName1',
            userId: testUserId
        };
        var msg = new Max.Message(content, recipient);
        expect(msg.recipients.length).toEqual(1);
        expect(msg.recipients[0].userId).toEqual(testUserId);
        expect(msg.messageContent.my).toEqual(messageContent);
        done();
    });

});

describe('Message formatMessage', function() {

    it('should parse an incoming message', function (done) {
        Max.App.hatCredentials = {
            access_token: 'test-access-token'
        };
        var fromUid = '402881295313de0d015315c820bc0004';
        var attachmentMeta = {
            _attachments: [{"mimeType":"text/plain","senderId":"test-id","attachmentId":"test-attachment-id"}]
        };
        var channelName = '1456521126999';
        var channelOwnerUid = '402881295313de0d015315c820bc0004';
        var msgText = {
            "event": {
                "items": {
                    "item": {
                        "mmx": {
                            "mmxmeta": "{\"From\":{\"userId\":\""+fromUid+"\",\"devId\":\"js-680a5326-ffbb-42e5-82a1-b81122fbfb8a\",\"displayName\":\"web@magnet.com\"}}",
                            "meta": JSON.stringify(attachmentMeta),
                            "payload": {
                                "_mtype": "unknown",
                                "_stamp": "2016-03-02T04:54:50Z",
                                "_chunk": "0/0/0"
                            },
                            "_xmlns": "com.magnet:msg:payload"
                        },
                        "_id": "3b22786f64a241d3c322fdc24bda98db"
                    },
                    "_node": "/gmbil1ewswo/" + channelOwnerUid + "/" + channelName
                },
                "_xmlns": "http://jabber.org/protocol/pubsub#event"
            },
            "headers": {
                "header": {
                    "_name": "SubID",
                    "__text": "1NMwX0i5PB46C5rMdJ7SmHgR5KeQiN0ycJnu4cHC"
                },
                "_xmlns": "http://jabber.org/protocol/shim"
            },
            "_xmlns": "jabber:client",
            "_from": "pubsub.mmx",
            "_to": "402881295313de0d015315c820bc0004%gmbil1ewswo@mmx",
            "_id": "/gmbil1ewswo/402881295313de0d015315c820bc0004/1456521126999__402881295313de0d015315c820bc0004%gmbil1ewswo@mmx__53yFQ"
        };
        var getChannelStub = sinon.stub(Max.Channel, 'getChannel', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve(new Max.Channel({
                    "isCollection": false,
                    "description": "",
                    "isPersistent": true,
                    "maxItems": -1,
                    "maxPayloadSize": 2097152,
                    "creationDate": "2016-02-26T21:27:23.014Z",
                    "modificationDate": "2016-02-26T21:27:23.015Z",
                    "publisherType": "subscribers",
                    "creator": channelOwnerUid,
                    "subscriptionEnabled": true,
                    "topicName": channelName,
                    "privateChannel": true
                }));
            }, 0);
            return d.promise;
        });
        var msg = new Max.Message();
        msg.formatMessage(msgText, null, function() {
            expect(msg.receivedMessage).toEqual(true);
            expect(msg.sender.userId).toEqual(fromUid);
            expect(msg.attachments).not.toBeUndefined();
            expect(msg.channel).not.toBeUndefined();
            expect(msg.channel.name).toEqual(channelName);
            expect(msg.channel.userId).toEqual(channelOwnerUid);
            expect(msg.channel.isPublic).toEqual(false);
            Max.Channel.getChannel.restore();
            done();
        });
    });

});


describe('Message send', function() {

    var testUserId = 'test-user-id-1';
    var testDeviceId = 'test-device-id-1';
    var messageContent = 'test-message';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
        });
        Max.setDevice({
            deviceId: testDeviceId
        });
        Max.setConnection(null);
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should send a message', function (done) {
        Max.setUser({
            userId: testUserId
        });
        var sendSpy = sinon.spy();
        var connStub = {
            addHandler: function(cb) {
                var xml = document.implementation.createDocument(null, 'message');
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }];
        var msg = new Max.Message(content, recipients);
        msg.send().success(function(msgId) {
            expect(msg.msgId).toEqual(msgId);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should fail with no recipients', function (done) {
        var content = {
            my: messageContent
        };
        var msg = new Max.Message(content, []);
        msg.send().success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('no recipients');
            done();
        });
    });

    it('should fail if not logged in', function (done) {
        var content = {
            my: messageContent
        };
        Max.setUser(null);
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }];
        var msg = new Max.Message(content, recipients);
        msg.send().success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('session expired');
            done();
        });
    });

    it('should fail if there is no connection', function (done) {
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }];
        Max.setConnection({
            connected: false
        });
        var msg = new Max.Message(content, recipients);
        msg.send().success(function(res) {
            expect(res).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('not connected');
            done();
        });
    });

});
