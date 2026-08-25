/* ============================================================
   ISACBUCKS — index.html único (HTML + CSS + JS)
   Banco de dados: pensado para 1 banco de dados (Google Sheets) / 1 aba,
   com colunas: id, tipo, nome, ra, login, senha, turma, saldo,
   status, titulo, imagem, conteudo, video.

   INTEGRAÇÃO COM GOOGLE SHEETS (Apps Script)
   -------------------------------------------------------------
   Este arquivo funciona sozinho em "modo demonstração" (dados em
   memória, definidos em DEMO_ROWS) para que você possa testar tudo
   agora mesmo, sem nenhum backend.

   Quando o Apps Script (Web App publicado a partir do banco de dados)
   estiver pronto, basta colar a URL dele em CONFIG.API_URL logo
   abaixo. A partir daí, todas as leituras/gravações passam a usar
   fetch() para essa URL (doGet para ler, doPost para gravar) em vez
   dos dados em memória — sem precisar mudar mais nada no restante
   do arquivo, pois toda a lógica passa pelo objeto DB.

   LIMITAÇÕES DE SEGURANÇA (leia antes de usar em produção)
   -------------------------------------------------------------
   - O Google Sheets não é um banco de dados seguro de verdade:
     qualquer pessoa com acesso de edição ao banco de dados consegue ver
     e alterar tudo, inclusive senhas.
   - As senhas aqui ficam em TEXTO PURO no banco de dados, pois não há
     como fazer hashing seguro só com Apps Script + Sheets sem
     complicar a arquitetura. Para um projeto escolar isso é uma
     limitação aceitável, mas NÃO reaproveite este modelo para
     dados sensíveis de verdade.
   - Toda a validação de permissões acontece aqui no front-end.
     Isso é adequado para o uso pretendido (ambiente escolar,
     confiança nos usuários), mas um usuário técnico poderia
     manipular as requisições. Se um dia precisar de segurança
     real, a validação também precisaria existir no Apps Script.
   - Não há histórico/extrato por escolha de projeto: apenas o
     saldo atual é mantido, então uma transação malsucedida não
     pode ser auditada depois.
============================================================ */

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwwSqEM1TRT6kLDt07pZeQl3g4wlEvx3xLZh5-W6ZCPaV83mcDGDZcFbmhTzksdCauc/exec",
};

const DEMO_ROWS = [
  { id:1, tipo:'admin',     nome:'Administrador',   ra:'',           login:'admin',     senha:'1234', turma:'',    saldo:0,   status:'ATIVO',              titulo:'', imagem:'', conteudo:'', video:'' },
  { id:2, tipo:'professor', nome:'Professor Teste',  ra:'',           login:'professor', senha:'1234', turma:'',    saldo:500, status:'ATIVO',              titulo:'', imagem:'', conteudo:'', video:'' },
  { id:3, tipo:'aluno',     nome:'João Silva',       ra:'1105268743', login:'1105268743',senha:'1234', turma:'3º A',saldo:150, status:'ATIVO',              titulo:'', imagem:'', conteudo:'', video:'' },
  { id:4, tipo:'aluno',     nome:'Maria Souza',      ra:'1105268744', login:'1105268744',senha:'1234', turma:'3º A',saldo:80,  status:'ATIVO',              titulo:'', imagem:'', conteudo:'', video:'' },
  { id:5, tipo:'professor', nome:'Carla Mendes',     ra:'',           login:'carla',     senha:'1234', turma:'',    saldo:0,   status:'AGUARDANDO_APROVACAO', titulo:'', imagem:'', conteudo:'', video:'' },
  { id:6, tipo:'noticia',   nome:'',                 ra:'',           login:'',          senha:'',     turma:'',    saldo:0,   status:'ATIVO',
    titulo:'Bem-vindo ao IsacBucks!', imagem:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=60',
    conteudo:'Essa é a plataforma onde você acompanha suas IsacBucks, as moedas que a escola usa para reconhecer o seu esforço. Fique de olho nas notícias por aqui para saber de novidades, eventos e promoções.',
    video:'' },
];

/* ---------- CAMADA DE DADOS (DB) ----------
   Se CONFIG.API_URL estiver preenchida, o DB lê o banco de dados via
   Google Apps Script (GET ?acao=listar) ao abrir a página, e
   guarda tudo em cache local (this.rows) para a tela responder
   instantaneamente. Toda escrita (insert/update/remove) atualiza
   o cache na hora (para a tela reagir sem esperar a rede) e, em
   paralelo, envia a mudança para o banco de dados via POST. Se a
   gravação falhar (sem internet, banco de dados fora do ar etc.), o
   usuário recebe um aviso.
   Se CONFIG.API_URL estiver vazia, cai automaticamente no modo
   demonstração (dados em memória, DEMO_ROWS), útil para testar o
   layout sem depender do banco de dados. */
const DB = {
  rows: [],

  nextId(){ return this.rows.reduce((m,r)=>Math.max(m, Number(r.id)||0), 0) + 1; },
  all(tipo){ return tipo ? this.rows.filter(r=>r.tipo===tipo) : this.rows.slice(); },
  find(id){ return this.rows.find(r=>Number(r.id)===Number(id)) || null; },
  findByLogin(login){ return this.rows.find(r=>r.login && String(r.login).toLowerCase()===String(login).toLowerCase()) || null; },

  insert(row){
    row.id = this.nextId();
    this.rows.push(row);
    this._sync('criar', row);
    return row;
  },
  update(id, patch){
    const r = this.find(id);
    if(!r) return null;
    Object.assign(r, patch);
    this._sync('atualizar', Object.assign({ id }, patch));
    return r;
  },
  remove(id){
    this.rows = this.rows.filter(r=>Number(r.id)!==Number(id));
    this._sync('excluir', { id });
  },

  /* Carrega os dados do banco de dados (ou do modo demo) antes de liberar a tela de login */
  async carregar(){
    if(!CONFIG.API_URL){
      this.rows = JSON.parse(JSON.stringify(DEMO_ROWS));
      return;
    }
    const res = await fetch(CONFIG.API_URL + '?acao=listar');
    const json = await res.json();
    if(!json.ok) throw new Error(json.erro || 'Não foi possível ler o banco de dados.');
    this.rows = json.dados.map(r => ({
      ...r,
      id: Number(r.id),
      saldo: Number(r.saldo) || 0,
    }));
  },

  /* Envia a alteração para o banco de dados em segundo plano (não trava a tela) */
  _sync(acao, dados){
    if(!CONFIG.API_URL) return; // modo demonstração: nada para sincronizar
    fetch(CONFIG.API_URL, {
      method: 'POST',
      // text/plain evita o preflight OPTIONS, que o Apps Script não trata por padrão
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ acao, dados }),
    })
      .then(r => r.json())
      .then(json => { if(!json.ok) toast('Erro ao salvar no banco de dados: ' + (json.erro || 'tente novamente.'), 'error'); })
      .catch(() => toast('Sem conexão com o banco de dados. A alteração pode não ter sido salva.', 'error'));
  },
};

/* ---------- ESTADO ---------- */
const state = { user:null, screen:'dashboard' };

/* ---------- HELPERS ---------- */
const $ = sel => document.querySelector(sel);
const fmt = n => (Number(n)||0).toLocaleString('pt-BR');
const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Normaliza o texto da turma antes de gravar no banco de dados: maiúsculas
   e sem espaços extras, para que "2b" e "2B" sejam sempre a mesma turma
   (evita duplicar salas na listagem por causa de maiúscula/minúscula). */
function normalizeTurma(t){
  return String(t||'').trim().toUpperCase().replace(/\s+/g,' ');
}

/* Agrupa os alunos por turma (já normalizada) para a tela "Salas".
   Turmas em ordem alfabética/numérica (2A antes de 10A) e, dentro de
   cada turma, alunos em ordem alfabética pelo nome. */
function salasAgrupadas(){
  const grupos = {};
  DB.all('aluno').forEach(a=>{
    const turma = normalizeTurma(a.turma) || 'SEM TURMA';
    (grupos[turma] = grupos[turma] || []).push(a);
  });
  return Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b, 'pt-BR', { numeric:true, sensitivity:'base' }))
    .map(turma => ({
      turma,
      alunos: grupos[turma].sort((a,b)=> a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity:'base' })),
    }));
}

/* ---------- Normalização de link de imagem ----------
   Aceita links "de visualização" (Google Drive, Dropbox, etc.) colados
   pelo usuário e converte automaticamente para o formato de imagem direta
   que o <img> consegue carregar. Se não reconhecer o padrão, devolve a URL
   como veio (pode já ser um link direto, tipo Imgur/Unsplash/etc). */
function normalizeImgUrl(url){
  const raw = String(url||'').trim();
  if(!raw) return '';

  // Google Drive — link de arquivo: .../file/d/ID/view...  ou  .../open?id=ID  ou  .../uc?id=ID
  let m = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
       || raw.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/)
       || raw.match(/drive\.google\.com\/uc\?export=view&id=([a-zA-Z0-9_-]+)/);
  if(m){ return `https://drive.google.com/uc?export=view&id=${m[1]}`; }

  // Dropbox — trocar ?dl=0 (ou sem parâmetro) por ?raw=1 para servir o arquivo cru
  if(/dropbox\.com\//.test(raw)){
    return raw.replace(/\?dl=[01]$/, '').replace(/(\?|$)/, (raw.includes('?')?'&':'?') + 'raw=1');
  }

  // Google Imagens — link da página de resultado (/imgres?...&imgurl=... ou /url?...&url=...)
  // extrai a URL real da imagem escondida no parâmetro
  if(/google\.[a-z.]+\/(?:imgres|url)\?/.test(raw)){
    try{
      const params = new URL(raw).searchParams;
      const real = params.get('imgurl') || params.get('url');
      if(real) return real;
    }catch(e){ /* URL malformada, segue com o link original */ }
  }

  // já é um link direto (Imgur, Unsplash, imgbb, foto do Instagram/Facebook, site próprio, etc.)
  return raw;
}

/* Placeholder mostrado quando a imagem não carrega ou o link não é utilizável */
const IMG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
    <rect width="600" height="300" fill="#E7EEFF"/>
    <text x="300" y="155" font-family="sans-serif" font-size="16" fill="#4B5670" text-anchor="middle">Imagem indisponível</text>
  </svg>`);

/* Serve a imagem através de um proxy (wsrv.nl) — contorna bloqueio de hotlink
   que muitos sites (Instagram/Facebook/etc.) aplicam quando a imagem é
   carregada de fora do domínio deles. Não resolve link já expirado. */
function proxyImgUrl(url){
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//,''))}&default=${encodeURIComponent(IMG_FALLBACK)}`;
}

/* Monta a tag <img> (ou placeholder) com normalização de link + tentativa
   direta + fallback via proxy + fallback final em placeholder */
function newsImg(imagem){
  const url = normalizeImgUrl(imagem);
  if(!url) return `<div class="news-img"></div>`;
  const proxied = esc(proxyImgUrl(url));
  const direct = esc(url);
  return `<img class="news-img" src="${direct}" alt=""
    onerror="this.onerror=function(){this.onerror=null;this.src='${IMG_FALLBACK}';};this.src='${proxied}';">`;
}

/* ---------- Vídeo da notícia ----------
   Aceita link do YouTube (qualquer formato: watch, youtu.be, shorts, embed),
   link do Vimeo, link de post/reel do Instagram, link de compartilhamento
   do Google Drive (convertido automaticamente pro formato de visualização
   embutida), ou link direto de arquivo de vídeo (.mp4/.webm/.ogg/.mov).
   Retorna null se o link não for reconhecido, e nesse caso a notícia
   simplesmente não mostra vídeo. */
function videoEmbedInfo(url){
  if(!url) return null;
  const v = url.trim();
  let m;
  if((m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/))){
    return { tipo:'youtube', embed:`https://www.youtube.com/embed/${m[1]}`, watch:`https://www.youtube.com/watch?v=${m[1]}` };
  }
  if((m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/))){
    return { tipo:'vimeo', embed:`https://player.vimeo.com/video/${m[1]}`, watch:`https://vimeo.com/${m[1]}` };
  }
  if((m = v.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/i))){
    return { tipo:'instagram', embed:`https://www.instagram.com/${m[1]}/${m[2]}/embed`, watch:`https://www.instagram.com/${m[1]}/${m[2]}/` };
  }
  if((m = v.match(/drive\.google\.com\/file\/d\/([\w-]+)/)) ||
     (m = v.match(/drive\.google\.com\/open\?id=([\w-]+)/)) ||
     (m = v.match(/[?&]id=([\w-]+)/))){
    return { tipo:'drive', embed:`https://drive.google.com/file/d/${m[1]}/preview`, watch:`https://drive.google.com/file/d/${m[1]}/view` };
  }
  if(/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(v)){
    return { tipo:'arquivo', embed:v, watch:v };
  }
  return null;
}

function toast(msg, type='success'){
  const wrap = $('#toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span>${type==='success'?'✓':'⚠'}</span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),250); }, 3200);
}

/* Ícones de olho para os campos "mostrar senha" (usados nos modais via template string) */
function eyeIcon(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
}
function eyeOffIcon(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.9 19.9 0 0 1 4.22-5.44M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`;
}
/* Delegação global: funciona tanto no login quanto em qualquer modal criado dinamicamente */
document.addEventListener('click', e=>{
  const btn = e.target.closest('.pw-toggle');
  if(!btn) return;
  const targetId = btn.dataset.togglePassword;
  const input = document.getElementById(targetId);
  if(!input) return;
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = showing ? eyeIcon() : eyeOffIcon();
  btn.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
});

/* ---------- Tela "Salas" (professor e admin) ----------
   Cada turma vira um "quadrado" clicável que expande e mostra os
   alunos daquela sala, em ordem alfabética, com nome e login (RA)
   para o professor mandar/descontar moedas rapidamente. */
function renderSalas(){
  const grupos = salasAgrupadas();
  const ehProfessor = state.user.tipo === 'professor';
  return `
    <div class="topbar"><h2>Salas</h2></div>
    <div class="salas-grid">
      ${grupos.length ? grupos.map(g => `
        <div class="sala-card">
          <button class="sala-header" data-toggle-sala="${esc(g.turma)}">
            <span class="sala-turma">${esc(g.turma)}</span>
            <span class="sala-count">${g.alunos.length} aluno${g.alunos.length===1?'':'s'}</span>
            <span class="sala-chevron">▾</span>
          </button>
          <div class="sala-body hidden">
            ${g.alunos.map(a => `
              <div class="sala-aluno-row">
                <div class="sala-aluno-info">
                  <span class="sala-aluno-nome">${esc(a.nome)}</span>
                  <span class="sala-aluno-login">${esc(a.login)}</span>
                </div>
                ${statusBadge(a.status)}
                ${ehProfessor
                  ? `<button class="btn btn-ghost btn-sm" data-action="enviar-aluno" data-login="${esc(a.login)}">Enviar</button>`
                  : `<button class="btn btn-ghost btn-sm" data-action="saldo-usuario" data-id="${a.id}">Saldo</button>`}
              </div>`).join('')}
          </div>
        </div>
      `).join('') : `<div class="empty-state"><div class="coin">IB</div>Nenhum aluno cadastrado ainda.</div>`}
    </div>
  `;
}

function closeModal(){ $('#modal-root').innerHTML = ''; }
function openModal(html, extraClass){ $('#modal-root').innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal ${extraClass||''}">${html}</div></div>`;
  $('#modal-overlay').addEventListener('click', e=>{ if(e.target.id==='modal-overlay') closeModal(); });
}