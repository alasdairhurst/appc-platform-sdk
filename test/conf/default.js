module.exports = {
	user: {
		username: "",
		password: "",
		org_id: "",
		free_org_id: ""
	},
	another_user: { // real user which isn't the user above
		guid: "",
		user_id: ""
	},
	auth_token: "", // x-auth token
	gmail: {
		"email": "",
		"password": ""
	},
	environment: {
		baseurl: "",
		isProduction: false,
		supportUntrusted: true
	},
	apps: {
		// total number of apps in the enterprise org
		numberOfApps: 2,
		enterprise: { // app in an enterprise org
			app_name: "",
			app_id: "",
			app_guid: ""
		},
		developer: { // app in a developer org
			app_name: "",
			app_id: "",
			app_guid: ""
		}
	},
	registry: "https://8d2938f67044d8367d468453b5a6c2536185bcea.cloudapp-enterprise-preprod.appctest.com",
	browserConfig: {
		desiredCapabilities: {
			browserName: 'chrome'
		}
	}
}
