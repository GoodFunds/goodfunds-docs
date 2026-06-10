import { Building2, HeartHandshake, Users } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Role = 'ngo' | 'agency' | 'platform';

interface RoleConfig {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  // Accent classes per role. fd-* tokens keep light/dark consistent; the colour
  // tints are translucent so they read on both backgrounds.
  accent: string;
}

const roles: Record<Role, RoleConfig> = {
  ngo: {
    label: 'Für NGOs',
    Icon: HeartHandshake,
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  agency: {
    label: 'Für Agenturen',
    Icon: Building2,
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  platform: {
    label: 'Für Plattform-Nutzer:innen',
    Icon: Users,
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
};

export interface RoleHintProps {
  role: Role;
  /** Override the default (German) label, e.g. for English pages. */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

// A role-specific callout. Tells NGO / agency / platform readers which parts of a
// page are relevant to them, with a distinct accent per audience.
export function RoleHint({ role, title, children, className }: RoleHintProps) {
  const config = roles[role] ?? roles.platform;
  const { Icon, accent, label } = config;

  return (
    <div className={cn('my-4 flex gap-3 rounded-xl border p-3', accent, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 text-fd-foreground">
        <p className="mb-1 text-sm font-semibold">{title ?? label}</p>
        <div className="text-sm text-fd-muted-foreground [&_p]:my-0">{children}</div>
      </div>
    </div>
  );
}
