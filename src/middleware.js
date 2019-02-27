const { ecc } = require('@jadepool/crypto')

/**
 * 创建中间件，需传入瑶池提供的公钥信息
 * 该中间件将在 req对象中添加字段 req.msgValid: boolean，即告知瑶池通知是否验证通过
 * @param {object} opts
 * @param {string|Buffer} opts.verifyKey
 * @param {'hex'|'base64'} opts.verifyKeyEncoder
 */
module.exports = function (opts) {
  let pubKey
  if (Buffer.isBuffer(opts.verifyKey)) {
    pubKey = opts.verifyKey
  } else if (typeof opts.verifyKey === 'string' && (opts.verifyKeyEncoder === 'hex' || opts.verifyKeyEncoder === 'base64')) {
    pubKey = Buffer.from(opts.verifyKey, opts.verifyKeyEncoder)
  } else {
    throw new Error('missing public key')
  }
  return function (req, res, next) {
    if (req.method.toLowerCase() === 'get') {
      return next()
    }
    const jpData = req.body
    let valid
    if (!jpData || !jpData.result) {
      valid = false
    } else {
      try {
        let objToVerify = Object.assign({ timestamp: jpData.timestamp }, jpData.result)
        valid = ecc.verify(objToVerify, jpData.sig, pubKey)
      } catch (err) {
        valid = false
      }
    }
    // 设置并继续
    req.msgValid = valid
    next()
  }
}
