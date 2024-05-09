import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, Modal, ScrollView } from 'react-native';
import { auth, firestore } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where } from 'firebase/firestore';

function ShareStoryScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalVisible, setModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // 게시글 모달 관련 상태
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPostTitle, setEditedPostTitle] = useState('');
  const [editedPostContent, setEditedPostContent] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // 현재 답글을 작성하는 대상 댓글 ID
  const [newReply, setNewReply] = useState(''); // 새 답글 내용
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [editingRepliesContent, setEditingRepliesContent] = useState({});

  const [authorProfileImage, setAuthorProfileImage] = useState('');
  const [commenterProfileImages, setCommenterProfileImages] = useState({});
  const [userProfileImage, setUserProfileImage] = useState('');

  const [isSmallModalVisible, setSmallModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [selectedReply, setSelectedReply] = useState(null);




  const fetchPosts = async () => {
    try {
      let queryRef = collection(firestore, 'posts');
      queryRef = query(queryRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(queryRef);
      let fetchedPosts = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const postId = doc.id;
        const commentsQuerySnapshot = await getDocs(query(collection(firestore, 'comments'), where('postId', '==', postId)));

        // 삭제되지 않은 댓글만 카운트
              const commentsCount = commentsQuerySnapshot.docs.filter(doc => {
                const comment = doc.data();
                return !comment.isDeleted;
              }).length;

        return { id: postId, ...doc.data(), commentsCount };
      }));

      // 클라이언트 측에서 제목과 내용 기준으로 필터링
      if (searchQuery) {
        fetchedPosts = fetchedPosts.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setPosts(fetchedPosts);
      setTotalPages(Math.ceil(fetchedPosts.length / 10));
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };


  // 댓글과 답글 불러오기
  const fetchComments = async (postId) => {
    try {
      const querySnapshot = await getDocs(query(collection(firestore, 'comments'), where('postId', '==', postId), orderBy('createdAt')));
      const commentsWithReplies = [];

      for (const doc of querySnapshot.docs) {
        const commentData = doc.data();
        // 상위 댓글이 삭제되었는지 확인 (답글에는 영향을 주지 않음)
        const isCommentDeleted = commentData.isDeleted || false;

        if (!commentData.parentId) {
          // 상위 댓글에 대한 답글 불러오기 (상위 댓글의 삭제 상태는 하위 답글에 영향을 주지 않음)
          const replies = await fetchReplies(doc.id);
          commentsWithReplies.push({ id: doc.id, ...commentData, replies, isDeleted: isCommentDeleted });
        }
      }

      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };

  // 답글에 대한 답글을 재귀적으로 불러오는 함수
  const fetchReplies = async (parentId) => {
    const repliesSnapshot = await getDocs(query(collection(firestore, 'comments'), where('parentId', '==', parentId), orderBy('createdAt')));
    const replies = [];

    for (const replyDoc of repliesSnapshot.docs) {
      const replyData = replyDoc.data();
      // 각 답글의 삭제 여부를 개별적으로 확인
      const isReplyDeleted = replyData.isDeleted || false;
      const nestedReplies = await fetchReplies(replyDoc.id); // 상위 답글의 삭제 상태를 전달하지 않음
      replies.push({ id: replyDoc.id, ...replyData, replies: nestedReplies, isDeleted: isReplyDeleted });
    }

    return replies;
  };

  const fetchUserProfileImage = async (userId) => {
    if (!userId) return null;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().profileImage;
      } else {
        console.log('No such user!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile image: ', error);
      return null;
    }
  };


  useEffect(() => {
    fetchUserProfileImage(user?.uid).then(url => {
          setUserProfileImage(url);
        });

    // 게시글 작성자의 프로필 이미지 가져오기
    fetchUserProfileImage(selectedPost?.authorId)
      .then(url => setAuthorProfileImage(url));

    // 댓글 작성자의 프로필 이미지 가져오기
    const newCommenterProfileImages = {};
        comments.forEach(comment => {
          fetchUserProfileImage(comment.authorId).then(url => {
            newCommenterProfileImages[comment.authorId] = url || null;
            comment.replies.forEach(reply => {
              fetchUserProfileImage(reply.authorId).then(replyUrl => {
                newCommenterProfileImages[reply.authorId] = replyUrl || null;
              });
            });
            setCommenterProfileImages(newCommenterProfileImages);
          });
        });
      }, [user, selectedPost, comments]);

      useEffect(() => {
          // 모달이 열릴 때 모든 프로필 이미지를 로딩
          const loadProfileImages = async () => {
            const newCommenterProfileImages = {};
            for (const comment of comments) {
              const commentImageUrl = await fetchUserProfileImage(comment.authorId) || null;
              newCommenterProfileImages[comment.authorId] = commentImageUrl;
              for (const reply of comment.replies) {
                const replyImageUrl = await fetchUserProfileImage(reply.authorId) || null;
                newCommenterProfileImages[reply.authorId] = replyImageUrl;
              }
            }
            setCommenterProfileImages(newCommenterProfileImages);
            const userImageUrl = await fetchUserProfileImage(user?.uid) || null;
            setUserProfileImage(userImageUrl);
          };

          if (isPostModalVisible) {
            loadProfileImages();
          }
        }, [isPostModalVisible, comments, user]);



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


    fetchPosts();

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

  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePostClick(item)}>
      <View style={styles.postContainer}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.postContent}>{item.content.substring(0, 50)}...</Text>
        <Text style={styles.postMeta}>
          {item.authorNickname}, {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}, 댓글: {item.commentsCount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handlePostClick = (post) => {
    setSelectedPost(post);
    fetchComments(post.id).then(() => {
      setPostModalVisible(true);
    });
    setIsEditMode(false);
  };

  const enableEditMode = () => {
    setIsEditMode(true);
    setEditedPostTitle(selectedPost.title);
    setEditedPostContent(selectedPost.content);
  };

  const savePostEdit = async () => {
    const postRef = doc(firestore, 'posts', selectedPost.id);
    await updateDoc(postRef, {
      title: editedPostTitle,
      content: editedPostContent,
    });
    fetchPosts();
    setPostModalVisible(false);
  };

  const handleDeletePost = async () => {
    const postRef = doc(firestore, 'posts', selectedPost.id);
    await deleteDoc(postRef);
    fetchPosts();
    setPostModalVisible(false);
  };

  const renderPostModalContent = () => {
    if (isEditMode) {
      return (
        <View>
          <TextInput
            value={editedPostTitle}
            onChangeText={setEditedPostTitle}
            style={styles.modalInput}
          />
          <TextInput
            value={editedPostContent}
            onChangeText={setEditedPostContent}
            style={[styles.modalInput, styles.modalTextInput]}
            multiline
          />
          <TouchableOpacity onPress={savePostEdit}>
            <Text>저장</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <>
                  {/* 게시글 제목 및 작성자 정보 */}
                  <View style={styles.postHeader}>
                    {authorProfileImage ? (
                      <Image source={{ uri: authorProfileImage }} style={styles.authorProfileImage} />
                    ) : (
                      <View style={styles.defaultProfileImage} />
                    )}
                    <Text style={styles.authorName}>{selectedPost?.authorNickname}</Text>
                  </View>
                  <Text style={styles.postTitle}>{selectedPost?.title}</Text>
                  <View style={styles.separator} />

                  {/* 글 내용 및 댓글/답글 */}
                  <ScrollView style={styles.contentScroll}>
                    <Text style={styles.postContent}>{selectedPost?.content}</Text>
                    {user?.uid === selectedPost?.authorId && !isEditMode && (
                              <View style={styles.editButtonsContainer}>
                                <TouchableOpacity onPress={() => handleSelectPost(selectedPost)}>
                                  <Image source={{ uri: './image/threedots.png' }} style={styles.actionIcon} />
                                </TouchableOpacity>
                              </View>
                            )}
                    {/* 댓글 및 답글 */}
                                <View style={styles.commentsList}>
                                  <FlatList
                                    data={comments}
                                    renderItem={renderComment}
                                    keyExtractor={(item) => item.id}
                                  />
                                </View>
                  </ScrollView>
                  <View style={styles.separator} />
                              <View style={styles.commentContainer}>
                              {userProfileImage ? (
                                          <Image source={{ uri: userProfileImage }} style={styles.commenterProfileImage} />
                                        ) : (
                                          <View style={styles.defaultProfileImageSmall} />
                                        )}
                                <TextInput
                                  style={styles.commentInput}
                                  placeholder="댓글을 작성하세요"
                                  value={newComment}
                                  onChangeText={setNewComment}
                                />
                                <TouchableOpacity onPress={addComment} style={styles.commentButton}>
                                  <Text style={styles.commentButtonText}>작성</Text>
                                </TouchableOpacity>
                              </View>
                </>
      );
    }
  };

  const closePostModal = () => {
    setPostModalVisible(false);
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
    setNewPostTitle(''); // 게시글 제목 초기화
    setNewPostContent(''); // 게시글 내용 초기화
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const createNewPost = async () => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      const newPost = {
        title: newPostTitle,
        content: newPostContent,
        authorId: user.uid,
        authorNickname: nickname, // 닉네임 저장
        createdAt: serverTimestamp(),
        commentsCount: 0,
      };
      await addDoc(collection(firestore, 'posts'), newPost);
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts();
      closeModal();
    } catch (error) {
      console.error("Error adding new post: ", error);
    }
  };

  // 댓글을 작성하고 저장하는 함수
    const addComment = async () => {
      if (!user) {
        console.error("User not logged in");
        return;
      }

      try {
        const newCommentData = {
          postId: selectedPost.id,
          content: newComment,
          authorId: user.uid,
          authorNickname: nickname, // 닉네임 추가
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, 'comments'), newCommentData);
        setNewComment('');
        fetchComments(selectedPost.id);

        // 댓글을 작성한 후에 게시글 목록을 다시 불러옴
        fetchPosts(); // 이 부분 추가
      } catch (error) {
        console.error("Error adding new comment: ", error);
      }
    };


    // 댓글 렌더링 함수
    const renderComment = ({ item }) => {
      return (
        <View style={styles.commentItem}>
          {item.isDeleted ? (
            <Text style={styles.deletedCommentText}>삭제된 댓글입니다</Text>
          ) : (
            <>
              <View style={styles.commentHeader}>
                {commenterProfileImages[item.authorId] ? (
                  <Image source={{ uri: commenterProfileImages[item.authorId] }} style={styles.commentProfileImage} />
                ) : (
                  <View style={styles.defaultCommentProfileImageSmall} />
                )}
                <Text style={styles.commentAuthor}>{item.authorNickname}</Text>
              </View>
              {item.isEditing ? (
                <>
                  <TextInput
                    style={styles.commentInput}
                    value={item.editedContent}
                    onChangeText={(text) => setComments(comments.map(comment => comment.id === item.id ? { ...comment, editedContent: text } : comment))}
                  />
                  {user?.uid === item.authorId && (
                    <TouchableOpacity onPress={() => handleSave(item.id)}>
                      <Text>저장</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.commentContent}>{item.content}</Text>
                  {user?.uid === item.authorId && !item.isDeleted && (
                    <View style={styles.commentActions}>
                      <TouchableOpacity onPress={() => startEditComment(item)}>
                        <Text>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteComment(item.id)}>
                        <Text>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => startReply(item.id)}>
                    <Text>답글</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          {replyingTo === item.id && (
            <View style={styles.replyInputSection}>
                          {userProfileImage ? (
                            <Image source={{ uri: userProfileImage }} style={styles.commentProfileImage} />
                          ) : (
                            <View style={styles.defaultCommentProfileImageSmall} />
                          )}
              <TextInput
                style={styles.commentInput}
                placeholder="답글을 작성하세요"
                value={newReply}
                onChangeText={setNewReply}
              />
              <TouchableOpacity onPress={() => addReply(item.id)}>
                <Text>답글 게시</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.replies && renderReplies(item.replies)}
        </View>
      );
    };




    // 답글 렌더링 함수
    const renderReplies = (replies) => {
      return replies.map(reply => {
        if (reply.isDeleted) {
          return (
            <View key={reply.id}>
              <Text style={styles.deletedReplyText}>삭제된 답글입니다</Text>
              {reply.replies && renderReplies(reply.replies)}
            </View>
          );
        }

        return (
          <View key={reply.id} style={styles.replyItem}>
          <View style={styles.commentHeader}>
                    {commenterProfileImages[reply.authorId] ? (
                      <Image source={{ uri: commenterProfileImages[reply.authorId] }} style={styles.commentProfileImage} />
                    ) : (
                      <View style={styles.defaultCommentProfileImageSmall} />
                    )}
                    <Text style={styles.commentAuthor}>{reply.authorNickname}</Text>
                  </View>
            {reply.isEditing ? (
              <>
                <TextInput
                  style={styles.commentInput}
                  value={editingRepliesContent[reply.id] || reply.content}
                  onChangeText={(text) => setEditingRepliesContent(prev => ({ ...prev, [reply.id]: text }))}
                />
                {user?.uid === reply.authorId && (
                  <TouchableOpacity onPress={() => handleSaveReplyEdit(reply.id)}>
                    <Text>저장</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.replyText}>
                  {reply.content}
                </Text>
                {user?.uid === reply.authorId && (
                  <View style={styles.replyActions}>
                    <TouchableOpacity onPress={() => startEditReply(reply.id, reply.content)}>
                      <Text>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteReply(reply.id)}>
                      <Text>삭제</Text>
                    </TouchableOpacity>
                  </View>
                )}


                <TouchableOpacity onPress={() => startReply(reply.id)}>
                              <Text>답글</Text>
                            </TouchableOpacity>
              </>
            )}
            {replyingTo === reply.id && (
            <View style={styles.replyInputSection}>
                          {userProfileImage ? (
                            <Image source={{ uri: userProfileImage }} style={styles.commenterProfileImage} />
                          ) : (
                            <View style={styles.defaultProfileImageSmall} />
                          )}

                <TextInput
                  style={styles.commentInput}
                  placeholder="답글을 작성하세요"
                  value={newReply}
                  onChangeText={setNewReply}
                />
                <TouchableOpacity onPress={() => addReply(reply.id)}>
                  <Text>답글 게시</Text>
                </TouchableOpacity>
              </View>
            )}
            {reply.replies && renderReplies(reply.replies)}
          </View>
        );
      });
    };






    // 댓글 수정 모드 활성화 함수
    const startEditComment = (comment) => {
        setComments(comments.map(c => {
          if (c.id === comment.id) {
            return { ...c, isEditing: true, editedContent: c.content };
          }
          return c;
        }));
      };

    // 댓글 수정 완료 및 저장
      const handleSave = async (commentId) => {
        const editedComment = comments.find(comment => comment.id === commentId);

        if (editedComment && editedComment.editedContent !== editedComment.content) {
          try {
            const commentRef = doc(firestore, 'comments', commentId);
            await updateDoc(commentRef, {
              content: editedComment.editedContent,
            });

            setComments(comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, content: editedComment.editedContent, isEditing: false };
              }
              return comment;
            }));
          } catch (error) {
            console.error("Error updating comment: ", error);
          }
        } else {
          setComments(comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, isEditing: false };
            }
            return comment;
          }));
        }
      };

    // 댓글 삭제 함수
    const deleteComment = async (commentId) => {
      try {
        const commentRef = doc(firestore, 'comments', commentId);
        await updateDoc(commentRef, {
          isDeleted: true,
        });
        fetchComments(selectedPost.id);

        fetchPosts();
      } catch (error) {
        console.error("Error marking comment as deleted: ", error);
      }
    };

    // 답글 작성을 시작하는 함수
      const startReply = (parentId) => {
        setReplyingTo(parentId);
        setNewReply('');
      };

      // 새 답글 추가 함수
      const addReply = async (parentId) => {
        if (!user) {
          console.error("User not logged in");
          return;
        }

        try {
          const newReplyData = {
            postId: selectedPost.id, // 게시글 ID
            content: newReply, // 답글 내용
            authorId: user.uid, // 사용자 ID
            authorNickname: nickname, // 사용자 닉네임
            createdAt: serverTimestamp(),
            parentId: parentId // 상위 댓글 또는 답글의 ID
          };
          await addDoc(collection(firestore, 'comments'), newReplyData);
          setNewReply('');
          setReplyingTo(null);
          fetchComments(selectedPost.id);

          fetchPosts(); // 이 부분 추가
        } catch (error) {
          console.error("Error adding new reply: ", error);
        }
      };


      // 답글 및 답글의 답글 수정 시작 함수
        const startEditReply = (replyId, currentContent) => {
          setEditingReplyId(replyId);
          setEditingRepliesContent(prev => ({ ...prev, [replyId]: currentContent }));
          setComments(updateCommentsAndReplies(comments, replyId, currentContent, true));
        };

        // 답글 및 답글의 답글 수정 저장 함수
        // handleSaveReplyEdit 함수 수정
        const handleSaveReplyEdit = async (replyId) => {
          const contentToUpdate = editingRepliesContent[replyId];
          if (!contentToUpdate) return;

          try {
            const replyRef = doc(firestore, 'comments', replyId);
            await updateDoc(replyRef, {
              content: contentToUpdate,
            });

            setComments(prevComments => updateCommentsAndReplies(prevComments, replyId, contentToUpdate, false)); // 즉시 상태 업데이트
            setEditingRepliesContent(prev => {
              const newEditingRepliesContent = { ...prev };
              delete newEditingRepliesContent[replyId];
              return newEditingRepliesContent;
            });
          } catch (error) {
            console.error("Error updating reply: ", error);
          }
        };

        // updateCommentsAndReplies 함수 수정
        const updateCommentsAndReplies = (comments, updatedId, updatedContent, isEditing) => {
          return comments.map(comment => {
            if (comment.id === updatedId) {
              return { ...comment, content: updatedContent, isEditing: isEditing };
            } else if (comment.replies) {
              return { ...comment, replies: updateCommentsAndReplies(comment.replies, updatedId, updatedContent, isEditing) };
            }
            return comment;
          });
        };




      // 답글 삭제 함수
      const deleteReply = async (replyId) => {
        try {
          const replyRef = doc(firestore, 'comments', replyId);
          await updateDoc(replyRef, {
            isDeleted: true,
          });
          fetchComments(selectedPost.id);

          fetchPosts();
        } catch (error) {
          console.error("Error marking reply as deleted: ", error);
        }
      };


      const handleSelectPost = (post) => {
        setSelectedPost(post);
        setSmallModalVisible(true);
      };


      // 글 및 답글에 대한 CommentActionModal
      const CommentActionModal = ({ isVisible, onClose, selectedType, selectedPost }) => {
        const handleEdit = () => {
          if (selectedType === 'post') {
            enableEditMode(); // 게시글 수정 모드 활성화
          }
          onClose();
        };

        const handleDelete = () => {
            if (selectedType === 'post') {
              handleDeletePost(selectedPost.id); // 게시글 삭제
            }
            onClose();
          };

        return (

          <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
              >
                <TouchableOpacity style={styles.smallModalOverlay} onPress={onClose}>
                  <View style={styles.smallModalContent}>
                    <TouchableOpacity onPress={handleEdit}>
                      <Text style={styles.smallModalText}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete}>
                      <Text style={styles.smallModalText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>

        );
      };



  const handleSearch = () => {
    setPosts([]);
    setCurrentPage(1);
    fetchPosts();
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

      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={handleLogoPress}>
          <Image source={{ uri: './image/flowe_wide.png' }} style={styles.logo} />
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.menuItem}>
          <TouchableOpacity onPress={() => navigation.navigate('GrowPlant')}>
            <Text style={styles.menuText}>쑥쑥 자라고 있어요</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.menuText}>내 주위 사람들은 지금</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.menuItem}>
          <TouchableOpacity onPress={() => navigation.navigate('ShareStory')}>
            <Text style={[styles.menuText, styles.selectText]}>이야기 나눠요</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>이야기 나눠요</Text>

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
            data={posts.slice((currentPage - 1) * 10, currentPage * 10)}
            renderItem={renderPost}
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

        {isLoggedIn && (
          <TouchableOpacity style={styles.floatingButton} onPress={openModal}>
            <Image source={{ uri: './image/floating_button.png' }} style={styles.floatingButtonImage} />
          </TouchableOpacity>
        )}
      </View>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity onPress={closePostModal} style={styles.modalCloseButton}>
              <Image source={{ uri: './image/close_button.png' }} style={styles.modalCloseButtonImage} />
            </TouchableOpacity>

            {renderPostModalContent()}



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
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextInput]}
              placeholder="문구를 작성하거나 설명을 추가하세요.."
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={createNewPost}>
                <Text style={styles.modalButtonText}>게시하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      <CommentActionModal
        isVisible={isSmallModalVisible}
        onClose={() => setSmallModalVisible(false)}
        selectedType={'post'}
        selectedPost={selectedPost} // selectedPost 상태 전달
      />


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
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'flex-start',
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


     postHeader: {
         flexDirection: 'row',
         alignItems: 'center',
         padding: 10
       },
       authorProfileImage: {
         width: 60,
         height: 60,
         borderRadius: 30
       },
       defaultProfileImage: {
         width: 60,
         height: 60,
         borderRadius: 30,
         backgroundColor: '#cccccc'
       },
       authorName: {
         marginLeft: 10,
         fontWeight: 'bold'
       },
       separator: {
         height: 1,
         backgroundColor: 'gray',
         marginVertical: 10
       },
       contentScroll: {
         flex: 1,
         width: '100%',
       },
       commentItem: {
         // 댓글 스타일
       },
       commentHeader: {
         flexDirection: 'row',
         alignItems: 'center',
         padding: 5
       },
       commentProfileImage: {
                width: 30,
                height: 30,
                borderRadius: 15,
              },
              defaultCommentProfileImageSmall: {
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#cccccc',
                },
       commenterProfileImage: {
         width: 40,
         height: 40,
         borderRadius: 20
       },
       defaultProfileImageSmall: {
           width: 40,
           height: 40,
           borderRadius: 20,
           backgroundColor: '#cccccc'
         },
         commentAuthor: {
         fontFamily: 'Noto Sans KR',
             fontWeight: '700',
           marginLeft: 10,
         },
         commentContent: {
         fontFamily: 'Noto Sans KR',
             fontWeight: '400',
         marginLeft: 10,
           marginTop: 5,
         },
         replyItem: {
           marginLeft: 30,
           marginTop: 10
         },
         separator: {
             height: 1,
             backgroundColor: '#ddd',
             marginVertical: 10
           },


           smallModalOverlay: {
               flex: 1,
               justifyContent: 'center',
               alignItems: 'center',
               backgroundColor: 'rgba(0, 0, 0, 0)',
             },
             smallModalContent: {
               backgroundColor: 'white',
                   padding: 20,
                   borderRadius: 10,
                   borderWidth: 1, // 경계선 두께
                   borderColor: '#ddd', // 경계선 색상
             },
             smallModalText: {
               fontSize: 18,
               marginVertical: 10,
             },
             actionIcon: {
               width: 20,
               height: 20,
               // 기타 스타일
             },

});

export default ShareStoryScreen;

