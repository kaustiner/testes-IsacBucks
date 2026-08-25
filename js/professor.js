/* ================= PROFESSOR ================= */
function renderProfessorDashboard(){
  const u = DB.find(state.user.id);
  return `
    <div class="home-grid">
      <div>
        <div class="app-header">
          <div class="app-header-left">
            <div class="avatar-circle">${initials(u.nome)}</div>
            <div>
              <div class="app-header-greet">Olá, ${esc(u.nome.split(' ')[0])}! 👋</div>
              <div class="app-header-sub">Professor(a)</div>
            </div>
          </div>
          <button class="icon-btn" data-goto="perfil" aria-label="Meu perfil">⚙</button>
        </div>
        <div class="balance-hero">
          <div class="hero-toprow">
            <span class="balance-label">Saldo disponível</span>
            <span class="hero-badge">Para distribuir</span>
          </div>
          <div class="balance-row"><div class="big-coin">IB</div><div class="balance-num">${fmt(u.saldo)}</div></div>
        </div>
        <div class="quick-actions">
          <button class="qa-btn" data-goto="transferir"><span class="qa-ico">➕</span><span class="qa-label">Adicionar</span></button>
          <button class="qa-btn" data-goto="transferir"><span class="qa-ico">➖</span><span class="qa-label">Descontar</span></button>
          <button class="qa-btn" data-goto="noticias"><span class="qa-ico">▤</span><span class="qa-label">Notícias</span></button>
          <button class="qa-btn" data-goto="perfil"><span class="qa-ico">◐</span><span class="qa-label">Perfil</span></button>
          <button class="qa-btn" data-logout><span class="qa-ico">⎋</span><span class="qa-label">Sair</span></button>
        </div>
      </div>
      <div>
        <button class="promo-banner" data-goto="transferir">
          <span class="promo-ico">💡</span>
          <span>
            <div class="promo-title">Recompense o bom desempenho</div>
            <div class="promo-sub">Adicione IsacBucks a um aluno em poucos toques</div>
          </span>
        </button>
        <div style="height:16px"></div>
        <div class="card">
          <h3>Como funciona</h3>
          <p style="color:var(--ink-600); font-size:14px; line-height:1.6;">
            Use <b>Adicionar / Descontar</b> para transferir IsacBucks entre você e um aluno.
            Ao <b>adicionar</b>, o valor sai do seu saldo e entra no do aluno. Ao <b>descontar</b>, o valor
            sai do saldo do aluno e entra no seu.
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderTransferir(){
  return `
    <div class="topbar"><h2>Adicionar / Descontar IsacBucks</h2></div>
    <div class="grid grid-2">
      <div class="card">
        <h3>➕ Adicionar a um aluno</h3>
        <form id="form-add" data-modo="add">
          <div class="field autocomplete-wrap">
            <label>Login ou RA do aluno</label>
            <input id="add-login" autocomplete="off" required>
            <div class="autocomplete-list" id="add-login-suggest"></div>
          </div>
          <div class="field"><label>Quantidade</label><input id="add-valor" type="number" min="1" step="1" required></div>
          <button class="btn btn-primary btn-block" type="submit">Adicionar</button>
        </form>
      </div>
      <div class="card">
        <h3>➖ Descontar de um aluno</h3>
        <form id="form-desc" data-modo="desc">
          <div class="field autocomplete-wrap">
            <label>Login ou RA do aluno</label>
            <input id="desc-login" autocomplete="off" required>
            <div class="autocomplete-list" id="desc-login-suggest"></div>
          </div>
          <div class="field"><label>Quantidade</label><input id="desc-valor" type="number" min="1" step="1" required></div>
          <button class="btn btn-danger btn-block" type="submit">Descontar</button>
        </form>
      </div>
    </div>
  `;
}