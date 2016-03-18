/**
 * @constructor
 * @class
 * The Uploader class is a local representation of an attachment. This class provides methods to build the file and upload it to the server.
 * @param {File|File[]|FileList} fileOrFiles One or more File objects created by an input[type="file"] HTML element.
 * @param {function} callback Fires after the file body is parsed.
 * @ignore
 */
Max.Uploader = function(fileOrFiles, callback) {
    var self = this;

    if (!(window.FileReader && window.Blob))
        return callback('upload not supported');

    if (!fileOrFiles.length)
        fileOrFiles = [fileOrFiles];

    this.boundary = 'BOUNDARY+'+Max.Utils.getCleanGUID();
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;
    this.fileCount = fileOrFiles.length;
    this.attachmentRefs = [];
    this.contentType = 'multipart/form-data; boundary='+this.boundary;

    // TOOD: implement iframe upload. http://caniuse.com/#search=formdata
    if (window.FormData) {
        this.message = new FormData();
        delete this.contentType;

        for (var i = 0; i < fileOrFiles.length; ++i) {
            this.message.append('file', fileOrFiles[i], fileOrFiles[i].name);
            this.attachmentRefs.push({
                mimeType: fileOrFiles[i].type,
                senderId: mCurrentUser.userId,
                ref: fileOrFiles[i].name
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
 * @param {File|File[]|FileList} fileOrFiles One or more File objects created by an input[type="file"] HTML element.
 * @param {number} index The current file index.
 * @param {function} callback Fires when there are no more files to add.
 */
Max.Uploader.prototype.add = function(fileOrFiles, index, callback) {
    var self = this;
    var reader = new FileReader();

    if (!fileOrFiles[index]) return callback();

    reader.addEventListener('load', function() {
        var id = self.prefix+String(++self.index);
        self.message += '--'+self.boundary+'\r\n';
        self.message += 'Content-Type: '+fileOrFiles[index].type+'\r\n';
        self.message += 'Content-Disposition: form-data; name="file"; filename="'+fileOrFiles[index].name+'"\r\n\r\n';
        self.message += 'Content-Transfer-Encoding: base64\r\n';
        //self.message += 'Content-Id: '+id+'\r\n\r\n';
        self.message += reader.result+'\r\n\r\n';

        self.attachmentRefs.push({
            mimeType: fileOrFiles[index].type,
            senderId: mCurrentUser.userId,
            ref: fileOrFiles[index].name
        });

        if (++index == self.fileCount) callback();
        else self.add(fileOrFiles, index, callback);
    }, false);

    //reader.readAsBinaryString(fileOrFiles[i]);
    reader.readAsDataURL(fileOrFiles[index]);
    //reader.readAsArrayBuffer(fileOrFiles[i]);
};

/**
 * Close the multipart/form-data body.
 */
Max.Uploader.prototype.close = function() {
    this.message += '--'+this.boundary+'--';
    //this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
};

/**
 * Upload channel message attachments.
 * @param {Max.Channel} channel The channel the file will be sent to.
 * @param {string} messageId The XMPP message ID, used to associate an uploaded file with a {Max.Message}.
 * @returns {Max.Promise} A promise object returning a list of attachment metadata or request error.
 */
Max.Uploader.prototype.channelUpload = function(channel, messageId) {
    return this.upload({
        metadata_message_id: messageId,
        metadata_channel_name: channel.name,
        metadata_channel_is_public: !channel.privateChannel
    });
};

/**
 * Upload channel message attachments.
 * @param {string} messageId The XMPP message ID, used to associate an uploaded file with a {Max.Message}.
 * @returns {Max.Promise} A promise object returning a list of attachment metadata or request error.
 */
Max.Uploader.prototype.messageUpload = function(messageId) {
    return this.upload({
        metadata_message_id: messageId
    });
};

/**
 * Upload user avatar.
 * @param {string} userId The identifier of the user who the avatar belongs to.
 * @returns {Max.Promise} A promise object returning a list of attachment metadata or request error.
 */
Max.Uploader.prototype.avatarUpload = function(userId) {
    return this.upload({
        metadata_file_id: userId
    });
};

/**
 * Upload the files to the server.
 * @param {object} headers upload HTTP headers.
 * @returns {Max.Promise} A promise object returning a list of attachment metadata or request error.
 */
Max.Uploader.prototype.upload = function(headers) {
    var self = this;
    var def = Max.Request({
        method: 'POST',
        url: '/com.magnet.server/file/save/multiple',
        data: self.message,
        contentType: self.contentType,
        headers: headers,
        isBinary: true
    }, function(res) {
        for (var i=0;i<self.attachmentRefs.length;++i)
            self.attachmentRefs[i].attachmentId = res[self.attachmentRefs[i].ref];

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
 * @property {string} name Filename of the attachment.
 * @property {string} mimeType MIME-type of the attachment.
 * @property {string} downloadUrl Url to download the attachment. For example, this url can be inserted directly into an <img> tag to display an image.
 * @property {string} attachmentId A unique identifier of the attachment.
 */
Max.Attachment = function(attachmentRef) {
    Max.Utils.mergeObj(this, attachmentRef);
    this.name = attachmentRef.ref;
    this.downloadUrl = Max.Config.baseUrl+'/com.magnet.server/file/download/'+this.attachmentId
        +'?access_token='+Max.App.hatCredentials.access_token+'&user_id='+this.senderId;
};

/**
 * Get the full download url of the attachment.
 * @returns {string} The public location of the attachment.
 */
Max.Attachment.prototype.getDownloadUrl = function() {
    return this.downloadUrl;
};