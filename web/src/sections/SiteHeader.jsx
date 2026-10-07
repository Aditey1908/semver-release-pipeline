import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ENV_COLORS } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

const LINKS = [
  ['#pipeline', 'Pipeline'],
  ['#calculator', 'Calculator'],
  ['#releases', 'Releases'],
];

export default function SiteHeader({ environment, repository }) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-border bg-secondary-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#top" className="flex items-center gap-3 text-lg font-heading">
          <span className="grid size-10 place-items-center rounded-base border-2 border-border bg-main font-mono text-xl font-bold shadow-shadow">
            v
          </span>
          <span className="hidden sm:inline">SemVer Release Pipeline</span>
        </a>

        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="hidden underline-offset-4 hover:underline md:inline">
              {label}
            </a>
          ))}
          {environment && (
            <Badge className={cn('gap-2 px-3 py-1 font-mono text-xs uppercase', ENV_COLORS[environment] ?? 'bg-secondary-background')}>
              <span className="size-2 rounded-full border border-border bg-foreground" aria-hidden="true" />
              {environment}
            </Badge>
          )}
          {repository && (
            <a href={repository} className={buttonVariants({ variant: 'neutral', size: 'sm' })}>
              Source
              <ExternalLink />
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
