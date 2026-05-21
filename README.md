# HowUI MCP Server

MCP-сервер для подключения HowUI к IDE и агентам с поддержкой Model Context Protocol.

Сервер работает через `stdio`: MCP-клиент запускает этот пакет как локальный процесс, передает ему MCP-запросы, а сервер обращается к HowUI API с MCP-токеном пользователя.

## Что В Репозитории

- `src/server.js` - MCP-сервер.
- `examples/` - примеры конфигурации MCP-клиентов.
- `.env.example` - пример переменных окружения.
- `scripts/smoke-test.mjs` - локальная проверка списка tools и prompts.
- `package.json`, `package-lock.json`, `LICENSE`.

В репозитории нет backend, admin, web-кода HowUI, локальных баз данных, cookies, приватных ключей или реальных токенов.

## Требования

- Node.js 20 или новее.
- MCP-токен HowUI.
- IDE или клиент с поддержкой MCP.

## Быстрый Запуск

```bash
HOWUI_API_TOKEN=hui_mcp_your_token npx -y github:M0thM4trix/HowUI_MCP
```

По умолчанию используется API:

```bash
https://howui.ru/api
```

`HOWUI_API_URL` нужно задавать только для другого адреса API.

## Cursor

```json
{
  "mcpServers": {
    "howui": {
      "command": "npx",
      "args": ["-y", "github:M0thM4trix/HowUI_MCP"],
      "env": {
        "HOWUI_API_URL": "https://howui.ru/api",
        "HOWUI_API_TOKEN": "hui_mcp_your_token"
      }
    }
  }
}
```

## Claude Desktop

```json
{
  "mcpServers": {
    "howui": {
      "command": "npx",
      "args": ["-y", "github:M0thM4trix/HowUI_MCP"],
      "env": {
        "HOWUI_API_URL": "https://howui.ru/api",
        "HOWUI_API_TOKEN": "hui_mcp_your_token"
      }
    }
  }
}
```

## Codex

```toml
[mcp_servers.howui]
command = "npx"
args = ["-y", "github:M0thM4trix/HowUI_MCP"]

[mcp_servers.howui.env]
HOWUI_API_URL = "https://howui.ru/api"
HOWUI_API_TOKEN = "hui_mcp_your_token"
```

## Переменные Окружения

| Переменная | Обязательная | Значение |
| --- | --- | --- |
| `HOWUI_API_TOKEN` | да | MCP-токен из HowUI |
| `HOWUI_API_URL` | нет | Адрес API. По умолчанию `https://howui.ru/api` |

Реальный MCP-токен должен храниться только в локальной конфигурации IDE или переменных окружения. Не коммитьте реальные токены в репозитории.

## Tools

- `howui_search_assets` - поиск элементов HowUI.
- `howui_search_blocks` - поиск блоков HowUI.
- `howui_list_asset_facets` - список доступных фильтров.
- `howui_get_asset` - метаданные элемента.
- `howui_get_asset_bundle` - метаданные, preview URL, формат, runtime и опционально source.
- `howui_get_asset_source` - source элемента.
- `howui_get_asset_preview` - preview URL элемента.
- `howui_get_embed_snippet` - iframe и React-snippet для preview.
- `howui_list_boards` - список досок пользователя.
- `howui_create_board` - создание доски.
- `howui_get_board` - данные доски.
- `howui_save_asset` - сохранение элемента в доску.
- `howui_remove_asset_from_board` - удаление элемента из доски.
- `howui_prepare_design_context` - сбор контекста из досок, элементов и результатов поиска.

## Prompts

- `howui_find_blocks`
- `howui_build_from_board`
- `howui_extend_existing_screen`
- `howui_embed_asset_preview`

Prompts описывают агенту порядок вызова tools и способ использовать метаданные, source, preview URL, runtime и ссылки на доски.

## Resources

| Resource | Значение |
| --- | --- |
| `howui://assets/{assetId}/manifest` | Метаданные элемента |
| `howui://assets/{assetId}/source` | Source элемента |
| `howui://assets/{assetId}/preview` | Preview URL |
| `howui://assets/{assetId}/bundle` | Метаданные, preview URL, runtime, формат |
| `howui://boards/{boardId}` | Данные доски |

## Локальная Разработка

```bash
git clone https://github.com/M0thM4trix/HowUI_MCP.git
cd HowUI_MCP
npm install
npm test
HOWUI_API_TOKEN=hui_mcp_your_token npm start
```

## Проверки

```bash
npm run check
npm test
```

`npm run check` проверяет синтаксис сервера. `npm test` запускает MCP-сервер локально и проверяет зарегистрированные tools и prompts без запросов к HowUI API.

## Безопасность

- В публичном репозитории нет реальных токенов, cookies, приватных ключей, локальных баз данных или закрытого кода HowUI.
- `.env.example` и `examples/` содержат только placeholder-значения.
- Сервер не сохраняет MCP-токен на диск.
- Сервер читает токен из `HOWUI_API_TOKEN` и передает его только в заголовке `Authorization` при запросах к `HOWUI_API_URL`.
- Доступ к приватным данным должен ограничиваться на стороне HowUI API по MCP-токену пользователя.

## Лицензия

MIT
