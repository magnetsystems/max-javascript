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
        xml = "<message><mmx><mmxmeta></mmxmeta></mmx></message>";
    });

    it('should register a MESSAGE listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            }
        });
        var testMsg = {
            recipients: [],
            meta: {}
        };
        var formatEventStub = sinon.stub(Max.Message, 'formatEvent', function(json, channel, cb) {
            cb(null, testMsg);
        });
        var testHandlerId = 'testHandler';
        var listener = new Max.EventListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.formatEvent.restore();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.messageHandler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });

    it('should register an INVITATION listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            }
        });
        var testMsg = {
            recipients: [],
            meta: {},
            mType: Max.MessageType.INVITATION
        };
        var formatEventStub = sinon.stub(Max.Message, 'formatEvent', function(json, channel, cb) {
            cb(null, testMsg);
        });
        var testHandlerId = 'testHandler';
        var listener = new Max.EventListener(testHandlerId, null, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.formatEvent.restore();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.invitationHandler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });

    it('should register an INVITATION_RESPONSE listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            }
        });
        var testMsg = {
            recipients: [],
            meta: {},
            mType: Max.MessageType.INVITATION_RESPONSE
        };
        var formatEventStub = sinon.stub(Max.Message, 'formatEvent', function(json, channel, cb) {
            cb(null, testMsg);
        });
        var testHandlerId = 'testHandler';
        var listener = new Max.EventListener(testHandlerId, null, null, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.formatEvent.restore();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.invitationResponseHandler).toEqual('function');
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
        var testMsg = {
            recipients: [],
            meta: {}
        };
        var formatEventStub = sinon.stub(Max.Message, 'formatEvent', function(json, channel, cb) {
            cb(null, testMsg);
        });
        var testHandlerId = 'testHandler';
        var listener = new Max.EventListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.formatEvent.restore();
            Max.unregisterListener(testHandlerId);
            expect(Max.getStore()[listener.id]).toBeUndefined();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.messageHandler).toEqual('function');
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

    it('should fire error callback', function (done) {
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

    it('should handle disconnection gracefully and logout', function (done) {
        var logoutStub = sinon.stub(Max.User, 'logout');
        Max.setUser({});
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

    it('should handle disconnection gracefully and dont logout if no user', function (done) {
        var logoutStub = sinon.stub(Max.User, 'logout');
        Max.setUser(null);
        Max.MMXClient.connectionEmitter = {};
        Max.Events.create(Max.MMXClient.connectionEmitter);
        Max.MMXClient.bindDisconnect(function() {
            expect(Max.MMXClient.connectionEmitter).toEqual(null);
            expect(logoutStub.calledOnce).toEqual(false);
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

describe('Message formatEvent', function() {

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
        Max.Message.formatEvent(msgText, null, function(e, msg) {
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

    it('should parse an incoming invitation', function (done) {
        Max.App.hatCredentials = {
            access_token: 'test-access-token'
        };
        var comment = 'hello dude';
        var fromUid = '402881295313de0d015315c820bc0004';
        var attachmentMeta = '{"text":"'+comment+'","channelSummary":" ","channelName":"myprivfirstuser","channelIsPublic":"false","channelOwnerId":"4028ba815381b6db01539b6d35760041","channelPublishPermissions":"subscribers","channelCreationDate":"2016-03-21T23:05:39.664Z"}';
        var channelName = '1456521126999';
        var channelOwnerUid = '402881295313de0d015315c820bc0004';
        var msgText = {
            "event": {
                "items": {
                    "item": {
                        "mmx": {
                            "mmxmeta": "{\"From\":{\"userId\":\"" + fromUid + "\",\"devId\":\"js-680a5326-ffbb-42e5-82a1-b81122fbfb8a\",\"displayName\":\"web@magnet.com\"}}",
                            "meta": attachmentMeta,
                            "payload": {
                                "_mtype": Max.MessageType.INVITATION,
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
        Max.Message.formatEvent(msgText, null, function(e, msg) {
            expect(msg.receivedMessage).toBeUndefined();
            expect(msg.sender.userId).toEqual(fromUid);
            expect(msg.attachments).toBeUndefined();
            expect(msg.comments).toEqual(comment);
            expect(msg.mType).toEqual(Max.MessageType.INVITATION);
            expect(msg.channel).not.toBeUndefined();
            expect(msg.channel.name).toEqual(channelName);
            expect(msg.channel.userId).toEqual(channelOwnerUid);
            expect(msg.channel.isPublic).toEqual(false);
            Max.Channel.getChannel.restore();
            done();
        });
    });

    it('should parse an incoming invitation response', function (done) {
        Max.App.hatCredentials = {
            access_token: 'test-access-token'
        };
        var comment = 'sure thing';
        var fromUid = '402881295313de0d015315c820bc0004';
        var attachmentMeta = '{"text":"hello dude","channelSummary":" ","channelName":"myprivfirstuser","channelIsPublic":"false","channelOwnerId":"4028ba815381b6db01539b6d35760041","channelPublishPermissions":"subscribers","channelCreationDate":"2016-03-21T23:05:39.664Z","inviteResponseText":"'+comment+'","inviteIsAccepted":"true"}';
        var channelName = '1456521126999';
        var channelOwnerUid = '402881295313de0d015315c820bc0004';
        var msgText = {
            "event": {
                "items": {
                    "item": {
                        "mmx": {
                            "mmxmeta": "{\"From\":{\"userId\":\"" + fromUid + "\",\"devId\":\"js-680a5326-ffbb-42e5-82a1-b81122fbfb8a\",\"displayName\":\"web@magnet.com\"}}",
                            "meta": attachmentMeta,
                            "payload": {
                                "_mtype": Max.MessageType.INVITATION_RESPONSE,
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
        Max.Message.formatEvent(msgText, null, function(e, msg) {
            expect(msg.receivedMessage).toBeUndefined();
            expect(msg.sender.userId).toEqual(fromUid);
            expect(msg.attachments).toBeUndefined();
            expect(msg.comments).toEqual(comment);
            expect(msg.mType).toEqual(Max.MessageType.INVITATION_RESPONSE);
            expect(msg.accepted).toEqual(true);
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
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }];
        var msg = new Max.Message(content, recipients);
        var testMsgId = Max.Utils.getCleanGUID();
        var sendSpy = sinon.spy();
        var connStub = {
            addHandler: function(cb) {
                msg.msgId = testMsgId;
                var xmlStr = "<mmx xmlns='com.magnet:msg:signal'>\
                    <mmxmeta>{&quot;endack&quot;:{&quot;errorCode&quot;:&quot;NO_ERROR&quot;,&quot;ackForMsgId&quot;:&quot;" + testMsgId + "&quot;,&quot;sender&quot;:\
                    {&quot;devId&quot;:&quot;js-34410bb7-c1f5-43f8-9620-c2a4ab3607bc&quot;,&quot;\
                    userId&quot;:&quot;4028ba815381b6db01539b6d35760041&quot;},&quot;badReceivers&quot;:[]}}\
                    </mmxmeta>\
                </mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        msg.send().success(function(msgId) {
            expect(msg.msgId).toEqual(msgId);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should send a message with attachment', function(done) {
        Max.setUser({
            userId: testUserId
        });
        var content = {
            my: messageContent
        };
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }];
        var mockFile = {
            type: 'text/plain'
        };
        var msg = new Max.Message(content, recipients, mockFile);
        var testMsgId = Max.Utils.getCleanGUID();
        var sendSpy = sinon.spy();
        var connStub = {
            addHandler: function(cb) {
                msg.msgId = testMsgId;
                var xmlStr = "<mmx xmlns='com.magnet:msg:signal'>\
                    <mmxmeta>{&quot;endack&quot;:{&quot;errorCode&quot;:&quot;NO_ERROR&quot;,&quot;ackForMsgId&quot;:&quot;" + testMsgId + "&quot;,&quot;sender&quot;:\
                    {&quot;devId&quot;:&quot;js-34410bb7-c1f5-43f8-9620-c2a4ab3607bc&quot;,&quot;\
                    userId&quot;:&quot;4028ba815381b6db01539b6d35760041&quot;},&quot;badReceivers&quot;:[]}}\
                    </mmxmeta>\
                </mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var oUploader = Max.Uploader;
        Max.Uploader = function(attachments, cb) {
            Max.App.hatCredentials = {
                access_token: 'test-token'
            };
            this.messageUpload = function() {
                var self = this;
                var uploadDef = new Max.Deferred();
                setTimeout(function() {
                    uploadDef
                        .resolve(self.attachmentRefs);
                }, 5);
                return uploadDef.promise;
            };
            this.attachmentRefs = [{"mimeType":"text/plain","senderId":"test-id","attachmentId":"test-attachment-id"}];
            cb(null, this);
        };
        msg.send().success(function(msgId) {
            expect(msg.msgId).toEqual(msgId);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Uploader = oUploader;
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Uploader = oUploader;
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


describe('Message addAttachments', function() {

    it('should add FileList object', function(done) {
        var mimeType = 'text/plain';
        var mimeType2 = 'image/jpeg';
        var msg = new Max.Message();
        var FileListMock = [{
            type: mimeType
        }, {
            type: mimeType2
        }];
        msg.addAttachments(FileListMock);
        expect(msg._attachments[0].type).toEqual(mimeType);
        expect(msg._attachments[1].type).toEqual(mimeType2);
        done();
    });

    it('should add an array of File objects', function(done) {
        var mimeType = 'text/plain';
        var msg = new Max.Message();
        var aryFileMock = [{
            type: mimeType
        }];
        msg.addAttachments(aryFileMock);
        expect(msg._attachments[0].type).toEqual(mimeType);
        done();
    });

    it('should add a File object', function(done) {
        var mimeType = 'text/plain';
        var msg = new Max.Message();
        var FileMock = {
            type: mimeType
        };
        msg.addAttachments(FileMock);
        expect(msg._attachments[0].type).toEqual(mimeType);
        done();
    });

});

describe('Message reply', function() {

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

    it('should send a reply', function(done) {
        var senderUserId = 'test-sender-id';
        var testMsg = 'new';
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var msg = new Max.Message();
        msg.sender = {
            userId: senderUserId
        };
        msg.reply({
            something: testMsg
        }).success(function() {
            expect(msg.recipients[0].userId).toEqual(senderUserId);
            expect(msg.messageContent.something).toEqual(testMsg);
            Max.Message.prototype.send.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            done();
        });

    });

    it('should not reply to self', function(done) {
        var senderUserId = 'test-sender-id';
        var testMsg = 'new';
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var msg = new Max.Message();
        msg.sender = {
            userId: testUserId
        };
        msg.reply({
            something: testMsg
        }).success(function(res) {
            expect(res).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('cannot reply to yourself');
            Max.Message.prototype.send.restore();
            done();
        });

    });

    it('should not send with no content', function(done) {
        var senderUserId = 'test-sender-id';
        var testMsg = 'new';
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var msg = new Max.Message();
        msg.sender = {
            userId: testUserId
        };
        msg.reply().success(function(res) {
            expect(res).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('invalid reply message content');
            Max.Message.prototype.send.restore();
            done();
        });

    });

});

describe('Invite constructor', function() {

    it('should be the correct event type', function(done) {
        var invite = new Max.Invite();
        expect(invite.mType).toEqual(Max.MessageType.INVITATION);
        done();
    });

});

describe('Invite respond', function() {

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
        Max.setConnection({
            connected: true
        });
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail channel validation', function(done) {
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var subscribeStub = sinon.stub(Max.Channel.prototype, 'subscribe', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var acceptance = false;
        var comment = 'sure thing';
        var invite = new Max.Invite();
        invite.respond(acceptance, comment).success(function(res) {
            expect(res).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('invalid channel');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        });
    });

    it('should fail missing accept param', function(done) {
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var subscribeStub = sinon.stub(Max.Channel.prototype, 'subscribe', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var comment = 'sure thing';
        var invite = new Max.Invite();
        invite.channel =  new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": "myprivchannel",
            "privateChannel": false
        });
        invite.invitationMeta = {
            "text": "hello guy",
            "channelSummary": " ",
            "channelName": "myprivfirstuser",
            "channelIsPublic": "false",
            "channelOwnerId": "4028ba815381b6db01539b6d35760041",
            "channelPublishPermissions": "subscribers",
            "channelCreationDate": "2016-03-21T23:05:39.664Z"
        };
        invite.respond(null, comment).success(function(res) {
            expect(res).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('accepted property missing');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        });
    });

    it('should respond with accept', function(done) {
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var subscribeStub = sinon.stub(Max.Channel.prototype, 'subscribe', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var acceptance = true;
        var comment = 'sure thing';
        var invite = new Max.Invite();
        invite.channel =  new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": "myprivchannel",
            "privateChannel": false
        });
        invite.invitationMeta = {
            "text": "hello guy",
            "channelSummary": " ",
            "channelName": "myprivfirstuser",
            "channelIsPublic": "false",
            "channelOwnerId": "4028ba815381b6db01539b6d35760041",
            "channelPublishPermissions": "subscribers",
            "channelCreationDate": "2016-03-21T23:05:39.664Z"
        };
        invite.respond(acceptance, comment).success(function() {
            expect(invite.invitationMeta.inviteResponseText).toEqual(comment);
            expect(invite.invitationMeta.inviteIsAccepted).toEqual(acceptance+'');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        });
    });

    it('should respond with decline', function(done) {
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var subscribeStub = sinon.stub(Max.Channel.prototype, 'subscribe', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
        });
        var acceptance = false;
        var comment = 'sure thing';
        var invite = new Max.Invite();
        invite.channel =  new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": "402881295313de27015315659c71000a",
            "subscriptionEnabled": true,
            "topicName": "myprivchannel",
            "privateChannel": false
        });
        invite.invitationMeta = {
            "text": "hello guy",
            "channelSummary": " ",
            "channelName": "myprivfirstuser",
            "channelIsPublic": "false",
            "channelOwnerId": "4028ba815381b6db01539b6d35760041",
            "channelPublishPermissions": "subscribers",
            "channelCreationDate": "2016-03-21T23:05:39.664Z"
        };
        invite.respond(acceptance, comment).success(function() {
            expect(invite.invitationMeta.inviteResponseText).toEqual(comment);
            expect(invite.invitationMeta.inviteIsAccepted).toEqual(acceptance+'');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            Max.Channel.prototype.subscribe.restore();
            done();
        });
    });

});