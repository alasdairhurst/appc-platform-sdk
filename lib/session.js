/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */
exports = module.exports = Session;

var AppC = require('./'),
	request = require('request');

function Session() {
	this.jar = this.getJar();
}

/**
 * return an empty jar
 */
Session.prototype.getJar = function() {
	return request.jar();
};

/**
 * return true if session is valid
 */
Session.prototype.isValid = function isValid() {
	return !!(this.jar && this.user && this.id);
};

/**
 * invalidate the session
 */
Session.prototype.invalidate = function invalidate() {
	if (this.isValid()) {
		AppC.Auth.logout(this);
	}
};

//---------------------- private methods ---------------------------

/**
 * set session information
 */
Session.prototype._set = function(body){
	this.id = body['connect.sid'];
	this.user = {
		username: body.username,
		email: body.email,
		phone: body.phone,
		guid: body.guid,
		org_id: body.org_id
	};
	return this;
};

/**
 * invalidate session
 */
Session.prototype._invalidate = function() {
	delete this.id;
	delete this.jar;
	delete this.user;
	delete this.orgs;
};
