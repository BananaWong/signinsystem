const GEOCODING_API_KEY = 'AIzaSyCkRbyonCvO0212wyJYH64jpQKu2jhKVzU';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyko9TaVHS9_rHp7c0zo2kYoEOOVISgY5CTZYA5-R1Du7JCjB35faiwDiCXmnxeRwaOMA/exec'; 

// 定義多個有效簽到地址的坐標和半徑
const validLocations = [
  {lat: 25.116318004313122, lng: 121.5334272812756, radius: 0.2}, // tw地址測試
  {lat: 34.0653347, lng: -118.243891, radius: 0.2}, // proxy地址測試
  {lat: 24.4761756, lng: 118.1055356, radius: 0.2}, // hub地址測試
  {lat:34.6937249,lng:135.5022535, radius: 0.2}//jp地址測試

];
document.addEventListener('DOMContentLoaded', function() {
    // 获取当前日期
    const today = new Date().toISOString().split('T')[0];

    // 获取存储的签到日期
    const signInDate = localStorage.getItem('signInDate');

    // 检查存储的签到日期是否与当前日期相同
    if (signInDate === today) {
        document.getElementById('message').innerText = '您今天簽到過了哦 / You have successfully punch-in today!';
    } else {
        // 如果不同，则重置签到标记
        localStorage.removeItem('signedInToday');
        localStorage.removeItem('signInDate');
    }
});

document.getElementById('signInBtn').addEventListener('click', function() {
    handleAttendance('signIn');
    
});

document.getElementById('signOutBtn').addEventListener('click', function() {
    handleAttendance('signOut');
});

function handleAttendance(action) {
    const employeeName = document.getElementById('employeeName').value.trim();
    const note = document.getElementById('note').value.trim();
    const expectedStartTime = document.getElementById('startTime').value;
    const expectedEndTime = document.getElementById('endTime').value;

    if (!employeeName) {
        alert('請輸入姓名 / Please enter your name');
        return;
    }
    if (!expectedStartTime || !expectedEndTime) {
        alert('請輸入預期開始時間和預期結束時間 / Please enter expected start time and end time');
        return;
    }

    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 計算用戶距離每個有效地址的距離，檢查是否在其中一個有效區域內
        const inValidLocation = validLocations.some(function(location) {
            const distance = getDistanceFromLatLonInKm(lat, lng, location.lat, location.lng);
            return distance <= location.radius;
        });

        // 如果不在任何一個有效區域內，則提示錯誤並返回
        if (!inValidLocation) {
            alert('不在可用簽到區內 Not in the available punch-in area.');
            return;
        }

        getPlaceNameFromLatLng(lat, lng, function(placeName) {
            const data = {
                name: employeeName,
                action: action,
                time: new Date().toISOString(),
                location: placeName,
                note: note,
                lat: lat,
                lng: lng,
                expectedStartTime: expectedStartTime,
                expectedEndTime: expectedEndTime,
            };
            addRecordToSheet(data);
        });
    }, function(error) {
        alert('無法獲取位置信息 / Unable to get location information');
    });
}

function getPlaceNameFromLatLng(lat, lng, callback) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GEOCODING_API_KEY}&language=zh-TW`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'OK') {
                const placeName = data.results[0].formatted_address;
                callback(placeName);
            } else {
                alert('獲取地名失敗，請稍後重試。 / Failed to get place name, please try again later.');
            }
        })
        .catch(error => {
            alert('網路錯誤，請稍後重試。 / Network error, please try again later.');
        });
}

function addRecordToSheet(data) {
    fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        alert('記錄成功！ / Record successful!');
        localStorage.setItem('signedInToday', true); // 存储签到标记
        localStorage.setItem('signInDate', new Date().toISOString().split('T')[0]);
    })
    .catch(error => {
        alert('網路錯誤，請稍後重試。 / Network error, please try again later.');
    });
}

// 計算兩個經緯度之間的距離的函數
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // 地球半徑，單位為公里
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c; // 距離，單位為公里
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
