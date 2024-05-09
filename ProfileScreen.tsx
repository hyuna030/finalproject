// ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

function ProfileScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      setUserEmail(user.email);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Home');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greetingText}>반갑습니다! {userEmail}님</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  greetingText: {
    fontSize: 20,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;


