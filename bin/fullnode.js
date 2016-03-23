#!/usr/bin/env node
'use strict'
let repl = require('repl')
let Fullnode = require('../')
// Make all Fullnode classes globally available.
Object.assign(global, Fullnode, {Fullnode: Fullnode})
repl.start({
  prompt: 'fullnode> ',
  useGlobal: true,
  ignoreUndefined: true
})
