
var xmppStore;
var x2js = new X2JS();

MagnetJS.start = function() {
    MagnetJS.App.receiving = true;
    mXMPPConnection.priority = 0;
};

MagnetJS.stop = function() {
    MagnetJS.App.receiving = false;
    mXMPPConnection.priority = -255;
};

MagnetJS.registerListener = function(listener) {
    xmppStore = xmppStore || {};
    xmppStore[listener.id] = mXMPPConnection.addHandler(function(msg) {

        var jsonObj = x2js.xml2json(msg);
        var mmxMsg = new MagnetJS.Message();

        mmxMsg.formatMessage(jsonObj, function() {
            listener.handler(mmxMsg);
        });
        return true;

    }, null, 'message', null, null,  null);
};

MagnetJS.unregisterListener = function(id) {
    if (!xmppStore || !id) return;
    mXMPPConnection.deleteHandler(xmppStore[id]);
};

MagnetJS.MessageListener = function(idOrHandler, handler) {
    if (typeof handler == typeof Function)
        this.handler = handler;
    else
        this.handler = idOrHandler;
    this.id = typeof idOrHandler == 'string' ? idOrHandler : MagnetJS.Utils.getGUID();
};

MagnetJS.MMXClient = {
    connect: function(userId, accessToken) {
        var self = this;
        var def = new MagnetJS.Deferred();

        var protocol = (MagnetJS.Config.mmxEndpoint.indexOf('https://') != -1 ? 'https' : 'http') + '://';
        mXMPPConnection = new Strophe.Connection(protocol + MagnetJS.Config.mmxHost + ':' + MagnetJS.Config.httpBindPort + '/http-bind/');

        mXMPPConnection.rawInput = function(data) {
            if (MagnetJS.Config.payloadLogging)
                MagnetJS.Log.fine('RECV: ' + data);
        };
        mXMPPConnection.rawOutput = function(data) {
            if (MagnetJS.Config.payloadLogging)
                MagnetJS.Log.fine('SENT: ' + data);
        };

        mCurrentUser.jid = self.getBaredJid(userId) + '/' + mCurrentDevice.deviceId;

        mXMPPConnection.connect(mCurrentUser.jid, accessToken, function(status) {

            if (status == Strophe.Status.CONNECTING) {
                MagnetJS.Log.fine('MMX is connecting.');
            } else if (status == Strophe.Status.CONNFAIL) {
                MagnetJS.Log.fine('MMX failed to connect.');
                def.reject('not-authorized');
            } else if (status == Strophe.Status.DISCONNECTING) {
                MagnetJS.Log.fine('MMX is disconnecting.');
            } else if (status == Strophe.Status.DISCONNECTED) {
                MagnetJS.Log.info('MMX is disconnected.');
            } else if (status == Strophe.Status.CONNECTED) {
                MagnetJS.Log.info('MMX is connected.');

                mXMPPConnection.send($pres());
                MagnetJS.invoke('authenticated', 'ok');

                if (!mCurrentUser.connected) {
                    mCurrentUser.connected = true;
                    def.resolve('ok');
                }
            }
        });

        return def.promise;
    },
    disconnect: function() {
        if (mXMPPConnection) mXMPPConnection.disconnect();
    },
    getBaredJid: function(userId) {
        return userId + "%" + MagnetJS.App.appId +
            '@' + MagnetJS.Config.mmxDomain;
    }
};

MagnetJS.Message = function(contents, recipientOrRecipients) {
    this.meta = {};
    this.recipients = [];

    if (contents)
        this.messageContent = contents;

    if (recipientOrRecipients) {
        if (MagnetJS.Utils.isArray(recipientOrRecipients)) {
            for (var i=0;i<recipientOrRecipients.length;++i)
                this.recipients.push(this.formatUser(recipientOrRecipients[i]));
        } else {
            this.recipients.push(this.formatUser(recipientOrRecipients));
        }
    }

    if (mCurrentUser)
        this.sender = mCurrentUser;

    return this;
};

MagnetJS.Message.prototype.formatUser = function(userOrUserId) {
    return {
        userId: typeof userOrUserId == 'string' ? userOrUserId : userOrUserId.userIdentifier
    };
};

MagnetJS.Message.prototype.formatMessage = function(msg, cb) {
    var self = this;

    try {
        this.receivedMessage = true;
        this.messageType = msg._type;
        this.messageID = msg._id;
        this.channel = null;
        this.attachments = null;

        this.meta = {
            from: msg._from,
            to: msg._to,
            id: msg._id
        };

        msg.mmx = (
          msg.event &&
          msg.event.items &&
          msg.event.items.item &&
          msg.event.items.item.mmx
        ) ? msg.event.items.item.mmx : msg.mmx;

        this.meta.ns = msg.mmx ? msg.mmx._xmlns : '';

        if (msg.mmx && msg.mmx.meta) {
            var msgMeta = JSON.parse(msg.mmx.meta);
            attachmentRefsToAttachment(this, msgMeta);
            this.messageContent = msgMeta;
        }

        if (msg.mmx && msg.mmx.mmxmeta) {
            var mmxMeta = JSON.parse(msg.mmx.mmxmeta);
            this.recipients = mmxMeta.To;
            this.sender = new MagnetJS.User(mmxMeta.From);
        }

        if (msg.mmx && msg.mmx.payload) {
            this.timestamp = msg.mmx.payload._stamp;
        }

        if (msg.event && msg.event.items && msg.event.items._node) {
            self.channel = nodePathToChannel(msg.event.items._node);
            cb();
        } else {
            cb();
        }

    } catch(e) {
        MagnetJS.Log.fine('MMXMessage.formatMessage', e);
    }
};

function attachmentRefsToAttachment(mmxMessage, msgMeta) {
    mmxMessage.attachments = mmxMessage.attachments || [];

    if (!msgMeta._attachments || msgMeta._attachments === '[]') return;
    if (typeof msgMeta._attachments === 'string')
        msgMeta._attachments = JSON.parse(msgMeta._attachments);

    for (var i=0;i<msgMeta._attachments.length;++i)
        mmxMessage.attachments.push(new MagnetJS.Attachment(msgMeta._attachments[i]));

    delete msgMeta._attachments;
}

// TODO: if we ever ned to fully hydrate channel on message receive:
//function nodePathToChannel(nodeStr, cb) {
//    nodeStr = nodeStr.split('/');
//    if (nodeStr.length !== 4) return cb('invalid node path');
//
//    var name = nodeStr[nodeStr.length-1];
//    var userId = nodeStr[nodeStr.length-2];
//    userId = userId == '*' ? null : userId;
//
//    MagnetJS.Channel.getChannel(name, userId).success(cb).error(function() {
//        cb();
//    });
//}

function nodePathToChannel(nodeStr) {
    nodeStr = nodeStr.split('/');
    if (nodeStr.length !== 4) return;

    var name = nodeStr[nodeStr.length-1];
    var userId = nodeStr[nodeStr.length-2];
    userId = userId == '*' ? null : userId;

    return new MagnetJS.Channel({
        name: name,
        userId: userId
    });
}

MagnetJS.Message.prototype.send = function() {
    var self = this;
    var deferred = new MagnetJS.Deferred();
    var msgId = MagnetJS.Utils.getCleanGUID();
    var dt = MagnetJS.Utils.dateToISO8601(new Date());

    setTimeout(function() {
        if (!self.recipients.length)
            return deferred.reject('no recipients');
        if (!mCurrentUser)
            return deferred.reject('session expired');
        if (self.receivedMessage)
            return deferred.reject('unable to send: this was a received message.');

        if (!mXMPPConnection || !mXMPPConnection.connected) {
            // TODO: replace with reliable offline
            return deferred.reject('not connected');
        }

        self.sender = mCurrentUser;

        try {
            var meta = JSON.stringify(self.messageContent);
            var mmxMeta = {
                To: self.recipients,
                From: {
                    userId: mCurrentUser.userIdentifier
                },
                NoAck: true,
                mmxdistributed: true
            };
            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $msg({type: 'chat', id: msgId})
                .c('mmx', {xmlns: 'com.magnet:msg:payload'})
                .c('mmxmeta', mmxMeta).up()
                .c('meta', meta).up()
                .c('payload', {stamp: dt, chunk: '0/0/0'}).up().up()
                .c('request', {xmlns: 'urn:xmpp:receipts'}).up()
                .c('body', '.');

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);

                if (json.error)
                    return deferred.reject(json.error._code + ' : ' + json.error._type);

                deferred.resolve('ok');
            }, null, null, null, msgId, null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            deferred.reject(e);
        }
    }, 0);

    return deferred.promise;
};

// TODO: not implemented
MagnetJS.Message.prototype.reply = function(content, cb) {
    if (!this.receivedMessage) return cb('unable to reply: not a received message.');
    $msg({to: this.meta.from, from: this.meta.to, type: 'chat'})
        .cnode(Strophe.copyElement(content));
};

MagnetJS.Channel = function(channelObj) {
    if (channelObj.topicName) {
        channelObj.name = channelObj.topicName;
        delete channelObj.topicName;
    }

    channelObj.privateChannel = channelObj.userId ? true : false;
    MagnetJS.Utils.mergeObj(this, channelObj);

    return this;
};

MagnetJS.Channel.findPublicChannelsByName = function(channelName) {
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var channels = [];

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                operator: 'AND',
                limit: -1,       // -1 for max # of records imposed by system, or > 0
                offset: 0,       // optional, starting from zero
                type: 'global'  // personal|global|both, default is global
            };
            if (channelName)
                mmxMeta.topicName = {
                    match: 'EXACT',
                    value: channelName
                };

            // TODO: implement tags
            /*
                description: {
                    match: EXACT|PREFIX|SUFFIX,     // optional
                    value: topic description
                },
                tags: {
                    match: EXACT,                       // optional
                    values: [ tag1, tag2...]            // multi-values
                }
             */

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'searchTopic', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                if (json.mmx) {
                    payload = (json.mmx && json.mmx.__text) ? JSON.parse(json.mmx.__text) : JSON.parse(json.mmx);
                    if (payload && payload.results && payload.results.length) {
                        for (var i=0;i<payload.results.length;++i)
                            channels.push(new MagnetJS.Channel(payload.results[i]));
                    }
                }
                def.resolve(channels);
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.create = function(channelObj) {
    var def = new MagnetJS.Deferred();
    var dt = MagnetJS.Utils.dateToISO8601(new Date());

    setTimeout(function() {
        if (!channelObj.name)
            return def.reject('name not set');
        if (channelObj.publishPermission
            && (['anyone', 'owner', 'subscribers'].indexOf(channelObj.publishPermission) == -1))
            return def.reject('publishPermission must be in ["anyone", "owner", "subscribers"]');

        channelObj.channelName = channelObj.name;
        channelObj.ownerId = mCurrentUser.userIdentifier;
        channelObj.privateChannel = (channelObj.private === true || channelObj.private === false)
            ? channelObj.private : false;
        channelObj.subscribeOnCreate = (channelObj.subscribe === true || channelObj.subscribe === false)
            ? channelObj.subscribe : true;
        channelObj.creationDate = dt;
        channelObj.lastTimeActive = dt;

        if (channelObj.privateChannel)
            channelObj.userId = mCurrentUser.userIdentifier;

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/create',
            data: channelObj
        }, function (data, details) {
            delete channelObj.ownerId;

            def.resolve(new MagnetJS.Channel(channelObj), details);
        }, function () {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

//MagnetJS.Channel.getAllSubscriptions = function() {
//    var def = new MagnetJS.Deferred();
//    var msgId = MagnetJS.Utils.getCleanGUID();
//
//    setTimeout(function() {
//        if (!mCurrentUser) return def.reject('session timeout');
//        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');
//
//        try {
//            var mmxMeta = {
//                limit: -1,        // -1 for unlimited (or not specified), or > 0
//                recursive: true,  // true for all descendants, false for immediate children only
//                topic: null,      // null from the root, or a starting topic
//                type: 'both'      // type of topics to be listed global/personal/both
//            };
//
//            mmxMeta = JSON.stringify(mmxMeta);
//
//            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: msgId})
//                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'listtopics', ctype: 'application/json'}, mmxMeta);
//
//            mXMPPConnection.addHandler(function(msg) {
//                var json = x2js.xml2json(msg);
//                var payload, channels = [];
//
//                if (json.mmx) {
//                    payload = JSON.parse(json.mmx);
//                    if (payload.length) {
//                        for (var i=0;i<payload.length;++i)
//                            channels.push(new MagnetJS.Channel(payload[i]));
//                    }
//                }
//
//                def.resolve(channels);
//            }, null, null, null, msgId,  null);
//
//            mXMPPConnection.send(payload.tree());
//
//        } catch (e) {
//            def.reject(e);
//        }
//    }, 0);
//
//    return def.promise;
//};

MagnetJS.Channel.getAllSubscriptions = function() {
    var def = new MagnetJS.Deferred();
    var msgId = MagnetJS.Utils.getCleanGUID();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session timeout');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var payload = $iq({to: 'pubsub.mmx', from: mCurrentUser.jid, type: 'get', id: msgId})
                .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                .c('subscriptions');

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);
                var channels = [];

                if (json.pubsub && json.pubsub.subscriptions && json.pubsub.subscriptions.subscription) {
                    var subs =json.pubsub.subscriptions.subscription;
                    for (var i=0;i<subs.length;++i)
                        channels.push(nodePathToChannel(subs[i]._node));
                }

                def.resolve(channels);
            }, null, null, null, msgId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.findChannelsBySubscribers = function(subscribers) {
    var subscriberlist = [];
    var channels = [];

    if (!MagnetJS.Utils.isArray(subscribers))
        subscribers = [subscribers];

    for (var i in subscribers)
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/channel/query',
        data: {
            subscribers: subscriberlist,
            matchFilter: 'EXACT_MATCH'
        }
    }, function(data, details) {
        if (data.channels && data.channels.length) {
            for (var i=0;i<data.channels.length;++i)
                channels.push(new MagnetJS.Channel(data.channels[i]));
        }

        def.resolve(channels, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.Channel.getChannelSummary = function(channelOrChannels, subscriberCount, messageCount) {
    var channelIds = [];
    var channelSummaries = [];

    if (!MagnetJS.Utils.isArray(channelOrChannels))
        channelOrChannels = [channelOrChannels];

    for (var i=0;i<channelOrChannels.length;++i)
        channelIds.push({
            channelName: channelOrChannels[i].name,
            userId: channelOrChannels[i].userId,
            privateChannel: channelOrChannels[i].privateChannel
        });

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/channel/summary',
        data: {
            channelIds: channelIds,
            numOfSubcribers: subscriberCount,
            numOfMessages: messageCount
        }
    }, function(data, details) {
        var i, j;
        if (data && data.length) {
            for (i=0;i<data.length;++i) {
                if (data[i].messages && data[i].messages.length) {
                    for (j=0;j<data[i].messages.length;++j) {
                        var mmxMsg = new MagnetJS.Message();
                        mmxMsg.sender = new MagnetJS.User(data[i].messages[j].publisher);
                        mmxMsg.timestamp = data[i].messages[j].metaData.creationDate;
                        mmxMsg.channel = data[i].messages[j].channelName;
                        mmxMsg.messageID = data[i].messages[j].itemId;
                        if (data[i].messages[j].content) {
                            attachmentRefsToAttachment(mmxMsg, data[i].messages[j].content);
                            mmxMsg.messageContent = data[i].messages[j].content;
                        }
                        data[i].messages[j] = mmxMsg;
                    }
                }
                if (data[i].subscribers && data[i].subscribers.length) {
                    for (j=0;j<data[i].subscribers.length;++j) {
                        data[i].subscribers[j] = new MagnetJS.User(data[i].subscribers[j]);
                    }
                }
                if (data[i].owner) {
                    data[i].owner = new MagnetJS.User(data[i].owner);
                }
                channelSummaries.push(data[i]);
            }
        }

        def.resolve(channelSummaries, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.Channel.getChannel = function(channelName, userId) {
    var def = new MagnetJS.Deferred();
    var msgId = MagnetJS.Utils.getCleanGUID();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session timeout');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: userId,
                topicName: channelName
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: msgId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'getTopic', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);
                var payload, channel;

                if (json.mmx) {
                    payload = JSON.parse(json.mmx);
                    channel = new MagnetJS.Channel(payload);
                }

                def.resolve(channel);
            }, null, null, null, msgId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.getAllSubscribers = function() {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var users = [];

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: self.userId,     // null for global topic, or a user topic under a user ID
                topicName: self.name,    // without /appID/* or /appID/userID
                limit: -1,               // -1 for unlimited, or > 0
                offset: 0                // offset starting from zero
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'getSubscribers', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                payload = (json.mmx && json.mmx.__text) ? JSON.parse(json.mmx.__text) : JSON.parse(json.mmx);
                if (payload && payload.subscribers && payload.subscribers.length) {
                    for (var i=0;i<payload.subscribers.length;++i) {
                        users.push(new MagnetJS.User(payload.subscribers[i]));
                    }
                }

                def.resolve(users);
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.addSubscribers = function(subscribers) {
    var self = this;
    var subscriberlist = [];
    var def = new MagnetJS.Deferred();

    setTimeout(function() {
        if (!self.name) return def.reject('invalid channel');
        if (!self.isOwner() && self.isPrivate()) return def.reject('insufficient privileges');

        for (var i in subscribers)
            subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/'+self.name+'/subscribers/add',
            data: {
                privateChannel: self.isPrivate(),
                subscribers: subscriberlist
            }
        }, function() {
            def.resolve.apply(def, arguments);
        }, function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.removeSubscribers = function(subscribers) {
    var self = this;
    var subscriberlist = [];
    var def = new MagnetJS.Deferred();

    setTimeout(function() {
        if (!self.name) return def.reject('invalid channel');
        if (!self.isOwner() && self.isPrivate()) return def.reject('insufficient privileges');

        for (var i in subscribers)
            subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/'+self.name+'/subscribers/remove',
            data: {
                privateChannel: self.isPrivate(),
                subscribers: subscriberlist
            }
        }, function() {
            def.resolve.apply(def, arguments);
        }, function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.subscribe = function() {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: self.userId,     // null for global topic, or a user topic under a user ID
                topicName: self.name,    // without /appID/* or /appID/userID
                devId: null,             // null for any devices, or a specific device
                errorOnDup: false        // true to report error if duplicated subscription, false (default) to not report error
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'subscribe', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                if (json.mmx)
                    payload = JSON.parse(json.mmx);

                def.resolve(payload);
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.unsubscribe = function() {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: self.userId,        // null for global topic, or a user topic under a user ID
                topicName: self.name,       // without /appID/* or /appID/userID
                subscriptionId: null        // | a-subscription-ID  // null for all subscriptions to the topic
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'unsubscribe', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                if (json.mmx)
                    payload = JSON.parse(json.mmx);

                def.resolve(payload);
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.publish = function(mmxMessage, attachments) {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var messageId = MagnetJS.Utils.getCleanGUID();
    var dt = MagnetJS.Utils.dateToISO8601(new Date());

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        function sendMessage(msgMeta) {
            try {
                var meta = JSON.stringify(msgMeta);
                var mmxMeta = {
                    From: {
                        userId: mCurrentUser.userIdentifier,
                        devId: mCurrentDevice.deviceId,
                        displayName: mCurrentUser.userName
                    }
                };
                mmxMeta = JSON.stringify(mmxMeta);

                var payload = $iq({to: 'pubsub.mmx', from: mCurrentUser.jid, type: 'set', id: iqId})
                    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                    .c('publish', {node: self.getNodePath()})
                    .c('item', {id: messageId})
                    .c('mmx', {xmlns: 'com.magnet:msg:payload'})
                    .c('mmxmeta', mmxMeta).up()
                    .c('meta', meta).up()
                    .c('payload', {mtype: 'unknown', stamp: dt, chunk: '0/0/0'});

                mXMPPConnection.addHandler(function(msg) {
                    var json = x2js.xml2json(msg);

                    if (json.error)
                        return def.reject(json.error._code + ' : ' + json.error._type);

                    def.resolve('ok');
                }, null, null, null, iqId, null);

                mXMPPConnection.send(payload.tree());

            } catch (e) {
                def.reject(e);
            }
        }

        if (!attachments) return sendMessage(mmxMessage.messageContent);

        new MagnetJS.Uploader(attachments, function(e, multipart) {
            if (e || !multipart) return def.reject(e);

            multipart.upload(self, iqId).success(function(attachments) {
                sendMessage(MagnetJS.Utils.mergeObj(mmxMessage.messageContent || {}, {
                    _attachments: JSON.stringify(attachments)
                }));
            }).error(function(e) {
                def.reject(e);
            });
        });
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.delete = function() {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                topicName: self.name,                   // without /appID/* or /appID/userID
                isPersonal: self.userId ? true : false  // true for personal user topic, false for global topic
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'deletetopic', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                if (json.mmx)
                    payload = JSON.parse(json.mmx);

                def.resolve(payload);
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.isOwner = function() {
    return this.userId == mCurrentUser.userIdentifier || this.creator == Strophe.getBareJidFromJid(mCurrentUser.jid);
};

MagnetJS.Channel.prototype.isPrivate = function() {
    return this.privateChannel === true;
};

MagnetJS.Channel.prototype.getChannelName = function() {
    return this.privateChannel === true ? (this.userId + '#' + this.name) : this.name;
};

MagnetJS.Channel.prototype.getNodePath = function() {
    return '/' + MagnetJS.App.appId + '/' + (this.userId ? this.userId : '*') + '/' + this.name.toLowerCase();
};

MagnetJS.PubSubManager = {
    store: {},
    add: function(id, cb) {
        this.store[id] = cb;
    },
    run: function(id, meta) {
        if (this.store[id]) {
            this.store[id](meta);
            this.remove(id);
        }
    },
    remove: function(id) {
        delete this.store[id];
    },
    clear: function() {
        this.store = {};
    }
};
