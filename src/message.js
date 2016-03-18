var x2js = new X2JS();

/**
 * @method
 * @desc Start receiving messages.
 */
Max.start = function() {
    Max.App.receiving = true;
    if (mXMPPConnection) mXMPPConnection.priority = 0;
};

/**
 * @method
 * @desc Stop receiving messages.
 */
Max.stop = function() {
    Max.App.receiving = false;
    if (mXMPPConnection) mXMPPConnection.priority = -255;
};

/**
 * @method
 * @desc Register a listener to handle incoming messages.
 * @param {Max.MessageListener} listener A message listener.
 */
Max.registerListener = function(listener) {
    xmppStore = xmppStore || {};
    xmppStore[listener.id] = mXMPPConnection.addHandler(function(msg) {

        var jsonObj = x2js.xml2json(msg);
        var mmxMsg = new Max.Message();

        mmxMsg.formatMessage(jsonObj, null, function() {
            listener.handler(mmxMsg);
        });
        return true;

    }, null, 'message', null, null,  null);
};

/**
 * @method
 * @desc Unregister a listener identified by the given id to stop handling incoming messages.
 * @param {string|Max.MessageListener} listenerOrListenerId A message listener or the listener Id specified
 * during creation.
 */
Max.unregisterListener = function(listenerOrListenerId) {
    if (!xmppStore || !listenerOrListenerId || !mXMPPConnection) return;
    if (typeof listenerOrListenerId === 'object') listenerOrListenerId = listenerOrListenerId.id;
    mXMPPConnection.deleteHandler(xmppStore[listenerOrListenerId]);
    delete xmppStore[listenerOrListenerId];
};

/**
 * @constructor
 * @memberof Max
 * @class MessageListener The MessageListener is used to listen for incoming messages and subsequently call the given handler function.
 * @param {string|function} [idOrHandler] A string ID for the handler, or a function to be fired when a message is received. The string ID should be specified if you plan to unregister the handler as some point.
 * @param {function} [handler] Function to be fired when a message is received.
 */
Max.MessageListener = function(idOrHandler, handler) {
    if (typeof handler == typeof Function)
        this.handler = handler;
    else
        this.handler = idOrHandler;
    this.id = typeof idOrHandler == 'string' ? idOrHandler : Max.Utils.getGUID();
};

/**
 * @constructor
 * @memberof Max
 * @class MMXClient The MMXClient handles communication with the MMX server via XMPP.
 * @ignore
 */
Max.MMXClient = {
    // event emitter for connection
    connectionEmitter: null,
    /**
     * Connect to MMX server via BOSH http-bind.
     * @param {string} userId The currently logged in user's userId (id).
     * @param {string} accessToken The currently logged in user's access token.
     * @param {object} [connection] Preferred connection.
     * @returns {Max.Promise} A promise object returning "ok" or reason of failure.
     */
    connect: function(userId, accessToken, connection) {
        var self = this;
        var def = new Max.Deferred();
        var secure = Max.Config.baseUrl.indexOf('https://') != -1;
        var protocol = (secure ? 'https' : 'http') + '://';
        var baseHostName = Max.Config.baseUrl.replace('https://', '').replace('http://', '').split('/')[0];
        var xmppHost = secure ? baseHostName : (Max.Config.mmxHost + ':' + Max.Config.httpBindPort);
        var initEnd = false;

        setTimeout(function() {
            if (!mCurrentUser) return def.reject('session expired');
            if (self.connectionEmitter) return def.reject('already connected');

            self.connectionEmitter = {};
            Max.Events.create(self.connectionEmitter);
            self.bindDisconnect();

            mCurrentUser.jid = self.getBaredJid(userId) + '/' + mCurrentDevice.deviceId;
            mXMPPConnection = connection || new Strophe.Connection(protocol + xmppHost + '/http-bind/', {
                withCredentials: secure
            });

            mXMPPConnection.rawInput = function(data) {
                if (Max.Config.payloadLogging) Max.Log.fine('RECV: ' + data);
            };
            mXMPPConnection.rawOutput = function(data) {
                if (Max.Config.payloadLogging) Max.Log.fine('SENT: ' + data);
            };
            mXMPPConnection.connect(mCurrentUser.jid, accessToken, function(status) {
                if (self.connectionEmitter) self.connectionEmitter.invoke(status);

                self.connectionHandler(status, function(e) {
                    if (initEnd) return;
                    initEnd = true;
                    if (e) return def.reject(e);

                    mXMPPConnection.send($pres());
                    Max.invoke('authenticated', 'ok');
                    def.resolve('ok');
                });
            });

        }, 0);
        return def.promise;
    },
    // handle connection events related to initial connectivity
    connectionHandler: function(status, callback) {
        switch (status) {
            case Strophe.Status.ERROR: {
                Max.Log.fine('Max connection error');
                callback('connection error');
                break;
            }
            case Strophe.Status.CONNFAIL: {
                Max.Log.fine('Max connection failure');
                callback('connection failed');
                break;
            }
            case Strophe.Status.AUTHFAIL: {
                Max.Log.fine('Max failed authentication');
                callback('not authorized');
                break;
            }
            case Strophe.Status.CONNECTED: {
                Max.Log.info('Max connected');
                callback();
                break;
            }
        }
    },
    // handle disconnection gracefully
    bindDisconnect: function(callback, skipLogout) {
        var self = this;
        self.connectionEmitter.on(Strophe.Status.DISCONNECTED, function() {
            Max.Log.info('Max disconnected');
            self.connectionEmitter = null;
            mXMPPConnection = null;
            if (!skipLogout && mCurrentUser) Max.User.logout();
            if (typeof callback === typeof Function) return callback();
        });
    },
    /**
     * A wrapper function to register device and connect to MMX server via BOSH http-bind.
     * @param {string} accessToken The currently logged in user's access token.
     * @returns {Max.Promise} A promise object returning current user and device or reason of failure.
     */
    registerDeviceAndConnect: function(accessToken) {
        var self = this;
        var def = new Max.Deferred();
        var userId = mCurrentUser.userId;
        Max.Device.register().success(function() {
            if (!mCurrentUser) return def.reject('session expired');
            function register() {
                Max.MMXClient.connect(userId, accessToken).success(function() {
                    def.resolve(mCurrentUser, mCurrentDevice);
                }).error(function() {
                    def.reject.apply(def, arguments);
                });
            }
            if (!mXMPPConnection) {
                register();
            } else {
                self.connectionEmitter.unbind(Strophe.Status.DISCONNECTED);
                self.bindDisconnect(function() {
                    register();
                }, true);
                Max.MMXClient.disconnect();
            }
        }).error(function() {
            def.reject.apply(def, arguments);
        });
        return def.promise;
    },
    /**
     * Disconnect from MMX server.
     */
    disconnect: function() {
        if (mXMPPConnection) mXMPPConnection.disconnect();
    },
    /**
     * Given a userId (id), return a Bared Jid.
     * @param {string} userId A user's userId (id).
     * @returns {string} a user's Bared Jid.
     */
    getBaredJid: function(userId) {
        return userId + "%" + Max.App.appId +
            '@' + Max.Config.mmxDomain;
    }
};

/**
 * @constructor
 * @class
 * The Message class is the local representation of a message. This class provides  various message specific methods, like send or reply.
 * @param {object} contents an object containing your custom message body.
 * @param {Max.User|Max.User[]|string|string[]} recipientOrRecipients One or more {Max.User}
 * @param {File|File[]|FileList} [attachments] One or more File objects created by an input[type="file"] HTML element.
 * @property {object|Max.User} sender The message sender.
 * @property {object} messageContent The custom message body object sent by the sender.
 * @property {string} messageID An identifier for the message. It can be used to determine whether a message has already been displayed on a chat screen.
 * @property {Max.Attachment[]} [attachments] An array of message attachments.
 * @property {Max.Channel} [channel] If the message was sent to a channel, the channel object will be populated with basic channel information. Use the {Max.Channel.getChannel} method to obtain full channel information.
 * @property {Date} timestamp ISO-8601 formatted timestamp.
 * @property {object[]|Max.User[]} [recipients] An array of recipients, if the message was sent to
 * individual users instead of through a channel.
 * objects or userIds to be recipients for your message.
 */
Max.Message = function(contents, recipientOrRecipients, attachments) {
    this.meta = {};
    this.recipients = [];
    this._attachments = [];

    if (contents)
        this.messageContent = contents;

    if (recipientOrRecipients) {
        if (Max.Utils.isArray(recipientOrRecipients)) {
            for (var i=0;i<recipientOrRecipients.length;++i)
                this.recipients.push(formatUser(recipientOrRecipients[i]));
        } else {
            this.recipients.push(formatUser(recipientOrRecipients));
        }
    }

    if (attachments)
        this.addAttachments(attachments);

    if (mCurrentUser)
        this.sender = mCurrentUser;

    return this;
};

/**
 * Given {Max.User} object or userId, return a formatted object containing userId.
 */
function formatUser(userOrUserId) {
    return {
        userId: typeof userOrUserId == 'string' ? userOrUserId : userOrUserId.userId
    };
}

/**
 * Given an XMPP payload converted to JSON, set the properties of the {Max.Message} object.
 * @param {object} msg A JSON representation of an xmpp payload.
 * @param {Max.Channel} [channel] The channel this message belongs to.
 * @param {function} callback This function fires after the format is complete.
 * @ignore
 */
Max.Message.prototype.formatMessage = function(msg, channel, callback) {
    var self = this;

    this.receivedMessage = true;
    this.messageType = msg._type;
    this.messageID = (msg.event && msg.event.items && msg.event.items.item)
        ? msg.event.items.item._id : msg._id;
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
        if (mmxMeta.From) this.sender = new Max.User(mmxMeta.From);
    }

    if (msg.mmx && msg.mmx.payload) {
        this.timestamp = Max.Utils.ISO8601ToDate(msg.mmx.payload._stamp);
    }

    if (channel) {
        self.channel = channel;
        callback();
    } else if (msg.event && msg.event.items && msg.event.items._node) {
        var channelObj = nodePathToChannel(msg.event.items._node);
        if (ChannelStore.get(channelObj)) {
            ChannelStore.get(channelObj).isSubscribed = true;
            self.channel = ChannelStore.get(channelObj);
            return callback();
        }

        Max.Channel.getChannel(channelObj.name, channelObj.userId).success(function(channel) {
            self.channel = channel;
            callback();
        }).error(function() {
            callback();
        });

    } else {
        callback();
    }
};

// non-persistent cache of channel information to improve message receive performance
var ChannelStore = {
    store: {},
    add: function(channelOrChannels) {
        if (!Max.Utils.isArray(channelOrChannels))
            return this.store[this.getChannelId(channelOrChannels)] = channelOrChannels;
        for (var i=0;i<channelOrChannels.length;++i)
            this.store[this.getChannelId(channelOrChannels[i])] = channelOrChannels[i];
    },
    get: function(channel) {
        return this.store[this.getChannelId(channel)];
    },
    remove: function(channel) {
        if (this.store[this.getChannelId(channel)])
            delete this.store[this.getChannelId(channel)];
    },
    getChannelId: function(channel) {
        return (channel.userId || '*') + '/' + (channel.name.toLowerCase());
    },
    clear: function() {
        this.store = {};
    }
};

/**
 * Given a {Max.Message} object, instantiate the {Max.Attachment} objects.
 */
function attachmentRefsToAttachment(mmxMessage, msgMeta) {
    mmxMessage.attachments = mmxMessage.attachments || [];

    if (!msgMeta._attachments || msgMeta._attachments === '[]') return;
    if (typeof msgMeta._attachments === 'string')
        msgMeta._attachments = JSON.parse(msgMeta._attachments);

    for (var i=0;i<msgMeta._attachments.length;++i)
        mmxMessage.attachments.push(new Max.Attachment(msgMeta._attachments[i]));

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
//    Max.Channel.getChannel(name, userId).success(cb).error(function() {
//        cb();
//    });
//}

/**
 * Convert a XMPP pubsub node string into a {Max.Channel} object.
 */
function nodePathToChannel(nodeStr) {
    nodeStr = nodeStr.split('/');
    if (nodeStr.length !== 4) return;

    var name = nodeStr[nodeStr.length-1];
    var userId = nodeStr[nodeStr.length-2];
    userId = userId == '*' ? null : userId;

    return new Max.Channel({
        name: name,
        userId: userId
    });
}

/**
 * Send the message to a user.
 * @returns {Max.Promise} A promise object returning "ok" or reason of failure.
 */
Max.Message.prototype.send = function() {
    var self = this;
    var def = new Max.Deferred();
    var dt = Max.Utils.dateToISO8601(new Date());
    self.msgId = Max.Utils.getCleanGUID();

    setTimeout(function() {
        if (!self.recipients.length)
            return def.reject('no recipients');
        if (!mCurrentUser)
            return def.reject('session expired');

        if (!mXMPPConnection || !mXMPPConnection.connected)
            return def.reject('not connected');

        function sendMessage(msgMeta) {
            self.sender = {
                userId: mCurrentUser.userId,
                devId: mCurrentDevice.deviceId,
                displayName: (mCurrentUser.firstName || '') + ' ' + (mCurrentUser.lastName || ''),
                firstName: mCurrentUser.firstName,
                lastName: mCurrentUser.lastName,
                userName: mCurrentUser.userName
            };

            var meta = JSON.stringify(msgMeta);
            var mmxMeta = {
                To: self.recipients,
                From: self.sender,
                NoAck: true,
                mmxdistributed: true
            };
            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $msg({type: 'chat', id: self.msgId})
                .c('mmx', {xmlns: 'com.magnet:msg:payload'})
                .c('mmxmeta', mmxMeta).up()
                .c('meta', meta).up()
                .c('payload', {stamp: dt, chunk: '0/0/0'}).up().up()
                .c('request', {xmlns: 'urn:xmpp:receipts'}).up()
                .c('body', '.');

            mXMPPConnection.addHandler(function (msg) {
                var json = x2js.xml2json(msg);

                if (json.error)
                    return def.reject(json.error._code + ' : ' + json.error._type);

                def.resolve(self.msgId);
            }, null, null, null, self.msgId, null);

            mXMPPConnection.send(payload.tree());
        }

        if (!self._attachments.length) return sendMessage(self.messageContent);

        new Max.Uploader(self._attachments, function(e, multipart) {
            if (e || !multipart) return def.reject(e);

            multipart.messageUpload(self, self.msgId).success(function(attachments) {
                sendMessage(Max.Utils.mergeObj(self.messageContent || {}, {
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
 * Add an attachment.
 * @param {File|File[]|FileList} [attachmentOrAttachments] One or more File objects created by an input[type="file"] HTML element.
 */
Max.Message.prototype.addAttachments = function(attachmentOrAttachments) {
    if (!attachmentOrAttachments) return;

    if (attachmentOrAttachments[0] && attachmentOrAttachments[0].type) {
        this._attachments = this._attachments.concat(Array.prototype.slice.call(attachmentOrAttachments));
    } else if (Max.Utils.isArray(attachmentOrAttachments)) {
        this._attachments = this._attachments.concat(attachmentOrAttachments);
    } else {
        this._attachments.push(attachmentOrAttachments);
    }
};

/**
 * Reply to a received message.
 * @param {object} contents an object containing your custom message body.
 * @ignore
 */
Max.Message.prototype.reply = function(contents) {
    var self = this;
    var def = new Max.Deferred();

    setTimeout(function() {
        if (!contents) return def.reject('invalid reply message content');
        if (self.sender.userId == mCurrentUser.userId) return def.reject('cannot reply to yourself');

        self.recipients = [formatUser(self.sender)];
        self.messageContent = contents;

        self.send().success(function() {
           def.resolve.apply(def, arguments);
        }).error(function() {
           def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};
