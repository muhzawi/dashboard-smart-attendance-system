const SHEET_NAME = "seusaikan dengan judul sheets";
const API_KEY = "buat API mandiri lalu masukin kesini";
const TIMEZONE = "Asia/Jakarta";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validasi API Key
    if (data.apiKey !== API_KEY) {
      return responseJSON({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validasi data
    if (!data.uid || !data.nama || !data.nim || !data.kelas) {
      return responseJSON({
        success: false,
        message: "Data mahasiswa tidak lengkap",
      });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet Absensi tidak ditemukan");
    }

    // Ambil waktu WIB
    const now = new Date();

    const tanggal = Utilities.formatDate(now, TIMEZONE, "dd/MM/yyyy");

    const waktu = Utilities.formatDate(now, TIMEZONE, "HH:mm:ss");

    // Nomor urut
    const nomor = sheet.getLastRow();

    // Tambahkan data absensi
    sheet.appendRow([
      nomor,
      data.uid,
      data.nama,
      data.nim,
      data.kelas,
      tanggal,
      waktu,
      "Hadir",
    ]);

    // Mengatur seluruh kolom data pada baris baru ke tengah
    const lastRow = sheet.getLastRow();

    sheet
      .getRange(lastRow, 1, 1, 8)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    return responseJSON({
      success: true,
      message: "Absensi berhasil disimpan",
      tanggal: tanggal,
      waktu: waktu,
    });
  } catch (error) {
    return responseJSON({
      success: false,
      message: error.message,
    });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
