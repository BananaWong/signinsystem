const GEOCODING_API_KEY = 'AIzaSyCkRbyonCvO0212wyJYH64jpQKu2jhKVzU';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx_fF9axzJvcyaT9tg3bFRW43k2j8MSHUCv0Z5apWf0n5dEaYMrW1sjg7hHk1gtflPLZA/exec'; 

document.getElementById('signInBtn').addEventListener('click', function() {
    handleAttendance('signIn');
});

document.getElementById('signOutBtn').addEventListener('click', function() {
    handleAttendance('signOut');
});

function handleAttendance(action) {
    const employeeName = document.getElementById('employeeName').value.trim();
    const note = document.getElementById('note').value.trim();

    if (!employeeName) {
        alert('請輸入姓名');
        return;
    }

    // 获取GPS位置
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        getPlaceNameFromLatLng(lat, lng, function(placeName) {
            // 使用placeName和其他信息记录数据
            const data = {
                name: employeeName,
                action: action,
                time: new Date().toISOString(),
                location: placeName,
                note: note,
                lat: lat,
                lng: lng
            };
            addRecordToSheet(data);
        });
    }, function(error) {
        alert('無法獲取位置信息');
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
                alert('獲取地名失敗，稍後重試。');
            }
        })
        .catch(error => {
            console.error(error);
            alert('網絡錯誤，請稍後重試。');
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
    .then(response => {
        if (response.ok) {
            alert('記錄成功！');
        } else {
            alert('記錄失敗，請確保您在有效區域內並且網絡連接正常。');
        }
    })
    .catch(error => {
        alert('網絡錯誤，請稍後重試。');
    });
}