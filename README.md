# Projeto Final — Rede Social

Aplicação web desenvolvida como projeto final do programa Geração Tech. É possível fazer login com usuários de demonstração, visualizar os perfis e, na própria tela de perfil, acessar as configurações para editar as informações básicas. 


> O feed ainda está em desenvolvimento e, por enquanto, exibe apenas uma página inicial simples.

--> Funcionalidades

- Login com contas de demonstração.
- Visualização de perfis e informações como bio, localização e seguidores.
- Edição de nome, bio e localização do perfil.
- Interface adaptável com Bootstrap.

--> Tecnologias

- Frontend: React, Vite, React Router e Bootstrap.
- Backend: Node.js e Express.
- Dados: arquivos JSON locais.

--> Como executar

1. Inicie o backend

Em um terminal:

\`\`\`bash
cd backend
npm install
npm start
\`\`\`

O servidor será iniciado em `http://localhost:3000`.

2. Inicie o frontend

Em outro terminal, na raiz do projeto:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Abra no navegador o endereço informado pelo Vite no terminal.

--> Acesso de demonstração

- **E-mail:** `juliane@gmail.com`
- **Senha:** `12345`

As credenciais são fixas e servem apenas para demonstração local. Este projeto não implementa autenticação.

--> Endpoints da API

### Login e perfis

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/login` | Valida as credenciais e retorna o ID do perfil |
| `GET` | `/perfis/:id` | Consulta um perfil |
| `PATCH` | `/perfis/:id?nome=...&bio=...&localidade=...` | Atualiza os dados do perfil |


--> Observações

- Os perfis são armazenados localmente em JSON.
