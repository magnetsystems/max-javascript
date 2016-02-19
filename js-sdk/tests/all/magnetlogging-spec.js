/* unit tests for validating logging features */

var MagnetJS = MagnetJS || require('../../target/magnet-sdk');

describe('Magnet Logging', function(){

    beforeEach(function(done){
        MagnetJS.Config.logHandler = 'DB';
        MagnetJS.Config.logLevel = 'INFO';
        MagnetJS.Storage.clearTable(MagnetJS.Log.store, function(){
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should respect the configured log level', function(done){
        MagnetJS.Log.severe('this is a severe');
        MagnetJS.Log.warning('this is a warning');
        MagnetJS.Log.info('this is a info');
        MagnetJS.Log.config('this is a config');
        MagnetJS.Log.fine('this is a fine');
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(3);
            expect(data[0].level).toEqual('SEVERE');
            expect(data[1].level).toEqual('WARNING');
            expect(data[2].level).toEqual('INFO');
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should only log to console', function(done){
        MagnetJS.Config.logHandler = 'Console';
        MagnetJS.Log.severe('this is a severe');
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(0);
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should only log to storage', function(done){
        MagnetJS.Log.severe('this is a severe');
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(1);
            expect(data[0].level).toEqual('SEVERE');
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should only log to both storage and console', function(done){
        MagnetJS.Config.logHandler = 'Console&DB';
        MagnetJS.Log.severe('this is a severe');
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(1);
            expect(data[0].level).toEqual('SEVERE');
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should clear the logs without dumping', function(done){
        MagnetJS.Log.severe('this is a severe');
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(1);
            MagnetJS.Log.clear(function(){
                MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
                    expect(data.length).toEqual(0);
                    done();
                }, function(e){
                    expect(e).toEqual('failed-test');
                    done();
                });
                done();
            }, function(e){
                expect(e).toEqual('failed-test');
                done();
            });
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

    it('should log a fully populated log message using Log.log', function(done){
        MagnetJS.Log.log('SEVERE', ['this is a severe', {
            meta1 : 'meta1',
            meta2 : 'meta2'
        }, 'UnitTest', 'some file']);
        MagnetJS.Storage.get(MagnetJS.Log.store, null, function(data){
            expect(data.length).toEqual(1);
            expect(data[0].level).toEqual('SEVERE');
            expect(data[0].msg).toEqual('this is a severe');
            expect(data[0].metadata.meta1).toEqual('meta1');
            expect(data[0].metadata.meta2).toEqual('meta2');
            expect(data[0].logSource).toEqual('UnitTest');
            expect(data[0].file).toEqual('c29tZSBmaWxl');
            done();
        }, function(e){
            expect(e).toEqual('failed-test');
            done();
        });
    });

});
