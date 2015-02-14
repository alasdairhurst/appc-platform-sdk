/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */
var pkg = require('../package.json'),
	debug = require('debug')('appc:sdk'),
	request = require('request'), //require('appc-request-ssl'),
	urllib = require('url');

function AppC() {
}

exports = module.exports = AppC;

AppC.Auth = require('./auth');
AppC.Org = require('./org');
AppC.User = require('./user');
AppC.App = require('./app');
AppC.Notification = require('./notification');
AppC.Feed = require('./feed');
AppC.Cloud = require('./cloud');

AppC.version = pkg.version;
AppC.userAgent = pkg.name+'/'+pkg.version;

AppC.createAPIResponseHandler = createAPIResponseHandler;
AppC.createRequestObject = createRequestObject;

/**
 * set the base url to use production
 */
AppC.setProduction = function setProduction() {
	AppC.baseurl = 'https://dashboard.appcelerator.com';
	AppC.isProduction = true;
	AppC.supportUntrusted = false;
	debug('set production to '+AppC.baseurl);
};

/**
 * set the base url to use development
 */
AppC.setDevelopment = function setDevelopment() {
	AppC.baseurl = 'https://360-preprod.appcelerator.com';
	AppC.isProduction = false;
	AppC.supportUntrusted = true;
	debug('set dev to '+AppC.baseurl);
};

/**
 * set the base url to use local development
 */
AppC.setLocal = function setLocal() {
	AppC.baseurl = 'https://360-local.appcelerator.com:8443';
	AppC.isProduction = false;
	AppC.supportUntrusted = true;
	debug('set local to '+AppC.baseurl);
};

/**
 * set a custom environment, use local config as defaults
 */
AppC.setEnvironment = function setEnvironment(opts) {
	opts = opts || {};
	AppC.baseurl = opts.baseurl || 'https://360-local.appcelerator.com:8443';
	AppC.isProduction = typeof opts.isProduction !== 'undefined' ? opts.isProduction : false;
	AppC.supportUntrusted = typeof opts.supportUntrusted !== 'undefined' ? opts.supportUntrusted : true;
	debug('set custom environment ' + JSON.stringify(opts) + ' to ' + AppC.baseurl);
};


// set DEFAULT to production host
AppC.setProduction();

/*
 * wrapper for existing functions which use createRequestObject.
 * This allows xauth token or session to be specified when creating an object
 */
function createRequestObject(auth, url) {
	if(typeof(auth) === 'object') {
		if(!auth.jar) {
		}
		// auth is a session
		return _createRequestObject(auth, url);
	}
	if(typeof(auth) === 'string') {
		//auth is a token
		return _createRequestObject(url, auth);
	}
}

function _createRequestObject(session, url, authToken) {
	if(typeof(session) === 'object') {
		if (!session || !session.jar) {
			throw new Error("session is not valid");
		}
		if(!url) {
			url = session;
		}
	}
	if(typeof(session) === 'string') {
		authToken = url;
		url = session;
		session = null;
	}
	var opts = {
		url: url,
		headers: {
			'User-Agent': AppC.userAgent
		}
	};
	// support self-signed certificates
	if (AppC.supportUntrusted) {
		opts.agent = false;
		opts.rejectUnauthorized = false;
	}
	if(authToken) {
		opts.headers['x-auth-token'] = authToken;
	}
	if(session) {
		opts.jar = session.jar;
	}
	debug('fetching',url);
	return opts;

}

function createAPIResponseHandler(callback, mapper) {
	return function(err,resp,body) {
		debug('api response, err=%o, body=%o',err,body);
		if (err) { return callback(err); }
		try {
			var ct = resp.headers['content-type'],
				isJSON = ct && ct.indexOf('/json') > 0;
			body = typeof(body)==='object' ? body : isJSON && JSON.parse(body) || body;
			if (!body.success) {
				debug('api body failed, was: %o',body);
				var description = typeof(body.description)==='object' ? body.description.message : body.description || 'unexpected response from the server';
				var error = new Error(description);
				error.code = body.code;
				error.internalCode = body.internalCode;
				typeof(body)==='string' && (error.content = body);
				return callback(error);
			}
			if (mapper) {
				return mapper(body.result,callback);
			}
			return callback(null, body.result);
		}
		catch (E) {
			return callback(E, body);
		}
	};
}

/**
 * create a request to the platform and return the request object
 */
AppC.createRequest = function(session, path, method, callback, mapper, json) {
	if (typeof(method)==='function') {
		json = mapper;
		mapper = callback;
		callback = method;
		method = 'get';
	}
	if (typeof(mapper) === 'object') {
		json = mapper;
		mapper = null;
	}
	try {
		if(path[0] === '/') {
			path = urllib.resolve(AppC.baseurl, path);
		}
		var obj = AppC.createRequestObject(session, path);
		if(json) {
			obj.json = json;
		}

		return request[method.toLowerCase()](obj, AppC.createAPIResponseHandler(callback||function(){}, mapper||null));
	} catch (e) {
		callback(e);
		// don't return the callback since it expects a request
	}
};