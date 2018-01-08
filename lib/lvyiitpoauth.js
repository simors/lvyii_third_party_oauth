/**
 * Created by yangyang on 2018/1/6.
 */
'use strict';

var connect = require('connect');
var bodyParser = require('body-parser');
var https = require('https');
var timeout = require('connect-timeout');
var _ = require('underscore');
var querystring = require('querystring')

var LYOAUTH = require('./init')
var frameworks = require('./frameworks');
var wechatUtil = require('./wechatUtil')

var NODE_ENV = process.env.NODE_ENV || 'development';

LYOAUTH.express = function (options) {
  return frameworks(createRootRouter(options), 'express')
}

function createRootRouter(options) {
  var router = connect();
  
  ['1'].forEach(function(apiVersion) {
    var thirdParty = LYOAUTH._config.thirdParty
    thirdParty.forEach(function (tp) {
      router.use('/' + apiVersion + '/' + tp.channel + '/oauth/', createOAuthFounctionRouter(tp, options));
      router.use('/' + apiVersion + '/' + tp.channel + '/userinfo/', createUserInfoFunctionRouter(tp, options));
    });
  });
  
  return router;
}

function createOAuthFounctionRouter(thirdParty, options) {
  options = options || {};
  
  var oauthFunctions = connect();
  
  oauthFunctions.use(timeout(options.timeout || '15s'));
  oauthFunctions.use(bodyParser.urlencoded({extended: false, limit: '20mb'}));
  oauthFunctions.use(bodyParser.json({limit: '20mb'}));
  oauthFunctions.use(bodyParser.text({limit: '20mb'}));
  
  oauthFunctions.use(function (req, res, next) {
    if (thirdParty.channel === 'wechat') {
      var code = req.query.code
      var state = req.query.state
      
      wechatUtil.getWechatAccessToken(LYOAUTH._channelOAuth.wechatOAuthClient, code).then((result) => {
        var authData = {
          "openid": result.data.openid,
          "unionid": result.data.unionid,
          "access_token": result.data.access_token,
          "expires_in": result.data.expires_in,
        }
        console.log('get authData', authData)
        var pos = LYOAUTH._config.thirdParty.findIndex((tpCfg) => tpCfg.channel === 'wechat')
        if (pos < 0) {
          throw new Error('wechat channel not exist')
        }
        var redirectUrl = LYOAUTH._config.thirdParty[pos].serverUrl + '?state=' + state + '&&' + querystring.stringify(authData)
        console.log('begin to redirect to ', redirectUrl)
        res.redirect(redirectUrl)
      }).catch(err => {
        responseException(res, req.url, err)
      })
    }
  })
  
  oauthFunctions.use(function(err, req, res, next) { // jshint ignore:line
    if(req.timeout) {
      console.error(`LvyiiOAuth: ${req.originalUrl}: function timeout (${err.timeout}ms)`);
      err.code = 124;
      err.message = 'The request timed out on the server.';
    }
    responseError(res, err);
  });
  
  return oauthFunctions
}

function createUserInfoFunctionRouter(thirdParty, options) {
  options = options || {};
  
  var userInfoFunctions = connect();
  
  userInfoFunctions.use(timeout(options.timeout || '15s'));
  userInfoFunctions.use(bodyParser.urlencoded({extended: false, limit: '20mb'}));
  userInfoFunctions.use(bodyParser.json({limit: '20mb'}));
  userInfoFunctions.use(bodyParser.text({limit: '20mb'}));
  
  userInfoFunctions.use(function (req, res, next) {
    if (thirdParty.channel === 'wechat') {
      var openid = req.query.openid
      
      wechatUtil.getWechatUserInfo(LYOAUTH._channelOAuth.wechatOAuthClient, openid).then((result) => {
        responseJson(res, result)
      }).catch(err => {
        responseException(res, req.url, err)
      })
    }
  })
  
  userInfoFunctions.use(function(err, req, res, next) { // jshint ignore:line
    if(req.timeout) {
      console.error(`LvyiiOAuth: ${req.originalUrl}: function timeout (${err.timeout}ms)`);
      err.code = 124;
      err.message = 'The request timed out on the server.';
    }
    responseError(res, err);
  });
  
  return userInfoFunctions
}

function responseJson(res, data) {
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.statusCode = 200;
  return res.end(JSON.stringify(data));
}

function responseError(res, err) {
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.statusCode = err.status || err.statusCode || 400;
  res.end(JSON.stringify({
    code: err.code || 1,
    error: err && (err.message || err.responseText || err) || 'null message'
  }));
}

function responseException(res, url, err) {
  var statusCode;
  
  if (err instanceof Error) {
    statusCode = err.status || err.statusCode || 500;
  } else {
    statusCode = 400;
  }
  
  if (statusCode === 500) {
    console.warn(`LvyiiAuth: ${url}: ${statusCode}: ${err.name}: ${err.message}`);
  }
  
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.statusCode = statusCode;
    
    res.end(JSON.stringify({
      code: err.code || 1,
      error: err.message || err.responseText || err || 'unknown error'
    }));
  }
}

module.exports = LYOAUTH;