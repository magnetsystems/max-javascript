/**
 * A class containing transport functions for facilitating requests and responses between a client and a Mobile App Server.
 * @memberof MagnetJS
 * @namespace Request
 * @ignore
 */
MagnetJS.Request = function(request, callback, failback) {
    request._path = request.url;
    request.contentType = request.contentType || 'application/json';
    request.headers = request.headers || [];

    var deferred = new MagnetJS.Deferred();
    deferred.promise = new MagnetJS.Call();

    var options = {
        call : deferred.promise
    };

    if (MagnetJS.App.hatCredentials && MagnetJS.App.hatCredentials.access_token && !request.headers.Authorization)
        request.headers['Authorization'] = 'Bearer ' + MagnetJS.App.hatCredentials.access_token;

    setTimeout(function() {
        if (!MagnetJS.App.initialized && !request.bypassReady)
            return (failback || function() {})('sdk not ready');

        MagnetJS.Transport.request(request.data, request, options, function(result, details) {
            MagnetJS.Log.fine(details.status+' '+details.info.url+' ', {
                contentType : details.contentType,
                response    : result
            });

            options.call.state = MagnetJS.CallState.SUCCESS;
            (callback || function() {})(result, details);

        }, function(e, details) {
            MagnetJS.Log.fine(details.status+' '+details.info.url+' ', {
                contentType : details.contentType,
                response    : e
            });

            // TODO: need to rework the .status === 0 once CORS is full implemented by server
            if (details.status == 401 || details.status === 0) {
                mCurrentUser = null;
                MagnetJS.App.hatCredentials = null;
                MagnetJS.MMXClient.disconnect();
                Cookie.remove('magnet-max-auth-token');
                MagnetJS.invoke('not-authenticated', e, details);
                // TODO: handle token expiry, reconnect, and re-send call
            }

            if (details.status == 403) {
                MagnetJS.invoke('not-authorized', e, details);
                // TODO: handle token expiry, reconnect, and re-send call
            }

            options.call.state = MagnetJS.CallState.FAILED;
            (failback || function() {})(e, details);

        });
    }, 0);

    return deferred;
};

/**
 * A class containing transport functions for facilitating requests and responses between a client and a Mobile App Server.
 * @memberof MagnetJS
 * @namespace Transport
 * @ignore
 */
MagnetJS.Transport = {
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
        metadata._path = (metadata.local === true || /^(ftp|http|https):/.test(metadata._path) === true) ? metadata._path : MagnetJS.Config.mmxEndpoint+metadata._path;
        if (MagnetJS.Utils.isCordova && typeof cordova !== 'undefined') {
            this.requestCordova(body, metadata, options, callback, failback);
        } else if (MagnetJS.Utils.isNode) {
            this.requestNode(body, metadata, options, callback, failback);
        } else if (MagnetJS.Utils.isCordova && options.callOptions && options.callOptions.saveAs && !options.callOptions.returnRaw) {
            this.cordovaFileTransfer(body, metadata, options, callback, failback);
        } else if (typeof jQuery !== 'undefined' && !MagnetJS.Utils.isBinaryType(metadata.returnType) && !metadata.isBinary) {
            this.requestJQuery(body, metadata, options, callback, failback);
        } else if (XMLHttpRequest !== 'undefined') {
            this.requestXHR(body, metadata, options, callback, failback);
        } else {
            throw('request-transport-unavailable');
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
                    details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                    details.contentType = xhr.getResponseHeader('Content-Type');
                    details.status = xhr.status;
                    data = data.result || data;
                    callback(data, details);
                }
            },
            error : function(xhr, metadata, error) {
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
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
        if (MagnetJS.Utils.isBinaryType(metadata.returnType)) xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                details.status = xhr.status;
                details.contentType = xhr.getResponseHeader('Content-Type');
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
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
                    if (MagnetJS.Utils.isBinaryType(metadata.returnType))
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
            details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
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
     * Initialize a transport with Node.js. For NodeJS only.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestNode : function(body, metadata, options, callback, failback) {
        var urlParser = require('url');
        var reqObj = urlParser.parse(metadata._path);
        var headers = MagnetJS.Utils.mergeObj({
            'Content-Type' : metadata.contentType
        }, MagnetJS.Transport.Headers);
        if (metadata.headers)
            for(var key in metadata.headers) {
                xhr.setRequestHeader(key, metadata.headers[key]);
            }
            for(var i=metadata.headers.length;i--;)
                headers[metadata.headers[i].name] = metadata.headers[i].val;
        metadata.protocol = reqObj.protocol;
        if (reqObj.hostname) {
            this.requestNodeExec(body, metadata, {
                host               : reqObj.hostname,
                port               : parseInt(reqObj.port || (reqObj.protocol == 'https:' ? 443 : null)),
                path               : reqObj.path,
                method             : metadata.method,
                rejectUnauthorized : false,
                requestCert        : false,
                headers            : headers
            }, options, callback, failback);
        } else {
            if (typeof failback === typeof Function) {
                failback('error-parsing-url', {
                    body : body,
                    info : {
                        url : metadata._path
                    }
                });
            }
        }
    },
    /**
     * Transport with Node.js over HTTP/SSL protocol with REST. For NodeJS only.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} httpRequestmetadata http.request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestNodeExec : function(body, metadata, httpRequestmetadata, options, callback, failback) {
        var me = this, http = require('http'), https = require('https');
        var reqBody = me.parseBody(metadata.contentType, body);
        options.call.transportHandle = (metadata.protocol == 'https:' ? https : http).request(httpRequestmetadata, function(res) {
            var resBody = '';
            var details = {
                body : reqBody,
                info : {
                    metadata : metadata,
                    url      : metadata._path,
                    request  : options.call.transportHandle,
                    response : res
                },
                contentType : res.headers['content-type'],
                status      : res.statusCode
            };
            res.setEncoding(MagnetJS.Utils.isBinaryType(metadata.returnType) ? 'binary' : 'utf8');
            res.on('data', function(chunk) {
                resBody += chunk;
            });
            res.on('end', function() {
                try{
                    resBody = JSON.parse(resBody);
                    resBody = resBody.result || resBody;
                }catch(e) {}
                if (me.isSuccess(res.statusCode)) {
                    if (MagnetJS.Utils.isBinaryType(metadata.returnType))
                        resBody = {
                            mimeType : details.contentType,
                            val      : resBody
                        };
                    if (typeof callback === typeof Function)
                        callback(resBody, details);
                } else {
                    if (typeof failback === typeof Function)
                        failback(resBody, details);
                }
            });
        });
        options.call.transportHandle.on('error', function(e) {
            if (typeof failback === typeof Function) {
                var details = {
                    body : body,
                    info : {
                        metadata : metadata,
                        url      : metadata._path,
                        request  : options.call.transportHandle
                    },
                    status : 0
                };
                failback(e, details);
            }
        });
        if (body) options.call.transportHandle.write(reqBody, metadata.isBinary === true ? 'binary' : 'utf8');
        options.call.transportHandle.end();
    },
    /**
     * Transport through cordova plugin leveraging Magnet iOS and Android SDKs.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestCordova : function(body, metadata, options, callback, failback) {
        cordova.exec((callback || function() {}), (failback || function() {}), 'MagnetCordovaPlugin', 'execController', [{
            body     : body,
            metadata : metadata,
            options  : options
        }]);
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
        var QS = MagnetJS.Utils.isNode ? require('querystring') : MagnetJS.Utils.objectToFormdata;
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
    },
    /**
     * Transport with Phonegap's FileTransfer API.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    cordovaFileTransfer : function(body, metadata, options, callback, failback) {
        var details = {
            body : body,
            info : {
                url : metadata._path
            },
            status : null
        };
        var headers = {};
        if (metadata.headers)
            for(var i=metadata.headers.length;i--;)
                headers[metadata.headers[i].name] = metadata.headers[i].val;
        MagnetJS.FileManager.getFS(function(fs, filePath) {
            options.call.transportHandle = new FileTransfer();
            options.call.transportHandle.download(
                metadata._path,
                filePath+options.callOptions.saveAs,
                function(fileEntry) {
                    if (typeof callback === typeof Function) callback(fileEntry, details);
                },
                function(e, sourceUrl, targetUrl, status) {
                    details.status = status;
                    if (typeof failback === typeof Function) failback(e, details);
                }, MagnetJS.Config.debugMode, {
                    headers : headers
                }
            );
        }, function() {
            if (typeof failback === typeof Function) failback(MagnetJS.FileManager.status, details);
        });
    }
};
MagnetJS.Transport.Headers = {};

/**
 * A set of constants used by a MagnetJS.Call object to determine the current state of the call.
 * @memberof MagnetJS
 * @namespace CallState
 * @ignore
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
};

/**
 * This interface represents an asynchronous invocation to a controller. An instance of the Call is typically returned by a method call from any Controller
 * implementation. If the options are not specified in the Controller subclass method call, a fail-fast asynchronous call will be assumed.
 * @augments MagnetJS.Promise
 * @constructor
 * @memberof MagnetJS
 * @ignore
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