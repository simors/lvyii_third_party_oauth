/**
 * Created by yangyang on 2018/1/6.
 */
var Promise = require('bluebird');

function getWechatAccessToken(wechatClient, code) {
  return new Promise(function (resolve, reject) {
    wechatClient.getAccessToken(code, function (err, result) {
      if(err) {
        reject(new Error('获取微信授权access_token失败: ' + err))
      } else {
        resolve(result)
      }
    })
  })
}

function getWechatUserInfo(wechatClient, openid) {
  return new Promise(function (resolve, reject) {
    wechatClient.getUser({openid: openid, lang: 'zh_CN'}, function (err, result) {
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