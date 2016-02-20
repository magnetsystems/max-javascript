
MagnetJS.User = function(userObj) {
    MagnetJS.Utils.mergeObj(this, userObj);
    return this;
};

MagnetJS.User.register = function(userObj) {
    userObj.userName = userObj.username;

    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/user/enrollment',
        data: userObj
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
    userObj.remember_me = false;

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

        MagnetJS.App.credentials = data;
        mCurrentUser = new MagnetJS.User(data.user);

        // TODO: implement remember me
        //var token  = (MagnetJS.Utils.isNode ? details.info.response.headers['authorization'] : details.info.xhr.Authorization);
        //if (MagnetJS.Config.storeCredentials === true) {
        //    if (!token)
        //        MagnetJS.Log.warning('the connected server does not have OAuth enabled, so credentials cannot be stored.');
        //    MagnetJS.Storage.createTableIfNotExist(this.store, {
        //        hash : 'TEXT'
        //    }, {
        //        hash : MagnetJS.Utils.stringToBase64(JSON.stringify({
        //            endpointUrl : MagnetJS.Config.endpointUrl,
        //            token       : token ? token.replace('Bearer ', '') : ''
        //    }))}, true);
        //}
        //if (MagnetJS.Utils.isNode && details.info.response.headers['set-cookie'])
        //    MagnetJS.Transport.Headers.Cookie = details.info.response.headers['set-cookie'][0];

        MagnetJS.Device.register().success(function() {
            MagnetJS.MMXClient.connect(userObj.password).success(function() {
                def.resolve(mCurrentUser, mCurrentDevice);
            });
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
        url: '/com.magnet.server/user/query'+qs
    }, function(data, details) {
        for (var i=0;i<data.length;++i)
            userlist.push(new MagnetJS.User(data[i]));

        def.resolve(userlist, details);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.User.logout = function() {
    mCurrentUser = null;
    mCurrentDevice = null;

    var def = MagnetJS.Request({
        method: 'DELETE',
        url: '/com.magnet.server/user/session'
    }, function() {
        MagnetJS.App.credentials = null;

        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};
