/* unit tests for validating uploads */

var Max = Max || require('../../target/magnet-sdk');

describe('Uploader', function() {
    var xhr, requests;

	beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
        var baseUrl = 'http://localhost:7777/api';
        Max.App.initialized = true;
        Max.Config.baseUrl = baseUrl;
	});

	afterEach(function() {
        xhr.restore();
	});

    it('should instantiate an upload object using FormData', function(done) {
        var mockFile = {
            type: 'text/plain'
        };
        Max.setUser({
            userName: 'test-user',
            userId: 'test-id'
        });
        new Max.Uploader(mockFile, function(e, fileUpload) {
            expect(e).toEqual(null);
            expect(fileUpload).not.toBeUndefined();
            done();
        });
    });

    it('should create a multipart/form-data message', function(done) {
        var oFormData = FormData;
        var oFileReader = FileReader;
        FormData = null;
        FileReader = function() {};
        FileReader.prototype.readAsDataURL = function() {};
        FileReader.prototype.addEventListener = function(action, cb) {
            var self = this;
            setTimeout(function() {
                self.result = 'mock-payload';
                cb();
            }, 5);
        };
        var mockFile = {
            type: 'text/plain'
        };
        Max.setUser({
            userName: 'test-user',
            userId: 'test-id'
        });
        new Max.Uploader(mockFile, function(e, newUl) {
            expect(e).toEqual(null);
            expect(newUl.message).toContain('Content-Type: text/plain');
            expect(newUl.message).toContain('--BOUNDARY+');
            expect(newUl.message).toContain('mock-payload');
            FormData = oFormData;
            FileReader = oFileReader;
            done();
        });
    });

    it('should successfully upload file', function(done) {
        var oFormData = FormData;
        var oFileReader = FileReader;
        var testMIMEType = 'text/plain';
        var testUserId = 'test-id';
        var testAttachmentId = 'test-attachment-id';
        FormData = null;
        FileReader = function() {};
        FileReader.prototype.readAsDataURL = function() {};
        FileReader.prototype.addEventListener = function(action, cb) {
            var self = this;
            setTimeout(function() {
                self.result = 'mock-payload';
                cb();
            }, 5);
        };
        var mockFile = {
            type: testMIMEType
        };
        Max.setUser({
            userName: 'test-user',
            userId: testUserId
        });
        new Max.Uploader(mockFile, function(e, uploader) {
            expect(uploader.message).toContain('mock-payload');
            var channel = {
                name: 'mockchannel'
            };
            var messageId = 'mock-message-id';
            uploader.upload(channel, messageId).success(function(refs) {
                expect(refs.length).toEqual(1);
                expect(refs[0].mimeType).toEqual(testMIMEType);
                expect(refs[0].senderId).toEqual(testUserId);
                expect(refs[0].attachmentId).toEqual(testAttachmentId);
                FormData = oFormData;
                FileReader = oFileReader;
                done();
            });
            setTimeout(function() {
                expect(requests.length).toEqual(1);
                requests[0].respond(200, {
                    'Content-Type': 'application/json'
                }, JSON.stringify({
                    attachment0: testAttachmentId
                }));
            }, 5);
        });
    });

});

describe('Attachment', function() {

	beforeEach(function() {
        var baseUrl = 'http://localhost:7777/api';
        Max.App.initialized = true;
        Max.Config.baseUrl = baseUrl;
	});

    it('should obtain a download url', function(done) {
        var ref = {"mimeType":"text/plain","senderId":"test-id","attachmentId":"test-attachment-id"};
        Max.App.hatCredentials = {
            access_token: 'test-token'
        };
        var attachment = new Max.Attachment(ref);
        expect(attachment.getDownloadUrl()).toEqual('http://localhost:7777/api/com.magnet.server/file/download/test-attachment-id?access_token=test-token&user_id=test-id');
        done();
    });

});