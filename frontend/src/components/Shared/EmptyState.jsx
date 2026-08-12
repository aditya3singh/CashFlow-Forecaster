/**
 * EmptyState — friendly placeholder when no data exists.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Wallet size={48} />}
 *     title="No transactions yet"
 *     description="Connect your bank to see transactions here."
 *     action={{ label: 'Connect Bank', onClick: handleConnect }}
 *   />
 */

import Button from './Button';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick} style={{ marginTop: '1rem' }}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
