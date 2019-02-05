module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000'
      },
      '/graph-changes': {
        target: 'ws://localhost:3000',
        ws: true
      },
    }
  }
};