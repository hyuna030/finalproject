import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, Modal, ScrollView } from 'react-native';
import { auth, firestore } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AnnouncementScreen({ navigation, route }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
    const [newAnnouncementContent, setNewAnnouncementContent] = useState('');

  // 게시글 모달 관련 상태
  const [isAnnouncementModalVisible, setAnnouncementModalVisible] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedAnnouncementTitle, setEditedAnnouncementTitle] = useState('');
    const [editedAnnouncementContent, setEditedAnnouncementContent] = useState('');

  // 알림 상태 관리
    const [notifications, setNotifications] = useState([]);

  // 알림 모달 상태
    const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);

    const selectImage = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          setSelectedImage(file);
        }
      };
      input.click();
    };

    useEffect(() => {
      const fetchAndShowAnnouncementModal = async () => {
        const { announcementId } = route.params || {};

        if (announcementId) {
          const announcementRef = doc(firestore, 'announcements', announcementId);
          const docSnap = await getDoc(announcementRef);

          if (docSnap.exists()) {
            setSelectedAnnouncement({ id: docSnap.id, ...docSnap.data() });
            setAnnouncementModalVisible(true);
          } else {
            console.log("No such announcement!");
          }
        }
      };

      fetchAndShowAnnouncementModal();
    }, [route.params]);







  const fetchAnnouncements = async () => {
      try {
        let queryRef = collection(firestore, 'announcements');
        queryRef = query(queryRef, orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(queryRef);
        let fetchedAnnouncements = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const announcementId = doc.id;

          return { id: announcementId, ...doc.data() };
        }));

        if (searchQuery) {
          fetchedAnnouncements = fetchedAnnouncements.filter(announcement =>
            announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setAnnouncements(fetchedAnnouncements);
        setTotalPages(Math.ceil(fetchedAnnouncements.length / 10));
      } catch (error) {
        console.error("Error fetching announcements: ", error);
      }
    };



    useEffect(() => {
      // 선택된 공지사항 데이터가 있고, 알림 모달을 열어야 할 때
      if (route.params?.selectedAnnouncement) {
        // Firestore에서 해당 공지사항의 '읽음' 상태를 업데이트한다.
        const markAsRead = async () => {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // 모든 알림을 가져와서, 선택된 공지사항에 해당하는 알림을 '읽음'으로 표시한다.
            const updatedNotifications = userSnap.data().notifications.map(n => {
              if (n.id === route.params.selectedAnnouncement.id) {
                return { ...n, read: true };
              }
              return n;
            });

            // Firestore에 업데이트한다.
            await updateDoc(userRef, {
              notifications: updatedNotifications
            });

            // 컴포넌트의 상태도 업데이트한다.
            setNotifications(updatedNotifications.filter(n => !n.read));
          }
        };

        markAsRead();

        // 선택된 공지사항으로 모달을 연다.
        setSelectedAnnouncement(route.params.selectedAnnouncement);
        setAnnouncementModalVisible(true);
      }
    }, [route.params?.selectedAnnouncement]);






  useEffect(() => {
    // 로그인 상태가 변경될 때마다 실행됩니다.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 로그인한 경우
        setIsLoggedIn(true);
        setUser(currentUser);

        // 사용자 정보 가져오기
        const userRef = doc(firestore, 'users', currentUser.uid);
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists()) {
            setNickname(docSnap.data().nickname);
            setIsAdmin(docSnap.data().isAdmin || false);
            setNotifications(docSnap.data().notifications || []);
          } else {
            console.log('No such document!');
            setIsAdmin(false);
          }
        });
      } else {
        // 로그인하지 않은 경우
        setIsLoggedIn(false);
        setUser(null);
        setNickname('');
        setIsAdmin(false);
        setNotifications([]);
      }
    });

    // 로그인 상태와 관계없이 공지사항을 불러옵니다.
    fetchAnnouncements();

    // 구독 해제
    return () => unsubscribe();
  }, [currentPage]);



  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setUser(null);
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  };

  const handleLogoPress = () => {
    navigation.navigate('Home');
  };

  const renderAnnouncement = ({ item }) => {
    let imageUrl;

    if (item.title.includes('[공지]')) {
      imageUrl = './image/announcement.png';
    } else if (item.title.includes('[안내]')) {
      imageUrl = './image/notification.png';
    } else if (item.title.includes('[이벤트]')) {
      imageUrl = './image/event.png';
    } else {
      // 기본 이미지 URL (옵션)
    }

    return (
      <TouchableOpacity onPress={() => handleAnnouncementClick(item)}>
        <View style={styles.postContainer}>
          <Image source={{ uri: imageUrl }} style={styles.postImage} />
          <Text style={styles.postTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };


  // 게시글을 클릭했을 때 호출되는 함수
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementModalVisible(true); // 게시글 조회 모달 가시성 제어
    setIsEditMode(false);
  };

    const enableEditMode = () => {
      setIsEditMode(true);
      setEditedAnnouncementTitle(selectedAnnouncement.title);
      setEditedAnnouncementContent(selectedAnnouncement.content);
    };

    const saveAnnouncementEdit = async () => {
      const announcementRef = doc(firestore, 'announcements', selectedAnnouncement.id);
      await updateDoc(announcementRef, {
        title: editedAnnouncementTitle,
        content: editedAnnouncementContent,
      });
      fetchAnnouncements();
      setAnnouncementModalVisible(false);
    };

  const handleDeleteAnnouncement = async () => {
      const announcementRef = doc(firestore, 'announcements', selectedAnnouncement.id);
      await deleteDoc(announcementRef);
      fetchAnnouncements();
      setAnnouncementModalVisible(false);
    };

  const renderAnnouncementModalContent = () => {
      if (isEditMode) {
          // 수정 모드일 때의 렌더링 로직 (변경 없음)
          return (
              <ScrollView style={{ width: '100%' }}>
                  <TextInput
                      value={editedAnnouncementTitle}
                      onChangeText={setEditedAnnouncementTitle}
                      style={[styles.modalInput, { height: 50 }]}
                  />
                  <TextInput
                      value={editedAnnouncementContent}
                      onChangeText={setEditedAnnouncementContent}
                      style={[styles.modalInput, styles.modalTextInput, { height: 150 }]}
                      multiline
                  />
                  <TouchableOpacity onPress={saveAnnouncementEdit}>
                      <Text>저장</Text>
                  </TouchableOpacity>
              </ScrollView>
          );
      } else {
          // 내용이 없는 경우 이미지만 전체적으로 표시
          if (!selectedAnnouncement?.content && selectedAnnouncement?.imageUrl) {
              return (
                  <Image source={{ uri: selectedAnnouncement.imageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
              );
          }
          // 내용이 있는 경우 기존 로직 대로 렌더링
          return (
              <ScrollView style={{ width: '100%' }}>
                  <Text style={styles.postTitle}>{selectedAnnouncement?.title}</Text>
                  <View style={styles.divider} />
                  {selectedAnnouncement?.imageUrl && (
                      <Image source={{ uri: selectedAnnouncement.imageUrl }} style={{ width: '100%', height: 200 }} resizeMode="contain" />
                  )}
                  <Text style={styles.postContent}>{selectedAnnouncement?.content}</Text>
              </ScrollView>
          );
      }
  };

  const closeAnnouncementModal = () => {
    setAnnouncementModalVisible(false);
  };

  const renderPagination = () => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <TouchableOpacity key={i} onPress={() => setCurrentPage(i)} style={[styles.pageButton, currentPage === i && styles.selectedPage]}>
          <Text style={styles.pageButtonText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return pages;
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const openModal = () => {
    if (isAdmin) {
      setModalVisible(true); // 글 작성 모달 가시성 제어
    } else {
      alert('관리자만 게시글을 작성할 수 있습니다.');
    }
  };

  const closeModal = () => {
      setModalVisible(false);
    };


    const getAnnouncementModalHeight = () => {
      const baseHeight = 160; // 기본 높이
      const contentLength = selectedAnnouncement ? selectedAnnouncement.content.length : 0;
      return Math.min(baseHeight + contentLength * 0.5); // 최대 높이 제한
    };

    const getModalStyle = () => {
      return {
        ...styles.modal,
        height: getAnnouncementModalHeight()
      };
    };

  // 새 공지사항을 생성하고 모든 사용자에게 알림 추가 (이미지 업로드 포함)
  const createNewAnnouncement = async () => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    // 이미지 업로드 로직 추가
    let imageUrl = ''; // 업로드된 이미지의 URL을 저장할 변수
    if (selectedImage) {
      const storage = getStorage();
      const storageRef = ref(storage, `announcements/${selectedImage.name}_${Date.now()}`);
      try {
        const snapshot = await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading image: ", error);
        return; // 이미지 업로드에 실패한 경우 함수 종료
      }
    }

    try {
      const newAnnouncement = {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        authorId: user.uid,
        authorNickname: nickname,
        createdAt: new Date(),
        imageUrl: imageUrl, // 업로드된 이미지의 URL 추가
      };
      const docRef = await addDoc(collection(firestore, 'announcements'), newAnnouncement);

      // 사용자 알림 추가 로직은 기존과 동일
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      usersSnapshot.forEach(async (userDoc) => {
        const userNotifications = userDoc.data().notifications || [];
        await updateDoc(doc(firestore, 'users', userDoc.id), {
          notifications: [...userNotifications, { id: docRef.id, ...newAnnouncement }]
        });
      });

      // 상태 초기화 및 모달 닫기
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setSelectedImage(null); // 이미지 선택 상태 초기화
      fetchAnnouncements();
      closeModal();
    } catch (error) {
      console.error("Error adding new announcement: ", error);
    }
  };





  const handleSearch = () => {
    setAnnouncements([]);
    setCurrentPage(1);
    fetchAnnouncements();
  };


  // 알림 버튼 클릭 핸들러
    const handleNotificationClick = () => {
      setNotificationModalVisible(true);
    };

    // 확인 핸들러
    const handleNotificationConfirm = async (notification) => {
      // 선택된 알림에 해당하는 공지사항 설정
      setSelectedAnnouncement(notification);

      // Firestore의 사용자 데이터 업데이트
      const updatedNotifications = notifications.filter(n => n.id !== notification.id);
      setNotifications(updatedNotifications);

      await updateDoc(doc(firestore, 'users', user.uid), {
        notifications: updatedNotifications
      });

      // 알림 모달 닫기
      setNotificationModalVisible(false);

      // 공지 모달 열기
      setAnnouncementModalVisible(true);
    };


      const renderNotificationModalContent = () => {
        return (
          <View>
            {notifications.map((notification, index) => (
              <View key={index}>
                <Text>[공지] {notification.title}</Text>
                <TouchableOpacity onPress={() => handleNotificationConfirm(notification)}>
                  <Text>확인하기</Text>
                </TouchableOpacity>
              </View>
            ))}
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

      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Image source={{ uri: './image/flowe_wide.png' }} style={styles.logo} />
          </TouchableOpacity>
        </View>

      </View>

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
            <Text style={[styles.menuText, styles.selectText]}>공지사항</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>공지사항</Text>

        <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="궁금한 키워드를 검색하세요"
                  value={searchQuery}
                  onChangeText={text => setSearchQuery(text)}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Image source={{ uri: './image/search_button.png' }} style={styles.searchButtonImage} />
                </TouchableOpacity>
              </View>

        <View style={styles.postsBox}>
          <FlatList
            data={announcements.slice((currentPage - 1) * 10, currentPage * 10)}
            renderItem={renderAnnouncement}
            keyExtractor={item => item.id}
            style={styles.postListContainer}
            ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
          />
        </View>

        <View style={styles.pagination}>
          <TouchableOpacity onPress={goToPreviousPage} style={styles.pageButton}>
            <Text>{'<'}</Text>
          </TouchableOpacity>
          {renderPagination()}
          <TouchableOpacity onPress={goToNextPage} style={styles.pageButton}>
            <Text>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {isLoggedIn && isAdmin && (
          <TouchableOpacity style={styles.floatingButton} onPress={openModal}>
            <Image source={{ uri: './image/floating_button.png' }} style={styles.floatingButtonImage} />
          </TouchableOpacity>
        )}
      </View>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={isAnnouncementModalVisible}
        onRequestClose={closeAnnouncementModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity onPress={closeAnnouncementModal} style={styles.modalCloseButton}>
              <Image source={{ uri: './image/close_button.png' }} style={styles.modalCloseButtonImage} />
            </TouchableOpacity>
            {renderAnnouncementModalContent()}
            {user?.uid === selectedAnnouncement?.authorId && !isEditMode && (
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity onPress={enableEditMode}>
                  <Text>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteAnnouncement}>
                  <Text>삭제</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </View>
      </Modal>


      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                  <Image source={{ uri: './image/close_button.png' }} style={styles.modalCloseButtonImage} />
            </TouchableOpacity>
            <TextInput
              style={[styles.modalInput, { fontWeight: '600' }]}
              placeholder="글 제목을 입력해주세요"
              value={newAnnouncementTitle}
              onChangeText={setNewAnnouncementTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextInput]}
              placeholder="문구를 작성하거나 설명을 추가하세요.."
              multiline
              value={newAnnouncementContent}
              onChangeText={setNewAnnouncementContent}
            />
            <TouchableOpacity onPress={selectImage}>
              <Text>이미지 선택</Text>
            </TouchableOpacity>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={createNewAnnouncement}>
                <Text style={styles.modalButtonText}>게시하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* 알림 모달 */}
            <Modal
              visible={isNotificationModalVisible}
              onRequestClose={() => setNotificationModalVisible(false)}
              transparent={true} // 투명하게 설정
            >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
              <TouchableOpacity onPress={() => setNotificationModalVisible(false)} style={styles.modalCloseButton}>
                  <Image source={{ uri: './image/close_button.png' }} style={styles.modalCloseButtonImage} />
                </TouchableOpacity>
                {/* 알림 내용 렌더링 */}
                {renderNotificationModalContent()}
                </View>
                </View>
            </Modal>
    </View>
  );
}

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
  headerContainer: {
      flexDirection: 'row',

      width: '100%',

    },
    logoContainer: {
      flex: 1,
      marginTop: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 35,
    },
  logo: {
    width: 300,
    height: 85,
  },
  notificationButton: {

       marginRight:15,
       marginTop:10,
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
    color: '#31ac66',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 20,
    color: '#333333',
    marginBottom: 30,
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '50%',
      position: 'relative',
      marginBottom: 30,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 5,
      padding: 10,
      paddingRight: 40, // 버튼의 크기에 맞게 padding을 조정
      borderColor: '#ddd',
    },
    searchButton: {
      position: 'absolute',
      right: 10,
      height: '100%',
      justifyContent: 'center',
    },
    searchButtonImage: {
      width: 25, // 이미지의 너비
      height: 25, // 이미지의 높이
    },
  postsBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    width: '86%',
    padding: 10,
    marginBottom: 20,
  },
  postListContainer: {
    width: '100%',
  },
  postContainer: {
    padding: 10,
  },
  postTitle: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    fontSize: 18,
    color: '#333333',
  },
  postContent: {
    fontFamily: 'Noto Sans KR',
    fontSize: 16,
    color: '#555555',
    marginTop: 5,
  },
  postMeta: {
    fontFamily: 'Noto Sans KR',
    fontSize: 14,
    color: '#888888',
    marginTop: 5,
  },
  postSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ddd',
  },
  divider: {
      height: 1,
      backgroundColor: '#ddd',
      marginVertical: 10,
    },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pageButton: {
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#dddddd',
    padding: 5,
    width: 35, // 너비와 높이를 같게 설정하여 정사각형을 만듭니다.
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPage: {
    borderColor: '#31ac66',
  },
  pageButtonText: {
    color: '#333',
  },
  floatingButton: {
    position: 'fixed',
    right: 130,
    bottom: 120, // Adjusted position
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#31ac66',
    justifyContent: 'center',
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
  floatingButtonImage: {
    width: 95,
    height: 98,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '40%',
    height: '63%',
    backgroundColor: '#fff',
    borderRadius: 10,
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
  modalInput: {
    width: '100%',
    marginVertical: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  modalTextInput: {
    height: '80%',
    textAlignVertical: 'top',
    marginVertical: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  modalCloseButton: {
      alignSelf: 'flex-end',
    },
    modalCloseButtonImage: {
      width: 24, // 이미지 크기 조절
      height: 24,
    },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#31ac66',
    borderRadius: 25,
    padding: 15,
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalButtonText: {
    fontFamily: 'Noto Sans KR',
    fontWeight: '700',
    color: 'white',
    fontWeight: 'bold',
  },
  editButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },

    notificationBadge: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      notificationBadgeText: {
        color: 'white',
        fontSize: 12,
      },
      modalContent: {
        width: '40%',
            height: '60%',
            backgroundColor: '#fff',
            borderRadius: 10,
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
      closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
      },
      fullScreenImage: {
              width: '97%',
              height: '97%', // 전체 높이의 대부분을 차지하도록 설정
              resizeMode: 'contain', // 이미지 비율을 유지하면서 전체 보기
          },

          postContainer: {
              flexDirection: 'row', // 이미지와 텍스트가 나란히 오도록 설정
              padding: 20,
              alignItems: 'center', // 이미지와 텍스트 정렬
            },
            postImage: {
              width: 220, // 이미지 크기 조정
              height: 220,
              marginRight: 10, // 텍스트와의 간격 설정
            },
});

export default AnnouncementScreen;
