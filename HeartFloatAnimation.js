import React, { useEffect, useState } from 'react';
import { View, Image, Animated } from 'react-native';

const HeartFloatAnimation = () => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart = {
        id: Math.random(),
        animation: new Animated.Value(0),
        // 하트 생성 위치를 더 넓은 범위로 조정. 예: 화면의 0% ~ 120% 범위 내
        left: `${Math.random() * 120}%`,
      };
      setHearts(currentHearts => [...currentHearts, newHeart]);

      Animated.timing(newHeart.animation, {
        toValue: 1,
        duration: 4000, // 하트 올라가는 속도를 4초로 조정하여 느리게 함
        useNativeDriver: true,
      }).start(() => {
        setHearts(currentHearts => currentHearts.filter(heart => heart.id !== newHeart.id));
      });
    }, 150); // 하트 생성 간격 유지

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
      {hearts.map(heart => (
        <Animated.View
          key={heart.id}
          style={{
            position: 'absolute',
            bottom: 0,
            left: heart.left,
            transform: [{ translateY: heart.animation.interpolate({ inputRange: [0, 1], outputRange: [0, -600] }) }], // 하트가 더 높이 올라갈 수 있도록 조정
            opacity: heart.animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), // 하트의 시작 투명도를 0.8로 조정하여 더 투명하게 시작
          }}
        >
          <Image source={{ uri: './image/heart.png' }} style={{ width: 14, height: 12 }} />
        </Animated.View>
      ))}
    </View>
  );
};

export default HeartFloatAnimation;
