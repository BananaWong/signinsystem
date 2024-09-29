const GEOCODING_API_KEY = 'AIzaSyCkRbyonCvO0212wyJYH64jpQKu2jhKVzU';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzcTllzp3F_sHITNZy6KXokT7WUj32I9T50wmoefNYQiSvIeymq6jhB79kioKkNoD93wg/exec';

const validLocations = [
  {lat: 25.116318004313122, lng: 121.5334272812756, radius: 0.2},
  {lat: 34.0653347, lng: -118.243891, radius: 0.2},
  {lat: 24.4761756, lng: 118.1055356, radius: 0.2},
  {lat:34.6937249,lng:135.5022535, radius: 100.2},//测试地址们
  {lat:	51.9172,lng:4.5049, radius: 100.2},
  {lat:3.1671,lng:101.6708, radius: 100.2}
];

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const signInDate = localStorage.getItem('signInDate');

    if (signInDate === today) {
        document.getElementById('message').innerText = '您今天簽到過了哦 / You have successfully punch-in today!';
    } else {
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
    if (expectedEndTime <= expectedStartTime) {
        alert('預期結束時間必須晚於預期開始時間 / Expected end time must be later than expected start time');
        return;
    }

    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const inValidLocation = validLocations.some(function(location) {
            const distance = getDistanceFromLatLonInKm(lat, lng, location.lat, location.lng);
            return distance <= location.radius;
        });

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
        localStorage.setItem('signedInToday', true);
        localStorage.setItem('signInDate', new Date().toISOString().split('T')[0]);
    })
    .catch(error => {
        alert('網路錯誤，請稍後重試。 / Network error, please try again later.');
    });
}

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
