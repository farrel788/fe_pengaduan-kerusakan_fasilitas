/* ===== Konfigurasi ===== */
const CONFIG = {
  API: 'http://localhost:8000/api',        // base URL API Laravel
  STORAGE: 'http://localhost:8000/storage', // base URL file upload (php artisan storage:link)
  FIELD_FOTO: 'foto[]',                     // nama field upload foto di backend
};

const KATEGORI = { toilet: 'Toilet', kelas: 'Kelas', lab: 'Laboratorium', lapangan: 'Lapangan', listrik_ac: 'Listrik / AC' };
const URGENSI = { rendah: 'Rendah', sedang: 'Sedang', mendesak: 'Mendesak' };
const STATUS = { pending: 'Menunggu', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak' };
const ROLE = { siswa: 'Siswa', admin: 'Admin', teknisi: 'Teknisi' };

/* ===== Ikon ===== */
const ICONS = {
  list: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  plus: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  grid: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ===== Util ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const trunc = (s, n) => (s && s.length > n ? s.slice(0, n).trimEnd() + '…' : s || '');
const unwrap = (r) => (r && !Array.isArray(r) && r.data !== undefined ? r.data : r);
const initial = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const fmtTime = (s) => (s ? new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const fileUrl = (a) => a.url || `${CONFIG.STORAGE}/${String(a.path).replace(/^\/+/, '')}`;

const badge = (s) => `<span class="pill s-${esc(s)}">${esc(STATUS[s] || s)}</span>`;
const urg = (u) => `<span class="u ${esc(u)}">${esc(URGENSI[u] || u)}</span>`;

function notify(msg, isError = false) {
  const el = $('#notice');
  el.textContent = msg;
  el.className = 'notice show' + (isError ? ' err' : '');
  clearTimeout(notify.t);
  notify.t = setTimeout(() => (el.className = 'notice'), 3500);
}

function errorHtml(err) {
  if (err.errors) {
    const items = Object.values(err.errors).flat().map((m) => `<li>${esc(m)}</li>`).join('');
    return `<div class="alert error"><ul>${items}</ul></div>`;
  }
  return `<div class="alert error">${esc(err.message)}</div>`;
}

/* ===== Sesi & API ===== */
const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};
const isStaff = () => !!state.user && state.user.role !== 'siswa';

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' };
  if (state.token) headers.Authorization = 'Bearer ' + state.token;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(CONFIG.API + path, { method, headers, body: payload });
  } catch {
    const e = new Error('Tidak dapat terhubung ke server.');
    e.status = 0;
    throw e;
  }
  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* respons bukan JSON */ }

  if (!res.ok) {
    if (res.status === 401 && path !== '/login' && state.token) {
      clearSession();
      location.hash = '#/login';
    }
    const e = new Error((data && data.message) || `Terjadi kesalahan (${res.status}).`);
    e.status = res.status;
    e.errors = (data && data.errors) || null;
    throw e;
  }
  return data;
}

/* ===== Kerangka halaman ===== */
// Animasi masuk hanya dijalankan saat pindah halaman, bukan saat konten digambar ulang.
let fresh = false;
function mount(html, quiet = false) {
  const app = $('#app');
  app.classList.toggle('still', quiet || !fresh);
  if (!quiet) fresh = false;
  app.innerHTML = html;
}

function countUp(el) {
  const to = Number(el.textContent) || 0;
  if (!to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / 800, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
}

function shell(content) {
  let cur = (location.hash.slice(1) || '/').split('?')[0];
  if (cur.startsWith('/laporan/')) cur = isStaff() ? '/admin/laporan' : '/';

  const links = isStaff()
    ? [['#/admin', 'Ringkasan', 'grid'], ['#/admin/laporan', 'Semua laporan', 'clip']]
    : [['#/', 'Laporan saya', 'list'], ['#/baru', 'Buat laporan', 'plus'], ['#/notifikasi', 'Notifikasi', 'bell']];

  const nav = links
    .map(([href, label, ic]) => `<a href="${href}" class="${href.slice(1) === cur ? 'on' : ''}">${icon(ic)}<span>${label}</span>${href === '#/notifikasi' ? '<span id="badge"></span>' : ''}</a>`)
    .join('');

  return `
    <div class="app">
      <aside class="side">
        <a class="brand" href="${isStaff() ? '#/admin' : '#/'}">
          <span class="mark">PF</span>
          <span class="brand-name">Pengaduan<br>Fasilitas Sekolah</span>
        </a>
        <nav class="nav">${nav}</nav>
        <div class="who">
          <span class="av">${esc(initial(state.user?.nama))}</span>
          <div class="who-t"><b>${esc(state.user?.nama || '')}</b><small>${esc(ROLE[state.user?.role] || '')}</small></div>
          <button class="out" id="logout" title="Keluar" aria-label="Keluar">${icon('out')}</button>
        </div>
      </aside>
      <main class="main"><div class="page">${content}</div></main>
    </div>`;
}

function bindShell() {
  const out = $('#logout');
  if (out) out.onclick = async () => {
    try { await api('/logout', { method: 'POST' }); } catch { /* abaikan */ }
    clearSession();
    location.hash = '#/login';
  };
  if (!isStaff()) refreshBadge();
}

async function refreshBadge() {
  try {
    const list = unwrap(await api('/notifications')) || [];
    const n = list.filter((x) => !x.read_at).length;
    const el = $('#badge');
    if (el && n) { el.className = 'count'; el.textContent = n; }
  } catch { /* abaikan */ }
}

function loading() {
  mount(shell('<p class="muted">Memuat…</p>'), true);
  bindShell();
}

/* ===== Komponen ===== */
function reportRow(r, { showUser = false } = {}) {
  const sub = [KATEGORI[r.kategori] || r.kategori, showUser && r.user?.nama, trunc(r.deskripsi, 80)].filter(Boolean).join(' · ');
  return `
    <a class="row" href="#/laporan/${r.id}">
      <div class="row-main"><strong>${esc(r.lokasi)}</strong><span>${esc(sub)}</span></div>
      <div>${urg(r.urgensi)}</div>
      <div>${badge(r.status)}</div>
      <div class="row-date">${fmtDate(r.created_at)}</div>
    </a>`;
}

const listHead = () => '<div class="list-head"><span>Laporan</span><span>Urgensi</span><span>Status</span><span>Tanggal</span></div>';

function stepper(status) {
  const steps = status === 'ditolak'
    ? [['pending', 'Laporan diterima'], ['ditolak', 'Ditolak']]
    : [['pending', 'Laporan diterima'], ['diproses', 'Sedang diperbaiki'], ['selesai', 'Selesai']];
  const idx = steps.findIndex(([k]) => k === status);
  const finished = status === 'selesai';
  return `<ol class="steps">${steps.map(([k, label], i) => {
    const done = i < idx || finished;
    const cls = done ? 'done' : i === idx ? (k === 'ditolak' ? 'bad' : 'now') : '';
    return `<li class="${cls}"><span class="dot">${done ? `<svg viewBox="0 0 24 24">${ICONS.check}</svg>` : ''}</span><span>${label}</span></li>`;
  }).join('')}</ol>`;
}

const photos = (list, alt) =>
  list.length
    ? `<div class="photos">${list.map((a) => `<a href="${esc(fileUrl(a))}" target="_blank" rel="noopener"><img src="${esc(fileUrl(a))}" alt="${alt}" loading="lazy"></a>`).join('')}</div>`
    : '';

/* ===== Halaman: Login ===== */
function loginPage() {
  let mode = 'siswa';
  const draw = () => {
    mount(`
      <div class="auth">
        <section class="auth-side">
          <div class="brand"><span class="mark">PF</span><span class="brand-name">Pengaduan<br>Fasilitas Sekolah</span></div>
          <div>
            <h2>Setiap laporan kerusakan tercatat, ditangani, dan dipantau sampai selesai.</h2>
            <p>Siswa melapor dengan foto, admin menugaskan teknisi, semua pihak melihat perkembangannya.</p>
          </div>
        </section>
        <section class="auth-main">
          <div class="auth-box">
            <h1>Masuk</h1>
            <p class="sub">Gunakan akun yang terdaftar di sekolah.</p>
            <div class="mode">
              <button type="button" data-mode="siswa" class="${mode === 'siswa' ? 'on' : ''}">Siswa</button>
              <button type="button" data-mode="staf" class="${mode === 'staf' ? 'on' : ''}">Admin / Teknisi</button>
            </div>
            <div id="err"></div>
            <form id="login" novalidate>
              ${mode === 'siswa'
                ? `<label class="f"><span>NISN</span><input type="text" name="nisn" inputmode="numeric" autocomplete="username" autofocus></label>`
                : `<label class="f"><span>Email</span><input type="email" name="email" autocomplete="username" autofocus></label>
                   <label class="f"><span>Password</span><input type="password" name="password" autocomplete="current-password"></label>`}
              <button class="btn block" type="submit">Masuk</button>
            </form>
          </div>
        </section>
      </div>`);

    $$('.mode button').forEach((b) => (b.onclick = () => { mode = b.dataset.mode; draw(); }));
    $('#login').onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button[type=submit]');
      btn.disabled = true;
      $('#err').innerHTML = '';
      const f = Object.fromEntries(new FormData(e.target));
      try {
        const res = unwrap(await api('/login', { method: 'POST', body: f }));
        const token = res.token || res.access_token;
        setSession(token, res.user || {});
        if (!res.user) setSession(token, unwrap(await api('/me')));
        location.hash = isStaff() ? '#/admin' : '#/';
      } catch (err) {
        $('#err').innerHTML = errorHtml(err.status === 401 ? new Error(mode === 'siswa' ? 'NISN tidak ditemukan.' : 'Email atau password salah.') : err);
        btn.disabled = false;
      }
    };
  };
  draw();
}

/* ===== Halaman: Riwayat laporan siswa ===== */
async function studentList() {
  loading();
  const rows = unwrap(await api('/reports')) || [];
  let filter = 'semua';
  const countOf = (k) => (k === 'semua' ? rows.length : rows.filter((r) => r.status === k).length);

  const draw = () => {
    const shown = filter === 'semua' ? rows : rows.filter((r) => r.status === filter);
    mount(shell(`
      <div class="head">
        <div><h1>Laporan saya</h1><p class="sub">Riwayat dan perkembangan laporan yang kamu kirim.</p></div>
        <a class="btn" href="#/baru">${icon('plus')}Buat laporan</a>
      </div>
      <div class="tabs">
        ${['semua', ...Object.keys(STATUS)].map((k) => `<button data-f="${k}" class="${k === filter ? 'on' : ''}">${k === 'semua' ? 'Semua' : STATUS[k]}<span class="n">${countOf(k)}</span></button>`).join('')}
      </div>
      <div class="card list">
        ${shown.length
          ? listHead() + shown.map((r) => reportRow(r)).join('')
          : `<div class="empty">${rows.length ? 'Tidak ada laporan dengan status ini.' : 'Belum ada laporan.'}</div>`}
      </div>`));
    bindShell();
    $$('.tabs button').forEach((c) => (c.onclick = () => { filter = c.dataset.f; draw(); }));
  };
  draw();
}

/* ===== Halaman: Buat laporan ===== */
function newReport() {
  mount(shell(`
    <div class="head"><div><h1>Buat laporan</h1><p class="sub">Isi detail kerusakan agar cepat ditangani.</p></div></div>
    <form class="card form-card" id="form" novalidate>
      <div class="card-b">
        <div id="err"></div>
        <div class="grid2">
          <label class="f"><span>Kategori</span>
            <select name="kategori" required>
              <option value="">Pilih kategori</option>
              ${Object.entries(KATEGORI).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
          </label>
          <div class="f">
            <span class="lbl">Urgensi</span>
            <div class="seg">
              ${Object.entries(URGENSI).map(([k, v], i) => `<label><input type="radio" name="urgensi" value="${k}" ${i === 1 ? 'checked' : ''}><span>${v}</span></label>`).join('')}
            </div>
          </div>
        </div>
        <label class="f"><span>Lokasi</span><input type="text" name="lokasi" placeholder="Contoh: Toilet siswa lantai 2" required></label>
        <label class="f"><span>Deskripsi kerusakan</span><textarea name="deskripsi" placeholder="Jelaskan apa yang rusak dan sejak kapan" required></textarea></label>
        <div class="f" style="margin-bottom:0">
          <span class="lbl">Foto bukti</span>
          <label class="drop"><b>Pilih foto</b> dari perangkat<input type="file" name="${CONFIG.FIELD_FOTO}" accept="image/*" multiple></label>
          <div class="hint">Maksimal 2 foto.</div>
          <div class="thumbs" id="thumbs"></div>
        </div>
      </div>
      <div class="card-h" style="border-top:1px solid var(--line);border-bottom:0;justify-content:flex-end;gap:10px">
        <a class="btn ghost" href="#/">Batal</a>
        <button class="btn" type="submit">Kirim laporan</button>
      </div>
    </form>`));
  bindShell();

  const fileInput = $('input[type=file]');
  fileInput.onchange = () => {
    if (fileInput.files.length > 2) {
      fileInput.value = '';
      $('#thumbs').innerHTML = '';
      notify('Maksimal 2 foto.', true);
      return;
    }
    $('#thumbs').innerHTML = [...fileInput.files].map((f) => `<img src="${URL.createObjectURL(f)}" alt="Pratinjau foto">`).join('');
  };

  $('#form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('button[type=submit]');
    btn.disabled = true;
    $('#err').innerHTML = '';
    try {
      const res = unwrap(await api('/reports', { method: 'POST', form: new FormData(e.target) }));
      notify('Laporan terkirim.');
      location.hash = res && res.id ? `#/laporan/${res.id}` : '#/';
    } catch (err) {
      $('#err').innerHTML = errorHtml(err);
      btn.disabled = false;
      window.scrollTo(0, 0);
    }
  };
}

/* ===== Halaman: Detail laporan (siswa & staf) ===== */
async function reportDetail(id) {
  loading();
  const [rep, com] = await Promise.all([api(`/reports/${id}`), api(`/reports/${id}/comments`)]);
  const r = unwrap(rep);
  const comments = unwrap(com) || [];

  // Daftar teknisi dipakai bila backend menyediakannya (opsional); kalau tidak, input ID biasa.
  let techs = [];
  if (isStaff()) {
    try { const t = unwrap(await api('/admin/teknisi')); if (Array.isArray(t)) techs = t; } catch { /* opsional */ }
  }

  const atts = r.attachments || [];
  const bukti = atts.filter((a) => a.tipe === 'bukti');
  const hasil = atts.filter((a) => a.tipe === 'hasil_perbaikan');
  const tech = r.teknisi || r.assignee || r.assigned_user;
  const back = isStaff() ? '#/admin/laporan' : '#/';

  const tools = !isStaff() ? '' : `
    <section class="card">
      <div class="card-h"><h2>Tindakan</h2></div>
      <div class="tool">
        <form id="assign">
          <span class="lbl">Tugaskan teknisi</span>
          <div class="inline">
            ${techs.length
              ? `<select name="assigned_to">${techs.map((t) => `<option value="${t.id}" ${t.id === r.assigned_to ? 'selected' : ''}>${esc(t.nama)}</option>`).join('')}</select>`
              : `<input type="number" name="assigned_to" placeholder="ID teknisi" value="${esc(r.assigned_to ?? '')}" required>`}
            <button class="btn" type="submit">Simpan</button>
          </div>
          <div class="error" data-err></div>
        </form>
      </div>
      <div class="tool">
        <form id="status">
          <span class="lbl">Ubah status</span>
          <select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === r.status ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <textarea name="catatan" placeholder="Catatan untuk pelapor (opsional)"></textarea>
          <button class="btn" type="submit">Simpan status</button>
          <div class="error" data-err></div>
        </form>
      </div>
      <div class="tool">
        <form id="resolution">
          <span class="lbl">Foto hasil perbaikan</span>
          <input type="file" name="${CONFIG.FIELD_FOTO}" accept="image/*" multiple required>
          <button class="btn" type="submit">Unggah</button>
          <div class="error" data-err></div>
        </form>
      </div>
    </section>`;

  mount(shell(`
    <a class="back" href="${back}">${icon('back')}Kembali</a>
    <div class="head">
      <div><span class="eyebrow">Laporan #${esc(r.id)}</span><h1>${esc(r.lokasi)}</h1></div>
      ${badge(r.status)}
    </div>

    <div class="detail">
      <div>
        <section class="card">
          <div class="card-h"><h2>Progres</h2></div>
          <div class="card-b">
            ${stepper(r.status)}
            ${r.catatan ? `<div class="note">${esc(r.catatan)}</div>` : ''}
          </div>
        </section>

        <section class="card">
          <div class="card-h"><h2>Deskripsi</h2></div>
          <div class="card-b">
            <p class="desc">${esc(r.deskripsi)}</p>
            ${photos(bukti, 'Foto bukti')}
          </div>
        </section>

        ${hasil.length ? `<section class="card"><div class="card-h"><h2>Hasil perbaikan</h2></div><div class="card-b" style="padding-top:4px">${photos(hasil, 'Hasil perbaikan')}</div></section>` : ''}

        <section class="card">
          <div class="card-h"><h2>Percakapan</h2></div>
          <div class="thread" id="thread"></div>
          <form class="reply" id="reply">
            <textarea name="pesan" placeholder="Tulis pesan" required></textarea>
            <div class="error" data-err></div>
            <button class="btn" type="submit">Kirim pesan</button>
          </form>
        </section>
      </div>

      <aside>
        <section class="card">
          <div class="card-h"><h2>Informasi</h2></div>
          <dl class="info">
            <div><dt>Kategori</dt><dd>${esc(KATEGORI[r.kategori] || r.kategori)}</dd></div>
            <div><dt>Urgensi</dt><dd>${urg(r.urgensi)}</dd></div>
            ${r.user?.nama ? `<div><dt>Pelapor</dt><dd>${esc(r.user.nama)}</dd></div>` : ''}
            <div><dt>Dikirim</dt><dd>${fmtDate(r.created_at)}</dd></div>
            <div><dt>Teknisi</dt><dd>${tech?.nama ? esc(tech.nama) : '<span class="muted" style="font-weight:400">Belum ditugaskan</span>'}</dd></div>
          </dl>
        </section>
        ${tools}
      </aside>
    </div>`));
  bindShell();

  const drawThread = (list) => {
    $('#thread').innerHTML = list.length
      ? list.map((c) => `
        <div class="msg">
          <span class="av">${esc(initial(c.user?.nama))}</span>
          <div class="msg-body">
            <div class="msg-head"><b>${esc(c.user?.nama || 'Pengguna')}</b>${c.user?.role && c.user.role !== 'siswa' ? `<span class="role">${esc(c.user.role)}</span>` : ''}<time>${fmtTime(c.created_at)}</time></div>
            <p>${esc(c.pesan)}</p>
          </div>
        </div>`).join('')
      : '<div class="empty" style="padding:28px 0">Belum ada pesan.</div>';
  };
  drawThread(comments);

  const submit = (formEl, fn, okMsg, reload = true) => {
    if (!formEl) return;
    formEl.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button[type=submit]', formEl);
      const box = $('[data-err]', formEl);
      btn.disabled = true;
      box.innerHTML = '';
      try {
        await fn(new FormData(formEl));
        notify(okMsg);
        if (reload) reportDetail(id);
        else btn.disabled = false;
      } catch (err) {
        box.innerHTML = err.errors ? Object.values(err.errors).flat().map(esc).join('<br>') : esc(err.message);
        btn.disabled = false;
      }
    };
  };

  submit($('#reply'), async (fd) => {
    await api(`/reports/${id}/comments`, { method: 'POST', body: { pesan: fd.get('pesan') } });
    $('#reply textarea').value = '';
    drawThread(unwrap(await api(`/reports/${id}/comments`)) || []);
  }, 'Pesan terkirim.', false);

  submit($('#assign'), (fd) => api(`/admin/reports/${id}/assign`, { method: 'POST', body: { assigned_to: Number(fd.get('assigned_to')) } }), 'Teknisi ditugaskan.');
  submit($('#status'), (fd) => api(`/admin/reports/${id}/status`, { method: 'PATCH', body: { status: fd.get('status'), catatan: fd.get('catatan') || null } }), 'Status diperbarui.');
  submit($('#resolution'), (fd) => api(`/admin/reports/${id}/resolution`, { method: 'POST', form: fd }), 'Foto hasil perbaikan diunggah.');
}

/* ===== Halaman: Notifikasi ===== */
async function notifPage() {
  loading();
  const list = unwrap(await api('/notifications')) || [];

  mount(shell(`
    <div class="head"><div><h1>Notifikasi</h1><p class="sub">Pembaruan dari laporan yang kamu kirim.</p></div></div>
    <div class="card">
      ${list.length ? list.map((n) => {
        const d = n.data || {};
        const text = d.pesan || d.message || d.title || 'Ada pembaruan pada laporan.';
        const href = d.report_id ? `#/laporan/${d.report_id}` : null;
        return `
          <div class="notif ${n.read_at ? '' : 'unread'}" data-id="${esc(n.id)}">
            <div class="t">${href ? `<a href="${href}" class="go">${esc(text)}</a>` : esc(text)}</div>
            <time>${fmtTime(n.created_at)}</time>
            ${n.read_at ? '' : '<button class="btn link small mark">Tandai dibaca</button>'}
          </div>`;
      }).join('') : '<div class="empty">Belum ada notifikasi.</div>'}
    </div>`));
  bindShell();

  const markRead = async (item) => {
    await api(`/notifications/${item.dataset.id}/read`, { method: 'PATCH' });
    item.classList.remove('unread');
    $('.mark', item)?.remove();
    refreshBadge();
  };
  $$('.notif').forEach((item) => {
    const btn = $('.mark', item);
    if (btn) btn.onclick = () => markRead(item).catch((e) => notify(e.message, true));
    const go = $('.go', item);
    if (go && btn) go.onclick = () => { api(`/notifications/${item.dataset.id}/read`, { method: 'PATCH' }).catch(() => {}); };
  });
}

/* ===== Halaman: Ringkasan admin ===== */
async function adminDashboard() {
  loading();
  const [statsRes, pendingRes] = await Promise.all([api('/admin/dashboard'), api('/admin/reports?status=pending')]);

  let s = unwrap(statsRes) || {};
  if (Array.isArray(s)) s = Object.fromEntries(s.map((x) => [x.status, x.total ?? x.jumlah ?? x.count]));
  const num = (k) => Number(s[k] ?? s.per_status?.[k] ?? 0);
  const keys = Object.keys(STATUS);
  const total = keys.reduce((a, k) => a + num(k), 0);
  const pending = unwrap(pendingRes) || [];

  mount(shell(`
    <div class="head">
      <div><h1>Ringkasan</h1><p class="sub">${total} laporan masuk.</p></div>
      <a class="btn" href="#/admin/laporan">Semua laporan</a>
    </div>

    <div class="stats">
      ${keys.map((k) => `<div class="stat ${k}"><span>${STATUS[k]}</span><b>${num(k)}</b></div>`).join('')}
    </div>

    <section class="card" style="margin-top:20px">
      <div class="card-h"><h2>Komposisi status</h2></div>
      <div class="card-b">
        <div class="dist" aria-hidden="true">
          ${total ? keys.map((k) => `<i class="c-${k}" style="width:${(num(k) / total) * 100}%"></i>`).join('') : ''}
        </div>
        <div class="legend">
          ${keys.map((k) => `<span><i class="c-${k}"></i>${STATUS[k]} ${total ? Math.round((num(k) / total) * 100) : 0}%</span>`).join('')}
        </div>
      </div>
    </section>

    <section class="card list">
      <div class="card-h"><h2>Menunggu penanganan</h2><a class="small" href="#/admin/laporan">Lihat semua</a></div>
      ${pending.length
        ? listHead() + pending.slice(0, 8).map((r) => reportRow(r, { showUser: true })).join('')
        : '<div class="empty">Tidak ada laporan yang menunggu.</div>'}
    </section>`));
  bindShell();
  if (!$('#app').classList.contains('still')) $$('.stat b').forEach(countUp);
}

/* ===== Halaman: Semua laporan (admin) ===== */
async function adminList() {
  const filters = { status: '', kategori: '', urgensi: '' };

  const load = async () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    const rows = unwrap(await api('/admin/reports' + (qs ? '?' + qs : ''))) || [];
    $('#rows').innerHTML = rows.length ? listHead() + rows.map((r) => reportRow(r, { showUser: true })).join('') : '<div class="empty">Tidak ada laporan.</div>';
    $('#total').textContent = rows.length + ' laporan';
  };

  const opts = (obj, label) => `<option value="">${label}</option>` + Object.entries(obj).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  mount(shell(`
    <div class="head"><div><h1>Semua laporan</h1><p class="sub">Tinjau, tugaskan, dan perbarui status laporan.</p></div></div>
    <div class="toolbar">
      <select data-k="status">${opts(STATUS, 'Semua status')}</select>
      <select data-k="kategori">${opts(KATEGORI, 'Semua kategori')}</select>
      <select data-k="urgensi">${opts(URGENSI, 'Semua urgensi')}</select>
      <span class="total" id="total"></span>
    </div>
    <div class="card list" id="rows"><div class="empty">Memuat…</div></div>`));
  bindShell();

  $$('.toolbar select').forEach((sel) => (sel.onchange = () => {
    filters[sel.dataset.k] = sel.value;
    load().catch((e) => notify(e.message, true));
  }));
  await load();
}

/* ===== Router ===== */
const routes = [
  [/^\/login$/, loginPage, { public: true }],
  [/^\/$/, studentList, { role: 'siswa' }],
  [/^\/baru$/, newReport, { role: 'siswa' }],
  [/^\/notifikasi$/, notifPage, { role: 'siswa' }],
  [/^\/laporan\/(\d+)$/, reportDetail, {}],
  [/^\/admin$/, adminDashboard, { role: 'staff' }],
  [/^\/admin\/laporan$/, adminList, { role: 'staff' }],
];

async function router() {
  const path = (location.hash.slice(1) || '/').split('?')[0];
  for (const [re, fn, opt] of routes) {
    const m = path.match(re);
    if (!m) continue;
    if (!opt.public && !state.token) { location.hash = '#/login'; return; }
    if (opt.public && state.token) { location.hash = isStaff() ? '#/admin' : '#/'; return; }
    if (opt.role === 'siswa' && isStaff()) { location.hash = '#/admin'; return; }
    if (opt.role === 'staff' && !isStaff()) { location.hash = '#/'; return; }

    window.scrollTo(0, 0);
    fresh = true;
    try {
      await fn(...m.slice(1));
    } catch (err) {
      if (!state.token) return; // sesi habis, sudah diarahkan ke login
      const msg = err.status === 403 ? 'Kamu tidak punya akses ke halaman ini.'
        : err.status === 404 ? 'Data tidak ditemukan.'
        : err.message;
      mount(shell(`<div class="head"><h1>Tidak dapat dimuat</h1></div><p class="muted">${esc(msg)}</p><p style="margin-top:14px"><a href="${isStaff() ? '#/admin' : '#/'}">Kembali</a></p>`));
      bindShell();
    }
    return;
  }
  location.hash = state.token ? (isStaff() ? '#/admin' : '#/') : '#/login';
}

window.addEventListener('hashchange', router);
router();
