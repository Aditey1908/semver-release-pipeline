import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SectionHeading({ eyebrow, title, description, color = 'bg-chart-3' }) {
  return (
    <div className="mb-8 max-w-3xl">
      <Badge className={cn('mb-3 px-3 py-1 text-sm font-heading uppercase tracking-wide', color)}>{eyebrow}</Badge>
      <h2 className="text-3xl tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-lg">{description}</p>}
    </div>
  );
}
