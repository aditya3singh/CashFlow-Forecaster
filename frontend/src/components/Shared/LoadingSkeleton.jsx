/**
 * LoadingSkeleton — shimmer-based loading placeholder.
 *
 * Usage:
 *   <LoadingSkeleton variant="chart" />
 *   <LoadingSkeleton variant="card" />
 *   <LoadingSkeleton variant="text" count={3} />
 */

export default function LoadingSkeleton({ variant = 'text', count = 1, style }) {
  if (variant === 'chart') {
    return <div className="skeleton skeleton-chart" style={style} />;
  }

  if (variant === 'card') {
    return <div className="skeleton skeleton-card" style={style} />;
  }

  if (variant === 'title') {
    return <div className="skeleton skeleton-title" style={style} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === count - 1 && count > 1 ? '70%' : '100%', ...style }}
        />
      ))}
    </div>
  );
}
