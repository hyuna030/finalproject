// HomeScreen.tsx
import React from 'react';
import { ScrollView, Image, Text, View, StyleSheet, TextInput, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const logoImage = require('./image/flowe_wide.png');
const userImage = require('./image/user.png');
const notificationImage = require('./image/bell.png');
const flower5 = require('./image/flower5.png');
const flower6 = require('./image/flower6.png');

function HomeScreen({ user }) {
  const navigation = useNavigation();

  const handleUserImagePress = () => {
    if (user) {
      // 로그인 상태라면 프로필 페이지로 이동
      navigation.navigate('Profile');
    } else {
      // 로그인 상태가 아니라면 로그인 페이지로 이동
      navigation.navigate('Login');
    }
  };
   return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.topContainer}>
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logo} />
            </View>
            <View style={styles.userNotificationContainer}>
              <TouchableOpacity onPress={handleUserImagePress}>
                <Image source={userImage} style={styles.icon} />
              </TouchableOpacity>
              <Image source={notificationImage} style={styles.icon} />
            </View>
          </View>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="검색어를 입력해주세요"
                    placeholderTextColor="#A9A9A9"
                  />
                </View>
                <Text style={styles.boldText}>쑥쑥 자라고 있어요</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                  <View style={styles.scrollItem}>
                    <Image source={flower5} style={styles.scrollImage} />
                    <Text style={styles.scrollTitle}>이름 지정 가능</Text>
                    <Text style={styles.scrollSubtitle}>15일차 기록 23개</Text>
                  </View>
                  <View style={styles.scrollItem}>
                    <Image source={flower6} style={styles.scrollImage} />
                    <Text style={styles.scrollTitle}>이름 지정 가능</Text>
                    <Text style={styles.scrollSubtitle}>15일차 기록 23개</Text>
                  </View>
                </ScrollView>
                <Text style={styles.boldText2}>내 친구들은 지금</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>신지훈 님</Text>
                    <Text style={styles.smalltext}>3시간 전</Text>
                  </View>

                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>정현아 님</Text>
                    <Text style={styles.smalltext}>5시간 전</Text>
                  </View>

                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>김글미 님</Text>
                    <Text style={styles.smalltext}>6시간 전</Text>
                  </View>
                </ScrollView>
                <Text style={styles.boldText2}>내 주위 사람들은 지금</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>꽃재배퀸 님</Text>
                    <Text style={styles.smalltext}>숭실대학교 중앙광장</Text>
                  </View>

                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>김감자교수 님</Text>
                    <Text style={styles.smalltext}>조만식기념관</Text>
                  </View>

                  <View style={styles.scrollItemContainer}>
                    <View style={styles.scrollItem2}>
                      {/* 컨테이너 내용 */}
                    </View>
                    <Text style={styles.multiText}>고구마짝 님</Text>
                    <Text style={styles.smalltext}>노량진 수산시장</Text>
                  </View>
                </ScrollView>
                <Text style={styles.boldText2}>이야기 나눠요</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
      flex: 1,
    },
    container: {
      paddingHorizontal: Dimensions.get('window').width * 0.03,
      paddingVertical: Dimensions.get('window').width * 0.04, // 원하는 만큼의 상단 여백 추가
      backgroundColor: '#FFF',
    },
    topContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoContainer: {
      flex: 1,
    },
    logo: {
      width: Dimensions.get('window').width * 0.3,
      height: Dimensions.get('window').width * 0.08,
    },
    userNotificationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      width: Dimensions.get('window').width * 0.06,
      height: Dimensions.get('window').width * 0.06,
      marginLeft: Dimensions.get('window').width * 0.03,
    },
    searchContainer: {
      marginTop: Dimensions.get('window').width * 0.035,
      marginBottom: Dimensions.get('window').width * 0.03,
      backgroundColor: '#F0F0F0',
      borderRadius: 20,
      paddingVertical: Dimensions.get('window').width * 0.01,
      paddingHorizontal: Dimensions.get('window').width * 0.01,
    },
    searchInput: {
      fontFamily: 'NotoSansKR-Regular',
      fontSize: Dimensions.get('window').width * 0.04,
      color: '#000',
      borderRadius: 20,
      borderWidth: Dimensions.get('window').width * 0.015,
      borderColor: '#F0F0F0',
      paddingVertical: Dimensions.get('window').width * 0.001,
      paddingHorizontal: Dimensions.get('window').width * 0.02,
    },
    boldText: {
      fontFamily: 'NotoSansKR-Bold',
      color: '#000',
      lineHeight: Dimensions.get('window').width * 0.06,
      marginTop: Dimensions.get('window').width * 0.06,
      marginBottom: Dimensions.get('window').width * 0.04,
      fontSize: Dimensions.get('window').width * 0.052,
    },
    boldText2: {
      fontFamily: 'NotoSansKR-Bold',
      color: '#000',
      lineHeight: Dimensions.get('window').width * 0.06,
      marginTop: Dimensions.get('window').width * 0.12,
      marginBottom: Dimensions.get('window').width * 0.025,
      fontSize: Dimensions.get('window').width * 0.052,
    },
    scrollContainer: {
      marginTop: Dimensions.get('window').width * 0.003,
    },
    scrollItem: {
      width: Dimensions.get('window').width * 0.7,
      height: Dimensions.get('window').width * 0.7 * 0.5,
      backgroundColor: '#FFFFFF',
      borderRadius: Dimensions.get('window').width * 0.03,
      padding: Dimensions.get('window').width * 0.02,
      marginVertical: Dimensions.get('window').width * 0.008,
      marginRight: Dimensions.get('window').width * 0.056,
      elevation: 6,
      shadowColor: '#111',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
    },
    scrollImage: {
      width: Dimensions.get('window').width * 0.22,
      height: Dimensions.get('window').width * 0.22,
    },
    scrollTitle: {
      fontFamily: 'NotoSansKR-Bold',
      color: '#000',
      lineHeight: Dimensions.get('window').width * 0.05,
      fontSize: Dimensions.get('window').width * 0.035,
      marginBottom: Dimensions.get('window').width * 0.001,
    },
    scrollSubtitle: {
      fontFamily: 'NotoSansKR-Regular',
      fontSize: Dimensions.get('window').width * 0.03,
      lineHeight: Dimensions.get('window').width * 0.05,
      color: '#555',
    },
    multiContainer: {
      marginTop: Dimensions.get('window').width * 0.001,
    },
    multiItem: {
      width: Dimensions.get('window').width * 0.7,
      height: Dimensions.get('window').width * 0.7,
      backgroundColor: '#F0F0F0',
      borderRadius: Dimensions.get('window').width * 0.03,
      padding: Dimensions.get('window').width * 0.02,
      marginVertical: Dimensions.get('window').width * 0.008,
      marginRight: Dimensions.get('window').width * 0.056,
    },
    multiText: {
      fontFamily: 'NotoSansKR-Bold',
      color: '#000',
      lineHeight: Dimensions.get('window').width * 0.06,
      fontSize: Dimensions.get('window').width * 0.04,
      marginTop: Dimensions.get('window').width * 0.018,
    },
    scrollItem2: {
      width: Dimensions.get('window').width * 0.7 * 0.5,
      height: Dimensions.get('window').width * 0.7 * 0.5,
      backgroundColor: '#EAEAEA',
      borderRadius: Dimensions.get('window').width * 0.03,
      padding: Dimensions.get('window').width * 0.02,
      marginVertical: Dimensions.get('window').width * 0.008,
      marginRight: Dimensions.get('window').width * 0.028,
    },
    smalltext: {
      fontFamily: 'NotoSansKR-Regular',
      fontSize: Dimensions.get('window').width * 0.03,
      lineHeight: Dimensions.get('window').width * 0.04,
      marginTop: Dimensions.get('window').width * 0.008,
    },
});

export default HomeScreen;
