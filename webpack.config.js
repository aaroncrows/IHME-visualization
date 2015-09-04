//disable hot dev server for build

module.exports = {
  entry: [/*'webpack/hot/dev-server',*/ __dirname + '/app/js/client.js'],
  output: {
    filename: 'bundle.js',
    path: __dirname + '/build/'
  },
  module: {
    loaders: [
      { test: /\.scss$/, loader: 'style!css!sass'},
    ]
  },
  resolve: {
    extensions: ['', '.js', '.scss'],
    modulesDirectories: ["node_modules"]
  }
}