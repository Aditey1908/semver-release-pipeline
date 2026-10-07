import { Container, GitCommitHorizontal, Rocket, ShieldCheck, Tag, TestTubeDiagonal } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STAGES = [
  {
    icon: GitCommitHorizontal,
    title: 'Commit',
    text: 'Every message follows Conventional Commits. A Git hook and CI both enforce it with commitlint.',
    color: 'bg-chart-3',
  },
  {
    icon: ShieldCheck,
    title: 'Quality gate',
    text: 'Lint, unit + API tests on Node 22 & 24, coverage thresholds, dependency audit, build, Docker smoke test.',
    color: 'bg-chart-4',
  },
  {
    icon: Tag,
    title: 'Semantic release',
    text: 'Commits since the last tag decide the version. CHANGELOG, Git tag and GitHub Release are generated.',
    color: 'bg-main',
  },
  {
    icon: Container,
    title: 'Container image',
    text: 'Multi-arch image pushed to GHCR as X.Y.Z, X.Y, X and latest, with SBOM and provenance.',
    color: 'bg-chart-5',
  },
  {
    icon: TestTubeDiagonal,
    title: 'Staging',
    text: 'The released image is deployed with Docker Compose and must report the new version.',
    color: 'bg-chart-2',
  },
  {
    icon: Rocket,
    title: 'Production',
    text: 'The same image is promoted to Render, checked again, and can be rolled back to any version.',
    color: 'bg-chart-1',
  },
];

export default function Pipeline() {
  return (
    <section id="pipeline" className="py-16">
      <SectionHeading
        eyebrow="CI/CD"
        title="How a change becomes a release"
        description="Six automated stages run on every push to main. If a stage fails, nothing after it happens."
      />
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map(({ icon: Icon, title, text, color }, index) => (
          <li key={title}>
            <Card className="h-full bg-secondary-background">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span className={cn('grid size-12 place-items-center rounded-base border-2 border-border shadow-shadow', color)}>
                    <Icon className="size-6" />
                  </span>
                  <span className="font-mono text-4xl font-bold">0{index + 1}</span>
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-base">{text}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
