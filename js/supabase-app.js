// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Intégration Supabase (Auth + Sync uniquement)
// Documents : supprimés — refonte à venir
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  // ─── Init auth ───────────────────────────────────────────────
  window.sbInitAuth = async function(){
    if(typeof sbClient !== 'function') return;
    const user = await sbCurrentUser();
    if(user){
      sbShowSyncBar('syncing', '🔄 Synchronisation…');
      await window.sbPullAndMerge();
      sbShowSyncBar('synced', '✅ Synchronisé', 2500);
      sbUpdateUserBar(user);
      document.addEventListener('visibilitychange', ()=>{
        if(!document.hidden) window.sbPullAndMerge().catch(()=>{});
      });
    } else {
      sbShowAuthOverlay();
    }
  };

  // ─── Pull & Merge ────────────────────────────────────────────
  window.sbPullAndMerge = async function(){
    try {
      const remote = await sbPullData();
      if(!remote) return;
      const SA = window.SuperApp;
      if(!SA) return;
      if(sbServerIsNewer(remote.updated_at, SA._getData())){
        SA._mergeData(remote.data);
        SA.render();
        SA.toast('🔄 Données mises à jour depuis le serveur');
      } else {
        await sbPushData(SA._getData());
      }
    } catch(e){ console.warn('[Sync]', e.message); }
  };

  // ─── Barre de sync ───────────────────────────────────────────
  window.sbShowSyncBar = function(type, msg, autohideMs){
    const bar = document.getElementById('sb-sync-bar');
    if(!bar) return;
    bar.className = 'visible ' + type;
    bar.textContent = msg;
    if(autohideMs) setTimeout(()=>{ bar.className = ''; }, autohideMs);
  };

  window.sbUpdateUserBar = function(user){
    window._sbUser = user;
    window._sbUserEmail = user ? user.email : '';
  };

  // ─── Overlay auth ────────────────────────────────────────────
  window.sbShowAuthOverlay = function(){
    const el = document.getElementById('sb-auth-overlay');
    if(!el) return;
    el.style.display = 'flex';
    el.innerHTML = buildAuthHtml('login');
  };

  function buildAuthHtml(tab){
    const isLogin = tab === 'login';
    return '<div class="sb-auth-card">'
      + '<div class="sb-auth-logo"><span class="logo-emoji">🏠</span>'
      + '<h1>SuperApp Famille</h1>'
      + '<p>Ton espace famille sécurisé et synchronisé</p></div>'
      + '<div class="sb-auth-tabs">'
      + '<button class="sb-auth-tab '+(isLogin?'active':'')+'" onclick="window.sbSwitchTab(\'login\')">Se connecter</button>'
      + '<button class="sb-auth-tab '+(!isLogin?'active':'')+'" onclick="window.sbSwitchTab(\'register\')">Créer un compte</button>'
      + '</div>'
      + '<div class="sb-auth-form">'
      + '<div class="sb-field"><label>Adresse email</label>'
      + '<input type="email" id="sb-email" placeholder="votre@email.fr" autocomplete="email"></div>'
      + '<div class="sb-field"><label>Mot de passe</label>'
      + '<input type="password" id="sb-pass" placeholder="minimum 6 caractères"></div>'
      + (!isLogin ? '<div class="sb-field"><label>Confirmer</label><input type="password" id="sb-pass2" placeholder="identique"></div>' : '')
      + '<div class="sb-auth-error" id="sb-error"></div>'
      + '<div class="sb-auth-info" id="sb-info"></div>'
      + '<button class="sb-auth-btn" id="sb-submit-btn" onclick="window.sbSubmitAuth(\''+tab+'\')">'
      + (isLogin ? 'Se connecter' : 'Créer mon compte famille') + '</button>'
      + '<p class="sb-auth-hint">'
      + (isLogin ? '🔒 Données privées. Seule ta famille y accède.' : '🆕 Un compte par famille.')
      + '</p></div></div>';
  }

  window.sbSwitchTab = function(tab){
    const el = document.getElementById('sb-auth-overlay');
    if(el) el.innerHTML = buildAuthHtml(tab);
  };

  window.sbSubmitAuth = async function(tab){
    const email = (document.getElementById('sb-email')?.value||'').trim();
    const pass  = document.getElementById('sb-pass')?.value||'';
    const pass2 = document.getElementById('sb-pass2')?.value||'';
    const errEl = document.getElementById('sb-error');
    const infoEl= document.getElementById('sb-info');
    const btn   = document.getElementById('sb-submit-btn');
    const showErr  = m=>{errEl.textContent=m;errEl.className='sb-auth-error visible';infoEl.className='sb-auth-info';};
    const showInfo = m=>{infoEl.textContent=m;infoEl.className='sb-auth-info visible';errEl.className='sb-auth-error';};
    if(!email||!pass){ showErr('Remplis tous les champs.'); return; }
    if(tab==='register'&&pass!==pass2){ showErr('Mots de passe différents.'); return; }
    if(pass.length<6){ showErr('Mot de passe trop court (6 car. min).'); return; }
    btn.disabled=true; btn.textContent='Connexion…';
    try {
      if(tab==='register'){
        await sbSignUp(email, pass);
        showInfo('📧 Compte créé ! Confirme ton email puis connecte-toi.');
        window.sbSwitchTab('login'); return;
      }
      await sbSignIn(email, pass);
      document.getElementById('sb-auth-overlay').style.display='none';
      sbShowSyncBar('syncing','🔄 Récupération de tes données…');
      await window.sbPullAndMerge();
      sbShowSyncBar('synced','✅ Connecté !', 3000);
      const user = await sbCurrentUser();
      sbUpdateUserBar(user);
      window.SuperApp?.toast('👋 Bienvenue ! Données synchronisées.');
    } catch(e){
      const msg = e.message||'';
      if(msg.includes('Invalid login')) showErr('Email ou mot de passe incorrect.');
      else if(msg.includes('Email not confirmed')) showErr('Confirme ton email d\'abord.');
      else if(msg.includes('already registered')) showErr('Email déjà utilisé. Connecte-toi.');
      else showErr('Erreur : '+msg);
      btn.disabled=false;
      btn.textContent = tab==='login' ? 'Se connecter' : 'Créer mon compte famille';
    }
  };

  window.sbLogout = async function(){
    if(!confirm('Se déconnecter ?')) return;
    await sbSignOut();
    window._sbUser = null; window._sbUserEmail = '';
    sbShowAuthOverlay();
    window.SuperApp?.toast('Déconnecté.');
  };

  // ─── Bandeau utilisateur (Paramètres) ────────────────────────
  window.sbUserBarExternal = function(){
    const e = window._sbUserEmail||'';
    const ico = String.fromCodePoint;
    if(!e) return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      +ico(0x1F534)+' Hors ligne</strong><small>Appuie pour te connecter</small></div>'
      +'<button class="sb-logout-btn" onclick="window.sbShowAuthOverlay()">'+ico(0x1F511)+' Connexion</button></div>';
    return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      +ico(0x1F7E2)+' Synchronisé</strong>'
      +'<small>'+e.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</small></div>'
      +'<button class="sb-logout-btn" onclick="window.sbLogout()">'+ico(0x1F6AA)+' Déconnexion</button></div>';
  };

})();

// ─────────────────────────────────────────────────────────────────
// TEST WIDGET DOCUMENTS — visible sur l'écran d'accueil
// Permet de tester upload / open / download / delete
// ─────────────────────────────────────────────────────────────────

// Initialiser l'input file global (une seule fois)
(function initGlobalFileInput(){
  const input = document.getElementById('sb-global-file-input');
  if(!input || input._sbBound) return;
  input._sbBound = true;
  input.addEventListener('change', async function(){
    const file = this.files?.[0];
    this.value = ''; // reset pour permettre re-sélection du même fichier
    if(!file) return;

    const target = window._sbUploadTarget;
    window._sbUploadTarget = null;
    if(!target){ alert('Erreur : cible upload non définie.'); return; }

    // Afficher état pendant l'upload
    const statusEl = document.getElementById('sb-test-status');
    if(statusEl) statusEl.textContent = '📤 Envoi en cours…';

    try {
      if(typeof sbCurrentUser !== 'function') throw new Error('Supabase non chargé');
      const user = await sbCurrentUser();
      if(!user) throw new Error('Non connecté');

      // Chemin de stockage : userId/test/timestamp_filename
      const safeName = String(file.name||'document')
        .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^_+|_+$/g,'')||'document';
      const path = user.id + '/test/' + Date.now() + '_' + safeName;

      // 1. Upload Storage
      const { error: upErr } = await sbClient()
        .storage.from('family-documents')
        .upload(path, file, { upsert: false, contentType: file.type||'application/octet-stream' });
      if(upErr) throw new Error('Storage : ' + upErr.message);

      // 2. Enregistrer métadonnées
      const { error: dbErr } = await sbClient()
        .from('family_documents')
        .insert({
          user_id: user.id,
          item_id: 'test-widget',
          module: 'test',
          name: file.name,
          storage_path: path,
          size: file.size,
          mime_type: file.type || 'application/octet-stream'
        });
      if(dbErr) throw new Error('DB : ' + dbErr.message);

      if(statusEl) statusEl.textContent = '✅ Document uploadé !';
      setTimeout(()=>window.sbDocTestWidget(), 300);
    } catch(e){
      if(statusEl) statusEl.textContent = '❌ ' + (e.message||'Erreur inconnue');
      console.error('[sbUpload]', e);
    }
  });
})();

// Widget principal — injecté dans #view-home par le hook renderHome
window.sbDocTestWidget = async function(){
  const home = document.getElementById('view-home');
  if(!home || home.style.display === 'none') return;

  // Supprimer l'ancien widget s'il existe
  document.getElementById('sb-test-widget')?.remove();

  // Créer le widget
  const widget = document.createElement('div');
  widget.id = 'sb-test-widget';
  widget.style.cssText = 'margin:16px;padding:16px;background:#fff;border-radius:16px;border:2px solid #2D5DA6;box-shadow:0 4px 16px rgba(0,0,0,.10);';
  widget.innerHTML = '<h3 style="margin:0 0 12px;font-size:15px;color:#2D5DA6">📎 Test Documents Supabase</h3>'
    + '<p id="sb-test-status" style="font-size:12px;color:#888;margin:0 0 10px;min-height:16px"></p>'
    + '<button id="sb-test-upload-btn" style="width:100%;padding:12px;border-radius:12px;border:2px dashed #2D5DA6;background:#eff6ff;color:#2D5DA6;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:12px">'
    + '+ Charger un document</button>'
    + '<div id="sb-test-doc-list"><p style="font-size:12px;color:#888">Chargement…</p></div>';

  // Bouton upload
  widget.querySelector('#sb-test-upload-btn').addEventListener('click', function(){
    window._sbUploadTarget = { itemId: 'test-widget', module: 'test' };
    document.getElementById('sb-global-file-input').click();
  });

  // Insérer en haut du home
  home.insertBefore(widget, home.firstChild);

  // Charger la liste des docs
  await sbTestLoadDocs();
};

async function sbTestLoadDocs(){
  const listEl = document.getElementById('sb-test-doc-list');
  if(!listEl) return;

  if(typeof sbCurrentUser !== 'function'){ listEl.innerHTML='<p style="font-size:12px;color:#888">Supabase non chargé.</p>'; return; }
  const user = await sbCurrentUser();
  if(!user){ listEl.innerHTML='<p style="font-size:12px;color:#888">Connecte-toi pour voir les documents.</p>'; return; }

  listEl.innerHTML='<p style="font-size:12px;color:#888">Chargement…</p>';
  try {
    const { data, error } = await sbClient()
      .from('family_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', 'test-widget')
      .order('created_at', { ascending: false });
    if(error) throw new Error(error.message);
    const docs = data || [];

    if(docs.length === 0){
      listEl.innerHTML='<p style="font-size:12px;color:#888">Aucun document. Upload-en un pour tester.</p>';
      return;
    }

    // Pré-signer toutes les URLs en parallèle
    await Promise.all(docs.map(async d=>{
      try {
        const { data: sd, error: se } = await sbClient()
          .storage.from('family-documents')
          .createSignedUrl(d.storage_path, 3600);
        d._url = se ? '' : sd.signedUrl;
      } catch { d._url = ''; }
    }));

    const rows = docs.map(d => {
      const icon = d.mime_type?.includes('pdf') ? '📄' : d.mime_type?.includes('image') ? '🖼️' : '📎';
      const size = d.size ? (d.size>1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko') : '';
      const escUrl = (d._url||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const escName = (d.name||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const escId = (d.id||'').replace(/"/g,'&quot;');
      const escPath = (d.storage_path||'').replace(/"/g,'&quot;');

      const openBtn = d._url
        ? '<a href="'+escUrl+'" target="_blank" rel="noopener noreferrer" style="padding:4px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;font-size:12px;text-decoration:none;color:#333">Ouvrir</a>'
        : '<span style="font-size:11px;color:#c00">URL échouée</span>';
      const dlBtn = d._url
        ? '<a href="'+escUrl+'" download="'+escName+'" target="_blank" style="padding:4px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;font-size:12px;text-decoration:none;color:#333">Télécharger</a>'
        : '';

      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f5f7fa;border-radius:10px;margin-bottom:6px">'
        +'<span style="font-size:20px">'+icon+'</span>'
        +'<div style="flex:1;min-width:0"><b style="display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escName+'</b>'
        +'<small style="font-size:11px;color:#888">'+size+'</small></div>'
        +'<div style="display:flex;gap:4px;flex-shrink:0">'
        +openBtn+' '+dlBtn
        +' <button data-doc-id="'+escId+'" data-path="'+escPath+'" onclick="window.sbTestDelete(this)" style="padding:4px 10px;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;font-size:12px;cursor:pointer;color:#c00">✕</button>'
        +'</div></div>';
    }).join('');
    listEl.innerHTML = rows;
  } catch(e){
    listEl.innerHTML='<p style="font-size:12px;color:#c00">Erreur : '+e.message+'</p>';
  }
}

window.sbTestDelete = async function(btn){
  if(!confirm('Supprimer ce document ?')) return;
  const docId = btn.dataset.docId;
  const path  = btn.dataset.path;
  const statusEl = document.getElementById('sb-test-status');
  if(statusEl) statusEl.textContent = '🗑️ Suppression…';
  try {
    const { error: stErr } = await sbClient().storage.from('family-documents').remove([path]);
    if(stErr) throw new Error('Storage : '+stErr.message);
    const { error: dbErr } = await sbClient().from('family_documents').delete().eq('id', docId);
    if(dbErr) throw new Error('DB : '+dbErr.message);
    if(statusEl) statusEl.textContent = '✅ Supprimé !';
    setTimeout(()=>window.sbDocTestWidget(), 300);
  } catch(e){
    if(statusEl) statusEl.textContent = '❌ '+e.message;
  }
};
