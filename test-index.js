'use strict'
const testsContext = require.context('./test', false, /^.*\.js$/)
testsContext.keys().forEach(testsContext)
