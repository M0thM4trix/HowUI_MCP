#!/usr/bin/env node
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const serverVersion = '1.0.0';
const defaultApiUrl = 'https://howui.ru/api';

function printHelp() {
  console.log(`HowUI MCP Server ${serverVersion}

Запуск:
  HOWUI_API_TOKEN=hui_mcp_ваш_токен npx -y github:M0thM4trix/HowUI_MCP

Переменные окружения:
  HOWUI_API_TOKEN  обязательный MCP-токен HowUI
  HOWUI_API_URL    адрес API, по умолчанию ${defaultApiUrl}

MCP-инструменты:
  howui_search_assets
  howui_get_asset
  howui_get_asset_source
  howui_get_asset_preview
  howui_list_boards
  howui_save_asset
`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

const apiUrl = (process.env.HOWUI_API_URL || defaultApiUrl).replace(/\/$/, '');
const apiToken = process.env.HOWUI_API_TOKEN;

if (!apiToken) {
  console.error('Ошибка: задайте HOWUI_API_TOKEN. Реальный токен храните только в переменных окружения IDE.');
  process.exit(1);
}

function queryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const value = searchParams.toString();
  return value ? `?${value}` : '';
}

async function readResponsePayload(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => '');
  return text ? { error: text } : {};
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      authorization: `Bearer ${apiToken}`,
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `HowUI API вернул HTTP ${response.status}`);
  }

  return payload;
}

function textResult(value) {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: 'howui',
  version: serverVersion,
});

server.registerTool(
  'howui_search_assets',
  {
    title: 'Поиск элементов HowUI',
    description: 'Ищет опубликованные элементы HowUI по запросу, категории, типу, доступу и языку.',
    inputSchema: {
      q: z.string().optional().describe('Поисковая строка'),
      category: z.string().optional().describe('Категория элемента'),
      type: z.string().optional().describe('Тип элемента'),
      access: z.enum(['free', 'pro']).optional().describe('Уровень доступа'),
      limit: z.number().int().min(1).max(50).default(12).describe('Количество результатов'),
      locale: z.enum(['ru', 'en']).default('ru').describe('Язык ответа'),
    },
  },
  async (args) => textResult(await apiRequest(`/mcp/assets/search${queryString(args)}`)),
);

server.registerTool(
  'howui_get_asset',
  {
    title: 'Метаданные элемента HowUI',
    description: 'Возвращает название, описание, теги, формат, доступ и preview URL элемента.',
    inputSchema: {
      assetId: z.string().min(1).describe('ID элемента HowUI'),
      locale: z.enum(['ru', 'en']).default('ru').describe('Язык ответа'),
    },
  },
  async ({ assetId, locale }) => {
    const path = `/mcp/assets/${encodeURIComponent(assetId)}${queryString({ locale })}`;
    return textResult(await apiRequest(path));
  },
);

server.registerTool(
  'howui_get_asset_source',
  {
    title: 'Исходный код элемента HowUI',
    description: 'Возвращает исходный код элемента. Для PRO-элементов нужен активный PRO-доступ.',
    inputSchema: {
      assetId: z.string().min(1).describe('ID элемента HowUI'),
    },
  },
  async ({ assetId }) => textResult(await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/source`)),
);

server.registerTool(
  'howui_get_asset_preview',
  {
    title: 'Preview элемента HowUI',
    description: 'Возвращает ссылку на browser preview элемента.',
    inputSchema: {
      assetId: z.string().min(1).describe('ID элемента HowUI'),
    },
  },
  async ({ assetId }) => textResult(await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/preview`)),
);

server.registerTool(
  'howui_list_boards',
  {
    title: 'Доски HowUI',
    description: 'Возвращает доски, доступные текущему MCP-токену.',
    inputSchema: {},
  },
  async () => textResult(await apiRequest('/mcp/boards')),
);

server.registerTool(
  'howui_save_asset',
  {
    title: 'Сохранить элемент в доску',
    description: 'Сохраняет элемент HowUI в выбранную доску.',
    inputSchema: {
      assetId: z.string().min(1).describe('ID элемента HowUI'),
      boardId: z.string().min(1).describe('ID доски HowUI'),
    },
  },
  async ({ assetId, boardId }) => {
    const path = `/mcp/boards/${encodeURIComponent(boardId)}/assets`;
    return textResult(await apiRequest(path, { method: 'POST', body: { assetId } }));
  },
);

server.registerResource(
  'howui_asset_manifest',
  new ResourceTemplate('howui://assets/{assetId}/manifest', { list: undefined }),
  {
    title: 'HowUI manifest',
    description: 'Метаданные элемента HowUI в JSON.',
    mimeType: 'application/json',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}`);
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerResource(
  'howui_asset_source',
  new ResourceTemplate('howui://assets/{assetId}/source', { list: undefined }),
  {
    title: 'HowUI source',
    description: 'Исходный код элемента HowUI.',
    mimeType: 'text/plain',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/source`);
    return {
      contents: [{ uri: uri.href, mimeType: 'text/plain', text: payload.source || JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerResource(
  'howui_asset_preview',
  new ResourceTemplate('howui://assets/{assetId}/preview', { list: undefined }),
  {
    title: 'HowUI preview',
    description: 'Данные preview элемента HowUI в JSON.',
    mimeType: 'application/json',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/preview`);
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
