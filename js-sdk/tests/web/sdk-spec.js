/* unit tests for MagnetJS */

describe('MagnetJS', function(){
    it('should set up endpointUrl', function(){
        MagnetJS.set({
            endpointUrl : 'https://jumpstart.magnet.com'
        });
    });
});

describe('Utils isAndroid', function(){

    it('should return false if running on web', function(done){
        expect(MagnetJS.Utils.isAndroid).toEqual(false);
        done();
    });

});

describe('Utils isIOS', function(){

    it('should return false if running on web', function(done){
        expect(MagnetJS.Utils.isIOS).toEqual(false);
        done();
    });

});

describe('Utils isMobile', function(){

    it('should return false if running on web', function(done){
        expect(MagnetJS.Utils.isMobile).toEqual(false);
        done();
    });

});

describe('Utils isNode', function(){

    it('should return false if running on web', function(done){
        expect(MagnetJS.Utils.isNode).toEqual(false);
        done();
    });

});

describe('Utils hasFeature', function(){

    it('should return true if the feature exists', function(done){
        expect(MagnetJS.Utils.hasFeature('localStorage')).toEqual(true);
        done();
    });

    it('should return false if the feature does not exist', function(done){
        expect(MagnetJS.Utils.hasFeature('missingfeature')).toEqual(false);
        done();
    });

});
