/**
 * Created by yangyang on 2018/1/6.
 */
var redis = require('redis');
var Promise = require('bluebird');

const WECHAT_PREFIX = 'wechatToken:'

const getWechatOauthToken = function(LYOAUTH) {
  return function (openId, callback) {
    Promise.promisifyAll(redis.RedisClient.prototype)
    var redisCfg = LYOAUTH._config.mediaCfg
    var client = redis.createClient(redisCfg.redis_port, redisCfg.redis_url)
    client.auth(redisCfg.redis_auth)
    client.select(redisCfg.redis_db)
    // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
    // 主从切换等原因造成短暂不可用导致应用进程退出。
    client.on('error', function (err) {
      return callback(err)
    })
  
    client.getAsync(WECHAT_PREFIX + openId).then((token) => {
      callback(null, JSON.parse(token))
    }).catch(err => {
      callback(err)
    }).finally(() => {
      client.quit()
    })
  }
}

const setWechatOauthToken = function(LYOAUTH) {
  return function (openId, token, callback) {
    Promise.promisifyAll(redis.RedisClient.prototype)
    var redisCfg = LYOAUTH._config.mediaCfg
    var client = redis.createClient(redisCfg.redis_port, redisCfg.redis_url)
    client.auth(redisCfg.redis_auth)
    client.select(redisCfg.redis_db)
    // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
    // 主从切换等原因造成短暂不可用导致应用进程退出。
    client.on('error', function (err) {
      return callback(err)
    })
  
    client.setAsync(WECHAT_PREFIX + openId, JSON.stringify(token)).then(() => {
      callback()
    }).catch(err => {
      callback(err)
    }).finally(() => {
      client.quit()
    })
  }
}

const tokenStorage = {
  getWechatOauthToken: getWechatOauthToken,
  setWechatOauthToken: setWechatOauthToken
}

module.exports = tokenStorage