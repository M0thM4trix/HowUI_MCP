# HowUI MCP Server

MCP-сервер для подключения библиотеки HowUI к IDE и AI-агентам.

Сервер работает через `stdio`: IDE запускает этот пакет как локальный процесс, передает ему MCP-запросы, а сервер обращается к публичному HowUI API с вашим MCP-токеном.

## Возможности

- поиск UI-элементов HowUI по запросу, категории, типу и уровню доступа;
- получение метаданных элемента;
- получение исходного кода элемента;
- получение ссылки на preview;
- просмотр досок пользователя;
- сохранение элемента в доску.

## Требования

- Node.js `20` или выше;
- MCP-токен HowUI;
- IDE или клиент с поддержкой MCP.

## Быстрый запуск

```bash
npx -y github:M0thM4trix/HowUI_MCP
```

Для работы сервера нужен токен:

```bash
HOWUI_API_TOKEN=hui_mcp_ваш_токен npx -y github:M0thM4trix/HowUI_MCP
```

По умолчанию используется API:

```bash
https://howui.ru/api
```

Если нужен другой адрес API, задайте `HOWUI_API_URL`.

## Cursor

Добавьте сервер в конфиг MCP:

```json
{
  "mcpServers": {
    "howui": {
      "command": "npx",
      "args": ["-y", "github:M0thM4trix/HowUI_MCP"],
      "env": {
        "HOWUI_API_URL": "https://howui.ru/api",
        "HOWUI_API_TOKEN": "hui_mcp_ваш_токен"
      }
    }
  }
}
```

## Claude Desktop

Пример `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "howui": {
      "command": "npx",
      "args": ["-y", "github:M0thM4trix/HowUI_MCP"],
      "env": {
        "HOWUI_API_URL": "https://howui.ru/api",
        "HOWUI_API_TOKEN": "hui_mcp_ваш_токен"
      }
    }
  }
}
```

## Локальная установка

```bash
git clone https://github.com/M0thM4trix/HowUI_MCP.git
cd HowUI_MCP
npm install
HOWUI_API_TOKEN=hui_mcp_ваш_токен npm start
```

## Переменные окружения

| Переменная | Обязательная | Значение |
| --- | --- | --- |
| `HOWUI_API_TOKEN` | да | MCP-токен из HowUI |
| `HOWUI_API_URL` | нет | Адрес API. По умолчанию `https://howui.ru/api` |

Не коммитьте реальные токены в репозиторий. Используйте переменные окружения в конфиге IDE.

## Инструменты MCP

| Инструмент | Назначение |
| --- | --- |
| `howui_search_assets` | Найти элементы HowUI |
| `howui_get_asset` | Получить метаданные элемента |
| `howui_get_asset_source` | Получить исходный код элемента |
| `howui_get_asset_preview` | Получить ссылку на preview |
| `howui_list_boards` | Получить список досок |
| `howui_save_asset` | Сохранить элемент в доску |

## Ресурсы MCP

| Ресурс | Назначение |
| --- | --- |
| `howui://assets/{assetId}/manifest` | Метаданные элемента |
| `howui://assets/{assetId}/source` | Исходный код элемента |
| `howui://assets/{assetId}/preview` | Данные preview |

## Проверка установки

```bash
npm run check
```

Команда проверяет синтаксис сервера и вывод справки.

## Безопасность

- В репозитории нет приватных токенов, ключей, cookies или локальных файлов проекта.
- Сервер не хранит токен на диске.
- Токен передается только в HowUI API через заголовок `Authorization`.
- В публичные примеры добавлены только placeholder-значения.

## Лицензия

MIT
