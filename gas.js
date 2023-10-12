function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(data.name) || createNewSheet(data.name);

    var date = new Date(data.time);
    var formattedDate = Utilities.formatDate(date, "GMT+8", "yyyy-MM-dd");
    var time = Utilities.formatDate(date, "GMT+8", "HH:mm");

    if (data.action === 'signIn') {
        var actualSignInTime = time;
        var expectedStartTime = formatTimeStr(data.expectedStartTime);
        var actualSignInDate = new Date("1970-01-01T" + actualSignInTime + ":00Z");
        var expectedStartDate = new Date("1970-01-01T" + expectedStartTime + ":00Z");

        var chosenStartTime = (actualSignInDate < expectedStartDate) ? expectedStartTime : actualSignInTime;
        sheet.appendRow([formattedDate, data.name, chosenStartTime, "", "", "", "", data.note, data.expectedStartTime, data.expectedEndTime, ""]);
    } else {
      var rowIndex = sheet.getLastRow();  // Get the index of the last row
      var previousSignInCell = sheet.getRange(rowIndex, 3);  // Get the cell containing the sign-in time
      var previousSignInValue = previousSignInCell.getValue();

        // Additional logging
         Logger.log("Row Index for previous sign-in: " + rowIndex);
         Logger.log("Cell Address for previous sign-in: " + previousSignInCell.getA1Notation());
         Logger.log("Value in the Cell: " + previousSignInCell.getValue());

            var previousSignInTime = String(sheet.getRange(sheet.getLastRow() - 1, 3).getValue());
            var previousSignInDecimal = timeToDecimal(previousSignInTime);
            var signOutDecimal = timeToDecimal(time);
            
            var totalHours = signOutDecimal - previousSignInDecimal;
        
        if (totalHours < 0) {
            totalHours = 0
        }
        if (isNaN(totalHours)) {
        totalHours = 0;
    }
         sheet.appendRow([formattedDate, data.name, "", time, totalHours.toFixed(2), "", "", data.note, data.expectedStartTime, data.expectedEndTime, ""]);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "記錄成功！ Record successful!"}));
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

    // 模拟从前端发送的签出数据
    var mockSignOutEvent = {
        postData: {
            contents: JSON.stringify({
                action: 'signOut',
                time: new Date().toISOString(),
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
