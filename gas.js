function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(data.name) || createNewSheet(data.name);

  var date = new Date(data.time);
  var formattedDate = Utilities.formatDate(date, "GMT+8", "yyyy-MM-dd");
  var time = Utilities.formatDate(date, "GMT+8", "HH:mm:ss");

  var rowIndex = findRowIndex(sheet, formattedDate);
  if (rowIndex === -1) {
    sheet.appendRow([formattedDate, data.name, "", "", "", "", "", data.note, data.expectedStartTime, data.expectedEndTime, ""]); // 添加备注内容
    rowIndex = sheet.getLastRow() - 1;
  }

  var columnIndex = data.action === 'signIn' ? 3 : 4;
  sheet.getRange(rowIndex + 1, columnIndex).setValue(time);

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
  sheet.appendRow(["Date", "Name", "SignIn", "SignOut", "Total Hours", "Hourly Rate", "Total Salary", "Note", "Expected Start Time", "Expected End Time", "Expected Total Hours"]);// 添加备注列
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

  var expectedStartTime = sheet.getRange(rowIndex + 1, 9).getValue();
  var expectedEndTime = sheet.getRange(rowIndex + 1, 10).getValue();
  if (expectedStartTime && expectedEndTime) {
    expectedStartTime = formatTimeStr(expectedStartTime);
    expectedEndTime = formatTimeStr(expectedEndTime);

    var expectedStart = new Date("1970-01-01T" + expectedStartTime + ":00Z");
    var expectedEnd = new Date("1970-01-01T" + expectedEndTime + ":00Z");
    var expectedTotalHours = (expectedEnd - expectedStart) / (1000 * 60 * 60);
    if (!isNaN(expectedTotalHours) && expectedTotalHours >= 0) {
      sheet.getRange(rowIndex + 1, 11).setValue(expectedTotalHours);
    } else {
      sheet.getRange(rowIndex + 1, 11).setValue("#NUM!");
    }
  }
}

function formatTimeStr(timeStr) {
  var parts = timeStr.split(":");
  if (parts.length !== 2) return "00:00";
  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return "00:00";
  return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;
}
