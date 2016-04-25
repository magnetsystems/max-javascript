/**
 * @constructor
 * @class
 * The UserPreferences class is used to manage privacy control for the current user.
 */
Max.UserPreferences = {
    /**
     * Disables communication with all of the given users.
     * @param {string|Max.User|string[]|Max.User[]} users One or more userId or {Max.User} objects to block.
     * @returns {Max.Promise} A promise object returning "ok" or request error.
     */
    blockUsers: function(users) {
        var self = this, def = new Max.Deferred();

        self.getBlockedUsers(true).success(function(blockedUsers) {
            self.setUsers(blockedUsers.concat(users)).success(function(res, details) {
                def.resolve(res, details);
            }).error(function(e) {
                def.reject(e);
            });
        }).error(function(e) {
            def.reject(e);
        });

        return def.promise;
    },
    /**
     * Re-enable communication with all of the given users.
     * @param {string|Max.User|string[]|Max.User[]} users One or more userId or {Max.User} objects to unblock.
     * @returns {Max.Promise} A promise object returning "ok" or request error.
     */
    unblockUsers: function(users) {
        var self = this, def = new Max.Deferred(), userId;

        self.getBlockedUsers(true).success(function(blockedUsers) {
            if (!Max.Utils.isArray(users))
                users = [users];

            for (var i=0;i<users.length;++i) {
                userId = Max.Utils.isObject(users[i]) ? users[i].userId : users[i];
                if (blockedUsers.indexOf(userId) != -1)
                    blockedUsers.splice(blockedUsers.indexOf(userId), 1);
            }

            self.setUsers(blockedUsers).success(function(res, details) {
                def.resolve(res, details);
            }).error(function(e) {
                def.reject(e);
            });
        }).error(function(e) {
            def.reject(e);
        });

        return def.promise;
    },
    /**
     * Update the privacy list by passing all of the users in the list including both new and existing users.
     * @param {string|Max.User|string[]|Max.User[]} users One or more userId or {Max.User} objects to block.
     * @returns {Max.Promise} A promise object returning "ok" or request error.
     * @ignore
     */
    setUsers: function(users) {
        var def = new Max.Deferred(), iqId = Max.Utils.getCleanGUID(), userId, uids = {};

        setTimeout(function() {
            if (!mCurrentUser) return def.reject(Max.Error.SESSION_EXPIRED);
            if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject(Max.Error.NOT_CONNECTED);

            if (!Max.Utils.isArray(users))
                users = [users];

            var payload = $iq({from: mCurrentUser.jid, type: 'set', id: iqId})
                .c('query', {xmlns: 'jabber:iq:privacy'})
                .c('list', {name: 'default'});

            for (var i in users) {
                if (uids[userId]) continue;
                userId = Max.Utils.isObject(users[i]) ? users[i].userId : users[i];
                uids[userId] = true;
                payload.c('item', {action: 'deny', order: '1', type: 'jid', value: Max.MMXClient.getBaredJid(userId)});
                payload.c('iq').up().c('message').up().c('presence-in').up().c('presence-out').up().up();
            }

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);

                if (json.error) {
                    if (json.error._type == 'auth') json.error._type = Max.Error.FORBIDDEN;
                    return def.reject(json.error._type, json.error._code);
                }

                def.resolve('ok');
            }, null, null, null, iqId, null);

            mXMPPConnection.send(payload.tree());

        }, 0);

        return def.promise;
    },
    /**
     * Get all the users blocked by the current user.
     * @param {boolean} [uidsOnly] If enabled, only a list of userId are returned.
     * @returns {Max.Promise} A promise object returning a list of {Max.User} or request error.
     */
    getBlockedUsers: function(uidsOnly) {
        var def = new Max.Deferred(), iqId = Max.Utils.getCleanGUID(), items, uids = [];

        setTimeout(function() {
            if (!mCurrentUser) return def.reject(Max.Error.SESSION_EXPIRED);
            if (!mXMPPConnection || !mXMPPConnection.connected) return def.reject(Max.Error.NOT_CONNECTED);

            var payload = $iq({from: mCurrentUser.jid, type: 'get', id: iqId})
                .c('query', {xmlns: 'jabber:iq:privacy'})
                .c('list', {name: 'default'});

            mXMPPConnection.addHandler(function(msg) {
                var json = x2js.xml2json(msg);

                if (json.error && json.error._code != '404') {
                    if (json.error._type == 'auth') json.error._type = Max.Error.FORBIDDEN;
                    return def.reject(json.error._type, json.error._code);
                }

                if (json.error && json.error._code == '404') {
                    return def.resolve([]);
                }

                if (json.query && json.query.list && json.query.list.item) {
                    items = Max.Utils.objToObjAry(json.query.list.item);
                    for (var i=0;i<items.length;++i) {
                        uids.push(items[i]._value.split('%')[0]);
                    }
                }

                if (!uids.length || uidsOnly) return def.resolve(uids);

                Max.User.getUsersByUserIds(uids).success(function() {
                    def.resolve.apply(def, arguments);
                }).error(function(e) {
                    def.reject(e);
                });
            }, null, null, null, iqId, null);

            mXMPPConnection.send(payload.tree());

        }, 0);

        return def.promise;
    }
};
