// ─────────────────────────────────────────────────────────────────
// SuperApp Famille — Intégration Supabase (Auth + Sync)
// ─────────────────────────────────────────────────────────────────

(function(){
  'use strict';

  // ─── Helpers internes ────────────────────────────────────────
  function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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



  // ─── Laboratoire documents accueil (test isolé) ───────────────
  const testDocStore = new Map();
  function fmtSize(bytes){
    const n = Number(bytes || 0);
    if(!Number.isFinite(n) || n <= 0) return 'taille inconnue';
    if(n < 1024) return n + ' o';
    if(n < 1024 * 1024) return Math.round(n / 1024) + ' Ko';
    return (Math.round((n / (1024 * 1024)) * 10) / 10).toString().replace('.', ',') + ' Mo';
  }
  function testDocModal(){
    let dlg = document.getElementById('sb-doc-test-dialog');
    if(dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'sb-doc-test-dialog';
    dlg.className = 'dialog-card sb-doc-test-dialog';
    dlg.innerHTML = '<header class="dialog-head"><h2>📎 Test documents</h2><button class="icon-btn" type="button" onclick="window.sbCloseDocumentTest()" aria-label="Fermer">✕</button></header>'
      + '<div class="form-stack sb-doc-test-stack">'
      + '<section class="sb-doc-test-intro"><b>Laboratoire Supabase</b><small>Test isolé depuis l’accueil : upload Storage, ligne family_documents, ouverture, téléchargement et suppression.</small></section>'
      + '<input id="sb-doc-test-input" type="file" hidden onchange="window.sbUploadTestDocument(this)">'
      + '<button type="button" class="btn primary sb-doc-test-upload" onclick="document.getElementById(\'sb-doc-test-input\').click()">📤 Charger un document</button>'
      + '<div id="sb-doc-test-status" class="sb-doc-test-status"></div>'
      + '<div id="sb-doc-test-list" class="sb-doc-test-list"><div class="empty">Chargement…</div></div>'
      + '</div>';
    document.body.appendChild(dlg);
    return dlg;
  }
  function testDocStatus(message, type='info'){
    const el = document.getElementById('sb-doc-test-status');
    if(!el) return;
    el.className = 'sb-doc-test-status ' + type;
    el.textContent = message || '';
  }
  function renderTestDocs(docs){
    const list = document.getElementById('sb-doc-test-list');
    if(!list) return;
    testDocStore.clear();
    if(!docs || !docs.length){
      list.innerHTML = '<div class="empty">Aucun document de test déposé.</div>';
      return;
    }
    list.innerHTML = docs.map((doc, idx)=>{
      const key = 'doc_' + idx + '_' + Date.now();
      testDocStore.set(key, doc);
      return '<article class="sb-doc-test-row">'
        + '<div class="sb-doc-test-icon">📄</div>'
        + '<div class="sb-doc-test-info"><b>' + escH(doc.name || 'Document') + '</b>'
        + '<small>' + escH(doc.mime_type || 'type inconnu') + ' · ' + escH(fmtSize(doc.size)) + '</small>'
        + '<em>module test_documents · item accueil_test</em></div>'
        + '<div class="sb-doc-test-actions">'
        + '<button type="button" class="doc-btn" onclick="window.sbOpenTestDocBtn(\'' + key + '\')">Ouvrir</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDownloadTestDocBtn(\'' + key + '\')">Télécharger</button>'
        + '<button type="button" class="doc-btn danger" onclick="window.sbDeleteTestDocBtn(\'' + key + '\')">Supprimer</button>'
        + '</div></article>';
    }).join('');
  }
  window.sbOpenDocumentTest = async function(){
    const dlg = testDocModal();
    try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
    await window.sbLoadTestDocuments();
  };
  window.sbCloseDocumentTest = function(){
    const dlg = document.getElementById('sb-doc-test-dialog');
    try { dlg?.close(); } catch { dlg?.removeAttribute('open'); }
  };
  window.sbLoadTestDocuments = async function(){
    try {
      testDocStatus('Lecture des documents de test…', 'info');
      if(typeof sbTestListDocuments !== 'function') throw new Error('Fonctions de test documents indisponibles.');
      const docs = await sbTestListDocuments();
      renderTestDocs(docs);
      testDocStatus(docs.length ? docs.length + ' document(s) chargé(s).' : 'Aucun document de test pour le moment.', 'ok');
    } catch(e){
      renderTestDocs([]);
      testDocStatus(e.message || String(e), 'error');
    }
  };
  window.sbUploadTestDocument = async function(input){
    try {
      const file = input?.files?.[0];
      if(!file) return;
      testDocStatus('Envoi du fichier vers Supabase…', 'info');
      if(typeof sbTestUploadDocument !== 'function') throw new Error('Fonction upload test indisponible.');
      await sbTestUploadDocument(file);
      input.value = '';
      testDocStatus('Document ajouté. Rechargement de la liste…', 'ok');
      await window.sbLoadTestDocuments();
    } catch(e){
      if(input) input.value = '';
      testDocStatus(e.message || String(e), 'error');
    }
  };
  window.sbOpenTestDocBtn = async function(key){
    const doc = testDocStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbTestSignedUrl(doc.storage_path, false);
      if(win) win.location.href = url;
      else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      testDocStatus(e.message || String(e), 'error');
    }
  };
  window.sbDownloadTestDocBtn = async function(key){
    const doc = testDocStore.get(key);
    const win = window.open('', '_blank');
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      const url = await sbTestSignedUrl(doc.storage_path, true);
      if(win) win.location.href = url;
      else window.location.href = url;
    } catch(e){
      if(win) try { win.close(); } catch {}
      testDocStatus(e.message || String(e), 'error');
    }
  };
  window.sbDeleteTestDocBtn = async function(key){
    const doc = testDocStore.get(key);
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      if(!confirm('Supprimer ce document de test ?')) return;
      testDocStatus('Suppression du document…', 'info');
      await sbTestDeleteDocument(doc);
      testDocStatus('Document supprimé.', 'ok');
      await window.sbLoadTestDocuments();
    } catch(e){
      testDocStatus(e.message || String(e), 'error');
    }
  };



  // ─── Documents attachés aux fiches Santé (test contrôlé) ─────────
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
        + '<em>Santé · lié à ' + escH(title) + '</em></div>'
        + '<div class="sb-doc-test-actions">'
        + '<button type="button" class="doc-btn" onclick="window.sbOpenHealthDocBtn(\'' + key + '\')">Ouvrir</button>'
        + '<button type="button" class="doc-btn" onclick="window.sbDownloadHealthDocBtn(\'' + key + '\')">Télécharger</button>'
        + '<button type="button" class="doc-btn danger" onclick="window.sbDeleteHealthDocBtn(\'' + key + '\',\'' + escH(itemId) + '\')">Supprimer</button>'
        + '</div></article>';
    }).join('');
  }
  window.sbHydrateHealthItemDocs = async function(itemId){
    try {
      if(!itemId) return;
      healthDocStatus(itemId, 'Lecture des documents Santé…', 'info');
      if(typeof sbListItemDocuments !== 'function') throw new Error('Fonctions documents Santé indisponibles.');
      const docs = await sbListItemDocuments(itemId, 'sante');
      renderHealthItemDocs(itemId, docs);
      healthDocStatus(itemId, docs.length ? docs.length + ' document(s) attaché(s).' : 'Aucun document attaché pour le moment.', 'ok');
    } catch(e){
      renderHealthItemDocs(itemId, []);
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };
  window.sbUploadHealthItemDocument = async function(input, itemId){
    try {
      const file = input?.files?.[0];
      if(!file) return;
      healthDocStatus(itemId, 'Envoi du fichier vers Supabase…', 'info');
      if(typeof sbUploadItemDocument !== 'function') throw new Error('Fonction upload Santé indisponible.');
      await sbUploadItemDocument(file, itemId, 'sante');
      input.value = '';
      healthDocStatus(itemId, 'Document ajouté. Rechargement de la liste…', 'ok');
      await window.sbHydrateHealthItemDocs(itemId);
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
  window.sbDeleteHealthDocBtn = async function(key, itemId){
    const doc = healthDocStore.get(key);
    try {
      if(!doc) throw new Error('Document introuvable dans la liste courante.');
      if(!confirm('Supprimer ce document Santé ?')) return;
      healthDocStatus(itemId, 'Suppression du document…', 'info');
      await sbDeleteItemDocument(doc);
      healthDocStatus(itemId, 'Document supprimé.', 'ok');
      await window.sbHydrateHealthItemDocs(itemId);
    } catch(e){
      healthDocStatus(itemId, e.message || String(e), 'error');
    }
  };


  // ─── Listes documents visibles : Santé + Familles global ─────────────
  const docsPanelStore = new Map();
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
  function itemInfoForDoc(doc){
    try {
      const found = window.SuperApp?._findRecord?.(doc.item_id || doc.itemId || '');
      const item = found?.item || {};
      const data = window.SuperApp?._getData?.() || {};
      const memberId = item.member || item.memberId || item.assignedTo || item.companion || item.childId || item.eleveId || '';
      const member = Array.isArray(data.family) ? data.family.find(m=>m.id===memberId) : null;
      return {
        title: item.title || item.meal || item.category || doc.item_id || 'fiche liée',
        member: member?.name || (memberId ? memberId : ''),
        category: item.category || doc.category || '',
        date: item.date || ''
      };
    } catch {
      return {title: doc.item_id || 'fiche liée', member:'', category:'', date:''};
    }
  }
  function renderDocsPanel(mode, docs){
    const root = docsPanelRoot(mode); if(!root) return;
    const list = root.querySelector('.sb-module-docs-list'); if(!list) return;
    [...docsPanelStore.keys()].filter(k=>k.startsWith(mode+'::')).forEach(k=>docsPanelStore.delete(k));
    if(!docs || !docs.length){
      list.innerHTML = '<div class="sb-doc-empty">Aucun document Supabase trouvé pour cette vue.</div>';
      return;
    }
    list.innerHTML = docs.map((doc, idx)=>{
      const key = mode + '::' + idx + '::' + Date.now();
      docsPanelStore.set(key, doc);
      const info = itemInfoForDoc(doc);
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
  }
  window.sbHydrateDocsPanel = async function(mode){
    try {
      const cleanMode = mode === 'global' ? 'global' : 'sante';
      docsPanelStatus(cleanMode, 'Lecture des documents Supabase…', 'info');
      let docs = [];
      if(cleanMode === 'global'){
        if(typeof sbListAllFamilyDocuments !== 'function') throw new Error('Fonction liste globale indisponible.');
        docs = await sbListAllFamilyDocuments();
      } else {
        if(typeof sbListModuleDocuments !== 'function') throw new Error('Fonction liste module indisponible.');
        docs = await sbListModuleDocuments('sante');
      }
      renderDocsPanel(cleanMode, docs);
      docsPanelStatus(cleanMode, docs.length ? docs.length + ' document(s) affiché(s).' : 'Aucun document trouvé.', 'ok');
    } catch(e){
      renderDocsPanel(mode === 'global' ? 'global' : 'sante', []);
      docsPanelStatus(mode === 'global' ? 'global' : 'sante', e.message || String(e), 'error');
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

  // Documents Supabase réactivés uniquement en test accueil + fiches Santé.

})();
