const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cors())

// 使用SDK middleware
const sdk = require('../src')
app.use(sdk.middleware({
  verifyKey: 'BKurum9EkO0jvTYTRJH6sLOOrpctCKIItmcCjy1hBGPNBz4pql3mWjb8JyZ/A99qUUByXX5vcWb292Q5NLFFJt0=',
  verifyKeyEncoder: 'base64'
}))

app.post('/callback', (req, res, next) => {
  console.log('Jadepool Message:', JSON.stringify(req.body))
  console.log('Is message valid?', req.msgValid)
  res.status(200).send('')
})

// 监听
const port = process.env.PORT || 9008
app.listen(port, () => { console.log(`Jadepool callback example listen at`, port) })
