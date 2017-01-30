var path = require('path');

module.exports = {
  entry: './app/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'dist'
  },
  
  devtool: 'source-map',
  devServer: {
    inline:true,
    port: 8008
  },
  module: {
    loaders: [      
      { test: /\.js$/, exclude: /node_modules/, loader:"babel-loader", query: {
          presets: ['es2015']
        }
      },
    ]
  }
};