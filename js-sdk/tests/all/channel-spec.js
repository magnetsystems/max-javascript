/* unit tests for validating messaging features */

var Max = Max || require('../../target/magnet-sdk');

describe('Channel', function() {

    it('should instantiate a Channel object', function(done) {
        var channelName = 'test-channel';
        var channelObj = {
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
            "topicName": channelName,
            "privateChannel": false
        };
        var channel = new Max.Channel(channelObj);
        expect(channel.name).toEqual(channelName);
        expect(channel.privateChannel).toEqual(true);
        done();
    });

});

describe('Channel findPublicChannelsByName', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var channelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should return public channels', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='searchTopic' ctype='application/json'>" +
                    "{&quot;total&quot;:1,&quot;results&quot;:[{&quot;isCollection&quot;:false,&quot;" +
                    "description&quot;:&quot;&quot;,&quot;isPersistent&quot;:true,&quot;maxItems&quot;:-1," +
                    "&quot;maxPayloadSize&quot;:2097152,&quot;creationDate&quot;:&quot;2016-02-26T21:27:23.014Z" +
                    "&quot;,&quot;modificationDate&quot;:&quot;2016-02-26T21:27:23.015Z&quot;,&quot;" +
                    "publisherType&quot;:&quot;subscribers&quot;,&quot;creator&quot;:&quot;402881295313de" +
                    "27015315659c71000a%gmbil1ewswo@mmx&quot;,&quot;subscriptionEnabled&quot;:true,&quot;" +
                    "topicName&quot;:&quot;"+channelName+"&quot;}]}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        Max.Channel.findPublicChannelsByName(channelName).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel create', function() {
    var testUserId = 'test-user-id-1';
    var channelName = 'test-channel-name';

	beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
	});

    it('should create a public channel', function(done) {
        var channelObj = {
            "name": channelName
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel.userId).toBeUndefined();
            expect(channel.channelName).toEqual(channelObj.name);
            expect(channel.privateChannel).toEqual(false);
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

    it('should create a private channel', function(done) {
        var channelObj = {
            "name": channelName,
            publishPermission: 'subscribers',
            private: true
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel.userId).toEqual(testUserId);
            expect(channel.channelName).toEqual(channelObj.name);
            expect(channel.privateChannel).toEqual(true);
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

    it('should fail creation given invalid publish permissions', function(done) {
        var channelObj = {
            "name": channelName,
            publishPermission: 'myself',
            private: true
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel).toEqual('failed-test');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toContain('publishPermission must be');
            Max.Request.restore();
            done();
        });
    });

    it('should fail creation if name not set', function(done) {
        var channelObj = {
            publishPermission: 'myself',
            private: true
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel).toEqual('failed-test');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toContain('channel name required');
            Max.Request.restore();
            done();
        });
    });

});

describe('Channel getAllSubscriptions', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should get all subscribed channels', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<pubsub xmlns='http://jabber.org/protocol/pubsub'><subscriptions><s" +
                    "ubscription node='/97lil3xezlt/4028812953356a8901533b0617650002/1456984203652' jid='402881" +
                    "2953356a8901533b0617650002%97lil3xezlt@mmx' subscription='subscribed' subid='5Tt8r7lzr3Yt3" +
                    "BdSb52UvGm536UB9mvXXeXzk44N'/><subscription node='/97lil3xezlt/4028812953356a8901533b0617" +
                    "650002/1456984181155' jid='4028812953356a8901533b0617650002%97lil3xezlt@mmx' subscription='s" +
                    "ubscribed' subid='Syt13dSiyj2RL4CG9jYga33mheVg2yWoBkTn30cu'/></subscriptions></pubsub>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        Max.Channel.getAllSubscriptions().success(function(channels) {
            expect(channels.length).toEqual(2);
            expect(channels[0].name).toEqual('1456984203652');
            expect(channels[0].privateChannel).toEqual(true);
            expect(channels[0].userId).toEqual('4028812953356a8901533b0617650002');
            expect(channels[1].name).toEqual('1456984181155');
            expect(channels[1].privateChannel).toEqual(true);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel findChannelsBySubscribers', function() {
    var testUserId = 'test-user-id-1';
    var testChannelId = 'test-channel-name';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
    });
    afterEach(function() {
        Max.setUser(null);
    });

    it('should get all channels given a user id', function(done) {
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success({
               channels: [{
                    "isCollection": false,
                    "description": "",
                    "isPersistent": true,
                    "maxItems": -1,
                    "maxPayloadSize": 2097152,
                    "creationDate": "2016-02-26T21:27:23.014Z",
                    "modificationDate": "2016-02-26T21:27:23.015Z",
                    "publisherType": "subscribers",
                    "creator": testUserId,
                    "subscriptionEnabled": true,
                    "topicName": testChannelId,
                    "privateChannel": false
                }]
            });
        });
        Max.Channel.findChannelsBySubscribers(testUserId).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(channels[0].name).toEqual(testChannelId);
            expect(channels[0].creator).toEqual(testUserId);
            expect(channels[0].privateChannel).toEqual(false);
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

});

describe('Channel getChannelSummary', function() {
    var testUserId = 'test-user-id-1';
    var testChannelId = 'test-channel-name';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
    });
    afterEach(function() {
        Max.setUser(null);
    });

    it('should return summary ', function(done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "creator": testUserId,
            "subscriptionEnabled": true,
            "topicName": testChannelId,
            "privateChannel": false
        });
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success([{
                "subscriberCount": 3,
                "subscribers": [
                    {
                        "displayName": "edward yang",
                        "userId": testUserId
                    },
                    {
                        "displayName": "Jack Doe",
                        "userId": "4028ba81531e7be001532044f7ff0010"
                    },
                    {
                        "displayName": "Jack Doe",
                        "userId": "4028ba81531e7be00153204641c50012"
                    }
                ],
                "messages": [
                    {
                        "itemId": "906ad1cb326a4115f5331fff10c8dd1f",
                        "channelName": "4028812953356a8901533b0617650002#" + testChannelId,
                        "publisher": {
                            "userId": testUserId
                        },
                        "content": {
                            "message": "asdf",
                            "type": "text"
                        },
                        "metaData": {
                            "mtype": "unknown",
                            "creationDate": "2016-03-03T05:49:43Z",
                            "data": ""
                        },
                        "publisherInfo": {}
                    }
                ],
                "owner": {
                    "displayName": "edward yang",
                    "userId": testUserId + "%97lil3xezlt"
                },
                "userId": testUserId,
                "channelName": testChannelId,
                "publishedItemCount": 1,
                "lastPublishedTime": "2016-03-03T05:49:43.867Z"
            }
        ]);
        });
        Max.Channel.getChannelSummary(testUserId, 3, 1).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(channels[0].channel.name).toEqual(testChannelId);
            expect(channels[0].owner.userIdentifier).toEqual(testUserId);
            expect(channels[0].subscribers.length).toEqual(3);
            expect(channels[0].messages.length).toEqual(1);
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

});

describe('Channel getChannel', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should get all subscribed channels', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='getTopic' ctype='application/json'>" +
                    "{&quot;isCollection&quot;:false,&quot;" +
                    "description&quot;:&quot;&quot;,&quot;isPersistent&quot;:true,&quot;maxItems&quot;:-1," +
                    "&quot;maxPayloadSize&quot;:2097152,&quot;creationDate&quot;:&quot;2016-02-26T21:27:23.014Z" +
                    "&quot;,&quot;modificationDate&quot;:&quot;2016-02-26T21:27:23.015Z&quot;,&quot;" +
                    "publisherType&quot;:&quot;subscribers&quot;,&quot;creator&quot;:&quot;"+testUserId+
                    "%gmbil1ewswo@mmx&quot;,&quot;subscriptionEnabled&quot;:true,&quot;" +
                    "topicName&quot;:&quot;"+testChannelName+"&quot;}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        Max.Channel.getChannel(testChannelName, testUserId).success(function(channel) {
            expect(channel.name).toEqual(testChannelName);
            expect(channel.privateChannel).toEqual(false);
            expect(channel.creator).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel getAllSubscribers', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testUserId2 = '4028812953169ff801531e7528d40015';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should get all users subscribed to channel', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='getSubscribers' ctype='application/json'>" +
                    "{&quot;subscribers&quot;:[{&quot;displayName&quot;:&quot;System User&quot;,&quot;userId&quot;" +
                    ":&quot;"+testUserId2+"&quot;},{&quot;displayName&quot;:&quot;asdfasdf asdfasdf" +
                    "&quot;,&quot;userId&quot;:&quot;"+testUserId+"&quot;}],&quot;totalCount&quot;:" +
                    "2,&quot;message&quot;:&quot;Success&quot;,&quot;code&quot;:200}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.getAllSubscribers().success(function(users) {
            expect(users.length).toEqual(2);
            expect(users[0].userIdentifier).toEqual(testUserId2);
            expect(users[1].userIdentifier).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel addSubscribers', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testUserId2 = '4028812953169ff801531e7528d40015';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should add a subscriber to the channel', function(done) {
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success({
                "code": 0,
                "message": "Subscribers added",
                "subscribeResponse": {
                    "4028ba81531e7be00153204641c50012": {
                        "code": 0,
                        "message": "b8EM1AniQac591ANyJl692kUWbO690a1gjaYmhf7",
                        "subId": "b8EM1AniQac591ANyJl692kUWbO690a1gjaYmhf7"
                    }
                }
            });
        });
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": false
        });
        channel.addSubscribers(testUserId2).success(function(status) {
            expect(status.message).toEqual('Subscribers added');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

    it('should fail if not private channel owner', function(done) {
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success, error) {
            error('failed');
        });
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": true
        });
        channel.addSubscribers(testUserId2).success(function(status) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('insufficient privileges');
            Max.Request.restore();
            done();
        });
    });

});

describe('Channel removeSubscribers', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testUserId2 = '4028812953169ff801531e7528d40015';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should remove subscriber from channel', function(done) {
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success) {
            success({
                "code": 0,
                "message": "Subscribers removed",
                "subscribeResponse": {
                    "4028ba81531e7be00153204641c50012": {
                        "code": 0,
                        "message": "b8EM1AniQac591ANyJl692kUWbO690a1gjaYmhf7",
                        "subId": "b8EM1AniQac591ANyJl692kUWbO690a1gjaYmhf7"
                    }
                }
            });
        });
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": false
        });
        channel.removeSubscribers(testUserId2).success(function(status) {
            expect(status.message).toEqual('Subscribers removed');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });

    it('should fail if not private channel owner', function(done) {
        var reqDef = new Max.Deferred();
        var reqStub = sinon.stub(Max, 'Request', function(meta, success, error) {
            error('failed');
        });
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": true
        });
        channel.removeSubscribers(testUserId2).success(function(status) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('insufficient privileges');
            Max.Request.restore();
            done();
        });
    });

});

describe('Channel subscribe', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should subscribe current user to channel', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='subscribe' ctype='application/json'>" +
                    "{&quot;subscriptionId&quot;:&quot;a6WAFCV5hUDK6o8e8WE5hJlSFc70Or9coePdWstR&quot;," +
                    "&quot;code&quot;:200,&quot;msg&quot;:&quot;Success&quot;}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.subscribe().success(function(status) {
            expect(status.msg).toEqual('Success');
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel unsubscribe', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should unsubscribe current user from channel', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='unsubscribe' ctype='application/json'>" +
                    "{&quot;message&quot;:&quot;1 subscription is cancelled&quot;,&quot;code&quot;:200}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.unsubscribe().success(function(status) {
            expect(status.message).toEqual('1 subscription is cancelled');
            expect(sendSpy.calledOnce).toEqual(true);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel publish', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';
    var messageContent;

    beforeEach(function() {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        Max.setDevice({
            deviceId: 'test-device-id'
        });
        sendSpy = sinon.spy();
        messageContent = 'test-message-content';
    });
    afterEach(function() {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should publish a message successfully', function(done) {
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
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx></mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.publish(msg).success(function(status) {
            expect(status).toEqual('ok');
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should publish a message with attachment', function(done) {
        var oUploader = Max.Uploader;
        Max.Uploader = function(attachments, cb) {
            Max.App.hatCredentials = {
                access_token: 'test-token'
            };
            this.upload = function() {
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
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx></mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        var mockFile = {
            type: 'text/plain'
        };
        Max.setConnection(connStub);
        channel.publish(msg, mockFile).success(function(status) {
            expect(status).toEqual('ok');
            Max.Uploader = oUploader;
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Uploader = oUploader;
            done();
        });
    });

    it('should fail to publish due to server error', function(done) {
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
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<error code='500' type='wait'><internal-server-error xm" +
                    "lns='urn:ietf:params:xml:ns:xmpp-stanzas'/></error>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.publish(msg).success(function(status) {
            expect(status).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('500 : wait');
            done();
        });
    });

});

describe('Channel delete', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userIdentifier: testUserId
        });
        Max.setConnection({
            connected: true
        });
        Max.setDevice({
            deviceId: 'test-device-id'
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should publish a message successfully', function (done) {
        var connStub = {
            addHandler: function (cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='deletetopic' ctype='application/json'>" +
                    "{&quot;message&quot;:&quot;1 topic is deleted&quot;,&quot;code&quot;:200}</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.delete().success(function (status) {
            expect(status.message).toEqual('1 topic is deleted');
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel getChannelName', function() {
    var testChannelName = 'test-channel';

    it('should get formal public channel name', function (done) {
        var channel = new Max.Channel({
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
            "topicName": testChannelName,
            "privateChannel": true
        });
        expect(channel.getChannelName()).toEqual('402881295313de27015315659c71000a#test-channel');
        done();
    });

    it('should get formal private channel name', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": false
        });
        expect(channel.getChannelName()).toEqual('test-channel');
        done();
    });

});