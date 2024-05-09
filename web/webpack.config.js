const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');

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

// 이미지 파일을 처리하기 위한 로더 구성
const imageLoaderConfiguration = {
  test: /\.(png|jpe?g|gif|svg)$/,
  use: {
    loader: 'file-loader',
    options: {
      name: 'image/[name].[ext]', // 이미지가 저장될 경로 및 파일명 형식
    },
  },
};

module.exports = {
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'dist'), // 결과물을 dist 폴더에 저장
    filename: 'bundle.js' // 결과물 파일 이름
  },
externals: {
    'react-native-webview': 'commonjs react-native-webview'
  },

module: {
rules: [
babelLoaderConfiguration,
imageLoaderConfiguration, // 이미지 로더를 추가
// 여기에 다른 로더 구성을 추가할 수 있습니다.
],
},

plugins: [
new HtmlWebpackPlugin({
template: './public/index.html',
}),
],

resolve: {
extensions: ['.web.js', '.js', '.tsx', '.ts', '.json'],
alias: {
'react-native$': 'react-native-web',
},
},
};
