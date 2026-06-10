'use client';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

// The languages we support for API examples, in display order. Each maps a tab
// label to the Shiki grammar used for highlighting.
const languages = [
  { key: 'curl', label: 'cURL', lang: 'bash' },
  { key: 'js', label: 'JavaScript', lang: 'js' },
  { key: 'python', label: 'Python', lang: 'python' },
  { key: 'java', label: 'Java', lang: 'java' },
] as const;

type LanguageKey = (typeof languages)[number]['key'];

export interface CodeTabsProps {
  /** Code snippets keyed by language. Only provided languages render a tab. */
  tabs: Partial<Record<LanguageKey, string>>;
}

// Tabbed code samples for API docs (curl / JS / Python / Java). Built on
// Fumadocs' Tabs + runtime Shiki highlighting so MDX authors just pass strings.
export function CodeTabs({ tabs }: CodeTabsProps) {
  const present = languages.filter(({ key }) => typeof tabs[key] === 'string');
  if (present.length === 0) return null;

  const labels = present.map(({ label }) => label);

  return (
    <Tabs items={labels}>
      {present.map(({ key, label, lang }) => (
        <Tab key={key} value={label}>
          <DynamicCodeBlock lang={lang} code={(tabs[key] ?? '').trim()} />
        </Tab>
      ))}
    </Tabs>
  );
}
