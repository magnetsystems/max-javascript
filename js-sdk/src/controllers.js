/**
 * @constructor
 * @memberof MagnetJS
 * @class Controller is an object containing a collection of Methods used to manage and simplify interaction with a Mobile App Server controller.
 * @param {string} [name] An identifier for the controller instance. If not specified, a default value will be used.
 */
MagnetJS.Controller = function(name) {
    this._MMSDKName = name;
    MagnetJS.Events.create(this);
    return this;
}

/**
 * @class Method is an object within a Controller used to manage and simplify interaction with a particular
 * method of a Mobile App Server controller. It will handle basic validation of controller method attributes
 * based on schema.
 * @param {*} [data] Request data.
 * @param {object} [options] Request options.
 * @param metadata Request metadata.
 * @param {CallOptions} [options.callOptions] Call options.
 * @param {function} [options.success] Callback to fire after a successful request.
 * @param {function} [options.error] Callback to fire after a failed request.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.Method = function(data, options, metadata) {
    var me = this;
    options = options || {};
    options.attributes = (typeof data === 'undefined' || data === null) ? undefined : data;
    options.attributes = MagnetJS.Utils.mergeObj(options.attributes, metadata.attributes);
    var invalid = MagnetJS.Utils.validate(metadata.schema, options.attributes);
    var deferred = new MagnetJS.Deferred();
    deferred.promise = new MagnetJS.Call();
    options.call = deferred.promise;
    metadata.params.controller = me._MMSDKName;
    if ((options.callOptions && options.callOptions.skipValidation === true) || invalid === false) {
        me.invoke(['Set'], metadata.params.name, options, metadata);
        var request = new MagnetJS.Request(me, options, metadata);
        me.invoke(['BeforeRequest'], metadata.params.name, options, metadata);
        request.send(function() {
            if (typeof options.success === typeof Function) options.success.apply(me, arguments);
            deferred.resolve.apply(deferred, arguments);
        }, function() {
            if (typeof options.error === typeof Function) options.error.apply(me, arguments);
            deferred.reject.apply(deferred, arguments);
        });
    } else {
        me.invoke(['Complete', 'Error'], metadata.params.name, 'failed-validation', invalid);
        MagnetJS.Log.fine('controller method "'+metadata.params.name+'" validation failure:' + JSON.stringify(invalid));
        if (typeof options.error === typeof Function) options.error('failed-validation', invalid);
        deferred.reject('failed-validation', invalid);
    }
    return deferred.promise;
}

/**
 * A library of MagnetJS.Controller objects generated with the Magnet Mobile App Builder.
 * @namespace MagnetJS.Controllers
 */
MagnetJS.Controllers = {};

/**
 * This callback is fired on a failed controller call.
 * @typedef {function} ControllerError
 * @param {*} error The error response body, or an error message.
 * @param {object} details An object containing details of the request, such as HTTP request, response, and status code.
 */

/**
 * This callback is fired on a successful controller call.
 * @typedef {function} ControllerSuccess
 * @param {*} data The success response body.
 * @param {object} details An object containing details of the request, such as HTTP request, response, and status code.
 */