const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallback for node modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "fs": false,
        "net": false,
        "tls": false
      };

      return webpackConfig;
    }
  },
  devServer: {
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 3000,
    historyApiFallback: true,
    hot: true,
    liveReload: true
  },
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
};

