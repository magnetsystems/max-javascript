/* unit tests for Max */

describe('Max', function(){
    it('should set up baseUrl', function(){
        Max.set({
            baseUrl : 'https://jumpstart.magnet.com'
        });
        expect(Max.Config.baseUrl).toEqual('https://jumpstart.magnet.com');
    });
});

describe('Utils isAndroid', function(){

    it('should return false if running on web', function(done){
        expect(Max.Utils.isAndroid).toEqual(false);
        done();
    });

});

describe('Utils isIOS', function(){

    it('should return false if running on web', function(done){
        expect(Max.Utils.isIOS).toEqual(false);
        done();
    });

});

describe('Utils isMobile', function(){

    it('should return false if running on web', function(done){
        expect(Max.Utils.isMobile).toEqual(false);
        done();
    });

});

describe('Utils isNode', function(){

    it('should return false if running on web', function(done){
        expect(Max.Utils.isNode).toEqual(false);
        done();
    });

});

describe('Utils hasFeature', function(){

    it('should return true if the feature exists', function(done){
        expect(Max.Utils.hasFeature('localStorage')).toEqual(true);
        done();
    });

    it('should return false if the feature does not exist', function(done){
        expect(Max.Utils.hasFeature('missingfeature')).toEqual(false);
        done();
    });

});
