/**
 * @constructor
 * @class
 * The Uploader class is a local representation of an attachment. This class provides methods to build
 * the file and upload it to the server.
 * @param {FileUpload|FileUpload[]} fileOrFiles One or more FileUpload objects created by an input[type="file"] HTML element.
 * @param {function} callback Fires after the file body is parsed.
 * @ignore
 */
MagnetJS.Uploader = function(fileOrFiles, callback) {
    var self = this;
    this.boundary = 'BOUNDARY+'+MagnetJS.Utils.getCleanGUID();
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;
    this.fileCount = fileOrFiles.length;
    this.attachmentRefs = [];
    this.contentType = 'multipart/form-data; boundary='+this.boundary;

    if (!(window.FileReader && window.Blob)) {
        return callback('upload not supported');
    }

    if (!MagnetJS.Utils.isArray(fileOrFiles))
        fileOrFiles = [fileOrFiles];

    // TOOD: implement iframe upload. http://caniuse.com/#search=formdata
    if (window.FormData) {
        this.message = new FormData();
        delete this.contentType;

        for (var i = 0; i < fileOrFiles.length; ++i) {
            this.message.append('file', fileOrFiles[i], 'attachment' + i);
            this.attachmentRefs.push({
                mimeType: fileOrFiles[i].type,
                senderId: mCurrentUser.userIdentifier
            });
        }

        callback(null, this);
    } else {
        this.add(fileOrFiles, 0, function() {
            self.close();
            callback(null, self);
        });
    }
};
/**
 * Add a part to the multipart/form-data body.
 * @param {FileUpload|FileUpload[]} fileOrFiles One or more FileUpload objects created by an input[type="file"] HTML element.
 * @param {number} index The current file index.
 * @param {function} callback Fires when there are no more files to add.
 */
MagnetJS.Uploader.prototype.add = function(fileOrFiles, index, callback) {
    var self = this;
    var reader = new FileReader();

    if (!fileOrFiles[index]) return callback();

    reader.addEventListener('load', function() {
        var id = self.prefix+String(++self.index);
        self.message += '--'+self.boundary+'\r\n';
        self.message += 'Content-Type: '+fileOrFiles[index].type+'\r\n';
        self.message += 'Content-Disposition: form-data; name="file"; filename="attachment'+index+'"\r\n\r\n';
        self.message += 'Content-Transfer-Encoding: base64\r\n';
        //self.message += 'Content-Id: '+id+'\r\n\r\n';
        self.message += reader.result+'\r\n\r\n';

        self.attachmentRefs.push({
            mimeType: fileOrFiles[index].type,
            senderId: mCurrentUser.userIdentifier
        });

        if (++index == self.fileCount) callback();
        else self.add(fileOrFiles, index, callback);
    }, false);

    //reader.readAsBinaryString(fileOrFiles[i]);
    reader.readAsDataURL(fileOrFiles[i]);
    //reader.readAsArrayBuffer(fileOrFiles[i]);
};
/**
 * Close the multipart/form-data body.
 */
MagnetJS.Uploader.prototype.close = function() {
    this.message += '--'+this.boundary+'--';
    //this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
};
/**
 * Upload the files to the server.
 * @param {MagnetJS.Channel} channel The channel the file will be sent to.
 * @param {string} messageId The XMPP message ID, used to associate an uploaded file with a {MagnetJS.Message}.
 * @returns {MagnetJS.Promise} A promise object containing success, error, always, then callbacks.
 */
MagnetJS.Uploader.prototype.upload = function(channel, messageId) {
    var self = this;
    var def = MagnetJS.Request({
        method: 'POST',
        url: '/com.magnet.server/file/save/multiple',
        data: self.message,
        contentType: self.contentType,
        headers: {
            metadata_message_id: messageId,
            metadata_channel_name: channel.name,
            metadata_channel_is_public: !channel.privateChannel
        },
        isBinary: true
    }, function(res) {
        // TODO: this makes it only support one file
        for (var i=0;i<self.attachmentRefs.length;++i)
            self.attachmentRefs[i].attachmentId = res.attachment0;

        def.resolve(self.attachmentRefs);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};

/**
 * @constructor
 * @class
 * The Attachment class is the local representation of an attachment.
 */
MagnetJS.Attachment = function(attachmentRef) {
    MagnetJS.Utils.mergeObj(this, attachmentRef);
    this.downloadUrl = MagnetJS.Config.mmxEndpoint+'/com.magnet.server/file/download/'+this.attachmentId
        +'?access_token='+MagnetJS.App.hatCredentials.access_token+'&user_id='+this.senderId;
};
/**
 * Get the full download url of the attachment.
 * @returns {string} The public location of the attachment.
 */
MagnetJS.Attachment.prototype.getDownloadUrl = function() {
    return this.downloadUrl;
};