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
 * @attribute {object} ListenerType A key-value pair of all listener types.
 * @ignore
 */
Max.ListenerType = {
    MESSAGE: 100,
    INVITATION: 200
};

/**
 * @method
 * @desc Register a listener to handle incoming messages.
 * @param {Max.EventListener} listener An event listener.
 */
Max.registerListener = function(listener) {
    Max.unregisterListener(listener);

    mListenerStore[listener.id] = mXMPPConnection.addHandler(function(msg) {

        Max.Message.formatEvent(x2js.xml2json(msg), null, function(e, event) {
            if (event) {
                switch (event.mType) {
                    case Max.MessageType.INVITATION: listener.invitationHandler(event); break;
                    case Max.MessageType.INVITATION_RESPONSE: listener.invitationResponseHandler(event); break;
                    default: listener.messageHandler(event); break;
                }
            }
        });
        return true;

    }, null, 'message', null, null,  null);
};

/**
 * @method
 * @desc Unregister a listener identified by the given id to stop handling incoming messages.
 * @param {string|Max.EventListener} listenerOrListenerId An event listener or the listener Id specified
 * during creation.
 */
Max.unregisterListener = function(listenerOrListenerId) {
    if (!mListenerStore || !listenerOrListenerId || !mXMPPConnection || !mXMPPConnection.deleteHandler) return;
    if (typeof listenerOrListenerId === 'object') listenerOrListenerId = listenerOrListenerId.id;
    mXMPPConnection.deleteHandler(mListenerStore[listenerOrListenerId]);
    delete mListenerStore[listenerOrListenerId];
};

/**
 * @constructor
 * @memberof Max
 * @class EventListener The EventListener is used to listen for incoming messages and channel invitations, and subsequently call the given handler function.
 * @param {string|function} id A string ID for the handler. The string ID should be specified if you plan to unregister the handler at some point.
 * @param {object|function} messageHandlerOrObject Alternatively, pass a handler object containing the callbacks. Alternatively, pass function to be fired when a {Max.Message} is received.
 * @param {function} messageHandlerOrObject.message Function to be fired when a {Max.Message} is received.
 * @param {function} [messageHandlerOrObject.invite] Function to be fired when a {Max.Invite} is received.
 * @param {function} [messageHandlerOrObject.inviteResponse] Function to be fired when a {Max.InviteResponse} is received.
 * @param {function} [invitationHandler] Function to be fired when a {Max.Invite} is received.
 * @param {function} [invitationResponseHandler] Function to be fired when a {Max.InviteResponse} is received.
 */
Max.EventListener = function(id, messageHandlerOrObject, invitationHandler, invitationResponseHandler) {
    this.id = typeof id == 'string' ? id : Max.Utils.getGUID();

    if (messageHandlerOrObject) {
        if (messageHandlerOrObject.inviteResponse) invitationResponseHandler = messageHandlerOrObject.inviteResponse;
        if (messageHandlerOrObject.invite) invitationHandler = messageHandlerOrObject.invite;
        if (messageHandlerOrObject.message) messageHandlerOrObject = messageHandlerOrObject.message;
    }

    this.messageHandler = typeof messageHandlerOrObject === 'function' ? messageHandlerOrObject : function() {};
    this.invitationHandler = invitationHandler || function() {};
    this.invitationResponseHandler = invitationResponseHandler || function() {};
};

/**
 * @constructor
 * @memberof Max
 * @extends Max.EventListener
 */
Max.MessageListener = Max.EventListener;

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
 * @attribute {object} ListenerType A key-value pair of all listener types.
 * @ignore
 */
Max.MessageType = {
    MESSAGE: 'unknown',
    INVITATION: 'invitation',
    INVITATION_RESPONSE: 'invitationResponse'
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
 * @property {Max.Channel} [channel] If the message was sent to a channel, the channel object will be available.
 * @property {Date} timestamp The date and time this message was sent.
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
 * Given an XMPP payload converted to JSON, set the properties of the object.
 * @param {object} msg A JSON representation of an xmpp payload.
 * @param {Max.Channel} [channel] The channel this message belongs to.
 * @param {function} callback This function fires after the format is complete.
 * @ignore
 */
Max.Message.formatEvent = function(msg, channel, callback) {
    var self, mType;

    msg.mmx = (
      msg.event &&
      msg.event.items &&
      msg.event.items.item &&
      msg.event.items.item.mmx
    ) ? msg.event.items.item.mmx : msg.mmx;

    if (msg.mmx && msg.mmx._xmlns == 'com.magnet:msg:signal') return callback();

    mType = (msg.mmx && msg.mmx.payload && msg.mmx.payload._mtype) ? msg.mmx.payload._mtype : 'unknown';

    switch (mType) {
        case Max.MessageType.INVITATION: self = new Max.Invite(); break;
        case Max.MessageType.INVITATION_RESPONSE: self = new Max.InviteResponse(); break;
        default: self = new Max.Message(); break;
    }

    self.receivedMessage = true;
    self.messageType = msg._type;
    self.messageID = (msg.event && msg.event.items && msg.event.items.item)
        ? msg.event.items.item._id : msg._id;
    self.channel = null;
    self.attachments = null;

    self.meta = {
        from: msg._from,
        to: msg._to,
        id: msg._id
    };

    self.meta.ns = msg.mmx ? msg.mmx._xmlns : '';

    if (msg.mmx && msg.mmx.meta) {
        var msgMeta = JSON.parse(msg.mmx.meta);
        attachmentRefsToAttachment(self, msgMeta);
        self.messageContent = msgMeta;
    }

    if (msg.mmx && msg.mmx.mmxmeta) {
        var mmxMeta = JSON.parse(msg.mmx.mmxmeta);
        self.recipients = mmxMeta.To;
        if (mmxMeta.From) self.sender = new Max.User(mmxMeta.From);
    }

    if (msg.mmx && msg.mmx.payload) {
        self.timestamp = Max.Utils.ISO8601ToDate(msg.mmx.payload._stamp);
    }

    if (self.mType == Max.MessageType.INVITATION || self.mType == Max.MessageType.INVITATION_RESPONSE) {
        self.invitationMeta = Max.Utils.mergeObj({}, self.messageContent);
        delete self.messageContent;
        delete self.messageType;
        delete self.attachments;
        delete self.receivedMessage;
        self.comments = self.invitationMeta.text;
    }

    if (self.mType == Max.MessageType.INVITATION_RESPONSE) {
        self.accepted = self.invitationMeta.inviteIsAccepted === 'true';
        self.comments = self.invitationMeta.inviteResponseText;
    }

    if (channel) {
        self.channel = channel;
        callback(null, self);
    } else if (self.invitationMeta || (msg.event && msg.event.items && msg.event.items._node)) {

        var channelObj = self.invitationMeta ? new Max.Channel({
            name: self.invitationMeta.channelName,
            userId: (self.invitationMeta.channelIsPublic === 'false' ? self.invitationMeta.channelOwnerId : null)
        }) : nodePathToChannel(msg.event.items._node);

        if (ChannelStore.get(channelObj)) {
            ChannelStore.get(channelObj).isSubscribed = true;
            self.channel = ChannelStore.get(channelObj);
            return callback(null, self);
        }

        Max.Channel.getChannel(channelObj.name, channelObj.userId).success(function(channel) {
            self.channel = channel;
            callback(null, self);
        }).error(function(e) {
            callback(e);
        });
    } else {
        callback(null, self);
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
 * @returns {Max.Promise} A promise object returning the messageID or reason of failure.
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
                //NoAck: true,
                mmxdistributed: true
            };
            mmxMeta = JSON.stringify(mmxMeta);

            var payload = $msg({type: 'chat', from: mCurrentUser.jid,
                to: 'mmx$multicast%'+Max.App.appId+'@'+Max.Config.mmxDomain, id: self.msgId})
                .c('mmx', {xmlns: 'com.magnet:msg:payload'})
                .c('mmxmeta', mmxMeta).up()
                .c('meta', meta).up()
                .c('payload', {mtype: self.mType || 'unknown', stamp: dt, chunk: '0/0/0'}).up().up()
                .c('request', {xmlns: 'urn:xmpp:receipts'}).up()
                .c('body', '.');

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);
                if (!json.mmx || !json.mmx.mmxmeta || json.mmx._xmlns != 'com.magnet:msg:signal') return true;
                json = JSON.parse(json.mmx.mmxmeta);
                if (!json.endack || json.endack.ackForMsgId != self.msgId) return true;

                if (json.endack.errorCode == 'NO_ERROR') {
                    def.resolve(self.msgId);
                    return false;
                }

                def.reject(json.endack.errorCode, json.endack.badReceivers);
            }, null, 'message', null, null, null);

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
 * Add on or more attachments.
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
 * @returns {Max.Promise} A promise object returning messageID or reason of failure.
 */
Max.Message.prototype.reply = function(contents, replyAll) {
    var self = this;
    var def = new Max.Deferred();

    setTimeout(function() {
        if (!contents) return def.reject('invalid reply message content');
        if (self.sender.userId == mCurrentUser.userId) return def.reject('cannot reply to yourself');

        self.recipients = (replyAll && self.recipients && self.recipients.length) ? self.recipients : [];
        self.recipients.push(formatUser(self.sender));

        for (var i=0;i<self.recipients.length;++i) {
            if (mCurrentUser && self.recipients[i].userId == mCurrentUser.userId) {
                self.splice(i, 1);
                break;
            }
        }

        self.messageContent = contents;

        self.send().success(function() {
           def.resolve.apply(def, arguments);
        }).error(function() {
           def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Reply to all recipients of a received message.
 * @param {object} contents an object containing your custom message body.
 */
Max.Message.prototype.replyAll = function(contents) {
    return this.reply(contents, true);
};

/**
 * @constructor
 * @class
 * A {Max.Invite} is received from the {Max.EventListener} when the current user is invited to a channel. This class
 * contains methods to view invitation comments and subsequently accept or deny an invitation.
 * @property {object|Max.User} sender The message sender.
 * @property {string} comments Invitation comments sent by the sender.
 * @property {Max.Channel} channel Channel the current user has been invited to.
 * @property {Date} timestamp The date and time this message was sent.
 * @property {object[]|Max.User[]} recipients An array of recipients who have been sent the invitation.
 */
Max.Invite = function() {
    this.meta = {};
    this.recipients = [];
    this.mType = Max.MessageType.INVITATION;
    return this;
};

/**
 * Accept or deny the invite to the channel.
 * @param {boolean} accepted True to accept the invitation.
 * @param {string} [comments] An optional custom message to return to the sender.
 * @returns {Max.Promise} A promise object returning messageID or reason of failure.
 * @ignore
 */
Max.Invite.prototype.respond = function(accepted, comments) {
    var self = this, msg;
    var def = new Max.Deferred();

    setTimeout(function() {
        if (!mCurrentUser) return def.reject('session expired');
        if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject('not connected');
        if (!self.channel) return def.reject('missing channel information');
        if (accepted === null || typeof accepted === 'undefined') return def.reject('accepted property missing');

        self.invitationMeta.inviteResponseText = comments;
        self.invitationMeta.inviteIsAccepted = accepted + '';

        msg = new Max.Message(self.invitationMeta, self.sender);
        msg.mType = Max.MessageType.INVITATION_RESPONSE;

        msg.send().success(function() {
            if (!accepted) return def.resolve.apply(def, arguments);

            self.channel.subscribe().success(function() {
                def.resolve.apply(def, arguments);
            }).error(function() {
                def.reject.apply(def, arguments);
            });
        }).error(function() {
            def.reject.apply(def, arguments);
        });
    }, 0);

    return def.promise;
};

/**
 * Accept the invite to the channel and start receiving messages published to the channel.
 * @param {string} [comments] An optional custom message to return to the sender.
 * @returns {Max.Promise} A promise object returning messageID or reason of failure.
 */
Max.Invite.prototype.accept = function(comments) {
    return this.respond(true, comments);
};

/**
 * Decline the invite to the channel.
 * @param {string} [comments] An optional custom message to return to the sender.
 * @returns {Max.Promise} A promise object returning messageID or reason of failure.
 */
Max.Invite.prototype.decline = function(comments) {
    return this.respond(false, comments);
};

/**
 * @constructor
 * @class
 * A {Max.InviteResponse} is received from the {Max.EventListener} when a recipient of a channel invitation sent by
 * the current user responds. This class contains information about the invitation, including whether or the user
 * accepted or declined the channel invitation.
 * @property {object|Max.User} sender The message sender.
 * @property {string} comments Invitation comments sent by the sender.
 * @property {Max.Channel} channel Channel the current user has been invited to.
 * @property {Date} timestamp The date and time this message was sent.
 * @property {boolean} accepted Indicates whether the invitation recipient accepted or declined the invitation.
 */
Max.InviteResponse = function() {
    this.meta = {};
    this.recipients = [];
    this.mType = Max.MessageType.INVITATION_RESPONSE;
    return this;
};
