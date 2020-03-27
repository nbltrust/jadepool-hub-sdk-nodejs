# Jadepool Hub NodeJS SDK 兼 Cli 工具

## 关于cli工具

`bin/cli`是用于调用Jadepool Hub API的便捷命令行工具。

### 上手指南

> 命令帮助

```bash
bin/cli -h
# usage: cli.js [-h] [-v] [-f CONFIGFILE]
#               {keypairs,address-new,address-verify,withdraw,audit,order-get,audit-get,balance}
#               ...
# Jadepool SDK cli

# Optional arguments:
#   -h, --help            Show this help message and exit.
#   -v, --version         Show program's version number and exit.
#   -f CONFIGFILE, --configfile CONFIGFILE
#                         path of the config file

# sub-commands:
#   call API or generateKeypairs

#   {keypairs,address-new,address-verify,withdraw,audit,order-get,audit-get,balance,auth-coin}
#     keypairs            create ecc key pairs
#     address-new         call Jadepool API: newAddress
#     address-verify      call Jadepool API: verifyAddress
#     withdraw            call Jadepool API: withdraw
#     audit               call Jadepool API: audit
#     order-get           call Jadepool API: getOrder
#     audit-get           call Jadepool API: getAudit
#     balance             call Jadepool API: getBalance
```

> 修改配置文件

连接 Jadepool Hub 需要配置该环境使用的 ecc 私钥，用于签名认证。
若不在 cli 命令中使用 `-f` 指定配置文件，将默认使用工程目录下的 `jpcli.config.json` 文件。

```json
{
  "eccKey": "7uK2lwGDIwopJdaduVr4maw1sPyjDB4J386gnQ01KXc=",
  "eccKeyEncoder": "base64",
  "httpEndpoint": "http://127.0.0.1:7001",
  "appId": "test"
}
```

> 配置参数说明

- eccKey 签名私钥
- eccKeyEncoder 私钥编码方式
- httpEndpoint Jadepool Hub API URL
- appId 签名对应的 AppId

### 命令详解

**注意：**下文中所有`{}字段`均表示该参数为变量，请根据实际情况传入参数。`[]`内为可选参数

> 创建公私钥对

```bash
# create new keypairs
bin/cli.js keypairs
```

> 创建新地址

```bash
# create new address
bin/cli.js address-new {coinId}
```

参数：

- coinId: 币种名称

> 验证地址

```bash
bin/cli.js address-verify {coinId} {address}
```

参数：

- coinId: 币种名称
- address: 待验证地址

> 发起提现

```bash
# withdraw
bin/cli.js withdraw {coinId} {to} {value} {sequence} [-m {memo}] [-d {extraData}]
```

参数：

- coinId: 币种名称
- to: 到账地址
- value: 金额
- sequence: 序列号
- memo: 提现备注
- extraData: 额外参数，回调中将返回

> 发起统计

```bash
# audit
bin/cli.js audit {coinId} {auditTime}
```

参数：

- coinId: 币种名称
- auditTime: 统计时间

> 订单查询

```bash
bin/cli.js order-get {orderId}
```

参数：

- orderId: 订单号

> 统计查询

```bash
bin/cli.js audit-get {auditId}
```

参数：

- auditId: 统计号

> 钱包余额查询

```bash
bin/cli.js balance {coinId}
```

参数：

- coinId: 币种名称

## 关于 NodeJS SDK

### 快速上手

安装sdk后，可以在 nodejs 代码中进行对瑶池API的调用。

```bash
npm install @jadepool/sdk
```

### 代码示例 Example

```js
  const sdk = require('@jadepool/sdk')

  const config = {
    eccKey: 'ad70927341c3ccd4c745e51db0c00ce23edc667cfc71e990a584e9e951c39297', // ecc private key for signing request to Jadepool
    eccKeyEncoder: 'hex', // ecc private key encoding scheme
    httpEndpoint: 'http://localhost:7001', // Jadepool url
    appId: 'test' // app id for ecc key (set on Jadepool Admin)
  }
  const api = new sdk.Api(config)

  // get a new address
  let address = await api.newAddress('BTC')

  // verify if an address is valid
  let valid = await api.verifyAddress('BTC', address)

  // request a withdrawal
  let withdrawOrder = await api.withdraw({
    coinId: 'BTC',
    to: 'mg2bfYdfii2GG13HK94jXBYPPCSWRmSiAS',
    value: '0.1',
    sequence: 0
  })

  // request an audit
  let auditOrder = await api.audit('BTC', 1544601373000)

  // query a Jadepool order
  let order = await api.getOrder('5')

  // query a Jadepool audit order
  let audit = await api.getAudit('5c10c052f6372352b66dbe67')

  // get a token balance
  let balance = await api.getBalance('BTC')

```

## License

MIT
