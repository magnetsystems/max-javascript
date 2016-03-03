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

describe('Message', function() {

    it('should instantiate a new Message object', function (done) {
        var testUserId = 'test-user-id-1';
        var messageContent = 'test-message';
        Max.setUser({
            userIdentifier: testUserId
        });
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'username1',
            userIdentifier: testUserId
        }, {
            userName: 'username2',
            userIdentifier: 'test-user-id-2'
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
            userIdentifier: testUserId
        });
        var content = {
            my: messageContent
        };
        var recipient = {
            userName: 'username1',
            userIdentifier: testUserId
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
        var msg = new Max.Message();
        msg.formatMessage(msgText, function() {
            expect(msg.receivedMessage).toEqual(true);
            expect(msg.sender.userIdentifier).toEqual(fromUid);
            expect(msg.attachments).not.toBeUndefined();
            expect(msg.channel).not.toBeUndefined();
            expect(msg.channel.name).toEqual(channelName);
            expect(msg.channel.userId).toEqual(channelOwnerUid);
            expect(msg.channel.privateChannel).toEqual(true);
            done();
        });
    });

});


describe('Message send', function() {

    var testUserId = 'test-user-id-1';
    var messageContent = 'test-message';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection(null);
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should send a message', function (done) {
        Max.setUser({
            userIdentifier: testUserId
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
            userName: 'username1',
            userIdentifier: testUserId
        }];
        var msg = new Max.Message(content, recipients);
        msg.send().success(function(res) {
            expect(res).toEqual('ok');
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
            userName: 'username1',
            userIdentifier: testUserId
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
            userName: 'username1',
            userIdentifier: testUserId
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
