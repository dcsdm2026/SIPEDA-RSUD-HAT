// === FILE: Homepage/js/riwayatpekerjaan.js ===

// State Variables
let rawPekerjaanData = [];
let filteredPekerjaanData = [];
let masterPegawaiData = []; // Cache master pegawai untuk auto-complete
let currentPage = 1;
const itemsPerPage = 50; // Max 50 data per halaman

let modalFormInstance = null;
let modalDetailInstance = null;

// Fungsi helper ambil instance client Supabase
function getSupabaseClient() {
    const client = window.supabaseClient || window.db || (window.parent && (window.parent.supabaseClient || window.parent.db));
    if (!client) {
        console.error("❌ Supabase Client belum terdeteksi. Periksa koneksi.js!");
    }
    return client;
}

// Inisialisasi saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
    modalFormInstance = new bootstrap.Modal(document.getElementById('modalFormPekerjaan'));
    modalDetailInstance = new bootstrap.Modal(document.getElementById('modalDetailPekerjaan'));
    
    // Muat data utama & master pegawai
    fetchRiwayatPekerjaan();
    fetchMasterPegawai();

    // Event Listener untuk Auto-Complete NIK -> Nama Pegawai
    setupNikPegawaiAutocomplete();
});

// 1. Ambil Data Master Pegawai untuk Auto-complete Input Modal
async function fetchMasterPegawai() {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('pegawai')
            .select('nik, nama')
            .order('nama', { ascending: true });

        if (error) throw error;

        masterPegawaiData = data || [];
        
        // Render Datalist Opsi Pegawai
        const datalist = document.getElementById('listPegawaiAuto');
        if (datalist) {
            datalist.innerHTML = '';
            masterPegawaiData.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.nik;
                opt.label = `${p.nama} (${p.nik})`;
                datalist.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Gagal memuat master pegawai:", err.message);
    }
}

// 2. Listener Auto-fill Nama ketika Ketik / Pilih NIK Pegawai
function setupNikPegawaiAutocomplete() {
    const inputNik = document.getElementById('formNik');
    const inputNama = document.getElementById('formNama');

    if (!inputNik) return;

    inputNik.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        
        // Cari di data master pegawai berdasarkan NIK atau Nama
        const match = masterPegawaiData.find(p => 
            p.nik.toLowerCase() === val || p.nama.toLowerCase() === val
        );

        if (match) {
            inputNik.value = match.nik;   // Set nilai NIK
            inputNama.value = match.nama; // Auto-fill Nama
        } else {
            inputNama.value = ''; // Reset jika tidak match
        }
    });
}

// 3. Ambil Data Riwayat Pekerjaan dari Supabase (Urut Abjad Nama A-Z)
async function fetchRiwayatPekerjaan() {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    const tbody = document.getElementById('tbodyRiwayatPekerjaan');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4 text-secondary">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>Memuat data riwayat pekerjaan...
            </td>
        </tr>`;

    try {
        const { data, error } = await supabaseClient
            .from('riwayat_pekerjaan')
            .select('*')
            .order('nama', { ascending: true }); // Mengurutkan abjad Nama A-Z

        if (error) throw error;

        rawPekerjaanData = data || [];
        populateDynamicFilters();
        applyFilters();

    } catch (err) {
        console.error("Error fetchRiwayatPekerjaan:", err.message);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>Gagal memuat data: ${err.message}
                </td>
            </tr>`;
    }
}

// 4. Opsi Filter Dinamis Tahun & Pejabat
function populateDynamicFilters() {
    const tahunSet = new Set();
    const pejabatSet = new Set();

    rawPekerjaanData.forEach(item => {
        if (item.tahun) tahunSet.add(String(item.tahun).trim());
        if (item.pejabat) pejabatSet.add(item.pejabat.trim());
    });

    const filterTahun = document.getElementById('filterTahun');
    const filterPejabat = document.getElementById('filterPejabat');

    filterTahun.innerHTML = '<option value="">Semua Tahun</option>';
    filterPejabat.innerHTML = '<option value="">Semua Pejabat</option>';

    Array.from(tahunSet).sort((a, b) => b - a).forEach(t => {
        filterTahun.innerHTML += `<option value="${t}">${t}</option>`;
    });

    Array.from(pejabatSet).sort().forEach(p => {
        filterPejabat.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

// 5. Terapkan Filter & Pencarian
function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase().trim();
    const tahunValue = document.getElementById('filterTahun').value;
    const pejabatValue = document.getElementById('filterPejabat').value;

    filteredPekerjaanData = rawPekerjaanData.filter(item => {
        const matchesSearch = !searchValue || 
            (item.nama && item.nama.toLowerCase().includes(searchValue)) ||
            (item.nik && item.nik.toLowerCase().includes(searchValue)) ||
            (item.uraian_perubahan && item.uraian_perubahan.toLowerCase().includes(searchValue)) ||
            (item.nomor && item.nomor.toLowerCase().includes(searchValue));

        const matchesTahun = !tahunValue || (String(item.tahun) === tahunValue);
        const matchesPejabat = !pejabatValue || (item.pejabat === pejabatValue);

        return matchesSearch && matchesTahun && matchesPejabat;
    });

    currentPage = 1;
    renderTable();
}

function handleSearch() {
    applyFilters();
}

// 6. Render Tabel dengan Pagination 50 Data per Halaman
function renderTable() {
    const tbody = document.getElementById('tbodyRiwayatPekerjaan');
    tbody.innerHTML = '';

    if (filteredPekerjaanData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-secondary">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data riwayat pekerjaan ditemukan.
                </td>
            </tr>`;
        renderPagination(0);
        document.getElementById('infoPagination').innerText = "Menampilkan 0 data";
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredPekerjaanData.length);
    const paginatedItems = filteredPekerjaanData.slice(startIndex, endIndex);

    paginatedItems.forEach((item, index) => {
        const rowNo = startIndex + index + 1;
        const mulaiFormatted = item.mulai ? formatDate(item.mulai) : '-';
        const akhirFormatted = item.akhir ? formatDate(item.akhir) : '-';
        const tglSkFormatted = item.tanggal ? formatDate(item.tanggal) : '-';
        const gajiFormatted = item.gaji_pokok ? formatRupiah(item.gaji_pokok) : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center fw-medium">${rowNo}</td>
            <td>
                <div class="fw-semibold text-primary-emphasis">${escapeHtml(item.nama || '-')}</div>
                <div class="small text-secondary"><i class="bi bi-card-text me-1"></i>${escapeHtml(item.nik || '-')}</div>
            </td>
            <td>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">${escapeHtml(String(item.tahun || '-'))}</span>
                <div class="fw-medium text-wrap" style="max-width: 200px;">${escapeHtml(item.uraian_perubahan || '-')}</div>
            </td>
            <td>
                <div class="small"><i class="bi bi-calendar-event me-1"></i>Mulai: ${mulaiFormatted}</div>
                <div class="small text-secondary"><i class="bi bi-calendar-x me-1"></i>Akhir: ${akhirFormatted}</div>
            </td>
            <td class="fw-semibold text-success-emphasis">
                ${gajiFormatted}
            </td>
            <td>
                <div>${escapeHtml(item.pejabat || '-')}</div>
                <div class="small text-secondary"><i class="bi bi-file-earmark-text me-1"></i>No: ${escapeHtml(item.nomor || '-')}</div>
                <div class="small text-secondary"><i class="bi bi-calendar-check me-1"></i>Tgl: ${tglSkFormatted}</div>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-info" title="Detail" onclick="openDetailModal('${item.id_riwayatpekerjaan}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" title="Edit" onclick="openModalEdit('${item.id_riwayatpekerjaan}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Hapus" onclick="deleteDataPekerjaan('${item.id_riwayatpekerjaan}', '${escapeHtml(item.nama)}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('infoPagination').innerText = `Menampilkan ${startIndex + 1} - ${endIndex} dari total ${filteredPekerjaanData.length} data`;
    renderPagination(filteredPekerjaanData.length);
}

// 7. Render Navigasi Halaman (Pagination)
function renderPagination(totalItems) {
    const paginationList = document.getElementById('paginationList');
    paginationList.innerHTML = '';

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">&laquo;</a>`;
    paginationList.appendChild(prevLi);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
            paginationList.appendChild(li);
        }
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">&raquo;</a>`;
    paginationList.appendChild(nextLi);
}

function changePage(page) {
    const totalPages = Math.ceil(filteredPekerjaanData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// 8. Operasi Modal (Tambah / Edit / Simpan)
function openModalTambah() {
    document.getElementById('formRiwayatPekerjaan').reset();
    document.getElementById('id_riwayatpekerjaan').value = '';
    document.getElementById('modalFormTitle').innerHTML = `<i class="bi bi-briefcase me-2"></i>Tambah Riwayat Pekerjaan`;
    modalFormInstance.show();
}

function openModalEdit(id) {
    const item = rawPekerjaanData.find(d => String(d.id_riwayatpekerjaan) === String(id));
    if (!item) return;

    document.getElementById('id_riwayatpekerjaan').value = item.id_riwayatpekerjaan || '';
    document.getElementById('formNik').value = item.nik || '';
    document.getElementById('formNama').value = item.nama || '';
    document.getElementById('formTahun').value = item.tahun || '';
    document.getElementById('formUraianPerubahan').value = item.uraian_perubahan || '';
    document.getElementById('formMulai').value = item.mulai || '';
    document.getElementById('formAkhir').value = item.akhir || '';
    document.getElementById('formGajiPokok').value = item.gaji_pokok || '';
    document.getElementById('formPejabat').value = item.pejabat || '';
    document.getElementById('formTanggal').value = item.tanggal || '';
    document.getElementById('formNomor').value = item.nomor || '';
    document.getElementById('formUploadSk').value = item.upload_sk || '';

    document.getElementById('modalFormTitle').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Riwayat Pekerjaan`;
    modalFormInstance.show();
}

async function saveDataPekerjaan(e) {
    e.preventDefault();
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    const id = document.getElementById('id_riwayatpekerjaan').value;
    const btnSave = document.getElementById('btnSave');

    const payload = {
        nik: document.getElementById('formNik').value.trim(),
        nama: document.getElementById('formNama').value.trim(),
        tahun: parseInt(document.getElementById('formTahun').value) || null,
        uraian_perubahan: document.getElementById('formUraianPerubahan').value.trim(),
        mulai: document.getElementById('formMulai').value || null,
        akhir: document.getElementById('formAkhir').value || null,
        gaji_pokok: parseFloat(document.getElementById('formGajiPokok').value) || null,
        pejabat: document.getElementById('formPejabat').value.trim(),
        tanggal: document.getElementById('formTanggal').value || null,
        nomor: document.getElementById('formNomor').value.trim(),
        upload_sk: document.getElementById('formUploadSk').value.trim()
    };

    btnSave.disabled = true;
    btnSave.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...`;

    try {
        if (id) {
            // Update Data
            const { error } = await supabaseClient
                .from('riwayat_pekerjaan')
                .update(payload)
                .eq('id_riwayatpekerjaan', id);

            if (error) throw error;
        } else {
            // Tambah Data Baru
            const { error } = await supabaseClient
                .from('riwayat_pekerjaan')
                .insert([payload]);

            if (error) throw error;
        }

        modalFormInstance.hide();
        fetchRiwayatPekerjaan();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `Simpan Data`;
    }
}

// 9. Modal Detail Data
function openDetailModal(id) {
    const item = rawPekerjaanData.find(d => String(d.id_riwayatpekerjaan) === String(id));
    if (!item) return;

    const skLink = item.upload_sk ? `<a href="${escapeHtml(item.upload_sk)}" target="_blank" class="btn btn-xs btn-outline-primary"><i class="bi bi-box-arrow-up-right me-1"></i>Lihat SK</a>` : '-';

    const detailBody = document.getElementById('detailBody');
    detailBody.innerHTML = `
        <table class="table table-sm table-borderless mb-0">
            <tr><th style="width: 40%;">NIK</th><td>: ${escapeHtml(item.nik || '-')}</td></tr>
            <tr><th>Nama Pegawai</th><td>: ${escapeHtml(item.nama || '-')}</td></tr>
            <tr><th>Tahun</th><td>: ${escapeHtml(String(item.tahun || '-'))}</td></tr>
            <tr><th>Uraian Perubahan</th><td>: ${escapeHtml(item.uraian_perubahan || '-')}</td></tr>
            <tr><th>Mulai Pekerjaan</th><td>: ${item.mulai ? formatDate(item.mulai) : '-'}</td></tr>
            <tr><th>Akhir Pekerjaan</th><td>: ${item.akhir ? formatDate(item.akhir) : '-'}</td></tr>
            <tr><th>Gaji Pokok</th><td>: ${item.gaji_pokok ? formatRupiah(item.gaji_pokok) : '-'}</td></tr>
            <tr><th>Pejabat SK</th><td>: ${escapeHtml(item.pejabat || '-')}</td></tr>
            <tr><th>Tanggal SK</th><td>: ${item.tanggal ? formatDate(item.tanggal) : '-'}</td></tr>
            <tr><th>Nomor SK</th><td>: ${escapeHtml(item.nomor || '-')}</td></tr>
            <tr><th>Dokumen SK</th><td>: ${skLink}</td></tr>
        </table>
    `;
    modalDetailInstance.show();
}

// 10. Hapus Data
async function deleteDataPekerjaan(id, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pekerjaan untuk ${nama}?`)) return;

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('riwayat_pekerjaan')
            .delete()
            .eq('id_riwayatpekerjaan', id);

        if (error) throw error;
        fetchRiwayatPekerjaan();
    } catch (err) {
        alert("Gagal menghapus data: " + err.message);
    }
}

// 11. Export Excel
function exportToExcel() {
    if (filteredPekerjaanData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const dataToExport = filteredPekerjaanData.map((item, index) => ({
        "No": index + 1,
        "NIK": item.nik || '',
        "Nama Pegawai": item.nama || '',
        "Tahun": item.tahun || '',
        "Uraian Perubahan": item.uraian_perubahan || '',
        "Tanggal Mulai": item.mulai || '',
        "Tanggal Akhir": item.akhir || '',
        "Gaji Pokok": item.gaji_pokok || 0,
        "Pejabat Penandatangan": item.pejabat || '',
        "Tanggal SK": item.tanggal || '',
        "Nomor SK": item.nomor || '',
        "Dokumen SK": item.upload_sk || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pekerjaan");
    XLSX.writeFile(workbook, `Riwayat_Pekerjaan_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 12. Export PDF
function exportToPDF() {
    if (filteredPekerjaanData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    doc.setFontSize(14);
    doc.text("Laporan Data Riwayat Pekerjaan - RSUD HAT", 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const tableHeaders = [["No", "Nama / NIK", "Tahun / Uraian", "Periode", "Gaji Pokok", "Pejabat / SK"]];
    const tableData = filteredPekerjaanData.map((item, index) => [
        index + 1,
        `${item.nama || '-'}\nNIK: ${item.nik || '-'}`,
        `Thn: ${item.tahun || '-'}\n${item.uraian_perubahan || '-'}`,
        `Mulai: ${item.mulai ? formatDate(item.mulai) : '-'}\nAkhir: ${item.akhir ? formatDate(item.akhir) : '-'}`,
        item.gaji_pokok ? formatRupiah(item.gaji_pokok) : '-',
        `${item.pejabat || '-'}\nNo: ${item.nomor || '-'}\nTgl: ${item.tanggal ? formatDate(item.tanggal) : '-'}`
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Riwayat_Pekerjaan_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Helper Utilities
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupiah(number) {
    if (number === null || number === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
