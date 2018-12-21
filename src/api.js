const _ = require('lodash')
const sha256 = require('js-sha256')
const secp256k1 = require('secp256k1')
const axios = require('axios')
const crypto = require('@jadepool/crypto')
const isHex = require('is-hex')
const isBase64 = require('is-base64')
const version = 1
const algorithmId = 33

class Api {
  /**
   * 初始化
   * eccKey：和瑶池通信ECC私钥
   * authKey：为密码机验签的交易签名私钥，选填
   * httpEndpoint：瑶池URL
   * appId：ECC私钥对应的appId(admin上设置)
   * @param config
   */
  constructor(config) {
    const authKeyExist = !_.isNil(config.authKey)
    const authKeyEncoderExist = !_.isNil(config.authKeyEncoder)
    if(_.isNil(config) ||
      _.isNil(config.eccKey) ||
      _.isNil(config.httpEndpoint) ||
      _.isNil(config.appId) ||
      _.isNil(config.eccKeyEncoder) ||
      (authKeyExist && !authKeyEncoderExist)) {
      throw new Error('initialization failed, missing parameter...')
    }
    const encoder = ['hex', 'base64']
    if (!encoder.includes(config.eccKeyEncoder) || (authKeyExist && !encoder.includes(config.authKeyEncoder))){
      throw new Error('Only hex and base64 encoding schemes are supported...')
    }
    const isEccKeyValid = config.eccKeyEncoder === 'hex' ? isHex(config.eccKey) : isBase64(config.eccKey)
    const isAuthKeyValid = authKeyExist ? (config.authKeyEncoder === 'hex' ? isHex(config.authKey) : isBase64(config.authKey)): true
    if (!isEccKeyValid || !isAuthKeyValid) {
      throw new Error('Invalid key format...')
    }

    this.appId = config.appId
    this.eccKey = config.eccKey
    this.eccKeyEncoder = config.eccKeyEncoder
    this.authKey = config.authKey
    this.authKeyEncoder = config.authKeyEncoder
    this.httpEndpoint = config.httpEndpoint
  }

  /**
   * 发起提现
   * @param sequence：提现唯一序列号
   * @param coinType：币种
   * @param value：金额
   * @param to：目标地址
   * @param memo：交易备注（EOS或CYB使用），可选填
   * @param extraData：提现备注，暂时没有用到，可选填
   * @returns Object：瑶池生成的提现订单
   */
  async withdraw(sequence, coinType, value, to, memo = undefined, extraData = undefined) {
    let obj = {
      sequence: sequence,
      type: coinType,
      value: value,
      to: to,
      memo: memo,
      extraData: extraData
    }
    if(!_.isNil(this.authKey)) {
      let arr = [
        {val: coinType, required: true},
        {val: to, required: true},
        {val: value, required: true},
        {val: memo, required: false}
      ]

      let bufferArr = []

      let versionBuffer = new Buffer(2)
      versionBuffer.writeInt16LE(version)

      let algorithmIdBuffer = new Buffer(1)
      algorithmIdBuffer.writeInt8(algorithmId)

      if (_.isNil(sequence) || typeof sequence !== 'number') {
        throw new Error('missing required parameter or parameter type mismatch...')
      }
      const big = ~~(sequence / 0x0100000000)
      const low = (sequence % 0x0100000000)
      let sequenceBuffer = new Buffer(8)
      sequenceBuffer.writeUInt32LE(low, 0)
      sequenceBuffer.writeUInt32LE(big, 4)

      bufferArr.push(versionBuffer)
      bufferArr.push(algorithmIdBuffer)
      bufferArr.push(sequenceBuffer)

      for (let i = 0; i < arr.length; i++) {
        let arg = arr[i]
        if (arg.required === true && _.isNil(arg.val)) {
          throw new Error('missing required parameter...')
        }
        if (!_.isNil(arg.val) && typeof arg.val !== 'string') {
          throw new Error('parameter type mismatch...')
        }
        let argBuffer
        let argLengthBuffer = new Buffer(2)
        if (_.isNil(arg.val)) {
          argLengthBuffer.writeInt16LE(0)
          bufferArr.push(argLengthBuffer)
        } else {
          argBuffer = Buffer.from(arg.val, 'ascii')
          argLengthBuffer.writeInt16LE(argBuffer.length)
          bufferArr.push(argLengthBuffer)
          bufferArr.push(argBuffer)
        }
      }

      let bufferConcat = Buffer.concat(bufferArr)

      let bufferConcatSha256 = sha256(bufferConcat)

      const sigObj = secp256k1.sign(Buffer.from(bufferConcatSha256, 'hex'), Buffer.from(this.authKey, this.authKeyEncoder))

      let signatureBuffer = sigObj.signature
      let signatureLengthBuffer = new Buffer(2)
      signatureLengthBuffer.writeInt16LE(signatureBuffer.length)

      let resultBuffer = Buffer.concat([bufferConcat, signatureLengthBuffer, signatureBuffer])
      let withdrawAuth = resultBuffer.toString('hex')
      obj.auth = withdrawAuth
    }
    const sig = crypto.ecc.sign(obj, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let params = {
      timestamp: sig.timestamp,
      data: obj,
      sig: sig.signature,
      appid: this.appId,
      crypto: 'ecc'
    }
    let response = await post(this.httpEndpoint + '/api/v1/transactions', params)
    return response.result
  }

  /**
   * 生成新充值地址
   * @param coinType：充值地址币种类型
   * @returns String: 地址
   */
  async newAddress(coinType) {
    if(_.isNil(coinType) || typeof coinType !== 'string') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const obj = {
      type: coinType
    }
    const sig = crypto.ecc.sign(obj, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let params = {
      timestamp: sig.timestamp,
      data: obj,
      sig: sig.signature,
      appid: this.appId,
      crypto: 'ecc'
    }
    let response = await post(this.httpEndpoint + '/api/v1/addresses/new', params)
    return _.get(response, 'result.address')
  }

  /**
   * 验证地址有效性
   * @param coinType：地址币种类型
   * @param address：地址
   * @returns Boolean
   */
  async verifyAddress(coinType, address) {
    if(_.isNil(coinType) || _.isNil(address) || typeof coinType !== 'string' || typeof address !== 'string') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const obj = {
      type: coinType
    }
    const sig = crypto.ecc.sign(obj, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let params = {
      timestamp: sig.timestamp,
      data: obj,
      sig: sig.signature,
      appid: this.appId,
      crypto: 'ecc'
    }
    let response = await post(this.httpEndpoint + `/api/v1/addresses/${address}/verify`, params)
    return _.get(response, 'result.valid')
  }

  /**
   * 发起审计
   * @param coinType：审计币种类型
   * @param auditTime：审计时间
   * @returns Object: 瑶池生成的审计订单
   */
  async audit(coinType, auditTime) {
    if(_.isNil(coinType) || _.isNil(auditTime) || typeof coinType !== 'string' || typeof auditTime !== 'number') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const obj = {
      type: coinType,
      audittime: auditTime
    }
    const sig = crypto.ecc.sign(obj, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let params = {
      timestamp: sig.timestamp,
      data: obj,
      sig: sig.signature,
      appid: this.appId,
      crypto: 'ecc'
    }
    let response = await post(this.httpEndpoint + '/api/v1/audits', params)
    return response.result
  }

  /**
   * 查询瑶池订单详情
   * @param orderId：订单ID
   * @returns Object: 订单详情
   */
  async getOrder(orderId) {
    if(_.isNil(orderId) || typeof orderId !== 'string') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const sig = crypto.ecc.sign({}, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let response = await get(this.httpEndpoint + `/api/v1/transactions/${orderId}?crypto=ecc&appid=${this.appId}&timestamp=${sig.timestamp}&sig=${encodeURIComponent(sig.signature)}`)
    return response.result
  }

  /**
   * 查询审计订单详情
   * @param auditId：审计订单ID
   * @returns Object: 审计订单详情
   */
  async getAudit(auditId) {
    if(_.isNil(auditId) || typeof auditId !== 'string') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const sig = crypto.ecc.sign({}, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let response = await get(this.httpEndpoint + `/api/v1/audits/${auditId}?crypto=ecc&appid=${this.appId}&timestamp=${sig.timestamp}&sig=${encodeURIComponent(sig.signature)}`)
    return response.result
  }

  /**
   * 查询余额
   * @param coinType：币种
   * @returns {Object: {balance: 总余额, balanceAvailable: 可用余额, balanceUnavailable: 不可用余额}}
   */
  async getBalance(coinType) {
    if(_.isNil(coinType) || typeof coinType !== 'string') {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    const sig = crypto.ecc.sign({}, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
    let response = await get(this.httpEndpoint + `/api/v1/wallet/${coinType}/status?crypto=ecc&appid=${this.appId}&timestamp=${sig.timestamp}&sig=${encodeURIComponent(sig.signature)}`)
    let result = response.result
    return {'balance': result.balance,'balanceAvailable': result.balanceAvailable,'balanceUnavailable': result.balanceUnavailable}
  }

  /**
   * 授权币种
   * @param coinId：币种唯一代号，避免重名
   * @param coinType：代币类型
   * @param chain：链名
   * @param token：代币名
   * @param contract：智能合约地址
   * @param decimal：精度
   * @returns authToken
   */
  async authCoin(coinId, coinType, chain, token, contract = undefined, decimal) {
    if (_.isNil(this.authKey)){
      throw new Error('missing auth key, unable to authorize coin...')
    } else {
      let arr = [
        {val: coinId, required: true},
        {val: coinType, required: true},
        {val: chain, required: true},
        {val: token, required: true},
        {val: contract, required: false},
        {val: decimal, required: true}
      ]

      let bufferArr = []

      let versionBuffer = new Buffer(2)
      versionBuffer.writeInt16LE(version)

      let algorithmIdBuffer = new Buffer(1)
      algorithmIdBuffer.writeInt8(algorithmId)

      bufferArr.push(versionBuffer)
      bufferArr.push(algorithmIdBuffer)

      for (let i = 0; i < arr.length; i++) {
        let arg = arr[i]
        if (arg.required === true && _.isNil(arg.val)) {
          throw new Error('missing required parameter...')
        }
        if (!_.isNil(arg.val) && typeof arg.val !== 'string') {
          throw new Error('parameter type mismatch...')
        }
        let argBuffer
        let argLengthBuffer = new Buffer(2)
        if (_.isNil(arg.val)) {
          argLengthBuffer.writeInt16LE(0)
          bufferArr.push(argLengthBuffer)
        } else {
          argBuffer = Buffer.from(arg.val, 'ascii')
          argLengthBuffer.writeInt16LE(argBuffer.length)
          bufferArr.push(argLengthBuffer)
          bufferArr.push(argBuffer)
        }
      }

      let bufferConcat = Buffer.concat(bufferArr)
      let bufferConcatSha256 = sha256(bufferConcat)
      const sigObj = secp256k1.sign(Buffer.from(bufferConcatSha256, 'hex'), Buffer.from('ad70927341c3ccd4c745e51db0c00ce23edc667cfc71e990a584e9e951c39297', 'hex'))
      let signatureBuffer = sigObj.signature
      let signatureLengthBuffer = new Buffer(2)
      signatureLengthBuffer.writeInt16LE(signatureBuffer.length)
      let resultBuffer = Buffer.concat([bufferConcat, signatureLengthBuffer, signatureBuffer])
      let auth = resultBuffer.toString('hex')

      let obj = {
        authToken: auth
      }
      const sig = crypto.ecc.sign(obj, Buffer.from(this.eccKey, this.eccKeyEncoder), {})
      let params = {
        timestamp: sig.timestamp,
        data: obj,
        sig: sig.signature,
        appid: this.appId,
        crypto: 'ecc'
      }
      let response = await patch(this.httpEndpoint + `/api/v1/wallet/${coinId}/token`, params)
      return _.get(response, 'result.jadepool')
    }
  }
}

const post = async (url, data) => {
  return (await axios.post(url, data)).data
}

const get = async (url) => {
  return (await axios.get(url)).data
}

const patch = async (url, data) => {
  return (await axios.patch(url, data)).data
}

module.exports = Api