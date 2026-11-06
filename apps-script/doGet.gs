/**
 * Tambahkan fungsi ini ke proyek Apps Script yang sama dengan doPost(e).
 * Jangan hapus atau mengganti doPost(e) yang digunakan ESP32.
 * Sesuaikan nama tab. Header harus berada di baris pertama.
 */
const ATTENDANCE_SHEET_NAME = 'Absensi';
const ATTENDANCE_HEADERS = ['No', 'UID', 'Nama', 'NIM', 'Kelas', 'Tanggal', 'Waktu', 'Status'];

function doGet(e) {
  const callback = String(e?.parameter?.callback || '');
  if (callback && !/^[$A-Z_a-z][$0-9A-Z_a-z]{0,80}$/.test(callback)) {
    return attendanceOutput_({ success: false, error: 'Callback tidak valid.' });
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Spreadsheet tidak ditemukan. Hubungkan script ke spreadsheet.');
    const sheet = spreadsheet.getSheetByName(ATTENDANCE_SHEET_NAME);
    if (!sheet) throw new Error('Tab sheet "' + ATTENDANCE_SHEET_NAME + '" tidak ditemukan.');
    if (sheet.getLastRow() < 1) throw new Error('Baris header spreadsheet tidak ditemukan.');

    const headers = sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length)
      .getDisplayValues()[0].map(value => String(value).trim());
    if (ATTENDANCE_HEADERS.some((header, index) => headers[index] !== header)) {
      throw new Error('Header harus berurutan: ' + ATTENDANCE_HEADERS.join(', '));
    }

    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, ATTENDANCE_HEADERS.length).getDisplayValues()
      : [];
    const records = rows
      .filter(row => row.some(value => String(value).trim() !== ''))
      .map(row => Object.fromEntries(ATTENDANCE_HEADERS.map((header, index) => [header, String(row[index] || '')])))
      .reverse();

    return attendanceOutput_({ success: true, records: records, updatedAt: new Date().toISOString() }, callback);
  } catch (error) {
    return attendanceOutput_({ success: false, error: String(error?.message || error) }, callback);
  }
}

function attendanceOutput_(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
