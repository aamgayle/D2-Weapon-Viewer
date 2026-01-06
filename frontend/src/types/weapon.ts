export interface WeaponStats {
  impact: number;
  range: number;
  stability: number;
  handling: number;
  reloadSpeed: number;
  rpm: number;
  magazine: number;
}

export interface Perk {
  name: string;
  description: string;
  icon: string;
  itemTypeDisplayName: string;
  plugCategoryIdentifier: string;
}

export interface PerkCategory {
  category: string;
  perks: Perk[];
}

export interface Weapon {
  hash: number;
  name: string;
  icon: string;
  element: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Exotic';
  stats: WeaponStats;
  perkGroups: PerkCategory[];
}

export interface SearchResponse {
  results: Weapon[];
  count: number;
}
