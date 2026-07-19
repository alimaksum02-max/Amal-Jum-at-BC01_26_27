import React, { useState } from 'react';
import { BukuAmal } from '../types';
import { Plus, Edit2, Trash2, X, Check, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';

interface BukuAmalManagerProps {
  books: BukuAmal[];
  onAddBook: (nama: string) => Promise<void>;
  onEditBook: (id: string, nama: string) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  transactionCountByBook: Record<string, number>;
}

export default function BukuAmalManager({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
  transactionCountByBook,
}: BukuAmalManagerProps) {
  const [newBookName, setNewBookName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      await onAddBook(newBookName.trim());
      setNewBookName('');
    } catch (err) {
      setError('Gagal menambahkan buku amal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (book: BukuAmal) => {
    setEditingId(book.id);
    setEditingName(book.nama);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await onEditBook(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError('Gagal memperbarui nama buku amal.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation state for deleting a book
  const [deletingBook, setDeletingBook] = useState<{ id: string; name: string; count: number } | null>(null);

  const handleDelete = (id: string, name: string) => {
    const count = transactionCountByBook[id] || 0;
    setDeletingBook({ id, name, count });
  };

  const confirmDeleteBook = async () => {
    if (!deletingBook) return;
    setIsLoading(true);
    setError('');
    try {
      await onDeleteBook(deletingBook.id);
      setDeletingBook(null);
    } catch (err) {
      setError('Gagal menghapus buku amal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="buku-amal-manager" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 max-w-3xl mx-auto">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Kelola Buku Amal Jum'at
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Buku amal digunakan untuk membagi pencatatan amal berdasarkan kelompok (contoh: Buku Amal Kelas 1, Buku Amal Kelas 2A, dll).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Add New Book Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          id="new-book-input"
          type="text"
          required
          disabled={isLoading}
          value={newBookName}
          onChange={(e) => setNewBookName(e.target.value)}
          placeholder="Tambah Buku Amal baru (contoh: Buku Amal Kelas 3)"
          className="grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
        />
        <button
          id="add-book-submit-btn"
          type="submit"
          disabled={isLoading || !newBookName.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold text-sm transition-colors shrink-0 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </form>

      {/* Book List */}
      <div className="overflow-hidden border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100 uppercase tracking-wider">
              <th className="px-5 py-3">Nama Buku Amal</th>
              <th className="px-5 py-3 text-center">Jumlah Transaksi</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {books.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                  Belum ada buku amal terdaftar. Silakan tambahkan buku di atas.
                </td>
              </tr>
            ) : (
              books.map((book) => {
                const isEditing = editingId === book.id;
                const count = transactionCountByBook[book.id] || 0;

                return (
                  <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {isEditing ? (
                        <input
                          id={`edit-book-input-${book.id}`}
                          type="text"
                          required
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                        />
                      ) : (
                        <span>{book.nama}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-500">
                      {count} transaksi
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              id={`save-edit-book-${book.id}`}
                              onClick={() => handleSaveEdit(book.id)}
                              disabled={isLoading || !editingName.trim()}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              id={`cancel-edit-book-${book.id}`}
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                              className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              id={`start-edit-book-${book.id}`}
                              onClick={() => handleStartEdit(book)}
                              className="p-1.5 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                              title="Edit Nama"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-book-${book.id}`}
                              onClick={() => handleDelete(book.id, book.nama)}
                              className="p-1.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Hapus Buku"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 font-sans">Hapus Buku Amal?</h3>
            </div>
            
            <div className="text-slate-600 text-sm mb-5 leading-relaxed space-y-3">
              <p>
                Apakah Anda yakin ingin menghapus buku amal <span className="font-bold text-slate-900">"{deletingBook.name}"</span>?
              </p>
              {deletingBook.count > 0 ? (
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Peringatan Penting:</span>
                    Buku ini memiliki <span className="font-bold">{deletingBook.count} transaksi</span> terikat. Menghapus buku ini akan memutuskan hubungan semua transaksi tersebut (transaksi akan menjadi yatim/terlepas).
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">
                  Tindakan ini tidak dapat dibatalkan dan buku amal ini akan dihapus secara permanen dari daftar.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                disabled={isLoading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteBook}
                disabled={isLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-100 flex items-center gap-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Buku</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
