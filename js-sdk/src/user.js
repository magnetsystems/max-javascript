
MagnetJS.User = function(userObj) {
    MagnetJS.Utils.mergeObj(this, userObj);
    return this;
};

MagnetJS.User.register = function(userObj) {
    userObj.userName = userObj.username;
    var auth;

    if (MagnetJS.App.catCredentials || MagnetJS.App.hatCredentials) {
        auth = {
            'Authorization': 'Bearer ' + (MagnetJS.App.catCredentials || MagnetJS.App.hatCredentials || {}).access_token
        };
    }

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

    var def = MagnetJS.Request({
        method: 'POST',
        url: 'http://localhost:1337/localhost:7777/api/com.magnet.server/user/session',
        data: userObj,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
           'Authorization': 'Basic ' + MagnetJS.Utils.stringToBase64(userObj.username+':'+userObj.password),
           'MMS-DEVICE-ID': '1111-2222-3333-4444'
        }
    }, function(data) {

        MagnetJS.App.hatCredentials = data;
        mCurrentUser = new MagnetJS.User(data.user);

        if (userObj.remember_me)
            Cookie.create('magnet-max-auth-token', data.access_token, 1);

        MagnetJS.Device.register().success(function() {
            MagnetJS.MMXClient.connect(mCurrentUser.userIdentifier, data.access_token).success(function() {
                def.resolve(mCurrentUser, mCurrentDevice);
            }).error(function() {
                def.reject.apply(def, arguments);
            });
        }).error(function() {
            def.reject.apply(def, arguments);
        });

    }, function() {
        def.reject.apply(def, arguments);
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
