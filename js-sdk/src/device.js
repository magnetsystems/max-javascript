/**
 * @constructor
 * @class
 * The Device class is a local representation of a device in the MagnetMax platform. This class provides
 * various device specific methods, like collecting device information.
 */
MagnetJS.Device = {
    /**
     * @desc Get device information of the currently registered device.
     * @returns {MagnetJS.Device} currently logged in user.
     */
    getCurrentDevice: function() {
        return mCurrentDevice || null;
    },
    /**
     * Registers a new device.
     * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
     * @ignore
     */
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
    /**
     * Retrieves the current device information.
     * @param {function} [callback] Returns device information or error.
     * @ignore
     */
    collectDeviceInfo: function(callback) {
        var e = null;
        var browser = MagnetJS.Utils.getBrowser();
        var os = MagnetJS.Utils.getOS();
        var deviceId = Cookie.get('magnet-max-device-id');

        if (!deviceId) {
            deviceId = 'js-'+MagnetJS.Utils.getGUID();
            Cookie.create('magnet-max-device-id', deviceId, 365);
        }

        var deviceInfo = {
            deviceId: deviceId,
            deviceStatus: 'ACTIVE',
            label: browser,
            os: 'ANDROID', // TODO: server must support web client: os.os,
            osVersion: os.version
        };

        return (callback || function() {})(e, deviceInfo);
    },
    /**
     * Initiates a session with the server using the currently registered device.
     * @ignore
     */
    checkInWithDevice: function() {
        if (MagnetJS.App.initialized) return;

        MagnetJS.Device.collectDeviceInfo(function(e, deviceInfo) {
            if (e) throw (e);

            function initialize() {
                MagnetJS.App.initialized = true;
                MagnetJS.Log.info('sdk initialized');
            }

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

                    MagnetJS.MMXClient.registerDeviceAndConnect(data.device.userId, token)
                        .success(function() {
                            initialize();
                        })
                        .error(function(e) {
                            if (e == 'not-authorized')
                                MagnetJS.User.clearSession();
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
