/* ============================================================
   ISACBUCKS — AUTENTICAÇÃO
   Login, cadastro e inicialização do sistema.
   ============================================================ */


/* ---------- INICIALIZAÇÃO ---------- */

async function boot(){
  $('#loading-box').classList.remove('hidden');
  $('#retry-box').classList.add('hidden');
  $('#login-form').classList.add('hidden');
  $('#cadastro-link-wrap').classList.add('hidden');

  try{
    await DB.carregar();

    $('#loading-box').classList.add('hidden');
    $('#login-form').classList.remove('hidden');
    $('#cadastro-link-wrap').classList.remove('hidden');

    const lembrado = getLembrado();

    if(lembrado){
      $('#login-input').value = lembrado.login;
      $('#senha-input').value = lembrado.senha;
      $('#lembrar-checkbox').checked = true;

      tentarLogin(
        lembrado.login,
        lembrado.senha,
        true
      );
    }

  }catch(err){
    console.error('Erro ao carregar banco:', err);

    $('#loading-box').classList.add('hidden');
    $('#retry-box').classList.remove('hidden');
  }
}


/* ---------- LOGIN ---------- */

const REMEMBER_KEY = 'isacbucks_lembrar_login';


function salvarLembrado(login, senha){
  try{
    localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify({
        login,
        senha
      })
    );
  }catch(e){}
}


function getLembrado(){
  try{
    const raw = localStorage.getItem(REMEMBER_KEY);

    return raw
      ? JSON.parse(raw)
      : null;

  }catch(e){
    return null;
  }
}


function limparLembrado(){
  try{
    localStorage.removeItem(REMEMBER_KEY);
  }catch(e){}
}


/* ---------- VALIDAÇÃO DE LOGIN ---------- */

function tentarLogin(loginVal, senhaVal, silencioso){

  const errBox = $('#login-error');

  errBox.classList.remove('show');

  const user = DB.findByLogin(loginVal);


  /*
    Comparação sempre como texto.

    O Google Sheets pode guardar senhas numéricas
    como número. Por isso usamos String().
  */

  if(
    !user ||
    String(user.senha) !== String(senhaVal) ||
    user.tipo === 'noticia'
  ){

    if(!silencioso){

      errBox.textContent =
        'Login ou senha inválidos.';

      errBox.classList.add('show');

    }else{

      limparLembrado();

    }

    return false;
  }


  /* ---------- PROFESSOR AGUARDANDO APROVAÇÃO ---------- */

  if(user.status === 'AGUARDANDO_APROVACAO'){

    if(!silencioso){

      errBox.textContent =
        'Sua conta de professor ainda está aguardando aprovação do administrador.';

      errBox.classList.add('show');

    }

    return false;
  }


  /* ---------- CADASTRO RECUSADO ---------- */

  if(user.status === 'RECUSADO'){

    if(!silencioso){

      errBox.textContent =
        'Seu cadastro foi recusado. Fale com a coordenação.';

      errBox.classList.add('show');

    }

    return false;
  }


  /* ---------- CONTA INATIVA ---------- */

  if(user.status === 'INATIVO'){

    if(!silencioso){

      errBox.textContent =
        'Esta conta está desativada.';

      errBox.classList.add('show');

    }

    return false;
  }


  /* ---------- LEMBRAR LOGIN ---------- */

  if(
    $('#lembrar-checkbox') &&
    $('#lembrar-checkbox').checked
  ){

    salvarLembrado(
      loginVal,
      senhaVal
    );

  }else{

    limparLembrado();

  }


  /* ---------- ENTRAR NO SISTEMA ---------- */

  state.user = user;

  state.screen = 'dashboard';

  enterApp();

  return true;
}


/* ---------- FORMULÁRIO DE LOGIN ---------- */

$('#login-form').addEventListener('submit', e=>{

  e.preventDefault();

  tentarLogin(
    $('#login-input').value.trim(),
    $('#senha-input').value,
    false
  );

});


/* ---------- ESQUECER LOGIN ---------- */

$('#esquecer-login').addEventListener('click', ()=>{

  limparLembrado();

  $('#login-form').reset();

  toast(
    'Dados salvos removidos deste navegador.'
  );

});


/* ============================================================
   CADASTRO DE ALUNO
   ============================================================ */

$('#open-cadastro-aluno').addEventListener('click', ()=>{

  openModal(`

    <h3>Cadastro de aluno</h3>

    <p class="modal-sub">
      Use seu RA como login.
      Sua conta já entra ativa,
      sem precisar de aprovação.
    </p>

    <form id="form-cadastro-aluno">

      <div class="field">
        <label>Nome completo</label>
        <input
          id="ca-nome"
          required
        >
      </div>

      <div class="field">
        <label>RA</label>

        <input
          id="ca-ra"
          placeholder="Ex: 1105268743"
          required
        >
      </div>

      <div class="field">
        <label>Turma</label>

        <input
          id="ca-turma"
          placeholder="Ex: 2B, 1A, 9B"
          required
        >
        <p style="font-size:12px; color:var(--ink-400); margin-top:6px;">Pode digitar maiúsculo ou minúsculo (2b ou 2B) — o sistema padroniza sozinho.</p>
      </div>

      <div class="field">

        <label>Senha</label>

        <div class="password-wrap">

          <input
            id="ca-senha"
            name="new-password"
            type="password"
            autocomplete="new-password"
            required
          >

          <button
            type="button"
            class="pw-toggle"
            data-toggle-password="ca-senha"
            aria-label="Mostrar senha"
          >
            ${eyeIcon()}
          </button>

        </div>

      </div>

      <div class="modal-actions">

        <button
          type="button"
          class="btn btn-ghost"
          onclick="closeModal()"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Criar conta
        </button>

      </div>

    </form>
  `);


  $('#form-cadastro-aluno').addEventListener(
    'submit',
    e=>{

      e.preventDefault();

      const nome =
        $('#ca-nome').value.trim();

      const ra =
        $('#ca-ra').value.trim();

      const turma =
        normalizeTurma($('#ca-turma').value);

      const senha =
        $('#ca-senha').value;


      if(
        !nome ||
        !ra ||
        !turma ||
        !senha
      ){
        return;
      }


      if(DB.findByLogin(ra)){

        toast(
          'Este RA já está cadastrado.',
          'error'
        );

        return;
      }


      DB.insert({

        tipo: 'aluno',

        nome,

        ra,

        login: ra,

        senha,

        turma,

        saldo: 0,

        status: 'ATIVO',

        titulo: '',

        imagem: '',

        conteudo: '',

        video: ''

      });


      closeModal();


      toast(
        'Conta criada! Você já pode entrar com seu RA e senha.'
      );

    }
  );

});


/* ============================================================
   CADASTRO DE PROFESSOR
   ============================================================ */

$('#open-cadastro-professor').addEventListener(
  'click',
  ()=>{

    openModal(`

      <h3>Cadastro de professor</h3>

      <p class="modal-sub">
        Sua conta ficará aguardando aprovação
        do administrador antes de poder entrar.
      </p>

      <form id="form-cadastro-prof">

        <div class="field">

          <label>Nome completo</label>

          <input
            id="cp-nome"
            required
          >

        </div>


        <div class="field">

          <label>Login desejado</label>

          <input
            id="cp-login"
            required
          >

        </div>


        <div class="field">

          <label>Senha</label>

          <div class="password-wrap">

            <input
              id="cp-senha"
              name="new-password"
              type="password"
              autocomplete="new-password"
              required
            >

            <button
              type="button"
              class="pw-toggle"
              data-toggle-password="cp-senha"
              aria-label="Mostrar senha"
            >
              ${eyeIcon()}
            </button>

          </div>

        </div>


        <div class="modal-actions">

          <button
            type="button"
            class="btn btn-ghost"
            onclick="closeModal()"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            Solicitar cadastro
          </button>

        </div>

      </form>

    `);


    $('#form-cadastro-prof').addEventListener(
      'submit',
      e=>{

        e.preventDefault();

        const nome =
          $('#cp-nome').value.trim();

        const login =
          $('#cp-login').value.trim();

        const senha =
          $('#cp-senha').value;


        if(
          !nome ||
          !login ||
          !senha
        ){
          return;
        }


        if(DB.findByLogin(login)){

          toast(
            'Este login já está em uso.',
            'error'
          );

          return;
        }


        DB.insert({

          tipo: 'professor',

          nome,

          ra: '',

          login,

          senha,

          turma: '',

          saldo: 0,

          status: 'AGUARDANDO_APROVACAO',

          titulo: '',

          imagem: '',

          conteudo: '',

          video: ''

        });


        closeModal();


        toast(
          'Cadastro enviado! Aguarde a aprovação do administrador.'
        );

      }
    );

  }
);


/* ============================================================
   LOGOUT
   ============================================================ */

function logout(){

  state.user = null;

  $('#app-screen').classList.add('hidden');

  $('#login-screen').classList.remove('hidden');

  $('#login-form').reset();

}