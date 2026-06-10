'use client';
import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  Building2,
  Code,
  HeartHandshake,
  Users,
  Webhook,
  AppWindow,
} from 'lucide-react';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { cn } from '@/lib/cn';
import { HomeSearchTrigger } from './search-trigger';

export type Role = 'ngo' | 'agency' | 'platform';

export interface AreaCard {
  slug: string;
  title: string;
  description: string;
  href: string;
}

export interface RoleLink {
  title: string;
  description: string;
  href: string;
}

export interface RoleContent {
  id: Role;
  label: string;
  tagline: string;
  links: RoleLink[];
}

export interface LandingContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    cta: string;
  };
  audienceLabel: string;
  roles: RoleContent[];
  areasHeading: string;
  areas: AreaCard[];
  docsHref: string;
}

const roleIcons: Record<Role, ComponentType<{ className?: string }>> = {
  ngo: HeartHandshake,
  agency: Building2,
  platform: Users,
};

// Icon per documentation area, keyed by folder slug (matches lib/layout.shared areas).
const areaIcons: Record<string, ComponentType<{ className?: string }>> = {
  '': AppWindow,
  api: Webhook,
  sdk: Code,
  integrationen: Blocks,
};

export function Landing({ content }: { content: LandingContent }) {
  const [activeRole, setActiveRole] = useState<Role>(content.roles[0]?.id ?? 'ngo');
  const role = content.roles.find((r) => r.id === activeRole) ?? content.roles[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:py-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-5 text-center">
        <span className="rounded-full border border-fd-border bg-fd-secondary px-3 py-1 text-xs font-medium text-fd-muted-foreground">
          {content.hero.eyebrow}
        </span>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {content.hero.title}
        </h1>
        <p className="max-w-xl text-fd-muted-foreground">{content.hero.subtitle}</p>
        <HomeSearchTrigger placeholder={content.hero.searchPlaceholder} className="mt-2" />
        <Link
          href={content.docsHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary hover:underline"
        >
          {content.hero.cta}
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Audience switcher */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-fd-muted-foreground">{content.audienceLabel}</p>
          <div
            role="tablist"
            aria-label={content.audienceLabel}
            className="inline-flex flex-wrap justify-center gap-2 rounded-full border border-fd-border bg-fd-secondary p-1"
          >
            {content.roles.map((r) => {
              const Icon = roleIcons[r.id];
              const selected = r.id === activeRole;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveRole(r.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    selected
                      ? 'bg-fd-primary text-fd-primary-foreground shadow-sm'
                      : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {role && (
          <>
            <p className="text-center text-fd-muted-foreground">{role.tagline}</p>
            <Cards>
              {role.links.map((link) => (
                <Card
                  key={link.href}
                  title={link.title}
                  description={link.description}
                  href={link.href}
                />
              ))}
            </Cards>
          </>
        )}
      </section>

      {/* Dashboard: the four standard areas */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">{content.areasHeading}</h2>
        <Cards>
          {content.areas.map((area) => {
            const Icon = areaIcons[area.slug];
            return (
              <Card
                key={area.slug}
                icon={Icon ? <Icon /> : undefined}
                title={area.title}
                description={area.description}
                href={area.href}
              />
            );
          })}
        </Cards>
      </section>
    </div>
  );
}
