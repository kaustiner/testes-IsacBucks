/* ---------- ENTRAR NO APP / NAVEGAÇÃO ---------- */
function logout(){
  state.user = null;
  $('#app-screen').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
  $('#login-form').reset();
}

/* Confirmação antes de sair da conta, chamada por todos os botões "Sair" */
function confirmarLogout(){
  openModal(`
    <h3 style="margin-bottom:8px;">Sair da conta?</h3>
    <p style="color:var(--ink-600); font-size:14.5px; margin-bottom:20px;">Você precisará entrar novamente com seu login e senha para acessar sua conta.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="confirmar-logout-btn">Sair</button>
    </div>
  `);
  $('#confirmar-logout-btn').addEventListener('click', ()=>{
    closeModal();
    logout();
  });
}
$('#logout-btn').addEventListener('click', confirmarLogout);

$('#menu-toggle').addEventListener('click', ()=>{
  $('#sidebar').classList.toggle('open');
  $('#sidebar-backdrop').classList.toggle('show');
});
$('#sidebar-backdrop').addEventListener('click', ()=>{
  $('#sidebar').classList.remove('open');
  $('#sidebar-backdrop').classList.remove('show');
});

const MENUS = {
  aluno: [
    { id:'dashboard', label:'Meu saldo', icon:'●' },
    { id:'noticias', label:'Notícias', icon:'▤' },
    { id:'perfil', label:'Meu perfil', icon:'◐' },
  ],
  professor: [
    { id:'dashboard', label:'Meu saldo', icon:'●' },
    { id:'transferir', label:'Adicionar / Descontar', icon:'⇄' },
    { id:'salas', label:'Salas', icon:'▦' },
    { id:'noticias', label:'Notícias', icon:'▤' },
    { id:'perfil', label:'Meu perfil', icon:'◐' },
  ],
  admin: [
    { id:'dashboard', label:'Dashboard', icon:'▦' },
    { id:'alunos', label:'Alunos', icon:'◐' },
    { id:'salas', label:'Salas', icon:'▦' },
    { id:'professores', label:'Professores', icon:'◐' },
    { id:'aprovacoes', label:'Aprovações', icon:'✓' },
    { id:'noticias', label:'Notícias', icon:'▤' },
    { id:'administradores', label:'Administradores', icon:'★' },
  ],
};

function enterApp(){
  $('#login-screen').classList.add('hidden');
  $('#app-screen').classList.remove('hidden');
  sincronizarTemaDaConta();
  buildNav();
  buildBottomNav();
  $('#who-box').innerHTML = `<b>${esc(state.user.nome)}</b>${labelTipo(state.user.tipo)}`;
  render();
}

function labelTipo(tipo){
  return { aluno:'Aluno', professor:'Professor', admin:'Administrador' }[tipo] || '';
}

/* Admin "desenvolvedor": só quem estiver em CONFIG.DEV_LOGINS enxerga
   o menu de exclusão em massa. */
function isDev(user){
  return !!user && user.tipo==='admin' && CONFIG.DEV_LOGINS.includes(user.login);
}

/* Menu efetivo do usuário logado (acrescenta "Ferramentas dev" no fim,
   quando aplicável, sem mexer no MENUS base). */
function menuDoUsuario(){
  const menu = MENUS[state.user.tipo].slice();
  if(isDev(state.user)) menu.push({ id:'ferramentas', label:'Ferramentas dev', icon:'⚠' });
  return menu;
}

function initials(nome){
  return (nome||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

function buildNav(){
  const menu = menuDoUsuario();
  $('#nav-list').innerHTML = menu.map(m =>
    `<button class="nav-item ${state.screen===m.id?'active':''}" data-screen="${m.id}">
      <span class="nav-icon">${m.icon}</span> ${m.label}
    </button>`
  ).join('');
  $('#nav-list').querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $('#sidebar').classList.remove('open');
      $('#sidebar-backdrop').classList.remove('show');
      goToScreen(btn.dataset.screen);
    });
  });
}

/* Barra inferior (mobile): mostra até 3 itens do menu do papel do usuário
   + um 4º botão. Se o menu tiver mais de 3 itens (caso do admin), o 4º
   botão vira "Mais" e abre a sidebar; senão vira "Sair" direto. */
function buildBottomNav(){
  const menu = menuDoUsuario();
  let items;
  if(menu.length <= 3){
    items = menu.map(m=>({ id:m.id, label:m.label, icon:m.icon, action:'goto' }))
      .concat([{ id:'__logout', label:'Sair', icon:'⎋', action:'logout' }]);
  } else {
    items = menu.slice(0,3).map(m=>({ id:m.id, label:m.label, icon:m.icon, action:'goto' }))
      .concat([{ id:'__more', label:'Mais', icon:'☰', action:'more' }]);
  }
  $('#bottom-nav').innerHTML = items.map(it => `
    <button class="bn-item ${it.action==='goto' && state.screen===it.id ? 'active':''}" data-bn="${it.action}" data-screen="${it.id}">
      <span class="bn-ico">${it.icon}</span>${esc(it.label)}
    </button>`).join('');
  $('#bottom-nav').querySelectorAll('.bn-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const action = btn.dataset.bn;
      if(action==='goto'){ goToScreen(btn.dataset.screen); }
      else if(action==='logout'){ confirmarLogout(); }
      else if(action==='more'){ $('#sidebar').classList.toggle('open'); $('#sidebar-backdrop').classList.toggle('show'); }
    });
  });
}

/* Usado tanto pela sidebar quanto pelos atalhos (ações rápidas, listas
   de atalho, etc.) dentro do conteúdo das telas via data-goto="tela". */
function goToScreen(id){
  if(id==='ferramentas' && !isDev(state.user)) return; // tela restrita aos admins da lista DEV_LOGINS
  state.screen = id;
  buildNav();
  buildBottomNav();
  render();
}

/* Delega cliques em qualquer [data-goto]/[data-logout] renderizado
   dentro de #main (ações rápidas, cards de atalho, banners), já que
   o conteúdo de #main é substituído a cada render(). */
document.addEventListener('click', (e)=>{
  const gotoEl = e.target.closest('[data-goto]');
  if(gotoEl && document.getElementById('main').contains(gotoEl)){
    goToScreen(gotoEl.dataset.goto);
    return;
  }
  const logoutEl = e.target.closest('[data-logout]');
  if(logoutEl && document.getElementById('main').contains(logoutEl)){
    confirmarLogout();
  }
});

function render(){
  const fn = {
    aluno: { dashboard: renderAlunoDashboard, noticias: renderNoticiasView, perfil: renderPerfil },
    professor: { dashboard: renderProfessorDashboard, transferir: renderTransferir, salas: renderSalas, noticias: renderNoticiasView, perfil: renderPerfil },
    admin: { dashboard: renderAdminDashboard, alunos: renderAdminAlunos, salas: renderSalas, professores: renderAdminProfessores,
              aprovacoes: renderAprovacoes, noticias: renderAdminNoticias, administradores: renderAdminAdmins,
              ferramentas: renderAdminFerramentas },
  }[state.user.tipo][state.screen];
  $('#main').innerHTML = fn ? fn() : '';
  wireScreen();
}