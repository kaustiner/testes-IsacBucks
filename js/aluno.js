/* ================= ALUNO ================= */
function renderAlunoDashboard(){
  const u = DB.find(state.user.id);
  return `
    <div class="dash-grid">
      <div class="dash-left">
        <div class="app-header">
          <div class="app-header-left">
            <div class="avatar-circle">${initials(u.nome)}</div>
            <div>
              <div class="app-header-greet">Olá, ${esc(u.nome.split(' ')[0])}! 👋</div>
              <div class="app-header-sub">${esc(u.turma||'')}</div>
            </div>
          </div>
          <button class="icon-btn" data-goto="perfil" aria-label="Meu perfil">⚙</button>
        </div>
        <div class="balance-hero">
          <div class="hero-toprow">
            <span class="balance-label">Saldo atual</span>
            <span class="hero-badge">${u.status==='ATIVO'?'Conta ativa':'Inativa'}</span>
          </div>
          <div class="balance-row"><div class="big-coin">IB</div><div class="balance-num">${fmt(u.saldo)}</div></div>
        </div>
        <div class="quick-actions">
          <button class="qa-btn" data-goto="noticias"><span class="qa-ico">▤</span><span class="qa-label">Notícias</span></button>
          <button class="qa-btn" data-goto="perfil"><span class="qa-ico">◐</span><span class="qa-label">Perfil</span></button>
          <button class="qa-btn" data-goto="perfil"><span class="qa-ico">⚿</span><span class="qa-label">Senha</span></button>
          <button class="qa-btn" data-logout><span class="qa-ico">⎋</span><span class="qa-label">Sair</span></button>
        </div>
      </div>
      <div class="dash-news">
        <h3 style="margin-bottom:12px;">Últimas notícias</h3>
        ${newsGrid(6)}
      </div>
      <div class="dash-about">
        <div class="about-blurb">
          <h3 style="font-size:19px; margin-bottom:10px;">O que é o IsacBucks?</h3>
          <p style="color:var(--ink-600); font-size:14.5px; line-height:1.7; max-width:480px;">
            O IsacBucks é como a escola comemora o que você faz de bom por aqui. Toda vez que um
            professor reconhece seu esforço — numa atividade, numa prova ou num dia em que você
            ajudou a turma — ele pode te dar moedas. Elas ficam guardadas na sua conta, prontinhas
            pra você acompanhar o quanto já conquistou.
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderNoticiasView(){
  return `<div class="topbar"><h2>Notícias</h2></div>${newsGrid()}`;
}

function newsGrid(limit){
  let items = DB.all('noticia').filter(n=>n.status==='ATIVO');
  if(limit) items = items.slice(0, limit);
  if(!items.length) return `<div class="empty-state"><div class="coin">IB</div>Nenhuma notícia no momento.</div>`;
  return `<div class="news-grid">${items.map(n=>`
    <div class="news-card" data-action="ver-noticia" data-id="${n.id}">
      <div class="news-img-wrap">
        ${newsImg(n.imagem)}
        ${videoEmbedInfo(n.video) ? `<div class="news-play-badge"><span>▶</span></div>` : ''}
      </div>
      <div class="news-body"><div class="news-title">${esc(n.titulo)}</div></div>
    </div>
  `).join('')}</div>`;
}

function renderPerfil(){
  const u = DB.find(state.user.id);
  return `
    <div class="topbar"><h2>Meu perfil</h2></div>
    <div class="grid grid-2">
      <div class="card">
        <h3>Dados</h3>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:14.5px;">
          <div><label>Nome</label>${esc(u.nome)}</div>
          ${u.ra?`<div><label>RA</label>${esc(u.ra)}</div>`:''}
          <div><label>Login</label>${esc(u.login)}</div>
          ${u.turma?`<div><label>Turma</label>${esc(u.turma)}</div>`:''}
        </div>
      </div>
      <div class="card">
        <h3>Alterar senha</h3>
        <form id="form-senha">
          <div class="field"><label>Senha atual</label><div class="password-wrap"><input type="password" id="senha-atual" name="current-password" autocomplete="current-password" required><button type="button" class="pw-toggle" data-toggle-password="senha-atual" aria-label="Mostrar senha">${eyeIcon()}</button></div></div>
          <div class="field"><label>Nova senha</label><div class="password-wrap"><input type="password" id="senha-nova" name="new-password" autocomplete="new-password" required><button type="button" class="pw-toggle" data-toggle-password="senha-nova" aria-label="Mostrar senha">${eyeIcon()}</button></div></div>
          <div class="field"><label>Confirmar nova senha</label><div class="password-wrap"><input type="password" id="senha-conf" name="new-password-confirm" autocomplete="new-password" required><button type="button" class="pw-toggle" data-toggle-password="senha-conf" aria-label="Mostrar senha">${eyeIcon()}</button></div></div>
          <button class="btn btn-primary btn-block" type="submit">Salvar nova senha</button>
        </form>
      </div>
    </div>
  `;
}

