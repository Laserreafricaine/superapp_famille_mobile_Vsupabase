(() => {
  const STORAGE_KEY = 'superapp_famille_mobile_v5_36';
  const LEGACY_STORAGE_KEYS = ['superapp_famille_mobile_v5_35','superapp_famille_mobile_v5_12_menage_visuel','superapp_famille_mobile_v5_1_logique_actions','superapp_famille_mobile_v5_simplifiee','superapp_famille_mobile_v4_3_6_icone_meteo_dynamique','superapp_famille_mobile_v4_3_5_meteo_auto_coherente','superapp_famille_mobile_v4_3_4_localisation_meteo','superapp_famille_mobile_v4_3_3_filtres_actions','superapp_famille_mobile_v4_3_2_kpi_cliquables','superapp_famille_mobile_v4_3_1_kpi_cliquables','superapp_famille_mobile_v4_3_cartes_exploitables','superapp_famille_mobile_v4_2_visuels_cockpit_mobile','superapp_famille_mobile_v4_1_parametres_autonomes','superapp_famille_mobile_v4_modulaire','superapp_famille_mobile_v3','superapp_famille_mobile_v2'];
  const APP_VERSION = '5.36.29';
  const pad2 = n => String(n).padStart(2, '0');
  const todayObj = new Date();
  const today = `${pad2(todayObj.getDate())}-${pad2(todayObj.getMonth()+1)}-${todayObj.getFullYear()}`;

  // Aliases canoniques : chaque ID (interne ou legacy) est résolu vers son ID stable.
  // Les entrées id===valeur (ex. maison:'maison') garantissent qu'un ID canonique reste canonique.
  // Les autres entrées sont des alias de rétrocompatibilité (anciens noms anglais, raccourcis).
  const MODULE_ALIASES = {
    // Identifiants canoniques (passes-partout)
    maison:'maison', courses_repas:'courses_repas', education:'education',
    sante:'sante', sport_loisirs:'sport_loisirs', familles:'familles',
    calendrier:'calendrier', notifications:'notifications', parametres:'parametres',
    // Alias legacy — anciens noms anglais ou raccourcis
    home:'maison', food:'courses_repas', courses:'courses_repas',
    health:'sante', sport:'sport_loisirs', loisirs:'sport_loisirs',
    family:'familles', calendar:'calendrier', settings:'parametres'
  };
  const LEGACY_MODULE_IDS = {maison:'home', courses_repas:'food', education:'education', sante:'health', sport_loisirs:'sport', familles:'family', calendrier:'calendar'};
  function canonicalModuleId(id){ return MODULE_ALIASES[id] || id || 'calendrier'; }
  function legacyModuleId(id){ return LEGACY_MODULE_IDS[canonicalModuleId(id)] || id; }

  const modules = [
    { id:'maison', name:'Maison', short:'Maison', icon:'🏡', cls:'module-home', image:'assets/images/illustrations/home-task.png', badge:'assets/icons/icon_maison.png', desc:'Une seule liste de tâches avec catégories et filtres.' },
    { id:'courses_repas', name:'Courses & repas', short:'Courses & repas', icon:'🛒', cls:'module-food', image:'assets/images/illustrations/grocery-fridge.png', badge:'assets/icons/icon_courses.png', desc:'Menus, courses et stock regroupés clairement.' },
    { id:'education', name:'Éducation', short:'Éducation', icon:'📚', cls:'module-edu', image:'assets/images/illustrations/education-desk.png', badge:'assets/icons/icon_education.png', desc:'École, documents et notes sans tiroirs inutiles.' },
    { id:'sante', name:'Santé', short:'Santé', icon:'🩺', cls:'module-health', image:'assets/images/illustrations/health-kit.png', badge:'assets/icons/icon_sante.png', desc:'Traitements, rendez-vous et carnet de santé.' },
    { id:'sport_loisirs', name:'Sport, Loisir & Voyage', short:'Sport, Loisir & Voyage', icon:'⚽', cls:'module-sport', image:'assets/images/illustrations/sport-bag.png', badge:'assets/icons/icon_sport.png', desc:'Activités et matériel, sans dispersion.' },
    { id:'familles', name:'Familles', short:'Familles', icon:'👨‍👩‍👧‍👦', cls:'module-family', image:'assets/images/familles_packs/afrique_famille.webp', badge:'assets/icons/icon_famille.png', desc:'Profils, cartes membres et futurs documents administratifs.' },
    { id:'calendrier', name:'Calendrier', short:'Calendrier', icon:'📅', cls:'module-calendar', image:'assets/images/illustrations/calendar-family.png', badge:'assets/icons/icon_calendrier.svg', desc:'Tous les événements familiaux.' },
  ];

  const APP_MODULE_IDS = ['maison','courses_repas','education','sante','sport_loisirs','familles'];
  const CORE_MODULE_IDS = ['calendrier','notifications','parametres'];
  const defaultOffer = {cockpitMobile:true, cockpitOrdinateur:false, syncEnabled:false, minimumOneAppRequired:true, syncMode:'mobile_only'};
  function makeAppsRegistry(existing={}){
    const registry = {};
    modules.forEach(m=>{
      const prev = existing[canonicalModuleId(m.id)] || existing[m.id] || {};
      const isApp = APP_MODULE_IDS.includes(m.id);
      registry[m.id] = {
        id:m.id, nom:m.name, actif: prev.actif ?? true, installe: prev.installe ?? true,
        licence: prev.licence || (isApp ? 'active' : 'core'), sourceActivation: prev.sourceActivation || 'cockpit_mobile',
        activatedAt: prev.activatedAt || nowISO(), connectedToMobile: prev.connectedToMobile ?? true,
        connectedToDesktop: prev.connectedToDesktop ?? false, syncStatus: prev.syncStatus || 'synced'
      };
    });
    const activeApps = APP_MODULE_IDS.filter(id=>registry[id]?.actif);
    if(!activeApps.length) registry.maison.actif = true;
    return registry;
  }

  const defaultData = {
    settings: {
      familyName: '',
      city: '', country: '', postalCode: '', weatherCity: '', currency: 'EUR', theme: 'clair', connectedToCockpit: false, onboarded: false, activeProfile: 'family', notifyPermissionAsked: false,
      offer: structuredClone(defaultOffer), syncMode: 'mobile_only',
      notificationsPrefs: {global:true, sauvegarde:true, synchro:true, maison:true, courses_repas:true, education:true, sante:true, sport_loisirs:true, familles:true},
      appearance: {theme:'clair', accent:'familial', accueil:'resume'},
      emergencyNumbers: {pompiers:'', police:'', samu:''}
    },
    foyer: {
      address:'', addressComplement:'', city:'', postalCode:'', country:'', weatherCity:'', weatherAuto:true,
      useDeviceLocation:false, latitude:null, longitude:null,
      weatherAlerts:{pluie:true, froid:true, vent:true, neige:true, canicule:true},
      usefulPlaces:['Maison','École','Travail','Club / activité','Médecin']
    },
    weather: {city:'', temperature:null, wind:null, summary:'Météo à configurer', updatedAt:''},
    offer: structuredClone(defaultOffer),
    appsRegistry: makeAppsRegistry(),
    family: [],
    categories: {
      maison: { 'Ménage':['Sols','Linge','Cuisine'], 'Entretien':['Plomberie','Électricité','Jardin'], 'Administratif':['Assurance','Factures','Documents'] },
      courses_repas: { 'Alimentation':['Riz','Pâtes','Huile'], 'Épicerie sénégalaise':['Riz brisé','Bouillon','Bissap'], 'Stock':['Frigo','Congélateur','Placard'] },
      education: { 'Devoirs':['Maths','Français','Histoire'], 'Contrôles':['Contrôle','Exposé'], 'Notes':['Bulletin','Appréciation','Examen blanc'], 'Activités scolaires':['Sortie','Réunion','Voyage'], 'Documents école':['Autorisation','Assurance scolaire'] },
      sante: { 'Rendez-vous':['Généraliste','Dentiste','Ophtalmo'], 'Traitements':['Journalier','Hebdomadaire'], 'Documents santé':['Ordonnance','Mutuelle','Certificat'] },
      sport_loisirs: { 'Sport':['Football','Danse','Natation'], 'Loisirs':['Cinéma','Parc','Sortie'], 'Matériel':['Sac','Chaussures','Gourde'] },
      familles: { 'Identité':['Carte d’identité','Passeport','Titre de séjour'], 'Scolarité':['Diplômes','Certificats','Bulletins'], 'Administratif':['Livret de famille','Assurance','Justificatif de domicile'] }
    },
    tasks: [],
    shopping: [],
    meals: [],
    weeklyMeals: [],
    stock: [],
    foodBudget: { monthly: 450, spent: 185, currency: 'EUR' },
    homework: [],
    schoolDocs: [],
    health: [],
    vaccines: [],
    healthDocs: [],
    emergency: [],
    sports: [],
    loisirs: [],
    voyages: [],
    sportGear: [],
    loisirGear: [],
    voyageGear: [],
    familyDocuments: [],
    documents: [],
    calendarEvents: [],
    notifications: [],
    referenceData: {
      maison: {lieux:['Cuisine','Salon','Chambres','Salle de bain'], priorites:['Urgent','Normal','À prévoir'], recurrrences:['Ponctuel','Quotidien','Hebdomadaire','Mensuel']},
      courses_repas: {magasins:['Supermarché','Marché','Épicerie sénégalaise'], unites:['kg','g','litre','pièce','paquet'], zonesStock:['Frigo','Congélateur','Placard']},
      education: {ecoles:['École principale'], classes:['Primaire','Collège','Lycée'], matieres:['Maths','Français','Histoire','Sciences'], typesDocuments:['Autorisation','Assurance scolaire','Bulletin']},
      sante: {professionnels:['Médecin généraliste','Dentiste','Ophtalmologue'], lieuxMedicaux:['Cabinet médical','Pharmacie','Hôpital'], typesRdv:['Consultation','Contrôle','Urgence'], contactsUrgence:['15 - SAMU','112 - Urgence européenne']},
      sport_loisirs: {clubs:['Football','Danse','Natation'], lieux:['Gymnase','Parc','Stade'], materiels:['Sac','Gourde','Chaussures'], typesActivites:['Sport','Sortie','Loisir']},
      familles: {typesDocuments:['Carte d’identité','Passeport','Diplôme','Assurance','Justificatif'], roles:['Parent','Enfant','Tuteur','Proche']}
    }
  };

  let data = load();
  let state = { view:'home', calendarMode:'month', selectedDate: today, notifFilter:'all', calendarFilter:'all', activeModule:null, editing:null, preset:null, returnList:null, appsView:null, slvTab:'sport', maisonPeriodFilters:{} }; 

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
  function nowISO(){ return new Date().toISOString(); }
  function decorateSync(item, source='application_mobile'){
    const stamp = nowISO();
    if(!item.id) item.id = uid();
    if(!item.createdAt) item.createdAt = stamp;
    if(!item.updatedAt) item.updatedAt = stamp;
    if(!item.createdFrom) item.createdFrom = source;
    item.updatedFrom = source;
    if(!item.syncStatus) item.syncStatus = 'pending_create';
    if(!item.statut) item.statut = item.status || 'a_faire';
    return item;
  }
  function touchSync(item, source='application_mobile'){
    item.updatedAt = nowISO();
    item.updatedFrom = source;
    item.syncStatus = item.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update';
    return item;
  }
  function normalizeLegacyStatus(item){
    if(item.status === 'todo') item.status = 'a_faire';
    if(item.status === 'done') item.status = 'fait';
    if(item.status === 'planned') item.status = 'planifie';
    if(item.status === 'info') item.status = 'info';
    item.statut = item.status || item.statut || 'a_faire';
    return item;
  }
  function normaliseItem(item, moduleFallback){
    if(moduleFallback && !item.module) item.module = moduleFallback;
    if(item.module) item.module = canonicalModuleId(item.module);
    normalizeLegacyStatus(item);
    return decorateSync(item, item.createdFrom || 'application_mobile');
  }
  function collectionRegistry(){
    return [
      ['tasks','maison'], ['shopping','courses_repas'], ['meals','courses_repas'], ['weeklyMeals','courses_repas'], ['stock','courses_repas'], ['calendarEvents','calendrier'],
      ['homework','education'], ['schoolDocs','education'],
      ['health','sante'], ['vaccines','sante'], ['healthDocs','sante'], ['emergency','sante'],
      ['sports','sport_loisirs'], ['loisirs','sport_loisirs'], ['voyages','sport_loisirs'], ['sportGear','sport_loisirs'], ['loisirGear','sport_loisirs'], ['voyageGear','sport_loisirs'], ['familyDocuments','familles'], ['documents','calendrier']
    ];
  }
  function findRecord(id){
    for(const [collection] of collectionRegistry()){
      const arr = data[collection] || [];
      const item = arr.find(x => x.id === id);
      if(item) return {collection, item, arr};
    }
    return null;
  }
  function moduleLabel(id){ return moduleById(id)?.name || 'Calendrier'; }
  function moduleIcon(id){ return moduleById(id)?.icon || '📌'; }
  // V5.27 — Logos 3D des apps : remplacent les emojis partout où ils servent à identifier l'app
  function appLogoSrc(id){
    const canonical = canonicalModuleId(id);
    // Les logos couvrent les 6 modules métier. Pour le calendrier, fallback emoji.
    const valid = ['maison','courses_repas','education','sante','sport_loisirs','familles'];
    if(!valid.includes(canonical)) return '';
    return `assets/images/app-logos/${canonical}.webp`;
  }
  function appLogoHtml(id, size=48){
    const src = appLogoSrc(id);
    if(!src) return `<span class="app-logo-emoji-fallback">${moduleIcon(id)}</span>`;
    return `<img class="app-logo" src="${src}" alt="" width="${size}" height="${size}" loading="lazy">`;
  }
  function eventTypeForModule(module){
    module = canonicalModuleId(module);
    return {maison:'tache',courses_repas:'repas',education:'devoir',sante:'rendez_vous_medical',sport_loisirs:'activite',familles:'document_famille',calendrier:'evenement'}[module] || 'evenement';
  }
  function targetCollectionFor(module,type){
    module = canonicalModuleId(module);
    if(module==='maison') return 'tasks';
    if(module==='courses_repas') return type === 'stock' ? 'stock' : (type === 'repas_semaine' ? 'weeklyMeals' : (type === 'course' ? 'shopping' : 'meals'));
    if(module==='education') return type === 'document_ecole' ? 'schoolDocs' : 'homework';
    if(module==='sante') return type === 'urgence_sante' ? 'emergency' : (type === 'vaccin' ? 'vaccines' : (type === 'document_sante' ? 'healthDocs' : 'health'));
    if(module==='sport_loisirs'){
      if(type==='materiel_loisir') return 'loisirGear';
      if(type==='materiel_voyage') return 'voyageGear';
      if(['materiel_sport','document_sport'].includes(type)) return 'sportGear';
      if(type==='loisir') return 'loisirs';
      if(type==='voyage') return 'voyages';
      return 'sports';
    }
    if(module==='familles') return 'familyDocuments';
    return 'calendarEvents';
  }
      function load(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);
      const shaped = ensureDataShape(raw ? JSON.parse(raw) : structuredClone(defaultData));
      // Un utilisateur qui a déjà des données sauvegardées a déjà « pris en main » l'app :
      // on ne lui réaffiche pas l'accueil guidé.
      if(raw && shaped.settings && shaped.settings.onboarded === false) shaped.settings.onboarded = true;
      // V5.6 : migration des Notes (data.grades) vers data.homework (category:'Notes')
      if(Array.isArray(shaped.grades) && shaped.grades.length){
        shaped.homework = Array.isArray(shaped.homework) ? shaped.homework : [];
        shaped.grades.forEach(g=>{
          shaped.homework.push({...g, module:'education', type:'note', category:'Notes'});
        });
      }
      delete shaped.grades;
      return shaped;
    }
    catch { return ensureDataShape(structuredClone(defaultData)); }
  }
  function migrateCategories(categories){
    const out = {...(categories||{})};
    Object.keys(out).forEach(key=>{
      const canonical = canonicalModuleId(key);
      if(canonical !== key){ out[canonical] = {...(out[canonical]||{}), ...(out[key]||{})}; delete out[key]; }
    });
    return out;
  }
  function ensureDataShape(source){
    const d = source || {};
    const base = structuredClone(defaultData);
    Object.keys(base).forEach(key=>{
      if(d[key] === undefined || d[key] === null) d[key] = base[key];
    });
    d.settings = {...base.settings, ...(d.settings||{})};
    d.settings.notificationsPrefs = {...base.settings.notificationsPrefs, ...(d.settings.notificationsPrefs||{})};
    d.settings.appearance = {...base.settings.appearance, ...(d.settings.appearance||{})};
    d.foyer = {...base.foyer, ...(d.foyer||{})};
    d.foyer.weatherAlerts = {...base.foyer.weatherAlerts, ...(d.foyer.weatherAlerts||{})};
    if(!Array.isArray(d.foyer.usefulPlaces)) d.foyer.usefulPlaces = base.foyer.usefulPlaces;
    d.weather = {...base.weather, ...(d.weather||{})};
    d.settings.familyAvatarPack = d.settings.familyAvatarPack || 'afrique';
    d.settings.city = d.foyer.city || d.settings.city || 'Eulmont';
    d.settings.postalCode = d.foyer.postalCode || d.settings.postalCode || '54690';
    d.settings.country = d.foyer.country || d.settings.country || 'France';
    d.settings.weatherCity = d.foyer.weatherCity || d.settings.weatherCity || d.settings.city;
    d.offer = {...defaultOffer, ...(d.offer || d.settings.offer || {})};
    d.settings.offer = {...defaultOffer, ...(d.settings.offer || d.offer || {})};
    d.settings.syncMode = d.settings.syncMode || d.offer.syncMode || 'mobile_only';
    d.appsRegistry = makeAppsRegistry({...base.appsRegistry, ...(d.appsRegistry || d.modules || {})});
    d.categories = migrateCategories({...base.categories, ...(d.categories||{})});
    ['family','tasks','shopping','meals','weeklyMeals','stock','homework','schoolDocs','health','vaccines','healthDocs','emergency','sports','loisirs','voyages','sportGear','loisirGear','voyageGear','familyDocuments','documents','calendarEvents','notifications'].forEach(key=>{
      if(!Array.isArray(d[key])) d[key] = base[key] || [];
    });
    d.family = d.family.map(member => {
      const reference = base.family.find(x => x.id === member.id) || {};
      return {...reference, ...member};
    });
    if(!d.foodBudget) d.foodBudget = base.foodBudget;
    d.referenceData = {...base.referenceData, ...(d.referenceData||{})};
    Object.keys(base.referenceData).forEach(mid=>{ d.referenceData[mid] = {...base.referenceData[mid], ...(d.referenceData[mid]||{})}; });
    collectionRegistry().forEach(([collection,module])=>{ d[collection] = (d[collection]||[]).map(item=>normaliseItem(item,module)); });
    return d;
  }
  function save(){
    if(!data.settings) data.settings={};
    data.settings.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if(!window._sbPauseAutoPush && typeof sbPushData === "function") sbPushData(data).catch(()=>{});
  }
  function closeEditDialog(){
    state.preset = null;
    try { if($('#editDialog')?.open) $('#editDialog').close(); } catch {}
  }
  function closeActionDialog(){
    try { if($('#actionDialog')?.open) $('#actionDialog').close(); } catch {}
  }
  function preferredTheme(){
    // V5.11 — Le thème sombre est retiré pour le moment. On reste toujours sur "clair".
    return 'clair';
  }
  function applyAppearance(){
    document.documentElement.dataset.theme = 'clair';
    document.body.dataset.theme = 'clair';
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fff8f1');
    const status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(status) status.setAttribute('content', 'default');
    return 'clair';
  }
  function parseDMY(str){
    if(!str) return null;
    if(/^\d{2}-\d{2}-\d{4}$/.test(str)){ const [d,m,y]=str.split('-').map(Number); return new Date(y,m-1,d); }
    if(/^\d{4}-\d{2}-\d{2}$/.test(str)){ const [y,m,d]=str.split('-').map(Number); return new Date(y,m-1,d); }
    return null;
  }
  function formatDMY(date){ return `${pad2(date.getDate())}-${pad2(date.getMonth()+1)}-${date.getFullYear()}`; }
  function displayDate(dmy){
    const d = parseDMY(dmy); if(!d) return dmy || '';
    return d.toLocaleDateString('fr-FR',{weekday:'long', day:'numeric', month:'long', year:'numeric'});
  }
  function shortDate(dmy){ const d=parseDMY(dmy); return d ? d.toLocaleDateString('fr-FR',{day:'2-digit', month:'short'}) : dmy; }
  function memberName(id){ return id === 'family' ? 'Toute la famille' : data.family.find(m=>m.id===id)?.name || 'Famille'; }
  function splitMemberName(full=''){
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return {prenom:'À renseigner', nom:'À renseigner'};
    if(parts.length === 1) return {prenom:parts[0], nom:'À renseigner'};
    return {prenom:parts[0], nom:parts.slice(1).join(' ')};
  }
  function birthdayLabel(birth=''){
    const d = parseDMY(birth);
    return d ? d.toLocaleDateString('fr-FR',{day:'2-digit', month:'long'}) : (birth || 'À renseigner');
  }
  function moduleById(id){
    id = canonicalModuleId(id);
    const base = modules.find(m=>m.id===id) || modules[0];
    // V5.10 — Pour le module Familles, l'image suit dynamiquement le pack actif
    if(base.id === 'familles'){
      const packPath = (typeof FAMILY_PACKS !== 'undefined') ? (FAMILY_PACKS.find(p=>p.id===currentFamilyPack())?.family || base.image) : base.image;
      return {...base, image: packPath};
    }
    return base;
  }

  function appHeroKey(module){
    module = canonicalModuleId(module);
    return {maison:'maison', courses_repas:'courses', education:'education', sante:'sante', sport_loisirs:'sport', familles:'famille', calendrier:'calendrier'}[module] || module;
  }
  function appHeroSrc(module){
    const pack = currentFamilyPack();
    const key = appHeroKey(module);
    return `assets/images/app-heroes/${pack}/${key}.webp`;
  }
  function appHeroTitle(module){
    module = canonicalModuleId(module);
    return {maison:'Maison', courses_repas:'Courses & repas', education:'Éducation', sante:'Santé', sport_loisirs:'Sport, Loisir & Voyage', familles:'Famille', calendrier:'Calendrier'}[module] || moduleLabel(module);
  }
  function appHeroBlock(module){
    module = canonicalModuleId(module);
    const src = appHeroSrc(module);
    return `<article class="app-hero-image-card" data-module="${escapeAttr(module)}"><img src="${src}" alt="${escapeAttr(appHeroTitle(module))}" loading="lazy" onerror="this.closest('.app-hero-image-card')?.remove()"></article>`;
  }
  function appRecord(id){ id = canonicalModuleId(id); return data.appsRegistry?.[id] || makeAppsRegistry()[id] || {actif:true, licence:'active'}; }
  function isCoreModule(id){ return CORE_MODULE_IDS.includes(canonicalModuleId(id)); }
  function isAppActive(id){ id = canonicalModuleId(id); return isCoreModule(id) || !!appRecord(id)?.actif; }
  function activeModules(){ return modules.filter(m=>isAppActive(m.id)); }
  function inactiveAppModules(){ return modules.filter(m=>APP_MODULE_IDS.includes(m.id) && !isAppActive(m.id)); }
  function ensureActiveAccess(id){ if(isAppActive(id)) return true; openActivationPanel(id); return false; }
  function dmyToISO(dmy){ const d=parseDMY(dmy); return d ? `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}` : ''; }
  function daysDiff(d1,d2){ const a=parseDMY(d1), b=parseDMY(d2); if(!a||!b) return 9999; a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.round((b-a)/86400000); }
  function startOfWeek(date){ const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
  function addDays(date,n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
  function weekDays(){ const selected=parseDMY(state.selectedDate)||todayObj; const start=startOfWeek(selected); return Array.from({length:7},(_,i)=>addDays(start,i)); }
  function mealForDay(index){ return data.weeklyMeals.find(m=>Number(m.day)===index) || {title:'À définir', type:'Repas'}; }
  function todayMeal(){ const dayIndex=(todayObj.getDay()+6)%7; return mealForDay(dayIndex); }
  function currency(value){ return `${Number(value||0).toLocaleString('fr-FR')} ${data.foodBudget?.currency || data.settings.currency || 'EUR'}`; }
  function foyer(){ data.foyer = data.foyer || {}; return data.foyer; }
  function weatherCityLabel(){ const f=foyer(); return `${f.weatherCity || f.city || data.settings.city || 'Eulmont'}${f.postalCode ? ' — ' + f.postalCode : ''}`; }
  function foyerAddressLabel(){ const f=foyer(); const parts=[f.address, f.addressComplement, [f.postalCode, f.city].filter(Boolean).join(' '), f.country].filter(Boolean); return parts.join(', ') || 'Adresse non renseignée'; }
  function weatherTemperatureText(){
    const w = data.weather || {};
    const temp = Number(w.temperature);
    return Number.isFinite(temp) ? `${Math.round(temp)}°C` : '--°C';
  }
  function weatherMainLine(){
    const w = data.weather || {}; const f = foyer();
    if(f.weatherAuto===false) return 'Météo automatique désactivée';
    if(w.temperature !== null && w.temperature !== undefined && w.temperature !== '') return `${w.summary || 'Météo'} · actuelle`;
    return 'Météo à actualiser';
  }
  function weatherSummary(){
    const w = data.weather || {}; const f = foyer();
    if(f.weatherAuto===false) return 'Météo désactivée';
    if(w.temperature !== null && w.temperature !== undefined && w.temperature !== ''){
      const temp = Math.round(Number(w.temperature));
      const wind = w.wind !== null && w.wind !== undefined && w.wind !== '' ? ` · vent ${Math.round(Number(w.wind))} km/h` : '';
      return `Actuel ${temp}° · ${w.summary || 'météo'}${wind}`;
    }
    return 'Météo à actualiser';
  }
  function weatherUpdatedText(){
    const w = data.weather || {};
    if(!w.updatedAt) return 'Actualisation automatique à l’ouverture';
    return `Actualisée à ${new Date(w.updatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})}`;
  }
  const FRANCOPHONE_COUNTRIES = ['Sénégal','Côte d’Ivoire','Mali','Burkina Faso','Niger','Guinée','Bénin','Togo','Cameroun','Gabon','Congo','RDC','Mauritanie','Maroc','Tunisie','Algérie','Madagascar','France','Belgique','Suisse','Canada'];
  const WEATHER_CITY_PRESETS = [
    {city:'Eulmont', postalCode:'54690', country:'France', lat:48.747, lon:6.230},
    {city:'Nancy', postalCode:'54000', country:'France', lat:48.692, lon:6.184},
    {city:'Dakar', postalCode:'', country:'Sénégal', lat:14.7167, lon:-17.4677},
    {city:'Abidjan', postalCode:'', country:'Côte d’Ivoire', lat:5.3600, lon:-4.0083},
    {city:'Bamako', postalCode:'', country:'Mali', lat:12.6392, lon:-8.0029},
    {city:'Ouagadougou', postalCode:'', country:'Burkina Faso', lat:12.3714, lon:-1.5197},
    {city:'Niamey', postalCode:'', country:'Niger', lat:13.5116, lon:2.1254},
    {city:'Conakry', postalCode:'', country:'Guinée', lat:9.6412, lon:-13.5784},
    {city:'Cotonou', postalCode:'', country:'Bénin', lat:6.3703, lon:2.3912},
    {city:'Lomé', postalCode:'', country:'Togo', lat:6.1725, lon:1.2314},
    {city:'Yaoundé', postalCode:'', country:'Cameroun', lat:3.8480, lon:11.5021},
    {city:'Libreville', postalCode:'', country:'Gabon', lat:0.4162, lon:9.4673},
    {city:'Brazzaville', postalCode:'', country:'Congo', lat:-4.2634, lon:15.2429},
    {city:'Kinshasa', postalCode:'', country:'RDC', lat:-4.4419, lon:15.2663},
    {city:'Nouakchott', postalCode:'', country:'Mauritanie', lat:18.0735, lon:-15.9582},
    {city:'Rabat', postalCode:'', country:'Maroc', lat:34.0209, lon:-6.8416},
    {city:'Tunis', postalCode:'', country:'Tunisie', lat:36.8065, lon:10.1815},
    {city:'Alger', postalCode:'', country:'Algérie', lat:36.7538, lon:3.0588},
    {city:'Antananarivo', postalCode:'', country:'Madagascar', lat:-18.8792, lon:47.5079},
    {city:'Bruxelles', postalCode:'', country:'Belgique', lat:50.8503, lon:4.3517},
    {city:'Genève', postalCode:'', country:'Suisse', lat:46.2044, lon:6.1432},
    {city:'Montréal', postalCode:'', country:'Canada', lat:45.5017, lon:-73.5673}
  ];
  WEATHER_CITY_PRESETS.push(
    {city:'Metz', postalCode:'57000', country:'France', lat:49.1193, lon:6.1757},
    {city:'Paris', postalCode:'75000', country:'France', lat:48.8566, lon:2.3522},
    {city:'Lyon', postalCode:'69000', country:'France', lat:45.7640, lon:4.8357},
    {city:'Marseille', postalCode:'13000', country:'France', lat:43.2965, lon:5.3698},
    {city:'Strasbourg', postalCode:'67000', country:'France', lat:48.5734, lon:7.7521},
    {city:'Thiès', postalCode:'', country:'Sénégal', lat:14.7910, lon:-16.9256},
    {city:'Saint-Louis', postalCode:'', country:'Sénégal', lat:16.0326, lon:-16.4818},
    {city:'Touba', postalCode:'', country:'Sénégal', lat:14.8667, lon:-15.8833},
    {city:'Kaolack', postalCode:'', country:'Sénégal', lat:14.1469, lon:-16.0726},
    {city:'Ziguinchor', postalCode:'', country:'Sénégal', lat:12.5680, lon:-16.2733},
    {city:'Bouaké', postalCode:'', country:'Côte d’Ivoire', lat:7.6906, lon:-5.0391},
    {city:'Yamoussoukro', postalCode:'', country:'Côte d’Ivoire', lat:6.8276, lon:-5.2893},
    {city:'Ségou', postalCode:'', country:'Mali', lat:13.4317, lon:-6.2157},
    {city:'Bobo-Dioulasso', postalCode:'', country:'Burkina Faso', lat:11.1771, lon:-4.2979},
    {city:'Douala', postalCode:'', country:'Cameroun', lat:4.0511, lon:9.7679},
    {city:'Pointe-Noire', postalCode:'', country:'Congo', lat:-4.7692, lon:11.8664},
    {city:'Lubumbashi', postalCode:'', country:'RDC', lat:-11.6876, lon:27.5026},
    {city:'Casablanca', postalCode:'', country:'Maroc', lat:33.5731, lon:-7.5898},
    {city:'Oran', postalCode:'', country:'Algérie', lat:35.6971, lon:-0.6308},
    {city:'Québec', postalCode:'', country:'Canada', lat:46.8139, lon:-71.2080}
  );
  function countryOptions(selected='France'){
    return FRANCOPHONE_COUNTRIES.map(c=>`<option value="${escapeAttr(c)}" ${String(selected)===c?'selected':''}>${escapeHtml(c)}</option>`).join('');
  }
  function weatherCitiesForCountry(country='France'){
    const c = String(country || 'France');
    const list = WEATHER_CITY_PRESETS.filter(x=>x.country===c);
    return list.length ? list : WEATHER_CITY_PRESETS.filter(x=>x.country==='France');
  }
  function findWeatherPreset(country='France', city=''){
    const nCity = normalizeText(city || '');
    const nCountry = normalizeText(country || '');
    return WEATHER_CITY_PRESETS.find(x=>normalizeText(x.country)===nCountry && normalizeText(x.city)===nCity)
      || WEATHER_CITY_PRESETS.find(x=>normalizeText(x.city)===nCity)
      || weatherCitiesForCountry(country)[0]
      || WEATHER_CITY_PRESETS[0];
  }
  function weatherCitySuggestionButtons(scope='settings', country='France', query='', selectedCity=''){
    const q = normalizeText(query || '');
    let list = weatherCitiesForCountry(country);
    if(q) list = list.filter(x=>normalizeText(x.city).includes(q) || normalizeText(x.postalCode).includes(q));
    if(!list.length) list = weatherCitiesForCountry(country).slice(0,6);
    return list.slice(0,10).map(x=>`<button type="button" class="weather-suggest-chip ${normalizeText(x.city)===normalizeText(selectedCity)?'active':''}" onclick="SuperApp.selectWeatherCity('${escapeAttr(scope)}','${escapeAttr(x.city)}','${escapeAttr(x.postalCode)}','${escapeAttr(x.country)}',${x.lat},${x.lon})"><span>📍</span><b>${escapeHtml(x.city)}</b><small>${escapeHtml(x.postalCode ? x.postalCode + ' — ' + x.country : x.country)}</small></button>`).join('');
  }
  function closestWeatherPreset(lat, lon){
    const toRad = d => Number(d) * Math.PI / 180;
    let best = WEATHER_CITY_PRESETS[0], bestD = Infinity;
    WEATHER_CITY_PRESETS.forEach(x=>{
      const dLat = toRad(Number(x.lat) - Number(lat));
      const dLon = toRad(Number(x.lon) - Number(lon));
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(x.lat)) * Math.sin(dLon/2)**2;
      const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if(d < bestD){ bestD = d; best = x; }
    });
    return {...best, distanceKm: bestD};
  }
  function unitOptions(selected='unité'){
    const units = ['unité','kg','L'];
    return units.map(u=>`<option value="${u}" ${String(selected||'unité')===u?'selected':''}>${u}</option>`).join('');
  }
  function unitStep(unit='unité'){
    return String(unit) === 'unité' ? '1' : '0.1';
  }
  function numberQty(item={}){
    if(item.quantity !== undefined && item.quantity !== '') return String(item.quantity).replace(',', '.');
    const m = String(item.qty||'').match(/([0-9]+(?:[,.][0-9]+)?)/);
    return m ? m[1].replace(',', '.') : '';
  }
  function unitFromItem(item={}){
    if(item.unit) return item.unit;
    const q = String(item.qty||'').toLowerCase();
    if(/\bkg\b/.test(q)) return 'kg';
    if(/\bl\b|litre/.test(q)) return 'L';
    return 'unité';
  }
  function normalizeQuantityForUnit(value, unit='unité'){
    const raw = String(value ?? '').replace(',', '.').trim();
    if(raw === '') return '';
    const n = Number(raw);
    if(!Number.isFinite(n) || n < 0) return '';
    if(String(unit) === 'unité') return String(Math.max(0, Math.round(n)));
    return String(Math.round(n * 10) / 10).replace('.', ',');
  }
  function decimalValue(value){
    const n = Number(String(value ?? '0').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function formatQtyNumber(value, unit='unité'){
    const n = decimalValue(value);
    if(String(unit) === 'unité') return String(Math.max(0, Math.round(n)));
    return String(Math.round(n * 10) / 10).replace('.', ',');
  }
  function qtyLabel(item={}){
    const q = numberQty(item);
    const u = unitFromItem(item);
    if(q) return `${formatQtyNumber(q,u)} ${u}`;
    return item.qty || '';
  }
  function setHomeVisibilityFields(item={}){
    const checked = item.showOnHome === false || item.afficherAccueil === false ? '' : 'checked';
    return `<section class="visibility-block home-visibility-field compact-visibility"><div class="visibility-title">Visibilité</div><label class="settings-notif-card compact"><input type="checkbox" name="showOnHome" ${checked}><div><span>🏠</span><b>Afficher sur l’accueil</b><small>Si décoché, l’élément reste visible dans son app et dans le calendrier s’il est daté.</small></div><em>${checked?'Oui':'Non'}</em></label></section>`;
  }
  function updateQuantityStep(unitSelect){
    const form = unitSelect?.closest('form') || document;
    const input = form.querySelector('[name="quantity"]');
    if(!input) return;
    const unit = unitSelect.value || 'unité';
    input.step = unitStep(unit);
    input.inputMode = unit === 'unité' ? 'numeric' : 'decimal';
    if(unit === 'unité') input.value = normalizeQuantityForUnit(input.value, unit);
  }
  
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.body.classList.add('pwa-install-available');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.body.classList.remove('pwa-install-available');
    try{ toast('✅ Application installée.'); }catch{}
  });
  async function installPwa(){
    if(deferredInstallPrompt){
      try{
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        document.body.classList.remove('pwa-install-available');
        return;
      }catch(err){ console.warn('Installation PWA impossible', err); }
    }
    toast('Sur Android : ouvre le menu Chrome ⋮ puis choisis “Installer l’application” ou “Ajouter à l’écran d’accueil”.');
  }
  function isAndroidDevice(){
    return /Android/i.test(navigator.userAgent || '');
  }
  function bindAndroidDialogSafety(){
    const closeIf = (selector, handler) => {
      document.addEventListener('pointerup', event => {
        if(!isAndroidDevice()) return;
        const btn = event.target?.closest?.(selector);
        if(!btn) return;
        event.preventDefault();
        event.stopPropagation();
        handler(event, btn);
      }, {capture:true});
      document.addEventListener('touchend', event => {
        if(!isAndroidDevice()) return;
        const btn = event.target?.closest?.(selector);
        if(!btn) return;
        event.preventDefault();
        event.stopPropagation();
        handler(event, btn);
      }, {capture:true, passive:false});
    };
    closeIf('#cancelEdit,#closeEdit', () => closeEditDialog());
    closeIf('#closeAction', () => closeActionDialog());
    closeIf('#editForm button[type="submit"]', (event, btn) => {
      const form = btn.closest('form');
      if(!form || form.dataset.androidSubmitting === '1') return;
      form.dataset.androidSubmitting = '1';
      setTimeout(()=>{ delete form.dataset.androidSubmitting; }, 700);
      if(typeof form.requestSubmit === 'function') form.requestSubmit(btn);
      else form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
    });
  }

  function init(){
    applyAppearance();
    sanitizeLegacyPersonalDemoData();
    normaliseCalendarProjections();
    bindNavigation(); bindDialogs(); bindAndroidDialogSafety(); render();
    autoRefreshWeatherOnOpen();
    if(window.matchMedia){
      try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAppearance); } catch {}
    }
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js', {scope:'./'}).catch(()=>{}); }
    maybeStartOnboarding();
    setTimeout(()=>maybeFireNotifications(), 800);
    setTimeout(()=>{ if(typeof window.sbInitAuth==="function") window.sbInitAuth(); }, 400);
  }

  function setView(view){
    // V5.27 — Audit scroll : ne remonter en haut QUE si on change effectivement de vue,
    // pas si on rappelle setView sur la vue actuelle (ex. après une action interne).
    const wasSameView = state.view === view;
    state.view=view;
    $$('.view').forEach(v=>v.classList.toggle('active', v.dataset.view===view));
    $$('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.target===view));
    updateHeader(); render();
    if(!wasSameView){
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }
    function bindNavigation(){
    $$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{ if(btn.dataset.target==='apps') state.appsView=null; setView(btn.dataset.target); }));
    $('#quickNotificationBtn').addEventListener('click',()=>setView('notifications'));
    $('#fab').addEventListener('click',()=>openQuickActions());
    document.addEventListener('click', handleDelegatedCardAction);
    document.addEventListener('keydown', e=>{
      if((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('[data-action]')){
        e.preventDefault();
        runCardAction(e.target.dataset.action);
      }
    });
  }
  function handleDelegatedCardAction(e){
    const target = e.target.closest('[data-action]');
    if(!target) return;
    if(e.target.closest('button,a,input,select,textarea')) return;
    runCardAction(target.dataset.action);
  }
  function parseActionArgs(raw){
    // Parseur d'arguments sécurisé : supporte strings entre guillemets simples/doubles,
    // nombres, booléens, null, undefined — sans eval ni Function().
    if(!raw || !raw.trim()) return [];
    const args = [];
    let i = 0;
    const skip = () => { while(i < raw.length && raw[i] === ' ') i++; };
    const readString = (quote) => {
      let s = ''; i++; // saute le guillemet ouvrant
      while(i < raw.length && raw[i] !== quote){
        if(raw[i] === '\\' && i+1 < raw.length){ i++; s += raw[i]; }
        else s += raw[i];
        i++;
      }
      i++; // saute le guillemet fermant
      return s;
    };
    while(i < raw.length){
      skip();
      if(i >= raw.length) break;
      const c = raw[i];
      if(c === "'" || c === '"'){ args.push(readString(c)); }
      else if(c === '-' || (c >= '0' && c <= '9')){
        let n = '';
        if(c === '-'){ n += c; i++; }
        while(i < raw.length && (raw[i] >= '0' && raw[i] <= '9' || raw[i] === '.')) n += raw[i++];
        args.push(Number(n));
      }
      else if(raw.startsWith('true', i)){ args.push(true); i += 4; }
      else if(raw.startsWith('false', i)){ args.push(false); i += 5; }
      else if(raw.startsWith('null', i)){ args.push(null); i += 4; }
      else { i++; } // caractère inattendu : on saute
      skip();
      if(raw[i] === ',') i++; // séparateur
    }
    return args;
  }
  function runCardAction(action){
    if(!action) return;
    const match = String(action).match(/^SuperApp\.([A-Za-z0-9_]+)\((.*)\)$/s);
    if(!match || !window.SuperApp || typeof window.SuperApp[match[1]] !== 'function') return;
    try {
      const args = parseActionArgs(match[2]);
      window.SuperApp[match[1]](...args);
    } catch(err){
      console.warn('Action de carte impossible', action, err);
    }
  }

  function bindDialogs(){
    $('#cancelEdit')?.addEventListener('click', closeEditDialog);
    $('#closeEdit')?.addEventListener('click', closeEditDialog);
    $('#closeAction')?.addEventListener('click', closeActionDialog);
    $('#editForm').addEventListener('submit', e=>{
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const type = e.currentTarget.dataset.type;
      const wantsSlvChecklistAfterSave = e.submitter && (e.submitter.name === 'openChecklistAfterSave' || e.submitter.dataset?.openChecklist === '1');
      const wantsGenericChecklistAfterSave = e.submitter && e.submitter.dataset?.openGenericChecklist === '1';
      const genericChecklistKind = e.submitter?.dataset?.checklistKind || '';
      const item = Object.fromEntries(form.entries());
      const multiStudents = e.currentTarget.querySelector('select[name="students"][multiple]');
      if(multiStudents) item.students = [...multiStudents.selectedOptions].map(o=>o.value).join(',');
      const checkedMembers = e.currentTarget.querySelectorAll('[name="members_cb"]:checked');
      if(checkedMembers.length){
        const hasFamily=[...checkedMembers].some(c=>c.value==='family');
        const vals=[...checkedMembers].map(c=>c.value).filter(v=>v&&v!=='family');
        item.members = hasFamily || !vals.length ? 'family' : vals.join(',');
      }
      if(e.currentTarget.querySelector('[name="showOnHome"]')) item.showOnHome = form.has('showOnHome');
      const checkedWeekDays = e.currentTarget.querySelectorAll('[name="treatmentWeekDays_cb"]:checked');
      if(checkedWeekDays.length) item.treatmentWeekDays = [...checkedWeekDays].map(c=>c.value).join(',');
      const checkedMoments = e.currentTarget.querySelectorAll('[name="doseMoments_cb"]:checked');
      if(checkedMoments.length) item.doseMoments = [...checkedMoments].map(c=>c.value).join(',');
      if(String(type).startsWith('settings_')){ saveSettingsForm(type,item,e.currentTarget.dataset.id || ''); return; }
      if(type === 'settings' || type === 'reset_confirm'){ closeEditDialog(); return; }
      const docModule = canonicalModuleId(type);
      const wasNewDocModule = supportsSupabaseDocs(docModule) && !e.currentTarget.dataset.id;
      const savedRecord = addItem(type,item);
      const backToList = state.returnList ? {...state.returnList} : null;
      state.preset=null;
      if(savedRecord && wantsGenericChecklistAfterSave){
        closeEditDialog();
        setTimeout(()=>openGenericChecklist(savedRecord.id, genericChecklistKind || (docModule==='education' ? 'education' : 'maison')), 90);
        return;
      }
      if(savedRecord && wasNewDocModule){
        state.editing = findRecord(savedRecord.id);
        $('#editTitle').textContent = 'Modifier l’élément';
        $('#editForm').dataset.type = docModule;
        $('#editForm').dataset.id = savedRecord.id;
        $('#editFields').innerHTML = fieldsFor(docModule, savedRecord);
        toast('✅ Fiche enregistrée. Tu peux maintenant déposer un document.');
        setTimeout(()=>window.sbHydrateHealthItemDocs?.(savedRecord.id, docModule), 120);
        return;
      }
      closeEditDialog();
      // V5.7 : addItem est autonome (save + render inclus), pas besoin de relancer ici.
      if(savedRecord && canonicalModuleId(type)==='sport_loisirs' && wantsSlvChecklistAfterSave){
        setTimeout(()=>openSlvChecklistLight(savedRecord.id), 90);
      } else {
        if(backToList) setTimeout(()=>openModuleList(backToList.module, backToList.block), 30);
        if(savedRecord && canonicalModuleId(type)==='sport_loisirs') setTimeout(()=>refreshSlvChecklistDialog(savedRecord.id), 80);
      }
    });

    // Sélection exclusive : Toute la famille OU membres individuels, jamais les deux.
    $('#editForm').addEventListener('change', e=>{
      const box = e.target?.closest?.('input[type="checkbox"][name="students_cb"], input[type="checkbox"][name="members_cb"]');
      if(!box) return;
      const name = box.name;
      const all = [...$('#editForm').querySelectorAll(`input[name="${name}"]`)];
      if(box.value === 'family' && box.checked){ all.forEach(c=>{ if(c!==box) c.checked=false; }); }
      else if(box.checked){ const fam = all.find(c=>c.value==='family'); if(fam) fam.checked=false; }
      const hidden = document.getElementById(name === 'students_cb' ? 'studentsHidden' : 'membersHidden');
      if(hidden){
        const checked = all.filter(c=>c.checked);
        const vals = checked.map(c=>c.value).filter(v=>v && v!=='family');
        hidden.value = checked.some(c=>c.value==='family') || !vals.length ? 'family' : vals.join(',');
      }
    });
    $('#importInput').addEventListener('change', async e=>{
      const file = e.target.files[0]; if(!file) return;
      try {
        const txt = await file.text();
        if(!txt || !txt.trim()) throw new Error('Fichier vide.');
        const report = importPayload(JSON.parse(txt));
        try{ localStorage.removeItem('superapp_local_delete_guard'); window._sbLocalDeleteGuard=false; }catch{}
        save(); render();
        toast(`✅ Import JSON réussi — ${report.added} ajouté(s), ${report.updated} mis à jour.`);
        setView('home');
      }
      catch(err) { infoDialog('Fichier JSON invalide ou incompatible : ' + (err.message || err)); }
      e.target.value='';
    });
  }

  function toast(msg){
    let t = document.getElementById('appToast');
    if(!t){ t = document.createElement('div'); t.id='appToast'; t.className='app-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(t._timer); t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
  }
  // Remplace confirm() natif : modale designée avec callback
  function confirmDialog(message, onConfirm, opts={}){
    let dlg = document.getElementById('appConfirmDialog');
    if(!dlg){
      dlg = document.createElement('dialog');
      dlg.id = 'appConfirmDialog';
      dlg.className = 'dialog-card';
      dlg.innerHTML = `<div class="form-stack"><p id="appConfirmMsg" style="margin:8px 0 4px;line-height:1.5"></p></div>
        <footer class="dialog-actions">
          <button class="btn ghost" id="appConfirmCancel">Annuler</button>
          <button class="btn primary danger" id="appConfirmOk">Confirmer</button>
        </footer>`;
      document.body.appendChild(dlg);
    }
    dlg.querySelector('#appConfirmMsg').textContent = message;
    const okBtn = dlg.querySelector('#appConfirmOk');
    okBtn.textContent = opts.confirmLabel || 'Confirmer';
    okBtn.className = 'btn ' + (opts.danger !== false ? 'primary danger' : 'primary');
    const close = () => { try{ dlg.close(); }catch{} };
    const newOk = okBtn.cloneNode(true);
    okBtn.replaceWith(newOk);
    newOk.addEventListener('click', () => { close(); onConfirm(); });
    dlg.querySelector('#appConfirmCancel').onclick = close;
    try{ dlg.showModal(); }catch{ dlg.setAttribute('open',''); }
  }
  // Remplace alert() natif : toast enrichi ou modale simple selon contexte
  function infoDialog(message){
    let dlg = document.getElementById('appInfoDialog');
    if(!dlg){
      dlg = document.createElement('dialog');
      dlg.id = 'appInfoDialog';
      dlg.className = 'dialog-card';
      dlg.innerHTML = `<div class="form-stack"><p id="appInfoMsg" style="margin:8px 0 4px;line-height:1.5"></p></div>
        <footer class="dialog-actions"><button class="btn primary" id="appInfoOk">OK</button></footer>`;
      document.body.appendChild(dlg);
    }
    dlg.querySelector('#appInfoMsg').textContent = message;
    dlg.querySelector('#appInfoOk').onclick = () => { try{ dlg.close(); }catch{} };
    try{ dlg.showModal(); }catch{ dlg.setAttribute('open',''); }
  }
  function render(){
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    applyAppearance();
    renderHome(); renderCalendar(); renderApps(); renderNotifications(); renderSettings(); updateBadges();
    const familyMini = document.getElementById('familyMiniImg');
    if(familyMini){
      familyMini.src = profileAvatar();
      familyMini.style.display = '';
    }
    if(state.view==='apps') restoreAppsView();
    // Restaurer la position seulement si on reste sur la même vue (évite les micro-sauts après action)
    // setView() gère lui-même le scroll vers 0 lors des changements de vue
    if(scrollY > 50){
      requestAnimationFrame(()=> window.scrollTo({top: scrollY, behavior: 'instant'}));
    }
  }
  function restoreAppsView(){
    const v = state.appsView; if(!v) return;            // null = grille des apps (déjà peinte)
    if(v.kind==='module') paintModule(v.id, v.focus||'');
    else if(v.kind==='list') paintModuleList(v.module, v.block);
    else if(v.kind==='budget') paintBudgetBoard();
    else if(v.kind==='slvDetail') paintSlvActivityDetail(v.id);
    else if(v.kind==='slvChecklist') paintSlvChecklistPage(v.id);
    else if(v.kind==='genericChecklist') paintGenericChecklistPage(v.id, v.checklistKind || 'maison');
  }
  function updateBadges(){
    const count = forActiveProfile(getNotifications()).filter(n=>!n.done).length;
    $('#topBadge').textContent = count; $('#navNotifBadge').textContent = count;
    $('#topBadge').style.display = count ? 'grid':'none'; $('#navNotifBadge').style.display = count ? 'grid':'none';
  }

    function filteredEvents(events){
    let arr = Array.isArray(events) ? events : [];
    if(state.calendarFilter !== 'all'){
      const module = canonicalModuleId(state.calendarFilter);
      arr = arr.filter(x=>canonicalModuleId(x.module) === module);
      const memberId = activeMemberFilter ? activeMemberFilter(module) : 'all';
      if(memberId && memberId !== 'all') arr = arr.filter(x=>itemMatchesMember(x, memberId));
    }
    return arr;
  }
  function itemsForDate(dmy){ return filteredEvents(getAllEvents().filter(x=>x.date===dmy)); }
    // ---- Profil actif + notifications personnelles par membre (V4.5) ----------
  function activeProfile(){ return data.settings?.activeProfile || 'family'; }
  function isMemberProfile(){ const p=activeProfile(); return p && p !== 'family'; }
  function belongsToProfile(member){ const p=activeProfile(); if(p==='family') return true; return member===p || member==='family' || !member; }
  function forActiveProfile(notices){ return (notices||[]).filter(n=>belongsToProfile(n.member)); }
  function profileLabel(){ const p=activeProfile(); return p==='family' ? 'Toute la famille' : (data.family.find(m=>m.id===p)?.name || 'Moi'); }
  function profileFirstName(){ const p=activeProfile(); if(p==='family') return 'la famille'; return (data.family.find(m=>m.id===p)?.name || '').split(' ')[0] || 'toi'; }
  function familyDisplayName(){ return String(data.settings?.familyName || '').trim() || 'la famille'; }
  function familyGreetingName(){
    const name = familyDisplayName();
    if(!name || normalizeText(name)==='la famille') return 'la famille';
    return normalizeText(name).startsWith('famille') ? `la ${name}` : `la famille ${name}`;
  }
    function setActiveProfile(id){ data.settings.activeProfile = id || 'family'; save(); closeProfileSheet(); render(); maybeFireNotifications(); }
  function closeProfileSheet(){ document.getElementById('profileSheet')?.remove(); }
  function openProfilePicker(){
    closeProfileSheet();
    const wrap=document.createElement('div'); wrap.id='profileSheet'; wrap.className='onboarding-backdrop';
    const opt=(id,name,avatar,sub)=>`<button type="button" class="profile-opt ${activeProfile()===id?'picked':''}" onclick="SuperApp.setActiveProfile('${id}')"><img src="${avatar}" alt="" onerror="this.style.visibility='hidden'"><b>${name}</b><small>${sub}</small></button>`;
    const members = data.family.map(m=>opt(m.id, m.name, memberAvatarSrc(m), m.role||'Membre')).join('');
    const notifState = notifyEnabled() ? 'Rappels activés sur cet appareil ✅' : 'Activer les rappels sur cet appareil';
    wrap.innerHTML = `<div class="onboarding-card"><div class="onb-head"><span>QUI UTILISE CET APPAREIL ?</span><h2>Choisis ton profil</h2><p>Tu verras d'abord <b>tes rappels personnels</b> (médicaments, tâches, activités…), en plus de ce qui concerne toute la famille.</p></div>
      <div class="profile-list">${opt('family','Toute la famille',profileAvatar(),'Vue d’ensemble')}${members}</div>
      <div class="onb-actions"><button type="button" class="btn ghost" onclick="SuperApp.requestNotify()">🔔 ${notifState}</button><button type="button" class="btn primary" onclick="SuperApp.closeProfileSheet()">Fermer</button></div></div>`;
    document.body.appendChild(wrap);
  }
  // ---- Notifications locales du navigateur (membre actif) -------------------
  function notifyEnabled(){ try { return typeof Notification!=='undefined' && Notification.permission==='granted'; } catch { return false; } }
  function requestNotify(){
    try {
      if(typeof Notification==='undefined'){ infoDialog('Ce navigateur ne gère pas les notifications.'); return; }
      data.settings.notifyPermissionAsked = true; save();
      Notification.requestPermission().then(p=>{ closeProfileSheet(); if(p==='granted'){ toast('🔔 Rappels activés sur cet appareil.'); maybeFireNotifications(true); } });
    } catch {}
  }
  let _notified = new Set();
  function maybeFireNotifications(force=false){
    if(!notifyEnabled()) return;
    const due = forActiveProfile(getNotifications()).filter(n=>n.time==='Aujourd’hui' && !n.done);
    due.forEach(n=>{
      const key = activeProfile()+'|'+n.id+'|'+today;
      if(!force && _notified.has(key)) return;
      _notified.add(key);
      try { new Notification(n.title, {body:n.desc, tag:key, icon:'assets/icons/icon_sante.png'}); } catch {}
    });
  }
  
  function noticeVisibleOnHome(n){
    const found = findRecord(n.id);
    if(!found?.item) return true;
    return found.item.showOnHome !== false && found.item.afficherAccueil !== false;
  }
  function renderHome(){
    const profileNotices = forActiveProfile(getNotifications()).filter(noticeVisibleOnHome);
    const todayItems = profileNotices.filter(n=>n.time==='Aujourd’hui');
    const digest = [...todayItems, ...profileNotices.filter(n=>n.time!=='Aujourd’hui')].slice(0,6);
    const who = isMemberProfile() ? profileFirstName().replace(/^./,c=>c.toUpperCase()) : familyGreetingName();
    const greeting = isMemberProfile() ? `Bonjour ${who} 👋` : `Bonjour ${who} 👋`;
    const digestRows = digest.length
      ? digest.map(n=>homeDigestRow(n)).join('')
      : `<div class="empty cute-empty"><b>🎉 Tout est réglé pour ${who} aujourd’hui</b><small>Rien d’urgent. Profite du moment.</small></div>`;
    // V5.27 — Carte Repas du jour CONDITIONNELLE (s'affiche seulement si au moins un repas planifié)
    const todayIdx = (new Date().getDay() + 6) % 7;
    const meals = (data.weeklyMeals || []).filter(x=>!statusIsHidden(x));
    const todayMidi = meals.find(m=>Number(m.day)===todayIdx && (m.slot||'soir')==='midi');
    const todaySoir = meals.find(m=>Number(m.day)===todayIdx && (m.slot||'soir')==='soir');
    let mealsCardHtml = '';
    if(todayMidi || todaySoir){
      const cell = (slot, meal)=>{
        const ico = slot==='midi'?'🌞':'🌙';
        const lbl = slot==='midi'?'Midi':'Soir';
        if(meal){
          return `<div class="home-meal-cell filled"><span class="ico">${ico}</span><span class="lbl">${lbl}</span><b>${escapeHtml(meal.title)}</b></div>`;
        }
        return `<button class="home-meal-cell empty" onclick="event.stopPropagation();SuperApp.openAddWeeklyMeal(${todayIdx},'${slot}')"><span class="ico">${ico}</span><span class="lbl">${lbl}</span><span class="plus">＋</span></button>`;
      };
      mealsCardHtml = `<article class="home-meals-card clickable-card" onclick="SuperApp.openModule('courses_repas','repas')">
        <div class="home-meals-head"><b>🍽️ Aujourd'hui à table</b></div>
        <div class="home-meals-grid">${cell('midi', todayMidi)}${cell('soir', todaySoir)}</div>
      </article>`;
    }

    // V5.27 — Indicateur courses CONDITIONNEL (uniquement si liste non vide)
    const openShopping = (data.shopping || []).filter(x=>!statusIsHidden(x) && !statusIsDone(x));
    let shoppingHintHtml = '';
    if(openShopping.length){
      shoppingHintHtml = `<article class="home-shopping-hint clickable-card" onclick="SuperApp.openModule('courses_repas','courses')">
        <span class="ico">🛒</span>
        <div><b>${openShopping.length} ${openShopping.length>1?'courses en attente':'course en attente'}</b><small>Toucher pour voir la liste</small></div>
        <span class="chev">›</span>
      </article>`;
    }

    $('#view-home').innerHTML = `
      <article class="home-hero clickable-card" onclick="SuperApp.openProfilePicker()">
        <div class="hero-copy"><span>SUPERAPP FAMILLE</span><h2>${greeting}</h2><p>${isMemberProfile()?'Voici ta journée. Touche pour changer de profil.':'Voici les informations importantes de votre foyer aujourd’hui.'}</p></div>
        <img src="${profileAvatar()}" alt="" onerror="this.style.display='none'" />
      </article>
      ${sbUserBarHtml()}
      <article class="card weather weather-premium clickable-card" onclick="SuperApp.openSettings('localisation')">
        <div class="sun" aria-label="Icône météo">${currentWeatherIcon()}</div><div><strong>${weatherTemperatureText()}</strong><br><small>${weatherMainLine()}</small></div>
        <div class="right"><b>${weatherCityLabel()}</b><br><small>${weatherSummary()}</small><br><small>${weatherUpdatedText()}</small></div>
      </article>
      ${mealsCardHtml}
      ${shoppingHintHtml}
      <div class="section-title"><h2>${isMemberProfile()?'Ma journée':'Aujourd’hui pour la famille'}</h2><span>${displayDate(today).replace(/^./,c=>c.toUpperCase())}</span></div>
      <div class="digest-list">${digestRows}</div>
      <div class="section-title"><h2>Mes apps</h2><button class="link-btn" onclick="SuperApp.setView('apps')">Voir tout</button></div>
      <div class="app-grid visual-grid">
        ${modules.filter(m=>m.id !== 'calendrier').map(moduleTileSmall).join('')}
      </div>`;
  }
  function moduleImage(m,variant='tile'){
    return `<div class="app-icon-large ${variant}" aria-hidden="true"><span>${m.icon}</span></div>`;
  }
  // V5.9 — Cartes uniformes : grande icône emoji centrée, mêmes dimensions partout (accueil + Applications).
  function moduleTileSmall(m){
    const active=isAppActive(m.id);
    return `<button class="app-tile-v59 ${m.cls} ${active?'':'locked'}" onclick="${active?`SuperApp.openModule('${m.id}')`:`SuperApp.openActivationPanel('${m.id}')`}">
      <div class="app-tile-icon app-tile-icon-logo">${appLogoHtml(m.id, 72)}</div>
      <h3 class="app-tile-label">${m.short}</h3>
      <span class="app-tile-count">${active?countForModule(m.id):'🔒'}</span>
    </button>`;
  }
  function moduleTileLarge(m){
    const active=isAppActive(m.id); const rec=appRecord(m.id);
    return `<button class="app-tile-v59 large ${m.cls} ${active?'':'locked'}" onclick="${active?`SuperApp.openModule('${m.id}')`:`SuperApp.openActivationPanel('${m.id}')`}">
      <div class="app-tile-icon app-tile-icon-logo">${appLogoHtml(m.id, 96)}</div>
      <h3 class="app-tile-label">${m.short}</h3>
      <p class="app-tile-desc">${active ? countForModule(m.id) + ' · à voir' : 'À activer'}</p>
      ${!active ? `<span class="app-tile-locked-mark">🔒</span>` : ''}
    </button>`;
  }

  function renderApps(){ $('#view-apps').innerHTML = `<div class="app-grid large">${modules.filter(m=>m.id !== 'calendrier').map(moduleTileLarge).join('')}</div>`; }

  function openModule(id, focusKey=''){
    state.returnList = null;
    id = canonicalModuleId(id);
    if(!ensureActiveAccess(id)) return;
    if(id==='calendrier'){ state.appsView=null; setView('calendar'); return; }
    state.appsView = {kind:'module', id, focus:focusKey};
    setView('apps');          // render() -> restoreAppsView() -> paintModule()
  }
    function moduleContent(id){
    if(id==='courses_repas') return foodModuleContent();
    if(id==='maison') return homeModuleContent();
    if(id==='education') return educationModuleContent();
    if(id==='sante') return healthModuleContent();
    if(id==='sport_loisirs') return sportModuleContent();
    if(id==='familles') return familyModuleContent();
    return '';
  }

    function subsection(title, action, body){
    return `<div class="section-title compact-title"><h2>${title}</h2>${action || ''}</div>${body}`;
  }
  const cardImg = name => `assets/images/cards/${String(name).replace(/\.png$/,'')}.png`;  // accepte 'nom' ou 'nom.png' sans casser le chemin
  function playfulBlock(opts){
    const {title, emoji='', img='', tone='neutral', body='', action='', kicker='', block='', onClick=''} = opts || {};
    const click = onClick ? ` onclick="if(!event.target.closest('button,a,input,select,textarea')){${onClick}}"` : '';
    const tab = onClick ? ' tabindex="0" role="button"' : '';
    return `<article class="play-block ${tone} ${onClick?'clickable-card':''}" ${block ? `data-block="${block}"` : ''}${tab}${click}>
      ${img ? `<div class="play-image"><img src="${img}" alt="" loading="lazy" onerror="this.closest(\'.play-image\').style.display=\'none\';"></div>` : ''}
      <div class="play-head"><div><span>${kicker || 'Espace'}</span><h3>${emoji ? emoji+' ' : ''}${title}</h3></div>${action || ''}</div>
      <div class="play-body">${body}</div>
    </article>`;
  }
  function rowList(items, icon, label, empty='Aucun élément.'){ const visible=(items||[]).filter(x=>!statusIsHidden(x)); return `<div class="agenda-list">${visible.length ? visible.map(x=>agendaRow(x,icon,label)).join('') : `<div class="empty">${empty}</div>`}</div>`; }
  function fusedBlock(module, block, title, emoji, tone, kicker, body, action=''){
    return playfulBlock({title, block, onClick:`SuperApp.openModuleList('${module}','${block}')`, emoji, img:'', tone, kicker, action, body});
  }
  function miniChips(list){ return `<div class="settings-chips embedded">${list.map(x=>`<span>${x}</span>`).join('')}</div>`; }
          function xIconHealth(){ return '💗'; }
      function ageFromBirth(birth){
    const b = parseDMY(birth); if(!b) return '';
    const now = todayObj;
    let age = now.getFullYear() - b.getFullYear();
    const beforeBirthday = (now.getMonth() < b.getMonth()) || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
    if(beforeBirthday) age--;
    return `${age} ans`;
  }
  function shortMemberName(name){
    const parts = String(name || '').trim().split(/\s+/);
    if(parts.length <= 2) return name;
    return `${parts[0]} ${parts[parts.length-1]}`;
  }
  function firstMemberName(name){
    return String(name || '').trim().split(/\s+/)[0] || 'Membre';
  }
    function memberDossierTiles(m){
    const tiles = [
      ['🪪','Carte d’identité','Identité'],
      ['🟩','Passeport','Identité'],
      ['🎓','Diplômes','Scolarité'],
      ['💗','Santé','Santé'],
      ['📚','Scolarité','Scolarité'],
      ['🛡️','Assurances','Administratif']
    ];
    return tiles.map(([icon,title,category])=>`<button class="member-doc-tile" type="button" onclick="SuperApp.openMemberDocList('${m.id}','${category}','${title}')"><span>${icon}</span><b>${title}</b><small>${category}</small></button>`);
  }
  function docCard(d){
    return `<article class="doc-card"><div class="agenda-icon">📄</div><div><b>${d.title}</b><small>${d.desc || d.category}</small></div><span>Prévu</span></article>`;
  }


  const MODULE_LISTS = {
    maison: {
      taches:{title:'Tout', emoji:'🏠', collection:'tasks', type:'tache', category:'Ménage', help:'Tâches, entretien, routines et checklists.'},
      maison_tache:{title:'Tâches', emoji:'🧹', collection:'tasks', type:'tache', category:'Ménage', help:'Tâches maison.'},
      maison_entretien:{title:'Entretiens', emoji:'🔧', collection:'tasks', type:'entretien', category:'Entretien', help:'Entretiens et réparations.'},
      maison_routine:{title:'Routines', emoji:'🔁', collection:'tasks', type:'routine', category:'Routine', help:'Routines récurrentes.'},
      taches_aujourdhui:{title:'Tâches Maison — aujourd’hui', emoji:'🏠', collection:'tasks', type:'tache', category:'Ménage', filter:x=>x.date===today, help:'Filtre aujourd’hui.'},
      taches_retard:{title:'Tâches Maison — en retard', emoji:'⏰', collection:'tasks', type:'tache', category:'Urgence', filter:x=>!statusIsDone(x) && x.date && daysDiff(today,x.date)<0, help:'Filtre en retard.'},
      taches_par_membre:{title:'Tâches Maison — par membre', emoji:'👨‍👩‍👧‍👦', collection:'tasks', type:'tache', category:'Ménage', sortByMember:true, help:'Vue regroupée par membre.'},
      taches_recurrentes:{title:'Tâches Maison — récurrentes', emoji:'🔁', collection:'tasks', type:'tache', category:'Routine', filter:x=>/routine|récurrent|recurr/i.test(String(x.category||x.title||'')), help:'Routines et tâches récurrentes.'},
    },
    courses_repas: {
      // V5.27 — Refonte : 3 chips claires, indépendantes
      tout:{title:'Tout', emoji:'🍽️', collections:['shopping','weeklyMeals','stock'], collection:'shopping', type:'course', category:'Courses', help:'Courses, repas et stock.', special:'coursesAllView'},
      repas:{title:'Repas', emoji:'🍽️', collection:'weeklyMeals', type:'repas_semaine', category:'Repas', help:'Repas du jour en vedette et menu de la semaine.', special:'mealsView'},
      courses:{title:'Courses', emoji:'🛒', collection:'shopping', type:'course', category:'Alimentation', help:'Liste de courses cochable, ajout manuel.'},
      stock:{title:'Stock', emoji:'🧺', collection:'stock', type:'stock', category:'Stock', help:'Frigo, congélateur, placards.', special:'stockView'},
      // alias rétrocompatibles (anciens raccourcis du calendrier, notifications, etc.)
      menu_semaine:{title:'Repas', emoji:'🍽️', collection:'weeklyMeals', type:'repas_semaine', category:'Repas', help:'Voir les repas.', special:'mealsView', aliasOf:'repas'},
      menu_jour:{title:'Repas', emoji:'🍽️', collection:'weeklyMeals', type:'repas_semaine', category:'Repas', help:'Voir les repas.', special:'mealsView', aliasOf:'repas'},
      stock_faible:{title:'Stock', emoji:'🧺', collection:'stock', type:'stock', category:'Stock', filter:x=>String(x.level||'').toLowerCase()==='faible', special:'stockView', aliasOf:'stock'},
      budget_courses:{title:'Budget courses', emoji:'💶', special:'budget', help:'Mini suivi du budget.'},
      menus:{title:'Repas', emoji:'🍽️', collection:'weeklyMeals', type:'repas_semaine', category:'Repas', special:'mealsView', aliasOf:'repas'}
    },
    education: {
      tout:{title:'Tout', emoji:'📚', collections:['homework','schoolDocs'], collection:'homework', type:'devoir', category:'Devoirs', help:'École, notes et documents.'},
      ecole:{title:'École', emoji:'📚', collections:['homework','schoolDocs'], collection:'homework', type:'devoir', category:'Devoirs', help:'Devoirs, contrôles et activités.'},
      ecole_notes:{title:'École — Notes', emoji:'⭐', collection:'homework', type:'note', category:'Notes', filter:x=>x.type==='note' || x.category==='Notes', help:'Notes et appréciations.'},
      documents:{title:'Documents Éducation', emoji:'📄', collection:'schoolDocs', type:'document_ecole', category:'Documents école', help:'Documents Supabase liés aux devoirs, notes et fiches Éducation.'},
    },
    sante: {
      tous:{title:'Tous', emoji:'🩺', collections:['health','vaccines','healthDocs'], collection:'health', type:'rendez_vous_medical', category:'Santé', help:'Rendez-vous, traitements, documents et alertes santé du foyer.'},
      rendez_vous:{title:'Rendez-vous', emoji:'🩺', collection:'health', type:'rendez_vous_medical', category:'Rendez-vous', filter:x=>x.type==='appointment' || x.type==='rendez_vous_medical', help:'Rendez-vous médicaux datés.'},
      traitements:{title:'Traitements', emoji:'💊', collection:'health', type:'traitement', category:'Traitements', filter:x=>!(x.type==='appointment' || x.type==='rendez_vous_medical'), help:'Médicaments, traitements, soins et prescriptions dans une seule liste.'},
      documents:{title:'Documents', emoji:'📄', collections:['vaccines','healthDocs'], collection:'healthDocs', type:'document_sante', category:'Documents santé', help:'Vaccins, ordonnances, mutuelle et documents santé.'},
      alertes:{title:'Alertes', emoji:'🔔', collections:['health','vaccines','healthDocs'], collection:'health', type:'rappel', category:'Alertes', help:'Échéances santé proches et rappels importants.'},
      carnet_sante:{title:'Carnet de santé', emoji:'📘', collections:['vaccines','healthDocs','emergency'], collection:'healthDocs', type:'document_sante', category:'Documents santé', help:'Vaccins, documents santé et informations d’urgence.'}
    },
    sport_loisirs: {
      tout:{title:'Tout — Sport, Loisir & Voyage', emoji:'▦', collections:['sports','loisirs','voyages'], collection:'sports', type:'activite', category:'Sport', help:'Vue globale organisée par univers.'},
      sport_activites:{title:'Activités Sport', emoji:'⚽', collection:'sports', type:'activite', category:'Sport', help:'Activités sportives.'},
      sport_checklist:{title:'Checklist Sport', emoji:'✅', collection:'sportGear', type:'materiel_sport', category:'Matériel', special:'checklistView', help:'Affaires sport.'},
      loisir_activites:{title:'Activités Loisirs', emoji:'🎨', collection:'loisirs', type:'loisir', category:'Loisir', help:'Loisirs familiaux.'},
      loisir_checklist:{title:'Checklist Loisirs', emoji:'✅', collection:'loisirGear', type:'materiel_loisir', category:'Matériel loisir', special:'checklistView', help:'Affaires loisir.'},
      voyage_activites:{title:'Activités Voyage', emoji:'✈️', collection:'voyages', type:'voyage', category:'Voyage', help:'Voyages et séjours.'},
      voyage_checklist:{title:'Checklist Voyage', emoji:'✅', collection:'voyageGear', type:'materiel_voyage', category:'Bagages', special:'checklistView', help:'Bagages.'},
      activites:{title:'Activités', emoji:'⚽', collection:'sports', type:'activite', category:'Sport', aliasOf:'sport_activites', help:'Alias.'},
      materiel:{title:'Matériel', emoji:'🎒', collection:'sportGear', type:'materiel_sport', category:'Matériel', aliasOf:'sport_checklist', special:'checklistView', help:'Alias.'},
      documents:{title:'Documents Sport / Loisir / Voyage', emoji:'📄', collection:'sportGear', type:'document_sport', category:'Documents', help:'Documents Supabase liés aux activités sport, loisir et voyage.'},
    },
    familles: {
      tout:{title:'Tout', emoji:'▦', collection:'familyDocuments', type:'document_famille', category:'Famille', help:'Membres du foyer et documents.'},
      documents:{title:'Documents importants', emoji:'📁', collection:'familyDocuments', type:'document_famille', category:'Administratif', help:'Identité, passeport, diplômes, santé, scolarité et assurances.'}
    }
  };

  
  function listFilterChips(module, block, cfg){
    const groups = {
      maison:[['taches','Tout'],['taches_aujourdhui','Aujourd’hui'],['taches_retard','En retard'],['taches_par_membre','Par membre'],['taches_recurrentes','Récurrentes']],
      courses_repas:[['tout','Tout'],['menu_semaine','Semaine'],['menu_jour','Jour'],['courses','Checklist courses'],['stock','Stock'],['stock_faible','Stock faible']],
      education:[['tout','Tout'],['ecole','École'],['ecole_notes','Notes'],['documents','Documents']],
      sante:[['tous','Tous'],['rendez_vous','Rendez-vous'],['traitements','Traitements'],['documents','Documents'],['alertes','Alertes']],
      sport_loisirs:[['tout','Tout'],['sport_activites','Sport'],['loisir_activites','Loisir'],['voyage_activites','Voyage'],['documents','Documents']],
      familles:[['tout','Tout',String.fromCodePoint(0x25A6)],['membres','Membres',String.fromCodePoint(0x1F46A)],['documents','Documents',String.fromCodePoint(0x1F4C1)]]
    }[module] || [];
    if(!groups.length) return '';
    return `<div class="list-filter-chips">${groups.map(([b,l])=>`<button type="button" class="${b===block?'active':''}" onclick="SuperApp.openModuleList('${module}','${b}')">${l}</button>`).join('')}</div>`;
  }
  function paintModuleList(module, block){
    module = canonicalModuleId(module);
    const cfg = listConfig(module, block); if(!cfg){ paintModule(module); return; }
    const m = moduleById(module);
    const items = visibleCollectionItems(cfg);
    const view = $('#view-apps'); state.activeModule = module;
    const chips = listFilterChips(module, block, cfg);
    const specialHtml = cfg.special === 'mealsView' ? mealsViewHtml()
      : cfg.special === 'stockView' ? stockViewHtml(cfg)
      : cfg.special === 'checklistView'
          ? `<div class="management-list">${visibleCollectionItems(cfg).map(x=>shoppingRow(x,{collection:cfg.collection})).join('')||'<div class="empty">Checklist vide.</div>'}</div>`
      : '';
    const docsMode = ((block==='documents' || ['tout','tous'].includes(block)) && supportsSupabaseDocs(module)) ? (module==='familles' ? 'global' : module) : '';
    const supabaseDocsHtml = docsMode ? supabaseDocsPanelHtml(docsMode) : '';
    if(supabaseDocsHtml) setTimeout(()=>window.sbHydrateDocsPanel?.(docsMode), 120);
    // V5.28 — Les vues spéciales Courses/Repas/Stock gardent leurs vrais écrans, même ouvertes depuis les chips.
    view.innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.openModule('${module}')">← Retour ${m.short}</button></div>
      <div class="sublist-title-bar"><div class="sublist-emoji">${cfg.emoji || m.icon}</div><div><h2>${cfg.title}</h2><small>${cfg.help || ''}</small></div></div>
      ${chips}
      <div class="list-toolbar-card"><button class="btn ghost" onclick="SuperApp.openModule('${module}')">← Retour ${m.short}</button><button class="btn primary" onclick="SuperApp.openAdd('${module}','${cfg.type||eventTypeForModule(module)}','${escapeAttr(cfg.category||'Général')}')">${cfg.emoji} + Ajouter</button></div>
      ${block==='documents' ? supabaseDocsHtml : `${specialHtml || `<div class="management-list">${items.length ? items.map(x=>module==='sante' ? healthInfoRow(x,cfg) : managementRow(x,cfg)).join('') : `<article class="empty cute-empty"><b>${cfg.emoji} Rien pour le moment</b><button class="btn primary" onclick="SuperApp.openAdd('${module}','${cfg.type||eventTypeForModule(module)}','${escapeAttr(cfg.category||'Général')}')">+ Ajouter</button></article>`}</div>`}${supabaseDocsHtml && block!=='documents' ? supabaseDocsHtml : ''}`}`;
  }
  function emergencyNumbers(){
    return data.settings?.emergencyNumbers || {pompiers:'', police:'', samu:''};
  }
  function emergencyNumberTile(icon, label, value, cls=''){
    const raw = String(value||'').trim();
    // V5.27 — Si vide, on affiche un placeholder plus discret pour éviter le débordement et le chevauchement
    const isPlaceholder = !raw;
    const shown = isPlaceholder ? 'À renseigner' : formatPhone(raw);
    return `<article class="emergency-tile ${cls} ${isPlaceholder?'is-empty':''}"><span class="emergency-hero-icon">${icon}</span><b>${escapeHtml(label)}</b><strong class="emergency-value ${isPlaceholder?'is-placeholder':''}">${escapeHtml(shown)}</strong></article>`;
  }
  function healthEmergencyBlock(){
    const nums = emergencyNumbers();
    return `<section class="health-emergency-block"><div class="health-emergency-title"><h2>Numéros d’urgence</h2><button type="button" class="link-btn" onclick="SuperApp.openSettings('Santé urgences')">Modifier</button></div><div class="health-emergency-grid">${emergencyNumberTile('🚒','Pompiers',nums.pompiers,'fire')}${emergencyNumberTile('👮','Police',nums.police,'police')}${emergencyNumberTile('🚑','SAMU',nums.samu,'samu')}</div></section>`;
  }
  function healthQuickActions(){
    return `<section class="add-zone health-add-zone"><h3>Ajouter une information santé</h3><div class="health-quick-actions">
      <button type="button" class="health-add-action rv" onclick="SuperApp.openAdd('sante','rendez_vous_medical','Rendez-vous')"><span>📅</span><b>RV</b></button>
      <button type="button" class="health-add-action traitement" onclick="SuperApp.openAdd('sante','medicament','Traitements')"><span>💊</span><b>Traitement</b></button>
      <button type="button" class="health-add-action document" onclick="SuperApp.openAdd('sante','document_sante','Documents santé')"><span>📄</span><b>Document</b></button>
    </div></section>`;
  }
  function healthTypeIcon(x,cfg){
    const t = String(x.type||'').toLowerCase();
    const c = String(x.category||cfg?.category||'').toLowerCase();
    if(t.includes('appointment') || t.includes('rendez') || c.includes('rendez')) return '🩺';
    if(t.includes('medic') || t.includes('trait') || c.includes('trait')) return '💊';
    if(t.includes('vaccin') || c.includes('vaccin')) return '💉';
    if(t.includes('document') || c.includes('document') || c.includes('mutuelle')) return '📄';
    if(t.includes('urgence') || c.includes('urgence')) return '🚑';
    return cfg?.emoji || '🩺';
  }
  function healthLine2(x,cfg){
    return x.desc || x.notes || x.category || cfg?.category || moduleLabel(x.module || 'sante');
  }
  function healthLine3(x){
    const bits = [];
    if(x.date) bits.push(shortDate(x.date));
    if(x.time) bits.push(x.time);
    if(x.qty || x.quantity) bits.push(qtyLabel(x));
    if(x.place) bits.push(x.place);
    return bits.join(' · ') || 'À planifier';
  }
  function isHealthAlertItem(x){
    if(!x) return false;
    if(String(x.category||'').toLowerCase().includes('alerte')) return true;
    if(String(x.type||'').toLowerCase().includes('rappel')) return true;
    if(x.date){ const d = daysDiff(today, x.date); return d >= 0 && d <= 30; }
    return false;
  }
  function memberBadgeHtml(memberId){
    const member = (data.family||[]).find(m=>m.id===memberId);
    if(!member || memberId==='family') return `<div class="health-member-badge"><span class="health-family-avatar">👨‍👩‍👧‍👦</span><b>Famille</b></div>`;
    return `<div class="health-member-badge"><img src="${memberAvatarSrc(member)}" alt=""><b>${escapeHtml(shortMemberName(member.name))}</b></div>`;
  }
  function commonTypeIcon(x,cfg){
    const module = canonicalModuleId(x.module || cfg?.module || state.activeModule || 'calendrier');
    const type = String(x.type || '').toLowerCase();
    const cat = String(x.category || cfg?.category || '').toLowerCase();
    if(module === 'sante') return healthTypeIcon(x,cfg);
    if(module === 'maison'){
      if(type.includes('entretien') || cat.includes('entretien')) return '🔧';
      if(type.includes('urgence') || cat.includes('urgence')) return '⚠️';
      if(type.includes('routine') || cat.includes('routine')) return '🔁';
      return '🧹';
    }
    if(module === 'courses_repas'){
      if(type.includes('stock') || cat.includes('stock')) return '🧺';
      if(type.includes('repas') || type.includes('menu') || cat.includes('menu') || x.meal) return '🍽️';
      return '🛒';
    }
    if(module === 'education'){
      if(type.includes('note') || cat.includes('note')) return '📝';
      if(type.includes('controle') || cat.includes('contrôle') || cat.includes('controle')) return '🧪';
      if(type.includes('document') || cat.includes('document')) return '📄';
      if(cat.includes('sortie')) return '🚌';
      return '📘';
    }
    if(module === 'sport_loisirs'){
      if(type.includes('materiel') || cat.includes('matériel') || cat.includes('materiel')) return '🎒';
      if(cat.includes('compétition') || cat.includes('competition')) return '🏆';
      if(cat.includes('sortie')) return '🚗';
      return '⚽';
    }
    if(module === 'familles'){
      if(cat.includes('identité') || cat.includes('identite') || cat.includes('passeport')) return '🪪';
      if(cat.includes('santé') || cat.includes('sante')) return '🏥';
      if(cat.includes('scolarité') || cat.includes('scolarite')) return '🏫';
      if(cat.includes('assurance')) return '🛡️';
      return '📁';
    }
    if(module === 'calendrier' || module === 'calendar') return '📅';
    return cfg?.emoji || moduleIcon(module) || '📌';
  }
  function commonLine2(x,cfg){
    return x.desc || x.notes || x.category || cfg?.category || moduleLabel(x.module || cfg?.module || state.activeModule || 'calendrier');
  }
  function commonLine3(x){
    const bits=[];
    if(x.date) bits.push(shortDate(x.date));
    if(x.time) bits.push(x.time);
    if(x.qty || x.quantity) bits.push(qtyLabel(x));
    if(x.place) bits.push(x.place);
    if(x.status && statusIsDone(x)) bits.push('Fait');
    return bits.join(' · ') || 'À planifier';
  }
  function commonInfoRow(x,cfg={}){
    const done = statusIsDone(x);
    return `<article class="health-info-row common-info-row clickable-card ${done?'done':''}" onclick="SuperApp.openItem('${x.id}')">
      <div class="health-type-icon">${commonTypeIcon(x,cfg)}</div>
      <div class="health-info-main"><b>${escapeHtml(x.title || x.meal || 'Élément')}</b><small>${escapeHtml(commonLine2(x,cfg))}</small><em>${escapeHtml(commonLine3(x))}</em></div>
      ${memberBadgeHtml(getItemMemberId(x) || x.member || 'family')}
      <div class="health-row-arrow">›</div>
    </article>`;
  }
  function homeDigestRow(n){
    return `<article class="health-info-row common-info-row home-common-row clickable-card" onclick="SuperApp.openItem('${n.id}')">
      <div class="health-type-icon">${n.icon || commonTypeIcon(n,{})}</div>
      <div class="health-info-main"><b>${escapeHtml(n.title || 'Information')}</b><small>${escapeHtml(n.desc || 'Récap du foyer')}</small><em>${escapeHtml(n.time || 'À suivre')}</em></div>
      ${memberBadgeHtml(getItemMemberId(n) || n.member || 'family')}
      <div class="health-row-arrow">›</div>
    </article>`;
  }
  function healthInfoRow(x,cfg){
    const _isAppt=isAppointment(x);
    const _isTreat=!_isAppt&&(x.type==='medication'||x.type==='medicament'||x.type==='traitement'||(x.category||'').toLowerCase().includes('traitement')||(x.category||'').toLowerCase().includes('médicament'));
    if(_isTreat) return healthTreatmentCard(x);
    if(_isAppt) return healthRdvCard(x);
    const done=statusIsDone(x);
    return `<article class="health-info-row clickable-card ${done?'done':''}" onclick="SuperApp.openItem('${x.id}')">
      <div class="health-type-icon">${healthTypeIcon(x,cfg)}</div>
      <div class="health-info-main"><b>${escapeHtml(x.title||'Information santé')}</b><small>${escapeHtml(healthLine2(x,cfg))}</small><em>${escapeHtml(healthLine3(x))}</em></div>
      ${memberBadgeHtml(x.member||'family')}
      <div class="health-row-arrow">›</div>
    </article>`;
  }
  function timeToMinutes(t){ const m=String(t||'').match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1])*60+Number(m[2]) : 0; }
  function minutesToTime(min){ min=((Number(min)||0)+1440)%1440; return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0'); }
  function parseListValues(txt){ return String(txt||'').split(/[\n,;]+/).map(v=>v.trim()).filter(Boolean); }
  function treatmentDayMatches(x, dmy){
    const d=parseDMY(dmy); if(!d) return false;
    const start=parseDMY(x.startDate||x.date||today); const end=parseDMY(x.endDate||x.startDate||x.date||today);
    if(start && daysDiff(formatDMY(start), dmy) < 0) return false;
    if(end && daysDiff(dmy, formatDMY(end)) < 0) return false;
    const mode=x.treatmentDaysMode || (/2/.test(String(x.frequency||''))?'every_x_days':'every_day');
    if(mode==='every_x_days'){
      const interval=Math.max(1, parseInt(x.dayInterval||2,10)||2);
      return (daysDiff(formatDMY(start||d), dmy) % interval) === 0;
    }
    if(mode==='week_days'){
      const vals=String(x.treatmentWeekDays||'').split(',').map(v=>v.trim()).filter(Boolean);
      return vals.length ? vals.includes(String(d.getDay())) : true;
    }
    if(mode==='custom_dates'){
      const vals=parseListValues(x.customTreatmentDates).map(normalizeDateInput).filter(Boolean);
      return vals.includes(dmy);
    }
    return true;
  }
  function treatmentTimesForDay(x){
    const mode=x.doseMode || 'moments';
    if(mode==='every_x_hours'){
      const every=Math.max(1, parseInt(x.hourInterval||6,10)||6)*60;
      const first=timeToMinutes(x.firstDoseTime||'08:00'), last=timeToMinutes(x.lastDoseTime||'20:00');
      const out=[]; for(let t=first;t<=last && out.length<12;t+=every) out.push({label:`Prise ${out.length+1}`, time:minutesToTime(t)});
      return out;
    }
    if(mode==='custom_times'){
      return parseListValues(x.customDoseTimes).map((t,i)=>({label:`Prise ${i+1}`, time:t.length===5?t:t.slice(0,5)})).filter(v=>/^\d{1,2}:\d{2}$/.test(v.time));
    }
    const labels={matin:'Matin',midi:'Midi',soir:'Soir',coucher:'Coucher'};
    const defaults={matin:'08:00',midi:'13:00',soir:'20:00',coucher:'22:00'};
    const vals=String(x.doseMoments||'matin,midi,soir').split(',').map(v=>v.trim()).filter(Boolean);
    return vals.map(id=>({label:labels[id]||id, time:x['doseTime_'+id]||defaults[id]||'08:00'}));
  }
  function doseKey(date,time,label){ return `${date}_${time}_${normalizeText(label)}`; }
  function treatmentDosesForDate(x, dmy=today){
    if(!treatmentDayMatches(x,dmy)) return [];
    const statuses=x.doseStatuses||{};
    return treatmentTimesForDay(x).map(d=>{ const key=doseKey(dmy,d.time,d.label); return {...d, date:dmy, key, done:statuses[key]==='pris'||statuses[key]===true}; });
  }
  function treatmentFrequencyLabel(x){
    if(x.frequency) return String(x.frequency);
    const times=treatmentTimesForDay(x).length;
    const mode=x.treatmentDaysMode;
    const dayLabel=mode==='every_x_days'?`tous les ${x.dayInterval||2} jours`:mode==='week_days'?'certains jours':mode==='custom_dates'?'planning personnalisé':'tous les jours';
    return `${times||1} prise${times>1?'s':''} · ${dayLabel}`;
  }
  function toggleTreatmentDose(id,key){
    const found=findRecord(id); if(!found) return;
    found.item.doseStatuses = found.item.doseStatuses || {};
    found.item.doseStatuses[key] = found.item.doseStatuses[key] === 'pris' ? 'a_prendre' : 'pris';
    touchSync(found.item); save(); render();
  }
  function healthTreatmentDoseRows(x){
    const doses=treatmentDosesForDate(x,today);
    if(!doses.length) return `<div class="dose-empty">Pas de prise aujourd’hui.</div>`;
    return `<div class="treatment-dose-list">${doses.map(d=>`<button type="button" class="treatment-dose-row ${d.done?'done':''}" onclick="event.stopPropagation();SuperApp.toggleTreatmentDose('${x.id}','${escapeAttr(d.key)}')"><span class="shopping-check ${d.done?'checked':''}">${d.done?'✓':''}</span><span><b>${escapeHtml(d.label)}</b><small>${escapeHtml(d.time)}</small></span><em>${d.done?'Pris':'À prendre'}</em></button>`).join('')}</div>`;
  }
  function getHealthTreatmentDoseEvents(){
    const out=[];
    visibleItems('health').filter(x=>!isAppointment(x) && !statusIsHidden(x)).forEach(x=>{
      const start=parseDMY(x.startDate||x.date||today); const end=parseDMY(x.endDate||x.startDate||x.date||today); if(!start||!end) return;
      const max=370; let cur=new Date(start); let count=0;
      while(cur<=end && count<max){ const dmy=formatDMY(cur); treatmentDosesForDate(x,dmy).forEach(d=>out.push({...x, id:`${x.id}::${d.key}`, sourceId:x.id, title:`${x.title||'Traitement'} — ${d.label}`, date:d.date, time:d.time, status:d.done?'fait':'a_faire', statut:d.done?'fait':'a_faire', doseLabel:d.label, doseKey:d.key, readonly:true})); cur.setDate(cur.getDate()+1); count++; }
    });
    return out;
  }
  function healthTreatmentCard(x){
    const mb=(data.family||[]).find(m=>m.id===x.member);
    const av=mb?memberAvatarSrc(mb):(FAMILY_PACKS[0].family);
    const mn=mb?escapeHtml(shortMemberName(mb.name)):'Famille';
    const freq=treatmentFrequencyLabel(x);
    const dr=x.startDate?`${shortDate(x.startDate)}${x.endDate?' → '+shortDate(x.endDate):''}`:(x.date?shortDate(x.date):'');
    const dos=x.dosage||'';
    return `<article class="health-rich-card treatment-card treatment-card-expanded">
      <div class="treatment-card-top">
        <div class="hrc-avatar"><img src="${av}" alt=""><span class="hrc-member-name">${mn}</span></div>
        <div class="hrc-body" onclick="SuperApp.openItem('${x.id}')">
          <div class="hrc-top"><span class="hrc-icon">💊</span><b>${escapeHtml(x.title||'Traitement')}</b></div>
          <div class="hrc-details">
            <span class="hrc-pill">${escapeHtml(freq)}</span>
            ${dr?`<span class="hrc-pill">📅 ${escapeHtml(dr)}</span>`:''}
            ${dos?`<span class="hrc-pill">${escapeHtml(String(dos).slice(0,42))}</span>`:''}
            ${x.doctor?`<span class="hrc-pill">🏥 ${escapeHtml(String(x.doctor).slice(0,28))}</span>`:''}
          </div>
        </div>
      </div>
      <div class="treatment-doses"><div class="treatment-dose-title"><b>Prises du jour</b><small>${escapeHtml(today)}</small></div>${healthTreatmentDoseRows(x)}</div>
    </article>`;
  }
  function healthRdvCard(x){
    const done=statusIsDone(x);
    const mb=(data.family||[]).find(m=>m.id===x.member);
    const av=mb?memberAvatarSrc(mb):(FAMILY_PACKS[0].family);
    const mn=mb?escapeHtml(shortMemberName(mb.name)):'Famille';
    const cp=x.companion?(data.family||[]).find(m=>m.id===x.companion):null;
    return `<article class="health-rich-card rdv-card ${done?'done':''}">
      <div class="hrc-avatar"><img src="${av}" alt=""><span class="hrc-member-name">${mn}</span></div>
      <div class="hrc-body" onclick="SuperApp.openItem('${x.id}')">
        <div class="hrc-top"><span class="hrc-icon">🧠</span><b>${escapeHtml(x.title||'Rendez-vous')}</b></div>
        <div class="hrc-details">
          ${x.date?`<span class="hrc-pill">📅 ${escapeHtml(shortDate(x.date))}${x.time?' à '+x.time:''}</span>`:''}
          ${x.doctor?`<span class="hrc-pill">🏥 ${escapeHtml(String(x.doctor).slice(0,25))}</span>`:''}
          ${x.place&&x.place!==x.doctor?`<span class="hrc-pill">📍 ${escapeHtml(String(x.place).slice(0,25))}</span>`:''}
          ${cp?`<span class="hrc-pill">🤝 ${escapeHtml(shortMemberName(cp.name))}</span>`:''}
        </div>
      </div>
      <div class="health-row-arrow" onclick="SuperApp.openItem('${x.id}')">›</div>
    </article>`;
  }

  function managementRow(x,cfg){
    if(String(x.type||'').startsWith('checklist_')) return checklistManagementRow(x,cfg);
    if((cfg?.module === 'maison' || x.module === 'maison' || cfg?.collection === 'tasks') && !String(x.type||'').startsWith('checklist_')) return maisonTaskRow(x,cfg);
    if((cfg?.collection === 'shopping') || x.type === 'course') return shoppingRow(x,cfg);
    if(['sport_activites','loisir_activites','voyage_activites'].includes(cfg?.key) || ['activite','loisir','voyage'].includes(itemType(x))) return slvActivityCard(x);
    if(cfg?.module === 'education' || x.module === 'education') return schoolItemCard(x,cfg);
    return commonInfoRow(x,cfg);
  }
  function checklistManagementRow(x,cfg={}){
    const done = statusIsDone(x);
    const qty = parseInt(x.quantity || x.qty || 1, 10) || 1;
    const kind = String(x.type||'').includes('devoir') ? 'education' : 'maison';
    const parent = genericChecklistActivity(x.parentId) || {};
    const linked = parent.title ? ` · lié à ${parent.title}` : '';
    return `<article class="common-info-row checklist-list-row ${done?'done':''}">
      <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.toggleGenericChecklistItem('${x.id}')">${done?'✓':''}</button>
      <div class="health-info-main" onclick="SuperApp.openGenericChecklist('${escapeAttr(x.parentId||'')}','${kind}')"><b>${escapeHtml(x.title||'Élément checklist')}</b><small>${escapeHtml(x.category||'Checklist')}${escapeHtml(linked)}</small><em>${qty} unité${qty>1?'s':''}${done?' · Fait':''}</em></div>
      <button type="button" class="row-action del btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">Supprimer</button>
    </article>`;
  }

  function maisonTaskRow(x,cfg={}){
    const done = statusIsDone(x);
    const icon = commonTypeIcon(x,{...cfg,module:'maison'});
    const moduleId = 'maison';
    return `<article class="health-info-row common-info-row maison-task-row ${done?'done':''}">
      <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.markDone('${x.id}')" aria-label="Marquer fait">${done?'✓':''}</button>
      <div class="health-type-icon">${icon}</div>
      <div class="health-info-main"><b>${escapeHtml(x.title || 'Tâche')}</b><small>${escapeHtml(commonLine2(x,{...cfg,module:'maison'}))}</small><em>${escapeHtml(commonLine3(x))}</em></div>
      ${memberBadgeHtml(getItemMemberId(x) || x.member || 'family')}
      <div class="shopping-row-actions"><button type="button" class="btn-sm ghost" onclick="event.stopPropagation();SuperApp.openEdit('${moduleId}','${x.id}')">✏️</button><button type="button" class="btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">🗑️</button></div>
    </article>`;
  }
  function schoolUrgencyClass(x){
    if(statusIsDone(x)||!x.date) return '';
    const d=daysDiff(today,x.date);
    if(d>=0&&d<=1) return 'urgency-red';
    if(d>=0&&d<=3) return 'urgency-orange';
    return '';
  }
  function schoolTypeIcon(x){
    const t=normalizeText(x.type||x.category||'');
    if(t.includes('controle')||t.includes('interro')||t.includes('examen')) return '📝';
    if(t.includes('expose')||t.includes('oral')) return '🎙️';
    if(t.includes('sortie')) return '🚌';
    if(t.includes('reunion')||t.includes('parent')) return '🤝';
    if(t.includes('document')||t.includes('autorisation')) return '📄';
    if(t.includes('note')||t.includes('bulletin')) return '⭐';
    return '📚';
  }
  function schoolItemCard(x,cfg={}){
    const done=statusIsDone(x);
    const urg=schoolUrgencyClass(x);
    const icon=schoolTypeIcon(x);
    const members=x.students&&x.students!=='family'?String(x.students).split(',').map(id=>{const m=(data.family||[]).find(m=>m.id===id.trim());return m?firstMemberName(m.name):id;}).filter(Boolean).join(', '):(x.member&&x.member!=='family'?memberName(x.member):'Famille');
    const subject=x.subject||x.category||'';
    const scoreLabel=(x.score!==undefined&&x.score!=='')?`${x.score}/${x.scoreMax||20}`:'';
    const dl=x.date?shortDate(x.date):'';
    return `<article class="school-card common-info-row clickable-card ${done?'done':''} ${urg}" onclick="SuperApp.openItem('${x.id}')">
      <div class="school-card-left">
        <span class="school-type-icon">${icon}</span>
        <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.markDone('${x.id}')">${done?'✓':''}</button>
      </div>
      <div class="health-info-main">
        <b>${escapeHtml(x.title||'Devoir')}</b>
        <small>${escapeHtml(subject?subject+' · ':'')}${escapeHtml(members)}${scoreLabel?' · ⭐ '+scoreLabel:''}</small>
        ${dl?`<em class="${urg}">${escapeHtml(dl)}</em>`:''}
      </div>
      <div class="health-row-arrow">›</div>
    </article>`;
  }
  function shoppingRow(x,cfg={}){
    const done = statusIsDone(x);
    const moduleId = canonicalModuleId(cfg.module || x.module || ((cfg.collection && cfg.collection !== 'shopping') ? 'sport_loisirs' : 'courses_repas'));
    const statusLabel = moduleId === 'courses_repas' ? 'Acheté' : 'Fait';
    const detailText = moduleId === 'courses_repas' ? (qtyLabel(x) || 'Quantité à préciser') : (x.notes || x.desc || 'À préparer');
    return `<article class="health-info-row common-info-row shopping-check-row ${done?'done':''}">
      <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.markDone('${x.id}')" aria-label="Cocher ou décocher">${done?'✓':''}</button>
      <div class="health-info-main" onclick="SuperApp.openItem('${x.id}')"><b>${escapeHtml(x.title || 'Article')}</b><small>${escapeHtml(x.category || 'Checklist')}${done?' · '+statusLabel:''}</small><em>${escapeHtml(detailText)}${done?' · Fait':''}</em></div>
      ${done?`<span class="shopping-status-pill">${statusLabel}</span>`:''}
      <div class="shopping-row-actions"><button type="button" class="btn-sm ghost" onclick="event.stopPropagation();SuperApp.openEdit('${moduleId}','${x.id}')">✏️</button><button type="button" class="btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">🗑️</button></div>
    </article>`;
  }
  function openBudgetBoard(){ state.appsView={kind:'budget'}; setView('apps'); }
  // V5.11 — Vue tableau du menu de la semaine : 7 jours empilés, Midi/Soir côte à côte
  // V5.27 — Vue Repas : aujourd'hui en vedette + tableau hebdomadaire en dessous
  function mealsViewHtml(){
    const meals = (data.weeklyMeals || []).filter(x=>!statusIsHidden(x));
    const todayIdx = (new Date().getDay() + 6) % 7;
    const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const todayName = dayNames[todayIdx];
    const todayMidi = meals.find(m=>Number(m.day)===todayIdx && (m.slot||'soir')==='midi');
    const todaySoir = meals.find(m=>Number(m.day)===todayIdx && (m.slot||'soir')==='soir');
    const todayCell = (slot, meal)=>{
      const slotIcon = slot==='midi'?'🌞':'🌙';
      const slotLabel = slot==='midi'?'Midi':'Soir';
      if(meal){
        return `<button class="meals-today-cell filled" type="button" onclick="SuperApp.openEdit('courses_repas','${meal.id}')">
          <span class="cell-slot">${slotIcon} ${slotLabel}</span>
          <span class="cell-title">${escapeHtml(meal.title)}</span>
        </button>`;
      }
      return `<button class="meals-today-cell empty" type="button" onclick="SuperApp.openAddWeeklyMeal(${todayIdx},'${slot}')">
        <span class="cell-slot">${slotIcon} ${slotLabel}</span>
        <span class="cell-plus">＋ Ajouter</span>
      </button>`;
    };
    return `
      <div class="meals-today-card">
        <div class="meals-today-head">
          <b>🍽️ Aujourd'hui — ${todayName}</b>
        </div>
        <div class="meals-today-grid">
          ${todayCell('midi', todayMidi)}
          ${todayCell('soir', todaySoir)}
        </div>
      </div>
      <div class="meals-week-title"><b>Menu de la semaine</b></div>
      ${weeklyMealsTableHtml()}
    `;
  }

  // V5.27 — Vue Stock : liste des produits + bouton "Ajouter aux courses" pour les Faibles
  function stockViewHtml(cfg){
    const items = (data.stock || []).filter(x=>!statusIsHidden(x));
    const filtered = cfg.filter ? items.filter(cfg.filter) : items;
    if(!filtered.length){
      return `<article class="empty cute-empty"><b>🧺 Aucun produit en stock</b><small>Ajoute ce que tu as dans tes placards, frigo, congélateur.</small>
        <button class="btn primary" onclick="SuperApp.openAdd('courses_repas','stock','Stock')">+ Ajouter</button></article>`;
    }
    const row = (x)=>{
      const level = String(x.level||'').toLowerCase();
      const levelClass = level==='faible'?'stock-low':(level==='moyen'?'stock-medium':'stock-good');
      const levelLabel = x.level || '—';
      const showAddBtn = level === 'faible';
      return `<article class="stock-row ${levelClass}">
        <div class="stock-icon">🧺</div>
        <div class="stock-body">
          <b>${escapeHtml(x.title)}</b>
          <small>${escapeHtml(x.place||'')}${qtyLabel(x)?' · '+escapeHtml(qtyLabel(x)):''}</small>
          <span class="stock-level-pill ${levelClass}">${escapeHtml(levelLabel)}</span>
        </div>
        <div class="stock-actions">
          ${showAddBtn ? `<button type="button" class="btn-sm primary" onclick="SuperApp.openStockToCoursesConfirm('${x.id}')">＋ Aux courses</button>` : ''}
          <button type="button" class="btn-sm ghost" onclick="SuperApp.consumeStock('${x.id}')">− Consommer</button>
          <button type="button" class="btn-sm ghost" onclick="SuperApp.openEdit('courses_repas','${x.id}')">✏️</button>
          <button type="button" class="btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">🗑️</button>
        </div>
      </article>`;
    };
    return `
      <div class="section-title compact-title">
        <h2>🧺 Stock</h2>
        <button class="link-btn" onclick="SuperApp.openAdd('courses_repas','stock','Stock')">+ Ajouter</button>
      </div>
      <div class="stock-list">${filtered.map(row).join('')}</div>
    `;
  }

  // V5.30 — Validation designée avant d'envoyer un produit du stock vers la liste de courses
  function openStockToCoursesConfirm(stockId){
    const item = (data.stock||[]).find(x=>x.id===stockId);
    if(!item) return;
    const dlg = ensureStockToCoursesDialog();
    const unit = unitFromItem(item);
    const qty = numberQty(item);
    const exists = (data.shopping||[]).find(x=>String(x.title||'').trim().toLowerCase()===String(item.title||'').trim().toLowerCase() && !statusIsDone(x));
    dlg.dataset.stockId = stockId;
    dlg.dataset.duplicate = exists ? '1' : '';
    dlg.querySelector('[data-course-product]').textContent = item.title || 'Produit';
    dlg.querySelector('[data-course-stock]').textContent = qtyLabel(item) || `${formatQtyNumber(qty || 0, unit)} ${unit}`;
    dlg.querySelector('[data-course-unit]').textContent = unit;
    dlg.querySelector('[data-course-qty]').textContent = `${formatQtyNumber(qty || (unit==='unité'?1:0.1), unit)} ${unit}`;
    const msg = dlg.querySelector('[data-course-message]');
    const submit = dlg.querySelector('[data-course-submit]');
    if(exists){
      msg.textContent = 'Ce produit est déjà présent dans la liste de courses. Aucune nouvelle ligne ne sera créée.';
      submit.textContent = 'Déjà dans la liste';
      submit.disabled = true;
      submit.classList.add('disabled');
    } else {
      msg.textContent = 'Voulez-vous ajouter ce produit à la liste de courses ?';
      submit.textContent = 'Ajouter aux courses';
      submit.disabled = false;
      submit.classList.remove('disabled');
    }
    try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
  }
  function ensureStockToCoursesDialog(){
    let dlg = document.getElementById('stockToCoursesDialog');
    if(dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'stockToCoursesDialog';
    dlg.className = 'dialog-card stock-to-courses-dialog';
    dlg.innerHTML = `<form method="dialog" onsubmit="event.preventDefault();SuperApp.confirmAddStockToCourses();">
      <header class="dialog-head"><h2>Ajouter aux courses</h2><button class="icon-btn" type="button" onclick="document.getElementById('stockToCoursesDialog').close()" aria-label="Fermer">✕</button></header>
      <div class="form-stack">
        <section class="consume-stock-card">
          <div class="consume-stock-icon">🛒</div>
          <div><b data-course-product>Produit</b><small data-course-message>Voulez-vous ajouter ce produit à la liste de courses ?</small></div>
        </section>
        <div class="stock-calc-grid stock-confirm-grid">
          <article><small>Stock actuel</small><b data-course-stock>0</b></article>
          <article><small>Unité</small><b data-course-unit>unité</b></article>
          <article class="stock-calc-result"><small>Quantité proposée</small><b data-course-qty>1 unité</b></article>
        </div>
      </div>
      <footer class="dialog-actions"><button class="btn ghost" type="button" onclick="document.getElementById('stockToCoursesDialog').close()">Annuler</button><button class="btn primary" data-course-submit type="submit">Ajouter aux courses</button></footer>
    </form>`;
    document.body.appendChild(dlg);
    return dlg;
  }
  function confirmAddStockToCourses(){
    const dlg = document.getElementById('stockToCoursesDialog');
    if(!dlg || dlg.dataset.duplicate === '1') return;
    addStockToCourses(dlg.dataset.stockId, {silentDuplicate:true});
    try{ dlg.close(); }catch{}
  }
  function addStockToCourses(stockId, opts={}){
    const item = (data.stock||[]).find(x=>x.id===stockId);
    if(!item) return;
    const exists = (data.shopping||[]).find(x=>String(x.title||'').trim().toLowerCase()===String(item.title||'').trim().toLowerCase() && !statusIsDone(x));
    if(exists){
      if(!opts.silentDuplicate) toast('🛒 Ce produit est déjà dans la liste.');
      return;
    }
    data.shopping = data.shopping || [];
    data.shopping.push(decorateSync({
      id: uid(),
      module: 'courses_repas',
      type: 'course',
      title: item.title,
      qty: qtyLabel(item) || item.qty || '',
      quantity: numberQty(item) || (unitFromItem(item)==='unité'?1:0.1),
      unit: unitFromItem(item),
      category: 'Alimentation',
      date: today,
      status: 'a_faire',
      statut: 'a_faire'
    }));
    save();
    render();
    toast('🛒 Produit ajouté aux courses');
  }

  function consumeStock(stockId){
    const item = (data.stock||[]).find(x=>x.id===stockId);
    if(!item) return;
    const dlg = ensureConsumeStockDialog();
    const unit = unitFromItem(item);
    const current = decimalValue(numberQty(item));
    dlg.dataset.stockId = stockId;
    dlg.dataset.current = String(current);
    dlg.dataset.unit = unit;
    dlg.querySelector('[data-stock-title]').textContent = item.title || 'Produit';
    dlg.querySelector('[data-stock-current]').textContent = `${formatQtyNumber(current, unit)} ${unit}`;
    const input = dlg.querySelector('[name="consumeQty"]');
    input.step = unitStep(unit);
    input.inputMode = unit === 'unité' ? 'numeric' : 'decimal';
    input.min = '0';
    input.max = String(current);
    input.value = current > 0 ? (unit === 'unité' ? '1' : '0.1') : '0';
    updateConsumeStockPreview(dlg);
    try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
    setTimeout(()=>input.focus(), 50);
  }
  function ensureConsumeStockDialog(){
    let dlg = document.getElementById('consumeStockDialog');
    if(dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'consumeStockDialog';
    dlg.className = 'dialog-card consume-stock-dialog';
    dlg.innerHTML = `<form method="dialog" onsubmit="event.preventDefault();SuperApp.confirmConsumeStock();">
      <header class="dialog-head"><h2>Consommer le stock</h2><button class="icon-btn" type="button" onclick="document.getElementById('consumeStockDialog').close()" aria-label="Fermer">✕</button></header>
      <div class="form-stack">
        <section class="consume-stock-card">
          <div class="consume-stock-icon">🧺</div>
          <div><b data-stock-title>Produit</b><small>Soustraction automatique avant validation</small></div>
        </section>
        <div class="stock-calc-grid">
          <article><small>Stock actuel</small><b data-stock-current>0</b></article>
          <article><small>À consommer</small><input name="consumeQty" type="number" min="0" step="1" value="1" oninput="SuperApp.updateConsumeStockPreview(this.closest('dialog'))"></article>
          <article class="stock-calc-result"><small>Stock restant</small><b data-stock-remaining>0</b></article>
        </div>
      </div>
      <footer class="dialog-actions"><button class="btn ghost" type="button" onclick="document.getElementById('consumeStockDialog').close()">Annuler</button><button class="btn primary" type="submit">Valider la consommation</button></footer>
    </form>`;
    document.body.appendChild(dlg);
    return dlg;
  }
  function updateConsumeStockPreview(dlg){
    if(!dlg) return;
    const unit = dlg.dataset.unit || 'unité';
    const current = decimalValue(dlg.dataset.current);
    const input = dlg.querySelector('[name="consumeQty"]');
    let consumed = decimalValue(input?.value);
    if(String(unit) === 'unité') consumed = Math.round(consumed);
    else consumed = Math.round(consumed * 10) / 10;
    consumed = Math.max(0, Math.min(current, consumed));
    const remaining = Math.max(0, current - consumed);
    const out = dlg.querySelector('[data-stock-remaining]');
    if(out) out.textContent = `${formatQtyNumber(remaining, unit)} ${unit}`;
  }
  function confirmConsumeStock(){
    const dlg = document.getElementById('consumeStockDialog');
    if(!dlg) return;
    const item = (data.stock||[]).find(x=>x.id===dlg.dataset.stockId);
    if(!item) return;
    const unit = unitFromItem(item);
    const current = decimalValue(numberQty(item));
    const raw = dlg.querySelector('[name="consumeQty"]')?.value;
    let consumed = decimalValue(raw);
    if(String(unit) === 'unité') consumed = Math.round(consumed);
    else consumed = Math.round(consumed * 10) / 10;
    if(!Number.isFinite(consumed) || consumed <= 0){ infoDialog('Quantité invalide.'); return; }
    if(consumed > current){ infoDialog('La quantité consommée ne peut pas dépasser le stock actuel.'); return; }
    const next = Math.max(0, current - consumed);
    item.quantity = normalizeQuantityForUnit(next, unit);
    item.unit = unit;
    item.qty = `${item.quantity} ${unit}`.trim();
    item.level = next <= 0 ? 'Faible' : (next <= 1 ? 'Faible' : item.level || 'Moyen');
    touchSync(item); save(); try{dlg.close();}catch{} render(); toast('🧺 Stock mis à jour');
  }

  function weeklyMealsTableHtml(){
    const meals = (data.weeklyMeals || []).filter(x=>!statusIsHidden(x));
    const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const mealFor = (day, slot)=>meals.find(x=>Number(x.day)===day && (x.slot||'soir')===slot);
    const todayIdx = (new Date().getDay() + 6) % 7;
    const cellHtml = (day, slot)=>{
      const meal = mealFor(day, slot);
      if(meal){
        return `<button class="weekly-cell filled" type="button" onclick="SuperApp.openEdit('courses_repas','${meal.id}')">
          <span class="weekly-cell-title">${escapeHtml(meal.title)}</span>
          <span class="weekly-cell-actions"><em onclick="event.stopPropagation();SuperApp.deleteItem('${meal.id}')">🗑️</em></span>
        </button>`;
      }
      return `<button class="weekly-cell empty" type="button" onclick="SuperApp.openAddWeeklyMeal(${day},'${slot}')">
        <span class="weekly-cell-plus">＋</span>
        <span class="weekly-cell-hint">Ajouter</span>
      </button>`;
    };
    const orderedDays = Array.from({length:7}, (_,n)=>(todayIdx+n)%7);
    return `<div class="weekly-meals-table">
      <div class="weekly-meals-header"><span></span><b>🌞 Midi</b><b>🌙 Soir</b></div>
      ${orderedDays.map((i, order)=>`
        <div class="weekly-meals-row ${i===todayIdx?'is-today':''} ${order===1?'is-tomorrow':''}">
          <div class="weekly-day-label"><b>${dayNames[i]}</b>${i===todayIdx?'<small>aujourd’hui</small>':(order===1?'<small>demain</small>':'')}</div>
          ${cellHtml(i,'midi')}
          ${cellHtml(i,'soir')}
        </div>
      `).join('')}
    </div>`;
  }
  // Helper pour ajouter un repas hebdo directement sur le bon créneau
  function openAddWeeklyMeal(day, slot){
    state.preset = {day, slot};
    openAdd('courses_repas','repas_semaine','Menu de la semaine');
  }
  function paintBudgetBoard(){
    const m = moduleById('courses_repas'); const budget = data.foodBudget || {monthly:0,spent:0,currency:'EUR'};
    const view = $('#view-apps');
    view.innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.openModule('courses_repas')">← Retour Courses</button></div>
      <div class="sublist-title-bar"><div class="sublist-emoji">💶</div><div><h2>Budget courses</h2><small>Mini suivi simple du budget courses du mois.</small></div></div>
      <article class="budget-board-card"><b>${currency(budget.spent)}</b><small>dépensé sur ${currency(budget.monthly)}</small><progress value="${budget.spent}" max="${budget.monthly || 1}"></progress><strong>Reste ${currency((budget.monthly||0)-(budget.spent||0))}</strong></article>
      <div class="list-toolbar-card"><button class="btn ghost" onclick="SuperApp.openModule('courses_repas')">← Retour Courses</button><button class="btn primary" onclick="SuperApp.openBudgetEditor()">Modifier le budget</button></div>`;
  }
  function openBudgetEditor(){
    $('#editTitle').textContent = 'Modifier le budget courses';
    $('#editForm').dataset.type = 'settings_budget_courses'; $('#editForm').dataset.id = '';
    const b = data.foodBudget || {monthly:0,spent:0,currency:'EUR'};
    $('#editFields').innerHTML = `<div class="form-field"><label>Budget mensuel</label><input name="monthly" type="number" value="${Number(b.monthly||0)}"></div><div class="form-field"><label>Dépensé</label><input name="spent" type="number" value="${Number(b.spent||0)}"></div><div class="form-field"><label>Devise</label><input name="currency" value="${escapeAttr(b.currency||'EUR')}"></div>`;
    if($('#editDialog').open) $('#editDialog').close(); $('#editDialog').showModal();
  }
  function openMemberDocList(memberId, category, title){
    const member = data.family.find(m=>m.id===memberId); if(!member) return;
    const cfg = {title:title || category, emoji:'📁', img:cardImg('familles_identite.png'), collection:'familyDocuments', type:'document_famille', category};
    const docs = (data.familyDocuments||[]).filter(x=>!statusIsHidden(x) && (x.member===memberId || !x.member) && (!category || x.category===category));
    const view = $('#view-apps'); setView('apps');
    view.innerHTML = `<div class="sublist-title-bar"><div class="sublist-emoji">${cfg.emoji}</div><div><h2>${title}</h2><small>${escapeHtml(member.name)}</small></div></div>
      <div class="list-toolbar-card"><button class="btn ghost" onclick="SuperApp.openModule('familles')">← Retour Familles</button><button class="btn primary" onclick="SuperApp.openAdd('familles','document_famille','${escapeAttr(category)}','${escapeAttr(title)} — ${escapeAttr(member.name)}','${memberId}')">+ Ajouter</button></div>
      <div class="management-list">${docs.length?docs.map(x=>managementRow(x,cfg)).join(''):`<article class="empty cute-empty"><b>${cfg.emoji} Aucun document</b><small>Ajoute un premier document pour ${escapeHtml(member.name)}.</small></article>`}</div>`;
  }

  function openFamilyMembersManager(filter='all'){
    const titleMap = {all:'Tous les membres', adults:'Adultes', children:'Enfants'};
    const members = (data.family||[]).filter(m=>m.active!==false).filter(m=>{
      if(filter==='children') return m.role === 'Enfant';
      if(filter==='adults') return m.role !== 'Enfant';
      return true;
    });
    const view = $('#view-apps'); setView('apps'); state.activeModule = 'familles';
    view.innerHTML = `<div class="sublist-title-bar"><div class="sublist-emoji">👨‍👩‍👧‍👦</div><div><h2>${titleMap[filter] || 'Membres du foyer'}</h2><small>Cartes membres cliquables.</small></div></div>
      <div class="list-toolbar-card"><button class="btn ghost" onclick="SuperApp.openModule('familles')">← Retour Familles</button><button class="btn primary" onclick="SuperApp.openSettingsMember('')">👤 + Ajouter</button></div>
      <div class="family-spaces">${members.length ? members.map(memberCard).join('') : `<article class="empty cute-empty"><b>👤 Aucun membre</b><small>Ajoute un premier membre du foyer.</small><button class="btn primary" onclick="SuperApp.openSettingsMember('')">+ Ajouter</button></article>`}</div>`;
  }

    function calendarFilterLabel(){
    const found = calendarFilters().find(([id])=>id === state.calendarFilter);
    return found ? found[1] : 'Tous';
  }
  function calendarDayView(events){
    return `<div class="calendar-day-view"><article class="day-focus-card"><div><span>📅 Vue jour</span><h3>${displayDate(state.selectedDate)}</h3><p>${events.length ? events.length + ' élément(s) pour cette journée.' : 'Journée libre pour ce filtre.'}</p></div><button type="button" class="btn primary" onclick="SuperApp.openEdit('calendrier')">📅 Ajouter</button></article>${events.length ? `<div class="day-focus-list">${events.map(x=>agendaRow(x,x.icon,x.label)).join('')}</div>` : '<div class="empty cute-empty"><b>🌿 Rien de prévu</b><small>Change de filtre ou ajoute un événement.</small></div>'}</div>`;
  }
  function calendarFilters(){ return [['all','Tous','▦'],['maison','Maison','🏠'],['courses_repas','Courses & repas','🍽️'],['education','Éducation','📘'],['sante','Santé','💗'],['sport_loisirs','Sport, Loisir & Voyage','⚽'],['familles','Familles','👨‍👩‍👧‍👦'],['calendrier','Autres','📌']]; }
  function weekDayPanel(d){
    const dmy = formatDMY(d); const ev = itemsForDate(dmy);
    return `<article class="week-day-panel ${dmy===state.selectedDate?'active':''}" onclick="SuperApp.selectDate('${dmy}')"><b>${d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','')}</b><small>${shortDate(dmy)}</small>${ev.slice(0,3).map(x=>`<span>${x.icon} ${x.title}</span>`).join('') || '<em>Libre</em>'}</article>`;
  }
  function dayCell(d,selected){
    const dmy=formatDMY(d), ev=itemsForDate(dmy); const active=dmy===state.selectedDate; const muted=d.getMonth()!==selected.getMonth();
    return `<button class="day ${active?'active':''} ${muted?'muted':''}" onclick="SuperApp.selectDate('${dmy}')">${d.getDate()}<div class="dots">${ev.slice(0,3).map(e=>`<span class="dot ${e.module||''}"></span>`).join('')}</div></button>`;
  }
  function agendaRow(x,icon,label){ return commonInfoRow({...x, icon, category:label || x.category || 'Calendrier', module:x.module || 'calendrier'}, {module:x.module || 'calendrier', emoji:icon, category:label || 'Calendrier'}); }

      function notificationCountFor(filter, all){ return filteredNotificationsFor(filter, all).length; }
      function setNotificationFilter(filter){ state.notifFilter = filter || 'all'; renderNotifications(); }
  function notificationRow(n){ return homeDigestRow(n); }

  
  function openQuickActions(){
    state.returnList = null;
    $('#quickActions').innerHTML = [
      ['maison','🏠','Ajouter une tâche'],['courses_repas','🛒','Ajouter une course'],['calendrier','📅','Ajouter un événement'],['education','📘','Ajouter un devoir'],['sante','💊','Ajouter une information santé'],['sport_loisirs','⚽','Ajouter sport, loisir ou voyage'],['familles','👨‍👩‍👧‍👦','Ajouter document famille']
    ].map(([id,icon,label])=>`<button class="quick-action" type="button" onclick="SuperApp.openEdit('${id}')"><span>${icon}</span>${label}</button>`).join('');
    $('#actionDialog').showModal();
  }
  function openEdit(type, id=''){
    type = canonicalModuleId(type);
    try { $('#actionDialog').close(); } catch {}
    // Restaurer les boutons Annuler/Enregistrer (peuvent avoir été cachés par openResetConfirmDialog)
    const actions = $('#editForm .dialog-actions');
    if(actions) actions.removeAttribute('hidden');
    state.editing = id ? findRecord(id) : null;
    const titleMap={maison:'Ajouter une tâche',courses_repas:'Ajouter une course / repas',calendrier:'Ajouter un élément daté',education:'Ajouter un devoir',sante:'Ajouter une information santé',sport_loisirs:(()=>{ const _t=state.slvTab||'tout'; if(_t==='sport') return 'Ajouter un sport'; if(_t==='loisir') return 'Ajouter un loisir'; if(_t==='voyage') return 'Ajouter un voyage'; return 'Ajouter — Sport / Loisir / Voyage'; })(),familles:'Ajouter un document famille'};
    $('#editTitle').textContent = id ? 'Modifier l’élément' : (titleMap[type] || 'Ajouter');
    $('#editForm').dataset.type = type;
    $('#editForm').dataset.id = id || '';
    const item = state.editing?.item || state.preset || {};
    if(state.editing?.collection==='stock' && !item.type) item.type='stock';
    if(state.editing?.collection==='emergency' && !item.type) item.type='urgence_sante';
    if(state.editing?.collection==='sportGear' && !item.type) item.type = item.category==='Documents sport' ? 'document_sport' : 'materiel_sport';
    if(state.editing?.collection==='weeklyMeals' && (!item.type || item.type==='repas')) item.type='repas_semaine';
    $('#editFields').innerHTML = fieldsFor(type,item);
    if($('#editDialog').open) $('#editDialog').close();
    $('#editDialog').showModal();
    if(supportsSupabaseDocs(type) && item.id){
      setTimeout(()=>window.sbHydrateHealthItemDocs?.(item.id, type), 120);
    }
  }
  function openAdd(module,type='',category='',title='',member=''){
    // V5.11 — Fusionner avec un preset existant (ex. day/slot posés par openAddWeeklyMeal)
    state.preset = {...(state.preset || {}), type, category, title, member};
    openEdit(module);
  }
  function openMember(memberId){
    const member = data.family.find(m=>m.id===memberId); if(!member) return;
    $('#editTitle').textContent = `Dossier — ${member.name}`;
    $('#editForm').dataset.type = 'settings';
    $('#editForm').dataset.id = '';
    if($('#editDialog').open) $('#editDialog').close();
    const workType = memberWorkSchoolType(member);
    const workPhoneLabel = workType.toLowerCase().includes('école') || workType.toLowerCase().includes('ecole') ? 'Numéro école' : 'Numéro travail';
    $('#editFields').innerHTML = `<div class="member-detail-panel"><p><b>Rôle :</b> ${member.role || 'Famille'}</p><p><b>Naissance :</b> ${member.birth || 'À renseigner'} · ${ageFromBirth(member.birth)}</p><p><b>Téléphone personnel :</b> ${formatPhone(member.phone)}</p><p><b>Contact principal :</b> ${boolLabel(member.primaryContact)}</p><p><b>Peut conduire :</b> ${boolLabel(member.canDrive)}</p><p><b>${escapeHtml(workType)} :</b> ${escapeHtml(member.workSchoolName || 'À renseigner')}</p><p><b>${escapeHtml(workPhoneLabel)} :</b> ${formatPhone(member.workSchoolPhone)}</p><p><b>Email :</b> ${member.email || 'À renseigner'}</p><p><b>Alertes :</b> ${escapeHtml(memberAlertLabel(member))}</p></div>${memberHealthQuickBlock(member,'detail')}<div class="settings-chips embedded"><span>Carte d’identité</span><span>Passeport</span><span>Diplômes</span><span>Santé</span><span>Scolarité</span><span>Assurances</span></div><button class="btn primary" type="button" onclick="SuperApp.openAdd('familles','document_famille','Dossier membre','Document — ${escapeAttr(member.name)}','${member.id}')">Ajouter un document</button>`;
    $('#editDialog').showModal();
  }
  function memberOptions(selected='family'){
    return `<option value="family" ${selected==='family'?'selected':''}>Toute la famille</option>${data.family.map(m=>`<option value="${m.id}" ${selected===m.id?'selected':''}>${m.name}</option>`).join('')}`;
  }
  function memberMultiOptions(selected='family'){
    const vals = Array.isArray(selected) ? selected.map(String) : String(selected||'').split(',').map(x=>x.trim()).filter(Boolean);
    const isSelected = id => vals.includes(id) || (!vals.length && id==='family');
    return `<option value="family" ${isSelected('family')?'selected':''}>Toute la famille</option>${data.family.map(m=>`<option value="${m.id}" ${isSelected(m.id)?'selected':''}>${escapeHtml(m.name)}</option>`).join('')}`;
  }
  function moduleOptions(selected='calendrier'){
    selected = canonicalModuleId(selected);
    return [['calendrier','Événement simple'], ...activeModules().filter(m=>APP_MODULE_IDS.includes(m.id)).map(m=>[m.id,m.name])].map(([id,label])=>`<option value="${id}" ${selected===id?'selected':''}>${label}</option>`).join('');
  }
  function escapeHtml(str){ return String(str).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function escapeAttr(str){ return escapeHtml(str).replace(/"/g,'&quot;'); }
    function markDone(id){
    const found = findRecord(id);
    if(found){
      const wasDone = statusIsDone(found.item);
      found.item.status = wasDone ? 'a_faire' : 'fait';
      found.item.statut = found.item.status;
      touchSync(found.item);
      save(); render();
      toast(wasDone ? '↩️ Remis à faire' : '✅ Bravo, c’est fait !');
    } else { save(); render(); }
  }
  function archiveItem(id){
    const found = findRecord(id); if(!found) return;
    confirmDialog('Archiver cet élément ? Il restera synchronisable et consultable.', () => {
      found.item.status='archive'; found.item.statut='archive'; found.item.syncStatus='pending_delete'; touchSync(found.item); hideCalendarCopiesOf(found.item); save(); try{$('#editDialog').close();}catch{} render();
    }, {confirmLabel:'Archiver', danger:false});
  }
  function deleteItem(id){
    const found = findRecord(id); if(!found) return;
    confirmDialog('Supprimer cet élément ? Il disparaître de l’interface mais restera marqué pour la synchronisation.', () => {
      found.item.status='supprime'; found.item.statut='supprime'; found.item.syncStatus='pending_delete'; touchSync(found.item);
      hideCalendarCopiesOf(found.item);
      save(); try{$('#editDialog').close();}catch{} render();
      toast('🗑️ Élément supprimé');
    });
  }
  function openItem(id){
    window._openItemId = id;
    if(String(id).startsWith('birthday-')){ setView('calendar'); return; }
    const found = findRecord(id);
    if(!found){ toast('Élément introuvable ou déjà archivé.'); return; }
    // Activités sport/loisir/voyage → page détail avec checklist liée
    if(['sports','loisirs','voyages'].includes(found.collection)){
      openSlvActivityDetail(id); return;
    }
    const module = canonicalModuleId(found.item.module || 'calendrier');
    openEdit(module === 'calendrier' ? 'calendrier' : module, id);
  }
  function openCalendarDate(dmy,id=''){
    state.selectedDate = dmy || today;
    state.calendarMode = 'day';
    setView('calendar');
    if(id) setTimeout(()=>openItem(id),120);
  }
  function openCalendarModule(module){
    state.calendarFilter = module === 'all' ? 'all' : canonicalModuleId(module || 'all');
    state.calendarMode = 'week';
    setView('calendar');
  }
  function setCalendarFilter(module){ state.calendarFilter = module === 'all' ? 'all' : canonicalModuleId(module); renderCalendar(); }
  function openSettings(section,module=''){
    setView('settings');
    setTimeout(()=>showSettingsPanel(section,module),60);
  }
  function normalizeSettingsSection(section){
    return String(section || 'parametres').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  }
  function activeAppSelect(selected='maison'){
    selected = canonicalModuleId(selected);
    return activeModules().filter(m=>APP_MODULE_IDS.includes(m.id)).map(m=>`<option value="${m.id}" ${selected===m.id?'selected':''}>${m.name}</option>`).join('');
  }
  function encodeKey(value){ return encodeURIComponent(String(value || '')); }
  function decodeKey(value){ try { return decodeURIComponent(String(value || '')); } catch { return String(value || ''); } }
  function lineArray(value){ return String(value || '').split(/[\n,;]/).map(x=>x.trim()).filter(Boolean); }
  function labelsForModule(module){
    const cats = data.categories?.[canonicalModuleId(module)] || {};
    return Object.keys(cats).length ? Object.keys(cats) : ['Général'];
  }
  function showSettingsPanel(section,module=''){
    const key = normalizeSettingsSection(section);
    // V5.9 — Nouveau panneau visuel pour le choix du style de famille
    if(key.includes('stylefamille') || key === 'style_famille' || key.includes('style_famille')){
      openStyleFamillePanel();
      return;
    }
    if($('#editDialog').open) $('#editDialog').close();
    $('#editForm').dataset.type = 'settings';
    $('#editForm').dataset.id = '';
    $('#editTitle').textContent = `Paramètres — ${String(section || 'Paramètres')}`;
    let html = '';
    if(key.includes('famille')) html = settingsFamilyPanel();
    else if(key.includes('localisation') || key.includes('meteo') || key.includes('ville') || key.includes('foyer')) html = settingsLocationPanel();
    else if(key.includes('application')) html = settingsAppsPanel();
    else if(key.includes('categorie') && !key.includes('sous')) html = settingsCategoriesPanel(module);
    else if(key.includes('sous')) html = settingsSubCategoriesPanel(module);
    else if(key.includes('notification')) html = settingsNotificationsPanel();
    else if(key.includes('sante') && (key.includes('urgence') || key.includes('urgences'))) html = settingsHealthEmergencyPanel();
    else if(key.includes('donnees_par_application')) html = settingsReferencePanel(module);
    else if(key.includes('apparence')) html = settingsAppearancePanel();
    else if(key.includes('compte')) html = settingsAccountPanel();
    else if(key.includes('synchronisation')) html = settingsSyncPanel();
    else if(key.includes('donnees')) html = settingsDataPanel();
    else html = `<div class="empty">Choisissez une rubrique de paramètres.</div>`;
    $('#editFields').innerHTML = html;
    $('#editDialog').showModal();
  }
    function settingsModuleTabs(selected, targetLabel){
    return `<div class="settings-module-tabs">${activeModules().filter(m=>APP_MODULE_IDS.includes(m.id)).map(m=>`<button class="settings-module-tab ${selected===m.id?'active':''}" type="button" onclick="SuperApp.openSettings('${targetLabel}','${m.id}')"><span class="settings-tab-emoji">${appLogoHtml(m.id, 28)}</span><b>${m.short}</b></button>`).join('')}</div>`;
  }
    function settingImageForModule(id){
    return moduleById(id).image || 'assets/images/mobile/superapp.png';
  }
  function notificationImage(id){
    return {maison:'assets/images/cards/notifications_maison.png',courses_repas:'assets/images/cards/notifications_courses.png',education:'assets/images/cards/notifications_education.png',sante:'assets/images/cards/notifications_sante.png',sport_loisirs:'assets/images/cards/notifications_sport.png',familles:'assets/images/cards/calendar_family.png'}[canonicalModuleId(id)] || 'assets/images/cards/notifications_alert.png';
  }
    function settingsLocationPanel(){
    const f = foyer();
    const country = f.country || data.settings?.country || 'France';
    const selected = findWeatherPreset(country, f.weatherCity || '');
    const alerts = f.weatherAlerts || {};
    $('#editForm').dataset.type = 'settings_location';
    return `
      <h4 class="settings-mini-title">🏡 Adresse du foyer</h4>
      <div class="form-field"><label>Numéro et rue</label><input name="address" value="${escapeAttr(f.address||'')}" placeholder="Ex : 12 rue des Acacias"></div>
      <div class="form-field"><label>Complément d’adresse</label><input name="addressComplement" value="${escapeAttr(f.addressComplement||'')}" placeholder="Ex : Appt 3, Bâtiment B"></div>
      <div class="form-grid-2">
        <div class="form-field"><label>Code postal</label><input name="postalCode" value="${escapeAttr(f.postalCode||'')}" placeholder="Ex : 54690" inputmode="numeric"></div>
        <div class="form-field"><label>Ville</label><input name="city" value="${escapeAttr(f.city||'')}" placeholder="Ex : Eulmont"></div>
      </div>
      <div class="form-field"><label>Pays</label><select name="country" onchange="SuperApp.updateWeatherCityPicker('settings')">${countryOptions(country)}</select></div>
      <h4 class="settings-mini-title">🌤️ Ville météo</h4>
      <p class="settings-sub-hint">Choisie parmi les villes disponibles pour la météo de l’accueil. Peut être différente de votre adresse.</p>
      <div class="weather-picker" data-weather-picker="settings">
        <div class="form-field"><label>Rechercher une ville météo</label><input name="weatherCitySearch" value="${escapeAttr(f.weatherCity || selected.city || '')}" placeholder="Tapez : Dakar, Nancy, Eulmont..." oninput="SuperApp.updateWeatherCityPicker('settings')"></div>
        <div class="weather-current-choice"><span>✅</span><div><b data-weather-selected-label="settings">${escapeHtml(f.weatherCity || selected.city)}</b><small>${escapeHtml(selected.postalCode ? selected.postalCode + ' — ' + selected.country : selected.country)}</small></div></div>
        <div class="weather-suggestions" data-weather-suggestions="settings">${weatherCitySuggestionButtons('settings', country, '', f.weatherCity || selected.city)}</div>
        <input type="hidden" name="weatherCity" value="${escapeAttr(f.weatherCity || selected.city)}">
        <input type="hidden" name="latitude" value="${escapeAttr(f.latitude || selected.lat || '')}">
        <input type="hidden" name="longitude" value="${escapeAttr(f.longitude || selected.lon || '')}">
      </div>
      <div class="settings-choice-grid location-toggles">
        <label><span>🌤️</span><b>Météo automatique</b><select name="weatherAuto"><option value="true" ${f.weatherAuto!==false?'selected':''}>Activée</option><option value="false" ${f.weatherAuto===false?'selected':''}>Désactivée</option></select></label>
        <label><span>📱</span><b>Position du téléphone</b><select name="useDeviceLocation"><option value="false" ${!f.useDeviceLocation?'selected':''}>Désactivée</option><option value="true" ${f.useDeviceLocation?'selected':''}>Activée</option></select></label>
      </div>
      <h4 class="settings-mini-title">Alertes météo utiles</h4>
      <div class="settings-notif-grid compact-alerts">
        ${[['pluie','🌧️','Pluie'],['froid','🥶','Froid'],['vent','💨','Vent fort'],['neige','❄️','Neige / verglas'],['canicule','☀️','Canicule']].map(([id,emoji,label])=>`<label class="settings-notif-card"><input type="checkbox" name="alert_${id}" ${alerts[id]!==false?'checked':''}><div><span>${emoji}</span><b>${label}</b><small>Alerte active si cochée</small></div><em>${alerts[id]!==false?'Oui':'Non'}</em></label>`).join('')}
      </div>
      <div class="form-field"><label>Lieux utiles de la famille</label><textarea name="usefulPlaces" rows="4" placeholder="Un lieu par ligne">${escapeHtml((f.usefulPlaces || []).join('\n'))}</textarea></div>
      <div class="today-grid"><button class="btn ghost" type="button" onclick="SuperApp.useCurrentPosition()">📍 Utiliser ma position</button><button class="btn ghost" type="button" onclick="SuperApp.refreshWeather()">🌤️ Actualiser météo</button></div>
    `;
  }
  function settingsAppsPanel(){
    const registry=data.appsRegistry||{};
    return `
      <p class="settings-sub-hint">Active ou désactive les applications. Les données restent sauvegardées.</p>
      <div class="settings-apps-grid">
        ${APP_MODULE_IDS.map(id=>{
          const app=registry[id]||{},mod=modules.find(m=>m.id===id)||{},active=app.actif!==false;
          return `<article class="settings-app-card ${active?'active':'inactive'}">
            <div class="sac-icon">${appLogoHtml(id,36)}</div>
            <div class="sac-info"><b>${escapeHtml(mod.name||id)}</b><small>${escapeHtml(mod.desc||'')}</small></div>
            <label class="toggle-switch">
              <input type="checkbox" ${active?'checked':''} onchange="SuperApp.toggleApp('${id}',this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </article>`;
        }).join('')}
      </div>`;
  }
  function toggleApp(id,enabled){
    if(!data.appsRegistry[id]) return;
    if(!enabled&&APP_MODULE_IDS.filter(k=>data.appsRegistry[k]?.actif!==false).length<=1){
      toast('Le cockpit mobile doit garder au moins une application active.'); return;
    }
    data.appsRegistry[id].actif=enabled;
    data.appsRegistry[id].licence=enabled?'active':'inactive';
    touchSync(data.appsRegistry[id]);
    save(); showSettingsPanel('Applications');
  }
  function settingsCategoriesPanel(module=''){
    const selected = canonicalModuleId(module || activeModules().find(m=>APP_MODULE_IDS.includes(m.id))?.id || 'maison');
    const cats = data.categories[selected] || {};
    return `${settingsVisualHero({title:`Catégories ${moduleLabel(selected)}`, text:'Les catégories structurent chaque application active. Elles se règlent sur mobile et resteront compatibles avec la synchronisation.', img:'assets/images/cards/settings_categories.png', emoji:'📁', chips:[`${Object.keys(cats).length} catégorie(s)`, moduleLabel(selected), 'Paramétrage local']})}
      ${settingsModuleTabs(selected,'Catégories')}
      <div class="settings-category-grid">${Object.keys(cats).map(cat=>`<article class="settings-category-card clickable-card" onclick="SuperApp.openCategoryEditor('${selected}','${encodeKey(cat)}')"><div class="settings-cat-emoji">${appLogoHtml(selected, 40)}</div><div><b>${escapeHtml(cat)}</b><small>${(cats[cat]||[]).length} sous-catégorie(s)</small><p>${(cats[cat]||[]).slice(0,4).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</p></div><em>Modifier</em></article>`).join('') || '<div class="empty">Aucune catégorie.</div>'}</div>
      <button class="btn primary visual-wide" type="button" onclick="SuperApp.openCategoryEditor('${selected}','')">+ Ajouter une catégorie</button>`;
  }
  function settingsSubCategoriesPanel(module=''){
    return settingsCategoriesPanel(module) + `<div class="settings-tip-card"><span>🧩</span><div><b>Sous-catégories</b><small>Ouvre une catégorie pour modifier les libellés ligne par ligne.</small></div></div>`;
  }
  function openCategoryEditor(module, encodedCat=''){
    module = canonicalModuleId(module);
    const cat = decodeKey(encodedCat);
    const subs = cat && data.categories[module]?.[cat] ? data.categories[module][cat] : [];
    $('#editTitle').textContent = cat ? `Modifier catégorie — ${cat}` : `Ajouter catégorie — ${moduleLabel(module)}`;
    $('#editForm').dataset.type = 'settings_category';
    $('#editForm').dataset.id = `${module}|${encodeKey(cat)}`;
    $('#editFields').innerHTML = `<input type="hidden" name="module" value="${module}">
      <input type="hidden" name="oldName" value="${escapeAttr(cat)}">
      ${settingsVisualHero({title:cat || 'Nouvelle catégorie', text:'Ajoute des libellés simples pour rendre les écrans plus lisibles et plus rapides à utiliser.', img:'assets/images/cards/settings_categories.png', emoji:'📁', chips:[moduleLabel(module),'Mobile autonome']})}
      <div class="form-field"><label>Nom de la catégorie</label><input name="name" required value="${escapeAttr(cat)}"></div>
      <div class="form-field"><label>Sous-catégories / libellés</label><textarea name="children" rows="7" placeholder="Une sous-catégorie par ligne">${escapeHtml(subs.join('\n'))}</textarea></div>
      ${cat ? `<div class="danger-actions"><button class="btn ghost danger" type="button" onclick="SuperApp.archiveCategory('${module}','${encodeKey(cat)}')">Archiver la catégorie</button></div>` : ''}`;
  }
  function settingsNotificationsPanel(){
    const prefs = data.settings.notificationsPrefs || {};
    const active = APP_MODULE_IDS.filter(id=>appRecord(id).actif);
    const row = (id,label,emoji,desc)=>`<label class="settings-notif-card"><input type="checkbox" name="${id}" ${prefs[id]!==false?'checked':''}><div class="settings-notif-emoji">${emoji}</div><div><b>${label}</b><small>${desc}</small></div><em>${prefs[id]!==false?'Activé':'Désactivé'}</em></label>`;
    $('#editForm').dataset.type = 'settings_notifications';
    return `${settingsVisualHero({title:'Notifications', text:'Le centre de notifications reste autonome. La synchronisation ne fait que transporter les préférences entre supports.', emoji:'🔔', chips:['Global', `${active.length} app(s) active(s)`, 'Rappels doux']})}
      <div class="settings-notif-grid">${row('global','Notifications globales','🔔','Rappels généraux du cockpit mobile')}${row('sauvegarde','Sauvegarde','🛡️','Rappel de sauvegarde locale')}${row('synchro','Synchronisation / conflits','🔄','Alertes d’import, export et conflits')}${APP_MODULE_IDS.map(id=>{const m=moduleById(id); return row(id,m.name,appLogoHtml(id, 36),appRecord(id).actif?'Application active':'Application disponible');}).join('')}</div>`;
  }
  function settingsHealthEmergencyPanel(){
    const nums = data.settings?.emergencyNumbers || {};
    $('#editForm').dataset.type = 'settings_health_emergency';
    return `${settingsVisualHero({title:'Numéros d’urgence santé', text:'Ces numéros sont affichés en haut de l’application Santé. Ils restent remplis par l’utilisateur pour s’adapter au pays et au foyer.', emoji:'🚑', chips:['Pompiers','Police','SAMU']})}
      <div class="settings-emergency-preview">
        ${emergencyNumberTile('🚒','Pompiers', nums.pompiers, 'fire')}
        ${emergencyNumberTile('👮','Police', nums.police, 'police')}
        ${emergencyNumberTile('🚑','SAMU', nums.samu, 'samu')}
      </div>
      <div class="form-field"><label>Pompiers</label><input name="pompiers" inputmode="tel" value="${escapeAttr(nums.pompiers||'')}" placeholder="Numéro à renseigner"></div>
      <div class="form-field"><label>Police</label><input name="police" inputmode="tel" value="${escapeAttr(nums.police||'')}" placeholder="Numéro à renseigner"></div>
      <div class="form-field"><label>SAMU</label><input name="samu" inputmode="tel" value="${escapeAttr(nums.samu||'')}" placeholder="Numéro à renseigner"></div>`;
  }

  function settingsReferencePanel(module=''){
    const selected = canonicalModuleId(module || activeModules().find(m=>APP_MODULE_IDS.includes(m.id))?.id || 'maison');
    const groups = data.referenceData?.[selected] || {};
    return `${settingsVisualHero({title:`Données ${moduleLabel(selected)}`, text:'Ces listes servent à préparer l’application directement depuis le mobile : magasins, lieux, professionnels, matières, clubs, documents.', img:'assets/images/cards/settings_data.png', emoji:'🧰', chips:[moduleLabel(selected), `${Object.keys(groups).length} liste(s)`, 'Sans import obligatoire']})}
      ${settingsModuleTabs(selected,'Données par application')}
      <div class="settings-reference-grid">${Object.keys(groups).map(g=>`<article class="settings-reference-card clickable-card" onclick="SuperApp.openReferenceEditor('${selected}','${encodeKey(g)}')"><div class="settings-cat-emoji">${appLogoHtml(selected, 40)}</div><div><b>${escapeHtml(g)}</b><small>${(groups[g]||[]).length} valeur(s)</small><p>${(groups[g]||[]).slice(0,4).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</p></div><em>Modifier</em></article>`).join('')}</div>
      <button class="btn primary visual-wide" type="button" onclick="SuperApp.openReferenceEditor('${selected}','')">+ Ajouter une liste</button>`;
  }
  function openReferenceEditor(module, encodedGroup=''){
    module = canonicalModuleId(module);
    const group = decodeKey(encodedGroup);
    const values = group && data.referenceData?.[module]?.[group] ? data.referenceData[module][group] : [];
    $('#editTitle').textContent = group ? `Modifier liste — ${group}` : `Ajouter une liste — ${moduleLabel(module)}`;
    $('#editForm').dataset.type = 'settings_reference';
    $('#editForm').dataset.id = `${module}|${encodeKey(group)}`;
    $('#editFields').innerHTML = `<input type="hidden" name="module" value="${module}"><input type="hidden" name="oldName" value="${escapeAttr(group)}">
      ${settingsVisualHero({title:group || 'Nouvelle liste', text:'Une valeur par ligne. Ces données restent locales et synchronisables plus tard.', img:'assets/images/cards/settings_data.png', emoji:'🧰', chips:[moduleLabel(module),'Liste de référence']})}
      <div class="form-field"><label>Nom de la liste</label><input name="name" required value="${escapeAttr(group)}" placeholder="Ex : magasins, lieux, professionnels"></div>
      <div class="form-field"><label>Valeurs</label><textarea name="values" rows="7" placeholder="Une valeur par ligne">${escapeHtml(values.join('\n'))}</textarea></div>`;
  }
  function settingsAppearancePanel(){
    const a = data.settings.appearance || {};
    $('#editForm').dataset.type = 'settings_appearance';
    // V5.11 — Thème sombre retiré (l'option ne s'affiche plus dans le sélecteur).
    // Si une valeur "sombre" était enregistrée, on bascule en "clair" silencieusement.
    if(a.theme === 'sombre') a.theme = 'clair';
    return `${settingsVisualHero({title:'Apparence', text:'L’interface reste familiale, douce et mignonne. Ici on règle seulement l’ambiance visuelle.', emoji:'🎨', chips:[a.theme||'clair', a.accent||'familial', a.accueil||'resume']})}
      <div class="settings-choice-grid"><label><span>☀️</span><b>Thème</b><select name="theme"><option value="clair" ${a.theme==='clair'?'selected':''}>Clair</option><option value="auto" ${a.theme==='auto'?'selected':''}>Automatique (suit le système)</option></select></label><label><span>🌈</span><b>Accent visuel</b><input name="accent" value="${escapeAttr(a.accent||'familial')}"></label><label><span>🏠</span><b>Accueil préféré</b><select name="accueil"><option value="resume" ${a.accueil==='resume'?'selected':''}>Résumé familial</option><option value="apps" ${a.accueil==='apps'?'selected':''}>Applications</option><option value="calendrier" ${a.accueil==='calendrier'?'selected':''}>Calendrier</option></select></label></div>`;
  }
  function settingsAccountPanel(){
    const email = window._sbUserEmail || '';
    const connected = !!email;
    return `${settingsVisualHero({title:'Compte', text:'Connexion du foyer et accès aux données synchronisées.', img:'assets/images/cards/settings_sync.png', emoji:'👤', chips:[connected ? 'Connecté' : 'Hors ligne', connected ? email : 'Connexion requise']})}
      <div class="settings-account-card">
        <div class="settings-account-main"><span>👤</span><div><b>${connected ? 'Compte connecté' : 'Aucun compte connecté'}</b><small>${connected ? escapeHtml(email) : 'Connecte-toi pour synchroniser et récupérer tes données.'}</small></div></div>
        <div class="settings-account-actions">
          ${connected ? '<button class="btn ghost" type="button" onclick="window.sbLogout?.()">Se déconnecter</button>' : '<button class="btn primary" type="button" onclick="window.sbShowAuthOverlay?.()">Se connecter</button>'}
        </div>
      </div>`;
  }
  function settingsSyncPanel(){
    const meta = window.sbSyncMetaExternal ? window.sbSyncMetaExternal() : '<div class="settings-sync-dates"><small>Dates Supabase indisponibles pour le moment.</small></div>';
    return `${settingsVisualHero({title:'Synchronisation', text:'Envoyer ou récupérer explicitement les données Supabase.', img:'assets/images/cards/settings_sync.png', emoji:'🔄', chips:[`Mode : ${data.offer?.syncMode || 'mobile_only'}`, data.offer?.syncEnabled ? 'Synchro active' : 'Mobile seul', data.offer?.cockpitOrdinateur ? 'Ordinateur acheté' : 'Ordinateur non acheté']})}
      ${meta}
      <div class="settings-data-actions sync-explicit-actions"><button class="btn ghost" type="button" onclick="window.sbForcePushNow?.()"><span>☁️</span><b>Exporter les données vers Supabase</b><small>Envoie les données de cet appareil</small></button><button class="btn ghost" type="button" onclick="window.sbForcePullFromServer?.()"><span>📥</span><b>Récupérer les données depuis Supabase</b><small>Remplace le local par le cloud</small></button><button class="btn ghost android-install-action" type="button" onclick="SuperApp.installPwa()"><span>📱</span><b>Installer sur Android</b><small>Ouvre le prompt Chrome si disponible</small></button></div>
      <div class="today-grid"><button class="btn ghost" type="button" onclick="SuperApp.exportData()">Exporter JSON</button><button class="btn ghost" type="button" onclick="SuperApp.importData()">Importer JSON</button></div>`;
  }
  function settingsDataPanel(){
    const meta = window.sbSyncMetaExternal ? window.sbSyncMetaExternal() : '';
    return `${settingsVisualHero({title:'Sauvegarde & données', text:'Gérer les sauvegardes locales et Supabase.', img:'assets/images/cards/settings_data.png', emoji:'🛡️', chips:['Export JSON','Import JSON','Supabase']})}
      ${meta}
      <div class="settings-data-actions"><button class="btn ghost" type="button" onclick="SuperApp.exportData()"><span>📤</span><b>Exporter JSON</b><small>Sauvegarde fichier</small></button><button class="btn ghost" type="button" onclick="SuperApp.importData()"><span>📥</span><b>Importer JSON</b><small>Restaurer un fichier</small></button><button class="btn ghost" type="button" onclick="window.sbForcePushNow?.()"><span>☁️</span><b>Exporter vers Supabase</b><small>Envoie les données actuelles</small></button><button class="btn ghost" type="button" onclick="window.sbForcePullFromServer?.()"><span>📥</span><b>Récupérer depuis Supabase</b><small>Restaure les données cloud</small></button><button class="btn ghost danger" type="button" onclick="SuperApp.clearDemoData()"><span>🧹</span><b>Supprimer les données de cet appareil</b><small>Supabase conservé</small></button><button class="btn ghost danger" type="button" onclick="SuperApp.resetCloudData()"><span>⛔</span><b>Supprimer définitivement</b><small>Appareil + Supabase</small></button></div>`;
  }
    function selectWeatherCity(scope='settings', city='', postalCode='', country='France', lat=null, lon=null){
    const root = scope === 'onboarding' ? document.getElementById('onboarding') : document.getElementById('editFields');
    if(!root) return;
    const preset = findWeatherPreset(country, city);
    const values = {city: city || preset.city, postalCode: postalCode ?? preset.postalCode ?? '', country: country || preset.country, weatherCity: city || preset.city, latitude: lat ?? preset.lat, longitude: lon ?? preset.lon};
    const names = scope === 'onboarding'
      ? {city:'onbCity', postalCode:'onbPostalCode', country:'onbCountry', weatherCity:'onbWeatherCity', latitude:'onbLatitude', longitude:'onbLongitude', search:'onbWeatherCitySearch'}
      : {city:'city', postalCode:'postalCode', country:'country', weatherCity:'weatherCity', latitude:'latitude', longitude:'longitude', search:'weatherCitySearch'};
    Object.entries(values).forEach(([k,v])=>{ const el = root.querySelector(`[name="${names[k]}"]`); if(el) el.value = v ?? ''; });
    const search = root.querySelector(`[name="${names.search}"]`); if(search) search.value = values.weatherCity || '';
    const label = root.querySelector(`[data-weather-selected-label="${scope}"]`);
    if(label){ label.textContent = values.weatherCity || ''; const small = label.parentElement?.querySelector('small'); if(small) small.textContent = values.postalCode ? `${values.postalCode} — ${values.country}` : values.country; }
    updateWeatherCityPicker(scope, true);
  }
  function updateWeatherCityPicker(scope='settings', keepSearch=false){
    const root = scope === 'onboarding' ? document.getElementById('onboarding') : document.getElementById('editFields');
    if(!root) return;
    const countryName = scope === 'onboarding' ? 'onbCountry' : 'country';
    const searchName = scope === 'onboarding' ? 'onbWeatherCitySearch' : 'weatherCitySearch';
    const weatherName = scope === 'onboarding' ? 'onbWeatherCity' : 'weatherCity';
    const country = root.querySelector(`[name="${countryName}"]`)?.value || 'France';
    const search = root.querySelector(`[name="${searchName}"]`)?.value || '';
    const selected = root.querySelector(`[name="${weatherName}"]`)?.value || '';
    const box = root.querySelector(`[data-weather-suggestions="${scope}"]`);
    if(box) box.innerHTML = weatherCitySuggestionButtons(scope, country, search, selected);
    if(!selected && !keepSearch){
      const first = weatherCitiesForCountry(country)[0];
      if(first) selectWeatherCity(scope, first.city, first.postalCode, first.country, first.lat, first.lon);
    }
  }
    function applyWeatherCity(city, postalCode, country='France', lat=null, lon=null){
    data.foyer = {...(data.foyer||{}), city, postalCode, country, weatherCity:city, latitude:lat, longitude:lon, useDeviceLocation:false, updatedAt:nowISO(), updatedFrom:'application_mobile', syncStatus:'local_only'};
    data.settings.city = city; data.settings.postalCode = postalCode; data.settings.country = country; data.settings.weatherCity = city;
    save(); render(); showSettingsPanel('Localisation du foyer');
    refreshWeather({silent:true, keepCurrentPanel:true});
  }
  function useCurrentPosition(){
    if(!navigator.geolocation){ toast('La géolocalisation n’est pas disponible sur ce téléphone.'); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const nearest = closestWeatherPreset(pos.coords.latitude, pos.coords.longitude);
      data.foyer = {...(data.foyer||{}), city:nearest.city, postalCode:nearest.postalCode || '', country:nearest.country, weatherCity:nearest.city, latitude:pos.coords.latitude, longitude:pos.coords.longitude, useDeviceLocation:true, updatedAt:nowISO(), updatedFrom:'application_mobile', syncStatus:'local_only'};
      data.settings.city = nearest.city; data.settings.postalCode = nearest.postalCode || ''; data.settings.country = nearest.country; data.settings.weatherCity = nearest.city;
      save(); render(); showSettingsPanel('Localisation du foyer');
      refreshWeather({silent:true, keepCurrentPanel:true});
      toast(`📍 Ville météo : ${nearest.city}, ${nearest.country}.`);
    },()=>toast('Position non autorisée. Choisis une ville manuellement.'),{enableHighAccuracy:false,timeout:10000,maximumAge:3600000});
  }

  function weatherCodeLabel(code){
    const c = Number(code);
    if([0].includes(c)) return 'Ciel clair';
    if([1,2].includes(c)) return 'Principalement clair';
    if([3].includes(c)) return 'Nuageux';
    if([45,48].includes(c)) return 'Brouillard';
    if([51,53,55,56,57].includes(c)) return 'Bruine';
    if([61,63,65,66,67,80,81,82].includes(c)) return 'Pluie';
    if([71,73,75,77,85,86].includes(c)) return 'Neige';
    if([95,96,99].includes(c)) return 'Orage';
    return 'Météo';
  }
  function weatherCodeIcon(code){
    const c = Number(code);
    if([0].includes(c)) return '☀️';
    if([1,2].includes(c)) return '🌤️';
    if([3].includes(c)) return '☁️';
    if([45,48].includes(c)) return '🌫️';
    if([51,53,55,56,57].includes(c)) return '🌦️';
    if([61,63,65,66,67,80,81,82].includes(c)) return '🌧️';
    if([71,73,75,77,85,86].includes(c)) return '❄️';
    if([95,96,99].includes(c)) return '⛈️';
    return '🌤️';
  }
  function currentWeatherIcon(){
    const w = data.weather || {};
    return w.icon || weatherCodeIcon(w.weatherCode);
  }
  function weatherCoords(){
    const f = foyer();
    const preset = WEATHER_CITY_PRESETS.find(x=>x.city===f.weatherCity || x.city===f.city) || WEATHER_CITY_PRESETS[0];
    return {
      lat: Number(f.latitude || preset?.lat || 48.747),
      lon: Number(f.longitude || preset?.lon || 6.230),
      city: f.weatherCity || f.city || 'Eulmont'
    };
  }
  async function refreshWeather(options={}){
    const opts = typeof options === 'boolean' ? {silent:options} : options;
    const f = foyer();
    if(f.weatherAuto===false && opts.auto) return false;
    const {lat, lon, city} = weatherCoords();
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error('Météo indisponible');
      const json = await res.json(); const cur = json.current || {};
      const currentTemp = Number(cur.temperature_2m);
      data.weather = {
        city, latitude:lat, longitude:lon,
        temperature: Number.isFinite(currentTemp) ? currentTemp : null,
        wind: cur.wind_speed_10m, weatherCode: cur.weather_code, icon: weatherCodeIcon(cur.weather_code),
        summary: weatherCodeLabel(cur.weather_code),
        source:'open-meteo', updatedAt:nowISO()
      };
      save(); render();
      if(opts.keepCurrentPanel) showSettingsPanel('Localisation du foyer');
      return true;
    }catch(err){
      if(!opts.silent) toast('⚠️ Météo indisponible. La ville reste enregistrée.');
      return false;
    }
  }
  function autoRefreshWeatherOnOpen(){
    const f = foyer();
    if(f.weatherAuto===false) return;
    // Actualisation directe à l’ouverture : on ne garde plus une ancienne température en grand.
    refreshWeather({silent:true, auto:true});
  }

  function archiveMember(id){
    const m = data.family.find(x=>x.id===id); if(!m) return;
    confirmDialog('Archiver ce membre ? Ses anciennes données resteront synchronisables.', () => { m.status='archive'; m.statut='archive'; touchSync(m); save(); render(); showSettingsPanel('Famille'); }, {confirmLabel:'Archiver', danger:false});
  }
  function archiveCategory(module, encodedCat){
    module = canonicalModuleId(module); const cat = decodeKey(encodedCat);
    confirmDialog('Archiver cette catégorie ? Elle sera retirée de la liste mais les anciennes données conserveront leur libellé.', () => { delete data.categories[module][cat]; save(); render(); showSettingsPanel('Catégories',module); }, {confirmLabel:'Archiver', danger:false});
  }

  function openActivationPanel(id){
    id = canonicalModuleId(id);
    const m = moduleById(id);
    if(!APP_MODULE_IDS.includes(id)){ if(id==='calendrier') setView('calendar'); return; }
    $('#editTitle').textContent = `Activation — ${m.name}`;
    $('#editForm').dataset.type = 'settings';
    $('#editForm').dataset.id = '';
    if($('#editDialog').open) $('#editDialog').close();
    $('#editFields').innerHTML = `<div class="empty"><b>${m.name}</b> est disponible comme application indépendante. Elle peut fonctionner seule sur le cockpit mobile et être connectée plus tard au cockpit ordinateur.</div><div class="settings-chips embedded"><span>Cockpit mobile</span><span>Application indépendante</span><span>Connexion ordinateur optionnelle</span></div><button class="btn primary" type="button" onclick="SuperApp.activateApp('${id}')">Activer cette application</button>`;
    $('#editDialog').showModal();
  }
  function activateApp(id){
    id = canonicalModuleId(id); data.appsRegistry = makeAppsRegistry(data.appsRegistry || {});
    if(data.appsRegistry[id]){ Object.assign(data.appsRegistry[id], {actif:true, installe:true, licence:'active', sourceActivation:'cockpit_mobile', activatedAt:nowISO(), connectedToMobile:true, syncStatus:'pending_update'}); }
    save(); if($('#editDialog').open) $('#editDialog').close(); render(); openModule(id);
  }
  function deactivateApp(id){
    id = canonicalModuleId(id); data.appsRegistry = makeAppsRegistry(data.appsRegistry || {});
    const activeCount = APP_MODULE_IDS.filter(x=>data.appsRegistry[x]?.actif).length;
    if(activeCount <= 1){ toast('Le cockpit mobile doit garder au moins une application active.'); return; }
    confirmDialog('Désactiver cette application ? Ses données restent sauvegardées mais ne seront plus affichées dans le calendrier ni les notifications.', () => {
      Object.assign(data.appsRegistry[id], {actif:false, licence:'inactive', syncStatus:'pending_update'}); save(); render();
    });
  }

  function buildExportData(){
    const sourceCollections = structuredClone(data);
    const categories = [];
    const sousCategories = [];
    Object.entries(data.categories || {}).forEach(([module,cats])=>{
      const canonical = canonicalModuleId(module);
      Object.entries(cats || {}).forEach(([name,children])=>{
        const catId = `${canonical}_${name}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_');
        categories.push(decorateSync({id:catId,module:canonical,type:'categorie',titre:name,title:name,statut:'actif'}, 'application_mobile'));
        (children || []).forEach(child=>sousCategories.push(decorateSync({id:`${catId}_${String(child).toLowerCase().replace(/[^a-z0-9]+/g,'_')}`,module:canonical,type:'sous_categorie',categorieId:catId,titre:child,title:child,statut:'actif'}, 'application_mobile')));
      });
    });
    const elements = [];
    collectionRegistry().forEach(([collection,module])=>{
      if(['documents'].includes(collection)) return;
      (data[collection]||[]).forEach(item=>elements.push({...structuredClone(item), module: canonicalModuleId(item.module || module), _collection:collection, titre:item.titre || item.title || item.name || ''}));
    });
    return {
      socle: {offer: structuredClone(data.offer || defaultOffer), appsRegistry: structuredClone(data.appsRegistry || makeAppsRegistry()), foyer: structuredClone(data.foyer || {}), weather: structuredClone(data.weather || {}), referenceData: structuredClone(data.referenceData || {})},
      parametres: structuredClone(data.settings || {}),
      membres: structuredClone(data.family || []),
      modules: structuredClone(data.appsRegistry || makeAppsRegistry()),
      categories,
      sousCategories,
      elements,
      documents: structuredClone(data.documents || []),
      notifications: getNotifications().map(n=>({...n, module:canonicalModuleId(n.module), syncStatus:'synced'})),
      synchronisation: {sourceCollections, generatedFrom:'superapp_famille_mobile_v5_12_menage_visuel', rule:'merge_by_id_updatedAt_no_calendar_duplication_apps_registry_parametres_autonomes'}
    };
  }
  function importData(){
    const input = document.getElementById('importInput');
    if(!input){ toast('Import indisponible.'); return; }
    input.click();
  }
  function exportData(){
    const payload = {
      schema:'superapp_famille', schemaVersion:'1.1.0', exportId:'exp_'+Date.now(), exportedAt:nowISO(), exportedFrom:'application_mobile', appVersion:APP_VERSION,
      offer: structuredClone(data.offer || defaultOffer), appsRegistry: structuredClone(data.appsRegistry || makeAppsRegistry()), data: buildExportData()
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superapp-famille-v${APP_VERSION}-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(url); a.remove(); }catch{} }, 800);
    toast('📤 Export JSON lancé.');
  }
  function normalizeImportPayload(json){
    const payload = json?.schema === 'superapp_famille' ? {...(json.data||{}), offer:json.offer, appsRegistry:json.appsRegistry || json.data?.socle?.appsRegistry} : json;
    if(!payload || typeof payload !== 'object') throw new Error('Format invalide');
    if(payload.synchronisation?.sourceCollections) return ensureDataShape(payload.synchronisation.sourceCollections);
    if(payload.elements || payload.membres || payload.parametres){
      const rebuilt = structuredClone(defaultData);
      rebuilt.settings = {...rebuilt.settings, ...(payload.parametres||{})};
      rebuilt.foyer = {...rebuilt.foyer, ...(payload.socle?.foyer||{})};
      rebuilt.weather = {...rebuilt.weather, ...(payload.socle?.weather||{})};
      if(Array.isArray(payload.membres)) rebuilt.family = payload.membres;
      collectionRegistry().forEach(([collection])=>{ rebuilt[collection] = []; });
      (payload.elements||[]).forEach(item=>{
        const module = canonicalModuleId(item.module);
        const collection = item._collection || targetCollectionFor(module,item.type);
        if(!rebuilt[collection]) rebuilt[collection] = [];
        rebuilt[collection].push({...item,module,title:item.title || item.titre || item.name || 'Sans titre'});
      });
      if(Array.isArray(payload.documents)) rebuilt.documents = payload.documents;
      return ensureDataShape(rebuilt);
    }
    return ensureDataShape(payload);
  }
  function importPayload(json){
    localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, JSON.stringify(data));
    const incoming = normalizeImportPayload(json);
    const result = mergeById(data, incoming);
    data = result.data;
    return result.report;
  }
  function mergeById(local,incoming){
    const out = ensureDataShape(structuredClone(local));
    const report = {added:0, updated:0, conflicts:0};
    out.settings = {...out.settings, ...(incoming.settings||{})};
    out.offer = {...defaultOffer, ...(out.offer||{}), ...(incoming.offer||{})};
    out.settings.offer = {...defaultOffer, ...(out.settings.offer||{}), ...(incoming.settings?.offer||{}), ...(incoming.offer||{})};
    out.appsRegistry = makeAppsRegistry({...out.appsRegistry, ...(incoming.appsRegistry||{})});
    out.foyer = {...(out.foyer||{}), ...(incoming.foyer||{})};
    out.weather = {...(out.weather||{}), ...(incoming.weather||{})};
    out.family = mergeArray(out.family, incoming.family || [], report);
    out.categories = migrateCategories({...out.categories, ...(incoming.categories||{})});
    collectionRegistry().forEach(([collection])=>{ out[collection] = mergeArray(out[collection]||[], incoming[collection]||[], report); });
    if(incoming.foodBudget) out.foodBudget = incoming.foodBudget;
    out.referenceData = {...(out.referenceData||{}), ...(incoming.referenceData||{})};
    Object.keys(incoming.referenceData||{}).forEach(mid=>{ out.referenceData[mid] = {...(out.referenceData[mid]||{}), ...(incoming.referenceData[mid]||{})}; });
    return {data:out, report};
  }
  function mergeArray(localArr,incomingArr,report={added:0,updated:0,conflicts:0}){
    const map = new Map((localArr||[]).filter(x=>x && x.id).map(x=>[x.id,x]));
    (incomingArr||[]).forEach(raw=>{
      const item = normaliseItem({...raw}, raw.module);
      const existing = map.get(item.id);
      if(!existing){ map.set(item.id,item); report.added++; }
      else {
        const a = Date.parse(existing.updatedAt || existing.createdAt || 0);
        const b = Date.parse(item.updatedAt || item.createdAt || 0);
        if(b > a){ map.set(item.id,item); report.updated++; }
        else if(b === a && JSON.stringify(existing) !== JSON.stringify(item)){ existing.syncStatus='conflict'; report.conflicts++; }
      }
    });
    return [...map.values()];
  }

  function sanitizeLegacyPersonalDemoData(){
    const demoNames = ['mandiaye','julie','salma','salif','awa'];
    const familyBlob = normalizeText((data.family||[]).map(m=>`${m.id||''} ${m.name||''}`).join(' '));
    const hasPersonalDemo = demoNames.some(n=>familyBlob.includes(n)) || normalizeText(data.settings?.familyName || '') === 'famille diallo';
    if(!hasPersonalDemo || data.settings?.cleanStartupAppliedV532) return;
    data = emptyApplicationData();
    data.settings.cleanStartupAppliedV532 = true;
    save();
  }

  function emptyApplicationData(){
    const clean = ensureDataShape(structuredClone(defaultData));
    clean.settings = {...clean.settings, onboarded:false, familyName:'', familyPreferences:'', activeProfile:'family'};
    clean.foyer = {...clean.foyer, city:'', postalCode:'', country:'', weatherCity:'', latitude:null, longitude:null};
    clean.weather = {city:'', temperature:null, wind:null, summary:'Météo à configurer', updatedAt:''};
    clean.family = [];
    ['tasks','shopping','meals','weeklyMeals','stock','homework','schoolDocs','health','vaccines','healthDocs','emergency','sports','sportGear','familyDocuments','documents','calendarEvents','notifications'].forEach(k=>{ clean[k]=[]; });
    return clean;
  }
  function resetConfirmContent(mode='reset'){
    const isCloud = mode === 'cloud';
    const title = isCloud ? 'Supprimer définitivement les données' : 'Supprimer les données de cet appareil';
    return `<div class="reset-confirm-card">
      <div class="reset-confirm-hero"><span>⚠️</span><div><b>${title}</b><small>${isCloud ? 'Suppression locale et Supabase.' : 'Suppression locale uniquement.'}</small></div></div>
      <p>${isCloud ? 'Cette opération supprime aussi les données Supabase du compte connecté. Elles ne reviendront pas après synchronisation.' : 'Cette opération vide seulement cet appareil. Les données peuvent revenir avec le bouton Récupérer Supabase si elles existent encore dans le cloud.'}</p>
      <div class="reset-import-help"><b>Avant de supprimer</b><ol><li>Cliquer sur <b>Exporter mes données JSON</b>.</li><li>Conserver le fichier sur votre téléphone ou ordinateur.</li><li>Après réinitialisation : <b>Paramètres &gt; Sauvegarde et données &gt; Importer JSON</b>.</li><li>Sélectionner le fichier exporté puis valider l’import pour restaurer les données.</li></ol></div>
      <div class="reset-confirm-actions"><button class="btn ghost" type="button" onclick="SuperApp.exportData()">📤 Exporter mes données JSON</button><button class="btn ghost" type="button" onclick="SuperApp.closeEditDialog()">Annuler</button><button class="btn primary danger" type="button" onclick="SuperApp.confirmFullReset('${mode}')">${isCloud ? 'Supprimer définitivement' : 'Supprimer sur cet appareil'}</button></div>
    </div>`;
  }
  function openResetConfirmDialog(mode='reset'){
    $('#editTitle').textContent = mode === 'cloud' ? 'Suppression définitive' : 'Suppression locale';
    $('#editForm').dataset.type = 'reset_confirm';
    $('#editForm').dataset.id = '';
    $('#editFields').innerHTML = resetConfirmContent(mode);
    // Masquer les boutons Annuler/Enregistrer (la modale gère ses propres boutons)
    const actions = $('#editForm .dialog-actions');
    if(actions) actions.setAttribute('hidden', '');
    if($('#editDialog').open) $('#editDialog').close();
    $('#editDialog').showModal();
  }
  async function confirmFullReset(mode='local'){
    const cloud = mode === 'cloud';
    if(cloud && !confirm('Confirmer la suppression définitive des données Supabase ?')) return;
    if(cloud && typeof sbDeleteAllCloudData === 'function'){
      try { await sbDeleteAllCloudData(); }
      catch(e){ toast('⚠️ Suppression Supabase impossible : ' + (e.message || e)); return; }
    }
    data = emptyApplicationData();
    if(!cloud){
      window._sbPauseAutoPush = true;
      window._sbLocalDeleteGuard = true;
      try{ localStorage.setItem('superapp_local_delete_guard','1'); }catch{}
    }
    save();
    window._sbPauseAutoPush = false;
    closeEditDialog();
    render();
    toast(cloud ? '⛔ Données supprimées définitivement' : '🧹 Données locales supprimées. Utilise Récupérer Supabase ou Import JSON pour restaurer.');
    setTimeout(()=>startOnboarding(true), 120);
  }
  function clearDemoData(){ openResetConfirmDialog('local'); }
  function resetData(){ openResetConfirmDialog('local'); }
  function resetCloudData(){ openResetConfirmDialog('cloud'); }
  // ---- Accueil guidé : configuration minimale + première action familiale ----------
  function maybeStartOnboarding(){ if(!data.settings || !data.settings.onboarded) startOnboarding(true); }
  function closeOnboarding(){ document.getElementById('onboarding')?.remove(); }
  function startOnboarding(firstRun=false){
    closeOnboarding();
    const wrap = document.createElement('div');
    wrap.id = 'onboarding'; wrap.className = 'onboarding-backdrop';
    wrap.innerHTML = onboardingWelcome();
    wrap.addEventListener('click', e => onboardingClick(e, wrap));
    wrap.addEventListener('input', e => { if(e.target.closest('#onboarding')) updateOnboardingPreview(wrap); });
    document.body.appendChild(wrap);
  }
  function onboardingProgress(step,total=5){ return `<div class="onb-progress"><span>Étape ${step} sur ${total}</span><i style="width:${Math.round((step/total)*100)}%"></i></div>`; }
  function onboardingWelcome(){
    return `<div class="onboarding-card onboarding-card-v531 welcome-rich">
      <div class="welcome-visual">
        <img class="welcome-family-img" src="assets/images/hero/header.png" alt="Famille organisée">
        <div class="welcome-app-icons">${modules.slice(0,5).map(m=>`<img src="${m.badge}" alt="${escapeAttr(m.short)}" onerror="this.style.display='none'">`).join('')}</div>
      </div>
      <div class="onb-head"><span>BIENVENUE 👋</span><h2>Bienvenue dans SuperApp Famille</h2>
      <p>Démarre avec une application propre : aucun membre, aucune tâche et aucune donnée de démonstration. Tu peux configurer ton foyer maintenant ou aller directement aux apps.</p></div>
      <div class="welcome-empty-note"><b>✨ Nouveau départ propre</b><small>Les exemples restent uniquement dans les champs d’aide : rien n’est enregistré sans ton choix.</small></div>
      <div class="onb-choice-grid">
        <button type="button" class="onb-choice-card primary" data-onb-step="family"><b>✨ Me guider maintenant</b><small>Choisir la famille, la météo, les notifications puis créer une première action.</small></button>
        <button type="button" class="onb-choice-card" data-onb-finish="quick"><b>🚀 Aller directement aux apps</b><small>Tu pourras configurer ton foyer plus tard depuis Paramètres.</small></button>
      </div>
    </div>`;
  }
  function onboardingFamily(){
    const current = currentFamilyPack();
    const cards = FAMILY_PACKS.map(p=>`<button type="button" class="family-pack-card onb-family-pack ${p.id===current?'active':''}" data-onb-pack="${p.id}"><img src="${p.family}" alt=""><div><b>${escapeHtml(p.label)}</b><small>${escapeHtml(p.desc)}</small></div></button>`).join('');
    return `<div class="onboarding-card onboarding-card-v531">${onboardingProgress(1)}
      <div class="onb-head"><span>FAMILLE VISUELLE</span><h2>Choisir le style de famille</h2><p>Ce choix alimente les images principales, les avatars et les cartes membres.</p></div>
      <div class="family-pack-grid onb-pack-grid">${cards}</div>
      <div class="onb-actions"><button type="button" class="btn ghost" data-onb-step="welcome">Retour</button><button type="button" class="btn primary" data-onb-save="family">Continuer ›</button></div>
    </div>`;
  }
  function onboardingMemberMiniCards(){
    const members = (data.family || []).filter(m=>m && m.active !== false && m.status !== 'archive' && m.statut !== 'archive');
    if(!members.length){
      return `<div class="onb-members-empty"><b>👤 Aucun membre ajouté</b><small>Ajoute les membres du foyer pour les voir ici avant de continuer.</small></div>`;
    }
    return `<div class="onb-members-list">${members.map(m=>`
      <article class="onb-member-mini member-${escapeAttr(m.accent || 'violet')}">
        <img src="${memberAvatarSrc(m)}" alt="" onerror="this.style.visibility='hidden'">
        <div><b>${escapeHtml(shortMemberName(m.name || 'Membre'))}</b><small>${escapeHtml(m.role || 'Membre')}</small></div>
        <div class="onb-member-actions">
          <button type="button" data-onb-edit-member="${escapeAttr(m.id)}">Modifier</button>
          <button type="button" data-onb-delete-member="${escapeAttr(m.id)}">Supprimer</button>
        </div>
      </article>`).join('')}</div>`;
  }
  function onboardingHousehold(){
    const count = (data.family || []).filter(m=>m && m.active !== false && m.status !== 'archive' && m.statut !== 'archive').length;
    return `<div class="onboarding-card onboarding-card-v531">${onboardingProgress(2)}
      <div class="onb-head"><span>FOYER</span><h2>Nommer le foyer</h2><p>Ajoute les membres du foyer : ils apparaîtront juste en dessous en mini-fiches avec leur avatar, pour vérifier la famille avant de continuer.</p></div>
      <div class="onb-form-card">
        <label>Nom du foyer</label><input name="onbFamilyName" value="${escapeAttr(data.settings?.familyName || '')}" placeholder="Ex. Famille Martin, Famille Ndiaye...">
        <div class="onb-mini-actions"><button type="button" class="btn ghost" data-onb-open-member>+ Ajouter un membre</button></div>
      </div>
      <section class="onb-members-panel">
        <div class="onb-members-head"><div><b>Membres ajoutés</b><small>${count} membre${count>1?'s':''} dans le foyer</small></div><button type="button" class="link-btn" data-onb-open-member>+ Ajouter</button></div>
        ${onboardingMemberMiniCards()}
      </section>
      <div class="onb-actions"><button type="button" class="btn ghost" data-onb-step="family">Retour</button><button type="button" class="btn primary" data-onb-save="household">Continuer ›</button></div>
    </div>`;
  }
  function onboardingLocation(){
    const country = data.foyer?.country || data.settings?.country || 'France';
    const selected = findWeatherPreset(country, data.foyer?.weatherCity || data.foyer?.city || '');
    return `<div class="onboarding-card onboarding-card-v531">${onboardingProgress(3)}
      <div class="onb-head"><span>FOYER &amp; MÉTÉO</span><h2>Adresse et localisation</h2>
      <p>L’adresse reste sur l’appareil. La ville météo alimente l’accueil.</p></div>
      <div class="onb-form-card">
        <label>Numéro et rue</label><input name="onbAddress" value="${escapeAttr(data.foyer?.address||'')}" placeholder="Ex : 12 rue des Acacias">
        <label style="margin-top:8px">Complément</label><input name="onbAddressComplement" value="${escapeAttr(data.foyer?.addressComplement||'')}" placeholder="Appt, bâtiment… (facultatif)">
        <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:10px;margin-top:8px">
          <div><label>Code postal</label><input name="onbPostalCode" value="${escapeAttr(data.foyer?.postalCode||'')}" placeholder="54690" inputmode="numeric"></div>
          <div><label>Ville</label><input name="onbCity" value="${escapeAttr(data.foyer?.city||'')}" placeholder="Eulmont"></div>
        </div>
        <label style="margin-top:8px">Pays</label><select name="onbCountry" required onchange="SuperApp.updateWeatherCityPicker('onboarding')">${countryOptions(country)}</select>
      </div>
      <div class="onb-form-card weather-picker" data-weather-picker="onboarding" style="margin-top:12px">
        <p style="margin:0 0 8px;font-size:13px;color:var(--muted)">🌤️ Ville météo (peut différer de l’adresse)</p>
        <button type="button" class="btn ghost visual-wide" data-onb-use-location>📍 Utiliser ma position</button>
        <label style="margin-top:8px">Rechercher</label><input name="onbWeatherCitySearch" value="${escapeAttr(data.foyer?.weatherCity || selected.city || '')}" placeholder="Dakar, Eulmont, Nancy..." oninput="SuperApp.updateWeatherCityPicker('onboarding')">
        <div class="weather-current-choice"><span>✅</span><div><b data-weather-selected-label="onboarding">${escapeHtml(data.foyer?.weatherCity || selected.city)}</b><small>${escapeHtml(selected.postalCode ? selected.postalCode + ' — ' + selected.country : selected.country)}</small></div></div>
        <div class="weather-suggestions" data-weather-suggestions="onboarding">${weatherCitySuggestionButtons('onboarding', country, '', data.foyer?.weatherCity || selected.city)}</div>
        <input type="hidden" name="onbWeatherCity" value="${escapeAttr(data.foyer?.weatherCity || selected.city)}">
        <input type="hidden" name="onbLatitude" value="${escapeAttr(data.foyer?.latitude || selected.lat || '')}">
        <input type="hidden" name="onbLongitude" value="${escapeAttr(data.foyer?.longitude || selected.lon || '')}">
      </div>
      <div class="onb-actions"><button type="button" class="btn ghost" data-onb-step="household">Retour</button><button type="button" class="btn primary" data-onb-save="location">Continuer ›</button></div>
    </div>`;
  }
  function onboardingNotifications(){
    const prefs = data.settings?.notificationsPrefs || {};
    const checked = k => prefs[k] !== false ? 'checked' : '';
    return `<div class="onboarding-card onboarding-card-v531">${onboardingProgress(4)}
      <div class="onb-head"><span>RAPPELS</span><h2>Activer les notifications utiles</h2><p>Tu peux tout couper ou choisir les modules qui ont le droit d’envoyer des rappels.</p></div>
      <div class="onb-toggle-list">
        <label><input type="checkbox" name="onbNotifGlobal" ${checked('global')}> <b>Notifications globales</b><small>Autoriser les rappels familiaux.</small></label>
        ${APP_MODULE_IDS.map(id=>`<label><input type="checkbox" name="onbNotif_${id}" ${checked(id)}> <b>${moduleById(id).name}</b><small>Rappels de ce module.</small></label>`).join('')}
      </div>
      <div class="onb-actions"><button type="button" class="btn ghost" data-onb-step="location">Retour</button><button type="button" class="btn primary" data-onb-save="notifications">Continuer ›</button></div>
    </div>`;
  }
  function onboardingFirstAction(){
    const actions = [
      ['maison','🏠','Une tâche maison','Ajouter une tâche ménagère'],
      ['courses_repas','🛒','Un article aux courses','Ajouter du lait ou des tomates'],
      ['sante','💗','Un rendez-vous santé','Ajouter un vaccin ou un traitement'],
      ['education','📚','Une séance d’éducation','Ajouter une séance de révision'],
      ['sport_loisirs','⚽','Une activité sport','Ajouter un entraînement']
    ];
    return `<div class="onboarding-card onboarding-card-v531">${onboardingProgress(5)}
      <div class="onb-head"><span>PREMIÈRE ACTION</span><h2>Que veux-tu organiser en premier ?</h2><p>L’app démarre sans fausse tâche. Cette étape crée uniquement ce que tu choisis vraiment.</p></div>
      <div class="onb-action-grid">${actions.map(([id,icon,title,txt])=>`<button type="button" class="onb-action-card" data-onb-first-action="${id}"><span>${icon}</span><b>${title}</b><small>${txt}</small></button>`).join('')}</div>
      <div class="onb-actions"><button type="button" class="btn ghost" data-onb-step="notifications">Retour</button><button type="button" class="btn primary" data-onb-finish="home">Passer et aller à l’accueil</button></div>
    </div>`;
  }
  function updateOnboardingPreview(wrap){
    const city = wrap.querySelector('[name="onbCity"]');
    const weather = wrap.querySelector('[name="onbWeatherCity"]');
    if(city && weather && !weather.value.trim()) weather.value = city.value;
  }
  function onboardingClick(e, wrap){
    const stepBtn = e.target.closest('[data-onb-step]');
    if(stepBtn){
      const step = stepBtn.dataset.onbStep;
      wrap.innerHTML = ({welcome:onboardingWelcome, family:onboardingFamily, household:onboardingHousehold, location:onboardingLocation, notifications:onboardingNotifications, firstAction:onboardingFirstAction}[step] || onboardingWelcome)();
      return;
    }
    const pack = e.target.closest('[data-onb-pack]');
    if(pack){
      data.settings.familyAvatarPack = pack.dataset.onbPack;
      wrap.querySelectorAll('[data-onb-pack]').forEach(b=>b.classList.toggle('active', b===pack));
      return;
    }
    const editMember = e.target.closest('[data-onb-edit-member]');
    if(editMember){ saveOnboardingHousehold(wrap); save(); openSettingsMember(editMember.dataset.onbEditMember || ''); return; }
    const deleteMember = e.target.closest('[data-onb-delete-member]');
    if(deleteMember){ removeOnboardingMember(deleteMember.dataset.onbDeleteMember || '', wrap); return; }
    if(e.target.closest('[data-onb-open-member]')){ saveOnboardingHousehold(wrap); save(); openSettingsMember(''); return; }
    if(e.target.closest('[data-onb-use-location]')){
      if(!navigator.geolocation){ toast('Géolocalisation non disponible'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        const nearest = closestWeatherPreset(pos.coords.latitude, pos.coords.longitude);
        selectWeatherCity('onboarding', nearest.city, nearest.postalCode || '', nearest.country, pos.coords.latitude, pos.coords.longitude);
        toast(`Ville météo proposée : ${nearest.city}`);
      },()=>toast('Position non autorisée. Choisis une ville manuellement.'),{enableHighAccuracy:false,timeout:10000,maximumAge:3600000});
      return;
    }
    const saveBtn = e.target.closest('[data-onb-save]');
    if(saveBtn){
      const type = saveBtn.dataset.onbSave;
      if(type==='family') save();
      if(type==='household') saveOnboardingHousehold(wrap);
      if(type==='location') saveOnboardingLocation(wrap);
      if(type==='notifications') saveOnboardingNotifications(wrap);
      const next = {family:'household', household:'location', location:'notifications', notifications:'firstAction'}[type];
      wrap.innerHTML = ({household:onboardingHousehold, location:onboardingLocation, notifications:onboardingNotifications, firstAction:onboardingFirstAction}[next] || onboardingFirstAction)();
      save(); render();
      return;
    }
    const first = e.target.closest('[data-onb-first-action]');
    if(first){ finishOnboarding('action', first.dataset.onbFirstAction); return; }
    const finish = e.target.closest('[data-onb-finish]');
    if(finish){ finishOnboarding(finish.dataset.onbFinish || 'home'); return; }
  }
  function removeOnboardingMember(id, wrap){
    if(!id) return;
    saveOnboardingHousehold(wrap);
    data.family = (data.family || []).filter(m=>String(m.id) !== String(id));
    save();
    wrap.innerHTML = onboardingHousehold();
    toast('Membre supprimé du guide');
  }
  function saveOnboardingHousehold(wrap){
    const name = wrap.querySelector('[name="onbFamilyName"]')?.value?.trim();
    if(name) data.settings.familyName = name;
  }
  function saveOnboardingLocation(wrap){
    const country = wrap.querySelector('[name="onbCountry"]')?.value || data.foyer?.country || 'France';
    const city = wrap.querySelector('[name="onbCity"]')?.value?.trim() || '';
    const postalCode = wrap.querySelector('[name="onbPostalCode"]')?.value?.trim() || '';
    const address = wrap.querySelector('[name="onbAddress"]')?.value?.trim() || '';
    const addressComplement = wrap.querySelector('[name="onbAddressComplement"]')?.value?.trim() || '';
    const weatherCity = wrap.querySelector('[name="onbWeatherCity"]')?.value?.trim() || city || '';
    const latitude = Number(wrap.querySelector('[name="onbLatitude"]')?.value || 0) || null;
    const longitude = Number(wrap.querySelector('[name="onbLongitude"]')?.value || 0) || null;
    data.foyer = {...(data.foyer||{}), address, addressComplement, country, city, postalCode,
      weatherCity, latitude, longitude, weatherAuto:true,
      updatedAt:nowISO(), updatedFrom:'onboarding', syncStatus:'pending_update'};
    data.settings.country = country; data.settings.city = city;
    data.settings.postalCode = postalCode; data.settings.weatherCity = weatherCity;
  }
  function saveOnboardingNotifications(wrap){
    const prefs = {...(data.settings.notificationsPrefs || {})};
    prefs.global = !!wrap.querySelector('[name="onbNotifGlobal"]')?.checked;
    APP_MODULE_IDS.forEach(id=>{ prefs[id] = !!wrap.querySelector(`[name="onbNotif_${id}"]`)?.checked; });
    data.settings.notificationsPrefs = prefs;
  }
  function finishOnboarding(mode='home', moduleId=''){
    data.appsRegistry = makeAppsRegistry(data.appsRegistry || {});
    data.settings.onboarded = true;
    save(); closeOnboarding(); render();
    if(mode === 'quick' || mode === 'home') { setView('home'); toast('Bienvenue 👋 Configuration disponible dans Paramètres.'); return; }
    if(mode === 'action'){
      const module = canonicalModuleId(moduleId || 'maison');
      const presets = {
        maison:['tache','Ménage',''],
        courses_repas:['course','Alimentation',''],
        sante:['rendez_vous_medical','Rendez-vous',''],
        education:['cours','Révisions',''],
        sport_loisirs:['activite','Sport','']
      };
      const [type,category,title] = presets[module] || ['evenement','Famille',''];
      setTimeout(()=>openAdd(module,type,category,title,'family'),80);
    }
  }

  /* ------------------------------------------------------------------
     V5.4 — couche de cohérence logique
     Une seule source par grande liste : accueil, KPI, listes, alertes,
     notifications et calendrier lisent les mêmes fonctions.
  ------------------------------------------------------------------ */
  function normalizeText(v){ return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function normalizeDateInput(value){
    if(!value) return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)){ const [y,m,d]=value.split('-'); return `${d}-${m}-${y}`; }
    if(/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
    return value;
  }
  function statusIsDone(item={}){
    const s = normalizeText(item.status || item.statut || item.state || '');
    return ['fait','done','termine','terminé','achete','acheté','complete','completed'].includes(s);
  }
  function statusIsHidden(item={}){
    const s = normalizeText(item.status || item.statut || item.state || '');
    const sync = normalizeText(item.syncStatus || item.sync_status || '');
    return item.active === false || item.deleted === true || sync === 'pending_delete' || ['archive','archivé','archived','supprime','supprimé','deleted','hidden','masque','masqué'].includes(s);
  }
  function visibleItems(collection){ return (data[collection] || []).filter(x=>!statusIsHidden(x)); }
  function openItems(collection){ return visibleItems(collection).filter(x=>!statusIsDone(x)); }
  function itemType(x){ return normalizeText(x?.type || x?.category || ''); }
  function itemCategory(x){ return normalizeText(x?.category || x?.title || x?.type || ''); }
  function matchesWords(x, words){ const blob = normalizeText(`${x?.title||''} ${x?.category||''} ${x?.type||''} ${x?.notes||''}`); return words.some(w=>blob.includes(normalizeText(w))); }

  function getMaisonTasks(filter='open'){
    let arr = visibleItems('tasks');
    if(filter === 'open') arr = arr.filter(x=>!statusIsDone(x));
    if(filter === 'today' || filter === 'taches_aujourdhui') arr = arr.filter(x=>!statusIsDone(x) && (x.date === today || (/quotidien|daily/i.test(x.recurrence||''))));
    if(filter === 'late' || filter === 'taches_retard') arr = arr.filter(x=>!statusIsDone(x) && x.date && daysDiff(today,x.date) < 0);
    if(filter === 'recurrent' || filter === 'taches_recurrentes') arr = arr.filter(x=>matchesWords(x,['routine','récurrent','recurrent','quotidien','hebdo']));
    if(filter === 'done') arr = arr.filter(statusIsDone);
    return arr;
  }
  function getGenericChecklistItems(kind='all', parentId=''){
    let arr = visibleItems('documents').filter(x=>String(x.type||'').startsWith('checklist_'));
    if(kind && kind !== 'all') arr = arr.filter(x=>String(x.type||'').includes(kind) || canonicalModuleId(x.module) === canonicalModuleId(kind));
    if(parentId) arr = arr.filter(x=>String(x.parentId||'') === String(parentId));
    return arr;
  }
  function getMenus(filter='all'){
    let arr = [...visibleItems('meals'), ...visibleItems('weeklyMeals')].map(x=>({...x,module:'courses_repas'}));
    if(filter === 'today') arr = arr.filter(x=>x.date === today || Number(x.day) === ((todayObj.getDay()+6)%7));
    return arr;
  }
  function getShoppingItems(filter='open'){
    let arr = visibleItems('shopping');
    if(filter === 'open' || filter === 'todo') arr = arr.filter(x=>!statusIsDone(x));
    if(filter === 'done') arr = arr.filter(statusIsDone);
    return arr;
  }
  function getStockItems(filter='all'){
    let arr = visibleItems('stock');
    if(filter === 'low' || filter === 'stock_faible') arr = arr.filter(x=>normalizeText(x.level).includes('faible') || matchesWords(x,['à racheter','a racheter','faible']));
    return arr;
  }
  function getSchoolItems(filter='open'){
    let arr = [...visibleItems('homework'), ...visibleItems('schoolDocs')].map(x=>({...x,module:'education'}));
    if(filter === 'open') arr = arr.filter(x=>!statusIsDone(x));
    if(filter === 'today') arr = arr.filter(x=>!statusIsDone(x) && (x.date === today || isRecurringDueToday(x)));
    return arr;
  }
  function isAppointment(x){ return ['appointment','rendez_vous_medical','rendez vous medical','rdv'].includes(itemType(x)); }
  function treatmentDueToday(x){
    const start = x.startDate || x.date || today;
    const end = x.endDate || '';
    const fromStart = daysDiff(start, today);
    if(fromStart < 0) return false;
    if(end && daysDiff(today, end) < 0) return false;
    const f = normalizeText(x.frequency || 'quotidienne');
    if(f.includes('2')) return fromStart % 2 === 0;
    if(f.includes('hebdo')) return fromStart % 7 === 0;
    if(f.includes('mens')) return parseDMY(start)?.getDate() === parseDMY(today)?.getDate();
    return true;
  }
  function getHealthTreatments(filter='open'){
    let arr = visibleItems('health').filter(x=>!isAppointment(x));
    if(filter === 'open') arr = arr.filter(x=>!statusIsDone(x));
    if(filter === 'today') arr = arr.filter(x=>!statusIsDone(x) && treatmentDueToday(x));
    return arr;
  }
  function getHealthAppointments(filter='open'){
    let arr = visibleItems('health').filter(isAppointment);
    if(filter === 'open') arr = arr.filter(x=>!statusIsDone(x));
    return arr;
  }
  function getHealthBookItems(filter='all'){ return [...visibleItems('vaccines'), ...visibleItems('healthDocs'), ...visibleItems('emergency')].map(x=>({...x,module:'sante'})); }
  function getSportActivities(filter='open'){
    let arr = visibleItems('sports');
    if(filter === 'open') arr = arr.filter(x=>!statusIsDone(x));
    if(filter === 'today') arr = arr.filter(x=>!statusIsDone(x) && (x.date === today || x.startDate === today || isRecurringDueToday(x)));
    // clubs et lieux restent en références, pas en action principale
    arr = arr.filter(x=>!['clubs lieux','clubs & lieux','club','lieu'].includes(itemCategory(x)));
    return arr;
  }
  function getSportGear(filter='all'){ return visibleItems('sportGear'); }
  function isRecurringDueToday(x){
    if(!x.recurrence||x.recurrence==='ponctuelle') return false;
    if(x.startDate&&x.startDate>today) return false;
    if(x.endDate&&x.endDate<today) return false;
    if(x.recurrence==='quotidienne') return true;
    const dow=new Date().getDay();
    if(x.recurrence==='hebdomadaire') return x.recurDay!==undefined?Number(x.recurDay)===dow:(x.date?new Date(x.date).getDay()===dow:false);
    if(x.recurrence==='mensuelle') return x.date?new Date(x.date).getDate()===new Date().getDate():false;
    return false;
  }
  function getLoisirActivities(filter='open'){
    let arr=visibleItems('loisirs');
    if(filter==='open') arr=arr.filter(x=>!statusIsDone(x));
    if(filter==='today') arr=arr.filter(x=>!statusIsDone(x)&&(x.date===today||isRecurringDueToday(x)));
    return arr;
  }
  function getLoisirGear(){ return visibleItems('loisirGear'); }
  function getVoyageActivities(filter='open'){
    let arr=visibleItems('voyages');
    if(filter==='open') arr=arr.filter(x=>!statusIsDone(x));
    if(filter==='today') arr=arr.filter(x=>!statusIsDone(x)&&(x.date===today||isRecurringDueToday(x)));
    return arr;
  }
  function getVoyageGear(){ return visibleItems('voyageGear'); }
  function getFamilyMembers(filter='all'){
    let arr = (data.family || []).filter(m=>!statusIsHidden(m) && m.active !== false);
    if(filter === 'adults') arr = arr.filter(m=>m.role !== 'Enfant');
    if(filter === 'children') arr = arr.filter(m=>m.role === 'Enfant');
    return arr;
  }
  function getFamilyDocuments(filter='all'){ return visibleItems('familyDocuments'); }

  function collectionForItemLike(x){
    if(x._sourceCollection) return x._sourceCollection;
    const m = canonicalModuleId(x.module);
    if(m==='maison') return 'tasks';
    if(m==='courses_repas') return x.type==='stock' ? 'stock' : (x.type==='course' ? 'shopping' : 'meals');
    if(m==='education') return x.type==='document_ecole' ? 'schoolDocs' : 'homework';
    if(m==='sante') return x.type==='vaccin' ? 'vaccines' : (x.type==='document_sante' ? 'healthDocs' : (x.type==='urgence_sante' ? 'emergency' : 'health'));
    if(m==='sport_loisirs'){
      if(x._sourceCollection) return x._sourceCollection;
      if(x.type==='materiel_loisir') return 'loisirGear';
      if(x.type==='materiel_voyage') return 'voyageGear';
      if(['materiel_sport','document_sport'].includes(x.type)) return 'sportGear';
      if(x.type==='loisir') return 'loisirs';
      if(x.type==='voyage') return 'voyages';
      return 'sports';
    }
    if(m==='familles') return 'familyDocuments';
    return 'calendarEvents';
  }
  function moduleItems(id){
    id = canonicalModuleId(id);
    if(!isAppActive(id)) return [];
    if(id==='maison') return getMaisonTasks('open');
    if(id==='courses_repas') return [...getMenus(), ...getShoppingItems('open'), ...getStockItems()];
    if(id==='education') return getSchoolItems('open');  // V5.7: les notes sont déjà dans homework
    if(id==='sante') return [...getHealthTreatments('open'), ...getHealthAppointments('open'), ...getHealthBookItems()];
    if(id==='sport_loisirs') return [...getSportActivities('open'),...getLoisirActivities('open'),...getVoyageActivities('open'),...getSportGear(),...getLoisirGear(),...getVoyageGear()];
    if(id==='familles') return [...getFamilyMembers().map(m=>({...m,module:'familles',title:m.name,date:m.birth,member:m.id,category:'Membre'})), ...getFamilyDocuments()];
    return visibleItems('calendarEvents');
  }
  function countForModule(id){
    id = canonicalModuleId(id);
    if(id==='maison') return `${getMaisonTasks('open').length} tâches`;
    if(id==='courses_repas') return `${getShoppingItems('open').length} courses`;
    if(id==='education') return `${getSchoolItems('open').length} école`;
    if(id==='sante') return `${getHealthTreatments('today').length + getHealthAppointments('open').filter(x=>daysDiff(today,x.date)>=0 && daysDiff(today,x.date)<=5).length} rappel`;
    if(id==='sport_loisirs'){
      const _t=getSportActivities('open').length+getLoisirActivities('open').length+getVoyageActivities('open').length;
      return `${_t} activité${_t>1?'s':''}`;}

    if(id==='familles') return `${getFamilyMembers().length} membres`;
    return `${moduleItems(id).length}`;
  }
  function isCalendarProjection(item={}){
    const module = canonicalModuleId(item.module || 'calendrier');
    const type = normalizeText(item.type || item.category || '');
    const hasSource = !!(item.sourceId || item.linkedSourceId || item.parentId || item.originId || item.sourceCollection);
    const appProjection = APP_MODULE_IDS.includes(module);
    const projectedTypes = ['tache','task','repas','menu','course','stock','devoir','controle','document_ecole','note','traitement','medicament','medication','appointment','rendez_vous_medical','vaccin','document_sante','urgence_sante','activite','sortie','rappel','materiel_sport','document_sport','document_famille'];
    return hasSource || appProjection || projectedTypes.includes(type);
  }
  function sameCalendarProjection(a={}, b={}){
    const modA = canonicalModuleId(a.module || '');
    const modB = canonicalModuleId(b.module || '');
    if(modA && modB && modA !== modB) return false;
    const titleA = normalizeText(a.title || a.titre || a.name || '');
    const titleB = normalizeText(b.title || b.titre || b.name || '');
    return !!titleA && titleA === titleB && String(a.date||'') === String(b.date||'');
  }
  function hideCalendarCopiesOf(source={}){
    if(!Array.isArray(data.calendarEvents)) return 0;
    let changed = 0;
    data.calendarEvents.forEach(ev=>{
      const linked = [ev.sourceId, ev.linkedSourceId, ev.parentId, ev.originId].filter(Boolean).map(String);
      if(linked.includes(String(source.id)) || sameCalendarProjection(ev, source)){
        ev.status = 'supprime'; ev.statut = 'supprime'; ev.syncStatus = 'pending_delete'; touchSync(ev); changed++;
      }
    });
    return changed;
  }
  function normaliseCalendarProjections(){
    if(!Array.isArray(data.calendarEvents)) return;
    let changed = false;
    data.calendarEvents.forEach(ev=>{
      if(isCalendarProjection(ev)){
        ev._calendarProjection = true;
        changed = true;
      }
    });
    if(changed) save();
  }
  function eventFromItem(item, icon, label, moduleFallback, collection){
    if(!item || !item.date || statusIsHidden(item)) return null;
    const module = canonicalModuleId(item.module || moduleFallback);
    if(!isAppActive(module)) return null;
    return {...item, _collection:collection, icon, label, module};
  }
  function getGeneralCalendarEvents(){
    return visibleItems('calendarEvents')
      .filter(x=>x.date && !isCalendarProjection(x))
      .map(x=>eventFromItem(x, x.icon || '📌', x.label || 'Calendrier', 'calendrier', 'calendarEvents'))
      .filter(Boolean);
  }

  function getAllEvents(){
    const items = [];
    const pushMany = (arr, icon, label, module, collection) => {
      (arr || []).forEach(x=>{ const ev = eventFromItem(x, icon, label, module, collection); if(ev) items.push(ev); });
    };

    // Le calendrier est une vue calculée, pas une base parallèle.
    // Chaque app utilise la même source que ses listes, compteurs et alertes.
    pushMany(getMaisonTasks('open'), '🏠', 'Maison', 'maison', 'tasks');
    pushMany(getMenus('all'), '🍽️', 'Courses & repas', 'courses_repas', 'menus');
    pushMany(getShoppingItems('open'), '🛒', 'Courses', 'courses_repas', 'shopping');
    pushMany(getStockItems('all'), '🧺', 'Stock', 'courses_repas', 'stock');
    pushMany(getSchoolItems('open'), '📚', 'École', 'education', 'school');
    pushMany(getHealthTreatments('open'), '💊', 'Traitement', 'sante', 'health');
    pushMany(getHealthTreatmentDoseEvents(), '💊', 'Prise traitement', 'sante', 'healthDoses');
    pushMany(getHealthAppointments('open'), '🩺', 'Rendez-vous', 'sante', 'health');
    pushMany(getHealthBookItems('all'), '📘', 'Carnet de santé', 'sante', 'healthBook');
    pushMany(getSportActivities('open'), '⚽', 'Sport', 'sport_loisirs', 'sports');
    pushMany(getLoisirActivities('open'), '🎨', 'Loisir', 'sport_loisirs', 'loisirs');
    pushMany(getVoyageActivities('open'), '✈️', 'Voyage', 'sport_loisirs', 'voyages');
    pushMany(getSportGear('all'), '🎒', 'Matériel sport', 'sport_loisirs', 'sportGear');
    pushMany(getLoisirGear(), '🎡', 'Matériel loisir', 'sport_loisirs', 'loisirGear');
    pushMany(getVoyageGear(), '🧳', 'Bagages', 'sport_loisirs', 'voyageGear');
    pushMany(getFamilyDocuments('all'), '📁', 'Familles', 'familles', 'familyDocuments');
    pushMany(getGeneralCalendarEvents(), '📌', 'Calendrier', 'calendrier', 'calendarEvents');

    if(isAppActive('familles')) getFamilyMembers().forEach(m=>{
      const b=parseDMY(m.birth); const sd=parseDMY(state.selectedDate || today); if(!b||!sd) return;
      if(b.getDate()===sd.getDate() && b.getMonth()===sd.getMonth()) items.push({id:'birthday-'+m.id,module:'familles',type:'anniversaire',title:`Anniversaire — ${m.name}`,date:state.selectedDate,member:m.id,icon:'🎂',label:'Anniversaire',time:'Toute la journée', readonly:true});
    });

    const seen = new Set();
    return items.filter(ev=>{
      const key = `${ev.id || ''}|${canonicalModuleId(ev.module)}|${normalizeText(ev.title || ev.name || '')}|${ev.date || ''}`;
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function notificationsAllowed(module){
    const prefs = data.settings?.notificationsPrefs || {};
    if(prefs.global === false) return false;
    const mid = canonicalModuleId(module);
    if(prefs[mid] === false) return false;
    return true;
  }
  function getNotifications(){
    const notices=[];
    getHealthTreatments('today').forEach(h=>{ const rest=treatmentDosesForDate(h,today).filter(d=>!d.done); if(rest.length) notices.push({id:h.id,module:'sante',member:h.member,icon:'💊',title:`Traitement — ${h.title}`,desc:`${memberName(h.member)} · ${rest.length} prise(s) à faire`,time:rest[0]?.time||'Aujourd’hui',niveau:'important'}); });
    getHealthAppointments('open').forEach(h=>{ const diff=daysDiff(today,h.date); if(diff>=0 && diff<=5) notices.push({id:h.id,module:'sante',member:h.member,icon:'🩺',title:h.title,desc:`${memberName(h.member)} · ${diff===0?'aujourd’hui':'dans '+diff+' jour(s)'}`,time:diff===0?'Aujourd’hui':shortDate(h.date),niveau:diff===0?'important':'info'}); });
    getMaisonTasks('today').forEach(t=>notices.push({id:t.id,module:'maison',member:t.member,icon:'🏠',title:`Tâche — ${t.title}`,desc:memberName(t.member),time:'Aujourd’hui',niveau:'info'}));
    getMaisonTasks('late').forEach(t=>notices.push({id:t.id,module:'maison',member:t.member,icon:'⏰',title:`En retard — ${t.title}`,desc:memberName(t.member),time:'Urgent',niveau:'urgent'}));
    getShoppingItems('open').forEach(s=>notices.push({id:s.id,module:'courses_repas',member:s.member||'family',icon:'🛒',title:`Course — ${s.title}`,desc:qtyLabel(s) || 'À acheter',time:'Courses',niveau:'info'}));
    getStockItems('low').forEach(s=>notices.push({id:s.id,module:'courses_repas',member:'family',icon:'🧺',title:`Stock faible — ${s.title}`,desc:`${qtyLabel(s)||''} · ${s.place||''}`,time:'Stock',niveau:'important'}));
    getSchoolItems('open').forEach(h=>{ const diff=daysDiff(today,h.date); if(h.date && diff>=0 && diff<=2) notices.push({id:h.id,module:'education',member:h.member,icon:'📚',title:h.title,desc:`${memberName(h.member)} · ${h.type || h.category || 'école'}`,time:diff===0?'Aujourd’hui':shortDate(h.date),niveau:diff===0?'important':'info'}); });
    getHealthBookItems().filter(x=>x.date && daysDiff(today,x.date)>=0 && daysDiff(today,x.date)<=30).forEach(h=>notices.push({id:h.id,module:'sante',member:h.member,icon:'📘',title:h.title,desc:`Carnet de santé · ${shortDate(h.date)}`,time:shortDate(h.date),niveau:'info'}));
    getSportActivities('today').forEach(s=>notices.push({id:s.id,module:'sport_loisirs',member:s.members||s.member,icon:'⚽',title:s.title,desc:`${memberName(s.members||s.member)} · sport`,time:s.time||'Aujourd’hui',niveau:'info'}));
    getLoisirActivities('today').forEach(s=>notices.push({id:s.id,module:'sport_loisirs',member:s.members||s.member,icon:'🎨',title:s.title,desc:`${memberName(s.members||s.member)} · loisir`,time:s.time||'Aujourd’hui',niveau:'info'}));
    getVoyageActivities('today').forEach(s=>notices.push({id:s.id,module:'sport_loisirs',member:s.members||s.member,icon:'✈️',title:s.title,desc:`${memberName(s.members||s.member)} · voyage`,time:s.time||'Aujourd’hui',niveau:'info'}));
    getFamilyDocuments().filter(x=>x.date && daysDiff(today,x.date)>=0 && daysDiff(today,x.date)<=60).forEach(d=>notices.push({id:d.id,module:'familles',member:d.member||'family',icon:'📁',title:d.title,desc:`Document · ${shortDate(d.date)}`,time:shortDate(d.date),niveau:'info'}));
    return notices.filter(n=>isAppActive(n.module) && notificationsAllowed(n.module));
  }
  function moduleKpis(items){
    return `<div class="module-kpis v52-kpis">${items.map(([v,l,emoji='',action=''])=>{
      const actionAttr = action ? ` data-action="${escapeAttr(action)}" onclick="${escapeAttr(action)}" tabindex="0" role="button" aria-label="Ouvrir ${escapeAttr(l)}"` : '';
      return `<article class="kpi-pill ${action?'clickable-card kpi-clickable':''}"${actionAttr}><span class="kpi-emoji">${emoji}</span><strong>${escapeHtml(v)}</strong><small>${escapeHtml(l)}</small></article>`;
    }).join('')}</div>`;
  }
  // V5.8 — Barre d'action principale en haut de chaque module.
  // Un gros bouton coloré, libellé adapté au module, atteignable au pouce sans scroller.
  function primaryActionBar(buttons){
    // buttons = [['label', 'onclick', primary?true]]
    return `<div class="primary-action-bar">${buttons.map(([label, onclick, primary])=>
      `<button type="button" class="btn ${primary?'primary':'ghost'} primary-add-btn" onclick="${onclick}">${label}</button>`
    ).join('')}</div>`;
  }

  function homeModuleContent(){
    const open=getMaisonTasks('open'), todayItems=getMaisonTasks('today'), late=getMaisonTasks('late'), recurrent=getMaisonTasks('recurrent');
    return `${primaryActionBar([['＋ Nouvelle tâche',`SuperApp.openAdd('maison','tache','Ménage')`,true]])}
      ${moduleKpis([[todayItems.length,'aujourd’hui','🏠',`SuperApp.openModuleList('maison','taches_aujourdhui')`],[late.length,'en retard','⏰',`SuperApp.openModuleList('maison','taches_retard')`],[recurrent.length,'récurrentes','🔁',`SuperApp.openModuleList('maison','taches_recurrentes')`],[open.length,'toutes','✅',`SuperApp.openModuleList('maison','taches')`]])}
      ${fusedBlock('maison','taches','Tâches Maison','🏠','home tone-home-1','Une seule vraie liste',`<p class="play-copy">Ménage, rangement, entretien, réparation, urgence, routine et administratif sont réunis ici.</p>${miniChips(['Toutes','Aujourd’hui','En retard','Récurrentes','Par membre','Terminées'])}`,`<button class="link-btn" onclick="SuperApp.openModuleList('maison','taches')">+ Ajouter</button>`)}
      <div class="module-secondary-note">📅 Les tâches datées apparaissent automatiquement dans le calendrier global.</div>`;
  }
  function foodModuleContent(){
    const menuJour=getMenus().filter(x=>x.date===today || x.category==='Repas du jour');
    const menuSem=(data.weeklyMeals||[]).filter(x=>!statusIsHidden(x));
    const shopping=getShoppingItems('all'), stock=getStockItems(), low=getStockItems('low');
    return `${primaryActionBar([
      ['＋ Course',`SuperApp.openAdd('courses_repas','course','Alimentation')`,true],
      ['＋ Repas',`SuperApp.openAdd('courses_repas','repas_semaine','Menu de la semaine')`,false],
      ['＋ Stock',`SuperApp.openAdd('courses_repas','stock','Stock')`,false]
    ])}
      ${moduleKpis([[menuSem.length,'menu semaine','📅',`SuperApp.openModuleList('courses_repas','menu_semaine')`],[shopping.length,'courses','🛒',`SuperApp.openModuleList('courses_repas','courses')`],[stock.length,'stock','🧺',`SuperApp.openModuleList('courses_repas','stock')`],[low.length,'stock faible','⚠️',`SuperApp.openModuleList('courses_repas','stock_faible')`]])}
      ${fusedBlock('courses_repas','menu_semaine','Menu de la semaine','📅','food tone-food-1','Lundi → dimanche',`<p class="play-copy">Le menu de toute la semaine en un coup d'œil. Lundi, mardi, mercredi… midi et soir.</p>${miniChips(['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'])}`,`<button class="link-btn" onclick="SuperApp.openModuleList('courses_repas','menu_semaine')">+ Ajouter</button>`)}
      ${fusedBlock('courses_repas','menu_jour','Menu du jour','🍽️','food tone-food-2','Aujourd’hui',rowList(menuJour,'🍽️','Repas du jour'),`<button class="link-btn" onclick="SuperApp.openModuleList('courses_repas','menu_jour')">+ Ajouter</button>`)}
      ${fusedBlock('courses_repas','courses','Liste de courses','🛒','food tone-food-3','À cocher',rowList(shopping,'🛒','Courses'),`<button class="link-btn" onclick="SuperApp.openModuleList('courses_repas','courses')">+ Ajouter</button>`)}
      ${fusedBlock('courses_repas','stock','Stock','🧺','food tone-food-4','Frigo · placard',`<div class="stock-grid">${stock.map(x=>`<article class="stock-card ${String(x.level).toLowerCase()==='faible'?'alert':''}"><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.qty||'')} · ${escapeHtml(x.place||'')}</small><span>${escapeHtml(x.level||'')}</span></article>`).join('')}</div>`)}
    `;
  }
  function schoolAverage(){
    const notes=(data.homework||[]).filter(x=>!statusIsHidden(x)&&(x.type==='note'||x.category==='Notes')&&x.score!==undefined&&x.score!=='');
    if(!notes.length) return null;
    const sum=notes.reduce((a,x)=>a+(Number(x.score)/Number(x.scoreMax||20))*20,0);
    return Math.round((sum/notes.length)*10)/10;
  }
  function educationModuleContent(){
    const school=getSchoolItems('all'), grades=school.filter(x=>x.type==='note' || x.category==='Notes');
    const avg=schoolAverage();
    return `${primaryActionBar([
      ['＋ Nouveau devoir',`SuperApp.openAdd('education','devoir','Devoirs')`,true],
      ['＋ Note',`SuperApp.openAdd('education','note','Notes')`,false],
      ['＋ Document',`SuperApp.openAdd('education','document_ecole','Documents école')`,false]
    ])}
      ${moduleKpis([[school.length,'école','📚',`SuperApp.openModuleList('education','ecole')`],[grades.length,'notes','⭐',`SuperApp.openModuleList('education','ecole_notes')`],[avg!==null?avg+'/20':'—','moyenne','📊',`SuperApp.openModuleList('education','ecole_notes')`]])}
      ${fusedBlock('education','ecole','École','📚','edu tone-edu-1','Devoirs · contrôles · documents',`<p class="play-copy">Devoirs, contrôles, activités, sorties, réunions et documents sont regroupés dans la même liste. La chip <b>Notes</b> isole les notes et appréciations.</p>${miniChips(['Devoir','Contrôle','Note','Document','Sortie','Réunion'])}`,`<button class="link-btn" onclick="SuperApp.openModuleList('education','ecole')">+ Ajouter</button>`)}
      <div class="module-secondary-note">📅 Les éléments scolaires datés alimentent le calendrier global.</div>`;
  }
  function healthModuleContent(){
    return `${healthEmergencyBlock()}${healthQuickActions()}${renderDirectList('sante')}`;
  }

  function sportModuleContent(){
    const tS=getSportActivities('today').length,tL=getLoisirActivities('today').length,tV=getVoyageActivities('today').length;
    const tab=activeSlvTab();
    const totalToday=tS+tL+tV;
    return `
      <div class="slv-tabs">
        <button type="button" class="slv-tab slv-tout ${tab==='tout'?'active':''}" onclick="SuperApp.setSlvTab('tout')">
          <span>▦</span><b>Tout</b>${totalToday?`<em class="slv-badge">${totalToday}</em>`:''}
        </button>
        <button type="button" class="slv-tab slv-sport ${tab==='sport'?'active':''}" onclick="SuperApp.setSlvTab('sport')">
          <span>⚽</span><b>Sport</b>${tS?`<em class="slv-badge">${tS}</em>`:''}
        </button>
        <button type="button" class="slv-tab slv-loisir ${tab==='loisir'?'active':''}" onclick="SuperApp.setSlvTab('loisir')">
          <span>🎨</span><b>Loisir</b>${tL?`<em class="slv-badge">${tL}</em>`:''}
        </button>
        <button type="button" class="slv-tab slv-voyage ${tab==='voyage'?'active':''}" onclick="SuperApp.setSlvTab('voyage')">
          <span>✈️</span><b>Voyage</b>${tV?`<em class="slv-badge">${tV}</em>`:''}
        </button>
      </div>
      ${tab==='tout' ? slvAllContent() : slvVoletContent(tab)}`;
  }
  function activeSlvTab(){ return state.slvTab||'tout'; }
  function setSlvTab(tab){ state.slvTab=tab; render(); }
  function slvConfigFor(tab){
    const cfgs={
      sport:{collection:'sports', checklistCollection:'sportGear', acts:getSportActivities('open'), actKey:'sport_activites', type:'activite', checklistType:'materiel_sport', checklistCategory:'Matériel sport', emoji:'⚽', gearEmoji:'🎽', label:'Sport', tone:'sport tone-sport-1', tone2:'sport tone-sport-2', cta:'Ajouter une activité sportive'},
      loisir:{collection:'loisirs', checklistCollection:'loisirGear', acts:getLoisirActivities('open'), actKey:'loisir_activites', type:'loisir', checklistType:'materiel_loisir', checklistCategory:'Matériel loisir', emoji:'🎨', gearEmoji:'🎡', label:'Loisir', tone:'loisir tone-loisir-1', tone2:'loisir tone-loisir-2', cta:'Ajouter un loisir'},
      voyage:{collection:'voyages', checklistCollection:'voyageGear', acts:getVoyageActivities('open'), actKey:'voyage_activites', type:'voyage', checklistType:'materiel_voyage', checklistCategory:'Bagages', emoji:'✈️', gearEmoji:'🧳', label:'Voyage', tone:'voyage tone-voyage-1', tone2:'voyage tone-voyage-2', cta:'Ajouter un voyage'},
    };
    return cfgs[tab]||cfgs.sport;
  }
  function slvTabForActivity(x){
    const t=itemType(x);
    if(t==='voyage') return 'voyage';
    if(t==='loisir') return 'loisir';
    return 'sport';
  }
  function slvActivityById(id){
    return [...visibleItems('sports'),...visibleItems('loisirs'),...visibleItems('voyages')].find(x=>x.id===id && !statusIsHidden(x));
  }
  function slvChecklistForActivity(activity){
    if(!activity) return [];
    const cfg=slvConfigFor(slvTabForActivity(activity));
    return visibleItems(cfg.checklistCollection).filter(x=>!statusIsHidden(x) && (x.parentId===activity.id || x.activityId===activity.id));
  }
  function slvChecklistRemaining(activity){
    return slvChecklistForActivity(activity).filter(x=>!statusIsDone(x)).length;
  }
  function slvAllContent(){
    const sport=slvConfigFor('sport'), loisir=slvConfigFor('loisir'), voyage=slvConfigFor('voyage');
    const all=[...sport.acts,...loisir.acts,...voyage.acts];
    const remaining=all.reduce((sum,a)=>sum+slvChecklistRemaining(a),0);
    const section=(cfg)=>fusedBlock('sport_loisirs',cfg.actKey,cfg.label,cfg.emoji,cfg.tone,'Vue globale organisée',
      `<div class="agenda-list">${cfg.acts.map(x=>slvActivityCard(x)).join('')||'<div class="empty">Aucun élément.</div>'}</div>`,
      `<button class="link-btn" onclick="SuperApp.setSlvTab('${cfg.label.toLowerCase()==='loisir'?'loisir':cfg.label.toLowerCase()}')">Voir</button>`);
    return `${moduleKpis([[all.length,'activités','▦',''],[remaining,'objets restants','✅',''],[getSportActivities('today').length+getLoisirActivities('today').length+getVoyageActivities('today').length,'aujourd’hui','📅','']])}
      ${section(sport)}${section(loisir)}${section(voyage)}
      <div class="module-secondary-note">La vue Tout est une synthèse : Sport, Loisir et Voyage restent séparés avec leurs couleurs, catégories et checklists.</div>`;
  }
  function slvVoletContent(tab){
    const cfg=slvConfigFor(tab);
    const checklistTotal=cfg.acts.reduce((sum,a)=>sum+slvChecklistRemaining(a),0);
    return `
      ${primaryActionBar([
        [`＋ ${cfg.cta}`,`SuperApp.setSlvTab('${tab}');SuperApp.openAdd('sport_loisirs','${cfg.type}','${cfg.label}')`,true]
      ])}
      ${moduleKpis([[cfg.acts.length,'activités',cfg.emoji,`SuperApp.openModuleList('sport_loisirs','${cfg.actKey}')`],[checklistTotal,'checklists à faire',cfg.gearEmoji,`SuperApp.setSlvTab('${tab}')`]])}
      ${fusedBlock('sport_loisirs',cfg.actKey,cfg.label+' — activités',cfg.emoji,cfg.tone,'Page complète '+cfg.label,
        `<div class="agenda-list">${cfg.acts.map(x=>slvActivityCard(x)).join('')||'<div class="empty">Aucune activité. Ajoute une première fiche.</div>'}</div>`,
        `<button class="link-btn" onclick="SuperApp.openAdd('sport_loisirs','${cfg.type}','${cfg.label}')">+ Ajouter</button>`)}

    `;
  }
  function slvActivityCard(x){
    const done=statusIsDone(x);
    const mems=x.members&&x.members!=='family'?String(x.members).split(',').map(id=>{const m=(data.family||[]).find(m=>m.id===id.trim());return m?firstMemberName(m.name):id;}).join(', '):(x.member==='family'||!x.member?'Famille':memberName(x.member));
    const rec=x.recurrence&&x.recurrence!=='ponctuelle'?` · ${x.recurrence}`:'';
    const dl=x.startDate?`${shortDate(x.startDate)}${x.endDate&&x.endDate!==x.startDate?' → '+shortDate(x.endDate):''}`:(x.date?shortDate(x.date):'');
    const loc=x.location?` · 📍 ${escapeHtml(x.location)}`:'';
    const remaining=slvChecklistRemaining(x);
    const total=slvChecklistForActivity(x).length;
    return `<article class="slv-activity-card common-info-row clickable-card ${done?'done':''}" onclick="event.stopPropagation();SuperApp.openSlvActivityDetail('${x.id}')">
      <div class="health-info-main"><b>${escapeHtml(x.title||'Activité')}</b>
        <small>${escapeHtml(mems)}${escapeHtml(rec)}${loc}</small>
        ${dl?`<em>${escapeHtml(dl)}${total?` · ${remaining}/${total} checklist`:''}</em>`:''}</div>
      <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.markDone('${x.id}')" aria-label="Marquer fait">${done?'✓':''}</button>
    </article>`;
  }
  function slvChecklistRows(gear, activityId=''){
    const vis=(gear||[]).filter(x=>!statusIsHidden(x));
    if(!vis.length) return '<div class="empty">Checklist vide. Appuie sur + pour ajouter.</div>';
    return `<div class="agenda-list">${vis.map(x=>shoppingRow(x,{module:'sport_loisirs',collection:collectionForItemLike(x),activityId})).join('')}</div>`;
  }
  function paintSlvActivityDetail(id){
    const activity=slvActivityById(id);
    if(!activity){ openModule('sport_loisirs'); toast('Activité introuvable.'); return; }
    const tab=slvTabForActivity(activity);
    const cfg=slvConfigFor(tab);
    state.activeModule='sport_loisirs';
    const rows=slvChecklistForActivity(activity);
    const done=statusIsDone(activity);
    const mems=activity.members&&activity.members!=='family'?String(activity.members).split(',').map(mid=>memberName(mid.trim())).join(', '):(activity.member==='family'||!activity.member?'Toute la famille':memberName(activity.member));
    const dates=activity.startDate?`${shortDate(activity.startDate)}${activity.endDate&&activity.endDate!==activity.startDate?' → '+shortDate(activity.endDate):''}`:(activity.date?shortDate(activity.date):'Date à préciser');
    $('#view-apps').innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.openModule('sport_loisirs')">← Retour ${cfg.label}</button></div>
      <section class="slv-detail-page ${tab}">
        <article class="slv-detail-hero ${cfg.tone}">
          <div class="slv-detail-icon">${cfg.emoji}</div>
          <div class="slv-detail-main">
            <span>${escapeHtml(cfg.label)}</span>
            <h2>${escapeHtml(activity.title||cfg.label)}</h2>
            <p>${escapeHtml(mems)} · ${escapeHtml(dates)}${activity.time?' · '+escapeHtml(activity.time):''}${activity.location?' · 📍 '+escapeHtml(activity.location):''}</p>
            ${activity.recurrence&&activity.recurrence!=='ponctuelle'?`<small>🔁 ${escapeHtml(activity.recurrence)}</small>`:''}
          </div>
          <button type="button" class="shopping-check ${done?'checked':''}" onclick="SuperApp.markDone('${activity.id}')">${done?'✓':''}</button>
        </article>
        <div class="list-toolbar-card"><button class="btn ghost" onclick="SuperApp.openEdit('sport_loisirs','${activity.id}')">✏️ Modifier l’activité</button><button class="btn primary" onclick="SuperApp.openSlvChecklistLight('${activity.id}')">${cfg.gearEmoji} Checklist</button></div>
        <section class="play-block ${cfg.tone2}">
          <div class="play-head"><div><span>Checklist liée</span><h3>${cfg.gearEmoji} À préparer</h3></div></div>
          <div class="play-body">${slvChecklistRows(rows, activity.id)}</div>
        </section>
      </section>`;
  }
  function openSlvActivityDetail(id){ state.appsView={kind:'slvDetail', id}; setView('apps'); }
  function genericChecklistConfig(kind='maison'){
    return kind === 'education'
      ? {kind:'education', module:'education', title:'Checklist devoirs', emoji:'📚', itemPlaceholder:'Étape du devoir', type:'checklist_devoir', category:'Devoirs', suggestions:['Lire la consigne','Faire les exercices','Relire','Mettre dans le cartable']}
      : {kind:'maison', module:'maison', title:'Checklist ménage', emoji:'🧹', itemPlaceholder:'Étape ou objet', type:'checklist_maison', category:'Ménage', suggestions:['Préparer','Nettoyer','Ranger','Vérifier']};
  }
  function genericChecklistRows(parentId){
    return (data.documents || []).filter(x=>!statusIsHidden(x) && String(x.parentId||'')===String(parentId||'') && String(x.type||'').startsWith('checklist_'));
  }
  function genericChecklistActivity(parentId){
    const found = findRecord(parentId);
    return found?.item || null;
  }
  function openGenericChecklist(parentId, kind='maison'){
    const parent = genericChecklistActivity(parentId);
    if(!parent){ toast('Élément introuvable.'); return; }
    try { closeEditDialog(); } catch {}
    state.appsView = {kind:'genericChecklist', id:parentId, checklistKind:kind};
    setView('apps');
  }
  function addGenericChecklistLine(parentId, kind='maison', forcedTitle=''){
    const cfg = genericChecklistConfig(kind);
    const titleEl = document.getElementById('genericChecklistTitleInput');
    const qtyEl = document.getElementById('genericChecklistQtyInput');
    const catEl = document.getElementById('genericChecklistCatInput');
    const title = (forcedTitle || titleEl?.value || '').trim();
    if(!title){ toast('Renseigne un élément.'); return; }
    data.documents = Array.isArray(data.documents) ? data.documents : [];
    const parent = genericChecklistActivity(parentId) || {};
    data.documents.push(decorateSync({
      id:uid(), module:cfg.module, type:cfg.type, category:catEl?.value || cfg.category,
      title, quantity:qtyEl?.value || '1', unit:'unité', qty:qtyEl?.value ? `${qtyEl.value} unité` : '1 unité',
      status:'a_faire', parentId, member:parent.member || 'family', members:parent.members || parent.students || parent.member || 'family'
    }));
    save(); paintGenericChecklistPage(parentId, kind);
  }
  function addGenericChecklistSuggestion(parentId, kind, title){ addGenericChecklistLine(parentId, kind, title); }
  function toggleGenericChecklistItem(id){ markDone(id); const found=findRecord(id); const parentId=found?.item?.parentId; const kind=String(found?.item?.type||'').includes('devoir')?'education':'maison'; if(parentId) setTimeout(()=>paintGenericChecklistPage(parentId, kind),30); }
  function changeGenericChecklistQty(id, delta){
    const found = findRecord(id); if(!found) return;
    const cur = parseInt(found.item.quantity || found.item.qty || 1, 10) || 1;
    const next = Math.max(1, cur + delta);
    found.item.quantity = next; found.item.qty = `${next} unité`; touchSync(found.item); save();
    const kind = String(found.item.type||'').includes('devoir') ? 'education' : 'maison';
    paintGenericChecklistPage(found.item.parentId, kind);
  }
  function genericChecklistLineHtml(x){
    const done=statusIsDone(x); const qty=parseInt(x.quantity||x.qty||1,10)||1;
    return `<article class="slv-check-row ${done?'done':''}"><label><input type="checkbox" ${done?'checked':''} onchange="SuperApp.toggleGenericChecklistItem('${x.id}')"><span><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.category||'Checklist')}</small></span></label><div class="slv-stepper" aria-label="Quantité"><button type="button" onclick="event.stopPropagation();SuperApp.changeGenericChecklistQty('${x.id}',-1)">−</button><strong>${qty}</strong><button type="button" onclick="event.stopPropagation();SuperApp.changeGenericChecklistQty('${x.id}',1)">+</button></div><button type="button" class="row-action del btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">Supprimer</button></article>`;
  }
  function paintGenericChecklistPage(parentId, kind='maison'){
    const parent = genericChecklistActivity(parentId); if(!parent){ paintModule(kind==='education'?'education':'maison'); return; }
    const cfg = genericChecklistConfig(kind);
    const rows = genericChecklistRows(parentId);
    const done = rows.filter(statusIsDone).length;
    const suggestions = cfg.suggestions;
    $('#view-apps').innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.openEdit('${cfg.module}','${parentId}')">← Retour fiche</button></div>
      <section class="slv-checklist-page ${escapeAttr(cfg.module)}">
        <article class="slv-detail-hero"><div class="slv-detail-icon">${cfg.emoji}</div><div class="slv-detail-main"><span>${escapeHtml(cfg.title)}</span><h2>${escapeHtml(parent.title||'Élément')}</h2><p>${done}/${rows.length} fait(s)</p></div></article>
        <section class="slv-checklist-board">
          <div class="slv-add-object-card"><input id="genericChecklistTitleInput" type="text" placeholder="${escapeAttr(cfg.itemPlaceholder)}"><input id="genericChecklistQtyInput" type="number" min="1" step="1" value="1" aria-label="Quantité"><select id="genericChecklistCatInput"><option>${escapeHtml(cfg.category)}</option><option>Préparation</option><option>À faire</option><option>Autre</option></select><button type="button" class="btn primary" onclick="SuperApp.addGenericChecklistLine('${parentId}','${cfg.kind}')">+ Ajouter</button></div>
          <div class="slv-suggestions"><b>Suggestions rapides</b><div>${suggestions.map(v=>`<button type="button" onclick="SuperApp.addGenericChecklistSuggestion('${parentId}','${cfg.kind}','${escapeAttr(v)}')">＋ ${escapeHtml(v)}</button>`).join('')}</div></div>
          <div class="slv-checklist-light-rows">${rows.length ? rows.map(genericChecklistLineHtml).join('') : '<div class="empty cute-empty"><b>Checklist vide</b></div>'}</div>
          <footer class="dialog-actions slv-checklist-actions"><button type="button" class="btn ghost" onclick="SuperApp.openEdit('${cfg.module}','${parentId}')">Retour fiche</button><button type="button" class="btn primary" onclick="SuperApp.openModule('${cfg.module}')">Valider</button></footer>
        </section>
      </section>`;
  }

  function openAddSlvChecklist(activityId){
    const activity=slvActivityById(activityId);
    if(!activity){ toast('Activité introuvable.'); return; }
    const cfg=slvConfigFor(slvTabForActivity(activity));
    state.preset={type:cfg.checklistType, category:cfg.checklistCategory, parentId:activity.id, activityId:activity.id, member:activity.member||'family', members:activity.members||activity.member||'family'};
    openEdit('sport_loisirs');
  }
  function slvChecklistSuggestions(tab){
    return {
      voyage:['Passeports','Billets','Chargeurs','Médicaments','T-shirts','Sandales','Trousse de toilette','Documents administratifs'],
      sport:['Tenue','Chaussures','Gourde','Serviette','Certificat médical','Équipement','Sac de sport'],
      loisir:['Billets','Goûter','Appareil photo','Carte de transport','Réservation','Vêtements adaptés']
    }[tab] || [];
  }
  function slvChecklistStats(activity){
    const rows=slvChecklistForActivity(activity); const ready=rows.filter(statusIsDone).length;
    return {total:rows.length, ready, remaining:Math.max(0, rows.length-ready)};
  }
  function slvChecklistLightRows(activity){
    const rows = slvChecklistForActivity(activity);
    if(!rows.length) return '<div class="empty cute-empty"><b>Checklist vide</b><small>Ajoute un premier objet ou clique sur une suggestion.</small></div>';
    return `<div class="slv-object-list">${rows.map(x=>{
      const done = statusIsDone(x);
      const qty = Number(x.quantity || x.qty || 1) || 1;
      const cat = x.itemCategory || x.category || 'Autre';
      return `<article class="slv-object-row ${done?'done':''}">
        <button type="button" class="shopping-check ${done?'checked':''}" onclick="event.stopPropagation();SuperApp.markDone('${x.id}')">${done?'✓':''}</button>
        <div class="slv-object-main" onclick="SuperApp.openEdit('sport_loisirs','${x.id}')"><b>${escapeHtml(x.title||'Objet')}</b><small>${escapeHtml(cat)}${done?' · Prêt':''}</small></div>
        <div class="slv-stepper" aria-label="Quantité"><button type="button" onclick="event.stopPropagation();SuperApp.changeSlvChecklistQty('${x.id}',-1)">−</button><strong>${qty}</strong><button type="button" onclick="event.stopPropagation();SuperApp.changeSlvChecklistQty('${x.id}',1)">+</button></div>
        <button type="button" class="btn-sm ghost danger" onclick="event.stopPropagation();SuperApp.deleteItem('${x.id}')">🗑️</button>
      </article>`;
    }).join('')}</div>`;
  }
  function paintSlvChecklistPage(activityId){
    const activity=slvActivityById(activityId);
    if(!activity){ openModule('sport_loisirs'); toast('Activité introuvable.'); return; }
    const tab=slvTabForActivity(activity); const cfg=slvConfigFor(tab); const stats=slvChecklistStats(activity);
    const dates=activity.startDate?`${shortDate(activity.startDate)}${activity.endDate&&activity.endDate!==activity.startDate?' → '+shortDate(activity.endDate):''}`:(activity.date?shortDate(activity.date):'Date à préciser');
    const mems=activity.members&&activity.members!=='family'?String(activity.members).split(',').map(mid=>memberName(mid.trim())).join(', '):(activity.member==='family'||!activity.member?'Toute la famille':memberName(activity.member));
    const suggestions=slvChecklistSuggestions(tab);
    state.activeModule='sport_loisirs'; state.slvTab=tab;
    $('#view-apps').innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.openSlvActivityDetail('${activity.id}')">← Retour activité</button></div>
      <section class="slv-checklist-page ${tab}">
        <article class="slv-detail-hero ${cfg.tone}"><div class="slv-detail-icon">${cfg.gearEmoji}</div><div class="slv-detail-main"><span>Checklist ${escapeHtml(cfg.label)}</span><h2>${escapeHtml(activity.title||cfg.label)}</h2><p>${escapeHtml(dates)} · ${escapeHtml(mems)}${activity.location?' · 📍 '+escapeHtml(activity.location):''}</p></div></article>
        <section class="slv-checklist-board">
          <div class="slv-board-head"><div><h3>Objets à préparer</h3><small>Ajoute tes objets, ajuste les quantités, coche quand c’est prêt. Les objets cochés restent barrés.</small></div><div class="slv-stat-chips"><span>${stats.total} objets</span><span>${stats.ready} prêts</span><span>${stats.remaining} restants</span></div></div>
          <div class="slv-add-object-card"><input id="slvQuickItemInput" type="text" placeholder="Nom de l’objet"><input id="slvQuickQtyInput" type="number" min="1" step="1" value="1" aria-label="Quantité"><select id="slvQuickCatInput"><option>Documents</option><option>Vêtements</option><option>Santé</option><option>Électronique</option><option>Toilette</option><option>Chaussures</option><option>Sport</option><option>Autre</option></select><button type="button" class="btn primary" onclick="SuperApp.addSlvChecklistLine('${activity.id}')">+ Ajouter</button></div>
          <div class="slv-suggestions"><b>Suggestions rapides</b><div>${suggestions.map(v=>`<button type="button" onclick="SuperApp.addSlvChecklistSuggestion('${activity.id}','${escapeAttr(v)}')">＋ ${escapeHtml(v)}</button>`).join('')}</div></div>
          ${slvChecklistLightRows(activity)}
          <footer class="dialog-actions slv-checklist-actions"><button type="button" class="btn ghost" onclick="SuperApp.openSlvActivityDetail('${activity.id}')">Retour activité</button><button type="button" class="btn primary" onclick="SuperApp.finishSlvChecklist('${activity.id}')">Valider la checklist</button></footer>
        </section>
      </section>`;
    setTimeout(()=>document.getElementById('slvQuickItemInput')?.focus(), 30);
  }
  function ensureSlvChecklistDialog(){ return null; }
  function refreshSlvChecklistDialog(activityId){ if(state.appsView?.kind==='slvChecklist' && state.appsView.id===activityId) paintSlvChecklistPage(activityId); }
  function paintSlvChecklistDialog(activity){ if(activity) paintSlvChecklistPage(activity.id); }
  function openSlvChecklistLight(activityId){
    // V5.36.20 — ferme les modales avant d'afficher la checklist.
    // Cela garde les boutons visibles et évite que la fiche reste au-dessus de la page checklist.
    try{ closeEditDialog(); }catch{}
    try{ closeActionDialog(); }catch{}
    state.appsView={kind:'slvChecklist', id:activityId};
    setView('apps');
  }
  function closeSlvChecklistLight(){ if(state.appsView?.kind==='slvChecklist') openModule('sport_loisirs'); }
  function finishSlvChecklist(activityId){ const a=slvActivityById(activityId); if(a){ state.slvTab=slvTabForActivity(a); } state.appsView={kind:'module', id:'sport_loisirs'}; setView('apps'); }
  function addSlvChecklistLine(activityId, forcedTitle=''){
    const activity = slvActivityById(activityId);
    if(!activity){ toast('Activité introuvable.'); return; }
    const input = document.getElementById('slvQuickItemInput');
    const title = String(forcedTitle || input?.value||'').trim();
    if(!title){ toast('Ajoute un objet.'); return; }
    const qtyEl=document.getElementById('slvQuickQtyInput');
    const catEl=document.getElementById('slvQuickCatInput');
    const qty=Math.max(1, parseInt(qtyEl?.value||'1',10)||1);
    const cat=catEl?.value || 'Autre';
    const cfg = slvConfigFor(slvTabForActivity(activity));
    data[cfg.checklistCollection] = Array.isArray(data[cfg.checklistCollection]) ? data[cfg.checklistCollection] : [];
    data[cfg.checklistCollection].push(decorateSync({
      id:uid(), module:'sport_loisirs', type:cfg.checklistType, category:cat, itemCategory:cat,
      title, quantity:qty, unit:'unité', qty:`${qty} unité${qty>1?'s':''}`, date:activity.date || activity.startDate || today, member:activity.member || 'family', members:activity.members || activity.member || 'family',
      parentId:activity.id, activityId:activity.id, status:'a_faire', statut:'a_faire'
    }));
    save();
    if(input) input.value=''; if(qtyEl) qtyEl.value='1';
    paintSlvChecklistPage(activity.id);
  }
  function addSlvChecklistSuggestion(activityId, title){ addSlvChecklistLine(activityId, title); }
  function changeSlvChecklistQty(id, delta){
    const found=findRecord(id); if(!found) return;
    const current=Math.max(1, parseInt(found.item.quantity || found.item.qty || '1',10)||1);
    const next=Math.max(1,current+Number(delta||0));
    found.item.quantity=next; found.item.unit='unité'; found.item.qty=`${next} unité${next>1?'s':''}`; touchSync(found.item); save(); render();
  }
  function familyModuleContent(){
    const members=getFamilyMembers(), docs=getFamilyDocuments();
    return `${primaryActionBar([
      ['＋ Nouveau document',`SuperApp.openAdd('familles','document_famille','Identité')`,true],
      ['＋ Membre',`SuperApp.openSettingsMember('')`,false]
    ])}
      ${moduleKpis([[members.length,'membres','👨‍👩‍👧‍👦',`SuperApp.openFamilyMembersManager('all')`],[docs.length,'documents','📁',`SuperApp.openModuleList('familles','documents')`]])}
      ${familyStyleInlineBlock()}
      <div class="section-title compact-title"><h2>👨‍👩‍👧‍👦 Membres du foyer</h2><button class="link-btn" onclick="SuperApp.openSettingsMember('')">+ Ajouter</button></div>
      <div class="family-spaces">${members.map(memberCard).join('')}</div>
      ${fusedBlock('familles','documents','Documents importants','📁','family tone-family-2','Identité · assurances',`<p class="play-copy">Identité, passeport, diplômes, santé, scolarité et assurances dans un seul espace documentaire.</p>${miniChips(['Identité','Passeport','Diplômes','Santé','Scolarité','Assurances'])}`,`<button class="link-btn" onclick="SuperApp.openModuleList('familles','documents')">+ Ajouter</button>`)}
    `;
  }
  function updateHeader(){
    const v = state.appsView;
    const logoEl = document.getElementById('screenLogo');
    // V5.27 — Logo 3D du module dans l'entête (à la place de l'emoji collé au titre)
    const setLogo = (moduleId)=>{
      if(!logoEl) return;
      const src = appLogoSrc(moduleId);
      if(src){ logoEl.src = src; logoEl.style.display=''; }
      else { logoEl.src = ''; logoEl.style.display='none'; }
    };
    if(state.view === 'apps' && v?.kind === 'module'){
      const m=moduleById(v.id); setLogo(m.id); $('#screenTitle').textContent = m.name; $('#screenSubtitle').textContent = m.desc; $('#quickNotificationBtn').style.display='grid'; return;
    }
    if(state.view === 'apps' && v?.kind === 'list'){
      const m=moduleById(v.module); const cfg=listConfig(v.module, v.block) || {}; setLogo(m.id); $('#screenTitle').textContent = `${cfg.emoji||''} ${cfg.title||m.name}`.trim(); $('#screenSubtitle').textContent = 'Liste, ajout, modification et suppression.'; $('#quickNotificationBtn').style.display='grid'; return;
    }
    setLogo(null); // pas de logo sur Home, Calendrier, Paramètres, Notifications
    const titles = {home:[`Bonjour ${familyGreetingName()} 👋`,'Tout est bien organisé aujourd’hui.'],calendar:['Calendrier familial','Tous les événements de la famille.'],apps:['Mes apps','Tout ce dont la famille a besoin, au même endroit.'],notifications:['Notifications','Rappels et alertes actionnables.'],settings:['Paramètres','Famille, catégories, sous-catégories et données.']};
    $('#screenTitle').textContent = titles[state.view][0]; $('#screenSubtitle').textContent = titles[state.view][1]; $('#quickNotificationBtn').style.display = state.view === 'notifications' ? 'none' : 'grid';
  }
  function renderNotifications(){
    const all = forActiveProfile(getNotifications());
    const notices = filteredNotifications(all);
    const chips = [['all','Toutes','🔔'],['urgent','Urgent','⚠️'],['sante','Santé','💗'],['maison','Maison','🏠'],['courses_repas','Courses','🛒'],['education','Éducation','📚'],['sport_loisirs','Sport','⚽'],['familles','Familles','👨‍👩‍👧‍👦']];
    const profileBar = `<article class="profile-banner clickable-card" onclick="SuperApp.openProfilePicker()"><img src="${profileAvatar()}" alt="" onerror="this.style.visibility='hidden'"><div><b>${isMemberProfile()?'Rappels de '+profileLabel():'Toute la famille'}</b><small>${isMemberProfile()?'Touche pour changer de profil':'Choisis un membre pour voir ses rappels perso'}</small></div><span class="chev">›</span></article>`;
    const addBar = `<section class="add-zone"><h3>Créer une notification</h3>${primaryActionBar([['🔔 Alerte',`SuperApp.openEdit('calendrier')`,true],['⚠️ Urgent',`SuperApp.openEdit('calendrier')`,false],['⏰ Rappel',`SuperApp.openEdit('calendrier')`,false]])}</section>`;
    const filterBar = `<section class="filter-zone"><h3>Filtrer les notifications</h3><div class="chip-row notification-filter-row">${chips.map(([id,label,icon])=>`<button type="button" class="chip ${state.notifFilter===id?'active':''}" onclick="SuperApp.setNotificationFilter('${id}')">${icon} ${label}</button>`).join('')}</div></section>`;
    $('#view-notifications').innerHTML = `${profileBar}${addBar}${filterBar}<div class="section-title"><h2>${notificationTitle()}</h2><small>${notices.length} notification(s)</small></div><div class="agenda-list">${notices.length ? notices.map(notificationRow).join('') : `<div class="empty cute-empty"><b>🌿 Rien pour ${profileFirstName()} aujourd’hui</b><small>Tout est calme, profites-en.</small></div>`}</div>`;
  }
  function filteredNotifications(all){
    const f = state.notifFilter || 'all';
    if(f === 'all') return all;
    if(f === 'urgent') return all.filter(n=>['urgent','important'].includes(normalizeText(n.niveau)) || n.time === 'Urgent' || n.time === 'Aujourd’hui');
    return all.filter(n=>canonicalModuleId(n.module) === canonicalModuleId(f));
  }
  function filteredNotificationsFor(filter, all){
    if(filter === 'all') return all;
    if(filter === 'urgent') return all.filter(n=>['urgent','important'].includes(normalizeText(n.niveau)) || n.time === 'Urgent' || n.time === 'Aujourd’hui');
    return all.filter(n=>canonicalModuleId(n.module) === canonicalModuleId(filter));
  }
  function notificationTitle(){
    const f = state.notifFilter || 'all';
    return ({all:'Toutes les notifications', urgent:'Urgent', sante:'Santé', maison:'Maison', courses_repas:'Courses', education:'Éducation', sport_loisirs:'Sport', familles:'Familles'}[f] || 'Notifications');
  }
  function dateFieldHtml(item={}){
    const raw = normalizeDateInput(item.date || state.selectedDate || today);
    const iso = dmyToISO(raw) || (parseDMY(raw) ? dmyToISO(formatDMY(parseDMY(raw))) : '');
    return `<div class="form-field"><label>Date</label><input name="date" type="date" value="${escapeAttr(iso)}" required><small>Choisis la date dans le calendrier du téléphone.</small></div>`;
  }
  function exampleTitlePlaceholder(module, item={}){
    const m = canonicalModuleId(module);
    const t = String(item.type || '').toLowerCase();
    if(m === 'courses_repas'){
      if(t.includes('stock')) return 'Ex : Lait, tomates, riz…';
      if(t.includes('repas')) return 'Ex : Thiéboudiène du dimanche soir';
      return 'Ex : Ajouter du lait, des tomates ou du riz';
    }
    if(m === 'sante'){
      if(t.includes('vaccin')) return 'Ex : Ajouter un vaccin';
      if(t.includes('rendez') || t.includes('rdv')) return 'Ex : Rendez-vous chez le dentiste';
      return 'Ex : Programmer un traitement';
    }
    if(m === 'education') return 'Ex : Séance de révision de mathématiques';
        if(m === 'sport_loisirs'){
      if(t==='voyage') return 'Ex : Week-end à la mer, vacances d’été…';
      if(t==='loisir') return 'Ex : Cinéma en famille, parc d’attractions…';
      return 'Ex : Entraînement football, cours de danse…';
    }
    if(m === 'maison') return 'Ex : Nettoyer la cuisine';
    if(m === 'familles') return 'Ex : Ajouter une carte d’identité';
    if(m === 'calendrier') return 'Ex : Rendez-vous familial';
    return 'Ex : Nouvel élément';
  }


  function documentModuleLabel(module){
    return ({maison:'Maison', education:'Éducation', sante:'Santé', sport_loisirs:'Sport / Loisir / Voyage', familles:'Familles'}[canonicalModuleId(module)] || moduleLabel(module));
  }
  function supportsSupabaseDocs(module){
    return ['education','sante','sport_loisirs','familles'].includes(canonicalModuleId(module));
  }
  function healthDocsFieldHtml(item={}, module='sante'){
    module = canonicalModuleId(module);
    const label = documentModuleLabel(module);
    const id = item && item.id ? String(item.id) : '';
    if(!id){
      return `<section class="sb-health-doc-zone locked"><div class="sb-doc-test-intro"><b>📎 Documents attachés</b></div></section>`;
    }
    const safeId = escapeAttr(id);
    const safeModule = escapeAttr(module);
    return `<section class="sb-health-doc-zone" data-sb-health-docs="${safeId}" data-sb-doc-module="${safeModule}"><div class="sb-doc-test-intro"><b>📎 Documents attachés</b></div><input id="sb-health-doc-input-${safeId}" type="file" hidden onchange="window.sbUploadHealthItemDocument?.(this,'${safeId}','${safeModule}')"><button type="button" class="btn primary sb-doc-test-upload" onclick="document.getElementById('sb-health-doc-input-${safeId}')?.click()">📤 Charger un document</button><div class="sb-health-doc-status info">Chargement des documents…</div><div class="sb-health-doc-list"><div class="empty">Chargement…</div></div></section>`;
  }

  function genericChecklistFieldHtml(type, item={}){
    const module = canonicalModuleId(type);
    const isMaison = module === 'maison';
    const isEducation = module === 'education' && String(item.type || 'devoir') !== 'note';
    if(!isMaison && !isEducation) return '';
    const kind = isEducation ? 'education' : 'maison';
    const label = isEducation ? 'devoir' : 'tâche';
    const title = isEducation ? 'Checklist devoirs' : 'Checklist';
    if(item.id){
      return `<section class="slv-checklist-form-panel always-visible-checklist"><div class="slv-mini-help"><b>✅ ${title}</b></div><button type="button" class="btn primary" onclick="SuperApp.openGenericChecklist('${escapeAttr(item.id)}','${kind}')">✅ Ouvrir la checklist ${label}</button></section>`;
    }
    return `<section class="slv-checklist-form-panel always-visible-checklist"><div class="slv-mini-help"><b>✅ ${title}</b></div><button type="submit" class="btn primary" data-open-generic-checklist="1" data-checklist-kind="${kind}">✅ Créer et ouvrir la checklist ${label}</button></section>`;
  }

  // V5.8 — Formulaire standardisé : MÊME séquence partout, peu importe le module.
  // Quoi → Quand → Pour qui → Où ça se range → Détails (repliés) → Notes → Statut (en édition seulement).
  function fieldsFor(type,item={}){
    type = canonicalModuleId(type);
    const moduleValue = canonicalModuleId(item.module || (type === 'calendrier' ? 'calendrier' : type));
    const isEditing = !!(item && item.id);

    // 1. TITRE — toujours en premier, focus automatique, avec exemple adapté au module
    const titleField = `<div class="form-field form-field-title"><label>Quoi ?</label><input name="title" required placeholder="${escapeAttr(exampleTitlePlaceholder(type, item))}" value="${escapeAttr(item.title||item.meal||'')}" autofocus></div>`;

    // 2. DATE
    const dateField = dateFieldHtml(item);

    // 3. HEURE
    const hourField = `<div class="form-field"><label>Heure (facultatif)</label><input name="time" type="time" value="${escapeAttr(item.time||'')}"></div>`;

    // 4. POUR QUI (membre)
    const memberField = `<div class="form-field"><label>Pour qui ?</label><select name="member">${memberOptions(item.member || activeProfile() || 'family')}</select></div>`;

    // 5+6. CATÉGORIE + SOUS-CATÉGORIE (lit data.categories — V5.6)
    const categoryField = buildCategoryFieldsHtml(moduleValue, item);

    // 7. DÉTAILS SPÉCIFIQUES (repliés sous "Plus de détails")
    const moduleDetails = moduleDetailsHtml(type, item);

    // Le module/type cachés (le routage est déterminé par le bouton sur lequel on a cliqué)
    const hiddenRouting = hiddenRoutingHtml(type, moduleValue, item) + hiddenParentHtml(item);

    // 8. NOTES (toujours dépliable)
    const notesField = `<details class="form-collapse"><summary>📝 Ajouter une note</summary><div class="form-field"><textarea name="notes" rows="3" placeholder="Notes">${escapeHtml(item.notes||item.desc||'')}</textarea></div></details>`;

    // 9. STATUT (uniquement en modification, sinon "à faire" par défaut)
    const statusField = isEditing
      ? `<div class="form-field"><label>Statut</label><select name="status"><option value="a_faire" ${!statusIsDone(item)&&!['en_cours','reporte'].includes(item.status)?'selected':''}>À faire</option><option value="en_cours" ${item.status==='en_cours'?'selected':''}>En cours</option><option value="fait" ${statusIsDone(item)?'selected':''}>Fait</option><option value="reporte" ${item.status==='reporte'?'selected':''}>Reporté</option></select></div>`
      : `<input type="hidden" name="status" value="a_faire">`;

    // Actions dangereuses (modification seulement)
    const danger = isEditing && !item.readonly
      ? `<div class="danger-actions"><button class="btn ghost" type="button" onclick="SuperApp.archiveItem('${item.id}')">Archiver</button><button class="btn ghost danger" type="button" onclick="SuperApp.deleteItem('${item.id}')">🗑️ Supprimer</button></div>`
      : '';

    const checklistField = genericChecklistFieldHtml(type, item);
    const docsField = supportsSupabaseDocs(type) ? healthDocsFieldHtml(item, type) : '';
    const visibilityField = ['maison','education','sante','sport_loisirs','familles','calendrier'].includes(type) ? setHomeVisibilityFields(item) : '';
    return `${hiddenRouting}${titleField}${dateField}${hourField}${memberField}${categoryField}${moduleDetails}${checklistField}${notesField}${statusField}${danger}${docsField}${visibilityField}`;
  }

  // Champs cachés pour le routage : module + type sont déduits du bouton cliqué, jamais demandés à l'utilisateur (sauf depuis le calendrier).
  function hiddenRoutingHtml(type, moduleValue, item){
    type = canonicalModuleId(type);
    // Depuis le bouton "+" global du calendrier, c'est le seul cas où on demande "dans quel module".
    if(type === 'calendrier'){
      return `<div class="form-field"><label>Où ranger ?</label><select name="targetModule">${moduleOptions(moduleValue)}</select></div><div class="form-field"><label>Type</label><select name="type"><option value="evenement" ${item.type==='evenement'?'selected':''}>Événement général</option><option value="tache" ${item.type==='tache'?'selected':''}>Tâche Maison</option><option value="repas" ${item.type==='repas'?'selected':''}>Repas</option><option value="devoir" ${item.type==='devoir'?'selected':''}>École</option><option value="rendez_vous_medical" ${isAppointment(item)?'selected':''}>Rendez-vous santé</option><option value="activite" ${item.type==='activite'?'selected':''}>Activité sport</option></select></div>`;
    }
    // Sinon, module et type sont déduits du bouton "+ Médicament", "+ Course", etc.
    const itemType = item.type || defaultTypeForModule(type);
    return `<input type="hidden" name="targetModule" value="${type}"><input type="hidden" name="type" value="${escapeAttr(itemType)}">`;
  }


  function hiddenParentHtml(item={}){
    const pid = item.parentId || item.activityId || '';
    if(!pid) return '';
    return `<input type="hidden" name="parentId" value="${escapeAttr(pid)}"><input type="hidden" name="activityId" value="${escapeAttr(pid)}">`;
  }

  function defaultTypeForModule(module){
    return ({
      maison:'tache',
      courses_repas:'course',
      education:'devoir',
      sante:'medicament',
      sport_loisirs:'activite',
      familles:'document_famille'
    }[canonicalModuleId(module)] || 'evenement');
  }

  // Détails spécifiques au module (quantité, posologie, médecin, etc.), repliés par défaut.
  function moduleDetailsHtml(type, item){
    type = canonicalModuleId(type);
    let inside = '';
    // V5.11 — Si on est dans un repas hebdomadaire, on montre jour + créneau au lieu des champs course/stock
    const itemType = item.type || '';
    if(type === 'courses_repas' && itemType === 'repas_semaine'){
      const day = (typeof item.day !== 'undefined') ? item.day : (state.preset?.day);
      const slot = item.slot || state.preset?.slot || 'soir';
      const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
      inside = `
        <div class="form-field"><label>Jour de la semaine</label><select name="day">${days.map((d,i)=>`<option value="${i}" ${Number(day)===i?'selected':''}>${d}</option>`).join('')}</select></div>
        <div class="form-field"><label>Créneau</label><select name="slot"><option value="midi" ${slot==='midi'?'selected':''}>🌞 Midi</option><option value="soir" ${slot==='soir'?'selected':''}>🌙 Soir</option></select></div>`;
      return `<div class="form-section-inline">${inside}</div>`;  // pas replié : créneau important
    }
    if(type === 'courses_repas'){
      const unit = unitFromItem(item);
      inside = `
        <div class="form-grid-2"><div class="form-field"><label>Quantité</label><input name="quantity" type="number" step="${unitStep(unit)}" min="0" inputmode="${unit==='unité'?'numeric':'decimal'}" placeholder="Ex : 2" value="${escapeAttr(numberQty(item))}"></div><div class="form-field"><label>Unité</label><select name="unit" onchange="SuperApp.updateQuantityStep(this)">${unitOptions(unit)}</select></div></div>
        <input type="hidden" name="qty" value="${escapeAttr(qtyLabel(item))}">
        <div class="form-field"><label>Lieu / rayon</label><input name="place" placeholder="Frigo, placard, rayon…" value="${escapeAttr(item.place||'')}"></div>
        <div class="form-field"><label>Niveau de stock</label><select name="level"><option value="" ${!item.level?'selected':''}>—</option><option ${item.level==='Bon'?'selected':''}>Bon</option><option ${item.level==='Moyen'?'selected':''}>Moyen</option><option ${item.level==='Faible'?'selected':''}>Faible</option></select></div>`;
    }
    if(type === 'education'){
      inside = `
        <div class="form-field"><label>Enseignant</label><input name="teacher" value="${escapeAttr(item.teacher||'')}" placeholder="Membre du foyer ou intervenant extérieur"></div>
        <div class="form-field"><label>Élève(s)</label>
          <div class="member-checkbox-list">
            <label class="member-check-item"><input type="checkbox" name="students_cb" value="family" ${(!item.students||item.students==='family')?'checked':''}> <span>Toute la famille</span></label>
            ${(data.family||[]).filter(mb=>!statusIsHidden(mb)).map(mb=>{
              const _ids=(item.students||'').split(',').map(s=>s.trim());
              return `<label class="member-check-item"><input type="checkbox" name="students_cb" value="${escapeAttr(mb.id)}" ${_ids.includes(mb.id)||(item.member===mb.id&&!item.students)?'checked':''}> <img src="${memberAvatarSrc(mb)}" alt="" class="cb-avatar"><span>${escapeHtml(mb.name)}</span></label>`;
            }).join('')}
          </div>
          <input type="hidden" name="students" id="studentsHidden" value="${escapeAttr(item.students||item.member||'family')}">
        </div>
        <div class="form-field"><label>Matière</label><input name="subject" value="${escapeAttr(item.subject||item.category||'')}" placeholder="Ex : Maths, Français"></div>
        ${item.type==='note'||item.category==='Notes'?`<div class="form-grid-2"><div class="form-field"><label>Note obtenue</label><input name="score" type="number" min="0" max="20" step="0.5" value="${escapeAttr(item.score||'')}" placeholder="Ex : 14"></div><div class="form-field"><label>Sur combien</label><input name="scoreMax" type="number" min="1" max="100" step="1" value="${escapeAttr(item.scoreMax||'20')}" placeholder="20"></div></div>`:''}
        <div class="form-grid-2"><div class="form-field"><label>Début</label><input name="eduWindowStart" type="time" value="${escapeAttr(item.eduWindowStart||item.startTime||'')}"></div><div class="form-field"><label>Fin</label><input name="eduWindowEnd" type="time" value="${escapeAttr(item.eduWindowEnd||item.endTime||'')}"></div></div><input type="hidden" name="duration" value="${escapeAttr(item.duration||'')}">`;
    }
    if(type === 'sante'){
      const _isAppt=isAppointment(item);
      const daysMode=item.treatmentDaysMode||(/2/.test(String(item.frequency||''))?'every_x_days':'every_day');
      const doseMode=item.doseMode||((item.frequency==='matin_soir')?'moments':'moments');
      const wk=String(item.treatmentWeekDays||'').split(',').map(x=>x.trim());
      const dm=String(item.doseMoments||'matin,midi,soir').split(',').map(x=>x.trim()).filter(Boolean);
      const dayBtn = (id,label)=>`<label class="member-check-item compact"><input type="checkbox" name="treatmentWeekDays_cb" value="${id}" ${wk.includes(id)?'checked':''}> <span>${label}</span></label>`;
      const momentRow = (id,label,def)=>`<label class="member-check-item treatment-moment-row"><input type="checkbox" name="doseMoments_cb" value="${id}" ${dm.includes(id)?'checked':''}> <span>${label}</span><input type="time" name="doseTime_${id}" value="${escapeAttr(item['doseTime_'+id]||def)}"></label>`;
      const treatmentPlanner = !_isAppt ? `
        <section class="treatment-planner">
          <h4>💊 Organisation des prises</h4>
          <div class="form-field"><label>Quels jours ?</label><select name="treatmentDaysMode">
            <option value="every_day" ${daysMode==='every_day'?'selected':''}>Tous les jours</option>
            <option value="every_x_days" ${daysMode==='every_x_days'?'selected':''}>Tous les X jours</option>
            <option value="week_days" ${daysMode==='week_days'?'selected':''}>Certains jours de la semaine</option>
            <option value="custom_dates" ${daysMode==='custom_dates'?'selected':''}>Planning personnalisé</option>
          </select></div>
          <div class="form-field"><label>Intervalle en jours</label><input name="dayInterval" type="number" min="1" step="1" value="${escapeAttr(item.dayInterval||(/2/.test(String(item.frequency||''))?2:1))}"><small>Utilisé si tu choisis “Tous les X jours”. Exemple : 2 = un jour sur deux.</small></div>
          <div class="form-field"><label>Jours de la semaine</label><div class="member-checkbox-list week-days-grid">${dayBtn('1','Lun')}${dayBtn('2','Mar')}${dayBtn('3','Mer')}${dayBtn('4','Jeu')}${dayBtn('5','Ven')}${dayBtn('6','Sam')}${dayBtn('0','Dim')}</div></div>
          <div class="form-field"><label>Planning personnalisé</label><textarea name="customTreatmentDates" rows="2" placeholder="Une date par ligne ou séparée par virgule. Ex : 12/06/2026, 19/06/2026">${escapeHtml(item.customTreatmentDates||'')}</textarea></div>
          <div class="form-field"><label>Quels horaires dans la journée ?</label><select name="doseMode">
            <option value="moments" ${doseMode==='moments'?'selected':''}>Moments de la journée</option>
            <option value="every_x_hours" ${doseMode==='every_x_hours'?'selected':''}>Toutes les X heures</option>
            <option value="custom_times" ${doseMode==='custom_times'?'selected':''}>Horaires personnalisés</option>
          </select></div>
          <div class="form-field"><label>Moments de la journée</label><div class="member-checkbox-list treatment-moments-grid">${momentRow('matin','Matin','08:00')}${momentRow('midi','Midi','13:00')}${momentRow('soir','Soir','20:00')}${momentRow('coucher','Coucher','22:00')}</div></div>
          <div class="form-grid-2"><div class="form-field"><label>Toutes les X heures</label><input name="hourInterval" type="number" min="1" step="1" value="${escapeAttr(item.hourInterval||6)}"></div><div class="form-field"><label>Première prise</label><input name="firstDoseTime" type="time" value="${escapeAttr(item.firstDoseTime||'08:00')}"></div></div>
          <div class="form-field"><label>Dernière prise</label><input name="lastDoseTime" type="time" value="${escapeAttr(item.lastDoseTime||'20:00')}"></div>
          <div class="form-field"><label>Horaires personnalisés</label><textarea name="customDoseTimes" rows="2" placeholder="Une heure par ligne ou séparée par virgule. Ex : 07:30, 12:45, 19:30">${escapeHtml(item.customDoseTimes||'')}</textarea></div>
        </section>` : '';
      inside = `
        <div class="form-grid-2"><div class="form-field"><label>Date de début</label><input name="startDate" type="date" value="${escapeAttr(dmyToISO(item.startDate||item.date)||'')}"></div><div class="form-field"><label>Date de fin</label><input name="endDate" type="date" value="${escapeAttr(dmyToISO(item.endDate)||'')}"></div></div>
        ${!_isAppt?`<div class="form-field"><label>Résumé fréquence</label><input name="frequency" value="${escapeAttr(item.frequency||'3 prises par jour')}" placeholder="Ex : 3 prises par jour, tous les 2 jours..."></div><div class="form-field"><label>Posologie (facultatif)</label><input name="dosage" value="${escapeAttr(item.dosage||'')}" placeholder="Ex : 1 comprimé..."></div>${treatmentPlanner}`:''}
        <div class="form-field"><label>${_isAppt?'Médecin / spécialiste':'Médecin prescripteur'} (facultatif)</label><input name="doctor" value="${escapeAttr(item.doctor||item.place||'')}" placeholder="Dr Dupont..."></div>
        ${_isAppt?`<div class="form-field"><label>Lieu du rendez-vous</label><input name="place" value="${escapeAttr(item.place||'')}" placeholder="Cabinet, Hôpital..."></div>`:''}
        <div class="form-field"><label>Accompagnant (facultatif)</label><select name="companion"><option value="">Aucun</option>${(data.family||[]).filter(mb=>!statusIsHidden(mb)).map(mb=>`<option value="${escapeAttr(mb.id)}" ${item.companion===mb.id?'selected':''}>${escapeHtml(mb.name)}</option>`).join('')}</select></div>`;
    }
    if(type==='sport_loisirs'){
      if(!['materiel_sport','materiel_loisir','materiel_voyage','document_sport'].includes(item.type||'')){
        inside+=`
        <div class="form-grid-2">
          <div class="form-field"><label>Date de début</label><input name="startDate" type="date" value="${escapeAttr(dmyToISO(item.startDate||item.date)||'')}"></div>
          <div class="form-field"><label>Date de fin</label><input name="endDate" type="date" value="${escapeAttr(dmyToISO(item.endDate)||'')}"></div>
        </div>
        <div class="form-field"><label>Récurrence</label><select name="recurrence">
          <option value="ponctuelle" ${(item.recurrence||'ponctuelle')==='ponctuelle'?'selected':''}>Ponctuelle</option>
          <option value="quotidienne" ${item.recurrence==='quotidienne'?'selected':''}>Quotidienne</option>
          <option value="hebdomadaire" ${item.recurrence==='hebdomadaire'?'selected':''}>Hebdomadaire</option>
          <option value="mensuelle" ${item.recurrence==='mensuelle'?'selected':''}>Mensuelle</option>
        </select></div>
        <div class="form-field"><label>Membres participants</label>
          <div class="member-checkbox-list">
            <label class="member-check-item"><input type="checkbox" name="members_cb" value="family" ${(!item.members||item.members==='family')?'checked':''}> <span>Toute la famille</span></label>
            ${(data.family||[]).filter(mb=>!statusIsHidden(mb)).map(mb=>{
              const _ids=String(item.members||item.member||'').split(',').map(s=>s.trim());
              return `<label class="member-check-item"><input type="checkbox" name="members_cb" value="${escapeAttr(mb.id)}" ${_ids.includes(mb.id)?'checked':''}> <img src="${memberAvatarSrc(mb)}" alt="" class="cb-avatar"><span>${escapeHtml(mb.name)}</span></label>`;
            }).join('')}
          </div>
          <input type="hidden" name="members" id="membersHidden" value="${escapeAttr(item.members||item.member||'family')}">
        </div>
        <div class="form-field"><label>Lieu (facultatif)</label><input id="activityLocationInput" name="location" value="${escapeAttr(item.location||'')}" placeholder="Ex : Gymnase, Cinéma, Paris…"><div class="map-action-row"><button class="btn ghost" type="button" onclick="SuperApp.useActivityPosition()">📍 Utiliser ma position</button><button class="btn ghost" type="button" onclick="SuperApp.openActivityInMaps()">🗺️ Ouvrir Maps</button></div><input type="hidden" name="locationLat" id="activityLatInput" value="${escapeAttr(item.locationLat||'')}"><input type="hidden" name="locationLng" id="activityLngInput" value="${escapeAttr(item.locationLng||'')}"><small>Le texte reste libre. La position GPS est ajoutée seulement si l’utilisateur le souhaite.</small></div>`;
      }
    }
    let extraAfterDetails = '';
    if(type==='sport_loisirs' && !['materiel_sport','materiel_loisir','materiel_voyage','document_sport'].includes(item.type||'')){
      const label = (item.type==='voyage') ? 'Voyage' : (item.type==='loisir' ? 'Loisir' : 'Sport');
      extraAfterDetails = item.id
        ? `<section class="slv-checklist-form-panel always-visible-checklist"><div class="slv-mini-help"><b>✅ Checklist</b></div><button type="button" class="btn primary" onclick="SuperApp.openSlvChecklistLight('${escapeAttr(item.id)}')">✅ Ouvrir la checklist ${escapeHtml(label)}</button></section>`
        : `<section class="slv-checklist-form-panel always-visible-checklist"><div class="slv-mini-help"><b>✅ Checklist</b></div><button type="submit" class="btn primary" name="openChecklistAfterSave" value="1" data-open-checklist="1">✅ Créer et ouvrir la checklist ${escapeHtml(label)}</button></section>`;
    }
    if(type === 'maison'){
      const freqMode = item.frequenceMode || 'ponctuelle';
      const wkDays = String(item.frequenceWeekDays||'').split(',').map(x=>x.trim()).filter(Boolean);
      const dayBtn = (id,label) => `<label class="member-check-item compact"><input type="checkbox" name="frequenceWeekDays_cb" value="${id}" ${wkDays.includes(id)?'checked':''}> <span>${label}</span></label>`;
      inside = `
        <div class="form-field"><label>Lieu (facultatif)</label><select name="place">
          <option value="" ${!item.place?'selected':''}>—</option>
          <option value="Cuisine" ${item.place==='Cuisine'?'selected':''}>🍳 Cuisine</option>
          <option value="Salon" ${item.place==='Salon'?'selected':''}>🛋️ Salon</option>
          <option value="Chambres" ${item.place==='Chambres'?'selected':''}>🛏️ Chambres</option>
          <option value="Salle de bain" ${item.place==='Salle de bain'?'selected':''}>🚿 Salle de bain</option>
          <option value="Extérieur" ${item.place==='Extérieur'?'selected':''}>🌿 Extérieur</option>
          <option value="Garage" ${item.place==='Garage'?'selected':''}>🚗 Garage</option>
        </select></div>
        <div class="form-field"><label>Priorité</label><select name="priorite">
          <option value="" ${!item.priorite?'selected':''}>—</option>
          <option value="Urgent" ${item.priorite==='Urgent'?'selected':''}>🔴 Urgent</option>
          <option value="Normal" ${item.priorite==='Normal'?'selected':''}>🟡 Normal</option>
          <option value="À prévoir" ${item.priorite==='À prévoir'?'selected':''}>🟢 À prévoir</option>
        </select></div>
        <section class="task-frequency-planner">
          <div class="form-field"><label>Fréquence</label><select name="frequenceMode" onchange="SuperApp.updateTaskFrequencyDisplay(this)">
            <option value="ponctuelle" ${freqMode==='ponctuelle'?'selected':''}>Ponctuelle (une seule fois)</option>
            <option value="quotidienne" ${freqMode==='quotidienne'?'selected':''}>Quotidienne</option>
            <option value="hebdomadaire" ${freqMode==='hebdomadaire'?'selected':''}>Hebdomadaire</option>
            <option value="mensuelle" ${freqMode==='mensuelle'?'selected':''}>Mensuelle</option>
            <option value="annuelle" ${freqMode==='annuelle'?'selected':''}>Annuelle</option>
            <option value="personnalisee" ${freqMode==='personnalisee'?'selected':''}>Personnaliser…</option>
          </select></div>
          <div class="task-freq-section task-freq-hebdo" style="${freqMode==='hebdomadaire'?'':'display:none'}">
            <div class="form-field"><label>Jours de la semaine</label>
              <div class="member-checkbox-list week-days-grid">
                ${dayBtn('1','Lun')}${dayBtn('2','Mar')}${dayBtn('3','Mer')}${dayBtn('4','Jeu')}${dayBtn('5','Ven')}${dayBtn('6','Sam')}${dayBtn('0','Dim')}
              </div>
              <small>Cochez un ou plusieurs jours.</small>
            </div>
          </div>
          <div class="task-freq-section task-freq-custom" style="${freqMode==='personnalisee'?'':'display:none'}">
            <div class="form-field"><label>Tous les X jours</label>
              <input name="frequenceInterval" type="number" min="1" step="1" value="${item.frequenceInterval||2}" placeholder="Ex : 3">
              <small>Exemple : 3 = tous les 3 jours, 14 = toutes les 2 semaines.</small>
            </div>
          </div>
        </section>`;
    }
    if(!inside) return extraAfterDetails;
    return `<details class="form-collapse"><summary>＋ Plus de détails</summary>${inside}</details>${extraAfterDetails}`;
  }

  // ---- V5.6 : Catégories vraiment connectées aux paramètres -----------------
  // Liste les catégories d'un module, en lisant data.categories en priorité,
  // avec un repli sur des valeurs par défaut si rien n'est paramétré.
  const DEFAULT_CATEGORIES = {
    maison:{'Ménage':[],'Rangement':[],'Entretien':[],'Réparation':[],'Urgence':[],'Routine':[],'Administratif':[]},
    courses_repas:{'Alimentation':[],'Épicerie':[],'Stock':[]},
    education:{'Devoirs':[],'Contrôles':[],'Documents école':[],'Notes':[],'Activités scolaires':[]},
    sante:{'Traitements':[],'Médicaments':[],'Rendez-vous':[],'Vaccins':[],'Documents santé':[],'Urgences':[]},
    sport_loisirs:{'Sport':[],'Sortie familiale':[],'Loisir':[],'Matériel':[],'Documents sport':[]},
    familles:{'Identité':[],'Passeport':[],'Diplômes':[],'Santé':[],'Scolarité':[],'Assurances':[],'Administratif':[]},
    calendrier:{'Général':[]}
  };
  function categoriesForModule(module){
    const m = canonicalModuleId(module);
    const fromUser = (data && data.categories && data.categories[m]) || null;
    if(fromUser && Object.keys(fromUser).length) return fromUser;
    return DEFAULT_CATEGORIES[m] || {'Général':[]};
  }
  function subcategoriesFor(module, category){
    const cats = categoriesForModule(module);
    const arr = cats[category];
    return Array.isArray(arr) ? arr : [];
  }
  function slvCategoryPack(item={}){
    const t = String(item.type||'').toLowerCase();
    if(t==='voyage') return {'Vacances':[],'Week-end':[],'Voyage international':[],'Voyage scolaire':[],'Documents voyage':[],'Préparation valise':[]};
    if(t==='loisir') return {'Sortie famille':[],'Cinéma':[],'Anniversaire':[],'Musée':[],'Parc':[],'Atelier créatif':[]};
    if(t==='materiel_voyage') return {'Bagages':[],'Documents voyage':[],'Administratif':[],'Santé voyage':[]};
    if(t==='materiel_loisir') return {'À préparer':[],'Réservation':[],'Matériel loisir':[]};
    if(['materiel_sport','document_sport'].includes(t)) return {'Équipement':[],'Tenue':[],'Documents sport':[],'Sac de sport':[]};
    return {'Entraînement':[],'Compétition':[],'Randonnée':[],'Salle de sport':[],'Danse':[],'Football':[],'Natation':[]};
  }
  function buildCategoryFieldsHtml(module, item={}){
    const m = canonicalModuleId(module);
    const cats = m==='sport_loisirs' ? slvCategoryPack(item) : categoriesForModule(m);
    const catNames = Object.keys(cats);
    const currentCat = item.category && catNames.includes(item.category) ? item.category : catNames[0];
    const subOptions = subcategoriesFor(m, currentCat);
    const subSelected = item.subcategory || '';
    // V5.8 : dernière option "+ Créer une catégorie…" qui ouvre la mini-fenêtre
    const catSelect = `<select name="category" id="fieldCategory" onchange="SuperApp.handleCategoryChange(this)">${catNames.map(c=>`<option ${currentCat===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}<option value="__create__" data-create>＋ Créer une catégorie…</option></select>`;
    const subSelect = subOptions.length
      ? `<select name="subcategory" id="fieldSubcategory" onchange="SuperApp.handleSubcategoryChange(this)"><option value="">— Aucune —</option>${subOptions.map(s=>`<option ${subSelected===s?'selected':''}>${escapeHtml(s)}</option>`).join('')}<option value="__create__" data-create>＋ Créer une sous-catégorie…</option></select>`
      : `<input name="subcategory" id="fieldSubcategory" placeholder="Sous-catégorie (optionnelle)" value="${escapeAttr(subSelected)}"><button type="button" class="link-btn inline-create" onclick="SuperApp.openCreateSubcategoryDialog()">＋ Créer une sous-catégorie</button>`;
    return `<div class="form-field"><label>Où ça se range ?</label>${catSelect}</div>
      <div class="form-field"><label>Sous-catégorie (facultatif)</label>${subSelect}</div>`;
  }
  function refreshSubcategories(newCat){
    const form = document.getElementById('editForm'); if(!form) return;
    const type = form.dataset.type || 'calendrier';
    const moduleId = (form.querySelector('[name="targetModule"]')?.value) || canonicalModuleId(type);
    const subs = subcategoriesFor(moduleId, newCat);
    const wrap = document.getElementById('fieldSubcategory'); if(!wrap) return;
    if(subs.length){
      const sel = document.createElement('select'); sel.name='subcategory'; sel.id='fieldSubcategory';
      sel.setAttribute('onchange',"SuperApp.handleSubcategoryChange(this)");
      sel.innerHTML = `<option value="">— Aucune —</option>` + subs.map(s=>`<option>${s.replace(/</g,'&lt;')}</option>`).join('') + `<option value="__create__" data-create>＋ Créer une sous-catégorie…</option>`;
      wrap.replaceWith(sel);
    } else {
      const inp = document.createElement('input'); inp.name='subcategory'; inp.id='fieldSubcategory'; inp.placeholder='Sous-catégorie (optionnelle)';
      wrap.replaceWith(inp);
    }
  }

  // V5.8 — Création de catégorie / sous-catégorie depuis le formulaire d'ajout.
  // Évite à la maman d'aller dans Paramètres pour créer une catégorie au milieu de son geste.
  function handleCategoryChange(selectEl){
    if(selectEl.value === '__create__'){
      // Revenir à la valeur précédente le temps que la mini-fenêtre se traite
      selectEl.value = selectEl.dataset.previous || (selectEl.options[0] && selectEl.options[0].value) || '';
      openCreateCategoryDialog();
      return;
    }
    selectEl.dataset.previous = selectEl.value;
    refreshSubcategories(selectEl.value);
  }
  function handleSubcategoryChange(selectEl){
    if(selectEl.value === '__create__'){
      selectEl.value = '';
      openCreateSubcategoryDialog();
    }
  }
  function getCurrentFormModule(){
    const form = document.getElementById('editForm'); if(!form) return 'calendrier';
    return canonicalModuleId(form.querySelector('[name="targetModule"]')?.value || form.dataset.type || 'calendrier');
  }
  function openCreateCategoryDialog(){
    const m = getCurrentFormModule();
    const dlg = ensureCreateDialog();
    dlg.dataset.kind = 'category'; dlg.dataset.module = m;
    dlg.querySelector('h3').textContent = 'Nouvelle catégorie';
    dlg.querySelector('p').textContent = `Pour le module ${moduleById(m)?.short || m}.`;
    dlg.querySelector('[name="catName"]').value = '';
    dlg.querySelector('[name="subName"]').value = '';
    dlg.querySelector('[name="subName"]').parentElement.style.display = '';
    dlg.querySelector('[name="catName"]').focus();
    try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
  }
  function openCreateSubcategoryDialog(){
    const m = getCurrentFormModule();
    const parentCat = document.getElementById('fieldCategory')?.value || Object.keys(categoriesForModule(m))[0];
    const dlg = ensureCreateDialog();
    dlg.dataset.kind = 'subcategory'; dlg.dataset.module = m; dlg.dataset.parent = parentCat;
    dlg.querySelector('h3').textContent = 'Nouvelle sous-catégorie';
    dlg.querySelector('p').textContent = `Dans la catégorie « ${parentCat} ».`;
    dlg.querySelector('[name="catName"]').value = '';
    dlg.querySelector('[name="subName"]').value = '';
    dlg.querySelector('[name="subName"]').parentElement.style.display = 'none';
    dlg.querySelector('[name="catName"]').focus();
    try { dlg.showModal(); } catch { dlg.setAttribute('open',''); }
  }
  function ensureCreateDialog(){
    let dlg = document.getElementById('createCatDialog');
    if(dlg) return dlg;
    dlg = document.createElement('dialog'); dlg.id = 'createCatDialog'; dlg.className = 'create-cat-dialog';
    dlg.innerHTML = `<form method="dialog" onsubmit="event.preventDefault();SuperApp.confirmCreateCategory();">
      <h3>Nouvelle catégorie</h3>
      <p></p>
      <div class="form-field"><label>Nom</label><input name="catName" required maxlength="40" placeholder="Ex : Jardin"></div>
      <div class="form-field"><label>Première sous-catégorie (optionnelle)</label><input name="subName" maxlength="40" placeholder="Ex : Pelouse"></div>
      <div class="dialog-actions"><button type="button" class="btn ghost" onclick="document.getElementById('createCatDialog').close()">Annuler</button><button type="submit" class="btn primary">Créer</button></div>
    </form>`;
    document.body.appendChild(dlg);
    return dlg;
  }
  function confirmCreateCategory(){
    const dlg = document.getElementById('createCatDialog'); if(!dlg) return;
    const kind = dlg.dataset.kind, module = dlg.dataset.module || 'calendrier';
    const catName = (dlg.querySelector('[name="catName"]').value||'').trim();
    if(!catName){ return; }
    data.categories = data.categories || {};
    data.categories[module] = data.categories[module] || {};
    if(kind === 'category'){
      const existing = Object.keys(data.categories[module]).find(c=>c.toLowerCase()===catName.toLowerCase());
      if(existing){
        toast('Cette catégorie existait déjà, on l\'a sélectionnée.');
        applyNewCategoryToForm(existing, null);
      } else {
        data.categories[module][catName] = [];
        const subName = (dlg.querySelector('[name="subName"]').value||'').trim();
        if(subName) data.categories[module][catName].push(subName);
        save();
        toast(`✅ Catégorie « ${catName} » créée`);
        applyNewCategoryToForm(catName, subName||null);
      }
    } else if(kind === 'subcategory'){
      const parent = dlg.dataset.parent;
      data.categories[module][parent] = data.categories[module][parent] || [];
      const existing = data.categories[module][parent].find(s=>s.toLowerCase()===catName.toLowerCase());
      if(existing){
        toast('Cette sous-catégorie existait déjà, on l\'a sélectionnée.');
        applyNewSubcategoryToForm(existing);
      } else {
        data.categories[module][parent].push(catName);
        save();
        toast(`✅ Sous-catégorie « ${catName} » créée`);
        applyNewSubcategoryToForm(catName);
      }
    }
    dlg.close();
  }
  // Après création, on resélectionne la nouvelle catégorie/sous-catégorie dans le formulaire ouvert (sans le fermer).
  function applyNewCategoryToForm(catName, subName){
    const sel = document.getElementById('fieldCategory'); if(!sel) return;
    // Reconstruire le select pour intégrer la nouvelle catégorie tout en gardant l'option "+ Créer"
    const m = getCurrentFormModule();
    const cats = Object.keys(categoriesForModule(m));
    sel.innerHTML = cats.map(c=>`<option ${c===catName?'selected':''}>${c.replace(/</g,'&lt;')}</option>`).join('') + `<option value="__create__" data-create>＋ Créer une catégorie…</option>`;
    sel.dataset.previous = catName;
    refreshSubcategories(catName);
    if(subName){
      // Sélectionner la sous-cat fraîchement créée
      const sub = document.getElementById('fieldSubcategory');
      if(sub && sub.tagName === 'SELECT') sub.value = subName;
      else if(sub) sub.value = subName;
    }
  }
  function applyNewSubcategoryToForm(subName){
    const m = getCurrentFormModule();
    const cat = document.getElementById('fieldCategory')?.value;
    refreshSubcategories(cat);
    const sub = document.getElementById('fieldSubcategory');
    if(sub && sub.tagName === 'SELECT') sub.value = subName;
    else if(sub) sub.value = subName;
  }
  function addItem(type,item){
    item.date = normalizeDateInput(item.date || '');
    const id = $('#editForm')?.dataset.id;
    const targetModule = canonicalModuleId(item.targetModule || item.module || type);
    if(!isAppActive(targetModule)){ toast('Cette application n’est pas activée. Active-la d’abord.'); return null; }
    delete item.targetModule;
    if(item.quantity !== undefined || item.unit){
      item.unit = item.unit || 'unité';
      item.quantity = normalizeQuantityForUnit(item.quantity, item.unit);
      item.qty = item.quantity ? `${item.quantity} ${item.unit}` : '';
    }
    if(item.startDate) item.startDate = normalizeDateInput(item.startDate);
    if(item.endDate) item.endDate = normalizeDateInput(item.endDate);
    if(targetModule==='education' && item.eduWindowStart && item.eduWindowEnd){
      const mins = Math.max(0, timeToMinutes(item.eduWindowEnd) - timeToMinutes(item.eduWindowStart));
      item.duration = mins ? `${Math.floor(mins/60)} h${mins%60 ? ' '+(mins%60)+' min' : ''}`.replace(/^0 h /,'') : item.duration;
      item.startTime = item.eduWindowStart; item.endTime = item.eduWindowEnd;
    }
    if(targetModule==='sante' && !isAppointment(item)){
      item.startDate = item.startDate || item.date || today;
      item.endDate = item.endDate || item.startDate;
      if(!item.doseStatuses) item.doseStatuses = (state.editing?.item?.doseStatuses) || {};
    }
    const _scbs=document.querySelectorAll('[name="students_cb"]:checked');
    if(_scbs.length){
      const _sv=[..._scbs].map(c=>c.value).filter(v=>v&&v!=='family');
      const _hf=[..._scbs].some(c=>c.value==='family');
      item.students=_hf||!_sv.length?'family':_sv.join(',');
      const _sh=document.getElementById('studentsHidden');
      if(_sh) _sh.value=item.students;
    }
    if(item.students && !item.member) item.member = String(item.students).split(',')[0] || 'family';
    if(item.members && (!item.member || item.member==='family')) item.member = item.members === 'family' ? 'family' : (String(item.members).split(',')[0] || 'family');
    if(['sante','education','sport_loisirs','familles','calendrier'].includes(targetModule) && item.showOnHome === undefined) item.showOnHome = false;
    delete item.initialChecklist; // ancienne saisie texte supprimée : checklist structurée uniquement
    let record;
    if(id && state.editing){
      const current = state.editing.item;
      Object.assign(current, item, {module: targetModule, date:item.date || current.date || today});
      if(current.type === 'rendez_vous_medical') current.type = 'appointment';
      if(current.type === 'medicament') current.type = 'medication';
      touchSync(current);
      record = current;
    } else {
      // V5.11 — Si on est dans le contexte "Menu de la semaine", on récupère le jour/créneau présélectionné
      if(state.preset && (typeof state.preset.day !== 'undefined') && item.type === 'repas_semaine'){
        item.day = state.preset.day;
        item.slot = state.preset.slot || item.slot || 'soir';
        state.preset = null;
      }
      const collection = targetCollectionFor(targetModule,item.type);
      record = decorateSync({...item, id:uid(), module:targetModule, date:item.date || today, status:item.status || 'a_faire', statut:item.status || 'a_faire'});
      if(record.type === 'rendez_vous_medical') record.type = 'appointment';
      if(record.type === 'medicament') record.type = 'medication';
      data[collection].push(record);
    }
    // V5.7 : addItem est désormais AUTONOME — il met à jour le stockage et tout l'écran.
    // Plus aucun appelant ne risque d'oublier save() ou render().
    save(); render();
    return record;
  }



  /* ------------------------------------------------------------------
     V5.4 — Récap en haut, listes directes, filtres membres, paramètres propres
     Quand on entre dans une app, les données sont visibles immédiatement.
  ------------------------------------------------------------------ */
  function defaultBlockForModule(module){
    module = canonicalModuleId(module);
    return ({maison:'taches', courses_repas:'repas', education:'ecole', sante:'tous', sport_loisirs:'tout', familles:'tout'}[module] || 'taches');
  }
  function ensureV53State(){
    if(!state.moduleBlocks) state.moduleBlocks = {};
    if(!state.memberFilters) state.memberFilters = {};
    if(!state.maisonPeriodFilters) state.maisonPeriodFilters = {};
  }
  function activeModuleBlock(module){ ensureV53State(); return state.moduleBlocks[canonicalModuleId(module)] || defaultBlockForModule(module); }
  function activeMemberFilter(module){ ensureV53State(); return state.memberFilters[canonicalModuleId(module)] || 'all'; }
  function activeMaisonPeriodFilter(){ ensureV53State(); return state.maisonPeriodFilters.maison || 'all'; }
  function setModuleBlock(module, block){
    ensureV53State(); module = canonicalModuleId(module); state.moduleBlocks[module] = block || defaultBlockForModule(module); if(module === 'maison') state.maisonPeriodFilters.maison = 'all'; state.appsView = {kind:'module', id:module}; setView('apps');
  }
  function setMemberFilter(module, memberId){
    ensureV53State(); module = canonicalModuleId(module); state.memberFilters[module] = memberId || 'all'; state.appsView = {kind:'module', id:module}; setView('apps');
  }
  function setMaisonPeriodFilter(period){
    ensureV53State(); state.maisonPeriodFilters.maison = period || 'all'; if(period && period !== 'all') state.moduleBlocks['maison'] = 'taches'; state.appsView = {kind:'module', id:'maison'}; setView('apps');
  }
  function toggleMaisonFilters(){
    ensureV53State(); state.maisonFiltersExpanded = !state.maisonFiltersExpanded; state.appsView = {kind:'module', id:'maison'}; setView('apps');
  }
  function updateTaskFrequencyDisplay(select){
    const form = select.closest('form') || document;
    const val = select.value;
    form.querySelectorAll('.task-freq-section').forEach(el=>{ el.style.display='none'; });
    if(val==='hebdomadaire') { const el=form.querySelector('.task-freq-hebdo'); if(el) el.style.display=''; }
    if(val==='personnalisee') { const el=form.querySelector('.task-freq-custom'); if(el) el.style.display=''; }
  }
  function fieldVal(item, keys){
    for(const k of keys){ if(item && item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') return item[k]; }
    return '';
  }
  function getItemMemberId(item={}){
    let v = fieldVal(item, ['memberId','member','assignedTo','responsable','personne','personneId','childId','eleveId','patientId','ownerId','participantId','requestedBy','forMember','beneficiary']);
    if(!v) return '';
    v = String(v).trim();
    if(['family','famille','all','tous'].includes(normalizeText(v))) return 'family';
    const byId = (data.family||[]).find(m => String(m.id) === v);
    if(byId) return byId.id;
    const byName = (data.family||[]).find(m => normalizeText(m.name) === normalizeText(v) || normalizeText(shortMemberName(m.name)) === normalizeText(v));
    return byName ? byName.id : v;
  }
  function itemMatchesMember(item, memberId){
    if(!memberId || memberId === 'all') return true;
    if(item.members){
      if(item.members === 'family') return true;
      if(String(item.members).split(',').map(s=>s.trim()).includes(memberId)) return true;
    }
    if(canonicalModuleId(item.module)==='sante' && item.companion === memberId) return true;
    return getItemMemberId(item) === memberId;
  }
  function applyMemberFilter(items, module){
    const memberId = activeMemberFilter(module);
    if(!memberId || memberId === 'all') return items;
    return (items||[]).filter(x=>itemMatchesMember(x, memberId));
  }
  function activeMemberList(){ return getFamilyMembers ? getFamilyMembers() : (data.family||[]).filter(m=>!statusIsHidden(m) && m.active !== false); }
    function listTabsForModule(module){
    module = canonicalModuleId(module);
    if(module === 'maison'){
      const current = activeModuleBlock(module);
      const period = activeMaisonPeriodFilter();
      const expanded = state.maisonFiltersExpanded || false;
      const mainFilters = [
        ['taches','Toutes','\u25a6',"SuperApp.setMaisonPeriodFilter('all')"],
        ['today','Aujourd\u2019hui','\ud83d\udcc5',"SuperApp.setMaisonPeriodFilter('today')"],
        ['late','En retard','\u23f0',"SuperApp.setMaisonPeriodFilter('late')"]
      ];
      const extraFilters = [
        ['maison_tache','T\u00e2che','\ud83e\uddf9',"SuperApp.setModuleBlock('maison','maison_tache')"],
        ['maison_entretien','Entretien','\ud83d\udd27',"SuperApp.setModuleBlock('maison','maison_entretien')"],
        ['taches_par_membre','Par membre','\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66',"SuperApp.setModuleBlock('maison','taches_par_membre')"]
      ];
      const visibleFilters = expanded ? [...mainFilters, ...extraFilters] : mainFilters;
      const chips = visibleFilters.map(([b,l,icon,action])=>
        `<button type="button" class="maison-filter-chip ${(period!=='all' ? b===period : b===current)?'active':''}" onclick="${action}"><span>${icon}</span>${l}</button>`
      ).join('');
      const moreBtn = !expanded
        ? `<button type="button" class="maison-filter-chip maison-filter-more" onclick="SuperApp.toggleMaisonFilters()">\u2699 Filtres</button>`
        : `<button type="button" class="maison-filter-chip maison-filter-more maison-filter-less" onclick="SuperApp.toggleMaisonFilters()">\u2715 Moins</button>`;
      return `<div class="maison-filter-bar">${chips}${moreBtn}</div>`;
    }
    const groups = {
      courses_repas:[['tout','Tout','▦'],['repas','Repas','🍽️'],['courses','Courses','🛒'],['stock','Stock','🧺']],
      education:[['tout','Tout','▦'],['ecole','École','📘'],['ecole_notes','Notes','⭐'],['documents','Documents','📄']],
      sante:[['tous','Tous','▦'],['rendez_vous','Rendez-vous','📅'],['traitements','Traitements','💊'],['documents','Documents','📄'],['alertes','Alertes','🔔']],
      sport_loisirs:[
        ['tout','Tout','▦'],
        ['sport_activites','Sport','⚽'],
        ['loisir_activites','Loisir','🎨'],
        ['voyage_activites','Voyage','✈️'],
        ['documents','Documents','📄'],
      ],
      familles:[['tout','Tout','▦'],['membres','Membres','👨‍👩‍👧‍👦'],['documents','Documents','📁']]
    }[module] || [];
    const current = activeModuleBlock(module);
    return `<div class="list-filter-chips v53-tabs ${module==='sante'?'health-filter-tabs':''}">${groups.map(([b,l,icon])=>`<button type="button" class="${b===current?'active':''}" onclick="SuperApp.setModuleBlock('${module}','${b}')"><span>${icon||''}</span>${l}</button>`).join('')}</div>`;
  }
  function summaryMetric(value, label, emoji){ return `<article class="v53-summary-pill"><span>${emoji}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></article>`; }
  function moduleSummary(module){
    module = canonicalModuleId(module);
    const scoped = arr => applyMemberFilter(arr, module);
    if(module==='maison') return [summaryMetric(scoped([...getMaisonTasks('open'), ...getGenericChecklistItems('maison')]).length,'éléments actifs','🏠'), summaryMetric(scoped(getMaisonTasks('today')).length,'aujourd’hui','📅'), summaryMetric(scoped(getMaisonTasks('late')).length,'en retard','⏰')].join('');
    if(module==='courses_repas') return [summaryMetric(scoped(getMenus()).length,'menus','🍽️'), summaryMetric(scoped(getShoppingItems('open')).length,'courses','🛒'), summaryMetric(scoped(getStockItems('low')).length,'stock faible','⚠️')].join('');
    if(module==='education') return [summaryMetric(scoped(getSchoolItems('open')).length,'école','📚'), summaryMetric(scoped(getSchoolItems('open').filter(x=>x.type==='note' || x.category==='Notes')).length,'notes','⭐'), summaryMetric(scoped(getSchoolItems('today')).length,'aujourd’hui','📅')].join('');
    if(module==='sante') return [summaryMetric(scoped(getHealthTreatments('open')).length,'traitements','💊'), summaryMetric(scoped(getHealthAppointments('open')).length,'rendez-vous','🩺'), summaryMetric(scoped(getHealthBookItems()).length,'carnet','📘')].join('');
    if(module==='sport_loisirs'){ const _a=[...scoped(getSportActivities('open')),...scoped(getLoisirActivities('open')),...scoped(getVoyageActivities('open'))]; return [summaryMetric(_a.length,'activités','⚽'), summaryMetric(scoped(getSportGear()).length+scoped(getLoisirGear()).length+scoped(getVoyageGear()).length,'matériel','🎒'), summaryMetric(scoped(getSportActivities('today')).length,'aujourd’hui','📅')].join(''); }
    if(module==='familles') return [summaryMetric(getFamilyMembers().length,'membres','👨‍👩‍👧‍👦'), summaryMetric(scoped(getFamilyDocuments()).length,'documents','📁')].join('');
    return '';
  }
  function listConfig(module, block){
    module = canonicalModuleId(module);
    if(block === 'membres') return {module, key:'membres', title:'Membres', emoji:'👨‍👩‍👧‍👦', type:'membre', category:'Membres', special:'members', help:'Cartes membres du foyer, ajout, modification et archivage.'};
    const cfg = MODULE_LISTS[module]?.[block] || null;
    if(cfg){ cfg.module = module; cfg.key = block; }
    return cfg;
  }
  function visibleCollectionItems(cfg){
    if(!cfg) return [];
    const module = canonicalModuleId(cfg.module || state.activeModule || '');
    const key = cfg.key || '';
    let arr = [];
    if(cfg.special === 'members') arr = getFamilyMembers();
    else if(module==='maison' || cfg.collection==='tasks'){
      if(['taches_aujourdhui','taches_du_jour'].includes(key)) arr = getMaisonTasks('today');
      else if(key==='taches_retard' || cfg.filterName==='late') arr = getMaisonTasks('late');
      else if(['taches_recurrentes','routines'].includes(key)) arr = getMaisonTasks('recurrent');
      else if(['taches_terminees'].includes(key)) arr = getMaisonTasks('done');
      else {
        const tasks = visibleItems('tasks');
        const isEntretien = x => itemType(x).includes('entretien') || itemCategory(x).includes('entretien') || itemCategory(x).includes('reparation') || itemCategory(x).includes('réparation');
        const isRoutine = x => itemType(x).includes('routine') || matchesWords(x,['routine','récurrent','recurrent','quotidien','hebdo']);
        if(key === 'maison_entretien') arr = tasks.filter(isEntretien);
        else if(key === 'maison_routine') arr = tasks.filter(isRoutine);
        else if(key === 'maison_tache') arr = tasks.filter(x=>!isEntretien(x) && !isRoutine(x));
        else arr = [...tasks, ...getGenericChecklistItems('maison')];
        const period = activeMaisonPeriodFilter();
        if(period === 'today') arr = arr.filter(x=>!statusIsDone(x) && (x.date === today || (/quotidien|daily/i.test(x.recurrence||''))));
        else if(period === 'late') arr = arr.filter(x=>!statusIsDone(x) && x.date && daysDiff(today,x.date) < 0);
        else if(period === 'recurrent') arr = arr.filter(x=>matchesWords(x,['routine','récurrent','recurrent','quotidien','hebdo']));
      }
    } else if(module==='courses_repas'){
      if(key==='tout') arr = [...getShoppingItems('all'), ...getMenus(), ...getStockItems()];
      else if(key==='menus' || (cfg.collections||[]).includes('weeklyMeals')) arr = getMenus();
      else if(key==='stock_faible') arr = getStockItems('low');
      else if(cfg.collection==='stock') arr = getStockItems();
      else if(cfg.collection==='shopping') arr = getShoppingItems('all');
      else arr = getShoppingItems('open');
    } else if(module==='education'){
      arr = [...getSchoolItems('all'), ...getGenericChecklistItems('education')];
      if(cfg.filter) arr = arr.filter(cfg.filter);          // V5.6 : honorer le filtre (Notes…)
    } else if(module==='sante'){
      if(key==='tous') arr = [...getHealthAppointments('open'), ...getHealthTreatments('open'), ...getHealthBookItems()];
      else if(key==='rendez_vous') arr = getHealthAppointments('open');
      else if(key==='documents' || key==='carnet_sante' || (cfg.collections||[]).includes('vaccines')) arr = getHealthBookItems();
      else if(key==='alertes') arr = [...getHealthAppointments('open'), ...getHealthTreatments('today'), ...getHealthBookItems()].filter(x=>isHealthAlertItem(x));
      else arr = getHealthTreatments('open');
    } else if(module==='sport_loisirs'){
      if(key==='tout') arr=[...getSportActivities('open'),...getLoisirActivities('open'),...getVoyageActivities('open')];
      else {
      const _col=cfg.collection||'';
      if(_col==='loisirGear') arr=getLoisirGear();
      else if(_col==='voyageGear') arr=getVoyageGear();
      else if(_col==='sportGear') arr=getSportGear();
      else if(_col==='loisirs') arr=getLoisirActivities('open');
      else if(_col==='voyages') arr=getVoyageActivities('open');
      else arr=getSportActivities('open');
      }
    } else if(module==='familles'){
      if(key === 'tout') arr = [...getFamilyMembers().map(m=>({...m, _kind:'member'})), ...getFamilyDocuments()];
      else arr = cfg.special === 'members' ? getFamilyMembers().map(m=>({...m, _kind:'member'})) : getFamilyDocuments();
    } else {
      const names = cfg.collections || [cfg.collection];
      arr = names.flatMap(name => (data[name] || []).map(x => ({...x, _sourceCollection:name}))).filter(x=>!statusIsHidden(x));
      if(cfg.filter) arr = arr.filter(cfg.filter);
    }
    return applyMemberFilter(arr, module);
  }
  function moduleListTitle(module, block, cfg){
    const member = activeMemberFilter(module);
    const memberTxt = member && member !== 'all' ? ` · ${memberName(member)}` : '';
    if(canonicalModuleId(module)==='maison'){
      const labels = {all:'Tout', today:'Aujourd’hui', late:'En retard', recurrent:'Récurrent'};
      const period = activeMaisonPeriodFilter();
      return `${cfg.title}${period && period !== 'all' ? ' · '+labels[period] : ''}${memberTxt}`;
    }
    return `${cfg.title}${memberTxt}`;
  }
  function supabaseDocsPanelHtml(mode){
    const title = mode === 'global' ? 'Documents' : `Documents ${documentModuleLabel(mode)}`;
    return `<section class="sb-module-docs-panel" data-sb-docs-panel="${escapeAttr(mode)}">
      <div class="section-title compact-title v53-list-title"><h2>📁 ${escapeHtml(title)}</h2><button class="link-btn" type="button" onclick="window.sbHydrateDocsPanel?.('${escapeAttr(mode)}')">↻ Actualiser</button></div>
      <div class="sb-doc-test-intro"><b>📎 Liste documentaire</b></div>
      <div class="sb-module-docs-status info">Chargement des documents…</div>
      <div class="sb-module-docs-filters"></div>
      <div class="sb-module-docs-list"><div class="sb-doc-empty">Chargement…</div></div>
    </section>`;
  }

    function renderDirectList(module){
    module = canonicalModuleId(module);
    const block = activeModuleBlock(module);
    const cfg = listConfig(module, block) || listConfig(module, defaultBlockForModule(module));
    // V5.36.29 — Courses/Repas > Tout : repas en tableau + courses + stock.
    if(cfg.special === 'coursesAllView'){
      const shoppingStock = [...getShoppingItems('all'), ...getStockItems()];
      const rows = shoppingStock.length ? shoppingStock.map(x=>managementRow(x,cfg)).join('') : `<article class="empty cute-empty"><b>🛒 Aucun article ou stock</b><small>Ajoute des courses ou du stock.</small></article>`;
      return `<section class="v53-direct-list" data-block="${escapeAttr(block)}">
        <section class="filter-zone"><h3>Filtrer</h3>${listTabsForModule(module)}</section>
        ${memberFilterRow(module)}
        <div class="section-title compact-title v53-list-title"><h2>🍽️ Repas</h2><button class="link-btn" onclick="SuperApp.openAdd('courses_repas','repas_semaine','Menu de la semaine')">+ Repas</button></div>
        ${mealsViewHtml()}
        <div class="section-title compact-title v53-list-title"><h2>🛒 Courses et stock</h2><button class="link-btn" onclick="SuperApp.openAdd('courses_repas','course','Alimentation')">+ Ajouter</button></div>
        <div class="management-list">${rows}</div>
      </section>`;
    }
    // V5.27 — Vue Repas : repas du jour en vedette + tableau hebdo
    if(cfg.special === 'mealsView'){
      return `<section class="v53-direct-list" data-block="${escapeAttr(block)}">
        <section class="filter-zone"><h3>Filtrer</h3>${listTabsForModule(module)}</section>
        ${mealsViewHtml()}
      </section>`;
    }
    // V5.27 — Vue Stock : liste + bouton "Ajouter aux courses" pour les Faibles
    if(cfg.special === 'stockView'){
      return `<section class="v53-direct-list" data-block="${escapeAttr(block)}">
        <section class="filter-zone"><h3>Filtrer</h3>${listTabsForModule(module)}</section>
        ${stockViewHtml(cfg)}
      </section>`;
    }
    // V5.11 — Vue tableau hebdo legacy (gardée pour autres alias)
    if(cfg.special === 'weeklyTable'){
      return `<section class="v53-direct-list" data-block="${escapeAttr(block)}">
        ${listTabsForModule(module)}
        ${weeklyMealsTableHtml()}
      </section>`;
    }
    if(block === 'documents' && supportsSupabaseDocs(module)){
      const docsMode = module === 'familles' ? 'global' : module;
      setTimeout(()=>window.sbHydrateDocsPanel?.(docsMode), 120);
      return `<section class="v53-direct-list ${module==='sante'?'health-direct-list':''}" data-block="${escapeAttr(block)}">
        <section class="filter-zone"><h3>Filtrer</h3>${listTabsForModule(module)}</section>
        ${memberFilterRow(module)}
        ${supabaseDocsPanelHtml(docsMode)}
      </section>`;
    }
    const items = visibleCollectionItems(cfg);
    const docsModeInline = ((block==='tout' || block==='tous') && supportsSupabaseDocs(module)) ? (module==='familles' ? 'global' : module) : '';
    const docsPanelInline = docsModeInline ? supabaseDocsPanelHtml(docsModeInline) : '';
    if(docsModeInline) setTimeout(()=>window.sbHydrateDocsPanel?.(docsModeInline), 120);
    const addAction = cfg.special === 'members'
      ? `SuperApp.openSettingsMember('')`
      : `SuperApp.openAdd('${module}','${cfg.type||eventTypeForModule(module)}','${escapeAttr(cfg.category||'Général')}')`;
    const rows = cfg.special === 'members'
      ? (items.length ? items.map(manageMemberRow).join('') : `<article class="empty cute-empty"><b>👤 Aucun membre</b><small>Ajoute un premier membre du foyer.</small><button class="btn primary" onclick="SuperApp.openSettingsMember('')">+ Ajouter</button></article>`)
      : (items.length ? items.map(x=>{
          if(module==='sante') return healthInfoRow(x,cfg);
          if(module==='familles' && x._kind==='member') return manageMemberRow(x);
          if(module==='sport_loisirs'&&!cfg.special&&cfg.collection!=='sportGear'&&cfg.collection!=='loisirGear'&&cfg.collection!=='voyageGear') return slvActivityCard(x);
          return managementRow(x,cfg);
        }).join('') : `<article class="empty cute-empty"><b>${cfg.emoji} Rien pour le moment</b><small>Ajoute un premier élément. Tout élément affiché peut ensuite être modifié ou supprimé.</small><button class="btn primary" onclick="${addAction}">+ Ajouter</button></article>`);
    const titleBar = module === 'sante' ? '' : `<div class="section-title compact-title v53-list-title"><h2>${cfg.emoji} ${escapeHtml(moduleListTitle(module, block, cfg))}</h2><button class="link-btn" onclick="${addAction}">+ Ajouter</button></div>`;
    return `<section class="v53-direct-list ${module==='sante'?'health-direct-list':''}" data-block="${escapeAttr(block)}">
      <section class="filter-zone"><h3>${module==='sante'?'Filtrer la liste':'Filtrer'}</h3>${listTabsForModule(module)}</section>
      ${memberFilterRow(module)}
      ${titleBar}
      <div class="management-list">${rows}</div>
      ${docsPanelInline}
    </section>`;
  }
  function paintModule(id, focusKey=''){
    const m=moduleById(canonicalModuleId(id)); if(!m) return;
    ensureV53State(); state.activeModule = m.id;
    const view = $('#view-apps');
    // V5.24 — Chaque page module a 3 paliers de couleur (strong / soft / medium) propres à l'app
    const tone = m.cls || ''; // module-home, module-food, module-edu, etc.
    if(m.id==='sante'){
      // V5.25 — Santé suit le même schéma que les autres modules
      // STRONG = zone d'ajout (qui est la zone d'action) / SOFT = urgences (info clé) / MEDIUM = liste
      view.innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.renderAppsHome()">← Retour aux apps</button></div>
        ${appHeroBlock(m.id)}
        <section class="palette-strong ${tone}">${healthQuickActions()}</section>
        <section class="palette-soft ${tone}">${healthEmergencyBlock()}</section>
        <section class="palette-medium ${tone}">${renderDirectList(m.id)}</section>`;
    } else if(m.id === 'maison'){
      view.innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.renderAppsHome()">← Retour aux apps</button></div>
        ${appHeroBlock(m.id)}
        <section class="palette-soft ${tone}"><div class="v53-recap-head"><b>Récap rapide</b><small>Vue rapide des éléments importants du module.</small></div><div class="v53-summary-grid">${moduleSummary(m.id)}</div></section>
        <section class="palette-strong ${tone}">${primaryActionsForModule(m.id)}</section>
        <section class="palette-medium ${tone}">${renderDirectList(m.id)}</section>`;
    } else {
      view.innerHTML = `<div class="screen-backbar"><button class="btn ghost back-btn" onclick="SuperApp.renderAppsHome()">← Retour aux apps</button></div>
        ${appHeroBlock(m.id)}
        <section class="palette-strong ${tone}">${primaryActionsForModule(m.id)}</section>
        <section class="palette-soft ${tone}"><div class="v53-recap-head"><b>Récap rapide</b><small>Vue rapide des éléments importants du module.</small></div><div class="v53-summary-grid">${moduleSummary(m.id)}</div></section>
        <section class="palette-medium ${tone}">${renderDirectList(m.id)}</section>`;
    }
    if(supportsSupabaseDocs(m.id) && activeModuleBlock(m.id)==='documents') setTimeout(()=>window.sbHydrateDocsPanel?.(m.id==='familles'?'global':m.id), 120);
    if(focusKey){ setTimeout(()=>document.querySelector(`[data-block="${focusKey}"]`)?.scrollIntoView({behavior:'smooth',block:'start'}),50); }
  }
  // V5.8 — Boutons "+ Nouvelle ..." spécifiques à chaque module, en haut.
  function primaryActionsForModule(id){
    const labels = {
      maison:'Ajouter une action maison',
      courses_repas:'Ajouter courses ou repas',
      education:'Ajouter une information scolaire',
      sante:'Ajouter une information santé',
      sport_loisirs:(()=>{ const _t=state.slvTab||'tout'; if(_t==='sport') return 'Ajouter une activité sportive'; if(_t==='loisir') return 'Ajouter un loisir'; if(_t==='voyage') return 'Ajouter un voyage'; return 'Sport, Loisir & Voyage'; })(),
      familles:'Ajouter au foyer'
    };
    const buttons = {
      maison: [['🧹 Tâche',`SuperApp.openAdd('maison','tache','Ménage')`,true],['🔧 Entretien',`SuperApp.openAdd('maison','entretien','Entretien')`,false]],
      courses_repas: [
        ['🛒 Course',`SuperApp.openAdd('courses_repas','course','Alimentation')`,true],
        ['🍽️ Repas',`SuperApp.openAdd('courses_repas','repas_semaine','Menu de la semaine')`,false],
        ['🧺 Stock',`SuperApp.openAdd('courses_repas','stock','Stock')`,false]
      ],
      education: [
        ['📘 Devoir',`SuperApp.openAdd('education','devoir','Devoirs')`,true],
        ['📝 Note',`SuperApp.openAdd('education','note','Notes')`,false],
        ['📄 Document',`SuperApp.openAdd('education','document_ecole','Documents école')`,false]
      ],
      sante: [
        ['📅 RV',`SuperApp.openAdd('sante','rendez_vous_medical','Rendez-vous')`,true],
        ['💊 Traitement',`SuperApp.openAdd('sante','medicament','Traitements')`,false],
        ['📄 Document',`SuperApp.openAdd('sante','document_sante','Documents santé')`,false]
      ],
      sport_loisirs: [
        ['⚽ Sport',`SuperApp.setSlvTab('sport');SuperApp.openAdd('sport_loisirs','activite','Sport')`,true],
        ['🎨 Loisir',`SuperApp.setSlvTab('loisir');SuperApp.openAdd('sport_loisirs','loisir','Loisir')`,false],
        ['✈️ Voyage',`SuperApp.setSlvTab('voyage');SuperApp.openAdd('sport_loisirs','voyage','Voyage')`,false]
      ],
      familles: [
        ['👤 Membre',`SuperApp.openSettingsMember('')`,true],
        ['📁 Document',`SuperApp.openAdd('familles','document_famille','Identité')`,false],
        ['🎨 Style famille',`SuperApp.openSettings('Famille')`,false]
      ]
    }[id] || [];
    if(id === 'maison'){
      const maisonBtns = buttons;
      return `<section class="add-zone maison-add-zone">
        <h3 class="maison-add-title">＋ Ajouter</h3>
        <div class="maison-add-stack">${maisonBtns.map(([label, onclick, primary])=>
          `<button type="button" class="maison-add-btn ${primary?'maison-add-primary':''}" onclick="${onclick}">
            <span class="maison-add-icon">${label.split(' ')[0]}</span>
            <span class="maison-add-label">${label.split(' ').slice(1).join(' ')}</span>
            <span class="maison-add-plus">＋</span>
          </button>`
        ).join('')}</div>
      </section>`;
    }
    return buttons.length ? `<section class="add-zone"><h3>${labels[id] || 'Ajouter'}</h3>${primaryActionBar(buttons)}</section>` : '';
  }
  function openModuleList(module, block){
    module = canonicalModuleId(module); ensureV53State(); state.moduleBlocks[module] = block || defaultBlockForModule(module); state.appsView = {kind:'module', id:module}; setView('apps');
  }
  function settingsVisualHero({title, text, img, emoji='✨', chips=[]}){
    if(!img&&!text&&!chips.length) return '';
    return `<div class="settings-visual-hero-mini">
      ${img?`<img src="${img}" alt="" class="svh-img" onerror="this.style.display='none'">`:''}
      <div class="svh-body">
        ${text?`<p class="svh-text">${escapeHtml(text)}</p>`:''}
        ${chips.length?`<div class="settings-chips">${chips.map(c=>`<span>${escapeHtml(c)}</span>`).join('')}</div>`:''}
      </div>
    </div>`;
  }
  function sbUserBarHtml(){
    if(typeof window.sbUserBarExternal === 'function') return window.sbUserBarExternal();
    return '';
  }
  function renderSettings(){
    const active = APP_MODULE_IDS.filter(id=>appRecord(id).actif).length;
    const inactive = APP_MODULE_IDS.length - active;
    const familleName = data.settings?.familyName || 'Foyer à configurer';
    const foyerAddr = foyerAddressLabel();
    const memberCount = (data.family||[]).filter(m=>!statusIsHidden(m)).length;
    const packLabel = (FAMILY_PACKS.find(p=>p.id===currentFamilyPack()) || FAMILY_PACKS[0]).label;
    const familyImg = profileAvatar();

    // V5.9 — Sections regroupées par "univers" pour ne pas avoir une longue liste plate
    // V5.11 — L'icône de la carte Famille est désormais un mini-portrait rond du pack actif (au lieu d'un emoji générique)
    const familyPackPhoto = (FAMILY_PACKS.find(p=>p.id===currentFamilyPack()) || FAMILY_PACKS[0]).family;
    const groups = [
      {title:'Ta famille', emoji:'👨‍👩‍👧‍👦', items:[
        [`<img class="settings-card-photo" src="${familyPackPhoto}" alt="">`,'Famille : membres & style', 'Famille', `${memberCount} ${memberCount>1?'membres':'membre'} · ${packLabel}`],
        ['🏡','Foyer & localisation', 'Localisation du foyer', foyerAddr !== 'Adresse non renseignée' ? foyerAddr : (data.settings?.city || 'À renseigner')]
      ]},
      {title:'Tes applications', emoji:'📱', items:[
        ['📱','Applications', 'Applications', `${active} active${active>1?'s':''}, ${inactive} disponible${inactive>1?'s':''}`],
        ['📁','Catégories', 'Catégories', 'Personnalise les rangements'],
        ['🔔','Notifications', 'Notifications', 'Rappels et alertes'],
        ['🚑','Santé — numéros d’urgence', 'Santé urgences', 'Pompiers, Police, SAMU']
      ]},
      {title:'Apparence & données', emoji:'✨', items:[
        ['🎨','Apparence', 'Apparence', 'Thème et couleurs'],
        ['👤','Compte', 'Compte', window._sbUserEmail ? 'Connecté' : 'Hors ligne'],
        ['🔄','Synchronisation', 'Synchronisation', data.offer?.syncEnabled ? 'Cockpit connecté' : 'Mobile seul'],
        ['🛡️','Sauvegarde & données', 'Données', 'Export, import, sauvegarde']
      ]}
    ];

    $('#view-settings').innerHTML = sbUserBarHtml() + `
      <article class="settings-hero-v59">
        <img class="settings-hero-photo" src="${familyImg}" alt="Photo de famille" onerror="this.style.display='none'">
        <div class="settings-hero-overlay">
          <span class="settings-hero-eyebrow">Mes réglages</span>
          <h2>${escapeHtml(familleName)} <span class="wave">👋</span></h2>
          <p>${memberCount} membre${memberCount>1?'s':''} · ${active} app${active>1?'s':''} active${active>1?'s':''} · style « ${packLabel} »</p>
        </div>
      </article>
      ${groups.map(g=>`
        <section class="settings-section-v59">
          <h3 class="settings-section-title"><span>${g.emoji}</span> ${g.title}</h3>
          <div class="settings-cards-v59">
            ${g.items.map(([icon,label,key,desc])=>`
              <button type="button" class="settings-card-v59" onclick="SuperApp.openSettings('${key}')">
                <div class="settings-card-icon">${icon}</div>
                <div class="settings-card-body"><b>${label}</b><small>${escapeHtml(desc)}</small></div>
                <span class="settings-card-chev">›</span>
              </button>
            `).join('')}
          </div>
        </section>
      `).join('')}
      <section class="settings-section-v59 settings-section-tour">
        <button type="button" class="btn ghost" onclick="SuperApp.startOnboarding()">↻ Revoir le tour de bienvenue</button>
      </section>
    `;
  }
  // V5.9 — Le nouveau panneau "Style de famille" : choisir Afrique / Asie / Europe / mixte avec aperçu visuel
  function openStyleFamillePanel(){
    const current = currentFamilyPack();
    const html = `<article class="style-famille-intro"><h3>Style de famille 👨‍👩‍👧‍👦</h3><p class="muted">Choisis le style des illustrations utilisées pour ta famille. Tu pourras toujours en changer.</p></article>
      <div class="family-pack-grid">${FAMILY_PACKS.map(p=>`
        <button type="button" class="family-pack-card ${p.id===current?'active':''}" data-family-pack="${p.id}" onclick="SuperApp.setFamilyPack('${p.id}')">
          <img src="${p.family}" alt="${escapeAttr(p.label)}">
          <div class="family-pack-info">
            <b>${p.label}</b>
            <small>${p.desc}</small>
            ${p.id===current ? '<span class="family-pack-current">✓ Actuel</span>' : '<span class="family-pack-choose">Choisir</span>'}
          </div>
        </button>
      `).join('')}</div>`;
    $('#editTitle').textContent = 'Style de famille';
    $('#editFields').innerHTML = html;
    $('#editForm').dataset.type = 'settings';
    $('#editForm').dataset.id = '';
    try { $('#editDialog').close(); } catch {}
    $('#editDialog').showModal();
  }
    function saveSettingsForm(type,item,id=''){
    if(type==='settings_member'){
      const memberId = id || uid();
      const existing = data.family.find(m=>m.id===memberId);
      const birth = normalizeDateInput(item.birth || '');
      const record = decorateSync({...(existing||{}), ...item, birth, id:memberId, module:'socle', type:'membre', title:item.name, active:true, statut:'actif', status:'actif'});
      if(existing) Object.assign(existing, record); else data.family.push(record);
      save();
      render();
      closeEditDialog();
      const onb = document.getElementById('onboarding');
      if(onb){ onb.innerHTML = onboardingHousehold(); return; }
      setTimeout(()=>showSettingsPanel('Famille'), 60);
      return;
    }
    if(type==='settings_family'){
      data.settings.familyName = String(item.familyName || '').trim();
      data.settings.familyPreferences = String(item.familyPreferences || data.settings.familyPreferences || '').trim();
      save(); render(); closeEditDialog(); return;
    }
    if(type==='settings_location'){
      data.foyer = {...(data.foyer||{}),
        address:String(item.address||'').trim(),
        addressComplement:String(item.addressComplement||'').trim(),
        city:String(item.city||'').trim()||data.foyer?.city||'',
        postalCode:String(item.postalCode||'').trim()||data.foyer?.postalCode||'',
        country:item.country||'France',
        weatherCity:item.weatherCity||item.city||data.foyer?.weatherCity||'',
        latitude:Number(item.latitude||data.foyer?.latitude||0)||null,
        longitude:Number(item.longitude||data.foyer?.longitude||0)||null,
        weatherAuto:item.weatherAuto==='true',
        useDeviceLocation:item.useDeviceLocation==='true',
        usefulPlaces:lineArray(item.usefulPlaces),
        weatherAlerts:{pluie:!!item.alert_pluie, froid:!!item.alert_froid, vent:!!item.alert_vent, neige:!!item.alert_neige, canicule:!!item.alert_canicule},
        updatedAt:nowISO(), updatedFrom:'application_mobile', syncStatus:'local_only'};
      data.settings.city = data.foyer.city; data.settings.postalCode = data.foyer.postalCode;
      data.settings.country = data.foyer.country; data.settings.weatherCity = data.foyer.weatherCity;
      save(); render(); closeEditDialog();
      if(data.foyer?.weatherAuto!==false) refreshWeather({silent:true, auto:true});
      return;
    }
    if(type==='settings_health_emergency'){
      data.settings.emergencyNumbers = {pompiers:String(item.pompiers||'').trim(), police:String(item.police||'').trim(), samu:String(item.samu||'').trim()};
      save(); render(); closeEditDialog(); return;
    }
    if(type==='settings_budget_courses'){
      data.foodBudget = {monthly:Number(item.monthly||0), spent:Number(item.spent||0), currency:item.currency || data.settings.currency || 'EUR'}; save(); render(); closeEditDialog(); openBudgetBoard(); return;
    }
    if(type==='settings_category'){
      const module = canonicalModuleId(item.module); const oldName = item.oldName || ''; const name = String(item.name||'').trim(); if(!data.categories[module]) data.categories[module] = {}; if(oldName && oldName !== name) delete data.categories[module][oldName]; data.categories[module][name] = lineArray(item.children); save(); render(); closeEditDialog(); return;
    }
    if(type==='settings_reference'){
      const module = canonicalModuleId(item.module); const oldName = item.oldName || ''; const name = String(item.name||'').trim(); if(!data.referenceData[module]) data.referenceData[module] = {}; if(oldName && oldName !== name) delete data.referenceData[module][oldName]; data.referenceData[module][name] = lineArray(item.values); save(); render(); closeEditDialog(); return;
    }
    if(type==='settings_notifications'){
      const prefs = {global:!!item.global, sauvegarde:!!item.sauvegarde, synchro:!!item.synchro}; APP_MODULE_IDS.forEach(mid=>prefs[mid]=!!item[mid]); data.settings.notificationsPrefs = prefs; save(); render(); closeEditDialog(); return;
    }
    if(type==='settings_appearance'){
      data.settings.appearance = {...(data.settings.appearance||{}), ...item}; data.settings.theme = item.theme || data.settings.theme; save(); applyAppearance(); render(); closeEditDialog(); return;
    }
    closeEditDialog();
  }



  /* ------------------------------------------------------------------
     V5.4 — Familles personnalisables + calendrier jour sans doublon
  ------------------------------------------------------------------ */
  // V5.9 — Vraies images de familles (style 3D Pixar) en WebP optimisé.
  // 4 packs : Afrique (défaut), Asie, Europe, mixte.
  // 7 rôles par pack (sauf mixte qui en a 7 sans grands-parents) : papa, maman, ado_fille, ado_garcon, fillette, petite_fille, bebe + grand_pere/grand_mere pour les 3 packs complets.
  const FAMILY_PACKS = [
    {id:'afrique', label:'Famille africaine', desc:'Style chaleureux et coloré', family:'assets/images/familles_packs/afrique_famille.webp'},
    {id:'asie',    label:'Famille asiatique', desc:'Style doux et expressif',   family:'assets/images/familles_packs/asie_famille.webp'},
    {id:'europe',  label:'Famille européenne', desc:'Style clair et tendre',    family:'assets/images/familles_packs/europe_famille.webp'},
    {id:'mixte',   label:'Famille mixte',     desc:'Famille moderne et inclusive', family:'assets/images/familles_packs/mixte_famille.webp'}
  ];
  // Rôles disponibles selon le pack
  const ROLES_COMPLETS = ['grand_pere','grand_mere','papa','maman','ado_fille','ado_garcon','fillette','petite_fille','bebe'];
  const ROLES_MIXTE    = ['papa','maman','ado_fille','ado_garcon','fillette','petite_fille','bebe'];
  function rolesForPack(packId){ return packId === 'mixte' ? ROLES_MIXTE : ROLES_COMPLETS; }
  function currentFamilyPack(){ return data.settings?.familyAvatarPack || 'afrique'; }
  function avatarPathForId(id){
    if(!id) return 'assets/images/familles_packs/afrique_famille.webp';
    return `assets/images/familles_packs/${id}.webp`;
  }
  function defaultAvatarIdForMember(m={}, index=0){
    const pack = currentFamilyPack();
    const roles = rolesForPack(pack);
    const role = normalizeText(m.role || '');
    // Détection par rôle texte
    if(role.includes('papa') || role.includes('pere')) return `${pack}_papa`;
    if(role.includes('maman') || role.includes('mere')) return `${pack}_maman`;
    if((role.includes('grand') && role.includes('pere')) || role.includes('papi')) return roles.includes('grand_pere') ? `${pack}_grand_pere` : `${pack}_papa`;
    if((role.includes('grand') && role.includes('mere')) || role.includes('mami')) return roles.includes('grand_mere') ? `${pack}_grand_mere` : `${pack}_maman`;
    if(role.includes('grand')) return roles.includes('grand_pere') ? `${pack}_grand_pere` : `${pack}_papa`;
    if(role.includes('bebe') || role.includes('nourrisson')) return `${pack}_bebe`;
    if(role.includes('ado') && role.includes('fille')) return `${pack}_ado_fille`;
    if(role.includes('ado') && (role.includes('garcon')||role.includes('fils'))) return `${pack}_ado_garcon`;
    if(role.includes('fille') && role.includes('petit')) return `${pack}_petite_fille`;
    if(role.includes('fille')) return `${pack}_fillette`;
    if(role.includes('garcon') || role.includes('fils')) return `${pack}_ado_garcon`;
    // Repli : on attribue selon l'index dans la famille
    return `${pack}_${roles[index % roles.length]}`;
  }
  function memberAvatarId(m={}){
    const idx = (data.family||[]).filter(x=>!statusIsHidden(x)).findIndex(x=>x.id===m.id);
    return m.avatarId || defaultAvatarIdForMember(m, idx < 0 ? 0 : idx);
  }
  function memberAvatarSrc(m={}){ return avatarPathForId(memberAvatarId(m)); }
  function avatarOptionsHtml(selected=''){
    // Toutes les combinaisons pack × rôle
    const all = FAMILY_PACKS.flatMap(p=>rolesForPack(p.id).map(r=>({id:`${p.id}_${r}`, label:`${p.label} — ${roleLabel(r)}`})));
    return all.map(a=>`<option value="${a.id}" ${selected===a.id?'selected':''}>${escapeHtml(a.label)}</option>`).join('');
  }
  function roleLabel(role){
    return ({grand_pere:'Grand-père', grand_mere:'Grand-mère', papa:'Papa', maman:'Maman', ado_fille:'Ado fille', ado_garcon:'Ado garçon', fillette:'Fillette', petite_fille:'Petite fille', bebe:'Bébé'})[role] || role;
  }
  function avatarPickerGrid(selected=''){
    const pack = FAMILY_PACKS.find(p=>p.id===currentFamilyPack()) || FAMILY_PACKS[0];
    const ids = rolesForPack(pack.id).map(r=>`${pack.id}_${r}`);
    return `<div class="avatar-choice-grid">${ids.map(id=>`<label class="avatar-choice ${selected===id?'active':''}" onclick="SuperApp.selectAvatarChoice(this,'${escapeAttr(id)}')"><input type="radio" name="avatarId" value="${id}" ${selected===id?'checked':''}><img src="${avatarPathForId(id)}" alt=""><span>${roleLabel(id.replace(pack.id+'_',''))}</span></label>`).join('')}</div>`;
  }
  function selectAvatarChoice(label, id){
    const field = label?.closest?.('.avatar-field') || document;
    field.querySelectorAll('.avatar-choice').forEach(el=>el.classList.remove('active'));
    label.classList.add('active');
    const radio = label.querySelector('input[name="avatarId"]');
    if(radio) radio.checked = true;
    const fallback = field.querySelector('.avatar-select-fallback');
    if(fallback){ fallback.name = 'avatarIdFallback'; fallback.value = id; }
    const preview = document.querySelector('.member-edit-preview .settings-member-avatar img');
    if(preview) preview.src = avatarPathForId(id);
  }
  function refreshFamilyPackSelectionUI(){
    const current = currentFamilyPack();
    document.querySelectorAll('[data-family-pack]').forEach(card=>{
      const active = card.dataset.familyPack === current;
      card.classList.toggle('active', active);
      const status = card.querySelector('.family-pack-current,.family-pack-choose');
      if(status){
        status.className = active ? 'family-pack-current' : 'family-pack-choose';
        status.textContent = active ? '✓ Actuel' : 'Choisir';
      }
    });
  }
  function setFamilyPack(packId){
    const pack = FAMILY_PACKS.find(p=>p.id===packId); if(!pack) return;
    data.settings.familyAvatarPack = packId;
    (data.family||[]).filter(m=>!statusIsHidden(m)).forEach((m,i)=>{
      m.avatarPack = packId;
      m.avatarId = defaultAvatarIdForMember({...m, avatarId:''}, i);
      touchSync(m);
    });
    save(); render(); refreshFamilyPackSelectionUI();
  }
  function profileAvatar(){
    const p=activeProfile();
    if(p==='family'){
      const pack = FAMILY_PACKS.find(x=>x.id===currentFamilyPack()) || FAMILY_PACKS[0];
      return pack.family;
    }
    const m = (data.family||[]).find(x=>x.id===p);
    return m ? memberAvatarSrc(m) : (FAMILY_PACKS[0].family);
  }
  function boolLabel(value, fallback='non'){
    const v = String(value ?? fallback).toLowerCase();
    return ['oui','true','1','yes'].includes(v) ? 'Oui' : 'Non';
  }
  function boolClass(value, fallback='non'){
    return boolLabel(value, fallback) === 'Oui' ? 'yes' : 'no';
  }
  function formatPhone(value=''){
    const raw = String(value || '').trim();
    if(!raw) return 'À renseigner';
    const digits = raw.replace(/\D/g,'');
    if(digits.length === 10) return digits.replace(/(\d{2})(?=\d)/g,'$1 ').trim();
    return raw;
  }
  function memberWorkSchoolType(m={}){
    const explicit = String(m.workSchoolType || '').trim();
    if(explicit) return explicit;
    const role = normalizeText(m.role || '');
    return role.includes('enfant') || role.includes('bebe') ? 'École' : 'Travail';
  }
  function memberAlertLabel(m={}){
    const birth = parseDMY(m.birth);
    if(birth){
      const next = new Date(todayObj.getFullYear(), birth.getMonth(), birth.getDate());
      if(next < new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate())) next.setFullYear(next.getFullYear()+1);
      const days = Math.round((next - new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate())) / 86400000);
      if(days > 0 && days <= 30) return `🎂 Anniversaire dans ${days} jour${days>1?'s':''}`;
      if(days === 0) return '🎂 Anniversaire aujourd’hui';
    }
    const memberDocs = getFamilyDocuments().filter(d=>String(d.member||'')===String(m.id||'') && !statusIsDone(d) && !statusIsHidden(d));
    if(memberDocs.length) return '📄 Document à renouveler';
    return '✅ Aucune alerte';
  }
  function memberHealthValues(m={}){
    return {
      bloodGroup: String(m.bloodGroup || m.groupeSanguin || '').trim(),
      allergies: String(m.allergies || '').trim(),
      doctorName: String(m.doctorName || m.medecinTraitant || '').trim(),
      doctorPhone: String(m.doctorPhone || m.medecinPhone || '').trim(),
      healthNote: String(m.healthNote || m.santeNote || '').trim(),
      importantTreatment: String(m.importantTreatment || m.traitementImportant || '').trim()
    };
  }
  function hasMemberHealthInfo(m={}){
    const h = memberHealthValues(m);
    return Object.values(h).some(Boolean);
  }
  function memberHealthQuickBlock(m={}, mode='card'){
    const h = memberHealthValues(m);
    const empty = !hasMemberHealthInfo(m);
    const cells = empty
      ? `<div class="member-info-cell full muted"><span class="info-icon">🩺</span><div><b>Santé rapide</b><small>À renseigner</small></div></div>`
      : `${infoCell('🩸','Groupe sanguin',h.bloodGroup||'À renseigner')}
         ${infoCell('⚠️','Allergies',h.allergies||'Aucune renseignée')}
         ${infoCell('👨‍⚕️','Médecin traitant',h.doctorName||'À renseigner')}
         ${infoCell('☎️','Téléphone médecin',formatPhone(h.doctorPhone),'')}
         ${(h.healthNote||h.importantTreatment)?infoCell('📝','Attention santé',[h.healthNote,h.importantTreatment].filter(Boolean).join(' · '),'full'):''}`;
    return `<div class="member-health-quick ${empty?'empty':''} ${mode}"><div class="member-health-title">🩺 Santé rapide</div><div class="member-info-grid health-grid">${cells}</div></div>`;
  }

  function infoCell(icon, label, value, cls=''){
    return `<div class="member-info-cell ${cls}"><span class="info-icon">${icon}</span><div><b>${escapeHtml(label)}</b><small>${escapeHtml(value || 'À renseigner')}</small></div></div>`;
  }

  function settingsMemberVisualCard(m){
    const accent = m.accent || 'violet';
    return `<article class="settings-member-card member-${accent} clickable-card avatar-member-card" onclick="SuperApp.openSettingsMember('${m.id}')"><div class="settings-member-avatar"><img src="${memberAvatarSrc(m)}" alt=""></div><div><b>${escapeHtml(shortMemberName(m.name))}</b><small>${escapeHtml(m.role||'Famille')} · ${escapeHtml(ageFromBirth(m.birth)||'Âge à renseigner')}</small></div><em>Modifier</em></article>`;
  }
  function memberCard(m){
    const accent = m.accent || 'violet';
    const workType = memberWorkSchoolType(m);
    const workPhoneLabel = workType.toLowerCase().includes('école') || workType.toLowerCase().includes('ecole') ? 'Numéro école' : 'Numéro travail';
    const primary = boolLabel(m.primaryContact, (['Papa','Maman','Parent'].includes(m.role) ? 'oui' : 'non'));
    const canDrive = boolLabel(m.canDrive, (['Papa','Maman','Parent'].includes(m.role) ? 'oui' : 'non'));
    const alert = memberAlertLabel(m);
    return `<article class="family-member-card member-${accent} clickable-card avatar-member-card rich-member-card" onclick="SuperApp.openMember('${m.id}')">
      <div class="member-top rich-member-top"><img class="member-avatar-img" src="${memberAvatarSrc(m)}" alt=""><div><h3>${escapeHtml(m.name||'Membre')}</h3><span>${escapeHtml(m.role||'Famille')} · ${escapeHtml(ageFromBirth(m.birth)||'Âge à renseigner')}</span><small>🎂 ${escapeHtml(birthdayLabel(m.birth))}</small></div></div>
      <div class="member-info-grid">
        ${infoCell('📞','Contact principal',primary,boolClass(m.primaryContact, primary))}
        ${infoCell('🚗','Peut conduire',canDrive,boolClass(m.canDrive, canDrive))}
        ${infoCell(workType.toLowerCase().includes('école') || workType.toLowerCase().includes('ecole') ? '🎒' : '💼',workType,m.workSchoolName || 'À renseigner')}
        ${infoCell('☎️',workPhoneLabel,formatPhone(m.workSchoolPhone))}
        ${infoCell('📱','Téléphone perso',formatPhone(m.phone),'full')}
      </div>
      ${memberHealthQuickBlock(m,'card')}
      <div class="member-alert-line ${alert.includes('Aucune')?'ok':'warn'}"><b>Alertes</b><span>${escapeHtml(alert)}</span></div>
      <div class="member-action-row"><button type="button" onclick="event.stopPropagation();SuperApp.openMember('${m.id}')">Voir</button><button type="button" onclick="event.stopPropagation();SuperApp.openSettingsMember('${m.id}')">Modifier</button><button type="button" onclick="event.stopPropagation();SuperApp.openAdd('familles','document_famille','Dossier membre','Document — ${escapeAttr(m.name)}','${m.id}')">Document</button></div>
    </article>`;
  }
  function manageMemberRow(m){
    // V5.16 — La liste Famille > Membres doit utiliser la même carte riche que la page Famille.
    // Cette vue est la liste visible derrière le titre "Membres" ; elle ne doit plus afficher la carte courte.
    const accent = m.accent || 'violet';
    const workType = memberWorkSchoolType(m);
    const isSchool = workType.toLowerCase().includes('école') || workType.toLowerCase().includes('ecole');
    const workPhoneLabel = isSchool ? 'Numéro école' : 'Numéro travail';
    const primary = boolLabel(m.primaryContact, (['Papa','Maman','Parent'].includes(m.role) ? 'oui' : 'non'));
    const canDrive = boolLabel(m.canDrive, (['Papa','Maman','Parent'].includes(m.role) ? 'oui' : 'non'));
    const alert = memberAlertLabel(m);
    return `<article class="family-member-card member-${accent} clickable-card avatar-member-card rich-member-card member-manage-rich-card" onclick="SuperApp.openMember('${m.id}')">
      <div class="member-top rich-member-top"><img class="member-avatar-img" src="${memberAvatarSrc(m)}" alt=""><div><h3>${escapeHtml(m.name||'Membre')}</h3><span>${escapeHtml(m.role||'Famille')} · ${escapeHtml(ageFromBirth(m.birth)||'Âge à renseigner')}</span><small>🎂 ${escapeHtml(birthdayLabel(m.birth))}</small></div></div>
      <div class="member-info-grid">
        ${infoCell('📞','Contact principal',primary,boolClass(m.primaryContact, primary))}
        ${infoCell('🚗','Peut conduire',canDrive,boolClass(m.canDrive, canDrive))}
        ${infoCell(isSchool ? '🎒' : '💼',workType,m.workSchoolName || 'À renseigner')}
        ${infoCell('☎️',workPhoneLabel,formatPhone(m.workSchoolPhone))}
        ${infoCell('📱','Téléphone perso',formatPhone(m.phone),'full')}
      </div>
      ${memberHealthQuickBlock(m,'card')}
      <div class="member-alert-line ${alert.includes('Aucune')?'ok':'warn'}"><b>Alertes</b><span>${escapeHtml(alert)}</span></div>
      <div class="member-action-row member-manage-actions"><button type="button" class="row-action edit" onclick="event.stopPropagation();SuperApp.openSettingsMember('${m.id}')">✏️ Modifier</button><button type="button" class="row-action del" onclick="event.stopPropagation();SuperApp.archiveMember('${m.id}')">🗑️ Supprimer</button></div>
    </article>`;
  }
  function memberFilterRow(module){
    const selected = activeMemberFilter(module); const members = activeMemberList();
    const buttons = [`<button type="button" class="${selected==='all'?'active':''}" onclick="SuperApp.setMemberFilter('${module}','all')">Tous</button>`]
      .concat(members.map(m=>`<button type="button" class="${selected===m.id?'active':''}" onclick="SuperApp.setMemberFilter('${module}','${m.id}')">${escapeHtml(firstMemberName(m.name))}</button>`));
    return `<div class="member-filter-row compact-member-filter"><span>Filtrer par membre</span><div>${buttons.join('')}</div></div>`;
  }
  function settingsFamilyPanel(){
    const visibleMembers = data.family.filter(m=>m.status !== 'archive' && m.statut !== 'archive');
    const current = currentFamilyPack();
    const packCards = FAMILY_PACKS.map(p=>`<article class="family-pack-card clickable-card ${current===p.id?'active':''}" data-family-pack="${p.id}" onclick="SuperApp.setFamilyPack('${p.id}')"><img src="${p.family}" alt=""><div><b>${escapeHtml(p.label)}</b><small>${escapeHtml(p.desc)}</small></div></article>`).join('');
    $('#editForm').dataset.type = 'settings_family';
    return `${settingsVisualHero({title:'Mon foyer visuel', text:'Choisis une famille type, puis attribue une image à chaque membre. Les avatars seront repris dans les filtres, les tâches, la santé, l’éducation et les documents.', img:'', emoji:'👨‍👩‍👧‍👦', chips:[`${visibleMembers.length} membre(s)`, 'Familles mixtes', 'Membres supplémentaires']})}
      <div class="form-field"><label>Nom de la famille</label><input name="familyName" required value="${escapeAttr(data.settings?.familyName || '')}" placeholder="Ex. Famille Martin, Famille Ndiaye..."></div>
      <div class="form-field"><label>Préférences du foyer</label><textarea name="familyPreferences" rows="3" placeholder="Ex : langue, habitudes, visibilité accueil, organisation">${escapeHtml(data.settings?.familyPreferences || '')}</textarea></div>
      <h4 class="settings-mini-title">Choisir le style de ma famille</h4><div class="family-pack-grid">${packCards}</div>
      <h4 class="settings-mini-title">Membres du foyer</h4><div class="settings-family-grid">${visibleMembers.map(settingsMemberVisualCard).join('')}</div>
      <button class="btn primary visual-wide" type="button" onclick="SuperApp.openSettingsMember('')">+ Ajouter un membre</button>`;
  }
  function openSettingsMember(id=''){
    const m = data.family.find(x=>x.id===id) || {};
    const selectedAvatar = memberAvatarId(m);
    $('#editTitle').textContent = id ? 'Modifier un membre' : 'Ajouter un membre';
    $('#editForm').dataset.type = 'settings_member'; $('#editForm').dataset.id = id || '';
    $('#editFields').innerHTML = `<div class="member-edit-preview member-${escapeAttr(m.accent||'violet')}"><div class="settings-member-avatar"><img src="${memberAvatarSrc(m)}" alt=""></div><div><b>${escapeHtml(m.name||'Nouveau membre')}</b><small>${escapeHtml(m.role||'Rôle à définir')} · ${escapeHtml(ageFromBirth(m.birth)||'Âge à renseigner')}</small></div></div>
      <div class="form-field"><label>Prénom et nom</label><input name="name" required value="${escapeAttr(m.name||'')}"></div>
      <div class="form-field"><label>Rôle</label><select name="role"><option ${m.role==='Papa'?'selected':''}>Papa</option><option ${m.role==='Maman'?'selected':''}>Maman</option><option ${m.role==='Parent'?'selected':''}>Parent</option><option ${m.role==='Enfant'?'selected':''}>Enfant</option><option ${m.role==='Bébé'?'selected':''}>Bébé</option><option ${m.role==='Grand-parent'?'selected':''}>Grand-parent</option><option ${m.role==='Tuteur'?'selected':''}>Tuteur</option><option ${m.role==='Proche'?'selected':''}>Proche</option><option ${m.role==='Autre'?'selected':''}>Autre</option></select></div>
      <div class="form-field avatar-field"><label>Image du membre</label>${avatarPickerGrid(selectedAvatar)}<select name="avatarIdFallback" class="avatar-select-fallback" onchange="const checked=this.closest(\'.avatar-field\')?.querySelector(\'input[name=avatarId]:checked\'); if(checked) checked.checked=false; this.name=\'avatarId\';">${avatarOptionsHtml(selectedAvatar)}</select><input type="hidden" name="avatarPack" value="${escapeAttr(currentFamilyPack())}"></div>
      <div class="form-field"><label>Date de naissance</label><input name="birth" type="date" value="${escapeAttr(dmyToISO(m.birth)||'')}"><small>Choisis dans le calendrier du téléphone.</small></div>
      <div class="form-field"><label>Téléphone personnel</label><input name="phone" value="${escapeAttr(m.phone||'')}" placeholder="Ex. 06 12 34 56 78"></div>
      <div class="form-field"><label>Contact principal</label><select name="primaryContact"><option value="oui" ${boolLabel(m.primaryContact, ['Papa','Maman','Parent'].includes(m.role)?'oui':'non')==='Oui'?'selected':''}>Oui</option><option value="non" ${boolLabel(m.primaryContact, ['Papa','Maman','Parent'].includes(m.role)?'oui':'non')==='Non'?'selected':''}>Non</option></select></div>
      <div class="form-field"><label>Peut conduire</label><select name="canDrive"><option value="oui" ${boolLabel(m.canDrive, ['Papa','Maman','Parent'].includes(m.role)?'oui':'non')==='Oui'?'selected':''}>Oui</option><option value="non" ${boolLabel(m.canDrive, ['Papa','Maman','Parent'].includes(m.role)?'oui':'non')==='Non'?'selected':''}>Non</option></select></div>
      <div class="form-field"><label>Travail ou école</label><select name="workSchoolType"><option value="Travail" ${memberWorkSchoolType(m)==='Travail'?'selected':''}>Travail</option><option value="École" ${memberWorkSchoolType(m)==='École'?'selected':''}>École</option><option value="Autre" ${memberWorkSchoolType(m)==='Autre'?'selected':''}>Autre</option></select></div>
      <div class="form-field"><label>Nom travail / école</label><input name="workSchoolName" value="${escapeAttr(m.workSchoolName||'')}" placeholder="Ex. Demathieu Bard, école, université..."></div>
      <div class="form-field"><label>Numéro travail / école</label><input name="workSchoolPhone" value="${escapeAttr(m.workSchoolPhone||'')}" placeholder="Ex. 03 83 00 12 34"></div>
      <div class="form-field"><label>Email</label><input name="email" value="${escapeAttr(m.email||'')}"></div>
      <details class="form-collapse member-health-form" open><summary>🩺 Santé rapide</summary>
        <div class="form-grid-2"><div class="form-field"><label>Groupe sanguin</label><input name="bloodGroup" value="${escapeAttr(m.bloodGroup||m.groupeSanguin||'')}" placeholder="Ex : O+, A-, AB+"></div><div class="form-field"><label>Allergies</label><input name="allergies" value="${escapeAttr(m.allergies||'')}" placeholder="Ex : arachides, pénicilline"></div></div>
        <div class="form-grid-2"><div class="form-field"><label>Médecin traitant</label><input name="doctorName" value="${escapeAttr(m.doctorName||m.medecinTraitant||'')}" placeholder="Ex : Dr Martin"></div><div class="form-field"><label>Téléphone médecin</label><input name="doctorPhone" value="${escapeAttr(m.doctorPhone||m.medecinPhone||'')}" placeholder="Ex : 06 00 00 00 00"></div></div>
        <div class="form-field"><label>Attention particulière</label><input name="healthNote" value="${escapeAttr(m.healthNote||m.santeNote||'')}" placeholder="Ex : asthme, diabète, régime particulier…"></div>
        <div class="form-field"><label>Traitement important</label><input name="importantTreatment" value="${escapeAttr(m.importantTreatment||m.traitementImportant||'')}" placeholder="Ex : Ventoline, traitement chronique…"></div>
      </details>
      <div class="form-field"><label>Couleur</label><select name="accent"><option value="violet" ${m.accent==='violet'?'selected':''}>Violet doux</option><option value="rose" ${m.accent==='rose'?'selected':''}>Rose</option><option value="bleu" ${m.accent==='bleu'?'selected':''}>Bleu</option><option value="vert" ${m.accent==='vert'?'selected':''}>Vert</option><option value="orange" ${m.accent==='orange'?'selected':''}>Orange</option></select></div>
      ${id ? `<div class="danger-actions"><button class="btn ghost danger" type="button" onclick="SuperApp.archiveMember('${id}')">Supprimer / archiver le membre</button></div>` : ''}`;
    if(!$('#editDialog').open) $('#editDialog').showModal();
  }
  function renderCalendar(){
    const selected = parseDMY(state.selectedDate) || new Date();
    const start = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const first = (start.getDay()+6)%7;
    const gridStart = new Date(start); gridStart.setDate(start.getDate()-first);
    const days = Array.from({length:42},(_,i)=>{ const d=new Date(gridStart); d.setDate(gridStart.getDate()+i); return d; });
    const monthName = selected.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
    const events = itemsForDate(state.selectedDate); const week = weekDays();
    const main = state.calendarMode === 'day' ? calendarDayView(events) : state.calendarMode === 'week' ? `<div class="week-agenda-grid">${week.map(d=>weekDayPanel(d)).join('')}</div>` : `<div class="calendar-grid">${['LUN','MAR','MER','JEU','VEN','SAM','DIM'].map(d=>`<div class="weekday">${d}</div>`).join('')}${days.map(d=>dayCell(d,selected)).join('')}</div>`;
    const agenda = state.calendarMode === 'day' ? '' : `<div class="section-title"><h2>${displayDate(state.selectedDate)}</h2><button class="link-btn" type="button" onclick="SuperApp.openEdit('calendrier')">📅 Ajouter</button></div><div class="agenda-list">${events.length ? events.map(x=>agendaRow(x,x.icon,x.label)).join('') : '<div class="empty">Aucun élément pour cette journée.</div>'}</div>`;
    $('#view-calendar').innerHTML = `
      ${appHeroBlock('calendrier')}
      <section class="add-zone"><h3>Ajouter au calendrier</h3>${primaryActionBar([['📅 Événement',`SuperApp.openEdit('calendrier')`,true],['⏰ Rappel',`SuperApp.openEdit('calendrier')`,false],['👨‍👩‍👧‍👦 Famille',`SuperApp.openEdit('calendrier')`,false]])}</section>
      <section class="filter-zone"><h3>Filtrer le calendrier</h3><div class="calendar-controls"><button type="button" class="${state.calendarMode==='day'?'active':''}" onclick="SuperApp.calendarMode('day')">📅 Jour</button><button type="button" class="${state.calendarMode==='week'?'active':''}" onclick="SuperApp.calendarMode('week')">🗓️ Semaine</button><button type="button" class="${state.calendarMode==='month'?'active':''}" onclick="SuperApp.calendarMode('month')">📆 Mois</button></div>
      <div class="chip-row module-filter-row">${calendarFilters().map(([id,label,icon])=>`<button type="button" class="chip ${state.calendarFilter===id?'active':''}" onclick="SuperApp.setCalendarFilter('${id}')">${icon} ${label}</button>`).join('')}</div></section>
      ${state.calendarMode === 'month' ? `<div class="calendar-head"><button type="button" onclick="SuperApp.shiftMonth(-1)">‹</button><h2>${monthName}</h2><button type="button" onclick="SuperApp.shiftMonth(1)">›</button></div>` : ''}
      ${main}${agenda}`;
  }

  function useActivityPosition(){
    if(!navigator.geolocation){ toast('Géolocalisation indisponible.'); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude.toFixed(6), lng=pos.coords.longitude.toFixed(6);
      const latEl=document.getElementById('activityLatInput'), lngEl=document.getElementById('activityLngInput'), loc=document.getElementById('activityLocationInput');
      if(latEl) latEl.value=lat; if(lngEl) lngEl.value=lng; if(loc && !loc.value) loc.value=`Position GPS ${lat}, ${lng}`;
      toast('📍 Position ajoutée à l’activité.');
    },()=>toast('Position non autorisée.'));
  }
  function openActivityInMaps(){
    const loc=document.getElementById('activityLocationInput')?.value || '';
    const lat=document.getElementById('activityLatInput')?.value || '';
    const lng=document.getElementById('activityLngInput')?.value || '';
    const q=lat&&lng ? `${lat},${lng}` : loc;
    if(!q){ toast('Renseigne d’abord un lieu.'); return; }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,'_blank');
  }
  window.SuperApp = {
    _getData: ()=>data,
    _mergeData: (d)=>{ const m=ensureDataShape(d); Object.assign(data,m); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },
    _findRecord: findRecord, toast,
    setView, openModule, openItem, openCalendarDate, openCalendarModule, setCalendarFilter, setNotificationFilter,
    renderAppsHome:()=>{ state.appsView=null; setView('apps'); }, render:()=>render(),
    setActiveProfile, openProfilePicker, closeProfileSheet, requestNotify,
    calendarMode:(m)=>{state.calendarMode=m;renderCalendar();},
    shiftMonth:(n)=>{const d=parseDMY(state.selectedDate)||new Date();d.setMonth(d.getMonth()+n);state.selectedDate=formatDMY(d);renderCalendar();},
    selectDate:(d)=>{state.selectedDate=d;state.calendarMode='day';renderCalendar();},
    openEdit, openAdd, openGenericChecklist, addGenericChecklistLine, addGenericChecklistSuggestion, toggleGenericChecklistItem, changeGenericChecklistQty, openSlvActivityDetail, openAddSlvChecklist, openSlvChecklistLight, closeSlvChecklistLight, addSlvChecklistLine, addSlvChecklistSuggestion, changeSlvChecklistQty, finishSlvChecklist, refreshSlvChecklistDialog, openMember, markDone, toggleTreatmentDose, archiveItem, deleteItem, setSlvTab, toggleApp, exportData, importData, clearDemoData, resetData, resetCloudData, openResetConfirmDialog, confirmFullReset, closeEditDialog, openSettings, openActivationPanel, activateApp, deactivateApp, openSettingsMember, archiveMember, openCategoryEditor, archiveCategory, openReferenceEditor, openModuleList, setModuleBlock, setMaisonPeriodFilter, toggleMaisonFilters, updateTaskFrequencyDisplay, setMemberFilter, openBudgetEditor, openMemberDocList, openFamilyMembersManager, applyWeatherCity, selectWeatherCity, updateWeatherCityPicker, useCurrentPosition, refreshWeather, applyAppearance, startOnboarding, setFamilyPack,
    refreshSubcategories,
    handleCategoryChange, handleSubcategoryChange,
    openCreateCategoryDialog, openCreateSubcategoryDialog, confirmCreateCategory,
    openStyleFamillePanel, selectAvatarChoice,
    installPwa,
    openAddWeeklyMeal,
    openStockToCoursesConfirm, confirmAddStockToCourses, addStockToCourses, consumeStock, confirmConsumeStock, updateConsumeStockPreview, updateQuantityStep, useActivityPosition, openActivityInMaps
  };
  init();
})();
