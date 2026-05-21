import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const requiredTools = [
  'howui_search_assets',
  'howui_search_blocks',
  'howui_list_asset_facets',
  'howui_get_asset',
  'howui_get_asset_bundle',
  'howui_get_asset_source',
  'howui_get_asset_preview',
  'howui_get_embed_snippet',
  'howui_list_boards',
  'howui_create_board',
  'howui_get_board',
  'howui_save_asset',
  'howui_remove_asset_from_board',
  'howui_prepare_design_context',
];

const requiredPrompts = [
  'howui_find_blocks',
  'howui_build_from_board',
  'howui_extend_existing_screen',
  'howui_embed_asset_preview',
];

function assertIncludes(actual, expected, label) {
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length > 0) {
    throw new Error(`Missing ${label}: ${missing.join(', ')}`);
  }
}

const client = new Client({ name: 'howui-mcp-smoke-test', version: '1.0.0' });
const packageDir = fileURLToPath(new URL('..', import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['src/server.js'],
  cwd: packageDir,
  env: {
    ...process.env,
    HOWUI_API_URL: process.env.HOWUI_API_URL || 'http://127.0.0.1:9/api',
    HOWUI_API_TOKEN: process.env.HOWUI_API_TOKEN || 'hui_mcp_smoke_test_token',
  },
  stderr: 'pipe',
});

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name);
  assertIncludes(toolNames, requiredTools, 'tools');

  const prompts = await client.listPrompts();
  const promptNames = prompts.prompts.map((prompt) => prompt.name);
  assertIncludes(promptNames, requiredPrompts, 'prompts');

  const prompt = await client.getPrompt({
    name: 'howui_find_blocks',
    arguments: {
      request: 'billing settings table with plan controls',
      locale: 'en',
      limit: '6',
    },
  });

  const promptText = prompt.messages?.[0]?.content?.text || '';
  if (!promptText.includes('howui_search_blocks') || !promptText.includes('howui_get_asset_bundle')) {
    throw new Error('Prompt howui_find_blocks does not describe the expected tool flow');
  }

  console.log(`MCP smoke test passed: ${toolNames.length} tools, ${promptNames.length} prompts.`);
} finally {
  await client.close();
}
