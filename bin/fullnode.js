var repl = require('repl');
var fullnode = require('../');
// Make all fullnode classes globally available.
for (var prop in fullnode) {
  global[prop] = fullnode[prop];
}
// And also, to easily view what things are available...
global['fullnode'] = fullnode;
repl.start({
  prompt: 'fullnode> ',
  useGlobal: true,
  ignoreUndefined: true
});
