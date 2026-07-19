import React from 'react';
import { Transaction, BukuAmal, SchoolSettings } from '../types';
import { Printer, X, Download } from 'lucide-react';

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

  // Calculations
  const totalPemasukan = transactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const saldo = totalPemasukan - totalPengeluaran;

  const handlePrint = () => {
    window.print();
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
    <div id="print-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div id="print-modal-card" className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden relative border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header (Hidden during Print) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 no-print">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pratinjau Cetak Cetakan Formal</h3>
            <p className="text-xs text-slate-500">Sesuaikan printer Anda. Layout telah dioptimalkan untuk ukuran kertas A4 / F4.</p>
          </div>
          <div className="flex gap-2">
            <button
              id="print-trigger-btn"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-100"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
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

        {/* Printable Paper Area */}
        <div id="printable-document" className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-slate-900 font-sans leading-relaxed">
          
          {/* Printable styles injected directly for local printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-document, #printable-document * {
                visibility: visible;
              }
              #printable-document {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
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
              <p className="mb-1">Kota/Kab, {getFormattedDateIndonesian()}</p>
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
