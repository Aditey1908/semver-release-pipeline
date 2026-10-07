import { ArrowRight, Calculator, Clock, GitCommitHorizontal, Server, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, isReleasedVersion } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className={cn('gap-0 py-5', color)}>
      <CardContent className="px-4 sm:px-5">
        <div className="flex items-center gap-2 text-xs font-heading uppercase tracking-wide sm:text-sm">
          <span className="grid size-8 place-items-center rounded-base border-2 border-border bg-secondary-background">
            <Icon className="size-4" />
          </span>
          {label}
        </div>
        <p className="mt-4 font-mono text-base font-bold wrap-anywhere sm:text-xl">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function Hero({ data }) {
  const { status, build, live, error } = data;
  const version = build ? `v${build.version}` : '…';
  const released = build && isReleasedVersion(build.version);

  let subtitle = 'Loading build information…';
  if (status === 'error') subtitle = `Could not load build information: ${error.message}`;
  else if (build && released) subtitle = `Built from commit ${build.commit} on ${formatDate(build.buildDate)}.`;
  else if (build) subtitle = 'Local development build: no release has been cut from this checkout.';

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
      <div>
        <Badge className="bg-chart-3 px-3 py-1 text-sm font-heading uppercase tracking-wide">Currently deployed</Badge>
        <h1 className="mt-5 font-mono text-6xl leading-none tracking-tighter wrap-anywhere sm:text-8xl">{version}</h1>
        <p className="mt-5 text-lg">{subtitle}</p>
        <p className="mt-2 text-lg">
          Nobody picked this number. The pipeline calculated it from Conventional Commits, tagged it in Git, and shipped
          it.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {released && build.repository && (
            <a href={`${build.repository}/releases/tag/${version}`} className={buttonVariants({ size: 'lg' })}>
              Release notes
              <ArrowRight />
            </a>
          )}
          <a href="#calculator" className={buttonVariants({ variant: 'neutral', size: 'lg' })}>
            <Calculator />
            Predict the next version
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        <StatCard icon={Tag} label="Git tag" value={version} color="bg-main" />
        <StatCard icon={GitCommitHorizontal} label="Commit" value={build?.commit ?? '…'} color="bg-chart-3" />
        <StatCard icon={Clock} label="Built" value={formatDate(build?.buildDate)} color="bg-chart-4" />
        <StatCard
          icon={Server}
          label="Runtime"
          value={live ? `Docker · Node ${live.node.replace(/^v/, '')}` : status === 'ready' ? 'Static site' : '…'}
          color="bg-chart-2"
        />
      </div>
    </section>
  );
}
