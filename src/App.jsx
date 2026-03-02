import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

// ═══════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════

async function loginWithEmail(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

async function loginWithPhone(phone) {
  const cleaned = phone.replace(/\s/g, '')
  const { data: staff } = await supabase
    .from('staff').select('*')
    .eq('phone', cleaned).eq('is_active', true).maybeSingle()
  if (!staff) throw new Error('Telefono no registrado')
  const fakeEmail = `staff-${cleaned}@aceitestapia.com`
  if (staff.auth_user_id) {
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: cleaned })
    if (error) throw new Error('Error de acceso')
  } else {
    const { data, error } = await supabase.auth.signUp({ email: fakeEmail, password: cleaned })
    if (error) throw new Error('Error al crear acceso')
    await supabase.from('staff').update({ auth_user_id: data.user.id }).eq('id', staff.id)
  }
}

// ═══════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════

const COLORS = {
  amber:   { card: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent', icon: 'bg-amber-500/15 text-amber-400' },
  blue:    { card: 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent', icon: 'bg-blue-500/15 text-blue-400' },
  emerald: { card: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent', icon: 'bg-emerald-500/15 text-emerald-400' },
  olive:   { card: 'border-green-600/30 bg-gradient-to-br from-green-600/10 to-transparent', icon: 'bg-green-600/15 text-green-400' },
  purple:  { card: 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent', icon: 'bg-purple-500/15 text-purple-400' },
  gray:    { card: 'border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-transparent', icon: 'bg-gray-500/15 text-gray-400' },
  red:     { card: 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent', icon: 'bg-red-500/15 text-red-400' },
  cyan:    { card: 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent', icon: 'bg-cyan-500/15 text-cyan-400' },
}
function gc(c) { return COLORS[c] || COLORS.gray }

async function getAppUrl(baseUrl) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return baseUrl
  return `${baseUrl}#access_token=${session.access_token}&refresh_token=${session.refresh_token}`
}

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════

function Spinner() {
  return <svg className="animate-spin h-5 w-5 mx-auto text-green-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
}

function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">{label}</label>
      <input type={type || 'text'} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm outline-none focus:border-green-600 transition-colors" />
    </div>
  )
}

function AppCard({ app, isLoggedIn, onNavigate }) {
  const c = gc(app.color)
  const handleClick = async (e) => {
    if (!isLoggedIn || app.is_public) return
    e.preventDefault()
    if (onNavigate) onNavigate(app)
  }
  return (
    <a href={app.url} target="_blank" rel="noopener noreferrer" onClick={handleClick}
      className={`block border rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-lg ${c.card}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${c.icon}`}>{app.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-gray-100 mb-1">{app.name}</div>
          <div className="text-sm text-gray-400 leading-relaxed">{app.description}</div>
          {app.is_public && <span className="inline-block mt-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">Acceso libre</span>}
        </div>
        <div className="text-gray-600 flex-shrink-0 mt-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
        </div>
      </div>
    </a>
  )
}

// ═══════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════

function LoginPage({ onSuccess, publicApps }) {
  const [mode, setMode] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'email') {
        if (!email || !password) { setError('Completa todos los campos'); return }
        await loginWithEmail(email, password)
      } else {
        if (!phone || phone.replace(/\s/g, '').length < 6) { setError('Telefono invalido'); return }
        await loginWithPhone(phone)
      }
      onSuccess()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0f1114] text-gray-100">
      <div className="border-b border-[#2a2f38] px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center"><span className="text-xl">🫒</span></div>
          <div><div className="text-[11px] tracking-[3px] uppercase text-green-500 font-semibold">Aceites Tapia</div><div className="text-xs text-gray-500 mt-0.5">Portal de Aplicaciones</div></div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-8">
        {publicApps.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-1">Aplicaciones publicas</h2>
            <p className="text-sm text-gray-500 mb-4">Disponibles sin necesidad de cuenta</p>
            <div className="grid gap-3">{publicApps.map(a => <AppCard key={a.id} app={a} isLoggedIn={false} />)}</div>
          </div>
        )}
        <div className="max-w-sm mx-auto">
          <h2 className="text-lg font-bold text-center mb-1">Acceso empleados</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Inicia sesion para ver tus aplicaciones</p>
          <div className="flex mb-5 bg-[#171a1f] rounded-xl p-1 border border-[#2a2f38]">
            {[['email','Email'],['phone','Telefono']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError('')}} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode===m?'bg-green-600/15 text-green-400 border border-green-600/30':'text-gray-500 border border-transparent'}`}>{l}</button>
            ))}
          </div>
          <div className="bg-[#171a1f] border border-[#2a2f38] rounded-2xl p-6">
            {mode==='email'?(
              <>
                <div className="mb-4"><label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="tu@email.com" className="w-full px-4 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm outline-none focus:border-green-600" /></div>
                <div className="mb-5"><label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Tu contrasena" className="w-full px-4 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm outline-none focus:border-green-600" /></div>
              </>
            ):(
              <div className="mb-5"><label className="block text-xs text-gray-400 mb-1.5 font-medium">Telefono</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="683 613 331" className="w-full px-4 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm font-mono tracking-wider outline-none focus:border-green-600" /><p className="text-xs text-gray-600 mt-2">Para personal interno</p></div>
            )}
            {error&&<div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
            <button onClick={submit} disabled={loading} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50">{loading?<Spinner/>:'Acceder'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════

function AdminPanel() {
  const [apps, setApps] = useState([])
  const [users, setUsers] = useState({ clients: [], staff: [] })
  const [perms, setPerms] = useState([])
  const [editApp, setEditApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('apps')

  const load = useCallback(async () => {
    setLoading(true)
    const [a, c, s, p] = await Promise.all([
      supabase.from('portal_apps').select('*').order('sort_order'),
      supabase.from('clients').select('id,name,email,role,is_active').eq('is_active', true).order('name'),
      supabase.from('staff').select('id,name,phone,role,is_active').eq('is_active', true).order('name'),
      supabase.from('portal_permissions').select('*'),
    ])
    setApps(a.data||[]); setUsers({clients:c.data||[],staff:s.data||[]}); setPerms(p.data||[]); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const togglePerm = async (appId, userId, authTable) => {
    const ex = perms.find(p => p.app_id===appId && p.user_id===userId && p.auth_table===authTable)
    if (ex) await supabase.from('portal_permissions').delete().eq('id', ex.id)
    else await supabase.from('portal_permissions').insert({ app_id: appId, user_id: userId, auth_table: authTable })
    load()
  }

  const saveApp = async (app) => {
    if (app.id) {
      await supabase.from('portal_apps').update({ name:app.name, description:app.description, url:app.url, icon:app.icon, color:app.color, is_public:app.is_public, is_active:app.is_active, sort_order:app.sort_order, requires_auth_system:app.requires_auth_system, updated_at:new Date().toISOString() }).eq('id', app.id)
    } else {
      await supabase.from('portal_apps').insert({ slug:app.slug, name:app.name, description:app.description, url:app.url, icon:app.icon, color:app.color, is_public:app.is_public, sort_order:app.sort_order, requires_auth_system:app.requires_auth_system })
    }
    setEditApp(null); load()
  }

  if (loading) return <div className="py-20 text-center"><Spinner /></div>

  const privApps = apps.filter(a => !a.is_public)

  const PermTable = ({ title, userList, authTable }) => (
    userList.length > 0 && (
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">{title}</h4>
        <div className="overflow-x-auto rounded-xl border border-[#2a2f38]">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#171a1f]">
              <th className="text-left px-4 py-3 font-medium text-gray-400 sticky left-0 bg-[#171a1f] z-10">Usuario</th>
              {privApps.map(a => <th key={a.id} className="px-3 py-3 text-center font-medium text-gray-400 whitespace-nowrap">{a.icon}</th>)}
            </tr></thead>
            <tbody>{userList.map(u => (
              <tr key={u.id} className="border-t border-[#2a2f38]/50">
                <td className="px-4 py-3 sticky left-0 bg-[#0f1114] z-10"><div className="font-medium text-sm">{u.name}</div><div className="text-xs text-gray-500">{u.role}</div></td>
                {privApps.map(a => {
                  const isAdm = u.role==='admin'
                  const has = isAdm || perms.some(p=>p.app_id===a.id&&p.user_id===u.id&&p.auth_table===authTable)
                  return <td key={a.id} className="px-3 py-3 text-center">{isAdm
                    ? <span className="text-green-500 text-lg">✓</span>
                    : <button onClick={()=>togglePerm(a.id,u.id,authTable)} className={`w-8 h-8 rounded-lg border transition-all ${has?'bg-green-600/20 border-green-600/50 text-green-400':'bg-[#171a1f] border-[#2a2f38] text-gray-600 hover:border-gray-500'}`}>{has?'✓':''}</button>
                  }</td>
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    )
  )

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {[['apps','Aplicaciones'],['permissions','Permisos']].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${tab===id?'bg-green-600/15 border-green-600/30 text-green-400':'bg-[#171a1f] border-[#2a2f38] text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {tab==='apps' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Aplicaciones ({apps.length})</h3>
            <button onClick={()=>setEditApp({slug:'',name:'',description:'',url:'',icon:'📱',color:'gray',is_public:false,is_active:true,sort_order:apps.length,requires_auth_system:'clients'})} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-500">+ Nueva app</button>
          </div>
          <div className="space-y-2">{apps.map(a=>{
            const c=gc(a.color)
            return <div key={a.id} className={`border rounded-xl p-4 flex items-center gap-4 ${a.is_active?c.card:'border-gray-700/30 opacity-50'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${c.icon}`}>{a.icon}</div>
              <div className="flex-1 min-w-0"><div className="font-bold text-sm">{a.name}</div><div className="text-xs text-gray-500 truncate">{a.url}</div></div>
              <div className="flex gap-2 items-center">
                {a.is_public&&<span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">Publica</span>}
                {!a.is_active&&<span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Inactiva</span>}
                <button onClick={()=>setEditApp({...a})} className="text-gray-500 hover:text-gray-300 p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              </div>
            </div>
          })}</div>
        </div>
      )}

      {tab==='permissions' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Permisos por usuario</h3>
          <PermTable title="Clientes / Admins" userList={users.clients} authTable="clients" />
          <PermTable title="Personal interno" userList={users.staff} authTable="staff" />
        </div>
      )}

      {editApp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={()=>setEditApp(null)}>
          <div className="bg-[#171a1f] border border-[#2a2f38] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-5">{editApp.id?'Editar':'Nueva'} aplicacion</h3>
            <div className="space-y-4">
              {!editApp.id&&<Field label="Slug" value={editApp.slug} onChange={v=>setEditApp(f=>({...f,slug:v.toLowerCase().replace(/[^a-z0-9-]/g,'')}))} placeholder="mi-app" />}
              <Field label="Nombre" value={editApp.name} onChange={v=>setEditApp(f=>({...f,name:v}))} placeholder="Nombre" />
              <Field label="Descripcion" value={editApp.description} onChange={v=>setEditApp(f=>({...f,description:v}))} placeholder="Descripcion" />
              <Field label="URL" value={editApp.url} onChange={v=>setEditApp(f=>({...f,url:v}))} placeholder="https://..." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Icono" value={editApp.icon} onChange={v=>setEditApp(f=>({...f,icon:v}))} placeholder="📱" />
                <div><label className="block text-xs text-gray-400 mb-1.5 font-medium">Color</label><select value={editApp.color} onChange={e=>setEditApp(f=>({...f,color:e.target.value}))} className="w-full px-3 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm outline-none">{Object.keys(COLORS).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1.5 font-medium">Auth</label><select value={editApp.requires_auth_system} onChange={e=>setEditApp(f=>({...f,requires_auth_system:e.target.value}))} className="w-full px-3 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-100 text-sm outline-none"><option value="clients">Clients</option><option value="staff">Staff</option><option value="both">Ambos</option><option value="none">Sin auth</option></select></div>
              <Field label="Orden" value={editApp.sort_order} onChange={v=>setEditApp(f=>({...f,sort_order:parseInt(v)||0}))} type="number" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={editApp.is_public} onChange={e=>setEditApp(f=>({...f,is_public:e.target.checked}))} />Publica</label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={editApp.is_active} onChange={e=>setEditApp(f=>({...f,is_active:e.target.checked}))} />Activa</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setEditApp(null)} className="flex-1 py-3 bg-[#0f1114] border border-[#2a2f38] rounded-xl text-gray-400 text-sm font-semibold">Cancelar</button>
              <button onClick={()=>saveApp(editApp)} className="flex-1 py-3 bg-green-600 rounded-xl text-white text-sm font-semibold hover:bg-green-500">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null)
  const [apps, setApps] = useState([])
  const [publicApps, setPublicApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('apps')

  const loadPublic = async () => {
    const { data } = await supabase.from('portal_apps').select('*').eq('is_active',true).eq('is_public',true).order('sort_order')
    setPublicApps(data||[])
  }

  const loadUser = async () => {
    const { data:{session} } = await supabase.auth.getSession()
    if (!session) { setUser(null); return }
    const { data } = await supabase.rpc('get_portal_user')
    if (!data) { setUser(null); return }
    setUser(data)
    const { data: ua } = await supabase.rpc('get_user_apps')
    setApps(ua||[])
  }

  useEffect(() => {
    Promise.all([loadPublic(), loadUser()]).catch(()=>supabase.auth.signOut()).finally(()=>setLoading(false))
    const { data:{subscription} } = supabase.auth.onAuthStateChange(ev => { if (ev==='SIGNED_OUT'){setUser(null);setApps([])} })
    return () => subscription.unsubscribe()
  }, [])

  const nav = async (app) => { const url = await getAppUrl(app.url); window.open(url, '_blank') }
  const out = async () => { await supabase.auth.signOut(); setUser(null); setApps([]); setView('apps') }

  if (loading) return <div className="min-h-screen bg-[#0f1114] flex items-center justify-center"><Spinner /></div>
  if (!user) return <LoginPage onSuccess={loadUser} publicApps={publicApps} />

  const isAdmin = user.client?.role==='admin' || user.staff?.role==='admin'
  const priv = apps.filter(a=>!a.is_public)
  const pub = apps.filter(a=>a.is_public)

  return (
    <div className="min-h-screen bg-[#0f1114] text-gray-100">
      <header className="border-b border-[#2a2f38] px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center"><span className="text-xl">🫒</span></div>
            <div><div className="text-[11px] tracking-[3px] uppercase text-green-500 font-semibold">Aceites Tapia</div><div className="text-xs text-gray-500 mt-0.5">{user.display_name}{isAdmin&&<span className="text-green-400"> · Admin</span>}</div></div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin&&<button onClick={()=>setView(view==='admin'?'apps':'admin')} className={`text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${view==='admin'?'bg-green-600/15 border-green-600/30 text-green-400':'bg-[#171a1f] border-[#2a2f38] text-gray-500 hover:text-gray-300'}`}>{view==='admin'?'← Apps':'⚙ Gestionar'}</button>}
            <button onClick={out} className="text-gray-500 hover:text-gray-300 text-sm font-medium bg-[#171a1f] border border-[#2a2f38] px-3 py-2 rounded-lg">Salir</button>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-8">
        {view==='admin' ? <AdminPanel /> : (
          <>
            {priv.length>0&&(<div className="mb-8"><h2 className="text-xl font-extrabold tracking-tight mb-1">Tus aplicaciones</h2><p className="text-sm text-gray-500 mb-5">{priv.length} app{priv.length!==1?'s':''}</p><div className="grid gap-3">{priv.map(a=><AppCard key={a.id} app={a} isLoggedIn onNavigate={nav} />)}</div></div>)}
            {pub.length>0&&(<div><h2 className="text-lg font-bold text-gray-400 mb-3">Acceso libre</h2><div className="grid gap-3">{pub.map(a=><AppCard key={a.id} app={a} isLoggedIn />)}</div></div>)}
            {apps.length===0&&<div className="text-center py-20 text-gray-500"><p className="text-lg mb-2">No tienes aplicaciones asignadas</p><p className="text-sm">Contacta con el administrador</p></div>}
          </>
        )}
        <div className="mt-12 text-center text-xs text-gray-600">Villanueva de Tapia · desde 1993</div>
      </main>
    </div>
  )
}
