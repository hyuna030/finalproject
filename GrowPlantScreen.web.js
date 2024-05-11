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



function GrowPlantScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
    const [plantType, setPlantType] = useState('');
    const [plantName, setPlantName] = useState('');
    const [wateringCycle, setWateringCycle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [plants, setPlants] = useState([]);
    const [modalContent, setModalContent] = useState('plantInfo');
    const [selectedPlantImage, setSelectedPlantImage] = useState(null);

    const localizer = momentLocalizer(moment);
      const [selectedDate, setSelectedDate] = useState(new Date());

    const [warningMessage, setWarningMessage] = useState('');

    const [plantDetailsModalVisible, setPlantDetailsModalVisible] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState(null);


    const [currentDiaryIndex, setCurrentDiaryIndex] = useState(0);

    const [selectedDay, setSelectedDay] = useState(moment().format('YYYY-MM-DD'));

    const [showPlantInfoModal, setShowPlantInfoModal] = useState(false);
    const [currentPlantDescription, setCurrentPlantDescription] = useState('');
    const [plantInfoModalPosition, setPlantInfoModalPosition] = useState({ x: 0, y: 0 });

    const [selectedFiles, setSelectedFiles] = useState([]);

    const [diaryDate, setDiaryDate] = useState(''); // 일기 날짜 상태
                  const [modalView, setModalView] = useState(''); // 모달 뷰 상태

    const [parentModal, setParentModal] = useState('');

    const [scrollEnabled, setScrollEnabled] = useState(true);

    const [showMenuModal, setShowMenuModal] = useState(false); // 메뉴 모달 표시 상태



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
        setModalVisible(true);
      }
    };





      const addPlant = async () => {
        setWarningMessage('');

        // 입력 필드 검증
        if (!plantType) {
            setWarningMessage('식물 종류를 선택해주세요.');
            return;
          }

          if (plantName.trim().length < 1) {
            setWarningMessage('식물 이름은 최소 1글자 이상이어야 합니다.');
            return;
          }

          if (!wateringCycle) {
            setWarningMessage('물주는 주기를 입력하세요.');
            return;
          }

          if (isNaN(wateringCycle)) {
            setWarningMessage('물주기 주기는 숫자로 입력해주세요.');
            return;
          }

          if (!startDate) {
            setWarningMessage('시작일을 설정해주세요.');
            return;
          }

        try {
          // 서버로부터 식물 MBTI 가져오기
          const mbtiResponse = await fetch('https://finalpjbackend-01758c5118d1.herokuapp.com/generate-plant-mbti', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plantType, plantName, wateringCycle, startDate }),
            mode: 'cors'
            credentials: 'include'
          });

          const mbtiData = await mbtiResponse.json();
          if (!mbtiResponse.ok) throw new Error('MBTI 생성 실패');

          // Firebase에 식물 정보 저장
          const docRef = await addDoc(collection(firestore, 'plants'), {
            type: plantType,
            name: plantName,
            wateringCycle: Number(wateringCycle),
            startDate: startDate,
            userId: user.uid,
            mbti: mbtiData.plantMBTI,
            affection: 1, // 호감도 점수 초기값 설정
          });

          Alert.alert('성공', '새 식물이 추가되었습니다: ' + mbtiData.plantMBTI);
          setModalVisible(false);
          // 식물 목록 업데이트 등의 추가 작업
          await fetchPlants();
        } catch (error) {
          console.error("식물 추가 중 에러 발생: ", error);
          Alert.alert('오류', '식물을 추가하는 동안 오류가 발생했습니다.');
        }
      };


      // 식물 종류 선택 화면으로 전환
        const showPlantSelect = () => {
          setModalContent('plantSelect');
        };

        // 식물 정보 입력 화면으로 전환
        const showPlantInfo = () => {
          setModalContent('plantInfo');
        };

        // 식물 선택 후 처리
        const handlePlantSelect = (plantType) => {
          switch(plantType) {
            case '캣그라스':
              setSelectedPlantImage('./image/catgrass_select.png');
              break;
            case '바질':
              setSelectedPlantImage('./image/basil_select.png');
              break;
            case '토마토':
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
            // 다른 식물에 대한 case 추가
            default:
              setSelectedPlantImage(null);
          }
          setPlantType(plantType);
          showPlantInfo(); // 식물 정보 입력 화면으로 전환
        };


        const handleMouseEnter = (description, event) => {
          setCurrentPlantDescription(description);
          setShowPlantInfoModal(true);
          // 모달 위치를 마우스 위치에 따라 조정
          setPlantInfoModalPosition({
            x: event.clientX-900,
            y: event.clientY-250,
          });
        };

        // 식물 설명 모달을 숨기는 함수
        const handleMouseLeave = () => {
          setShowPlantInfoModal(false);
        };







        // 날짜 선택 모달 뷰로 전환하는 함수
        const showDatePicker = () => {
          setModalContent('datePicker');
        };

        // 날짜 선택 함수
          const handleDateSelect = (date) => {
            setSelectedDate(date); // 선택된 날짜를 상태에 저장
            setModalContent('plantInfo'); // 모달 컨텐츠를 식물 정보 입력으로 변경
            // moment를 사용하여 날짜 형식 변환
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setStartDate(formattedDate); // 'YYYY-MM-DD' 형식으로 startDate에 저장
          };

          const onConfirmSelectedDate = (selectedDay) => {
              // 사용자가 선택한 날짜를 startDate 상태로 설정
              setStartDate(selectedDay);
              // 식물 정보 입력 뷰로 변경
              setModalContent('plantInfo');
            };


              // 식물 정보 입력 모달 내 달력 모달로 전환
              const showDatePickerForPlant = () => {
                setModalView('calendarForPlant');
              };

              // 일기 작성 모달 내 달력 모달로 전환
              const showDatePickerForDiary = () => {
                setModalView('calendarForDiary');
              };

              // 식물 시작일 설정 후 처리
              const onConfirmSelectedDateForPlant = (selectedDay) => {
                setStartDate(selectedDay); // 선택된 날짜를 '시작일' 상태에 저장
                setModalContent('plantInfo'); // 모달 컨텐츠를 식물 정보 입력으로 변경
              };

              // 일기 날짜 설정 후 처리
              const onConfirmSelectedDateForDiary = (selectedDay) => {
                setDiaryDate(selectedDay);
                setModalView('entryForm');
              };

              const returnToPreviousModal = () => {
                  if (modalView === 'calendarForPlant') {
                      setModalContent('plantInfo'); // 식물 등록 모달로 돌아가기
                  } else if (modalView === 'calendarForDiary') {
                      setModalView('entryForm'); // 일기 작성 모달로 돌아가기
                  }
              };



          // 달력 컴포넌트 정의
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











      const closeModal = () => {
          setModalVisible(false);
          fetchPlants();

          // 모달이 닫힐 때 상태 초기화 로직 조정
          setPlantType('');
          setPlantName('');
          setWateringCycle('');
          setStartDate('');
          setSelectedPlantImage(null);
          setWarningMessage('');
          // 달력과 관련된 상태(diaryDate)는 초기화하지 않음
        };


    const scrollViewRef = useRef(null);
      let isDragging = false;
      let startPos = 0;
      let scrollStartPos = 0;

      const [isScrolling, setIsScrolling] = useState(false);



      // 마우스 버튼을 누를 때 호출됩니다.
      const onMouseDown = (e) => {
        // 모달이 열려있지 않을 때만 드래깅 상태를 활성화합니다.
        if (!modalVisible && !plantDetailsModalVisible) {
          isDragging = true;
          startPos = e.clientX;
          scrollStartPos = scrollViewRef.current.scrollLeft;
        }
      };

      // 마우스를 움직일 때 호출됩니다.
      const onMouseMove = (e) => {
        // 모달이 열려있지 않고 드래깅 중일 때만 스크롤을 조정합니다.
        if (!modalVisible && !plantDetailsModalVisible && isDragging) {
          setIsScrolling(true); // 마우스를 움직이기 시작하면 스크롤 중으로 설정
          const move = e.clientX - startPos;
          scrollViewRef.current.scrollTo({ x: scrollStartPos - move, animated: false });
        }
      };

      // 마우스 버튼을 놓을 때 호출됩니다.
      const onMouseUp = () => {
        // 모달이 열려있지 않을 때만 드래깅 상태를 비활성화합니다.
        if (!modalVisible && !plantDetailsModalVisible && isDragging) {
          isDragging = false;
          setTimeout(() => setIsScrolling(false), 100); // 스크롤 상태를 해제하는데 약간의 지연을 줍니다.
        }
      };

        // 식물 컨테이너 클릭 이벤트
        const onPlantContainerPress = (plant) => {
          if (!isScrolling) { // 스크롤 중이 아닐 때만 모달 열기
            setSelectedPlant(plant);
            setModalView('diaryView');
            setPlantDetailsModalVisible(true);
            setDiaryDate('');
          }
        };




    // 식물 목록 표시 컴포넌트 (식물 이름과 키운 기간 계산)
         const PlantContainer = ({ plants, fetchPlants }) => {

         const [diaryCounts, setDiaryCounts] = useState({});

         // 물주기 상태 토글 함수
           const toggleWatering = async (plant) => {
             const newStatus = plant.wateringStatus === 'on' ? 'off' : 'on';
             const lastWatered = newStatus === 'on' ? new Date() : new Date(plant.lastWatered); // 항상 Date 객체를 사용

             // UI를 즉시 업데이트
             const updatedPlants = plants.map(p =>
               p.id === plant.id ? { ...p, wateringStatus: newStatus, lastWatered: lastWatered } : p
             );
             setPlants(updatedPlants); // 식물 목록 상태 업데이트

             // Firestore 업데이트 시도
             try {
               const plantRef = doc(firestore, "plants", plant.id);
               await updateDoc(plantRef, {
                 wateringStatus: newStatus,
                 lastWatered: Timestamp.fromDate(lastWatered) // Firestore에 저장할 때 Timestamp로 변환
               });
             } catch (error) {
               console.error("Failed to update watering status: ", error);
               Alert.alert("Error", "Failed to update watering status.");
               // 실패한 경우 원래 상태로 롤백
               setPlants(plants);
             }
           };


           useEffect(() => {
             const interval = setInterval(() => {
               plants.forEach(async (plant) => {
                 if (plant.wateringStatus === 'on') {
                   const lastWateredTime = plant.lastWatered.toDate().getTime();
                   const currentTime = new Date().getTime();
                   if (currentTime - lastWateredTime >= plant.wateringCycle * 86400000) {
                     const plantRef = doc(firestore, "plants", plant.id);
                     await updateDoc(plantRef, {
                       wateringStatus: 'off'
                     });
                   }
                 }
               });
             }, 60000); // 매 분마다 확인

             return () => clearInterval(interval);
           }, [plants]);



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
               <TouchableOpacity key={index} onPress={() => onPlantContainerPress(plant)}>
                         <View style={styles.card}>
                                   <View style={styles.plantCardInner}>

                                               <Image source={plantImage} style={[styles.cardlinkImage, { backgroundColor: '#F7F7F7'}]} />

                                             <View style={styles.plantTextContainer}>
                                             <TouchableOpacity onPress={() => toggleWatering(plant)}>
                                                    <Image source={{ uri: `./image/${plant.wateringStatus === 'on' ? 'wateron' : 'wateroff'}.png` }} style={styles.waterButton} />
                                             </TouchableOpacity>
                                               <Text style={styles.plantName}>{plant.name}</Text>
                                               <Text style={styles.plantDays}>{`키운지 ${daysGrowing}일`}</Text>
                                             </View>
                                           </View>
                         </View>
                       </TouchableOpacity>
             );
           });
         };




    // 일기 및 AI 답변 저장
    const saveDiaryEntry = async (diaryText, plantId, userId, diaryDate, images, setImages) => {
      // 날짜 형식을 "YYYY-MM-DD"로 변환
      const formattedDate = moment(diaryDate).format('YYYY-MM-DD');
      // Firestore에서 식물 데이터 조회
      const plantRef = doc(firestore, "plants", plantId);
      const plantDoc = await getDoc(plantRef);

      if (!plantDoc.exists()) {
        console.error('No such plant!');
        return;
      }

      const plantData = plantDoc.data();
      let imageAnalysis = "";  // 이미지 분석 결과를 저장할 변수 초기화
      let imageUrls = [];  // 이미지 URL 목록 초기화

      if (images.length > 0) {
        imageUrls = await Promise.all(images.map(file => uploadImageAndGetURL(file)));
        const firstImageUrl = imageUrls[0];

        const analysisResponse = await fetch('https://finalpjbackend-01758c5118d1.herokuapp.com/generate-image-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: firstImageUrl }),
          mode: 'cors'
          credentials: 'include'
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          imageAnalysis = analysisData.analysis;  // 이미지 분석 결과 저장
        } else {
          console.error('Failed to get image analysis');
        }
      }

      let responseStyle = "";
      if (plantData.affection < 10) {
        responseStyle = "아직 서로 잘 모르는 사이이기 때문에, 조심스럽고 기본적인 답변을 합니다.";
      } else if (plantData.affection < 25) {
        responseStyle = "서로를 조금 알게 된 단계이므로, 조금 더 친근하게 답변합니다.";
      } else if (plantData.affection < 45) {
        responseStyle = "서로 상당히 친숙해진 관계이므로, 개인적인 내용을 포함한 친근한 답변을 합니다.";
      } else {
        responseStyle = "매우 친밀한 관계이므로, 개인적이고 깊은 내용을 포함한 친근하고 따뜻한 답변을 합니다.";
      }

      const diaryEntryContent = `너는 사용자의 일기에 등장하는 ${plantData.type}이다. ${plantData.mbti} 성격을 가졌다. ${responseStyle} 사용자가 너에 대해 언급한 내용을 바탕으로, 마치 ${plantData.type}가 자신의 생각과 느낌을 사용자에게 직접 반말로 이야기하는 것처럼 표현해라. 사용자와의 일상적인 대화처럼 느껴지도록 해라. 사용자를 지칭할때는 ${nickname}으로 지칭하도록 해라. \n 사용자 일기: ${diaryText}`;

      const replyResponse = await fetch('https://finalpjbackend-01758c5118d1.herokuapp.com/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diaryEntry: diaryEntryContent }),
        mode: 'cors'
        credentials: 'include'
      });

      const replyData = await replyResponse.json();
      if (!replyResponse.ok) {
        throw new Error('답변 생성 실패');
      }

      let affectionIncrease = 1 + images.length * 0.1;  // 기본 호감도 증가량 + 이미지 개수에 따른 추가
      const keywords = ['물', '비료', '영양제'];
      keywords.forEach(keyword => {
        const count = (diaryText.match(new RegExp(keyword, "gi")) || []).length;
        affectionIncrease += count * 0.1;
      });

      await addDoc(collection(firestore, "diaryEntries"), {
        userId,
        plantId,
        diaryText,
        reply: replyData.reply,
        createdAt: Timestamp.fromDate(new Date(formattedDate)),
        images: imageUrls,
        imageAnalysis: imageAnalysis,
      });

      await updateDoc(plantRef, {
        affection: increment(affectionIncrease),
      });

      Alert.alert("성공", "일기가 기록되었습니다.");
      setPlantDetailsModalVisible(false);
      setImages([]);
    };






      // 이미지 업로드 함수 수정 예시
      const uploadImageAndGetURL = async (file) => {
        const storageRef = ref(getStorage(), `diaryImages/${file.name}_${Date.now()}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
      };




    // 식물 상세 정보 모달 내 일기 작성 UI
    // 실제 이미지 업로드 및 날짜 선택기 구현 필요
    const DiaryEntryForm = ({ saveDiaryEntry, diaryDate, setDiaryDate }) => {
      const [diaryText, setDiaryText] = useState("");

      const [showCalendar, setShowCalendar] = useState(false); // 달력 모달 표시 상태

      const [images, setImages] = useState([]); // 이미지 파일 상태 관리
        const [imagePreviews, setImagePreviews] = useState([]); // 이미지 미리보기 URL 상태 관리
        const [errorMessage, setErrorMessage] = useState(""); // 추가: 에러 메시지 상태

        // 이미지 파일 선택 핸들러
        const handleImageChange = (event) => {
          const newFiles = Array.from(event.target.files);
          const newImages = [...images, ...newFiles];
          setImages(newImages);

          // 이미지 미리보기 URL 생성
          const newImagePreviews = newImages.map(file =>
            URL.createObjectURL(file)
          );
          setImagePreviews(newImagePreviews);
        };

        // 이미지 삭제 핸들러
        const handleRemoveImage = (index) => {
          const newImages = images.filter((_, i) => i !== index);
          setImages(newImages);

          const newImagePreviews = newImages.map(file =>
            URL.createObjectURL(file)
          );
          setImagePreviews(newImagePreviews);
        };

      // 날짜 선택 핸들러
      const handleDateChange = (date) => {
        setDiaryDate(date);
        setShowCalendar(false); // 달력 모달 숨기기
      };

      const handleDiarySubmit = () => {
          // 날짜와 일기 내용이 모두 입력되었는지 검사
          if (!diaryDate) {
            setErrorMessage("날짜를 선택해주세요.");
            return;
          }

          if (diaryText.trim() === "") {
            setErrorMessage("일기를 작성해주세요.");
            return;
          }

          // 에러 메시지 초기화
          setErrorMessage("");

          // 일기 및 AI 답변 저장 함수 호출
          saveDiaryEntry(diaryText, selectedPlant.id, user.uid, diaryDate, images, setImages);
        };


      return (
        <View style={styles.diaryEntryFormContainer}>
        <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }} // 파일 입력 숨기기
                          ref={input => this.fileInput = input} // 파일 입력 참조
                />



                      {/* 선택된 이미지 미리보기 */}
                      <View style={styles.imagePreviewsContainer}>
                        {imagePreviews.map((imageURL, index) => (
                          <View key={index} style={styles.imagePreview}>
                            <Image source={{ uri: imageURL }} style={styles.previewImage} />
                            <TouchableOpacity onPress={() => handleRemoveImage(index)} style={styles.removeImageButton}>
                              <Text>X</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        <TouchableOpacity style={styles.imageUploadButton} onPress={() => this.fileInput.click()}>
                                                                      <Text style={styles.imageUploadButtonText}>+</Text>
                                                                    </TouchableOpacity>
                      </View>
          {showCalendar && (
            <Modal
              transparent={true}
              visible={showCalendar}
              onRequestClose={() => setShowCalendar(false)}
            >
              <View style={styles.calendarModalOverlay}>
                <View style={styles.calendarModal}>
                  <CalendarComponent onDateChange={handleDateChange} />
                  <Button title="닫기" onPress={() => setShowCalendar(false)} />
                </View>
              </View>
            </Modal>
          )}

          <View style={styles.diarydateSelectorContainer}>
                  <TouchableOpacity onPress={showDatePickerForDiary} style={styles.diarydateSelector}>
                  <Image source={{ uri: `./image/daterange.png` }} style={styles.dateRangeIcon} />
                    <Text style={styles.diarydateSelectorText}>
                      {diaryDate ? moment(diaryDate).format('YYYY-MM-DD') : "날짜를 설정해주세요"}
                    </Text>
                  </TouchableOpacity>
                </View>

          <TextInput
            style={styles.inputDiary}
            onChangeText={setDiaryText}
            value={diaryText}
            placeholder="일기 작성"
            multiline
          />


          <View style={styles.diaryErrorMessageContainer}>
                {errorMessage !== "" && (
                  <Text style={styles.diaryWarningText}>{errorMessage}</Text>
                )}
              </View>

              <TouchableOpacity onPress={handleDiarySubmit} style={styles.diarySubmitButton}>
                <Text style={styles.diarySubmitButtonText}>기록하기</Text>
              </TouchableOpacity>
        </View>
      );
    };

    const toggleMenuModal = () => {
      setShowMenuModal(!showMenuModal);
    };

    const deletePlant = async (plantId) => {
      try {
        await deleteDoc(doc(firestore, "plants", plantId));
        // 성공 메시지 또는 삭제 후 처리 로직
        console.log('Plant deleted successfully');
        setPlantDetailsModalVisible(false);
            fetchPlants();
        // 식물 목록 업데이트 등의 추가 작업 필요
      } catch (error) {
        console.error("Error removing document: ", error);
      }
    };




    // 상세 정보 모달과 일기 작성 뷰의 전환 로직 구현
    const PlantDetailsModal = () => {
      const [showDiaryEntryForm, setShowDiaryEntryForm] = useState(false);
      const [diaryText, setDiaryText] = useState("");

      const [diaryEntries, setDiaryEntries] = useState([]);
      const [currentDiaryIndex, setCurrentDiaryIndex] = useState(0); // 현재 선택된 일기 인덱스

      const [showPlantReplyModal, setShowPlantReplyModal] = useState(false);
      const [currentImageIndex, setCurrentImageIndex] = useState(0);

      const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);

      const [imageAnalysisModalVisible, setImageAnalysisModalVisible] = useState(false);
      const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

      const toggleImageAnalysisModal = (event) => {
        const xPos = event.nativeEvent.clientX - 100;
        const yPos = event.nativeEvent.clientY;
        setModalPosition({ x: xPos, y: yPos });
        setImageAnalysisModalVisible(!imageAnalysisModalVisible);
      };

      // 식물 답변 모달 표시 상태를 전환하는 함수
      const togglePlantReplyModal = () => {
        // 현재 보고 있는 일기의 답변이 있는 경우에만 모달을 표시하도록 조건 추가
        if (diaryEntries[currentDiaryIndex] && diaryEntries[currentDiaryIndex].reply) {
          setShowPlantReplyModal(!showPlantReplyModal);
        }
      };

      const plantReplyModalPosition = { left: '43.8%', top: '63%' };

      let selectedPlantImageUrl;
        if (selectedPlant) {
          if (selectedPlant.affection < 10) {
            selectedPlantImageUrl = './image/flowerpot.png';
          } else if (selectedPlant.affection < 25) {
            selectedPlantImageUrl = './image/sprout.png';
          } else {
            switch (selectedPlant.type) {
              case '바질':
                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/basil1.png' : './image/basil2.png';
                break;
              case '당근':
                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/carrot1.png' : './image/carrot2.png';
                break;
              case '상추':
                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/lettuce1.png' : './image/lettuce2.png';
                break;
              case '토마토':
                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/tomato1.png' : './image/tomato2.png';
                break;
                case '캣그라스':
                                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/catgrass1.png' : './image/catgrass2.png';
                                break;
              case '기타식물':
                selectedPlantImageUrl = selectedPlant.affection < 45 ? './image/extra1.png' : './image/extra2.png';
                break;
              default:
                selectedPlantImageUrl = './image/default.png'; // 기본 이미지
            }
          }
        }

        let levelImageUri;
        let showHeartAnimation = false;
        if (selectedPlant) {
        if (selectedPlant.affection < 10) {
          levelImageUri = './image/level1.png';
        } else if (selectedPlant.affection < 25) {
          levelImageUri = './image/level2.png';
        } else if (selectedPlant.affection < 45) {
          levelImageUri = './image/level3.png';
        } else if (selectedPlant.affection < 70) {
          levelImageUri = './image/level4.png';
        } else {
          levelImageUri = './image/level5.png';
          showHeartAnimation = true;
        }
        }


      useEffect(() => {
        const fetchDiaryEntries = async () => {
          // 선택된 식물이 없으면 아무것도 하지 않음
          if (!selectedPlant) return;

          // 선택된 식물의 ID를 기준으로 일기 데이터 조회
          const diaryEntriesRef = collection(firestore, "diaryEntries");
          const q = query(diaryEntriesRef, where("plantId", "==", selectedPlant.id), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          const entries = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setDiaryEntries(entries);
          setCurrentDiaryIndex(0); // 일기 목록을 가져온 후 첫 번째 일기를 기본 선택
        };

        fetchDiaryEntries();
      }, [selectedPlant]);

      const calculateDaysTogether = (startDate) => {
        const startMoment = moment(startDate);
        const today = moment();
        return today.diff(startMoment, 'days');
      };

      const handlePrevDiary = () => {
          if (currentDiaryIndex < diaryEntries.length - 1) {
            setCurrentDiaryIndex(currentDiaryIndex + 1);
          }
        };

        const handleNextDiary = () => {
          if (currentDiaryIndex > 0) {
            setCurrentDiaryIndex(currentDiaryIndex - 1);
          }
        };

      const handleBackToDiaryView = () => {
        setModalView('diaryView');
      };

      const renderDiaryImages = (diaryImages) => {
        // 이미지가 없으면 기본 이미지를 표시합니다.
        if (diaryImages.length === 0) {
          return <Image source={{ uri: './image/diarydefault.png' }} style={styles.diaryDetailImage} resizeMode="cover" />;
        }

        // 현재 선택된 이미지
        const currentImageURL = diaryImages[currentImageIndex];


          // 이미지 인디케이터 렌더링
          const renderImageIndicators = () => (
            <View style={styles.imageIndicatorContainer}>
              {diaryImages.map((_, index) => (
                <View key={index} style={index === currentImageIndex ? styles.selectedImageIndicator : styles.unselectedImageIndicator} />
              ))}
            </View>
          );


        return (
            <View style={styles.imageSliderContainer}>
              <TouchableOpacity style={[styles.sliderNav, {left: 0}]} onPress={() => setCurrentImageIndex(prevIndex => Math.max(prevIndex - 1, 0))}/>
              <Image source={{ uri: currentImageURL }} style={styles.diaryDetailImage} />


              {renderImageIndicators()}
              {/* 첫 번째 이미지일 때만 explainButton 표시 */}
                            {currentImageIndex === 0 && (
                              <TouchableOpacity onPress={(e) => toggleImageAnalysisModal(e)} style={styles.explainButton}>
                                <Image source={{ uri: './image/explainbutton.png' }} style={styles.explainButtonImage} />
                              </TouchableOpacity>
                            )}
              <TouchableOpacity style={[styles.sliderNav, {right: 0}]} onPress={() => setCurrentImageIndex(prevIndex => Math.min(prevIndex + 1, diaryImages.length - 1))}/>
             {imageAnalysisModalVisible && (
               <Modal
                 animationType="none"
                 transparent={true}
                 visible={imageAnalysisModalVisible}
                 onRequestClose={() => setImageAnalysisModalVisible(false)}
               >
                 <TouchableWithoutFeedback onPress={() => setImageAnalysisModalVisible(false)}>
                   <View style={styles.centeredAnotherView}>
                     <TouchableWithoutFeedback>
                       <View style={[styles.imageAnalysisModal, { top: modalPosition.y - 100, left: modalPosition.x - 100 }]}>
                         <ScrollView style={{ maxHeight: 200 }}>
                           <Text>{diaryEntries[currentDiaryIndex].imageAnalysis}</Text>
                         </ScrollView>
                       </View>
                     </TouchableWithoutFeedback>
                   </View>
                 </TouchableWithoutFeedback>
               </Modal>
             )}

                   {showImageAnalysisModal && (
                     <Modal visible={showImageAnalysisModal} onRequestClose={() => setShowImageAnalysisModal(false)}>
                       <Text>{diaryEntries[currentDiaryIndex].imageAnalysis}</Text>
                     </Modal>
                   )}
             <TouchableOpacity style={[styles.sliderNav, {right: 0}]} onPress={() => setCurrentImageIndex(prevIndex => Math.min(prevIndex + 1, diaryEntries[currentDiaryIndex]?.images.length - 1))}/>
             {renderImageIndicators()}
           </View>
        );
      };

      const handleDeleteDiary = async (diaryId) => {
        try {
          // Firestore에서 해당 일기 삭제
          await deleteDoc(doc(firestore, "diaryEntries", diaryId));

          // 일기 목록 새로고침
          await fetchDiaryEntries();

          // 성공 메시지 표시
          Alert.alert("삭제 완료", "일기가 성공적으로 삭제되었습니다.");
        } catch (error) {
          console.error("일기 삭제 중 에러 발생: ", error);
          Alert.alert("삭제 오류", "일기를 삭제하는 동안 오류가 발생했습니다.");
        }
      };

      const fetchDiaryEntries = async () => {
        if (!selectedPlant) return;

        const diaryEntriesRef = collection(firestore, "diaryEntries");
        const q = query(diaryEntriesRef, where("plantId", "==", selectedPlant.id), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const entries = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDiaryEntries(entries);
        setCurrentDiaryIndex(0); // 일기 목록을 가져온 후 첫 번째 일기를 기본 선택
      };


      return (
        <Modal
          animationType="fade"
          transparent={true}
          visible={plantDetailsModalVisible}
          onRequestClose={() => setPlantDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              {modalView === 'diaryView' ? (
                <>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setPlantDetailsModalVisible(false)}>
                      <Image source={{ uri: './image/leftarrow.png' }} style={styles.backButtonImage} />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderText}>{selectedPlant?.name}</Text>
                    <TouchableOpacity onPress={toggleMenuModal} style={styles.modalMenuButton}>
                      <Image source={{ uri: './image/threedots.png' }} style={styles.modalIcon} />
                    </TouchableOpacity>
                  </View>
                  {diaryEntries.length > 0 && (
                    <>
                      <Text style={styles.recordIndexText}>{`${diaryEntries.length - currentDiaryIndex}번째 기록`}</Text>

                      <View style={styles.diaryNavigationContainer}>
                        <TouchableOpacity onPress={handlePrevDiary} disabled={currentDiaryIndex >= diaryEntries.length - 1}>
                          <Image source={{ uri: './image/diaryprev.png' }} style={styles.navigationImage} />
                        </TouchableOpacity>
                        <View style={styles.diaryContainer}>
                        <View style={styles.diaryDateAndButtonsContainer}>
                          <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={styles.diaryDateText}>{moment(diaryEntries[currentDiaryIndex]?.createdAt.toDate()).format('YYYY년 MM월 DD일')}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteDiary(diaryEntries[currentDiaryIndex].id)}>
                            <Image source={{ uri: './image/diarydelete.png' }} style={styles.diaryDeleteButton} />
                          </TouchableOpacity>
                        </View>
                          {renderDiaryImages(diaryEntries[currentDiaryIndex]?.images || [])}
                          <ScrollView>
                            <Text style={styles.diaryText}>{diaryEntries[currentDiaryIndex]?.diaryText}</Text>
                          </ScrollView>
                        </View>
                        <TouchableOpacity onPress={handleNextDiary} disabled={currentDiaryIndex <= 0}>
                          <Image source={{ uri: './image/diarynext.png' }} style={styles.navigationImage} />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                    <View style={styles.plantDetailsContainer}>
                                <View style={styles.plantDetailsShadowContainer}>
                                {showHeartAnimation && (
                                      <View style={styles.heartAnimationContainer}>
                                        <HeartFloatAnimation />
                                      </View>
                                    )}
                                  <Image source={{ uri: selectedPlantImageUrl }} style={styles.plantDetailsImage} />
                                </View>
                                <TouchableOpacity onPress={togglePlantReplyModal}>
                                  <Image source={{ uri: './image/speechbubble.png' }} style={styles.speechBubbleIcon} />
                                </TouchableOpacity>
                                <Image source={{ uri: levelImageUri }} style={styles.plantLevelIcon} />
                                <View style={styles.plantInfoTextContainer}>
                                  <Text style={styles.plantDiaryText}>
                                    {`${moment().format('YYYY년 MM월 DD일')}`}
                                  </Text>
                                  <Text style={styles.plantDiaryText}>
                                    <Text style={styles.plantDiaryColorText}>{`${selectedPlant.name}`}</Text>
                                    {`님과 `}
                                    <Text style={styles.plantDiaryColorText}>{`${calculateDaysTogether(selectedPlant.startDate)}일`}</Text>
                                    {`째 함께하고 있어요`}
                                  </Text>
                                  <Text style={styles.plantDiaryText}>
                                    {`소중한 `}
                                    <Text style={styles.plantDiaryColorText}>{`${diaryEntries.length}개`}</Text>
                                    {`의 기록이 등록되어있어요`}
                                  </Text>
                                </View>

                              </View>
                  <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => setModalView('entryForm')}
                  >
                    <Image source={{ uri: './image/floating_button.png' }} style={styles.floatingButtonIcon} />
                  </TouchableOpacity>
                </>
              ) : null}
              {showPlantReplyModal && (
                      <Modal
                        animationType="fade"
                        transparent={true}
                        visible={showPlantReplyModal}
                        onRequestClose={togglePlantReplyModal}
                      >
                      <TouchableWithoutFeedback onPress={togglePlantReplyModal}>
                            <View style={[styles.centeredView, plantReplyModalPosition]}>
                              <TouchableWithoutFeedback>
                                <View style={styles.plantReplyModal}>
                                  <ScrollView style={styles.scrollViewContainer}>
                                    {diaryEntries.length > currentDiaryIndex && (
                                      <Text style={styles.plantReplyText}>{diaryEntries[currentDiaryIndex].reply}</Text>
                                    )}
                                  </ScrollView>
                                </View>
                              </TouchableWithoutFeedback>
                            </View>
                          </TouchableWithoutFeedback>
                        </Modal>
                    )}
                    {
                      showMenuModal && (
                        <View style={styles.centeredView}>
                          <View style={styles.menuModalView}>
                            <TouchableOpacity
                              style={styles.menuModalButton}
                              onPress={() => setShowMenuModal(false)}>
                              <Text style={styles.menuModalButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.menuModalButton}
                              onPress={() => {
                                deletePlant(selectedPlant.id);
                                setShowMenuModal(false);
                              }}>
                              <Text style={styles.menuModalDeleteButtonText}>삭제</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )
                    }
              {modalView === 'entryForm' && (
                <>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleBackToDiaryView}>
                      <Image source={{ uri: './image/leftarrow.png' }} style={styles.backButtonImage} />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderText}>{selectedPlant?.name}</Text>
                  </View>
                  <DiaryEntryForm
                        saveDiaryEntry={saveDiaryEntry}
                        diaryDate={diaryDate} // 현재 선택된 날짜 상태
                        setDiaryDate={setDiaryDate} // 날짜 상태 업데이트 함수
                      />
                </>
              )}
              {modalView === 'calendarForDiary' && (
                      <CalendarComponent
                      initialDate={diaryDate} // 현재 선택된 날짜 상태
                        onConfirm={(selectedDay) => {
                          onConfirmSelectedDateForDiary(selectedDay);
                        }}
                        returnToPreviousModal={returnToPreviousModal}
                />
              )}
            </View>
          </View>
        </Modal>
      );

    };

    // 일기 넘겨보기 UI 구성
    const DiaryNavigation = () => {
      return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <Button title="<" onPress={() => setCurrentDiaryIndex(currentDiaryIndex - 1)} disabled={currentDiaryIndex <= 0} />
          <Button title=">" onPress={() => setCurrentDiaryIndex(currentDiaryIndex + 1)} disabled={currentDiaryIndex >= diaryEntries.length - 1} />
        </View>
      );
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
                              <Text style={[styles.menuText, styles.selectText]}>쑥쑥 자라고 있어요</Text>
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
    <View style={styles.contentTitleContainer}>
      <Text style={styles.titleText}>쑥쑥 자라고 있어요</Text>
      <Text style={styles.subtitleText}>
        현재 <Text style={styles.nicknameText}>{nickname}</Text>님과 함께하고 있는 식물들이에요!
      </Text>
      </View>

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
            <PlantDetailsModal />

            <TouchableOpacity onPress={() => navigation.navigate('PlantPick')}>
              <View style={styles.card}>
                <View style={styles.cardlinkContent}>
                  <Image source={{ uri: './image/testgif.gif' }} style={[styles.cardlinkImage, { backgroundColor: '#F7F7F7'}]} />
                  <Text style={styles.cardlinkText}>AI가 추천하는{'\n'}나만의 식물 알아보기</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddPlantClick}>
              <View style={styles.addPlantCard}>
                <Text style={styles.addPlantButtonText}>+</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>


            {/* 기타 UI 컴포넌트 */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeModal}
            >
              <View style={styles.modalOverlay}>
                      <View style={styles.modal}>
                        {modalContent === 'plantInfo' && (
                                <>
                                  <View style={styles.modalHeader}>
                                    <Text style={styles.modalHeaderText}>식물 기록 시작하기</Text>
                                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                      <Image source={{ uri: './image/close_button.png' }} style={styles.closeButtonImage} />
                                    </TouchableOpacity>
                                  </View>
                                  <TouchableOpacity onPress={showPlantSelect} style={styles.plantTypeSelectButton}>
                                    {selectedPlantImage ? (
                                      <Image source={{ uri: selectedPlantImage }} style={{ width: '130%', height: '130%', borderRadius: 50 }} />
                                    ) : (
                                      <Text style={styles.plantTypeSelectIcon}>+</Text>
                                    )}
                                  </TouchableOpacity>
                                  <View style={styles.inputWithIconContainer}>
                                              <Image source={{ uri: './image/plantName.png' }} style={styles.inputIcon} />
                                              <TextInput
                                                style={styles.inputWithIcon}
                                                placeholder="이름 설정하기"
                                                onChangeText={setPlantName}
                                                value={plantName}
                                              />
                                            </View>
                                            <View style={styles.inputWithIconContainer}>
                                              <Image source={{ uri: './image/plantWater.png' }} style={styles.inputIcon} />
                                              <TextInput
                                                style={styles.inputWithIcon}
                                                placeholder="물 주는 주기 설정하기 (일)"
                                                onChangeText={setWateringCycle}
                                                value={wateringCycle}
                                                keyboardType="numeric"
                                              />
                                            </View>
                                  <TouchableOpacity onPress={() => setModalContent('calendar')} style={styles.dateSelectorContainer}>
                                  <Image source={{ uri: './image/calendar.png' }} style={styles.inputIcon} />
                                    <Text style={styles.dateSelectorText}>
                                      {startDate ? startDate : "시작일 선택하기"}
                                    </Text>
                                  </TouchableOpacity>
                                  {warningMessage ? (
                                                <Text style={styles.warningText}>{warningMessage}</Text>
                                              ) : null}
                                  <TouchableOpacity onPress={addPlant} style={styles.startButton}>
                                    <Text style={styles.startButtonText}>시작하기</Text>
                                  </TouchableOpacity>
                                </>
                              )}
                      {modalContent === 'plantSelect' && (
                                <>
                                    <View style={styles.modalHeader}>
                                      <TouchableOpacity onPress={showPlantInfo} style={styles.backButton}>
                                        <Image source={{ uri: './image/leftarrow.png' }} style={styles.backButtonImage} />
                                      </TouchableOpacity>
                                      <Text style={styles.modalHeaderText}>식물종류 선택하기</Text>
                                      <View style={{ width: 24, height: 24 }} /> {/* 오른쪽 정렬을 유지하기 위한 빈 뷰 */}
                                    </View>
                                    <View style={styles.plantSelectionContainer}>
                                    <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('캣그라스')}>

                                        <Image source={{ uri: './image/catgrass_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>캣그라스(귀리)</Text>
                                              <Text style={styles.normalText}>
                                                고양이들이 좋아하는 식물로, 영양이 풍부하고 소화를 돕는 기능을 합니다. 키우기 쉽고 빠르게 자랍니다.
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                              source={{ uri: './image/plantexplain.png' }}
                                              style={styles.plantExplainImage} />
                                              </TouchableOpacity>


                                      </TouchableOpacity>
                                      </View>
                                      <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('바질')}>
                                        <Image source={{ uri: './image/basil_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>바질</Text>
                                              <Text style={styles.normalText}>
                                                상쾌한 허브 향과 맛을 가지며, 파스타, 피자 등 다양한 요리에 사용됩니다. 햇빛이 많이 드는 장소에서 키우는 것이 이상적입니다.
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                                                                      source={{ uri: './image/plantexplain.png' }}
                                                                                      style={styles.plantExplainImage} />
                                      </TouchableOpacity>
                                      </TouchableOpacity>
                                      </View>
                                      <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('토마토')}>
                                        <Image source={{ uri: './image/tomato_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>방울토마토</Text>
                                              <Text style={styles.normalText}>
                                                작고 동그란 모양의 토마토로, 달고 상큼한 맛을 가지고 있어요. 보통 장식용이나 간식으로 섭취되며, 햇볕이 많이 드는 곳에서 자랍니다!
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                                                                      source={{ uri: './image/plantexplain.png' }}
                                                                                      style={styles.plantExplainImage} />
                                      </TouchableOpacity>
                                      </TouchableOpacity>
                                      </View>
                                      <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('상추')}>
                                        <Image source={{ uri: './image/lettuce_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>상추</Text>
                                              <Text style={styles.normalText}>
                                                상쾌한 맛과 식감을 가진 잎채소로, 샐러드 등 다양한 요리에 활용됩니다. 상추는 상대적으로 쉽게 키울 수 있습니다.
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                                                                      source={{ uri: './image/plantexplain.png' }}
                                                                                      style={styles.plantExplainImage} />
                                      </TouchableOpacity>
                                      </TouchableOpacity>
                                      </View>
                                      <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('당근')}>
                                        <Image source={{ uri: './image/carrot_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>당근</Text>
                                              <Text style={styles.normalText}>
                                                달콤하고 고소한 맛을 가진 채소로, 다양한 요리에 사용되며 식이섬유와 베타카로틴이 풍부합니다. 흙이 잘 통하는 토양에서 잘 자랍니다.
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                                                                      source={{ uri: './image/plantexplain.png' }}
                                                                                      style={styles.plantExplainImage} />
                                      </TouchableOpacity>
                                      </TouchableOpacity>
                                      </View>
                                      <View style={styles.plantImageContainer}>
                                      <TouchableOpacity onPress={() => handlePlantSelect('기타식물')}>
                                        <Image source={{ uri: './image/extra_select.png' }} style={styles.plantImage} />
                                        <TouchableOpacity
                                          onMouseEnter={(e) => handleMouseEnter(
                                            <>
                                            <View>
                                              <Text style={styles.boldText}>기타식물</Text>
                                              <Text style={styles.normalText}>
                                                플라위에서 지원하는 식물이 없어도 기타식물 카테고리 설정을 통해 어떤 식물이든지 플라위 서비스에서 함께 식물과 소통할 수 있어요!
                                              </Text>
                                              </View>
                                            </>,
                                            e // 이벤트 객체 전달
                                          )}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        <Image
                                                                                      source={{ uri: './image/plantexplain.png' }}
                                                                                      style={styles.plantExplainImage} />
                                      </TouchableOpacity>
                                      </TouchableOpacity>
                                      </View>
                                    </View>
                                    {showPlantInfoModal && (
                                          <View style={{ ...styles.plantInfoModal, left: plantInfoModalPosition.x, top: plantInfoModalPosition.y }}>
                                            <Text>{currentPlantDescription}</Text>
                                          </View>
                                        )}
                                  </>
                                )}
                                {
                                  modalContent === 'calendar' && (
                                    <>

                                                <CalendarComponent
                                                  initialDate={startDate} // 부모 컴포넌트에서 관리하는 선택된 날짜 상태
                                                  onConfirm={(selectedDay) => {
                                                    onConfirmSelectedDateForPlant(selectedDay);
                                                  }}
                                                  returnToPreviousModal={() => setModalContent('plantInfo')}
                                                />
                                              </>
                                                  )}
                              </View>
                            </View>
            </Modal>


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
              marginTop: 10,
              marginBottom: 100,
            },
            contentTitleContainer: {
            alignItems: 'center',
            },
            titleText: {
              fontFamily: 'Noto Sans KR',
              fontWeight: '700',
              fontSize: 20,
              color: '#333333',
              marginBottom: 30,
            },
  subtitleText: {
      fontFamily: 'Noto Sans KR',
      fontSize: 16,
      color: '#666666', // 회색 텍스트
      marginBottom: 20,
      textAlign: 'center', // 텍스트 중앙 정렬
    },
    nicknameText: {
      color: '#31ac66', // 초록색 텍스트
      fontWeight: 'bold', // 볼드체
    },
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 240,
        marginTop: 70,
        marginBottom: 180,
        marginLeft: 40,
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
      startButton: {
        backgroundColor: '#31ac66', // 초록색 배경
        paddingVertical: 14, // 상하 패딩
        paddingHorizontal: 15, // 좌우 패딩
        borderRadius: 24, // 모서리 둥글기
        width: '90%', // 너비를 부모 컨테이너와 같게 설정
        alignItems: 'center', // 텍스트를 중앙 정렬
        marginTop: 10, // 상단 여백
        shadowColor: "#000", // 그림자 색상
          shadowOffset: {
            width: 2,
            height: 4, // 그림자의 y축 오프셋
          },
          shadowOpacity: 0.25, // 그림자의 투명도
          shadowRadius: 3.84, // 그림자의 블러 반경
          elevation: 5,
      },

      startButtonText: {
      fontFamily: 'Noto Sans KR',
        color: 'white', // 텍스트 색상을 흰색으로 설정
        fontSize: 18, // 텍스트 크기
        fontWeight: 400, // 텍스트 굵기
      },
      closeButton: {
            alignSelf: 'flex-end',
          },
          closeButtonImage: {
            width: 24, // 이미지 크기 조절
            height: 24,
          },

          backButton: {
              // 뒤로 가기 버튼 스타일링
              marginLeft: 10, // 필요에 따라 조정
            },
            backButtonImage: {
              width: 12,
              height: 22,
              // 추가적인 스타일링
            },
              headerIcon: {
                width: 24,
                height: 24,
              },

              dateSelectorContainer: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '90%',
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 5,
                  padding: 5,
                  marginVertical: 5, // 간격 조정
                  justifyContent: 'space-between', // 아이콘과 텍스트 사이의 공간을 균등하게 분배
                },
                dateSelectorText: {
                  flex: 1,
                  fontFamily: 'Noto Sans KR',
                  fontWeight: 400,
                  fontSize: 16,
                  color: 'gray',
                  // 텍스트를 입력란 내부에서 좌측 정렬하되, 아이콘과 겹치지 않도록 조정
                },
              calendarHeaderText: {
                      flex: 1,
                          textAlign: 'center',
                        fontFamily: 'NotoSansKR',
                        fontWeight: 600,
                        fontSize: 18,
                        color: '#000',
                        // 필요에 따라 추가 스타일링
                      },
              completeButton: {
                  backgroundColor: '#31ac66', // 초록색 배경
                  width: 50, // 버튼 크기 조정
                  height: 30, // 버튼 크기 조정
                  borderRadius: 15, // 버튼을 동그랗게 만듦
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                completeButtonText: {
                fontFamily: 'Noto Sans KR',
                  color: 'white', // 텍스트 색상을 흰색으로 설정
                  fontSize: 14, // 텍스트 크기
                  fontWeight: 'bold', // 텍스트를 굵게
                },
              // ...[달력 스타일]...
              // 예를 들어 달력 네비게이션 버튼 스타일
              calendarContainer: {
                width: 400, // 고정된 가로 크기
                alignSelf: 'center', // 컨테이너를 부모 요소의 중앙에 배치
              },
              calendarNav: {
                flexDirection: 'row',
                justifyContent: 'center',
                    alignItems: 'center',
                    marginVertical: 3,
              },
              monthYearText: {
                  fontFamily: 'Noto Sans KR',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginHorizontal: 10,
                },
                navButton: {
                  fontFamily: 'Noto Sans KR',
                  fontSize: 14,
                  color: '#31ac66', // 버튼의 텍스트를 초록색으로 설정
                },
                headerRow: {
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  paddingVertical: 2,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e1e1e1',
                },
                headerText: {
                  fontFamily: 'Noto Sans KR',
                  fontSize: 12,
                  color: '#000', // 검정색 텍스트
                  width: 40,
                  textAlign: 'center',
                },
              day: {
                width: `${100 / 7}%`, // 부모 컨테이너 너비의 1/7을 사용하여 한 줄에 7개만 표시
                justifyContent: 'center',
                alignItems: 'center',
                aspectRatio: 1, // 너비와 높이가 같도록 설정하여 정사각형 모양 유지
                marginVertical: -4,
              },
                dayText: {
                  fontFamily: 'Noto Sans KR',
                  fontSize: 14,
                  // 다른 스타일링은 기존 day 스타일에서 가져올 수 있습니다.
                },
              daysContainer: {
                flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-around', // 날짜 사이의 간격을 균등하게 설정
                      width: '100%', // 부모 컨테이너의 전체 너비를 사용
              },
              selectedDay: {
                backgroundColor: '#31ac66', // 초록색 배경

                borderRadius: 50, // 동그랗게
              },
              selectedDayText: {
                color: 'white', // 선택된 날짜 텍스트를 흰색으로
              },
              // 예시로 사용된 초록색, 프로젝트에 맞게 조정
              todayHighlight: {
                backgroundColor: '#31ac66', // 초록색
                borderRadius: 20, // 동그랗게
              },
              todayText: {
                color: '#000', // 흰색 텍스트
              },

  modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '36%', // 가로 크기 조정
      height: '50%', // 세로 크기 조정
    },
    modalText: {
      marginBottom: 15,
      textAlign: "center",
      fontWeight: 'bold',
      fontSize: 18,
    },

    modalMenuButton: {
      position: 'absolute',
      right: 5,
    },
    modalIcon: {
                    width: 30,
                    height: 30,
                  },
    // TextInput 스타일 수정
    inputDiary: {
      fontFamily: 'Noto Sans KR', // 폰트 설정
      width: '100%', // 너비를 100%로 설정
      height: 100,
      marginVertical: 7, // 상하 마진 설정
      paddingHorizontal: 10, // 좌우 패딩 설정
      paddingBottom: 10, // 하단 패딩 설정
      borderWidth: 0, // 기본 테두리 제거
      borderBottomWidth: 1, // 아래쪽 테두리만 설정
      borderColor: '#E5E5E5', // 테두리 색상 설정
      textAlignVertical: 'top', // 멀티라인 입력을 위해 텍스트를 상단에 정렬
      fontSize: 16, // 폰트 사이즈 설정
      color: '#666666', // 폰트 색상 설정
    },

    floatingButton: {
      position: 'absolute',
      right: 30,
      bottom: 30,
      width: 52,
      height: 52,
      backgroundColor: '#31ac66', // 예시로 사용된 초록색, 프로젝트에 맞게 조정
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
    },
    floatingButtonIcon: {
        width: 64,
        height: 66,
    },
    diaryEntryFormContainer: {
      width: '100%',
      padding: 20,
    },
    diaryErrorMessageContainer: {
      height: 20, // 에러 메시지 영역의 높이를 20으로 설정
      justifyContent: 'center', // 내용을 중앙에 정렬
      alignItems: 'center', // 내용을 중앙에 정렬
    },
    diaryWarningText: {
    fontFamily: 'Noto Sans KR',
      color: 'red', // 경고 메시지 색상
      // 기타 스타일 속성
    },
    diarySubmitButton: {
      backgroundColor: '#31ac66', // 초록색 배경
      borderRadius: 20, // 버튼 모서리 둥글게
      width: '80%', // 버튼의 너비를 80%로 설정
      height: 50, // 버튼의 높이 설정
      justifyContent: 'center', // 내용을 중앙에 배치
      alignItems: 'center', // 텍스트를 중앙에 배치
      marginTop: 7,
      shadowColor: '#000', // 그림자 색상
      shadowOffset: { width: 2, height: 4 }, // 그림자 위치
      shadowOpacity: 0.3, // 그림자 투명도
      shadowRadius: 4, // 그림자 블러 반경
      elevation: 4, // 안드로이드에서 그림자를 위한 elevation 값
      alignSelf: 'center', // 버튼을 부모 컨테이너의 중앙에 위치시킴
    },
    diarySubmitButtonText: {
    fontFamily: 'Noto Sans KR',
      color: 'white', // 텍스트 색상
      fontSize: 18, // 텍스트 크기
      fontWeight: '600',
    },

    imageUploadContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    diaryText: {
        fontFamily: 'Noto Sans KR',
        fontSize: 14,
        color: '#333', // 텍스트 색상

        marginVertical: 5, // 상하 간격
      },
      replyText: {
        fontFamily: 'Noto Sans KR',
        fontSize: 16,
        color: '#555', // 텍스트 색상 조금 더 어둡게
        textAlign: 'center', // 가운데 정렬
        marginVertical: 5, // 상하 간격
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
      diaryImage: {
          width: 100, // 렌더링된 이미지 크기 조정
          height: 100, // 렌더링된 이미지 크기 조정
          marginVertical: 5, // 이미지 간의 간격
          resizeMode: 'contain', // 이미지가 컨테이너에 맞게 조정됩니다.
      },
      // 이미지 업로드 버튼 스타일
        imageUploadButton: {
          backgroundColor: '#E5E5E5', // 배경 색상
          width: 130, // 너비
          height: 130, // 높이
          borderRadius: 10, // 버튼을 원형으로
          justifyContent: 'center', // 내용 중앙 정렬
          alignItems: 'center', // 내용 중앙 정렬
          margin: 10, // 주변 마진
        },
        imageUploadButtonText: {
          fontSize: 34, // 텍스트 크기
          color: '#8B95A1', // 텍스트 색상
        },

        // 이미지 미리보기 컨테이너 스타일
        imagePreviewsContainer: {
          flexDirection: 'row', // 가로 방향으로 이미지 배열
          flexWrap: 'wrap', // 내용이 넘칠 경우 다음 줄로
          alignItems: 'center', // 이미지들을 중앙 정렬
          justifyContent: 'center', // 중앙 정렬
        },

        // 개별 이미지 미리보기 스타일
        imagePreview: {
          position: 'relative', // 삭제 버튼을 위한 포지셔닝
          width: 130, // 이미지 너비
          height: 130, // 이미지 높이
          borderRadius: 10, // 버튼을 원형으로
          margin: 5, // 이미지 간 간격
        },

        previewImage: {
          width: '100%', // 컨테이너 크기에 맞춤
          height: '100%', // 컨테이너 크기에 맞춤
          borderRadius: 10, // 이미지 모서리 둥글게
        },

        // 이미지 삭제 버튼 스타일
        removeImageButton: {
          position: 'absolute', // 이미지 위에 오도록
          right: 5, // 오른쪽 상단에 위치
          top: 5, // 상단에 위치
          backgroundColor: '#ffffff90', // 반투명 배경
          borderRadius: 12, // 버튼 둥글게
          width: 24, // 너비
          height: 24, // 높이
          justifyContent: 'center', // 내용 중앙 정렬
          alignItems: 'center', // 내용 중앙 정렬
        },

        diarydateSelectorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderTopWidth: 1, // 위쪽 경계선 두께 설정
                borderBottomWidth: 1, // 아래쪽 경계선 두께 설정
                borderColor: '#E5E5E5', // 경계선 색상을 회색으로 설정
            marginTop: 10,
            width: '100%', // 컨테이너 너비 조절
            alignSelf: 'center', // 부모 컨테이너 중앙에 배치
          },
          dateRangeIcon: {
            width: 20,
            height: 20,
            marginRight: 10,
          },
          diarydateSelector: {
            flex: 1, // 부모 컨테이너의 남은 공간을 모두 차지
            flexDirection: 'row',
            alignItems: 'center',
          },
          diarydateSelectorText: {
          fontFamily: 'Noto Sans KR',
                  color: '#666666',
            fontSize: 16,
          },



          recordIndexText: {
          fontFamily: 'Noto Sans KR',
          fontWeight: '600',
              color: '#31ac66', // 초록색 텍스트
              fontSize: 16,
              marginBottom: 5, // 아래쪽 여백
            },
            diaryContainer: {
              backgroundColor: 'white', // 배경 색상을 흰색으로 설정
              borderRadius: 10, // 모서리 둥글기
              marginHorizontal: 10,
              padding: 15, // 내부 패딩을 조금 더 넓게 설정
              marginBottom: 10, // 아래쪽 여백
              borderWidth: 1, // 테두리 두께
              borderColor: '#B5B5B5', // 테두리 색상을 회색으로 설정
              shadowColor: '#000', // 그림자 색상 설정
              shadowOffset: { width: 2, height: 2 }, // 그림자 위치 설정
              shadowOpacity: 0.2, // 그림자 투명도
              shadowRadius: 3.84, // 그림자 블러 반경
              elevation: 5, // 안드로이드용 그림자 깊이
              width: 400, // 너비를 부모 컨테이너의 90%로 설정하여 더 넓게 만듦
              height: 300, // 높이를 auto로 설정하여 내용에 따라 자동 조절되도록 함
            },

            diaryNavigationContainer: {
                            flexDirection: 'row', // 가로 방향 배치
                            alignItems: 'center', // 수직 방향으로 중앙 정렬
                            justifyContent: 'center',
                            width: '100%', // 부모 컨테이너의 전체 너비 사용
                            paddingHorizontal: 10, // 좌우 패딩
                          },

                          navigationImage: {
                            width: 30, // 너비 설정
                            height: 30, // 높이 설정
                            resizeMode: 'contain', // 이미지 비율 유지
                          },

            diaryDateText: {
            fontFamily: 'Noto Sans KR',
                      fontWeight: '600',
              color: 'gray', // 회색 텍스트
              marginBottom: 5, // 아래쪽 여백
              textAlign: 'center', // 날짜 텍스트 가운데 정렬
            },
            plantDetailsContainer: {
              flexDirection: 'row', // 가로 방향 배치
              alignItems: 'center', // 아이템 중앙 정렬
              marginBottom: 10, // 아래쪽 여백
            },
            plantDetailsShadowContainer: {
              width: 70, // 이미지보다 조금 큰 컨테이너 사이즈 설정
              height: 70, // 이미지보다 조금 큰 컨테이너 사이즈 설정
              borderRadius: 35, // 컨테이너를 원형으로 만듭니다. 컨테이너 크기의 절반
              borderWidth: 1, // 테두리 두께
                borderColor: '#cccccc', // 테두리 색상을 회색으로 설정
                shadowColor: "#000", // 그림자 색상
              backgroundColor: 'white', // 배경색을 흰색으로 설정
              justifyContent: 'center', // 중앙 정렬
              alignItems: 'center', // 중앙 정렬
              shadowColor: "#000", // 그림자 색상
              shadowOffset: { width: 2, height: 2 }, // 그림자 위치
              shadowOpacity: 0.3, // 그림자 투명도
              shadowRadius: 5, // 그림자 블러 반경
              elevation: 10, // 안드로이드에서 그림자를 위한 elevation 값
              overflow: 'hidden', // 이 부분을 추가합니다.
            },
            heartAnimationContainer: {
              position: 'absolute',
              // 필요한 위치 조정 값
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            },

            plantDetailsImage: {
              width: 70, // 실제 이미지 크기
              height: 70, // 실제 이미지 크기
              borderRadius: 35, // 이미지를 원형으로 만듭니다.
            },
            speechBubbleIcon: {
              position: 'absolute', // 절대 위치
              right: -15, // 오른쪽에서 -20만큼 떨어진 위치
              top: -35, // 상단에서 -20만큼 떨어진 위치
              width: 24, // 아이콘 너비
              height: 24, // 아이콘 높이
              // 필요하다면 추가로 조정
            },
            plantLevelIcon: {
              position: 'absolute', // 절대 위치 설정
              left: -3, // 왼쪽 가장자리에서부터의 위치
              bottom: -3, // 아래쪽 가장자리에서부터의 위치
              width: 22, // 아이콘 너비
              height: 19, // 아이콘 높이
            },
            plantInfoTextContainer: {
              flex: 1, // 남은 공간 모두 사용
              marginLeft: 60, // 이미지와 텍스트 사이의 왼쪽 마진 추가
            },
            plantDiaryText: {
            fontFamily: 'Noto Sans KR',
                      fontWeight: '600',
              color: 'gray', // 텍스트 색상
              textAlign: 'center',
            },
            plantDiaryColorText: {
            fontFamily: 'Noto Sans KR',
                      fontWeight: '600',
              color: '#31ac66', // 초록색 텍스트
              textAlign: 'center',
            },
            diaryRecordsText: {
            fontFamily: 'Noto Sans KR',
                      fontWeight: '600',
              color: '#31ac66', // 초록색 텍스트
              textAlign: 'center',
            },

            explainButton: {
                position: 'absolute',
                right: -24,
                bottom: -24,
                padding: 10, // 적절한 패딩으로 버튼 터치 영역 확장
              },
              explainButtonImage: {
                width: 30,
                height: 30,
              },
              imageSliderContainer: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              },
              diaryDetailImage: {
                width: '100%',
                height: 150,
                marginVertical: 5,
                borderRadius: 10,
              },
              imageIndicatorContainer: {
                flexDirection: 'row',
                position: 'absolute',
                bottom: 10, // 이미지 아래쪽에서 10px 위치
                alignItems: 'center',
                justifyContent: 'center',
              },
              selectedImageIndicator: {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#31ac66', // 초록색
                marginHorizontal: 4,
              },
              unselectedImageIndicator: {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#ccc', // 회색
                marginHorizontal: 4,
              },
              sliderNav: {
                  position: 'absolute',
                  width: '50%', // 너비를 이미지의 50%로 설정하여 왼쪽 또는 오른쪽 절반을 차지하게 함
                  height: '100%', // 높이를 이미지와 동일하게 설정
                  zIndex: 10, // 이미지 위에 오도록 z-index 설정
                },
              plantReplyModal: {
                margin: 20,
                backgroundColor: "white",
                borderRadius: 20,
                padding: 5,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                  width: 2,
                  height: 2
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
                width: '28%', // 가로 크기 조정
                height: '49%', // 세로 크기 조정
              },
              scrollViewContainer: {
                width: '100%',
              },
              plantReplyText: {
              fontFamily: 'Noto Sans KR',
                                    fontWeight: '600',
                            color: 'black', // 초록색 텍스트
                            textAlign: 'center',
              },

              diaryDateAndButtonsContainer: {
                flexDirection: 'row',
                justifyContent: 'space-between', // 변경된 부분
                alignItems: 'center',
                width: '100%',
                paddingHorizontal: 10,
                marginBottom: 10,
              },

              diaryDeleteButton: {
                width: 20,
                height: 20,
                marginRight: 0, // 필요하다면 조정
              },

              // 모달 및 버튼 스타일 추가
              centeredView: {
                position: 'absolute', // 절대 위치 사용

                left: '80%', // 왼쪽에서부터의 거리. 적절한 값으로 조정해야 합니다.
              },

              // menuModalView 스타일은 그대로 유지합니다.
              menuModalView: {
                margin: 20,
                backgroundColor: "white",
                borderRadius: 20,
                padding: 35,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                width: 100, // 모달 너비 조정
                height: 100,
              },
              menuModalButton: {
                width: '100%', // 버튼 너비를 모달 너비와 동일하게
                alignItems: "center", // 텍스트 중앙 정렬
              },
              menuModalButtonText: {
              fontFamily: 'Noto Sans KR',
                color: "gray",
                fontWeight: "bold",
                textAlign: "center",
              },
              menuModalDeleteButtonText: {
                            fontFamily: 'Noto Sans KR',
                              color: "#ff4444",
                              fontWeight: "bold",
                              textAlign: "center",
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
                              centeredAnotherView: {
                                  flex: 1,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(0, 0, 0, 0)',
                                },
                                imageAnalysisModal: {
                                  position: 'absolute',
                                  width: 300,
                                  height: 180,
                                  backgroundColor: 'white',
                                  borderRadius: 20,
                                  padding: 10,
                                  shadowColor: '#000',
                                  shadowOffset: {
                                    width: 0,
                                    height: 2
                                  },
                                  shadowOpacity: 0.25,
                                  shadowRadius: 3.84,
                                  elevation: 5,
                                },
                                waterButton: {
                                    width: 24,
                                    height: 30,
                                  },




});

export default GrowPlantScreen;