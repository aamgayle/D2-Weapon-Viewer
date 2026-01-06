import React, { useState, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { WeaponCard } from './components/WeaponCard';
import { DebugPanel } from './components/DebugPanel';
import { Weapon } from './types/weapon';

function App() {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleSelectWeapon = useCallback((weapon: Weapon) => {
    setSelectedWeapon(weapon);
  }, []);

  return (
    <div style={styles.container}>
      {/* Debug Toggle */}
      <label style={styles.debugToggle}>
        <input
          type="checkbox"
          checked={showDebug}
          onChange={(e) => setShowDebug(e.target.checked)}
          style={styles.checkbox}
        />
        Show Debug JSON
      </label>

      <div style={styles.content}>
        <h1 style={styles.title}>Destiny 2 Weapon Search</h1>

        <SearchBar
          onSelectWeapon={handleSelectWeapon}
          isLoading={false}
        />

        {!selectedWeapon && (
          <p style={styles.message}>
            Start typing to search for a weapon
          </p>
        )}

        {selectedWeapon && (
          <div style={styles.results}>
            <WeaponCard weapon={selectedWeapon} />
            {showDebug && (
              <DebugPanel data={selectedWeapon} title="Weapon JSON" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#1a1a2e',
    color: '#FFFFFF',
    position: 'relative',
  },
  debugToggle: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#888',
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 30px 0',
  },
  message: {
    fontSize: '16px',
    marginTop: '20px',
    opacity: 0.7,
  },
  results: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '30px',
    marginTop: '30px',
  },
};

export default App;
