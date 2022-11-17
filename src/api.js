const _ = require('lodash')
const axios = require('axios').default
const { ecc } = require('@jadepool/crypto')
const isHex = require('is-hex')
const isBase64 = require('is-base64')
const authBuilder = require('./authBuilder')

class Api {
  /**
   * 初始化
   */
  constructor (config) {
    const authKeyExist = !_.isNil(config.authKey)
    const authKeyEncoderExist = !_.isNil(config.authKeyEncoder)
    if (_.isNil(config) ||
      _.isNil(config.eccKey) ||
      _.isNil(config.httpEndpoint) ||
      _.isNil(config.appId) ||
      _.isNil(config.eccKeyEncoder) ||
      (authKeyExist && !authKeyEncoderExist)) {
      throw new Error('initialization failed, missing parameter...')
    }
    const encoder = ['hex', 'base64']
    if (!encoder.includes(config.eccKeyEncoder) || (authKeyExist && !encoder.includes(config.authKeyEncoder))) {
      throw new Error('Only hex and base64 encoding schemes are supported...')
    }
    const isEccKeyValid = config.eccKeyEncoder === 'hex' ? isHex(config.eccKey) : isBase64(config.eccKey)
    const isAuthKeyValid = authKeyExist ? (config.authKeyEncoder === 'hex' ? isHex(config.authKey) : isBase64(config.authKey)) : true
    if (!isEccKeyValid || !isAuthKeyValid) {
      throw new Error('Invalid key format...')
    }

    this.appId = config.appId
    this.httpEndpoint = config.httpEndpoint
    // 定义Buffer
    Object.defineProperty(this, '_eccKey', { value: Buffer.from(config.eccKey, config.eccKeyEncoder) })
    if (authKeyExist) {
      Object.defineProperty(this, '_authKey', { value: Buffer.from(config.authKey, config.authKeyEncoder) })
    }
  }
  /**
   * @returns {Buffer}
   */
  get eccKey () { return this._eccKey }
  /**
   * @returns {Buffer}
   */
  get authKey () { return this._authKey }

  /**
   * 发起提现
   */
  async withdraw ({ coinId, value, to, sequence, memo, extraData }) {
    let obj = { type: coinId, value, to }
    if (_.isNumber(sequence)) obj.sequence = sequence
    if (_.isString(memo)) obj.memo = memo
    if (_.isString(extraData)) obj.extraData = extraData
    // HSM mode required
    if (!_.isNil(this.authKey)) {
      obj.auth = authBuilder.buildWithdraw(this.authKey, { sequence, coinId, value, to, memo })
    }
    let response = await this._post('/api/v1/transactions', obj)
    return response.result
  }

  async sWithdraw ({ wallet, coinId, value, to, sequence, memo, extraData }) {
    let obj = { value, to }
    if (_.isNumber(sequence)) obj.sequence = sequence
    if (_.isString(memo)) obj.memo = memo
    if (_.isString(extraData)) obj.extraData = extraData
    // HSM mode required
    if (!_.isNil(this.authKey)) {
      obj.auth = authBuilder.buildWithdraw(this.authKey, { sequence, coinId, value, to, memo })
    }
    let response = await this._post(`/api/v2/s/wallets/${wallet}/tokens/${coinId}/withdraw`, obj)
    return response.result
  }

  async sRefund ({ wallet, orderId, to, value }) {
    if (!(_.isString(wallet) && _.isString(orderId) && _.isString(to))) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let obj = { to, 'passed': false }
    if (_.isString(value)) obj.value = value
    let response = await this._post(`/api/v2/s/wallets/${wallet}/orders/${orderId}/refund`, obj)
    return response.result
  }

  /**
   * 生成新充值地址
   */
  async newAddress (coinId, mode) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/address/${coinId}/new`, {
      mode
    })
    return _.get(response, 'result.address')
  }

  /**
   * 验证地址有效性
   */
  async verifyAddress (coinId, address) {
    if (!(_.isString(coinId) && _.isString(address))) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v1/addresses/${address}/verify`, {
      type: coinId
    })
    return _.get(response, 'result.valid')
  }

  /**
   * 发起审计
   */
  async audit (coinId, auditTime) {
    if (!(_.isString(coinId) && _.isNumber(auditTime))) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post('/api/v1/audits', {
      type: coinId,
      audittime: auditTime
    })
    return response.result
  }

  async bizflowPass (wallet, orderId) {
    let response = await this._patch(`/api/v2/s/wallets/${wallet}/orders/${orderId}/bizflow`, {
      'passed': true
    })
    let result = response.result
    return result
  }

  /**
   * 查询瑶池订单详情
   */
  async getOrder (orderId) {
    if (!(_.isString(orderId) || _.isNumber(orderId))) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._get(`/api/v1/transactions/${orderId}`)
    return response.result
  }

  /**
   * 查询审计订单详情
   */
  async getAudit (auditId) {
    if (!_.isString(auditId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._get(`/api/v1/audits/${auditId}`)
    return response.result
  }

  /**
   * 查询余额
   */
  async getBalance (coinId) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._get(`/api/v1/wallet/${coinId}/status`)
    let result = response.result
    return {
      balance: result.balance,
      balanceAvailable: result.balanceAvailable,
      balanceUnavailable: result.balanceUnavailable,
      balancePending: result.balancePending
    }
  }

  async sNewAddress (coinId, mode, walletID) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/s/wallets/${walletID}/address/${coinId}/new`, {
      mode
    })
    return _.get(response, 'result.address')
  }

  /**
   * 授权币种
   */
  async authCoin (coinId, coinType, chain, token, decimal, contract = undefined) {
    if (_.isNil(this.authKey)) {
      throw new Error('missing auth key, unable to authorize coin...')
    } else {
      await this._patch(`/api/v1/wallet/${coinId}/token`, {
        authToken: authBuilder.buildCoin(this.authKey, { coinId, coinType, chain, token, contract, decimal })
      })
      return true
    }
  }

  async register (coinId, wallet, investorID, sequence) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/s/wallets/${wallet}/ds/${coinId}/register`, {
      investorID,
      sequence
    })
    let result = response.result
    return result
  }

  async regInfo (coinId, wallet) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._get(`/api/v2/s/wallets/${wallet}/ds/${coinId}/reg_info`)
    let result = response.result
    return result
  }

  async transferCheck (coinId, wallet, to, value) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/s/wallets/${wallet}/ds/${coinId}/transfer_check`, {
      to,
      value
    })
    let result = response.result
    return result
  }

  async addAddress (coinId, wallet, address, sequence) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/s/wallets/${wallet}/ds/${coinId}/add_address`, {
      address,
      sequence
    })
    let result = response.result
    return result
  }

  async removeAddress (coinId, wallet, address, sequence) {
    if (!_.isString(coinId)) {
      throw new Error('missing required parameter or parameter type mismatch...')
    }
    let response = await this._post(`/api/v2/s/wallets/${wallet}/ds/${coinId}/remove_address`, {
      address,
      sequence
    })
    let result = response.result
    return result
  }

  // 内部Http调用的方法
  async _request (url, method, data) {
    // 构建签名
    data = data || {}
    const sig = ecc.sign(data, this.eccKey, { accept: 'string' })
    let params = {
      data: data,
      appid: this.appId,
      timestamp: sig.timestamp,
      sig: encodeURIComponent(sig.signature)
    }
    // 发送请求
    let res
    let error
    try {
      let axiosParams = { baseURL: this.httpEndpoint, url, method }
      if (method === 'get') {
        axiosParams.params = params
      } else {
        axiosParams.data = params
      }
      res = (await axios(axiosParams)).data
    } catch (err) {
      if (err.response) {
        res = err.response.data
      } else {
        error = err.message
      }
    }
    console.log(res)
    const resultCode = res.code || res.status || 0
    if (!error && resultCode !== 0) {
      error = `code=${resultCode},msg=${res.message},result=${JSON.stringify(res.result)}`
    }
    if (error) {
      throw new Error(error)
    }
    return res
  }
  async _get (url, data) { return this._request(url, 'get', data) }
  async _post (url, data) { return this._request(url, 'post', data) }
  async _patch (url, data) { return this._request(url, 'patch', data) }
}

Api.default = Api

module.exports = Api
