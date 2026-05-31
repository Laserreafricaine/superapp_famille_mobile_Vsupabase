// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Intégration Supabase (Auth + Sync + Docs)
// Architecture : input file GLOBAL hors formulaire, data-attributes
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  // ─── Helpers internes ────────────────────────────────────────
  function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ─── Init auth ───────────────────────────────────────────────
  window.sbInitAuth = async function(){
    if(typeof sbClient !== 'function') return;
    sbInitGlobalFileInput();
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

  // ─── Sync bar ────────────────────────────────────────────────
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

  // ─── Auth overlay ────────────────────────────────────────────
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
    if(!email||!pass){showErr('Remplis tous les champs.');return;}
    if(tab==='register'&&pass!==pass2){showErr('Mots de passe différents.');return;}
    if(pass.length<6){showErr('Mot de passe trop court (6 car. min).');return;}
    btn.disabled=true; btn.textContent='Connexion…';
    try {
      if(tab==='register'){
        await sbSignUp(email,pass);
        showInfo('📧 Compte créé ! Confirme ton email puis connecte-toi.');
        window.sbSwitchTab('login'); return;
      }
      await sbSignIn(email,pass);
      document.getElementById('sb-auth-overlay').style.display='none';
      sbShowSyncBar('syncing','🔄 Récupération de tes données…');
      await window.sbPullAndMerge();
      sbShowSyncBar('synced','✅ Connecté !',3000);
      const user=await sbCurrentUser();
      sbUpdateUserBar(user);
      sbInitGlobalFileInput();
      window.SuperApp?.toast('👋 Bienvenue ! Données synchronisées.');
    } catch(e){
      const msg=e.message||'';
      if(msg.includes('Invalid login')) showErr('Email ou mot de passe incorrect.');
      else if(msg.includes('Email not confirmed')) showErr('Confirme ton email d\'abord.');
      else if(msg.includes('already registered')) showErr('Email déjà utilisé. Connecte-toi.');
      else showErr('Erreur : '+msg);
      btn.disabled=false;
      btn.textContent=tab==='login'?'Se connecter':'Créer mon compte famille';
    }
  };

  window.sbLogout = async function(){
    if(!confirm('Se déconnecter ?')) return;
    await sbSignOut();
    window._sbUser=null; window._sbUserEmail='';
    sbShowAuthOverlay();
    window.SuperApp?.toast('Déconnecté.');
  };

  // ─── Bandeau utilisateur (settings) ─────────────────────────
  window.sbUserBarExternal = function(){
    const e=window._sbUserEmail||'';
    const ico=String.fromCodePoint;
    if(!e) return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      +ico(0x1F534)+' Hors ligne</strong><small>Appuie pour te connecter</small></div>'
      +'<button class="sb-logout-btn" onclick="window.sbShowAuthOverlay()">'+ico(0x1F511)+' Connexion</button></div>';
    return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      +ico(0x1F7E2)+' Synchronisé</strong>'
      +'<small>'+e.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</small></div>'
      +'<button class="sb-logout-btn" onclick="window.sbLogout()">'+ico(0x1F6AA)+' Déconnexion</button></div>';
  };

  // ─── Input fichier global ─────────────────────────────────────
  // Appelé au chargement et après connexion
  function sbInitGlobalFileInput(){
    const input = document.getElementById('sb-global-file-input');
    if(!input || input._sbBound) return;
    input._sbBound = true;
    input.addEventListener('change', async function(){
      const file = this.files?.[0];
      this.value = ''; // reset pour permettre re-sélection du même fichier
      if(!file) return;

      const target = window._sbUploadTarget;
      window._sbUploadTarget = null;
      if(!target || !target.itemId){
        window.SuperApp?.toast('Erreur : fiche non identifiée.');
        return;
      }
      const {itemId, module} = target;

      // Afficher "Envoi en cours" — on cible la zone docs de cet item
      const zone = document.getElementById('sb-docs-content-'+itemId);
      if(zone) zone.innerHTML = '<p style="font-size:12px;color:#888;padding:8px 0">📤 Envoi en cours…</p>';

      try {
        await sbUploadDocument(file, itemId, module);
        window.SuperApp?.toast('📎 Document ajouté !');
        await window.sbRefreshItemDocs(itemId);
      } catch(e){
        window.SuperApp?.toast('❌ Erreur upload : '+(e.message||'Erreur inconnue'));
        await window.sbRefreshItemDocs(itemId);
      }
    });
  }

  // ─── Déclencher l'upload (appelé par onclick sur le bouton) ──
  // data-item-id et data-module portent les infos — zéro JS dans l'attribut onclick
  window.sbTriggerUploadFromBtn = function(btn){
    window._sbUploadTarget = {
      itemId: btn.dataset.itemId,
      module: btn.dataset.module
    };
    const input = document.getElementById('sb-global-file-input');
    if(input) input.click();
  };

  // ─── Supprimer un doc (depuis data-attributes) ────────────────
  window.sbDeleteDocFromBtn = async function(btn){
    if(!confirm('Supprimer ce document définitivement ?')) return;
    const docId      = btn.dataset.docId;
    const storagePath= btn.dataset.storagePath;
    const itemId     = btn.dataset.itemId;
    try {
      await sbDeleteDocument(docId, storagePath);
      window.SuperApp?.toast('Document supprimé.');
      await window.sbRefreshItemDocs(itemId);
    } catch(e){
      window.SuperApp?.toast('Erreur suppression : '+(e.message||'?'));
    }
  };

  // ─── Section docs dans le dialog item ────────────────────────

  // Injecte la zone docs dans le placeholder (appelé par app.js)
  window.sbInjectItemDocs = async function(itemId, attempt){
    attempt = attempt||1;
    const placeholder = document.querySelector(
      '.sb-item-docs-placeholder[data-item-id="'+itemId+'"]'
    );
    if(!placeholder){
      if(attempt<8) setTimeout(()=>window.sbInjectItemDocs(itemId, attempt+1), 150);
      return;
    }
    // Transformer le placeholder en zone colorée
    placeholder.className = 'sb-item-docs-zone';
    placeholder.setAttribute('id','sb-docs-zone-'+itemId);
    placeholder.innerHTML = buildItemDocsShell(itemId);
    await window.sbRefreshItemDocs(itemId);
  };

  // Structure HTML de la zone docs pour un item
  function buildItemDocsShell(itemId){
    return '<h4>📎 Documents attachés</h4>'
      + '<div id="sb-docs-content-'+itemId+'">'
      + '<p style="font-size:12px;color:#888">Chargement…</p>'
      + '</div>';
  }

  // Rafraîchir la liste des docs d'un item (lecture + pré-signature + rendu)
  window.sbRefreshItemDocs = async function(itemId){
    const zone = document.getElementById('sb-docs-content-'+itemId);
    if(!zone) return;
    if(typeof sbCurrentUser !== 'function') return;
    const user = await sbCurrentUser();
    if(!user){
      zone.innerHTML = '<p style="font-size:12px;color:#888">Connecte-toi pour accéder aux documents.</p>';
      return;
    }
    zone.innerHTML = '<p style="font-size:12px;color:#888">Chargement…</p>';
    try {
      const docs = await sbListDocuments(itemId);
      // Pré-signer toutes les URLs en parallèle
      await Promise.all((docs||[]).map(async d=>{
        try { d._url = await sbGetDocumentUrl(d.storage_path); } catch { d._url=''; }
      }));
      // Trouver le module de l'item
      const SA = window.SuperApp;
      const found = SA?._findRecord ? SA._findRecord(itemId) : null;
      const module = getModuleForCollection(found?.collection || '');
      zone.innerHTML = buildItemDocsList(itemId, docs, module);
    } catch(e){
      zone.innerHTML = '<p style="font-size:12px;color:#c00">Erreur : '+escH(e.message)+'</p>';
    }
  };

  // HTML de la liste de docs pour un item
  function buildItemDocsList(itemId, docs, module){
    const rows = (docs||[]).map(d => {
      const icon = d.mime_type?.includes('pdf') ? '📄'
        : d.mime_type?.includes('image') ? '🖼️' : '📎';
      const size = d.size
        ? (d.size>1048576 ? (d.size/1048576).toFixed(1)+' Mo' : Math.round(d.size/1024)+' Ko')
        : '';
      // Liens directs — URL pré-signée dans href, zéro async au clic
      const openBtn = d._url
        ? '<a href="'+escH(d._url)+'" target="_blank" rel="noopener noreferrer" class="doc-btn">Ouvrir</a>'
        : '';
      const dlBtn = d._url
        ? '<a href="'+escH(d._url)+'" download="'+escH(d.name)+'" target="_blank" class="doc-btn">Télécharger</a>'
        : '';
      // data-attributes — zéro JavaScript dans les attributs onclick
      return '<div class="doc-row">'
        + '<span class="doc-row-icon">'+icon+'</span>'
        + '<div class="doc-row-info"><b>'+escH(d.name)+'</b><small>'+escH(size)+'</small></div>'
        + '<div class="doc-row-actions">'+openBtn+dlBtn
        + '<button type="button" class="doc-btn"'
        + ' data-doc-id="'+escH(d.id)+'"'
        + ' data-storage-path="'+escH(d.storage_path)+'"'
        + ' data-item-id="'+escH(itemId)+'"'
        + ' onclick="window.sbDeleteDocFromBtn(this)">✕</button>'
        + '</div></div>';
    }).join('');

    const empty = !docs||docs.length===0
      ? '<p style="font-size:12px;color:#888;margin:0 0 8px">Aucun document attaché.</p>'
      : '';

    // Bouton upload — data-attributes, onclick sans arguments JS
    const uploadBtn = '<button type="button" class="doc-upload-btn"'
      + ' data-item-id="'+escH(itemId)+'"'
      + ' data-module="'+escH(module)+'"'
      + ' onclick="window.sbTriggerUploadFromBtn(this)">'
      + '+ Ajouter un document (PDF, photo…)</button>';

    return rows + empty + uploadBtn;
  }

  // ─── Vue docs par module ──────────────────────────────────────
  window._sbModuleDocsState = { memberFilter:'all', moduleFilter:'all', categoryFilter:'all' };

  window.sbLoadModuleDocs = async function(module, block){
    const sel = block
      ? '.sb-module-docs-section[data-module="'+module+'"][data-block="'+block+'"]'
      : '.sb-module-docs-section[data-module="'+module+'"]';
    let section = document.querySelector(sel);
    if(!section){
      // Retry si DOM pas encore prêt
      if(!window._sbModuleDocsRetry) window._sbModuleDocsRetry = {};
      const key = module+(block||'');
      window._sbModuleDocsRetry[key] = (window._sbModuleDocsRetry[key]||0)+1;
      if(window._sbModuleDocsRetry[key] < 6)
        setTimeout(()=>window.sbLoadModuleDocs(module, block), 300);
      return;
    }
    if(typeof sbCurrentUser !== 'function') return;
    const user = await sbCurrentUser();
    if(!user){
      section.innerHTML='<p style="font-size:12px;color:#888">Connecte-toi pour voir les documents.</p>';
      return;
    }
    section.innerHTML='<p style="font-size:12px;color:#888">Chargement…</p>';
    try {
      const allDocs = await sbListAllDocuments();
      const isGlobal = (module==='familles');
      const SA = window.SuperApp;
      const familyMembers = SA?._getData ? (SA._getData().family||[]).filter(m=>m.status!=='archive') : [];

      // Filtrer par module si pas vue globale
      let docs = isGlobal ? allDocs
        : (allDocs||[]).filter(d => getModuleForCollection(d.module||'')===module
            || d.module===module);

      // Pré-signer les URLs en parallèle
      await Promise.all((docs||[]).map(async d=>{
        try { d._url = await sbGetDocumentUrl(d.storage_path); } catch { d._url=''; }
        // Récupérer le titre de l'item lié
        const found = SA?._findRecord ? SA._findRecord(d.item_id) : null;
        d._itemTitle = found?.item?.title || found?.item?.name || '';
        d._moduleLabel = moduleLabel(d.module||'');
      }));

      section.innerHTML = buildModuleDocsHtml(docs, module, isGlobal, familyMembers);
    } catch(e){
      section.innerHTML='<p style="font-size:12px;color:#c00">Erreur : '+escH(e.message)+'</p>';
    }
  };

  // Filtres
  window.sbFilterModuleDocs = function(type, value, module){
    if(type==='member') window._sbModuleDocsState.memberFilter=value;
    if(type==='module'){ window._sbModuleDocsState.moduleFilter=value; window._sbModuleDocsState.categoryFilter='all'; }
    if(type==='category') window._sbModuleDocsState.categoryFilter=value;
    window.sbLoadModuleDocs(module);
  };

  // Chip bouton avec data-attributes — zéro JS dans onclick
  window.sbFilterFromChip = function(btn){
    const type   = btn.dataset.filterType;
    const value  = btn.dataset.filterValue;
    const module = btn.dataset.filterModule;
    window.sbFilterModuleDocs(type, value, module);
  };

  window.sbDeleteModuleDocFromBtn = async function(btn){
    if(!confirm('Supprimer ce document ?')) return;
    const docId      = btn.dataset.docId;
    const storagePath= btn.dataset.storagePath;
    const module     = btn.dataset.module;
    try {
      await sbDeleteDocument(docId, storagePath);
      window.SuperApp?.toast('Document supprimé.');
      window.sbLoadModuleDocs(module);
    } catch { window.SuperApp?.toast('Erreur suppression.'); }
  };

  function buildModuleDocsHtml(docs, module, isGlobal, familyMembers){
    const state = window._sbModuleDocsState;
    const labels = moduleLabels();

    // Appliquer filtres
    let filtered = docs||[];
    if(isGlobal && state.moduleFilter!=='all')
      filtered = filtered.filter(d=>getModuleForCollection(d.module||'')===state.moduleFilter||d.module===state.moduleFilter);
    if(state.memberFilter!=='all')
      filtered = filtered.filter(d=>{
        const SA=window.SuperApp;
        if(!SA?._findRecord) return false;
        const found=SA._findRecord(d.item_id);
        const item=found?.item||{};
        const ids=[];
        ['member','companion'].forEach(k=>{if(item[k])ids.push(String(item[k]));});
        ['members','students'].forEach(k=>{if(item[k])String(item[k]).split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>ids.push(x));});
        return ids.includes(String(state.memberFilter));
      });
    const categories=[...new Set(filtered.map(d=>d._itemTitle||d._moduleLabel||'').filter(Boolean))].slice(0,10);
    if(state.categoryFilter!=='all')
      filtered=filtered.filter(d=>(d._itemTitle||d._moduleLabel||'')===state.categoryFilter);

    // Chips module (vue globale)
    const modChips = isGlobal ? buildChips(
      [['all','Tous',module]].concat(Object.entries(labels).map(([id,lbl])=>[id,lbl,module])),
      'module', state.moduleFilter
    ) : '';

    // Chips membre
    const memChips = buildChips(
      [['all','Tous les membres',module]].concat(familyMembers.map(m=>[m.id,String(m.name||'').split(' ')[0]||'Membre',module])),
      'member', state.memberFilter
    );

    // Chips catégorie
    const catChips = categories.length > 0 ? buildChips(
      [['all','Toutes',module]].concat(categories.map(c=>[c,c,module])),
      'category', state.categoryFilter
    ) : '';

    // Lignes documents
    const rows = filtered.map(d=>{
      const icon = d.mime_type?.includes('pdf')?'📄':d.mime_type?.includes('image')?'🖼️':'📎';
      const size = d.size?(d.size>1048576?(d.size/1048576).toFixed(1)+' Mo':Math.round(d.size/1024)+' Ko'):'';
      const meta=[isGlobal?d._moduleLabel:'',d._itemTitle?'lié à '+d._itemTitle:'',size].filter(Boolean).join(' · ');
      const openBtn=d._url?'<a href="'+escH(d._url)+'" target="_blank" rel="noopener noreferrer" class="doc-btn">Ouvrir</a>':'';
      const dlBtn=d._url?'<a href="'+escH(d._url)+'" download="'+escH(d.name)+'" target="_blank" class="doc-btn">Télécharger</a>':'';
      return '<div class="sb-doc-row">'
        +'<span class="sb-doc-icon">'+icon+'</span>'
        +'<div class="sb-doc-info"><b>'+escH(d.name)+'</b><small>'+escH(meta||'Document')+'</small></div>'
        +'<div class="sb-doc-actions">'+openBtn+dlBtn
        +'<button type="button" class="doc-btn"'
        +' data-doc-id="'+escH(d.id)+'"'
        +' data-storage-path="'+escH(d.storage_path)+'"'
        +' data-module="'+escH(module)+'"'
        +' onclick="window.sbDeleteModuleDocFromBtn(this)">✕</button>'
        +'</div></div>';
    }).join('');

    const empty=filtered.length===0
      ?'<div class="sb-doc-empty">📂 Aucun document'+(state.memberFilter!=='all'||state.moduleFilter!=='all'||state.categoryFilter!=='all'?' pour ce filtre':' encore')+'. Ouvre un item pour en ajouter.</div>'
      :'';

    return '<h3>📁 '+(isGlobal?'Tous les documents':'Documents')+'</h3>'
      +(isGlobal&&modChips?'<div class="sb-doc-filter-group"><b>Module</b><div class="sb-docs-filters">'+modChips+'</div></div>':'')
      +(familyMembers.length>0?'<div class="sb-doc-filter-group"><b>Membre</b><div class="sb-docs-filters">'+memChips+'</div></div>':'')
      +(catChips?'<div class="sb-doc-filter-group"><b>Catégorie</b><div class="sb-docs-filters">'+catChips+'</div></div>':'')
      +'<div class="sb-docs-list">'+rows+empty+'</div>';
  }

  // Construire des chips avec data-attributes
  function buildChips(items, filterType, active){
    return items.map(([value, label, module])=>
      '<button type="button" class="sb-docs-filter-chip '+(active===value?'active':'')+'"'
      +' data-filter-type="'+escH(filterType)+'"'
      +' data-filter-value="'+escH(value)+'"'
      +' data-filter-module="'+escH(module)+'"'
      +' onclick="window.sbFilterFromChip(this)">'+escH(label)+'</button>'
    ).join('');
  }

  // ─── Utilitaires ─────────────────────────────────────────────
  function getModuleForCollection(col){
    const map={
      tasks:'maison',shopping:'courses_repas',meals:'courses_repas',weeklyMeals:'courses_repas',stock:'courses_repas',
      homework:'education',schoolDocs:'education',
      health:'sante',vaccines:'sante',healthDocs:'sante',emergency:'sante',
      sports:'sport_loisirs',loisirs:'sport_loisirs',voyages:'sport_loisirs',
      sportGear:'sport_loisirs',loisirGear:'sport_loisirs',voyageGear:'sport_loisirs',
      family:'familles',familyDocuments:'familles'
    };
    return map[col]||col||'';
  }

  function moduleLabels(){
    return {
      maison:'Maison',courses_repas:'Courses / Repas',education:'Éducation',
      sante:'Santé',sport_loisirs:'Sport / Loisir / Voyage',familles:'Familles'
    };
  }

  function moduleLabel(col){ return moduleLabels()[getModuleForCollection(col)]||col||''; }

})();
