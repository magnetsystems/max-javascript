/* unit tests for MagnetJS */

var MagnetJS = MagnetJS || require('../../target/magnet-sdk');

describe('Utils mergeObj', function(){
    var obj1, obj2;

    beforeEach(function(){
        obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        obj2 = {
            foo2 : 'foo2dat',
            bar2 : 'bar2dat'
        };
    });

    it('should merge the contents of the first object to the second object', function(done){
        MagnetJS.Utils.mergeObj(obj1, obj2);
        expect(obj1.foo2).toEqual(obj2.foo2);
        done();
    });

});

describe('Utils isObject', function(){

    it('should return true if input is an object', function(done){
        var obj1 = {
            foo : 'foodat'
        };
        expect(MagnetJS.Utils.isObject(obj1)).toEqual(true);
        done();
    });

    it('should return false if input is not an object', function(done){
        expect(MagnetJS.Utils.isObject(3)).toEqual(false);
        done();
    });

});

describe('Utils isArray', function(){

    it('should return true if input is an array', function(done){
        var ary = ['foo'];
        expect(MagnetJS.Utils.isArray(ary)).toEqual(true);
        done();
    });

    it('should return false if input is not an array', function(done){
        expect(MagnetJS.Utils.isArray(3)).toEqual(false);
        done();
    });

});

describe('Utils getValidJSON', function(){

    it('should convert a valid string into JSON', function(done){
        var str = '{"foo":"foodat"}', obj = {"foo":"foodat"};
        expect(MagnetJS.Utils.getValidJSON(str)).toEqual(obj);
        done();
    });

    it('should return false given an invalid string', function(done){
        var invalidStr = '{"foo:"foodat"}';
        expect(MagnetJS.Utils.getValidJSON(invalidStr)).toEqual(false);
        done();
    });

});

describe('Utils getAttributes', function(){

    it('should get the attributes of an object as an array', function(done){
        var obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        var ary = MagnetJS.Utils.getAttributes(obj1);
        expect(ary[0]).toEqual('foo');
        expect(ary[1]).toEqual('bar');
        done();
    });

    it('should return an empty array given an empty object', function(done){
        var obj1 = {};
        var out = MagnetJS.Utils.getAttributes(obj1);
        expect(out).toEqual([]);
        done();
    });

});

describe('Utils getDataType', function(){

    it('should get string type', function(done){
        expect(MagnetJS.Utils.getDataType('foo')).toEqual('string');
        expect(MagnetJS.Utils.getDataType(1)).toEqual('integer');
        expect(MagnetJS.Utils.getDataType(['foo'])).toEqual('array');
        expect(MagnetJS.Utils.getDataType({'foo':'bar'})).toEqual('object');
        expect(MagnetJS.Utils.getDataType(new Date())).toEqual('date');
        expect(MagnetJS.Utils.getDataType(true)).toEqual('boolean');
        done();
    });

});

describe('Utils getValues', function(){

    it('should get the values of an object as an array', function(done){
        var obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        var ary = MagnetJS.Utils.getValues(obj1);
        expect(ary[0]).toEqual('foodat');
        expect(ary[1]).toEqual('bardat');
        done();
    });

    it('should return an empty array given an empty object', function(done){
        var obj1 = {};
        var out = MagnetJS.Utils.getAttributes(obj1);
        expect(out).toEqual([]);
        done();
    });

});

describe('Utils isEmptyObject', function(){

    it('should return false if input is not an empty object', function(done){
        var obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        expect(MagnetJS.Utils.isEmptyObject(obj1)).toEqual(false);
        done();
    });

    it('should return true given an empty object', function(done){
        var obj1 = {};
        expect(MagnetJS.Utils.isEmptyObject(obj1)).toEqual(true);
        done();
    });

    it('should return true given a non-object', function(done){
        var obj1 = 3;
        expect(MagnetJS.Utils.isEmptyObject(obj1)).toEqual(true);
        done();
    });

});

describe('Utils convertHeaderStrToObj', function(){

    it('should convert an xhr object into a regular object', function(done){
        var xhr = {
            foo : 'foodat',
            bar : 'bardat',
            getAllResponseHeaders : function(){
                return 'Content-Type: text/plain; charset=UTF-8 \r\n Expires: Thu, 01 Jan 1970 00:00:00 GMT';
            }
        };
        var out = {
            foo            : 'foodat',
            bar            : 'bardat',
            'Content-Type' : 'text/plain; charset=UTF-8',
            'Expires'      : 'Thu, 01 Jan 1970 00:00:00 GMT'
        };
        expect(MagnetJS.Utils.convertHeaderStrToObj(xhr)).toEqual(out);
        done();
    });

});

describe('Utils cleanData', function(){

    it('should remove attributes from given object not defined in the given schema', function(done){
        var schema = {
            foo : {},
            bar : {}
        };
        var obj = {
            foo     : 'foodat',
            invalid : 'inv'
        };
        var out = {
            foo : 'foodat'
        };
        expect(MagnetJS.Utils.cleanData(schema, obj)).toEqual(out);
        done();
    });

});

describe('Utils validate', function(){

    it('should fail validation given invalid obj', function(done){
        var schema = {
            foo : {
                optional : false
            },
            bar : {}
        };
        var obj = {
            bar : 'bardat'
        };
        var out = [{
            'attribute' : 'foo',
            'reason'    : 'required field blank'
        }];
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(out);
        done();
    });

    it('should pass validation given a valid obj', function(done){
        var schema = {
            foo : {
                optional : false
            },
            bar : {}
        };
        var obj = {
            foo : 'foodat'
        };
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(false);
        done();
    });

    it('should fail validation given an invalid binary/_data format', function(done){
        var schema = {
            foo : {
                type     : 'binary',
                optional : false
            },
            bar : {}
        };
        var obj = {
            foo : 'invalid'
        };
        var out = [{
            attribute : 'foo',
            reason    : 'invalid binary format'
        }];
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(out);
        done();
    });

    it('should pass validation given a valid binary/_data format', function(done){
        var schema = {
            foo : {
                type     : 'binary',
                optional : false
            },
            bar : {}
        };
        var obj = {
            foo : {
                mimeType : 'text/plain',
                val      : 'valid'
            }
        };
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(false);
        done();
    });

    it('should pass validation given a numeric data type using a string containing a number', function(done){
        var schema = {
            foo : {
                type     : 'float',
                optional : false
            },
            bar : {}
        };
        var obj = {
            foo : '120'
        };
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(false);
        done();
    });

    it('should fail validation given a numeric data type using a string containing text', function(done){
        var schema = {
            foo : {
                type     : 'integer',
                optional : false
            },
            bar : {}
        };
        var obj = {
            foo : 'invalidvalue'
        };
        var out = [{
            attribute : 'foo',
            reason    : 'not numeric'
        }];
        expect(MagnetJS.Utils.validate(schema, obj)).toEqual(out);
        done();
    });

});

describe('Utils dateToISO8601', function(){

    it('should convert a Date object to ISO8601 string', function(done){
        var baseDate = new Date().toISOString();
        var newDate = MagnetJS.Utils.dateToISO8601(new Date());
        // sometimes there is a 1 millisecond time difference
        expect(baseDate).toContain(newDate.substring(0, newDate.length - 7));
        done();
    });

});

describe('Utils ISO8601ToDate', function(){

    it('should convert an ISO8601 string into a Date object', function(done){
        var baseDate = new Date().toISOString();
        var date = MagnetJS.Utils.ISO8601ToDate(baseDate);
        expect(date.toISOString()).toContain(baseDate.substring(0, baseDate.length - 7));
        done();
    });

    it('should return false if it is not a valid date', function(done){
        var baseDate = 'invalid';
        var date = MagnetJS.Utils.ISO8601ToDate(baseDate);
        expect(date).toEqual(false);
        done();
    });

    it('should return false if it is not a valid date', function(done){
        var baseDate = 'invalid';
        var date = MagnetJS.Utils.ISO8601ToDate(baseDate);
        expect(date).toEqual(false);
        done();
    });

});

describe('Utils isPrimitiveType', function(){

    it('should return true if input is a primitive java type', function(done){
        expect(MagnetJS.Utils.isPrimitiveType('byte')).toEqual(true);
        done();
    });

    it('should return false if input is not a primitive java type', function(done){
        expect(MagnetJS.Utils.isPrimitiveType('com.magnet.user')).toEqual(false);
        done();
    });

});

describe('Utils stringToBase64', function(){

    it('should convert a simple string to base64', function(done){
        var str = 'stringData1';
        expect(MagnetJS.Utils.stringToBase64(str)).toEqual('c3RyaW5nRGF0YTE=');
        done();
    });

    it('should convert special character entities to base64', function(done){
        var str = '←♠♣♥♦‰™¢§';
        expect(MagnetJS.Utils.stringToBase64(str)).toEqual('4oaQ4pmg4pmj4pml4pmm4oCw4oSiwqLCpw==');
        done();
    });

});

describe('Utils base64ToString', function(){

    it('should convert a simple string to base64', function(done){
        var str = 'c3RyaW5nRGF0YTE=';
        expect(MagnetJS.Utils.base64ToString(str)).toEqual('stringData1');
        done();
    });

    it('should convert special character entities to base64', function(done){
        var str = '4oaQ4pmg4pmj4pml4pmm4oCw4oSiwqLCpw==';
        expect(MagnetJS.Utils.base64ToString(str)).toEqual('←♠♣♥♦‰™¢§');
        done();
    });

});

describe('Utils objectToFormdata', function(){

    it('should convert a JSON object into form data', function(done){
        var obj = {
            param1 : 't',
            param2 : 'u',
            param3 : 'v'
        };
        expect(MagnetJS.Utils.objectToFormdata.stringify(obj)).toEqual('param1=t&param2=u&param3=v');
        done();
    });

});

describe('Promise and Defer', function(){

    it('should resolve a Deferred and execute a success callback', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 0);
            return deferred.promise;
        }
        request().then(function(a1, a2){
            expect(a1).toEqual(200);
            expect(a2).toEqual('pass');
            done();
        }, function(a1){
            expect(a1).toEqual('failed-test');
            done();
        });
    });

    it('should reject a Deferred and execute a failure callback', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'failed');
            }, 0);
            return deferred.promise;
        }
        request().then(function(a1){
            expect(a1).toEqual('failed-test');
            done();
        }, function(a1, a2){
            expect(a1).toEqual(400);
            expect(a2).toEqual('failed');
            done();
        });
    });

    it('should chain a promise which executes sequentially and execute success callback', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 500);
            return deferred.promise;
        }
        function request2(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(201, 'pass2');
            }, 0);
            return deferred.promise;
        }
        request().then(request2).then(function(a1, a2){
            expect(a1).toEqual(201);
            expect(a2).toEqual('pass2');
            done();
        });
    });

    it('should chain a promise and execute failure callback', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 0);
            return deferred.promise;
        }
        function request2(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'failed');
            }, 0);
            return deferred.promise;
        }
        request().then(request2).then(function(a1){
            expect(a1).toEqual('failed-test');
            done();
        }, function(a1, a2){
            expect(a1).toEqual(400);
            expect(a2).toEqual('failed');
            done();
        });
    });

    it('should execute the success callback stored in the Promise', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 1);
            return deferred.promise;
        }
        request().success(function(a1, a2){
            expect(a1).toEqual(200);
            expect(a2).toEqual('pass');
            done();
        });
    });

    it('should execute the error callback stored in the Promise', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'failed');
            }, 1);
            return deferred.promise;
        }
        request().error(function(a1, a2){
            expect(a1).toEqual(400);
            expect(a2).toEqual('failed');
            done();
        });
    });

    it('should execute the success callback and continue with the Promise chain', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 1);
            return deferred.promise;
        }
        request().success(function(a1, a2){
            expect(a1).toEqual(200);
            expect(a2).toEqual('pass');
        }).then(function(a1, a2){
            expect(a1).toEqual(200);
            expect(a2).toEqual('pass');
            done();
        });
    });

    it('should execute multiple promises and return an array of resolve/reject arguments', function(done){
        function request(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 1);
            return deferred.promise;
        }
        function request2(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.resolve(201, 'pass');
            }, 2);
            return deferred.promise;
        }
        function request3(){
            var deferred = new MagnetJS.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'fail');
            }, 0);
            return deferred.promise;
        }
        MagnetJS.Deferred.all(request, request2, request3).then(function(successes, errors){
            expect(successes.length).toEqual(2);
            expect(successes[0][0]).toEqual(200);
            expect(successes[0][1]).toEqual('pass');
            expect(successes[1][0]).toEqual(201);
            expect(successes[1][1]).toEqual('pass');
            expect(errors.length).toEqual(1);
            expect(errors[0][0]).toEqual(400);
            expect(errors[0][1]).toEqual('fail');
            done();
        });
    });

});

describe('Events', function(){

    it('should add event functions to an object', function(done){
        var obj = {};
        MagnetJS.Events.create(obj);
        expect(obj.on).not.toBeUndefined();
        expect(obj.invoke).not.toBeUndefined();
        expect(obj.unbind).not.toBeUndefined();
        done();
    });

    it('should handle a bound event', function(done){
        var obj = {}, called = false, called2 = false;
        MagnetJS.Events.create(obj);
        obj.on('foobar', function(){
            called = true;
        });
        obj.on('foobar', function(){
            called = true;
            called2 = true;
        });
        obj.invoke('foobar');
        expect(called).toEqual(true);
        expect(called2).toEqual(true);
        done();
    });

    it('should unbind an event', function(done){
        var obj = {}, called = false;
        MagnetJS.Events.create(obj);
        obj.on('foobar', function(){
            called = true;
        });
        obj.unbind('foobar');
        obj.invoke('foobar');
        expect(called).toEqual(false);
        done();
    });

    it('should handle an array of bound events', function(done){
        var obj = {}, called = false, called2 = false;
        MagnetJS.Events.create(obj);
        obj.on('foo', function(){
            called = true;
        });
        obj.on('bar', function(){
            called2 = true;
        });
        obj.invoke(['foo', 'bar']);
        expect(called).toEqual(true);
        expect(called2).toEqual(true);
        done();
    });

    it('should return false attempting to set an invalid object', function(done){
        var invalidObj = {on:'foo'};
        expect(MagnetJS.Events.create(invalidObj)).toEqual(false);
        done();
    });

});

describe('Storage MemoryStoreConnector', function(){

    beforeEach(function(done){
        MagnetJS.Storage.connector = MagnetJS.MemoryStoreConnector;
        done();
    });
    afterEach(function(done){
        MagnetJS.MemoryStoreConnector.memory = {};
        MagnetJS.Storage.clearTable(MagnetJS.CallManager.queueTableName, function(){
            done();
        }, function(e){
            expect(e).toEqual('failed-test-setup1');
            done();
        });
    });

    it('should store object to local persistence', function(done){
        var obj = {
            prop1 : 'val1'
        };
        MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(){
            MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                expect(records.length).toEqual(1);
                expect(records[0].prop1).toEqual('val1');
                done();
            }, function(e){
                expect(e).toEqual('failed-test2');
                done();
            });
        }, function(e){
            expect(e).toEqual('failed-test1');
            done();
        });
    });

    it('should remove object from local persistence given a simple query object', function(done){
        var obj = {
            prop2 : 'val2'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, obj, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                        expect(records.length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should remove object from local persistence given an id', function(done){
        var obj = {
            prop3 : 'val3'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, objCreated.id, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                        expect(records.length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should remove object from local persistence given a query object containing an array of ids', function(done){
        var obj = {
            prop4 : 'val4'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                var queryObj = {
                    id : ['invalid', objCreated.id, 'invalid2']
                };
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, queryObj, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record){
                        expect(record).toBeUndefined();
                        expect(MagnetJS.MemoryStoreConnector.memory[MagnetJS.CallManager.queueTableName].length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not remove any objects if table does not exist', function(done){
        MagnetJS.Storage.remove('invalid-table-name', 'invalid-id', function(records){
            expect(records).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should retrieve object from local persistence given simple query object', function(done){
        var obj = {
            prop5 : 'val5'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                    expect(records.length).toEqual(1);
                    expect(records[0].prop5).toEqual('val5');
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test-setup-2');
                done();
            });
        });
    });

    it('should retrieve object from local persistence given an id', function(done){
        var obj = {
            prop6 : 'val6'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, obj, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record){
                    expect(record.prop6).toEqual('val6');
                    expect(record.id).toEqual(objCreated.id);
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should retrieve all objects from local persistence given null input', function(done){
        var obj = {
            prop7 : 'val7'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, null, function(records){
                    expect(records.length).toEqual(1);
                    expect(records[0].prop7).toEqual('val7');
                    expect(records[0].id).toEqual(objCreated.id);
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not retrieve any objects if table does not exist', function(done){
        MagnetJS.Storage.get('invalid-table-name', 'invalid-id', function(records){
            expect(records).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should update an object in local persistence', function(done){
        var obj = {
            prop8 : 'val8'
        };
        var objModified = {
            prop8   : 'valModified8',
            another : 'value'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.update(MagnetJS.CallManager.queueTableName, objCreated.id, objModified, function(record){
                    expect(record.id).toEqual(objCreated.id);
                    expect(record.prop8).toEqual('valModified8');
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record2){
                        expect(record2.prop8).toEqual('valModified8');
                        expect(record2.id).toEqual(objCreated.id);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not update any objects if record does not exist', function(done){
        var obj = {
            prop9   : 'val9',
            another : 'value'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.update(MagnetJS.CallManager.queueTableName, 'invalid-id', obj, function(record){
                expect(record).toEqual('failed-test');
                done();
            }, function(e){
                expect(e).toEqual('record-not-exist');
                done();
            });
        });
    });

    it('should not update any objects if table does not exist', function(done){
        var obj = {
            prop10  : 'val10',
            another : 'value'
        };
        MagnetJS.Storage.update('invalid-table-name', 'invalid-id', obj, function(record){
            expect(record).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should create a table if it does not exist', function(done){
        var table = 'table1';
        MagnetJS.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, null, false, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(0);
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

    it('create a table and insert an object', function(done){
        var table = 'table2';
        var obj = {
            prop11 : 'val11',
            prop12 : 'val12'
        };
        MagnetJS.Storage.createTableIfNotExist(table, {
            prop11 : 'TEXT',
            prop12 : 'TEXT'
        }, obj, true, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(1);
                expect(records[0].prop11).toEqual('val11');
                expect(records[0].prop12).toEqual('val12');
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

    it('create a table and insert an array of objects', function(done){
        var table = 'table3';
        var objAry = [{
            prop13 : 'val13r1',
            prop14 : 'val14r1'
        }, {
            prop13 : 'val13r2',
            prop14 : 'val14r2'
        }];
        MagnetJS.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, objAry, true, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(2);
                expect(records[0].prop13).toEqual('val13r1');
                expect(records[0].prop14).toEqual('val14r1');
                expect(records[1].prop13).toEqual('val13r2');
                expect(records[1].prop14).toEqual('val14r2');
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

});

describe('Storage LocalStorageConnector', function(){

    var tempConnector;

    beforeEach(function(done){
        if(MagnetJS.Utils.isNode){
            window = typeof window !== 'undefined' ? window : {};
            window.localStorage = window.localStorage || {
                memory : {},
                getItem : function(key){
                    return this.memory[key];
                },
                setItem : function(key, val){
                    return this.memory[key] = val;
                }
            };
        }
        tempConnector = MagnetJS.Storage.connector;
        MagnetJS.Storage.connector = MagnetJS.LocalStorageConnector;
        done();
    });
    afterEach(function(done){
        MagnetJS.Storage.clearTable(MagnetJS.CallManager.queueTableName, function(){
            MagnetJS.Storage.connector = tempConnector;
            if(MagnetJS.Utils.isNode){
                delete window;
            }else{
                window.localStorage.clear();
            }
            done();
        }, function(e){
            expect(e).toEqual('failed-test-setup1');
            done();
        });
    });

    it('should store object to local persistence', function(done){
        var obj = {
            prop1 : 'val1'
        };
        MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(){
            MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                expect(records.length).toEqual(1);
                expect(records[0].prop1).toEqual('val1');
                done();
            }, function(e){
                expect(e).toEqual('failed-test2');
                done();
            });
        }, function(e){
            expect(e).toEqual('failed-test1');
            done();
        });
    });

    it('should remove object from local persistence given a simple query object', function(done){
        var obj = {
            prop2 : 'val2'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, obj, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                        expect(records.length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should remove object from local persistence given an id', function(done){
        var obj = {
            prop3 : 'val3'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, objCreated.id, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                        expect(records.length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should remove object from local persistence given a query object containing an array of ids', function(done){
        var obj = {
            prop4 : 'val4'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                var queryObj = {
                    id : ['invalid', objCreated.id, 'invalid2']
                };
                MagnetJS.Storage.remove(MagnetJS.CallManager.queueTableName, queryObj, function(){
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record){
                        expect(record).toBeUndefined();
                        expect(MagnetJS.MemoryStoreConnector.memory[MagnetJS.CallManager.queueTableName].length).toEqual(0);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not remove any objects if table does not exist', function(done){
        MagnetJS.Storage.remove('invalid-table-name', 'invalid-id', function(records){
            expect(records).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should retrieve object from local persistence given simple query object', function(done){
        var obj = {
            prop5 : 'val5'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, obj, function(records){
                    expect(records.length).toEqual(1);
                    expect(records[0].prop5).toEqual('val5');
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test-setup-2');
                done();
            });
        });
    });

    it('should retrieve object from local persistence given an id', function(done){
        var obj = {
            prop6 : 'val6'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, obj, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record){
                    expect(record.prop6).toEqual('val6');
                    expect(record.id).toEqual(objCreated.id);
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should retrieve all objects from local persistence given null input', function(done){
        var obj = {
            prop7 : 'val7'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, null, function(records){
                    expect(records.length).toEqual(1);
                    expect(records[0].prop7).toEqual('val7');
                    expect(records[0].id).toEqual(objCreated.id);
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not retrieve any objects if table does not exist', function(done){
        MagnetJS.Storage.get('invalid-table-name', 'invalid-id', function(records){
            expect(records).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should update an object in local persistence', function(done){
        var obj = {
            prop8 : 'val8'
        };
        var objModified = {
            prop8   : 'valModified8',
            another : 'value'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.create(MagnetJS.CallManager.queueTableName, obj, function(objCreated){
                MagnetJS.Storage.update(MagnetJS.CallManager.queueTableName, objCreated.id, objModified, function(record){
                    expect(record.id).toEqual(objCreated.id);
                    expect(record.prop8).toEqual('valModified8');
                    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, objCreated.id, function(record2){
                        expect(record2.prop8).toEqual('valModified8');
                        expect(record2.id).toEqual(objCreated.id);
                        done();
                    }, function(e){
                        expect(e).toEqual('failed-test3');
                        done();
                    });
                }, function(e){
                    expect(e).toEqual('failed-test2');
                    done();
                });
            }, function(e){
                expect(e).toEqual('failed-test1');
                done();
            });
        });
    });

    it('should not update any objects if record does not exist', function(done){
        var obj = {
            prop9   : 'val9',
            another : 'value'
        };
        MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            MagnetJS.Storage.update(MagnetJS.CallManager.queueTableName, 'invalid-id', obj, function(record){
                expect(record).toEqual('failed-test');
                done();
            }, function(e){
                expect(e).toEqual('record-not-exist');
                done();
            });
        });
    });

    it('should not update any objects if table does not exist', function(done){
        var obj = {
            prop10  : 'val10',
            another : 'value'
        };
        MagnetJS.Storage.update('invalid-table-name', 'invalid-id', obj, function(record){
            expect(record).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should create a table if it does not exist', function(done){
        var table = 'table1';
        MagnetJS.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, null, false, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(0);
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

    it('create a table and insert an object', function(done){
        var table = 'table2';
        var obj = {
            prop11 : 'val11',
            prop12 : 'val12'
        };
        MagnetJS.Storage.createTableIfNotExist(table, {
            prop11 : 'TEXT',
            prop12 : 'TEXT'
        }, obj, true, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(1);
                expect(records[0].prop11).toEqual('val11');
                expect(records[0].prop12).toEqual('val12');
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

    it('create a table and insert an array of objects', function(done){
        var table = 'table3';
        var objAry = [{
            prop13 : 'val13r1',
            prop14 : 'val14r1'
        }, {
            prop13 : 'val13r2',
            prop14 : 'val14r2'
        }];
        MagnetJS.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, objAry, true, function(){
            MagnetJS.Storage.get(table, null, function(records){
                expect(records.length).toEqual(2);
                expect(records[0].prop13).toEqual('val13r1');
                expect(records[0].prop14).toEqual('val14r1');
                expect(records[1].prop13).toEqual('val13r2');
                expect(records[1].prop14).toEqual('val14r2');
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        });
    });

});

describe('Log', function(){

    it('should log if enabled', function(done){
        MagnetJS.Config.logging = true;
        MagnetJS.Log.info('foo');
        done();
    });

    it('should log multiple inputs if enabled', function(done){
        MagnetJS.Config.logging = true;
        MagnetJS.Log.info('foo', {
            meta1 : 'meta1'
        }, 'UnitTeest', 'foo');
        done();
    });

    it('should not log if disabled', function(done){
        MagnetJS.Config.logging = false;
        MagnetJS.Log.info('foo');
        MagnetJS.Config.logging = false;
        done();
    })

});

describe('set', function(){

    it('should set config', function(done){
        MagnetJS.set({
            endpointUrl : 'foo',
            locationDataCollection : true
        });
        expect(MagnetJS.Config.endpointUrl).toEqual('foo');
        MagnetJS.set({
            endpointUrl : 'https://jumpstart.magnet.com'
        });
        done();
    });

});

describe('reset', function(){

    it('should reset config', function(done){
        MagnetJS.set({endpointUrl : 'https://foo.magnet.com'});
        MagnetJS.reset();
        expect(MagnetJS.Config.endpointUrl).toEqual('');
        MagnetJS.set({endpointUrl : 'https://jumpstart.magnet.com'});
        done();
    });

});

describe('Transport createAcceptHeader', function(){

    it('should return an Accept header given input', function(done){
        expect(MagnetJS.Transport.createAcceptHeader('xml')).toEqual('application/xml;q=1.0');
        done();
    });

    it('should return default Accept header given no input', function(done){
        expect(MagnetJS.Transport.createAcceptHeader()).toEqual('application/json; magnet-type=controller-result');
        done();
    });

});
