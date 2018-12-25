const _ = require('lodash')
const sha256 = require('js-sha256')
const secp256k1 = require('secp256k1')

const version = 1
const algorithmId = 33

/**
 * @param {Buffer} priKey
 * @param {object} opts
 * @param {number} opts.sequence
 * @param {string} opts.coinType
 * @param {string} opts.to
 * @param {string} opts.value
 * @param {string} [opts.memo=undefined]
 */
function buildWithdraw (priKey, opts = {}) {
  if (!_.isBuffer(priKey)) {
    throw new Error('missing private key...')
  }
  let arr = [
    { val: opts.coinType, required: true },
    { val: opts.to, required: true },
    { val: opts.value, required: true },
    { val: opts.memo, required: false }
  ]

  let bufferArr = []

  let versionBuffer = Buffer.alloc(2)
  versionBuffer.writeInt16LE(version)

  let algorithmIdBuffer = Buffer.alloc(1)
  algorithmIdBuffer.writeInt8(algorithmId)

  const sequence = opts.sequence
  if (_.isNil(sequence) || typeof sequence !== 'number') {
    throw new Error('missing required parameter or parameter type mismatch...')
  }
  const big = ~~(sequence / 0x0100000000)
  const low = (sequence % 0x0100000000)
  let sequenceBuffer = Buffer.alloc(8)
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
    let argLengthBuffer = Buffer.alloc(2)
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

  const sigObj = secp256k1.sign(Buffer.from(bufferConcatSha256, 'hex'), priKey)

  let signatureBuffer = sigObj.signature
  let signatureLengthBuffer = Buffer.alloc(2)
  signatureLengthBuffer.writeInt16LE(signatureBuffer.length)

  let resultBuffer = Buffer.concat([bufferConcat, signatureLengthBuffer, signatureBuffer])
  return resultBuffer.toString('hex')
}

/**
 * @param {Buffer} priKey
 * @param {object} opts
 * @param {string} opts.coinId 币种唯一代号，避免重名
 * @param {string} opts.coinType 代币类型
 * @param {string} opts.chain 链名
 * @param {string} opts.token 代币名
 * @param {number} opts.decimal 精度
 * @param {string} [opts.contract=undefined] 智能合约地址
 */
function buildCoin (priKey, opts = {}) {
  if (!_.isBuffer(priKey)) {
    throw new Error('missing private key...')
  }
  let arr = [
    { val: opts.coinId, required: true },
    { val: opts.coinType, required: true },
    { val: opts.chain, required: true },
    { val: opts.token, required: true },
    { val: opts.contract, required: false },
    { val: opts.decimal.toString(), required: true }
  ]

  let bufferArr = []

  let versionBuffer = Buffer.alloc(2)
  versionBuffer.writeInt16LE(version)

  let algorithmIdBuffer = Buffer.alloc(1)
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
    let argLengthBuffer = Buffer.alloc(2)
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
  const sigObj = secp256k1.sign(Buffer.from(bufferConcatSha256, 'hex'), priKey)
  let signatureBuffer = sigObj.signature
  let signatureLengthBuffer = Buffer.alloc(2)
  signatureLengthBuffer.writeInt16LE(signatureBuffer.length)
  let resultBuffer = Buffer.concat([bufferConcat, signatureLengthBuffer, signatureBuffer])
  return resultBuffer.toString('hex')
}

module.exports = {
  buildWithdraw,
  buildCoin
}
