// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Supabase client v1.1
// ─────────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://kutezmcwivigoerxumhm.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_KW_7OLgKtlFL4o-BHnAxqQ_UKlAP9uk';

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
  if(error) throw new Error('Envoi Supabase impossible : ' + error.message);
  return true;
}


async function sbDeleteAllCloudData(){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  try {
    const { data: docs, error: docsError } = await sbClient()
      .from('family_documents')
      .select('storage_path')
      .eq('user_id', user.id);
    if(docsError) throw docsError;
    const paths = (docs || []).map(d => d.storage_path).filter(Boolean);
    if(paths.length){
      const { error: storageError } = await sbClient().storage.from(SB_ITEM_DOC_BUCKET).remove(paths);
      if(storageError) console.warn('[Supabase] storage delete error:', storageError.message);
    }
    const { error: docDeleteError } = await sbClient()
      .from('family_documents')
      .delete()
      .eq('user_id', user.id);
    if(docDeleteError) throw docDeleteError;
  } catch(e){
    console.warn('[Supabase] document cloud delete warning:', e.message || e);
  }
  const { error } = await sbClient()
    .from('family_data')
    .delete()
    .eq('user_id', user.id);
  if(error) throw new Error('Suppression family_data impossible : ' + error.message);
  return true;
}

// ─── Utilitaires documents ─────────────────────────────────
function sbSafeFileName(name){
  const base = String(name || 'document').trim() || 'document';
  return base
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'document';
}


// ─── Documents attachés à un item (déploiement modules) ─────
const SB_ITEM_DOC_BUCKET = 'family-documents';

async function sbUploadItemDocument(file, itemId, module='sante'){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  if(!file) throw new Error('Aucun fichier sélectionné.');
  if(!itemId) throw new Error('ID de fiche manquant. Enregistre d’abord la fiche.');
  const safeName = sbSafeFileName(file.name);
  const cleanItemId = sbSafeFileName(itemId);
  const storagePath = `${user.id}/${cleanItemId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await sbClient()
    .storage
    .from(SB_ITEM_DOC_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if(uploadError) throw new Error('Storage upload impossible : ' + uploadError.message);

  const payload = {
    user_id: user.id,
    item_id: itemId,
    module,
    name: file.name,
    storage_path: storagePath,
    size: file.size || 0,
    mime_type: file.type || 'application/octet-stream'
  };

  const { data, error: dbError } = await sbClient()
    .from('family_documents')
    .insert(payload)
    .select('*')
    .single();

  if(dbError){
    try { await sbClient().storage.from(SB_ITEM_DOC_BUCKET).remove([storagePath]); } catch {}
    throw new Error('Métadonnées family_documents non enregistrées : ' + dbError.message);
  }
  return data || payload;
}

async function sbListItemDocuments(itemId, module='sante'){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  if(!itemId) throw new Error('ID de fiche manquant.');
  const { data, error } = await sbClient()
    .from('family_documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('module', module)
    .eq('item_id', itemId);
  if(error) throw new Error('Lecture family_documents impossible : ' + error.message);
  return Array.isArray(data) ? data.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))) : [];
}


async function sbListModuleDocuments(module){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  if(!module) throw new Error('Module manquant.');
  const { data, error } = await sbClient()
    .from('family_documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('module', module);
  if(error) throw new Error('Lecture family_documents impossible : ' + error.message);
  return Array.isArray(data) ? data.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))) : [];
}

async function sbListAllFamilyDocuments(){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  const { data, error } = await sbClient()
    .from('family_documents')
    .select('*')
    .eq('user_id', user.id);
  if(error) throw new Error('Lecture family_documents impossible : ' + error.message);
  return Array.isArray(data) ? data.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))) : [];
}

async function sbItemSignedUrl(storagePath, download=false){
  if(!storagePath) throw new Error('Chemin Storage manquant.');
  const options = download ? { download: true } : undefined;
  const { data, error } = await sbClient()
    .storage
    .from(SB_ITEM_DOC_BUCKET)
    .createSignedUrl(storagePath, 3600, options);
  if(error) throw new Error('URL signée impossible : ' + error.message);
  if(!data?.signedUrl) throw new Error('URL signée vide.');
  return data.signedUrl;
}

async function sbDeleteItemDocument(doc){
  const user = await sbCurrentUser();
  if(!user) throw new Error('Utilisateur non connecté.');
  const storagePath = doc?.storage_path || doc?.storagePath || '';
  if(!storagePath) throw new Error('Chemin Storage manquant.');
  const { error: storageError } = await sbClient().storage.from(SB_ITEM_DOC_BUCKET).remove([storagePath]);
  if(storageError) throw new Error('Suppression Storage impossible : ' + storageError.message);

  let query = sbClient().from('family_documents').delete().eq('user_id', user.id).eq('storage_path', storagePath);
  if(doc?.id) query = query.eq('id', doc.id);
  const { error: dbError } = await query;
  if(dbError) throw new Error('Suppression family_documents impossible : ' + dbError.message);
  return true;
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

