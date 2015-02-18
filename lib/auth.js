/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */

/**
 * make a request to AppC platform for authentication
 */
var AppC = require('./index'),
	Session = require('./session'),
	tough = require('tough-cookie'),
	Mac = require('getmac'),
	debug = require('debug')('appc:sdk'),
	cachedSession,
	cachedSessionKey;


module.exports = Auth;

function Auth() {
}

Auth.ERROR_CONNECTION_SERVER_ERROR = 'com.appcelerator.auth.connection.server.error';
Auth.ERROR_CONNECTION_REFUSED = 'com.appcelerator.auth.connection.refused';
Auth.ERROR_CONNECTION_RESET = 'com.appcelerator.auth.connection.reset';
Auth.ERROR_CONNECTION_INVALID_SSL = 'com.appcelerator.auth.connection.ssl.invalid';
Auth.ERROR_TWOFACTOR_DISABLED = 'com.appcelerator.auth.code.disable_2fa';
Auth.ERROR_NO_PHONE_CONFIGURED = 'com.appcelerator.auth.code.nophone';
Auth.ERROR_AUTH_CODE_EXPIRED = 'com.appcelerator.auth.code.expired';
Auth.ERROR_AUTH_CODE_INVALID = 'com.appcelerator.auth.code.invalid';

/**
 * logout. once this method completes the session will no longer be valid
 */
Auth.logout = function logout(session, callback) {
	AppC.createRequest(session,'/api/v1/auth/logout', 'post', function(e) {
		session._invalidate();
		callback && callback(e);
	});
};

function resolveUserOrg(session, next) {
	// find our orgs
	AppC.Org.find(session,function(err,orgs){
		if (err) { return next(err); }
		session.orgs = {};
		// map in our orgs
		orgs && orgs.forEach(function(org){
			session.orgs[org.org_id] = org;
		});
		if (session.user.org_id) {
			// set our org to the logged in org
			session.user.org_id && (session.user.org = session.orgs[session.user.org_id]);
		}
		else if (session.user.last_logged_in_org) {
			// get the last logged in org to set it
			session.user.org_id = session.user.last_logged_in_org;
			session.user.org = session.orgs[session.user.org_id];
		}
		else if (session.user.last_accessed_orgs) {
			// get the last accessed org in this case
			session.user.org_id = session.user.last_accessed_orgs[session.user.last_accessed_orgs.length-1].org_id;
			session.user.org = session.orgs[session.user.org_id];
		}
		else if (session.user.default_org) {
			// try and set the default org
			session.user.org_id = orgs.filter(function(org){return org.guid===session.user.default_org;})[0].org_id;
			session.user.org = session.orgs[session.user.org_id];
		}
		next(null,session);
	});
}

function makeError(msg,code) {
	if (msg instanceof Error) {
		msg.error = code;
		return msg;
	}
	var error = new Error(msg);
	error.code = code;
	return error;
}

/**
 * login
 */
Auth.login = function login(username, password, callback) {
	Mac.getMac(function(err,macAddress) {
		var session = new Session(),
			checkError = function(err, result) {
				if (err) {
					debug('login error %o',err);
					if (err.code) {
						switch(err.code) {
							case 'ECONNREFUSED': {
								return callback(makeError("Connection refused to "+AppC.baseurl,Auth.ERROR_CONNECTION_REFUSED));
							}
							case 'ECONNRESET': {
								return callback(makeError("Connection reset to "+AppC.baseurl,Auth.ERROR_CONNECTION_RESET));
							}
							case 'CERT_HAS_EXPIRED': {
								return callback(makeError("The servers SSL certificate at "+AppC.baseurl+" has expired. Refusing to connect.",Auth.ERROR_CONNECTION_INVALID_SSL));
							}
							case 400: {
								return callback(makeError(err,Auth.ERROR_CONNECTION_SERVER_ERROR));
							}
						}
					}
					return callback(makeError(err,Auth.ERROR_CONNECTION_SERVER_ERROR));
				}
				callback(null,result);
			};
			var r = AppC.createRequest(session, '/api/v1/auth/login', 'post', checkError, function mapper(obj, next) {
				session._set(obj);
				resolveUserOrg(session,next);
			}),
			form = r.form();
		form.append('username',username);
		form.append('password',password);
		form.append('keepMeSignedIn','true');
		form.append('from',AppC.userAgent);
		form.append('deviceid',macAddress||'00-00-00-00-00-00');
		debug('device id is %s',macAddress);
		debug('form parameters for %s, %o', r.url,form);
	});
};

/**
 * from an existing authenticated session, create a new Session object
 */
Auth.createSessionFromID = function createSessionFromID(id, callback) {
	// if we already have it, continue to use it
	if (cachedSession && cachedSessionKey === id) {
		debug('found cached session %s',id);
		return callback(null, cachedSession);
	}
	var session = new Session(),
		url = require('url'),
		parse = url.parse(AppC.baseurl),
		host = parse.host,
		path = parse.path,
		cookie = new tough.Cookie();

	cookie.key = 'connect.sid';
	cookie.value = id;
	cookie.secure = true;
	cookie.httpOnly = true;
	cookie.path = path;
	cookie.domain = host;
	cookie.expires = Infinity;
	cookie.hostOnly = false;
	cookie.creation = new Date();
	cookie.lastAccessed = new Date();
	session.id = id;
	session.jar.setCookie(cookie.toString(), AppC.baseurl, function(err, cookie){
		if (err) { return callback(err); }
		if (!cookie) { return callback(new Error("session cookie not set")); }
		// fetch the current user and set it on the session
		AppC.User.find(session,function(err,user){
			if (err) { return callback(err); }
			session.user = user;
			resolveUserOrg(session,function(err){
				cachedSession = session;
				cachedSessionKey = id;
				callback(err,session);
			});
		});
	});
};

/**
 * request a login code
 *
 * @param {Object} session object
 * @param {boolean} if true, send via SMS (only if configured). otherwise, email
 * @param {Function} callback returns true (as 2nd parameter) if success
 */
Auth.requestLoginCode = function requestLoginCode(session, sms, callback) {
	AppC.User.find(session, function(err,user){
		if (err) { return callback(err); }
		if (user.disable_2fa) {
			return callback(makeError('Two-factor authentication is disabled',Auth.ERROR_TWOFACTOR_DISABLED));
		}
		if (sms && !user.phone) {
			return callback(makeError('No SMS number configured. Please configure your SMS number in your profile to use SMS verification.',Auth.ERROR_NO_PHONE_CONFIGURED));
		}
		var r = AppC.createRequest(session, '/api/v1/auth/deviceauth/resend', 'post', function(err,body) {
			if (err) { return callback(err); }
			callback(null,body);
		});
		if (r) {
			var form = r.form();
			form.append('sendby',sms ? 'sms' : 'email');
			form.append('sendto',sms ? user.phone : user.email);
		}
	});
};

/**
 * given a user code, check for validation of this code
 *
 * @param {Object} session object
 * @param {String} code for verification
 * @parma {Function} callback returns true (as 2nd parameter) if valid
 */
Auth.verifyLoginCode = function verifyLoginCode(session, code, callback) {
	var r = AppC.createRequest(session,'/api/v1/auth/deviceauth', 'post', function(err,result) {
		if (err) { return callback(err); }
		if (result) {
			if (result.expired) {
				return callback(makeError('Your authorization code has expired.',Auth.ERROR_AUTH_CODE_EXPIRED));
			}
			return callback(null, result.valid);
		}
		return callback(makeError('Your authorization code was invalid.',Auth.ERROR_AUTH_CODE_INVALID));
	});
	if (r) {
		var form = r.form();
		form.append('code', code);
	}

};
