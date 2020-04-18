#!/usr/bin/env node
'use strict'
let repl = require('repl')
let bsv = require('../')
// Make all Fullnode classes globally available.
Object.assign(global, bsv, { bsv: bsv })
repl.start({
  prompt: 'bsv> ',
  useGlobal: true,
  ignoreUndefined: true
})
