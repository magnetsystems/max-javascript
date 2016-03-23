/**
 * @constructor
 * @class
 * The Device class is a local representation of a device in the MagnetMax platform. This class provides
 * various device specific methods, like collecting device information.
 */
Max.Device = {
    /**
     * @desc Get device information of the currently registered device.
     * @returns {Max.Device} currently logged in user.
     */
    getCurrentDevice: function() {
        return mCurrentDevice || null;
    },
    /**
     * Associates a device with the current user against the server.
     * @returns {Max.Promise} A promise object returning device information or request error.
     * @ignore
     */
    register: function() {
        var def = Max.Request({
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
        var browser = Max.Utils.getBrowser();
        var os = Max.Utils.getOS();
        var deviceId = Cookie.get('magnet-max-device-id');

        if (!deviceId) {
            deviceId = 'js-'+Max.Utils.getGUID();
            Cookie.create('magnet-max-device-id', deviceId, 365);
        }

        var deviceInfo = {
            deviceId: deviceId,
            deviceStatus: 'ACTIVE',
            label: browser,
            os: 'ANDROID', // TODO: server must support web client: os.os,
            osVersion: os.os + (os.version || ''),
            pushAuthority: 'GCM'
        };

        return (callback || function() {})(e, deviceInfo);
    },
    /**
     * Initiates a session with the server using the currently registered device.
     * @param {function} callback fires upon device initiation.
     * @ignore
     */
    checkInWithDevice: function(callback) {
        Max.Device.collectDeviceInfo(function(e, deviceInfo) {
            if (e) throw (e);

            Max.Request({
                method: 'POST',
                url: '/com.magnet.server/applications/session-device',
                data: deviceInfo,
                headers: {
                    Authorization: 'Basic ' +
                    Max.Utils.stringToBase64(Max.App.clientId+':'+Max.App.clientSecret)
                },
                bypassReady: true
            }, function(data) {

                mCurrentDevice = deviceInfo;
                Max.App.catCredentials = data.applicationToken;
                Max.App.appId = data.applicationToken.mmx_app_id;
                Max.Config.baseUrl = data.config['mms-application-endpoint'];
                Max.Config.mmxHost = data.config['mmx-host'];
                Max.Config.securityPolicy = data.config['security-policy'];
                Max.Config.tlsEnabled = data.config['tls-enabled'] === 'true';
                Max.Config.mmxDomain = data.config['mmx-domain'];
                Max.Config.mmxPort = parseInt(data.config['mmx-port']);

                callback();
            }, function(e) {

                callback(e);
            });
        });
    }
};
