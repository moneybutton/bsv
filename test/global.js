/* global after */
/**
 * Global "before" and "after" to run before and after all tests. These can be
 * used to establish and also tear down global database connections, network
 * connections, and worker connections. It's important not to leave thins
 * hanging when the tests are done running so that the tests end properly.
 */
'use strict'

require('../lib/config')

let Workers = require('../lib/workers')

after(function () {
  Workers.endGlobalWorkers()
})
