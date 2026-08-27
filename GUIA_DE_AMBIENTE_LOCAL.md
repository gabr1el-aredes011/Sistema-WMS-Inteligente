# Guia de ambiente local — WMS Inteligente

Este documento mostra como preparar, executar, testar e encerrar o ambiente de desenvolvimento do WMS Inteligente.

> **Importante:** nunca publique senhas, chaves JWT, arquivos `.env` ou o conteúdo de User Secrets no GitHub. Cada integrante deve configurar seus próprios segredos locais.

## 1. Visão geral

Atualmente o projeto está dividido em dois repositórios:

- **Backend/API:** <https://github.com/gabr1el-aredes011/Sistema-WMS-API>
- **Frontend Web:** <https://github.com/gabr1el-aredes011/Sistema-WMS-Inteligente>

O ambiente local funciona assim:

```text
React + Vite               ASP.NET Core API              PostgreSQL
http://localhost:5173  ->  https://localhost:7045  ->   localhost:5433
                                 |                              |
                          executada no computador       executado no Docker
```

O Docker Compose atual inicia **somente o PostgreSQL**. A API e o frontend são executados diretamente no computador durante o desenvolvimento.

## 2. Pré-requisitos

Instale antes de começar:

- Git;
- Docker Desktop, com Docker Compose;
- .NET SDK 10;
- Node.js `20.19` ou superior (Node 22 ou 24 também é compatível);
- um editor, preferencialmente Visual Studio Code ou Visual Studio.

Confirme a instalação:

```powershell
git --version
docker --version
docker compose version
dotnet --version
node --version
npm --version
```

O Docker Desktop precisa estar aberto antes dos comandos `docker compose`.

## 3. Acesso aos repositórios

Se os repositórios forem privados, o proprietário precisa adicionar cada integrante como colaborador no GitHub. Quem apenas deseja executar o projeto precisa de acesso de leitura; quem enviará código precisa de acesso de escrita.

Escolha uma pasta para manter os dois projetos lado a lado:

```powershell
mkdir WMS
cd WMS

git clone https://github.com/gabr1el-aredes011/Sistema-WMS-API.git
git clone https://github.com/gabr1el-aredes011/Sistema-WMS-Inteligente.git Sistema-WMS-Frontend
```

Use a branch `develop` para obter a versão integrada mais recente:

```powershell
cd Sistema-WMS-API
git switch develop
git pull origin develop

cd ..\Sistema-WMS-Frontend
git switch develop
git pull origin develop
```

## 4. Configuração do PostgreSQL com Docker

Entre no repositório da API:

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-API
```

Crie o `.env` local a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Edite o `.env` e escolha uma senha local:

```dotenv
POSTGRES_DB=wms_dev
POSTGRES_USER=wms_app
POSTGRES_PASSWORD=COLOQUE_UMA_SENHA_LOCAL_FORTE
POSTGRES_PORT=5433
```

Esse arquivo não deve ser commitado.

### Iniciar o banco

```powershell
docker compose up -d
```

Conferir o estado:

```powershell
docker compose ps
```

O serviço `wms-postgres` deve aparecer como `healthy`. Caso ainda esteja iniciando, aguarde alguns segundos.

Consultar os logs:

```powershell
docker compose logs -f postgres
```

Use `Ctrl + C` para sair dos logs; isso não encerra o banco.

## 5. Configuração local da API

Os segredos da API são armazenados pelo .NET User Secrets e não entram no Git.

Entre no repositório:

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-API
```

### 5.1 Connection string

A senha deve ser a mesma definida em `POSTGRES_PASSWORD`:

```powershell
dotnet user-secrets set "ConnectionStrings:WmsDatabase" "Host=localhost;Port=5433;Database=wms_dev;Username=wms_app;Password=SENHA_DEFINIDA_NO_ENV" --project src/Wms.Api
```

Substitua `SENHA_DEFINIDA_NO_ENV` pela senha local real.

### 5.2 Chave JWT

Gere uma chave diferente para cada computador:

```powershell
$wmsJwtSigningKey = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
dotnet user-secrets set "Jwt:SigningKey" $wmsJwtSigningKey --project src/Wms.Api
Remove-Variable wmsJwtSigningKey
```

Não envie essa chave por mensagem e não a coloque em arquivos versionados.

### 5.3 Certificado HTTPS local

Execute uma vez em cada computador:

```powershell
dotnet dev-certs https --trust
```

Confirme a solicitação do Windows, se ela aparecer.

### 5.4 Ferramenta do Entity Framework

O repositório já fixa a versão correta do `dotnet-ef`:

```powershell
dotnet tool restore
```

### 5.5 Aplicar as migrations

Com o PostgreSQL saudável:

```powershell
dotnet ef database update --project src/Wms.Infrastructure --startup-project src/Wms.Api
```

As migrations criam as tabelas, os perfis do sistema e o catálogo de permissões.

## 6. Criar o primeiro administrador local

O bootstrap administrativo cria a primeira conta com acesso total em um banco novo. Ele funciona somente no ambiente `Development`.

```powershell
dotnet user-secrets set "BootstrapAdmin:Enabled" "true" --project src/Wms.Api
dotnet user-secrets set "BootstrapAdmin:Email" "admin@empresa.com.br" --project src/Wms.Api
dotnet user-secrets set "BootstrapAdmin:FullName" "Administrador Local" --project src/Wms.Api
```

Para cadastrar a senha sem deixá-la visível no histórico do terminal:

```powershell
$wmsAdminSecret = Read-Host "Digite a senha do administrador" -AsSecureString
$wmsAdminPlain = [System.Net.NetworkCredential]::new("", $wmsAdminSecret).Password
dotnet user-secrets set "BootstrapAdmin:Password" $wmsAdminPlain --project src/Wms.Api
Remove-Variable wmsAdminSecret,wmsAdminPlain
```

A senha precisa ter:

- pelo menos 12 caracteres;
- letra maiúscula;
- letra minúscula;
- número;
- símbolo.

Na próxima inicialização da API, o usuário será criado e receberá o perfil `Administrator`. Depois do primeiro início bem-sucedido, desative o bootstrap:

```powershell
dotnet user-secrets set "BootstrapAdmin:Enabled" "false" --project src/Wms.Api
```

Desativar o bootstrap não exclui a conta criada. Também é possível criar novos usuários pela tela **Usuários** quando uma conta administradora já existe.

## 7. Executar a API

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-API
dotnet run --project src/Wms.Api --launch-profile https
```

O terminal deve mostrar:

```text
Now listening on: https://localhost:7045
Now listening on: http://localhost:5078
```

Mantenha esse terminal aberto.

Endereços úteis:

| Recurso | Endereço |
|---|---|
| API HTTPS | `https://localhost:7045` |
| API HTTP | `http://localhost:5078` |
| Health check | `https://localhost:7045/api/v1/health/ready` |
| Documento OpenAPI | `https://localhost:7045/openapi/v1.json` |

O health check retorna sucesso somente quando a API também consegue acessar o PostgreSQL.

## 8. Configurar e executar o frontend

Abra outro terminal:

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-Frontend\Controle_de_estoque
```

Crie o arquivo local de configuração:

```powershell
Copy-Item .env.example .env
```

Conteúdo esperado:

```dotenv
VITE_API_URL=https://localhost:7045/api/v1
```

Instale exatamente as dependências do `package-lock.json`:

```powershell
npm ci
```

Inicie o frontend:

```powershell
npm run dev
```

Acesse:

```text
http://localhost:5173
```

Entre com o administrador local ou com outro usuário criado pelo painel.

## 9. Ordem diária para iniciar o projeto

Depois que o primeiro preparo estiver concluído, a rotina normal é:

1. Abrir o Docker Desktop.
2. Iniciar o PostgreSQL:

   ```powershell
   cd C:\caminho\para\WMS\Sistema-WMS-API
   docker compose up -d
   ```

3. Iniciar a API:

   ```powershell
   dotnet run --project src/Wms.Api --launch-profile https
   ```

4. Em outro terminal, iniciar o frontend:

   ```powershell
   cd C:\caminho\para\WMS\Sistema-WMS-Frontend\Controle_de_estoque
   npm run dev
   ```

5. Abrir `http://localhost:5173`.

Não é necessário reaplicar migrations ou reinstalar pacotes todos os dias. Faça isso somente quando o projeto receber novas migrations ou mudanças nas dependências.

## 10. Tokens e expiração da sessão

Após um login válido, a API entrega dois tokens:

- **Access token (JWT):** dura 15 minutos e acompanha as chamadas protegidas da API. Contém a identidade, os perfis e as permissões do usuário.
- **Refresh token:** dura 7 dias e serve para obter um novo par de tokens sem pedir a senha novamente.

O horário exibido em **Sessão atual** no dashboard é a expiração do access token atual, não um aviso de que o usuário necessariamente será desconectado naquele horário.

O frontend tenta renovar a sessão automaticamente cerca de um minuto antes da expiração:

```text
Login
  -> access token válido por 15 minutos
  -> frontend solicita renovação
  -> API valida e rotaciona o refresh token
  -> novo access token por mais 15 minutos
```

Quando a renovação funciona, o usuário continua usando o sistema normalmente e o horário do dashboard é atualizado.

O usuário volta para o login quando a renovação não é mais permitida, por exemplo:

- refresh token expirou após 7 dias;
- usuário encerrou a sessão;
- refresh token foi revogado;
- conta foi desativada;
- API ou rede estava indisponível durante a renovação.

Ao clicar em **Encerrar sessão**, o refresh token atual é revogado. Um refresh token antigo não pode ser reutilizado; a API possui detecção de rotação e reutilização.

Atualmente a sessão é mantida no `sessionStorage` da aba do navegador. Por isso, atualizar a página com `F5` preserva a autenticação e o usuário permanece na mesma tela. Ao fechar a aba, o navegador remove essa cópia local; no próximo acesso será necessário entrar novamente. Durante a abertura da aplicação, se o access token já tiver expirado mas o refresh token ainda for válido, o frontend tenta renovar a sessão automaticamente.

O `sessionStorage` é uma solução adequada para o estágio atual de desenvolvimento, mas os tokens continuam acessíveis ao JavaScript da própria aplicação. Antes da publicação em produção, a equipe deverá avaliar a migração do refresh token para um cookie `HttpOnly`, `Secure` e com política `SameSite`, acompanhada das proteções apropriadas contra CSRF.

## 11. Perfis de acesso existentes

| Perfil | Responsabilidade principal |
|---|---|
| `Administrator` | Administração completa do sistema |
| `WarehouseManager` | Gestão operacional do armazém |
| `Buyer` | Compras e fornecedores |
| `StockKeeper` | Movimentações físicas do estoque |
| `Picker` | Separação e expedição |
| `Auditor` | Inventário, relatórios e auditoria |

As opções do frontend e os endpoints da API são liberados de acordo com as permissões efetivas do usuário.

## 12. Validar o projeto

### Backend

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-API
dotnet restore
dotnet build SistemaWms.sln
dotnet test SistemaWms.sln
dotnet format SistemaWms.sln --verify-no-changes --no-restore
```

### Frontend

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-Frontend\Controle_de_estoque
npm run lint
npm run typecheck
npm run build
```

Antes de enviar um pull request, todos esses comandos devem terminar sem erros.

## 13. Fluxo Git recomendado

Não desenvolva diretamente em `main` ou `develop`.

```powershell
git switch develop
git pull origin develop
git switch -c feature/nome-da-feature
```

Depois das alterações e validações:

```powershell
git status
git add .
git commit -m "feat: descrição objetiva da entrega"
git push -u origin feature/nome-da-feature
```

Abra um pull request da feature para `develop`. A branch `main` deve representar versões estáveis do projeto.

## 14. Encerrar o ambiente

Para encerrar API e frontend, pressione `Ctrl + C` nos respectivos terminais.

Para parar o PostgreSQL preservando os dados:

```powershell
cd C:\caminho\para\WMS\Sistema-WMS-API
docker compose stop
```

Para remover o container e preservar o volume de dados:

```powershell
docker compose down
```

### Reinicialização completa do banco

> **Atenção:** o comando abaixo apaga permanentemente todos os dados do PostgreSQL local, incluindo usuários criados.

```powershell
docker compose down -v
docker compose up -d
dotnet ef database update --project src/Wms.Infrastructure --startup-project src/Wms.Api
```

Depois disso, habilite novamente o bootstrap administrativo para recriar o primeiro administrador.

## 15. Problemas comuns

### “Não foi possível conectar ao servidor” no login

- confirme que a API está em execução;
- confirme que o terminal mostra `https://localhost:7045`;
- confirme `VITE_API_URL=https://localhost:7045/api/v1` no `.env` do frontend;
- reinicie o Vite depois de alterar o `.env`.

### Erro de certificado HTTPS

```powershell
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

Depois, reinicie a API e o navegador.

### “WmsDatabase não foi configurada”

Configure novamente `ConnectionStrings:WmsDatabase` nos User Secrets, conforme a seção 5.1.

### Falha de autenticação do PostgreSQL

A senha da connection string precisa ser igual a `POSTGRES_PASSWORD` no `.env` da API. Se o volume já existia com outra senha, apenas alterar o `.env` não muda automaticamente a senha armazenada no banco.

### Porta 5433 já está ocupada

Altere `POSTGRES_PORT` no `.env` da API e use a mesma porta na connection string.

### Container não fica saudável

```powershell
docker compose ps
docker compose logs postgres
```

Confira as variáveis do `.env` e se o Docker Desktop está funcionando.

### Administrador não é criado

- confirme `BootstrapAdmin:Enabled=true`;
- confirme que a senha atende a todos os requisitos;
- aplique as migrations antes de iniciar a API;
- confira se a role `Administrator` foi criada pelas migrations.

### Resposta `401 Unauthorized`

O token pode ter expirado ou sido revogado. Faça login novamente. Se ocorrer imediatamente depois do login, confira a chave JWT, data e hora do computador e se API e frontend usam os endereços esperados.

### Resposta `403 Forbidden`

O usuário está autenticado, mas não possui a permissão necessária. Um administrador deve revisar os perfis atribuídos ao usuário.

### Alterações novas não aparecem

- atualize a branch com `git pull`;
- reinicie API ou frontend;
- execute `npm ci` após mudanças no `package-lock.json`;
- execute `dotnet restore` após mudanças nos pacotes .NET;
- aplique migrations novas, se existirem.

## 16. Checklist de primeiro acesso

- [ ] Clonou os dois repositórios.
- [ ] Selecionou a branch `develop`.
- [ ] Docker Desktop está aberto.
- [ ] Criou o `.env` da API.
- [ ] Iniciou o PostgreSQL e confirmou `healthy`.
- [ ] Configurou a connection string nos User Secrets.
- [ ] Gerou uma chave JWT local.
- [ ] Confiou no certificado HTTPS.
- [ ] Restaurou o `dotnet-ef`.
- [ ] Aplicou as migrations.
- [ ] Criou ou recebeu uma conta de acesso.
- [ ] Criou o `.env` do frontend.
- [ ] Executou `npm ci`.
- [ ] Iniciou API e frontend.
- [ ] Acessou `http://localhost:5173` e realizou o login.

---

Em caso de dúvida, registre o comando executado e a mensagem completa do erro, sem incluir senhas ou tokens, e compartilhe com a equipe responsável.
