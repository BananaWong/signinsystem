function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  // 定义多个有效签到地址的坐标和半径
  var validLocations = [
    {lat: 25.116318004313122, lng: 121.5334272812756, radius: 1.1},
    {lat: 34.0653347, lng: -118.243891, radius: 1.1},
    {lat: 24.4761756, lng: 118.1055356, radius: 1.1},
  ];

  var inValidLocation = validLocations.some(function(location) {
    var distance = getDistanceFromLatLonInKm(data.lat, data.lng, location.lat, location.lng);
    return distance <= location.radius;
  });

  if (!inValidLocation) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "不在可用簽到區內 Not in the available punch-in area."}));
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(data.name) || createNewSheet(data.name);

  var date = new Date(data.time);
  var formattedDate = Utilities.formatDate(date, "GMT+8", "yyyy-MM-dd");
  var time = Utilities.formatDate(date, "GMT+8", "HH:mm:ss");

  var rowIndex = findRowIndex(sheet, formattedDate);
  if (rowIndex === -1) {
    sheet.appendRow([formattedDate, data.name, "", "", "", "", "", data.note, data.expectedStartTime, data.expectedEndTime, ""]);
    rowIndex = sheet.getLastRow() - 1;
  }

  var columnIndex = data.action === 'signIn' ? 3 : 4;
  sheet.getRange(rowIndex + 1, columnIndex).setValue(time);

  // 计算预期的总工作时间
  var expectedStart = new Date("1970-01-01T" + data.expectedStartTime + "Z");
  var expectedEnd = new Date("1970-01-01T" + data.expectedEndTime + "Z");
  var expectedTotalHours = (expectedEnd - expectedStart) / (1000 * 60 * 60);
  sheet.getRange(rowIndex + 1, 11).setValue(expectedTotalHours);

  // Calculate total hours and salary
  calculateHoursAndSalary(sheet, rowIndex);

  return ContentService.createTextOutput(JSON.stringify({status: "success", message: "記錄成功！ Record successful!"}));
}

function findRowIndex(sheet, date) {
  var range = sheet.getRange("A:A");
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === date) {
      return i;
    }
  }
  return -1;
}

function createNewSheet(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.insertSheet(name);
  sheet.appendRow(["Date", "Name", "SignIn", "SignOut", "Total Hours", "Hourly Rate", "Total Salary", "Note", "Expected Start Time", "Expected End Time", "Expected Total Hours"]);
  return sheet;
}

function calculateHoursAndSalary(sheet, rowIndex) {
  var signInTime = sheet.getRange(rowIndex + 1, 3).getValue();
  var signOutTime = sheet.getRange(rowIndex + 1, 4).getValue();

  if (signInTime && signOutTime) {
    var signIn = new Date("1970-01-01T" + signInTime + "Z");
    var signOut = new Date("1970-01-01T" + signOutTime + "Z");
    var totalHours = (signOut - signIn) / (1000 * 60 * 60);
    sheet.getRange(rowIndex + 1, 5).setValue(totalHours);

    var hourlyRate = sheet.getRange(rowIndex + 1, 6).getValue() || 0;
    var totalSalary = totalHours * hourlyRate;
    sheet.getRange(rowIndex + 1, 7).setValue(totalSalary);
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
