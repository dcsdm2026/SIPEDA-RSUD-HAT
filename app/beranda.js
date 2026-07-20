// === FILE: app/beranda.js ===

let dataPegawaiCache = [];
let filteredPegawaiCache = [];
let dataPendidikanCache = [];
let dataPekerjaanCache = [];

// === 1. CEK SESI USER & INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('sipeda_user');
    if (!userJson) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userJson);

    // Set Info User di Sidebar
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.nama || user.email || 'Pengguna';
    }
    if (document.getElementById('userRole')) {
        document.getElementById('userRole').textContent = user.aksesrole || 'Pegawai';
    }
    if (document.getElementById('userAvatar')) {
        document.getElementById('userAvatar').textContent = (user.nama || user.email || 'A').charAt(0).toUpperCase();
    }

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

// === 3. NAVIGASI TAB MENU ===
function switchMenu(menuName) {
    const secPegawai = document.getElementById('section-pegawai');
    const secPendidikan = document.getElementById('section-pendidikan');
    const secPekerjaan = document.getElementById('section-pekerjaan');

    if (secPegawai) secPegawai.classList.add('hidden');
    if (secPendidikan) secPendidikan.classList.add('hidden');
    if (secPekerjaan) secPekerjaan.classList.add('hidden');

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
        if (secPegawai) secPegawai.classList.remove('hidden');
        if (currentTitle) currentTitle.innerHTML = `<i class="fa-solid fa-users text-emerald-400"></i> Data Pegawai`;
        loadDataPegawai();
    } else if (menuName === 'pendidikan') {
        if (secPendidikan) secPendidikan.classList.remove('hidden');
        if (currentTitle) currentTitle.innerHTML = `<i class="fa-solid fa-user-graduate text-emerald-400"></i> Riwayat Pendidikan`;
        loadDataPendidikan();
    } else if (menuName === 'pekerjaan') {
        if (secPekerjaan) secPekerjaan.classList.remove('hidden');
        if (currentTitle) currentTitle.innerHTML = `<i class="fa-solid fa-briefcase text-emerald-400"></i> Riwayat Pekerjaan`;
        loadDataPekerjaan();
    }
}

// === 4. LOAD DATA PEGAWAI DARI SUPABASE ===
async function loadDataPegawai() {
    const tbody = document.getElementById('tbodyPegawai');
    try {
        if (!window.db) throw new Error("Koneksi Supabase belum siap");

        const { data, error } = await window.db.from('pegawai').select('*');
        if (error) throw error;

        dataPegawaiCache = data || [];
        filteredPegawaiCache = [...dataPegawaiCache];

        // Update Statistik Dashboard
        if (document.getElementById('statTotalPegawai')) {
            document.getElementById('statTotalPegawai').textContent = dataPegawaiCache.length;
        }
        if (document.getElementById('statPNS')) {
            document.getElementById('statPNS').textContent = dataPegawaiCache.filter(p => 
                (p.status_pegawai || '').toUpperCase().includes('PNS')
            ).length;
        }
        if (document.getElementById('statNonASN')) {
            document.getElementById('statNonASN').textContent = dataPegawaiCache.filter(p => 
                (p.status_pegawai || '').toUpperCase().includes('NON') || 
                (p.status_pegawai || '').toUpperCase().includes('KONTRAK')
            ).length;
        }
        if (document.getElementById('statRuangan')) {
            const ruanganUnik = new Set(dataPegawaiCache.map(p => p.ruangan).filter(Boolean));
            document.getElementById('statRuangan').textContent = ruanganUnik.size;
        }

        // Populasikan Opsi Jabatan Secara Dinamis
        populateJabatanOptions(dataPegawaiCache);

        // Jalankan Filter & Render
        applyPegawaiFilters();

    } catch (err) {
        console.error('Error loadDataPegawai:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Gagal memuat data pegawai: ${err.message}</td></tr>`;
        }
    }
}

// Isi Opsi Jabatan di Dropdown Filter
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

// === 5. FUNGSI PENCARIAN & FILTER MULTI-KRITERIA ===
function applyPegawaiFilters() {
    const searchInput = document.getElementById('searchPegawai');
    const statusSelect = document.getElementById('filterStatusPegawai');
    const jabatanSelect = document.getElementById('filterJabatan');

    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const statusVal = statusSelect ? statusSelect.value.trim().toLowerCase() : '';
    const jabatanVal = jabatanSelect ? jabatanSelect.value.trim().toLowerCase() : '';

    filteredPegawaiCache = dataPegawaiCache.filter(p => {
        const pNama = (p.nama || '').toLowerCase();
        const pNik = (p.nik || '').toLowerCase();
        const pNip = (p.nip || '').toLowerCase();
        const pRuangan = (p.ruangan || '').toLowerCase();
        const pStatus = (p.status_pegawai || '').toLowerCase();
        const pJabatan = (p.jabatan || '').toLowerCase();

        const matchText = !searchVal || 
            pNama.includes(searchVal) || 
            pNik.includes(searchVal) || 
            pNip.includes(searchVal) || 
            pRuangan.includes(searchVal);

        const matchStatus = !statusVal || pStatus.includes(statusVal);
        const matchJabatan = !jabatanVal || pJabatan.includes(jabatanVal);

        return matchText && matchStatus && matchJabatan;
    });

    renderPegawaiTable(filteredPegawaiCache);
}

function renderPegawaiTable(list) {
    const tbody = document.getElementById('tbodyPegawai');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Tidak ada data pegawai yang sesuai.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, idx) => `
        <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="p-4 text-slate-400 font-medium">${idx + 1}</td>
            <td class="p-4">
                <div class="font-semibold text-white">${item.nik || '-'}</div>
                <div class="text-[11px] text-slate-400">${item.nip ? 'NIP: ' + item.nip : '-'}</div>
            </td>
            <td class="p-4 font-medium text-slate-200">${item.nama || '-'}</td>
            <td class="p-4">
                <div class="text-slate-200">${item.jabatan || '-'}</div>
                <div class="text-[11px] text-emerald-400">${item.ruangan || '-'}</div>
            </td>
            <td class="p-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    ${item.status_pegawai || 'Pegawai'}
                </span>
            </td>
            <td class="p-4 text-slate-300 capitalize">${item.aksesrole || 'user'}</td>
            <td class="p-4 text-center">
                <button onclick="hapusPegawai('${item.nik}')" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus Pegawai">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// === 6. MODAL & TAMBAH PEGAWAI BARU ===
function openModalPegawai() {
    const modal = document.getElementById('modalPegawai');
    const form = document.getElementById('formPegawai');
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
}

function closeModalPegawai() {
    const modal = document.getElementById('modalPegawai');
    if (modal) modal.classList.add('hidden');
}

async function simpanPegawai(event) {
    event.preventDefault();
    const btnSubmit = document.getElementById('btnSubmitPegawai');

    const nik = document.getElementById('inputNik').value.trim();
    const nip = document.getElementById('inputNip').value.trim();
    const nama = document.getElementById('inputNama').value.trim();
    const status_pegawai = document.getElementById('inputStatusPegawai').value;
    const jabatan = document.getElementById('inputJabatan').value.trim();
    const ruangan = document.getElementById('inputRuangan').value.trim();
    const aksesrole = document.getElementById('inputAksesRole').value;
    const email = document.getElementById('inputEmail').value.trim();
    const no_telp = document.getElementById('inputNoTelp').value.trim();

    if (!nik || !nama) {
        alert('NIK dan Nama Lengkap wajib diisi!');
        return;
    }

    try {
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
        }

        const payload = {
            nik: nik,
            nip: nip || null,
            nama: nama,
            status_pegawai: status_pegawai,
            jabatan: jabatan || null,
            ruangan: ruangan || null,
            aksesrole: aksesrole || 'user',
            email: email || null,
            no_telp: no_telp || null
        };

        const { error } = await window.db.from('pegawai').insert([payload]);
        if (error) throw error;

        alert('Pegawai baru berhasil ditambahkan!');
        closeModalPegawai();
        loadDataPegawai(); // Refresh tabel

    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan data pegawai: ' + err.message);
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-save"></i> <span>Simpan Data</span>`;
        }
    }
}

// Hapus Pegawai
async function hapusPegawai(nik) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pegawai dengan NIK: ${nik}?`)) return;

    try {
        const { error } = await window.db.from('pegawai').delete().eq('nik', nik);
        if (error) throw error;

        alert('Data pegawai berhasil dihapus!');
        loadDataPegawai();
    } catch (err) {
        alert('Gagal menghapus data: ' + err.message);
    }
}

// === 7. EXPORT DATA TO EXCEL ===
function exportPegawaiExcel() {
    const dataToExport = filteredPegawaiCache;

    if (!dataToExport || dataToExport.length === 0) {
        alert("Tidak ada data pegawai yang tersedia untuk diexport!");
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert("Library SheetJS (XLSX) belum siap atau terhalang koneksi CDN.");
        return;
    }

    // Format Data Spreadsheet
    const formattedData = dataToExport.map((item, idx) => ({
        "No": idx + 1,
        "NIK": item.nik || '',
        "NIP": item.nip || '',
        "Nama Pegawai": item.nama || '',
        "Status Pegawai": item.status_pegawai || '',
        "Jabatan": item.jabatan || '',
        "Ruangan / Unit": item.ruangan || '',
        "Akses Role": item.aksesrole || 'user',
        "Email": item.email || '',
        "No Telp": item.no_telp || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");

    // Otomatis Atur Lebar Kolom
    const maxWidths = [
        { wch: 6 },  // No
        { wch: 20 }, // NIK
        { wch: 20 }, // NIP
        { wch: 30 }, // Nama
        { wch: 18 }, // Status
        { wch: 25 }, // Jabatan
        { wch: 25 }, // Ruangan
        { wch: 12 }, // Role
        { wch: 25 }, // Email
        { wch: 15 }  // No Telp
    ];
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Data_Pegawai_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// === 8. EXPORT DATA TO PDF ===
function exportPegawaiPDF() {
    const dataToExport = filteredPegawaiCache;

    if (!dataToExport || dataToExport.length === 0) {
        alert("Tidak ada data pegawai yang tersedia untuk diexport!");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Library jsPDF belum dimuat sempurna dari CDN.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4'); // Format Lanskap A4

    // Header PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RSUD H. AMRI TAMBUNAN", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Master Data Pegawai", 14, 21);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 26);

    // Kolom & Baris
    const tableColumns = ["No", "NIK / NIP", "Nama Pegawai", "Status", "Jabatan", "Ruangan", "No Telp"];
    const tableRows = dataToExport.map((item, idx) => [
        idx + 1,
        `${item.nik || '-'}\n${item.nip ? 'NIP: ' + item.nip : ''}`,
        item.nama || '-',
        item.status_pegawai || '-',
        item.jabatan || '-',
        item.ruangan || '-',
        item.no_telp || '-'
    ]);

    // Tabel autoTable
    doc.autoTable({
        startY: 32,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Warna Emerald
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 40 },
            2: { cellWidth: 55 },
            3: { cellWidth: 30 },
            4: { cellWidth: 50 },
            5: { cellWidth: 45 },
            6: { cellWidth: 35 }
        }
    });

    doc.save(`Data_Pegawai_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// === 9. LOAD RIWAYAT PENDIDIKAN ===
async function loadDataPendidikan() {
    const tbody = document.getElementById('tbodyPendidikan');
    try {
        if (!window.db) throw new Error("Koneksi Supabase belum siap");

        const { data, error } = await window.db.from('riwayat_pendidikan').select('*');
        if (error) throw error;

        dataPendidikanCache = data || [];
        
        if (!tbody) return;
        if (dataPendidikanCache.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">Belum ada riwayat pendidikan terdaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = dataPendidikanCache.map((item, idx) => `
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
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400">Gagal memuat riwayat pendidikan: ${err.message}</td></tr>`;
    }
}

// === 10. LOAD RIWAYAT PEKERJAAN ===
async function loadDataPekerjaan() {
    const tbody = document.getElementById('tbodyPekerjaan');
    try {
        if (!window.db) throw new Error("Koneksi Supabase belum siap");

        const { data, error } = await window.db.from('riwayat_pekerjaan').select('*');
        if (error) throw error;

        dataPekerjaanCache = data || [];

        if (!tbody) return;
        if (dataPekerjaanCache.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">Belum ada riwayat pekerjaan terdaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = dataPekerjaanCache.map((item, idx) => `
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
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400">Gagal memuat riwayat pekerjaan: ${err.message}</td></tr>`;
    }
}
// Fungsi Simpan Pegawai
async function simpanPegawai() {
  // Helper untuk mengambil nilai input
  const getValue = (id) => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== "" ? el.value.trim() : null;
  };

  const nik = getValue('nik');
  const nama = getValue('nama');

  // Validasi field wajib
  if (!nik || !nama) {
    alert("NIK dan Nama Wajib Diisi!");
    return;
  }

  // Mengumpulkan seluruh field sesuai tabel database pegawai
  const dataPegawai = {
    // 1. Profil Pribadi
    id_pegawai: getValue('id_pegawai'),
    nik: nik,
    nama: nama,
    tempat_lahir: getValue('tempat_lahir'),
    tanggal_lahir: getValue('tanggal_lahir'),
    jenis_kelamin: getValue('jenis_kelamin'),
    agama: getValue('agama'),
    alamat: getValue('alamat'),
    email: getValue('email'),
    no_telp: getValue('no_telp'),

    // 2. Keluarga
    status_keluarga: getValue('status_keluarga'),
    no_kk: getValue('no_kk'),
    nama_pasangan: getValue('nama_pasangan'),
    jumlah_anak: getValue('jumlah_anak') ? parseInt(getValue('jumlah_anak')) : 0,
    anak1: getValue('anak1'),
    anak2: getValue('anak2'),
    anak3: getValue('anak3'),

    // 3. Pendidikan
    jenjang_pendidikan: getValue('jenjang_pendidikan'),
    fakultas: getValue('fakultas'),
    jurusan: getValue('jurusan'),
    asal_pendidikan: getValue('asal_pendidikan'),
    tanggal_lulus: getValue('tanggal_lulus'),

    // 4. Pekerjaan
    nip: getValue('nip'),
    status_pegawai: getValue('status_pegawai'),
    kelompok_pegawai: getValue('kelompok_pegawai'),
    golongan: getValue('golongan'),
    tmt_pangkat: getValue('tmt_pangkat'),
    kelompok_jabatan: getValue('kelompok_jabatan'),
    jabatan: getValue('jabatan'),
    tmt_jabatan: getValue('tmt_jabatan'),
    tanggal_masuk: getValue('tanggal_masuk'),
    masa_kerja: getValue('masa_kerja'),
    bup: getValue('bup') ? parseInt(getValue('bup')) : null,
    tmt_pensiun: getValue('tmt_pensiun'),
    tmtcpns: getValue('tmtcpns'),
    ruangan: getValue('ruangan'),
    tmt_notatugas: getValue('tmt_notatugas'),
    aksesrole: getValue('aksesrole') || 'User',

    // 5. Lainnya & Dokumen
    no_bpjskesehatan: getValue('no_bpjskesehatan'),
    no_taspen_ketenagakerjaan: getValue('no_taspen_ketenagakerjaan'),
    npwp: getValue('npwp'),
    upload_foto: getValue('upload_foto'),
    upload_ktp: getValue('upload_ktp'),
    upload_kk: getValue('upload_kk'),
    upload_ijazah: getValue('upload_ijazah'),
    upload_transkrip: getValue('upload_transkrip'),
    upload_notatugas: getValue('upload_notatugas'),
    upload_bpjskesehatan: getValue('upload_bpjskesehatan'),
    upload_ketenagakerjaan: getValue('upload_ketenagakerjaan'),
    upload_npwp: getValue('upload_npwp')
  };

  try {
    const { data, error } = await _supabase
      .from('pegawai')
      .insert([dataPegawai]);

    if (error) {
      console.error("Error insert Supabase:", error);
      alert("Gagal menyimpan data pegawai: " + error.message);
      return;
    }

    alert("Data pegawai berhasil ditambahkan!");
    
    // Reset Form
    document.getElementById('formTambahPegawai').reset();
    
    // Tutup Modal
    const modalEl = document.getElementById('modalTambahPegawai');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    }

    // Reload / Refresh Data
    if (typeof loadDataPegawai === 'function') {
      loadDataPegawai();
    } else {
      location.reload();
    }

  } catch (err) {
    console.error("Kesalahan Sistem:", err);
    alert("Terjadi kesalahan sistem saat menyimpan data.");
  }
}
// Export fungsi ke global window
window.switchMenu = switchMenu;
window.handleLogout = handleLogout;
window.applyPegawaiFilters = applyPegawaiFilters;
window.openModalPegawai = openModalPegawai;
window.closeModalPegawai = closeModalPegawai;
window.simpanPegawai = simpanPegawai;
window.hapusPegawai = hapusPegawai;
window.exportPegawaiExcel = exportPegawaiExcel;
window.exportPegawaiPDF = exportPegawaiPDF;
