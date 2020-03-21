# jadepool-sdk-nodejs

## Installing

Using npm:

```bash
npm install @jadepool/sdk
```

## Use cli

```bash
# show help of cli, all commands can be seen
bin/cli -h

# create new keypairs
bin/cli.js keypairs

# create new address
bin/cli.js address-new {coinId}

# withdraw
bin/cli.js withdraw {coinId} {to} {value} {sequence} [-m MEMO] [-d EXTRADATA]

# audit
bin/cli.js audit {coinId} {auditTime}
```

## Example

```js
  const sdk = require('@jadepool/sdk')

  const config = {
    eccKey: 'ad70927341c3ccd4c745e51db0c00ce23edc667cfc71e990a584e9e951c39297', // ecc private key for signing request to Jadepool
    eccKeyEncoder: 'hex', // ecc private key encoding scheme
    authKey: 'rXCSc0HDzNTHReUdsMAM4j7cZnz8cemQpYTp6VHDkpc=', // private key for authorizing coin and withdrawal
    authKeyEncoder: 'base64', //  authKey encoding scheme
    httpEndpoint: 'http://localhost:7001', // Jadepool url
    appId: 'test' // app id for ecc key (set on Jadepool Admin)
  }
  const api = new sdk.Api(config)

  // get a new address
  let address = await api.newAddress('BTC')
  // sample result
  // mw68mDxhRXnd7jPEuJYgRzdCL7gMHXMuwh

  // verify if an address is valid
  let valid = await api.verifyAddress('BTC', address)
  // sample result
  // true/false

  // request a withdrawal
  let withdrawOrder = await api.withdraw({
    coinId: 'BTC',
    to: 'mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS',
    value: '0.1',
    sequence: 0
  })
  // sample result
  // {
  //   "data":{},
  //   "id":"9",
  //   "state":"init",
  //   "bizType":"WITHDRAW",
  //   "type":"BTC",
  //   "coinType":"BTC",
  //   "to":"mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS",
  //   "value":"0.1",
  //   "confirmations":0,
  //   "create_at":1544707163423,
  //   "update_at":1544707163425,
  //   "from":"n3xp63A34wjQUSrX4MzsatudEsXwqNzZAK",
  //   "fee":"0",
  //   "hash":"",
  //   "extraData":"",
  //   "memo":"",
  //   "sendAgain":false,
  //   "namespace":"BTC",
  //   "sid":"950woxrDo8VFmbNVAAAB"
  // }

  // request an audit
  let auditOrder = await api.audit('BTC', 1544601373000)
  // sample result
  // {
  //   "type":"BTC",
  //   "current":{
  //   "id":"5c132721f6372352b66dc209",
  //     "type":"BTC",
  //     "blocknumber":1447738,
  //     "timestamp":1544759061000
  // },
  //   "last":{
  //   "id":"5c10c052f6372352b66dbe67",
  //     "type":"BTC",
  //     "blocknumber":1447483,
  //     "timestamp":1544601373000
  // },
  //   "namespace":"BTC",
  //   "sid":"xKQtVnc1pthQWT1KAAAB"
  // }

  // query a Jadepool order
  let order = await api.getOrder('5')
  // sample result
  // {
  //   "id":"5",
  //   "state":"done",
  //   "bizType":"WITHDRAW",
  //   "type":"BTC",
  //   "coinType":"BTC",
  //   "to":"mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS",
  //   "value":"0.01",
  //   "confirmations":256,
  //   "create_at":1544601309157,
  //   "update_at":1544604050322,
  //   "from":"mi2uS5bi91zxK9XgRMVgSiZEuV41GgFn4o",
  //   "fee":"0.00008591",
  //   "data":{
  //   "timestampBegin":1544601320090,
  //     "timestampFinish":1544604050300,
  //     "timestampHandle":1544601319905,
  //     "type":"Bitcoin",
  //     "hash":"e7a3205b74b9c881c61958cee1713df58476ec0a2e22a2a8cc2fc37b672518dd",
  //     "fee":0.00008591,
  //     "blockNumber":1447484,
  //     "blockHash":"000000000000011704dc2eff55c97d28b3874ec5ed1ad8d717c3ef932a593c85",
  //     "confirmations":256,
  //     "from":[
  //     {
  //       "address":"mi2uS5bi91zxK9XgRMVgSiZEuV41GgFn4o",
  //       "value":"0.05971344",
  //       "txid":"11c5abbdd7879e7133da69d71f6aea9008b7c0f14ec66181f48874a8f14f0719",
  //       "n":1
  //     }
  //   ],
  //     "to":[
  //     {
  //       "address":"mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS",
  //       "value":"0.01000000",
  //       "txid":"",
  //       "n":0
  //     },
  //     {
  //       "address":"mi2uS5bi91zxK9XgRMVgSiZEuV41GgFn4o",
  //       "value":"0.04962753",
  //       "txid":"98019dab2735a91d43be20b3a384424428b783fe60de11ddccbec7353a2cc1f0",
  //       "n":1
  //     }
  //   ],
  //     "state":"done"
  // },
  //   "hash":"e7a3205b74b9c881c61958cee1713df58476ec0a2e22a2a8cc2fc37b672518dd",
  //   "extraData":"",
  //   "memo":"",
  //   "sendAgain":false,
  //   "namespace":"BTC",
  //   "sid":"xKQtVnc1pthQWT1KAAAB"
  // }

  // query a Jadepool audit order
  let audit = await api.getAudit('5c10c052f6372352b66dbe67')
  // sample result
  // {
  //   "calculated":false,
  //   "deposit_total":"0",
  //   "deposit_num":0,
  //   "withdraw_total":"0",
  //   "withdraw_num":0,
  //   "sweep_total":"0",
  //   "sweep_num":0,
  //   "sweep_internal_total":"0",
  //   "sweep_internal_num":0,
  //   "airdrop_total":"0",
  //   "airdrop_num":0,
  //   "recharge_total":"0",
  //   "recharge_num":0,
  //   "recharge_internal_total":"0",
  //   "recharge_internal_num":0,
  //   "recharge_unknown_total":"0",
  //   "recharge_unknown_num":0,
  //   "recharge_special_total":"0",
  //   "recharge_special_num":0,
  //   "fee_type":"ETH",
  //   "fee_total":"0",
  //   "sweep_fee":"0",
  //   "sweep_internal_fee":"0",
  //   "internal_fee":"0",
  //   "internal_num":0,
  //   "extend_fee_total":"0",
  //   "extend_sweep_fee_total":"0",
  //   "extend_sweep_internal_fee_total":"0",
  //   "extend_internal_fee_total":"0",
  //   "failed_fee_withdraw":"0",
  //   "failed_withdraw_num":0,
  //   "failed_sweep_fee":"0",
  //   "failed_sweep_num":0,
  //   "failed_sweep_internal_fee":"0",
  //   "failed_sweep_internal_num":0,
  //   "failed_fee_internal":"0",
  //   "failed_internal_num":0,
  //   "extend_failed_fee_withdraw":"0",
  //   "extend_failed_sweep_fee":"0",
  //   "extend_failed_sweep_internal_fee":"0",
  //   "extend_failed_fee_internal":"0",
  //   "type":"BTC",
  //   "timestamp":1544601373000,
  //   "blocknumber":1447483,
  //   "create_at":"2018-12-12T08:01:22.109Z",
  //   "update_at":"2018-12-12T08:01:22.109Z",
  //   "__v":0,
  //   "id":"5c10c052f6372352b66dbe67"
  // }

  // get a token balance
  let balance = await api.getBalance('BTC')
  // sample result
  // {
  //   "balance":"0.01876565",
  //   "balanceAvailable":"0.01876565",
  //   "balanceUnavailable":"0"
  // }

  // authorize coin
  let authToken = await api.authCoin('BTC', 'BTC', 'BTC', 'BTC', 8)
  // sample result
  // true

```

## License

MIT
