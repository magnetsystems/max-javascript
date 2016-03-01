/* unit tests for validating messaging features */

var Max = Max || require('../../target/magnet-sdk');

describe('start', function() {

    afterEach(function() {
        Max.setConnection(null);
    });

    it('should start receiving messages', function(done){
        Max.setConnection({});
        Max.start();
        expect(Max.App.receiving).toEqual(true);
        expect(Max.getConnection().priority).toEqual(0);
        done();
    });

    it('should stop receiving messages', function(done){
        Max.setConnection({});
        Max.stop();
        expect(Max.App.receiving).toEqual(false);
        expect(Max.getConnection().priority).toEqual(-255);
        done();
    });

});

describe('registerListener', function() {
    var xml;
    beforeEach(function() {
        xml = "<message></message>";
    });

    it('should register a listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            }
        });
        var messageStub = sinon.stub(Max.Message.prototype, 'formatMessage');
        messageStub.callsArg(1);
        var testHandlerId = 'testHandler';
        var listener = new Max.MessageListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.prototype.formatMessage.restore();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.handler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });
});

describe('unregisterListener', function() {
    var xml;
    beforeEach(function() {
        xml = "<message></message>";
    });
    afterEach(function() {
        Max.setConnection(null);
    });

    it('should unregister a listener', function(done){
        Max.setConnection({
            addHandler: function(cb) {
                return cb;
            },
            deleteHandler: function() {

            }
        });
        var messageStub = sinon.stub(Max.Message.prototype, 'formatMessage');
        messageStub.callsArg(1);
        var testHandlerId = 'testHandler';
        var listener = new Max.MessageListener(testHandlerId, function(mmxMessage) {
            expect(JSON.stringify(mmxMessage)).toContain('recipients');
            expect(JSON.stringify(mmxMessage)).toContain('meta');
            Max.Message.prototype.formatMessage.restore();
            Max.unregisterListener(testHandlerId);
            expect(Max.getStore()[listener.id]).toBeUndefined();
            done();
        });
        expect(listener.id).toEqual(testHandlerId);
        expect(typeof listener.handler).toEqual('function');
        Max.registerListener(listener);
        expect(Max.getStore()[listener.id]).not.toBeUndefined();
        Max.getStore()[listener.id](xml);

    });
});
