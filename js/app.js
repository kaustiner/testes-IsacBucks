/* ============================================================
   ISACBUCKS — INICIALIZAÇÃO FINAL
   ============================================================ */

/*
   Este arquivo é carregado por último.

   Todos os outros módulos já foram carregados neste momento,
   incluindo:

   - core.js
   - auth.js
   - navigation.js
   - aluno.js
   - professor.js
   - admin.js
   - actions.js

   Por isso podemos chamar boot() com segurança.
*/


/* ---------- BOTÃO TENTAR NOVAMENTE ---------- */

$('#retry-btn').addEventListener(
  'click',
  boot
);


/* ---------- INICIAR SISTEMA ---------- */

boot();