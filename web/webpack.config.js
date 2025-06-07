const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');

// .env 파일 로드
const env = dotenv.config().parsed || {};

// 환경변수 가공
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
    filename: 'bundle.[contenthash].js',
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
  },

  // ?? Webview는 웹에서 쓸 수 없기 때문에 아래 줄은 삭제하거나 주석 처리하세요
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
    new webpack.DefinePlugin({
      ...envKeys,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // 이 부분 추가
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],

  // 그리고 resolve 부분에 추가
  resolve: {
    extensions: ['.web.js', '.web.tsx', '.web.ts', '.js', '.tsx', '.ts', '.json'], // .web.js를 맨 앞으로
    alias: {
      'react-native$': 'react-native-web',
    },
    fallback: {
      "process": require.resolve("process/browser")
    }
  },

  devServer: {
    static: path.resolve(appDirectory, 'dist'),
    hot: true,
  },
};
