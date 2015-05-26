#!/usr/bin/env node
"use strict";
let repl = require('repl');
let fullnode = require('../');
// Make all fullnode classes globally available.
fullnode.extend(global, fullnode, {fullnode: fullnode});
repl.start({
  prompt: 'fullnode> ',
  useGlobal: true,
  ignoreUndefined: true
});
