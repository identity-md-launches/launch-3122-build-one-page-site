import { useEffect, useState } from 'react';
import snapshot from './swarm-snapshot.json';

export const links = {
  report: 'https://github.com/Identity-md/research/blob/main/jobs/4bb06f36-c8da-4925-8e4d-378ed76cff68/files/artifacts/report.md',
  telegram: 'https://imd.fun/telegram/',
  swarm: 'https://api.imd.fun/swarm',
  models: 'https://api.flop.network/v1/models',
  flop: 'https://docs.flop.network',
  overview: 'https://docs.flop.network/docs/what-is-flop',
  lifecycle: 'https://docs.flop.network/docs/inference-session-lifecycle',
  timeline: 'https://docs.flop.network/docs/testnet-and-timeline',
  announcement: 'https://x.com/flop_labs/status/2117786153428701492',
  techflow: 'https://www.techflowpost.com/en-US/newsletter/142683',
  updates: 'https://x.com/flop_labs',
  agent: 'https://docs.flop.network/docs/agent-integration',
  api: 'https://api.flop.network/openapi.json',
  airdrop: 'https://docs.flop.network/docs/airdrop-and-testnet-conversion',
  official: 'https://docs.flop.network/docs/official-links',
  imd: 'https://imd.fun/docs/',
};

type SwarmCounts = { agentsOnline: number; seatsEnrolled: number };
type Observation<T> = { value: T; live: boolean; date: string; pending: boolean };
const reportDate = '2026-11-07T00:00:00Z';
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

async function readOnce<T>(url: string, parse: (value: unknown) => T): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('Use the dated snapshot');
    return parse(await response.json());
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseSwarm(value: unknown): SwarmCounts {
  const health = (value as { health?: Partial<SwarmCounts> } | null)?.health;
  if (!isCount(health?.agentsOnline) || !isCount(health?.seatsEnrolled)) {
    throw new Error('Use the dated snapshot');
  }
  return { agentsOnline: health.agentsOnline, seatsEnrolled: health.seatsEnrolled };
}

function parseModels(value: unknown): number {
  const catalog = value as { data?: unknown[]; total_count?: unknown } | null;
  if (!Array.isArray(catalog?.data)) throw new Error('Use the dated snapshot');
  if (!catalog.data.every((model) => typeof model === 'object' && model !== null && 'id' in model && typeof model.id === 'string')) {
    throw new Error('Use the dated snapshot');
  }
  return isCount(catalog.total_count) && catalog.total_count >= catalog.data.length
    ? catalog.total_count
    : catalog.data.length;
}

// One mount, one attempt per endpoint. There is no polling, enrollment or retry.
export function useNetworkCounts() {
  const [swarm, setSwarm] = useState<Observation<SwarmCounts>>({
    value: snapshot, live: false, date: snapshot.at, pending: true,
  });
  const [models, setModels] = useState<Observation<number>>({
    value: 1, live: false, date: reportDate, pending: true,
  });
  useEffect(() => {
    let active = true;
    void readOnce(links.swarm, parseSwarm).then(
      (value) => { if (active) setSwarm({ value, live: true, date: new Date().toISOString(), pending: false }); },
      () => { if (active) setSwarm((old) => ({ ...old, pending: false })); },
    );
    void readOnce(links.models, parseModels).then(
      (value) => { if (active) setModels({ value, live: true, date: new Date().toISOString(), pending: false }); },
      () => { if (active) setModels((old) => ({ ...old, pending: false })); },
    );
    return () => { active = false; };
  }, []);
  return { swarm, models };
}

export function dateLabel(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}
