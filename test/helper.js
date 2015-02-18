var ConfigLoader = require('./conf/loader'),
	_= require('underscore'),
	registry = require('appc-registry-sdk'),
	webdriverio = require('webdriverio'),
	should = require('should'),
	loggedIn = false;

ConfigLoader.load();
var browser = webdriverio.remote(global.$config.browserConfig);

exports.setEnvironment = setEnvironment;
exports.findEnvs = findEnvs;
exports.fakeUser = getFakeUser();
exports.cloneSession = cloneSession;
exports.getCloudEnvironment = getCloudEnvironment;
exports.registryLogin = registryLogin;
exports.getAuthCode = getAuthCode;
exports.loginGmail = loginGmail;
exports.deleteEmails = deleteEmails;
exports.startBrowser = function() { browser.init(); };
exports.stopBrowser = function() { browser.end(); };

browser.
	addCommand('loginGmail', function(done) {
		this.url('https://gmail.com')
			.getTitle(function (err, result) {
				should.not.exist(err);
				result.should.endWith("Gmail");
			})
			.call(function(){
				if(loggedIn){
					browser
						.call(done);
				} else {
					browser
						.waitFor('input[name="Email"]', 10000, expectNoErr)
						.element('css selector', 'input[name="Email"]', expectNoErr)
						.pause(100)
						.addValue('input[name="Email"]', global.$config.gmail.email, expectNoErr)
						.pause(100)
						.addValue('input[name="Passwd"]', global.$config.gmail.password, expectNoErr)
						.pause(5000)
						.click('input[name="signIn"]')
						.waitFor('div.ov', 5000, function(err, result) {
							if(!err) {
								loggedIn = true;
							}
							browser.call(done);
						}
					);
				}
			});
	})
	.addCommand('deleteEmails', function(done) {
		this.url('https://gmail.com')
			.getTitle(function (err, result) {
				should.not.exist(err);
				result.should.endWith("Gmail");
			})
			.call(function(){
				if(loggedIn){
					browser
						.call(poll);
				} else {
					browser
						.loginGmail(poll);
				}
			});
		function poll(){
			browser
				.url("https://gmail.com", expectNoErr)
				.waitFor('div.ov', 5000, function(err, result){
					if(err){
						console.log(err);
						setTimeout(poll, 5000);
					} else {
						browser
							.pause(1000)
							.waitFor('span.T-Jo', 5000, expectNoErr)
							.click('span.T-Jo', expectNoErr)
							.pause(500)
							.click('.ar9', function() {
								browser
									.pause(500)
									.call(done);
							})

					}
				}
			);
		}
	})
	.addCommand('getAuthCode', function(done){
		this.url('https://gmail.com')
			.getTitle(function (err, result) {
				should.not.exist(err);
				result.should.endWith("Gmail");
			})
			.call(function(){
				if(loggedIn){
					browser
						.call(poll);
				} else {
					browser
						.loginGmail(poll);
				}
			});
		function poll(){
			browser
				.url("https://gmail.com", expectNoErr)
				.waitFor('span[email="noreply@appcelerator.com"].zF', 5000, function(err, result){
					if(err){
						setTimeout(poll, 5000);
					} else {
						browser
							.pause(1000)
							.waitFor('.y6', 5000, expectNoErr)
							.click('.y6', expectNoErr)
							.waitFor('p[style="font-family:Helvetica,sans-serif;font-size:14px;line-height:20px;margin-left:20px;margin-right:20px;color:#333333"] b', 5000, expectNoErr)
							.getText('p[style="font-family:Helvetica,sans-serif;font-size:14px;line-height:20px;margin-left:20px;margin-right:20px;color:#333333"] b', function(err, result) {
								done(null, result);
							}
						);
					}
				}
			);
		}
	});

function deleteEmails(callback) {
	browser.deleteEmails(callback);
}

function getAuthCode(callback) {
	browser.getAuthCode(callback);
}

function loginGmail(callback) {
	browser.loginGmail(callback);
}

function getCloudEnvironment(sdk, session, type, name, callback) {
	try {
		return callback(null, sdk.Cloud.getEnvironment(session, type, name));
	} catch (err) {
		return callback(err);
	}
}

function registryLogin(username, password, callback) {
	var REGISTRY_URL = global.$config.registry || 'https://software.appcelerator.com',
		api = new registry('login');
	api.baseurl = REGISTRY_URL;
	api.body({
		username: username,
		password: password
	});
	api.send(function(err, res) {
		if (err) { return callback(err); }
		if (res && res.body && res.body.session) {
			return callback(null, res.body.session);
		} else {
			return callback(new Error('Malformed response from registry'));
		}
	});
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

expectNoErr = function() {
	return function(err, res) {
		console.log(err);
		should.not.exist(err);
	}
};

