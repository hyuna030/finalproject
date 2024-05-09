import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App'; // 여기서 App은 React Native 컴포넌트입니다.
import { name as appName } from './app.json'; // 앱의 이름을 app.json에서 가져옵니다.

// 웹 애플리케이션으로 등록하고 실행
AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app') // 이 ID는 index.html의 div 태그와 일치해야 합니다.
});
