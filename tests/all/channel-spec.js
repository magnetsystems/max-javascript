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
        expect(channel.isPublic).toEqual(true);
        done();
    });

});

describe('Channel findChannels', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var channelName = 'test-channel';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.findPublicChannels(channelName).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

    it('should return private channels', function(done) {
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.findPrivateChannels(channelName).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

    it('should return public and private channels', function(done) {
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.findChannels(channelName).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

});

describe('Channel create', function() {
    var testUserId = 'test-user-id-1';
    var channelName = 'test-channel-name';

	beforeEach(function() {
        Max.setUser({
            userId: testUserId
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
            expect(channel.name).toEqual(channelObj.name);
            expect(channel.isPublic).toEqual(true);
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
            publishPermissions: 'subscribers',
            isPublic: false
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel.userId).toEqual(testUserId);
            expect(channel.name).toEqual(channelObj.name);
            expect(channel.isPublic).toEqual(false);
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
            publishPermissions: 'myself',
            isPublic: false
        };
        var requestStub = sinon.stub(Max, 'Request');
        requestStub.callsArg(1);
        Max.Channel.create(channelObj).success(function(channel) {
            expect(channel).toEqual('failed-test');
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toContain('publishPermissions must be');
            Max.Request.restore();
            done();
        });
    });

    it('should fail creation if name not set', function(done) {
        var channelObj = {
            publishPermissions: 'myself',
            isPublic: false
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
    var testUserId = '4028812953356a8901533b0617650002';
    var channelName = '1456984203652';
    var channelName2 = '1456984181155';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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
        var getChannelsStub = sinon.stub(Max.Channel, 'getChannels', function() {
            var d = new Max.Deferred();
            setTimeout(function(){
                d.resolve([
                    new Max.Channel({
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
                        "topicName": channelName,
                        "privateChannel": true
                    }),
                    new Max.Channel({
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
                        "topicName": channelName2,
                        "privateChannel": true
                    })
                ]);
            }, 0);
            return d.promise;
        });
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
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
            expect(channels[0].name).toEqual(channelName);
            expect(channels[0].isPublic).toEqual(false);
            expect(channels[0].userId).toEqual(testUserId);
            expect(channels[1].name).toEqual(channelName2);
            expect(channels[1].isPublic).toEqual(false);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.getChannels.restore();
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.getChannels.restore();
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

});

describe('Channel findChannelsBySubscribers', function() {
    var testUserId = 'test-user-id-1';
    var testChannelId = 'test-channel-name';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.findChannelsBySubscribers(testUserId).success(function(channels) {
            expect(channels.length).toEqual(1);
            expect(channels[0].name).toEqual(testChannelId);
            expect(channels[0].ownerUserID).toEqual(testUserId);
            expect(channels[0].isPublic).toEqual(true);
            Max.Request.restore();
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

});

describe('Channel getChannelSummary', function() {
    var testUserId = 'test-user-id-1';
    var testChannelId = 'test-channel-name';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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
            "privateChannel": true
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
        Max.Channel.getChannelSummary(channel, 3, 1).success(function(channelSummary) {
            expect(channelSummary.length).toEqual(1);
            expect(channelSummary[0].channel.name).toEqual(testChannelId);
            expect(channelSummary[0].owner.userId).toEqual(testUserId);
            expect(channelSummary[0].subscribers.length).toEqual(3);
            expect(channelSummary[0].messages.length).toEqual(1);
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
            userId: testUserId
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

    it('should get channel given channel name', function(done) {
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.setConnection(connStub);
        Max.Channel.getChannel(testChannelName, testUserId).success(function(channel) {
            expect(channel.name).toEqual(testChannelName);
            expect(channel.isPublic).toEqual(true);
            expect(channel.ownerUserID).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

    it('should get channel given private channel name', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='getTopic' ctype='application/json'>" +
                    "{&quot;isCollection&quot;:false,&quot;userId&quot;:&quot;"+testUserId+"&quot;,&quot;" +
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.getPrivateChannel(testChannelName).success(function(channel) {
            expect(channel.name).toEqual(testChannelName);
            expect(channel.isPublic).toEqual(false);
            expect(channel.ownerUserID).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });

    it('should get channel given public channel name', function(done) {
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
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.getPublicChannel(testChannelName).success(function(channel) {
            expect(channel.name).toEqual(testChannelName);
            expect(channel.isPublic).toEqual(true);
            expect(channel.ownerUserID).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
            done();
        });
    });
});

describe('Channel getChannels', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should get channel given channel name', function (done) {
        var connStub = {
            addHandler: function (cb) {
                var xmlStr = "<mmx xmlns='com.magnet:pubsub' command='getTopics' ctype='application/json'>" +
                    "[{&quot;isCollection&quot;:false,&quot;description&quot;:&quot;my public summary&quo" +
                    "t;,&quot;isPersistent&quot;:true,&quot;maxItems&quot;:-1,&quot;maxPayloadSize&quot;:20" +
                    "97152,&quot;creationDate&quot;:&quot;2016-03-09T18:27:40.546Z&quot;,&quot;modificationDa" +
                    "te&quot;:&quot;2016-03-09T18:27:40.546Z&quot;,&quot;publisherType&quot;:&quot;anyone&quot;" +
                    ",&quot;creator&quot;:&quot;"+testUserId+"%b9bilkj0c83@mmx&quot;,&quot;" +
                    "subscriptionEnabled&quot;:true,&quot;topicName&quot;:&quot;"+testChannelName+"&quot;}]</mmx>";
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var setSubscriptionStateStub = sinon.stub(Max.Channel, 'setSubscriptionState', function(input, cb) {
            cb(null, input);
        });
        Max.Channel.getChannels(testChannelName).success(function (channels) {
            expect(channels.length).toEqual(1);
            expect(channels[0].name).toEqual(testChannelName);
            expect(channels[0].isPublic).toEqual(true);
            expect(channels[0].ownerUserID).toEqual(testUserId);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.Channel.setSubscriptionState.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.Channel.setSubscriptionState.restore();
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
            userId: testUserId
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
        var getUsersByUserIdsStub = sinon.stub(Max.User, 'getUsersByUserIds', function() {
            var d = new Max.Deferred();
            setTimeout(function(){
                d.resolve([
                    new Max.User({
                        "userIdentifier": testUserId,
                        "clientId": "76b4e8f6-1066-49e0-a537-160d436ce78c",
                        "firstName": "Jack1457212214016",
                        "lastName": "Doe1457212214016",
                        "userName": "1457212214016",
                        "password": "n/a",
                        "userRealm": "DB",
                        "userStatus": "ACTIVE",
                        "roles": [
                            "USER"
                        ],
                        "otpCode": "n/a",
                        "userAccountData": {}
                    }),
                    new Max.User({
                        "userIdentifier": testUserId2,
                        "clientId": "76b4e8f6-1066-49e0-a537-160d436ce78c",
                        "firstName": "Jack1457212403217",
                        "lastName": "Doe1457212403217",
                        "userName": "1457212403217",
                        "password": "n/a",
                        "userRealm": "DB",
                        "userStatus": "ACTIVE",
                        "roles": [
                            "USER"
                        ],
                        "otpCode": "n/a",
                        "userAccountData": {}
                    })
                ]);
            }, 0);
            return d.promise;
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
            "privateChannel": false
        });
        Max.setConnection(connStub);
        channel.getAllSubscribers().success(function(users) {
            expect(users.length).toEqual(2);
            expect(users[0].userId).toEqual(testUserId);
            expect(users[1].userId).toEqual(testUserId2);
            expect(sendSpy.calledOnce).toEqual(true);
            Max.User.getUsersByUserIds.restore();
            done();
        }).error(function(e) {
            console.log('got', e);
            expect(e).toEqual('failed-test2');
            Max.User.getUsersByUserIds.restore();
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
            userId: testUserId
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
            expect(e).toEqual('forbidden');
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
            userId: testUserId
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
            expect(e).toEqual('forbidden');
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
            userId: testUserId
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
        channel.subscribe().success(function(subscriptionId) {
            expect(status).not.toBeUndefined();
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
            userId: testUserId
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
            expect(status).toEqual('1 subscription is cancelled');
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
            userId: testUserId
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
            userName: 'userName1',
            userId: testUserId
        }, {
            userName: 'userName2',
            userId: 'test-user-id-2'
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
        channel.publish(msg).success(function(msgId) {
            expect(channel.msgId).toEqual(msgId);
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
            this.channelUpload = function() {
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
            userName: 'userName1',
            userId: testUserId
        }, {
            userName: 'userName2',
            userId: 'test-user-id-2'
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
        channel.publish(msg, mockFile).success(function(msgId) {
            expect(channel.msgId).toEqual(msgId);
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
            userName: 'userName1',
            userId: testUserId
        }, {
            userName: 'userName2',
            userId: 'test-user-id-2'
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
        channel.publish(msg).success(function(msgId) {
            expect(msgId).toEqual('failed-test');
            done();
        }).error(function(err, code) {
            expect(err).toEqual('wait');
            expect(code).toEqual('500');
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
            userId: testUserId
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
            expect(status).toEqual('1 topic is deleted');
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

describe('Channel getMessages', function() {
    var sendSpy;
    var testUserId = 'test-user-id-1';
    var testChannelName = 'test-channel';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
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

    it('should return a list of messages', function (done) {
        var connStub = {
            addHandler: function(cb) {
                setTimeout(function() {
                    var json = {
                        "mmx": {
                            "_xmlns": "com.magnet:pubsub",
                            "_command": "fetch",
                            "_ctype": "application/json",
                            "__text": "{\"topicName\":\"GetStarted\",\"totalCount\":55,\"items\":[{\"itemId\":\"4114db4e87904d27d46de28da2840d4ec\",\"publisher\":\"402881295344b0610153486388b30022%gmbil1ewswo@mmx\",\"creationDate\":\"2016-03-05T20:06:37.938Z\",\"payloadXML\":\"\\u003cmmx xmlns\\u003d\\\"com.magnet:msg:payload\\\"\\u003e\\u003cmmxmeta\\u003e{\\\"From\\\":{\\\"userId\\\":\\\"402881295344b0610153486388b30022\\\",\\\"devId\\\":\\\"js-2a221e0b-3aa5-475e-f3cc-e59c1f450ee7\\\",\\\"displayName\\\":\\\"1457208395868\\\"}}\\u003c/mmxmeta\\u003e\\u003cmeta\\u003e{\\\"message\\\":\\\"message to channel\\\"}\\u003c/meta\\u003e\\u003cpayload mtype\\u003d\\\"unknown\\\" stamp\\u003d\\\"2016-03-05T20:06:37Z\\\" chunk\\u003d\\\"0/0/0\\\"/\\u003e\\u003c/mmx\\u003e\"},{\"itemId\":\"b8b23106343b43b989c0f543f4093c17c\",\"publisher\":\"402881295344b0610153484e492d0020%gmbil1ewswo@mmx\",\"creationDate\":\"2016-03-05T19:43:25.389Z\",\"payloadXML\":\"\\u003cmmx xmlns\\u003d\\\"com.magnet:msg:payload\\\"\\u003e\\u003cmmxmeta\\u003e{\\\"From\\\":{\\\"userId\\\":\\\"402881295344b0610153484e492d0020\\\",\\\"devId\\\":\\\"js-2a221e0b-3aa5-475e-f3cc-e59c1f450ee7\\\",\\\"displayName\\\":\\\"1457207003358\\\"}}\\u003c/mmxmeta\\u003e\\u003cmeta\\u003e{\\\"message\\\":\\\"message to channel\\\"}\\u003c/meta\\u003e\\u003cpayload mtype\\u003d\\\"unknown\\\" stamp\\u003d\\\"2016-03-05T19:43:25Z\\\" chunk\\u003d\\\"0/0/0\\\"/\\u003e\\u003c/mmx\\u003e\"}]}"
                        },
                        "_xmlns": "jabber:client",
                        "_type": "result",
                        "_id": "bdc791dc0cff4241a5315f22c787a798",
                        "_to": "402881295344b0610153486388b30022%gmbil1ewswo@mmx/js-2a221e0b-3aa5-475e-f3cc-e59c1f450ee7"
                    };
                    cb(null, json);
                }, 0);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
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
        channel.getMessages(new Date(), new Date(), 2, 0, false).success(function(messages) {
            expect(sendSpy.calledOnce).toEqual(true);
            expect(messages.length).toEqual(2);
            expect(messages[0].sender.userId).toEqual('402881295344b0610153486388b30022');
            expect(messages[0].messageID).toEqual('4114db4e87904d27d46de28da2840d4ec');
            expect(messages[0].channel.name).toEqual(testChannelName);
            expect(messages[0].messageContent.message).toEqual('message to channel');
            expect(messages[0].sender.userId).toEqual('402881295344b0610153486388b30022');
            expect(messages[0].messageID).toEqual('4114db4e87904d27d46de28da2840d4ec');
            expect(messages[0].channel.name).toEqual(testChannelName);
            expect(messages[0].messageContent.message).toEqual('message to channel');
            done();
        });
    });

});

describe('Channel setSubscriptionState', function() {
    var testChannelName;
    var testUserId;
    var testChannelName2;
    var testUserId2;

    beforeEach(function () {
        testChannelName = 'test-channel';
        testUserId = '402881295313de27015315659c71000a';
        testChannelName2 = 'test-channel2';
        testUserId2 = '402881295313de27015315659c71000b';
    });

    it('should should set subscription to true if subscription match', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var getAllSubscriptionsStub = sinon.stub(Max.Channel, 'getAllSubscriptions', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve([
                    {userId: testUserId, name: testChannelName}
                ]);
            }, 0);
            return d.promise;
        });
        Max.Channel.setSubscriptionState(channel, function(e, updatedChannel) {
            expect(channel.isSubscribed).toEqual(true);
            expect(updatedChannel.isSubscribed).toEqual(true);
            Max.Channel.getAllSubscriptions.restore();
            done();
        });
    });

    it('should should set subscription to false if subscription not match', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var getAllSubscriptionsStub = sinon.stub(Max.Channel, 'getAllSubscriptions', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve([
                    {userId: testUserId, name: 'wrong-name'}
                ]);
            }, 0);
            return d.promise;
        });
        Max.Channel.setSubscriptionState(channel, function(e, updatedChannel) {
            expect(channel.isSubscribed).toEqual(false);
            expect(updatedChannel.isSubscribed).toEqual(false);
            Max.Channel.getAllSubscriptions.restore();
            done();
        });
    });

    it('should should set subscription to true if subscription match for array', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var channel2 = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId2,
            "subscriptionEnabled": true,
            "topicName": testChannelName2,
            "privateChannel": true
        });
        var channels = [channel, channel2];
        var getAllSubscriptionsStub = sinon.stub(Max.Channel, 'getAllSubscriptions', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve([
                    {userId: testUserId, name: testChannelName},
                    {userId: testUserId2, name: testChannelName2}
                ]);
            }, 0);
            return d.promise;
        });
        Max.Channel.setSubscriptionState(channels, function(e, updatedChannels) {
            expect(channels[0].isSubscribed).toEqual(true);
            expect(updatedChannels[0].isSubscribed).toEqual(true);
            expect(channels[1].isSubscribed).toEqual(true);
            expect(updatedChannels[1].isSubscribed).toEqual(true);
            Max.Channel.getAllSubscriptions.restore();
            done();
        });
    });

    it('should should set subscription to false if subscription not match for array', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": testChannelName,
            "privateChannel": true
        });
        var channel2 = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId2,
            "subscriptionEnabled": true,
            "topicName": testChannelName2,
            "privateChannel": true
        });
        var channels = [channel, channel2];
        var getAllSubscriptionsStub = sinon.stub(Max.Channel, 'getAllSubscriptions', function() {
            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve([
                    {userId: testUserId, name: 'wrong-name1'},
                    {userId: testUserId2, name: 'wrong-name2'}
                ]);
            }, 0);
            return d.promise;
        });
        Max.Channel.setSubscriptionState(channels, function(e, updatedChannels) {
            expect(channels[0].isSubscribed).toEqual(false);
            expect(updatedChannels[0].isSubscribed).toEqual(false);
            expect(channels[1].isSubscribed).toEqual(false);
            expect(updatedChannels[1].isSubscribed).toEqual(false);
            Max.Channel.getAllSubscriptions.restore();
            done();
        });
    });

});

describe('Channel getTags', function() {
     var sendSpy;
    var testUserId = '4028812953356a8901533b0617650002';
    var channelName = '1456984203652';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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

    it('should get channel tags', function(done) {
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = '<mmx xmlns="com.magnet:pubsub" command="getTags" ctype="application/json">' +
                    '{"userId":"'+testUserId+'","topicName":"'+channelName+'","tags":["tag1","tag2"],"lastModTime":"2014-03-22T23:54:50.017Z"}</mmx>';
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": true
        });
        channel.getTags().success(function(tags, lastModified) {
            expect(tags.length).toEqual(2);
            expect(tags[0]).toEqual('tag1');
            expect(tags[1]).toEqual('tag2');
            expect(typeof lastModified).toEqual('object');
            expect(lastModified.getFullYear()).toEqual(2014);
            expect(lastModified.getMonth()).toEqual(2);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel setTags', function() {
     var sendSpy;
    var testUserId = '4028812953356a8901533b0617650002';
    var channelName = '1456984203652';

    beforeEach(function() {
        Max.setUser({
            userId: testUserId
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

    it('should fail if no tags passed', function(done) {
        var responseText = 'ok';
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = '<mmx xmlns="com.magnet:pubsub" command="setTags" ctype="application/json">{"code": 200, "message": "'+responseText+'"}</mmx>';
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": true
        });
        channel.setTags().success(function(message) {
            expect(message).toEqual('failed-test');
            done();
        }).error(function(e) {
            expect(e).toEqual('invalid tags');
            done();
        });
    });

    it('should get channel tags', function(done) {
        var responseText = 'ok';
        var connStub = {
            addHandler: function(cb) {
                var xmlStr = '<mmx xmlns="com.magnet:pubsub" command="setTags" ctype="application/json">{"code": 200, "message": "'+responseText+'"}</mmx>';
                var xml = Max.Utils.getValidXML(xmlStr);
                cb(xml);
            },
            send: sendSpy,
            connected: true
        };
        Max.setConnection(connStub);
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": true
        });
        var tags = ['tags1', 'tags2'];
        channel.setTags(tags).success(function(message) {
            expect(responseText).toEqual(message);
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            done();
        });
    });

});

describe('Channel inviteUsers', function() {
    var sendSpy;
    var testUserId = '4028812953356a8901533b0617650002';
    var channelName = '1456984203652';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.setConnection({
            connected: true
        });
        sendSpy = sinon.spy();
    });
    afterEach(function () {
        Max.setUser(null);
        Max.setConnection(null);
    });

    it('should fail if no tags passed', function (done) {
        var isPublic = false;
        var sendStub = sinon.stub(Max.Message.prototype, 'send', function() {

            expect(this.mType).toEqual(Max.MessageType.INVITATION);
            expect(this.messageContent.channelName).toEqual(channelName);
            expect(this.messageContent.channelOwnerId).toEqual(testUserId);
            expect(this.messageContent.channelIsPublic).toEqual(isPublic+'');

            var d = new Max.Deferred();
            setTimeout(function() {
                d.resolve();
            }, 0);
            return d.promise;
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
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": !isPublic
        });
        var recipients = [{
            userName: 'userName1',
            userId: testUserId
        }, {
            userName: 'userName2',
            userId: 'test-user-id-2'
        }];
        var comment = 'hey join now';
        channel.inviteUsers(recipients, comment).success(function (message) {
            Max.Message.prototype.send.restore();
            done();
        }).error(function (e) {
            expect(e).toEqual('failed-test');
            Max.Message.prototype.send.restore();
            done();
        });
    });
});

describe('Channel deleteMessage', function() {
    var testUserId = 'test-user-id-1';
    var channelName = 'test-channel-name';

    beforeEach(function () {
        Max.setUser({
            userId: testUserId
        });
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = true;
    });

    it('should not delete if invalid msg id', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": true
        });
        channel.deleteMessage().success(function(msg) {
            expect(msg).toEqual('failed-test');
        }).error(function(e) {
            expect(e).toEqual('invalid messageID');
            done();
        });
    });

    it('should delete message', function (done) {
        var channel = new Max.Channel({
            "isCollection": false,
            "description": "",
            "isPersistent": true,
            "maxItems": -1,
            "maxPayloadSize": 2097152,
            "creationDate": "2016-02-26T21:27:23.014Z",
            "modificationDate": "2016-02-26T21:27:23.015Z",
            "publisherType": "subscribers",
            "userId": testUserId,
            "subscriptionEnabled": true,
            "topicName": channelName,
            "privateChannel": true
        });
        var messageId = 'test-message-id';
        var requestStub = sinon.stub(Max, 'Request');
        var resMsg = 'message has been deleted successfully';
        var resCode = 200;
        requestStub.callsArgWith(1, {
            code: resCode,
            message: resMsg
        });
        channel.deleteMessage(messageId).success(function(msg, code) {
            expect(resMsg).toEqual(msg);
            expect(resCode).toEqual(code);
            Max.Request.restore();
            done();
        }).error(function(e) {
            expect(e).toEqual('failed-test');
            Max.Request.restore();
            done();
        });
    });
});