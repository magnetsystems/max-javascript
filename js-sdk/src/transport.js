/**
 * A class containing transport functions for facilitating requests and responses between a client and a Mobile App Server.
 * @memberof Max
 * @namespace Request
 * @ignore
 */
Max.Request = function(request, callback, failback) {
    request._path = request.url;
    if (!request.isBinary) request.contentType = request.contentType || 'application/json';
    request.headers = request.headers || [];

    var deferred = new Max.Deferred();
    deferred.promise = new Max.Call();

    var options = {
        call : deferred.promise
    };

    if (Max.App.hatCredentials && Max.App.hatCredentials.access_token && !request.headers.Authorization)
        request.headers['Authorization'] = 'Bearer ' + Max.App.hatCredentials.access_token;

    setTimeout(function() {
        if (!Max.App.initialized && !request.bypassReady)
            return (failback || function() {})('sdk not ready');

        Max.Transport.request(request.data, request, options, function(result, details) {
            Max.Log.fine(details.status+' '+details.info.url+' ', {
                contentType : details.contentType,
                response    : result
            });

            options.call.state = Max.CallState.SUCCESS;
            (callback || function() {})(result, details);

        }, function(e, details) {
            Max.Log.fine(details.status+' '+details.info.url+' ', {
                contentType : details.contentType,
                response    : e
            });

            // TODO: need to rework the .status === 0 once CORS is full implemented by server
            if ((details.status === 401 || details.status === 0) && !request.isLogin) {
                if (Cookie.get('magnet-max-refresh-token'))
                    return Max.User.loginWithRefreshToken(request, callback, failback);
                else
                    Max.User.clearSession('session expired');
            }

            if (details.status === 403 && !request.isLogin)
                Max.invoke('not-authorized', e, details);

            if (details.status === 413)
                e = 'maximum filesize exceeded';

            options.call.state = Max.CallState.FAILED;
            (failback || function() {})(e, details);

        });
    }, 0);

    return deferred;
};

/**
 * A class containing transport functions for facilitating requests and responses between a client and a Mobile App Server.
 * @memberof Max
 * @namespace Transport
 * @ignore
 */
Max.Transport = {
    /**
     * Base request function. Determines the best available transport and calls the request.
     * @param {object} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded. The success callback will be fired on a status code in the 200-207 range.
     * @param {function} [failback] Executes if the request failed.
     */
    request : function(body, metadata, options, callback, failback) {
        options = options || {};
        metadata._path = metadata._path || metadata.path;
        metadata._path = (metadata.local === true || /^(ftp|http|https):/.test(metadata._path) === true) ? metadata._path : Max.Config.baseUrl+metadata._path;
        if (typeof jQuery !== 'undefined' && metadata.returnType != 'binary' && !metadata.isBinary) {
            this.requestJQuery(body, metadata, options, callback, failback);
        } else if (XMLHttpRequest !== 'undefined') {
            this.requestXHR(body, metadata, options, callback, failback);
        } else {
            throw('request transport unavailable');
        }
    },
    /**
     * Transport with JQuery over HTTP/SSL protocol with REST. Cross-origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestJQuery : function(body, metadata, options, callback, failback) {
        var me = this;
        var reqBody = me.parseBody(metadata.contentType, body);
        $.support.cors = true;
        var details = {
            body : reqBody,
            info : {
                url : metadata._path
            }
        };
        options.call.transportHandle = $.ajax({
            type        : metadata.method,
            url         : metadata._path,
            timeout     : 30000,
            dataType    : metadata.dataType,
            contentType : metadata.contentType,
            processData : !metadata.isBinary,
            data        : reqBody,
            beforeSend  : function(xhr) {
                xhr.setRequestHeader('Accept', me.createAcceptHeader(metadata.dataType));
                if (metadata.headers) {
                    for(var key in metadata.headers) {
                        xhr.setRequestHeader(key, metadata.headers[key]);
                    }
                }
            },
            success : function(data, status, xhr) {
                if (typeof callback === typeof Function) {
                    details.info.xhr = Max.Utils.convertHeaderStrToObj(xhr);
                    details.contentType = xhr.getResponseHeader('Content-Type');
                    details.status = xhr.status;
                    data = data.result || data;
                    callback(data, details);
                }
            },
            error : function(xhr, metadata, error) {
                details.info.xhr = Max.Utils.convertHeaderStrToObj(xhr);
                details.contentType = xhr.getResponseHeader('Content-Type');
                details.status = xhr.status;
                if (metadata == 'parsererror')
                    callback(xhr.responseText, details);
                else if (typeof failback === typeof Function)
                    failback(xhr.responseText, details);
            }
        });
    },
    /**
     * Transport with XMLHttpRequest over HTTP/SSL protocol with REST. Cross-origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestXHR : function(body, metadata, options, callback, failback) {
        var me = this, resBody;
        var reqBody = me.parseBody(metadata.contentType, body);
        var details = {
            body : reqBody,
            info : {
                url : metadata._path
            }
        };
        options.call.transportHandle = new XMLHttpRequest();
        var xhr = options.call.transportHandle;
        xhr.timeout = 30000;
        if (metadata.returnType == 'binary') xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                details.status = xhr.status;
                details.contentType = xhr.getResponseHeader('Content-Type');
                details.info.xhr = Max.Utils.convertHeaderStrToObj(xhr);
                resBody = xhr.responseText;
                if (typeof xhr.responseXML !== 'undefined' && xhr.responseXML != null) {
                    resBody = xhr.responseXML;
                } else {
                    try{
                        resBody = JSON.parse(resBody);
                        resBody = resBody.result || resBody;
                    }catch(e) {}
                }
                if (me.isSuccess(xhr.status)) {
                    if (metadata.returnType == 'binary')
                        resBody = {
                            mimeType : details.contentType,
                            val      : resBody
                        };
                    if (typeof callback === typeof Function) callback(resBody, details);
                } else {
                    if (typeof failback === typeof Function) failback(resBody, details);
                }
            }
        };
        xhr.ontimeout = function() {
            details.status = 0;
            details.contentType = xhr.getResponseHeader('Content-Type');
            details.info.xhr = Max.Utils.convertHeaderStrToObj(xhr);
            if (typeof failback === typeof Function) failback('request-timeout', details);
        };
        xhr.open(metadata.method, metadata._path, true);
        if (metadata.contentType)
            xhr.setRequestHeader('Content-Type', metadata.contentType);
        xhr.setRequestHeader('Accept', me.createAcceptHeader(metadata.dataType));
        if (metadata.headers)
            for(var key in metadata.headers) {
                xhr.setRequestHeader(key, metadata.headers[key]);
            }
        xhr.send(reqBody);
    },
    /**
     * Determines whether the status code is a success or failure.
     * @param {number} code The HTTP request status code.
     */
    isSuccess : function(code) {
        return code >= 200 && code <= 299;
    },
    /**
     * Formats the body into the appropriate string type using the specified Content-Type header.
     * @param {object|string|number} type The Content-Type of the request.
     * @param {string} input The original request body.
     */
    parseBody : function(type, input) {
        var QS = Max.Utils.isNode ? require('querystring') : Max.Utils.objectToFormdata;
        switch(type) {
            case 'application/x-www-form-urlencoded' : input = QS.stringify(input); break;
            case 'application/json' : input = JSON.stringify(input); break;
            case 'application/json;' : input = JSON.stringify(input); break;
        }
        return input;
    },
    /**
     * Create an Accept header.
     * @param {string} [dataType] The expected data type of the request.
     * @returns {string} The Accept Header string.
     */
    createAcceptHeader : function(dataType) {
        var str = '';
        dataType = dataType || 'json';
        switch(dataType) {
            case 'xml'  : str = 'application/xml;q=1.0'; break;
            case 'html' : str = 'text/plain;q=1.0'; break;
            case 'text' : str = 'text/plain;q=1.0'; break;
            case 'json' : str = 'application/json;'; break;
            default     : str = '*/*;q=1.0'; break;
        }
        return str;
    }
};
Max.Transport.Headers = {};

/**
 * A set of constants used by a Max.Call object to determine the current state of the call.
 * @memberof Max
 * @namespace CallState
 * @ignore
 */
Max.CallState = {
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
};

/**
 * This interface represents an asynchronous invocation to a controller. An instance of the Call is typically returned by a method call from any Controller
 * implementation. If the options are not specified in the Controller subclass method call, a fail-fast asynchronous call will be assumed.
 * @augments Max.Promise
 * @constructor
 * @memberof Max
 * @ignore
 */
Max.Call = function() {
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
    this.state = Max.CallState.INIT;
    Max.Promise.apply(this, arguments);
};
Max.Call.prototype = new Max.Promise();
Max.Call.prototype.constructor = Max.Call;