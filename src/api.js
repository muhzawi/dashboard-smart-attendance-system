const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();

// Apps Script ContentService redirects its response; JSONP follows that redirect
// without a browser fetch/CORS failure. This endpoint is read-only.
export function readAttendance() {
  return new Promise((resolve, reject) => {
    if (!endpoint) {
      reject(
        new Error(
          "URL Web App belum diatur. Isi VITE_APPS_SCRIPT_URL di .env.local.",
        ),
      );
      return;
    }

    let settled = false;
    const callbackName = `__attendance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(value);
    };
    const timeout = window.setTimeout(
      () =>
        finish(new Error("Waktu tunggu habis. Periksa URL dan akses Web App.")),
      15000,
    );

    window[callbackName] = (payload) => {
      if (
        !payload ||
        payload.success !== true ||
        !Array.isArray(payload.records)
      ) {
        finish(
          new Error(payload?.error || "Respons Apps Script tidak sesuai."),
        );
        return;
      }
      finish(null, payload.records);
    };
    script.onerror = () =>
      finish(
        new Error(
          "Web App tidak dapat diakses. Periksa deployment Apps Script.",
        ),
      );

    try {
      const url = new URL(endpoint);
      url.searchParams.set("callback", callbackName);
      url.searchParams.set("_", String(Date.now()));
      script.src = url.toString();
      document.head.appendChild(script);
    } catch {
      finish(new Error("URL Web App tidak valid."));
    }
  });
}
