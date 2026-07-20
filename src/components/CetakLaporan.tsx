import React from 'react';
import { Transaction, BukuAmal, SchoolSettings } from '../types';
import { X, Download } from 'lucide-react';

interface CetakLaporanProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  books: BukuAmal[];
  settings: SchoolSettings;
  title?: string;
}

export default function CetakLaporan({
  isOpen,
  onClose,
  transactions,
  books,
  settings,
  title = "LAPORAN KEUANGAN AMAL JUM'AT",
}: CetakLaporanProps) {
  if (!isOpen) return null;

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Resolve Buku Amal Name
  const getBookName = (id: string) => {
    return books.find((b) => b.id === id)?.nama || 'Lainnya';
  };

  // Extract City from Address or separate field helper
  const getCityFromSettings = () => {
    if (settings.kotaSekolah && settings.kotaSekolah.trim()) {
      return settings.kotaSekolah.trim();
    }
    
    // Fallback: Try to extract "Kota X" or "Kabupaten Y" from alamatSekolah
    if (settings.alamatSekolah) {
      const match = settings.alamatSekolah.match(/(Kota\s+[A-Za-z0-9\s]+|Kabupaten\s+[A-Za-z0-9\s]+|Kab\.\s+[A-Za-z0-9\s]+)/i);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Kota/Kab';
  };

  // Calculations
  const totalPemasukan = transactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const saldo = totalPemasukan - totalPengeluaran;

  // Direct Standalone Download to bypass Iframe print blocking / blank screen
  const handleDownloadHTML = () => {
    const rowsHtml = transactions.map((t, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: center; font-family: monospace;">${t.tanggal}</td>
        <td style="border: 1px solid #94a3b8; padding: 8px;">${getBookName(t.bukuAmalId)}</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; font-weight: 600; color: #1e293b;">${t.kategori}</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; color: #475569;">${t.keterangan || '-'}</td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: right; font-family: monospace; color: #065f46; font-weight: 600;">
          ${t.tipe === 'pemasukan' ? formatIDR(t.jumlah).replace('Rp', '') : ''}
        </td>
        <td style="border: 1px solid #94a3b8; padding: 8px; text-align: right; font-family: monospace; color: #991b1b; font-weight: 600;">
          ${t.tipe === 'pengeluaran' ? formatIDR(t.jumlah).replace('Rp', '') : ''}
        </td>
      </tr>
    `).join('');

    const emptyRowHtml = transactions.length === 0 ? `
      <tr>
        <td colspan="7" style="border: 1px solid #94a3b8; padding: 32px; text-align: center; color: #94a3b8;">
          Tidak ada transaksi dalam periode ini.
        </td>
      </tr>
    ` : '';

    const kopHeaderHtml = settings.kopSekolah ? `
      <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 16px;">
        <img src="${settings.kopSekolah}" alt="Kop Surat Sekolah" style="max-height: 110px; object-fit: contain;" />
      </div>
    ` : `
      <div style="display: flex; align-items: center; justify-content: center; gap: 24px; padding-bottom: 16px; border-bottom: 4px double #000000; margin-bottom: 24px;">
        ${settings.logoSekolah ? `<img src="${settings.logoSekolah}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
        <div style="text-align: center;">
          <h1 style="font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #000000; margin: 0;">PEMERINTAH KABUPATEN / KOTA</h1>
          <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; color: #1e1b4b; line-height: 1.25; margin: 4px 0 0 0;">${settings.namaSekolah || 'NAMA SEKOLAH ANDA'}</h2>
          <p style="font-size: 12px; color: #475569; font-style: italic; font-weight: 500; margin: 4px 0 0 0;">${settings.alamatSekolah || ''}</p>
        </div>
      </div>
    `;

    const city = getCityFromSettings();

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body {
        background: white !important;
        color: black !important;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen p-4 sm:p-8">

  <!-- Helper Floating Instruction for Browser Tab -->
  <div class="max-w-4xl mx-auto mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between no-print shadow-sm">
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <p class="font-bold text-sm">Dokumen Laporan Siap Cetak / Simpan PDF</p>
        <p class="text-xs text-emerald-700">Tekan tombol <span class="font-semibold text-emerald-800">Cetak Sekarang</span> di sebelah kanan atau gunakan pintasan <kbd class="px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 rounded text-[10px] font-mono font-bold">Ctrl + P</kbd> untuk mencetak / menyimpan berkas formal ini.</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button onclick="window.print()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
        Cetak Sekarang
      </button>
    </div>
  </div>

  <!-- Printable Document Sheet -->
  <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md border border-gray-200 rounded-2xl">
    ${kopHeaderHtml}

    <!-- Document Title -->
    <div class="text-center mb-6 mt-4">
      <h3 class="text-lg font-bold text-black uppercase underline tracking-wider">${title}</h3>
      <p class="text-xs text-gray-600 font-medium mt-1">Tanggal Cetak: ${getFormattedDateIndonesian()}</p>
    </div>

    <!-- Transaction Metadata -->
    <div class="grid grid-cols-2 text-xs text-gray-700 mb-4 font-mono">
      <div>
        <p>Jumlah Transaksi : ${transactions.length} baris data</p>
      </div>
      <div class="text-right">
        <p>Mata Uang : IDR (Rupiah)</p>
      </div>
    </div>

    <!-- Transaction Table -->
    <table class="w-full text-xs text-black border-collapse border border-gray-400 mb-6">
      <thead>
        <tr class="bg-gray-100 text-gray-800 font-bold border-b border-gray-400">
          <th class="border border-gray-400 px-3 py-2.5 text-center w-8">No</th>
          <th class="border border-gray-400 px-3 py-2.5 text-center w-24">Tanggal</th>
          <th class="border border-gray-400 px-3 py-2.5 text-left">Buku Amal / Kelompok</th>
          <th class="border border-gray-400 px-3 py-2.5 text-left">Kategori</th>
          <th class="border border-gray-400 px-3 py-2.5 text-left">Keterangan</th>
          <th class="border border-gray-400 px-3 py-2.5 text-right w-28">Pemasukan (Rp)</th>
          <th class="border border-gray-400 px-3 py-2.5 text-right w-28">Pengeluaran (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${emptyRowHtml}
        ${rowsHtml}

        <!-- Total Recap Row -->
        <tr class="bg-gray-50 font-bold">
          <td colspan="5" class="border border-gray-400 px-3 py-2.5 text-right uppercase tracking-wider text-xs">Total Halaman Ini</td>
          <td class="border border-gray-400 px-2 py-2.5 text-right font-mono text-emerald-800 text-xs">
            ${formatIDR(totalPemasukan).replace('Rp', '')}
          </td>
          <td class="border border-gray-400 px-2 py-2.5 text-right font-mono text-red-800 text-xs">
            ${formatIDR(totalPengeluaran).replace('Rp', '')}
          </td>
        </tr>

        <!-- Final Balance Row -->
        <tr class="bg-blue-50 font-bold text-gray-900">
          <td colspan="5" class="border border-gray-400 px-3 py-3 text-right uppercase tracking-wider text-xs">Saldo Akhir Terhitung</td>
          <td colspan="2" class="border border-gray-400 px-4 py-3 text-right font-mono text-sm text-blue-900">
            ${formatIDR(saldo)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Footer Signature Section -->
    <div class="mt-12 grid grid-cols-2 text-xs text-gray-900">
      <div>
        <p class="mb-1">Mengetahui,</p>
        <p class="font-semibold mb-16">Bendahara Amal Jum'at</p>
        <p class="font-bold underline">............................................</p>
        <p class="text-gray-500">NIP. ........................................</p>
      </div>
      <div class="text-right">
        <p class="mb-1">${city}, ${getFormattedDateIndonesian()}</p>
        <p class="font-semibold mb-16">Kepala Sekolah</p>
        <p class="font-bold underline uppercase">${settings.kepalaSekolah || 'NAMA KEPALA SEKOLAH'}</p>
        <p class="text-gray-700">NIP. ${settings.nipKepalaSekolah || 'NIP KEPALA SEKOLAH'}</p>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    // Create a Blob and trigger a file download
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    const link = document.createElement('a');
    
    if ((navigator as any).msSaveBlob) { // IE 10+
      (navigator as any).msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Current Date in Indonesian
  const getFormattedDateIndonesian = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div id="print-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="print-modal-card" className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden relative border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header (Hidden during Print) */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 no-print">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pratinjau & Unduh Berkas Cetak</h3>
            <p className="text-xs text-slate-500">Unduh dokumen formal ini ke komputer Anda untuk dicetak atau disimpan sebagai PDF dengan rapi.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="download-html-trigger-btn"
              onClick={handleDownloadHTML}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-100"
              title="Unduh file siap cetak (.html) untuk menghindari pratinjau blank di dalam browser iframe"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas Cetak</span>
            </button>
            <button
              id="print-close-btn"
              onClick={onClose}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Informative Help Banner inside preview modal */}
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 no-print flex items-start gap-2 leading-relaxed">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-bold">Panduan Unduh:</span> Klik tombol hijau <strong>Unduh Berkas Cetak</strong> di atas. Setelah terunduh, buka berkas tersebut di komputer Anda. Layar cetak akan otomatis terbuka secara instan dan rapi, siap untuk dicetak fisik atau disimpan langsung sebagai file <strong>PDF</strong> tanpa blank!
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-document" className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-slate-900 font-sans leading-relaxed">
          
          {/* Printable styles injected directly for local printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide all non-printable layouts */
              .no-print, header, main, nav, aside, footer {
                display: none !important;
              }

              /* Reset base pages */
              html, body, #root, #root > div {
                background: white !important;
                color: black !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Position overlay to print completely */
              #print-modal-overlay {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                display: block !important;
                background: white !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                margin: 0 !important;
                z-index: 9999 !important;
              }

              /* Expand modal card to full screen on page */
              #print-modal-card {
                position: static !important;
                display: block !important;
                width: 100% !important;
                max-width: none !important;
                max-height: none !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: black !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Render the main printable document fully */
              #printable-document {
                display: block !important;
                overflow: visible !important;
                padding: 24px !important;
                margin: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
              }
            }
          `}} />

          {/* School Kop (KOP SEKOLAH) */}
          <div className="border-b-4 border-double border-slate-800 pb-4 mb-6">
            {settings.kopSekolah ? (
              // If customized graphical KOP exists
              <div className="w-full h-auto flex justify-center mb-1">
                <img src={settings.kopSekolah} alt="Kop Surat Sekolah" referrerPolicy="no-referrer" className="max-h-24 object-contain" />
              </div>
            ) : (
              // Default text-based elegant KOP
              <div className="flex items-center gap-6">
                {settings.logoSekolah && (
                  <div className="w-20 h-20 shrink-0">
                    <img src={settings.logoSekolah} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="text-center grow">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 leading-tight">
                    PEMERINTAH KABUPATEN / KOTA
                  </h1>
                  <h2 className="text-2xl font-black uppercase text-indigo-900 leading-tight">
                    {settings.namaSekolah || 'NAMA SEKOLAH ANDA'}
                  </h2>
                  <p className="text-xs text-slate-600 italic font-medium mt-1">
                    {settings.alamatSekolah || 'Alamat sekolah lengkap belum diatur. Silakan atur di menu Pengaturan.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-950 uppercase underline tracking-wider">{title}</h3>
            <p className="text-xs text-slate-600 font-medium mt-1">Tanggal Cetak: {getFormattedDateIndonesian()}</p>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 text-xs text-slate-700 mb-4 font-mono">
            <div>
              <p>Jumlah Transaksi : {transactions.length} baris data</p>
            </div>
            <div className="text-right">
              <p>Mata Uang : IDR (Rupiah)</p>
            </div>
          </div>

          {/* Transaction Table */}
          <table className="w-full text-xs text-slate-900 border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 px-3 py-2 text-center w-8">No</th>
                <th className="border border-slate-300 px-3 py-2 text-center w-24">Tanggal</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Buku Amal / Kelompok</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Kategori</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Keterangan</th>
                <th className="border border-slate-300 px-3 py-2 text-right w-28">Pemasukan (Rp)</th>
                <th className="border border-slate-300 px-3 py-2 text-right w-28">Pengeluaran (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 px-4 py-8 text-center text-slate-400">
                    Tidak ada transaksi dalam periode ini.
                  </td>
                </tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 px-2 py-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-mono">{t.tanggal}</td>
                    <td className="border border-slate-300 px-2 py-2">{getBookName(t.bukuAmalId)}</td>
                    <td className="border border-slate-300 px-2 py-2 font-medium">{t.kategori}</td>
                    <td className="border border-slate-300 px-2 py-2 text-slate-600">{t.keterangan || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right font-mono font-medium text-emerald-800">
                      {t.tipe === 'pemasukan' ? formatIDR(t.jumlah).replace('Rp', '') : ''}
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-right font-mono font-medium text-red-800">
                      {t.tipe === 'pengeluaran' ? formatIDR(t.jumlah).replace('Rp', '') : ''}
                    </td>
                  </tr>
                ))
              )}

              {/* Total Recap Row */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={5} className="border border-slate-300 px-3 py-2.5 text-right uppercase tracking-wider text-xs">Total Halaman Ini</td>
                <td className="border border-slate-300 px-2 py-2.5 text-right font-mono text-emerald-800 text-xs">
                  {formatIDR(totalPemasukan).replace('Rp', '')}
                </td>
                <td className="border border-slate-300 px-2 py-2.5 text-right font-mono text-red-800 text-xs">
                  {formatIDR(totalPengeluaran).replace('Rp', '')}
                </td>
              </tr>

              {/* Final Balance Row */}
              <tr className="bg-indigo-50/50 font-bold text-indigo-950">
                <td colSpan={5} className="border border-slate-300 px-3 py-3 text-right uppercase tracking-wider text-xs">Saldo Akhir Terhitung</td>
                <td colSpan={2} className="border border-slate-300 px-4 py-3 text-right font-mono text-sm text-indigo-900">
                  {formatIDR(saldo)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Signature Section (Standard Indonesian School Format) */}
          <div className="mt-12 grid grid-cols-2 text-xs text-slate-800">
            <div>
              {/* Left Column can be left blank or used for Treasurer */}
              <p className="mb-1">Mengetahui,</p>
              <p className="font-semibold mb-16">Bendahara Amal Jum'at</p>
              <p className="font-bold underline">............................................</p>
              <p className="text-slate-500">NIP. ........................................</p>
            </div>
            <div className="text-right">
              <p className="mb-1">{getCityFromSettings()}, {getFormattedDateIndonesian()}</p>
              <p className="font-semibold mb-16">Kepala Sekolah</p>
              <p className="font-bold underline uppercase">{settings.kepalaSekolah || 'NAMA KEPALA SEKOLAH'}</p>
              <p className="text-slate-700">NIP. {settings.nipKepalaSekolah || 'NIP KEPALA SEKOLAH'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
