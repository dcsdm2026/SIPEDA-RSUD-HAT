// === FILE: app/dashboard.js ===

let dataPegawaiCache = [];
let dataPendidikanCache = [];
let dataPekerjaanCache = [];

// === 1. CEK SESI USER & AUTENTIKASI ===
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('sipeda_user');
    if (!userJson) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userJson);
    const role = (user.aksesrole || '').toLowerCase();

    // Set Info User di Sidebar
    document.getElementById('userName').textContent = user.nama || user.email || 'Pengguna';
    document.getElementById('userRole').textContent = user.aksesrole || 'Pegawai';
    document.getElementById('userAvatar').textContent = (user.nama || 'A').charAt(0).toUpperCase();

    // Default Tampilkan Menu Pegawai
    switchMenu('pegawai');
});

// === 2. FUNGSI LOGOUT ===
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
        localStorage.removeItem('sipeda_user');
        window.location.href = 'index.html';
    }
}

// === 3. SWITCH TAB MENU DINAMIS ===
function switchMenu(menuName) {
    // Hide all sections
    document.getElementById('section-pegawai').classList.add('hidden');
    document.getElementById('section-pendidikan').classList.add('hidden');
    document.getElementById('section-pekerjaan').classList.add('hidden');

    // Reset All Nav Button Styles
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/20');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800/60');
    });

    // Active Tab Logic
    const activeNav = document.getElementById(`nav-${menuName}`);
    const currentTitle = document.getElementById('currentTitle');

    if (activeNav) {
        activeNav.classList.remove('text-slate-300', 'hover:bg-slate-800/60');
        activeNav.classList.add('bg-emerald-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/20');
    }

    if (menuName === 'pegawai') {
        document.getElementById('section-pegawai').classList.remove('hidden');
        currentTitle.innerHTML = `<i class="fa-solid fa-users text-emerald-400"></i> Data Pegawai`;
        loadDataPegawai();
    } else if (menuName === 'pendidikan') {
        document.getElementById('section-pendidikan').classList.remove('hidden');
        currentTitle.innerHTML = `<i class="fa-solid fa-user-graduate text-emerald-400"></i> Riwayat Pendidikan`;
        loadDataPendidikan();
    } else if (menuName === 'pekerjaan') {
        document.getElementById('section-pekerjaan').classList.remove('hidden');
        currentTitle.innerHTML = `<i class="fa-solid fa-briefcase text-emerald-400"></i> Riwayat Pekerjaan`;
        loadDataPekerjaan();
    }
}

// === 4. LOAD DATA PEGAWAI FROM SUPABASE ===
async function loadDataPegawai() {
    const tbody = document.getElementById('tbodyPegawai');
    try {
        if (!window.db) throw new Error("Database belum siap");

        const { data, error } = await window.db.from('pegawai').select('*');
        if (error) throw error;

        dataPegawaiCache = data || [];

        // Hitung statistik ringkas
        document.getElementById('statTotalPegawai').textContent = dataPegawaiCache.length;
        document.getElementById('statPNS').textContent = dataPegawaiCache.filter(p => (p.status_pegawai || '').toLowerCase().includes('pns')).length;
        document.getElementById('statNonASN').textContent = dataPegawaiCache.filter(p => (p.status_pegawai || '').toLowerCase().includes('non') || (p.status_pegawai || '').toLowerCase().includes('kontrak')).length;
        
        const ruanganUnik = new Set(dataPegawaiCache.map(p => p.ruangan).filter(Boolean));
        document.getElementById('statRuangan').textContent = ruanganUnik.size;

        renderPegawaiTable(dataPegawaiCache);

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Gagal memuat data pegawai: ${err.message}</td></tr>`;
    }
}

function renderPegawaiTable(list) {
    const tbody = document.getElementById('tbodyPegawai');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Tidak ada data pegawai.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, idx) => `
        <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="p-4 text-slate-400 font-medium">${idx + 1}</td>
            <td class="p-4">
                <div class="font-semibold text-white">${item.nik || '-'}</div>
                <div class="text-[11px] text-slate-400">${item.nip || 'NIP: -'}</div>
            </td>
            <td class="p-4 font-medium text-slate-200">${item.nama || '-'}</td>
            <td class="p-4">
                <div>${item.jabatan || '-'}</div>
                <div class="text-[11px] text-emerald-400">${item.ruangan || '-'}</div>
            </td>
            <td class="p-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    ${item.status_pegawai || 'Pegawai'}
                </span>
            </td>
            <td class="p-4 text-slate-300 capitalize">${item.aksesrole || 'user'}</td>
            <td class="p-4 text-center">
                <button class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg mr-1" title="Detail"><i class="fa-solid fa-eye"></i></button>
                <button class="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg mr-1" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// === 5. LOAD RIWAYAT PENDIDIKAN FROM SUPABASE ===
async function loadDataPendidikan() {
    const tbody = document.getElementById('tbodyPendidikan');
    try {
        if (!window.db) throw new Error("Database belum siap");

        const { data, error } = await window.db.from('riwayat_pendidikan').select('*');
        if (error) throw error;

        dataPendidikanCache = data || [];
        renderPendidikanTable(dataPendidikanCache);

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Gagal memuat riwayat pendidikan: ${err.message}</td></tr>`;
    }
}

function renderPendidikanTable(list) {
    const tbody = document.getElementById('tbodyPendidikan');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Belum ada riwayat pendidikan terdaftar.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, idx) => `
        <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="p-4 text-slate-400 font-medium">${idx + 1}</td>
            <td class="p-4">
                <div class="font-semibold text-white">${item.nama || '-'}</div>
                <div class="text-[11px] text-slate-400">NIK: ${item.nik || '-'}</div>
            </td>
            <td class="p-4">
                <span class="font-semibold text-emerald-400">${item.jenjang_pendidikan || '-'}</span>
                <div class="text-[11px] text-slate-400">${item.jurusan || '-'}</div>
            </td>
            <td class="p-4 text-slate-300">${item.asal_pendidikan || '-'}</td>
            <td class="p-4 text-slate-300">${item.tanggal_lulus || '-'}</td>
            <td class="p-4">
                ${item.upload_ijazah ? `<a href="${item.upload_ijazah}" target="_blank" class="text-xs text-blue-400 hover:underline"><i class="fa-solid fa-file-pdf mr-1"></i>Lihat Ijazah</a>` : '<span class="text-slate-600">-</span>'}
            </td>
            <td class="p-4 text-center">
                <button class="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg mr-1"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// === 6. LOAD RIWAYAT PEKERJAAN FROM SUPABASE ===
async function loadDataPekerjaan() {
    const tbody = document.getElementById('tbodyPekerjaan');
    try {
        if (!window.db) throw new Error("Database belum siap");

        const { data, error } = await window.db.from('riwayat_pekerjaan').select('*');
        if (error) throw error;

        dataPekerjaanCache = data || [];
        renderPekerjaanTable(dataPekerjaanCache);

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Gagal memuat riwayat pekerjaan: ${err.message}</td></tr>`;
    }
}

function renderPekerjaanTable(list) {
    const tbody = document.getElementById('tbodyPekerjaan');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Belum ada riwayat pekerjaan terdaftar.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, idx) => `
        <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="p-4 text-slate-400 font-medium">${idx + 1}</td>
            <td class="p-4">
                <div class="font-semibold text-white">${item.nama || '-'}</div>
                <div class="text-[11px] text-slate-400">NIK: ${item.nik || '-'}</div>
            </td>
            <td class="p-4">
                <div class="font-medium text-amber-400">Tahun: ${item.tahun || '-'}</div>
                <div class="text-[11px] text-slate-300">${item.uraian_perubahan || '-'}</div>
            </td>
            <td class="p-4 text-slate-300">${item.mulai || '-'} s/d ${item.akhir || 'Sekarang'}</td>
            <td class="p-4">
                <div>${item.pejabat || '-'}</div>
                <div class="text-[11px] text-slate-400">No SK: ${item.nomor || '-'}</div>
            </td>
            <td class="p-4">
                ${item.upload_sk ? `<a href="${item.upload_sk}" target="_blank" class="text-xs text-blue-400 hover:underline"><i class="fa-solid fa-file-pdf mr-1"></i>Lihat SK</a>` : '<span class="text-slate-600">-</span>'}
            </td>
            <td class="p-4 text-center">
                <button class="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg mr-1"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// === 7. FILTER PENCARIAN CLIENT-SIDE ===
function searchTable(type) {
    if (type === 'pegawai') {
        const query = document.getElementById('searchPegawai').value.toLowerCase();
        const filtered = dataPegawaiCache.filter(p => 
            (p.nama || '').toLowerCase().includes(query) ||
            (p.nik || '').toLowerCase().includes(query) ||
            (p.ruangan || '').toLowerCase().includes(query)
        );
        renderPegawaiTable(filtered);
    } else if (type === 'pendidikan') {
        const query = document.getElementById('searchPendidikan').value.toLowerCase();
        const filtered = dataPendidikanCache.filter(p => 
            (p.nama || '').toLowerCase().includes(query) ||
            (p.nik || '').toLowerCase().includes(query) ||
            (p.jenjang_pendidikan || '').toLowerCase().includes(query)
        );
        renderPendidikanTable(filtered);
    } else if (type === 'pekerjaan') {
        const query = document.getElementById('searchPekerjaan').value.toLowerCase();
        const filtered = dataPekerjaanCache.filter(p => 
            (p.nama || '').toLowerCase().includes(query) ||
            (p.nik || '').toLowerCase().includes(query) ||
            (p.pejabat || '').toLowerCase().includes(query)
        );
        renderPekerjaanTable(filtered);
    }
}

window.switchMenu = switchMenu;
window.handleLogout = handleLogout;
window.searchTable = searchTable;
