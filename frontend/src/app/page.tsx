// frontend/src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Eye, Brain, TrendingUp, Users, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: Eye,
      title: 'Detección Facial',
      description: 'Tecnología avanzada de Computer Vision con MediaPipe para monitoreo preciso',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Brain,
      title: 'Machine Learning',
      description: 'Algoritmos inteligentes que aprenden y mejoran la precisión con el tiempo',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Análisis en Tiempo Real',
      description: 'Métricas instantáneas de atención y engagement de estudiantes',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'Para Profesores',
      description: 'Dashboard completo para monitorear toda tu clase simultáneamente',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Zap,
      title: 'Para Estudiantes',
      description: 'Feedback personal para mejorar tu concentración y aprendizaje',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Shield,
      title: 'Privacidad',
      description: 'Tus datos están seguros. Solo se procesan métricas, no se graban videos',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const stats = [
    { value: '95%', label: 'Precisión' },
    { value: '<100ms', label: 'Latencia' },
    { value: '24/7', label: 'Disponibilidad' },
    { value: '100%', label: 'Seguro' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Class Guard</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Sistema de Monitoreo Inteligente
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Revoluciona la
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Educación Virtual
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Sistema avanzado de monitoreo de atención para clases virtuales. 
            Utiliza Computer Vision y Machine Learning para mejorar el aprendizaje.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-blue-500/50 text-lg"
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-lg"
            >
              Ver Características
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tecnología de punta para transformar la experiencia educativa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:scale-105 cursor-pointer"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Proceso simple y automatizado en 3 pasos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Detecta</h3>
              <p className="text-gray-400">
                La cámara detecta tu rostro usando MediaPipe con 468 puntos faciales
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analiza</h3>
              <p className="text-gray-400">
                Algoritmos de ML calculan tu nivel de atención en tiempo real
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Reporta</h3>
              <p className="text-gray-400">
                Genera insights y alertas para mejorar la experiencia educativa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 rounded-3xl">
            <div className="bg-slate-900 rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Comienza Hoy Mismo
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Únete a cientos de educadores que ya están mejorando sus clases virtuales
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-10 py-5 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all text-lg shadow-2xl"
              >
                Crear Cuenta Gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Class Guard</span>
            </div>
            <p className="text-gray-400 text-center">
              © 2025 Class Guard System. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Términos
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}