import { nextVersion, splitCommitLog } from '@core/commits.js';
import { isValid, parse } from '@core/semver.js';
import { useMemo, useState } from 'react';
import SectionHeading from '@/components/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { COMMIT_EXAMPLES, KIND_COLORS } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

const RULES = [
  ['fix: / perf:', 'patch'],
  ['feat:', 'minor'],
  ['feat!: / BREAKING CHANGE:', 'major'],
  ['docs: / ci: / chore:', 'none'],
];

function ImpactBadge({ type }) {
  return (
    <Badge className={cn('font-mono uppercase', KIND_COLORS[type ?? 'none'])}>{type ?? 'none'}</Badge>
  );
}

export default function Calculator({ currentVersion }) {
  const stable = parse(currentVersion);
  const [current, setCurrent] = useState(null);
  const [log, setLog] = useState(COMMIT_EXAMPLES.minor.join('\n'));

  // Until the user edits it, the field follows the deployed version
  const currentValue = current ?? (stable && !stable.prerelease.length ? currentVersion : '1.4.2');
  const commits = useMemo(() => splitCommitLog(log), [log]);
  const invalid = currentValue.trim() !== '' && !isValid(currentValue.trim());
  const result = invalid ? null : nextVersion(currentValue.trim() || null, commits);

  let summary = 'Add some commit messages to see the next version.';
  if (invalid) summary = `"${currentValue}" is not a valid semantic version (expected MAJOR.MINOR.PATCH).`;
  else if (commits.length && result.next)
    summary = `${result.releaseType.toUpperCase()} release ${result.current ? `from v${result.current}` : '(first release)'}`;
  else if (commits.length) summary = 'None of these commits trigger a release.';

  return (
    <section id="calculator" className="py-16">
      <SectionHeading
        eyebrow="Try it"
        color="bg-chart-4"
        title="Next-version calculator"
        description="Paste commit messages to see the version the pipeline would release. It runs the same engine as the API, in your browser."
      />

      <Card className="bg-secondary-background">
        <CardContent className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <label htmlFor="calc-current" className="font-heading">
              Current version <span className="font-base text-foreground/60">(leave blank for the first release)</span>
            </label>
            <Input
              id="calc-current"
              className="font-mono"
              placeholder="1.4.2"
              spellCheck={false}
              value={currentValue}
              onChange={(e) => setCurrent(e.target.value)}
              aria-invalid={invalid}
            />

            <label htmlFor="calc-commits" className="mt-2 font-heading">
              Commit messages <span className="font-base text-foreground/60">(one per line, or split with ---)</span>
            </label>
            <Textarea
              id="calc-commits"
              className="min-h-52 font-mono"
              spellCheck={false}
              value={log}
              onChange={(e) => setLog(e.target.value)}
            />

            <div className="mt-1 flex flex-wrap gap-3" role="group" aria-label="Load an example">
              {Object.keys(COMMIT_EXAMPLES).map((kind) => (
                <Button key={kind} variant="neutral" size="sm" onClick={() => setLog(COMMIT_EXAMPLES[kind].join('\n'))}>
                  {kind === 'none' ? 'No release' : `${kind[0].toUpperCase()}${kind.slice(1)} example`}
                </Button>
              ))}
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {RULES.map(([prefix, type]) => (
                <li key={prefix} className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-background px-3 py-2">
                  <code className="font-mono text-sm">{prefix}</code>
                  <ImpactBadge type={type === 'none' ? null : type} />
                </li>
              ))}
            </ul>
          </div>

          <div
            aria-live="polite"
            className={cn(
              'flex min-w-0 flex-col rounded-base border-2 border-border p-4 shadow-shadow sm:p-6',
              KIND_COLORS[result?.releaseType ?? 'none'],
            )}
          >
            <p className="text-sm font-heading uppercase tracking-wide">Next release</p>
            <p className="mt-2 font-mono text-5xl leading-tight font-bold wrap-anywhere sm:text-6xl">
              {result?.next ? `v${result.next}` : 'no release'}
            </p>
            <p className="mt-2 text-lg">{summary}</p>

            {result && result.commits.length > 0 && (
              <Table className="mt-6 bg-secondary-background">
                <TableHeader>
                  <TableRow className="bg-secondary-background">
                    <TableHead className="w-24 px-3 sm:px-4">Impact</TableHead>
                    <TableHead className="px-3 sm:px-4">Commit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.commits.map((commit, i) => (
                    <TableRow key={`${i}-${commit.header}`} className="bg-secondary-background">
                      <TableCell className="px-3 py-3 sm:px-4">
                        <ImpactBadge type={commit.releaseType} />
                      </TableCell>
                      <TableCell className="px-3 py-3 font-mono text-xs wrap-anywhere sm:px-4 sm:text-sm">{commit.header}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
