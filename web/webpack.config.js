const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');

// .env 파일 로드
const env = dotenv.config({ path: path.resolve(__dirname, '../.env') }).parsed || {};

// 디버깅용 - 빌드할 때 터미널에서 확인
console.log('ENV file path:', path.resolve(__dirname, '../.env'));
console.log('Loaded env:', env);

const envKeys = {
  'process.env.REACT_APP_API_KEY': JSON.stringify(process.env.REACT_APP_API_KEY || env.REACT_APP_API_KEY || 'fallback-key')
};

console.log('Final envKeys:', envKeys);

// 디버깅용
console.log('Processed envKeys for webpack:', envKeys);

const babelLoaderConfiguration = {
  test: /\.(t|j)sx?$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(png|jpe?g|gif|svg)$/,
  use: {
    loader: 'file-loader',
    options: {
      name: 'image/[name].[ext]',
    },
  },
};

module.exports = {
  entry: [
    path.resolve(appDirectory, 'index.web.js')
  ],
  output: {
    filename: 'bundle.web.js',
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
  },

  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin(envKeys), // ? 환경변수 주입
    // process 폴리필 추가
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  ],

  resolve: {
    extensions: ['.web.js', '.js', '.tsx', '.ts', '.json'],
    alias: {
      'react-native$': 'react-native-web',
    },
    // Node.js 폴리필 fallback 추가
    fallback: {
      "process": require.resolve("process/browser"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "url": require.resolve("url"),
      "assert": require.resolve("assert"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "net": false,
      "tls": false
    }
  },

  devServer: {
    static: path.resolve(appDirectory, 'dist'),
    hot: true,
  },
};