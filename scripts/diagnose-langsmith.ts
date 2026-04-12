#!/usr/bin/env tsx
/**
 * LangSmith connectivity and env diagnostics (loads .env.local from app root).
 * Does not print full API keys.
 */
import path from 'path';
import { config } from 'dotenv';
import { Client, getDefaultProjectName } from 'langsmith';

config({ path: path.resolve(__dirname, '../.env.local') });

function lsEnv(name: string): string | undefined {
  return process.env[`LANGSMITH_${name}`] ?? process.env[`LANGCHAIN_${name}`];
}

/** Mirrors langsmith `isTracingEnabled()` (TRACING_V2 or TRACING === "true"). */
function tracingEnabledSdk(): boolean {
  return lsEnv('TRACING_V2') === 'true' || lsEnv('TRACING') === 'true';
}

function maskKey(v: string | undefined): string {
  if (!v) return '(not set)';
  if (v.length <= 8) return '***';
  return `${v.slice(0, 6)}…${v.slice(-4)} (${v.length} chars)`;
}

async function main() {
  const apiKey = lsEnv('API_KEY');
  const endpoint = lsEnv('ENDPOINT') ?? 'https://api.smith.langchain.com';
  const tracingV2 = lsEnv('TRACING_V2');
  const projectFromEnv = getDefaultProjectName();
  const workspaceId = lsEnv('WORKSPACE_ID');

  const rawSmithEndpoint = process.env.LANGSMITH_ENDPOINT;
  const rawChainEndpoint = process.env.LANGCHAIN_ENDPOINT;

  console.log('--- LangSmith env (after .env.local) ---');
  console.log('LANGCHAIN_TRACING_V2 / LANGSMITH_TRACING_V2:', tracingV2 ?? '(unset)');
  console.log('tracingEnabledSdk() [same rules as SDK]:', tracingEnabledSdk());
  console.log('LANGSMITH_ENDPOINT (raw):', rawSmithEndpoint ?? '(unset)');
  console.log('LANGCHAIN_ENDPOINT (raw):', rawChainEndpoint ?? '(unset)');
  console.log('→ resolved API base:', endpoint);
  console.log('LANGCHAIN_API_KEY [masked]:', maskKey(apiKey));
  console.log('LANGCHAIN_PROJECT / LANGSMITH_PROJECT → resolved default project name:', projectFromEnv);
  console.log('LANGSMITH_WORKSPACE_ID:', workspaceId ?? '(not set — OK for personal keys)');
  console.log('');

  if (!apiKey) {
    console.error('FAIL: No LANGCHAIN_API_KEY or LANGSMITH_API_KEY in environment.');
    process.exit(1);
  }

  const apiKeyResolved = apiKey;

  async function rawGet(path: string): Promise<{ status: number; body: string }> {
    const res = await fetch(`${endpoint}${path}`, {
      headers: {
        'x-api-key': apiKeyResolved,
        Accept: 'application/json',
      },
    });
    const body = await res.text();
    return { status: res.status, body };
  }

  console.log('--- API: GET /info (auth sanity check) ---');
  const info = await rawGet('/info');
  console.log('status:', info.status);
  if (info.status >= 400) {
    console.log('body:', info.body.slice(0, 500));
  } else {
    console.log('OK: API key accepted for /info');
  }
  console.log('');

  const client = new Client({ apiKey: apiKeyResolved, apiUrl: endpoint });

  try {
    console.log('--- API: list projects (sessions), first 8 ---');
    const names: string[] = [];
    let n = 0;
    for await (const p of client.listProjects()) {
      names.push((p as { name?: string }).name ?? '(unnamed)');
      if (++n >= 8) break;
    }
    if (names.length === 0) {
      console.log('(no projects returned — new workspace or empty)');
    } else {
      names.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
    }

    const target = projectFromEnv;
    console.log('');
    console.log(`--- readProject by name "${target}" ---`);
    try {
      const proj = await client.readProject({ projectName: target });
      console.log('OK: project exists. id:', (proj as { id?: string }).id);
    } catch (e) {
      console.log(
        'Note: readProject failed (name may not exist yet — first trace often creates it):',
        e instanceof Error ? e.message : e
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const is403 = msg.includes('403');
    const usingUsDefault =
      endpoint.includes('api.smith.langchain.com') && !endpoint.includes('eu.api');

    console.error('FAIL: LangSmith API error (key, endpoint, workspace, or network):');
    console.error(msg);
    console.error('');

    if (is403 && usingUsDefault) {
      console.error(
        '>>> Likely cause: your org is on the EU stack, but no EU endpoint is set.',
        'Add to .env.local (then restart dev server / re-run this script):'
      );
      console.error('');
      console.error('  LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com');
      console.error('');
      console.error(
        '(LANGCHAIN_ENDPOINT with the same URL works too.)',
        '/info can return 200 on the wrong region while /sessions returns 403.'
      );
      console.error('');
    }

    console.error('Other 403 causes:');
    console.error('  • Org-scoped service key: set LANGSMITH_WORKSPACE_ID to the workspace UUID (not a project id).');
    console.error('  • Some PATs: remove LANGSMITH_WORKSPACE_ID if it was set incorrectly.');
    process.exit(1);
  }

  console.log('');
  console.log('--- Summary ---');
  console.log(
    'LANGCHAIN_PROJECT is the project name in LangSmith (UI: Projects).',
    'Use any stable label you want, e.g. tennis-coach-ai or TennisCoach.',
    'If unset, the SDK uses "default".'
  );
  console.log(
    'Ensure you open that same project in the UI; traces do not show under a different project name.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
