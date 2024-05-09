import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { auth, firestore } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


function EmailPolicyScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');

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
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                                  <Text style={styles.linkText}>마이페이지</Text>
                                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout}>
                  <Text style={styles.linkText}>로그아웃</Text>
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
                                    <Text style={styles.menuText}>About Us</Text>
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
                              <Text style={styles.titleText}>이메일무단수집거부</Text>
                              <View style={styles.emailContainer}>
                                    <Image source={{ uri: './image/email_icon.png' }} style={styles.email} />
                              </View>
                              <Text style={styles.contentText}>
                                {"본 플라위 서비스는 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단 수집되는 것을 거부하며위 이를 위반 시 『정보통신망이용촉진및정보보호등에관한법률』 등에 의해 처벌 받을 수 있습니다.\n\n" +
                                "이메일을 기술적 장치를 사용하여 무단으로 수집, 판매, 유통하거나 이를 이용한 자는 [정보통신망이용촉진 및 정보보호 등에 관한 법률] 제 50조의 2 규정에 의하여 1천만원 이하의 벌금형에 처해집니다.\n\n" +
                                "만일, 위와 같은 기술적 장치를 사용한 이메일 주소 무단수집 피해를 당하신 경우 [불법스팸대응센터] 전용전화 (T.1336)나 홈페이지 (www.spamcop.or.kr)의 신고창을통하여 신고하여 주시기 바랍니다. [정보통신망법 제 50조의 2 (전자우편주소의 무단 수집행의 등 금지)]\n\n" +
                                "① 누구든지 전자우편주소의 수집을 거부하는 의사가 명시된 인터넷 홈페이지에서 자동으로 전자우편주소 수집하는 프로그램 그 밖의 기술적 장치를 이용하여 전자 우편주소를 수집하여서는 아니된다.\n" +
                                "② 누구든지 제 1항의 규정을 위반하여 수집된 전자우편주소를 판매/유통 하여서는 아니된다.\n" +
                                "③ 누구든지 제1항 및 제2항의 규정에 의하여 수집/판매 및 유통이 금지된 전자우편주소임을 알고 이를 정보전송에 이용하여서는 아니된다."}
                              </Text>

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
      contentContainer: {
              alignItems: 'center',
              marginTop: 10,
              marginLeft: 180,
              marginRight: 180,
              marginBottom: 100,
            },
            emailContainer: {
                marginBottom: 30,
            },
            email: {
                width: 140,
                height: 120,
            },
            titleText: {
              fontFamily: 'Noto Sans KR',
              fontWeight: '700',
              fontSize: 20,
              color: '#333333',
              marginBottom: 30,
            },
            contentText: {
              fontFamily: 'Noto Sans KR',
              fontWeight: '500',
              fontSize: 16,
              color: '#333333',
              textAlign: 'left', // 텍스트를 왼쪽 정렬
                  lineHeight: 24, // 줄 간격 조정
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
});

export default EmailPolicyScreen;