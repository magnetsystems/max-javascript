Strophe.Connection.prototype.bfOauthConnect = function(jid, accessToken, callback, wait, hold) {
	this.jid = jid;
    this.connect_callback = callback;
    this.disconnecting = false;
    this.connected = false;
    this.authenticated = false;
    this.errors = 0;
    this.accessToken = accessToken;

    this.wait = wait || this.wait;
    this.hold = hold || this.hold;

    this.domain = Strophe.getDomainFromJid(this.jid);

    var body = this._proto._buildBody().attrs({
        to: this.domain,
        'xml:lang': 'en',
        wait: this.wait,
        hold: this.hold,
        content: 'text/xml; charset=utf-8',
        ver: '1.6',
        'xmpp:version': '1.0',
        'xmlns:xmpp': Strophe.NS.BOSH
    });

    this._changeConnectStatus(Strophe.Status.CONNECTING, null);

    this._proto._requests.push(
        new Strophe.Request(body.tree(),
            this._proto._onRequestStateChange.bind(
            this._proto, this._connect_bfoauth.bind(this)),
             body.tree().getAttribute('rid')));

    this._proto._throttledRequestHandler();
};

Strophe.Connection.prototype._connect_bfoauth = function(req) {
        this.connected = true;
        var bodyWrap = req.getResponse();
        if (!bodyWrap) { return; }

        this.xmlInput(bodyWrap);
        this.rawInput(Strophe.serialize(bodyWrap));

        var typ = bodyWrap.getAttribute('type');
        var cond, conflict;

        if (typ !== null && typ == 'terminate') {
            cond = bodyWrap.getAttribute('condition');
            conflict = bodyWrap.getElementsByTagName('conflict');
            if (cond !== null) {
                if (cond == 'remote-stream-error' && conflict.length > 0) {
                    cond = 'conflict';
                }
                this._changeConnectStatus(Strophe.Status.CONNFAIL, cond);
            } else {
                this._changeConnectStatus(Strophe.Status.CONNFAIL, 'unknown');
            }
            return;
        }

        if (!this.sid) {
            this.sid = bodyWrap.getAttribute('sid');
        }
        if (!this.stream_id) {
            this.stream_id = bodyWrap.getAttribute('authid');
        }
        var wind = bodyWrap.getAttribute('requests');
        if (wind) { this.window = wind; }
        var hold = bodyWrap.getAttribute('hold');
        if (hold) { this.hold = hold; }
        var wait = bodyWrap.getAttribute('wait');
        if (wait) { this.wait = wait; }

        var mechanisms = bodyWrap.getElementsByTagName('mechanism');
        var i, mech, auth_str, hashed_auth_str, xoauth;
        if (mechanisms.length == 0) {

            var body = Strophe.Bosh.prototype._buildBody();
            this._requests.push(
            	new Strophe.Request(body.tree(),
                    this._onRequestStateChange.bind(
                        this, this._connect_bfoauth.bind(this)),
                    body.tree().getAttribute('rid')));

            this._throttledRequestHandler();
            return;
        } else {
        	for (i = 0; i < mechanisms.length; i++) {
                mech = Strophe.getText(mechanisms[i]);
                if (mech == 'X-MMX_BF_OAUTH2') {
                	xoauth = true;
                	break;
                }
            }
        }

        if (!xoauth) {
        	return;
        }

    //    auth_str = Strophe.getBareJidFromJid(this.jid);
        auth_str = '\u0000';
        auth_str = auth_str + this.jid;
        auth_str = auth_str + '\u0000';
        auth_str = auth_str + this.accessToken;

        this._changeConnectStatus(Strophe.Status.AUTHENTICATING, null);
        this._sasl_challenge_handler = this._addSysHandler(
            this._sasl_success_cb.bind(this), null,
            'success', null, null);
        this._sasl_failure_handler = this._addSysHandler(
            this._sasl_success_cb.bind(this), null,
            'failure', null, null);

        hashed_auth_str = Base64.encode(auth_str);

        this.send($build('auth', {
            xmlns: Strophe.NS.SASL,
            mechanism: 'X-MMX_BF_OAUTH2'
        }).t(hashed_auth_str).tree());
};
