# delore-crm-core

Core CRM utilities used across Delore projects. This package centralizes route
registration, access metadata, and a few shared helpers.

## Install

```bash
npm i delore-crm-core
```

## Quick Start

```js
const express = require('express');
const core = require('delore-crm-core');

const app = express();

core.add(
  'get',
  '/s/example',
  'Example',
  'Example route',
  core.const.GROUPOPE,
  (req, res) => {
    res.json({ ok: true });
  }
);

app.use(core.makeRouter());
app.listen(3000);
```

## Access Helpers

All access entries are stored in-memory in the module. Typical flow:

1. Register routes with `add`, `addMenu`, `addOpen`, or `addNoAccessControl`.
2. Build the Express router with `makeRouter()`.
3. Export access metadata with `getAccess()` or `makeAccessScope*()` for ACL sync.

### Functions

- `add(method, path, name, desc, group, fn)`
- `addMenu(method, path, name, desc, group, fn)` marks as menu entry
- `addOpen(method, path, name, desc, group, fn)` open by default for existing users
- `addNoAccessControl(method, path, fn)` skips access control tracking
- `addEsp(name, desc, group)` creates a non-route access entry (returns `id`)
- `makeRouter()` returns an Express router with all registered routes
- `getAccess()` returns the raw list of registered entries
- `makeAccessScope()` returns JSON string of access IDs
- `makeAccessScopeAll()` returns JSON string of `id#name#desc#group#isMenu`
- `getResourceFromReq(req)` maps a request to its access metadata

### Constants

The `const` export provides group labels:

- `GROUPSYS`, `GROUPCAD`, `GROUPOPE`, `GROUPUTL`, `GROUPESP`, `GROUPCON`, `GROUPADM`

### Environment

`SERVICE_NAME` is read from `process.env.SERVICE_NAME` and attached to each entry.

## Utility Export

The helper module is available as `core.util` or via direct import:

```js
const util = require('delore-crm-core/util');
const url = util.getUrlFromReq('/crm/s/example');
```

## Direct Imports

If you only need a subset:

```js
const access = require('delore-crm-core/access');
```
