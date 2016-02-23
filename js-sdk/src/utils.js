/**
 * @global
 * @desc An object containing attributes used across the MagnetJS SDK.
 * @ignore
 */
MagnetJS.Config = {
    /**
     * @property {boolean} logging Enable the logging feature.
     */
    logging                : true,
    /**
     * @property {boolean} logging Enable the payload logging feature.
     */
    payloadLogging         : true,
    /**
     * @property {string} logLevel Set the lowest level to log. Lower log levels will be ignore. The order is SEVERE, WARNING,
     * INFO, CONFIG, and FINE.
     */
    logLevel               : 'FINE',
    /**
     * @property {string} logHandler Define the log handler used to handle logs if logging is enabled. Specifying 'DB' stores
     * to the database configured in {MagnetJS.Storage}, 'Console' outputs log via console.log, and 'Console&DB' stores to
     * database and outputs simultaneously.
     */
    logHandler             : 'Console',
    /**
     * @property {boolean} storeCredentials Enable storage of OAuth access token after a successful login to be used
     * for subsequent logins. The default is true.
     */
    storeCredentials       : true,
    /**
     * @property {boolean} debugMode Ignore self-signed certificates when saving files to the file system. Only applicable
     * to the Phonegap client when using FileTransfer API transport.
     */
    debugMode              : false,
    /**
     * @property {string} sdkVersion Version of the Magnet Mobile SDK for JavaScript.
     */
    sdkVersion             : '1.0.0-SNAPSHOT',
    /**
     * @property {string} securityPolicy Security policy. ['RELAXED', 'STRICT']
     */
    securityPolicy         : 'RELAXED',
    /**
     * @property {string} mmxDomain mmx domain.
     */
    mmxDomain              : 'mmx',
    /**
     * @property {string} mmxPort mmx port.
     */
    mmxPort                : 5222,
    /**
     * @property {string} mmxRESTPort mmx REST port.
     */
    mmxRESTPort            : 6060,
    /**
     * @property {string} httpBindPort http-bind port.
     */
    httpBindPort           : 7070,
    /**
     * @property {string} mmxHost mmxHost.
     */
    mmxHost                : 'localhost',
    /**
     * @property {string} mmxEndpoint mmxEndpoint.
     */
    mmxEndpoint            : 'http://localhost:7777/api',
    /**
     * @property {string} tlsEnabled Determines whether TLS security enabled.
     */
    tlsEnabled             : false
};

MagnetJS.App = {
    /**
     * @property {boolean} True indicates that the SDK is ready for use.
     */
    initialized: false,
    /**
     * @property {boolean} True indicates the SDK is listening for messages.
     */
    receiving: false,
    /**
     * @property {object} credentials Contains authorization token needed for API
     * authorization.
     */
    credentials: {},
    /**
     * @property {string} clientId Client ID. This value is unique per application.
     */
    clientId: false,
    /**
     * @property {string} clientSecret Client secret. This value is unique per application.
     */
    clientSecret: false,
    /**
     * @property {string} appId Application id.
     */
    appId: null,
    /**
     * @property {string} appAPIKey Application API key.
     */
    appAPIKey: null,
    /**
     * @property {string} gcmSenderId GCM sender ID.
     */
    gcmSenderId: null
};

/**
 * A class containing general utility functions used across the MagnetJS SDK.
 * @memberof MagnetJS
 * @namespace Utils
 * @ignore
 */
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
MagnetJS.Utils = {
    /**
     * Indicates whether the current browser is an Android device.
     */
    isAndroid : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current browser is an iOS device.
     */
    isIOS : (typeof navigator !== 'undefined' && navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current browser is an iOS or Android device.
     */
    isMobile : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current client is a Node.js server.
     */
    isNode : (typeof module !== 'undefined' && module.exports && typeof window === 'undefined'),
    /**
     * Indicates whether the current client is a Cordova app.
     */
    isCordova : (typeof navigator !== 'undefined' && navigator.userAgent) &&
        (typeof window !== 'undefined' && window.location && window.location.href) &&
        (typeof cordova !== 'undefined' || typeof PhoneGap !== 'undefined' || typeof phonegap !== 'undefined') &&
        /^file:\/{3}[^\/]/i.test(window.location.href) &&
        /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent),
    /**
     * Merges the attributes of the second object into the first object.
     * @param {object} obj1 The first object, into which the attributes will be merged.
     * @param {object} obj2 The second object, whose attributes will be merged into the first object.
     */
    mergeObj : function(obj1, obj2) {
        var obj1 = obj1 || {};
        var obj2 = obj2 || {};
        for(var p in obj2) {
            try{
                if (obj2[p].constructor == Object) {
                    obj1[p] = this.mergeObj(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            }catch(e) {
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    },
    /**
     * Determines whether the input is a JavaScript object.
     * @param {*} input The input to check.
     */
    isObject : function(input) {
        return Object.prototype.toString.call(input) == "[object Object]";
    },
    /**
     * Determines whether the input is a JavaScript array.
     * @param {*} input The input to check.
     */
    isArray : function(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    },
    /**
     * Convert the specified string to JSON if successful; otherwise returns false.
     * @param {string} str The input to convert.
     */
    getValidJSON : function(str) {
        try{
            str = JSON.parse(str);
        }catch(e) {
            return false;
        }
        return str;
    },
    /**
     * Convert the specified string to XML if successful; otherwise returns false.
     * @param {string} str The input to convert.
     */
    getValidXML : function(str) {
        if (!this.parseXml) {
            if (window.DOMParser) {
                this.parseXml = function(str) {
                    return (new window.DOMParser()).parseFromString(str, 'text/xml');
                };
            } else if (typeof window.ActiveXObject != 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')) {
                this.parseXml = function(str) {
                    var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
                    xmlDoc.async = 'false';
                    xmlDoc.loadXML(str);
                    return xmlDoc;
                };
            }
        }
        try{
            str = this.parseXml(str);
        }catch(e) {
            return false;
        }
        return str;
    },
    /**
     * Convert the specified object into Form Data.
     * @param {string} str The input to convert.
     * @returns {string} A Form Data string.
     */
    objectToFormdata : {
        stringify : function(input) {
            if (MagnetJS.Utils.isObject(input)) {
                var ary = [];
                for(var key in input) {
                    if (input.hasOwnProperty(key) && input[key] != null)
                        ary.push(key+'='+encodeURIComponent(input[key]));
                }
                return ary.join('&');
            }
            return '';
        }
    },
    /**
     * Retrieve all attribute names of the specified object as an array.
     * @param {object} obj The object to parse.
     */
    getAttributes : function(obj) {
        var ary = [];
        obj = obj || {};
        for(var attr in obj) {
            if (obj.hasOwnProperty(attr)) ary.push(attr);
        }
        return ary;
    },
    /**
     * Retrieve all properties of the specified object as an array.
     * @param {object} obj The object to parse.
     */
    getValues : function(obj) {
        var ary = [];
        obj = obj || {};
        for(var attr in obj) {
            if (obj.hasOwnProperty(attr)) ary.push(obj[attr]);
        }
        return ary;
    },
    /**
     * Indicates whether the specified object is empty.
     * @param {object} obj The object to check.
     */
    isEmptyObject : function(obj) {
        if (!obj || typeof obj === 'string' || typeof obj === 'boolean' || this.isNumeric(obj)) {
            return true;
        }
        if (!obj.hasOwnProperty) {
            for(var i in obj) {
                return false;
            }
            return true;
        } else {
            for(var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    return false;
                }
            }
            return true;
        }
    },
    /**
     * Convert XHR and response headers into a JavaScript object.
     * @param {object} xhr The XMLHTTPRequest object to convert.
     */
    convertHeaderStrToObj : function(xhr) {
        var obj = {};
        // for IE9+ and webkit browsers - faster performance
        if (Object.keys(xhr).forEach) {
            Object.keys(xhr).forEach(function(prop) {
                if ((typeof xhr[prop] == 'string' || typeof xhr[prop] == 'number' || typeof xhr[prop] == 'boolean') && prop != 'responseText') {
                    obj[prop] = xhr[prop];
                }
            });
        } else {
            for(var prop in xhr) {
                if ((typeof xhr[prop] == 'string' || typeof xhr[prop] == 'number' || typeof xhr[prop] == 'boolean') && prop != 'responseText') {
                    obj[prop] = xhr[prop];
                }
            }
        }
        var ary = xhr.getAllResponseHeaders().split('\n');
        for(var i in ary) {
            var prop = ary[i].trim().split(': ');
            if (prop.length > 1) {
                obj[prop[0]] = prop[1];
            }
        }
        return obj;
    },
    /**
     * Determines whether the input is numeric.
     * @param {*} input The input to check.
     */
    isNumeric : function(input) {
        return !isNaN(parseFloat(input)) && isFinite(input);
    },
    /**
     * Remove attributes not defined in the specified schema and returns the corresponding set of entity attributes.
     * @param {object} schema The controller or model schema consistent with the server.
     * @param {object} obj The current set of entity attributes.
     */
    cleanData : function(schema, obj) {
        var result = {};
        for(var attr in schema) {
            if (schema.hasOwnProperty(attr) && obj[attr])
                result[attr] = obj[attr];
        }
        return result;
    },
    /**
     * Handles basic validation of object attributes based on the specified schema.
     * @param {object} schema The controller or model schema consistent with the server.
     * @param {object} attributes The current set of controller or model attributes.
     * @param {boolean} isUpdate If enabled, do not fail validation on missing required fields. Default is disabled (false).
     * @returns {object|boolean} An array of invalid property objects, or false if validation passes.
     */
    validate : function(schema, attributes, isUpdate) {
        var invalid = [], obj;
        attributes = attributes || {};
        for(var attr in schema) {
            if (schema.hasOwnProperty(attr)) {
                obj = {
                    attribute : attr
                };
                var type = schema[attr].type;
                if (typeof schema !== 'undefined' && typeof schema[attr] !== 'undefined' && typeof schema[attr].type !== 'undefined')
                    type = type.trim();
                if (schema[attr].optional === false && (typeof attributes[attr] === 'undefined' || attributes[attr] === '')) {
                    if (!isUpdate) obj.reason = 'required field blank';
                } else if (attributes[attr] && ((type == 'integer' || type == 'biginteger' || type == 'bigdecimal' || type == 'double' || type == 'long' || type == 'float' || type == 'short' || type == 'byte') && !MagnetJS.Utils.isNumeric(attributes[attr]))) {
                    obj.reason = 'not numeric';
                } else if (attributes[attr] && type == 'boolean' && attributes[attr] !== 'true' && attributes[attr] !== true && attributes[attr] !== 'false' && attributes[attr] !== false) {
                    obj.reason = 'not boolean';
                } else if (attributes[attr] && (type == 'java.util.List' ||  type == 'array') && (!attributes[attr] || attributes[attr].length == 0 || this.isArray(attributes[attr]) === false)) {
                    obj.reason = 'empty list';
                } else if (attributes[attr] && (type == '_data' || type == 'binary') && (!attributes[attr].mimeType || !attributes[attr].val)) {
                    obj.reason = 'invalid binary format';
                }
                if (obj.reason) invalid.push(obj);
            }
        }
        return invalid.length == 0 ? false : invalid;
    },
    /**
     * Determines whether the specified feature is available in the current browser or mobile client.
     * @param {string} str Name of a global variable.
     */
    hasFeature : function(str) {
        try{
            return str in window && window[str] !== null;
        } catch(e) {
            return false;
        }
    },
    /**
     * Determines whether the specified attribute is a primitive type.
     * @param {string} str The attribute type.
     */
    isPrimitiveType : function(str) {
        return '|byte|short|int|long|float|double|boolean|char|string|integer|void|'.indexOf('|'+str+'|') != -1;
    },
    /**
     * Determines whether the specified attribute is an array type. If its type is an array, the type of data in the array is returned; otherwise returns false.
     * @param {string} str The attribute type.
     */
    getArrayType : function(str) {
        return str.indexOf('[]') != -1 ? str.slice(0, -2) : false;
    },
    /**
     * Determines the data type for the specified attribute type.
     * @param {string} str The attribute type.
     */
    getDataType : function(str) {
        var type;
        switch(Object.prototype.toString.call(str)) {
            case '[object Number]'    : type = 'integer'; break;
            case '[object String]'    : type = 'string'; break;
            case '[object Array]'     : type = 'array'; break;
            case '[object Object]'    : type = 'object'; break;
            case '[object Date]'      : type = 'date'; break;
            case '[object Boolean]'   : type = 'boolean'; break;
        }
        return type;
    },
    /**
     * Determines whether the specified attribute is of type date.
     * @param {string} str The attribute type.
     */
    isDateType : function(str) {
        return ('|date|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is of type binary.
     * @param {string} str The attribute type.
     */
    isBinaryType : function(str) {
        return ('|binary|_data|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is a generic object type.
     * @param {string} str The attribute type.
     */
    isGenericObject : function(str) {
        return ('|object|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is of type Model or Collection.
     * @param {string} str The attribute type.
     */
    isModelOrCollection : function(str) {
        return (MagnetJS.Models[str] || MagnetJS.Models[this.getArrayType(str)]) ? true : false;
    },
    /**
     * Converts the specified Date object as an ISO 8601 Extended Format string. This is a shim for clients that do not support .toISOString.
     * @param {Date} date The Date object to be converted to an ISO 8601 Extended Format string.
     * @returns {string} An equivalent ISO 8601 Extended Format string.
     */
    dateToISO8601 : function(d) {
        function pad(n) {return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z';
    },
    /**
     * Converts the specified Date string as an ISO 8601 Extended Format Date object.
     * @param {string} str An ISO 8601 Extended Format date string.
     * @returns {object} A Date object equivalent to the specified ISO 8601 Extended Format string.
     */
    ISO8601ToDate : function(str) {
        if (typeof str !== 'string') return false;
        var re = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))/;
        var d = [];
        d = str.match(re);
        if (!d) {
            MagnetJS.Log.fine("Couldn't parse ISO 8601 date string '" + str + "'");
            return false;
        }
        var a = [1,2,3,4,5,6,10,11];
        for(var i in a) d[a[i]] = parseInt(d[a[i]], 10);
        d[7] = parseFloat(d[7]);
        var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);
        if (d[7] > 0) ms += Math.round(d[7] * 1000);
        if (d[8] != "Z" && d[10]) {
            var offset = d[10] * 60 * 60 * 1000;
            if (d[11]) offset += d[11] * 60 * 1000;
            if (d[9] == "-") ms -= offset;
            else ms += offset;
        }
        return new Date(ms);
    },
    /**
     * Convert a UTF-8 string into URI-encoded base64 string.
     * @param input A UTF-8 string.
     * @returns {string} An equivalent URI-encoded base64 string.
     */
    stringToBase64 : function(input) {
        return (this.isNode === true && typeof Buffer !== 'undefined') ? new Buffer(input).toString('base64') : window.btoa(unescape(encodeURIComponent(input)));
    },
    /**
     * Convert a URI-encoded base64 string into a UTF-8 string.
     * @param input A URI-encoded base64 string.
     * @returns {string} An equivalent UTF-8 string.
     */
    base64ToString : function(input) {
        return (this.isNode === true && typeof Buffer !== 'undefined') ? new Buffer(input, 'base64').toString('utf8') : decodeURIComponent(escape(window.atob(input)));
    },
    /**
     * Generate a GUID.
     * @returns {string} A new GUID.
     */
    getGUID : function() {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
    },
    /**
     * Generate a GUID without hyphen.
     * @returns {string} A new GUID.
     */
    getCleanGUID: function() {
        return this.getGUID().replace(/-/g, '');
    },
    /**
     * Collect browser and version.
     * @returns {string} browser and version.
     */
    getBrowser : function() {
        //browser
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browser = navigator.appName;
        var version = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // Opera
        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // MSIE
        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // EDGE
        else if (nAgt.indexOf('Edge/') != -1) {
            browser = 'Microsoft Edge';
            version = nAgt.substring(nAgt.indexOf('Edge/') + 5);
        }
        // Chrome
        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (nAgt.indexOf('Trident/') != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if (browser.toLowerCase() == browser.toUpperCase()) {
                browser = navigator.appName;
            }
        }
        // trim the version string
        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

        majorVersion = parseInt('' + version, 10);
        if (isNaN(majorVersion)) {
            version = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        return browser + ' ' + version + ' (' + majorVersion + ') ' + (mobile || '');
    },
    /**
     * Collect operating system and version.
     * @returns {string} operating system and version.
     */
    getOS : function() {
        var osVersion = '-';
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;

        // system
        var os = '-';
        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'Android':
                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
        }

        return {
            os: os,
            osVersion: osVersion
        };
    }
};

/**
 * @class A simple implementation of the Promise API. A Promise object manages state and facilitates a callback after
 * all the associated asynchronous actions of a Deferred object have completed. Multiple promises can be chained with
 * the 'then' function.
 * @constructor
 */
MagnetJS.Promise = function() {
    this.successes = [];
    this.failures = [];
    this.completions = [];
};

MagnetJS.Promise.prototype = {
    successes   : null,
    failures    : null,
    completions : null,
    status      : 'pending',
    args        : null,
    _isPromise  : true,
    /**
     * Stores success and error callbacks, and calls them if the Promise status is 'resolved' or 'rejected'.
     * @param success A callback that is fired upon a 'resolved' status.
     * @param error A callback that is fired upon a 'rejected' status.
     * @returns {MagnetJS.Promise} A promise object.
     */
    then : function(success, error) {
        var defer = new MagnetJS.Deferred();
        if (success)
            this.successes.push({
                fn    : success,
                defer : defer
            });
        if (error)
            this.failures.push({
                fn    : error,
                defer : defer
            });
        if (this.status === 'resolved')
            this.exec({
                fn    : success,
                defer : defer
            }, this.args);
        else if (this.status === 'rejected')
            this.exec({
                fn    : error,
                defer : defer
            }, this.args);
        return defer.promise;
    },
    /**
     * Stores a single callback and calls it regardless of whether Promise status is 'resolved' or 'rejected'.
     * @param callback A callback that is fired upon completion.
     * @returns {MagnetJS.Promise} A promise object.
     */
    always : function(callback) {
        var defer = new MagnetJS.Deferred();
        if (callback)
            this.completions.push({
                fn    : callback,
                defer : defer
            });
        if (this.status === 'resolved' || this.status === 'rejected')
            this.exec({
                fn    : callback,
                defer : defer
            }, this.args);
        return defer.promise;
    },
    /**
     * Stores a callback which is fired if the Promise is resolved.
     * @param {function} success A success callback.
     * @returns {MagnetJS.Promise}
     */
    success : function(success) {
        var defer = new MagnetJS.Deferred();
        if (success)
            this.successes.push({
                fn    : success,
                defer : defer
            });
        if (this.status === 'resolved')
            this.exec({
                fn    : success,
                defer : defer
            }, this.args);
        return this;
    },
    /**
     * Stores a callback that is fired if the Promise is rejected.
     * @param {function} error The error callback to be stored.
     * @returns {MagnetJS.Promise} A promise object.
     */
    error : function(error) {
        var defer = new MagnetJS.Deferred();
        if (error)
            this.failures.push({
                fn    : error,
                defer : defer
            });
        if (this.status === 'rejected')
            this.exec({
                fn    : error,
                defer : defer
            }, this.args);
        return this;
    },
    /**
     * Call and resolve a callback. If the result is a Promise object, bind a
     * new set of callbacks to the Promise object to continue the chain.
     * @param {object} obj An object containing the callback function and a Deferred object.
     * @param {*} args Arguments associated with this Promise.
     */
    exec : function(obj, args) {
        setTimeout(function() {
            var res = obj.fn.apply(null, args);
            if (MagnetJS.Utils.isObject(res) && res._isPromise)
                obj.defer.bind(res);
        }, 0);
    }
};
/**
 * @class A Deferred object handles execution of resolve and reject methods, which trigger the success or error callbacks.
 * @constructor
 */
MagnetJS.Deferred = function() {
    this.promise = new MagnetJS.Promise();
};
MagnetJS.Deferred.prototype = {
    promise : null,
    /**
     * Resolve the Deferred object.
     */
    resolve : function() {
        var i, promise = this.promise;
        promise.args = arguments;
        promise.status = 'resolved';
        for(i=0;i<promise.successes.length;++i)
            promise.exec(promise.successes[i], promise.args)
        for(i=0;i<promise.completions.length;++i)
            promise.exec(promise.completions[i], promise.args)
    },
    /**
     * Reject the Deferred object.
     */
    reject : function() {
        var i, promise = this.promise;
        promise.args = arguments;
        promise.status = 'rejected';
        for(i=0;i<promise.failures.length;++i)
            promise.exec(promise.failures[i], promise.args)
        for(i=0;i<promise.completions.length;++i)
            promise.exec(promise.completions[i], promise.args)
    },
    /**
     * Bind a new set of callbacks to be fired upon completion of the Promise.
     */
    bind : function(promise) {
        var me = this;
        promise.then(function() {
            me.resolve.apply(me, arguments);
        }, function() {
            me.reject.apply(me, arguments);
        })
    }
};
/**
 * Asynchronously execute the specified promises. On completion, return an array of success and error arguments in a 'then' function.
 * @param {MagnetJS.Promise} promises An object containing the specified promises.
 */
MagnetJS.Deferred.all = function() {
    var deferred = new MagnetJS.Deferred();
    var successes = [], failures = [], ctr = 0, total = arguments.length;
    for(var i=0;i<total;++i) {
        arguments[i].call(null).then(function() {
            successes.push(arguments);
            if (++ctr == total) deferred.resolve(successes, failures);
        }, function() {
            failures.push(arguments);
            if (++ctr == total) deferred.resolve(successes, failures);
        });
    }
    return deferred.promise;
};

/**
 * A class for extending an object with an event.
 * @memberof MagnetJS
 * @namespace Events
 * @ignore
 */
MagnetJS.Events = {
    /**
     * Extends an existing object to handle events.
     * @param {object} me An instance of a MagnetJS Controller.
     * @returns {boolean} Indicates whether the event handlers were created.
     */
    create : function(me) {
        if (!me._events && !me.invoke && !me.on && !me.unbind) {
            me._events = {};
            me.on = function(eventId, callback) {
                me._events[eventId] = me._events[eventId] || [];
                me._events[eventId].push(callback);
            };
            me.invoke = function(events) {
                if (typeof events === typeof []) {
                    for(var i=events.length;i--;) {
                        if (me._events[events[i]]) {
                            for(var j=me._events[events[i]].length;j--;) {
                                me._events[events[i]][j].apply(this, [].slice.call(arguments, 1));
                            }
                        }
                    }
                } else {
                    if (me._events[events]) {
                        for(var k=me._events[events].length;k--;) {
                            me._events[events][k].apply(this, [].slice.call(arguments, 1));
                        }
                    }
                }
            };
            me.unbind = function(eventId) {
                if (me._events[eventId]) delete me._events[eventId];
            };
            return true;
        } else {
            return false;
        }
    }
};

/**
 * A connector to manage data in a Web SQL database.
 * @memberof MagnetJS
 * @namespace SQLConnector
 * @ignore
 */
MagnetJS.SQLConnector = {
    /**
     * @attribute {Database} [db] An SQL Lite database object.
     */
    db : undefined,
    schemas : {},
    /**
     * @attribute {object} dbOptions SQL Lite database options.
     */
    dbOptions : {
        name    : 'MMSDK',
        version : '1.0',
        display : 'Magnet_JS_SDK_DB',
        size    : 5000000
    },
    create : function(table, kvp, callback, failback) {
        var me = this;
        me.db.transaction(function(tx) {
            var props = MagnetJS.Utils.getAttributes(kvp).join(', ');
            var vals = MagnetJS.Utils.getValues(kvp);
            MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
            tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals, function(insertTX, res) {
                kvp.id = res.insertId;
                callback(kvp);
            });
        }, function(e) {
            MagnetJS.Log('error inserting a record: ', e);
            failback(e);
        });
    },
    update : function(table, id, kvp, callback, failback) {
        this.db.transaction(function(tx) {
            delete kvp.id;
            var props = MagnetJS.Utils.getAttributes(kvp).join('=?, ')+'=?';
            var vals = MagnetJS.Utils.getValues(kvp);
            vals.push(id);
            MagnetJS.Log('UPDATE '+table+' SET '+props+' WHERE id=?', vals);
            tx.executeSql('UPDATE '+table+' SET '+props+' WHERE id=?', vals, function() {
                callback(kvp);
            });
        }, function(e) {
            MagnetJS.Log('error updating a record: ', e);
            failback(e);
        });
    },
    get : function(table, input, callback, failback) {
        var me = this;
        me.db.transaction(function(tx) {
            if (typeof input === 'undefined' || input === null || input === '') input = {1:1};
            var props, vals, isQuery = typeof input === 'object';
            if (isQuery) {
                props = MagnetJS.Utils.getAttributes(input).join('=? AND ')+'=?';
                vals = MagnetJS.Utils.getValues(input);
            } else {
                props = 'id=?';
                vals = [input];
            }
            MagnetJS.Log('SELECT * FROM '+table+' WHERE '+props, vals);
            tx.executeSql('SELECT * FROM '+table+' WHERE '+props, vals, function(tx, results) {
                callback(me.formatResponse(results.rows, isQuery));
            }, function(e) {
                MagnetJS.Log('error retrieving records: ', e);
                failback(e);
            });
        }, function(e) {
            MagnetJS.Log('error setting up web sql transaction: ', e);
            failback(e);
        });
    },
    formatResponse : function(rows, isQuery) {
        var ary = [];
        for(var i=0;i<rows.length;++i)
            ary.push(rows.item(i));
        return isQuery ? ary : ary[0];
    },
    remove : function(table, input, callback, failback) {
        var me = this;
        me.db.transaction(function(tx) {
            var props = [], vals = [], aryProps = [], aryVals = [];
            if (typeof input === 'object') {
                for(var prop in input) {
                    if (MagnetJS.Utils.isArray(input[prop])) {
                        aryProps.push(prop+' IN ('+me.getPlaceholders(input[prop])+')');
                        aryVals = aryVals.concat(MagnetJS.Utils.getValues(input[prop]));
                    } else {
                        props.push(prop+'=?');
                        vals.push(input[prop]);
                    }
                }
                props = props.concat(aryProps).join(' AND ');
                vals = vals.concat(aryVals);
            } else {
                props = 'id=?';
                vals = [input];
            }
            MagnetJS.Log('DELETE FROM '+table+' WHERE '+props, vals);
            tx.executeSql('DELETE FROM '+table+' WHERE '+props, vals);
        }, function(e) {
            MagnetJS.Log('error deleting a record: ', e);
            failback(e);
        }, callback);
    },
    clearTable : function(table, callback, failback) {
        this.db.transaction(function(tx) {
            MagnetJS.Log('DELETE FROM '+table);
            tx.executeSql('DELETE FROM '+table);
        }, function(e) {
            MagnetJS.Log('error clearing table: ', e);
            failback(e);
        }, callback);
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback, failback) {
        var me = this, props, vals, columns = ['id INTEGER PRIMARY KEY AUTOINCREMENT'];
        if (typeof schema === 'object') {
            for(var prop in schema)
                columns.push(prop+' '+schema[prop]);
            columns = columns.join(', ');
            me.schemas[table] = schema;
        }
        me.db.transaction(function(tx) {
            MagnetJS.Log('CREATE TABLE IF NOT EXISTS '+table+' ('+columns+')');
            tx.executeSql('CREATE TABLE IF NOT EXISTS '+table+' ('+columns+')');
            if (clearRecords === true) {
                MagnetJS.Log('DELETE FROM '+table);
                tx.executeSql('DELETE FROM '+table);
            }
            if (MagnetJS.Utils.isArray(kvps)) {
                for(var i=0;i<kvps.length;++i) {
                    props = MagnetJS.Utils.getAttributes(kvps[i]).join(', ');
                    vals = MagnetJS.Utils.getValues(kvps[i]);
                    MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                    tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                }
            } else if (kvps) {
                props = MagnetJS.Utils.getAttributes(kvps).join(', ');
                vals = MagnetJS.Utils.getValues(kvps);
                MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
            }
        }, function(e) {
            MagnetJS.Log('error executing web sql transaction: ', e);
            failback(e);
        }, callback);
    },
    getPlaceholders : function(vals) {
        var ques = [];
        for(var i=0;i<vals.length;++i) ques.push('?');
        return ques.join(', ');
    }
};
/**
 * A connector to manage data in a local storage database.
 * @memberof MagnetJS
 * @namespace LocalStorage
 * @ignore
 */
MagnetJS.LocalStorageConnector = {
    create : function(table, kvp, callback) {
        setTimeout(function() {
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table)) || [];
            kvp.id = MagnetJS.Utils.getGUID();
            tableData.push(kvp);
            window.localStorage.setItem(table, JSON.stringify(tableData));
            callback(kvp);
        }, 1);
    },
    update : function(table, id, kvp, callback, failback) {
        var record;
        setTimeout(function() {
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if (tableData) {
                for(var i=0;i<tableData.length;++i) {
                    if (tableData[i].id == id) {
                        for(var key in kvp)
                            tableData[i][key] = kvp[key];
                        record = tableData[i];
                    }
                }
                if (typeof record === 'undefined') {
                    failback('record-not-exist');
                } else {
                    window.localStorage.setItem(table, JSON.stringify(tableData));
                    callback(record);
                }
            } else {
                failback('table-not-exist');
            }
        }, 1);
    },
    get : function(table, input, callback, failback) {
        var records = [], valid = true;
        setTimeout(function() {
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if (tableData) {
                if (typeof input === 'object') {
                    for(var i=0;i<tableData.length;++i) {
                        for(var key in input)
                            if (tableData[i][key] !== input[key])
                                valid = false;
                        if (valid === true) records.push(tableData[i]);
                        valid = true;
                    }
                } else if (typeof input === 'undefined' || input === null || input === '') {
                    records = tableData;
                } else {
                    records = undefined;
                    for(var i=0;i<tableData.length;++i) {
                        if (tableData[i].id == input) {
                            records = tableData[i];
                            break;
                        }
                    }
                }
                callback(records);
            } else {
                failback('table-not-exist');
            }
        }, 1);
    },
    remove : function(table, input, callback, failback) {
        var matched = true;
        setTimeout(function() {
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if (tableData) {
                for(var i=tableData.length;i--;) {
                    if (typeof input === 'object') {
                        matched = true;
                        for(var prop in input) {
                            if (MagnetJS.Utils.isArray(input[prop])) {
                                if (input[prop].indexOf(tableData[i][prop]) == -1) matched = false;
                            } else {
                                if (tableData[i][prop] !== input[prop]) matched = false;
                            }
                        }
                        if (matched) tableData.splice(i, 1);
                    } else {
                        if (tableData[i].id == input) tableData.splice(i, 1);
                    }
                }
                window.localStorage.setItem(table, JSON.stringify(tableData));
                callback();
            } else {
                failback('table-not-exist');
            }
        }, 1);
    },
    clearTable : function(table, callback) {
        setTimeout(function() {
            window.localStorage.setItem(table, JSON.stringify([]));
            callback();
        }, 1);
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback) {
        setTimeout(function() {
            var tableData = (clearRecords === true ? [] : MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table))) || [];
            if (MagnetJS.Utils.isArray(kvps)) {
                for(var i=0;i<kvps.length;++i) {
                    kvps[i].id = MagnetJS.Utils.getGUID();
                    tableData.push(kvps[i]);
                }
            } else if (kvps) {
                kvps.id = MagnetJS.Utils.getGUID();
                tableData.push(kvps);
            }
            window.localStorage.setItem(table, JSON.stringify(tableData));
            callback();
        }, 1);
    }
};
/**
 * A connector to manage data in non-persistent memory store.
 * @memberof MagnetJS
 * @namespace SQLConnector
 * @ignore
 */
MagnetJS.MemoryStoreConnector = {
    /**
     * @attribute {object} memory Memory store for Node.js and other platforms which do not support localStorage.
     */
    memory : {},
    create : function(table, kvp, callback) {
        this.memory[table] = this.memory[table] || [];
        kvp.id = MagnetJS.Utils.getGUID();
        this.memory[table].push(kvp);
        callback(kvp);
    },
    update : function(table, id, kvp, callback, failback) {
        var record;
        if (this.memory[table]) {
            for(var i=0;i<this.memory[table].length;++i) {
                if (this.memory[table][i].id === id) {
                    for(var key in kvp)
                        this.memory[table][i][key] = kvp[key];
                    record = this.memory[table][i];
                }
            }
            if (typeof record === 'undefined')
                failback('record-not-exist');
            else
                callback(record);
        } else {
            failback('table-not-exist');
        }
    },
    get : function(table, input, callback, failback) {
        var records = [], valid = true;
        if (this.memory[table]) {
            if (typeof input === 'object') {
                for(var i=0;i<this.memory[table].length;++i) {
                    for(var key in input)
                        if (this.memory[table][i][key] !== input[key])
                            valid = false;
                    if (valid === true) records.push(this.memory[table][i]);
                    valid = true;
                }
            } else if (typeof input === 'undefined' || input === null || input === '') {
                records = this.memory[table];
            } else {
                records = undefined;
                for(var i=0;i<this.memory[table].length;++i) {
                    if (this.memory[table][i].id == input) {
                        records = this.memory[table][i];
                        break;
                    }
                }
            }
            callback(records);
        } else {
            failback('table-not-exist');
        }
    },
    remove : function(table, input, callback, failback) {
        var matched = true;
        if (this.memory[table]) {
            for(var i=this.memory[table].length;i--;) {
                if (typeof input === 'object') {
                    matched = true;
                    for(var prop in input) {
                        if (MagnetJS.Utils.isArray(input[prop])) {
                            if (input[prop].indexOf(this.memory[table][i][prop]) == -1)
                                matched = false;
                        } else {
                            if (this.memory[table][i][prop] !== input[prop])
                                matched = false;
                        }
                    }
                    if (matched) this.memory[table].splice(i, 1);
                } else {
                    if (this.memory[table][i].id == input) {
                        this.memory[table].splice(i, 1);
                    }
                }
            }
            callback();
        } else {
            failback('table-not-exist');
        }
    },
    clearTable : function(table, callback) {
        this.memory[table] = [];
        callback();
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback) {
        this.memory[table] = (clearRecords === true ? [] : this.memory[table]) || [];
        if (MagnetJS.Utils.isArray(kvps)) {
            for(var i=0;i<kvps.length;++i) {
                kvps[i].id = MagnetJS.Utils.getGUID();
                this.memory[table].push(kvps[i]);
            }
        } else if (kvps) {
            kvps.id = MagnetJS.Utils.getGUID();
            this.memory[table].push(kvps);
        }
        callback();
    }
};

/**
 * A class for storing a value into persistent storage. Currently relies on HTML5 localStorage.
 * Clients that do not support localStorage will fall back to a memory store that will not persist past a
 * restart of the app.
 * @memberof MagnetJS
 * @namespace Storage
 * @ignore
 */
MagnetJS.Storage = {
    /**
     * @attribute {object} connector The data connector to be used.
     */
    connector : MagnetJS.MemoryStoreConnector,
    /**
     * Create an object.
     * @param {string} table The table in the database.
     * @param {*} kvp An object containing values to set on the object.
     */
    create : function(table, kvp, callback, failback) {
        this.connector.create(table, kvp, function(record) {
            if (typeof callback === typeof Function)
                callback(record);
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Update values of the object corresponding to the specified ID.
     * @param {string} table The table in the database.
     * @param {*} id The unique identifier of the object to set.
     * @param {*} kvp An object containing values to set on the object.
     */
    update : function(table, id, kvp, callback, failback) {
        this.connector.update(table, id, kvp, function(record) {
            if (typeof callback === typeof Function)
                callback(record);
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Get an object using an ID or a query. A query is an object of properties, each containing an array of property matches. For example, {"foo":"a1"]}.
     * @param {string} table The table in the database.
     * @param {string|object} input An ID or a query object containing the required matches.
     */
    get : function(table, input, callback, failback) {
        this.connector.get(table, input, function(records) {
            if (typeof callback === typeof Function)
                callback(records);
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Remove an object using an ID or a query. A query is an object of properties, each containing an array of property matches. For example, {"foo":"a1"]}.
     * @param {string} table The table in the database.
     * @param {*} id The unique identifier of the object to remove.
     */
    remove : function(table, input, callback, failback) {
        this.connector.remove(table, input, function() {
            if (typeof callback === typeof Function)
                callback();
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Clear a table.
     * @param {string} table The table in the database.
     */
    clearTable : function(table, callback, failback) {
        this.connector.clearTable(table, function() {
            if (typeof callback === typeof Function)
                callback();
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Retrieve or create a keystore, and return it.
     * @param {string} table The table in the database.
     * @param {object} schema An object containing the property types.
     * @param {object|array} [kvps] An array of objects to add to the table, or a single object.
     * @param {boolean} [clearTable] If enabled, the table will be cleared.
     */
    createTableIfNotExist : function(table, schema, kvps, clearTable, callback, failback) {
        this.connector.createTableIfNotExist(table, schema, kvps, clearTable, function() {
            if (typeof callback === typeof Function)
                callback();
        }, function(e) {
            if (typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Selects the best storage persister available to be used by the platform.
     */
    setupConnector : function() {
        MagnetJS.Storage.connector = MagnetJS.MemoryStoreConnector;
        return;

        if (MagnetJS.Utils.hasFeature('openDatabase')) {
            MagnetJS.SQLConnector.db = window.openDatabase(
                MagnetJS.SQLConnector.dbOptions.name,
                MagnetJS.SQLConnector.dbOptions.version,
                MagnetJS.SQLConnector.dbOptions.display,
                MagnetJS.SQLConnector.dbOptions.size
            );
            MagnetJS.Storage.connector = MagnetJS.SQLConnector;
        } else if (MagnetJS.Utils.hasFeature('localStorage') === true) {
            MagnetJS.Storage.connector = MagnetJS.LocalStorageConnector;
        } else {
            MagnetJS.Storage.connector = MagnetJS.MemoryStoreConnector;
        }

    }
};
MagnetJS.Storage.setupConnector();


/**
 * The {MagnetJS.Log} makes it easier to troubleshoot client side problems in mobile applications installed
 * on mobile devices, where examining logs of individual devices is not possible. Since the logs can be sent
 * by the SDK without user intervention, problems can be identified and fixed without user involvement.
 * @memberof MagnetJS
 * @namespace Log
 */
MagnetJS.Log = {};
MagnetJS.Log.store = 'MMSDKLogstore';
/**
 * @attribute {boolean} storeReady Determines whether the log store is ready for use.
 */
MagnetJS.Log.storeReady = false;
/**
 * @attribute {object} Level A key-value pair of all log levels.
 */
MagnetJS.Log.Level = {
    SEVERE  : 500,
    WARNING : 400,
    INFO    : 300,
    CONFIG  : 200,
    FINE    : 100
};

MagnetJS.Storage.createTableIfNotExist(MagnetJS.Log.store, {
    date      : 'TEXT',
    level     : 'TEXT',
    msg       : 'TEXT',
    metadata  : 'TEXT',
    logSource : 'TEXT',
    file      : 'TEXT'
}, null, false, function() {
    MagnetJS.Log.storeReady = true;
});

/**
 * @method
 * @desc Store log record as SEVERE log level.
 * @param {string} msg The message to log.
 * @param {object} [metadata] Metadata related to the log.
 * @param {string} [logSource] The source for the log (anything other than "server" is permitted).
 * @param {*} [file] Any extra data the mobile client desires to associate with the log record.
 */
MagnetJS.Log.severe = function(msg, metadata, logSource, file) {
    this.log(this.Level.SEVERE, [].slice.apply(arguments));
};
/**
 * @method
 * @desc Store log record as WARNING log level.
 * @param {string} msg The message to log.
 * @param {object} [metadata] Metadata related to the log.
 * @param {string} [logSource] The source for the log (anything other than "server" is permitted).
 * @param {*} [file] Any extra data the mobile client desires to associate with the log record.
 */
MagnetJS.Log.warning = function(msg, metadata, logSource, file) {
    this.log(this.Level.WARNING, [].slice.apply(arguments));
};
/**
 * @method
 * @desc Store log record as INFO log level.
 * @param {string} msg The message to log.
 * @param {object} [metadata] Metadata related to the log.
 * @param {string} [logSource] The source for the log (anything other than "server" is permitted).
 * @param {*} [file] Any extra data the mobile client desires to associate with the log record.
 */
MagnetJS.Log.info = function(msg, metadata, logSource, file) {
    this.log(this.Level.INFO, [].slice.apply(arguments));
};
/**
 * @method
 * @desc Store log record as CONFIG log level.
 * @param {string} msg The message to log.
 * @param {object} [metadata] Metadata related to the log.
 * @param {string} [logSource] The source for the log (anything other than "server" is permitted).
 * @param {*} [file] Any extra data the mobile client desires to associate with the log record.
 */
MagnetJS.Log.config = function(msg, metadata, logSource, file) {
    this.log(this.Level.CONFIG, [].slice.apply(arguments));
};
/**
 * @method
 * @desc Store log record as FINE log level.
 * @param {string} msg The message to log.
 * @param {object} [metadata] Metadata related to the log.
 * @param {string} [logSource] The source for the log (anything other than "server" is permitted).
 * @param {*} [file] Any extra data the mobile client desires to associate with the log record.
 */
MagnetJS.Log.fine = function(msg, metadata, logSource, file) {
    this.log(this.Level.FINE, [].slice.apply(arguments));
};
/**
 * @method
 * @desc Store log record to the configured {MagnetJS.Storage} log store.
 * @param {*} levelOrWeight The log level as a string or log level weight as an integer defined in {MagnetJS.Log.Level}.
 * @param {array} params An array of log record parameters
 */
MagnetJS.Log.log = function(levelOrWeight, params) {
    var weight = typeof levelOrWeight == 'number' ? levelOrWeight : getLevelOrWeight(levelOrWeight);
    var level = typeof levelOrWeight == 'string' ? levelOrWeight : getLevelOrWeight(weight);
    if (!MagnetJS.Config.logging || weight < MagnetJS.Log.Level[MagnetJS.Config.logLevel]) return;
    var date = MagnetJS.Utils.dateToISO8601(new Date());
    var msg = params[0] || null;
    var metadata = params[1] ? ((MagnetJS.Utils.isAndroid || MagnetJS.Utils.isIOS) ? JSON.stringify(params[2]) : params[1]) : null;
    var logSource = params[2] || null;
    var file = params[3] ? MagnetJS.Utils.stringToBase64(params[3]) : null;
    if (MagnetJS.Config.logHandler.indexOf('Console') != -1)
        console.log('[MAGNET DEBUG] ', date, level || '', msg || '', metadata || '', logSource || '', file || '');
    if (MagnetJS.Config.logHandler.indexOf('DB') != -1) {
        if (this.storeReady) {
            MagnetJS.Storage.create(this.store, {
                date      : date,
                level     : level,
                msg       : msg,
                metadata  : metadata,
                logSource : logSource,
                file      : file
            }, null, function() {
                console.error('error storing log record');
            });
        } else {
            console.error('log store not ready yet.')
        }
    }
};
// given a log level or weight, return opposite
function getLevelOrWeight(levelOrWeight) {
    var level;
    for(var key in MagnetJS.Log.Level) {
        if (MagnetJS.Log.Level[key] === levelOrWeight)
            level = key;
        if (key === levelOrWeight)
            level = MagnetJS.Log.Level[key];
    }
    return level;
}
/**
 * @method
 * @desc Sends all records in the log store to the Magnet Mobile App Server. On a successful dump, the logs in the log store will be cleared.
 * @param {function} [callback] Callback to fire after a successful dump.
 * @param {function} [failback] Callback to fire after a failed attempt.
 */
MagnetJS.Log.dump = function(callback, failback) {
    MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data) {
        var text = '';
        for(var i=0;i<data.length;++i)
            text += JSON.stringify(data[i])+'\r\n';
        MagnetJS.LoggingService.logBatch({
            file : {
                mimeType : 'text/plain',
                val      : text
            }
        }, {
            success : function(data, details) {
                MagnetJS.Storage.clearTable(MagnetJS.Log.store, function() {
                    if (typeof callback === typeof Function) callback(data, details);
                }, failback);
            },
            error : failback
        });
    }, function(e) {
        console.error('failed to send log data');
        if (typeof failback === typeof Function) failback(e);
    });
};
/**
 * @method
 * @desc Clear all records in the log store without dumping to the server.
 * @param {function} [callback] Callback to fire after a successful dump.
 * @param {function} [failback] Callback to fire after a failed attempt.
 */
MagnetJS.Log.clear = function(callback, failback) {
    MagnetJS.Storage.clearTable(MagnetJS.Log.store, callback, failback);
};

// log uncaught exceptions
if (typeof window !== 'undefined' && typeof window.onError !== 'undefined') {
    window.onError = function(err, url, line) {
        try{
            throw new Error('magnet');
        }catch(e) {
            err = err + '\n' + (e.stack ? e.stack : e.sourceURL) + ":" + e.line;
        }
        MagnetJS.Log.severe(err, {
            url  : url,
            line : line
        });
        return false;
    };
}

var Cookie = {
    create : function(name, val, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = '; expires=' + date.toGMTString();
        } else {
            var expires = '';
        }
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(val) + expires + '; path=/';
    },
    get : function(name) {
        var nameEQ = encodeURIComponent(name) + '=';
        var ca = document.cookie.split(';');
        for (var i=0;i<ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length)
            };
            if (c.indexOf(nameEQ) == 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length))
            }
        }
        return null;
    },
    remove : function(name) {
        this.create(name, "", -1);
    }
};

/**
 * @method
 * @desc Set MagnetJS SDK configuration attributes.
 * @param {object} obj An object containing key-value pairs to be set in the MagnetJS attributes.
 */
MagnetJS.set = function(obj) {
    for(var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            if (prop == 'endpointUrl' && /^(ftp|http|https):/.test(obj[prop] === false))
                throw('invalid endpointUrl - no protocol');
            MagnetJS.Config[prop] = obj[prop];
        }
    }
    return this;
};
/**
 * @method
 * @desc Reset MagnetJS SDK configuration attributes to their default values.
 */
MagnetJS.reset = function() {
    MagnetJS.set({
        mmxEndpoint : '',
        logging     : true
    });
    return this;
};
/**
 * @method
 * @desc Load a model or controller resource into memory. For NodeJS only.
 * @param {string} path A relative path to the entity or controller resource.
 */
MagnetJS.define = function(path) {
    var resource = require(path), type = resource.Controllers ? 'Controllers' : 'Models';
    MagnetJS.Utils.mergeObj(MagnetJS[type], resource[type]);
    return this;
};

var mCurrentDevice = null;
var mCurrentUser = null;
var mXMPPConnection = null;

MagnetJS.Events.create(MagnetJS);

MagnetJS.init = function(cfg) {
    // TODO: prevent second call
    MagnetJS.App.clientId = cfg.clientId;
    MagnetJS.App.clientSecret = cfg.clientSecret;
    MagnetJS.Config.mmxEndpoint = cfg.baseUrl;
    MagnetJS.Device.checkInWithDevice();
};

MagnetJS.onReady = function(cb) {
    if (MagnetJS.App.initialized === true) return cb();

    var readyCheck = setInterval(function() {
        if (MagnetJS.App.initialized === true) {
            clearInterval(readyCheck);
            (cb || function() {})();
        }
    }, 100);
};

MagnetJS.getCurrentUser = function() {
    return mCurrentUser || null;
};

MagnetJS.start = function() {
    MagnetJS.App.receiving = true;
    mXMPPConnection.priority = 0;
};

MagnetJS.stop = function() {
    MagnetJS.App.receiving = false;
    mXMPPConnection.priority = -255;
};
