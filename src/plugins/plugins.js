/**
 * Third party plugins.
 */

/*!
 *  window.btoa/window.atob shim
 */
(function(){function t(t){this.message=t}var e="undefined"!=typeof exports?exports:this,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=Error(),t.prototype.name="InvalidCharacterError",e.btoa||(e.btoa=function(e){for(var o,n,a=0,i=r,c="";e.charAt(0|a)||(i="=",a%1);c+=i.charAt(63&o>>8-8*(a%1))){if(n=e.charCodeAt(a+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return c}),e.atob||(e.atob=function(e){if(e=e.replace(/=+$/,""),1==e.length%4)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var o,n,a=0,i=0,c="";n=e.charAt(i++);~n&&(o=a%4?64*o+n:n,a++%4)?c+=String.fromCharCode(255&o>>(6&-2*a)):0)n=r.indexOf(n);return c})})();