# IsacBucks — versão organizada para GitHub Pages

A aplicação foi separada em arquivos por responsabilidade, mantendo a estrutura do banco de dados e a camada `DB` como estavam.

## Estrutura

- `index.html` — estrutura das telas
- `css/style.css` — todo o CSS
- `js/core.js` — CONFIG, DEMO_ROWS, DB e utilitários
- `js/auth.js` — login e cadastro
- `js/navigation.js` — menus, navegação e roteamento de telas
- `js/aluno.js` — telas e funções do aluno
- `js/professor.js` — telas e funções do professor
- `js/admin.js` — telas e funções do administrador
- `js/actions.js` — eventos, modais e ações
- `js/app.js` — inicialização final

## Banco de dados

A camada de banco foi mantida separada em `js/core.js`. Não altere `CONFIG.API_URL`, `DEMO_ROWS` ou as funções do objeto `DB` se a intenção for continuar usando o mesmo banco.

## GitHub Pages

Envie todos os arquivos mantendo exatamente as pastas `css/` e `js/` ao lado do `index.html`.

Não abra somente o `index.html` localmente para testar recursos que dependem do Google Apps Script; teste pelo GitHub Pages.
