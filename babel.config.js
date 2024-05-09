module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  "plugins": [
      // 기존 플러그인들...
      "react-native-web"
    ]
};
