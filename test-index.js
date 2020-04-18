'use strict'
let testsContext = require.context('./test', false, /^.*\.js$/)
testsContext.keys().forEach(testsContext)
