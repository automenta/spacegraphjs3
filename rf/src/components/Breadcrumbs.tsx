import type { AppNode } from '../nodes/types';
import '../styles/Breadcrumbs.css';

interface BreadcrumbsProps {
  path: string[];
  nodes: AppNode[];
  onNavigate: (path: string[]) => void;
}

const Breadcrumbs = ({ path, nodes, onNavigate }: BreadcrumbsProps) => {
  const handleNavigation = (index: number) => {
    onNavigate(path.slice(0, index));
  };

  return (
    <div className="breadcrumbs-container">
      <button onClick={() => handleNavigation(0)} className="breadcrumb-button">
        Home
      </button>
      {path.map((nodeId, index) => {
        const node = nodes.find((n) => n.id === nodeId);
        return (
          <span key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="breadcrumb-separator">/</span>
            <button onClick={() => handleNavigation(index + 1)} className="breadcrumb-button">
              {node?.data.label || 'Unknown'}
            </button>
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;