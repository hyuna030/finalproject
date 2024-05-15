import React, { useEffect, useState } from 'react';
import { View, Dimensions, Text, StyleSheet, Image, TouchableOpacity, TextInput, Animated } from 'react-native';
import { auth, firestore } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

// 세로 방향의 여유 공간을 추가적으로 정의합니다.
const verticalBoundaryOffset = 200; // 원하는 만큼의 여유 공간 값

// 원 컴포넌트 정의
const AnimatedCircle = ({ size, color }) => {
  // 초기 위치를 랜덤하게 설정하는 함수
  const getRandomInitialPosition = () => ({
    x: Math.random() * (windowWidth - size),
    y: Math.random() * (windowHeight - size),
  });

  // 초기 위치 상태
  const [initialPosition] = useState(getRandomInitialPosition());

  // Animated.ValueXY에 초기 위치를 설정합니다.
  const position = useState(new Animated.ValueXY(initialPosition))[0];

  // 움직임의 방향과 속도를 결정하는 랜덤 값
  const moveX = Math.random() > 0.5 ? 1 : -1; // 왼쪽 또는 오른쪽으로 이동
  const moveY = Math.random() > 0.5 ? 1 : -1; // 위 또는 아래로 이동
  const speed = Math.random() * 8000 + 4000; // 속도는 3000ms(3초)에서 10000ms(10초) 사이로 랜덤

  useEffect(() => {
    const move = () => {
      // 움직임의 방향과 속도를 각 사이클마다 랜덤하게 결정
      const newMoveX = Math.random() > 0.5 ? 1 : -1;
      const newMoveY = Math.random() > 0.5 ? 1 : -1;
      const newSpeed = Math.random() * 7000 + 3000;

      Animated.sequence([
        Animated.timing(position, {
          toValue: {
            x: newMoveX * (windowWidth - size), // 수정된 경계값 적용
            y: newMoveY * (windowHeight - size + verticalBoundaryOffset), // 수정된 경계값 적용
          },
          duration: newSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: { x: 0, y: 0 },
          duration: newSpeed,
          useNativeDriver: true,
        }),
      ]).start(() => move()); // 이동 후 다시 move 함수 호출
    };

    move();
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.5,
        },
        position.getLayout(),
      ]}
    />
  );
};

const AnimatedImage = ({ source, width, height }) => {
  const animation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const moveUpAndDown = () => {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => moveUpAndDown());
    };

    moveUpAndDown();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: animation }] }}>
      <Image source={source} style={{ width: width, height: height, alignSelf: 'center', marginBottom: 40,}} />
    </Animated.View>
  );
};


function PlantPickScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [questionIndex, setQuestionIndex] = useState(1);
  const [answers, setAnswers] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState('');
  const [moodAnswer, setMoodAnswer] = useState('');
    const [moodErrorMessage, setMoodErrorMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedPlantImage, setSelectedPlantImage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);

        // Firestore에서 닉네임 가져오기
        const userRef = doc(firestore, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setNickname(docSnap.data().nickname); // 닉네임 상태 업데이트
        } else {
          console.log('No such document!');
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setNickname(''); // 로그아웃 시 닉네임 초기화
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      // 로그아웃 성공 시 처리
      console.log('User logged out');
      setIsLoggedIn(false);
      setUser(null);
    }).catch((error) => {
      // 오류 처리
      console.error('Logout error:', error);
    });
  };

  const handleLogoPress = () => {
    navigation.navigate('Home');
  };


    // result 값에 따라 selectedPlantImage 업데이트
      useEffect(() => {
        switch (result) {
          case '캣닢':
            setSelectedPlantImage('./image/catgrass_select.png');
            break;
          case '바질':
            setSelectedPlantImage('./image/basil_select.png');
            break;
          case '방울토마토':
            setSelectedPlantImage('./image/tomato_select.png');
            break;
          case '상추':
            setSelectedPlantImage('./image/lettuce_select.png');
            break;
          case '당근':
            setSelectedPlantImage('./image/carrot_select.png');
            break;
          case '기타식물':
            setSelectedPlantImage('./image/extra_select.png');
            break;
          default:
            setSelectedPlantImage(''); // 기본값이나 에러 이미지 경로를 설정할 수 있습니다.
        }
      }, [result]);


  const handleAnswer = (answer) => {
    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);
    setQuestionIndex(questionIndex + 1);

    if (questionIndex === 5) {
      const testResult = getResultFromAnswers(updatedAnswers);
      setResult(testResult);
    }
  };

   const handleSaveResult = async () => {
     // 전화번호 형식 검증 (하이픈 포함 여부 확인)
     if (!/^[0-9]{11}$/.test(phoneNumber)) {
       if (/[^\d]/.test(phoneNumber)) {
         // 특수문자 포함 오류 메시지
         setErrorMessage('숫자 이외에는 입력할 수 없습니다');
       } else {
         // 올바르지 않은 형식 오류 메시지
         setErrorMessage('올바른 전화번호 형식이 아닙니다');
       }
       return; // 함수 실행 중단
     }

     // 이후 로직은 기존대로 진행
     setErrorMessage(''); // 에러 메시지 초기화
     const resultRef = doc(firestore, 'results', phoneNumber);
     const docSnap = await getDoc(resultRef);

     if (docSnap.exists()) {
       // 전화번호가 이미 데이터베이스에 존재함
       setErrorMessage('이미 등록된 전화번호입니다.');
     } else {
       // 데이터베이스에 전화번호와 결과 저장
       try {
         await setDoc(resultRef, {
           phoneNumber,
           result: getResultFromAnswers(answers),
           moodAnswer,
         });
         console.log('Result saved successfully!');
         // 결과 저장 후 홈 페이지로 이동
         navigation.navigate('Home');
       } catch (error) {
         console.error('Error saving result:', error);
         setErrorMessage('결과를 저장하는 동안 오류가 발생했습니다.');
       }
     }
   };


  const getResultFromAnswers = (answers) => {
    // 답변을 문자열로 변환하여 결과를 찾음
    const resultMapping = {
      'aaaaa': '바질',
      'aaaab': '캣닢',
      'aaaba': '상추',
      'aaabb': '캣닢',
      'aabaa': '바질',
      'aabab': '캣닢',
      'aabba': '상추',
      'aabbb': '캣닢',
      'abaaa': '당근',
      'abaab': '캣닢',
      'ababa': '당근',
      'ababb': '캣닢',
      'abbaa': '바질',
      'abbab': '캣닢',
      'abbba': '방울토마토',
      'abbbb': '캣닢',
      'baaaa': '상추',
      'baaab': '캣닢',
      'baaba': '상추',
      'baabb': '캣닢',
      'babaa': '당근',
      'babab': '캣닢',
      'babba': '당근',
      'babbb': '캣닢',
      'bbaaa': '상추',
      'bbaab': '캣닢',
      'bbaba': '상추',
      'bbabb': '캣닢',
      'bbbaa': '방울토마토',
      'bbbab': '캣닢',
      'bbbba': '방울토마토',
      'bbbbb': '캣닢',
    };
    const resultKey = answers.join('');
    return resultMapping[resultKey] || '결과를 찾을 수 없음';
  };

  const renderQuestion = () => {
    switch (questionIndex) {
      case 1:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>생각하는 반려식물의 용도는 무엇인가요?</Text>
            <View style={styles.answerContainer}>
                        <TouchableOpacity onPress={() => handleAnswer('a')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                            <AnimatedImage source={{ uri: './image/plate.png' }} width={200} height={200} />
                            <Text style={styles.answerText}>내가 자란 식물을 수확해볼래!</Text>
                            <Text style={styles.answerText}>소소한 농사의 행복을 느끼고 싶어!</Text>
                            <View style={styles.greenContainer}>
                                <Text style={styles.whiteText}>식재료로 활용하고 싶어!</Text>
                              </View>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleAnswer('b')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                            <AnimatedImage source={{ uri: './image/bouquet.png' }} width={200} height={200} />
                            <Text style={styles.answerText}>무엇보다 화사한게 최고야!</Text>
                            <Text style={styles.answerText}>식재료로 활용해도 좋지만, 굳이 그렇지 않아도 돼!</Text>
                            <View style={styles.greenContainer}>
                                <Text style={styles.whiteText}>주변을 화사하게 꾸미고 싶어!</Text>
                              </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
        );
      case 2:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>식물을 키우는 장소는 어디로 생각하나요?</Text>
            <View style={styles.answerContainer}>
                        <TouchableOpacity onPress={() => handleAnswer('a')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/sun.png' }} width={200} height={200} />
              <Text style={styles.answerText}>식물은 햇볕을 잘 받아야지!</Text>
              <Text style={styles.answerText}>화창하고 싱그럽게 기를거야</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>창가나 바깥에서 기를 수 있어!</Text>
                </View>
            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAnswer('b')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/window.png' }} width={200} height={200} />
              <Text style={styles.answerText}>우리 집은 해가 잘 안들어서 ...</Text>
              <Text style={styles.answerText}>빛이 없어도 튼튼하게 기로고 싶어</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>완전한 실내에서 기르고 싶어!</Text>
                </View>
            </View>
                        </TouchableOpacity>
                      </View>
                    </View>
        );
      case 3:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>당신이 선호하는 향기는 무엇인가요?</Text>
            <View style={styles.answerContainer}>
                        <TouchableOpacity onPress={() => handleAnswer('a')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/clover.png' }} width={200} height={200} />
              <Text style={styles.answerText}>자연에 온 느낌이야!</Text>
              <Text style={styles.answerText}>집중력이 높아질 것만 같아!</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>상쾌한 허브 향</Text>
                </View>
            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAnswer('b')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/blossom.png' }} width={200} height={200} />
              <Text style={styles.answerText}>달콤한 향으로 기분전환 하고 싶어!</Text>
              <Text style={styles.answerText}>계속 곁에 있고 싶은 느낌이 들어!</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>달콤하고 상큼한 과일 향</Text>
                </View>
            </View>
                        </TouchableOpacity>
                      </View>
                    </View>
        );
      case 4:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>식물을 키우면서 가장 중요하게 생각하는 것은 무엇인가요?</Text>
            <View style={styles.answerContainer}>
                        <TouchableOpacity onPress={() => handleAnswer('a')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/wheeling.png' }} width={200} height={200} />
              <Text style={styles.answerText}>식물이랑 나랑 함께 성장하는 기분!</Text>
              <Text style={styles.answerText}>식물도 나도 모두 소중하니까!</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>건강한 생활과 식습관</Text>
                </View>
            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAnswer('b')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/lotus.png' }} width={200} height={200} />
              <Text style={styles.answerText}>식물을 통해 정신적으로 편해지고 싶어</Text>
              <Text style={styles.answerText}>편안한 분위기 속에 있는 나!</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>아늑하고 편안한 분위기</Text>
                </View>
            </View>
                        </TouchableOpacity>
                      </View>
                    </View>
        );
      case 5:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>반려묘와 함께 하고 있나요?</Text>
            <View style={styles.answerContainer}>
                        <TouchableOpacity onPress={() => handleAnswer('a')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/sadcat.png' }} width={200} height={200} />
              <Text style={styles.answerText}>나만 고양이 없어 ...</Text>
              <Text style={styles.answerText}>고양이는 귀엽지만 ...</Text>
              <View style={styles.greenContainer}>
                  <Text style={styles.whiteText}>아니요!</Text>
                </View>
            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleAnswer('b')} style={styles.answerOption}>
                          <View style={styles.answerBackground}>
                          <AnimatedImage source={{ uri: './image/happycat.png' }} width={200} height={200} />
              <Text style={styles.answerText}>고양이 좋아!</Text>
                            <Text style={styles.answerText}>제가 바로 집사님입니다.</Text>
                            <View style={styles.greenContainer}>
                                <Text style={styles.whiteText}>물론이죠!</Text>
                              </View>
            </View>
                        </TouchableOpacity>
                      </View>
                    </View>
        );
      case 6:
            return (
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>오늘 당신의 기분을 간단하게 표현하면 어떤가요?</Text>
                <View style={styles.moodContainer}>
                <AnimatedImage source={{ uri: './image/balloon.png' }} width={400} height={400} />
                <View style={styles.inputContainer}>
                <Text style={styles.answerText}>다 들어줄게요, 무엇이든지 이야기해주세요.</Text>
                <Text style={styles.answerText}>오늘 하루 어땠나요?</Text>
                <Text style={styles.answerText}>요즘따라 드는 고민이 있나요?</Text>
                          <TextInput
                            style={styles.moodInput}
                            onChangeText={setMoodAnswer}
                            value={moodAnswer}
                            placeholder="지금 나의 감정을 적어주세요"
                          />
                          {moodErrorMessage ? <Text style={styles.errorText}>{moodErrorMessage}</Text> : null}
                          <TouchableOpacity onPress={handleSubmitMoodAnswer} style={styles.nextButton}>
                            <Text style={styles.nextButtonText}>제출하기</Text>
                          </TouchableOpacity>
                        </View>
                </View>
              </View>
            );
      default:
        return null;
    }
  };


   const handleSubmitMoodAnswer = () => {
      if (!moodAnswer.trim()) {
        setMoodErrorMessage('기분을 입력하세요'); // 사용자에게 에러 메시지 표시
        return; // 함수 실행 중단
      }
      setMoodErrorMessage(''); // 에러 메시지 초기화
      setQuestionIndex(7); // 다음 질문으로 넘어가기
    };

    const handleNewViewButtonPress = () => {
        // 전화번호 입력 뷰를 활성화하기 위해 questionIndex를 조정
        // 예를 들어, 전화번호 입력 뷰가 questionIndex 7에 위치한다고 가정할 때
        setQuestionIndex(8); // 또는 적절한 숫자로 조정
      };

      const handleGrowPlantPress = () => {
        navigation.navigate('GrowPlant'); // 'GrowPlant'는 페이지 또는 경로의 이름입니다.
      };



  return (
    <View style={styles.container}>
    <AnimatedCircle size={1000} color="#31AC66" />
          <AnimatedCircle size={850} color="#5EC75E" />
          <AnimatedCircle size={700} color="#6DD66D" />


      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={handleLogoPress} style={styles.logo}>
          <Image source={{ uri: './image/plantpickclose.png' }} style={styles.logo} />
        </TouchableOpacity>
      </View>

      {renderQuestion()}

      {questionIndex > 6 && questionIndex < 8 && ( // 조건을 수정하여 새로운 뷰가 적절한 시점에 표시되도록 함
            <View style={styles.questionContainer}>
                            <Text style={styles.questionText}>당신의 라이프 스타일에 적합한 식물은 다음과 같아요</Text>
                            <View style={styles.moodContainer}>
                            <View style={styles.inputContainer}>
                            <View style={styles.plantImageBackground}>
                                      <Image source={{ uri: selectedPlantImage }} style={styles.plantImage} />
                                    </View>
                            <Text style={styles.resultText}>{result}</Text>
                            </View>

                                            <View style={styles.inputContainer}>

              <TouchableOpacity onPress={handleGrowPlantPress} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>'쑥쑥 자라고 있어요'에 추가하기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNewViewButtonPress} style={styles.whiteButton}>
                              <Text style={styles.whiteButtonText}>포토부스 팝업이벤트 참가하기</Text>
                            </TouchableOpacity>
            </View>
            </View>
            </View>
          )}

          {questionIndex >= 8 && ( // questionIndex 조건 수정
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>당신의 라이프 스타일에 적합한 식물은 다음과 같아요</Text>
                                          <View style={styles.moodContainer}>
                                          <AnimatedImage source={{ uri: './image/camera.png' }} width={400} height={400} />
              <View style={styles.inputContainer}>
                              <Text style={styles.answerText}>포토부스 이벤트 참여를 위한 개인정보 수집이 필요합니다.</Text>
                              <Text style={styles.answerText}>이벤트 참여 후 사진 출력이 완료되면</Text>
                              <Text style={styles.answerText}>등록해주신 연락처로 문자메세지를 드려요!</Text>
                <TextInput
                  style={styles.moodInput}
                  onChangeText={setPhoneNumber}
                  value={phoneNumber}
                  keyboardType="phone-pad"
                  placeholder="전화번호를 적어주세요"
                />
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TouchableOpacity onPress={handleSaveResult} style={styles.nextButton}>
                  <Text style={styles.saveButtonText}>등록하기</Text>
                </TouchableOpacity>
              </View>
            </View>
            </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#BDECB6', // 전체 배경 색상 설정
      minHeight: windowHeight,
      overflow: 'hidden',
    },

  logoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  logo: {
    width: 30,
    height: 30,
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  questionText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '900',
    fontSize: 36,
    marginBottom: 60,
    textAlign: 'center', // 텍스트를 수평 중앙으로 정렬
  },
   answerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    answerOption: {
      flex: 1, // 각 옵션을 공간에 균등하게 분배
      marginHorizontal: 80, // 옵션 간의 간격
    },
    answerBackground: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)', // 흰색 배경에 약간의 투명도 적용
      borderRadius: 10, // 둥근 모서리
      padding: 10, // 내부 여백
      width: 600,
      height: 600,
      alignItems: 'center',
      justifyContent: 'center',
    },
  answerText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center', // 텍스트를 수평 중앙으로 정렬
  },
  greenContainer: {
    backgroundColor: '#31ac66', // 초록색 배경
    borderRadius: 20, // 둥근 모서리
    padding: 10, // 내부 여백
    marginTop: 30, // 텍스트와의 간격
    alignItems: 'center', // 내부 텍스트를 중앙으로 정렬
    width: '70%',
    shadowColor: '#000', // iOS 그림자 색상
    shadowOffset: { width: 3, height: 3 }, // iOS 그림자 오프셋
    shadowOpacity: 0.25, // iOS 그림자 투명도
    shadowRadius: 3.84, // iOS 그림자 반경
    elevation: 5, // Android 그림자 높이
  },
    whiteText: {
      color: 'white', // 텍스트 색상을 흰색으로 설정
      fontWeight: '600',
      fontFamily: 'Noto Sans KR', // 폰트 설정
      fontSize: 20, // 폰트 크기
    },
  resultContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  resultText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 20,
  },
  phoneNumberContainer: {
    marginBottom: 20,
  },
  phoneNumberInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#31ac66',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  saveButtonText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    color: 'white',
    fontSize: 16,
  },

  moodInput: {
  fontFamily: 'Noto Sans KR',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 400,
    backgroundColor: 'white',
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: '#31ac66',
    padding: 16,
    alignItems: 'center',
    borderRadius: 25,
    width: 420,
    marginTop: 20,
    shadowColor: '#000', // iOS
    shadowOffset: { width: 3, height: 3 }, // iOS
    shadowOpacity: 0.25, // iOS
    shadowRadius: 3.84, // iOS
    elevation: 5, // Android
  },
  nextButtonText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    color: 'white',
    fontSize: 20,
  },
  whiteButton: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderRadius: 25,
    width: 420,
    marginTop: 30,
    shadowColor: '#000', // iOS
    shadowOffset: { width: 3, height: 3 }, // iOS
    shadowOpacity: 0.25, // iOS
    shadowRadius: 3.84, // iOS
    elevation: 5, // Android
  },
    whiteButtonText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '700',
      color: 'black',
      fontSize: 20,
    },
  errorText: {
  fontFamily: 'Noto Sans KR',
      color: 'red',
      fontSize: 14,
      marginBottom: 10,
    },

    moodContainer: {
    flexDirection: 'row', // 요소들을 가로로 배치
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // 흰색 배경에 약간의 투명도 적용
          borderRadius: 10, // 둥근 모서리
          padding: 10, // 내부 여백
          width: 1300,
          height: 600,
          alignItems: 'center',
          justifyContent: 'center',
        },
        inputContainer: {
          marginLeft: 120, // balloon 이미지와의 간격
          justifyContent: 'center', // 세로 중앙 정렬
          alignItems: 'center', // 가로 중앙 정렬
        },
        plantImageBackground: {
          backgroundColor: 'white', // 이미지 뒤에 흰색 배경
          borderRadius: 200, // 이미지를 동그랗게 만듦 (이 값은 이미지 크기의 절반으로 설정하세요)
          width: 400, // 이미지의 너비
          height: 400, // 이미지의 높이
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },

        plantImage: {
          width: 400, // 실제 이미지의 너비, 배경보다 조금 작게 설정
          height: 400, // 실제 이미지의 높이, 배경보다 조금 작게 설정
        },
});

export default PlantPickScreen;