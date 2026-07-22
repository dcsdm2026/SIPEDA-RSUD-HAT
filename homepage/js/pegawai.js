// Memastikan variabel supabaseClient terdefinisi dari window global
const supabaseClient = window.supabaseClient || window.db || (window.parent && (window.parent.supabaseClient || window.parent.db));

// Cek jika client belum tersedia
if (!supabaseClient) {
    console.error("❌ Supabase Client belum siap/tidak ditemukan. Periksa koneksi.js!");
}
// Global State
let currentPage = 1;
const pageSize = 50; // 50 data per halaman
let totalData = 0;
let currentPegawaiList = [];
let modalPegawaiInstance = null;

// Inisialisasi saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
  // Samakan tema dari localStorage
  const savedTheme = localStorage.getItem('sipeda_theme') || 'dark';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);

  // Inisialisasi Modal Bootstrap
  const modalEl = document.getElementById('modalPegawaiForm');
  if (modalEl) {
    modalPegawaiInstance = new bootstrap.Modal(modalEl);
    
    // Refresh tabel saat modal ditutup
    modalEl.addEventListener('hidden.bs.modal', () => {
      document.getElementById('iframePegawaiForm').src = 'about:blank';
      loadSummaryStats();
      loadPegawaiData();
    });
  }

  // Load Data Awal
  loadSummaryStats();
  loadPegawaiData();

  // Event Listener Live Search (Debounce)
  let timer;
  document.getElementById('filterSearch').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      currentPage = 1;
      loadPegawaiData();
    }, 400);
  });

  // Event Listener Dropdown Filter
  document.getElementById('filterStatus').addEventListener('change', () => { currentPage = 1; loadPegawaiData(); });
  document.getElementById('filterKelompok').addEventListener('change', () => { currentPage = 1; loadPegawaiData(); });
  document.getElementById('filterJabatan').addEventListener('change', () => { currentPage = 1; loadPegawaiData(); });
  document.getElementById('filterJK').addEventListener('change', () => { currentPage = 1; loadPegawaiData(); });
});

/**
 * 1. MENGAMBIL HITUNGAN RINGKASAN BOX ANGKA (SUMMARY STATS)
 */
async function loadSummaryStats() {
  try {
    const { data, error } = await supabaseClient
      .from('pegawai')
      .select('status_pegawai');

    if (error) throw error;

    let total = data.length;
    let aktif = 0;
    let mutasi = 0;
    let pensiun = 0;
    let resign = 0;

    data.forEach(item => {
      const st = (item.status_pegawai || '').toLowerCase();
      if (st === 'aktif') aktif++;
      else if (st === 'mutasi') mutasi++;
      else if (st === 'pensiun') pensiun++;
      else if (st === 'resign' || st === 'keluar') resign++;
    });

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statAktif').innerText = aktif;
    document.getElementById('statMutasi').innerText = mutasi;
    document.getElementById('statPensiun').innerText = pensiun;
    document.getElementById('statResign').innerText = resign;

  } catch (err) {
    console.error('Gagal memuat statistik summary:', err.message);
  }
}

/**
 * 2. MEMUAT DATA TABEL PEGAWAI (50 DATA/HALAMAN, DENGAN ORDER ABJAD NAMA ASC)
 */
async function loadPegawaiData() {
  const tbody = document.getElementById('tablePegawaiBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        Memuat data pegawai...
      </td>
    </tr>
  `;

  try {
    const searchVal = document.getElementById('filterSearch').value.trim();
    const statusVal = document.getElementById('filterStatus').value;
    const kelompokVal = document.getElementById('filterKelompok').value;
    const jabatanVal = document.getElementById('filterJabatan').value;
    const jkVal = document.getElementById('filterJK').value;

    let query = supabaseClient
      .from('pegawai')
      .select('*', { count: 'exact' });

    // Filter Pencarian
    if (searchVal !== '') {
      query = query.or(`nama.ilike.%${searchVal}%,nik.ilike.%${searchVal}%,nip.ilike.%${searchVal}%`);
    }

    // Filter Dropdown
    if (statusVal) query = query.eq('status_pegawai', statusVal);
    if (kelompokVal) query = query.eq('kelompok_pegawai', kelompokVal);
    if (jabatanVal) query = query.eq('jabatan', jabatanVal);
    if (jkVal) query = query.eq('jenis_kelamin', jkVal);

    // Diurutkan berdasarkan abjad NAMA (ASC) & Paginasi 50
    const fromIndex = (currentPage - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    query = query.order('nama', { ascending: true })
                 .range(fromIndex, toIndex);

    const { data, count, error } = await query;

    if (error) throw error;

    totalData = count || 0;
    currentPegawaiList = data || [];

    renderTable(currentPegawaiList, fromIndex);
    renderPaginationInfo(fromIndex, toIndex, totalData);
    renderPaginationButtons(totalData);

  } catch (err) {
    console.error('Error loadPegawaiData:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle-fill me-2"></i> Gagal memuat data: ${err.message}
        </td>
      </tr>
    `;
  }
}

/**
 * 3. RENDER TABEL STACKED 2 BARIS PER ENTRI
 */
function renderTable(data, startIndex) {
  const tbody = document.getElementById('tablePegawaiBody');

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          Data pegawai tidak ditemukan.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  data.forEach((p, index) => {
    const no = startIndex + index + 1;
    const nik = p.nik || '-';
    const nip = p.nip || '-';
    const nama = p.nama || 'Tanpa Nama';
    const ruangan = p.ruangan || '-';
    const pangkat = p.golongan || '-';
    const jabatan = p.jabatan || '-';
    const tanggalMasuk = p.tanggal_masuk ? formatDate(p.tanggal_masuk) : '-';
    const masaKerja = p.masa_kerja || hitungMasaKerja(p.tanggal_masuk);
    const jk = p.jenis_kelamin || '-';
    const agama = p.agama || '-';

    html += `
      <tr>
        <td class="text-center fw-bold text-muted">${no}</td>
        
        <td>
          <div class="stacked-text-primary">${nik}</div>
          <div class="stacked-text-secondary"><i class="bi bi-card-heading me-1"></i>NIP: ${nip}</div>
        </td>

        <td>
          <div class="stacked-text-primary">${nama}</div>
          <div class="stacked-text-secondary"><i class="bi bi-hospital me-1"></i>${ruangan}</div>
        </td>

        <td>
          <div class="stacked-text-primary">${pangkat}</div>
          <div class="stacked-text-secondary"><i class="bi bi-briefcase me-1"></i>${jabatan}</div>
        </td>

        <td>
          <div class="stacked-text-primary">${tanggalMasuk}</div>
          <div class="stacked-text-secondary"><i class="bi bi-clock-history me-1"></i>${masaKerja}</div>
        </td>

        <td>
          <div class="stacked-text-primary">${jk}</div>
          <div class="stacked-text-secondary"><i class="bi bi-person me-1"></i>${agama}</div>
        </td>

        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-info" title="Detail" onclick="viewDetail('${nik}')">
              <i class="bi bi-eye-fill"></i>
            </button>
            <button class="btn btn-outline-warning" title="Edit" onclick="editPegawai('${nik}')">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger" title="Hapus" onclick="deletePegawai('${nik}', '${nama}')">
              <i class="bi bi-trash-fill"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * 4. KONTROL MODAL TAMBAH / EDIT PEGAWAI
 */
function bukaModalTambahPegawai() {
  const iframe = document.getElementById('iframePegawaiForm');
  document.getElementById('modalPegawaiLabel').innerHTML = `<i class="bi bi-person-plus-fill me-2"></i>Tambah Pegawai Baru`;
  
  // Panggil file homepage/html/tambah_pegawai.html ke dalam iframe modal
  iframe.src = 'tambah_pegawai.html';
  if (modalPegawaiInstance) modalPegawaiInstance.show();
}

function editPegawai(nik) {
  const iframe = document.getElementById('iframePegawaiForm');
  document.getElementById('modalPegawaiLabel').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Data Pegawai (${nik})`;
  
  iframe.src = `tambah_pegawai.html?nik=${encodeURIComponent(nik)}`;
  if (modalPegawaiInstance) modalPegawaiInstance.show();
}

function viewDetail(nik) {
  const iframe = document.getElementById('iframePegawaiForm');
  document.getElementById('modalPegawaiLabel').innerHTML = `<i class="bi bi-eye-fill me-2"></i>Detail Data Pegawai (${nik})`;
  
  iframe.src = `tambah_pegawai.html?nik=${encodeURIComponent(nik)}&mode=detail`;
  if (modalPegawaiInstance) modalPegawaiInstance.show();
}

/**
 * 5. KONTROL PAGINASI
 */
function renderPaginationInfo(from, to, total) {
  const displayTo = Math.min(to + 1, total);
  const displayFrom = total === 0 ? 0 : from + 1;
  document.getElementById('paginationInfo').innerText = `Menampilkan ${displayFrom} - ${displayTo} dari ${total} data`;
}

function renderPaginationButtons(total) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginationList = document.getElementById('paginationList');
  let html = '';

  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="changePage(${currentPage - 1})">Prev</button>
    </li>
  `;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <button class="page-link" onclick="changePage(${i})">${i}</button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
    </li>
  `;

  paginationList.innerHTML = html;
}

function changePage(page) {
  if (page < 1) return;
  currentPage = page;
  loadPegawaiData();
}

function resetFilters() {
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterKelompok').value = '';
  document.getElementById('filterJabatan').value = '';
  document.getElementById('filterJK').value = '';
  currentPage = 1;
  loadPegawaiData();
}

/**
 * 6. EKSPOR EXCEL & PDF
 */
function exportExcel() {
  if (currentPegawaiList.length === 0) {
    alert('Tidak ada data pegawai untuk diekspor!');
    return;
  }

  const dataExport = currentPegawaiList.map((p, i) => ({
    "NO": i + 1,
    "NIK": p.nik || '',
    "NIP": p.nip || '',
    "NAMA LENGKAP": p.nama || '',
    "RUANGAN": p.ruangan || '',
    "PANGKAT/GOLONGAN": p.golongan || '',
    "JABATAN": p.jabatan || '',
    "KELOMPOK TENAGA": p.kelompok_pegawai || '',
    "STATUS PEGAWAI": p.status_pegawai || '',
    "TANGGAL MASUK": p.tanggal_masuk || '',
    "JENIS KELAMIN": p.jenis_kelamin || '',
    "AGAMA": p.agama || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");
  XLSX.writeFile(workbook, "Master_Data_Pegawai_RSUD_HAT.xlsx");
}

function exportPDF() {
  if (currentPegawaiList.length === 0) {
    alert('Tidak ada data pegawai untuk diekspor!');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  doc.text("MASTER DATA PEGAWAI - RSUD H. AMRI TAMBUNAN", 14, 15);

  const tableColumn = ["NO", "NIK / NIP", "NAMA / RUANGAN", "PANGKAT / JABATAN", "MASUK RS", "JK / AGAMA", "STATUS"];
  const tableRows = [];

  currentPegawaiList.forEach((p, i) => {
    tableRows.push([
      i + 1,
      `${p.nik || '-'}\nNIP: ${p.nip || '-'}`,
      `${p.nama || '-'}\n${p.ruangan || '-'}`,
      `${p.golongan || '-'}\n${p.jabatan || '-'}`,
      p.tanggal_masuk || '-',
      `${p.jenis_kelamin || '-'}\n${p.agama || '-'}`,
      p.status_pegawai || '-'
    ]);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  doc.save("Master_Data_Pegawai_RSUD_HAT.pdf");
}

/**
 * 7. UTILITY HELPER & HAPUS DATA
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function hitungMasaKerja(tglMasuk) {
  if (!tglMasuk) return '-';
  const masuk = new Date(tglMasuk);
  const skrg = new Date();
  let thn = skrg.getFullYear() - masuk.getFullYear();
  let bln = skrg.getMonth() - masuk.getMonth();

  if (bln < 0) {
    thn--;
    bln += 12;
  }
  return `${thn} Thn ${bln} Bln`;
}

async function deletePegawai(nik, nama) {
  if (confirm(`Apakah Anda yakin ingin menghapus pegawai ${nama} (NIK: ${nik})?`)) {
    try {
      const { error } = await supabaseClient
        .from('pegawai')
        .delete()
        .eq('nik', nik);

      if (error) throw error;

      alert(`Pegawai ${nama} berhasil dihapus.`);
      loadSummaryStats();
      loadPegawaiData();
    } catch (err) {
      alert(`Gagal menghapus data: ${err.message}`);
    }
  }
}
