import { useEffect, useState } from 'react';
import Marquee from '@/components/ui/marquee';
import { getJson } from '@/lib/dashboard';
import Calculator from '@/sections/Calculator';
import Hero from '@/sections/Hero';
import Pipeline from '@/sections/Pipeline';
import ReleaseHistory from '@/sections/ReleaseHistory';
import SiteFooter from '@/sections/SiteFooter';
import SiteHeader from '@/sections/SiteHeader';

/**
 * Loads what the pipeline baked into this build. The live API only exists when
 * served by the container; on GitHub Pages the dashboard is static.
 */
function useDashboardData() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getJson('./build-info.json'),
      getJson('./api/version').catch(() => null),
      getJson('./releases.json').catch(() => []),
    ])
      .then(([build, live, releases]) => !cancelled && setState({ status: 'ready', build, live, releases }))
      .catch((error) => !cancelled && setState({ status: 'error', error }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export default function App() {
  const data = useDashboardData();
  const build = data.build ?? null;
  const environment = data.live ? data.live.environment : data.status === 'ready' ? 'github-pages' : null;

  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader environment={environment} repository={build?.repository} />
      <main className="flex-1">
        <Hero data={data} />
        <Marquee
          items={[
            'SEMANTIC VERSIONING ✦',
            'GIT TAGS ✦',
            'CONVENTIONAL COMMITS ✦',
            'AUTO CHANGELOG ✦',
            'DOCKER → GHCR ✦',
            'STAGING → PRODUCTION ✦',
            'ONE-CLICK ROLLBACK ✦',
          ]}
        />
        <div className="mx-auto w-full max-w-6xl px-4">
          <Pipeline />
          <Calculator currentVersion={build?.version} />
          <ReleaseHistory releases={data.releases ?? []} repository={build?.repository} loading={data.status === 'loading'} />
        </div>
      </main>
      <SiteFooter repository={build?.repository} />
    </div>
  );
}
