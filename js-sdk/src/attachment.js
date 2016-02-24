MagnetJS.Attachment = function(fileOrFiles) {
    this.boundary = 'BOUNDARY+'+MagnetJS.Utils.getCleanGUID();
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;

    if (!MagnetJS.Utils.isArray(fileOrFiles))
        fileOrFiles = [fileOrFiles];

    for (var i=0;i<fileOrFiles.length;++i) {
        this.add(fileOrFiles[i]);
    }

    this.close();
};

MagnetJS.Attachment.prototype.add = function(file) {
    var id = this.prefix+String(++this.index);
    this.message += '--'+this.boundary+'\r\n';
    this.message += 'Content-Type: '+file.mimeType+'\r\n';
    this.message += 'Content-Disposition: form-data; name="file"; filename="attachment'+this.index+'"\r\n';
    this.message += 'Content-Transfer-Encoding: base64\r\n';
    this.message += 'Content-Id: '+id+'\r\n\r\n';
    this.message += file.val+'\r\n\r\n';
    return id;
};
MagnetJS.Attachment.prototype.close = function(body) {
    this.message += '--'+this.boundary+'--';
    //this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
};

MagnetJS.Attachment.prototype.upload = function(channel, messageId) {
    var def = MagnetJS.Request({
        method: 'POST',
        url: 'http://localhost:1337/localhost:7777/api/com.magnet.server/file/save/multiple',
        data: this.message,
        contentType: 'multipart/form-data; boundary='+this.boundary,
        headers: {
            metadata_message_id: messageId,
            metadata_channel_name: channel.name,
            metadata_channel_is_public: !channel.privateChannel
        }
    }, function() {
        def.resolve.apply(def, arguments);
    }, function() {
        def.reject.apply(def, arguments);
    });
    return def.promise;
};
