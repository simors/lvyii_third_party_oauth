/**
 * Created by yangyang on 2018/1/6.
 */
'use strict';
var _ = require('underscore');
var wechatOAuth = require('wechat-oauth');
var tokenStorage = require('./tokenStorage')

var LYOAUTH = {}

LYOAUTH._config = {}
LYOAUTH._channelOAuth = {}

/**
 * media的配置目前只支持redis，所以mediaCfg也只支持redis。
 * thirdParty的配置必须是一个数组，其中数组元素的配置项包含如下内容
 * 1、channel    渠道名称，目前只支持wechat
 * 2、serverUrl  业务服务器地址，即通过次中间件获取到第三方认证信息后，需要转发的服务器地址
 * 3、appId      对应渠道的appId
 * 4、appSecret  对应渠道的Secret
 * @param options
 */
LYOAUTH.init = function init(options) {
  const {
    media,
    mediaCfg,
    thirdParty,
  } = options
  
  LYOAUTH._config.media = media
  LYOAUTH._config.mediaCfg = mediaCfg
  LYOAUTH._config.thirdParty = thirdParty
  
  var saveToken = undefined
  var getToken = undefined
  
  if (media !== 'redis') {
    throw new Error('unsupported media!')
  } else {
    saveToken = tokenStorage.setWechatOauthToken(LYOAUTH)
    getToken = tokenStorage.getWechatOauthToken(LYOAUTH)
  }
  
  if (!mediaCfg.redis_url || !mediaCfg.redis_port || !mediaCfg.redis_db || !mediaCfg.redis_auth) {
    throw new Error('init cfg for redis error!')
  }
  
  if (typeof mediaCfg !== "object") {
    throw new Error('mediaCfg must be an object')
  }
  
  if (!thirdParty instanceof Array) {
    throw new Error('thirdParty cfg must be an Array!')
  }
  
  thirdParty.forEach((tp) => {
    if (tp.channel === 'wechat') {
      var wechatOAuthClient = new wechatOAuth(tp.appId, tp.appSecret, getToken, saveToken);
      LYOAUTH._channelOAuth.wechatOAuthClient = wechatOAuthClient
    }
  })
}

module.exports = LYOAUTH