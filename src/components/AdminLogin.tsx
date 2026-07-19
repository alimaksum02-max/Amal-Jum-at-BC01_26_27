import React, { useState } from 'react';
import { Lock, User, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function AdminLogin({ isOpen, onClose, onLoginSuccess, isAdmin, onLogout }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'admin123') {
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
        setUsername('');
        setPassword('');
        setSuccess(false);
        onClose();
      }, 1000);
    } else {
      setError('Username atau Password admin salah!');
    }
  };

  return (
    <div id="login-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div id="login-modal-card" className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-100">
        <button
          id="login-close-button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {isAdmin ? (
          <div id="login-admin-authenticated" className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Anda adalah Admin</h3>
            <p className="text-slate-500 text-sm mb-6">Anda sekarang memiliki izin untuk menambah, mengedit, dan menghapus transaksi serta mengelola buku amal.</p>
            <button
              id="admin-logout-button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors"
            >
              Keluar Sesi Admin
            </button>
          </div>
        ) : (
          <form id="login-form" onSubmit={handleSubmit} className="p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Login Admin Amal Jum'at</h3>
              <p className="text-slate-500 text-xs mt-1">Gunakan username: admin & password: admin123</p>
            </div>

            {error && (
              <div id="login-error-alert" className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm border border-red-100">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div id="login-success-alert" className="mb-4 p-3 bg-emerald-50 rounded-lg flex items-center gap-2 text-emerald-700 text-sm border border-emerald-100">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Login Berhasil! Mengalihkan...</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username Admin</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={success}
              className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-100 text-sm"
            >
              Masuk
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
