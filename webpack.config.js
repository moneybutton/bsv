const path = require('path')
const webpack = require('webpack')

module.exports = [
  {
    entry: './entry.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bsv.bundle.js',
      library: {
        name: 'bsvjs',
        type: 'umd2'
      },
    },
    resolve: {
      alias: {
        process: "process/browser"
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),
    ],
    devtool: 'source-map',
    mode: 'production'
  },
  {
    entry: './entry.js',
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bsv.cjs.js',
      library: {
        type: 'system'
      }
    },
    devtool: 'source-map',
    mode: 'production'
  }
]
