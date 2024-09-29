function doPost(e) {
    var data = JSON.parse(e.postData.contents);

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(data.name) || createNewSheet(data.name);

    // 使用新的 Date 对象直接解析 UTC 时间
    var date = new Date(data.time); // data.time 是 ISO 8601 格式，默认解析为 UTC
    var formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var formattedTime = Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");

    Logger.log("Raw Time from Front-end: " + data.time);
    Logger.log("Formatted Date: " + formattedDate);
    Logger.log("Formatted Time: " + formattedTime);

    var hourlyRate = ["Zuzanna", "呂三玄", "吳俊樺"].includes(data.name) ? 300 : 250;

    if (data.action === 'signIn') {
        handleSignIn(sheet, data, date, formattedDate, hourlyRate);
    } else {
        handleSignOut(sheet, data, date, formattedDate, hourlyRate);
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "記錄成功！ Record successful!"}));
}

function handleSignIn(sheet, data, date, formattedDate, hourlyRate) {
    var actualSignInTime = Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");
    var expectedStartTime = formatTimeStr(data.expectedStartTime);

    // 使用较晚的时间作为签到时间
    var chosenStartTime = actualSignInTime < expectedStartTime ? expectedStartTime : actualSignInTime;

    Logger.log("Chosen Sign In Time: " + chosenStartTime); // Log 确认记录的签到时间

    sheet.appendRow([
        formattedDate,
        data.name,
        chosenStartTime,
        "",
        "",
        hourlyRate,
        "",
        data.note,
        data.expectedStartTime,
        data.expectedEndTime,
        calculateTimeDifference(data.expectedStartTime, data.expectedEndTime)
    ]);
}

function handleSignOut(sheet, data, date, formattedDate, hourlyRate) {
    var actualSignOutTime = Utilities.formatDate(date, Session.getScriptTimeZone(), "HH:mm");
    var lastRow = sheet.getLastRow();

    // 从表格中读取最后一行的签到时间
    var signInTime = sheet.getRange(lastRow, 3).getDisplayValue(); // 使用 getDisplayValue() 确保正确读取为字符串

    // 获取预期结束时间
    var expectedEndTime = sheet.getRange(lastRow, 10).getDisplayValue(); // 预期结束时间在第10列

    // 使用较早的时间作为签退时间
    var chosenSignOutTime = (actualSignOutTime < expectedEndTime) ? actualSignOutTime : expectedEndTime;

    Logger.log("Sign In Time from Sheet: " + signInTime); // Log 确认读取的签到时间
    Logger.log("Actual Sign Out Time: " + actualSignOutTime);
    Logger.log("Chosen Sign Out Time: " + chosenSignOutTime); // Log 选定的签退时间

    // 计算工时
    var totalHours = calculateTimeDifference(signInTime, chosenSignOutTime);
    var totalSalary = (hourlyRate * totalHours).toFixed(2);

    // 将签退信息添加到表格中
    sheet.appendRow([
        formattedDate,
        data.name,
        "",
        chosenSignOutTime, // 使用选定的签退时间
        totalHours,
        hourlyRate,
        totalSalary,
        data.note,
        "",
        "",
        ""
    ]);
}


// 格式化时间字符串，确保时间字符串始终为 HH:mm 格式
function formatTimeStr(timeStr) {
    if (typeof timeStr === 'string') {
        if (timeStr.includes(":")) {
            var parts = timeStr.split(":");
            return parts.map(part => part.padStart(2, '0')).join(":");
        } else {
            return timeStr;
        }
    } else {
        return "";
    }
}

// 计算两个时间点之间的时差
function calculateTimeDifference(startTime, endTime) {
    if (startTime && endTime) {
        // 将时间字符串转换为小时和分钟
        var startParts = startTime.split(":");
        var endParts = endTime.split(":");

        var startHours = parseInt(startParts[0], 10);
        var startMinutes = parseInt(startParts[1], 10);
        var endHours = parseInt(endParts[0], 10);
        var endMinutes = parseInt(endParts[1], 10);

        // 计算总的开始和结束分钟数
        var totalMinutesStart = startHours * 60 + startMinutes;
        var totalMinutesEnd = endHours * 60 + endMinutes;

        // 如果签退时间早于签到时间，表示跨午夜，需要补偿24小时
        if (totalMinutesEnd < totalMinutesStart) {
            totalMinutesEnd += 24 * 60;
        }

        // 计算总分钟数差异
        var totalMinutesDiff = totalMinutesEnd - totalMinutesStart;
        var totalHours = totalMinutesDiff / 60; // 转换为小时

        Logger.log("Total Minutes Start: " + totalMinutesStart);
        Logger.log("Total Minutes End: " + totalMinutesEnd);
        Logger.log("Total Minutes Difference: " + totalMinutesDiff);
        Logger.log("Total Hours Calculated: " + totalHours);

        return parseFloat(totalHours.toFixed(2)); // 保留两位小数
    } else {
        return 0;
    }
}

function createNewSheet(name) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(["Date", "Name", "SignIn", "SignOut", "Total Hours", "Hourly Rate", "Total Salary", "Note", "Expected Start Time", "Expected End Time", "Expected Total Hours"]);
    return sheet;
}

// 格式化 ISO 日期
function formatISODate(date) {
    return Utilities.formatDate(date, "Asia/Taipei", "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

// 测试方法
function testDoPost() {
    var mockSignInEvent = {
        postData: {
            contents: JSON.stringify({
                action: 'signIn',
                time: new Date().toISOString(),
                name: '測試表',
                expectedStartTime: '10:00',
                expectedEndTime: '12:55',
                note: '測試'
            })
        }
    };

    doPost(mockSignInEvent);

    var currentDate = new Date(JSON.parse(mockSignInEvent.postData.contents).time);
    currentDate.setHours(currentDate.getHours() + 1);
    currentDate.setMinutes(currentDate.getMinutes() + 30); // 设置为1小时15分钟后签退

    var mockSignOutEvent = {
        postData: {
            contents: JSON.stringify({
                action: 'signOut',
                time: currentDate.toISOString(),
                name: '測試表',
                expectedStartTime: '10:00',
                expectedEndTime: '12:55',
                note: '測試'
            })
        }
    };

    doPost(mockSignOutEvent);
}
