import React from 'react';
import { Transaction, BukuAmal } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, ArrowDownRight, ArrowUpRight, BookOpen, Database, RefreshCw, FileText } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  books: BukuAmal[];
  isSyncing: boolean;
  isAdmin: boolean;
  onSync: () => void;
}

export default function Dashboard({ transactions, books, isSyncing, isAdmin, onSync }: DashboardProps) {
  // Format Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // High-level Calculations
  const totalPemasukan = transactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const saldo = totalPemasukan - totalPengeluaran;

  // Chart Data: Cashflow Over Time (By Month)
  const getMonthlyTrendData = () => {
    const monthlyMap: Record<string, { month: string; pemasukan: number; pengeluaran: number }> = {};
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    sorted.forEach((t) => {
      if (!t.tanggal) return;
      const dateParts = t.tanggal.split('-');
      if (dateParts.length < 2) return;
      
      const yearMonth = `${dateParts[0]}-${dateParts[1]}`; // YYYY-MM
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIndex = parseInt(dateParts[1]) - 1;
      const displayLabel = `${monthNames[monthIndex] || dateParts[1]} ${dateParts[0].slice(-2)}`;

      if (!monthlyMap[yearMonth]) {
        monthlyMap[yearMonth] = {
          month: displayLabel,
          pemasukan: 0,
          pengeluaran: 0,
        };
      }

      if (t.tipe === 'pemasukan') {
        monthlyMap[yearMonth].pemasukan += t.jumlah;
      } else {
        monthlyMap[yearMonth].pengeluaran += t.jumlah;
      }
    });

    return Object.values(monthlyMap).slice(-6); // Last 6 active months
  };

  // Chart Data: Category Breakdown for Pie Chart
  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {};
    transactions.forEach((t) => {
      // Show breakdown for income transactions by default, or all
      const cat = t.kategori || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.jumlah;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);
  };

  const trendData = getMonthlyTrendData();
  const categoryData = getCategoryData();

  // Color Palette for Pie Chart
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  // Latest 5 Transactions
  const latestTransactions = [...transactions]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 5);

  const getBookName = (id: string) => {
    return books.find((b) => b.id === id)?.nama || 'Lainnya';
  };

  return (
    <div id="dashboard-container" className="space-y-6">
      
      {/* Google Sheets Sync Header */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md shadow-indigo-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 opacity-90 animate-pulse" />
              <h2 className="text-lg font-bold tracking-tight">Koneksi Database Google Sheets Aktif</h2>
            </div>
            <p className="text-indigo-100 text-xs leading-relaxed max-w-2xl">
              Sistem terhubung langsung ke Google Sheets ID: <span className="font-mono bg-indigo-700 px-2 py-0.5 rounded text-white text-[10px] select-all">18qpMAwqXjXf272wc-6oi-CIdqb9I5roiuhnZy-dawbA</span> dalam Mode Bypass. Seluruh data disimpan secara online tanpa menyimpan di browser lokal Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              id="sync-sheets-btn"
              onClick={onSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      )}

      {/* Grid: High Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Saldo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Saldo Kas Amal</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{formatIDR(saldo)}</span>
          </div>
        </div>

        {/* Metric: Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Penerimaan</span>
            <span className="text-xl font-extrabold text-emerald-700 tracking-tight block mt-0.5">{formatIDR(totalPemasukan)}</span>
          </div>
        </div>

        {/* Metric: Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Belanja/Keluar</span>
            <span className="text-xl font-extrabold text-rose-700 tracking-tight block mt-0.5">{formatIDR(totalPengeluaran)}</span>
          </div>
        </div>

        {/* Metric: Buku Amal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Buku Amal Aktif</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight block mt-0.5">{books.length} Buku</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Left) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Tren Arus Kas Bulanan</h3>
            <p className="text-xs text-slate-400">Menampilkan grafik penerimaan dan pengeluaran 6 bulan aktif terakhir.</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-12">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                Belum ada data transaksi bulanan yang terekam.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                  <YAxis tickFormatter={(val) => `Rp${val / 1000}k`} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                  <Tooltip formatter={(value) => formatIDR(value as number)} />
                  <Legend />
                  <Area type="monotone" name="Penerimaan" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPemasukan)" />
                  <Area type="monotone" name="Pengeluaran" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPengeluaran)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Pie Chart (Right) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Distribusi Kategori</h3>
            <p className="text-xs text-slate-400">Breakdown jumlah dana yang berputar berdasarkan kategori transaksi.</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-12">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                Tidak ada data kategori.
              </div>
            ) : (
              <>
                <div className="w-full h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatIDR(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full mt-2 overflow-y-auto max-h-[90px] text-[10px] space-y-1 scrollbar-thin">
                  {categoryData.slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-600 truncate font-semibold">{entry.name}</span>
                      </div>
                      <span className="text-slate-800 font-mono font-medium">{formatIDR(entry.value)}</span>
                    </div>
                  ))}
                  {categoryData.length > 4 && (
                    <div className="text-[9px] text-slate-400 text-center italic mt-1">
                      + {categoryData.length - 4} Kategori lainnya
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Aktivitas Transaksi Terbaru</h3>
            <p className="text-xs text-slate-400 font-medium">Menampilkan 5 mutasi pemasukan/pengeluaran paling akhir dimasukkan.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 text-xs font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-4 py-2.5">Tanggal</th>
                <th className="px-4 py-2.5">Buku Amal</th>
                <th className="px-4 py-2.5">Kategori</th>
                <th className="px-4 py-2.5">Keterangan</th>
                <th className="px-4 py-2.5 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
              {latestTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada transaksi terekam. Masuk ke halaman Transaksi untuk menambahkan.
                  </td>
                </tr>
              ) : (
                latestTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">{t.tanggal}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{getBookName(t.bukuAmalId)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[9px]">
                        {t.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{t.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-extrabold ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.tipe === 'pemasukan' ? '+' : '-'} {formatIDR(t.jumlah)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
