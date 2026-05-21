#!/usr/bin/env node
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiUrl = (process.env.HOWUI_API_URL || 'https://howui.ru/api').replace(/\/$/, '');
const apiToken = process.env.HOWUI_API_TOKEN;

if (!apiToken) {
  console.error('HOWUI_API_TOKEN is required');
  process.exit(1);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${apiToken}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `HowUI API request failed: ${response.status}`);
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

function queryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const value = searchParams.toString();
  return value ? `?${value}` : '';
}

function promptResult(text) {
  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text,
        },
      },
    ],
  };
}

function listLines(lines) {
  return lines.filter(Boolean).join('\n');
}

const server = new McpServer({
  name: 'howui',
  version: '1.1.0',
}, {
  instructions: [
    'Use HowUI tools when the user asks for UI blocks, saved board references, asset source code, preview URLs, or implementation context from HowUI.',
    'Typical flow: list boards or search blocks, fetch a board or asset bundle with source when needed, then build code in the current project using returned metadata, format, runtime, preview URL, and source snippets.',
    'Use howui_prepare_design_context when the request should combine personal saved boards with library search results.',
    'Do not treat preview URLs as production dependencies unless the user asks for an iframe embed.',
  ].join(' '),
});

server.registerTool(
  'howui_search_assets',
  {
    title: 'Search HowUI assets',
    description: 'Search published HowUI UI assets by query, category, type, access, and locale.',
    inputSchema: {
      q: z.string().optional(),
      category: z.string().optional(),
      type: z.string().optional(),
      access: z.enum(['free', 'pro']).optional(),
      limit: z.number().int().min(1).max(50).default(12),
      locale: z.enum(['ru', 'en']).default('ru'),
    },
  },
  async (args) => {
    const payload = await apiRequest(`/mcp/assets/search${queryString(args)}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_search_blocks',
  {
    title: 'Search HowUI blocks',
    description: 'Search published HowUI blocks by query, category, type, access, and locale.',
    inputSchema: {
      q: z.string().optional(),
      category: z.string().optional(),
      type: z.string().optional(),
      access: z.enum(['free', 'pro']).optional(),
      limit: z.number().int().min(1).max(50).default(12),
      locale: z.enum(['ru', 'en']).default('ru'),
    },
  },
  async (args) => {
    const payload = await apiRequest(`/mcp/assets/search${queryString(args)}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_list_asset_facets',
  {
    title: 'List HowUI asset facets',
    description: 'Return available types, categories, sections, tags, and access values for asset search filters.',
    inputSchema: {
      locale: z.enum(['ru', 'en']).default('ru'),
    },
  },
  async (args) => {
    const payload = await apiRequest(`/mcp/assets/facets${queryString(args)}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_asset',
  {
    title: 'Get HowUI asset metadata',
    description: 'Return metadata, tags, format, access, and preview URL for a HowUI asset.',
    inputSchema: {
      assetId: z.string().min(1),
      locale: z.enum(['ru', 'en']).default('ru'),
    },
  },
  async ({ assetId, locale }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}${queryString({ locale })}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_asset_bundle',
  {
    title: 'Get HowUI asset bundle',
    description: 'Return metadata, preview URL, runtime, format, and optional source code for a HowUI asset.',
    inputSchema: {
      assetId: z.string().min(1),
      locale: z.enum(['ru', 'en']).default('ru'),
      includeSource: z.boolean().default(false),
      sourceLimit: z.number().int().min(500).max(80000).default(24000),
    },
  },
  async ({ assetId, locale, includeSource, sourceLimit }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/bundle${queryString({ locale, includeSource, sourceLimit })}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_asset_source',
  {
    title: 'Get HowUI asset source',
    description: 'Return source code for a HowUI asset. PRO assets require an active PRO account.',
    inputSchema: {
      assetId: z.string().min(1),
    },
  },
  async ({ assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/source`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_asset_preview',
  {
    title: 'Get HowUI asset preview',
    description: 'Return a browser preview URL for a HowUI asset.',
    inputSchema: {
      assetId: z.string().min(1),
    },
  },
  async ({ assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/preview`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_embed_snippet',
  {
    title: 'Get HowUI embed snippet',
    description: 'Return iframe and React snippets for embedding a HowUI asset preview.',
    inputSchema: {
      assetId: z.string().min(1),
      title: z.string().max(120).optional(),
      width: z.number().int().min(160).max(4000).default(1200),
      height: z.number().int().min(160).max(4000).default(900),
      loading: z.enum(['lazy', 'eager']).default('lazy'),
    },
  },
  async ({ assetId, title, width, height, loading }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/preview`);
    const safeTitle = title || `HowUI ${assetId}`;
    const iframe = `<iframe src="${payload.previewUrl}" title="${safeTitle}" width="${width}" height="${height}" loading="${loading}" style="border:0;max-width:100%;"></iframe>`;
    const react = [
      '<iframe',
      `  src="${payload.previewUrl}"`,
      `  title="${safeTitle}"`,
      `  width={${width}}`,
      `  height={${height}}`,
      `  loading="${loading}"`,
      '  style={{ border: 0, maxWidth: "100%" }}',
      '/>',
    ].join('\n');
    return textResult({ assetId, previewUrl: payload.previewUrl, iframe, react });
  },
);

server.registerTool(
  'howui_list_boards',
  {
    title: 'List HowUI boards',
    description: 'List boards available to the authenticated HowUI MCP token.',
  },
  async () => {
    const payload = await apiRequest('/mcp/boards');
    return textResult(payload);
  },
);

server.registerTool(
  'howui_create_board',
  {
    title: 'Create HowUI board',
    description: 'Create a personal HowUI board for the authenticated MCP token.',
    inputSchema: {
      title: z.string().min(1).max(80),
      locked: z.boolean().default(false),
    },
  },
  async ({ title, locked }) => {
    const payload = await apiRequest('/mcp/boards', {
      method: 'POST',
      body: { title, locked },
    });
    return textResult(payload);
  },
);

server.registerTool(
  'howui_get_board',
  {
    title: 'Get HowUI board',
    description: 'Return a personal board with saved blocks, preview URLs, metadata, and optional source code.',
    inputSchema: {
      boardId: z.string().min(1),
      locale: z.enum(['ru', 'en']).default('ru'),
      includeSource: z.boolean().default(false),
      sourceLimit: z.number().int().min(500).max(80000).default(24000),
    },
  },
  async ({ boardId, locale, includeSource, sourceLimit }) => {
    const payload = await apiRequest(`/mcp/boards/${encodeURIComponent(boardId)}${queryString({ locale, includeSource, sourceLimit })}`);
    return textResult(payload);
  },
);

server.registerTool(
  'howui_save_asset',
  {
    title: 'Save HowUI asset',
    description: 'Save a HowUI asset to a board.',
    inputSchema: {
      assetId: z.string().min(1),
      boardId: z.string().min(1),
    },
  },
  async ({ assetId, boardId }) => {
    const payload = await apiRequest(`/mcp/boards/${encodeURIComponent(boardId)}/assets`, {
      method: 'POST',
      body: { assetId },
    });
    return textResult(payload);
  },
);

server.registerTool(
  'howui_remove_asset_from_board',
  {
    title: 'Remove HowUI asset from board',
    description: 'Remove a saved asset from one personal board.',
    inputSchema: {
      assetId: z.string().min(1),
      boardId: z.string().min(1),
    },
  },
  async ({ assetId, boardId }) => {
    const payload = await apiRequest(`/mcp/boards/${encodeURIComponent(boardId)}/assets/${encodeURIComponent(assetId)}`, {
      method: 'DELETE',
    });
    return textResult(payload);
  },
);

server.registerTool(
  'howui_prepare_design_context',
  {
    title: 'Prepare HowUI implementation context',
    description: 'Collect saved board blocks, explicit assets, and library matches into one structured context for building an interface.',
    inputSchema: {
      prompt: z.string().max(2000).optional(),
      boardIds: z.array(z.string().min(1)).max(10).default([]),
      assetIds: z.array(z.string().min(1)).max(20).default([]),
      q: z.string().max(200).optional(),
      category: z.string().max(80).optional(),
      type: z.string().max(80).optional(),
      access: z.enum(['free', 'pro']).optional(),
      limit: z.number().int().min(1).max(30).default(12),
      locale: z.enum(['ru', 'en']).default('ru'),
      includeSource: z.boolean().default(true),
      sourceLimit: z.number().int().min(500).max(80000).default(24000),
      sourceBudget: z.number().int().min(1000).max(200000).default(60000),
    },
  },
  async (args) => {
    const payload = await apiRequest('/mcp/design-context', {
      method: 'POST',
      body: args,
    });
    return textResult(payload);
  },
);

server.registerPrompt(
  'howui_find_blocks',
  {
    title: 'Find HowUI Blocks',
    description: 'Search HowUI blocks and fetch the most relevant bundle for implementation.',
    argsSchema: {
      request: z.string().describe('What the target screen or component must contain.'),
      locale: z.enum(['ru', 'en']).default('ru').describe('Metadata language.'),
      limit: z.string().optional().describe('Maximum number of search results, usually 6-12.'),
    },
  },
  async ({ request, locale, limit }) => promptResult(listLines([
    `Find HowUI blocks for this request: ${request}`,
    '',
    'Use tools in this order:',
    `1. Call howui_search_blocks with q="${request}", locale="${locale}", limit=${limit || '8'}.`,
    '2. Pick assets whose type, category, format, and runtime match the implementation target.',
    '3. Call howui_get_asset_bundle for the best 1-3 assets with includeSource=true.',
    '4. Build code in the current project. Use returned source only as implementation reference; replace sample data and text.',
    '5. Keep the generated code aligned with the existing project stack and component boundaries.',
  ])),
);

server.registerPrompt(
  'howui_build_from_board',
  {
    title: 'Build From HowUI Board',
    description: 'Use saved personal board blocks as primary implementation references.',
    argsSchema: {
      boardId: z.string().describe('HowUI board id.'),
      request: z.string().describe('What to build from the saved board references.'),
      locale: z.enum(['ru', 'en']).default('ru').describe('Metadata language.'),
      sourceBudget: z.string().optional().describe('Maximum total source characters, usually 40000-80000.'),
    },
  },
  async ({ boardId, request, locale, sourceBudget }) => promptResult(listLines([
    `Build from HowUI board ${boardId}.`,
    `Request: ${request}`,
    '',
    'Use tools in this order:',
    `1. Call howui_prepare_design_context with boardIds=["${boardId}"], prompt="${request}", locale="${locale}", includeSource=true, sourceBudget=${sourceBudget || '60000'}.`,
    '2. Prioritize blocks where matchedBy includes "personal-board".',
    '3. Use blocks[].source.code as reference for component structure, CSS rules, responsive constraints, and state behavior.',
    '4. Implement the result in the current repository. Do not add iframe previews unless the user explicitly asks for an embed.',
    '5. Run the relevant local checks after editing.',
  ])),
);

server.registerPrompt(
  'howui_extend_existing_screen',
  {
    title: 'Extend Existing Screen With HowUI',
    description: 'Find HowUI references, inspect the local screen, and add a requested section or component.',
    argsSchema: {
      request: z.string().describe('What must be added or changed in the existing screen.'),
      files: z.string().optional().describe('Comma-separated local files to inspect first.'),
      locale: z.enum(['ru', 'en']).default('ru').describe('Metadata language.'),
    },
  },
  async ({ request, files, locale }) => promptResult(listLines([
    `Extend an existing screen using HowUI references. Request: ${request}`,
    files ? `Inspect these files first: ${files}` : 'Inspect the relevant local files before choosing references.',
    '',
    'Use tools in this order:',
    `1. Call howui_prepare_design_context with prompt="${request}", q="${request}", locale="${locale}", includeSource=true, limit=8.`,
    '2. Compare returned blocks with the existing local components, data flow, and styling constraints.',
    '3. Implement the requested change using local project patterns.',
    '4. Use preview URLs only for visual inspection; production code should use local components and assets.',
    '5. Run focused checks for the files you changed.',
  ])),
);

server.registerPrompt(
  'howui_embed_asset_preview',
  {
    title: 'Embed HowUI Preview',
    description: 'Create an iframe embed for a specific HowUI asset preview.',
    argsSchema: {
      assetId: z.string().describe('HowUI asset id.'),
      target: z.string().optional().describe('Where the embed should be added.'),
    },
  },
  async ({ assetId, target }) => promptResult(listLines([
    `Embed preview for HowUI asset ${assetId}.`,
    target ? `Target: ${target}` : '',
    '',
    'Use tools in this order:',
    `1. Call howui_get_embed_snippet with assetId="${assetId}".`,
    '2. Add the returned iframe or React snippet only where an iframe preview is acceptable.',
    '3. Preserve sizing, accessibility title, loading behavior, and responsive constraints in the target file.',
  ])),
);

server.registerResource(
  'howui_asset_manifest',
  new ResourceTemplate('howui://assets/{assetId}/manifest', { list: undefined }),
  {
    title: 'HowUI asset manifest',
    description: 'HowUI asset metadata as JSON.',
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
    title: 'HowUI asset source',
    description: 'HowUI source code for an asset.',
    mimeType: 'text/plain',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/source`);
    return {
      contents: [{ uri: uri.href, mimeType: 'text/plain', text: payload.source }],
    };
  },
);

server.registerResource(
  'howui_asset_preview',
  new ResourceTemplate('howui://assets/{assetId}/preview', { list: undefined }),
  {
    title: 'HowUI asset preview',
    description: 'HowUI asset preview URL as JSON.',
    mimeType: 'application/json',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/preview`);
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerResource(
  'howui_asset_bundle',
  new ResourceTemplate('howui://assets/{assetId}/bundle', { list: undefined }),
  {
    title: 'HowUI asset bundle',
    description: 'HowUI asset metadata, preview URL, runtime, and format as JSON.',
    mimeType: 'application/json',
  },
  async (uri, { assetId }) => {
    const payload = await apiRequest(`/mcp/assets/${encodeURIComponent(assetId)}/bundle`);
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

server.registerResource(
  'howui_board',
  new ResourceTemplate('howui://boards/{boardId}', { list: undefined }),
  {
    title: 'HowUI board',
    description: 'HowUI personal board with saved assets as JSON.',
    mimeType: 'application/json',
  },
  async (uri, { boardId }) => {
    const payload = await apiRequest(`/mcp/boards/${encodeURIComponent(boardId)}`);
    return {
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
