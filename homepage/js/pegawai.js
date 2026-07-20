// State Navigasi & Paginasi
let currentPage = 1;
let limitPerPage = 50; // Default 50 data per query
let searchKeyword = '';
let searchDebounceTimer;

/**
 * Mengambil data pegawai dari Supabase dengan range limit
 */
async function loadPegawaiData(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('tablePegawaiBody');
    const paginationInfo = document.getElementById('paginationInfo');

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-12 text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-2xl text-indigo-600 mb-2"></i>
                <p class="text-sm">Memuat data pegawai...</p>
            </td>
        </tr>`;

    try {
        let query = window.db.from('pegawai').select('*', { count: 'exact' });

        // Filter Pencarian
        if (searchKeyword) {
            query = query.or(`nama.ilike.%${searchKeyword}%,nik.ilike.%${searchKeyword}%,nip.ilike.%${searchKeyword}%,jabatan.ilike.%${searchKeyword}%`);
        }

        // Terapkan Limit / Paginasi
        if (limitPerPage !== 'all') {
            const numLimit = parseInt(limitPerPage);
            const from = (page - 1) * numLimit;
            const to = from + numLimit - 1;
            query = query.range(from, to);
        }

        const { data, count, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-10 text-slate-400">
                        <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
                        <p>Data pegawai tidak ditemukan.</p>
                    </td>
                </tr>`;
            paginationInfo.innerText = "Menampilkan 0 data";
            renderPaginationControls(0, page);
            return;
        }

        const startNo = limitPerPage === 'all' ? 1 : ((page - 1) * parseInt(limitPerPage)) + 1;

        // Render Data ke Kolom Tabel yang Ditentukan
        tbody.innerHTML = data.map((p, index) => {
            const fotoUrl = p.upload_foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=4f46e5&color=fff`;

            return `
                <tr class="hover:bg-indigo-50/30 transition border-b border-slate-100">
                    <td class="p-4 text-center font-semibold text-slate-500 text-xs">${startNo + index}</td>
                    
                    <td class="p-4">
                        <span class="font-bold text-slate-800">${p.nik || '-'}</span>
                        <br>
                        <span class="text-xs font-medium text-slate-500">NIP: ${p.nip || '-'}</span>
                    </td>

                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <img src="${fotoUrl}" alt="${p.nama}" class="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0">
                            <div>
                                <h4 class="font-bold text-slate-800">${p.nama || '-'}</h4>
                                <span class="text-xs text-indigo-600 font-medium"><i class="fa-solid fa-hospital-user mr-1"></i>${p.ruangan || 'Ruangan -'}</span>
                            </div>
                        </div>
                    </td>

                    <td class="p-4">
                        <span class="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200">
                            Gol: ${p.golongan || '-'}
                        </span>
                        <div class="font-medium text-slate-700 text-xs mt-1">${p.jabatan || '-'}</div>
                    </td>

                    <td class="p-4">
                        <span class="font-medium text-slate-700 text-xs">${p.kelompok_pegawai || '-'}</span>
                        <br>
                        <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status_pegawai === 'PNS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">
                            ${p.status_pegawai || 'Aktif'}
                        </span>
                    </td>

                    <td class="p-4">
                        <span class="font-medium text-slate-800 text-xs">${p.jenjang_pendidikan || '-'} ${p.jurusan ? '(' + p.jurusan + ')' : ''}</span>
                        <br>
                        <span class="text-xs text-slate-500">Masa Kerja: ${p.masa_kerja || '-'}</span>
                    </td>

                    <td class="p-4 text-center">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="viewPegawai('${p.nik}')" title="Lihat Detail Data" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button onclick="editPegawai('${p.nik}')" title="Edit Data" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="deletePegawai('${p.nik}')" title="Hapus Data" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const totalCount = count || data.length;
        if (limitPerPage === 'all') {
            paginationInfo.innerText = `Menampilkan seluruh ${totalCount} data pegawai`;
        } else {
            const endNo = Math.min(startNo + data.length - 1, totalCount);
            paginationInfo.innerText = `Menampilkan ${startNo} - ${endNo} dari ${totalCount} data pegawai`;
        }

        renderPaginationControls(totalCount, page);

    } catch (err) {
        console.error("Gagal memuat data pegawai:", err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-red-500">
                    <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                    <p>Terjadi kesalahan saat mengambil data pegawai.</p>
                </td>
            </tr>`;
    }
}

/**
 * Aksi View / Detail Pegawai
 */
async function viewPegawai(nik) {
    const modal = document.getElementById('modalViewPegawai');
    const content = document.getElementById('modalViewContent');

    content.innerHTML = `<p class="text-center py-4 text-slate-400"><i class="fa-solid fa-spinner fa-spin"></i> Memuat detail data...</p>`;
    modal.classList.remove('hidden');

    const { data, error } = await window.db.from('pegawai').select('*').eq('nik', nik).single();

    if (error || !data) {
        content.innerHTML = `<p class="text-red-500 text-center py-4">Gagal memuat detail data pegawai.</p>`;
        return;
    }

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>NIK:</strong> ${data.nik}</div>
            <div><strong>NIP:</strong> ${data.nip || '-'}</div>
            <div><strong>Nama Lengkap:</strong> ${data.nama}</div>
            <div><strong>Tempat, Tgl Lahir:</strong> ${data.tempat_lahir || '-'}, ${data.tanggal_lahir || '-'}</div>
            <div><strong>Jenis Kelamin:</strong> ${data.jenis_kelamin || '-'}</div>
            <div><strong>Agama:</strong> ${data.agama || '-'}</div>
            <div><strong>Ruangan:</strong> ${data.ruangan || '-'}</div>
            <div><strong>Jabatan:</strong> ${data.jabatan || '-'}</div>
            <div><strong>Golongan / TMT:</strong> ${data.golongan || '-'} / ${data.tmt_pangkat || '-'}</div>
            <div><strong>Pendidikan:</strong> ${data.jenjang_pendidikan || '-'} ${data.jurusan || ''}</div>
            <div><strong>Email / Telp:</strong> ${data.email || '-'} / ${data.no_telp || '-'}</div>
            <div><strong>Alamat:</strong> ${data.alamat || '-'}</div>
        </div>
    `;
}

function closeModalView() {
    document.getElementById('modalViewPegawai').classList.add('hidden');
}

/**
 * Paginasi & Search Handlers
 */
function renderPaginationControls(totalData, currentPage) {
    const container = document.getElementById('paginationControls');
    if (limitPerPage === 'all' || totalData === 0) {
        container.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalData / parseInt(limitPerPage));
    let html = `
        <button onclick="loadPegawaiData(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="text-xs font-medium text-slate-600 px-2">Hal ${currentPage} dari ${totalPages}</span>
        <button onclick="loadPegawaiData(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;
    container.innerHTML = html;
}

function handleSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchKeyword = document.getElementById('searchPegawai').value.trim();
        loadPegawaiData(1);
    }, 400);
}

function changeLimit() {
    limitPerPage = document.getElementById('limitPerPage').value;
    loadPegawaiData(1);
}

function refreshData() {
    document.getElementById('searchPegawai').value = '';
    searchKeyword = '';
    loadPegawaiData(1);
}

// Inisialisasi Pemuatan Data
loadPegawaiData(1);
