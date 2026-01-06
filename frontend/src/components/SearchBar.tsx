import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Weapon } from '../types/weapon';
import { searchWeapons } from '../api/weapons';

interface SearchBarProps {
  onSelectWeapon: (weapon: Weapon) => void;
  isLoading: boolean;
}

export function SearchBar({ onSelectWeapon, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Weapon[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchWeapons(query.trim());
        setSuggestions(response.results.slice(0, 10)); // Limit to 10 suggestions
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWeapon = useCallback(
    (weapon: Weapon) => {
      setQuery(weapon.name);
      setShowDropdown(false);
      setSuggestions([]);
      onSelectWeapon(weapon);
    },
    [onSelectWeapon]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search for a weapon..."
          style={styles.input}
          disabled={isLoading}
        />
        {isSearching && <span style={styles.spinner}>...</span>}

        {showDropdown && suggestions.length > 0 && (
          <div ref={dropdownRef} style={styles.dropdown}>
            {suggestions.map((weapon) => (
              <div
                key={weapon.hash}
                style={styles.dropdownItem}
                onClick={() => handleSelectWeapon(weapon)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <img
                  src={weapon.icon}
                  alt={weapon.name}
                  style={styles.dropdownIcon}
                />
                <span style={styles.dropdownName}>{weapon.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  },
  inputWrapper: {
    position: 'relative',
    width: '350px',
  },
  input: {
    padding: '12px 20px',
    fontSize: '16px',
    border: '2px solid #444',
    borderRadius: '8px',
    width: '100%',
    backgroundColor: '#2a2a3e',
    color: '#FFFFFF',
    boxSizing: 'border-box',
  },
  spinner: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0.7,
    color: '#FFFFFF',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2a2a3e',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '400px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background-color 0.15s',
  },
  dropdownIcon: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    marginRight: '12px',
  },
  dropdownName: {
    fontSize: '14px',
    fontWeight: '500',
  },
};
