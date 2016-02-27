/**
 * @constructor
 * @class
 * The User class is a local representation of a user in the MagnetMax platform. This class provides
 * various user specific methods, like authentication, signing up, and search.
 * @param {object} [userObj] An object containing user information.
 * @param {string} [userObj.username] User's username.
 * @param {string} [userObj.password] User's preferred password.
 * @param {string} [userObj.firstName] User's first name.
 * @param {string} [userObj.lastName] User's last name.
 * @param {string} [userObj.email] User's email.
 */
MagnetJS.User = function(userObj) {
    if (userObj.displayName == 'null null') delete userObj.displayName;

    if (userObj.displayName) {
        var name = userObj.displayName.split(' ');
        if (!userObj.firstName) userObj.firstName = (name[0]) ? name[0] : '';
        if (!userObj.lastName) userObj.lastName = (name[1]) ? name[1] : '';
    }

    if (userObj.userId && userObj.userId.indexOf('%') != -1)
        userObj.userId = userObj.userId.split('%')[0];

    if (userObj.userId && !userObj.userIdentifier) userObj.userIdentifier = userObj.userId;
    userObj.userName = userObj.userName || userObj.username || userObj.displayName;

    MagnetJS.Utils.mergeObj(this, userObj);
    return this;
};

/**
 * Registers a new user.
 * @param {object} userObj An object containing user information.
 * @param {string} userObj.username User's username.
 * @param {string} userObj.password User's preferred password.
 * @param {string} [userObj.firstName] User's first name.
 * @param {string} [userObj.lastName] User's last name.
 * @param {string} [userObj.email] User's email.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.User.register = function(userObj) {
    userObj.userName = userObj.username;
    var auth;

    MagnetJS.MMXClient.disconnect();

    if (MagnetJS.App.catCredentials || MagnetJS.App.hatCredentials)
        auth = {
            'Authorization': 'Bearer '
            + (MagnetJS.App.catCredentials || MagnetJS.App.hatCredentials || {}).access_token
        };

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/user/enrollment',
        data: userObj,
        headers: auth
    }, function() {
        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * Login as the given user.
 * @param {object} userObj An object containing user information.
 * @param {string} userObj.username User's username.
 * @param {string} userObj.password User's preferred password.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.User.login = function(userObj) {
    userObj = userObj || {};
    userObj.grant_type = 'password';
    userObj.client_id = MagnetJS.App.clientId;
    userObj.remember_me = userObj.remember_me || false;

    MagnetJS.MMXClient.disconnect();

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/user/session',
        data: userObj,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
           'Authorization': 'Basic ' + MagnetJS.Utils.stringToBase64(userObj.username+':'+userObj.password),
           'MMS-DEVICE-ID': MMS_DEVICE_ID
        },
        isLogin: true
    }, function(data) {

        MagnetJS.App.hatCredentials = data;
        mCurrentUser = new MagnetJS.User(data.user);
        Cookie.create('magnet-max-auth-token', data.access_token, 1);

        if (data.refresh_token)
            Cookie.create('magnet-max-refresh-token', data.access_token, 365);

        MagnetJS.MMXClient.registerDeviceAndConnect(null, data.access_token)
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
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 * @ignore
 */
MagnetJS.User.loginWithRefreshToken = function(request, callback, failback) {
    var token = Cookie.get('magnet-max-refresh-token');

    MagnetJS.MMXClient.disconnect();

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/user/newtoken',
        data: {
            client_id: MagnetJS.App.clientId,
            refresh_token: token,
            grant_type: 'refresh_token',
            device_id: MMS_DEVICE_ID,
            scope: 'user'
        },
        isLogin: true
    }, function(data) {

        MagnetJS.App.hatCredentials = data;
        mCurrentUser = new MagnetJS.User(data.user);
        Cookie.create('magnet-max-auth-token', data.access_token, 1);

        MagnetJS.MMXClient.registerDeviceAndConnect(null, data.access_token)
            .success(function() {
                if (request) return MagnetJS.Request(request, callback, failback);
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
 * Given a list of usernames, return a list of users.
 * @param {string[]} usernames A list of usernames.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.User.getUsersByUserNames = function(usernames) {
    var qs = '', userlist = [];

    if (usernames && usernames.length) {
        for (var i=0;i<usernames.length;++i) {
            qs += '&userNames=' + usernames[i];
        }
        qs = qs.replace('&', '?');
    }

    var def = MagnetJS.Request({
        method: 'GET',
        url: '/com.magnet.server/user/users' + qs
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new MagnetJS.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

/**
 * Search for users with an advanced search query.
 * @param {object} [queryObj] A search query object.
 * @param {string} [queryObj.query] A search string. The string should be a user property and the value separated
 * by colon. For example, to search for a user by username, the string can be 'username:jon.doe'.
 * @param {number} [queryObj.limit] The number of results to return per page.
 * @param {number} [queryObj.offset] The starting index of results.
 * @param {string} [queryObj.orderby] A sort string. The string should be a user property and the sort direction
 * ['asc', 'desc'] separated by colon. For example, to order by username descending, the string can be 'username:desc'.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.User.search = function(queryObj) {
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
    queryObj.query = queryObj.query || 'userName:*';

    if (queryObj.query.indexOf('username:') != -1)
        queryObj.query.replace('username:', 'userName:');

    if (queryObj.orderby && queryObj.orderby.indexOf('username:') != -1)
        queryObj.orderby.replace('username:', 'userName:');

    for(var key in queryObj)
        qs += '&'+keyMap[key]+'='+queryObj[key];
    qs = qs != '' ? qs.replace('&', '?') : qs;

    var def = MagnetJS.Request({
        method: 'GET',
        url: '/com.magnet.server/user/query'+qs,
        bypassReady: queryObj.bypassReady
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new MagnetJS.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

// TODO: not used
MagnetJS.User.getToken = function() {
    var def = MagnetJS.Request({
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
 * Logout the current logged in user.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.User.logout = function() {
    var self = this;
    Cookie.remove('magnet-max-refresh-token');

    var def = MagnetJS.Request({
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
 */
MagnetJS.User.clearSession = function() {
    mCurrentUser = null;
    MagnetJS.App.hatCredentials = null;
    MagnetJS.MMXClient.disconnect();
    mXMPPConnection = null;
    Cookie.remove('magnet-max-auth-token');
};
