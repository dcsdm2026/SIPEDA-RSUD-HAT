// === FILE: Homepage/js/riwayatpendidikan.js ===

// Global State
let rawPendidikanData = [];
let filteredPendidikanData = [];
let currentPage = 1;
const itemsPerPage = 50; // 50 data per halaman

let modalFormInstance = null;
let modalDetailInstance = null;

// Ambil Client Supabase secara aman
function getSupabaseClient() {
    const client = window.supabaseClient || window.db || (window.parent && (window.parent.supabaseClient || window.parent.db));
    if (!client) {
        console.error("❌ Supabase Client belum diinisialisasi. Periksa koneksi.js!");
    }
    return client;
}

// Inisialisasi saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
    modalFormInstance = new bootstrap.Modal(document.getElementById('modalFormPendidikan'));
    modalDetailInstance = new bootstrap.Modal(document.getElementById('modalDetailPendidikan'));
    
    fetchRiwayatPendidikan();
});

// 1. Ambil Data dari Supabase (Diurutkan berdasarkan Abjad NAMA A-Z)
async function fetchRiwayatPendidikan() {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    const tbody = document.getElementById('tbodyRiwayatPendidikan');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4 text-secondary">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>Memuat data riwayat pendidikan...
            </td>
        </tr>`;

    try {
        // Query ke tabel riwayat_pendidikan diurutkan berdasarkan nama (Ascending)
        const { data, error } = await supabaseClient
            .from('riwayat_pendidikan')
            .select('*')
            .order('nama', { ascending: true });

        if (error) throw error;

        rawPendidikanData = data || [];
        populateDynamicFilters();
        applyFilters();

    } catch (err) {
        console.error("Error fetchRiwayatPendidikan:", err.message);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle me-2"></i>Gagal memuat data: ${err.message}
                </td>
            </tr>`;
    }
}

// 2. Isi Opsi Filter Fakultas & Jurusan secara Dinamis
function populateDynamicFilters() {
    const fakultasSet = new Set();
    const jurusanSet = new Set();

    rawPendidikanData.forEach(item => {
        if (item.fakultas) fakultasSet.add(item.fakultas.trim());
        if (item.jurusan) jurusanSet.add(item.jurusan.trim());
    });

    const filterFakultas = document.getElementById('filterFakultas');
    const filterJurusan = document.getElementById('filterJurusan');

    filterFakultas.innerHTML = '<option value="">Semua Fakultas</option>';
    filterJurusan.innerHTML = '<option value="">Semua Jurusan</option>';

    Array.from(fakultasSet).sort().forEach(fakultas => {
        filterFakultas.innerHTML += `<option value="${fakultas}">${fakultas}</option>`;
    });

    Array.from(jurusanSet).sort().forEach(jurusan => {
        filterJurusan.innerHTML += `<option value="${jurusan}">${jurusan}</option>`;
    });
}

// 3. Terapkan Pencarian & Filter
function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase().trim();
    const jenjangValue = document.getElementById('filterJenjang').value;
    const fakultasValue = document.getElementById('filterFakultas').value;
    const jurusanValue = document.getElementById('filterJurusan').value;

    filteredPendidikanData = rawPendidikanData.filter(item => {
        const matchesSearch = !searchValue || 
            (item.nama && item.nama.toLowerCase().includes(searchValue)) ||
            (item.nik && item.nik.toLowerCase().includes(searchValue));

        const matchesJenjang = !jenjangValue || (item.jenjang_pendidikan === jenjangValue);
        const matchesFakultas = !fakultasValue || (item.fakultas === fakultasValue);
        const matchesJurusan = !jurusanValue || (item.jurusan === jurusanValue);

        return matchesSearch && matchesJenjang && matchesFakultas && matchesJurusan;
    });

    currentPage = 1;
    renderTable();
}

function handleSearch() {
    applyFilters();
}

// 4. Render Tabel Data (Pagination 50 items/page)
function renderTable() {
    const tbody = document.getElementById('tbodyRiwayatPendidikan');
    tbody.innerHTML = '';

    if (filteredPendidikanData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-secondary">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data riwayat pendidikan ditemukan.
                </td>
            </tr>`;
        renderPagination(0);
        document.getElementById('infoPagination').innerText = "Menampilkan 0 data";
        return;
    }

    // Hitung Slice untuk Pagination 50 data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredPendidikanData.length);
    const paginatedItems = filteredPendidikanData.slice(startIndex, endIndex);

    paginatedItems.forEach((item, index) => {
        const rowNo = startIndex + index + 1;
        const tglLulusFormatted = item.tanggal_lulus ? formatDate(item.tanggal_lulus) : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center fw-medium">${rowNo}</td>
            <td>
                <div class="fw-semibold text-primary-emphasis">${escapeHtml(item.nama || '-')}</div>
                <div class="small text-secondary"><i class="bi bi-card-text me-1"></i>${escapeHtml(item.nik || '-')}</div>
            </td>
            <td>
                <span class="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle mb-1 badge-jenjang">${escapeHtml(item.jenjang_pendidikan || '-')}</span>
                <div class="small fw-medium">${escapeHtml(item.asal_pendidikan || '-')}</div>
            </td>
            <td>
                <div>${escapeHtml(item.fakultas || '-')}</div>
                <div class="small text-secondary">${escapeHtml(item.jurusan || '-')}</div>
            </td>
            <td>
                <div>${escapeHtml(item.kepala_pendidikan || '-')}</div>
                <div class="small text-secondary"><i class="bi bi-calendar-check me-1"></i>${tglLulusFormatted}</div>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-info" title="Detail" onclick="openDetailModal('${item.id_riwayatpendidikan}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" title="Edit" onclick="openModalEdit('${item.id_riwayatpendidikan}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Hapus" onclick="deleteDataPendidikan('${item.id_riwayatpendidikan}', '${escapeHtml(item.nama)}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('infoPagination').innerText = `Menampilkan ${startIndex + 1} - ${endIndex} dari total ${filteredPendidikanData.length} data`;
    renderPagination(filteredPendidikanData.length);
}

// 5. Render Pagination Component
function renderPagination(totalItems) {
    const paginationList = document.getElementById('paginationList');
    paginationList.innerHTML = '';

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    // Tombol Previous
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

    // Tombol Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">&raquo;</a>`;
    paginationList.appendChild(nextLi);
}

function changePage(page) {
    const totalPages = Math.ceil(filteredPendidikanData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// 6. Modal Operations (Tambah / Edit / Save)
function openModalTambah() {
    document.getElementById('formRiwayatPendidikan').reset();
    document.getElementById('id_riwayatpendidikan').value = '';
    document.getElementById('modalFormTitle').innerHTML = `<i class="bi bi-mortarboard me-2"></i>Tambah Riwayat Pendidikan`;
    modalFormInstance.show();
}

function openModalEdit(id) {
    const item = rawPendidikanData.find(d => String(d.id_riwayatpendidikan) === String(id));
    if (!item) return;

    document.getElementById('id_riwayatpendidikan').value = item.id_riwayatpendidikan || '';
    document.getElementById('formNik').value = item.nik || '';
    document.getElementById('formNama').value = item.nama || '';
    document.getElementById('formJenjang').value = item.jenjang_pendidikan || '';
    document.getElementById('formAsalPendidikan').value = item.asal_pendidikan || '';
    document.getElementById('formFakultas').value = item.fakultas || '';
    document.getElementById('formJurusan').value = item.jurusan || '';
    document.getElementById('formKepalaPendidik').value = item.kepala_pendidikan || '';
    document.getElementById('formTanggalLulus').value = item.tanggal_lulus || '';

    document.getElementById('modalFormTitle').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Riwayat Pendidikan`;
    modalFormInstance.show();
}

async function saveDataPendidikan(e) {
    e.preventDefault();
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    const id = document.getElementById('id_riwayatpendidikan').value;
    const btnSave = document.getElementById('btnSave');

    const payload = {
        nik: document.getElementById('formNik').value.trim(),
        nama: document.getElementById('formNama').value.trim(),
        jenjang_pendidikan: document.getElementById('formJenjang').value,
        asal_pendidikan: document.getElementById('formAsalPendidikan').value.trim(),
        fakultas: document.getElementById('formFakultas').value.trim(),
        jurusan: document.getElementById('formJurusan').value.trim(),
        kepala_pendidikan: document.getElementById('formKepalaPendidik').value.trim(),
        tanggal_lulus: document.getElementById('formTanggalLulus').value || null
    };

    btnSave.disabled = true;
    btnSave.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...`;

    try {
        if (id) {
            // Update
            const { error } = await supabaseClient
                .from('riwayat_pendidikan')
                .update(payload)
                .eq('id_riwayatpendidikan', id);

            if (error) throw error;
        } else {
            // Create
            const { error } = await supabaseClient
                .from('riwayat_pendidikan')
                .insert([payload]);

            if (error) throw error;
        }

        modalFormInstance.hide();
        fetchRiwayatPendidikan();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `Simpan Data`;
    }
}

// 7. Modal Detail
function openDetailModal(id) {
    const item = rawPendidikanData.find(d => String(d.id_riwayatpendidikan) === String(id));
    if (!item) return;

    const detailBody = document.getElementById('detailBody');
    detailBody.innerHTML = `
        <table class="table table-sm table-borderless mb-0">
            <tr><th style="width: 40%;">NIK</th><td>: ${escapeHtml(item.nik || '-')}</td></tr>
            <tr><th>Nama</th><td>: ${escapeHtml(item.nama || '-')}</td></tr>
            <tr><th>Jenjang</th><td>: ${escapeHtml(item.jenjang_pendidikan || '-')}</td></tr>
            <tr><th>Asal Sekolah / Univ</th><td>: ${escapeHtml(item.asal_pendidikan || '-')}</td></tr>
            <tr><th>Fakultas</th><td>: ${escapeHtml(item.fakultas || '-')}</td></tr>
            <tr><th>Jurusan</th><td>: ${escapeHtml(item.jurusan || '-')}</td></tr>
            <tr><th>Kepala Pendidik / Rektor</th><td>: ${escapeHtml(item.kepala_pendidikan || '-')}</td></tr>
            <tr><th>Tanggal Lulus</th><td>: ${item.tanggal_lulus ? formatDate(item.tanggal_lulus) : '-'}</td></tr>
        </table>
    `;
    modalDetailInstance.show();
}

// 8. Hapus Data (Delete)
async function deleteDataPendidikan(id, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data riwayat pendidikan untuk ${nama}?`)) return;

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('riwayat_pendidikan')
            .delete()
            .eq('id_riwayatpendidikan', id);

        if (error) throw error;
        fetchRiwayatPendidikan();
    } catch (err) {
        alert("Gagal menghapus data: " + err.message);
    }
}

// 9. Export ke Excel
function exportToExcel() {
    if (filteredPendidikanData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const dataToExport = filteredPendidikanData.map((item, index) => ({
        "No": index + 1,
        "NIK": item.nik || '',
        "Nama Pegawai": item.nama || '',
        "Jenjang": item.jenjang_pendidikan || '',
        "Asal Sekolah / PT": item.asal_pendidikan || '',
        "Fakultas": item.fakultas || '',
        "Jurusan": item.jurusan || '',
        "Kepala Pendidik / Rektor": item.kepala_pendidikan || '',
        "Tanggal Lulus": item.tanggal_lulus || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Pendidikan");
    XLSX.writeFile(workbook, `Riwayat_Pendidikan_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 10. Export ke PDF
function exportToPDF() {
    if (filteredPendidikanData.length === 0) {
        alert("Tidak ada data untuk diexport!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    doc.setFontSize(14);
    doc.text("Laporan Data Riwayat Pendidikan - RSUD HAT", 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const tableHeaders = [["No", "Nama / NIK", "Jenjang / Asal Sekolah", "Fakultas / Jurusan", "Kepala Pendidik", "Tgl Lulus"]];
    const tableData = filteredPendidikanData.map((item, index) => [
        index + 1,
        `${item.nama || '-'}\nNIK: ${item.nik || '-'}`,
        `${item.jenjang_pendidikan || '-'}\n${item.asal_pendidikan || '-'}`,
        `Fakultas: ${item.fakultas || '-'}\nJurusan: ${item.jurusan || '-'}`,
        item.kepala_pendidikan || '-',
        item.tanggal_lulus ? formatDate(item.tanggal_lulus) : '-'
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Riwayat_Pendidikan_RSUD_HAT_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Helper Utilities
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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
