const assert = require('chai').assert
const authBuilder = require('../src/authBuilder')

describe('AuthBuilder', function () {
  const privKey = Buffer.from('ad70927341c3ccd4c745e51db0c00ce23edc667cfc71e990a584e9e951c39297', 'hex')

  it('will build withdraw auth', function () {
    const authStr = authBuilder.buildWithdraw(privKey, {
      sequence: 8888,
      coinId: 'BTC',
      to: 'mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS',
      value: '0.01',
      memo: null
    })
    assert.equal(authStr, '010021b822000000000000030042544322006d6732626659646669693247473133484b39346a5842595050435357526d536941530400302e303100004000c47489d97e4bca6c9bf8043e28b919f0edd9aa7881f5209304dc27cb4e1726343ac434a95151076447f94b873adb805b502d2976c807af28c1bf29ae71a80517')
  })

  it('will build coin auth', function () {
    const coinStr = authBuilder.buildCoin(privKey, {
      coinId: 'BTC',
      coinType: 'BTC',
      chain: 'BTC',
      token: 'BTC',
      contract: null,
      decimal: 8
    })
    assert.equal(coinStr, '010021030042544303004254430300425443030042544300000100384000379e63b6ead7243ec5dd34b0a620a1ca5ae8c9f9ada690b5af17a9e46e75522e24babd84acd585f16d512c55846e45507293886aa9645409dfa35fc1dfe601df')
  })
})
