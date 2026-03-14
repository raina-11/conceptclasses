/**
 * Concept Classes — Scholarship Registration API
 * ------------------------------------------------
 * Deploy this as a Google Apps Script Web App:
 *   1. Open the Google Sheet where you want data saved
 *   2. Extensions → Apps Script → paste this code
 *   3. Deploy → New Deployment → Type: Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Copy the deployment URL and set it in the frontend + env
 *
 * REST API (for WhatsApp business / external systems):
 *   POST {DEPLOYMENT_URL}
 *   Content-Type: application/json
 *   Body: { studentName, currentClass, schoolName, boardName, medium,
 *           cityOrVillageName, contactNumber, whatsappNumber }
 *
 *   GET  {DEPLOYMENT_URL}?studentName=...&contactNumber=...  (browser fallback)
 *
 * Response: { success: true, message: "...", id: "<row number>" }
 */

const SHEET_NAME = 'Scholarship Registrations';

const COLUMNS = [
  'ID',
  'Timestamp',
  'Student Name',
  'Class',
  'School Name',
  'Board',
  'Medium',
  'City / Village',
  'Contact Number',
  'WhatsApp Number',
  'Source',   // "website" | "api" | "whatsapp"
  'Status',   // "New" by default — admin can update to "Contacted", "Enrolled" etc.
];

// ─── Entry points ─────────────────────────────────────────

function doGet(e) {
  const data = (e && e.parameter) ? e.parameter : {};
  data._source = data._source || 'website';

  // If no studentName provided, return a simple health-check response
  if (!data.studentName) {
    return respond({ success: true, message: 'Scholarship Registration API is running.' });
  }

  return respond(saveRegistration(data));
}

function doPost(e) {
  let data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (_) {
    data = (e && e.parameter) ? e.parameter : {};
  }
  data._source = data._source || 'api';
  return respond(saveRegistration(data));
}

// ─── Core logic ───────────────────────────────────────────

function saveRegistration(data) {
  try {
    const sheet = getOrCreateSheet();
    const id = 'SCH-' + String(sheet.getLastRow()).padStart(4, '0');

    sheet.appendRow([
      id,
      new Date().toISOString(),
      (data.studentName   || '').trim(),
      (data.currentClass  || '').trim(),
      (data.schoolName    || '').trim(),
      (data.boardName     || '').trim(),
      (data.medium        || '').trim(),
      (data.cityOrVillageName || '').trim(),
      (data.contactNumber || '').trim(),
      (data.whatsappNumber || data.contactNumber || '').trim(),
      data._source        || 'unknown',
      'New',
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, COLUMNS.length);

    return { success: true, message: 'Registration saved successfully.', id };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ─── Helpers ──────────────────────────────────────────────

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write header row with formatting
    const header = sheet.getRange(1, 1, 1, COLUMNS.length);
    header.setValues([COLUMNS]);
    header.setBackground('#064e3b');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function respond(payload) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
