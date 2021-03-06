
Max.saslBFAuth = function() {};

Max.saslBFAuth.prototype = new Strophe.SASLMechanism('X-MMX_BF_OAUTH2', true, 80);

Max.saslBFAuth.test = function(connection) {
  return connection.authcid !== null;
};

Max.saslBFAuth.prototype.onChallenge = function(connection) {
   var auth_str = '\u0000';
    auth_str = auth_str + Strophe.getNodeFromJid(connection.jid);
    auth_str = auth_str + '\u0000';
    auth_str = auth_str + connection.pass;

  return Max.Utils.utf16to8(auth_str);
};

Strophe.Connection.prototype.mechanisms[Max.saslBFAuth.prototype.name] = Max.saslBFAuth;
