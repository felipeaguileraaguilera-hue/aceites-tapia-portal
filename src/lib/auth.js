import { supabase } from './supabase'

// Login con email y password (flujo clients: Tarifas, Pedidos, Repartidor)
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return getPortalUser()
}

// Login con telefono (flujo staff: Combustible)
export async function loginWithPhone(phone) {
  const cleaned = phone.replace(/\s/g, '')

  // Buscar en staff
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('phone', cleaned)
    .eq('is_active', true)
    .maybeSingle()

  if (!staff) throw new Error('Telefono no registrado')

  const fakeEmail = `staff-${cleaned}@aceitestapia.com`
  const password = cleaned

  if (staff.auth_user_id) {
    // Ya tiene cuenta auth -> login directo
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
    if (error) throw new Error('Error de acceso: ' + error.message)
  } else {
    // Primer acceso -> crear cuenta y vincular
    const { data: signupData, error: signupErr } = await supabase.auth.signUp({ email: fakeEmail, password })
    if (signupErr) throw new Error('Error al crear acceso: ' + signupErr.message)

    await supabase
      .from('staff')
      .update({ auth_user_id: signupData.user.id })
      .eq('id', staff.id)
  }

  return getPortalUser()
}

// Obtener perfil unificado del portal
export async function getPortalUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase.rpc('get_portal_user')
  if (error || !data) return null

  return data
}

export async function logout() {
  await supabase.auth.signOut()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
