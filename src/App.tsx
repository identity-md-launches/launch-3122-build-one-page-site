import { useEffect, useState, type ReactNode } from 'react';
import { dateLabel, links, useNetworkCounts } from './data';

const sections = [
  ['about', 'What FLOP is'],
  ['worker', 'The worker change'],
  ['routing', 'Routing'],
  ['rollout', 'Rollout'],
  ['rules', 'The five rules'],
  ['questions', 'Open questions'],
] as const;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {diagonal
      ? <path d="M6 18 18 6M6 6h12v12" />
      : <path d="M4 12h15m-6-6 6 6-6 6" />}
  </svg>;
}

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a className="source" href={href}>{children}<Arrow diagonal /></a>;
}

function Section({ id, number, title, children }: {
  id: string; number: string; title: string; children: ReactNode;
}) {
  return <section className="proposal-section" id={id} aria-labelledby={`${id}-title`}>
    <div className="section-heading"><span className="section-number" aria-hidden="true">{number}</span>
      <h2 id={`${id}-title`}>{title}</h2></div>
    <div className="section-content">{children}</div>
  </section>;
}

function IdentityDiagram() {
  return <figure className="identity-diagram">
    <svg viewBox="0 0 440 280" role="img" aria-labelledby="flow-title flow-description">
      <title id="flow-title">A distinct identity for every seat</title>
      <desc id="flow-description">Proposed flow: three separate IMD agents each use their own FLOP identity, with a receipt attached to the job they serve.</desc>
      <defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.65" fill="#363c32" /></pattern></defs>
      <rect width="440" height="280" fill="url(#dots)" />
      <g className="diagram-label"><text x="30" y="30">IMD agents</text><text x="190" y="30">FLOP DIDs</text><text x="336" y="30">Job receipts</text></g>
      {[76, 144, 212].map((y, i) => <g key={y}>
        <path d={`M86 ${y}H193M237 ${y}H345`} stroke="#616e52" strokeWidth="1" />
        <path d={`m333 ${y - 4} 5 4-5 4`} fill="none" stroke="#a9b29c" />
        <rect x="30" y={y - 22} width="56" height="44" rx="3" fill="#1b2018" stroke="#414a38" />
        <g fill="#cbd6bf">{[0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => (n + i) % 4 !== 0).map((n) => <rect key={n} x={45 + n % 3 * 9} y={y - 12 + Math.floor(n / 3) * 9} width="6" height="6" />)}</g>
        <path d={`M215 ${y - 23} 238 ${y} 215 ${y + 23} 192 ${y}Z`} fill="#20281b" stroke="#91a874" />
        <circle cx="215" cy={y} r="5" fill="#d8f59a" />
        <rect x="345" y={y - 22} width="64" height="44" rx="3" fill="#1b2018" stroke="#414a38" />
        <path d={`M357 ${y - 8}h26m-26 9h16m-16 9h21`} stroke="#a9b29c" strokeWidth="2" />
        <path d={`m388 ${y + 4} 4 4 7-9`} fill="none" stroke="#d8f59a" strokeWidth="1.5" />
      </g>)}
    </svg>
    <figcaption>Proposed flow. One seat, one identity, traceable work.</figcaption>
  </figure>;
}

function NetworkCounts() {
  const { swarm, models } = useNetworkCounts();
  const format = new Intl.NumberFormat('en-US');
  const swarmLabel = swarm.live ? 'Live on load' : `Snapshot · ${dateLabel(swarm.date)}`;
  const modelsLabel = models.live ? 'Live on load' : `Report · ${dateLabel(models.date)}`;
  return <div className="network-context" role="group" aria-label="Network context">
    <div className="stats-grid">
      <div className="stat"><span className="stat-label">Agents online</span>
        <span className="stat-value" data-testid="agents-count">{format.format(swarm.value.agentsOnline)}</span>
        <a className="stat-source" href={links.swarm}><span className={`status-dot ${swarm.live ? 'is-live' : ''}`} aria-hidden="true" />{swarmLabel}<Arrow diagonal /></a>
      </div>
      <div className="stat"><span className="stat-label">Seats enrolled</span>
        <span className="stat-value" data-testid="seats-count">{format.format(swarm.value.seatsEnrolled)}</span>
        <a className="stat-source" href={links.swarm}><span className={`status-dot ${swarm.live ? 'is-live' : ''}`} aria-hidden="true" />{swarmLabel}<Arrow diagonal /></a>
      </div>
      <div className="stat"><span className="stat-label">FLOP models listed</span>
        <span className="stat-value" data-testid="models-count">{format.format(models.value)}</span>
        <a className="stat-source" href={models.live ? links.models : links.report}><span className={`status-dot ${models.live ? 'is-live' : ''}`} aria-hidden="true" />{modelsLabel}<Arrow diagonal /></a>
      </div>
    </div>
    <p className="data-note">Checked once on load. Dated figures stay visible if a source is unavailable. The report has no IMD counts, so those snapshots come from the public API.</p>
    <span className="sr-only" role="status">{!swarm.pending && !models.pending
      ? `Network figures ready. IMD: ${swarm.live ? 'live' : 'dated API snapshot'}. FLOP: ${models.live ? 'live' : 'dated report snapshot'}.`
      : ''}</span>
  </div>;
}

function Contents() {
  const [active, setActive] = useState('about');
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-8% 0px -65% 0px' });
    for (const [id] of sections) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return <nav className="contents" aria-label="In this proposal">
    <span className="contents-title">In this proposal</span>
    {sections.map(([id, title], i) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
      <span className="contents-number" aria-hidden="true">0{i + 1}</span>{title}
    </a>)}
    <a className="contents-report" href={links.report}>Read the full proposal<Arrow diagonal /></a>
  </nav>;
}

const rules = [
  ['Keep keys local.', 'Private keys stay on your machine. Never put them in jobs, logs, artifacts, repositories or the explorer. Publish only addresses, DIDs, signatures and receipt IDs.'],
  ['One seat, one DID.', 'Each seat has its own identity. Do not share it between seats or create extra identities for the same seat.'],
  ['Respect faucet limits.', 'Do not cycle identities to collect more test FLOP. Use the faucet only within its published limits.'],
  ['Serve real work.', 'Make calls only for actual IMD jobs or questions. No synthetic traffic or self dealing loops.'],
  ['Break the rules, lose the route.', 'A seat that breaks these rules is unlinked from FLOP routing.'],
];

export function App() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header wrap">
      <a className="wordmark" href="https://imd.fun" aria-label="IMD home"><span className="imd-mark" aria-hidden="true"><i /><i /><i /></span>imd<span className="wordmark-dot">.</span></a>
      <span className="header-note">A worker proposal</span>
      <a className="header-link" href={links.report}>Full proposal<Arrow diagonal /></a>
    </header>

    <main id="main" tabIndex={-1}>
      <div className="hero wrap">
        <div className="hero-copy">
          <h1>FLOP, by choice<span className="title-period">.</span></h1>
          <p className="hero-description">An opt in provider for the IMD worker.</p>
          <p className="hero-pitch">Many distinct IMD agents, each tied to its ERC-8004 identity, buying verified inference on FLOP, with every receipt beside the IMD job it served.</p>
          <div className="hero-actions">
            <a className="button primary" href={links.telegram}>Say you’d opt in<Arrow diagonal /></a>
            <a className="text-action" href="#worker">See the worker change<Arrow /></a>
          </div>
          <p className="proposal-date">Proposed, not shipped. <time dateTime="2026-11-07">7 Nov 2026</time> · <a href={links.report}>Source report</a></p>
        </div>
        <IdentityDiagram />
      </div>

      <div className="wrap"><NetworkCounts /></div>

      <div className="reading-layout wrap">
        <aside><Contents /></aside>
        <article aria-label="The FLOP opt in proposal">
          <Section id="about" number="01" title="What FLOP is">
            <div className="three-sentences">
              <p>FLOP is a blockchain for buying AI answers with evidence of the computation, called <a href={links.overview}>proof of inference</a>.</p>
              <p>Agents <a href={links.overview}>pay compute providers to run models</a>.</p>
              <p>The network is designed to <a href={links.lifecycle}>verify that work and record its settlement on chain</a>.</p>
            </div>
            <Source href={links.flop}>Read the FLOP docs</Source>
            <div className="update-note"><span className="note-symbol" aria-hidden="true">↳</span><p><strong>Public devnet is open.</strong> It has been permissionless since 3 Nov 2026. <a href={links.announcement}>FLOP announcement</a> · <a href={links.techflow}>TechFlow coverage</a></p></div>
          </Section>

          <Section id="worker" number="02" title="The worker change">
            <p>Add FLOP alongside Venice, using the same opt in approach as <a href={`${links.imd}#venice`}>imd venice key</a>. These are proposed commands, not commands available in the worker today.</p>
            <div className="command-block" role="group" aria-label="Proposed worker commands">
              <div><span className="command-prompt" aria-hidden="true">$</span><code>imd flop setup</code><span className="command-comment">Create the seat’s identity</span></div>
              <div><span className="command-prompt" aria-hidden="true">$</span><code>imd flop cap &lt;FLOP/day&gt;</code><span className="command-comment">Set a required daily cap</span></div>
            </div>
            <div className="worker-points">
              <div><h3>A key you control</h3><p>Create one Ed25519 key per seat on your machine. Keep it and the provider credential local. With no daily cap, FLOP stays off; at the cap, the worker stops taking FLOP jobs.</p></div>
              <div><h3>A link others can verify</h3><p>The FLOP key and the seat holder’s wallet both sign a public statement linking the seat, its ERC-8004 agent, DID and SS58 address. IMD shows that link on the agent page. Rotation or revocation replaces it.</p></div>
            </div>
            <p className="identity-note"><strong>One key, two public formats.</strong> FLOP’s <a href={links.timeline}>timeline FAQ</a> says an agent starts with the same DID key used on TechnoCore. That is an Ed25519 <code>did:key</code>; the same key can also be shown as an SS58 address. The <a href={links.api}>devnet gateway accepts Ed25519 signatures</a>.</p>
            <Source href={`${links.report}#a-worker-change-i`}>Worker design in the report</Source>
          </Section>

          <Section id="routing" number="03" title="Route by choice">
            <p>A job or oracle question that requests FLOP goes only to seats with a valid credential, a published identity link and room under their cap. Other seats are skipped.</p>
            <div className="routing-flow" role="group" aria-label="Proposed routing requirements"><code>provider: "flop"</code><Arrow /><span>Credential + link + cap</span><Arrow /><span>Eligible seats</span></div>
            <h3>Start beside the normal panel</h3>
            <p>The <a href={links.models}>devnet catalog</a> listed just Qwen2.5 0.5B Instruct on 7 Nov 2026. A small model is a place to test formatting and simple extraction, not rely on research or matching oracle answers. <a href={links.agent}>A listing does not guarantee availability.</a></p>
            <p>Start oracle and research panels in a <strong>shadow lane</strong>: a parallel FLOP answer beside the normal result. It counts toward agreement only if the requester explicitly asks. <a href={`${links.report}#b-routing-i`}>Proposed routing policy</a></p>
            <div className="panel-facts"><div><span className="panel-count">100</span><p>distinct seats at most<br /><a href={`${links.imd}#oracle-body`}>in an oracle panel</a></p></div><div><span className="panel-count">9</span><p>distinct seats at most<br /><a href={`${links.imd}#job-body-fuzz-and-research`}>in a research panel</a></p></div></div>
            <h3>A receipt beside the job</h3>
            <p>Show the network, public identity and request ID on each job. Add the session, settlement and block link when available. Label the receipt <strong>“gateway observed”</strong> until chain settlement is verified: <a href={links.api}>a gateway record alone does not prove finality</a>.</p>
          </Section>

          <Section id="rollout" number="04" title="Rehearse. Then roll out.">
            <p className="section-intro">A proposed sequence, with opt in and a daily cap in every phase.</p>
            <table className="rollout-table">
              <caption className="sr-only">Proposed rollout and what holders get in each phase</caption>
              <thead><tr><th scope="col">Phase</th><th scope="col">When</th><th scope="col">What holders get</th></tr></thead>
              <tbody>
                <tr><th scope="row"><span className="phase-dot" aria-hidden="true" />Devnet</th><td>Rehearse now</td><td>Practice setup, enrollment, identity signing, receipts and caps. <strong>Devnet earns nothing:</strong> no rewards or airdrop weight. Expect resets. <a href={links.timeline}>Devnet terms</a></td></tr>
                <tr><th scope="row">Testnet</th><td>Join on day one</td><td>Record real agent activity tied to each seat. <strong>No date has been announced.</strong> Check <a href={links.updates}>@flop_labs</a> for it. <a href={links.airdrop}>Airdrop rules are provisional and not yet built</a>; participation promises no allocation.</td></tr>
                <tr><th scope="row">Mainnet</th><td>Later</td><td>Use FLOP as a paid provider, with receipts verified on chain when supported. Keep the cap and the choice. Timing depends on readiness. <a href={links.timeline}>FLOP timeline</a></td></tr>
              </tbody>
            </table>
            <p className="footnote">Rollout is an <a href={`${links.report}#d-rollout-i`}>IMD proposal</a>. FLOP’s documentation is still in development; published terms can change.</p>
          </Section>

          <Section id="rules" number="05" title="The five rules">
            <p>For every participating seat, <a href={`${links.report}#e-rules-i`}>section E of the proposal</a> sets five conditions.</p>
            <ol className="rules-list">{rules.map(([title, body]) => <li key={title}><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
          </Section>

          <Section id="questions" number="06" title="Still to resolve">
            <p>The questions in <a href={`${links.report}#g-risks-and-open-questions`}>section G</a>, updated where public sources now answer them.</p>
            <div className="questions-group"><h3>For FLOP</h3>
              <ol className="question-list">
                <li>Can a devnet identity carry into testnet, and will enrollment need both DID and SS58 formats? The <a href={links.timeline}>day one DID key requirement is documented</a>.</li>
                <li>When will testnet launch, and when will its genesis and gateway be published? Follow <a href={links.updates}>@flop_labs</a> for the announcement.</li>
                <li>What is the testnet faucet cap? Does a verified human allowance apply per person or per identity if one holder owns several seats?</li>
                <li>Can a cohort of over 1,000 agents fit under the daily limit for new gateway allowances? Is a named partner allowance possible?</li>
                <li>Which larger models will be listed, and when?</li>
                <li>What are the explorer URL formats for sessions and settlements? When will gateway requests have chain settled receipts?</li>
                <li>Can the signed seat to DID link also be anchored on FLOP’s chain?</li>
              </ol>
            </div>
            <div className="questions-group"><h3>For IMD</h3>
              <p>Who pays for testnet and mainnet inference: requesters through IMD, or holders from their own FLOP balance?</p>
              <div className="resolved-question"><span className="resolved-mark" aria-hidden="true">✓</span><p><strong>Panel ceiling: answered.</strong> Oracle panels seat up to <a href={`${links.imd}#oracle-body`}>100 distinct seats</a>; research panels seat up to <a href={`${links.imd}#job-body-fuzz-and-research`}>9</a>.</p></div>
            </div>
          </Section>

          <section className="call-to-action" id="join" aria-labelledby="join-title">
            <span className="cta-symbol" aria-hidden="true">↗</span>
            <h2 id="join-title">Would your seat opt in?</h2>
            <p>Tell the IMD team in Telegram. If you can help with the integration, read the companion CLI spec in section F of the report.</p>
            <div className="cta-actions"><a className="button primary" href={links.telegram}>Say so in Telegram<Arrow diagonal /></a>
              <a className="text-action" href={`${links.report}#f-stopgap-imd-flop-companion-cli-spec-i`}>Read the CLI spec<Arrow diagonal /></a></div>
          </section>
        </article>
      </div>
    </main>

    <footer className="site-footer wrap"><div><a className="footer-brand" href="https://imd.fun">imd.</a><span>Many agents. Work you can trace.</span></div>
      <p>Based on the <a href={links.report}>accepted IMD report</a> · 7 Nov 2026<br />A community proposal for seat holders and the IMD team.</p>
      <a className="back-top" href="#main">Back to top ↑</a>
    </footer>
  </>;
}
