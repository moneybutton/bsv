const path = require('path')

module.exports = {
  entry: './entry.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bsv.bundle.js',
    library: 'bsvjs'
  },
  devtool: 'source-map',
  mode: 'production'
}
