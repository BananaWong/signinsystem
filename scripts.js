const GEOCODING_API_KEY = 'AIzaSyCkRbyonCvO0212wyJYH64jpQKu2jhKVzU';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwV5kC4C0fJ4kwrPRUL9RBMrgLILX0o0AP4Ve5eKnu7ofvGZFuEcLbwoxX19Ya02srAvA/exec'; 

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

    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

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
            alert('網絡錯誤，請稍後重試。 / Network error, please try again later.');
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
        if (response.type === 'opaque') {
            // 无法访问响应内容，但请求可能已成功
            alert('記錄請求已發送，請以實際資料爲準。 / The record may have been successful, please check the backend data.');
        } else {
            // 处理其他情况，例如解析 JSON 响应
            return response.json().then(json => {
                if (json.status === "success") {
                    alert('記錄成功！ / Record successful!');
                } else {
                    alert('記錄失敗，' + json.message + ' / Record failed, ' + json.message);
                }
            });
        }
    })
    .catch(error => {
        alert('網路錯誤，請稍後重試。 / Network error, please try again later.');
    });
}
