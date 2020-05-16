const path = require('path')

module.exports = {
  entry: './entry.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bsvjs.bundle.js',
    library: 'bsvjs'
  },
  mode: 'production'
}
