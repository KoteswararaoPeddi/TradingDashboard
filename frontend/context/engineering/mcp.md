# MCP — Engineering Decisions

> **Placeholder — no MCP code exists in the repo, and none is planned.**

There is currently no Model Context Protocol integration in this project — no MCP server, no MCP client,
no resource/tool exposure over MCP. Trade Journal has no AI/agent surface (see [ai.md](ai.md)), so none
is planned.

**If MCP code is ever added**, log the non-obvious decisions here, e.g.:
- transport choice (stdio vs HTTP/SSE) and why
- which resources/tools are exposed and their permission boundaries
- auth for MCP connections
- error and timeout handling across the protocol boundary

Follow the 5-part Learn template in [README.md](README.md). Intentionally empty until such code exists.
`(no lesson — status note)`
