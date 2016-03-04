var x2js = new X2JS();

/**
 * @method
 * @desc Start receiving messages.
 */
MagnetJS.start = function() {
    MagnetJS.App.receiving = true;
    if (mXMPPConnection) mXMPPConnection.priority = 0;
};

/**
 * @method
 * @desc Stop receiving messages.
 */
MagnetJS.stop = function() {
    MagnetJS.App.receiving = false;
    if (mXMPPConnection) mXMPPConnection.priority = -255;
};

/**
 * @method
 * @desc Register a listener to handle incoming messages.
 * @param {MagnetJS.MessageListener} listener A message listener.
 */
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

/**
 * @method
 * @desc Unregister a listener identified by the given id to stop handling incoming messages.
 * @param {MagnetJS.MessageListener} listenerId A message listener.
 */
MagnetJS.unregisterListener = function(listenerId) {
    if (!xmppStore || !listenerId || !mXMPPConnection) return;
    mXMPPConnection.deleteHandler(xmppStore[listenerId]);
    delete xmppStore[listenerId];
};

/**
 * @constructor
 * @memberof MagnetJS
 * @class MessageListener The MessageListener is used to listen for incoming messages and subsequently call the given handler function.
 * @param {string|function} [idOrHandler] A string ID for the handler, or a function to be fired
 * when a message is received. The string ID should be specified if you plan to unregister the handler as some point.
 * @param {function} [handler] Function to be fired when a message is received.
 */
MagnetJS.MessageListener = function(idOrHandler, handler) {
    if (typeof handler == typeof Function)
        this.handler = handler;
    else
        this.handler = idOrHandler;
    this.id = typeof idOrHandler == 'string' ? idOrHandler : MagnetJS.Utils.getGUID();
};

/**
 * @constructor
 * @memberof MagnetJS
 * @class MMXClient The MMXClient handles communication with the MMX server via XMPP.
 * @ignore
 */
MagnetJS.MMXClient = {
    /**
     * Connect to MMX server via BOSH http-bind.
     * @param {string} userId The currently logged in user's userIdentifier (id).
     * @param {string} accessToken The currently logged in user's access token.
     * @returns {MagnetJS.Promise} A promise object returning "ok" or reason of failure.
     */
    connect: function(userId, accessToken) {
        var self = this;
        var def = new MagnetJS.Deferred();
        var secure = MagnetJS.Config.baseUrl.indexOf('https://') != -1;
        var protocol = (secure ? 'https' : 'http') + '://';
        var baseHostName = MagnetJS.Config.baseUrl.replace('https://', '').replace('http://', '').split('/')[0];
        var xmppHost = secure ? baseHostName : (MagnetJS.Config.mmxHost + ':' + MagnetJS.Config.httpBindPort);

        mXMPPConnection = new Strophe.Connection(protocol + xmppHost + '/http-bind/', {
            withCredentials: secure
        });

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
                def.reject('not authorized');
            } else if (status == Strophe.Status.AUTHFAIL) {
                MagnetJS.Log.fine('MMX failed authentication.');
                def.reject('not authorized');
            } else if (status == Strophe.Status.DISCONNECTING) {
                MagnetJS.Log.fine('MMX is disconnecting.');
            } else if (status == Strophe.Status.DISCONNECTED) {
                MagnetJS.Log.info('MMX is disconnected.');
                mXMPPConnection = null;

                MagnetJS.User.logout();
                //if (mCurrentUser) {
                //    mCurrentUser.connected = false;
                //    if (MagnetJS.App.hatCredentials && MagnetJS.App.hatCredentials.access_token)
                //        self.registerDeviceAndConnect(mCurrentUser.userIdentifier, MagnetJS.App.hatCredentials);
                //}
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
    /**
     * A wrapper function to register device and connect to MMX server via BOSH http-bind.
     * @param {string} userId The currently logged in user's userIdentifier (id).
     * @param {string} accessToken The currently logged in user's access token.
     * @returns {MagnetJS.Promise} A promise object returning current user and device or reason of failure.
     */
    registerDeviceAndConnect: function(userId, accessToken) {
        userId = userId || mCurrentUser.userIdentifier;
        var def = new MagnetJS.Deferred();
        MagnetJS.Device.register().success(function() {
            MagnetJS.MMXClient.connect(userId, accessToken).success(function() {
                def.resolve(mCurrentUser, mCurrentDevice);
            }).error(function() {
                def.reject.apply(def, arguments);
            });
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
     * Given a userIdentifier (id), return a Bared Jid.
     * @param {string} userId A user's userIdentifier (id).
     * @returns {string} a user's Bared Jid.
     */
    getBaredJid: function(userId) {
        return userId + "%" + MagnetJS.App.appId +
            '@' + MagnetJS.Config.mmxDomain;
    }
};

/**
 * @constructor
 * @class
 * The Message class is the local representation of a message. This class provides
 * various message specific methods, like send or reply.
 * @param {object} contents an object containing your custom message body.
 * @param {MagnetJS.User|MagnetJS.User[]|string|string[]} recipientOrRecipients One or more {MagnetJS.User}
 * objects or userIdentifiers to be recipients for your message.
 */
MagnetJS.Message = function(contents, recipientOrRecipients) {
    this.meta = {};
    this.recipients = [];

    if (contents)
        this.messageContent = contents;

    if (recipientOrRecipients) {
        if (MagnetJS.Utils.isArray(recipientOrRecipients)) {
            for (var i=0;i<recipientOrRecipients.length;++i)
                this.recipients.push(formatUser(recipientOrRecipients[i]));
        } else {
            this.recipients.push(formatUser(recipientOrRecipients));
        }
    }

    if (mCurrentUser)
        this.sender = mCurrentUser;

    return this;
};

/**
 * Given {MagnetJS.User} object or userIdentifier, return a formatted object containing userId.
 */
function formatUser(userOrUserId) {
    return {
        userId: typeof userOrUserId == 'string' ? userOrUserId : userOrUserId.userIdentifier
    };
}

/**
 * Given an XMPP payload converted to JSON, set the properties of the {MagnetJS.Message} object.
 * @param {object} msg A JSON representation of an xmpp payload.
 * @param {function} callback This function fires after the format is complete.
 * @ignore
 */
MagnetJS.Message.prototype.formatMessage = function(msg, callback) {
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
            callback();
        } else {
            callback();
        }

    } catch(e) {
        MagnetJS.Log.fine('MMXMessage.formatMessage', e);
    }
};

/**
 * Given a {MagnetJS.Message} object, instantiate the {MagnetJS.Attachment} objects.
 */
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

/**
 * Convert a XMPP pubsub node string into a {MagnetJS.Channel} object.
 */
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

/**
 * Send the message to a user.
 * @returns {MagnetJS.Promise} A promise object returning "ok" or reason of failure.
 */
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
/**
 * Reply to the message.
 * @param {object} content A message content object.
 * @ignore
 */
//MagnetJS.Message.prototype.reply = function(content, cb) {
//    if (!this.receivedMessage) return cb('unable to reply: not a received message.');
//    $msg({to: this.meta.from, from: this.meta.to, type: 'chat'})
//        .cnode(Strophe.copyElement(content));
//};
