const GEOCODING_API_KEY = 'AIzaSyCkRbyonCvO0212wyJYH64jpQKu2jhKVzU';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyhCU6IUePZE1dwS6BJrjKm2xKTD3aI2NK6XoMExxcXWsj7EmNgAMMsbNje52F9dWWFyA/exec'; 

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
                note: note
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
                const placeName = data.results[0].formatted_address; // 获取第一个结果的格式化地址
                callback(placeName);
            } else {
                alert('獲取地名失敗，稍後重試。');
            }
        })
        .catch(error => {
            alert('未知錯誤，請稍後重試。');
        });
}

function addRecordToSheet(data) {
    fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // 由于GAS不设置CORS头，所以使用no-cors模式
        body: JSON.stringify(data)
    })
    .then(() => {
        alert('記錄成功！');
    })
    .catch(error => {
        alert('未知錯誤，請稍後重試');
    });
}
