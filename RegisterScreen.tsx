import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('./image/flowe_logo.png')} style={styles.logo} />
      <View style={styles.formContainer}>
        <Text style={styles.title}>회원가입</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>로그인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // 세로 기준으로 상단 정렬
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingTop: windowHeight * 0.1, // 세로 기준으로 상단 여백
  },
  logo: {
    width: windowWidth * 0.23,
    height: windowWidth * 0.2,
    marginBottom: windowWidth * 0.04,
  },
  formContainer: {
    width: windowWidth * 0.8,
  },
  title: {
    fontSize: windowWidth * 0.07,
    fontWeight: 'bold',
    marginBottom: windowWidth * 0.04,
  },
  input: {
    height: windowWidth * 0.12,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: windowWidth * 0.02,
    paddingHorizontal: windowWidth * 0.02,
  },
  button: {
    backgroundColor: 'green',
    padding: windowWidth * 0.02,
    borderRadius: windowWidth * 0.01,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: windowWidth * 0.04,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;


