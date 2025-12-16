import { google } from "googleapis";

async function testSheetsConnection() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "../credentials/JSONKEYFILE.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1tpwJ0HczqKHwbN4FloN6cgxgH3h0i9vUknGD-8CDlLE";

    const response = await sheets.spreadsheets.get({ spreadsheetId });

    console.log("Connected to Google Sheets:", response.data.properties.title);
  } catch (error) {
    console.error("Failed to connect to Google Sheets:", error.message);
  }
}

testSheetsConnection();
