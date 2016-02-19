
/**
 * The LoggingService makes it easier to troubleshoot client side problems in mobile applications installed
 * on several hundreds of mobile devices, where examining logs of individual devices is not possible. Since
 * the logs can be sent by the SDK without user intervention, problems can be identified and fixed without
 * user involvement.
 */
MagnetJS.LoggingService = new MagnetJS.Controller('MMSDKLoggingService');

// Use this method when you want a batch of log messages interlaced with server logs.
MagnetJS.LoggingService.logBatch = function(data, options) {
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name       : 'logBatch',
            path       : '/user/logging/batch',
            method     : 'POST',
            returnType : 'boolean'
        },
        schema : {
            "date" : {
                style    : 'HEADER',
                type     : 'date',
                optional : true
            },
            "logSource" : {
                style    : 'HEADER',
                type     : 'string',
                optional : true
            },
            "level" : {
                style    : 'HEADER',
                type     : 'string',
                optional : true
            },
            "file" : {
                style    : 'PLAIN',
                type     : '_data',
                optional : true
            }
        }
    });
};

/**
 * Facilitates client side authentication against a Magnet Mobile App Server. Upon a successful login, a new session will be created
 * and used for any subsequent controller calls. If the session has expired or the logout function has been called, requests requiring
 * authentication will return with a 401 HTTP status code.
 * @memberof MagnetJS
 * @namespace LoginService
 */
MagnetJS.LoginService = new MagnetJS.Controller('MMSDKLoginService');
MagnetJS.LoginService.store = 'MMSDKConnection';
MagnetJS.LoginService.connectionStatus = 'NoAuthorization';

/**
 * Log in to an Magnet Mobile App Server instance using the supplied credentials. Upon successful login, controller calls will use the newly
 * created session to make requests.
 * @memberof MagnetJS.LoginService
 * @param {object} data The request data.
 * @param {string} data.name Username.
 * @param {string} data.password Password.
 * @param {string} [data.authority] Authority.
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.LoginService.login = function(data, options) {
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name        : 'login',
            path        : '/login',
            method      : 'POST',
            dataType    : 'html',
            contentType : 'application/x-www-form-urlencoded',
            returnType  : 'string'
        },
        attributes : {
            authority : 'magnet'
        },
        schema : {
            name : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : false
            },
            password : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : false
            },
            authority : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : true
            }
        }
    });
};
/**
 * Log in to an Magnet Mobile App Server instance using the supplied credentials. Upon successful login, controller calls will use the newly
 * created session to make requests.
 * @memberof MagnetJS.LoginService
 * @param {object} data The request data.
 * @param {string} data.name Username.
 * @param {string} data.password Password.
 * @param {string} [data.authority] Authority.
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.LoginService.loginWithClientId = function(data, options) {
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name       : 'loginWithClientId',
            path       : '/loginWithClientId',
            method     : 'POST',
            returnType : 'string'
        },
        schema : {
            "authority" : {
                style    : 'FORM',
                type     : 'string',
                optional : true
            },
            "name" : {
                style    : 'FORM',
                type     : 'string',
                optional : true
            },
            "password" : {
                style    : 'FORM',
                type     : 'string',
                optional : true
            }
        }
    });
};
/**
 * Logout from the Magnet Mobile App Server. Subsequent requests to APIs requiring authentication will
 * fail with 401 HTTP status code (Unauthorized).
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.LoginService.logout = function(options) {
    return MagnetJS.Method.call(this, null, options, {
        params : {
            name       : 'logout',
            path       : '/logout',
            method     : 'POST',
            dataType   : 'html',
            returnType : 'void'
        }
    });
};
/*
 * Log in to a Magnet Mobile App Server instance using stored OAuth access token.
 */
MagnetJS.LoginService.loginWithToken = function(data, options) {
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name       : 'loginWithToken',
            path       : '/loginWithToken',
            method     : 'POST',
            returnType : 'string'
        },
        schema : {
            token : {
                style    : 'FORM',
                type     : 'string',
                optional : false
            }
        }
    });
};

/**
 * Log in to the Magnet Mobile App Server using the stored OAuth access token. If the token is missing, the error callback
 * will be fired with a response of "invalid-credentials".
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 */
MagnetJS.LoginService.loginWithAccessToken = function(options) {
    var me = this;
    MagnetJS.Storage.get(me.store, null, function(records) {
        var credentials = (records && records.length > 0) ? MagnetJS.Utils.getValidJSON(MagnetJS.Utils.base64ToString(records[0].hash)) : {};
        if (credentials.token && credentials.endpointUrl) {
            MagnetJS.set({
                endpointUrl : credentials.endpointUrl
            });
            delete credentials.endpointUrl;
            me.loginWithToken(credentials, {
                success : options.success,
                error   : options.error
            });
        } else {
            if (typeof options.error === typeof Function) options.error('invalid-credentials');
        }
    }, options.error);
};

MagnetJS.LoginService.on('MMSDKComplete', function(methodName, result, details) {
    if (methodName == 'login' && result == 'SUCCESS') {
        MagnetJS.LoginService.connectionStatus = 'Authorized';
        MagnetJS.LoginService.invoke(['Authorized'], result, details);
        var token  = (MagnetJS.Utils.isNode ? details.info.response.headers['authorization'] : details.info.xhr.Authorization);
        if (MagnetJS.Config.storeCredentials === true) {
            if (!token)
                MagnetJS.Log.warning('the connected server does not have OAuth enabled, so credentials cannot be stored.');
            MagnetJS.Storage.createTableIfNotExist(this.store, {
                hash : 'TEXT'
            }, {
                hash : MagnetJS.Utils.stringToBase64(JSON.stringify({
                    endpointUrl : MagnetJS.Config.endpointUrl,
                    token       : token ? token.replace('Bearer ', '') : ''
            }))}, true);
        }
        if (MagnetJS.Utils.isNode && details.info.response.headers['set-cookie'])
            MagnetJS.Transport.Headers.Cookie = details.info.response.headers['set-cookie'][0];
    } else if (methodName == 'logout') {
        MagnetJS.LoginService.connectionStatus = 'NoAuthorization';
        MagnetJS.LoginService.invoke(['NoAuthorization'], result, details);
        if (MagnetJS.Utils.isMobile) MagnetJS.Storage.clearTable(this.store);
        if (MagnetJS.Utils.isNode) delete MagnetJS.Transport.Headers.Cookie;
    }
});

var Connection = Connection || {
    UNKNOWN  : 'unknown',
    ETHERNET : 'ethernet',
    WIFI     : 'wifi',
    CELL_2G  : '2g',
    CELL_3G  : '3g',
    CELL_4G  : '4g',
    CELL     : 'cellular',
    NONE     : 'none'
}

/**
 * Catches errors due to an OAuthLoginException, and displays an OAuth dialog prompting the user to enter their credentials.
 * After a successful authentication, the OAuthHandler will resubmit the original request and return the payload
 * in the success callback.
 * @fires MagnetJS.OAuthHandler#OAuthLoginExceptionReceived
 * @fires MagnetJS.OAuthHandler#OAuthFlowComplete
 * @memberof MagnetJS
 * @namespace OAuthHandler
 */
MagnetJS.OAuthHandler = {
    authorize : function(options) {
        if (!options || !options.endpoint) throw('no endpoint specified');
        var authWindow = window.open(options.endpoint, '_blank', 'location=no,toolbar=no');
        if (typeof authWindow !== 'undefined') {
            authWindow.addEventListener('loadstop', function(evt) {
                var code = /MagnetOAuthServlet\?code=(.+)$/.exec(evt.url);
                var error = /\?error=(.+)$/.exec(evt.url) || /\?error_code=(.+)$/.exec(evt.url) || null;
                if (code || error) authWindow.close();
                if (code && typeof options.success === typeof Function) options.success(evt.url, evt);
                if (error && typeof options.error === typeof Function) options.error(error[1], evt);
            }, true);
        } else {
            MagnetJS.Log.warning('OAuth handling error: no InAppBrowser. Install the org.apache.cordova.inappbrowser plugin to handle Oauth.');
            if (typeof options.error === typeof Function) options.error('missing-oauth-plugin', options.endpoint);
        }
    }
};
/**
 * This event is fired when an OAuthLoginException has been received during a controller call.
 * @event MagnetJS.OAuthHandler#OAuthLoginExceptionReceived
 * @type {object}
 * @property {MagnetJS.Controller} instance The controller instance that resulted in the OAuthLoginException.
 * @property {object} options The request options.
 */
/**
 * This event is fired when an OAuth flow has completed.
 * @event MagnetJS.OAuthHandler#OAuthFlowComplete
 * @type {object}
 * @property {MagnetJS.Controller} instance The controller instance that resulted in the OAuthLoginException.
 * @property {object} options The request options.
 */
MagnetJS.Events.create(MagnetJS.OAuthHandler);
MagnetJS.OAuthHandler.on('OAuthLoginException', function(instance, options, metadata, res, callback, failback) {
    MagnetJS.OAuthHandler.invoke('OAuthLoginExceptionReceived', instance, options, metadata, res);
    MagnetJS.OAuthHandler.authorize({
        endpoint : res.message,
        success  : function(code) {
            MagnetJS.OAuthHandler.invoke('OAuthFlowComplete', instance, options, metadata);
            var req = new MagnetJS.Request(instance, options, metadata);
            req.send(callback, failback);
//            MagnetJS.Transport.request(undefined, {
//                path         : code,
//                basePathOnly : true
//            }, metadata, function() {
//                MagnetJS.OAuthHandler.invoke('OAuthFlowComplete', instance, options, metadata);
//                var req = new MagnetJS.Request(instance, options, metadata);
//                req.send(callback, failback);
//            }, function(e, details) {
//                if (typeof failback == typeof Function) failback(e, details);
//            });
        },
        error : function(e, details) {
            if (typeof failback == typeof Function) failback('oauth-flow-error', {
                error   : e,
                details : details
            });
        }
    })
});

/**
 * This class provides the basic cache management, queue management, and reliable calls management.
 * @namespace CallManager
 * @memberof MagnetJS
 */
MagnetJS.CallManager = {
    queueTableName   : 'MMSDKReliableQueues',
    defaultQueueName : 'MMSDKDefault',
    queues           : {},
    cache            : {}
};
// retrieve reliable callOptions and store to memory
function storeCache() {
    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, null, function(records) {
        for(var i=0;i<records.length;++i) {
            MagnetJS.CallManager.queues[records[i].queueName] = MagnetJS.CallManager.queues[records[i].queueName] || [];
            MagnetJS.CallManager.queues[records[i].queueName].push({
                id          : records[i].id,
                callId      : records[i].callId,
                callOptions : MagnetJS.Utils.getValidJSON(records[i].callOptions),
                options     : MagnetJS.Utils.getValidJSON(records[i].options),
                metadata    : MagnetJS.Utils.getValidJSON(records[i].metadata),
                queueName   : records[i].queueName
            });
        }
    });
}
// create a callOptions store if it does not already exist.
MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
    callId      : 'TEXT',
    callOptions : 'TEXT',
    options     : 'TEXT',
    metadata    : 'TEXT',
    queueName   : 'TEXT'
}, null, false, storeCache);
/**
 * Clear all cached results.
 * @param {string} [callId] Optionally specify a call ID to remove.
 */
MagnetJS.CallManager.clearCache = function(callId) {
    if (callId && this.cache[callId]) delete this.cache[callId];
    else this.cache = {};
};
/**
 * Cancel all pending reliable calls.
 * @param {string} [queueName] The queue name.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.cancelAllPendingCalls = function(queueName, callback) {
    if (queueName && this.queues[queueName]) {
        delete this.queues[queueName];
        MagnetJS.Storage.remove(this.queueTableName, {
            queueName : queueName
        }, callback);
    } else {
        this.queues = {};
        MagnetJS.Storage.clearTable(this.queueTableName, callback);
    }
};
/**
 * Shortcut for calling cancelAllPendingCalls and clearCache.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.reset = function(callback) {
    this.clearCache();
    this.cancelAllPendingCalls(undefined, callback);
};
/**
 * Triggers all non-empty thread queues to be awaken (if asleep) to re-attempt processing.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.run = function(callback) {
    var me = this, ctr = 0, deletedIds = [];
    function done() {
        if (deletedIds.length > 0)
            MagnetJS.Storage.remove(me.queueTableName, {
                id : deletedIds
            }, callback);
    }
    if (MagnetJS.Utils.isEmptyObject(me.queues)) {
        done();
    } else {
        for(var queue in me.queues) {
            if (me.queues.hasOwnProperty(queue)) {
                ++ctr;
                me.runQueue(queue, [], function(ids) {
                    setTimeout(function() {
                        deletedIds = deletedIds.concat(ids);
                        if (--ctr == 0) done();
                    }, 1);
                });
            }
        }
    }
};
/**
 * Removes a call from the ReliableCallOptions queue.
 * @param {string} callId The ID of the call to remove.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.removeCallFromQueue = function(callId, callback) {
    for(var queue in this.queues) {
        if (this.queues.hasOwnProperty(queue)) {
            for(var i=0;i<this.queues[queue].length;++i)
                if (this.queues[queue][i].callId === callId) {
                    this.queues[queue].splice(i, 1);
                    break;
                }
        }
    }
    callback();
};
/**
 * Dispose all reliable calls having SUCCESS or FAILED state.
 * @param {function} [clearCache] Enable removal of the calls from the cache.
 * @param {function} [callback] Fires upon success.
 * @param {function} [failback] Fires upon failure.
 */
MagnetJS.CallManager.disposeAllDoneCalls = function(clearCache, callback, failback) {
    var ids = [];
    for(var callId in this.cache)
        ids.push(callId);
    MagnetJS.CallManager.requestCorrelationCleanup(ids, function(data, details) {
        if (clearCache === true) MagnetJS.CallManager.clearCache();
        callback(data, details);
    }, failback);
};
/**
 * Retrieve a Call instance by its unique ID. It is for reliable calls only. May return null if the ID is invalid, the call is timed out, or the asynchronous call was done,
 * which is defined as its cached result becomes obsoleted or overwritten by another invocation.
 * @param {string} callId The call ID to remove.
 * @returns {object} The Call instance to be retrieved.
 */
MagnetJS.CallManager.getCall = function(callId) {
    var call;
    for(var queue in this.queues) {
        if (this.queues.hasOwnProperty(queue)) {
            for(var i=0;i<this.queues[queue].length;++i)
                if (this.queues[queue][i].callId === callId) {
                    call = this.queues[queue][i].options.call;
                    break;
                }
        }
    }
    return call;
};
/**
 * Iterates through an array of reliable call requests, and performs each request in FIFO synchronously until the array is empty or a constraint is not met.
 * @param {string} [queueName] The queue name, if applicable.
 * @param {array} [ids] An array of call option IDs that have been completed.
 * @param {function} done Executes after the queue is drained or a constraint is not met.
 */
MagnetJS.CallManager.runQueue = function(queueName, ids, done) {
    var me = this;
    var store = me.queues[queueName];
    if (MagnetJS.Utils.isArray(store) && store.length > 0) {
        if (me.isExpired(store[0].callOptions.requestAge) === true) {
            ids.push(store[0].id);
            store.shift();
            me.runQueue(queueName, ids, done);
        } else if (me.isConstraintMet(store[0].callOptions.constraint)) {
            var req = new MagnetJS.Request(undefined, store[0].options, store[0].metadata);
            req.send(function(result, details) {
                MagnetJS.ReliableCallListener.invoke(['onSuccess', store[0].callOptions.success], store[0].metadata.params, result, details);
                ids.push(store[0].id);
                store.shift();
                me.runQueue(queueName, ids, done);
            }, function(e, details) {
                MagnetJS.ReliableCallListener.invoke(['onError', store[0].callOptions.error], store[0].metadata.params, e, details);
                ids.push(store[0].id);
                store.shift();
                me.runQueue(queueName, ids, done);
            });
        } else {
            me.queues[queueName] = store;
            done(ids);
        }
    } else {
        delete me.queues[queueName];
        done(ids);
    }
};
/**
 * Cache the given request object.
 * @param {string} callId A unique identifier for this request.
 * @param {object} options The request options to cache.
 * @param {object} metadata The request metadata to cache.
 * @param {function} [callback] Executes after the request object is set.
 */
MagnetJS.CallManager.setRequestObject = function(callId, options, metadata, callback) {
    var queueName = (options.callOptions.queueName && options.callOptions.queueName != '') ? options.callOptions.queueName : this.defaultQueueName;
    var store = this.queues[queueName];
    store = store || [];
    store.push({
        callId      : callId,
        callOptions : options.callOptions,
        options     : options,
        metadata    : metadata,
        queueName   : queueName
    });
    var callObj = {
        callId      : store[store.length-1].callId,
        callOptions : JSON.stringify(store[store.length-1].callOptions),
        options     : JSON.stringify(store[store.length-1].options),
        metadata    : JSON.stringify(store[store.length-1].metadata),
        queueName   : store[store.length-1].queueName
    };
    delete callObj.options.callOptions;
    this.queues[queueName] = store;
    MagnetJS.Storage.create(this.queueTableName, callObj, callback);
};
/**
 * Set the cached value of the specified call ID.
 * @param {string} callId A unique identifier for this request.
 * @param {string} callHash A hash created using the request parameters and body.
 * @param {CallOptions} callOptions The CallOptions object instance.
 * @param {*} result The result data to cache.
 * @param {object} details The details object to cache.
 */
MagnetJS.CallManager.setCacheObject = function(callId, callHash, callOptions, result, details) {
    this.cache[callId] = {
        callOptions : callOptions,
        callHash    : callHash,
        result      : result,
        details     : details || {}
    };
};
/**
 * Retrieve the cached value of the specified call ID if the cached value exists and has not expired.
 * @param {string} callHash A hashed string to match with a cached call.
 * @returns {object} The cached value, or undefined if the cached value has expired or is not available.
 */
MagnetJS.CallManager.getCacheByHash = function(callHash) {
    var cache;
    for(var callId in this.cache) {
        if (this.cache[callId].callHash === callHash) {
            if (this.isExpired(this.cache[callId].callOptions.cacheAge)
                && (this.cache[callId].callOptions.ignoreAgeIfOffline === false
                || this.getConnectionState() != 'NONE'))
                delete this.cache[callId];
            cache = this.cache[callId];
        }
    }
    return cache;
};
/**
 * Generate a call hash given arbitrary string arguments. Uses the CryptoJS MD5 library to generate a hash, or falls back to encodeURIComponent.
 * @param {string} An arbitrary number of string arguments to convert into a hash.
 * @returns {string} A call hash.
 */
MagnetJS.CallManager.getCallHash = function() {
    var args = [].slice.call(arguments).join('|');
    return CryptoJS ? CryptoJS.MD5(args).toString() : encodeURIComponent(args);
};
/**
 * Get the current time in seconds.
 * @returns {number} The current time in seconds.
 */
MagnetJS.CallManager.getTimeInSeconds = function() {
    return Math.round(new Date().getTime() / 1000);
};
/**
 * Determines whether the given age is expired.
 * @returns {boolean} true if the given age is expired, false otherwise.
 */
MagnetJS.CallManager.isExpired = function(age) {
    return this.getTimeInSeconds() >= age;
};
/**
 * Set properties of a CallOptions object.
 * @param {CallOptions} [me] An instance of the CallOptions object. If not specified, "this" in the current scope is used instead.
 * @param {object} properties An object containing key-value pair properties.
 */
MagnetJS.CallManager.set = function(me, properties) {
    me = me || this;
    for(var key in properties)
        if (properties.hasOwnProperty(key))
            if (key == 'cacheTimeout') me.setCacheTimeout(properties[key]);
            else if (key == 'requestTimeout' && me.setRequestTimeout) me.setRequestTimeout(properties[key]);
            else me[key] = properties[key];
};
/**
 * Determines whether the specified constraint is met.
 * @param {array} constraint The constraint requirement object.
 * @returns {boolean} True if the constraint is met, false otherwise.
 */
MagnetJS.CallManager.isConstraintMet = function(constraint) {
    if (constraint && MagnetJS.Utils.isArray(constraint)) {
        var networkTypes = [], validGeo = true, validCustom = true, networkState = this.getConnectionState(), geo = MagnetJS.Geolocation.current;
        for(var i=0;i<constraint.length;++i) {
            if (typeof constraint[i] == 'string')
                networkTypes.push(constraint[i]);
            else if (typeof constraint[i] === typeof Function)
                validCustom = constraint[i]();
        }
        return ((networkTypes.length > 0 ? networkTypes.indexOf(networkState) != -1 : true) && validGeo === true && validCustom === true);
    } else {
        return true;
    }
};
/**
 * Returns the current network connection state through the javascript-native bridge.
 */
MagnetJS.CallManager.getConnectionState = function() {
    var state = 'WIFI';
    if (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.type) {
        var connection = navigator.connection.type;
        switch(connection) {
            case Connection.ETHERNET : state = 'WIFI'; break;
            case Connection.WIFI : state = 'WIFI'; break;
            case Connection.CELL : state = 'CELL'; break;
            case Connection.CELL_2G : state = 'CELL'; break;
            case Connection.CELL_3G : state = 'CELL'; break;
            case Connection.CELL_4G : state = 'CELL'; break;
            case Connection.NONE : state = 'NONE'; break;
            default : state = connection; break;
        }
    }
    return state;
};
/**
 * Dispose of completed call IDs on the server.
 *
 */
MagnetJS.CallManager.requestCorrelationCleanup = function(ids, callback, failback) {
    MagnetJS.Transport.request(null, {
        method : 'GET',
        path   : '/_magnet_cc?ids='+(typeof ids === 'string' ? ids : ids.join(','))
    }, {
        call : new MagnetJS.Call()
    }, callback, failback);
};

/**
 * This interface represents an asynchronous invocation to a controller. An instance of the Call is typically returned by a method call from any Controller
 * implementation. If the options are not specified in the Controller subclass method call, a fail-fast asynchronous call will be assumed.
 * @augments MagnetJS.Promise
 * @constructor
 * @memberof MagnetJS
 */
MagnetJS.Call = function() {
    /**
     * A system generated unique ID for this call.
     * @type {string}
     */
    this.callId;
    /**
     * A custom opaque token provided by the caller.
     * @type {string}
     */
    this.token;
    /**
     * The last cached time of the result. It is available only if the call has completed.
     * @type {Date}
     */
    this.cachedTime;
    /**
     * Indicates whether the result was retrieved from the cache.
     * @type {boolean}
     */
    this.isResultFromCache;
    /**
     * The result returned by the call. This property is undefined if the call failed.
     * @type {*}
     */
    this.result;
    /**
     * The error, if any, that occurred during execution of the call. An undefined error value indicates that the call completed successfully.
     * @type {*}
     */
    this.resultError;
    /**
     * An object containing details of the request.
     * @type {object}
     */
    this.details;
    this.state = MagnetJS.CallState.INIT;
    MagnetJS.Promise.apply(this, arguments);
};
MagnetJS.Call.prototype = new MagnetJS.Promise();
MagnetJS.Call.prototype.constructor = MagnetJS.Call;
/**
 * Set parameters on the Call using the specified CallOptions object.
 * @param {MagnetJS.CallOptions} callOptions A CallOptions object.
 */
MagnetJS.Call.prototype.setOptions = function(callOptions) {
    this.token = callOptions.token;
    this.callId = callOptions.callId;
    this.isReliable = callOptions.isReliable;
};
/**
 * Cancel a queued or executing call. If the call has been disposed, completed, cancelled, or unable to cancel, it will return false. Upon successful completion, this
 * call object will be disposed too.
 * @param {function} [callback] Fires after completion.
 */
MagnetJS.Call.prototype.cancel = function(callback) {
    if (this.state != MagnetJS.CallState.SUCCESS && this.state != MagnetJS.CallState.FAILED) {
        if (this.transportHandle) this.transportHandle.abort();
        this.state = MagnetJS.CallState.CANCELLED;
        MagnetJS.CallManager.removeCallFromQueue(this.callId, function() {
            if (typeof callback == typeof Function) callback(true);
        });
    } else {
        if (typeof callback == typeof Function) callback(false);
    }
};
/**
 * Dispose this Call, optionally clearing its result from cache. The call must be in SUCCESS or FAILED state. All resources used by this Call will be released. To dispose a
 * queued or executing call, it must be cancelled first.
 * @param {function} [clearCache] Enable removing the call from the cache.
 * @param {function} [callback] Fires upon success.
 * @param {function} [failback] Fires upon failure.
 */
MagnetJS.Call.prototype.dispose = function(clearCache, callback, failback) {
    var callId = this.callId;
    if (callId && (this.state === MagnetJS.CallState.FAILED || this.state === MagnetJS.CallState.SUCCESS)) {
        MagnetJS.CallManager.requestCorrelationCleanup(callId, function(data, details) {
            if (clearCache == true) MagnetJS.CallManager.clearCache(callId);
            callback(data, details);
        }, failback);
    } else {
        if (typeof failback === typeof Function) failback('invalid-call-state');
    }
};
/**
 * A set of constants used by a MagnetJS.Call object to determine the current state of the call.
 * @memberof MagnetJS
 * @namespace CallState
 */
MagnetJS.CallState = {
    /**
     * The call has been initialized but the request has not yet started.
     * @type {string}
     */
    INIT       : 'init',
    /**
     * The call is in progress.
     * @type {string}
     */
    EXECUTING  : 'executing',
    /**
     * The call is in a reliable queue.
     * @type {string}
     */
    QUEUED     : 'queued',
    /**
     * The call has been cancelled.
     * @type {string}
     */
    CANCELLED  : 'cancelled',
    /**
     * The call has completed successfully.
     * @type {string}
     */
    SUCCESS    : 'success',
    /**
     * The call has failed.
     * @type {string}
     */
    FAILED     : 'failed'
}
/**
 * A reliable call listener that dispatches success and error events provided by a ReliableCallOptions object. To execute a callback
 * of name "reliableSuccess" after a ReliableCallOptions request, bind an event to the ReliableCallListener: MagnetJS.ReliableCallListener.on('reliableSuccess', function() {});
 * To unbind an event, invoke MagnetJS.ReliableCallListener.unbind('reliableSuccess');
 * @memberof MagnetJS
 * @namespace ReliableCallListener
 */
MagnetJS.ReliableCallListener = {
    /**
     * Bind a callback function associated with the specified callback ID to fire when it is invoked after a ReliableCallOptions request.
     * @param callbackId The callback ID.
     * @param callback A callback function.
     */
    on     : function(callbackId, callback) {},
    /**
     * Unbind the callback functions associated with the specified callback ID.
     * @param callbackId The callback ID.
     */
    unbind : function(callbackId) {}
};
MagnetJS.ReliableCallListener = {};
MagnetJS.Events.create(MagnetJS.ReliableCallListener);

/**
 * CallOptions augment a controller method to engage in special request operations. Also see @see MagnetJS.AsyncCallOptions
 * and @see MagnetJS.ReliableCallOptions, which extend this object.
 * @constructor
 */
MagnetJS.CallOptions = function(options) {
    /**
     * Invoke the call only if this constraint is met. This means asynchronous (non-reliable) calls will fail fast. Reliable calls will wait.
     * @property {string}
     */
    this.callId = MagnetJS.Utils.getGUID();
    /**
     * Invoke the call only if this constraint is met. This means asynchronous (non-reliable) calls will fail fast. Reliable calls will wait.
     * @property {string}
     */
    this.constraint;
    /**
     * Optional. A user can set a custom opaque token for this call.
     * @type {string}
     */
    this.token;
    /**
     * The epoch time in seconds when the cached value will expire. Specify 0 to discard the cache, or a value greater than 0 to use the cache if the age is still valid. This value can be set by specifying a timeout with CallOptions.setCacheTimeout().
     * @type {number}
     */
    this.cacheAge = 0;
    /**
     * An object containing the HTTP header name and value pairs to send in the request. For example, the Content-Type header can be set like this: var opts = new MagnetJS.CallOptions({headers:{"Content-Type":"application/json"}});
     * @type {boolean}
     */
    this.headers = undefined;
    /**
     * Ignore the timeout in offline mode.
     * @type {boolean}
     */
    this.ignoreAgeIfOffline = false;
    /**
     * Skip validation of data.
     * @type {boolean}
     */
    this.skipValidation = false;
    if (options) MagnetJS.CallManager.set(this, options);
}
/**
 * Specify the length of time (seconds) before the cached value expires. If this option is specified, the call will attempt to use the cached value, and the response will always be cached. If not specified, the cached value will be discarded and the response will not be cached.
 * @param {number} [timeout] The number of seconds until the cache expires. Specify 0 to discard the cache, or a value greater than 0 to use the cache if the age is still valid.
 * @param {boolean} [ignoreAgeIfOffline] Indicates whether to use the cached value in an offline mode despite its age. The default is false.
 */
MagnetJS.CallOptions.prototype.setCacheTimeout = function(timeout, ignoreAgeIfOffline) {
    this.cacheAge = timeout ? MagnetJS.CallManager.getTimeInSeconds() + timeout : 0;
    this.ignoreAgeIfOffline = ignoreAgeIfOffline;
}
/**
 * Set an HTTP header to be used by this CallOptions object.
 * @param {string} name The name of the HTTP header.
 * @param {string} value The value of the HTTP header.
 */
MagnetJS.CallOptions.prototype.addTag = function(name, value) {
    this.headers = this.headers || {};
    this.headers[name] = value;
}
/**
 * Set one or more HTTP headers to be used by this CallOptions object.
 * @param {object} tags An object containing key-value pairs of HTTP headers to add to the CallOptions object.
 */
MagnetJS.CallOptions.prototype.addTags = function(tags) {
    this.headers = this.headers || {};
    MagnetJS.Utils.mergeObj(this.headers, tags);
}

/**
 * Options for an asynchronous call. An asynchronous call allows the caller to use the cached value and impose a restriction on when the call can be invoked. These types of options are only applicable when the user is online and connected to the server. If you would like to submit operations while offline or need more reliable, long-lasting durable operations, use ReliableCallOptions instead. If no options are specified, an asynchronous (unreliable) call is assumed.
 * @augments MagnetJS.CallOptions
 * @constructor
 * @memberof MagnetJS
 */
MagnetJS.AsyncCallOptions = function() {
    MagnetJS.CallOptions.apply(this, arguments);
};
MagnetJS.AsyncCallOptions.prototype = new MagnetJS.CallOptions();
MagnetJS.AsyncCallOptions.prototype.constructor = MagnetJS.AsyncCallOptions;

/**
 * Options for a reliable asynchronous call. A reliable asynchronous call allows the caller to:
 <ul>
   <li>use the cached value</li>
   <li>queue a call in persistent storage even if the caller is offline at submission time</li>
   <li>execute the calls in a sequential manner</li>
   <li>impose a restriction on when the call can be invoked</li>
   <li>specify a timeout for the call</li>
 </ul>
 * @augments MagnetJS.CallOptions
 * @constructor
 */
MagnetJS.ReliableCallOptions = function() {
    /**
     * Place a call on the specified queue.  The pending calls on the queue will be invoked sequentially. When using concurrent invocation, place the calls on multiple reliable queues.
     * @type {string}
     */
    this.queueName;
    /**
     * The time, in milliseconds, the server should retain to the result (the greater of the request and response timeouts).
     * @type {number}
     */
    this.serverTimeout = 0;
    /**
     * The epoch time, in seconds, until the request will expire. This value can be easily set  by specifying a timeout using ReliableCallOptions.setRequestTimeout().
     * @type {number}
     */
    this.requestAge = 0;
    /**
     * A success event to be be dispatched by MagnetJS.ReliableCallListener upon a successful request. Listen for this event by using the "on" method: MagnetJS.ReliableCallListener.on('your_event', function() {});
     * @type {string}
     */
    this.success;
    /**
     * An error event to be be dispatched by MagnetJS.ReliableCallListener upon a successful request. Listen for this event by using the "on" method: MagnetJS.ReliableCallListener.on('your_event', function() {});
     * @type {string}
     */
    this.error;
    /**
     * A flag to determine whether the CallOptions object is a ReliableCallOptions.
     * @type {boolean}
     */
    this.isReliable = true;
    MagnetJS.CallOptions.apply(this, arguments);
};
MagnetJS.ReliableCallOptions.prototype = new MagnetJS.CallOptions();
MagnetJS.ReliableCallOptions.prototype.constructor = MagnetJS.ReliableCallOptions;

/**
 * Specify the time, in seconds, until the request expires.
 * @param {number} timeout The number of seconds before the request expires. Specify 0 to discard the request; specify a value greater than 0 to use the request if the age is still valid.
 */
MagnetJS.ReliableCallOptions.prototype.setRequestTimeout = function(timeout) {
    this.serverTimeout = (timeout * 1000) + (30 * 1000);
    this.requestAge = timeout ? MagnetJS.CallManager.getTimeInSeconds() + timeout : 0;
}

/**
 * A class containing various network and geolocation constraints. Constraints provide a means to impose conditions
 * that a queue must meet before it can be processed. A queued call can be processed only when the constraint is met.
 * @memberof MagnetJS
 * @namespace Constraints
 */
MagnetJS.Constraints = {
    /**
     * The device must have a Wifi connection available to satisfy this constraint.
     */
    Wifi : ['WIFI'],
    /**
     * The device must have a cellular connection available to satisfy this constraint.
     */
    WWAN : ['CELL'],
    /**
     * Create a custom constraint. A user-defined function can be bound to this constraint to provide custom
     * validation of whether a constraint is met. Optionally, network constraints can be specified to further
     * refine the constraint.
     * @param {string} name The name of the constraint to be created.
     * @param {array} [definitions] An array of constraints. For example, ['WIFI', 'CELL'] would specify that the
     * constraint will be met if the device is on a Wifi or cellular network connection. A MagnetJS.Geostore
     * object can be passed in the array. If the constraint contains a Geostore, the controller call will only execute
     * if the current geolocation of the device is within the boundaries of the Geostore object.
     */
    createConstraint : function(name, definitions) {
        this[name] = definitions;
    }
};

/**
 * A class designed to simplify storage of binary data from controller requests to the file system in a Phonegap app.
 * @memberof MagnetJS
 * @namespace FileManager
 * @ignore
 */
MagnetJS.FileManager = {
    /**
     * @property {LocalFileSystem} fileSystem A Phonegap LocalFileSystem object to store files onto the mobile device.
     */
    fileSystem : null,
    /**
     * @property {string} filePath File system path to the Documents directory, since it is a different path for each file system.
     */
    filePath   : null,
    /**
     * @property {string|object} status Status of the file system retrieval.
     */
    status     : false,
    /**
     * @property {string} tempFile A file name. The file will be created temporarily to obtain the file system path.
     */
    tempFile   : '_magnet_temp.txt',
    /**
     * Request an instance of a Phonegap LocalFileSystem object. Updates these FileManager properties after completion: fileSystem, filePath, and status.
     * @param {function} callback Executes if the fileSystem object is retrieved successfully.
     * @param {function} failback Executes if an error occurs during fileSystem object retrieval.
     */
    getFS : function(callback, failback) {
        var me = this;
        if (me.fileSystem && me.filePath) {
            callback(me.fileSystem, me.filePath);
        } else if (me.status !== false && me.status != 'OK') {
            failback();
        } else if (MagnetJS.Utils.isCordova && window.requestFileSystem && typeof FileTransfer !== 'undefined') {
            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fs) {
                me.fileSystem = fs;
                me.fileSystem.root.getFile(me.tempFile, {
                    create    : true,
                    exclusive : false
                }, function(fileEntry) {
                    me.filePath = fileEntry.toURL ? fileEntry.toURL().replace(me.tempFile, '') : fileEntry.fullPath.replace(me.tempFile, '');
                    fileEntry.remove();
                    me.status = 'OK';
                    callback(me.fileSystem, me.filePath);
                }, function(e) {
                    me.status = e;
                    failback();
                });
            }, function(e) {
                me.status = e;
                failback();
            });
        } else {
            if (me.status === false)
                MagnetJS.Log.warning('The "org.apache.cordova.file-transfer" Phonegap plugin has not been added.');
            me.status = 'FAILED';
            failback();
        }
    },
    /**
     * Save a file to the file system, and return a fileEntry object upon completion.
     * @param {string} filename Filename of the file to be created.
     * @param {*} data The file data.
     * @param {function} callback Executes if the file is created successfully.
     * @param {function} failback Executes if an error occurs.
     */
    writeFile : function(filename, data, callback, failback) {
        this.fileSystem.root.getFile(filename, {
            create    : true,
            exclusive : false
        }, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwrite = function() {
                    callback(fileEntry);
                };
                fileWriter.write(data);
            }, failback);
        }, failback);
    }
}

/**
 * @constructor
 * @memberof MagnetJS
 * @class Contains the latitude and longitude of a point.
 * @param {number} latitude A decimal latitude of a point.
 * @param {number} longitude A decimal longitude of a point.
 */
MagnetJS.Geoentry = function(latitude, longitude) {
    this.lat = latitude;
    this.lng = longitude;
}
/**
 * @constructor
 * @memberof MagnetJS
 * @class A Geostore object defines a set of boundaries around an area using any number of latitude and longitude coordinates. Geostores are useful in
 * determining whether the location of the device containing the app are inside or outside of the defined boundaries. Geostores can be configured
 * to a MagnetJS.CallOptions object to assure that a controller call is made while the device is inside or outside the boundaries defined by the Geostore.
 * @param {MagnetJS.Geoentry[]} [points] An array of MagnetJS.Geoentry objects which define the boundaries of an area.
 */
MagnetJS.Geostore = function(points) {
    this.points = points || [];
}
/**
 * Add a MagnetJS.Geoentry object to the fence.
 * @param {number} latitude A decimal latitude of a point.
 * @param {number} longitude A decimal longitude of a point.
 */
MagnetJS.Geostore.prototype.add = function(latitude, longitude) {
    this.points.push(new MagnetJS.Geoentry(latitude, longitude));
}
