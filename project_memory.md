# PROJECT MEMORY - NOs (Notion Operating System)

**Last Updated**: 2025-12-27 23:28  
**Status**: Production-Ready (TypeScript Migration Complete, Docs Consolidated)

---

## # META

**Project Name**: NOs (Notion Operating System)  
**Purpose**: Personal/Professional OS in Notion (Tasks, Finance, Clinical Log)  
**Stack**: TypeScript (Node.js) + Notion API (v2025-09-03) + n8n  
**Architecture**: REST API, centralized config, retry-resilient CLI

---

## # CURRENT STATE

### Infrastructure

- ✅ **10 Databases**: Fully deployed and configured
- ✅ **Unified Sync**: `ID_Evento_Tarea` field standard for Canvas/Gmail
- ✅ **TypeScript CLI**: `nos` (deploy, sync, diagnose)

### Repository Health (Optimized)

- ✅ **Lean**: Deleted legacy `scripts/` (Python), `mcp_servers/`, `n8n_workflows/`
- ✅ **Organized**: All source code in `src/`, config in `src/config.ts`
- ✅ **Type Safe**: 100% TypeScript coverage, 0 build errors
- ✅ **Instructions**: Unified in `SYSTEM_INSTRUCTIONS.md`
- ✅ **Docs Cleaned**: Archived 18 legacy files to `docs/archive/`

### Integration

- ✅ **Canvas**: Sync implemented in `src/sync/canvas.ts`
- ⚠️ **Gmail**: Placeholder in CLI (needs implementation if required)
- ⚠️ **n8n**: Workflows pending API key

---

## # ARCHITECTURE DECISIONS

1. **TypeScript First**: Python deprecated. All new code in TS.
2. **REST API**: No MCP. Direct API calls for maximum control and n8n compatibility.
3. **Centralized Config**: All IDs in `src/config.ts` with `as const`.
4. **Memory-Driven**: `project_memory.md` is the only source of truth.

---

## # TODO LIST

### Immediate Actions (User)

1. **n8n API Key**: Provide to enable workflow automation.
2. **Canvas Token**: Refresh expired token.

### Maintenance

- [ ] Implement `src/sync/gmail.ts` (if native sync needed)
- [ ] Add Jest unit tests
- [ ] Setup GitHub Actions for build verification

---

**Maintained by**: Antigravity Architect  
**Protocol**: High Agency / Silent Executive
