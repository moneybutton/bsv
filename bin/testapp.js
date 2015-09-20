#!/usr/bin/env node
/**
 * Basic web app to facilitate running the mocha browser tests without karma.
 */
'use strict'
let express = require('express')
let path = require('path')
let app = express()
var ExpressPeerServer = require('peer').ExpressPeerServer

app.use(express.static(path.join(__dirname, '../build')))
app.use(express.static(path.join(__dirname, '../node_modules')))

let server = app.listen(3000, function () {
  let host = server.address().address
  let port = server.address().port
  console.log('Run the mocha tests at http://%s:%s/', host, port)
})

app.use('/', ExpressPeerServer(server, {debug: true}))

module.exports.app = app
module.exports.server = server
