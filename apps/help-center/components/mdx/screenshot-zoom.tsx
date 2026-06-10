import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ScreenshotMarker {
  /** Horizontal position as a percentage of the image width (0–100). */
  x: number;
  /** Vertical position as a percentage of the image height (0–100). */
  y: number;
  /** Tooltip text shown on hover. */
  label?: string;
}

export interface ScreenshotZoomProps {
  src: string;
  alt: string;
  /** Optional caption rendered below the image. */
  caption?: ReactNode;
  /** Optional numbered markers overlaid on the image. */
  markers?: ScreenshotMarker[];
  className?: string;
}

// A screenshot with click-to-zoom (via Fumadocs' ImageZoom) and optional numbered
// markers. Markers are non-interactive overlays so clicks fall through to zoom.
export function ScreenshotZoom({ src, alt, caption, markers, className }: ScreenshotZoomProps) {
  return (
    <figure className={cn('my-4', className)}>
      <div className="relative inline-block overflow-hidden rounded-xl border border-fd-border shadow-sm">
        <ImageZoom src={src}>
          {/* Plain <img> keeps us free of next/image sizing/domain constraints. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="block size-full" />
        </ImageZoom>
        {markers?.map((marker, index) => (
          <span
            key={index}
            title={marker.label}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            className="pointer-events-none absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-fd-primary text-xs font-semibold text-fd-primary-foreground shadow-md ring-2 ring-fd-background"
          >
            {index + 1}
          </span>
        ))}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
