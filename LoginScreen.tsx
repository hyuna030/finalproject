import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, Dimensions } from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as KakaoLogin from '@react-native-seoul/kakao-login';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const fetchRememberMe = async () => {
      const storedRememberMe = await AsyncStorage.getItem('rememberMe');
      setRememberMe(storedRememberMe === 'true');
    };

    fetchRememberMe();
  }, []);

  const handleLogin = async () => {
    try {
      // Firebase에 이메일과 비밀번호로 로그인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        if (rememberMe) {
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('rememberMe');
        }

        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLoginWithKakao = async () => {
    try {
      // 카카오 로그인
      const result = await KakaoLogin.login();

      if (result) {
        // 카카오 로그인 성공
        const profile = await KakaoLogin.getProfile();

        // 카카오로부터 받아온 이메일을 Firebase에 등록
        const email = profile.email;

        // 이메일이 있다면 Firebase에 등록
        if (email) {
          // 사용자의 Kakao ID를 비밀번호로 사용
          const kakaoId = profile.id.toString();
          const password = "A!" + kakaoId;

          try {
            // Firebase에 계정이 있는지 확인
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (userCredential.user) {
              // Firebase에 계정이 있다면 로그인
              navigation.navigate('Home');
            } else {
              // Firebase에 계정이 없다면 계정 생성 후 로그인
              const createUserResult = await createUserWithEmailAndPassword(auth, email, password);

              if (createUserResult.user) {
                navigation.navigate('Home');
              } else {
                Alert.alert('Error', 'Firebase에 계정을 생성하지 못했습니다.');
              }
            }
          } catch (error) {
            // Firebase에 계정이 없는 경우
            if (error.code === 'auth/user-not-found') {
              const createUserResult = await createUserWithEmailAndPassword(auth, email, password);

              if (createUserResult.user) {
                navigation.navigate('Home');
              } else {
                Alert.alert('Error', 'Firebase에 계정을 생성하지 못했습니다.');
              }
            } else {
              Alert.alert('Error', error.message);
            }
          }
        } else {
          // 이메일이 없다면 오류 처리
          Alert.alert('Error', '카카오로부터 이메일 정보를 받아오지 못했습니다.');
        }
      } else {
        // 카카오 로그인 실패 또는 취소
        console.log('Kakao Login Failed or Cancelled');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Image source={require('./image/flowe_logo.png')} style={styles.logo} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="비밀번호"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
            <TouchableOpacity style={styles.showPasswordIconContainer} onPress={toggleShowPassword}>
              <Image
                source={showPassword ? require('./image/view.png') : require('./image/hide.png')}
                style={styles.showPasswordIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Image source={require('./image/login_button.png')} style={styles.buttonImage} />
        </TouchableOpacity>
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity onPress={toggleRememberMe}>
            <Image
              source={rememberMe ? require('./image/tick_on.png') : require('./image/tick_off.png')}
              style={styles.rememberMeIcon}
            />
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>로그인 상태 유지</Text>
        </View>
        <View style={styles.snsLoginTextContainer}>
          <View style={styles.snsLoginSeparator}></View>
          <Text style={styles.snsLoginText}>SNS 간편로그인</Text>
          <View style={styles.snsLoginSeparator}></View>
        </View>
        <TouchableOpacity style={styles.kakaoLoginButton} onPress={handleLoginWithKakao}>
          <Image source={require('./image/kakao_button.png')} style={styles.buttonImage} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>회원가입</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text style={styles.linkText}>메인페이지</Text>
      </TouchableOpacity>
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
  formContainer: {
    width: windowWidth * 0.9,
    alignItems: 'center',
  },
  logo: {
    width: windowWidth * 0.23,
    height: windowWidth * 0.2,
    marginBottom: windowWidth * 0.1,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: windowWidth * 0.12,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: -1,
    paddingHorizontal: windowWidth * 0.02,
    width: '100%', // 창 가로 크기에 맞추기
    borderTopLeftRadius: windowWidth * 0.02,
    borderTopRightRadius: windowWidth * 0.02,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: windowWidth * 0.12,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: windowWidth * 0.02,
    borderBottomLeftRadius: windowWidth * 0.02,
    borderBottomRightRadius: windowWidth * 0.02,
  },
  showPasswordIconContainer: {
    position: 'absolute',
    right: windowWidth * 0.02,
  },
  showPasswordIcon: {
    width: windowWidth * 0.075,
    height: windowWidth * 0.075,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: windowWidth * 0.05,
  },
  rememberMeIcon: {
    width: windowWidth * 0.06,
    height: windowWidth * 0.06,
    marginRight: windowWidth * 0.02,
  },
  rememberMeText: {
    fontFamily: 'NotoSansKR-Regular',
    lineHeight: Dimensions.get('window').width * 0.06,
    fontSize: windowWidth * 0.04,
  },
  loginButton: {
    marginTop: windowWidth * 0.03,
    width: windowWidth * 0.9,
    height: windowWidth * 0.1,
  },
  kakaoLoginButton: {
    marginTop: windowWidth * 0.02,
    width: windowWidth * 0.9,
    height: windowWidth * 0.1,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  snsLoginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: windowWidth * 0.05,
    marginBottom: windowWidth * 0.02,
  },

  snsLoginSeparator: {
    flex: 1,
    height: 1,
    backgroundColor: 'gray',
    marginLeft: windowWidth * 0.02,
    marginRight: windowWidth * 0.02,
  },

  snsLoginText: {
    fontFamily: 'NotoSansKR-Regular',
    lineHeight: Dimensions.get('window').width * 0.06,
    fontSize: windowWidth * 0.03,
  },

  linkText: {
      marginTop: 20,
      color: 'blue',
      textDecorationLine: 'underline',
  },
});

export default LoginScreen;








