var MMS_DEVICE_ID = '1111-2222-3333-4444';

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

MagnetJS.User.search = function(queryObj) {
    var qs = '', userlist = [];
    var keyMap = {
        query: 'q',
        limit: 'take',
        offset: 'skip',
        orderby: 'sort'
    };

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

MagnetJS.User.logout = function() {
    mCurrentUser = null;

    MagnetJS.MMXClient.disconnect('logout');
    Cookie.remove('magnet-max-auth-token');
    Cookie.remove('magnet-max-refresh-token');

    var def = MagnetJS.Request({
        method: 'DELETE',
        url: '/com.magnet.server/user/session'
    }, function() {
        MagnetJS.App.hatCredentials = null;

        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};
