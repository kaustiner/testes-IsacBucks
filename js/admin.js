/* ================= ADMIN ================= */
function renderAdminDashboard(){
  const u = DB.find(state.user.id);
  const alunos = DB.all('aluno');
  const profs = DB.all('professor');
  const aguardando = profs.filter(p=>p.status==='AGUARDANDO_APROVACAO');
  const admins = DB.all('admin');
  return `
    <div class="home-grid">
      <div>
        <div class="app-header">
          <div class="app-header-left">
            <div class="avatar-circle">${initials(u.nome)}</div>
            <div>
              <div class="app-header-greet">Olá, ${esc(u.nome.split(' ')[0])}! 👋</div>
              <div class="app-header-sub">Administrador</div>
            </div>
          </div>
        </div>
        <div class="quick-actions">
          <button class="qa-btn" data-goto="alunos"><span class="qa-ico">◐</span><span class="qa-label">Alunos</span></button>
          <button class="qa-btn" data-goto="professores"><span class="qa-ico">◐</span><span class="qa-label">Professores</span></button>
          <button class="qa-btn" data-goto="aprovacoes"><span class="qa-ico">✓</span><span class="qa-label">Aprovações</span></button>
          <button class="qa-btn" data-goto="noticias"><span class="qa-ico">▤</span><span class="qa-label">Notícias</span></button>
        </div>
        ${aguardando.length ? `
        <button class="promo-banner warn" data-goto="aprovacoes">
          <span class="promo-ico">🔔</span>
          <span>
            <div class="promo-title">${aguardando.length} professor${aguardando.length>1?'es':''} aguardando aprovação</div>
            <div class="promo-sub">Toque para revisar os cadastros pendentes</div>
          </span>
        </button>` : `
        <button class="promo-banner" data-goto="noticias">
          <span class="promo-ico">📰</span>
          <span>
            <div class="promo-title">Tudo em dia por aqui</div>
            <div class="promo-sub">Nenhuma aprovação pendente — que tal atualizar as notícias?</div>
          </span>
        </button>`}
      </div>
      <div>
        <div class="grid grid-4">
          <div class="card stat-card"><div class="stat-num">${alunos.length}</div><div class="stat-label">Alunos</div></div>
          <div class="card stat-card"><div class="stat-num">${profs.length}</div><div class="stat-label">Professores</div></div>
          <div class="card stat-card"><div class="stat-num">${aguardando.length}</div><div class="stat-label">Aguardando aprovação</div></div>
          <div class="card stat-card"><div class="stat-num">${admins.length}</div><div class="stat-label">Administradores</div></div>
        </div>
        <div style="height:16px"></div>
        <div class="list-card">
          <button class="list-row" data-goto="administradores"><span class="list-ico">★</span><span class="list-label">Gerenciar administradores</span><span class="list-chevron">›</span></button>
          <button class="list-row" data-goto="noticias"><span class="list-ico">▤</span><span class="list-label">Gerenciar notícias</span><span class="list-chevron">›</span></button>
        </div>
      </div>
    </div>
  `;
}

function statusBadge(status){
  const map = {
    ATIVO:['badge-ativo','Ativo'], INATIVO:['badge-inativo','Inativo'],
    AGUARDANDO_APROVACAO:['badge-aguardando','Aguardando'], RECUSADO:['badge-recusado','Recusado'],
  };
  const [cls,label] = map[status] || ['badge-inativo', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderAdminAlunos(){
  const alunos = DB.all('aluno');
  return `
    <div class="topbar"><h2>Alunos</h2>
      <button class="btn btn-gold btn-sm" data-action="novo-aluno">+ Novo aluno</button>
    </div>
    <div class="search-row"><input id="busca-aluno" placeholder="Buscar por nome, RA, login ou turma..."></div>
    <div class="card table-wrap">
      <table><thead><tr><th>Nome</th><th>RA</th><th>Login</th><th>Turma</th><th>Saldo</th><th>Status</th><th></th></tr></thead>
      <tbody id="tbody-alunos">${alunosRows(alunos)}</tbody></table>
    </div>
  `;
}
function alunosRows(list){
  if(!list.length) return `<tr><td colspan="7" style="text-align:center; color:var(--ink-400); padding:26px;">Nenhum aluno encontrado.</td></tr>`;
  return list.map(a=>`
    <tr>
      <td>${esc(a.nome)}</td><td>${esc(a.ra)}</td><td>${esc(a.login)}</td><td>${esc(a.turma)}</td>
      <td class="saldo-cell">${fmt(a.saldo)} IB</td><td>${statusBadge(a.status)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" data-action="editar-usuario" data-id="${a.id}">Editar</button>
        <button class="btn btn-ghost btn-sm" data-action="saldo-usuario" data-id="${a.id}">Saldo</button>
        <button class="btn btn-ghost btn-sm" data-action="reset-senha" data-id="${a.id}">Reset senha</button>
        <button class="btn btn-ghost btn-sm" data-action="toggle-status" data-id="${a.id}">${a.status==='ATIVO'?'Desativar':'Ativar'}</button>
        <button class="btn btn-danger btn-sm" data-action="excluir-usuario" data-id="${a.id}">Excluir</button>
      </td>
    </tr>`).join('');
}

function renderAdminProfessores(){
  const profs = DB.all('professor').filter(p=>p.status!=='AGUARDANDO_APROVACAO' && p.status!=='RECUSADO');
  return `
    <div class="topbar"><h2>Professores</h2></div>
    <div class="card table-wrap">
      <table><thead><tr><th>Nome</th><th>Login</th><th>Saldo</th><th>Status</th><th></th></tr></thead>
      <tbody>${professoresRows(profs)}</tbody></table>
    </div>
  `;
}
function professoresRows(list){
  if(!list.length) return `<tr><td colspan="5" style="text-align:center; color:var(--ink-400); padding:26px;">Nenhum professor.</td></tr>`;
  return list.map(p=>`
    <tr>
      <td>${esc(p.nome)}</td><td>${esc(p.login)}</td><td class="saldo-cell">${fmt(p.saldo)} IB</td><td>${statusBadge(p.status)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" data-action="editar-usuario" data-id="${p.id}">Editar</button>
        <button class="btn btn-ghost btn-sm" data-action="saldo-usuario" data-id="${p.id}">Saldo</button>
        <button class="btn btn-ghost btn-sm" data-action="reset-senha" data-id="${p.id}">Reset senha</button>
        <button class="btn btn-ghost btn-sm" data-action="toggle-status" data-id="${p.id}">${p.status==='ATIVO'?'Desativar':'Ativar'}</button>
        <button class="btn btn-danger btn-sm" data-action="excluir-usuario" data-id="${p.id}">Excluir</button>
      </td>
    </tr>`).join('');
}

function renderAprovacoes(){
  const pend = DB.all('professor').filter(p=>p.status==='AGUARDANDO_APROVACAO');
  return `
    <div class="topbar"><h2>Aprovações de professores</h2></div>
    <div class="card table-wrap">
      <table><thead><tr><th>Nome</th><th>Login</th><th>Status</th><th></th></tr></thead>
      <tbody>${pend.length? pend.map(p=>`
        <tr><td>${esc(p.nome)}</td><td>${esc(p.login)}</td><td>${statusBadge(p.status)}</td>
          <td class="actions-cell">
            <button class="btn btn-primary btn-sm" data-action="aprovar" data-id="${p.id}">Aprovar</button>
            <button class="btn btn-danger btn-sm" data-action="recusar" data-id="${p.id}">Recusar</button>
          </td>
        </tr>`).join('') : `<tr><td colspan="4" style="text-align:center; color:var(--ink-400); padding:26px;">Nenhuma solicitação pendente.</td></tr>`}
      </tbody></table>
    </div>
  `;
}

function renderAdminNoticias(){
  const noticias = DB.all('noticia');
  return `
    <div class="topbar"><h2>Notícias</h2><button class="btn btn-gold btn-sm" data-action="nova-noticia">+ Nova notícia</button></div>
    <div class="news-grid">${noticias.map(n=>`
      <div class="news-card">
        <div data-action="ver-noticia" data-id="${n.id}">
          <div class="news-img-wrap">
            ${newsImg(n.imagem)}
            ${videoEmbedInfo(n.video) ? `<div class="news-play-badge"><span>▶</span></div>` : ''}
          </div>
          <div class="news-body" style="padding-bottom:4px;"><div class="news-title">${esc(n.titulo)}</div></div>
        </div>
        <div class="news-body" style="padding-top:0;">
          <div style="margin:8px 0;">${statusBadge(n.status)}</div>
          <div class="actions-cell">
            <button class="btn btn-ghost btn-sm" data-action="editar-noticia" data-id="${n.id}">Editar</button>
            <button class="btn btn-ghost btn-sm" data-action="toggle-noticia" data-id="${n.id}">${n.status==='ATIVO'?'Desativar':'Ativar'}</button>
            <button class="btn btn-danger btn-sm" data-action="excluir-noticia" data-id="${n.id}">Excluir</button>
          </div>
        </div>
      </div>
    `).join('') || `<div class="empty-state"><div class="coin">IB</div>Nenhuma notícia cadastrada.</div>`}</div>
  `;
}

/* ---------- Ferramentas dev: exclusão em massa ---------- */
function renderAdminFerramentas(){
  const grupos = salasAgrupadas();
  const totalAlunos = DB.all('aluno').length;
  const totalProfs = DB.all('professor').length;
  return `
    <div class="topbar"><h2>Ferramentas dev</h2></div>
    <p class="modal-sub" style="margin-top:-6px;">Exclusão em massa de logins. As contas apagadas aqui não podem ser recuperadas — use com cuidado.</p>

    <div class="card" style="margin-bottom:16px;">
      <h3>Excluir sala inteira</h3>
      <p class="modal-sub">Apaga o login de todos os alunos da turma escolhida.</p>
      ${grupos.length ? grupos.map(g => `
        <div class="sala-aluno-row">
          <div class="sala-aluno-info">
            <span class="sala-aluno-nome">${esc(g.turma)}</span>
            <span class="sala-aluno-login">${g.alunos.length} aluno${g.alunos.length===1?'':'s'}</span>
          </div>
          <button class="btn btn-danger btn-sm" data-action="excluir-sala" data-turma="${esc(g.turma)}">Excluir sala</button>
        </div>`).join('') : `<p class="modal-sub" style="margin-bottom:0;">Nenhuma sala cadastrada.</p>`}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3>Excluir todos os alunos</h3>
      <p class="modal-sub">Apaga o login de todos os ${totalAlunos} aluno${totalAlunos===1?'':'s'} cadastrado${totalAlunos===1?'':'s'}, de todas as salas.</p>
      <button class="btn btn-danger btn-sm" data-action="excluir-todos-alunos">Excluir todos os alunos</button>
    </div>

    <div class="card">
      <h3>Excluir todos os professores</h3>
      <p class="modal-sub">Apaga o login de todos os ${totalProfs} professor${totalProfs===1?'':'es'} cadastrado${totalProfs===1?'':'s'}.</p>
      <button class="btn btn-danger btn-sm" data-action="excluir-todos-professores">Excluir todos os professores</button>
    </div>
  `;
}

function renderAdminAdmins(){
  const admins = DB.all('admin');
  return `
    <div class="topbar"><h2>Administradores</h2><button class="btn btn-gold btn-sm" data-action="novo-admin">+ Novo admin</button></div>
    <div class="card table-wrap">
      <table><thead><tr><th>Nome</th><th>Login</th><th>Status</th><th></th></tr></thead>
      <tbody>${admins.map(a=>`
        <tr><td>${esc(a.nome)}</td><td>${esc(a.login)}</td><td>${statusBadge(a.status)}</td>
          <td class="actions-cell">
            <button class="btn btn-ghost btn-sm" data-action="reset-senha" data-id="${a.id}">Reset senha</button>
            ${a.id===state.user.id ? '' : `
              <button class="btn btn-ghost btn-sm" data-action="toggle-status" data-id="${a.id}">${a.status==='ATIVO'?'Desativar':'Ativar'}</button>
              <button class="btn btn-danger btn-sm" data-action="excluir-usuario" data-id="${a.id}">Excluir</button>`}
          </td>
        </tr>`).join('')}
      </tbody></table>
    </div>
  `;
}