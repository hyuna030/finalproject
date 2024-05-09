import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Image, ImageBackground } from 'react-native';
import { auth, firestore } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signUpEmailError, setSignUpEmailError] = useState('');
  const [signUpPasswordError, setSignUpPasswordError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [currentBanner, setCurrentBanner] = useState(1);
  const bannerInterval = useRef(null);

  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const [isFindingPassword, setIsFindingPassword] = useState(false);
  const [findEmailMessage, setFindEmailMessage] = useState('');
  const [findPasswordMessage, setFindPasswordMessage] = useState('');
  const [message, setMessage] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);


  const backgroundColorAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bannerInterval.current = setInterval(() => {
      setCurrentBanner(prevBanner => prevBanner === 1 ? 2 : 1);
    }, 5000);

    return () => clearInterval(bannerInterval.current);
  }, []);

  const startBackgroundColorAnimation = () => {
    const toValue = isSignUpActive || isFindingEmail || isFindingPassword ? 0 : 1;

    Animated.timing(backgroundColorAnimation, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validatePhoneNumber = (number) => {
    const phoneNumberPattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneNumberPattern.test(number);
  };

  const validateNickname = async (name) => {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('nickname', '==', name.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // true if nickname is available, false if it's taken
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setNickname('');
    setLoginError('');
    setSignUpEmailError('');
    setSignUpPasswordError('');
    setPhoneNumberError('');
    setNicknameError('');
  };

  const toggleLogin = () => {
    setIsSignUpActive(false);    // 회원가입 모드 비활성화
    setIsFindingEmail(false);    // 이메일 찾기 모드 비활성화
    setIsFindingPassword(false); // 비밀번호 찾기 모드 비활성화
    startBackgroundColorAnimation();
    setLoginError('');           // 로그인 오류 메시지 초기화
    setFindEmailMessage('');     // 이메일 찾기 메시지 초기화
    setFindPasswordMessage('');  // 비밀번호 찾기 메시지 초기화
    clearForm();                 // 폼 초기화
  };


  const toggleSignUp = () => {
    setIsSignUpActive(!isSignUpActive);
    setIsFindingEmail(false);    // 회원가입 모드일 때 이메일 찾기 모드 비활성화
    setIsFindingPassword(false); // 회원가입 모드일 때 비밀번호 찾기 모드 비활성화
    startBackgroundColorAnimation();
    clearForm();
  };

  const handleLogoPress = () => {
      navigation.navigate('Home');
  };

  const handleBannerClick = (bannerNumber) => {
    navigation.navigate(`Banner${bannerNumber}`);
  };

  const handleBannerChange = (direction) => {
    clearInterval(bannerInterval.current);
    setCurrentBanner(prevBanner => {
      if (direction === 'left') {
        return prevBanner === 1 ? 2 : 1;
      } else {
        return prevBanner === 2 ? 1 : 2;
      }
    });
    bannerInterval.current = setInterval(() => {
      setCurrentBanner(prevBanner => prevBanner === 1 ? 2 : 1);
    }, 5000);
  };

  const handleLogin = () => {
    setLoginError('');
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigation.navigate('Home');
      })
      .catch((error) => {
        setLoginError('잘못된 이메일 또는 비밀번호입니다.');
      });
  };

  const handleSignUp = async () => {
    setSignUpEmailError('');
    setSignUpPasswordError('');
    setPhoneNumberError('');
    setNicknameError('');



    if (password.length < 6) {
      setSignUpPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError('올바른 번호 형식이 아닙니다.');
      return;
    }

    if (!(await validateNickname(nickname))) {
      setNicknameError('이미 존재하는 닉네임입니다.');
      return;
    }

    const cleanPhoneNumber = phoneNumber.replace(/-/g, ''); // 하이픈 제거

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        return setDoc(userRef, {
          email: email,
          phoneNumber: cleanPhoneNumber,
          nickname: nickname.toLowerCase(),
          notifications: [] // notifications 필드 초기화
        });
      })
      .then(() => {
        navigation.navigate('Home');
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          setSignUpEmailError('이미 존재하는 이메일입니다.');
        } else if (error.code === 'auth/invalid-email'){
            setSignUpEmailError('올바른 이메일 형식이 아닙니다.');
        }else {

          console.error('Signup error:', error);
        }
      });
  };




      const findEmailByPhoneNumber = async () => {
        const q = query(collection(firestore, 'users'), where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setFindEmailMessage('해당 전화번호로\n가입된 계정이 없습니다.');
          return;
        }
        querySnapshot.forEach((doc) => {
          setFindEmailMessage(`계정 이메일: ${doc.data().email}`);
        });
      };


          const handlePasswordReset = async () => {
            // 사용자 컬렉션에서 이메일로 조회
            const q = query(collection(firestore, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              // 이메일이 데이터베이스에 존재하지 않으면 메시지 설정
              setFindPasswordMessage('가입되지 않은 이메일입니다.');
            } else {
              // 이메일이 존재하면 비밀번호 재설정 이메일 전송
              sendPasswordResetEmail(auth, email)
                .then(() => {
                  setPasswordResetSuccess(true);
                        setFindPasswordMessage(email); // 이메일 주소만 저장
                })
                .catch((error) => {
                  console.error('Error sending password reset email:', error);
                  setFindPasswordMessage('이메일 전송에 실패했습니다.');
                });
            }
          };






                // UI 토글 핸들러
                const toggleFindEmail = () => {
                  setIsFindingEmail(!isFindingEmail);
                  setIsFindingPassword(false); // 이메일 찾기 모드일 때 비밀번호 찾기 모드 비활성화
                  setIsSignUpActive(false);    // 이메일 찾기 모드일 때 회원가입 모드 비활성화
                  startBackgroundColorAnimation();
                  setPhoneNumber('');
                    setFindEmailMessage('');
                };

                const toggleFindPassword = () => {
                  setIsFindingPassword(!isFindingPassword);
                  setIsFindingEmail(false);   // 비밀번호 찾기 모드일 때 이메일 찾기 모드 비활성화
                  setIsSignUpActive(false);   // 비밀번호 찾기 모드일 때 회원가입 모드 비활성화
                  startBackgroundColorAnimation();
                  setEmail('');
                    setFindPasswordMessage('');
                };








  return (
      <View style={styles.container}>
        <ImageBackground source={{ uri: './image/halfbackground.png' }} style={styles.backgroundImage}>
          <Animated.View style={[styles.halfScreen, { backgroundColor: backgroundColorAnimation.interpolate({ inputRange: [0, 1], outputRange: ['white', 'transparent'] }) }]}>
            {!isSignUpActive && !isFindingEmail && !isFindingPassword ? (
              <View style={styles.form}>
                <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                   <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                </TouchableOpacity>
                <TextInput style={styles.formInput} placeholder="이메일 입력" onChangeText={setEmail} value={email} />
                <TextInput style={styles.formInput} placeholder="비밀번호 6자 이상" secureTextEntry onChangeText={setPassword} value={password} />
                {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
                <TouchableOpacity style={styles.formButton} onPress={handleLogin}>
                  <Text style={styles.buttonText}>로그인</Text>
                </TouchableOpacity>
                <View style={styles.findContainer}>
                  <TouchableOpacity onPress={toggleFindEmail}>
                    <Text style={styles.findText}>이메일 찾기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFindPassword}>
                    <Text style={styles.findText}>비밀번호 찾기</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bannerContainer}>
                  <TouchableOpacity onPress={() => handleBannerChange('left')} style={styles.leftArrow}>
                    <Image source={{ uri: './image/left_arrow.png' }} style={styles.arrowButton} />
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Image source={{ uri: currentBanner === 1 ? './image/banner1.png' : './image/banner2.png' }} style={styles.bannerImage} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleBannerChange('right')} style={styles.rightArrow}>
                    <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowButton} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}


            {/* 이메일 찾기 또는 비밀번호 찾기가 활성화된 경우 */}
              {isFindingEmail && (
                <View style={styles.centeredContent}>
                  <Text style={styles.infoText}>이메일을 찾으시나요?</Text>
                  <Text style={styles.infosmallText}>이메일을 찾으셨나요?</Text>
                  <TouchableOpacity style={styles.button} onPress={toggleLogin}>
                                                  <Text style={styles.buttonText}>로그인</Text>
                                                </TouchableOpacity>
                </View>
              )}

              {isFindingPassword && (
                <View style={styles.centeredContent}>
                  <Text style={styles.infoText}>비밀번호를 찾으시나요?</Text>
                  <Text style={styles.infosmallText}>문제가 해결되었나요?</Text>
                  <TouchableOpacity style={styles.button} onPress={toggleLogin}>
                                                  <Text style={styles.buttonText}>로그인</Text>
                                                </TouchableOpacity>
                </View>
              )}


              {isSignUpActive ? (
              <View style={styles.centeredContent}>
                              <Text style={styles.infoText}>이미 플라위 회원인가요?</Text>
                              <Text style={styles.infosmallText}>플라위에 로그인하고 다양한 사람과 함께</Text>
                              <Text style={styles.infosmallText}>식물을 키우고 소통해보세요!</Text>
                              <TouchableOpacity style={styles.button} onPress={toggleSignUp}>
                                <Text style={styles.buttonText}>로그인</Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
          </Animated.View>

          <Animated.View style={[styles.halfScreen, { backgroundColor: backgroundColorAnimation.interpolate({ inputRange: [0, 1], outputRange: ['transparent', 'white'] }) }]}>
            {isSignUpActive ? (
              <View style={styles.form}>
                <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                   <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                </TouchableOpacity>
                <Text style={styles.signUpText}>간단하게 플라위에 가입하세요!</Text>
                <TextInput style={styles.formInput} placeholder="이메일 입력" onChangeText={setEmail} value={email} />
                <TextInput style={styles.formInput} placeholder="비밀번호 6자 이상" secureTextEntry onChangeText={setPassword} value={password} />
                <TextInput style={styles.formInput} placeholder="전화번호" onChangeText={setPhoneNumber} value={phoneNumber} />
                <TextInput style={styles.formInput} placeholder="닉네임" onChangeText={setNickname} value={nickname} />
                {signUpEmailError ? <Text style={styles.errorText}>{signUpEmailError}</Text> : null}
                {signUpPasswordError ? <Text style={styles.errorText}>{signUpPasswordError}</Text> : null}
                {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}
                {nicknameError ? <Text style={styles.errorText}>{nicknameError}</Text> : null}
                <TouchableOpacity style={styles.formButton} onPress={handleSignUp}>
                  <Text style={styles.buttonText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {isFindingEmail && findEmailMessage ? (
            <View style={styles.form}>
                                        <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                                           <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                                        </TouchableOpacity>
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>{findEmailMessage}</Text>
                </View>
                                    <TouchableOpacity style={styles.formButton} onPress={toggleFindEmail}>
                                      <Text style={styles.buttonText}>확인</Text>
                                    </TouchableOpacity>

              </View>
            ) : isFindingEmail ? (
            <View style={styles.form}>
                            <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                               <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                            </TouchableOpacity>
                            <Text style={styles.signUpText}>이메일 찾기</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="전화번호 입력"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
                <TouchableOpacity onPress={findEmailByPhoneNumber} style={styles.formButton}>
                  <Text style={styles.buttonText}>확인</Text>
                </TouchableOpacity>
                {findEmailMessage ? <Text>{findEmailMessage}</Text> : null}
              </View>
            ) : null}

            {isFindingPassword && findPasswordMessage ? (
              <View style={styles.form}>
                                                      <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                                                         <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                                                      </TouchableOpacity>
                            <View style={styles.resultContainer}>
                                  {passwordResetSuccess ? (
                                    <>
                                      <Text style={styles.resultText}>비밀번호 변경 메일을</Text>
                                      <Text style={[styles.resultText, {color: '#28C770'}]}>{findPasswordMessage}</Text>
                                      <Text style={styles.resultText}>로 발송하였습니다.</Text>
                                    </>
                                  ) : (
                                    <Text style={styles.resultText}>{findPasswordMessage}</Text>
                                  )}
                                </View>
                                <TouchableOpacity style={styles.formButton} onPress={toggleFindPassword}>
                                  <Text style={styles.buttonText}>확인</Text>
                                </TouchableOpacity>

                            </View>
            ) : isFindingPassword ? (
            <View style={styles.form}>
                                        <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                                           <Image source={{ uri: './image/flowe_logo.png' }} style={styles.logo} />
                                        </TouchableOpacity>
                                        <Text style={styles.signUpText}>비밀번호 재설정</Text>

                <TextInput
                  style={styles.formInput}
                  placeholder="이메일 입력"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity onPress={handlePasswordReset} style={styles.formButton}>
                  <Text style={styles.buttonText}>확인</Text>
                </TouchableOpacity>
                {findPasswordMessage ? <Text>{findPasswordMessage}</Text> : null}
              </View>
            ) : null}
            {!isSignUpActive && !isFindingEmail && !isFindingPassword ? (
              <View style={styles.centeredContent}>
                <Text style={styles.infoText}>플라위에 처음 오셨나요?</Text>
                <Text style={styles.infosmallText}>플라위에 가입하고 다양한 사람과 함께</Text>
                <Text style={styles.infosmallText}>식물을 키우고 소통해보세요!</Text>
                <TouchableOpacity style={styles.button} onPress={toggleSignUp}>
                  <Text style={styles.buttonText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>
        </ImageBackground>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
    },
    backgroundImage: {
      flex: 1,
      flexDirection: 'row',
      resizeMode: 'cover',
    },
    halfScreen: {
      flex: 1,
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
    },
    form: {
      width: '50%',
      alignItems: 'center',
    },
    logo: {
      width: 110,
      height: 100,
      marginBottom: 20,
    },
    signUpText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '700',
      fontSize: 22,
      marginVertical: 10,
      marginBottom: 30,
    },
    formInput: {
      width: '100%',
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 10,
      padding: 15,
      backgroundColor: 'white',
      marginBottom: 20,
    },
    errorText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '500',
      color: 'red',
      marginBottom: 10,
    },
    button: {
        backgroundColor: '#28C770',
        borderRadius: 10,
        padding: 15,
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#808080', // 그림자의 색상
          shadowOffset: { width: 3, height: 4 }, // 그림자의 위치
          shadowOpacity: 0.4, // 그림자의 불투명도
          shadowRadius: 3.84, // 그림자의 퍼짐 정도
    },
    formButton: {
      backgroundColor: '#31ac66',
      borderRadius: 10,
      padding: 15,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    buttonText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '700',
      color: 'white',
      fontWeight: 'bold',
    },
    centeredContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '800',
      fontSize: 45,
      letterSpacing: -1.5,
      color: 'white',
      textAlign: 'center',
      marginBottom: 30,
    },
    infosmallText: {
          fontFamily: 'Noto Sans KR',
          fontWeight: '600',
          fontSize: 25,
          letterSpacing: -1.5,
          color: 'white',
          textAlign: 'center',
    },
    findText: {
        fontFamily: 'Noto Sans KR',
        fontWeight: '700',
        color: 'black',
        marginLeft: 20,
    },
    findContainer: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 30,
     },
    bannerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    bannerImage: {
      width: 600,
      height: 100,
      borderRadius: 20,
      zIndex: 1,
    },
    leftArrow: {
      position: 'absolute',
      left: 0,
      zIndex: 2,
    },
    rightArrow: {
      position: 'absolute',
      right: 0,
      zIndex: 2,
    },
    arrowButton: {
      width: 30,
      height: 30,
      marginHorizontal: 5,
    },
// Text 컴포넌트 스타일
resultText: {
  fontFamily: 'Noto Sans KR',
  fontWeight: '700',
  color: 'gray',
  fontSize: 25,
  textAlign: 'center', // 텍스트를 가운데 정렬
},

// 컨테이너 스타일
resultContainer: {
  flex: 1,
  justifyContent: 'center', // 세로 방향 가운데 정렬
  alignItems: 'center',     // 가로 방향 가운데 정렬
  marginTop: 20,
    marginBottom: 30,
},
  });

  export default LoginScreen;

