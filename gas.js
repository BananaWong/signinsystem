function doPost(e) {
    var data = JSON.parse(e.postData.contents);
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = spreadsheet.getSheetByName(data.name) || createNewSheet(data.name);
      
      var date = new Date(data.time);
      var formattedDate = Utilities.formatDate(date, "Asia/Taipei", "yyyy-MM-dd");
      var time = Utilities.formatDate(date, "Asia/Taipei", "HH:mm");
      
      Logger.log("Raw Time from Front-end: " + data.time);
      Logger.log("Formatted Date using Utilities.formatDate: " + formattedDate);
      Logger.log("Formatted Time using Utilities.formatDate: " + time);
  
      var hourlyRate = ["Zuzanna", "呂三玄", "吳俊樺"].includes(data.name) ? 300 : 250;
  
if (data.action === 'signIn') {
    var expectedStartTime = formatTimeStr(data.expectedStartTime);
    var actualSignInDate = new Date("1970-01-01T" + time + ":00Z");
    var expectedStartDate = new Date("1970-01-01T" + expectedStartTime + ":00Z");
    var chosenStartTime = (actualSignInDate < expectedStartDate) ? expectedStartTime : time;
    sheet.appendRow([formattedDate, data.name, chosenStartTime, "", "", hourlyRate, "", data.note, data.expectedStartTime, data.expectedEndTime, ""]);
} else {
    var lastRow = sheet.getLastRow();
    var previousSignInValue;
    var rowOffset = 1;
    do {
        previousSignInValue = sheet.getRange(lastRow - rowOffset, 3).getValue();
        Logger.log("Checking row " + (lastRow - rowOffset) + " for Sign-In Value: " + previousSignInValue);  // Added logging for each iteration
        rowOffset++;
    } while (!previousSignInValue && rowOffset <= lastRow);

    if (typeof previousSignInValue === 'object' && previousSignInValue !== null) {
        var previousSignInTime = Utilities.formatDate(previousSignInValue, "Asia/Taipei", "HH:mm");
        Logger.log("Formatted Sign-In Time from Raw Value: " + previousSignInTime);
        var previousSignInDecimal = timeToDecimal(previousSignInTime);
        Logger.log("Previous Sign-In Time in Decimal: " + previousSignInDecimal);
        var signOutDecimal = timeToDecimal(time);
        Logger.log("Sign-Out Time in Decimal: " + signOutDecimal);
        var totalHours = Math.max(0, signOutDecimal - previousSignInDecimal);
        Logger.log("Calculated Total Hours: " + totalHours);
        var totalSalary = hourlyRate * totalHours;
        sheet.appendRow([formattedDate, data.name, "", time, totalHours.toFixed(2), hourlyRate, totalSalary.toFixed(2), data.note, "", "", ""]);
    }
}
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "記錄成功！ Record successful!"}));
  }
  function getLastSignInRow(sheet) {
      var lastRow = sheet.getLastRow();
      while (lastRow > 0) {
          var signInValue = sheet.getRange(lastRow, 3).getValue();
          if (signInValue) {
              return lastRow;
          }
          lastRow--;
      }
      return -1;
  }
  
  function timeToDecimal(timeStr) {
      var parts = timeStr.split(":");
      var hours = parseInt(parts[0], 10);
      var minutes = parseInt(parts[1], 10);
      return hours + minutes / 60.0;
  }
  
  function findRowIndex(sheet, date, name) {
      var dateRange = sheet.getRange("A:A");
      var nameRange = sheet.getRange("B:B");
      var dateValues = dateRange.getValues();
      var nameValues = nameRange.getValues();
  
      for (var i = 0; i < dateValues.length; i++) {
          if (dateValues[i][0] === date && nameValues[i][0] === name) {
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
  
  function formatTimeStr(timeStr) {
      var parts = timeStr.split(":");
      if (parts.length !== 2) return "00:00";
      var hours = parseInt(parts[0], 10);
      var minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return "00:00";
      return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;
  }
  
  function testDoPost() {
      // 模拟从前端发送的签入数据
      var mockSignInEvent = {
          postData: {
              contents: JSON.stringify({
                  action: 'signIn',
                  time: new Date().toISOString(),
                  name: '测试表',
                  expectedStartTime: '11:11',
                  expectedEndTime: '22:22',
                  note: '测试'
              })
          }
      };
  
      // 调用doPost函数模拟签入
      doPost(mockSignInEvent);
  
      // Simulate a delay of 1 hour and 15 minutes
      var currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 1);
      currentDate.setMinutes(currentDate.getMinutes() + 15);
  
      // 模拟从前端发送的签出数据
      var mockSignOutEvent = {
          postData: {
              contents: JSON.stringify({
                  action: 'signOut',
                  time: currentDate.toISOString(),
                  name: '测试表',
                  expectedStartTime: '11:11',
                  expectedEndTime: '22:22',
                  note: '测试'
              })
          }
      };
  
      // 调用doPost函数模拟签出
      doPost(mockSignOutEvent);
  }
  
