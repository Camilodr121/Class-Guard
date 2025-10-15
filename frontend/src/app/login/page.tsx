// frontend/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Brain, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
        }

      if (isLogin) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        const userResponse = await fetch('http://localhost:8000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const userData = await userResponse.json();
        
        if (userData.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
      } else {
        setIsLogin(true);
        setError('¡Registro exitoso! Por favor inicia sesión.');
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'student'
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mb-6 shadow-2xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-3">
              Class Guard
            </h1>
            <p className="text-gray-300 text-lg font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Monitoreo inteligente de atención
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl backdrop-blur-sm">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${
                  isLogin
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Registrarse
              </button>
            </div>

            {/* Error/Success message */}
            {error && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-semibold ${
                error.includes('exitoso') 
                  ? 'bg-green-500/20 border border-green-400/50 text-green-300'
                  : 'bg-red-500/20 border border-red-400/50 text-red-300'
              }`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-200 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required={!isLogin}
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all duration-300"
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-200 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        required={!isLogin}
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all duration-300"
                        placeholder="Pérez"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-2">
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:border-blue-400 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 outline-none transition-all duration-300 cursor-pointer"
                    >
                      <option value="student" className="bg-slate-800">Estudiante</option>
                      <option value="teacher" className="bg-slate-800">Profesor</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:bg-white/20 focus:ring-2 focus:ring-purple-400/50 outline-none transition-all duration-300"
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-400 focus:bg-white/20 focus:ring-2 focus:ring-pink-400/50 outline-none transition-all duration-300 pr-12"
                    placeholder="••••••••"
                    minLength={8}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-purple-500/50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300 text-sm">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="ml-2 text-blue-400 hover:text-blue-300 font-bold transition-colors"
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Sistema de monitoreo en tiempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}