import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { auth, firestore } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


function AroundPeopleScreen({ navigation }) {
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
                      <TouchableOpacity onPress={() => navigation.navigate('GrowPlant')}>
                        <Text style={styles.menuText}>쑥쑥 자라고 있어요</Text>
                      </TouchableOpacity>
                    </View>
                    {/* 다른 메뉴 항목들... */}
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('EditorPick')}>
                        <Text style={styles.menuText}>에디터 PICK</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('MyFriend')}>
                        <Text style={styles.menuText}>내 친구들은 지금</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('AroundPeople')}>
                        <Text style={[styles.menuText, styles.selectText]}>내 주위 사람들은 지금</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.menuItem}>
                      <TouchableOpacity onPress={() => navigation.navigate('ShareStory')}>
                        <Text style={styles.menuText}>이야기 나눠요</Text>
                      </TouchableOpacity>
                    </View>
                  </View>


      {/* 하단바 */}
      <View style={styles.footer}>
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
                  <Text style={styles.footerText}>About us</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Announcement')}>
                  <Text style={styles.footerText}>공지사항</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Event')}>
                  <Text style={styles.footerText}>이벤트</Text>
                </TouchableOpacity>
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

export default AroundPeopleScreen;