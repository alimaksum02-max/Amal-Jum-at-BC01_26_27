import React, { useState } from 'react';
import { Transaction, BukuAmal, SchoolSettings } from '../types';
import { Calendar, FileText, ArrowUpRight, ArrowDownRight, Wallet, Printer, BarChart2 } from 'lucide-react';

interface LaporanBulananProps {
  transactions: Transaction[];
  books: BukuAmal[];
  settings: SchoolSettings;
  onPrintClick: (filteredTransactions: Transaction[], reportTitle: string) => void;
}

export default function LaporanBulanan({
  transactions,
  books,
  settings,
  onPrintClick,
}: LaporanBulananProps) {
  // Default to current month and year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0')); // "01"-"12"
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const monthsList = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearsList = Array.from(new Set([
    String(now.getFullYear()),
    String(now.getFullYear() - 1),
    String(now.getFullYear() - 2),
    ...transactions.map((t) => t.tanggal.split('-')[0])
  ].filter(Boolean))).sort().reverse();

  const targetPeriod = `${selectedYear}-${selectedMonth}`; // "YYYY-MM"

  // 1. Calculate Starting Balance (Saldo Awal)
  // Sum of all transactions before the first day of target month
  const saldoAwal = transactions
    .filter((t) => {
      const transPeriod = t.tanggal.slice(0, 7); // "YYYY-MM"
      return transPeriod < targetPeriod;
    })
    .reduce((sum, t) => {
      return sum + (t.tipe === 'pemasukan' ? t.jumlah : -t.jumlah);
    }, 0);

  // 2. Filter Transactions of Selected Month
  const monthlyTransactions = transactions.filter((t) => {
    return t.tanggal.startsWith(targetPeriod);
  }).sort((a, b) => a.tanggal.localeCompare(b.tanggal)); // Oldest to newest for report flow

  // 3. Monthly Metrics
  const pemasukanBulanan = monthlyTransactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const pengeluaranBulanan = monthlyTransactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const netCashFlow = pemasukanBulanan - pengeluaranBulanan;
  const saldoAkhir = saldoAwal + netCashFlow;

  // 4. Category Breakdowns for selected month
  const getCategoryBreakdown = () => {
    const map: Record<string, { pemasukan: number; pengeluaran: number }> = {};
    monthlyTransactions.forEach((t) => {
      if (!map[t.kategori]) {
        map[t.kategori] = { pemasukan: 0, pengeluaran: 0 };
      }
      if (t.tipe === 'pemasukan') {
        map[t.kategori].pemasukan += t.jumlah;
      } else {
        map[t.kategori].pengeluaran += t.jumlah;
      }
    });
    return Object.entries(map).map(([kategori, val]) => ({
      kategori,
      ...val,
    }));
  };

  const categoryBreakdown = getCategoryBreakdown();

  // Format Currency Helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handlePrintReport = () => {
    const monthLabel = monthsList.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const reportTitle = `LAPORAN BULANAN AMAL JUM'AT - PERIODE ${monthLabel.toUpperCase()} ${selectedYear}`;
    
    // We should pre-pend a mock Transaction representing Saldo Awal, or just print the list
    // To represent balance sheet properly, we pass the transactions
    onPrintClick(monthlyTransactions, reportTitle);
  };

  const getBookName = (id: string) => {
    return books.find((b) => b.id === id)?.nama || 'Lainnya';
  };

  const currentMonthLabel = monthsList.find((m) => m.value === selectedMonth)?.label || '';

  return (
    <div id="laporan-bulanan-container" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Period Selector Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan Bulanan Otomatis</h2>
          <p className="text-xs text-slate-400 font-medium">Pilih periode bulan dan tahun untuk menyusun rekapitulasi pembukuan.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs font-semibold"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs font-semibold"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Print Button */}
          <button
            id="print-monthly-report-btn"
            onClick={handlePrintReport}
            disabled={monthlyTransactions.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Bulanan
          </button>
        </div>
      </div>

      {/* Recapitulation Balance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo Awal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Awal Bulan</span>
          <span className="text-lg font-extrabold text-slate-700 tracking-tight block mt-1">{formatIDR(saldoAwal)}</span>
          <span className="text-[10px] text-slate-400 block mt-2">Akumulasi kas sebelum {currentMonthLabel} {selectedYear}</span>
        </div>

        {/* Arus Kas Net */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Arus Kas Bersih (Netto)</span>
          <span className={`text-lg font-extrabold tracking-tight block mt-1 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netCashFlow >= 0 ? '+' : ''} {formatIDR(netCashFlow)}
          </span>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
            <span className="text-emerald-600 font-bold font-mono">+{formatIDR(pemasukanBulanan).replace('Rp', '')} masuk</span>
            <span className="text-red-500 font-bold font-mono">-{formatIDR(pengeluaranBulanan).replace('Rp', '')} keluar</span>
          </div>
        </div>

        {/* Saldo Akhir */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50/50 rounded-2xl p-5 border border-indigo-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Saldo Akhir Bulan</span>
          <span className="text-lg font-black text-indigo-950 tracking-tight block mt-1">{formatIDR(saldoAkhir)}</span>
          <span className="text-[10px] text-indigo-600 font-medium block mt-2">Sisa kas per akhir {currentMonthLabel} {selectedYear}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* List of Monthly Mutasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Arus Transaksi Periode Ini</h3>
            <p className="text-[11px] text-slate-400">Daftar mutasi keuangan khusus selama bulan {currentMonthLabel}.</p>
          </div>

          <div className="overflow-y-auto max-h-[350px] space-y-2 pr-1 scrollbar-thin">
            {monthlyTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                Tidak ada riwayat transaksi pada bulan ini.
              </div>
            ) : (
              monthlyTransactions.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50/60 rounded-xl flex items-center justify-between border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{t.tanggal}</span>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">
                      {getBookName(t.bukuAmalId)} - <span className="text-indigo-600">{t.kategori}</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">{t.keterangan || '-'}</p>
                  </div>
                  <span className={`font-mono font-bold text-xs ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipe === 'pemasukan' ? '+' : '-'} {formatIDR(t.jumlah).replace('Rp', '')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category breakdown summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Rekap per Kategori</h3>
            <p className="text-[11px] text-slate-400">Akumulasi pengeluaran dan pemasukan berdasarkan jenis alokasi dana.</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 mt-2 scrollbar-thin">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <BarChart2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                Tidak ada data rekap kategori.
              </div>
            ) : (
              categoryBreakdown.map((c) => {
                const total = c.pemasukan + c.pengeluaran;
                return (
                  <div key={c.kategori} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">{c.kategori}</span>
                      <span className="font-mono font-semibold text-slate-500">{formatIDR(total)}</span>
                    </div>
                    {/* Visual progress bar split */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {c.pemasukan > 0 && (
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(c.pemasukan / total) * 100}%` }}
                          title={`Pemasukan: ${formatIDR(c.pemasukan)}`}
                        />
                      )}
                      {c.pengeluaran > 0 && (
                        <div
                          className="h-full bg-red-400"
                          style={{ width: `${(c.pengeluaran / total) * 100}%` }}
                          title={`Pengeluaran: ${formatIDR(c.pengeluaran)}`}
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                      <span className="text-emerald-600 font-mono">Masuk: {formatIDR(c.pemasukan).replace('Rp', '')}</span>
                      <span className="text-red-500 font-mono">Keluar: {formatIDR(c.pengeluaran).replace('Rp', '')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl flex items-center gap-2 border border-indigo-100 text-[11px] text-indigo-950 mt-4 leading-normal">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Semua laporan bulanan disusun otomatis secara real-time bersumber dari sinkronisasi Google Sheets Anda.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
