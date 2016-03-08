/**
 * @constructor
 * @class
 * The User class is a local representation of a user in the MagnetMax platform. This class provides
 * various user specific methods, like authentication, signing up, and search.
 * @param {object} [userObj] An object containing user information.
 * @param {string} [userObj.userName] User's username.
 * @param {string} [userObj.password] User's preferred password.
 * @param {string} [userObj.firstName] User's first name.
 * @param {string} [userObj.lastName] User's last name.
 * @param {string} [userObj.email] User's email.
 * @property {string} userId User's user identifier.
 * @property {string} userName User's username.
 * @property {string} [firstName] User's first name.
 * @property {string} [lastName] User's last name.
 * @property {string} [email] User's email.
 */
Max.User = function(userObj) {
    if (userObj.displayName == 'null null') delete userObj.displayName;

    if (userObj.displayName) {
        var name = userObj.displayName.split(' ');
        if (!userObj.firstName) userObj.firstName = (name[0]) ? name[0] : '';
        if (!userObj.lastName) userObj.lastName = (name[1]) ? name[1] : '';
    }

    if (userObj.userId && userObj.userId.indexOf('%') != -1)
        userObj.userId = userObj.userId.split('%')[0];

    if (!userObj.userId && userObj.userIdentifier) userObj.userId = userObj.userIdentifier;
    delete userObj.userIdentifier;
    userObj.userName = userObj.userName || userObj.username || userObj.displayName;

    Max.Utils.mergeObj(this, userObj);
    return this;
};

/**
 * Registers a new user.
 * @param {object} userObj An object containing user information.
 * @param {string} userObj.userName User's username.
 * @param {string} userObj.password User's preferred password.
 * @param {string} [userObj.firstName] User's first name.
 * @param {string} [userObj.lastName] User's last name.
 * @param {string} [userObj.email] User's email.
 * @returns {Max.Promise} A promise object returning the new {Max.User} or reason of failure.
 */
Max.User.register = function(userObj) {
    userObj.userName = userObj.userName || userObj.username;
    var auth;

    Max.MMXClient.disconnect();

    if (Max.App.catCredentials || Max.App.hatCredentials)
        auth = {
            'Authorization': 'Bearer '
            + (Max.App.catCredentials || Max.App.hatCredentials || {}).access_token
        };

    var def = Max.Request({
        method: 'POST',
        url: '/com.magnet.server/user/enrollment',
        data: userObj,
        headers: auth
    }, function(newUserObj, details) {
        def.resolve.apply(def, [new Max.User(newUserObj), details]);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * Login as the given user.
 * @param {object} userObj An object containing user information.
 * @param {string} userObj.userName User's username.
 * @param {string} userObj.password User's preferred password.
 * @returns {Max.Promise} A promise object returning success report or reason of failure.
 */
Max.User.login = function(userObj) {
    userObj = userObj || {};
    userObj.grant_type = 'password';
    userObj.client_id = Max.App.clientId;
    userObj.remember_me = userObj.remember_me || false;
    userObj.username = userObj.userName || userObj.username;

    Max.MMXClient.disconnect();

    var def = Max.Request({
        method: 'POST',
        url: '/com.magnet.server/user/session',
        data: userObj,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
           'Authorization': 'Basic ' + Max.Utils.stringToBase64(userObj.userName+':'+userObj.password),
           'MMS-DEVICE-ID': MMS_DEVICE_ID
        },
        isLogin: true
    }, function(data) {

        Max.App.hatCredentials = data;
        mCurrentUser = new Max.User(data.user);
        Cookie.create('magnet-max-auth-token', data.access_token, 2);

        if (data.refresh_token)
            Cookie.create('magnet-max-refresh-token', data.access_token, 365);

        Max.MMXClient.registerDeviceAndConnect(data.access_token)
            .success(function() {
                def.resolve.apply(def, arguments);
            })
            .error(function() {
                def.reject.apply(def, arguments);
            });

    }, function(e, details) {
        def.reject(details.status == 401 ? 'incorrect credentials' : e, details);
    });

    return def.promise;
};

/**
 * Login automatically if the Remember Me setting was enabled during login.
 * @returns {Max.Promise} A promise object returning success report or reason of failure.
 * @ignore
 */
Max.User.loginWithRefreshToken = function(request, callback, failback) {
    var token = Cookie.get('magnet-max-refresh-token');

    Max.MMXClient.disconnect();

    var def = Max.Request({
        method: 'POST',
        url: '/com.magnet.server/user/newtoken',
        data: {
            client_id: Max.App.clientId,
            refresh_token: token,
            grant_type: 'refresh_token',
            device_id: MMS_DEVICE_ID,
            scope: 'user'
        },
        isLogin: true
    }, function(data) {

        Max.App.hatCredentials = data;
        mCurrentUser = new Max.User(data.user);
        Cookie.create('magnet-max-auth-token', data.access_token, 1);

        Max.MMXClient.registerDeviceAndConnect(data.access_token)
            .success(function() {
                if (request) return Max.Request(request, callback, failback);
                def.resolve.apply(def, arguments);
            })
            .error(function() {
                def.reject.apply(def, arguments);
            });

    }, function(e, details) {
        Cookie.remove('magnet-max-refresh-token');
        def.reject(details.status == 401 ? 'incorrect credentials' : e, details);
    });

    return def.promise;
};

/**
 * Attempts to login with an access token.
 * @param {function} callback fires upon completion.
 * @ignore
 */
Max.User.loginWithAccessToken = function(callback) {
    var token = Cookie.get('magnet-max-auth-token');
    if (!token) return callback('auth token missing');

    Max.App.hatCredentials = {
        access_token: token
    };

    Max.User.getUserInfo().success(function(user) {
        mCurrentUser = user;

        Max.MMXClient.registerDeviceAndConnect(token)
            .success(function() {
                callback();
            })
            .error(function(e) {
                callback(e);
            });

    }).error(function(e) {
        callback(e);
    });
};

/**
 * Given a list of usernames, return a list of users.
 * @param {string[]} usernames A list of usernames.
 * @returns {Max.Promise} A promise object returning a list of {Max.User} or reason of failure.
 */
Max.User.getUsersByUserNames = function(usernames) {
    var qs = '', userlist = [];

    if (usernames && usernames.length) {
        for (var i=0;i<usernames.length;++i) {
            qs += '&userNames=' + usernames[i];
        }
        qs = qs.replace('&', '?');
    }

    var def = Max.Request({
        method: 'GET',
        url: '/com.magnet.server/user/users' + qs
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new Max.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

/**
 * Given a list of userIds, return a list of users.
 * @param {string[]} userIds A list of userIds.
 * @returns {Max.Promise} A promise object returning a list of {Max.User} or reason of failure.
 */
Max.User.getUsersByUserIds = function(userIds) {
    var qs = '', userlist = [];

    if (userIds && userIds.length) {
        for (var i=0;i<userIds.length;++i)
            qs += '&userIds=' + userIds[i];
        qs = qs.replace('&', '?');
    }

    var def = Max.Request({
        method: 'GET',
        url: '/com.magnet.server/user/users/ids' + qs
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new Max.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

/**
 * Search for users with an advanced search query.
 * @param {object} [queryObj] A search query object.
 * @param {object} [queryObj.query] An object containing the user property and the search value as a key-value pair.
 * For example, to search for a user by username, the object can be {userName:'jon.doe'}. See {Max.User} properties
 * for acceptable search properties.
 * @param {number} [queryObj.limit] The number of results to return per page.
 * @param {number} [queryObj.offset] The starting index of results.
 * @param {object} [queryObj.orderby] An object containing the user property and the sort direction
 * ['asc', 'desc'] as a key-value pair. For example, to order by username descending, the object can be
 * {userName:'desc'}. See {Max.User} properties for acceptable search properties.
 * @returns {Max.Promise} A promise object returning a list of {Max.User} or reason of failure.
 */
Max.User.search = function(queryObj) {
    var qs = '', userlist = [];
    var keyMap = {
        query: 'q',
        limit: 'take',
        offset: 'skip',
        orderby: 'sort'
    };

    queryObj = queryObj || {};
    queryObj.offset = queryObj.offset || 0;
    queryObj.limit = queryObj.limit || 1;
    queryObj.query = queryObj.query || {userName : '*'};

    if (queryObj.query.userId)
        queryObj.query.userIdentifier = queryObj.query.userId;
    if (queryObj.orderby && queryObj.orderby.userId)
        queryObj.orderby.userIdentifier = queryObj.orderby.userId;

    for(var key in queryObj) {
        if (typeof queryObj[key] === 'string' ||
            typeof queryObj[key] === 'number' ||
            typeof queryObj[key] === 'boolean') {
            qs += '&'+keyMap[key]+'='+queryObj[key];
        } else if (queryObj[key] && typeof queryObj[key] == 'object') {
            for (var propKey in queryObj[key]) {
                if (propKey !== 'userId')
                    qs += '&'+keyMap[key]+'='+propKey+':'+queryObj[key][propKey];
            }

        }
    }
    qs = qs != '' ? qs.replace('&', '?') : qs;

    var def = Max.Request({
        method: 'GET',
        url: '/com.magnet.server/user/query'+qs,
        bypassReady: queryObj.bypassReady
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new Max.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

// TODO: not used
Max.User.getToken = function() {
    var def = Max.Request({
        method: 'GET',
        url: '/com.magnet.server/tokens/token'
    }, function() {
        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * Gets the current {Max.User} object.
 * @returns {Max.Promise} A promise object returning the current user as a {Max.User} or reason of failure.
 * @ignore
 */
Max.User.getUserInfo = function() {
    var def = Max.Request({
        method: 'GET',
        url: '/com.magnet.server/userinfo',
        bypassReady: true
    }, function(data, details) {
        def.resolve.apply(def, [new Max.User(data), details]);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * Logout the current logged in user.
 * @returns {Max.Promise} A promise object returning success report or reason of failure.
 */
Max.User.logout = function() {
    var self = this;
    Cookie.remove('magnet-max-refresh-token');
    Max.MMXClient.disconnect();

    var def = Max.Request({
        method: 'DELETE',
        url: '/com.magnet.server/user/session'
    }, function() {
        self.clearSession();
        def.resolve.apply(def, arguments);
    }, function() {
        self.clearSession();
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * Removes user session information.
 * @ign
 */
Max.User.clearSession = function() {
    mCurrentUser = null;
    Max.App.hatCredentials = null;
    Cookie.remove('magnet-max-auth-token');
    ChannelStore.clear();
};
