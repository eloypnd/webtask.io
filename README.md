# webtask.io

Monorepo with task for [webtask.io](https://webtask.io).

## Tasks

### Twitter API proxy

**Why?**

[Twitter API v1.1](https://dev.twitter.com/rest/public) implements [Oauth](http://oauth.net/) 1.0A. Since it doesn't support [CORS](http://www.w3.org/TR/cors/), it is not possible make client side requests to the API.

To find how this proxy is used to fetch tweets from a browser see [fogon.netlify.com](https://fogon.netlify.com).
