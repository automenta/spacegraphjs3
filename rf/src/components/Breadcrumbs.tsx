import type { AppNode } from '../nodes/types';

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
    <div
      style={{
        position: 'absolute',
        top: '25px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: '#ffffff',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <button onClick={() => handleNavigation(0)} style={breadcrumbButtonStyle}
        onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
      >
        Home
      </button>
      {path.map((nodeId, index) => {
        const node = nodes.find((n) => n.id === nodeId);
        return (
          <span key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aaa' }}>
            <span>/</span>
            <button onClick={() => handleNavigation(index + 1)} style={breadcrumbButtonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              {node?.data.label || 'Unknown'}
            </button>
          </span>
        );
      })}
    </div>
  );
};

const breadcrumbButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '15px',
  color: '#555',
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'background 200ms ease',
  fontWeight: 500,
};

export default Breadcrumbs;