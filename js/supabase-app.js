// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Intégration Supabase (Auth + Sync)
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';
  window._sbLocalDeleteGuard = window._sbLocalDeleteGuard || localStorage.getItem('superapp_local_delete_guard') === '1';

  // ─── Helpers internes ────────────────────────────────────────
  function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function syncTime(){ return new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}); }
  let sbLastSyncTime = localStorage.getItem('superapp_last_sync_time') || '';
  let sbLastPushAt = localStorage.getItem('superapp_last_push_at') || '';
  let sbLastPullAt = localStorage.getItem('superapp_last_pull_at') || '';
  function formatDateTime(iso){
    if(!iso) return 'Jamais';
    try { return new Date(iso).toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}); }
    catch { return iso; }
  }
  function setLastSyncNow(){ sbLastSyncTime = syncTime(); try{ localStorage.setItem('superapp_last_sync_time', sbLastSyncTime); }catch{} }
  function setLastPushNow(){ sbLastPushAt = new Date().toISOString(); setLastSyncNow(); try{ localStorage.setItem('superapp_last_push_at', sbLastPushAt); }catch{} }
  function setLastPullNow(){ sbLastPullAt = new Date().toISOString(); setLastSyncNow(); try{ localStorage.setItem('superapp_last_pull_at', sbLastPullAt); }catch{} }
  window.sbSyncMetaExternal = function(){
    return '<div class="settings-sync-dates"><article><span>☁️</span><div><b>Dernier envoi vers Supabase</b><small>' + escH(formatDateTime(sbLastPushAt)) + '</small></div></article><article><span>📥</span><div><b>Dernière récupération depuis Supabase</b><small>' + escH(formatDateTime(sbLastPullAt)) + '</small></div></article></div>';
  };

  function sbNotify(msg){
    try{
      if(window.SuperApp && typeof window.SuperApp.toast === 'function'){
        window.SuperApp.toast(msg);
        return;
      }
    }catch{}
    try{
      const bar = document.getElementById('sb-sync-bar');
      if(bar){
        bar.className = 'visible synced';
        bar.textContent = msg;
        setTimeout(()=>{ if(bar.textContent === msg) bar.className = ''; }, 2200);
        return;
      }
    }catch{}
    console.log('[SuperApp]', msg);
  }

  // ─── Init auth ───────────────────────────────────────────────
  window.sbInitAuth = async function(){
    if(typeof sbClient !== 'function') return;
    const user = await sbCurrentUser();
    if(user){
      sbShowSyncBar('syncing', '🔄 Synchronisation…');
      await window.sbPullAndMerge();
      setLastSyncNow();
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
  function sbDataItemCount(d){
    const keys = ['family','tasks','shopping','meals','weeklyMeals','stock','homework','schoolDocs','health','vaccines','healthDocs','emergency','sports','loisirs','voyages','sportGear','loisirGear','voyageGear','familyDocuments','documents','calendarEvents','notifications'];
    return keys.reduce((sum,k)=>sum + (Array.isArray(d?.[k]) ? d[k].filter(x=>x && x.status!=='archive' && x.statut!=='archive' && x.status!=='supprime' && x.statut!=='supprime').length : 0), 0);
  }
  function sbLocalLooksEmpty(local, remote){
    return sbDataItemCount(remote?.data || remote) > 0 && sbDataItemCount(local) === 0;
  }
  window.sbPullAndMerge = async function(options={}){
    try {
      const remote = await sbPullData();
      const SA = window.SuperApp;
      if(!SA) return {status:'no_app'};
      const local = SA._getData();
      const forceRemote = options.forceRemote === true;
      if(!remote || !remote.data){
        if(forceRemote){
          sbNotify('ℹ️ Aucune donnée trouvée dans Supabase pour ce compte.');
          return {status:'empty_remote'};
        }
        if(window._sbLocalDeleteGuard){
          sbShowSyncBar('synced','Données locales vides · Supabase conservé',2500);
          return {status:'guarded_empty'};
        }
        return {status:'no_remote'};
      }
      const mustRestore = forceRemote || sbLocalLooksEmpty(local, remote);
      if(mustRestore || sbServerIsNewer(remote.updated_at, local)){
        SA._mergeData(remote.data);
        try{ localStorage.removeItem('superapp_local_delete_guard'); window._sbLocalDeleteGuard=false; }catch{}
        setLastPullNow();
        SA.render();
        const msg = mustRestore ? '✅ Données récupérées depuis Supabase le ' + formatDateTime(sbLastPullAt) : '🔄 Données mises à jour depuis le serveur';
        sbNotify(msg);
        return {status:'restored'};
      }
      if(window._sbLocalDeleteGuard){
        sbShowSyncBar('synced','Données locales vides · Supabase conservé',2500);
        return {status:'guarded'};
      }
      await sbPushData(local);
      setLastPushNow();
      return {status:'pushed'};
    } catch(e){
      console.warn('[Sync]', e.message);
      sbShowSyncBar('error', '⚠️ Synchronisation impossible : ' + e.message, 4500);
      throw e;
    }
  };
  window.sbForcePullFromServer = async function(){
    try{
      sbShowSyncBar('syncing','🔄 Récupération depuis Supabase…');
      const result = await window.sbPullAndMerge({forceRemote:true});
      setLastSyncNow();
      if(result?.status === 'empty_remote'){
        sbShowSyncBar('error','ℹ️ Aucune donnée trouvée dans Supabase pour ce compte.',4500);
      } else {
        sbShowSyncBar('synced','✅ Données récupérées depuis Supabase',3000);
      }
    }catch(e){
      sbShowSyncBar('error','⚠️ Récupération impossible : '+e.message,5000);
    }
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
      setLastSyncNow();
      sbShowSyncBar('synced','✅ Connecté !',3000);
      const user=await sbCurrentUser();
      sbUpdateUserBar(user);
        sbNotify('👋 Bienvenue ! Données synchronisées.');
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
    sbNotify('Déconnecté.');
  };

  window.sbForcePushNow = async function(){
    try{
      sbShowSyncBar('syncing','🔄 Synchronisation…');
      if(typeof sbPushData !== 'function') throw new Error('Fonction de synchronisation indisponible.');
      if(window._sbLocalDeleteGuard) throw new Error('Données locales supprimées : utilise d’abord Récupérer ou Import JSON.');
      await sbPushData(window.SuperApp?._getData?.());
      setLastPushNow();
      sbShowSyncBar('synced','✅ Données envoyées vers Supabase',3000);
      sbNotify('✅ Données envoyées vers Supabase le ' + formatDateTime(sbLastPushAt));
    }catch(e){
      sbShowSyncBar('error','⚠️ '+(e.message||e),4500);
    }
  };

  // ─── Bandeau utilisateur (settings) ─────────────────────────
  window.sbUserBarExternal = function(){
    const e=window._sbUserEmail||'';
    const ico=String.fromCodePoint;
    if(!e) return '<div class="sb-user-bar"><div class="sb-user-info"><strong>'
      +ico(0x1F534)+' Hors ligne</strong><small>Appuie pour te connecter</small></div>'
      +'<button class="sb-logout-btn" onclick="window.sbShowAuthOverlay()">'+ico(0x1F511)+' Connexion</button></div>';
    return '<div class="sb-user-bar sb-user-bar-compact"><span class="sb-sync-icon">☁️</span><div class="sb-user-info"><strong>Synchronisation</strong><small><span class="sb-sync-ok">Synchronisé</span>'+(sbLastSyncTime?' · '+escH(sbLastSyncTime):'')+'</small></div>'
      +'<button class="sb-logout-btn" title="Exporter les données vers Supabase" onclick="window.sbForcePushNow?.()">Exporter</button>'
      +'<button class="sb-logout-btn" title="Récupérer les données depuis Supabase" onclick="window.sbForcePullFromServer?.()">Récupérer</button>'
      +'<button class="sb-logout-btn sb-logout-compact" onclick="window.sbLogout()">'+ico(0x1F6AA)+'</button></div>';
  };





  // ─── Documents attachés aux fiches modules (test contrôlé) ─────────
  const healthDocStore = new Map();
  function healthDocRoot(itemId){
    return [...document.querySelectorAll('[data-sb-health-docs]')].find(el => el.getAttribute('data-sb-health-docs') === String(itemId||'')) || null;
  }
  function healthDocStatus(itemId, message, type='info'){
    const root = healthDocRoot(itemId);
    const el = root?.querySelector('.sb-health-doc-status');
    if(!el) return;
    el.className = 'sb-health-doc-status ' + type;
    el.textContent = message || '';
  }
  function healthDocItemTitle(itemId){
    try {
      const found = window.SuperApp?._findRecord?.(itemId);
      const item = found?.item || {};
      return item.title || item.meal || item.category || 'fiche Santé';
    } catch { return 'fiche Santé'; }
  }
  function renderHealthItemDocs(itemId, docs){
    const root = healthDocRoot(itemId);
    if(!root) return;
    const list = root.querySelector('.sb-health-doc-list');
    if(!list) return;
    [...healthDocStore.keys()].filter(k=>k.startsWith(String(itemId)+'::')).forEach(k=>healthDocStore.delete(k));
    if(!docs || !docs.length){
      list.innerHTML = '<div class="sb-doc-empty">Aucun document attaché à cette fiche Santé.</div>';
      return;
    }
    const title = healthDocItemTitle(itemId);
    list.innerHTML = docs.map((doc, idx)=>{
      const key = String(itemId) + '::' + idx + '::' + Date.now();
      healthDocStore.set(key, doc);
      return '<article class="sb-health-doc-row">'
        + '<div class="sb-doc-test-icon">📄</div>'
        + '<div class="sb-doc-test-info"><b>' + escH(doc.name || 'Document') + '</b>'
        + '<small>' + escH(doc.mime_type || 'type inconnu') + ' · ' + escH(fmtSize(doc.size)) + '</small>'
        + '<em>' + escH(moduleNameForDoc(doc.module || root?.getAttribute('data-sb-doc-module') || 'sante')) + ' · lié à ' + escH(title) + '</em></div>'
        + '<div class="sb-doc-test-actions">'
        + '<button type="button" class="doc-btn" onclick="window.sbOpenHealthDocBtn(\'' + key + '\')">Ouvrir</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDownloadHealthDocBtn(\'' + key + '\')">Télécharger</button>'
        + '<button type="button" class="doc-btn danger" onclick="window.sbDeleteHealthDocBtn(\'' + key + '\',\'' + escH(itemId) + '\',\'' + escH(doc.module || root?.getAttribute('data-sb-doc-module') || 'sante') + '\')">Supprimer</button>'
        + '</div></article>';
    }).join('');
  }
  window.sbHydrateHealthItemDocs = async function(itemId, module='sante'){
    try {
      if(!itemId) return;
      module = String(module || 'sante');
      healthDocStatus(itemId, 'Lecture des documents…', 'info');
      if(typeof sbListItemDocuments !== 'function') throw new Error('Fonctions documents indisponibles.');
      const docs = await sbListItemDocuments(itemId, module);
      renderHealthItemDocs(itemId, docs);
      healthDocStatus(itemId, docs.length ? docs.length + ' document(s) attaché(s).' : 'Aucun document attaché pour le moment.', 'ok');
    } catch(e){
      renderHealthItemDocs(itemId, []);
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };
  window.sbUploadHealthItemDocument = async function(input, itemId, module='sante'){
    try {
      module = String(module || 'sante');
      const file = input?.files?.[0];
      if(!file) return;
      healthDocStatus(itemId, 'Envoi du fichier vers Supabase…', 'info');
      if(typeof sbUploadItemDocument !== 'function') throw new Error('Fonction upload document indisponible.');
      await sbUploadItemDocument(file, itemId, module);
      input.value = '';
      healthDocStatus(itemId, 'Document ajouté. Rechargement de la liste…', 'ok');
      await window.sbHydrateHealthItemDocs(itemId, module);
    } catch(e){
      if(input) input.value = '';
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };
  window.sbOpenHealthDocBtn = async function(key){
    const doc = healthDocStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbItemSignedUrl(doc.storage_path, false);
      if(win) win.location.href = url;
      else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      const itemId = String(key||'').split('::')[0];
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };
  window.sbDownloadHealthDocBtn = async function(key){
    const doc = healthDocStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbItemSignedUrl(doc.storage_path, true);
      if(win) win.location.href = url;
      else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      const itemId = String(key||'').split('::')[0];
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };
  window.sbDeleteHealthDocBtn = async function(key, itemId, module='sante'){
    const doc = healthDocStore.get(key);
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      module = String(module || 'sante');
      if(!confirm('Supprimer ce document ?')) return;
      healthDocStatus(itemId, 'Suppression du document…', 'info');
      await sbDeleteItemDocument(doc);
      healthDocStatus(itemId, 'Document supprimé.', 'ok');
      await window.sbHydrateHealthItemDocs(itemId, module);
    } catch(e){
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };


  // ─── Listes documents visibles : modules + Familles global ─────────────
  const docsPanelStore = new Map();
  const docsPanelRawDocs = new Map();
  const docsPanelState = { global: {member:'all', category:'all'} };
  function cleanDocsMode(mode){ return String(mode || 'sante'); }
  function docsPanelRoot(mode){ return document.querySelector('[data-sb-docs-panel="' + mode + '"]'); }
  function docsPanelStatus(mode, message, type='info'){
    const root = docsPanelRoot(mode); if(!root) return;
    const el = root.querySelector('.sb-module-docs-status'); if(!el) return;
    el.className = 'sb-module-docs-status ' + type;
    el.textContent = message || '';
  }
  function moduleNameForDoc(module){
    const labels = {sante:'Santé', test_documents:'Test accueil', education:'Éducation', maison:'Maison', sport_loisirs:'Sport / Loisir / Voyage', familles:'Familles', courses_repas:'Courses / Repas'};
    return labels[module] || module || 'Module inconnu';
  }
  function itemTypeLabel(type){
    const labels = {appointment:'Rendez-vous', rendez_vous_medical:'Rendez-vous', medication:'Traitement', medicament:'Traitement', document_sante:'Document santé', vaccin:'Vaccin', vaccine:'Vaccin', devoir:'Devoir', note:'Note', task:'Tâche', document_famille:'Document famille'};
    return labels[type] || '';
  }
  function itemInfoForDoc(doc){
    try {
      const found = window.SuperApp?._findRecord?.(doc.item_id || doc.itemId || '');
      const item = found?.item || {};
      const data = window.SuperApp?._getData?.() || {};
      const memberId = item.member || item.memberId || item.assignedTo || item.companion || item.childId || item.eleveId || '';
      const member = Array.isArray(data.family) ? data.family.find(m=>m.id===memberId) : null;
      const title = item.title || item.meal || item.name || item.label || item.category || doc.item_id || 'fiche liée';
      const category = doc.category || item.documentCategory || item.docCategory || item.category || itemTypeLabel(item.type) || '';
      return {
        title,
        member: member?.name || (memberId ? memberId : ''),
        memberId,
        category,
        date: item.date || doc.date || ''
      };
    } catch {
      return {title: doc.item_id || 'fiche liée', member:'', memberId:'', category: doc.category || '', date:''};
    }
  }
  function enrichDocForPanel(doc){
    const info = itemInfoForDoc(doc);
    return {...doc, _info: info, _filterMember: info.member || '', _filterCategory: info.category || ''};
  }
  function uniqueOptionValues(docs, key){
    const seen = new Set();
    const vals = [];
    docs.forEach(doc=>{
      const value = String(doc[key] || '').trim();
      if(value && !seen.has(value)){
        seen.add(value);
        vals.push(value);
      }
    });
    return vals.sort((a,b)=>a.localeCompare(b, 'fr', {sensitivity:'base'}));
  }
  function filterDocsForPanel(mode, docs){
    const state = docsPanelState[mode] || {member:'all', category:'all'};
    return docs.filter(doc=>{
      if(state.member !== 'all' && doc._filterMember !== state.member) return false;
      if(state.category !== 'all' && doc._filterCategory !== state.category) return false;
      return true;
    });
  }
  function safeJsString(value){ return JSON.stringify(String(value || '')).replace(/</g,'\\u003c'); }
  function renderDocsPanelFilters(mode, docs){
    const root = docsPanelRoot(mode); if(!root) return;
    const el = root.querySelector('.sb-module-docs-filters'); if(!el) return;
    const state = docsPanelState[mode] || (docsPanelState[mode] = {member:'all', category:'all'});
    const members = uniqueOptionValues(docs, '_filterMember');
    const categories = uniqueOptionValues(docs, '_filterCategory');
    if(state.member !== 'all' && !members.includes(state.member)) state.member = 'all';
    if(state.category !== 'all' && !categories.includes(state.category)) state.category = 'all';
    const chip = (group, value, label)=>{
      const handler = 'window.sbSetDocsPanelFilter(' + safeJsString(mode) + ',' + safeJsString(group) + ',' + safeJsString(value) + ')';
      return '<button type="button" class="' + ((state[group]||'all')===value ? 'active' : '') + '" onclick="' + escH(handler) + '">' + escH(label) + '</button>';
    };
    const groupHtml = (title, group, values, allLabel)=>{
      if(!values.length) return '<div class="sb-doc-filter-group muted"><span>' + escH(title) + '</span><p>Aucun filtre disponible pour le moment.</p></div>';
      return '<div class="sb-doc-filter-group"><span>' + escH(title) + '</span><div>' + chip(group, 'all', allLabel) + values.map(v=>chip(group, v, v)).join('') + '</div></div>';
    };
    el.innerHTML = groupHtml('Personne', 'member', members, 'Toutes') + groupHtml('Catégorie', 'category', categories, 'Toutes');
  }
  function renderDocsPanel(mode, docs){
    const root = docsPanelRoot(mode); if(!root) return {total:0, shown:0};
    const list = root.querySelector('.sb-module-docs-list'); if(!list) return {total:0, shown:0};
    const enriched = (docs || []).map(enrichDocForPanel);
    renderDocsPanelFilters(mode, enriched);
    const filteredDocs = filterDocsForPanel(mode, enriched);
    [...docsPanelStore.keys()].filter(k=>k.startsWith(mode+'::')).forEach(k=>docsPanelStore.delete(k));
    if(!enriched.length){
      list.innerHTML = '<div class="sb-doc-empty">Aucun document Supabase trouvé pour cette vue.</div>';
      return {total:0, shown:0};
    }
    if(!filteredDocs.length){
      list.innerHTML = '<div class="sb-doc-empty">Aucun document ne correspond aux filtres sélectionnés.</div>';
      return {total:enriched.length, shown:0};
    }
    list.innerHTML = filteredDocs.map((doc, idx)=>{
      const key = mode + '::' + idx + '::' + Date.now();
      docsPanelStore.set(key, doc);
      const info = doc._info || itemInfoForDoc(doc);
      const parts = [moduleNameForDoc(doc.module), info.member, info.category, info.date].filter(Boolean).join(' · ');
      return '<article class="sb-doc-test-row sb-module-doc-row">'
        + '<div class="sb-doc-test-icon">📄</div>'
        + '<div class="sb-doc-test-info"><b>' + escH(doc.name || 'Document') + '</b>'
        + '<small>' + escH(parts || 'Document Supabase') + '</small>'
        + '<em>Lié à : ' + escH(info.title) + '</em></div>'
        + '<div class="sb-doc-test-actions">'
        + '<button type="button" class="doc-btn" onclick="window.sbOpenDocsPanelBtn(\'' + key + '\')">Ouvrir</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDownloadDocsPanelBtn(\'' + key + '\')">Télécharger</button>'
        + '<button type="button" class="doc-btn danger" onclick="window.sbDeleteDocsPanelBtn(\'' + key + '\')">Supprimer</button>'
        + '</div></article>';
    }).join('');
    return {total:enriched.length, shown:filteredDocs.length};
  }
  function rerenderDocsPanelFromCache(mode){
    const cleanMode = cleanDocsMode(mode);
    const docs = docsPanelRawDocs.get(cleanMode) || [];
    const counts = renderDocsPanel(cleanMode, docs);
    docsPanelStatus(cleanMode, counts.total ? counts.shown + ' document(s) affiché(s) sur ' + counts.total + '.' : 'Aucun document trouvé.', 'ok');
  }
  window.sbSetDocsPanelFilter = function(mode, group, value){
    const cleanMode = cleanDocsMode(mode);
    if(!docsPanelState[cleanMode]) docsPanelState[cleanMode] = {member:'all', category:'all'};
    if(group === 'member' || group === 'category') docsPanelState[cleanMode][group] = value || 'all';
    rerenderDocsPanelFromCache(cleanMode);
  };
  window.sbHydrateDocsPanel = async function(mode){
    try {
      const cleanMode = cleanDocsMode(mode);
      docsPanelStatus(cleanMode, 'Lecture des documents Supabase…', 'info');
      let docs = [];
      if(cleanMode === 'global'){
        if(typeof sbListAllFamilyDocuments !== 'function') throw new Error('Fonction liste globale indisponible.');
        docs = await sbListAllFamilyDocuments();
      } else {
        if(typeof sbListModuleDocuments !== 'function') throw new Error('Fonction liste module indisponible.');
        docs = await sbListModuleDocuments(cleanMode);
      }
      docsPanelRawDocs.set(cleanMode, docs);
      const counts = renderDocsPanel(cleanMode, docs);
      docsPanelStatus(cleanMode, counts.total ? counts.shown + ' document(s) affiché(s) sur ' + counts.total + '.' : 'Aucun document trouvé.', 'ok');
    } catch(e){
      const cleanMode = cleanDocsMode(mode);
      docsPanelRawDocs.set(cleanMode, []);
      renderDocsPanel(cleanMode, []);
      docsPanelStatus(cleanMode, e.message || String(e), 'error');
    }
  };
  window.sbOpenDocsPanelBtn = async function(key){
    const doc = docsPanelStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbItemSignedUrl(doc.storage_path, false);
      if(win) win.location.href = url; else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      const mode = String(key||'').split('::')[0] || 'global';
      docsPanelStatus(mode, e.message || String(e), 'error');
    }
  };
  window.sbDownloadDocsPanelBtn = async function(key){
    const doc = docsPanelStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbItemSignedUrl(doc.storage_path, true);
      if(win) win.location.href = url; else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      const mode = String(key||'').split('::')[0] || 'global';
      docsPanelStatus(mode, e.message || String(e), 'error');
    }
  };
  window.sbDeleteDocsPanelBtn = async function(key){
    const doc = docsPanelStore.get(key);
    const mode = String(key||'').split('::')[0] || 'global';
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      if(!confirm('Supprimer ce document ?')) return;
      docsPanelStatus(mode, 'Suppression du document…', 'info');
      await sbDeleteItemDocument(doc);
      docsPanelStatus(mode, 'Document supprimé. Rechargement…', 'ok');
      await window.sbHydrateDocsPanel(mode);
    } catch(e){
      docsPanelStatus(mode, e.message || String(e), 'error');
    }
  };

  // Documents Supabase réactivés uniquement en test accueil + fiches modules.

})();
