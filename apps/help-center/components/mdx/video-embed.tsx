'use client';
import { cn } from '@/lib/cn';

export interface VideoEmbedProps {
  /** A YouTube or Loom share/watch URL. */
  url: string;
  /** Accessible title for the iframe. */
  title?: string;
  className?: string;
}

// Turn a human-facing YouTube/Loom URL into its embeddable form. Returns null
// for anything we don't recognise so the component can fail loud-but-safe.
function toEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  // YouTube: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname.startsWith('/embed/')) return url;
    const id = parsed.searchParams.get('v');
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  // Loom: loom.com/share/<id> or loom.com/embed/<id>
  if (host === 'loom.com') {
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    return id ? `https://www.loom.com/embed/${id}` : null;
  }

  return null;
}

export function VideoEmbed({ url, title = 'Video', className }: VideoEmbedProps) {
  const embedUrl = toEmbedUrl(url);

  if (!embedUrl) {
    return (
      <p className="my-4 rounded-lg border border-fd-border bg-fd-secondary p-3 text-sm text-fd-muted-foreground">
        Video kann nicht eingebettet werden:{' '}
        <a href={url} className="text-fd-primary underline" rel="noreferrer" target="_blank">
          {url}
        </a>
      </p>
    );
  }

  return (
    <div
      className={cn(
        'relative my-4 aspect-video overflow-hidden rounded-xl border border-fd-border bg-fd-muted shadow-sm',
        className,
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
