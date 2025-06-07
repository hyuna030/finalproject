const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');

// .env ���� �ε�
const env = dotenv.config().parsed || {};

// ȯ�溯�� ����
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

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
    publicPath: './',
  },

  // ?? Webview�� ������ �� �� ���� ������ �Ʒ� ���� �����ϰų� �ּ� ó���ϼ���
  // externals: {
  //   'react-native-webview': 'commonjs react-native-webview'
  // },

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
    new webpack.DefinePlugin(envKeys), // ? ȯ�溯�� ����
  ],

  resolve: {
    extensions: ['.web.js', '.js', '.tsx', '.ts', '.json'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },

  devServer: {
    static: path.resolve(appDirectory, 'dist'),
    hot: true,
  },
};
