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
    // Chercher la section par id unique item ou par id générique
    const section = document.getElementById('item-docs-section-'+itemId)
      || document.getElementById('item-docs-section');
    if(!section) return;
    const user = await sbCurrentUser();
    if(!user){
      section.innerHTML = '<p style="font-size:12px;color:#888">Connecte-toi pour accéder aux documents.</p>';
      return;
    }
    section.innerHTML = '<p style="font-size:12px;color:#888">Chargement…</p>';
    try {
      const docs = await sbListDocuments(itemId);
      section.innerHTML = sbDocsListHtml(itemId, docs);
    } catch(e){
      section.innerHTML = '<div class="sb-doc-error"><b>Documents indisponibles</b><small>' + escHtml(e.message || 'Erreur Supabase') + '</small></div>';
    }
  };

  function sbDocsListHtml(itemId, docs){
    const SA = window.SuperApp;
    const found = SA?._findRecord(itemId);
    const module = sbCanonicalModuleForFound(found);
    const rows = (docs||[]).map(d => {
      const icon = d.mime_type?.includes('pdf') ? '📄'
        : d.mime_type?.includes('image') ? '🖼️' : '📎';
      const size = d.size
        ? (d.size > 1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko')
        : '';
      const ctx = sbDocContext(d, SA);
      const details = [size, ctx.itemTitle ? 'lié à ' + ctx.itemTitle : '', ctx.memberLabel, ctx.category].filter(Boolean).join(' · ');
      return '<div class="doc-row">'
        + '<span class="doc-row-icon">' + icon + '</span>'
        + '<div class="doc-row-info"><b>' + escHtml(d.name) + '</b><small>' + escHtml(details) + '</small></div>'
        + '<div class="doc-row-actions">'
        + '<button type="button" class="doc-btn" onclick="window.sbOpenDoc(' + jsArg(d.storage_path) + ')">Ouvrir</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDownloadDoc(' + jsArg(d.storage_path) + ',' + jsArg(d.name) + ')">Télécharger</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDeleteDoc(' + jsArg(d.id) + ',' + jsArg(d.storage_path) + ',' + jsArg(itemId) + ')">✕</button>'
        + '</div></div>';
    }).join('');
    const uploadId = 'sb-upload-'+itemId;
    return (rows || '<p style="font-size:12px;color:#888;margin:0">Aucun document attaché.</p>')
      + '<label class="doc-upload-btn" style="display:block;margin-top:8px;cursor:pointer">'
      + '+ Ajouter un document (PDF, photo…)'
      + '<input type="file" accept="image/*,.pdf,.doc,.docx" style="display:none" onchange="window.sbHandleUpload(this,' + jsArg(itemId) + ',' + jsArg(module) + ')">'
      + '</label>';
  }

  function jsArg(v){ return JSON.stringify(String(v ?? '')); }

  function sbCanonicalModuleForFound(found){
    if(!found) return '';
    const itemModule = found.item?.module;
    if(itemModule) return sbCanonicalModuleId(itemModule);
    const map = {
      tasks:'maison', shopping:'courses_repas', meals:'courses_repas', weeklyMeals:'courses_repas', stock:'courses_repas',
      homework:'education', schoolDocs:'education',
      health:'sante', vaccines:'sante', healthDocs:'sante', emergency:'sante',
      sports:'sport_loisirs', loisirs:'sport_loisirs', voyages:'sport_loisirs', sportGear:'sport_loisirs', loisirGear:'sport_loisirs', voyageGear:'sport_loisirs',
      family:'familles', familyDocuments:'familles', documents:'calendrier', calendarEvents:'calendrier', notifications:'calendrier'
    };
    return map[found.collection] || '';
  }

  function sbCanonicalModuleId(id){
    const raw = String(id || '').trim();
    const map = {
      home:'maison', maison:'maison', tasks:'maison',
      courses:'courses_repas', repas:'courses_repas', courses_repas:'courses_repas', shopping:'courses_repas', meals:'courses_repas', weeklyMeals:'courses_repas', stock:'courses_repas',
      ecole:'education', école:'education', education:'education', homework:'education', schoolDocs:'education',
      santé:'sante', sante:'sante', health:'sante', vaccines:'sante', healthDocs:'sante', emergency:'sante',
      sport:'sport_loisirs', sports:'sport_loisirs', loisir:'sport_loisirs', loisirs:'sport_loisirs', voyage:'sport_loisirs', voyages:'sport_loisirs', sport_loisirs:'sport_loisirs', sportGear:'sport_loisirs', loisirGear:'sport_loisirs', voyageGear:'sport_loisirs',
      famille:'familles', familles:'familles', family:'familles', familyDocuments:'familles',
      calendrier:'calendrier', calendar:'calendrier', documents:'calendrier', calendarEvents:'calendrier'
    };
    return map[raw] || raw;
  }

  function sbDocContext(doc, SA){
    const found = doc?.item_id && SA?._findRecord ? SA._findRecord(doc.item_id) : null;
    const item = found?.item || {};
    const module = sbCanonicalModuleForFound(found) || sbCanonicalModuleId(doc?.module || '');
    const moduleLabels = sbModuleLabels();
    const members = SA?._getData ? (SA._getData().family || []) : [];
    const memberIds = [];
    ['member','companion','student','eleve'].forEach(k => { if(item[k]) memberIds.push(String(item[k])); });
    ['members','students'].forEach(k => {
      if(item[k]) String(item[k]).split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>memberIds.push(x));
    });
    const uniqueMemberIds = [...new Set(memberIds)];
    const memberLabel = uniqueMemberIds.map(id => members.find(m => String(m.id)===String(id))?.name || '').filter(Boolean).join(', ');
    const itemTitle = item.title || item.name || item.label || item.category || '';
    const category = doc?.category || item.category || sbTypeLabel(item.type) || '';
    return {
      module,
      moduleLabel: moduleLabels[module] || module || '',
      itemTitle,
      category,
      date: item.date || item.dueDate || item.startDate || '',
      memberIds: uniqueMemberIds,
      memberLabel
    };
  }

  function sbModuleLabels(){
    return {
      maison:'Maison', courses_repas:'Courses / Repas', education:'Éducation', sante:'Santé',
      sport_loisirs:'Sport / Loisir / Voyage', familles:'Familles', calendrier:'Calendrier'
    };
  }

  function sbTypeLabel(type){
    const labels = {
      rendez_vous_medical:'Rendez-vous', traitement:'Traitement', document_sante:'Document santé', vaccin:'Vaccin', urgence_sante:'Urgence',
      document_ecole:'Document école', devoir:'Devoir', note:'Note',
      document_sport:'Document sport', materiel_sport:'Matériel sport', materiel_loisir:'Matériel loisir', materiel_voyage:'Matériel voyage',
      document_famille:'Document famille', tache:'Tâche', evenement:'Événement'
    };
    return labels[type] || '';
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
      // Méthode universelle : lien <a> créé dynamiquement
      // Fonctionne sur Android Chrome, iOS Safari, desktop
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { try { document.body.removeChild(a); } catch {} }, 500);
    } catch(e) {
      window.SuperApp?.toast('Impossible d\'ouvrir le document : ' + (e.message || 'accès refusé'));
    }
  };

  window.sbDownloadDoc = async function(path, name){
    try {
      const url = await sbGetDocumentUrl(path);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'document';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { try { document.body.removeChild(a); } catch {} }, 500);
    } catch(e){
      window.SuperApp?.toast('Téléchargement impossible : ' + (e.message || 'accès refusé'));
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
    const section = document.getElementById('item-docs-section');
    if(label){
      label.classList.add('doc-uploading');
      const txt = label.childNodes && label.childNodes[0];
      if(txt) txt.textContent = 'Envoi en cours…';
    }
    if(section){
      section.insertAdjacentHTML('afterbegin', '<p class="sb-doc-upload-status">Envoi du document vers Supabase…</p>');
    }
    try {
      await sbUploadDocument(file, itemId, module);
      input.value = '';
      window.SuperApp?.toast('📎 Document ajouté !');
      await window.sbLoadItemDocs(itemId);
    } catch(e){
      input.value = '';
      const msg = e.message || 'Erreur inconnue';
      window.SuperApp?.toast('Erreur upload : ' + msg);
      if(section){
        section.innerHTML = '<div class="sb-doc-error"><b>Document non ajouté</b><small>' + escHtml(msg) + '</small><p>Le fichier n’est pas considéré comme déposé tant que la ligne family_documents n’est pas créée.</p></div>'
          + sbDocsListHtml(itemId, []);
      }
      if(label){
        label.classList.remove('doc-uploading');
        label.style.opacity='';
        const txt = label.childNodes && label.childNodes[0];
        if(txt) txt.textContent = '+ Ajouter un document (PDF, photo…)';
      }
    }
  };


  // Exposer les helpers documents pour les vues modules situées hors IIFE
  window.jsArg = jsArg;
  window.sbCanonicalModuleId = sbCanonicalModuleId;
  window.sbDocContext = sbDocContext;
  window.sbModuleLabels = sbModuleLabels;

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
window.sbInjectItemDocs = async function(itemId, attempt){
  attempt = attempt || 1;
  const placeholder = document.querySelector('.sb-item-docs-placeholder[data-item-id="'+itemId+'"]');
  if(!placeholder){
    // Le DOM n'est pas encore prêt — retry jusqu'à 5 fois toutes les 150ms
    if(attempt < 5) setTimeout(()=>window.sbInjectItemDocs(itemId, attempt+1), 150);
    return;
  }
  // Transformer le placeholder en zone colorée
  placeholder.className = 'sb-item-docs-zone';
  placeholder.innerHTML = '<h4>📎 Documents attachés</h4>'
    + '<div id="item-docs-section-'+itemId+'"><p style="font-size:12px;color:#888">Chargement…</p></div>';
  if(typeof window.sbLoadItemDocs === 'function'){
    await window.sbLoadItemDocs(itemId);
  }
};

// ─── Vue docs par module ─────────────────────────────────────────
window._sbModuleDocsState = { memberFilter:'all', moduleFilter:'all', categoryFilter:'all' };

window.sbLoadModuleDocs = async function(module, block){
  let section = document.querySelector('.sb-module-docs-section[data-module="'+module+'"]'+(block?'[data-block="'+block+'"]':''));
  if(!section){
    setTimeout(()=>window.sbLoadModuleDocs(module), 300);
    return;
  }
  if(typeof sbCurrentUser !== 'function') return;
  const user = await sbCurrentUser();
  if(!user){ section.innerHTML = '<p style="font-size:12px;color:#888">Connecte-toi pour voir les documents.</p>'; return; }
  section.innerHTML = '<p style="font-size:12px;color:#888">Chargement…</p>';
  try {
    const allDocs = await sbListAllDocuments();
    const isGlobal = (module === 'familles');
    const SA = window.SuperApp;
    const enriched = (allDocs || []).map(d => ({...d, _ctx: sbDocContext(d, SA)}));
    const docs = isGlobal ? enriched : enriched.filter(d => d._ctx.module === module || sbCanonicalModuleId(d.module) === module);
    section.innerHTML = sbModuleDocsHtml(docs, module, isGlobal);
  } catch(e){
    section.innerHTML = '<div class="sb-doc-error"><b>Documents indisponibles</b><small>' + escHtml(e.message || 'Erreur Supabase') + '</small></div>';
  }
};

function sbModuleDocsHtml(docs, module, isGlobal){
  const SA = window.SuperApp;
  if(SA && SA._getData) {
    window._sbFamilyMembers = (SA._getData().family || []).filter(m => m.status !== 'archive');
  }
  const familyMembers = window._sbFamilyMembers || [];
  const moduleLabels = sbModuleLabels();
  const state = window._sbModuleDocsState;
  const activeMember = state.memberFilter || 'all';
  const activeModule = state.moduleFilter || 'all';
  const activeCategory = state.categoryFilter || 'all';

  let base = docs || [];
  if(isGlobal && activeModule !== 'all') base = base.filter(d => d._ctx.module === activeModule);
  if(activeMember !== 'all') base = base.filter(d => (d._ctx.memberIds || []).map(String).includes(String(activeMember)));

  const categories = [...new Set(base.map(d => d._ctx.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
  let filtered = base;
  if(activeCategory !== 'all') filtered = filtered.filter(d => d._ctx.category === activeCategory);

  const moduleChips = isGlobal ? ['<button type="button" class="sb-docs-filter-chip '+(activeModule==='all'?'active':'')+'" onclick="window.sbFilterModuleDocs(\'module\',\'all\','+jsArg(module)+')">Tous</button>']
    .concat(Object.entries(moduleLabels).map(([id, lbl]) =>
      '<button type="button" class="sb-docs-filter-chip '+(activeModule===id?'active':'')+'" onclick="window.sbFilterModuleDocs(\'module\','+jsArg(id)+','+jsArg(module)+')">'
      + escHtml(lbl) + '</button>'
    )).join('') : '';

  const memberChips = ['<button type="button" class="sb-docs-filter-chip '+(activeMember==='all'?'active':'')+'" onclick="window.sbFilterModuleDocs(\'member\',\'all\','+jsArg(module)+')">Tous les membres</button>']
    .concat(familyMembers.map(m =>
      '<button type="button" class="sb-docs-filter-chip '+(activeMember===m.id?'active':'')+'" onclick="window.sbFilterModuleDocs(\'member\','+jsArg(m.id)+','+jsArg(module)+')">'
      + escHtml(String(m.name||'').split(' ')[0] || 'Membre') + '</button>'
    )).join('');

  const categoryChips = ['<button type="button" class="sb-docs-filter-chip '+(activeCategory==='all'?'active':'')+'" onclick="window.sbFilterModuleDocs(\'category\',\'all\','+jsArg(module)+')">Toutes catégories</button>']
    .concat(categories.map(cat =>
      '<button type="button" class="sb-docs-filter-chip '+(activeCategory===cat?'active':'')+'" onclick="window.sbFilterModuleDocs(\'category\','+jsArg(cat)+','+jsArg(module)+')">'
      + escHtml(cat) + '</button>'
    )).join('');

  const rows = filtered.map(d => {
    const ctx = d._ctx || sbDocContext(d, SA);
    const icon = d.mime_type?.includes('pdf') ? '📄' : d.mime_type?.includes('image') ? '🖼️' : '📎';
    const size = d.size ? (d.size > 1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko') : '';
    const meta = [
      isGlobal ? ctx.moduleLabel : '',
      ctx.itemTitle ? 'lié à ' + ctx.itemTitle : '',
      ctx.memberLabel,
      ctx.category,
      size
    ].filter(Boolean).join(' · ');
    return '<div class="sb-doc-row">'
      + '<span class="sb-doc-icon">'+icon+'</span>'
      + '<div class="sb-doc-info">'
      + '<b>'+escHtml(d.name)+'</b>'
      + '<small>'+escHtml(meta || 'Document Supabase')+'</small>'
      + '</div>'
      + '<div class="sb-doc-actions">'
      + '<button type="button" class="doc-btn" onclick="window.sbOpenDoc('+jsArg(d.storage_path)+')">Ouvrir</button>'
      + '<button type="button" class="doc-btn" onclick="window.sbDownloadDoc('+jsArg(d.storage_path)+','+jsArg(d.name)+')">Télécharger</button>'
      + '<button type="button" class="doc-btn" onclick="window.sbDeleteModuleDoc('+jsArg(d.id)+','+jsArg(d.storage_path)+','+jsArg(module)+')">✕</button>'
      + '</div></div>';
  }).join('');

  const empty = filtered.length === 0
    ? '<div class="sb-doc-empty">📂 Aucun document'+(activeMember!=='all'||activeModule!=='all'||activeCategory!=='all' ? ' pour ce filtre' : ' encore')+'. Ouvre un item pour en ajouter.</div>'
    : '';

  return '<h3>📁 '+(isGlobal ? 'Tous les documents' : 'Documents du module')+'</h3>'
    + (isGlobal ? '<div class="sb-doc-filter-group"><b>Module</b><div class="sb-docs-filters">'+moduleChips+'</div></div>' : '')
    + (familyMembers.length > 0 ? '<div class="sb-doc-filter-group"><b>Membre</b><div class="sb-docs-filters">'+memberChips+'</div></div>' : '')
    + (categories.length > 0 ? '<div class="sb-doc-filter-group"><b>Catégorie</b><div class="sb-docs-filters">'+categoryChips+'</div></div>' : '')
    + '<div class="sb-docs-list">'+rows+empty+'</div>';
}

window.sbFilterModuleDocs = function(type, value, module){
  if(type === 'member') window._sbModuleDocsState.memberFilter = value;
  if(type === 'module') { window._sbModuleDocsState.moduleFilter = value; window._sbModuleDocsState.categoryFilter = 'all'; }
  if(type === 'category') window._sbModuleDocsState.categoryFilter = value;
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
