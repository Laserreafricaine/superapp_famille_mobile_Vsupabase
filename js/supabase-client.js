// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Supabase client v1.0
// ─────────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://kutezmcwivigoerxumhm.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_KW_7OLgKtlFL4o-BHnAxqQ_UKlAP9uk';
const STORAGE_BUCKET = 'family-documents';

// Client Supabase (initialisé après le chargement du SDK CDN)
let _sb = null;
function sbClient(){
  if(!_sb && window.supabase){
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return _sb;
}

// ─── Auth ────────────────────────────────────────────────────────

async function sbCurrentUser(){
  try { const { data:{ user } } = await sbClient().auth.getUser(); return user; }
  catch { return null; }
}

async function sbSignUp(email, password){
  const { data, error } = await sbClient().auth.signUp({ email, password });
  if(error) throw error;
  return data.user;
}

async function sbSignIn(email, password){
  const { data, error } = await sbClient().auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data.user;
}

async function sbSignOut(){
  await sbClient().auth.signOut();
}

// ─── Données famille ─────────────────────────────────────────────

async function sbPullData(){
  const user = await sbCurrentUser();
  if(!user) return null;
  const { data, error } = await sbClient()
    .from('family_data')
    .select('data, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if(error){ console.warn('[Supabase] pull error:', error.message); return null; }
  return data;
}

async function sbPushData(appData){
  const user = await sbCurrentUser();
  if(!user) return;
  const payload = {
    user_id: user.id,
    data: appData,
    updated_at: new Date().toISOString()
  };
  const { error } = await sbClient()
    .from('family_data')
    .upsert(payload, { onConflict: 'user_id' });
  if(error) console.warn('[Supabase] push error:', error.message);
}

// ─── Documents ───────────────────────────────────────────────────

async function sbUploadDocument(file, itemId, module){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Non connecté');
  const ext  = file.name.split('.').pop();
  const path = `${user.id}/${itemId}/${Date.now()}_${file.name}`;
  // Upload dans Storage
  const { error: upErr } = await sbClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });
  if(upErr) throw upErr;
  // Enregistrer les métadonnées en base
  const { error: dbErr } = await sbClient()
    .from('family_documents')
    .insert({
      user_id: user.id,
      item_id: itemId,
      module,
      name: file.name,
      storage_path: path,
      size: file.size,
      mime_type: file.type || 'application/octet-stream'
    });
  if(dbErr){ console.warn('[Supabase] doc meta error:', dbErr.message); }
  return path;
}

async function sbGetDocumentUrl(storagePath){
  const { data, error } = await sbClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600); // URL valable 1h
  if(error) throw error;
  return data.signedUrl;
}

async function sbListDocuments(itemId){
  const user = await sbCurrentUser();
  if(!user) return [];
  const { data, error } = await sbClient()
    .from('family_documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });
  if(error){ console.warn('[Supabase] list docs error:', error.message); return []; }
  return data || [];
}

async function sbDeleteDocument(docId, storagePath){
  const user = await sbCurrentUser();
  if(!user) return;
  await sbClient().storage.from(STORAGE_BUCKET).remove([storagePath]);
  await sbClient().from('family_documents').delete()
    .eq('id', docId).eq('user_id', user.id);
}

// ─── Sync utilitaire ─────────────────────────────────────────────

// Retourne true si le serveur est plus récent que le local
function sbServerIsNewer(serverUpdatedAt, localData){
  if(!serverUpdatedAt) return false;
  const serverTs = new Date(serverUpdatedAt).getTime();
  const localTs  = localData?.settings?.lastSaved
    ? new Date(localData.settings.lastSaved).getTime()
    : 0;
  return serverTs > localTs;
}
