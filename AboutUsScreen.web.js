import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { auth, firestore } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


function AboutUsScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [textVersion, setTextVersion] = useState(0);

    const texts = [
      {
        title: "플라위는 작은 물음에서 출발하였습니다.",
        contents: [
          "쓰다듬어주면 꼬리를 흔들어주는 강아지처럼",
          "날 부르면 도도한 얼굴로 쳐다보는 고양이처럼",
          "식물은 어째서 그럴 수 없는 것일까? 고민해보기 시작했습니다."
        ]
      },
      {
        title: "AI를 통해 사용자에게 새로운 경험을!",
        contents: [
          "그래서 팀 플로버는 AI를 활용해 서비스 이용자에게 새로운 기회를 제공하고 싶었습니다.",
          "플라위에서는 내가 기르는 식물의 성장과정을 기르면서",
          "식물과 소통을 할 수 있는 재미있는 경험을 줄 수 있었죠."
        ]
      },
      {
        title: "플라위를 통해 식물과 함께 동반 성장을,",
        contents: [
          "당신의 지친 일상에 식물이라는 존재로 회복할 수 있는 마음을 담았어요.",
          "플라위와 함께 다양한 식물을 만나보고, 함께 성장하는 경험을 느껴보세요."
        ]
      }
    ];

    const handleTextChange = () => {
      setTextVersion((prevVersion) => (prevVersion + 1) % texts.length);
    };

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

    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.linkContainer}>
            {isLoggedIn && user ? (
              <>
                <Text style={styles.linkText}>안녕하세요, {nickname}님!</Text>
                <TouchableOpacity onPress={handleLogout}>
                  <Text style={styles.linkText}>로그아웃</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                                                  <Text style={styles.linkText}>마이페이지</Text>
                                                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                  <Text style={styles.linkText}>로그인 / 회원가입  </Text>
                                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

      {/* 로고 이미지 중앙 정렬 */}
      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                <Image source={{ uri: './image/flowe_wide.png' }} style={styles.logo} />
              </TouchableOpacity>
      </View>

      {/* 메뉴 버튼 컨테이너 */}
            <View style={styles.menuContainer}>
                  <View style={styles.menuItem}>
                            <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
                              <Text style={[styles.menuText, styles.selectText]}>About Us</Text>
                            </TouchableOpacity>
                          </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('GrowPlant')}>
                        <Text style={styles.menuText}>쑥쑥 자라고 있어요</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('PlantPick')}>
                        <Text style={styles.menuText}>AI PICK 식물추천 테스트</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('Announcement')}>
                        <Text style={styles.menuText}>공지사항</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

            <View style={styles.contentContainer}>
                        <Text style={styles.titleText}>About Us</Text>
                        </View>
                                <View style={styles.contentContainer2}>
                                        <TouchableOpacity style={styles.textContainer} onPress={handleTextChange}>
                                                  <Text style={styles.title}>{texts[textVersion].title}</Text>
                                                  {texts[textVersion].contents.map((content, index) => (
                                                    <Text key={index} style={styles.content}>{content}</Text>
                                                  ))}
                                                </TouchableOpacity>
                                                <View style={styles.imageContainer}>
                                                <View style={styles.imageBackground}>
                                          <Image source={{ uri: './image/sprout.png' }} style={styles.image} />
                                        </View>
                                        </View>
                                      </View>




      {/* 하단바 */}
      <View style={styles.footer}>
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                  <Text style={styles.footerText}>개인정보처리방침</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('EmailPolicy')}>
                  <Text style={styles.footerText}>이메일무단 수집거부</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footerInfo}>
                <Text style={styles.footerInfoText}>주소 : 서울 특별시 동작구 상도로 369 (숭실대학교)  E-MAIL : flowe.ssu@gmail.com</Text>
                <Text style={styles.footerInfoText}>copyright 팀 플로버(TEAM FLOVVER)</Text>
              </View>
            </View>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topBar: {
    width: '100%',
    backgroundColor: '#31ac66',
    paddingVertical: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  linkText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    color: 'white',
    marginLeft: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 300,
    height: 85,
  },
  menuContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#cccccc',
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginTop: 30,
      marginBottom: 50,
    },
    menuItem: {
      flex: 1,
      alignItems: 'center',
    },
    menuText: {
      fontFamily: 'Noto Sans KR',
      fontWeight: '700',
      fontSize: 20,
      color: '#333333',
    },
    selectText: {
                    color: '#31ac66', // 여기에서 원하는 초록색의 hex 코드로 변경
                  },
    contentContainer: {
            alignItems: 'center',
            marginTop: 10,
            marginLeft: 180,
            marginRight: 180,
            marginBottom: 100,
          },
          titleText: {
            fontFamily: 'Noto Sans KR',
            fontWeight: '700',
            fontSize: 20,
            color: '#333333',
          },
  footer: {
        width: '100%',
        backgroundColor: '#31ac66',
        paddingVertical: 3,

      },
      footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 5,
      },
      footerText: {
        fontFamily: 'Noto Sans KR',
        fontWeight: '600',
        fontSize: 18,
        color: 'white',
        marginHorizontal: 20,
      },
      footerInfo: {
        alignItems: 'center',
        padding: 10,
      },
      footerInfoText: {
        fontFamily: 'Noto Sans KR',
        fontSize: 15,
        color: 'white',
      },
      contentContainer2: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        },
        textContainer: {
          flex: 1,
          marginRight: 20,
          alignItems: 'center',
        },
        imageContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        imageBackground: {
            width: 500,
            height: 500,
            borderRadius: 250,
            backgroundColor: '#b7b7b7',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          },
          image: {
            width: 500,
            height: 500,
          },
        title: {
          fontFamily: 'Noto Sans KR',
          fontWeight: '900',
          fontSize: 34,
          marginBottom: 10,
        },
        content: {
          fontFamily: 'Noto Sans KR',
          fontWeight: '600',
          fontSize: 24,
          marginBottom: 5,
        },
});

export default AboutUsScreen;