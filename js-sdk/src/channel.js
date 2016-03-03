/**
 * @constructor
 * @class
 * The Channel class is the local representation of a channel. This class provides
 * various channel specific methods, like publishing and subscribing users.
 */
MagnetJS.Channel = function(channelObj) {
    if (channelObj.topicName) {
        channelObj.name = channelObj.topicName;
        delete channelObj.topicName;
    }

    if (channelObj.creator && channelObj.creator.indexOf('%') != -1)
        channelObj.creator = channelObj.creator.split('%')[0];

    channelObj.privateChannel = channelObj.userId ? true : false;
    MagnetJS.Utils.mergeObj(this, channelObj);

    return this;
};

/**
 * Find the public channels that start with the specified text.
 * @param {string} channelName The name of the channel.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.Channel} or reason of failure.
 */
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

/**
 * Create a public or private channel.
 * @param {object} channelObj An object containing channel information.
 * @param {string} channelObj.name The name of the channel.
 * @param {boolean} channelObj.private Set to true to make the channel private.
 * @param {boolean} channelObj.subscribe Automatically subscribe the current user upon channel creation.
 * @returns {MagnetJS.Promise} A promise object returning the new {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.create = function(channelObj) {
    var def = new MagnetJS.Deferred();
    var dt = MagnetJS.Utils.dateToISO8601(new Date());

    setTimeout(function() {
        if (!channelObj.name)
            return def.reject('channel name required');
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

/**
 * Get all the channels the current user is the subscribed to.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.Channel} (containing basic information
 * only) or reason of failure.
 */
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

/**
 * Get channels the given subscribers are subscribed to.
 * @param {string[]|MagnetJS.User[]} subscribers A list of userId or {MagnetJS.User} objects.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.Channel} (containing basic information
 * only) or reason of failure.
 */
MagnetJS.Channel.findChannelsBySubscribers = function(subscribers) {
    var def = new MagnetJS.Deferred();
    var subscriberlist = [];
    var channels = [];

    if (!MagnetJS.Utils.isArray(subscribers))
        subscribers = [subscribers];

    for (var i in subscribers)
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userIdentifier : subscribers[i]);

    setTimeout(function() {
        MagnetJS.Request({
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
    }, 0);

    return def.promise;
};

/**
 * Get the extended channel information, including a summary of subscribers and chat history.
 * @param {MagnetJS.Channel|MagnetJS.Channel[]} channelOrChannels One or more channels.
 * @param {number} subscriberCount The number of subscribers to return.
 * @param {number} messageCount The number of messages to return.
 * @returns {MagnetJS.Promise} A promise object returning a list of channel summaries or reason of failure.
 */
MagnetJS.Channel.getChannelSummary = function(channelOrChannels, subscriberCount, messageCount) {
    var def = new MagnetJS.Deferred();
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

    setTimeout(function() {
        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/summary',
            data: {
                channelIds: channelIds,
                numOfSubcribers: subscriberCount,
                numOfMessages: messageCount
            }
        }, function (data, details) {
            var i, j;
            if (data && data.length) {
                for (i = 0; i < data.length; ++i) {
                    if (data[i].owner) {
                        // TODO: this is quick fix until server bug is fixed
                        if (data[i].userId)
                            data[i].owner = {
                                userId: data[i].userId
                            };
                        data[i].owner = new MagnetJS.User(data[i].owner);
                    }
                    data[i].channel = new MagnetJS.Channel({
                        name: data[i].channelName,
                        userId: (data[i].owner && data[i].owner.userId) ? data[i].owner.userId : null
                    });
                    if (data[i].messages && data[i].messages.length) {
                        for (j = 0; j < data[i].messages.length; ++j) {
                            var mmxMsg = new MagnetJS.Message();
                            mmxMsg.sender = new MagnetJS.User(data[i].messages[j].publisher);
                            mmxMsg.timestamp = data[i].messages[j].metaData.creationDate;
                            mmxMsg.channel = data[i].channel;
                            mmxMsg.messageID = data[i].messages[j].itemId;
                            if (data[i].messages[j].content) {
                                attachmentRefsToAttachment(mmxMsg, data[i].messages[j].content);
                                mmxMsg.messageContent = data[i].messages[j].content;
                            }
                            data[i].messages[j] = mmxMsg;
                        }
                    }
                    if (data[i].subscribers && data[i].subscribers.length) {
                        for (j = 0; j < data[i].subscribers.length; ++j) {
                            data[i].subscribers[j] = new MagnetJS.User(data[i].subscribers[j]);
                        }
                    }
                    channelSummaries.push(data[i]);
                }
            }

            def.resolve(channelSummaries, details);
        }, function () {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Get the basic channel information.
 * @param {string} channelName The channel name.
 * @param {string} [userId] The userId of the channel owner if the channel is private.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 */
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

/**
 * Get a list of the users subscribed to the channel.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.User} or reason of failure.
 */
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

/**
 * Add the given subscribers to the channel.
 * @param {string[]|MagnetJS.User[]} subscribers A list of userId or {MagnetJS.User} objects.
 * @returns {MagnetJS.Promise} A promise object returning success report or reason of failure.
 */
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

/**
 * Unsubscribe the given subscribers from the channel.
 * @param {string[]|MagnetJS.User[]} subscribers A list of subscribers to unsubscribe from the channel.
 * @returns {MagnetJS.Promise} A promise object returning success report or reason of failure.
 */
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

/**
 * Subscribe the current userto the channel.
 * @returns {MagnetJS.Promise} A promise object returning success report or reason of failure.
 */
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

/**
 * Unsubscribe the current user from the channel.
 * @returns {MagnetJS.Promise} A promise object returning success report or reason of failure.
 */
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

/**
 * Publish a message and/or attachments to the channel.
 * @param {MagnetJS.Message} mmxMessage A {MagnetJS.Message} instance containing message payload.
 * @param {FileUpload|FileUpload[]} [attachments] A FileUpload object created by an input[type="file"] HTML element.
 * @returns {MagnetJS.Promise} A promise object returning "ok" or reason of failure.
 */
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

/**
 * Delete this channel
 * @returns {MagnetJS.Promise} A promise object returning success report or reason of failure.
 */
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

/**
 * Determines if the currently logged in user is the owner of the channel.
 * @returns {boolean} True if the currently logged in user is the owner of the channel.
 */
MagnetJS.Channel.prototype.isOwner = function() {
    return this.userId == mCurrentUser.userIdentifier || (this.creator && this.creator == Strophe.getBareJidFromJid(mCurrentUser.jid));
};

/**
 * Determines if the channel is private.
 * @returns {boolean} True if the channel is private.
 */
MagnetJS.Channel.prototype.isPrivate = function() {
    return this.privateChannel === true;
};

/**
 * Get the formal channel name used by REST APIs.
 * @returns {string} The formal channel name.
 * @ignore
 */
MagnetJS.Channel.prototype.getChannelName = function() {
    return this.privateChannel === true ? (this.userId + '#' + this.name) : this.name;
};

/**
 * Get the pubsub node path of the given channel
 * @returns {string} A pubsub node path.
 * @ignore
 */
MagnetJS.Channel.prototype.getNodePath = function() {
    return '/' + MagnetJS.App.appId + '/' + (this.userId ? this.userId : '*') + '/' + this.name.toLowerCase();
};
