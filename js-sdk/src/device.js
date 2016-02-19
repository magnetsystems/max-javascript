
MagnetJS.Device = {
    getCurrentDevice: function() {
        return mCurrentDevice || null;
    },
    register: function() {
        var def = MagnetJS.Request({
            method: 'POST',
            url: '/com.magnet.server/devices',
            data: mCurrentDevice
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

            MagnetJS.Request({
                method: 'POST',
                url: '/com.magnet.server/applications/session-device',
                data: deviceInfo,
                headers: {
                    Authorization: 'Basic '+MagnetJS.Utils.stringToBase64(MagnetJS.App.clientId+':'+MagnetJS.App.clientSecret)
                }
            }, function(data) {

                MagnetJS.App.credentials = data.applicationToken;
                MagnetJS.App.appId = data.applicationToken.mmx_app_id;
                MagnetJS.Config.mmxEndpoint = data.config['mms-application-endpoint'];
                MagnetJS.Config.mmxHost = data.config['mmx-host'];
                MagnetJS.Config.securityPolicy = data.config['security-policy'];
                MagnetJS.Config.tlsEnabled = data.config['tls-enabled'] === 'true';
                MagnetJS.Config.mmxDomain = data.config['mmx-domain'];
                MagnetJS.Config.mmxPort = parseInt(data.config['mmx-port']);

                mCurrentDevice = data.device;
                mCurrentUser = mCurrentUser || new MagnetJS.User({
                    userIdentifier: data.device.userId
                });

                MagnetJS.App.initialized = true;

            }, function(e) {
                MagnetJS.Log.severe('checkInWithDevice failed', e);
            });
        });
    }
};
