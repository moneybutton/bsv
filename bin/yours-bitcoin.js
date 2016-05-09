#!/usr/bin/env node
'use strict'
let repl = require('repl')
let YoursBitcoin = require('../')
// Make all Fullnode classes globally available.
Object.assign(global, YoursBitcoin, {YoursBitcoin: YoursBitcoin})
repl.start({
  prompt: 'yours-bitcoin> ',
  useGlobal: true,
  ignoreUndefined: true
})
