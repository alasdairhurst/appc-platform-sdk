/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */

/**
 * make a request to AppC platform for fetching user information
 */
var AppC = require('./index'),
	debug = require('debug')('appc:sdk'),
	cachedUser,
	cachedUserKey;

function User() {
}

/**
 * find a specific user or if not user_id is supplied, the sessions logged
 * in user
 */
User.find = function find(session, user_id, callback) {
	if (typeof(user_id)==='function') {
		callback = user_id;
		if (session && session.user && session.user.guid) {
			user_id = session.user.guid;
		}
		else {
			user_id = 'current';
		}
	}
	var key = session.id+user_id;
	// if we already have it cached, just return it
	if (cachedUser && cachedUserKey===key) {
		debug('found cached user %s',key);
		return callback(null, cachedUser);
	}
	AppC.createRequest(session, '/api/v1/user/'+user_id, function(err,user) {
		if (err) { return callback(err); }
		cachedUserKey = key;
		cachedUser = user;
		return callback(null, user);
	});
};

/**
 * switch the users logged in user
 */
User.switchLoggedInOrg = function switchLoggedInOrg(session, org_id, callback) {
	AppC.Org.getById(session, org_id, function(err, org){
		if(err) { return callback(err); }
		var req = AppC.createRequest(session,'/api/v1/auth/switchLoggedInOrg', 'post', callback, function mapper(obj, next) {
			session.user.org = org;
			session.user.org_id = org_id;
			next(null,obj);
		});
		if (req) {
			var form = req.form();
			form.append('org_id',org_id);
			debug('form parameters for %s, %o',req.url,form);
		}
	});

};

module.exports = User;
