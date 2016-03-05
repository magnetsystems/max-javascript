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
     * Associates a device with the current user against the server.
     * @returns {MagnetJS.Promise} A promise object returning device information or request error.
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
            osVersion: os.os + (os.version || '')
        };

        return (callback || function() {})(e, deviceInfo);
    },
    /**
     * Initiates a session with the server using the currently registered device.
     * @param {function} callback fires upon device initiation.
     * @ignore
     */
    checkInWithDevice: function(callback) {
        MagnetJS.Device.collectDeviceInfo(function(e, deviceInfo) {
            if (e) throw (e);

            MagnetJS.Request({
                method: 'POST',
                url: '/com.magnet.server/applications/session-device',
                data: deviceInfo,
                headers: {
                    Authorization: 'Basic ' +
                    MagnetJS.Utils.stringToBase64(MagnetJS.App.clientId+':'+MagnetJS.App.clientSecret)
                },
                bypassReady: true
            }, function(data) {

                mCurrentDevice = deviceInfo;
                MagnetJS.App.catCredentials = data.applicationToken;
                MagnetJS.App.appId = data.applicationToken.mmx_app_id;
                MagnetJS.Config.baseUrl = data.config['mms-application-endpoint'];
                MagnetJS.Config.mmxHost = data.config['mmx-host'];
                MagnetJS.Config.securityPolicy = data.config['security-policy'];
                MagnetJS.Config.tlsEnabled = data.config['tls-enabled'] === 'true';
                MagnetJS.Config.mmxDomain = data.config['mmx-domain'];
                MagnetJS.Config.mmxPort = parseInt(data.config['mmx-port']);

                callback();
            }, function(e) {

                callback(e);
            });
        });
    }
};
