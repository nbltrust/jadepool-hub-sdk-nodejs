const Api = require('../src/api')

const test = async () => {
  const config = {
    eccKey: 'rXCSc0HDzNTHReUdsMAM4j7cZnz8cemQpYTp6VHDkpc=',
    eccKeyEncoder: 'base64',
    authKey: 'rXCSc0HDzNTHReUdsMAM4j7cZnz8cemQpYTp6VHDkpc=',
    authKeyEncoder: 'base64',
    httpEndpoint: 'http://127.0.0.1:7001',
    appId: 'test'
  }
  const api = new Api(config)

  let address = await api.newAddress('BTC')
  console.log(address)

  let valid = await api.verifyAddress('BTC', address)
  console.log(valid)

  let withdrawOrder = await api.withdraw(7, 'BTC', '0.1', 'mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS')
  console.log(JSON.stringify(withdrawOrder))

  let auditOrder = await api.audit('BTC', 1544759061000)
  console.log(JSON.stringify(auditOrder))

  let order = await api.getOrder(withdrawOrder.id)
  console.log(JSON.stringify(order))

  let audit = await api.getAudit(auditOrder.current.id)
  console.log(JSON.stringify(audit))

  let balance = await api.getBalance('BTC')
  console.log(JSON.stringify(balance))

  let authToken = await api.authCoin('BTC', 'BTC', 'BTC', 'BTC', 8)
  console.log(authToken)
}

test()
