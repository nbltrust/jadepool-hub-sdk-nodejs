const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
app.use(morgan('dev'))
app.use(express.json())
app.use(cors())

// 使用SDK middleware
const sdk = require('../src')
app.use(sdk.middleware({
  verifyKey: 'A6zjJTLJBlLhuukWJI5CenqxCu7qEGeUlmmj9NoQll75',
  verifyKeyEncoder: 'base64'
}))

app.post('/callback', (req, res, next) => {
  console.log('Jadepool Message:', JSON.stringify(req.body))
  console.log('Is message valid?', req.msgValid)
  res.status(200).json({
    result: '0',
    message: 'success'
  })
})

// 监听
const port = process.env.PORT || 9008
app.listen(port, () => { console.log(`Jadepool callback example listen at`, port) })
