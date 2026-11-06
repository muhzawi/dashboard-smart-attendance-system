import { useCallback, useEffect, useMemo, useState } from "react";
import { readAttendance } from "./api.js";

const fields = [
  "No",
  "UID",
  "Nama",
  "NIM",
  "Kelas",
  "Tanggal",
  "Waktu",
  "Status",
];

function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${part.year}-${part.month}-${part.day}`;
}

function dateKey(value) {
  const raw = String(value ?? "").trim();
  let match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match)
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (match)
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function Icon({ name, size = 20 }) {
  const shapes = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    scan: (
      <>
        <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M4 12h16" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}

function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "—"
  );
}

function formatUpdated(date) {
  if (!date) return "Belum diperbarui";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [kelas, setKelas] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await readAttendance();
      setRecords(data);
      setError("");
      setUpdatedAt(new Date());
    } catch (cause) {
      setError(cause.message || "Data absensi gagal dimuat.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const classes = useMemo(
    () =>
      [
        ...new Set(
          records.map((row) => String(row.Kelas || "").trim()).filter(Boolean),
        ),
      ].sort(),
    [records],
  );
  const statuses = useMemo(
    () =>
      [
        ...new Set(
          records.map((row) => String(row.Status || "").trim()).filter(Boolean),
        ),
      ].sort(),
    [records],
  );
  const todays = useMemo(
    () => records.filter((row) => dateKey(row.Tanggal) === jakartaToday()),
    [records],
  );
  const uniqueStudents = useMemo(
    () =>
      new Set(
        records
          .map((row) => String(row.NIM || row.UID || "").trim())
          .filter(Boolean),
      ).size,
    [records],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return records.filter((row) => {
      const searchable = [row.Nama, row.NIM, row.UID, row.Kelas]
        .join(" ")
        .toLocaleLowerCase("id-ID");
      return (
        (!query || searchable.includes(query)) &&
        (!date || dateKey(row.Tanggal) === date) &&
        (!kelas || row.Kelas === kelas) &&
        (!status || row.Status === status)
      );
    });
  }, [records, search, date, kelas, status]);

  const exportCsv = () => {
    const csv = [
      fields,
      ...filtered.map((row) => fields.map((field) => row[field] ?? "")),
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `absensi-${date || jakartaToday()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setDate("");
    setKelas("");
    setStatus("");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Attendly dashboard">
          <span className="brand-mark">
            <Icon name="scan" size={19} />
          </span>
          <span className="brand-name">
            attend<span>ly</span>
          </span>
        </a>
        <div className="side-label">MENU UTAMA</div>
        <a className="nav-item active" href="#dashboard">
          <Icon name="grid" />
          <span>Dashboard</span>
        </a>
        <a className="nav-item" href="#attendance">
          <Icon name="calendar" />
          <span>Data Absensi</span>
          <span className="nav-count">{records.length}</span>
        </a>
        <div className="sidebar-bottom">
          <div className="side-label">STATUS SISTEM</div>
          <div className="connection-card">
            <span className={`connection-dot ${error ? "offline" : ""}`} />
            <div>
              <strong>{error ? "Perlu perhatian" : "Google Sheets"}</strong>
              <small>{error ? "Koneksi bermasalah" : "Terhubung"}</small>
            </div>
          </div>
          <div className="sidebar-foot">
            SMART ATTENDANCE
            <br />
            <span>Monitoring siswa</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="topbar-right">
            <div className="live-indicator">
              <i /> LIVE MONITORING
            </div>
            <div className="admin-avatar" aria-label="Admin">
              AD
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">RINGKASAN KEHADIRAN</div>
              <h1>Dashboard Absensi</h1>
              <p>Pantau kehadiran siswa secara real-time.</p>
            </div>
            <div className="heading-actions">
              <span className="updated-label">
                Diperbarui {formatUpdated(updatedAt)}
              </span>
              <button
                className="button primary"
                onClick={() => refresh(true)}
                disabled={refreshing}
              >
                <Icon name="refresh" size={17} />
                {refreshing ? "Memperbarui…" : "Perbarui data"}
              </button>
            </div>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <strong>Data belum dapat dimuat.</strong> {error}{" "}
              <button onClick={() => refresh(true)}>Coba lagi</button>
            </div>
          )}

          <section className="stats-grid" aria-label="Ringkasan absensi">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total catatan absensi</span>
                <span className="stat-icon blue">
                  <Icon name="scan" />
                </span>
              </div>
              <div className="stat-value">
                {loading ? "—" : records.length.toLocaleString("id-ID")}
              </div>
              <div className="stat-note">Seluruh data pada spreadsheet</div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Hadir hari ini</span>
                <span className="stat-icon green">
                  <Icon name="calendar" />
                </span>
              </div>
              <div className="stat-value">
                {loading ? "—" : todays.length.toLocaleString("id-ID")}
              </div>
              <div className="stat-note">
                {new Intl.DateTimeFormat("id-ID", {
                  timeZone: "Asia/Jakarta",
                  dateStyle: "long",
                }).format(new Date())}
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Siswa unik tercatat</span>
                <span className="stat-icon violet">
                  <Icon name="users" />
                </span>
              </div>
              <div className="stat-value">
                {loading ? "—" : uniqueStudents.toLocaleString("id-ID")}
              </div>
              <div className="stat-note">Dihitung dari NIM atau UID</div>
            </article>
          </section>

          <section className="table-card" id="attendance">
            <div className="table-heading">
              <div>
                <h2>Aktivitas Absensi</h2>
                <p>Daftar catatan kehadiran siswa yang masuk.</p>
              </div>
              <button
                className="button secondary export-button"
                onClick={exportCsv}
                disabled={!filtered.length}
              >
                <Icon name="download" size={17} />
                Ekspor CSV
              </button>
            </div>
            <div className="filters">
              <label className="search-box">
                <Icon name="search" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, NIM, UID…"
                  aria-label="Cari nama, NIM, atau UID"
                />
              </label>
              <label className="filter-control date-control">
                <span>Tanggal</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  aria-label="Filter tanggal"
                />
              </label>
              <label className="filter-control">
                <span>Kelas</span>
                <select
                  value={kelas}
                  onChange={(event) => setKelas(event.target.value)}
                  aria-label="Filter kelas"
                >
                  <option value="">Semua kelas</option>
                  {classes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={15} />
              </label>
              <label className="filter-control">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-label="Filter status"
                >
                  <option value="">Semua status</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={15} />
              </label>
              {(search || date || kelas || status) && (
                <button className="clear-button" onClick={clearFilters}>
                  Reset
                </button>
              )}
            </div>
            <div className="table-meta">
              <span>
                Menampilkan <strong>{filtered.length}</strong> dari{" "}
                <strong>{records.length}</strong> catatan
              </span>
              <span className="auto-refresh">
                <i /> Sinkronisasi otomatis 30 detik
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>NO.</th>
                    <th>SISWA</th>
                    <th>NIM</th>
                    <th>KELAS</th>
                    <th>TANGGAL &amp; WAKTU</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={`${row.UID}-${row.Tanggal}-${row.Waktu}-${index}`}>
                      <td className="number-cell">
                        {row.No || String(index + 1).padStart(2, "0")}
                      </td>
                      <td>
                        <div className="student-cell">
                          <span className="student-avatar">
                            {initials(row.Nama)}
                          </span>
                          <span className="student-name">
                            {row.Nama || "—"}
                            <small>UID: {row.UID || "—"}</small>
                          </span>
                        </div>
                      </td>
                      <td className="muted-cell">{row.NIM || "—"}</td>
                      <td>
                        <span className="class-chip">{row.Kelas || "—"}</span>
                      </td>
                      <td>
                        <span className="date-cell">
                          {row.Tanggal || "—"}
                          <small>{row.Waktu || "—"} WIB</small>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            ["hadir", "terlambat"].includes(
                              String(row.Status || "")
                                .trim()
                                .toLowerCase(),
                            )
                              ? "present"
                              : "other"
                          }`}
                        >
                          <i />
                          {row.Status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan="6" className="empty-cell">
                        {loading
                          ? "Memuat data absensi…"
                          : records.length
                            ? "Tidak ada catatan yang cocok dengan filter."
                            : "Belum ada data absensi untuk ditampilkan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">
              <span>
                Menampilkan {filtered.length ? 1 : 0}–{filtered.length} dari{" "}
                {filtered.length} hasil
              </span>
              <span>Data bersumber dari Google Sheets</span>
            </footer>
          </section>
          <footer className="page-footer">
            © {new Date().getFullYear()} Attendly <span>•</span> Sistem
            Monitoring Absensi Siswa
          </footer>
        </div>
      </main>
    </div>
  );
}
