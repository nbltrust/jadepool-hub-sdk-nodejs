#!/usr/bin/env node
'use strict'

/* eslint no-unused-vars: off */
const ArgumentParser = require('argparse').ArgumentParser
const crypto = require('@jadepool/crypto')
const fs = require('fs')
const path = require('path')
const Api = require('../src/api')

// 配置Cli
const parser = new ArgumentParser({
  version: '1.0.0',
  description: 'Jadepool SDK cli'
})
parser.addArgument(['-f', '--configfile'], { help: 'path of the config file' })
const subParsers = parser.addSubparsers({ title: 'sub-commands', description: 'call API or generateKeypairs' })
// 创建创建KeyPairs
let kpParser = subParsers.addParser('keypairs', {
  addHelp: true,
  help: 'create ecc key pairs'
})
kpParser.setDefaults({
  func: args => {
    const kp = crypto.ecc.generateKeyPair()
    console.dir(kp, { depth: 1 })
  }
})

// 使用API
async function invokeMethod (args, methodName, methodArgs) {
  const cfgName = 'jpcli.config.json'
  let cfgPath = args.config || path.resolve(process.execPath, cfgName)
  if (!fs.existsSync(cfgPath)) {
    cfgPath = path.resolve(__dirname, '../', cfgName)
  }
  let api = new Api(require(cfgPath))
  if (!api[methodName]) {
    console.error(`missing method: ${methodName}`)
    return
  }
  try {
    let result = await api[methodName].apply(api, methodArgs)
    console.dir(result, { depth: 3 })
  } catch (err) {
    console.error(err)
  }
}
let apiParser
// address-new
apiParser = subParsers.addParser('address-new', { help: 'call Jadepool API: newAddress' })
apiParser.addArgument('coinId')
apiParser.setDefaults({
  func: args => invokeMethod(args, 'newAddress', [args.coinId])
})

// address-verify
apiParser = subParsers.addParser('address-verify', { help: 'call Jadepool API: verifyAddress' })
apiParser.addArgument('coinId')
apiParser.addArgument('address')
apiParser.setDefaults({
  func: args => invokeMethod(args, 'verifyAddress', [args.coinId, args.address])
})

// withdraw
apiParser = subParsers.addParser('withdraw', { help: 'call Jadepool API: withdraw' })
apiParser.addArgument('coinId')
apiParser.addArgument('to')
apiParser.addArgument('value')
apiParser.addArgument('sequence', { type: 'int' })
apiParser.addArgument(['-m', '--memo'], { type: 'string' })
apiParser.addArgument(['-d', '--extraData'], { type: 'string' })
apiParser.setDefaults({
  func: args => invokeMethod(args, 'withdraw', [args])
})

// audit-new
apiParser = subParsers.addParser('audit', { help: 'call Jadepool API: audit' })
apiParser.addArgument('coinId')
apiParser.addArgument('auditTime', { type: 'int' })
apiParser.setDefaults({
  func: args => invokeMethod(args, 'audit', [args.coinId, args.auditTime])
})

// ------ get 请求 -------
// order-get
apiParser = subParsers.addParser('order-get', { help: 'call Jadepool API: getOrder' })
apiParser.addArgument('orderId', { type: 'int' })
apiParser.setDefaults({
  func: args => invokeMethod(args, 'getOrder', [args.orderId])
})

// audit-get
apiParser = subParsers.addParser('audit-get', { help: 'call Jadepool API: getAudit' })
apiParser.addArgument('auditId')
apiParser.setDefaults({
  func: args => invokeMethod(args, 'getAudit', [args.auditId])
})

// balance
apiParser = subParsers.addParser('balance', { help: 'call Jadepool API: getBalance' })
apiParser.addArgument('coinId')
apiParser.setDefaults({
  func: args => invokeMethod(args, 'getBalance', [args.coinId])
})

// 执行
async function main () {
  const args = parser.parseArgs()
  await args.func(args)
  process.exit(0)
}
main()
