MagnetJS.Uploader = function(fileOrFiles, cb) {
    var self = this;
    this.boundary = 'BOUNDARY+'+MagnetJS.Utils.getCleanGUID();
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;
    this.fileCount = fileOrFiles.length;
    this.attachmentRefs = [];
    this.contentType = 'multipart/form-data; boundary='+this.boundary;

    if (!(window.FileReader && window.Blob)) {
        return cb('upload not supported');
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

        cb(null, this);
    } else {
        this.add(fileOrFiles, 0, function() {
            self.close();
            cb(null, self);
        });
    }
};

MagnetJS.Uploader.prototype.add = function(fileOrFiles, index, done) {
    var self = this;
    var reader = new FileReader();

    if (!fileOrFiles[index]) return done();

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

        if (++index == self.fileCount) done();
        else self.add(fileOrFiles, index, done);
    }, false);

    //reader.readAsBinaryString(fileOrFiles[i]);
    reader.readAsDataURL(fileOrFiles[i]);
    //reader.readAsArrayBuffer(fileOrFiles[i]);
};
MagnetJS.Uploader.prototype.close = function(body) {
    this.message += '--'+this.boundary+'--';
    //this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
};

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

MagnetJS.Attachment = function(attachmentRef) {
    MagnetJS.Utils.mergeObj(this, attachmentRef);
    this.downloadUrl = MagnetJS.Config.mmxEndpoint+'/com.magnet.server/file/download/'+this.attachmentId
        +'?access_token='+MagnetJS.App.hatCredentials.access_token+'&user_id='+this.senderId;
};