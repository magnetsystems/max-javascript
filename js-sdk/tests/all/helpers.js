
describe('Set Up Helpers', function(){
    beforeAll = function(fn){
        it('[beforeAll]', fn);
    };

    afterAll = function(fn){
        it('[afterAll]', fn)
    };
});

var isNode = (typeof module !== 'undefined' && module.exports && typeof window === 'undefined');

jasmine.getEnv().defaultTimeoutInterval = 18000;
