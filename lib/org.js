/**
 * This source code is the intellectual property of Appcelerator, Inc.
 * Copyright (c) 2014-2015 Appcelerator, Inc. All Rights Reserved.
 * See the LICENSE file distributed with this package for
 * license restrictions and information about usage and distribution.
 */

/**
 * make a request to AppC platform for fetching org information
 */
var AppC = require('./index'),
	cachedOrgKey,
	cachedOrg;

function Org() {
}


/**
 * find the orgs that the logged in user belongs to
 */
Org.find = function find(session, callback) {

	if(!session || !session.id || !session.user) {
		return callback(new Error('session is not valid'));
	}

	if (cachedOrg && cachedOrgKey===session.id) {
		return callback(null, cachedOrg);
	}
	var params = '?include_created=true&include_inactive=false' +
		((session && session.user && session.user.is_staff) ? '&include_all=true' : '');
	AppC.createRequest(session, '/api/v1/user/organizations' + params, 'get', function(err,org) {
		if (err) { return callback(err); }
		cachedOrg = org;
		cachedOrgKey = session.id;
		return callback(null,org);
	});
};

/**
 * return an organization by checking the session
 */
Org.getById = function getById(session, id, callback) {
	try {
		var org_id = session.orgs[id];
		if(!org_id) { return callback(new Error('id is not valid')); }
		return callback(null, org_id);
	} catch (e) {
		return callback(new Error('session is not valid'));
	}
};

/**
 * find organization for a given org id
 */
Org.findById = function findById(session, id, callback) {
	if(!id) { return callback(new Error('id is not valid')); }
	AppC.createRequest(session,'/api/v1/org/'+id, callback);
};

/**
 * get an organization by name
 */
Org.getByName = function getByName(session, name, callback) {
	try {
		var keys = Object.keys(session.orgs || {}),
			length = keys.length;
		for (var c=0;c<length;c++) {
			var org_id = keys[c],
				org = session.orgs[org_id];
			if (org.name===name) {
				return callback(null, org);
			}
		}
		return callback(new Error('Org not found'));
	} catch (e) {
		return callback(new Error('session is not valid'));
	}
};

/**
 * return the current logged in organization
 */
Org.getCurrent = function getCurrent(session, callback) {
	try {
		return callback(null, session.user.org);
	} catch (e) {
		return callback(new Error('session is not valid'));
	}
};


module.exports = Org;
