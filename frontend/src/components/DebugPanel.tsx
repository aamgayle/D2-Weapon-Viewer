import React from 'react';

interface DebugPanelProps {
  data: unknown;
  title?: string;
}

export function DebugPanel({ data, title = 'API Response' }: DebugPanelProps) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{title}</h3>
      <pre style={styles.json}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#2a2a3e',
    color: '#FFFFFF',
    maxHeight: '800px',
    overflow: 'hidden',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 15px 0',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  json: {
    margin: 0,
    padding: '15px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    overflow: 'auto',
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.5',
  },
};
