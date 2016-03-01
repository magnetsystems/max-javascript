
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

function setUserAgent(window, userAgent) {
    if (window.navigator.userAgent != userAgent) {
        var userAgentProp = { get: function () { return userAgent; } };
        try {
            Object.defineProperty(window.navigator, 'userAgent', userAgentProp);
        } catch (e) {
            window.navigator = Object.create(navigator, {
                userAgent: userAgentProp
            });
        }
    }
}