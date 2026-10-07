import { ExternalLink } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KIND_COLORS, releaseKind } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

function ReleaseCard({ release, repository }) {
  const kind = releaseKind(release.version);
  const tag = `v${release.version}`;

  return (
    <Card className="bg-secondary-background">
      <CardHeader className="flex flex-wrap items-center gap-3">
        {repository ? (
          <a href={`${repository}/releases/tag/${tag}`} className="inline-flex items-center gap-2 font-mono text-2xl font-bold underline-offset-4 hover:underline">
            {tag}
            <ExternalLink className="size-4" />
          </a>
        ) : (
          <span className="font-mono text-2xl font-bold">{tag}</span>
        )}
        <Badge className={cn('font-mono uppercase', KIND_COLORS[kind])}>{kind === 'pre' ? 'pre-release' : kind}</Badge>
        {release.date && <span className="ml-auto font-mono text-sm">{release.date}</span>}
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        {release.sections.map((section) => (
          <div key={section.title}>
            <h4 className="mb-2 text-sm uppercase tracking-wide">{section.title}</h4>
            <ul className="flex flex-col gap-2">
              {section.items.map((item, i) => (
                <li key={`${i}-${item.text}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {item.scope && <Badge className="bg-chart-3 font-mono">{item.scope}</Badge>}
                  <span>{item.text}</span>
                  {item.commit && <code className="font-mono text-xs text-foreground/60">{item.commit}</code>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ReleaseHistory({ releases, repository, loading }) {
  return (
    <section id="releases" className="py-16">
      <SectionHeading
        eyebrow="Changelog"
        color="bg-chart-5"
        title="Release history"
        description="Parsed from CHANGELOG.md, which semantic-release rewrites on every release. Nothing here is typed by hand."
      />

      {!loading && releases.length === 0 && (
        <Card className="bg-secondary-background">
          <CardContent>
            No releases yet. The first <code className="font-mono">feat</code> or <code className="font-mono">fix</code> merged to{' '}
            <code className="font-mono">main</code> will publish v1.0.0.
          </CardContent>
        </Card>
      )}

      <ol className="flex flex-col gap-8 border-l-4 border-border pl-6 sm:ml-3 sm:pl-10">
        {releases.map((release) => (
          <li key={release.version} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-6 -left-[34px] size-5 rounded-full border-2 border-border sm:-left-[50px]',
                KIND_COLORS[releaseKind(release.version)],
              )}
            />
            <ReleaseCard release={release} repository={repository} />
          </li>
        ))}
      </ol>
    </section>
  );
}
