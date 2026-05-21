# HowUI MCP Server

MCP server for connecting HowUI assets, saved boards, source snippets, preview URLs, and implementation context to IDE agents.

The server runs over `stdio`. An MCP client starts this package as a local process, sends MCP requests to it, and the server calls the HowUI API with the user's MCP token.

## Requirements

- Node.js 20 or newer
- HowUI MCP token
- MCP-compatible IDE or client

## Quick Start

```bash
HOWUI_API_TOKEN=hui_mcp_your_token npx -y github:M0thM4trix/HowUI_MCP
```

Default API URL:

```bash
https://howui.ru/api
```

Set `HOWUI_API_URL` only when you need a different API endpoint.

## Cursor Config

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

## Claude Desktop Config

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

## Codex Config

```toml
[mcp_servers.howui]
command = "npx"
args = ["-y", "github:M0thM4trix/HowUI_MCP"]

[mcp_servers.howui.env]
HOWUI_API_URL = "https://howui.ru/api"
HOWUI_API_TOKEN = "hui_mcp_your_token"
```

## Environment

| Variable | Required | Value |
| --- | --- | --- |
| `HOWUI_API_TOKEN` | yes | MCP token from HowUI |
| `HOWUI_API_URL` | no | API URL. Defaults to `https://howui.ru/api` |

Do not commit real MCP tokens into any repository. Put tokens only in the local MCP client config or environment variables.

## Tools

- `howui_search_assets`
- `howui_search_blocks`
- `howui_list_asset_facets`
- `howui_get_asset`
- `howui_get_asset_bundle`
- `howui_get_asset_source`
- `howui_get_asset_preview`
- `howui_get_embed_snippet`
- `howui_list_boards`
- `howui_create_board`
- `howui_get_board`
- `howui_save_asset`
- `howui_remove_asset_from_board`
- `howui_prepare_design_context`

## Prompts

- `howui_find_blocks`
- `howui_build_from_board`
- `howui_extend_existing_screen`
- `howui_embed_asset_preview`

These prompts instruct an agent which HowUI tools to call and how to use returned metadata, source snippets, preview URLs, runtime data, and saved board references.

## Resources

| Resource | Value |
| --- | --- |
| `howui://assets/{assetId}/manifest` | Asset metadata |
| `howui://assets/{assetId}/source` | Asset source code |
| `howui://assets/{assetId}/preview` | Preview URL data |
| `howui://assets/{assetId}/bundle` | Metadata, preview URL, runtime, format |
| `howui://boards/{boardId}` | Saved board data |

## Local Development

```bash
git clone https://github.com/M0thM4trix/HowUI_MCP.git
cd HowUI_MCP
npm install
npm test
HOWUI_API_TOKEN=hui_mcp_your_token npm start
```

## Checks

```bash
npm run check
npm test
```

`npm test` starts the MCP server locally and verifies the registered tools and prompts without calling the HowUI API.

## Security

- The repository contains no private tokens, cookies, local databases, or HowUI backend/admin/web source code.
- The server does not store the MCP token on disk.
- The token is read from environment variables and sent only to the configured HowUI API through the `Authorization` header.
- Public examples use placeholder token values only.

## License

MIT
