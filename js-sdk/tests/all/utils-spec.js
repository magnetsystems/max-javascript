/* unit tests for Max */

var Max = Max || require('../../target/magnet-sdk');

var QUEUE_TABLE_NAME = 'TESTQUEUE';

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
        Max.Utils.mergeObj(obj1, obj2);
        expect(obj1.foo2).toEqual(obj2.foo2);
        done();
    });

});

describe('Utils isObject', function(){

    it('should return true if input is an object', function(done){
        var obj1 = {
            foo : 'foodat'
        };
        expect(Max.Utils.isObject(obj1)).toEqual(true);
        done();
    });

    it('should return false if input is not an object', function(done){
        expect(Max.Utils.isObject(3)).toEqual(false);
        done();
    });

});

describe('Utils isArray', function(){

    it('should return true if input is an array', function(done){
        var ary = ['foo'];
        expect(Max.Utils.isArray(ary)).toEqual(true);
        done();
    });

    it('should return false if input is not an array', function(done){
        expect(Max.Utils.isArray(3)).toEqual(false);
        done();
    });

});

describe('Utils getValidJSON', function(){

    it('should convert a valid string into JSON', function(done){
        var str = '{"foo":"foodat"}', obj = {"foo":"foodat"};
        expect(Max.Utils.getValidJSON(str)).toEqual(obj);
        done();
    });

    it('should return false given an invalid string', function(done){
        var invalidStr = '{"foo:"foodat"}';
        expect(Max.Utils.getValidJSON(invalidStr)).toEqual(false);
        done();
    });

});

describe('Utils getValidXML', function(){

    it('should convert a valid string into XML', function(done){
        var str = '<xml><beer>lager</beer></xml>';
        var xml = Max.Utils.getValidXML(str);
        expect(xml.getElementsByTagName('beer')[0].childNodes[0].nodeValue).toEqual('lager');
        done();
    });

});

describe('Utils getAttributes', function(){

    it('should get the attributes of an object as an array', function(done){
        var obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        var ary = Max.Utils.getAttributes(obj1);
        expect(ary[0]).toEqual('foo');
        expect(ary[1]).toEqual('bar');
        done();
    });

    it('should return an empty array given an empty object', function(done){
        var obj1 = {};
        var out = Max.Utils.getAttributes(obj1);
        expect(out).toEqual([]);
        done();
    });

});

describe('Utils getDataType', function(){

    it('should get string type', function(done){
        expect(Max.Utils.getDataType('foo')).toEqual('string');
        expect(Max.Utils.getDataType(1)).toEqual('integer');
        expect(Max.Utils.getDataType(['foo'])).toEqual('array');
        expect(Max.Utils.getDataType({'foo':'bar'})).toEqual('object');
        expect(Max.Utils.getDataType(new Date())).toEqual('date');
        expect(Max.Utils.getDataType(true)).toEqual('boolean');
        done();
    });

});

describe('Utils getValues', function(){

    it('should get the values of an object as an array', function(done){
        var obj1 = {
            foo : 'foodat',
            bar : 'bardat'
        };
        var ary = Max.Utils.getValues(obj1);
        expect(ary[0]).toEqual('foodat');
        expect(ary[1]).toEqual('bardat');
        done();
    });

    it('should return an empty array given an empty object', function(done){
        var obj1 = {};
        var out = Max.Utils.getAttributes(obj1);
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
        expect(Max.Utils.isEmptyObject(obj1)).toEqual(false);
        done();
    });

    it('should return true given an empty object', function(done){
        var obj1 = {};
        expect(Max.Utils.isEmptyObject(obj1)).toEqual(true);
        done();
    });

    it('should return true given a non-object', function(done){
        var obj1 = 3;
        expect(Max.Utils.isEmptyObject(obj1)).toEqual(true);
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
        expect(Max.Utils.convertHeaderStrToObj(xhr)).toEqual(out);
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
        expect(Max.Utils.cleanData(schema, obj)).toEqual(out);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(out);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(false);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(out);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(false);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(false);
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
        expect(Max.Utils.validate(schema, obj)).toEqual(out);
        done();
    });

});

describe('Utils dateToISO8601', function(){

    it('should convert a Date object to ISO8601 string', function(done){
        var baseDate = new Date().toISOString();
        var newDate = Max.Utils.dateToISO8601(new Date());
        // sometimes there is a 1 millisecond time difference
        expect(baseDate).toContain(newDate.substring(0, newDate.length - 7));
        done();
    });

});

describe('Utils ISO8601ToDate', function(){

    it('should convert an ISO8601 string into a Date object', function(done){
        var baseDate = new Date().toISOString();
        var date = Max.Utils.ISO8601ToDate(baseDate);
        expect(date.toISOString()).toContain(baseDate.substring(0, baseDate.length - 7));
        done();
    });

    it('should return false if it is not a valid date', function(done){
        var baseDate = 'invalid';
        var date = Max.Utils.ISO8601ToDate(baseDate);
        expect(date).toEqual(false);
        done();
    });

    it('should return false if it is not a valid date', function(done){
        var baseDate = 'invalid';
        var date = Max.Utils.ISO8601ToDate(baseDate);
        expect(date).toEqual(false);
        done();
    });

});

describe('Utils isPrimitiveType', function(){

    it('should return true if input is a primitive java type', function(done){
        expect(Max.Utils.isPrimitiveType('byte')).toEqual(true);
        done();
    });

    it('should return false if input is not a primitive java type', function(done){
        expect(Max.Utils.isPrimitiveType('com.magnet.user')).toEqual(false);
        done();
    });

});

describe('Utils stringToBase64', function(){

    it('should convert a simple string to base64', function(done){
        var str = 'stringData1';
        expect(Max.Utils.stringToBase64(str)).toEqual('c3RyaW5nRGF0YTE=');
        done();
    });

    it('should convert special character entities to base64', function(done){
        var str = '←♠♣♥♦‰™¢§';
        expect(Max.Utils.stringToBase64(str)).toEqual('4oaQ4pmg4pmj4pml4pmm4oCw4oSiwqLCpw==');
        done();
    });

});

describe('Utils base64ToString', function(){

    it('should convert a simple string to base64', function(done){
        var str = 'c3RyaW5nRGF0YTE=';
        expect(Max.Utils.base64ToString(str)).toEqual('stringData1');
        done();
    });

    it('should convert special character entities to base64', function(done){
        var str = '4oaQ4pmg4pmj4pml4pmm4oCw4oSiwqLCpw==';
        expect(Max.Utils.base64ToString(str)).toEqual('←♠♣♥♦‰™¢§');
        done();
    });

});

describe('Utils getCleanGUID', function(){

    it('should return a GUID of correct format', function(done){
        var guid = Max.Utils.getCleanGUID();
        expect(guid.length).toEqual(32);
        expect(guid).not.toContain('-');
        done();
    });

});

describe('Utils getBrowser', function(){

    it('should return a string identifying client information', function(done){
        var client = Max.Utils.getBrowser();
        console.log(client);
        expect(client).toContain('Safari 538.1 (538)');
        done();
    });

});

describe('Utils getOS', function(){

    it('should return a string identifying operating system', function(done){
        var os = Max.Utils.getOS();
        expect(os.os).toEqual('Mac OS X');
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
        expect(Max.Utils.objectToFormdata.stringify(obj)).toEqual('param1=t&param2=u&param3=v');
        done();
    });

});

describe('Utils utf16to8', function(){

    it('should decode a UTF-16 character to UTF-8', function(done){
        expect(Max.Utils.utf16to8('〰')).toEqual('ã°');
        done();
    });

});

describe('Promise and Defer', function(){

    it('should resolve a Deferred and execute a success callback', function(done){
        function request(){
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
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

    it('should execute always callback', function(done){
        function request(){
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'failed');
            }, 0);
            return deferred.promise;
        }
        request().always(function(a1){
            expect(a1).toEqual(400);
            done();
        }, function(a1, a2){
            expect(a1).toEqual(400);
            expect(a2).toEqual('failed');
            done();
        });
    });

    it('should chain a promise which executes sequentially and execute success callback', function(done){
        function request(){
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 500);
            return deferred.promise;
        }
        function request2(){
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 0);
            return deferred.promise;
        }
        function request2(){
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
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
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.resolve(200, 'pass');
            }, 1);
            return deferred.promise;
        }
        function request2(){
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.resolve(201, 'pass');
            }, 2);
            return deferred.promise;
        }
        function request3(){
            var deferred = new Max.Deferred();
            setTimeout(function(){
                deferred.reject(400, 'fail');
            }, 0);
            return deferred.promise;
        }
        Max.Deferred.all(request, request2, request3).then(function(successes, errors){
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
        Max.Events.create(obj);
        expect(obj.on).not.toBeUndefined();
        expect(obj.invoke).not.toBeUndefined();
        expect(obj.unbind).not.toBeUndefined();
        done();
    });

    it('should handle a bound event', function(done){
        var obj = {}, called = false, called2 = false;
        Max.Events.create(obj);
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
        Max.Events.create(obj);
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
        Max.Events.create(obj);
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
        expect(Max.Events.create(invalidObj)).toEqual(false);
        done();
    });

});

describe('Storage MemoryStoreConnector', function(){

    beforeEach(function(done){
        Max.Storage.connector = Max.MemoryStoreConnector;
        done();
    });
    afterEach(function(done){
        Max.MemoryStoreConnector.memory = {};
        Max.Storage.clearTable(QUEUE_TABLE_NAME, function(){
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
        Max.Storage.create(QUEUE_TABLE_NAME, obj, function(){
            Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.remove(QUEUE_TABLE_NAME, obj, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.remove(QUEUE_TABLE_NAME, objCreated.id, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                var queryObj = {
                    id : ['invalid', objCreated.id, 'invalid2']
                };
                Max.Storage.remove(QUEUE_TABLE_NAME, queryObj, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record){
                        expect(record).toBeUndefined();
                        expect(Max.MemoryStoreConnector.memory[QUEUE_TABLE_NAME].length).toEqual(0);
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
        Max.Storage.remove('invalid-table-name', 'invalid-id', function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(){
                Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, obj, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.get(QUEUE_TABLE_NAME, null, function(records){
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
        Max.Storage.get('invalid-table-name', 'invalid-id', function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.update(QUEUE_TABLE_NAME, objCreated.id, objModified, function(record){
                    expect(record.id).toEqual(objCreated.id);
                    expect(record.prop8).toEqual('valModified8');
                    Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record2){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.update(QUEUE_TABLE_NAME, 'invalid-id', obj, function(record){
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
        Max.Storage.update('invalid-table-name', 'invalid-id', obj, function(record){
            expect(record).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should create a table if it does not exist', function(done){
        var table = 'table1';
        Max.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, null, false, function(){
            Max.Storage.get(table, null, function(records){
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
        Max.Storage.createTableIfNotExist(table, {
            prop11 : 'TEXT',
            prop12 : 'TEXT'
        }, obj, true, function(){
            Max.Storage.get(table, null, function(records){
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
        Max.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, objAry, true, function(){
            Max.Storage.get(table, null, function(records){
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
        if(Max.Utils.isNode){
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
        tempConnector = Max.Storage.connector;
        Max.Storage.connector = Max.LocalStorageConnector;
        done();
    });
    afterEach(function(done){
        Max.Storage.clearTable(QUEUE_TABLE_NAME, function(){
            Max.Storage.connector = tempConnector;
            if(Max.Utils.isNode){
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
        Max.Storage.create(QUEUE_TABLE_NAME, obj, function(){
            Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.remove(QUEUE_TABLE_NAME, obj, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.remove(QUEUE_TABLE_NAME, objCreated.id, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                var queryObj = {
                    id : ['invalid', objCreated.id, 'invalid2']
                };
                Max.Storage.remove(QUEUE_TABLE_NAME, queryObj, function(){
                    Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record){
                        expect(record).toBeUndefined();
                        expect(Max.MemoryStoreConnector.memory[QUEUE_TABLE_NAME].length).toEqual(0);
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
        Max.Storage.remove('invalid-table-name', 'invalid-id', function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(){
                Max.Storage.get(QUEUE_TABLE_NAME, obj, function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, obj, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.get(QUEUE_TABLE_NAME, null, function(records){
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
        Max.Storage.get('invalid-table-name', 'invalid-id', function(records){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.create(QUEUE_TABLE_NAME, obj, function(objCreated){
                Max.Storage.update(QUEUE_TABLE_NAME, objCreated.id, objModified, function(record){
                    expect(record.id).toEqual(objCreated.id);
                    expect(record.prop8).toEqual('valModified8');
                    Max.Storage.get(QUEUE_TABLE_NAME, objCreated.id, function(record2){
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
        Max.Storage.createTableIfNotExist(QUEUE_TABLE_NAME, {
            callId      : 'TEXT',
            callOptions : 'TEXT',
            options     : 'TEXT',
            metadata    : 'TEXT',
            queueName   : 'TEXT'
        }, null, true, function(){
            Max.Storage.update(QUEUE_TABLE_NAME, 'invalid-id', obj, function(record){
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
        Max.Storage.update('invalid-table-name', 'invalid-id', obj, function(record){
            expect(record).toEqual('failed-test');
            done();
        }, function(e){
            expect(e).toEqual('table-not-exist');
            done();
        });
    });

    it('should create a table if it does not exist', function(done){
        var table = 'table1';
        Max.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, null, false, function(){
            Max.Storage.get(table, null, function(records){
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
        Max.Storage.createTableIfNotExist(table, {
            prop11 : 'TEXT',
            prop12 : 'TEXT'
        }, obj, true, function(){
            Max.Storage.get(table, null, function(records){
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
        Max.Storage.createTableIfNotExist(table, {
            param1 : 'TEXT',
            param2 : 'TEXT'
        }, objAry, true, function(){
            Max.Storage.get(table, null, function(records){
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
        Max.Config.logging = true;
        Max.Log.info('foo');
        expect(Max.Config.logging).toEqual(true);
        done();
    });

    it('should log multiple inputs if enabled', function(done){
        Max.Config.logging = true;
        Max.Log.info('foo', {
            meta1 : 'meta1'
        }, 'UnitTeest', 'foo');
        expect(Max.Config.logging).toEqual(true);
        done();
    });

    it('should not log if disabled', function(done){
        Max.Config.logging = false;
        Max.Log.info('foo');
        Max.Config.logging = false;
        expect(Max.Config.logging).toEqual(false);
        done();
    })

});

describe('Cookie', function(){

    it('should create a cookie', function(done){
        var cookieName = 'testcookie';
        Max.Cookie.create(cookieName, 'testvalue', 1);
        expect(Max.Cookie.get(cookieName)).toEqual('testvalue');
        Max.Cookie.remove(cookieName);
        expect(Max.Cookie.get(cookieName)).toEqual(null);
        done();
    });

});

describe('set', function(){

    it('should set config', function(done){
        Max.set({
            baseUrl : 'https://foo.magnet.com',
            locationDataCollection : true
        });
        expect(Max.Config.baseUrl).toEqual('https://foo.magnet.com');
        Max.set({
            baseUrl : 'https://jumpstart.magnet.com'
        });
        done();
    });

});

describe('reset', function(){

    it('should reset config', function(done){
        Max.set({baseUrl : 'https://foo.magnet.com'});
        Max.reset();
        expect(Max.Config.baseUrl).toEqual('');
        Max.set({baseUrl : 'https://jumpstart.magnet.com'});
        done();
    });

});

describe('Transport createAcceptHeader', function(){

    it('should return an Accept header given input', function(done){
        expect(Max.Transport.createAcceptHeader('xml')).toEqual('application/xml;q=1.0');
        done();
    });

    it('should return default Accept header given no input', function(done){
        expect(Max.Transport.createAcceptHeader()).toEqual('application/json;');
        done();
    });

});

describe('init', function(){
    it('should initialize SDK', function(done){
        var clientId = 'test-client-id';
        var clientSecret = 'test-client-secret';
        var baseUrl = 'http://localhost:7777';
        Max.App.initialized = true;
		Max.Device.checkInWithDevice = sinon.stub(Max.Device, 'checkInWithDevice');
        Max.init({
            clientId: clientId,
            clientSecret: clientSecret,
            baseUrl: baseUrl
        });
        expect(Max.App.clientId).toEqual(clientId);
        expect(Max.App.clientSecret).toEqual(clientSecret);
        expect(Max.Config.baseUrl).toEqual(baseUrl);
        expect(Max.Device.checkInWithDevice.called).toEqual(true);
		Max.Device.checkInWithDevice.restore();
        done();
    });
});

describe('getCurrentUser', function(){
    it('should return currently logged in user', function(done){
        var username = 'test-user';
        var userId = 'test-id';
        Max.setUser({
            userName: username,
            userIdentifier: userId
        });
        var user = Max.getCurrentUser();
        expect(user.userName).toEqual(username);
        expect(user.userIdentifier).toEqual(userId);
        done();
    });
});

describe('saslBFAuth', function(){

    it('should have an SASL auth mechanism', function(done){
        expect(Strophe.Connection.prototype.mechanisms['X-MMX_BF_OAUTH2']).not.toBeUndefined();
        done();
    });

    it('should validate connection', function(done){
        var connection = {
            authcid: 'test-1111'
        };
        expect(Max.saslBFAuth.test(connection)).toEqual(true);
        done();
    });

    it('should return valid auth string', function(done){
        var auth = new Max.saslBFAuth();
        var connection = {
            pass: 'test-pass',
            jid: '11111@mmx/test-device'
        };
        expect(auth.onChallenge(connection)).toContain('11111');
        expect(auth.onChallenge(connection)).toContain(connection.pass);
        done();
    });

});

describe('Request', function(){
    var xhr, requests;

	beforeEach(function() {
        Max.App.initialized = true;
        Max.setConnection(null);
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        Max.Cookie.remove('magnet-max-refresh-token');
	});

	afterEach(function() {
        xhr.restore();
	});

    it('should return a promise object', function(done){
        var request = {
            method: 'GET',
            url: 'http://www.foo.com'
        };
        var success = function() {};
        var error = function() {};
        var req = Max.Request(request, success, error);
        expect(typeof req.resolve).toEqual('function');
        expect(typeof req.reject).toEqual('function');
        done();
    });

    it('should return error if sdk is not ready', function(done){
        var request = {
            method: 'GET',
            url: 'http://www.foo.com'
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.App.initialized = false;
        Max.Request(request, function(res) {
            expect(res).toEqual('failed-test');
            Max.App.initialized = true;
            done();
        }, function(e, details) {
            expect(e).toEqual('sdk not ready');
            Max.App.initialized = true;
            done();
        });
    });

    it('should execute successful request', function(done) {
        var request = {
            method: 'POST',
            url: 'http://www.foo.com',
            data: 'testdata'
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.Request(request, function (res, details) {
            expect(details.status).toEqual(200);
            done();
        }, function (e, details) {
            expect(e).toEqual('failed-test');
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(200);
        }, 5);
    });

    it('should execute failed request', function(done) {
        var request = {
            method: 'POST',
            url: 'http://www.foo.com',
            data: 'testdata'
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.Request(request, function (res, details) {
            expect(res).toEqual('failed-test');
            done();
        }, function (e, details) {
            expect(details.status).toEqual(400);
            done();
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(400);
        }, 5);
    });

    it('should handle authorization failure and fire no-auth event', function(done) {
        var request = {
            method: 'POST',
            url: 'http://www.foo.com',
            data: 'testdata'
        };
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        Max.on('not-authenticated', function(e, details) {
            expect(details.status).toEqual(401);
            done();
        });
        Max.Request(request, function (res, details) {
            expect(res).toEqual('failed-test');
            done();
        }, function (e, details) {
            expect(details.status).toEqual(401);
        });
        setTimeout(function() {
            expect(requests.length).toEqual(1);
            requests[0].respond(401);
        }, 5);
    });

});
