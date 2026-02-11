# delore-crm-core

Biblioteca central de utilidades do CRM da Delore - Alphaville Systems. Reúne registro de rotas e acesso, helpers compartilhados, autenticação/token, sincronismo de permissões, conexão com banco (MySQL + MongoDB), modelos e utilidades de impressão (PDF/Excel).

## Instalação

```bash
npm i delore-crm-core
```

## Uso rápido (rotas e acesso)

```js
const express = require("express");
const core = require("delore-crm-core");

const app = express();

core.access.add(
  "get",
  "/s/exemplo",
  "Exemplo",
  "Rota de exemplo",
  core.access.const.GROUPOPE,
  (req, res) => res.json({ ok: true }),
);

app.use(core.access.makeRouter());
app.listen(3000);
```

## Exportações principais

O módulo principal exporta:

- `access`: registro de rotas, metadados de acesso e criação de `router`.
- `util`: helpers de data, máscara, número, telefone, validações e afins.
- `logger`: logger baseado em `pino`/`pino-pretty`.
- `memory`: cache simples em memória (chave/valor).
- `print`: geração de PDF e Excel.
- `authControl`: controle de segredo de autenticação (MongoDB + cache em memória).
- `ret`: helpers de retorno e geração/validação de tokens.
- `validRequest`: middlewares de validação de token.
- `syncAccess`: sincronismo de acessos com o banco.
- `sequelizeDB`: conexão com MySQL (Sequelize) + MongoDB.
- `models`: helpers de models, sync, migration e utilidades.

Exemplo de import:

```js
const { access, util, logger } = require("delore-crm-core");
```

## Access (rotas e ACL)

Registra rotas e mantém os metadados de acesso em memória. Depois monta um `router` do Express.

Funções principais:

- `access.add(method, path, name, desc, group, fn)`
- `access.addMenu(method, path, name, desc, group, fn)`
- `access.addOpen(method, path, name, desc, group, fn)`
- `access.addNoAccessControl(method, path, fn)`
- `access.addEsp(name, desc, group)`
- `access.makeRouter()`
- `access.getAccess()`
- `access.makeAccessScope()`
- `access.makeAccessScopeAll()`
- `access.getResourceFromReq(req)`

Constantes de grupos:

- `GROUPSYS`, `GROUPCAD`, `GROUPOPE`, `GROUPUTL`, `GROUPESP`, `GROUPCON`, `GROUPADM`

## Auth e validação

### Tokens e respostas

O módulo `ret` centraliza geração de token e respostas padronizadas:

- `ret.returnLogin(...)`, `ret.returnLoginADM(...)`, `ret.returnLoginMASTER(...)`, `ret.returnLoginDEVELOPER(...)`
- `ret.validToken(req)`, `ret.validTokenADM(req)`, `ret.validTokenMASTER(req)`, `ret.validTokenDEVELOPER(req)`
- `ret.makeTokenSocketIo(...)`, `ret.validTokenSocketIo(...)`
- `ret.returnTokenMsg(...)`, `ret.validTokenMSG(req)`
- `ret.makeTokenForRememberUser(...)`, `ret.validTokenForRememberUser(token)`

### Middlewares

```js
const { validRequest } = require("delore-crm-core");

app.use("/s", validRequest.validaRequestSystem);
app.use("/adm", validRequest.validaRequestADM);
```

## Conexão com banco (MySQL + MongoDB)

O `sequelizeDB` conecta ao MySQL via Sequelize e ao MongoDB (coleção `authControl`), carregando secrets em memória.

```js
const { sequelizeDB } = require("delore-crm-core");

sequelizeDB.init(() => {
  console.log("DB conectado");
});
```

Variáveis de ambiente usadas:

- `DB_DATABASE`, `DB_USER`, `DB_PASS`, `DB_HOST`
- `MONGODB_URI`
- `SECRET_LOGIN_USER`, `SECRET_REMEMBER_USER`
- `PINO_LOG_LEVEL`
- `TELEGRAM_BOT_TOKEN_NOTIFY`, `TELEGRAM_BOT_ENV_NOTIFY`

## Models e sincronismo

O módulo `models` dá suporte para:

- registrar models: `addModel`, `addModelIn`, `addModelInOne`
- sincronizar: `initSync(callback)`
- migration: `Migration()`
- exportar modelos para front: `ExportModels()`
- utilitários: `canDelete`, `canDelete2`, `makeSQLTransf`, `seedFrom`

O módulo `syncAccess` sincroniza a lista de acessos registrados em memória com a tabela `access`.

```js
const { syncAccess } = require("delore-crm-core");

syncAccess.init("crm-service");
await syncAccess.sync();
```

## Print (PDF e Excel)

Gera relatórios em PDF (tabela/linhas) e exporta para Excel.

```js
const { print } = require("delore-crm-core");

const report = print.getPrint(req, res);
report.addColumns("Nome", "name", "L", 30);
report.addColumVal("Valor", "amount", "R", 12, 2);
await report.printList(data, req, res);
```

Para Excel:

```js
await report.printListEXCEL(data, req, res);
```

## Util, Logger e Memory

### Util

Helpers variados: datas (timezone America/Sao_Paulo), máscaras, números, telefone, validação de CPF, geração de schema JSON, etc.

```js
const { util } = require("delore-crm-core");

const today = util.nowDateTime();
const cpfOk = util.isValidCPF("00000000000");
```

### Logger

Logger configurado com `pino-pretty`:

```js
const { logger } = require("delore-crm-core");

logger.info("serviço iniciado");
logger.setLevel("info");
```

### Memory

Cache simples em memória:

```js
const { memory } = require("delore-crm-core");

await memory.addMemory("chave", { x: 1 });
const value = await memory.findMemory("chave");
```

## Observações

- O módulo é CommonJS.
- Os helpers de acesso dependem do registro das rotas antes do `makeRouter()`.
- Tokens e segredos usam dados do MongoDB (`authControl`).
