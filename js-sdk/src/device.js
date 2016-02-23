
MagnetJS.Device = {
    getCurrentDevice: function() {
        return mCurrentDevice || null;
    },
    register: function() {
        var def = MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/devices',
            data: mCurrentDevice,
            bypassReady: true
        }, function() {
            def.resolve.apply(def, arguments);
        }, function() {
            def.reject.apply(def, arguments);
        });

        return def.promise;
    },
    collectDeviceInfo: function(cb) {
        var e = null;
        var browser = MagnetJS.Utils.getBrowser();
        var os = MagnetJS.Utils.getOS();
        var deviceInfo = {
            deviceId: 'web-client-js-sdk',
            deviceStatus: 'ACTIVE',
            label: browser,
            os: 'ANDROID', // TODO: server must support web client: os.os,
            osVersion: os.version
        };

        return (cb || function() {})(e, deviceInfo);
    },
    checkInWithDevice: function() {
        if (MagnetJS.App.initialized) return;

        MagnetJS.Device.collectDeviceInfo(function(e, deviceInfo) {
            if (e) throw (e);

            function initialize() {
                MagnetJS.App.initialized = true;
                MagnetJS.Log.info('sdk initialized');
            }

                //MagnetJS.Request({
                //    method: 'POST',
                //    url: '/com.magnet.server/config/mobile',
                //    data: deviceInfo,
                //    bypassReady: true
                //}, function(data) {
                //
                //    MagnetJS.App.appId = data['mmx_app_id'];
                //    MagnetJS.Config.mmxEndpoint = data['mms-application-endpoint'];
                //    MagnetJS.Config.mmxHost = data['mmx-host'];
                //    MagnetJS.Config.securityPolicy = data['security-policy'];
                //    MagnetJS.Config.tlsEnabled = data['tls-enabled'] === 'true' || data['tls-enabled'] === true;
                //    MagnetJS.Config.mmxDomain = data['mmx-domain'];
                //    MagnetJS.Config.mmxPort = parseInt(data['mmx-port']);
                //
                //    mCurrentDevice = deviceInfo;
                //
                //    mCurrentUser = mCurrentUser || new MagnetJS.User({
                //        userIdentifier: data.device.userId
                //    });
                //
                //    initialize();
                //
                //}, function(e) {
                //    MagnetJS.Log.severe('checkInWithDevice failed', e);
                //});
            //} else {

            MagnetJS.Request({
                method: 'POST',
                url: '/com.magnet.server/applications/session-device',
                data: deviceInfo,
                headers: {
                    Authorization: 'Basic '+MagnetJS.Utils.stringToBase64(MagnetJS.App.clientId+':'+MagnetJS.App.clientSecret)
                },
                bypassReady: true
            }, function(data) {

                MagnetJS.App.catCredentials = data.applicationToken;
                MagnetJS.App.appId = data.applicationToken.mmx_app_id;
                MagnetJS.Config.mmxEndpoint = data.config['mms-application-endpoint'];
                MagnetJS.Config.mmxHost = data.config['mmx-host'];
                MagnetJS.Config.securityPolicy = data.config['security-policy'];
                MagnetJS.Config.tlsEnabled = data.config['tls-enabled'] === 'true';
                MagnetJS.Config.mmxDomain = data.config['mmx-domain'];
                MagnetJS.Config.mmxPort = parseInt(data.config['mmx-port']);

                mCurrentDevice = deviceInfo;

                var token = Cookie.get('magnet-max-auth-token');

                if (!token || !data.device.userId)
                    return initialize();

                MagnetJS.App.hatCredentials = {
                    access_token: token
                };

                Max.User.search({
                    limit: 1,
                    offset: 0,
                    query: 'userIdentifier:'+data.device.userId,
                    bypassReady: true
                }).success(function(users) {
                    if (!users.length) return initialize();

                    mCurrentUser = users[0];

                    MagnetJS.Device.register().success(function() {
                        MagnetJS.MMXClient.connect(data.device.userId, token).success(function() {
                            initialize();
                        }).error(function(e) {
                            MagnetJS.Log.severe('checkInWithDevice failed', e);
                        });
                    }).error(function(e) {
                        MagnetJS.Log.severe('checkInWithDevice failed', e);
                    });

                }).error(function(e) {
                    MagnetJS.Log.severe('checkInWithDevice failed', e);
                });

            }, function(e) {
                MagnetJS.Log.severe('checkInWithDevice failed', e);
            });

        });
    }
};
