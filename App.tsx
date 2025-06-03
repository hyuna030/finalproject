// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ProfileScreen from './ProfileScreen';
import { auth, initializeApp, onAuthStateChanged } from './firebase';

const Stack = createStackNavigator();

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_API_KEY,
      authDomain: "finalflowe.firebaseapp.com",
      projectId: "finalflowe",
      storageBucket: "finalflowe.appspot.com",
      messagingSenderId: "187765610474",
      appId: "1:187765610474:web:81708d38f90484df0cc493",
      measurementId: "G-60DWLH469T"
    };


    initializeApp(firebaseConfig);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // ?™”ë©? ? œëª? ?ˆ¨ê¸°ê¸°
        }}
      >
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;












