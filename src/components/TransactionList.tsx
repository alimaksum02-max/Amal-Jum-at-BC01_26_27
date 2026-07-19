import React, { useState } from 'react';
import { Transaction, BukuAmal } from '../types';
import { Search, Filter, Plus, Edit2, Trash2, Printer, ArrowDownRight, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  books: BukuAmal[];
  isAdmin: boolean;
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDeleteClick: (id: string) => Promise<void>;
  onPrintClick: (filteredTransactions: Transaction[]) => void;
}

export default function TransactionList({
  transactions,
  books,
  isAdmin,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onPrintClick,
}: TransactionListProps) {
  // Local Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState('semua');
  const [selectedType, setSelectedType] = useState('semua');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get unique categories list from actual transactions for filter list
  const categoriesList = Array.from(new Set(transactions.map((t) => t.kategori))).filter(Boolean);

  // Filter Logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBook = selectedBook === 'semua' || t.bukuAmalId === selectedBook;
    const matchesType = selectedType === 'semua' || t.tipe === selectedType;
    const matchesCategory = selectedCategory === 'semua' || t.kategori === selectedCategory;

    const matchesStartDate = !startDate || t.tanggal >= startDate;
    const matchesEndDate = !endDate || t.tanggal <= endDate;

    return (
      matchesSearch &&
      matchesBook &&
      matchesType &&
      matchesCategory &&
      matchesStartDate &&
      matchesEndDate
    );
  }).sort((a, b) => b.tanggal.localeCompare(a.tanggal)); // Newest first

  // Format Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getBookName = (id: string) => {
    return books.find((b) => b.id === id)?.nama || 'Lainnya';
  };

  // Confirmation state for deleting a transaction
  const [deletingTx, setDeletingTx] = useState<{ id: string; detail: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string, detail: string) => {
    setDeletingTx({ id, detail });
  };

  const confirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      await onDeleteClick(deletingTx.id);
      setDeletingTx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBook('semua');
    setSelectedType('semua');
    setSelectedCategory('semua');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div id="transaction-list-container" className="space-y-4">
      {/* Search and Filters Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Daftar Transaksi Amal</h2>
          
          <div className="flex gap-2 shrink-0">
            {/* Print Filtered Button */}
            <button
              id="print-filtered-btn"
              onClick={() => onPrintClick(filteredTransactions)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
              title="Cetak list transaksi sesuai filter saat ini"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Cetak Filtered
            </button>

            {/* Add Transaction Button (Admin only) */}
            {isAdmin && (
              <button
                id="add-transaction-btn"
                onClick={onAddClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Catat Transaksi
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search text */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari keterangan/kategori..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-xs transition-all"
            />
          </div>

          {/* Book filter */}
          <div>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-xs transition-all"
            >
              <option value="semua">Semua Buku Amal</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>{book.nama}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-xs transition-all"
            >
              <option value="semua">Semua Tipe</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-xs transition-all"
            >
              <option value="semua">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors text-center"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-slate-50 pt-3 text-xs text-slate-500">
          <span className="font-semibold shrink-0">Rentang Tanggal:</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <span className="sm:ml-auto text-slate-400">
            Menampilkan <span className="text-indigo-600 font-bold font-mono">{filteredTransactions.length}</span> dari {transactions.length} transaksi
          </span>
        </div>
      </div>

      {/* Transactions Table/List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-5 py-3.5 text-center w-12">No</th>
                <th className="px-5 py-3.5 w-28">Tanggal</th>
                <th className="px-5 py-3.5 w-44">Buku Amal</th>
                <th className="px-5 py-3.5 w-36">Kategori</th>
                <th className="px-5 py-3.5">Keterangan</th>
                <th className="px-5 py-3.5 text-right w-36">Jumlah</th>
                {isAdmin && <th className="px-5 py-3.5 text-right w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold">Tidak Ada Transaksi Cocok</p>
                      <p className="text-slate-400 text-[11px]">Coba sesuaikan kata pencarian atau atur ulang opsi filter Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{t.tanggal}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{getBookName(t.bukuAmalId)}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                        {t.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-normal max-w-sm break-words">
                      {t.keterangan || <span className="italic text-slate-300">Tanpa keterangan</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.tipe === 'pemasukan' ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                        <span className={`font-mono font-extrabold text-sm ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.tipe === 'pemasukan' ? '+' : '-'} {formatIDR(t.jumlah).replace('Rp', '')}
                        </span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`edit-trans-btn-${t.id}`}
                            onClick={() => onEditClick(t)}
                            className="p-1 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-slate-100"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-trans-btn-${t.id}`}
                            onClick={() => handleDelete(t.id, t.keterangan || t.kategori)}
                            className="p-1 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-slate-100"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Hapus Transaksi?</h3>
            </div>
            
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan transaksi berikut? Tindakan ini tidak dapat dibatalkan.
              <span className="block bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 text-slate-800 font-semibold italic text-xs">
                "{deletingTx.detail}"
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-100 flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
