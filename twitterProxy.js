const express = require('express');
const Webtask = require('webtask-tools');
const morgan = require('morgan');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

const twitterAuthMiddleware = () => async (req, res, next) => {
  try {
    const data = await getStorage(req.webtaskContext.storage);
    if (data && !data.accessToken) {
      const accessToken = await getTwitterToken(
        req.webtaskContext.secrets['TWITTER_CONSUMER_KEY'],
        req.webtaskContext.secrets['TWITTER_CONSUMER_SECRET']
      );
      await setStorage(req.webtaskContext.storage, {accessToken});
      req.accessToken = accessToken;
    } else {
      req.accessToken = data.accessToken;
    }
    next();
  } catch (e) {
    next(e);
  }
}

app.use(morgan('short'));
app.use(cors());
app.use(twitterAuthMiddleware());

async function handleRequest (req, res, next) {
  try {
    const twitterResponse = await twitterRequest(req.url, req.accessToken);
    return res.json(twitterResponse);
  } catch (e) {
    next(e);
  }
}

app.get('/1.1/*', handleRequest);

app.listen(3000, () => console.log('Twitter API proxy listening on port 3000!'));

const getStorage = (store) => {
  return new Promise(function(resolve, reject) {
    store.get((e, d) => e ? reject(e) : resolve(d));
  })
}
const setStorage = (store, data) => {
  return new Promise(function(resolve, reject) {
    store.set(data, (e) => e ? reject(e) : resolve(true));
  })
}

function handleError (res) {
  if (!res.ok) {
    throw res
  }
  return res.json()
}

const getTwitterToken = (key, secret) => {
  const credentials = Buffer.from(
    encodeURI(key) + ':' + encodeURI(secret)
  ).toString('base64');

  return fetch(
    'https://api.twitter.com/oauth2/token',
    {
      body: 'grant_type=client_credentials',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength('grant_type=client_credentials')
      },
      method: 'POST'
    }
  )
    .then(handleError)
    .then(data => data.access_token);
}

/**
 * make request to Twitter API
 * only GET is allowed
 *
 * @function twitterRequest
 * @param  {string} path
 * @return {Promise}
 */
const twitterRequest = (path, token) => {
  return fetch(
    `https://api.twitter.com${path}`,
    {headers: {'Authorization': `Bearer ${token}`}}
  )
    .then(handleError);
}

module.exports = Webtask.fromExpress(app);
