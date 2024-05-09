import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

const FindPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordReset = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage('비밀번호 재설정 이메일이 전송되었습니다.');
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found') {
          setMessage('존재하지 않는 이메일입니다.');
        } else {
          console.error('Error sending password reset email:', error);
          setMessage('이메일 전송에 실패했습니다.');
        }
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>이메일로 비밀번호 찾기</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일 입력"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity onPress={handlePasswordReset} style={styles.button}>
          <Text>비밀번호 재설정 이메일 전송</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text>{message}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>로그인 화면으로 돌아가기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonText}>홈 화면으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '80%',
    padding: 10,
    marginVertical: 10,
  },
  button: {
    backgroundColor: 'green',
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FindPasswordScreen;

