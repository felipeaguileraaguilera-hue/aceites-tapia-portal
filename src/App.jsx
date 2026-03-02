import { useState, useEffect } from 'react'
import { loginWithEmail, loginWithPhone, getPortalUser, logout, onAuthStateChange } from './lib/auth'

const APPS = {
  tarifas: {
    name: 'Calculadora de Tarifas',
    desc: 'Gestiona precios, costes de material y versiones de tarifa',
    url: 'https://calculadora-tarifa.vercel.app',
    icon: '🧮',
    color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  pedidos: {
    name: 'Portal de Pedidos',
    desc: 'Realiza pedidos, consulta historial y gestiona entregas',
    url: 'https://aceites-tapia-pedidos-cliente.vercel.app',
    icon: '🛒',
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    iconBg: 'bg-blue-500/15 text-blue-400',
  },
  repartidor: {
    name: 'Panel del Repartidor',
    desc: 'Gestiona clientes, pedidos, entregas y rondas de reparto',
    url: 'https://aceites-tapia-dealer.vercel.app',
    icon: '🚚',
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  combustible: {
    name: 'Control de Combustible',
    desc: 'Registra entradas, salidas y stock de gasoleo',
    url: 'https://combustible-v2.vercel.app',
    icon: '⛽',
    color: 'from-olive-500/20 to-olive-600/5 border-olive-500/30',
    iconBg: 'bg-olive-500/15 text-olive-400',
  },
  liquidaciones: {
    name: 'Liquidaciones',
    desc: 'Calcula liquidaciones a proveedores de aceituna',
    url: 'https://calculadora-liquidaciones.vercel.app',
    icon: '📊',
    color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    iconBg: 'bg-purple-500/15 text-purple-400',
  },
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      let user
      if (mode === 'email') {
        if (!email || !password) { setError('Completa todos los campos'); setLoading(false); return }
        user = await loginWithEmail(email, password)
      } else {
        if (!phone || phone.replace(/\s/g, '').length < 6) { setError('Telefono invalido'); setLoading(false); return }
        user = await loginWithPhone(phone)
      }
      if (!user || !user.apps || user.apps.length === 0) {
        setError('No tienes aplicaciones asignadas')
        setLoading(false)
        return
      }
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-olive-500/15 mb-5">
            <span className="text-3xl">🫒</span>
          </div>
          <div className="text-[11px] tracking-[4px] uppercase text-olive-500 font-semibold mb-2">
            Aceites Tapia
          </div>
          <h1 className="text-2xl font-extrabold text-gray-100 tracking-tight">
            Portal de Aplicaciones
          </h1>
          <p className="text-sm text-gray-500 mt-2">Villanueva de Tapia &middot; desde 1993</p>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-6 bg-surface rounded-xl p-1 border border-dark-border">
          <button
            onClick={() => { setMode('email'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'email'
                ? 'bg-olive-500/15 text-olive-400 border border-olive-500/30'
                : 'text-gray-500 border border-transparent'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setMode('phone'); setError('') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'phone'
                ? 'bg-olive-500/15 text-olive-400 border border-olive-500/30'
                : 'text-gray-500 border border-transparent'
            }`}
          >
            Telefono
          </button>
        </div>

        {/* Form */}
        <div className="bg-surface border border-dark-border rounded-2xl p-6">
          {mode === 'email' ? (
            <>
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-gray-100 text-sm outline-none focus:border-olive-500 transition-colors"
                />
              </div>
              <div className="mb-5">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Tu contrasena"
                  className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-gray-100 text-sm outline-none focus:border-olive-500 transition-colors"
                />
              </div>
            </>
          ) : (
            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Telefono</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="683 613 331"
                className="w-full px-4 py-3 bg-dark border border-dark-border rounded-xl text-gray-100 text-sm font-mono tracking-wider outline-none focus:border-olive-500 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-2">Para personal interno (operarios, repartidores)</p>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-olive-500 hover:bg-olive-400 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : 'Acceder'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const apps = (user.apps || []).filter((v, i, a) => a.indexOf(v) === i) // deduplicate
  const isAdmin = user.client?.role === 'admin' || user.staff?.role === 'admin'

  return (
    <div className="min-h-screen bg-dark text-gray-100">
      {/* Header */}
      <header className="border-b border-dark-border px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-500/15 flex items-center justify-center">
              <span className="text-xl">🫒</span>
            </div>
            <div>
              <div className="text-xs tracking-[3px] uppercase text-olive-500 font-semibold">
                Aceites Tapia
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {user.display_name} {isAdmin && <span className="text-olive-400">&middot; Admin</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-300 text-sm font-medium bg-surface border border-dark-border px-4 py-2 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Apps grid */}
      <main className="max-w-2xl mx-auto px-5 py-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">Tus aplicaciones</h2>
        <p className="text-sm text-gray-500 mb-6">
          {apps.length} app{apps.length !== 1 ? 's' : ''} disponible{apps.length !== 1 ? 's' : ''}
        </p>

        <div className="grid gap-3 stagger-children">
          {apps.map(appId => {
            const app = APPS[appId]
            if (!app) return null
            return (
              <a
                key={appId}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block bg-gradient-to-br ${app.color} border rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-lg animate-slide-up`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${app.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-gray-100 mb-1">{app.name}</div>
                    <div className="text-sm text-gray-400 leading-relaxed">{app.desc}</div>
                  </div>
                  <div className="text-gray-600 flex-shrink-0 mt-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17l9.2-9.2M17 17V7H7"/>
                    </svg>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-600">
          Villanueva de Tapia, Malaga &middot; desde 1993
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortalUser()
      .then(u => setUser(u))
      .catch(() => {
        logout().catch(() => {})
      })
      .finally(() => setLoading(false))

    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = (u) => setUser(u)

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-olive-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (!user) return <LoginPage onLogin={handleLogin} />
  return <Dashboard user={user} onLogout={handleLogout} />
}
