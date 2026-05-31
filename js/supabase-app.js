// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Intégration Supabase (Auth + Sync + Docs)
// Ce fichier se charge APRÈS supabase-client.js et app.js
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  // ─── Init (appelé par app.js via setTimeout) ─────────────────
  window.sbInitAuth = async function(){
    if(typeof sbClient !== 'function') return;
    const user = await sbCurrentUser();
    if(user){
      sbShowSyncBar('syncing', '🔄 Synchronisation…');
      await sbPullAndMerge();
      sbShowSyncBar('synced', '✅ Synchronisé', 2500);
      sbUpdateUserBar(user);
      document.addEventListener('visibilitychange', ()=>{
        if(!document.hidden) sbPullAndMerge().catch(()=>{});
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
    const overlay = document.getElementById('sb-auth-overlay');
    if(!overlay) return;
    overlay.style.display = 'flex';
    overlay.innerHTML = sbBuildAuthHtml('login');
  };

  function sbBuildAuthHtml(tab){
    const isLogin = (tab === 'login');
    return '<div class="sb-auth-card">'
      + '<div class="sb-auth-logo">'
      + '<span class="logo-emoji">🏠</span>'
      + '<h1>SuperApp Famille</h1>'
      + '<p>Ton espace famille sécurisé et synchronisé</p>'
      + '</div>'
      + '<div class="sb-auth-tabs">'
      + '<button class="sb-auth-tab ' + (isLogin?'active':'') + '" onclick="window.sbSwitchTab(\'login\')">Se connecter</button>'
      + '<button class="sb-auth-tab ' + (!isLogin?'active':'') + '" onclick="window.sbSwitchTab(\'register\')">Créer un compte</button>'
      + '</div>'
      + '<div class="sb-auth-form">'
      + '<div class="sb-field"><label>Adresse email</label><input type="email" id="sb-email" placeholder="votre@email.fr" autocomplete="email"></div>'
      + '<div class="sb-field"><label>Mot de passe</label><input type="password" id="sb-pass" placeholder="minimum 6 caractères"></div>'
      + (isLogin ? '' : '<div class="sb-field"><label>Confirmer le mot de passe</label><input type="password" id="sb-pass2" placeholder="identique"></div>')
      + '<div class="sb-auth-error" id="sb-error"></div>'
      + '<div class="sb-auth-info" id="sb-info"></div>'
      + '<button class="sb-auth-btn" id="sb-submit-btn" onclick="window.sbSubmitAuth(\'' + tab + '\')">'
      + (isLogin ? 'Se connecter' : 'Créer mon compte famille')
      + '</button>'
      + '<p class="sb-auth-hint">'
      + (isLogin ? '🔒 Tes données sont privées. Seule ta famille y a accès.' : '🆕 Un compte par famille. Tous les membres partagent le même compte.')
      + '</p>'
      + '</div></div>';
  }

  window.sbSwitchTab = function(tab){
    const overlay = document.getElementById('sb-auth-overlay');
    if(overlay) overlay.innerHTML = sbBuildAuthHtml(tab);
  };

  window.sbSubmitAuth = async function(tab){
    const email = (document.getElementById('sb-email')?.value || '').trim();
    const pass  = document.getElementById('sb-pass')?.value || '';
    const pass2 = document.getElementById('sb-pass2')?.value || '';
    const errEl  = document.getElementById('sb-error');
    const infoEl = document.getElementById('sb-info');
    const btn    = document.getElementById('sb-submit-btn');
    const showErr  = m => { errEl.textContent=m; errEl.className='sb-auth-error visible'; infoEl.className='sb-auth-info'; };
    const showInfo = m => { infoEl.textContent=m; infoEl.className='sb-auth-info visible'; errEl.className='sb-auth-error'; };
    if(!email || !pass){ showErr('Remplis tous les champs.'); return; }
    if(tab==='register' && pass !== pass2){ showErr('Les mots de passe ne correspondent pas.'); return; }
    if(pass.length < 6){ showErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    btn.disabled = true; btn.textContent = 'Connexion…';
    try {
      if(tab === 'register'){
        await sbSignUp(email, pass);
        showInfo('📧 Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.');
        window.sbSwitchTab('login');
        return;
      } else {
        await sbSignIn(email, pass);
      }
      document.getElementById('sb-auth-overlay').style.display = 'none';
      sbShowSyncBar('syncing', '🔄 Récupération de tes données…');
      await window.sbPullAndMerge();
      sbShowSyncBar('synced', '✅ Connecté et synchronisé !', 3000);
      const user = await sbCurrentUser();
      sbUpdateUserBar(user);
      window.SuperApp?.toast('👋 Bienvenue ! Données synchronisées.');
    } catch(e){
      const msg = e.message || '';
      if(msg.includes('Invalid login')) showErr('Email ou mot de passe incorrect.');
      else if(msg.includes('Email not confirmed')) showErr('Confirme ton adresse email avant de te connecter.');
      else if(msg.includes('already registered')) showErr('Cet email est déjà utilisé. Connecte-toi.');
      else showErr('Erreur : ' + msg);
      btn.disabled = false;
      btn.textContent = tab==='login' ? 'Se connecter' : 'Créer mon compte famille';
    }
  };

  window.sbLogout = async function(){
    if(!confirm('Se déconnecter ? L\'appli fonctionnera hors-ligne jusqu\'à la prochaine connexion.')) return;
    await sbSignOut();
    window._sbUser = null; window._sbUserEmail = '';
    sbShowAuthOverlay();
    window.SuperApp?.toast('Déconnecté.');
  };

  // ─── Section documents sur la page item ──────────────────────
  window.sbLoadItemDocs = async function(itemId){
    if(typeof sbCurrentUser !== 'function') return;
    const section = document.getElementById('item-docs-section');
    if(!section) return;
    const user = await sbCurrentUser();
    if(!user){
      section.innerHTML = '<p style="font-size:12px;color:#888">Connecte-toi pour accéder aux documents.</p>';
      return;
    }
    section.innerHTML = '<p style="font-size:12px;color:#888">Chargement…</p>';
    const docs = await sbListDocuments(itemId);
    section.innerHTML = sbDocsListHtml(itemId, docs);
  };

  function sbDocsListHtml(itemId, docs){
    const SA = window.SuperApp;
    const found = SA?._findRecord(itemId);
    const module = found?.collection || '';
    const rows = (docs||[]).map(d => {
      const icon = d.mime_type?.includes('pdf') ? '📄'
        : d.mime_type?.includes('image') ? '🖼️' : '📎';
      const size = d.size
        ? (d.size > 1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko')
        : '';
      return '<div class="doc-row">'
        + '<span class="doc-row-icon">' + icon + '</span>'
        + '<div class="doc-row-info"><b>' + escHtml(d.name) + '</b><small>' + size + '</small></div>'
        + '<div class="doc-row-actions">'
        + '<button class="doc-btn" onclick="window.sbOpenDoc(\'' + d.storage_path + '\')">Ouvrir</button>'
        + '<button class="doc-btn" onclick="window.sbDeleteDoc(\'' + d.id + '\',\'' + d.storage_path + '\',\'' + itemId + '\')">✕</button>'
        + '</div></div>';
    }).join('');
    return (rows || '<p style="font-size:12px;color:#888;margin:0">Aucun document attaché.</p>')
      + '<label class="doc-upload-btn" style="display:block;margin-top:8px;cursor:pointer">'
      + '+ Ajouter un document (PDF, photo…)'
      + '<input type="file" accept="image/*,.pdf,.doc,.docx" style="display:none" onchange="window.sbHandleUpload(this,\'' + itemId + '\',\'' + module + '\')">'
      + '</label>';
  }

  // Petite version standalone de escapeHtml pour ce fichier
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  window.sbDocsSectionHtml = function(itemId){
    return '<div class="item-documents-section">'
      + '<h4>📎 Documents attachés</h4>'
      + '<div id="item-docs-section"><p style="font-size:12px;color:#888">Chargement…</p></div>'
      + '</div>';
  };

  window.sbOpenDoc = async function(path){
    try {
      const url = await sbGetDocumentUrl(path);
      // Créer un lien temporaire pour contourner le blocage Safari/mobile
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 200);
    } catch(e) {
      window.SuperApp?.toast('Impossible d\'ouvrir le document : ' + e.message);
    }
  };

  window.sbDeleteDoc = async function(docId, path, itemId){
    if(!confirm('Supprimer ce document définitivement ?')) return;
    try {
      await sbDeleteDocument(docId, path);
      window.SuperApp?.toast('Document supprimé.');
      await window.sbLoadItemDocs(itemId);
    } catch { window.SuperApp?.toast('Erreur lors de la suppression.'); }
  };

  window.sbHandleUpload = async function(input, itemId, module){
    const file = input.files?.[0]; if(!file) return;
    const label = input.closest('label');
    if(label){ label.style.opacity='0.5'; label.firstChild.textContent = 'Envoi en cours…'; }
    try {
      await sbUploadDocument(file, itemId, module);
      window.SuperApp?.toast('📎 Document ajouté !');
      await window.sbLoadItemDocs(itemId);
    } catch(e){
      window.SuperApp?.toast('Erreur upload : ' + e.message);
      if(label){ label.style.opacity=''; label.firstChild.textContent = '+ Ajouter un document'; }
    }
  };


  // Référencé par app.js via sbUserBarHtml()
  window.sbUserBarExternal = function(){
    const e = window._sbUserEmail || '';
    const ico = String.fromCodePoint;
    if(!e) return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      + ico(0x1F534) + ' Hors ligne</strong><small>Appuie pour te connecter et synchroniser</small></div>'
      + '<button class="sb-logout-btn" onclick="window.sbShowAuthOverlay()">'
      + ico(0x1F511) + ' Connexion</button></div>';
    return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      + ico(0x1F7E2) + ' Synchronisé</strong>'
      + '<small>' + e.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</small></div>'
      + '<button class="sb-logout-btn" onclick="window.sbLogout()">'
      + ico(0x1F6AA) + ' Déconnexion</button></div>';
  };

})();

// ─── Injection docs dans le placeholder du dialog item ──────────
window.sbInjectItemDocs = async function(itemId){
  const placeholder = document.querySelector('.sb-item-docs-placeholder[data-item-id="'+itemId+'"]');
  if(!placeholder) return;
  // Transformer le placeholder en zone colorée (innerHTML évite les soucis de outerHTML)
  placeholder.className = 'sb-item-docs-zone';
  placeholder.innerHTML = '<h4>📎 Documents attachés</h4>'
    + '<div id="item-docs-section"><p style="font-size:12px;color:#888">Chargement…</p></div>';
  await window.sbLoadItemDocs(itemId);
};

// ─── Vue docs par module ─────────────────────────────────────────
window._sbModuleDocsState = { memberFilter:'all', moduleFilter:'all' };

window.sbLoadModuleDocs = async function(module){
  // Retry si le DOM n'est pas encore prêt
  let section = document.querySelector('.sb-module-docs-section[data-module="'+module+'"]');
  if(!section){
    setTimeout(()=>window.sbLoadModuleDocs(module), 300);
    return;
  }
  if(typeof sbCurrentUser !== 'function') return;
  const user = await sbCurrentUser();
  if(!user){ section.innerHTML = '<p style="font-size:12px;color:#888">Connecte-toi pour voir les documents.</p>'; return; }
  section.innerHTML = '<p style="font-size:12px;color:#888">Chargement…</p>';
  const allDocs = await sbListAllDocuments();
  const isGlobal = (module === 'familles');
  // Filtrer par module si pas global
  const docs = isGlobal ? allDocs : allDocs.filter(d => d.module === module || d.module === '');
  section.innerHTML = sbModuleDocsHtml(docs, module, isGlobal);
};

function sbModuleDocsHtml(docs, module, isGlobal){
  const SA = window.SuperApp;
  // Construire les membres pour les filtres
  const memberState = window._sbModuleDocsState;
  const members = SA ? (window._sbFamilyMembers || []) : [];

  // Récupérer les membres depuis SuperApp si dispo
  if(SA && SA._getData) {
    window._sbFamilyMembers = (SA._getData().family || []).filter(m => m.status !== 'archive');
  }
  const familyMembers = window._sbFamilyMembers || [];

  // Modules disponibles pour filtre global
  const moduleLabels = {
    sante:'Santé', education:'École', maison:'Maison',
    sport_loisirs:'Sport/Loisir/Voyage', familles:'Familles', calendrier:'Calendrier'
  };

  // Filtres actifs
  const activeMember = memberState.memberFilter || 'all';
  const activeModule = memberState.moduleFilter || 'all';

  // Appliquer filtres
  let filtered = docs;
  if(activeMember !== 'all') filtered = filtered.filter(d => d.item_id && sbDocBelongsToMember(d, activeMember, SA));
  if(isGlobal && activeModule !== 'all') filtered = filtered.filter(d => d.module === activeModule);

  // Chips membres
  const memberChips = ['<button class="sb-docs-filter-chip '+(activeMember==='all'?'active':'')+'" onclick="window.sbFilterModuleDocs(\'member\',\'all\',\''+module+'\')">Tous</button>']
    .concat(familyMembers.map(m =>
      '<button class="sb-docs-filter-chip '+(activeMember===m.id?'active':'')+'" onclick="window.sbFilterModuleDocs(\'member\',\''+m.id+'\',\''+module+'\')">'
      + escHtml(m.name.split(' ')[0]) + '</button>'
    )).join('');

  // Chips modules (seulement en vue globale)
  const moduleChips = isGlobal ? ['<button class="sb-docs-filter-chip '+(activeModule==='all'?'active':'')+'" onclick="window.sbFilterModuleDocs(\'module\',\'all\',\''+module+'\')">Tous</button>']
    .concat(Object.entries(moduleLabels).map(([id, lbl]) =>
      '<button class="sb-docs-filter-chip '+(activeModule===id?'active':'')+'" onclick="window.sbFilterModuleDocs(\'module\',\''+id+'\',\''+module+'\')">'
      + lbl + '</button>'
    )).join('') : '';

  // Lignes documents
  const rows = filtered.map(d => {
    const icon = d.mime_type?.includes('pdf') ? '📄' : d.mime_type?.includes('image') ? '🖼️' : '📎';
    const size = d.size ? (d.size > 1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko') : '';
    const modLabel = moduleLabels[d.module] || d.module || '';
    const itemInfo = isGlobal && modLabel ? '<span class="sb-doc-item-link">'+escHtml(modLabel)+'</span>' : '';
    return '<div class="sb-doc-row">'
      + '<span class="sb-doc-icon">'+icon+'</span>'
      + '<div class="sb-doc-info">'
      + '<b>'+escHtml(d.name)+'</b>'
      + '<small>'+size+(size&&itemInfo?' · ':'')+itemInfo+'</small>'
      + '</div>'
      + '<div class="sb-doc-actions">'
      + '<button class="doc-btn" onclick="window.sbOpenDoc(\''+d.storage_path+'\')">Ouvrir</button>'
      + '<button class="doc-btn" onclick="window.sbDeleteModuleDoc(\''+d.id+'\',\''+d.storage_path+'\',\''+module+'\')">✕</button>'
      + '</div></div>';
  }).join('');

  const empty = filtered.length === 0
    ? '<div class="sb-doc-empty">📂 Aucun document'+(activeMember!=='all'||activeModule!=='all' ? ' pour ce filtre' : ' encore')+'. Ouvre un item pour en ajouter.</div>'
    : '';

  return '<h3>📁 '+(isGlobal ? 'Tous les documents' : 'Documents')+'</h3>'
    + (isGlobal ? '<div class="sb-docs-filters">'+moduleChips+'</div>' : '')
    + (familyMembers.length > 0 ? '<div class="sb-docs-filters">'+memberChips+'</div>' : '')
    + '<div class="sb-docs-list">'+rows+empty+'</div>';
}

function sbDocBelongsToMember(doc, memberId, SA){
  if(!SA || !SA._findRecord) return false;
  const found = SA._findRecord(doc.item_id);
  if(!found) return false;
  const item = found.item;
  return item.member === memberId
    || item.companion === memberId
    || (item.members && String(item.members).split(',').map(s=>s.trim()).includes(memberId))
    || (item.students && String(item.students).split(',').map(s=>s.trim()).includes(memberId));
}

window.sbFilterModuleDocs = function(type, value, module){
  if(type === 'member') window._sbModuleDocsState.memberFilter = value;
  if(type === 'module') window._sbModuleDocsState.moduleFilter = value;
  window.sbLoadModuleDocs(module);
};

window.sbDeleteModuleDoc = async function(docId, path, module){
  if(!confirm('Supprimer ce document ?')) return;
  try {
    await sbDeleteDocument(docId, path);
    window.SuperApp?.toast('Document supprimé.');
    window.sbLoadModuleDocs(module);
  } catch { window.SuperApp?.toast('Erreur lors de la suppression.'); }
};

function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
