/**
 * @constructor
 * @class
 * The Channel class is the local representation of a channel. This class provides
 * various channel specific methods, like publishing and subscribing users.
 * @param {object} channelObj An object containing channel information.
 * @property {string} name The name of the channel.
 * @property {boolean} isPublic True if the channel public.
 * @property {string} [summary] An optional summary of the channel.
 * @property {string} [publishPermission] Permissions level required to be able to post, must be in
 * ['anyone', 'owner', 'subscribers']. The channel owner can always publish.
 * @property {string} [ownerUserID] The userID for the owner/creator of the channel.
 */
MagnetJS.Channel = function(channelObj) {
    if (channelObj.topicName) {
        channelObj.name = channelObj.topicName;
        delete channelObj.topicName;
    }
    if (channelObj.creator && channelObj.creator.indexOf('%') != -1)
        channelObj.creator = channelObj.creator.split('%')[0];
    if (channelObj.creator) {
        channelObj.ownerUserID = channelObj.creator;
        delete channelObj.creator;
    }
    if (channelObj.userId) {
        channelObj.ownerUserID = channelObj.userId;
    }
    if (channelObj.description) {
        channelObj.summary = channelObj.description;
        delete channelObj.description;
    }
    if (channelObj.publisherType) {
        channelObj.publishPermissions = channelObj.publisherType;
        delete channelObj.publisherType;
    }
    if (channelObj.privateChannel !== false && channelObj.privateChannel !== true)
        channelObj.privateChannel = channelObj.userId ? true : false;
    if (channelObj.privateChannel === true)
        channelObj.userId = channelObj.userId || channelObj.ownerUserID;
    if (channelObj.privateChannel === false)
        delete channelObj.userId;

    channelObj.isPublic = !channelObj.privateChannel;
    delete channelObj.privateChannel;

    MagnetJS.Utils.mergeObj(this, channelObj);

    return this;
};

/**
 * Find public channels based on search criteria.
 * @param {string} [channelName] The name of the channel.
 * @param {string[]} [tags] An array of tags to filter by.
 * @param {number} [limit] The number of users to return in the request. Defaults to 10.
 * @param {number} [offset]	The starting index of users to return.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.findPublicChannels = function(channelName, tags, limit, offset) {
    return MagnetJS.Channel.findChannels(channelName, tags, limit, offset, 'public');
};

/**
 * Find private channels based on search criteria. Only private channels created by the current
 * user will be returned.
 * @param {string} [channelName] The name of the channel.
 * @param {string[]} [tags] An array of tags to filter by.
 * @param {number} [limit] The number of users to return in the request. Defaults to 10.
 * @param {number} [offset]	The starting index of users to return.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.findPrivateChannels = function(channelName, tags, limit, offset) {
    return MagnetJS.Channel.findChannels(channelName, tags, limit, offset, 'private');
};

/**
 * Find public or  channels that start with the specified text.
 * @param {string} [channelName] The name of the channel.
 * @param {string[]} [tags] An array of tags to filter by.
 * @param {number} [limit] The number of users to return in the request. Defaults to 10.
 * @param {number} [offset]	The starting index of users to return.
 * @param {string} [type] The type of search. Must be in ['private', 'public', 'both']. Defaults to both.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.findChannels = function(channelName, tags, limit, offset, type) {
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var channels = [];
    limit = limit || 10;
    offset = offset || 0;
    type = type || 'both';
    type = type == 'private' ? 'personal' : type;
    type = type == 'public' ? 'global' : type;

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                operator: 'AND',
                limit: limit,     // -1 for max # of records imposed by system, or > 0
                offset: offset,
                type: type
            };
            if (channelName)
                mmxMeta.topicName = {
                    match: 'EXACT',
                    value: channelName
                };
            if (tags && tags.length)
                mmxMeta.tags = {
                    match: 'EXACT',
                    value: tags
                };
            /*
                description: {
                    match: EXACT|PREFIX|SUFFIX,     // optional
                    value: topic description
                },
                t
             */

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'searchTopic', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                if (json.mmx) {
                    payload = (json.mmx && json.mmx.__text) ? JSON.parse(json.mmx.__text) : JSON.parse(json.mmx);
                    if (payload && payload.results && payload.results) {
                        payload.results = MagnetJS.Utils.objToObjAry(payload.results);
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
 * @param {string} [channelObj.summary] An optional summary of the channel.
 * @param {boolean} [channelObj.isPublic] Set to true to make the channel public. Defaults to true.
 * @param {string} [channelObj.publishPermission] Permissions level required to be able to post, must be in
 * ['anyone', 'owner', 'subscribers']. The channel owner can always publish.
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
        channelObj.ownerId = mCurrentUser.userId;
        channelObj.privateChannel = (channelObj.isPublic === true || channelObj.isPublic === false)
            ? !channelObj.isPublic : false;
        channelObj.creationDate = dt;
        channelObj.lastTimeActive = dt;
        if (channelObj.summary) channelObj.description = channelObj.summary;
        if (channelObj.privateChannel) channelObj.userId = mCurrentUser.userId;

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/create',
            data: channelObj
        }, function (data, details) {
            delete channelObj.ownerId;
            delete channelObj.channelName;
            channelObj.creator = mCurrentUser.userId;

            def.resolve(new MagnetJS.Channel(channelObj), details);
        }, function () {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Get all the channels the current user is the subscribed to. The returned {MagnetJS.Channel} object
 * only contains basic channel information. Use the {MagnetJS.Channel.getPublicChannel} and
 * {MagnetJS.Channel.getPrivateChannel} methods to obtain the full information.
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
                    var subs = MagnetJS.Utils.objToObjAry(json.pubsub.subscriptions.subscription);
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
        subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userId : subscribers[i]);

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
            privateChannel: !channelOrChannels[i].isPublic
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
                    data[i].messages = parseMessageList(data[i].messages, data[i].channel);
                    data[i].subscribers = MagnetJS.Utils.objToObjAry(data[i].subscribers);
                    for (j = 0; j < data[i].subscribers.length; ++j)
                        data[i].subscribers[j] = new MagnetJS.User(data[i].subscribers[j]);

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

// converts an ary of message data into Message object
function parseMessageList(ary, channel) {
    if (!ary) return [];
    if (!MagnetJS.Utils.isArray(ary)) ary = [ary];
    for (j = 0; j < ary.length; ++j) {
        var mmxMsg = new MagnetJS.Message();
        mmxMsg.sender = new MagnetJS.User(ary[j].publisher);
        mmxMsg.timestamp = MagnetJS.Utils.ISO8601ToDate(ary[j].metaData.creationDate);
        mmxMsg.channel = channel;
        mmxMsg.messageID = ary[j].itemId;
        if (ary[j].content) {
            attachmentRefsToAttachment(mmxMsg, ary[j].content);
            mmxMsg.messageContent = ary[j].content;
        }
        ary[j] = mmxMsg;
    }
    return ary;
}

/**
 * Get the basic information about a private channel. Only private channels created by the current
 * user will be returned.
 * @param {string} channelName The channel name.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.getPrivateChannel = function(channelName) {
    return MagnetJS.Channel.getChannel(channelName, mCurrentUser.userId);
};

/**
 * Get the basic information about a public channel.
 * @param {string} channelName The channel name.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 */
MagnetJS.Channel.getPublicChannel = function(channelName) {
    return MagnetJS.Channel.getChannel(channelName);
};

/**
 * Get the basic channel information.
 * @param {string} channelName The channel name.
 * @param {string} [userId] The userId of the channel owner if the channel is private.
 * @returns {MagnetJS.Promise} A promise object returning a {MagnetJS.Channel} or reason of failure.
 * @ignore
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
 * @param {number} [limit] The number of users to return in the request. Defaults to 10.
 * @param {number} [offset]	The starting index of users to return.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.User} or reason of failure.
 */
MagnetJS.Channel.prototype.getAllSubscribers = function(limit, offset) {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    var users = [];
    limit = limit || 10;
    offset = offset || 0;

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: self.userId,     // null for global topic, or a user topic under a user ID
                topicName: self.name,    // without /appID/* or /appID/userID
                limit: limit,            // -1 for unlimited, or > 0
                offset: offset           // offset starting from zero
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'getSubscribers', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg) {
                var payload, json = x2js.xml2json(msg);

                payload = (json.mmx && json.mmx.__text) ? JSON.parse(json.mmx.__text) : JSON.parse(json.mmx);
                if (payload && payload.subscribers) {
                    payload.subscribers = MagnetJS.Utils.objToObjAry(payload.subscribers);
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
        if (!self.isOwner() && !self.isPublic) return def.reject('insufficient privileges');

        for (var i in subscribers)
            subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userId : subscribers[i]);

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/'+self.name+'/subscribers/add',
            data: {
                privateChannel: !self.isPublic,
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
        if (!self.isOwner() && !self.isPublic) return def.reject('insufficient privileges');

        for (var i in subscribers)
            subscriberlist.push(MagnetJS.Utils.isObject(subscribers[i]) ? subscribers[i].userId : subscribers[i]);

        MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/channel/'+self.name+'/subscribers/remove',
            data: {
                privateChannel: !self.isPublic,
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
 * @returns {MagnetJS.Promise} A promise object returning subscription Id or reason of failure.
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

                def.resolve(payload.subscriptionId);
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

                def.resolve(payload.message);
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
    self.msgId = MagnetJS.Utils.getCleanGUID()+'c';
    var dt = MagnetJS.Utils.dateToISO8601(new Date());

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        function sendMessage(msgMeta) {
            try {
                var meta = JSON.stringify(msgMeta);
                var mmxMeta = {
                    From: {
                        userId: mCurrentUser.userId,
                        devId: mCurrentDevice.deviceId,
                        displayName: mCurrentUser.userName
                    }
                };
                mmxMeta = JSON.stringify(mmxMeta);

                var payload = $iq({to: 'pubsub.mmx', from: mCurrentUser.jid, type: 'set', id: iqId})
                    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                    .c('publish', {node: self.getNodePath()})
                    .c('item', {id: self.msgId})
                    .c('mmx', {xmlns: 'com.magnet:msg:payload'})
                    .c('mmxmeta', mmxMeta).up()
                    .c('meta', meta).up()
                    .c('payload', {mtype: 'unknown', stamp: dt, chunk: '0/0/0'});

                mXMPPConnection.addHandler(function(msg) {
                    var json = x2js.xml2json(msg);

                    if (json.error)
                        return def.reject(json.error._code + ' : ' + json.error._type);

                    def.resolve(self.msgId);
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
 * Retrieve all of the messages for this channel within date range.
 * @param {Date} [startDate] Filter based on start date, or null for no filter.
 * @param {Date} [endDate] Filter based on end date, or null for no filter.
 * @param {number} [limit] The number of messages to return in the request.
 * @param {number} [offset]	The starting index of messages to return.
 * @param {boolean} [ascending] Set to false to sort by descending order. Defaults to true.
 * @returns {MagnetJS.Promise} A promise object returning a list of {MagnetJS.Message} and total number of messages
 * payloador reason of failure.
 */
MagnetJS.Channel.prototype.getMessages = function(startDate, endDate, limit, offset, ascending) {
    var self = this;
    var def = new MagnetJS.Deferred();
    var iqId = MagnetJS.Utils.getCleanGUID();
    startDate = MagnetJS.Utils.dateToISO8601(startDate);
    endDate = MagnetJS.Utils.dateToISO8601(endDate);
    limit = limit || 10;
    offset = offset || 0;
    ascending = typeof ascending !== 'boolean' ? true : ascending;

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session timeout');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');

        try {
            var mmxMeta = {
                userId: self.userId,         // null for global topic, or a user topic under a user ID
                topicName: self.name,        // without /appID/* or /appID/userID
                options: {
                    subscriptionId: null,    // optional (if null, any subscriptions to the topic will be assumed)
                    since: startDate,        // optional (inclusive, 2015-03-06T13:23:45.783Z)
                    until: endDate,          // optional (inclusive)
                    ascending: ascending,    // optional.  Default is false (i.e. descending)
                    maxItems: limit,         // optional.  -1 (default) for system specified max, or > 0.
                    offset: offset           // optional.  offset starting from zero
                }
            };

            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: iqId})
                .c('mmx', {xmlns: 'com.magnet:pubsub', command: 'fetch', ctype: 'application/json'}, mmxMeta);

            mXMPPConnection.addHandler(function(msg, json) {
                json = json || x2js.xml2json(msg);

                if (json.mmx) {
                    payload = (json.mmx && json.mmx.__text) ? JSON.parse(json.mmx.__text) : JSON.parse(json.mmx);
                    if (payload) {
                        payload.items = MagnetJS.Utils.objToObjAry(payload.items);
                        formatMessage([], self, payload.items, 0, function(messages) {
                            def.resolve(messages, payload.totalCount);
                        });
                    }
                }
            }, null, null, null, iqId,  null);

            mXMPPConnection.send(payload.tree());

        } catch (e) {
            def.reject(e);
        }
    }, 0);

    return def.promise;
};

// recursively convert message metadata into Message object
function formatMessage(messages, channel, msgAry, index, cb) {
    if (!msgAry[index] || !msgAry[index].payloadXML) return cb(messages);
    var jsonObj = x2js.xml_str2json(msgAry[index].payloadXML);
    var mmxMsg = new MagnetJS.Message();

    mmxMsg.formatMessage(jsonObj, channel, function() {
        mmxMsg.messageID = msgAry[index].itemId;
        messages.push(mmxMsg);
        formatMessage(messages, channel, msgAry, ++index, cb);
    });
}

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

                def.resolve(payload.message);
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
    return this.userId == mCurrentUser.userId || (this.ownerUserID && this.ownerUserID == mCurrentUser.userId);
};

/**
 * Get the formal channel name used by REST APIs.
 * @returns {string} The formal channel name.
 * @ignore
 */
MagnetJS.Channel.prototype.getChannelName = function() {
    return this.isPublic === true ? this.name : (this.userId + '#' + this.name);
};

/**
 * Get the pubsub node path of the given channel
 * @returns {string} A pubsub node path.
 * @ignore
 */
MagnetJS.Channel.prototype.getNodePath = function() {
    return '/' + MagnetJS.App.appId + '/' + (this.userId ? this.userId : '*') + '/' + this.name.toLowerCase();
};
