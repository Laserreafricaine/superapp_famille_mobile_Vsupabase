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
