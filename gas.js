function doPost(e) {
  Logger.log("Received data: " + e.postData.contents);

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    Logger.log("Error parsing data: " + error.message);
    return ContentService.createTextOutput("Error parsing data").setMimeType(ContentService.MimeType.TEXT);
  }

  if (!data || !data.name || !data.action || !data.time || !data.location) {
    Logger.log("Invalid data received.");
    return ContentService.createTextOutput("Invalid data received").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(data.name); // 尝试获取与员工姓名相同的工作表

    // 如果工作表不存在，创建一个新的
    if (!sheet) {
      sheet = spreadsheet.insertSheet(data.name);
      sheet.appendRow(["Name", "Action", "Time", "Location", "Note"]); // 添加标题行
    }

    sheet.appendRow([data.name, data.action, data.time, data.location, data.note || ""]);
  } catch (error) {
    Logger.log("Error writing to sheet: " + error.message);
    return ContentService.createTextOutput("Error writing to sheet").setMimeType(ContentService.MimeType.TEXT);
  }

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}

