/* ================= AÇÕES / EVENTOS DA TELA ATUAL ================= */
function wireScreen(){
  // Alterar senha (aluno/professor)
  const formSenha = $('#form-senha');
  if(formSenha){
    formSenha.addEventListener('submit', e=>{
      e.preventDefault();
      const u = DB.find(state.user.id);
      const atual = $('#senha-atual').value, nova = $('#senha-nova').value, conf = $('#senha-conf').value;
      if(String(atual) !== String(u.senha)){ toast('Senha atual incorreta.', 'error'); return; }
      if(nova.length < 4){ toast('A nova senha deve ter ao menos 4 caracteres.', 'error'); return; }
      if(nova !== conf){ toast('As senhas não conferem.', 'error'); return; }
      DB.update(u.id, { senha: nova });
      toast('Senha alterada com sucesso!');
      formSenha.reset();
    });
  }

  // Professor: adicionar / descontar
  const formAdd = $('#form-add'), formDesc = $('#form-desc');
  if(formAdd) formAdd.addEventListener('submit', e=>{ e.preventDefault(); confirmarTransferencia('add'); });
  if(formDesc) formDesc.addEventListener('submit', e=>{ e.preventDefault(); confirmarTransferencia('desc'); });

  // Professor: sugestão de nome ao digitar o RA (autocomplete)
  wireAlunoAutocomplete('add-login', 'add-login-suggest');
  wireAlunoAutocomplete('desc-login', 'desc-login-suggest');

  // Salas (professor/admin): expandir/recolher cada turma, tipo sanfona
  // (abrir uma sala fecha as outras que estavam abertas, evitando várias
  // caixas abertas ao mesmo tempo ocupando a tela, principalmente no celular)
  const botoesSala = $('#main').querySelectorAll('[data-toggle-sala]');
  botoesSala.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const jaAberta = !btn.nextElementSibling.classList.contains('hidden');
      botoesSala.forEach(outro=>{
        outro.classList.remove('open');
        outro.nextElementSibling.classList.add('hidden');
      });
      if(!jaAberta){
        btn.classList.add('open');
        btn.nextElementSibling.classList.remove('hidden');
      }
    });
  });

  // Busca de alunos
  const buscaAluno = $('#busca-aluno');
  if(buscaAluno){
    buscaAluno.addEventListener('input', ()=>{
      const q = buscaAluno.value.trim().toLowerCase();
      const list = DB.all('aluno').filter(a =>
        !q || [a.nome,a.ra,a.login,a.turma].some(v => String(v||'').toLowerCase().includes(q)));
      $('#tbody-alunos').innerHTML = alunosRows(list);
    });
  }

  // Botões de ação com data-action (delegação simples via querySelectorAll)
  $('#main').querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=> handleAction(btn.dataset.action, btn.dataset.id ? Number(btn.dataset.id) : null, btn.dataset.login || null, btn.dataset.turma || null));
  });
  const topbarBtn = document.querySelector('[data-action="novo-aluno"], [data-action="nova-noticia"], [data-action="novo-admin"]');
}

function handleAction(action, id, login, turma){
  switch(action){
    case 'novo-aluno': return modalEditarUsuario(null, 'aluno');
    case 'novo-admin': return modalEditarUsuario(null, 'admin');
    case 'editar-usuario': return modalEditarUsuario(DB.find(id));
    case 'saldo-usuario': return modalAlterarSaldo(DB.find(id));
    case 'reset-senha': return modalResetSenha(DB.find(id));
    case 'toggle-status': return toggleStatus(id);
    case 'excluir-usuario': return modalConfirmarExclusao(id);
    case 'aprovar': return modalConfirmarAprovacao(id, true);
    case 'recusar': return modalConfirmarAprovacao(id, false);
    case 'nova-noticia': return modalNoticia(null);
    case 'editar-noticia': return modalNoticia(DB.find(id));
    case 'ver-noticia': return modalVerNoticia(DB.find(id));
    case 'toggle-noticia': { const n=DB.find(id); DB.update(id,{status:n.status==='ATIVO'?'INATIVO':'ATIVO'}); render(); toast('Notícia atualizada.'); return; }
    case 'excluir-noticia': return modalExcluirNoticia(id);
    /* Ferramentas dev: exclusão em massa */
    case 'excluir-sala': return excluirSala(turma);
    case 'excluir-todos-alunos': return excluirTodosAlunos();
    case 'excluir-todos-professores': return excluirTodosProfessores();
    /* Sala do professor: atalho "Enviar" leva para a tela de transferência já com o login preenchido */
    case 'enviar-aluno': {
      goToScreen('transferir');
      const el = $('#add-login');
      if(el){ el.value = login || ''; el.dispatchEvent(new Event('input')); el.focus(); }
      return;
    }
  }
}

/* ---------- Autocomplete de aluno (usado nos campos de RA/login do professor) ----------
   Sugere nome + RA + turma conforme o professor digita, no estilo de
   busca do Google. Clicar numa sugestão preenche o campo com o RA. */
function wireAlunoAutocomplete(inputId, listId){
  const input = $('#'+inputId), list = $('#'+listId);
  if(!input || !list) return;

  function esconder(){ list.classList.remove('show'); list.innerHTML=''; }

  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    if(!q){ esconder(); return; }
    const matches = DB.all('aluno')
      .filter(a => a.status==='ATIVO' && [a.ra, a.nome, a.login].some(v => String(v||'').toLowerCase().includes(q)))
      .sort((a,b)=> a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity:'base' }))
      .slice(0, 6);
    if(!matches.length){ esconder(); return; }
    list.innerHTML = matches.map(a => `
      <button type="button" class="autocomplete-item" data-ra="${esc(a.ra || a.login)}">
        <span class="ac-nome">${esc(a.nome)}</span>
        <span class="ac-meta">${esc(a.ra || a.login)} · ${esc(normalizeTurma(a.turma) || 'sem turma')}</span>
      </button>`).join('');
    list.classList.add('show');
  });

  list.addEventListener('mousedown', e=>{
    const item = e.target.closest('.autocomplete-item');
    if(!item) return;
    input.value = item.dataset.ra;
    esconder();
  });

  input.addEventListener('blur', ()=> setTimeout(esconder, 150));
  input.addEventListener('focus', ()=>{ if(input.value.trim()) input.dispatchEvent(new Event('input')); });
}

/* ---------- MODAL: criar/editar usuário (aluno, professor ou admin) ---------- */
function modalEditarUsuario(user, forcedTipo){
  const tipo = user ? user.tipo : forcedTipo;
  const isEdit = !!user;
  openModal(`
    <h3>${isEdit?'Editar':'Novo'} ${labelTipo(tipo).toLowerCase()}</h3>
    <form id="form-usuario">
      <div class="field"><label>Nome completo</label><input id="fu-nome" value="${esc(user?.nome||'')}" required></div>
      ${tipo==='aluno' ? `<div class="field"><label>RA</label><input id="fu-ra" value="${esc(user?.ra||'')}" required></div>` : ''}
      <div class="field"><label>Login</label><input id="fu-login" value="${esc(user?.login||'')}" required></div>
      ${tipo==='aluno' ? `<div class="field"><label>Turma</label><input id="fu-turma" value="${esc(user?.turma||'')}" required></div>` : ''}
      ${!isEdit ? `<div class="field"><label>Senha inicial</label><div class="password-wrap"><input id="fu-senha" type="password" autocomplete="off" required><button type="button" class="pw-toggle" data-toggle-password="fu-senha" aria-label="Mostrar senha">${eyeIcon()}</button></div></div>` : ''}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Salvar':'Criar'}</button>
      </div>
    </form>
  `);
  $('#form-usuario').addEventListener('submit', e=>{
    e.preventDefault();
    const nome = $('#fu-nome').value.trim();
    const login = $('#fu-login').value.trim();
    const ra = tipo==='aluno' ? $('#fu-ra').value.trim() : '';
    const turma = tipo==='aluno' ? normalizeTurma($('#fu-turma').value) : '';
    const existente = DB.findByLogin(login);
    if(existente && (!isEdit || existente.id !== user.id)){ toast('Este login já está em uso.', 'error'); return; }
    if(isEdit){
      DB.update(user.id, { nome, login, ra, turma });
      toast('Usuário atualizado.');
    } else {
      const senha = $('#fu-senha').value;
      DB.insert({ tipo, nome, ra, login, senha, turma, saldo:0, status:'ATIVO', titulo:'', imagem:'', conteudo:'', video:'' });
      toast('Usuário criado.');
    }
    closeModal(); render();
  });
}

/* ---------- MODAL: alterar saldo (admin) ---------- */
function modalAlterarSaldo(user){
  openModal(`
    <h3>Alterar saldo — ${esc(user.nome)}</h3>
    <p class="modal-sub">Saldo atual: <b>${fmt(user.saldo)} IB</b></p>
    <div class="field">
      <label>Operação</label>
      <select id="sa-op"><option value="add">Adicionar</option><option value="rem">Remover</option></select>
    </div>
    <div class="field"><label>Quantidade</label><input id="sa-valor" type="number" min="1" step="1" required></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="sa-confirmar">Confirmar</button>
    </div>
  `);
  $('#sa-confirmar').addEventListener('click', ()=>{
    const op = $('#sa-op').value;
    const valor = Number($('#sa-valor').value);
    if(!valor || valor<=0 || !isFinite(valor)){ toast('Informe um valor válido.', 'error'); return; }
    const novo = op==='add' ? user.saldo + valor : user.saldo - valor;
    if(novo < 0){ toast('Saldo não pode ficar negativo.', 'error'); return; }
    DB.update(user.id, { saldo: novo });
    closeModal(); render();
    toast('Saldo atualizado.');
  });
}

/* ---------- MODAL: reset de senha ---------- */
function modalResetSenha(user){
  openModal(`
    <h3>Resetar senha — ${esc(user.nome)}</h3>
    <div class="field"><label>Nova senha</label><div class="password-wrap"><input id="rs-senha" type="password" autocomplete="off" required><button type="button" class="pw-toggle" data-toggle-password="rs-senha" aria-label="Mostrar senha">${eyeIcon()}</button></div></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="rs-confirmar">Resetar senha</button>
    </div>
  `);
  $('#rs-confirmar').addEventListener('click', ()=>{
    const senha = $('#rs-senha').value;
    if(senha.length<4){ toast('A senha deve ter ao menos 4 caracteres.', 'error'); return; }
    DB.update(user.id, { senha });
    closeModal();
    toast('Senha resetada.');
  });
}

/* ---------- Ativar/Desativar ---------- */
function toggleStatus(id){
  const u = DB.find(id);
  if(u.tipo==='admin' && u.status==='ATIVO'){
    const outrosAtivos = DB.all('admin').filter(a=>a.status==='ATIVO' && a.id!==id);
    if(outrosAtivos.length===0){ toast('Não é possível desativar o último administrador ativo.', 'error'); return; }
  }
  DB.update(id, { status: u.status==='ATIVO' ? 'INATIVO' : 'ATIVO' });
  render();
  toast('Status atualizado.');
}

/* ---------- MODAL: confirmar exclusão ---------- */
function modalConfirmarExclusao(id){
  const u = DB.find(id);
  openModal(`
    <div class="confirm-icon" style="background:var(--danger-bg); color:var(--danger);">⚠</div>
    <h3>Excluir ${esc(u.nome)}?</h3>
    <p class="modal-sub">Esta ação não pode ser desfeita.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="del-confirmar">Excluir</button>
    </div>
  `);
  $('#del-confirmar').addEventListener('click', ()=>{
    if(u.tipo==='admin'){
      const outros = DB.all('admin').filter(a=>a.id!==id);
      if(outros.length===0){ toast('Não é possível excluir o último administrador.', 'error'); closeModal(); return; }
    }
    DB.remove(id);
    closeModal(); render();
    toast('Usuário excluído.');
  });
}

/* ---------- MODAL: confirmar exclusão em massa (ferramentas dev) ----------
   Confirmação mais elaborada que a exclusão individual: além do aviso,
   exige digitar a palavra EXCLUIR para liberar o botão. Sem mais firula
   que isso — sem contagem regressiva, sem segunda tela. */
function modalConfirmarExclusaoEmMassa({ titulo, descricao, ids }){
  const count = ids.length;
  if(!count){ toast('Não há contas para excluir.', 'error'); return; }
  const PALAVRA = 'EXCLUIR';
  openModal(`
    <div class="confirm-icon" style="background:var(--danger-bg); color:var(--danger);">⚠</div>
    <h3>${esc(titulo)}</h3>
    <p class="modal-sub">${esc(descricao)} Esta ação não pode ser desfeita.</p>
    <div class="field">
      <label>Digite <b>${PALAVRA}</b> para confirmar</label>
      <input id="em-confirma-texto" autocomplete="off" placeholder="${PALAVRA}">
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="em-confirmar" disabled>Excluir ${count} conta${count===1?'':'s'}</button>
    </div>
  `);
  const input = $('#em-confirma-texto'), btn = $('#em-confirmar');
  input.addEventListener('input', ()=>{ btn.disabled = input.value.trim().toUpperCase() !== PALAVRA; });
  input.focus();
  btn.addEventListener('click', ()=>{
    if(btn.disabled) return;
    ids.forEach(id => DB.remove(id));
    closeModal(); render();
    toast(`${count} conta${count===1?'':'s'} excluída${count===1?'':'s'}.`);
  });
}

function excluirSala(turma){
  if(!turma) return;
  const alunos = DB.all('aluno').filter(a => normalizeTurma(a.turma) === turma);
  modalConfirmarExclusaoEmMassa({
    titulo: `Excluir a sala ${turma}?`,
    descricao: `Todos os ${alunos.length} aluno(s) da turma ${turma} terão o login excluído.`,
    ids: alunos.map(a => a.id),
  });
}

function excluirTodosAlunos(){
  const alunos = DB.all('aluno');
  modalConfirmarExclusaoEmMassa({
    titulo: 'Excluir todos os alunos?',
    descricao: `Todos os ${alunos.length} aluno(s) cadastrados, de todas as salas, terão o login excluído.`,
    ids: alunos.map(a => a.id),
  });
}

function excluirTodosProfessores(){
  const profs = DB.all('professor');
  modalConfirmarExclusaoEmMassa({
    titulo: 'Excluir todos os professores?',
    descricao: `Todos os ${profs.length} professor(es) cadastrados terão o login excluído.`,
    ids: profs.map(p => p.id),
  });
}

/* ---------- MODAL: aprovar / recusar professor ---------- */
function modalConfirmarAprovacao(id, aprovar){
  const p = DB.find(id);
  openModal(`
    <div class="confirm-icon" style="background:${aprovar?'var(--success-bg)':'var(--danger-bg)'}; color:${aprovar?'var(--success)':'var(--danger)'};">${aprovar?'✓':'✕'}</div>
    <h3>${aprovar?'Aprovar':'Recusar'} ${esc(p.nome)}?</h3>
    <p class="modal-sub">${aprovar?'O professor poderá fazer login imediatamente.':'O professor não poderá acessar a conta.'}</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn ${aprovar?'btn-primary':'btn-danger'}" id="apr-confirmar">${aprovar?'Aprovar':'Recusar'}</button>
    </div>
  `);
  $('#apr-confirmar').addEventListener('click', ()=>{
    DB.update(id, { status: aprovar ? 'ATIVO' : 'RECUSADO' });
    closeModal(); render();
    toast(aprovar ? 'Professor aprovado.' : 'Cadastro recusado.');
  });
}

/* ---------- MODAL: notícia ---------- */
function modalNoticia(n){
  const isEdit = !!n;
  openModal(`
    <h3>${isEdit?'Editar':'Nova'} notícia</h3>
    <div class="field"><label>Título</label><input id="nt-titulo" value="${esc(n?.titulo||'')}" required></div>
    <div class="field">
      <label>URL da imagem</label>
      <input id="nt-imagem" value="${esc(n?.imagem||'')}" placeholder="https://..." required>
      <p style="font-size:12px; color:var(--ink-400); margin-top:6px; line-height:1.5;">Aceita link direto de imagem, link do Google Imagens, ou link de compartilhamento do Google Drive/Dropbox (convertido automaticamente). Links do Instagram/Facebook às vezes expiram — se a imagem sumir depois de um tempo, gere o link de novo.</p>
    </div>
    <div class="field">
      <label>Conteúdo</label>
      <textarea id="nt-conteudo" rows="5" placeholder="Escreva aqui o texto completo da notícia, que aparece quando o usuário abrir/maximizar o card...">${esc(n?.conteudo||'')}</textarea>
    </div>
    <div class="field">
      <label>URL do vídeo (opcional)</label>
      <input id="nt-video" value="${esc(n?.video||'')}" placeholder="https://youtube.com/... ou link direto .mp4">
      <p style="font-size:12px; color:var(--ink-400); margin-top:6px; line-height:1.5;">Aceita link do YouTube, Vimeo, Instagram (post ou reel), link de compartilhamento do Google Drive, ou link direto de arquivo de vídeo (.mp4). Se preenchido, o vídeo aparece no lugar da imagem quando a notícia é aberta. Para vídeos do Drive, o arquivo precisa estar compartilhado como "Qualquer pessoa com o link". Posts do Instagram precisam ser públicos.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="nt-confirmar">${isEdit?'Salvar':'Publicar'}</button>
    </div>
  `);
  $('#nt-confirmar').addEventListener('click', ()=>{
    const titulo = $('#nt-titulo').value.trim();
    const imagem = $('#nt-imagem').value.trim();
    const conteudo = $('#nt-conteudo').value.trim();
    const video = $('#nt-video').value.trim();
    if(!titulo || !imagem){ toast('Preencha todos os campos.', 'error'); return; }
    if(video && !videoEmbedInfo(video)){ toast('Link de vídeo não reconhecido. Use YouTube, Vimeo ou um link direto de arquivo.', 'error'); return; }
    if(isEdit){ DB.update(n.id, { titulo, imagem, conteudo, video }); }
    else { DB.insert({ tipo:'noticia', nome:'', ra:'', login:'', senha:'', turma:'', saldo:0, status:'ATIVO', titulo, imagem, conteudo, video }); }
    closeModal(); render();
    toast('Notícia salva.');
  });
}
/* ---------- MODAL: ver notícia (maximizada) ---------- */
function modalVerNoticia(n){
  const vid = videoEmbedInfo(n.video);
  const isFileProtocol = location.protocol === 'file:';
  let midiaHtml;
  if(vid && vid.tipo==='arquivo'){
    midiaHtml = `<div class="modal-news-video"><video src="${esc(vid.embed)}" controls playsinline></video></div>`;
  } else if(vid && isFileProtocol){
    /* Rodando via file:// (arquivo aberto direto do computador): o
       navegador não envia referrer nenhum, e o YouTube/Vimeo/Drive
       recusam mostrar o player embutido nesse caso (erro 153 e
       parecidos). Em vez de mostrar a tela de erro, oferece um botão
       que abre o vídeo direto no site de origem, em outra aba. */
    midiaHtml = `<div class="modal-news-video modal-news-video-fallback">
      <div class="video-fallback-icon">▶</div>
      <p>O player embutido não funciona quando a página é aberta direto do computador (file://). Hospede o arquivo em um site (ex: GitHub Pages) para o vídeo tocar direto na notícia.</p>
      <a class="btn btn-primary" href="${esc(vid.watch)}" target="_blank" rel="noopener">Assistir vídeo</a>
    </div>`;
  } else if(vid){
    const vClass = vid.tipo==='instagram' ? 'modal-news-video modal-news-video-instagram' : 'modal-news-video';
    midiaHtml = `<div class="${vClass}"><iframe src="${esc(vid.embed)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  } else {
    const url = normalizeImgUrl(n.imagem);
    const proxied = url ? esc(proxyImgUrl(url)) : '';
    midiaHtml = url
      ? `<img class="modal-news-img" src="${esc(url)}" alt="" onerror="this.onerror=function(){this.onerror=null;this.src='${IMG_FALLBACK}';};this.src='${proxied}';">`
      : `<div class="modal-news-img"></div>`;
  }
  openModal(`
    ${midiaHtml}
    <div class="modal-news-body">
      <h3>${esc(n.titulo)}</h3>
      <div class="modal-news-content">${n.conteudo ? esc(n.conteudo) : '<em style="color:var(--ink-400);">Sem conteúdo adicional.</em>'}</div>
      ${vid && !isFileProtocol && vid.tipo!=='arquivo' ? `<a href="${esc(vid.watch)}" target="_blank" rel="noopener" style="display:block; font-size:12.5px; color:var(--ink-400); margin-top:-6px; margin-bottom:16px;">O vídeo não carregou? Assista na fonte original ↗</a>` : ''}
      <div class="modal-actions">
        <button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `, 'modal-lg');
}

function modalExcluirNoticia(id){
  openModal(`
    <div class="confirm-icon" style="background:var(--danger-bg); color:var(--danger);">⚠</div>
    <h3>Excluir notícia?</h3>
    <p class="modal-sub">Esta ação não pode ser desfeita.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="dn-confirmar">Excluir</button>
    </div>
  `);
  $('#dn-confirmar').addEventListener('click', ()=>{ DB.remove(id); closeModal(); render(); toast('Notícia excluída.'); });
}

/* ---------- Transferência (professor) com confirmação ---------- */
function confirmarTransferencia(modo){
  const loginInput = modo==='add' ? $('#add-login') : $('#desc-login');
  const valorInput = modo==='add' ? $('#add-valor') : $('#desc-valor');
  const loginAluno = loginInput.value.trim();
  const valor = Number(valorInput.value);

  if(!valor || valor<=0 || !isFinite(valor)){ toast('Informe uma quantidade válida.', 'error'); return; }
  const aluno = DB.findByLogin(loginAluno);
  if(!aluno || aluno.tipo!=='aluno'){ toast('Aluno não encontrado.', 'error'); return; }
  if(aluno.status!=='ATIVO'){ toast('Este aluno está inativo.', 'error'); return; }
  const prof = DB.find(state.user.id);

  if(modo==='add' && valor > prof.saldo){ toast('Você não tem saldo suficiente.', 'error'); return; }
  if(modo==='desc' && valor > aluno.saldo){ toast('O aluno não tem saldo suficiente.', 'error'); return; }

  const titulo = modo==='add'
    ? `Adicionar ${fmt(valor)} IB a ${aluno.nome}?`
    : `Descontar ${fmt(valor)} IB de ${aluno.nome}?`;
  const desc = modo==='add'
    ? `Esse valor sairá do seu saldo (${fmt(prof.saldo)} IB) e entrará no saldo do aluno.`
    : `Esse valor sairá do saldo do aluno (${fmt(aluno.saldo)} IB) e entrará no seu saldo.`;

  openModal(`
    <div class="confirm-icon" style="background:var(--blue-100); color:var(--blue-600);">${modo==='add'?'➕':'➖'}</div>
    <h3>${titulo}</h3>
    <p class="modal-sub">${desc}</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="tr-confirmar">Confirmar</button>
    </div>
  `);
  $('#tr-confirmar').addEventListener('click', ()=>{
    if(modo==='add'){
      DB.update(prof.id, { saldo: prof.saldo - valor });
      DB.update(aluno.id, { saldo: aluno.saldo + valor });
    } else {
      DB.update(aluno.id, { saldo: aluno.saldo - valor });
      DB.update(prof.id, { saldo: prof.saldo + valor });
    }
    closeModal();
    (modo==='add' ? $('#add-login').closest('form') : $('#desc-login').closest('form'))?.reset();
    render();
    toast('Transferência realizada com sucesso!');
  });
}