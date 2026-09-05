/* ============================================================
   ISACBUCKS — TEMAS DE COR
   Cada tema é só um conjunto de variáveis CSS (ver css/temas.css).
   A troca acontece via atributo data-tema no <html>.

   ONDE FICA SALVA A PREFERÊNCIA:
   - localStorage deste navegador: aplica o tema na hora (inclusive
     na tela de login, antes de saber quem é o usuário) sem piscar
     a tela com a cor errada.
   - conta do usuário no banco de dados (planilha): assim, quando
     ele faz login em outro celular/computador, o tema salvo na
     conta dele "ganha" do tema local e é aplicado automaticamente.

   IMPORTANTE (leia antes de publicar):
   Isso manda um campo extra "tema" pro Apps Script junto com o
   resto da atualização do usuário (mesmo caminho que já é usado
   pra saldo, status, etc). Pra isso funcionar de verdade na
   planilha, sua planilha precisa ter uma coluna chamada "tema" —
   sem ela, o valor não tem onde ser gravado no banco (mas o app
   continua funcionando normalmente com o tema salvo no navegador).
============================================================ */

const TEMA_KEY = 'isacbucks_tema';

const TEMAS = [
  { id:'padrao',       nome:'Azul & Dourado',  desc:'Tema original do IsacBucks.',                             cores:['#0F2249','#3E6BFF','#F0B429'] },
  { id:'escuro',       nome:'Modo Escuro',     desc:'Fundo escuro azulado, confortável à noite.',              cores:['#0B1220','#5B8CFF','#F0B429'] },
  { id:'esmeralda',    nome:'Verde Esmeralda', desc:'Verde de "banco", combina com o tema de moedas.',         cores:['#0B3B29','#12C77B','#F0B429'] },
  { id:'roxo',         nome:'Roxo Royal',      desc:'Roxo elegante com dourado.',                              cores:['#2A1854','#8B5CF6','#F0B429'] },
  { id:'laranja',      nome:'Pôr do Sol',      desc:'Laranja vibrante e caloroso.',                            cores:['#3F220D','#FF7A29','#F0B429'] },
  { id:'preto',        nome:'Preto Absoluto',  desc:'Preto bem preto de verdade, com texto branco puro.',      cores:['#000000','#2E6FFF','#F0B429'] },
  { id:'cinza-escuro', nome:'Cinza Escuro',    desc:'Escuro neutro, sem tom azulado.',                         cores:['#1C1C1E','#3E6BFF','#F0B429'] },
  { id:'cinza-claro',  nome:'Cinza Claro',     desc:'Claro e neutro, visual mais sóbrio.',                     cores:['#EDEDEF','#3E6BFF','#F0B429'] },
  { id:'rgb',          nome:'Modo RGB',        desc:'A barra lateral, o topo e os botões giram pelas cores do arco-íris.', cores:['#FF3B3B','#3BFF6B','#3B6BFF'] },
];

/* Aplica o tema na tela e salva neste navegador. Se opts.salvarNaConta
   for true e houver usuário logado, também manda pro banco de dados. */
function aplicarTema(id, opts){
  opts = opts || {};
  const valido = TEMAS.some(t => t.id === id);
  if(!valido) id = 'padrao';

  document.documentElement.setAttribute('data-tema', id);

  try{ localStorage.setItem(TEMA_KEY, id); }catch(e){}

  if(opts.salvarNaConta && typeof state !== 'undefined' && state.user){
    DB.update(state.user.id, { tema: id });
  }
}

function temaSalvoLocal(){
  try{ return localStorage.getItem(TEMA_KEY); }catch(e){ return null; }
}

/* Chamado logo após o login (enterApp): o tema salvo NA CONTA do
   usuário sempre ganha do tema salvo só neste navegador, pra ele
   ver a mesma cor em qualquer aparelho que usar pra entrar. Se a
   conta ainda não tem tema salvo, usa o do navegador (ou o padrão)
   e já grava na conta pra da próxima vez. */
function sincronizarTemaDaConta(){
  const u = DB.find(state.user.id);
  if(u && u.tema){
    aplicarTema(u.tema);
  } else {
    aplicarTema(temaSalvoLocal() || 'padrao', { salvarNaConta:true });
  }
}

function modalEscolherTema(){
  const atual = document.documentElement.getAttribute('data-tema') || 'padrao';
  openModal(`
    <h3 style="margin-bottom:4px;">Tema de cores</h3>
    <p class="modal-sub">Escolha o visual do IsacBucks. Fica salvo na sua conta.</p>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${TEMAS.map(t => `
        <button type="button" class="tema-opcao ${t.id===atual?'tema-opcao-ativa':''}" data-tema-opcao="${t.id}">
          <span class="tema-swatch">${t.cores.map(c=>`<span style="background:${c}"></span>`).join('')}</span>
          <span class="tema-info">
            <span class="tema-nome">${esc(t.nome)}${t.id===atual?' · atual':''}</span>
            <span class="tema-desc">${esc(t.desc)}</span>
          </span>
        </button>
      `).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>
    </div>
  `);
  $('#modal-root').querySelectorAll('[data-tema-opcao]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      aplicarTema(btn.dataset.temaOpcao, { salvarNaConta:true });
      closeModal();
      toast('Tema atualizado!');
    });
  });
}

const temaBtnEl = document.getElementById('tema-btn');
if(temaBtnEl) temaBtnEl.addEventListener('click', modalEscolherTema);
