import React, { useState, useEffect } from 'react';
import { Weapon, PerkCategory, Perk } from '../types/weapon';

interface WeaponCardProps {
  weapon: Weapon;
}

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  textColor: string;
}

const elementSymbols: Record<string, string> = {
  Kinetic: '◆',
  Arc: '⚡',
  Solar: '☀',
  Void: '◉',
  Stasis: '❄',
  Strand: '✦',
  None: '○',
  Raid: '⬡',
};

const rarityBackgrounds: Record<string, string> = {
  Common: '#FFFFFF',
  Uncommon: '#1FAA3E',
  Rare: '#4E84D4',
  Legendary: '#522F65',
  Exotic: '#CEAE33',
};

const rarityTextColors: Record<string, string> = {
  Common: '#000000',
  Uncommon: '#FFFFFF',
  Rare: '#FFFFFF',
  Legendary: '#FFFFFF',
  Exotic: '#000000',
};

const COSMETICS_CATEGORY = 'WEAPON COSMETICS';
const WEAPON_PERKS_CATEGORY = 'WEAPON PERKS';

// Human-readable names for plugCategoryIdentifier values
const plugCategoryDisplayNames: Record<string, string> = {
  barrels: 'Barrels',
  frames: 'Frames',
  magazines: 'Magazines',
  batteries: 'Batteries',
  bowstrings: 'Bowstrings',
  arrows: 'Arrows',
  blades: 'Blades',
  guards: 'Guards',
  grips: 'Grips',
  stocks: 'Stocks',
  scopes: 'Scopes',
  tubes: 'Tubes',
  hafts: 'Hafts',
  launchers: 'Launchers',
  intrinsics: 'Intrinsic',
  origins: 'Origin Trait',
  catalysts: 'Catalyst',
  'enhancements.weapon': 'Enhanced Perks',
  // Perk columns
  'enhancements.perks.first': 'Perk 1',
  'enhancements.perks.second': 'Perk 2',
};

// Order for displaying perk subcategories
const plugCategoryOrder: string[] = [
  'intrinsics',
  'barrels',
  'bowstrings',
  'blades',
  'hafts',
  'tubes',
  'launchers',
  'scopes',
  'magazines',
  'batteries',
  'arrows',
  'guards',
  'grips',
  'stocks',
  'frames',
  'origins',
  'catalysts',
];

function groupPerksByPlugCategory(perks: Perk[]): Map<string, Perk[]> {
  const groups = new Map<string, Perk[]>();

  for (const perk of perks) {
    const category = perk.plugCategoryIdentifier || 'other';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(perk);
  }

  return groups;
}

function getPlugCategoryDisplayName(identifier: string): string {
  return plugCategoryDisplayNames[identifier] ||
    identifier.charAt(0).toUpperCase() + identifier.slice(1).replace(/[._-]/g, ' ');
}

function StatBar({ label, value, maxValue = 100, textColor }: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div style={styles.statRow}>
      <span style={{ ...styles.statLabel, color: textColor }}>{label}</span>
      <div style={styles.statBarContainer}>
        <div
          style={{
            ...styles.statBarFill,
            width: `${percentage}%`,
            backgroundColor: textColor,
          }}
        />
      </div>
      <span style={{ ...styles.statValue, color: textColor }}>{value}</span>
    </div>
  );
}

interface PerkTooltipProps {
  perk: Perk;
}

function PerkTooltip({ perk }: PerkTooltipProps) {
  return (
    <div style={styles.tooltip}>
      <h4 style={styles.tooltipTitle}>{perk.name}</h4>
      <p style={styles.tooltipDescription}>{perk.description || 'No description available.'}</p>
    </div>
  );
}

interface PerkItemProps {
  perk: Perk;
  textColor: string;
  isClickable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function PerkItem({ perk, textColor, isClickable, isSelected, onClick }: PerkItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.perkItemWrapper,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          ...styles.perkItem,
          ...(isClickable ? styles.perkItemClickable : {}),
          ...(isSelected ? styles.perkItemSelected : {}),
          ...(isHovered && isClickable ? { backgroundColor: 'rgba(0, 0, 0, 0.2)' } : {}),
        }}
        onClick={isClickable ? onClick : undefined}
      >
        {perk.icon && (
          <img src={perk.icon} alt={perk.name} style={styles.perkIcon} />
        )}
        <span style={{ ...styles.perkName, color: textColor }}>{perk.name}</span>
      </div>
      {isHovered && <PerkTooltip perk={perk} />}
    </div>
  );
}

interface PerkCategoryDisplayProps {
  category: PerkCategory;
  textColor: string;
  isExotic: boolean;
  selectedOrnament: string | null;
  onOrnamentClick?: (perk: Perk) => void;
}

function PerkCategoryDisplay({
  category,
  textColor,
  isExotic,
  selectedOrnament,
  onOrnamentClick,
}: PerkCategoryDisplayProps) {
  const isCosmetics = category.category.toUpperCase() === COSMETICS_CATEGORY;
  const isWeaponPerks = category.category.toUpperCase() === WEAPON_PERKS_CATEGORY;

  // Filter out shaders by plugCategoryIdentifier
  const filteredPerks = category.perks.filter(perk => {
    // Remove shaders
    if (perk.plugCategoryIdentifier === 'shader' ||
        perk.plugCategoryIdentifier === 'v400.plugs.weapons.masterworks.trackers') {
      return false;
    }
    return true;
  });

  // Check if there are any ornaments in the cosmetics category
  const hasOrnaments = isCosmetics && filteredPerks.some(perk =>
    perk.name.toLowerCase().includes('ornament') || perk.name.toLowerCase().includes('default')
  );

  // Ornaments are clickable for all weapon tiers
  const isClickable = isCosmetics && (isExotic || hasOrnaments);

  // Don't render the category if no perks after filtering
  if (filteredPerks.length === 0) {
    return null;
  }

  // For WEAPON PERKS, group by plugCategoryIdentifier
  if (isWeaponPerks) {
    const groupedPerks = groupPerksByPlugCategory(filteredPerks);

    // Sort the groups by the defined order
    const sortedCategories = Array.from(groupedPerks.keys()).sort((a, b) => {
      const indexA = plugCategoryOrder.indexOf(a);
      const indexB = plugCategoryOrder.indexOf(b);
      // If not in order list, put at end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    return (
      <div style={styles.perkCategory}>
        <h4 style={{ ...styles.perkCategoryTitle, color: textColor }}>
          {category.category}
        </h4>
        <div style={styles.subcategoriesContainer}>
          {sortedCategories.map(plugCategory => {
            const perks = groupedPerks.get(plugCategory)!;
            return (
              <div key={plugCategory} style={styles.subcategory}>
                <span style={{ ...styles.subcategoryTitle, color: textColor }}>
                  {getPlugCategoryDisplayName(plugCategory)}
                </span>
                <div style={styles.perkList}>
                  {perks.map((perk, index) => (
                    <PerkItem
                      key={`${perk.name}-${index}`}
                      perk={perk}
                      textColor={textColor}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.perkCategory}>
      <h4 style={{ ...styles.perkCategoryTitle, color: textColor }}>
        {category.category}
        {isClickable && (
          <span style={styles.clickHint}> (click to preview)</span>
        )}
      </h4>
      <div style={styles.perkList}>
        {filteredPerks.map((perk, index) => {
          // For non-exotic, only ornaments are clickable
          const perkIsClickable = isCosmetics && (
            isExotic ||
            perk.name.toLowerCase().includes('ornament') ||
            perk.name.toLowerCase().includes('default')
          );

          return (
            <PerkItem
              key={`${perk.name}-${index}`}
              perk={perk}
              textColor={textColor}
              isClickable={perkIsClickable}
              isSelected={perkIsClickable && selectedOrnament === perk.icon}
              onClick={perkIsClickable ? () => onOrnamentClick?.(perk) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

export function WeaponCard({ weapon }: WeaponCardProps) {
  const { stats, perkGroups } = weapon;
  const elementSymbol = elementSymbols[weapon.element] || '○';
  const isExotic = weapon.rarity === 'Exotic';

  const backgroundColor = rarityBackgrounds[weapon.rarity] || '#333';
  const textColor = rarityTextColors[weapon.rarity] || '#FFFFFF';

  // State for selected ornament
  const [selectedOrnament, setSelectedOrnament] = useState<string | null>(null);

  // Reset ornament when weapon changes
  useEffect(() => {
    setSelectedOrnament(null);
  }, [weapon.hash]);

  const displayedIcon = selectedOrnament || weapon.icon;

  const handleOrnamentClick = (perk: Perk) => {
    // If "Default" ornament is clicked, reset to original icon
    if (perk.name.toLowerCase().includes('default')) {
      setSelectedOrnament(null);
      return;
    }

    if (perk.icon) {
      // Toggle: if same ornament clicked, reset to default
      if (selectedOrnament === perk.icon) {
        setSelectedOrnament(null);
      } else {
        setSelectedOrnament(perk.icon);
      }
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        backgroundColor,
        color: textColor,
      }}
    >
      {/* Top section: Icon + Stats side by side */}
      <div style={styles.topSection}>
        {/* Left side: Icon and basic info */}
        <div style={styles.leftSection}>
          <div style={styles.iconContainer}>
            <img src={displayedIcon} alt={weapon.name} style={styles.icon} />
          </div>
          <div style={styles.info}>
            <span style={styles.element}>
              <span style={styles.elementSymbol}>{elementSymbol}</span>
              {weapon.element}
            </span>
            <span style={styles.name}>{weapon.name}</span>
          </div>
        </div>

        {/* Right side: Stats */}
        <div style={styles.rightSection}>
          <div style={styles.statsHeader}>
            <span>{stats.rpm} RPM</span>
            <span>{stats.magazine} Mag</span>
          </div>
          <div style={styles.statsGrid}>
            <StatBar label="Impact" value={stats.impact} textColor={textColor} />
            <StatBar label="Range" value={stats.range} textColor={textColor} />
            <StatBar label="Stability" value={stats.stability} textColor={textColor} />
            <StatBar label="Handling" value={stats.handling} textColor={textColor} />
            <StatBar label="Reload" value={stats.reloadSpeed} textColor={textColor} />
          </div>
        </div>
      </div>

      {/* Bottom section: Perks */}
      {perkGroups && perkGroups.length > 0 && (
        <div style={{ ...styles.perksSection, borderTopColor: textColor === '#000000' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }}>
          <h3 style={styles.perksTitle}>Perks</h3>
          <div style={styles.perksGrid}>
            {perkGroups.map((category, index) => (
              <PerkCategoryDisplay
                key={`${category.category}-${index}`}
                category={category}
                textColor={textColor}
                isExotic={isExotic}
                selectedOrnament={selectedOrnament}
                onOrnamentClick={handleOrnamentClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    maxWidth: '600px',
    width: '100%',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '40px',
    width: '100%',
    justifyContent: 'center',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '15px',
  },
  icon: {
    width: '96px',
    height: '96px',
    objectFit: 'contain',
    transition: 'opacity 0.2s ease',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  element: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
    textTransform: 'uppercase',
  },
  elementSymbol: {
    marginRight: '8px',
    fontSize: '20px',
  },
  name: {
    fontSize: '20px',
    fontWeight: '600',
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '250px',
  },
  statsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
    opacity: 0.9,
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statLabel: {
    width: '70px',
    fontSize: '13px',
    fontWeight: '500',
  },
  statBarContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  statValue: {
    width: '30px',
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  // Perks section
  perksSection: {
    width: '100%',
    borderTop: '1px solid',
    paddingTop: '20px',
    marginTop: '20px',
  },
  perksTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 0 15px 0',
  },
  perksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  perkCategory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  perkCategoryTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    opacity: 0.8,
    margin: 0,
    borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
    paddingBottom: '5px',
  },
  clickHint: {
    fontSize: '11px',
    fontWeight: 'normal',
    textTransform: 'none',
    opacity: 0.7,
  },
  perkList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  subcategoriesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  subcategory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  subcategoryTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
    letterSpacing: '0.5px',
  },
  perkItemWrapper: {
    position: 'relative',
  },
  perkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    cursor: 'help',
    transition: 'background-color 0.15s, transform 0.15s',
  },
  perkItemClickable: {
    cursor: 'pointer',
  },
  perkItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    boxShadow: '0 0 0 2px currentColor',
  },
  perkIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
  },
  perkName: {
    fontSize: '13px',
    fontWeight: '500',
  },
  // Tooltip styles
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
    padding: '12px 16px',
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    border: '2px solid #FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    minWidth: '200px',
    maxWidth: '300px',
    textAlign: 'left',
  },
  tooltipTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tooltipDescription: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.4',
    color: '#CCCCCC',
  },
};
