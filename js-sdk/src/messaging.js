
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
    connect: function(password) {
        var def = new MagnetJS.Deferred();

        mXMPPConnection = new Strophe.Connection(MagnetJS.Config.httpBindEndpoint);

        mXMPPConnection.rawInput = function(data) {
            if (MagnetJS.Config.payloadLogging)
                MagnetJS.Log.fine('RECV: ' + data);
        };
        mXMPPConnection.rawOutput = function(data) {
            if (MagnetJS.Config.payloadLogging)
                MagnetJS.Log.fine('SENT: ' + data);
        };

        mCurrentUser.jid = mCurrentUser.userIdentifier + "%" + MagnetJS.App.appId +
            '@' + MagnetJS.Config.mmxDomain + '/' + mCurrentDevice.deviceId;

        mXMPPConnection.connect(mCurrentUser.jid, password, function(status) {
            if (status == Strophe.Status.CONNECTING) {
                MagnetJS.Log.fine('MMX is connecting.');
            } else if (status == Strophe.Status.CONNFAIL) {
                MagnetJS.Log.fine('MMX failed to connect.');
            } else if (status == Strophe.Status.DISCONNECTING) {
                MagnetJS.Log.fine('MMX is disconnecting.');
            } else if (status == Strophe.Status.DISCONNECTED) {
                MagnetJS.Log.info('MMX is disconnected.');
            } else if (status == Strophe.Status.CONNECTED) {
                MagnetJS.Log.info('MMX is connected.');
                mXMPPConnection.send($pres());
                if (!mCurrentUser.connected) {
                    mCurrentUser.connected = true;
                    def.resolve();
                }
            }
        });

        return def.promise;
    }
};

MagnetJS.Message = function(contents, recipientOrRecipients) {
    this.meta = {};
    this.recipients = [];
    if (contents) {
        this.messageContent = contents;
    }
    if (recipientOrRecipients) {
        if (MagnetJS.Utils.isArray(recipientOrRecipients)) {
            for (var i=0;i<recipientOrRecipients.length;++i) {
                this.recipients.push(this.formatUser(recipientOrRecipients[i]));
            }
        } else {
            this.recipients.push(this.formatUser(recipientOrRecipients));
        }
    }
    if (mCurrentUser) {
        this.sender = {
            userId: mCurrentUser.userIdentifier
        };
    }
    return this;
};

MagnetJS.Message.prototype.formatUser = function(userOrUserId) {
    if (typeof userOrUserId == 'string') {
        return {
            userId: userOrUserId
        };
    }
    return {
        userId: userOrUserId.userIdentifier
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
            this.messageContent = JSON.parse(msg.mmx.meta);
            // TODO: handle attachments
            delete this.messageContent._attachments;
        }

        if (msg.mmx && msg.mmx.mmxmeta) {
            var mmxMeta = JSON.parse(msg.mmx.mmxmeta);
            this.recipients = mmxMeta.To;
            this.sender = mmxMeta.From;
        }

        if (msg.mmx && msg.mmx.payload) {
            this.timestamp = msg.mmx.payload._stamp;
        }

        if (msg.event && msg.event.items && msg.event.items._node) {
            nodePathToChannel(msg.event.items._node, function(e, channel) {
                self.channel = channel;
                cb();
            });
        } else {
            cb();
        }

    } catch(e) {
        console.log('MMXMessage.formatMessage', e);
    }
};

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

        if (!mXMPPConnection.connected) {
            // TODO: replace with reliable offline
        }

        self.sender = {
            userId: mCurrentUser.userIdentifier
        };

        try {
            var meta = JSON.stringify(self.messageContent);
            var mmxMeta = {
                To: self.recipients,
                From: self.sender,
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
    var qs = '';
    var channels = [];

    if (typeof channelName == 'string')
        qs += '?channelName=' + channelName;

    var def = MagnetJS.Request({
        method: 'GET',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels' + qs
    }, function(data, details) {
        for (var i=0;i<data.results.length;++i) {
            channels.push(new MagnetJS.Channel(data.results[i]));
        }
        def.resolve.apply(def, [channels, details]);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.Channel.create = function(channelObj, cb) {
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
        channelObj.privateChannel = (channelObj.private === true || channelObj.private === false) ? channelObj.private : false;
        channelObj.subscribeOnCreate = (channelObj.subscribe === true || channelObj.subscribe === false) ? channelObj.subscribe : true;
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

            def.resolve.apply(def, [new MagnetJS.Channel(channelObj), details]);
        }, function () {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

// FIXME: this is an old API?
//    MagnetJS.Channel.getAllSubscriptions = function(cb) {
//        $.ajax({
//            method: 'GET',
//            url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/my_subscriptions',
//            beforeSend: function(xhr) {
//               xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
//            }
//        }).done(function(data) {
//            cb(null, data);
//        }).fail(function(err) {
//            cb(err);
//        });
//    };

MagnetJS.Channel.getAllSubscriptions = function(cb) {
    if (!mCurrentUser) return cb('not logged in!');
    var messageId = MagnetJS.Utils.getCleanGUID();
    if (mXMPPConnection.connected) {
        try {
            var mmxMeta = {
                limit: -1,        // -1 for unlimited (or not specified), or > 0
                recursive: true,           // true for all descendants, false for immediate children only
                topic: null, // null from the root, or a starting topic
                type: 'both'  // type of topics to be listed global/personal/both
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: messageId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'listtopics', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);
                var payload, channels = [];
                if (json.mmx) {
                    payload = JSON.parse(json.mmx);
                    if (payload.length) {
                        for (var i=0;i<payload.length;++i) {
                            channels.push(new MagnetJS.Channel(payload[i]));
                        }
                    }
                }
                cb(null, payload);
            }, null, null, null, messageId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            console.log(e);
        }
    } else if (mXMPPConnection.messageQueue) {
        // TODO: add to queue
        // return cb();
    } else {
        cb('not connected');
    }
};

MagnetJS.Channel.findChannelsBySubscribers = function(subscribers, cb) {
    var subscriberlist = [];
    for (var i in subscribers) {
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);
    }
    $.ajax({
        method: 'POST',
        url: 'http://localhost:7777/api/com.magnet.server/channel/query',
        data: JSON.stringify({
            subscribers: subscriberlist,
            matchFilter: 'EXACT_MATCH'
        }),
        contentType: 'application/json',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(result) {
        var channels = [];
        if (result.channels && result.channels.length) {
            for (var i=0;i<result.channels.length;++i) {
                channels.push(new MagnetJS.Channel(result.channels[i]));
            }
        }
        cb(null, channels);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.Channel.getChannelSummary = function(channelOrChannels, subscriberCount, messageCount, cb) {
    if (!MagnetJS.Utils.isArray(channelOrChannels)) channelOrChannels = [channelOrChannels];
    var channelIds = [];
    for (var i=0;i<channelOrChannels.length;++i) {
        channelIds.push({
            channelName: channelOrChannels[i].name,
            userId: channelOrChannels[i].userId,
            privateChannel: channelOrChannels[i].privateChannel
        });
    }
    $.ajax({
        method: 'POST',
        url: 'http://localhost:7777/api/com.magnet.server/channel/summary',
        data: JSON.stringify({
            channelIds: channelIds,
            numOfSubcribers: subscriberCount,
            numOfMessages: messageCount
        }),
        contentType: 'application/json',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(result) {
        var channelSummaries = [];
        if (result && result.length) {
            for (var i=0;i<result.length;++i) {
                channelSummaries.push(result[i]);
            }
        }
        cb(null, channelSummaries);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.Channel.getChannel = function(channelName, cb) {
    MagnetJS.Request({
        method: 'GET',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/'+encodeURIComponent(channelName)
    }, function(data) {
        cb(null, new MagnetJS.Channel(data));
    }, function() {
        cb(e);
    });
};

MagnetJS.Channel.prototype.getAllSubscribers = function(cb) {
    if (!this.name) return cb('invalid channel');
    $.ajax({
        method: 'GET',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/'+encodeURIComponent(this.getChannelName())+'/subscriptions',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(data) {
        cb(null, data);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.Channel.prototype.getChannelDetail = function() {

};

MagnetJS.Channel.prototype.addSubscribers = function(subscribers, cb) {
    if (!this.name) return cb('invalid channel');
    if (!this.isOwner() && this.isPrivate()) return cb('insufficient privileges');
    var subscriberlist = [];
    for (var i in subscribers) {
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);
    }
    $.ajax({
        method: 'POST',
        url: 'http://localhost:7777/api/com.magnet.server/channel/'+this.name+'/subscribers/add',
        data: JSON.stringify({
            privateChannel: this.isPrivate(),
            subscribers: subscriberlist
        }),
        contentType: 'application/json',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(data) {
        cb(null, data);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.Channel.prototype.removeSubscribers = function(subscribers, cb) {
    if (!this.name) return cb('invalid channel');
    if (!this.isOwner() && this.isPrivate()) return cb('insufficient privileges');
    var subscriberlist = [];
    for (var i in subscribers) {
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);
    }
    $.ajax({
        method: 'POST',
        url: 'http://localhost:7777/api/com.magnet.server/channel/'+this.name+'/subscribers/remove',
        data: JSON.stringify({
            privateChannel: this.isPrivate(),
            subscribers: subscriberlist
        }),
        contentType: 'application/json',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(data) {
        cb(null, data);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.Channel.prototype.subscribe = function() {
    var def = MagnetJS.Request({
        method: 'PUT',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/'+encodeURIComponent(this.getChannelName())+'/subscribe'
    }, function(data, details) {
        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.Channel.prototype.unsubscribe = function() {
    var def = MagnetJS.Request({
        method: 'PUT',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/'+encodeURIComponent(this.getChannelName())+'/unsubscribe'
    }, function(data, details) {
        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.Channel.prototype.publish = function(mmxMessage) {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var messageId = MagnetJS.Utils.getCleanGUID();
    var dt = MagnetJS.Utils.dateToISO8601(new Date());
    var attachments = [];

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection.connected) return def.reject('not connected');

        try {
            var meta = JSON.stringify(mmxMessage.messageContent);
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

            // TODO: add attachments via:  "_attachments": "[ ... ]"

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);

                if (json.error)
                    return def.reject(json.error._code + ' : ' + json.error._type);

                def.resolve('ok');
            }, null, null, null, iqId, null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {console.log(e);
            def.reject(e);
        }

    }, 0);

    return def.promise;
};

MagnetJS.Channel.prototype.delete = function(cb) {
    var qs = '';
    if (!this.name) return cb('invalid channel');
    if (this.privateChannel) qs += '?personal=true';
    $.ajax({
        method: 'DELETE',
        url: 'http://localhost:1337/localhost:5220/mmxmgmt/api/v2/channels/'+this.name + qs,
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(data) {
        cb(null, data);
    }).fail(function(err) {
        cb(err);
    });
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

function nodePathToChannel(nodeStr, cb) {
    nodeStr = nodeStr.split('/');
    if (nodeStr.length !== 4) return cb('invalid node path');

    var name = nodeStr[nodeStr.length-1];
    var userId = nodeStr[nodeStr.length-2];

    return MagnetJS.Channel.getChannel(userId == '*' ? name : (userId + '#' + name));
}

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
