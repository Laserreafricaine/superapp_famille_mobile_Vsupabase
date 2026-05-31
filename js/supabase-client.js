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
  if(!itemId) throw new Error('Élément introuvable : enregistre d’abord la fiche avant d’ajouter un document.');

  const safeName = String(file.name || 'document')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'document';
  const path = `${user.id}/${itemId}/${Date.now()}_${safeName}`;

  // 1) Upload dans Storage
  const { error: upErr } = await sbClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if(upErr) throw new Error('Storage : ' + (upErr.message || 'upload refusé'));

  // 2) Enregistrer les métadonnées en base. Sans cette ligne, le fichier existe mais l'app ne peut pas l'afficher.
  const payload = {
    user_id: user.id,
    item_id: itemId,
    module,
    name: file.name,
    storage_path: path,
    size: file.size,
    mime_type: file.type || 'application/octet-stream'
  };
  const { error: dbErr } = await sbClient()
    .from('family_documents')
    .insert(payload);

  if(dbErr){
    // Rollback : on évite de laisser un fichier orphelin dans Storage.
    try {
      const { error: removeErr } = await sbClient().storage.from(STORAGE_BUCKET).remove([path]);
      if(removeErr) console.warn('[Supabase] rollback storage impossible:', removeErr.message);
    } catch(removeException){
      console.warn('[Supabase] rollback storage exception:', removeException?.message || removeException);
    }
    const detail = [dbErr.message, dbErr.details, dbErr.hint, dbErr.code].filter(Boolean).join(' — ');
    throw new Error('Métadonnées non enregistrées dans family_documents : ' + detail);
  }

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
  if(error){ throw new Error('Lecture family_documents impossible : ' + (error.message || 'accès refusé')); }
  return data || [];
}

async function sbDeleteDocument(docId, storagePath){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Non connecté');
  const { error: stErr } = await sbClient().storage.from(STORAGE_BUCKET).remove([storagePath]);
  if(stErr) throw new Error('Suppression Storage impossible : ' + (stErr.message || 'accès refusé'));
  const { error: dbErr } = await sbClient().from('family_documents').delete()
    .eq('id', docId).eq('user_id', user.id);
  if(dbErr) throw new Error('Suppression family_documents impossible : ' + (dbErr.message || 'accès refusé'));
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

async function sbListAllDocuments(){
  const user = await sbCurrentUser();
  if(!user) return [];
  const { data, error } = await sbClient()
    .from('family_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if(error){ throw new Error('Lecture globale family_documents impossible : ' + (error.message || 'accès refusé')); }
  return data || [];
}
