/**
 * @constructor
 * @class Request A request instance that handles the request and response.
 * @param [instance] The object creating the request.
 * @param options The object creating the request.
 * @ignore
 */
MagnetJS.Request = function(instance, options, metadata) {
    this.instance = instance;
    this.options = options;
    this.metadata = metadata;
    this.options.callOptions = this.options.callOptions || new MagnetJS.CallOptions();
    this.options.call = this.options.call || new MagnetJS.Call();
    this.options.call.setOptions(this.options.callOptions);
}

/**
 * Send a request.
 * @param {function} [callback] Executes if the request succeeded.
 * @param {function} [failback] Executes if the request failed.
 */
MagnetJS.Request.prototype.send = function(callback, failback) {
    var me = this;
    setTimeout(function() {
        me.beforeRequest(callback, failback, function() {
            me.metadata.params.contentType = me.metadata.params.contentType || (me.metadata.params.consumes ? me.metadata.params.consumes[0] : undefined) || 'application/json';
            var requestObj = me.setup(me.metadata.schema || {}, me.metadata.params, me.options.attributes);
            requestObj.params.headers = requestObj.params.headers || [];
            if (MagnetJS.Utils.isCordova && typeof device === typeof {} && device.uuid) {
                requestObj.params.headers.push({
                    name : 'X-Magnet-Device-Id',
                    val  : device.uuid
                });
                requestObj.params.headers.push({
                    name : 'User-Agent',
                    val  : device.platform+' '+device.version+' '+device.model+' '+(typeof navigator !== 'undefined' ? navigator.userAgent : '')
                });
            }
            if (!MagnetJS.Utils.isNode)
                requestObj.params.headers.push({
                    name : 'X-Magnet-Auth-Challenge',
                    val  : 'disabled'
                });
            if (me.options && me.options.callOptions && me.options.callOptions.callId && me.options.callOptions.isReliable) {
                requestObj.params.headers.push({
                    name : 'X-Magnet-Correlation-id',
                    val  : me.options.callOptions.callId
                });
                requestObj.params.headers.push({
                    name : 'X-Magnet-Result-Timeout',
                    val  : me.options.callOptions.serverTimeout || 0
                });
            }
            if (requestObj.params.produces && requestObj.params.produces[0] === 'multipart/related')
                requestObj.params.headers.push({
                    name : 'Accept',
                    val  : 'multipart/related'
                });
            if (me.options && me.options.callOptions && me.options.callOptions.headers)
                for(var prop in me.options.callOptions.headers)
                    requestObj.params.headers.push({
                        name : prop,
                        val  : me.options.callOptions.headers[prop]
                    });
            if (MagnetJS.Config.clientId)
                requestObj.params.headers.push({
                    name : 'X-Magnet-auth_client_id',
                    val  : MagnetJS.Config.clientId
                });
            if (MagnetJS.Config.clientSecret)
                requestObj.params.headers.push({
                    name : 'X-Magnet-auth_client_secret',
                    val  : MagnetJS.Config.clientSecret
                });
            me.options.call.state = MagnetJS.CallState.EXECUTING;
            MagnetJS.Transport.request(requestObj.body, requestObj.params, me.options, function(result, details) {
                MagnetJS.Log.info(details.status+' '+details.info.url+' ', {
                    contentType : details.contentType,
                    response    : result
                });
                if (me.metadata.params.controller == 'MMSDKLoginService' && me.metadata.params.name == 'login' && result != 'SUCCESS') {
                    me.options.call.state = MagnetJS.CallState.FAILED;
                    me.onResponseError(callback, failback, result, details);
                } else {
                    me.options.call.state = MagnetJS.CallState.SUCCESS;
                    me.onResponseSuccess(callback, result, details);
                }
            }, function(e, details) {
                MagnetJS.Log.info(details.status+' '+details.info.url+' ', {
                    contentType : details.contentType,
                    response    : e
                });
                me.options.call.state = MagnetJS.CallState.FAILED;
                me.onResponseError(callback, failback, e, details);
            });
        });
    }, 1);
}

/**
 * Prepares a request for transport.
 * @param {object} schema A controller method schema object.
 * @param {object} params A request parameter object.
 * @param {object} attributes Controller method attributes, represented as a key-value pair.
 */
MagnetJS.Request.prototype.setup = function(schema, params, attributes) {
    var query = '', body = {}, plains = {}, forms = {}, matrix = '', dataParam = false;
    params.dataType = params.dataType || 'json';
    params._path = params.path;
    var multipart = params.contentType == 'multipart/related' ? new MagnetJS.Multipart() : undefined;
    var requestData = formatRequest(attributes, multipart, undefined, schema);
    for(var attr in requestData) {
        if (requestData.hasOwnProperty(attr) && schema[attr]) {
            if ((schema[attr].type == '_data' || schema[attr].type == 'binary') && typeof multipart == 'undefined') {
                dataParam = attr;
            } else {
                switch(schema[attr].style) {
                    case 'TEMPLATE' :
                        params._path = setTemplateParam(params._path, attr, requestData[attr]);
                        break;
                    case 'QUERY' :
                        query += setQueryParam(attr, requestData[attr]);
                        break;
                    case 'PLAIN' :
                        if (this.metadata.params.method === 'DELETE' || this.metadata.params.method === 'GET')
                            query += setQueryParam(attr, requestData[attr]);
                        else
                            plains[attr] = requestData[attr];
                        break;
                    case 'HEADER' :
                        params.headers = params.headers || [];
                        params.headers.push({
                            name : attr,
                            val  : requestData[attr]
                        });
                        break;
                    case 'MATRIX' :
                        params._path = setTemplateParam(params._path, attr, setMatrixParam(attr, requestData[attr]));
                        break;
                    case 'FORM' :
                        params.contentType = 'application/x-www-form-urlencoded';
                        if (this.metadata.params.method === 'DELETE' || this.metadata.params.method === 'GET')
                            query += setQueryParam(attr, requestData[attr]);
                        else
                            forms[attr] = requestData[attr];
                        break;
                }
            }
        }
    }
    var attrs = MagnetJS.Utils.getAttributes(plains);
    if (dataParam) {
        params.isBinary = true;
        params.contentType = requestData[dataParam].mimeType;
        body = requestData[dataParam].val;
    } else {
        body = MagnetJS.Utils.mergeObj(plains, forms);
    }
    if (typeof multipart != 'undefined')
        body = multipart.close(body);
    params._path = (params.basePathOnly === true ? params._path : '/rest'+params._path)+matrix+query;
    params._path = params._path.indexOf('?') == -1 ? params._path.replace('&', '?') : params._path;
    return {
        body   : body,
        params : params
    };
}

function setTemplateParam(path, attr, val) {
    return path.replace('{'+attr+'}', val);
}

function setQueryParam(attr, val) {
    return '&'+attr+'='+(typeof val === 'object' ? JSON.stringify(val) : val);
}

function setMatrixParam(attr, val) {
    return attr+'='+(typeof val === 'object' ? JSON.stringify(val) : val);
}

/**
 * Handles pre-request operations, especially execution of CallOptions configurations.
 * @param {function} [callback] The success callback.
 * @param {function} [failback] The error callback.
 * @param {function} startRequest A callback function to continue execution of the request.
 */
MagnetJS.Request.prototype.beforeRequest = function(callback, failback, startRequest) {
    var me = this, cacheObj = MagnetJS.CallManager.getCacheByHash(this.getCallHash());
    if (cacheObj) {
        me.options.call.state = MagnetJS.CallState.SUCCESS;
        me.options.call.result = cacheObj.result;
        me.options.call.details = cacheObj.details;
        me.options.call.isResultFromCache = true;
        if (typeof callback === typeof Function) callback(cacheObj.result, cacheObj.details, true);
    } else {
        var callOptions = this.options.callOptions;
        if (callOptions && MagnetJS.CallManager.isConstraintMet(callOptions.constraint) === false) {
            if (callOptions.isReliable === true && MagnetJS.CallManager.isExpired(callOptions.requestAge) === false) {
                MagnetJS.CallManager.setRequestObject(me.options.call.callId, me.options, me.metadata);
                me.options.call.state = MagnetJS.CallState.QUEUED;
                if (typeof callback === typeof Function) callback('awaiting-constraint');
            } else {
                me.options.call.state = MagnetJS.CallState.FAILED;
                if (typeof failback === typeof Function) failback('constraint-failure', {
                    constraint : callOptions.constraint,
                    current    : MagnetJS.CallManager.getConnectionState()
                })
            }
        } else {
            if (MagnetJS.Utils.isCordova && MagnetJS.CallManager.getConnectionState() == 'NONE') {
                me.options.call.state = MagnetJS.CallState.FAILED;
                if (typeof failback === typeof Function) failback('no-network-connectivity');
            } else {
                startRequest();
            }
        }
    }
}

/**
 * Handles response success.
 * @param {function} [callback] The success callback.
 * @param {*} result The result body.
 * @param {object} details An object containing details of the request.
 */
MagnetJS.Request.prototype.onResponseSuccess = function(callback, result, details) {
    var me = this;
    if (me.options.callOptions && me.options.callOptions.cacheAge != 0) {
        me.options.call.cachedTime = new Date();
        MagnetJS.CallManager.setCacheObject(me.options.call.callId, me.getCallHash(), me.options.callOptions, result, details);
    }
    me.formatResponse(result, details, function(convertedResult) {
        me.options.call.result = convertedResult;
        me.options.call.details = details;
        if (me.instance) me.instance.invoke(['Complete', 'Success', 'MMSDKComplete'], me.metadata.params.name, convertedResult, details);
        if (typeof callback === typeof Function) callback(convertedResult, details);
    });
}

/**
 * Handles response error.
 * @param {function} [callback] The success callback.
 * @param {function} [failback] The error callback.
 * @param {*} error The error body.
 * @param {object} details An object containing details of the error.
 */
MagnetJS.Request.prototype.onResponseError = function(callback, failback, error, details) {
    if (details.status == 403
        && MagnetJS.Utils.isCordova === true
        && typeof error == 'string'
        && error.indexOf('com.magnet.security.api.oauth.OAuthLoginException') != -1) {
        var res = MagnetJS.Utils.getValidJSON(error);
        MagnetJS.OAuthHandler.invoke('OAuthLoginException', this.instance, this.options, this.metadata, res, callback, failback);
    } else {
        this.options.call.resultError = error;
        this.options.call.details = details;
        if (details.status == 401 || details.status == 403) {
            error = 'session-expired';
            MagnetJS.LoginService.connectionStatus = 'Unauthorized';
            MagnetJS.LoginService.invoke(['Unauthorized'], this.metadata.params.name, error, details);
        } else if (details.status == 500 && error.indexOf('invalid X-Magnet-auth_client_id') != -1) {
            error = 'invalid-client-id';
            MagnetJS.LoginService.connectionStatus = 'Unauthorized';
            MagnetJS.LoginService.invoke(['Unauthorized'], this.metadata.params.name, error, details);
        }
        if (this.instance) this.instance.invoke(['Complete', 'Error', 'MMSDKComplete'], this.metadata.params.name, error, details);
        if (typeof failback === typeof Function) failback(error, details);
    }
}

/**
 * Returns a cache ID based on a hash of the request parameters and body.
 * @returns {string} A cache ID.
 */
MagnetJS.Request.prototype.getCallHash = function() {
    try{
        return MagnetJS.CallManager.getCallHash(
            this.metadata.params.controller,
            this.metadata.params.name,
            (JSON.stringify(this.options.attributes) || ''));
    }catch(e) {
        return false;
    }
}

/**
 * Format server response data into client data objects, and handle binary data.
 * @param {*} body The response body.
 * @param {object} details The response details.
 * @param {function} callback Executes upon completion.
 */
MagnetJS.Request.prototype.formatResponse = function(body, details, callback) {
    var params = this.metadata.params;
    var options = this.options.callOptions || {};
    var out = body;
    if (!options.returnRaw && typeof out !== 'undefined') {
        if (params.returnType == 'date') {
            callback(MagnetJS.Utils.ISO8601ToDate(body));
        } else if (options.saveAs && MagnetJS.Utils.isCordova === false) {
            if (MagnetJS.Utils.isNode) {
                require('fs').writeFile(options.saveAs, typeof body == 'string' ? body : JSON.stringify(body), MagnetJS.Utils.mergeObj({
                    encoding : 'binary',
                    mode     : 438,
                    flag     : 'w'
                }, options.saveAsOptions), function(e) {
                    if (e) MagnetJS.Log.warning(e);
                    callback(out);
                });
            } else {
                MagnetJS.Log.warning('The saveAs option is only compatible with Phonegap or Node.js applications.');
                callback(out);
            }
        } else if (MagnetJS.Utils.isModelOrCollection(params.returnType) === true) {
            callback(this.jsonToModel(params.returnType, body));
        } else if (MagnetJS.Utils.isDateType(params.returnType)) {
            callback(MagnetJS.Utils.ISO8601ToDate(out));
        } else if (params.returnType == 'bytearray') {
            callback(MagnetJS.Utils.base64ToString(out));
        } else if (typeof body == 'string' && body.indexOf('--BOUNDARY--') != -1) {
            callback(multipartToObject(body));
        } else {
            callback(out);
        }
    } else {
        callback(out);
    }
}

/**
 * Convert a JSON object into a MagnetJS Model or Collection, if the data is compatible.
 * @param {*} returnType The return content type specified by the controller metadata.
 * @param {*} body The response body.
 * @param {boolean} [multipart] Indicates whether to enable to skip parsing for multipart/related data.
 * @returns {*} MagnetJS Model or Collection.
 */
MagnetJS.Request.prototype.jsonToModel = function(returnType, body, multipart) {
    var modelType = getModelType(returnType);
    if (MagnetJS.Models[modelType] && returnType.indexOf('[]') != -1 && body && MagnetJS.Utils.isArray(body)) {
        body = new MagnetJS.Collection(modelType, body);
    } else if (MagnetJS.Models[modelType] && MagnetJS.Utils.isArray(body)) {
        for(var i=0;i<body.length;++i)
            body[i] = this.jsonToModel(modelType, body[i]);
    } else if (MagnetJS.Models[modelType] && MagnetJS.Utils.isObject(body)) {
        body = new MagnetJS.Models[modelType](body);
        for(var attr in body.attributes)
            if (body.schema[attr])
                body.attributes[attr] = this.jsonToModel(getModelType(body.schema[attr].type), body.attributes[attr]);
    } else if (modelType == 'bytearray') {
        body = MagnetJS.Utils.base64ToString(body);
    } else if (MagnetJS.Utils.isDateType(modelType)) {
        body = MagnetJS.Utils.ISO8601ToDate(out);
    } else if (!multipart && typeof body == 'string' && body.indexOf('--BOUNDARY--') != -1) {
        var out = multipartToObject(body);
        body = MagnetJS.Utils.isObject(out) ? this.jsonToModel(modelType, out) : out;
    }
    return body;
}

// get type of Model
function getModelType(type) {
    return (type.indexOf('[]') != -1) ? type.replace('[]', '') : type;
}

// A simple multipart/related parser.
function multipartToObject(str) {
    var boundary = 'BOUNDARY';
    var parts = getParts(str, boundary);
    var json = getJSONContent(parts[0]);
    for(var i=1;i<parts.length;++i)
        getContent(json, parts[i]);
    return json;
}
// returns an array of parts.
function getParts(str, boundary) {
    var ary = str.split('--'+boundary);
    ary.shift();
    ary.pop();
    return ary;
}
// get JSON object
function getJSONContent(str) {
    var content = str, contentType, contents = str.split('\r\n');
    for(var i=0;i<contents.length;++i) {
        if (contents[i].indexOf('Content-Type') != -1) {
            contentType = contents[i].replace(/Content-Type[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content = content.replace(contents[i], '');
            break;
        }
    }
    return contentType == 'application/json' ? MagnetJS.Utils.getValidJSON(content) : content;
}
// returns an object containing the content-type and data.
function getContent(json, str) {
    var content = {}, encoding, id;
    content.val = str;
    var contents = str.split('\r\n');
    for(var i=0;i<contents.length;++i) {
        if (contents[i].indexOf('Content-Type') != -1) {
            content.mimeType = contents[i].replace(/Content-Type[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
        }
        if (contents[i].indexOf('Content-Transfer-Encoding') != -1) {
            encoding = contents[i].replace(/Content-Transfer-Encoding[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
        }
        if (contents[i].indexOf('Content-Id') != -1) {
            id = contents[i].replace(/Content-Id[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
            break;
        }
    }
    if (encoding == 'base64')
        content.val = MagnetJS.Utils.base64ToString(content.val.replace(/(\r\n|\n|\r)/gm, ''));
    else if (content.mimeType == 'application/json')
        content.val = MagnetJS.Utils.getValidJSON(content.val);
    else if (!MagnetJS.Utils.isNode && (content.mimeType == 'application/xml' || content.mimeType == 'text/xml'))
        content.val = MagnetJS.Utils.getValidXML(content.val);
    else
        content.val = content.val.replace(/^\s+|\s+$/g, '');
    mapToObject(json, id, content);
}
// recursively format the content of a multipart/related part
function mapToObject(json, id, data) {
    for(var attr in json) {
        if (MagnetJS.Utils.isObject(json[attr]) || MagnetJS.Utils.isArray(json[attr]))
            mapToObject(json[attr], id, data);
        else if (json[attr] == id)
            json[attr] = data;
    }
}
// recursively format request data
function formatRequest(data, multipart, model, schema) {
    for(var attr in data) {
        if (data.hasOwnProperty(attr) && data[attr]) {
            if (typeof schema !== 'undefined' && typeof schema[attr] !== 'undefined')
                schema[attr].type = schema[attr].type.trim();
            if (data[attr].isMagnetModel && data[attr].attributes) {
                data[attr] = formatRequest(data[attr].attributes, multipart, data[attr]);
            } else if (MagnetJS.Utils.isArray(data[attr])) {
                data[attr] = formatRequest(data[attr], multipart);
            } else if (typeof schema !== 'undefined' && schema[attr] && MagnetJS.Utils.isDateType(schema[attr].type)) {
                data[attr] = typeof data[attr] === 'string' ? data[attr] : MagnetJS.Utils.dateToISO8601(data[attr]);
            } else if (typeof schema !== 'undefined' && schema[attr] && schema[attr].type == 'bytearray') {
                data[attr] = MagnetJS.Utils.stringToBase64(data[attr]);
            } else if (multipart && typeof model != 'undefined' && model.schema[attr] && (model.schema[attr].type == '_data' || model.schema[attr].type == 'binary')) {
                data[attr] = multipart.add(data[attr].mimeType, data[attr].val);
            }
        }
    }
    return data;
}
// A simple multipart/related writer.
MagnetJS.Multipart = function() {
    this.boundary = 'BOUNDARY';
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;
}
MagnetJS.Multipart.prototype.add = function(mime, val) {
    var id = this.prefix+String(++this.index);
    this.message += '--'+this.boundary+'\r\n';
    this.message += 'Content-Type: '+mime+'\r\n';
    this.message += 'Content-Transfer-Encoding: base64\r\n';
    this.message += 'Content-Id: '+id+'\r\n\r\n';
    this.message += MagnetJS.Utils.stringToBase64(val)+'\r\n\r\n';
    return id;
}
MagnetJS.Multipart.prototype.close = function(body) {
    this.message += '--'+this.boundary+'--';
    this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
}
