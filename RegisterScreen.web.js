import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const SearchMap = () => {
  const [info, setInfo] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('이태원 맛집'); // 초기 검색어 설정

  useEffect(() => {
    if (!map) return;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(searchQuery, (data, status, _pagination) => {
      if (status === kakao.maps.services.Status.OK) {
        const bounds = new kakao.maps.LatLngBounds();
        let newMarkers = [];

        for (var i = 0; i < data.length; i++) {
          newMarkers.push({
            position: {
              lat: data[i].y,
              lng: data[i].x,
            },
            content: data[i].place_name,
          });
          bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
        }
        setMarkers(newMarkers);
        map.setBounds(bounds);
      }
    });
  }, [map, searchQuery]);



  const handleSearch = () => {
    // 검색어 변경 시 실행될 함수
    // 검색어로 장소 검색을 다시 수행합니다.
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="검색어를 입력하세요"
      />
      <button onClick={handleSearch}>검색</button>
      <Map
        center={{
          lat: 37.566826,
          lng: 126.9786567,
        }}
        style={{
          width: '100%',
          height: '350px',
        }}
        level={3}
        onCreate={setMap}
      >
        {markers.map((marker) => (
          <MapMarker
            key={`marker-${marker.content}-${marker.position.lat},${marker.position.lng}`}
            position={marker.position}
            onClick={() => setInfo(marker)}
          >
            {info && info.content === marker.content && (
              <div style={{ color: '#000' }}>{marker.content}</div>
            )}
          </MapMarker>
        ))}
      </Map>
    </div>
  );
};

export default SearchMap;

