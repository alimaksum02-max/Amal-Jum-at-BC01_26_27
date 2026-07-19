import React, { useState, useEffect } from 'react';
import { Transaction, BukuAmal, TransactionType } from '../types';
import { X, Calendar, DollarSign, FileText, CheckCircle } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  books: BukuAmal[];
  editingTransaction: Transaction | null;
}

const CATEGORIES = [
  "Amal Jum'at",
  'Uang Takziyah',
  'Jenguk siswa',
  'BAZIS',
  'Amal Ramadhan',
  'Uang temuan',
  'Lainnya',
];

export default function TransactionForm({
  isOpen,
  onClose,
  onSave,
  books,
  editingTransaction,
}: TransactionFormProps) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [bukuAmalId, setBukuAmalId] = useState('');
  const [tipe, setTipe] = useState<TransactionType>('pemasukan');
  const [selectedCategory, setSelectedCategory] = useState("Amal Jum'at");
  const [customCategory, setCustomCategory] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setTanggal(editingTransaction.tanggal);
      setBukuAmalId(editingTransaction.bukuAmalId);
      setTipe(editingTransaction.tipe);
      setJumlah(editingTransaction.jumlah.toString());
      setKeterangan(editingTransaction.keterangan);

      if (CATEGORIES.includes(editingTransaction.kategori)) {
        setSelectedCategory(editingTransaction.kategori);
        setCustomCategory('');
      } else {
        setSelectedCategory('Lainnya');
        setCustomCategory(editingTransaction.kategori);
      }
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setBukuAmalId(books[0]?.id || '');
      setTipe('pemasukan');
      setSelectedCategory("Amal Jum'at");
      setCustomCategory('');
      setJumlah('');
      setKeterangan('');
    }
  }, [editingTransaction, books, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bukuAmalId) {
      setError('Silakan pilih Buku Amal terlebih dahulu.');
      return;
    }

    const finalCategory = selectedCategory === 'Lainnya' ? customCategory.trim() : selectedCategory;
    if (!finalCategory) {
      setError('Silakan isi kategori manual untuk pilihan Lainnya.');
      return;
    }

    const numericAmount = parseFloat(jumlah);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Jumlah uang harus angka positif.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        id: editingTransaction?.id,
        tanggal,
        bukuAmalId,
        tipe,
        kategori: finalCategory,
        jumlah: numericAmount,
        keterangan,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="transaction-form-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="transaction-form-card" className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden relative border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {editingTransaction ? 'Edit Transaksi Amal' : 'Catat Transaksi Amal Baru'}
          </h3>
          <button
            id="transaction-form-close"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* Type Selector (Pemasukan / Pengeluaran) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipe('pemasukan')}
                className={`py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  tipe === 'pemasukan'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${tipe === 'pemasukan' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setTipe('pengeluaran')}
                className={`py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  tipe === 'pengeluaran'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm shadow-red-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${tipe === 'pengeluaran' ? 'bg-red-500' : 'bg-slate-300'}`} />
                Pengeluaran
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-sm transition-all"
                />
              </div>
            </div>

            {/* Buku Amal Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Buku Amal</label>
              <select
                required
                value={bukuAmalId}
                onChange={(e) => setBukuAmalId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-sm transition-all"
              >
                <option value="" disabled>-- Pilih Buku Amal --</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>{book.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-sm transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Custom Category Input (If "Lainnya" selected) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {selectedCategory === 'Lainnya' ? 'Kategori Manual *' : 'Kategori Tambahan (Opsional)'}
              </label>
              <input
                type="text"
                disabled={selectedCategory !== 'Lainnya'}
                required={selectedCategory === 'Lainnya'}
                value={selectedCategory === 'Lainnya' ? customCategory : ''}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={selectedCategory === 'Lainnya' ? 'Ketik kategori manual...' : 'Terkunci (Pilih Lainnya)'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 text-sm transition-all"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Uang (Rupiah)</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-bold text-sm">Rp</span>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-sm transition-all font-mono"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Deskripsi</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Penerimaan Amal Jum'at dari siswa kelas 1A"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 text-sm transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl font-semibold text-sm transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center gap-1 transition-colors"
          >
            {isLoading ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Transaksi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
