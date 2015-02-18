# 1.0.25 (02-17-2015)

- added unit tests

# 1.0.24 (01-16-2015)

- add debug logging on form parameters of request

# 1.0.23 (01-14-2015)

- updated Cloud.createApp and Cloud.createUser to use new APIs by dashboard

# 1.0.22 (01-13-2015)

- move to use [appc-request-ssl](https://github.com/appcelerator/appc-request-ssl) library with packaged fingerprints

# 1.0.21 (01-13-2015)

- support for using request library to form platform request

# 1.0.20 (01-13-2015)

- moved to use [request-ssl](https://github.com/jhaynie/request-ssl) library and setup SSL certificates for known domains

# 1.0.19 (01-10-2015)

- removed errrant debug statement

# 1.0.18 (01-10-2015)

- added caching to often used methods to improve performance

# 1.0.17 (01-10-2015)

- added device authorization API
- clarified/changed LICENSE to be consistent with Platform

# 1.0.16 (01-08-2015)

- exposed API for creating a named ACS app and registering with the dashboard
- better error handling when an environment is down

# 1.0.15 (12-12-2014)

- added app team members apis

# 1.0.14 (12-12-2014)

- added app package api
- cleanup small code changes

# 1.0.13 (12-02-2014)

- added debug module to make it easier to debug problems with this library. add DEBUG=appc:sdk to environment to get more verbose debug logging

# 1.0.12 (12-02-2014)

- Support Org.findById to get an organization details by id

# 1.0.11 (11-19-2014)

- Allow the org_id to be passed in to createApp

# 1.0.10 (11-19-2014)

- Provide mac address default

# 1.0.9 (11-19-2014)

- Keep logged into 360 session
- Fixed problem with user object not having an active org
- Better error handling
- Support local dev environment
- Support self-signed certificates by default in dev/test
- Pass deviceid on login so we can do device authorization

# 1.0.8 (11-17-2014)

- Better handling of Cloud responses

# 1.0.7 (11-17-2014)

- Added API for create cloud app and cloud user
- Only parse JSON response if the Content-Type header is JSON
- Better handling for non-JSON responses in Error callback

# 1.0.6 (11-16-2014)

- Resolved issue with cookie jar

# 1.0.5 (11-16-2014)

- Make sure we always set the right current org for a session

# 1.0.4 (11-16-2014)

- Added support for creating new application from tiapp.xml
- Added support for creating session from session id
- Added support for retrieving cloud environments
- Added support for both production and development logins
- User.find will now use current user if not user id passed

# 1.0.1 (09-29-2014)

- Added support for creating an ACS application

# 1.0.0 (08-31-2014)

- Initial release
