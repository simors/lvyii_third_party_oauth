/**
 * Created by yangyang on 2018/1/6.
 */
var Promise = require('bluebird');
var LYOAUTH = require('./lvyiiotpoauth')

function getWechatAccessToken(code) {
  var client = LYOAUTH._channelOAuth.wechatOAuthClient
  if (!client) {
    throw new Error('wechat oauth client did not init')
  }
  return new Promise(function (resolve, reject) {
    client.getAccessToken(code, function (err, result) {
      if(err) {
        reject(new Error('获取微信授权access_token失败: ' + err))
      } else {
        resolve(result)
      }
    })
  })
}

function getWechatUserInfo(openid) {
  var client = LYOAUTH._channelOAuth.wechatOAuthClient
  if (!client) {
    throw new Error('wechat oauth client did not init')
  }
  return new Promise(function (resolve, reject) {
    client.getUser(openid, function (err, result) {
      if(err) {
        reject(new Error('获取微信用户信息失败: ' + err))
      } else {
        resolve(result)
      }
    })
  })
}

const wechatUtil = {
  getWechatAccessToken: getWechatAccessToken,
  getWechatUserInfo: getWechatUserInfo
}

module.exports = wechatUtil