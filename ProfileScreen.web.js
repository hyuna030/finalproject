import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, FlatList, ScrollView } from 'react-native';
import { auth, firestore, storage } from './firebase'; // Firebase 인증 모듈 임포트
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Map, MapMarker } from 'react-kakao-maps-sdk';



function ProfileScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');

  // 알림 상태 관리
      const [notifications, setNotifications] = useState([]);

    // 알림 모달 상태
      const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedModal, setSelectedModal] = useState(null);
    const [newNickname, setNewNickname] = useState('');
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(null);
      const [currentPassword, setCurrentPassword] = useState('');
      const [newPassword, setNewPassword] = useState('');
      const [confirmNewPassword, setConfirmNewPassword] = useState('');
      const [friendNickname, setFriendNickname] = useState('');
      const [deletePassword, setDeletePassword] = useState('');
      const [passwordError, setPasswordError] = useState('');

      const [nicknameChangeMessage, setNicknameChangeMessage] = useState('');

      const [friendRequestMessage, setFriendRequestMessage] = useState('');
      const [friends, setFriends] = useState([]);

      const [map, setMap] = useState(null);
      const [selectedLocation, setSelectedLocation] = useState(null); // 저장된 위치
      const [markers, setMarkers] = useState([]); // 지도에 표시될 마커들
      const [info, setInfo] = useState(null); // 선택된 마커 정보
      const [searchQuery, setSearchQuery] = useState(''); // 검색어






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
                  setProfileImage(docSnap.data().profileImage);
                  setNotifications(docSnap.data().notifications || []);
                } else {
                  console.log('No such document!');
                }
              } else {
                setIsLoggedIn(false);
                setUser(null);
                setNickname(''); // 로그아웃 시 닉네임 초기화
                setProfileImage(null);
                setNotifications([]);
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
        window.location.reload();
      };

      useEffect(() => {
        let unsubscribe;

        if (user) {
          const userRef = doc(firestore, 'users', user.uid);

          // 사용자의 알림 목록에 대한 실시간 리스너 설정
          unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const updatedNotifications = doc.data().notifications || [];
              setNotifications(updatedNotifications.sort((a, b) => b.timestamp - a.timestamp)); // 최신 순으로 정렬
            }
          });
        }

        // 컴포넌트 언마운트 시 실시간 리스너 해제
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }, [user]);


      const renderNotificationModalContent = () => {
        return (
          <ScrollView style={{ width: '100%' }}>
            {[...notifications].reverse().map((notification, index) => (
              <View key={index}>
                <View style={styles.notificationItemContainer}>
                  {notification.type === 'friendRequest' && (
                    <View style={styles.notificationContentContainer}>
                      {notification.profileImageUrl ? (
                        <Image
                          source={{ uri: notification.profileImageUrl }}
                          style={styles.notificationProfileImage}
                        />
                      ) : (
                        <View style={styles.notificationProfileImagePlaceholder} />
                      )}
                      <View style={styles.notificationTextAndButtonContainer}>
                        <Text style={styles.notificationText}>
                          {notification.senderNickname}님이 친구요청을 하였습니다.
                        </Text>
                        <View style={[styles.actionContainer, { justifyContent: 'center' }]}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => acceptFriendRequest(notification.senderId, notification.id)}
                          >
                            <Text style={styles.notificationButtonText}>승인</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => rejectFriendRequest(notification.id, notification.senderId)}
                          >
                            <Text style={styles.notificationButtonText}>거절</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                  {notification.type !== 'friendRequest' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.notificationText}>
                                        [공지] {notification.title.length > 20 ? `${notification.title.slice(0, 20)}...` : notification.title}
                                      </Text>

                        <TouchableOpacity
                          style={[styles.announceButton, styles.approveButton]}
                          onPress={() => handleNotificationConfirm(notification)}
                        >
                          <Text style={styles.notificationButtonText}>확인하기</Text>
                        </TouchableOpacity>

                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        );
      };


      const handleNotificationConfirm = async (notification) => {
        // Firestore의 사용자 데이터 업데이트
        const updatedNotifications = notifications.filter(n => n.id !== notification.id);
        setNotifications(updatedNotifications);

        await updateDoc(doc(firestore, 'users', user.uid), {
          notifications: updatedNotifications
        });

        // 알림 모달 닫기
        setNotificationModalVisible(false);

        // 공지사항 페이지로 이동하고, 선택된 공지사항의 데이터 전달
        navigation.navigate('Announcement', { selectedAnnouncement: notification });
      };

      const handleNotificationClick = () => {
          setNotificationModalVisible(true);
        };





      const handleUploadImage = async (event) => {
        if (event.target.files.length > 0 && user) {
          const file = event.target.files[0];

          try {
            const storageRef = ref(storage, `profileImages/${user.uid}`);
            await uploadBytes(storageRef, file);

            const url = await getDownloadURL(storageRef);
            setProfileImage(url);

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
              profileImage: url
            });
          } catch (error) {
            console.error("Error uploading image: ", error);
          }
        } else {
          console.log("파일이 선택되지 않았거나 사용자 정보가 없습니다.");
        }
      };



        const handleDeleteImage = async () => {
          // 프로필 이미지 삭제 로직
          const storageRef = ref(storage, `profileImages/${user.uid}`);
          await deleteObject(storageRef);

          setProfileImage(null);

          // Firestore에서 프로필 이미지 URL 제거
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            profileImage: null
          });
        };




          // 닉네임 변경 로직
          const handleNicknameChange = async () => {
            if (isNicknameAvailable === null) {
              setNicknameChangeMessage('중복 확인이 필요합니다.');
            } else if (isNicknameAvailable) {
              try {
                await updateDoc(doc(firestore, 'users', user.uid), {
                  nickname: newNickname.trim()
                });
                await updateProfile(user, {
                  displayName: newNickname.trim()
                });
                setNickname(newNickname.trim());
                setNicknameChangeMessage('닉네임이 변경되었습니다.');
                setIsModalVisible(false);
              } catch (error) {
                console.error('닉네임 변경 에러: ', error);
                setNicknameChangeMessage('닉네임 변경 중 오류가 발생했습니다.');
              }
            } else {
              setNicknameChangeMessage('이미 존재하는 닉네임입니다.');
            }
          };

          const checkNicknameAvailability = async () => {
            if (newNickname.trim() === '') {
              setIsNicknameAvailable(false);
              setNicknameChangeMessage('닉네임은 공백일 수 없습니다.');
            } else {
              try {
                const querySnapshot = await getDocs(
                  query(collection(firestore, 'users'), where('nickname', '==', newNickname.trim()))
                );
                const isAvailable = querySnapshot.empty;
                setIsNicknameAvailable(isAvailable);
                setNicknameChangeMessage(isAvailable ? '사용 가능한 닉네임입니다.' : '이미 존재하는 닉네임입니다.');
              } catch (error) {
                console.error('닉네임 중복 확인 에러: ', error);
                setNicknameChangeMessage('닉네임 중복 확인 중 오류가 발생했습니다.');
              }
            }
          };


          // 비밀번호 변경 로직
          const handleChangePassword = async () => {
            // 필요한 모든 입력 확인
            if (!currentPassword || !newPassword || !confirmNewPassword) {
              setPasswordError("모든 필드를 채워주세요.");
              return;
            }

            // 새 비밀번호 길이 확인
            if (newPassword.length < 6) {
              setPasswordError("비밀번호는 6자 이상이어야 합니다.");
              return;
            }

            // 새 비밀번호 일치 여부 확인
            if (newPassword !== confirmNewPassword) {
              setPasswordError("새 비밀번호가 일치하지 않습니다.");
              return;
            }

            // 사용자 재인증 및 비밀번호 업데이트
            try {
              const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
              );
              await reauthenticateWithCredential(user, credential);
              await updatePassword(user, newPassword);

              setIsModalVisible(false);
              setPasswordError('');
              // 상태 초기화
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
            } catch (error) {
              if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                  setPasswordError("현재 비밀번호가 잘못되었습니다.");
                } else if (error.code === 'auth/too-many-requests') {
                  setPasswordError("현재 비밀번호를 너무 많이 틀렸습니다. \n 비밀번호를 재설정하여 계정을 복구하세요.");
                } else {
                console.error("비밀번호 변경 에러: ", error);
                setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
              }
            }
          };








          const handleAddFriend = async () => {
            if (!friendNickname) {
              setFriendRequestMessage('친구의 닉네임을 입력해주세요.');
              return;
            }

            try {
              if (friendNickname === nickname) {
                setFriendRequestMessage('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
                return;
              }

              const currentUserRef = doc(firestore, 'users', user.uid);
              const currentUserDoc = await getDoc(currentUserRef);
              const currentUserFriends = currentUserDoc.data().friends || [];
              const sentFriendRequests = currentUserDoc.data().sentFriendRequests || [];
              const receivedFriendRequests = currentUserDoc.data().receivedFriendRequests || [];

              const querySnapshot = await getDocs(query(collection(firestore, 'users'), where('nickname', '==', friendNickname)));
              if (querySnapshot.empty) {
                setFriendRequestMessage('존재하지 않는 사용자입니다.');
                return;
              }

              let friendId = '';
              querySnapshot.forEach((docSnap) => {
                friendId = docSnap.id;
              });

              if (currentUserFriends.includes(friendId)) {
                setFriendRequestMessage('이미 친구인 사용자입니다.');
                return;
              }

              if (sentFriendRequests.includes(friendId)) {
                setFriendRequestMessage('이미 친구 요청을 보냈습니다.');
                return;
              }

              if (receivedFriendRequests.includes(friendId)) {
                setFriendRequestMessage('이미 친구 요청을 받았습니다.');
                return;
              }

              // 친구 요청 로직
              const friendRef = doc(firestore, 'users', friendId);
              const friendData = await getDoc(friendRef);
              if (friendData.exists()) {
                const friendNotifications = friendData.data().notifications || [];
                const newNotification = {
                      id: generateUniqueId(),
                      title: `${nickname}님이 친구요청을 하였습니다.`,
                      type: 'friendRequest',
                      senderId: user.uid,
                      senderNickname: nickname, // 사용자 닉네임
                      profileImageUrl: profileImage || null,
                      read: false

                    };

                    friendNotifications.push(newNotification);

                    await updateDoc(friendRef, {
                      notifications: friendNotifications,
                      receivedFriendRequests: arrayUnion(user.uid)
                    });


                await updateDoc(currentUserRef, {
                        sentFriendRequests: arrayUnion(friendId)
                      });

                      setFriendRequestMessage('친구 요청을 보냈습니다.');
                    }

            } catch (error) {
              console.error('친구 요청 오류: ', error);
              setFriendRequestMessage('친구 요청 중 오류가 발생했습니다.');
            }
          };




          // 친구 요청 수락 함수
          const acceptFriendRequest = async (senderId, notificationId) => {
            try {
              const currentUserRef = doc(firestore, 'users', user.uid);
              const senderRef = doc(firestore, 'users', senderId);

              const currentUserData = await getDoc(currentUserRef);
              let currentUserFriends = currentUserData.data().friends || [];
              if (!currentUserFriends.includes(senderId)) {
                currentUserFriends.push(senderId);
                await updateDoc(currentUserRef, {
                  friends: currentUserFriends
                });
              }

              const senderData = await getDoc(senderRef);
              let senderFriends = senderData.data().friends || [];
              if (!senderFriends.includes(user.uid)) {
                senderFriends.push(user.uid);
                await updateDoc(senderRef, {
                  friends: senderFriends
                });
              }

              const userNotifications = currentUserData.data().notifications || [];
              const updatedNotifications = userNotifications.filter(notification => notification.id !== notificationId);
              await updateDoc(currentUserRef, {
                notifications: updatedNotifications
              });

              setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== notificationId));

              // receivedFriendRequests 및 sentFriendRequests 목록에서 제거
              await updateDoc(currentUserRef, {
                receivedFriendRequests: arrayRemove(senderId)
              });
              await updateDoc(senderRef, {
                sentFriendRequests: arrayRemove(user.uid)
              });

            } catch (error) {
              console.error('친구 요청 수락 오류:', error);
            }
          };




          // 친구 요청 거절 함수
          const rejectFriendRequest = async (notificationId, senderId) => {
            try {
              const userRef = doc(firestore, 'users', user.uid);
              const userData = await getDoc(userRef);
              const userNotifications = userData.data().notifications || [];

              const updatedNotifications = userNotifications.filter(notification => notification.id !== notificationId);
              await updateDoc(userRef, {
                notifications: updatedNotifications,
                receivedFriendRequests: arrayRemove(senderId)
              });

              setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== notificationId));


              // 상대방의 sentFriendRequests 목록에서 제거
              const senderRef = doc(firestore, 'users', senderId);
              await updateDoc(senderRef, {
                sentFriendRequests: arrayRemove(user.uid)
              });

            } catch (error) {
              console.error('친구 요청 거절 오류:', error);
            }
          };






          // 친구 목록 가져오기
          useEffect(() => {
            const fetchFriends = async () => {
              if (user) {
                const userRef = doc(firestore, 'users', user.uid);
                const userData = await getDoc(userRef);
                const userFriendsIds = userData.data().friends || [];

                // 각 친구 ID에 해당하는 닉네임 가져오기
                const friendNicknames = await Promise.all(
                  userFriendsIds.map(async (friendId) => {
                    const friendRef = doc(firestore, 'users', friendId);
                    const friendDoc = await getDoc(friendRef);
                    return friendDoc.data().nickname; // 닉네임 반환
                  })
                );

                setFriends(friendNicknames); // 닉네임 목록 상태 업데이트
              }
            };

            fetchFriends();
          }, [user]);


          // 친구 삭제 함수
          const removeFriend = async (friendNickname) => {
            try {
              // Firestore에서 친구의 ID 찾기
              const friendSnapshot = await getDocs(query(collection(firestore, 'users'), where('nickname', '==', friendNickname)));
              const friendDoc = friendSnapshot.docs[0];
              if (!friendDoc) {
                console.error('친구를 찾을 수 없습니다.');
                return;
              }
              const friendId = friendDoc.id;

              // 사용자의 친구 목록에서 해당 친구 ID 제거
              const currentUserRef = doc(firestore, 'users', user.uid);
              const currentUserData = await getDoc(currentUserRef);
              let currentUserFriends = currentUserData.data().friends || [];
              currentUserFriends = currentUserFriends.filter(id => id !== friendId);
              await updateDoc(currentUserRef, { friends: currentUserFriends });

              // 친구의 친구 목록에서 사용자 ID 제거
              const friendRef = doc(firestore, 'users', friendId);
              const friendData = await getDoc(friendRef);
              let friendFriends = friendData.data().friends || [];
              friendFriends = friendFriends.filter(id => id !== user.uid);
              await updateDoc(friendRef, { friends: friendFriends });

              // 로컬 상태 업데이트
              setFriends(currentFriends => currentFriends.filter(friend => friend.nickname !== friendNickname));
            } catch (error) {
              console.error('친구 삭제 오류:', error);
            }
          };


          const generateUniqueId = () => {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
          };

          // 친구 목록 데이터 가져오기
          const fetchFriends = async () => {
            if (user) {
              const userRef = doc(firestore, 'users', user.uid);
              const userData = await getDoc(userRef);
              const userFriendsIds = userData.data().friends || [];

              const friendsData = await Promise.all(
                userFriendsIds.map(async (friendId) => {
                  const friendRef = doc(firestore, 'users', friendId);
                  const friendDoc = await getDoc(friendRef);
                  return {
                    nickname: friendDoc.data().nickname,
                    profileImage: friendDoc.data().profileImage
                  };
                })
              );

              setFriends(friendsData.sort((a, b) => a.nickname.localeCompare(b.nickname)));
            }
          };


          // useEffect에 fetchFriends 함수 추가
          useEffect(() => {
            fetchFriends();
          }, [user]);



          // 위치 관리 모달을 열 때 수정 모드로 전환하는 함수
          const openLocationModal = () => {
            // 저장된 위치 초기화하여 검색 모드로 전환
            setSelectedLocation(null);
            setSearchQuery('');
            setInfo(null);
            setIsModalVisible(true);
            setSelectedModal('location');
          };



          // 위치 검색 결과 처리
          useEffect(() => {
            if (!map) return;

            // 검색어가 비어 있으면 요청을 보내지 않음
              if (searchQuery.trim() === '') {
                setMarkers([]); // 기존 마커 목록을 비움
                return;
              }

            const ps = new kakao.maps.services.Places();

            ps.keywordSearch(searchQuery, (data, status, _pagination) => {
              if (status === kakao.maps.services.Status.OK) {
                let newMarkers = data.map((item) => ({
                  position: { lat: parseFloat(item.y), lng: parseFloat(item.x) },
                  content: item.place_name,
                  roadAddress: item.road_address_name
                }));

                setMarkers(newMarkers);
                // 검색 결과가 있으면 첫 번째 결과로 지도 중심 이동
                if (newMarkers.length > 0) {
                  map.setCenter(new kakao.maps.LatLng(newMarkers[0].position.lat, newMarkers[0].position.lng));
                }
              }
            });
          }, [searchQuery, map]);

          // "수정" 버튼 클릭 이벤트 핸들러
          const handleModifyLocation = () => {
            openLocationModal();
          };

          // "완료" 버튼 클릭 이벤트 핸들러
          const handleSelectLocation = async () => {
            // Firestore에 위치 저장 로직
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
              savedLocation: info
            });

            setSelectedLocation(info);
            setIsModalVisible(false);
          };



          // 마커 목록 렌더링 함수
          const renderMarkerList = () => {
            return (
              <View style={styles.markerListContainer}>
                {markers.map((marker, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.markerListItem}
                    onPress={() => {
                      setInfo(marker);
                      setSearchQuery(marker.content);
                    }}
                  >
                    <Text style={styles.markerListText}>{marker.content}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          };




                    // 회원 탈퇴 로직
                    const handleDeleteAccount = async () => {
                      try {
                        if (!deletePassword) {
                          setPasswordError("비밀번호를 입력해주세요.");
                          return;
                        }

                        // 사용자 인증
                        const credential = EmailAuthProvider.credential(user.email, deletePassword);
                        await reauthenticateWithCredential(user, credential);

                        // Firestore 참조
                        const userRef = doc(firestore, 'users', user.uid);

                        // 탈퇴하는 사용자의 '보낸 친구 요청'과 '받은 친구 요청' 가져오기
                        const userDoc = await getDoc(userRef);
                        const sentFriendRequests = userDoc.data().sentFriendRequests || [];
                        const receivedFriendRequests = userDoc.data().receivedFriendRequests || [];

                         const userData = await getDoc(userRef);
                        const currentUserData = userData.data();
                        // 사용자의 친구 목록 가져오기 및 각 친구의 목록에서 사용자 삭제
                            const friendsList = currentUserData.friends || [];
                            for (const friendId of friendsList) {
                              const friendRef = doc(firestore, 'users', friendId);
                              await updateDoc(friendRef, {
                                friends: arrayRemove(user.uid)
                              });
                            }



                        // 다른 사용자의 문서에서 탈퇴하는 사용자를 제거하기
                        for (const friendId of sentFriendRequests) {
                          const friendRef = doc(firestore, 'users', friendId);
                          await updateDoc(friendRef, {
                            receivedFriendRequests: arrayRemove(user.uid)
                          });
                        }
                        for (const friendId of receivedFriendRequests) {
                          const friendRef = doc(firestore, 'users', friendId);
                          await updateDoc(friendRef, {
                            sentFriendRequests: arrayRemove(user.uid)
                          });
                        }

                        // 알림에서 탈퇴한 사용자 관련 항목 제거
                        for (const friendId of [...sentFriendRequests, ...receivedFriendRequests]) {
                          const friendRef = doc(firestore, 'users', friendId);
                          const friendDoc = await getDoc(friendRef);
                          if (friendDoc.exists()) {
                            let friendNotifications = friendDoc.data().notifications || [];
                            friendNotifications = friendNotifications.filter(notification =>
                              notification.senderId !== user.uid && notification.type !== 'friendRequest'
                            );
                            await updateDoc(friendRef, {
                              notifications: friendNotifications
                            });
                          }
                        }





                        // 고유 닉네임 생성
                        const uniqueString = Date.now().toString(36) + Math.random().toString(36).substring(2);
                        const newNickname = `탈퇴한사용자_${uniqueString}`;

                        // 게시글 및 댓글 업데이트
                        const postsRef = collection(firestore, 'posts');
                        const commentsRef = collection(firestore, 'comments');

                        const postsQuery = query(postsRef, where('authorId', '==', user.uid));
                        const postsSnapshot = await getDocs(postsQuery);
                        postsSnapshot.forEach((doc) => {
                          updateDoc(doc.ref, { authorNickname: newNickname });
                        });

                        const commentsQuery = query(commentsRef, where('authorId', '==', user.uid));
                        const commentsSnapshot = await getDocs(commentsQuery);
                        commentsSnapshot.forEach((doc) => {
                          updateDoc(doc.ref, { authorNickname: newNickname });
                        });

                        // Firestore에서 사용자 닉네임 변경 및 프로필 사진, 이메일, 전화번호 제거
                        await updateDoc(userRef, {
                          nickname: newNickname,
                          profileImage: null,
                          email: null,
                          phoneNumber: null,
                          notifications: null,
                          sentFriendRequests: null,
                            receivedFriendRequests: null,
                            friends: null,
                            savedLocation: null
                        });



                        // Firebase Auth에서 사용자 삭제
                        await deleteUser(auth.currentUser);

                        // 로컬 상태 업데이트 및 로그아웃
                        setUser(null);
                        setIsLoggedIn(false);

                        setIsModalVisible(false);
                        navigation.navigate('Home');


                      } catch (error) {
                        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                          setPasswordError('비밀번호가 일치하지 않습니다.');
                        } else if (error.code === 'auth/too-many-requests') {
                          setPasswordError("현재 비밀번호를 너무 많이 틀렸습니다. \n비밀번호를 재설정하여 계정을 복구하세요.");
                        } else {
                          // 다른 오류 처리...
                          setPasswordError('오류가 발생했습니다.');
                        }
                      }
                    };








          const openModal = (modalType) => {
                    setSelectedModal(modalType);
                    setIsModalVisible(true);

                    setNewNickname('');
                    setIsNicknameAvailable(null);
                    setNicknameChangeMessage('');


                    setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setPasswordError('');


                    if (modalType === 'friends') {
                        setFriendNickname('');
                        setFriendRequestMessage('');
                        fetchFriends(); // 친구 목록 새로고침
                      }

                      if (modalType === 'location') {
                          // Firestore에서 저장된 위치 가져오기
                          const userRef = doc(firestore, 'users', user.uid);
                          getDoc(userRef).then((docSnap) => {
                            if (docSnap.exists() && docSnap.data().savedLocation) {
                              setSelectedLocation(docSnap.data().savedLocation);
                              setSearchQuery(docSnap.data().savedLocation.content);
                              setInfo(docSnap.data().savedLocation);
                            } else {
                              // 저장된 위치가 없으면 검색 모드
                              setSelectedLocation(null);
                              setSearchQuery('');
                              setInfo(null);
                            }
                          });
                        }


                  };

                  const closeModal = () => {
                    setIsModalVisible(false);
                    // 초기화 로직 추가
                    setNewNickname('');
                    setIsNicknameAvailable(null);
                    setNicknameChangeMessage('');
                    // 나머지 필요한 상태 초기화
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
      <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <TouchableOpacity onPress={handleLogoPress}>
                  <Image source={{ uri: './image/flowe_wide.png' }} style={styles.logo} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationClick}>
                      <Image source={{ uri: './image/notice.png' }} style={{ width: 35, height: 35 }} />
                      {notifications.length > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
                        </View>
                      )}

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


                  <View style={styles.container}>
                        {/* 프로필 섹션 */}
                        <View style={styles.profileSection}>
                          <View style={styles.profileImageContainer}>
                            {profileImage ? (
                              <>
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                                  <Text style={styles.buttonText}>삭제</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <View style={styles.defaultProfileImage} />
                                <TouchableOpacity style={styles.uploadButton} onPress={() => this.fileInput.click()}>
                                  <Text style={styles.buttonText}>사진 업로드</Text>
                                </TouchableOpacity>
                                <input
                                  type="file"
                                  onChange={handleUploadImage}
                                  style={styles.hiddenFileInput}
                                  ref={fileInput => this.fileInput = fileInput}
                                />
                              </>
                            )}
                          </View>


                          <View style={styles.profileDetail}>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={styles.welcomeText}>
                              환영합니다!
                              <Text style={styles.nickname}>{nickname}</Text>
                              님
                            </Text>
                            </View>

                            <TouchableOpacity onPress={() => openModal('nickname')}>
                              <View style={styles.itemList}>
                                <Text style={styles.itemText}>닉네임 변경</Text>
                                <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowIcon} />
                              </View>
                              <View style={styles.itemLine}></View>
                            </TouchableOpacity>


                            <TouchableOpacity onPress={() => openModal('password')}>
                                                          <View style={styles.itemList}>
                                                            <Text style={styles.itemText}>비밀번호 변경</Text>
                                                            <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowIcon} />
                                                          </View>
                                                          <View style={styles.itemLine}></View>
                            </TouchableOpacity>


                            <TouchableOpacity onPress={() => openModal('friends')}>
                                                          <View style={styles.itemList}>
                                                            <Text style={styles.itemText}>친구관리</Text>
                                                            <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowIcon} />
                                                          </View>
                                                          <View style={styles.itemLine}></View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => openModal('location')}>
                                                          <View style={styles.itemList}>
                                                            <Text style={styles.itemText}>위치관리</Text>
                                                            <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowIcon} />
                                                          </View>
                                                          <View style={styles.itemLine}></View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => openModal('delete')}>
                                                          <View style={styles.itemList}>
                                                            <Text style={styles.itemText}>회원탈퇴</Text>
                                                            <Image source={{ uri: './image/right_arrow.png' }} style={styles.arrowIcon} />
                                                          </View>

                            </TouchableOpacity>


                          </View>
                        </View>

                        {/* 닉네임 변경 모달 */}
                        <Modal
                          animationType="fade"
                          transparent={true}
                          visible={isModalVisible && selectedModal === 'nickname'}
                          onRequestClose={() => {
                            setNewNickname(''); // 모달 닫을 때 닉네임 초기화
                            setIsNicknameAvailable(null); // 중복 확인 상태 초기화
                            setNicknameChangeMessage(''); // 메시지 초기화
                            closeModal();
                          }}
                        >
                          <View style={styles.modalOverlay}>
                            <View style={styles.nicknameModalView}>
                              <View style={styles.modalHeader}>
                                    {/* 닫기 버튼 */}
                                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                      <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                    </TouchableOpacity>

                                    {/* 중앙 정렬된 텍스트 */}
                                    <View style={styles.titleContainer}>
                                      <Text style={styles.modalTitle}>닉네임 변경</Text>
                                    </View>
                                  </View>
                              <View style={styles.inputWithButtonContainer}>
                                <TextInput
                                  style={[styles.inputWithButton, { fontSize: 18 }]}
                                  onChangeText={text => {
                                    setNewNickname(text);
                                    setIsNicknameAvailable(null); // 입력할 때마다 중복 확인 상태 초기화
                                    setNicknameChangeMessage(''); // 입력할 때마다 메시지 초기화
                                  }}
                                  value={newNickname}
                                  placeholder="새 닉네임을 입력해주세요"
                                  placeholderTextColor="#7D7D7D"
                                />
                                <TouchableOpacity style={styles.checkButtonInsideInput} onPress={checkNicknameAvailability}>
                                  <Text style={styles.checkButtonTextInside}>중복 확인</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.messageContainer}>
                              <Text style={isNicknameAvailable ? styles.successText : styles.errorText}>
                                      {nicknameChangeMessage}
                                    </Text>
                                    </View>
                                    <TouchableOpacity style={styles.changeButton} onPress={handleNicknameChange}>
                                      <Text style={styles.changeButtonText}>변경하기</Text>
                                    </TouchableOpacity>
                            </View>
                          </View>
                        </Modal>



                              {/* 비밀번호 변경 모달 */}
                              <Modal
                                animationType="fade"
                                transparent={true}
                                visible={isModalVisible && selectedModal === 'password'}
                              onRequestClose={closeModal}
                                                            >
                                                            <View style={styles.modalOverlay}>
                                <View style={styles.passwordModalView}>
                                <View style={styles.modalHeaderPassword}>
                                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                                      <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                                    </TouchableOpacity>

                                {/* 중앙 정렬된 텍스트 */}
                                <View style={styles.titleContainer}>
                                        <Text style={styles.modalTitle}>비밀번호 변경</Text>
                                    </View>
                                </View>

                                  <TextInput
                                    style={styles.inputPassword}
                                    onChangeText={setCurrentPassword}
                                    value={currentPassword}
                                    placeholder="현재 비밀번호"
                                    placeholderTextColor="#7D7D7D"
                                    secureTextEntry
                                  />
                                  <TextInput
                                    style={styles.inputPassword}
                                    onChangeText={setNewPassword}
                                    value={newPassword}
                                    placeholder="새 비밀번호 6자 이상"
                                    placeholderTextColor="#7D7D7D"
                                    secureTextEntry
                                  />
                                  <TextInput
                                    style={styles.inputPassword}
                                    onChangeText={setConfirmNewPassword}
                                    value={confirmNewPassword}
                                    placeholder="새 비밀번호 확인"
                                    placeholderTextColor="#7D7D7D"
                                    secureTextEntry
                                  />
                                  {passwordError && (
                                        <Text style={styles.errorText}>{passwordError}</Text>
                                      )}
                                      <TouchableOpacity style={styles.changeButtonPassword} onPress={handleChangePassword}>
                                        <Text style={styles.changeButtonText}>변경하기</Text>
                                      </TouchableOpacity>
                                    </View>
                                    </View>
                                  </Modal>

                              {/* 친구 관리 모달 */}
                              <Modal
                                animationType="fade"
                                transparent={true}
                                visible={isModalVisible && selectedModal === 'friends'}
                              >
                                <View style={styles.modalOverlay}>
                                                            <View style={styles.friendModalView}>
                                                              <View style={styles.friendModalHeader}>
                                                                    {/* 닫기 버튼 */}
                                                                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                                                      <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                                                    </TouchableOpacity>

                                                                    {/* 중앙 정렬된 텍스트 */}
                                                                    <View style={styles.titleContainer}>
                                                                      <Text style={styles.modalTitle}>친구관리</Text>
                                                                    </View>
                                </View>

                                  <View style={styles.inputWithButtonContainer}>
                                                                  <TextInput
                                                                    style={[styles.inputWithButton, { fontSize: 18 }]}
                                                                    onChangeText={setFriendNickname}                                  value={friendNickname}
                                                                    placeholder="친구 닉네임"
                                                                    placeholderTextColor="#7D7D7D"
                                                                  />
                                                                  <TouchableOpacity style={styles.friendButtonInsideInput} onPress={handleAddFriend}>
                                                                    <Text style={styles.checkButtonTextInside}>친구 요청</Text>
                                                                  </TouchableOpacity>
                                                                </View>

                                  <View style={styles.messageContainer}>
                                                                <Text style={styles.friendErrorText}>
                                                                        {friendRequestMessage}
                                                                        </Text>
                                                                      </View>

                                  {/* 친구 목록 표시 */}
                                  <View style={styles.friendListContainer}>
                                    <ScrollView style={styles.friendListScroll}>
                                      {friends.map((friend, index) => (
                                        <View key={index} style={styles.friendListItem}>
                                          {/* 프로필 이미지와 닉네임을 가로로 정렬 */}
                                          <View style={styles.friendInfoContainer}>
                                            {friend.profileImage ? (
                                              <Image source={{ uri: friend.profileImage }} style={styles.friendProfileImage} />
                                            ) : (
                                              <View style={styles.defaultFriendProfileImage} />
                                            )}
                                            <Text style={styles.friendNickname}>{friend.nickname}</Text>
                                          </View>

                                          {/* 삭제 버튼 */}
                                          <TouchableOpacity onPress={() => removeFriend(friend.nickname)} style={styles.removeFriendButton}>
                                            <Text style={styles.removeFriendButtonText}>삭제</Text>
                                          </TouchableOpacity>
                                        </View>
                                      ))}
                                    </ScrollView>
                                  </View>
                                  </View>
                                </View>
                              </Modal>

                              {/* 위치 관리 모달 */}
                                    <Modal
                                      animationType="fade"
                                      transparent={true}
                                      visible={isModalVisible && selectedModal === 'location'}
                                      onRequestClose={() => setLocationModalVisible(false)}
                                    >
                                      <View style={styles.modalOverlay}>
                                          <View style={styles.locationModalView}>
                                          <View style={styles.locationModalHeader}>
                                          {/* 닫기 버튼 */}
                                          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                                <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                          </TouchableOpacity>

                                          {/* 중앙 정렬된 텍스트 */}
                                          <View style={styles.titleContainer}>
                                                 <Text style={styles.modalTitle}>위치관리</Text>
                                          </View>
                                      </View>
                                        {selectedLocation ? (
                                        <>
                                          <View style={styles.savedLocationContainer}>
                                            <View style={styles.locationDetails}>
                                              <Text style={styles.locationTitle}>현재 위치</Text>
                                              <Text style={styles.locationText}>{selectedLocation.content}</Text>
                                              <Text>{selectedLocation.roadAddress}</Text>
                                            </View>
                                            <TouchableOpacity onPress={openLocationModal} style={styles.modifyButton}>
                                              <Image source={{ uri: './image/edit_icon.png' }} style={styles.editIcon} />
                                            </TouchableOpacity>
                                          </View>

                                            <Map
                                              center={selectedLocation.position}
                                              style={styles.mapStyle}
                                              level={3}
                                            >
                                              <MapMarker position={selectedLocation.position} />
                                            </Map>
                                          </>
                                        ) : (
                                          <>
                                            <View style={styles.searchContainer}>
                                              <TextInput
                                                style={styles.searchInput}
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                placeholder="검색어를 입력하세요"
                                              />
                                              <TouchableOpacity onPress={handleSelectLocation} style={styles.selectButton}>
                                                <Text style={styles.selectButtonText}>완료</Text>
                                              </TouchableOpacity>
                                            </View>
                                            <Map
                                              center={{
                                                lat: 37.566826,
                                                lng: 126.9786567,
                                              }}
                                              style={styles.mapStyle}
                                              level={3}
                                              onCreate={setMap}
                                            >
                                              {markers.map((marker, index) => (
                                                <MapMarker
                                                  key={`marker-${index}`}
                                                  position={marker.position}
                                                  onClick={() => {
                                                    setInfo(marker);
                                                    setSearchQuery(marker.content);
                                                  }}
                                                />
                                              ))}
                                            </Map>
                                            {/* 마커 목록 */}
                                            <ScrollView style={styles.markerList}>
                                              {renderMarkerList()}
                                            </ScrollView>
                                          </>
                                        )}
                                      </View>
                                      </View>
                                    </Modal>


                              {/* 회원 탈퇴 모달 */}
                              <Modal
                                                              animationType="fade"
                                                              transparent={true}
                                                              visible={isModalVisible && selectedModal === 'delete'}
                                                            onRequestClose={closeModal}
                                                                                          >
                                                                                          <View style={styles.modalOverlay}>
                                                              <View style={styles.withdrawalModalView}>
                                                              <View style={styles.modalHeaderWithdrawal}>
                                                              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                                                                    <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                                                                  </TouchableOpacity>

                                                              {/* 중앙 정렬된 텍스트 */}
                                                              <View style={styles.titleContainer}>
                                                                      <Text style={styles.modalTitle}>회원탈퇴</Text>
                                                                  </View>
                                                              </View>
                                    <Text style={styles.normalText}>
                                      회원탈퇴시 계정복구가 <Text style={styles.redText}>불가능</Text>합니다.
                                    </Text>
                                    <Text style={styles.normalText}>플라위를 회원탈퇴하고 싶으시면 비밀번호를 입력해주세요.</Text>

                                    <TextInput
                                      style={styles.inputWithdrawal}
                                      onChangeText={setDeletePassword}
                                      value={deletePassword}
                                      placeholder="비밀번호"
                                      placeholderTextColor="#999999"
                                      secureTextEntry={true}
                                    />
                                    <View style={styles.withdrawalMessageContainer}>
                                        {passwordError ? (
                                            <Text style={styles.errorText}>{passwordError}</Text>
                                          ) : null}
                                          </View>
                                          <TouchableOpacity
                                            style={styles.withdrawalButton}
                                            onPress={handleDeleteAccount}
                                          >

                                            <Text style={styles.withdrawalButtonText}>탈퇴하기</Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </Modal>
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


            {/* 알림 모달 */}
                        <Modal
                        animationType="fade"
                          visible={isNotificationModalVisible}
                          onRequestClose={() => setNotificationModalVisible(false)}
                          transparent={true} // 투명하게 설정
                        >
                        <View style={styles.notificationModalOverlay}>
                          <View style={styles.notificationModalView}>
                                <View style={styles.notificationModalHeader}>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setNotificationModalVisible(false)}>
                                       <Image source={{ uri: './image/close_button.png' }} style={styles.closeIcon} />
                                </TouchableOpacity>
                          {/* 중앙 정렬된 텍스트 */}
                                 <View style={styles.notificationTitleContainer}>
                                          <Text style={styles.notificationTitle}>신규 알림 {notifications.length}건</Text>
                                 </View>
                                 </View>
                            {/* 알림 내용 렌더링 */}
                            {renderNotificationModalContent()}
                            </View>
                            </View>
                        </Modal>

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
  headerContainer: {
        flexDirection: 'row',

        width: '100%',

      },
  logoContainer: {
        flex: 1,
        marginTop: 20,
        marginLeft: 35,
        justifyContent: 'center',
        alignItems: 'center',
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
      profileSection: {
          flexDirection: 'row',
          marginTop: 40,
          marginLeft: 180,
          marginRight: 150,
          marginBottom: 60,
          padding: 10,
        },
        profileImageContainer: {
          flex: 1,
          alignItems: 'center',
          marginRight: 180,
        },
        hiddenFileInput: {
            display: 'none', // 파일 입력 필드 숨기기
          },
          uploadButton: {
            backgroundColor: '#31ac66', // 초록색 배경
            width: '40%',
            padding: 15,
            borderRadius: 5,
            marginTop: 30,
          },
          deleteButton: {
            backgroundColor: '#BDBDBD', // 회색 배경
            width: '30%',
            padding: 15,
            borderRadius: 5,
            marginTop: 30,
          },
          buttonText: {
            color: 'white', // 텍스트 색상은 하얀색
            textAlign: 'center',
            fontFamily: 'Noto Sans KR',
            fontWeight: '700',
            fontSize: 15,
          },
          profileImage: {
            width: 400, // 이미지 크기 조정
            height: 400,
            borderRadius: 200,
          },
          defaultProfileImage: {
            width: 400,
            height: 400,
            borderRadius: 200,
            backgroundColor: '#BDBDBD',
          },
        profileDetail: {
          flex: 2,
          justifyContent: 'center',
        },
        welcomeText: {
        fontFamily: 'Noto Sans KR',
            fontWeight: '900',
          fontSize: 45,
          fontWeight: 'bold',
          marginBottom: 60,
        },
        nickname: {
        fontFamily: 'Noto Sans KR',
            fontWeight: '900',
          fontSize: 45,
          color: '#28C770',
        },
        itemList: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        },
        itemText: {
        fontFamily: 'Noto Sans KR',
                  fontWeight: '700',
                  fontSize: 25,
                  color: '#666666'
        },
        itemLine: {
        height: 1,
            width: '100%',
            backgroundColor: '#ddd',
            marginBottom: 15,
        },
        arrowIcon: {
          width: 40,
          height: 40,
        },
        modalOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        modalView: {
          margin: 20,
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 35,
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
        nicknameModalView: {
            width: '30%',
            height: '30%',
            backgroundColor: '#fff',
                borderRadius: 30,
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


                  alignItems: 'center',

                  width: '100%',
                  marginBottom: 50, // 하단 컨텐츠와의 간격
                },
                modalTitle: {
                  fontFamily: 'Noto Sans KR',
                  fontWeight: '700',
                  fontSize: 18,
                  // 텍스트를 중앙에 위치시키기 위해 flex 사용
                  flex: 1,
                  textAlign: 'center', // 텍스트 중앙 정렬
                },
                titleContainer: {
                    flex: 1, // 컨테이너가 모달의 가로 폭을 채우도록
                    justifyContent: 'center', // 텍스트를 컨테이너 내에서 중앙 정렬
                    alignItems: 'center',
                  },
              inputWithButtonContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#BDBDBD',
                padding: 5,
                paddingHorizontal: 8,
                borderRadius: 10,
                width: '80%',
              },

              inputWithButton: {
                flex: 1,
                marginRight: 10,
                fontFamily: 'Noto Sans KR',
                                  fontWeight: '500',
                                  width: '80%',
              },

              checkButtonInsideInput: {
                backgroundColor: '#BDBDBD',
                paddingHorizontal: 15,
                    paddingVertical: 10,
                borderRadius: 18,
                marginLeft: 10,
              },
              checkButtonTextInside: {
              fontFamily: 'Noto Sans KR',
              fontWeight: '500',
                color: 'white',
              },
              messageContainer: {
                  height: 15, // 메시지 영역의 높이를 고정
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginVertical: 10, // 변경하기 버튼과의 간격
                },
          passwordModalView: {
              width: '30%',
              height: '40%',
              backgroundColor: '#fff',
                              borderRadius: 30,
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
            inputPassword: {
            width: '80%',
            padding: 10,
              borderWidth: 1,
              borderColor: '#BDBDBD',
              borderRadius: 10, // 입력란의 테두리 둥글게
              marginTop: 15, // 입력란 간의 마진 추가
              marginBottom: 5,
              fontFamily: 'Noto Sans KR',
              fontWeight: '500',
              fontSize: 16, // 폰트 사이즈 조정
            },

            modalHeaderPassword: {


                              alignItems: 'center',

                              width: '100%',
                              marginBottom: 20, // 하단 컨텐츠와의 간격
                            },
          changeButtonPassword: {
                    width:'80%',
                      backgroundColor: '#31ac66',
                      paddingVertical: 15,
                          paddingHorizontal: 30,
                          borderRadius: 25,
                          marginTop: 15,

                                alignItems: 'center',
                                boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.35)',
                    },
          friendModalView: {
                        width: '30%',
                        height: '60%',
                        backgroundColor: '#fff',
                                        borderRadius: 30,
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

          friendModalHeader: {
              alignItems: 'center',
              width: '100%',
              marginBottom: 20, // 하단 컨텐츠와의 간격
          },
          friendButtonInsideInput: {

                          backgroundColor: '#31AC66',
                          paddingHorizontal: 15,
                              paddingVertical: 10,
                          borderRadius: 18,
                          marginLeft: 10,
                        },
          friendListContainer: {
              width: '80%', // 친구 목록 너비
              maxHeight: '70%', // 모달 내 친구 목록의 최대 높이
            },
            friendListScroll: {
              flexGrow: 0, // 스크롤 뷰가 자식 요소에 기반하여 크기가 결정되도록
            },
            friendListItem: {
              // 각 항목을 좌우 정렬
              flexDirection: 'row',
              justifyContent: 'space-between', // 좌측과 우측 정렬
              alignItems: 'center',
              paddingVertical: 10,
            },
            friendInfoContainer: {
              flexDirection: 'row',
              alignItems: 'center',
            },
            friendProfileImageContainer: {
            flexDirection: 'row',
              // 프로필 이미지 컨테이너
              marginRight: 10,
            },
            friendProfileImage: {
              // 프로필 이미지 스타일
              width: 60,
              height: 60,
              borderRadius: 30,
            },
            defaultFriendProfileImage: {
              // 기본 이미지 스타일
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#BDBDBD',
            },
            friendNickname: {
              marginLeft: 10,
              fontFamily: 'Noto Sans KR',
              fontWeight: '700',
              fontSize: 18,
            },
            removeFriendButton: {
              // 삭제 버튼 스타일
              backgroundColor: '#999999',
              padding: 10,
              borderRadius: 18,
              paddingHorizontal: 30,
              paddingVertical: 10,
              marginLeft: 10,
            },
            removeFriendButtonText: {
              // 삭제 버튼 텍스트 스타일
              color: 'white',
              fontFamily: 'Noto Sans KR',
              fontWeight: '500',
            },

            // 오류 메시지 스타일
            friendErrorText: {
              textAlign: 'center', // 텍스트 중앙 정렬

              color: 'red',
              fontFamily: 'Noto Sans KR',
              fontWeight: '500',
            },


            locationModalView: {
                        width: '50%',
                        height: '60%',
                        backgroundColor: '#fff',
                            borderRadius: 30,
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
              locationModalHeader: {
                            alignItems: 'center',
                            width: '100%',
                            marginBottom: 20, // 하단 컨텐츠와의 간격
                        },
                        searchContainer: {
                             flexDirection: 'row',
                             justifyContent: 'space-between',
                             alignItems: 'center',
                             padding: 10,
                             width: '80%'
                           },
                           searchInput: {
                           flex: 1,


                width: '80%',
                padding: 10,
                              borderWidth: 1,
                              borderColor: '#BDBDBD',
                              borderRadius: 10, // 입력란의 테두리 둥글게
                              marginRight: 10,

                              fontFamily: 'Noto Sans KR',
                              fontWeight: '500',
                              fontSize: 16, // 폰트 사이즈 조정
              },
              mapStyle: {
                width: '80%',
                height: '50%',
                marginBottom: 10,
              },
              selectButton: {
                backgroundColor: '#28a745',
                padding: 10,
                borderRadius: 5,
                width: '20%',

              },
              selectButtonText: {
              fontFamily: 'Noto Sans KR',
                                            fontWeight: '500',
                color: 'white',
                textAlign: 'center',
              },

              button: {
                padding: 10,
                backgroundColor: '#007bff',
                color: 'white',
                textAlign: 'center',
                borderRadius: 5,
                marginVertical: 10,
              },
              markerListContainer: {
                  height: 200, // 또는 적절한 값
                },
                markerList: {
                height: '20%',
                    width: '80%', // 지도의 가로 길이와 일치
                  },
                markerListItem: {


                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#ddd',

                },
                markerListText:{
                    fontFamily: 'Noto Sans KR',
                                  fontWeight: '500',
                },

                savedLocationContainer: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 5,
                    height: '15%',
                    width: '80%',
                    marginBottom: 20,
                  },
                  locationDetails: {
                    flex: 1,
                  },
                  editIcon: {
                    width: 24,
                    height: 24,
                  },
                  locationTitle: {
                                fontFamily: 'Noto Sans KR',
                                fontWeight: '700',
                                  color: 'black',
                                },
                  locationText: {
                                fontFamily: 'Noto Sans KR',
                                fontWeight: '500',
                                  color: 'black',
                                },



          withdrawalModalView: {
                        width: '30%',
                        height: '35%',
                        backgroundColor: '#fff',
                                        borderRadius: 30,
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
                          inputWithdrawal: {
                      width: '80%',
                      padding: 10,
                        borderWidth: 1,
                        borderColor: '#BDBDBD',
                        borderRadius: 10, // 입력란의 테두리 둥글게
                        marginTop: 15, // 입력란 간의 마진 추가
                        marginBottom: 5,
                        fontFamily: 'Noto Sans KR',
                        fontWeight: '500',
                        fontSize: 16, // 폰트 사이즈 조정
                      },

                      modalHeaderWithdrawal: {


                                        alignItems: 'center',

                                        width: '100%',
                                        marginBottom: 20, // 하단 컨텐츠와의 간격
                                      },
                    withdrawalButton: {
                              width:'80%',
                                backgroundColor: '#999999',
                                paddingVertical: 15,
                                    paddingHorizontal: 30,
                                    borderRadius: 25,
                                    marginTop: 15,

                                          alignItems: 'center',
                                          boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.35)',
                              },
                              withdrawalButtonText: {
                                                         color: 'white',
                                                                       fontFamily: 'Noto Sans KR',
                                                                       fontWeight: '500',
                                                            },
                              withdrawalMessageContainer: {
                              height: 15, // 메시지 영역의 높이를 고정
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginVertical: 10, // 변경하기 버튼과의 간격

                              },

                              redText: {
                              fontFamily: 'Noto Sans KR',
                                fontWeight: '400',
                                color: 'red', // 빨간색 텍스트
                                textAlign: 'center', // 가운데 정렬
                              },

                              normalText: {
                              fontFamily: 'Noto Sans KR',
                                fontWeight: '400',
                                color: '#999999', // 검은색 텍스트
                                paddingVertical: 5, // 패딩 값 조정
                                textAlign: 'center', // 가운데 정렬
                              },



          input: {
            width: '100%',
            padding: 10,
            borderColor: 'grey',
            borderWidth: 1,
            marginBottom: 10,
          },
          checkButton: {
            backgroundColor: '#BDBDBD',
            padding: 10,
            borderRadius: 5,
          },
          checkButtonText: {
            color: 'white',
          },
          changeButton: {
          width:'80%',
            backgroundColor: '#31ac66',
            paddingVertical: 15,
                paddingHorizontal: 30,
                borderRadius: 25,
                marginTop: 10,

                      alignItems: 'center',
                      boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.35)',
          },
          changeButtonText: {
          fontFamily: 'Noto Sans KR',
                        fontWeight: '500',
            color: 'white',
            fontSize: 16,
          },
          errorText: {
          fontFamily: 'Noto Sans KR',
                                          fontWeight: '500',
            color: 'red',
            marginTop: 10,
          },
          successText: {
          fontFamily: 'Noto Sans KR',
                                          fontWeight: '500',
            color: 'green',
            marginTop: 10,
          },
        closeButton: {
              position: 'absolute', // 닫기 버튼을 상대적으로 배치
                  right: 0,
                  top: 0,
            },
            closeIcon: {
              width: 24, // 이미지 크기 조절
              height: 24,
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
            modalCloseButton: {
                  alignSelf: 'flex-end',
                },
                modalCloseButtonImage: {
                  width: 24, // 이미지 크기 조절
                  height: 24,
                },



      notificationModalOverlay: {
                  flex: 1,
                  justifyContent: 'flex-start',
                      alignItems: 'flex-end',


                },

      notificationModalView: {
      position: 'absolute',
                    width: '30%',
                    height: '40%',
                    top: 80,
                    right: 40,
                    backgroundColor: '#F2F2F2',
                                    borderRadius: 40,
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

                  notificationModalHeader: {


                                                          alignItems: 'center',

                                                          width: '100%',
                                                          marginBottom: 20, // 하단 컨텐츠와의 간격
                                                        },

                  notificationTitle: {
                  fontFamily: 'Noto Sans KR',
                  fontWeight: 700,
                          fontSize: 20,
                          color: 'Black',
                  },
                  // 알림 아이템 컨테이너
                    notificationItemContainer: {
                      backgroundColor: 'white',
                      borderRadius: 10,

                      height: 100,
                      width: '99%',
                      marginBottom: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',

                    },
                    notificationContent: {
                        flex: 1,
                      },

                    // 프로필 이미지 또는 회색 동그라미
                    notificationProfileImage: {
                        width: 78,
                        height: 78,
                        borderRadius: 39,
                        marginRight: 10,
                      },
                      notificationProfileImagePlaceholder: {
                        width: 78,
                        height: 78,
                        borderRadius: 39,
                        backgroundColor: '#BDBDBD',
                        justifyContent: 'center',
                        alignItems: 'center',
                      },

                    // 승인 및 거절 버튼 스타일
                    actionButton: {
                      borderRadius: 10,
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          marginHorizontal: 5,
                          width: '50%',
                          alignItems: 'center',
                    },
                    announceButton: {
                                          borderRadius: 10,
                                              paddingVertical: 5,
                                              paddingHorizontal: 10,
                                              marginHorizontal: 5,
                                              width: '80%',
                                              alignItems: 'center',
                                              marginTop: 5,
                                        },

                    approveButton: {
                      backgroundColor: '#31AC66', // 초록색
                    },
                    rejectButton: {
                      backgroundColor: '#999999', // 회색
                    },
                    actionContainer: {
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        marginTop: 5,
                      },

                      notificationContentContainer: {
                          flexDirection: 'row', // 가로로 배치
                          alignItems: 'center', // 세로 정렬 (프로필 사진과 텍스트/버튼의 세로 위치를 맞추기 위해)

                          paddingHorizontal: 10, // 좌우 padding
                          paddingVertical: 5, // 상하 padding
                        },

                        notificationTextAndButtonContainer: {
                            flex: 1, // 프로필 사진을 제외한 나머지 공간을 차지하도록 설정
                            marginLeft: 10, // 프로필 사진과 텍스트/버튼 사이 간격 설정
                          },

                    // 공지 및 알림 텍스트 스타일
                    notificationText: {
                      fontFamily: 'Noto Sans KR',
                      fontWeight: '700',
                      fontSize: 17,
                      marginBottom: 5,
                    },
                    notificationButtonText: {
                    fontFamily: 'Noto Sans KR',
                                          fontWeight: '600',
                    color: 'white',

                    },

});

export default ProfileScreen;