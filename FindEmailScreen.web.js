import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, firestore } from './firebase';
import { query, collection, where, getDocs } from 'firebase/firestore';

const FindEmailScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  const findEmailByPhoneNumber = async () => {
    const q = query(collection(firestore, 'users'), where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      setMessage('해당 전화번호로 가입된 계정이 없습니다.');
      return;
    }
    querySnapshot.forEach((doc) => {
      setMessage(`계정 이메일: ${doc.data().email}`);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>전화번호로 아이디 찾기</Text>
        <TextInput
          style={styles.input}
          placeholder="전화번호 입력"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <TouchableOpacity onPress={findEmailByPhoneNumber} style={styles.button}>
          <Text>아이디 찾기</Text>
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

export default FindEmailScreen;

