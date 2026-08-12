/**
 * InsightCard — reusable card for financial health tips.
 *
 * Displays an icon, title, and description with hover lift animation.
 */

export default function InsightCard({ icon, title, description, variant = 'default' }) {
  const bgClass = variant === 'success' ? 'insight-card-icon-success' : 'insight-card-icon-default';

  return (
    <div className="insight-tip-card card">
      <div className={`insight-card-icon ${bgClass}`}>
        {icon}
      </div>
      <h4 className="insight-card-title">{title}</h4>
      <p className="insight-card-description">{description}</p>
    </div>
  );
}
