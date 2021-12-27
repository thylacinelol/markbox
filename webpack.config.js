const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'public', 'js'),
    filename: 'application.js',
  },
  resolve: {
    fallback: {
      util: require.resolve('util/'),
      crypto: false,
    }
  },
  module: {
    rules: [{
      test: /\.(css)$/,
      use: ['style-loader', 'css-loader']
    }],
  },
  devtool: 'source-map',
};