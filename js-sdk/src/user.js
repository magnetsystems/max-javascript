
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

MagnetJS.User.login = function(userObj, cb) {
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
        MagnetJS.Device.register().success(function() {
            MagnetJS.MMXClient.connect(userObj.password).success(function() {
                def.resolve.apply(def, arguments);
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
        url: 'http://localhost:7777/api/com.magnet.server/user/users' + qs
    }, function(data, details) {

        for (var i=0;i<data.length;++i)
            userlist.push(new MagnetJS.User(data[i]));

        def.resolve.apply(def, [userlist, details]);
    }, function() {
        def.reject.apply(def, arguments);
    });

    return def.promise;
};

MagnetJS.User.search = function(queryObj, cb) {
    var qs = '';

    var keyMap = {
        query: 'q',
        limit: 'take',
        offset: 'skip',
        orderby: 'sort'
    };

    for(var key in queryObj){
        qs += '&'+keyMap[key]+'='+queryObj[key];
    }
    qs = qs != '' ? qs.replace('&', '?') : qs;

    $.ajax({
        method: 'GET',
        url: 'http://localhost:7777/api/com.magnet.server/user/query'+qs,
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(users) {
        var userlist = [];
        for (var i=0;i<users.length;++i) {
            userlist.push(new MagnetJS.User(users[i]));
        }
        cb(null, userlist);
    }).fail(function(err) {
        cb(err);
    });
};

MagnetJS.User.logout = function(cb) {
    mCurrentUser = null;
    mCurrentDevice = null;
    MagnetJS.App.credentials = null;

    $.ajax({
        method: 'DELETE',
        url: 'http://localhost:7777/api/com.magnet.server/user/session',
        beforeSend: function(xhr) {
           xhr.setRequestHeader('Authorization', 'Bearer ' + MagnetJS.App.credentials.token.access_token);
        }
    }).done(function(data) {
        (cb || function() {})();
    }).fail(function(err) {
        (cb || function() {})();
    });
};
