// === FILE: app/beranda.js ===

let dataPegawaiCache = [];
let filteredPegawaiCache = [];
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
    document.getElementById('section-pegawai').classList.add('hidden');
    document.getElementById('section-pendidikan').classList.add('hidden');
    document.getElementById('section-pekerjaan').classList.add('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/20');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800/60');
    });

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
        filteredPegawaiCache = [...dataPegawaiCache];

        // Hitung statistik
        document.getElementById('statTotalPegawai').textContent = dataPegawaiCache.length;
        document.getElementById('statPNS').textContent = dataPegawaiCache.filter(p => (p.status_pegawai || '').toLowerCase().includes('pns')).length;
        document.getElementById('statNonASN').textContent = dataPegawaiCache.filter(p => (p.status_pegawai || '').toLowerCase().includes('non') || (p.status_pegawai || '').toLowerCase().includes('kontrak')).length;
        
        const ruanganUnik = new Set(dataPegawaiCache.map(p => p.ruangan).filter(Boolean));
        document.getElementById('statRuangan').textContent = ruanganUnik.size;

        // Isi Opsi Filter Jabatan Secara Dinamis
        populateJabatanOptions(dataPegawaiCache);

        // Render Tabel
        applyPegawaiFilters();

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Gagal memuat data pegawai: ${err.message}</td></tr>`;
    }
}

// Populate Opsi Jabatan dari Database
function populateJabatanOptions(data) {
    const selectJabatan = document.getElementById('filterJabatan');
    if (!selectJabatan) return;

    const jabatanSet = new Set(data.map(p => p.jabatan).filter(Boolean));
    const currentVal = selectJabatan.value;

    selectJabatan.innerHTML = `<option value="">Semua Jabatan</option>`;
    Array.from(jabatanSet).sort().forEach(jab => {
        selectJabatan.innerHTML += `<option value="${jab}">${jab}</option>`;
    });

    selectJabatan.value = currentVal;
}

// Filter Multi-Kriteria (Text + Status + Jabatan)
function applyPegawaiFilters() {
    const searchVal = (document.getElementById('searchPegawai').value || '').toLowerCase();
    const statusVal = (document.getElementById('filterStatusPegawai').value || '').toLowerCase();
    const jabatanVal = (document.getElementById('filterJabatan').value || '').toLowerCase();

    filteredPegawaiCache = dataPegawaiCache.filter(p => {
        const matchText = (p.nama || '').toLowerCase().includes(searchVal) ||
                          (p.nik || '').toLowerCase().includes(searchVal) ||
                          (p.nip || '').toLowerCase().includes(searchVal) ||
                          (p.ruangan || '').toLowerCase().includes(searchVal);

        const matchStatus = !statusVal || (p.status_pegawai || '').toLowerCase().includes(statusVal);
        const matchJabatan = !jabatanVal || (p.jabatan || '').toLowerCase().includes(jabatanVal);

        return matchText && matchStatus && matchJabatan;
    });

    renderPegawaiTable(filteredPegawaiCache);
}

function renderPegawaiTable(list) {
    const tbody = document.getElementById('tbodyPegawai');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Tidak ada data pegawai yang sesuai.</td></tr>`;
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

// === 5. EXPORT DATA PEGAWAI TO EXCEL ===
function exportPegawaiExcel() {
    const dataToExport = filteredPegawaiCache.length > 0 ? filteredPegawaiCache : dataPegawaiCache;

    if (dataToExport.length === 0) {
        alert("Tidak ada data pegawai untuk diexport!");
        return;
    }

    // Format Data Kolom Excel
    const formattedData = dataToExport.map((item, idx) => ({
        "No": idx + 1,
        "NIK": item.nik || '',
        "NIP": item.nip || '',
        "Nama Pegawai": item.nama || '',
        "Jenis Kelamin": item.jenis_kelamin || '',
        "Tempat Lahir": item.tempat_lahir || '',
        "Tanggal Lahir": item.tanggal_lahir || '',
        "Status Pegawai": item.status_pegawai || '',
        "Golongan": item.golongan || '',
        "Jabatan": item.jabatan || '',
        "Ruangan / Unit": item.ruangan || '',
        "Jenjang Pendidikan": item.jenjang_pendidikan || '',
        "Jurusan": item.jurusan || '',
        "Email": item.email || '',
        "No Telp / WA": item.no_telp || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");

    // Otomatis Atur Lebar Kolom
    const maxWidths = Object.keys(formattedData[0]).map(key => ({
        wch: Math.max(key.length + 3, 15)
    }));
    worksheet['!cols'] = maxWidths;

    // Download File Excel
    XLSX.writeFile(workbook, `Data_Pegawai_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// === 6. EXPORT DATA PEGAWAI TO PDF ===
function exportPegawaiPDF() {
    const dataToExport = filteredPegawaiCache.length > 0 ? filteredPegawaiCache : dataPegawaiCache;

    if (dataToExport.length === 0) {
        alert("Tidak ada data pegawai untuk diexport!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4'); // Format Lanskap A4

    // Judul Dokumen PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RSUD H. AMRI TAMBUNAN", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Master Data Pegawai", 14, 21);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 26);

    // Format Kolom & Baris PDF
    const tableColumns = ["No", "NIK / NIP", "Nama Pegawai", "Status", "Jabatan", "Ruangan", "Pendidikan", "No Telp"];
    const tableRows = dataToExport.map((item, idx) => [
        idx + 1,
        `${item.nik || '-'}\n${item.nip || 'NIP: -'}`,
        item.nama || '-',
        item.status_pegawai || '-',
        item.jabatan || '-',
        item.ruangan || '-',
        `${item.jenjang_pendidikan || ''} ${item.jurusan || ''}`.trim() || '-',
        item.no_telp || '-'
    ]);

    // Render Tabel Menggunakan autoTable
    doc.autoTable({
        startY: 32,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Warna Emerald-500
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25 },
            4: { cellWidth: 40 },
            5: { cellWidth: 35 },
            6: { cellWidth: 45 },
            7: { cellWidth: 30 }
        }
    });

    // Save File PDF
    doc.save(`Data_Pegawai_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// === 7. LOAD RIWAYAT PENDIDIKAN FROM SUPABASE ===
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

// === 8. LOAD RIWAYAT PEKERJAAN FROM SUPABASE ===
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

// Global Exports
window.switchMenu = switchMenu;
window.handleLogout = handleLogout;
window.applyPegawaiFilters = applyPegawaiFilters;
window.exportPegawaiExcel = exportPegawaiExcel;
window.exportPegawaiPDF = exportPegawaiPDF;
