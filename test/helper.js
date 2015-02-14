var ConfigLoader = require('./conf/loader'),
	_= require('underscore');

exports.setEnvironment = setEnvironment;
exports.findEnvs = findEnvs;
exports.fakeUser = getFakeUser();
exports.cloneSession = cloneSession;
exports.loadConfig = ConfigLoader.load;
exports.getCloudEnvironment = getCloudEnvironment;

function getCloudEnvironment(sdk, session, type, name, callback) {
	try {
		return callback(null, sdk.Cloud.getEnvironment(session, type, name));
	} catch (err) {
		return callback(err);
	}
}


function findEnvs(ignoreConf) {
	var envs = ['production', 'development', 'local'];
	if(conf.environments && !ignoreConf) {
		for (var key in conf.environments) {
			var index = envs.indexOf(key),
				exists = index > -1;
			if(_.isEmpty(conf.environments[key]) || !conf.environments[key].baseurl) {
				if(exists) {
					envs.splice(index, 1);
				}
			} else {
				if(!exists) {
					envs.push(key);
				}
			}
		}
	}
	return envs;
}

/*
 * Returns the environment specified.
 * Returns false if the env is to be skipped or does not exist
 * Returns default if nothing is set in the config
 */
function getEnvironment(env, envs, ignoreConf) {

	if(typeof envs === "boolean" ) {
		ignoreConf = envs;
		envs = null;
	}
	if(!envs) {
		envs = findEnvs(ignoreConf);
	}
	if(envs.indexOf(env) == -1) {
		// Environment either doesn't exist or should be skipped
		return false;
	}

	if(conf.environments[env] && !ignoreConf) {
		// env is in the config
		return {
			"baseurl": conf.environments[env].baseurl,
			"isProduction": typeof conf.environments[env].isProduction !== 'undefined' ? conf.environments[env].isProduction : false,
			"supportUntrusted": typeof conf.environments[env].supportUntrusted !== 'undefined' ? conf.environments[env].supportUntrusted : true
		};
	} else {
		// get the default
		return 'default';
	}
};

/*
 * Sets the environment to the one which the string specified represents.
 * Returns true if successful, and false on a failure to find the environment specified
 */
function setEnvironment(sdk, env, envs, ignoreConf) {

	if(typeof envs === "boolean" ) {
		ignoreConf = envs;
		envs = null;
	}

	var gotEnv = getEnvironment(env, envs, ignoreConf);
	if(!gotEnv) {
		return false;
	} else if(gotEnv === 'default') {
		switch(env) {
			case "production":
				sdk.setProduction();
				break;
			case "development":
				sdk.setDevelopment();
				break;
			case "local":
				sdk.setLocal();
				break;
			default :
				sdk.setEnvironment();
				break;
		}
	} else {
		sdk.setEnvironment(gotEnv);
	}
	return true;
};

function getFakeUser() {
	return {
		"username" : "fake_" + Date.now(),
		"password" : "test"
	};
}

function cloneSession(session) {
	var clone = _.map(clone, _.clone(session));
	clone._invalidate = session._invalidate;
	clone._set = session._set;
	clone.invalidate = session.invalidate;
	clone.isValid = session.isValid;
	return clone;
}