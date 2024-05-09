import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TouchableWithoutFeedback, Modal, TextInput, Button, Alert, ScrollView, FlatList } from 'react-native';
import { auth, firestore } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, addDoc, Timestamp, updateDoc, increment, where, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { animated, useSpring } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import moment from 'moment';
import HeartFloatAnimation from './HeartFloatAnimation';


function HomeScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(1);
  const bannerInterval = useRef(null);
  const [nickname, setNickname] = useState(''); // 닉네임 상태 추가

      const [plantType, setPlantType] = useState('');
      const [plantName, setPlantName] = useState('');
      const [wateringCycle, setWateringCycle] = useState('');
      const [startDate, setStartDate] = useState('');
      const [plants, setPlants] = useState([]);
      const [modalContent, setModalContent] = useState('plantInfo');
      const [selectedPlantImage, setSelectedPlantImage] = useState(null);

      const [warningMessage, setWarningMessage] = useState('');

      const [plantDetailsModalVisible, setPlantDetailsModalVisible] = useState(false);
      const [selectedPlant, setSelectedPlant] = useState(null);

      const [scrollEnabled, setScrollEnabled] = useState(true);

      const [announcements, setAnnouncements] = useState([]);

        useEffect(() => {
          const fetchAnnouncements = async () => {
            // 'announcements' 컬렉션에서 'createdAt' 필드 기준으로 내림차순 정렬
            const q = query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedAnnouncements = [];
            querySnapshot.forEach((doc) => {
              const announcementData = { id: doc.id, ...doc.data() };
              fetchedAnnouncements.push(announcementData);
            });
            setAnnouncements(fetchedAnnouncements);
          };

          fetchAnnouncements();
        }, []);

        const handleAnnouncementClick = (announcement) => {
          navigation.navigate('Announcement', { announcementId: announcement.id });
        };


        const renderAnnouncement = ({ item }) => {
          let imageUrl = './image/default.png'; // 기본 이미지 설정

          // 제목에 따른 이미지 경로 설정
          if (item.title.includes('[공지]')) {
            imageUrl = './image/announcement.png';
          } else if (item.title.includes('[안내]')) {
            imageUrl = './image/notification.png';
          } else if (item.title.includes('[이벤트]')) {
            imageUrl = './image/event.png';
          }

          return (
            <TouchableOpacity onPress={() => handleAnnouncementClick(item)}>
              <View style={styles.announcementContainer}>
                <Image source={{ uri: imageUrl }} style={styles.friendCard} />
                <Text style={styles.nameText}>{item.title.length > 12 ? `${item.title.substring(0, 12)}..` : item.title}</Text>
              </View>
            </TouchableOpacity>
          );
        };



  useEffect(() => {
    bannerInterval.current = setInterval(() => {
      setCurrentBanner(prevBanner => prevBanner < 3 ? prevBanner + 1 : 1);
    }, 5000);

    return () => clearInterval(bannerInterval.current);
  }, []);




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


        const handleBannerClick = (bannerNumber) => {
            navigation.navigate(`Banner${bannerNumber}`);
          };

          const handleBannerChange = (direction) => {
            clearInterval(bannerInterval.current);
            setCurrentBanner(prevBanner => {
              if (direction === 'left') {
                return prevBanner === 1 ? 3 : prevBanner - 1;
              } else {
                return prevBanner === 3 ? 1 : prevBanner + 1;
              }
            });
            bannerInterval.current = setInterval(() => {
              setCurrentBanner(prevBanner => prevBanner < 3 ? prevBanner + 1 : 1);
            }, 5000);
          };

          const fetchPlants = async () => {
                if (!isLoggedIn || !user) {
                  setPlants([]);
                  return;
                }
                const q = query(collection(firestore, 'plants'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const plantsData = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setPlants(plantsData);
              };

              // useEffect 내에서 fetchPlants 함수 호출
              useEffect(() => {
                fetchPlants();
              }, [isLoggedIn, user]);


              const handleAddPlantClick = () => {
                if (!isLoggedIn) {
                  navigation.navigate('Login');
                } else {
                  navigation.navigate('GrowPlant');
                }
              };


                  const CalendarComponent = ({ onConfirm, initialDate, returnToPreviousModal }) => {
                      // 기존 코드...
                    const today = new Date();
                    const [currentDate, setCurrentDate] = useState(today);
                    const [selectedDay, setSelectedDay] = useState(initialDate || moment().format('YYYY-MM-DD'));


                    const handleConfirm = () => {
                        onConfirm(selectedDay); // 부모 컴포넌트로 선택된 날짜를 전달
                      };

                      const handleBackButton = () => {
                              // 'modalView' 상태에 따라 다른 동작을 수행
                              returnToPreviousModal();
                          };


                    const onDaySelect = (day) => {
                      const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      setSelectedDay(moment(newSelectedDate).format('YYYY-MM-DD')); // 선택된 날짜 상태를 업데이트합니다.
                      onDateChange(newSelectedDate); // 부모 컴포넌트에 선택된 날짜를 전달합니다.
                    };

                    const daysInMonth = (month, year) => {
                      return new Date(year, month + 1, 0).getDate();
                    };

                    const onPrevMonth = () => {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                    };

                    const onNextMonth = () => {
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
                    };



                    const headers = ['일', '월', '화', '수', '목', '금', '토'];

                      const renderHeader = () => {
                        return headers.map((day, index) => (
                          <Text key={index} style={styles.headerText}>{day}</Text>
                        ));
                      };

                    const renderDays = () => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const firstDayOfMonth = new Date(year, month, 1).getDay();
                      const numberOfDays = daysInMonth(month, year);
                      const lastDayOfMonth = new Date(year, month, numberOfDays).getDay();

                      let days = [];
                      // 첫 주의 공백 추가
                      for (let i = 0; i < firstDayOfMonth; i++) {
                        days.push(<View key={`empty-start-${i}`} style={styles.day} />);
                      }

                      // 날짜 추가
                      for (let day = 1; day <= numberOfDays; day++) {
                          const dayDate = new Date(year, month, day);
                          const dayString = moment(dayDate).format('YYYY-MM-DD');
                          const isSelected = dayString === selectedDay; // 현재 날짜가 선택된 날짜인지 확인
                          const isToday = dayString === moment().format('YYYY-MM-DD'); // 현재 날짜가 오늘인지 확인

                          days.push(
                            <TouchableOpacity
                              key={day}
                              style={[styles.day, isSelected && styles.selectedDay]} // 선택된 날짜일 경우 스타일을 추가합니다.
                              onPress={() => setSelectedDay(dayString)} // 날짜를 선택할 때 상태를 업데이트합니다.
                            >
                              <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>{day}</Text>
                            </TouchableOpacity>
                          );
                        }

                      // 마지막 주의 공백 추가
                      for (let i = lastDayOfMonth; i < 6; i++) {
                        days.push(<View key={`empty-end-${i}`} style={styles.day} />);
                      }

                      return days;
                    };




                    return (
                        <View>
                        <View style={styles.modalHeader}>
                           <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
                                 <Image source={{ uri: './image/leftarrow.png' }} style={styles.backButtonImage} />
                           </TouchableOpacity>
                           <Text style={styles.calendarHeaderText}>날짜 선택하기</Text>
                           <TouchableOpacity onPress={handleConfirm} style={styles.completeButton}>
                                <Text style={styles.completeButtonText}>완료</Text>
                           </TouchableOpacity>
                        </View>
                        <View style={styles.calendarContainer}>
                          <View style={styles.calendarNav}>
                            <TouchableOpacity onPress={onPrevMonth}>
                              <Text style={styles.navButton}>{"<"}</Text>
                            </TouchableOpacity>
                            <Text style={styles.monthYearText}>{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</Text>
                            <TouchableOpacity onPress={onNextMonth}>
                              <Text style={styles.navButton}>{">"}</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.headerRow}>
                            {renderHeader()}
                          </View>
                          <View style={styles.daysContainer}>
                            {renderDays()}
                          </View>
                          </View>
                        </View>
                      );
                    };


                  useEffect(() => {
                      const fetchPlants = async () => {
                          if (!isLoggedIn || !user) {
                              setPlants([]);
                              return;
                          }
                          const q = query(collection(firestore, 'plants'), where('userId', '==', user.uid));
                          const querySnapshot = await getDocs(q);
                          let plantsData = querySnapshot.docs.map(doc => ({
                              id: doc.id,
                              ...doc.data(),
                          }));

                          // 키운 날짜를 기준으로 식물 데이터 정렬
                          plantsData.sort((a, b) => {
                              const aStartDate = moment(a.startDate, 'YYYY-MM-DD');
                              const bStartDate = moment(b.startDate, 'YYYY-MM-DD');
                              return bStartDate.diff(aStartDate); // 최신 식물이 먼저 오도록 정렬
                          });

                          setPlants(plantsData);
                      };

                      fetchPlants();
                  }, [isLoggedIn, user]);



        const scrollViewRef = useRef(null);
              let isDragging = false;
              let startPos = 0;
              let scrollStartPos = 0;

              const [isScrolling, setIsScrolling] = useState(false);



              // 마우스 버튼을 누를 때 호출됩니다.
              const onMouseDown = (e) => {
                // 모달이 열려있지 않을 때만 드래깅 상태를 활성화합니다.
                if (true) {
                  isDragging = true;
                  startPos = e.clientX;
                  scrollStartPos = scrollViewRef.current.scrollLeft;
                }
              };

              // 마우스를 움직일 때 호출됩니다.
              const onMouseMove = (e) => {
                // 모달이 열려있지 않고 드래깅 중일 때만 스크롤을 조정합니다.
                if (isDragging) {
                  setIsScrolling(true); // 마우스를 움직이기 시작하면 스크롤 중으로 설정
                  const move = e.clientX - startPos;
                  scrollViewRef.current.scrollTo({ x: scrollStartPos - move, animated: false });
                }
              };

              // 마우스 버튼을 놓을 때 호출됩니다.
              const onMouseUp = () => {
                // 모달이 열려있지 않을 때만 드래깅 상태를 비활성화합니다.
                if (isDragging) {
                  isDragging = false;
                  setTimeout(() => setIsScrolling(false), 100); // 스크롤 상태를 해제하는데 약간의 지연을 줍니다.
                }
              };




            // 식물 목록 표시 컴포넌트 (식물 이름과 키운 기간 계산)
                 const PlantContainer = ({ plants }) => {




                   return plants.map((plant, index) => {
                     // 등록일로부터 현재까지의 일수 계산
                     const startDate = moment(plant.startDate);
                     const today = moment();
                     const daysGrowing = today.diff(startDate, 'days') + 1; // 등록일 포함하여 계산

                     // 호감도에 따라 식물 이미지 선택
                         let plantImage;
                         if (plant.affection < 10) {
                           plantImage = {uri: `./image/flowerpot.png`};
                         } else if (plant.affection < 25) {
                           plantImage = {uri: `./image/sprout.png`};
                         } else {
                           // 식물의 종류에 따라 이미지 선택
                           let imageName;
                           switch (plant.type) {
                           case '바질':
                                                  imageName = plant.affection < 45 ? 'basil1' : 'basil2';
                                                  break;
                             case '당근':
                               imageName = plant.affection < 45 ? 'carrot1' : 'carrot2';
                               break;
                               case '캣그라스':
                                                      imageName = plant.affection < 45 ? 'catgrass1' : 'catgrass2';
                                                      break;
                             case '상추':
                               imageName = plant.affection < 45 ? 'lettuce1' : 'lettuce2';
                               break;
                             case '토마토':
                               imageName = plant.affection < 45 ? 'tomato1' : 'tomato2';
                               break;
                             case '기타식물':
                               imageName = plant.affection < 45 ? 'extra1' : 'extra2';
                               break;
                             // 추가된 식물에 대한 경우도 추가
                             default:
                               // 기본 이미지 사용
                               imageName = 'default';
                           }
                           plantImage = {uri: `./image/${imageName}.png`};
                         }

                     return (
                       <TouchableOpacity
                                       key={index}
                                       onPress={() => {
                                           if (!isScrolling) {
                                               handleAddPlantClick();
                                           }
                                       }}
                                   >
                                 <View style={styles.card}>
                                           <View style={styles.plantCardInner}>

                                                       <Image source={plantImage} style={[styles.cardlinkImage, { backgroundColor: '#F7F7F7'}]} />

                                                     <View style={styles.plantTextContainer}>
                                                       <Text style={styles.plantName}>{plant.name}</Text>
                                                       <Text style={styles.plantDays}>{`키운지 ${daysGrowing}일`}</Text>

                                                     </View>
                                                   </View>
                                 </View>
                               </TouchableOpacity>
                     );
                   });
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

      <View style={styles.bannerContainer}>
                             <TouchableOpacity onPress={() => handleBannerChange('left')} style={styles.leftArrow}>
                               <Image source={{ uri: './image/left_arrow.png' }} style={styles.arrowButton} />
                             </TouchableOpacity>
                             <TouchableOpacity>
                               <Image
                                 source={{
                                   uri: currentBanner === 1 ? './image/banner1.png'
                                       : currentBanner === 2 ? './image/banner2.png'
                                       : './image/banner3.png'
                                 }}
                                 style={styles.bannerImage}
                               />
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => handleBannerChange('right')} style={styles.rightArrow}>
                               <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowButton} />
                             </TouchableOpacity>
                           </View>
                           <View>

      {/* '쑥쑥 자라고 있어요' 텍스트 왼쪽 정렬 */}
      <View style={styles.subtitleContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('GrowPlant')}>
        <Text style={styles.subtitle}>쑥쑥 자라고 있어요</Text>
        </TouchableOpacity>
      </View>

      {/* 컨테이너들 왼쪽 정렬 */}
      <View style={styles.cardsContainer}>
                <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.scrollViewContent}
                      ref={scrollViewRef}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseLeave={onMouseUp}
                      onMouseUp={onMouseUp}
                    >
                  <PlantContainer plants={plants} />

                  <TouchableOpacity
                                  onPress={() => {
                                      if (!isScrolling) {
                                          handleAddPlantClick();
                                      }
                                  }}
                              >
                    <View style={styles.addPlantCard}>
                      <Text style={styles.addPlantButtonText}>+</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
              </View>

      {/* 왼쪽 섹션 */}
      <View style={styles.sectionContainer}>
      <View style={styles.leftContainer}>
        <View style={styles.leftSection}>


<Text style={{ ...styles.subtitle, marginLeft: 18 }}>식물추천 테스트</Text>

          <TouchableOpacity onPress={() => navigation.navigate('PlantPick')}>
                              <View style={styles.card}>
                                <View style={styles.cardlinkContent}>
                                  <Image source={{ uri: './image/testgif.gif' }} style={[styles.cardlinkImage, { backgroundColor: '#F7F7F7'}]} />
                                  <Text style={styles.cardlinkText}>AI가 추천하는{'\n'}나만의 식물 알아보기</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                            </View>
                            <View style={styles.leftSection}>

          <Text style={{ ...styles.subtitle, marginLeft: 18 }}>About Us</Text>

                    <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
                                        <View style={styles.card}>
                                          <View style={styles.cardlinkContent}>
                                            <Image source={{ uri: './image/aboutus.gif' }} style={[styles.cardlinkImage, { backgroundColor: '#F7F7F7'}]} />
                                            <Text style={styles.cardlinkText}>플라위는{'\n'}이렇게 만들어졌어요</Text>
                                          </View>
                                        </View>
                                      </TouchableOpacity>

        </View>
        </View>

        {/* 오른쪽 섹션 */}
        <View style={styles.rightSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Announcement')}>
          <Text style={styles.subtitle}>공지사항</Text>
          </TouchableOpacity>
          {/* 오른쪽 컨테이너들 */}
          <View style={styles.friendGroup}>
            <FlatList
                    data={announcements}
                    renderItem={renderAnnouncement}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  />
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
    marginBottom: 20,
  },
  logo: {
    width: 300,
    height: 85,
  },
  bannerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      },
      bannerImage: {
        width: 1800,
        height: 370,
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
  subtitleContainer: {
    alignSelf: 'flex-start',
    marginLeft: 60,
    marginTop: 20,
  },
  subtitle: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 20,
  },
  cardsContainer: {
          flexDirection: 'row',
          justifyContent: 'flex-start',
          height: 240,
          marginTop: 10,
          marginBottom: 10,
          marginLeft: 20,
          paddingHorizontal: 20,
        },
        scrollViewContent: {
                flexDirection: 'row', // 가로 방향으로 내용을 배열
                alignItems: 'center', // 내용을 중앙 정렬
              },
        card: {
          backgroundColor: 'white',
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          padding: 10,
          width: 400,
          height: 200,
          marginLeft: 20,
          marginTop: 20,

          marginBottom: 20,
        },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 5,
  },
  cardInfo: {
    fontFamily: 'Noto Sans KR',
    fontSize: 14,
    color: 'grey',
  },
  sectionContainer: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 30,
  },
  leftContainer: {
  flexDirection: 'row',
  },
  leftSection: {
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: 40,
  },
  rightSection: {
    alignItems: 'flex-start',
    marginLeft: 60,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 18,
  },
  friendGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendContainer: {
    width: 170,
    marginTop: 20,
    marginBottom: 20,
  },
  friendCard: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },
  nameText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 18,
  },
  timeText: {
    fontFamily: 'Noto Sans KR',
    fontSize: 14,
    color: 'grey',
  },

  plantsContainer: {
              flexDirection: 'row', // 아이템을 가로로 배치
              padding: 10,
            },
            plantName: {
              fontWeight: 'bold',
            },
            plantDays: {
              marginTop: 5,
            },
          cardlinkContent: {
              flexDirection: 'row', // 가로 방향으로 아이템을 배치
              alignItems: 'center', // 세로 방향에서 중앙 정렬
              justifyContent: 'center', // 가로 방향에서 중앙 정렬
              flex: 1,
            },
            cardlinkImage: {
              width: 160,
              height: 160,
              borderRadius: 80,
              marginLeft: 10,
              marginRight: 30,
            },
            cardlinkText: {
              fontFamily: 'Noto Sans KR',
              fontWeight: '800',
              fontSize: 20,
              color: '#666666',
              textAlign: 'center',
              // 여기서 marginTop 또는 marginBottom을 조정하여 텍스트의 세로 위치를 조정할 수 있음
            },
        addPlantCard: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                padding: 10,
                width: 400,
                height: 200,
                marginLeft: 20,
                marginRight: 20,
                marginTop: 20,
                marginBottom: 20,
        },


        addPlantButtonText: {
          fontSize: 56,
          color: '#000',
          marginBottom: 10,
        },

        plantInfoModal: {
          position: 'absolute', // 모달을 절대 위치로 설정
          backgroundColor: 'white', // 배경색
          padding: 10, // 내부 패딩
          borderRadius: 10, // 모서리 둥글게
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // 그림자 효과
          width: 250, // 모달의 너비
          zIndex: 1000, // 다른 요소 위에 표시되도록 z-index 설정
        },

        boldText: {
        textAlign: 'center', // 텍스트 중앙 정렬
        fontFamily: 'NotoSansKR',
          fontWeight: 'bold',
          marginBottom: 4, // 제목과 내용 사이의 간격
        },

        normalText: {
        fontFamily: 'NotoSansKR',
        },



      modalOverlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modal: {
          width: '30%',
          height: '43%',
          backgroundColor: '#fff',
          borderRadius: 25,
          padding: 20,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          },
          modalHeaderText: {
          flex: 1,
              textAlign: 'center',
            fontFamily: 'NotoSansKR',
            fontWeight: 600,
            fontSize: 18,
            color: '#000',
            marginRight: 20,
            // 필요에 따라 추가 스타일링
          },
        modalText: {
          marginBottom: 15,
          textAlign: 'center',
          fontSize: 18,
        },
        plantTypeSelectButton: {
          padding: 10,
          margin: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: '#ddd', // 테두리 색상
          borderWidth: 2, // 테두리 두께
          borderRadius: 50, // 동그라미 모양
          width: 100, // 크기 조절
          height: 100, // 크기 조절
          backgroundColor: 'transparent', // 배경색 투명
        },

        // 식물 종류 선택 버튼 내 '+' 아이콘 스타일
        plantTypeSelectIcon: {
          fontSize: 24,
          color: '#ddd',
        },
          plantSelectionContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: 10,
          },

          plantImageContainer: {
            backgroundColor: 'white', // 배경색
            borderRadius: 14, // 테두리 둥글기
            borderWidth: 1, // 테두리 두께
              borderColor: '#cccccc',
            shadowColor: '#000', // 그림자 색상
            shadowOffset: { width: 0, height: 2 }, // 그림자 위치
            shadowOpacity: 0.25, // 그림자 투명도
            shadowRadius: 3.84, // 그림자 블러 반경
            elevation: 5, // 안드로이드용 그림자 깊이
            margin: 10, // 주변 마진으로 각 식물 이미지 사이의 공간 확보
          },

          plantImage: {
            width: 140, // 이미지 크기 조절
            height: 140,
            borderRadius: 14, // 이미지 테두리 둥글기
          },
          plantImageButton: {
            // 식물 이미지 버튼 스타일링
            padding: 5,
            width: 30,
            height: 30,
            },
            plantExplainImage: {
              position: 'absolute',
              right: -14, // 오른쪽 가장자리에서 10픽셀 떨어진 위치
              bottom: -14, // 아래쪽 가장자리에서 10픽셀 떨어진 위치
              width: 35, // 이미지의 너비
              height: 35, // 이미지의 높이
            },
            inputWithIconContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                width: '90%',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 5,
                padding: 5,
                marginVertical: 5, // 간격 조정
              },
              inputIcon: {
                width: 25,
                height: 25,
                marginRight: 10,
              },
              inputWithIcon: {
                flex: 1,
                fontFamily: 'Noto Sans KR', // 폰트 적용 (프로젝트에 폰트가 포함되어 있어야 함)
                fontWeight: 400,
                fontSize: 16,
                color: 'gray',
              },
        input: {
          width: '80%',
          margin: 10,
          padding: 10,
          borderWidth: 1,
          borderColor: 'gray',
          borderRadius: 5,
        },
        warningText: {
        fontFamily: 'Noto Sans KR',
            color: 'red', // 오류 메시지 색상을 빨간색으로 설정
          },


                              plantCardInner: {
                                  flexDirection: 'row', // 가로 방향으로 아이템을 배치
                                              alignItems: 'center', // 세로 방향에서 중앙 정렬
                                              justifyContent: 'center', // 가로 방향에서 중앙 정렬
                                              flex: 1,
                                },
                                plantTextContainer: {
                                  marginLeft: 40,
                                  marginRight: 57,
                                },
                                plantName: {
                                  fontFamily: 'Noto Sans KR',
                                                                fontWeight: "bold",
                                                                fontSize: 18,
                                                                textAlign: "center",
                                },
                                plantDays: {
                                  fontFamily: 'Noto Sans KR',
                                  fontSize: 16,
                                                                textAlign: "center",
                                },
                                plantRecords: {
                                  fontFamily: 'Noto Sans KR',
                                  fontSize: 16,
                                                                textAlign: "center",
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
    announcementContainer: {
        margin: 10,
        // 컨테이너 스타일
      },
      announcementImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        // 이미지 스타일
      },
      announcementTitle: {
        marginTop: 5,
        // 제목 스타일
      },
});

export default HomeScreen;






