package manifest

import (
	"destiny-weapon-search/internal/bungie"
	"destiny-weapon-search/internal/models"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type StatValue struct {
	Value int `json:"value"`
}

type SocketEntry struct {
	SocketTypeHash           uint32 `json:"socketTypeHash"`
	SingleInitialItemHash    uint32 `json:"singleInitialItemHash"`
	ReusablePlugSetHash      uint32 `json:"reusablePlugSetHash"`
	RandomizedPlugSetHash    uint32 `json:"randomizedPlugSetHash"`
	PreventInitializationOnVendorPurchase bool `json:"preventInitializationOnVendorPurchase"`
}

type SocketCategory struct {
	SocketCategoryHash uint32 `json:"socketCategoryHash"`
	SocketIndexes      []int  `json:"socketIndexes"`
}

type ItemDefinition struct {
	Hash              uint32 `json:"hash"`
	DisplayProperties struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	} `json:"displayProperties"`
	ItemType            int    `json:"itemType"`
	ItemSubType         int    `json:"itemSubType"`
	ItemTypeDisplayName string `json:"itemTypeDisplayName"`
	DefaultDamageType   int    `json:"defaultDamageType"`
	Inventory           struct {
		TierType int `json:"tierType"`
	} `json:"inventory"`
	Stats struct {
		Stats map[string]StatValue `json:"stats"`
	} `json:"stats"`
	Sockets struct {
		SocketEntries    []SocketEntry    `json:"socketEntries"`
		SocketCategories []SocketCategory `json:"socketCategories"`
	} `json:"sockets"`
	Plug struct {
		PlugCategoryIdentifier string `json:"plugCategoryIdentifier"`
		PlugCategoryHash       uint32 `json:"plugCategoryHash"`
	} `json:"plug"`
}

type SocketCategoryDefinition struct {
	Hash              uint32 `json:"hash"`
	DisplayProperties struct {
		Name string `json:"name"`
	} `json:"displayProperties"`
	CategoryStyle int `json:"categoryStyle"`
}

type PlugSetDefinition struct {
	Hash            uint32 `json:"hash"`
	ReusablePlugItems []struct {
		PlugItemHash uint32 `json:"plugItemHash"`
	} `json:"reusablePlugItems"`
}

type ManifestCache struct {
	mu                sync.RWMutex
	weapons           []models.Weapon
	version           string
	cacheDir          string
	itemDefs          map[uint32]ItemDefinition
	socketCategoryDefs map[uint32]SocketCategoryDefinition
	plugSetDefs       map[uint32]PlugSetDefinition
}

func NewManifestCache(cacheDir string) *ManifestCache {
	return &ManifestCache{
		cacheDir: cacheDir,
		weapons:  make([]models.Weapon, 0),
	}
}

func (m *ManifestCache) Load(client *bungie.Client) error {
	manifest, err := client.GetManifest()
	if err != nil {
		return fmt.Errorf("failed to get manifest: %w", err)
	}

	contentPath, ok := manifest.Response.JsonWorldContentPaths["en"]
	if !ok {
		return fmt.Errorf("english content path not found in manifest")
	}

	cacheFile := filepath.Join(m.cacheDir, "manifest_"+manifest.Response.Version+".json")

	var content []byte
	if _, err := os.Stat(cacheFile); os.IsNotExist(err) {
		log.Println("Downloading manifest content...")
		content, err = client.DownloadContent(contentPath)
		if err != nil {
			return fmt.Errorf("failed to download manifest content: %w", err)
		}

		if err := os.MkdirAll(m.cacheDir, 0755); err != nil {
			return fmt.Errorf("failed to create cache directory: %w", err)
		}

		if err := os.WriteFile(cacheFile, content, 0644); err != nil {
			log.Printf("Warning: failed to cache manifest: %v", err)
		} else {
			log.Printf("Manifest cached to %s", cacheFile)
		}
	} else {
		log.Println("Loading manifest from cache...")
		content, err = os.ReadFile(cacheFile)
		if err != nil {
			return fmt.Errorf("failed to read cached manifest: %w", err)
		}
	}

	return m.parseContent(content, manifest.Response.Version)
}

func (m *ManifestCache) parseContent(content []byte, version string) error {
	var data map[string]json.RawMessage
	if err := json.Unmarshal(content, &data); err != nil {
		return fmt.Errorf("failed to parse manifest JSON: %w", err)
	}

	// Parse item definitions
	itemDefsRaw, ok := data["DestinyInventoryItemDefinition"]
	if !ok {
		return fmt.Errorf("DestinyInventoryItemDefinition not found in manifest")
	}

	var itemDefs map[string]ItemDefinition
	if err := json.Unmarshal(itemDefsRaw, &itemDefs); err != nil {
		return fmt.Errorf("failed to parse item definitions: %w", err)
	}

	// Convert to uint32 keys for easier lookup
	m.itemDefs = make(map[uint32]ItemDefinition)
	for _, item := range itemDefs {
		m.itemDefs[item.Hash] = item
	}

	// Parse socket category definitions
	socketCatDefsRaw, ok := data["DestinySocketCategoryDefinition"]
	if ok {
		var socketCatDefs map[string]SocketCategoryDefinition
		if err := json.Unmarshal(socketCatDefsRaw, &socketCatDefs); err != nil {
			log.Printf("Warning: failed to parse socket category definitions: %v", err)
		} else {
			m.socketCategoryDefs = make(map[uint32]SocketCategoryDefinition)
			for _, cat := range socketCatDefs {
				m.socketCategoryDefs[cat.Hash] = cat
			}
		}
	}

	// Parse plug set definitions
	plugSetDefsRaw, ok := data["DestinyPlugSetDefinition"]
	if ok {
		var plugSetDefs map[string]PlugSetDefinition
		if err := json.Unmarshal(plugSetDefsRaw, &plugSetDefs); err != nil {
			log.Printf("Warning: failed to parse plug set definitions: %v", err)
		} else {
			m.plugSetDefs = make(map[uint32]PlugSetDefinition)
			for _, ps := range plugSetDefs {
				m.plugSetDefs[ps.Hash] = ps
			}
		}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.weapons = make([]models.Weapon, 0)
	m.version = version

	for _, item := range itemDefs {
		// itemType 3 = Weapon
		if item.ItemType != 3 {
			continue
		}

		// Skip items without names or icons
		if item.DisplayProperties.Name == "" || item.DisplayProperties.Icon == "" {
			continue
		}

		element := models.DamageTypes[item.DefaultDamageType]
		rarity := models.TierTypes[item.Inventory.TierType]

		// Only include weapons with valid rarity
		if rarity == "Unknown" || rarity == "Currency" {
			continue
		}

		// Extract stats
		stats := extractStats(item.Stats.Stats)

		// Extract perks
		perkGroups := m.extractPerks(item)

		weapon := models.Weapon{
			Hash:       item.Hash,
			Name:       item.DisplayProperties.Name,
			Icon:       bungie.BaseURL + item.DisplayProperties.Icon,
			Element:    element,
			Rarity:     rarity,
			Stats:      stats,
			PerkGroups: perkGroups,
		}

		m.weapons = append(m.weapons, weapon)
	}

	log.Printf("Loaded %d weapons from manifest version %s", len(m.weapons), version)
	return nil
}

func (m *ManifestCache) extractPerks(item ItemDefinition) []models.PerkCategory {
	perkGroups := make([]models.PerkCategory, 0)

	if len(item.Sockets.SocketCategories) == 0 {
		return perkGroups
	}

	// Map to collect perks by category name
	categoryPerks := make(map[string][]models.Perk)
	categoryOrder := []string{}

	for _, socketCat := range item.Sockets.SocketCategories {
		// Get category name
		categoryName := "Unknown"
		if catDef, ok := m.socketCategoryDefs[socketCat.SocketCategoryHash]; ok {
			categoryName = catDef.DisplayProperties.Name
		}

		// Skip certain categories
		if categoryName == "" || categoryName == "WEAPON MODS" || categoryName == "Unknown" {
			continue
		}

		// Track category order
		if _, exists := categoryPerks[categoryName]; !exists {
			categoryPerks[categoryName] = make([]models.Perk, 0)
			categoryOrder = append(categoryOrder, categoryName)
		}

		// Get perks from each socket index
		for _, socketIdx := range socketCat.SocketIndexes {
			if socketIdx >= len(item.Sockets.SocketEntries) {
				continue
			}

			socketEntry := item.Sockets.SocketEntries[socketIdx]

			// Get perks from the socket
			plugHashes := m.getPlugHashesForSocket(socketEntry)

			for _, plugHash := range plugHashes {
				if plugHash == 0 {
					continue
				}

				if plugItem, ok := m.itemDefs[plugHash]; ok {
					// Skip empty or invalid perks
					if plugItem.DisplayProperties.Name == "" {
						continue
					}

					icon := ""
					if plugItem.DisplayProperties.Icon != "" {
						icon = bungie.BaseURL + plugItem.DisplayProperties.Icon
					}

					perk := models.Perk{
						Name:                   plugItem.DisplayProperties.Name,
						Description:            plugItem.DisplayProperties.Description,
						Icon:                   icon,
						ItemTypeDisplayName:    plugItem.ItemTypeDisplayName,
						PlugCategoryIdentifier: plugItem.Plug.PlugCategoryIdentifier,
					}

					// Check if perk already exists in this category
					exists := false
					for _, existing := range categoryPerks[categoryName] {
						if existing.Name == perk.Name {
							exists = true
							break
						}
					}

					if !exists {
						categoryPerks[categoryName] = append(categoryPerks[categoryName], perk)
					}
				}
			}
		}
	}

	// Build result in order
	for _, catName := range categoryOrder {
		perks := categoryPerks[catName]
		if len(perks) > 0 {
			perkGroups = append(perkGroups, models.PerkCategory{
				Category: catName,
				Perks:    perks,
			})
		}
	}

	return perkGroups
}

func (m *ManifestCache) getPlugHashesForSocket(socketEntry SocketEntry) []uint32 {
	plugHashes := make([]uint32, 0)

	// Add the initial/default plug
	if socketEntry.SingleInitialItemHash != 0 {
		plugHashes = append(plugHashes, socketEntry.SingleInitialItemHash)
	}

	// Add reusable plugs from plug set
	if socketEntry.ReusablePlugSetHash != 0 {
		if plugSet, ok := m.plugSetDefs[socketEntry.ReusablePlugSetHash]; ok {
			for _, plug := range plugSet.ReusablePlugItems {
				plugHashes = append(plugHashes, plug.PlugItemHash)
			}
		}
	}

	// Add randomized plugs from plug set
	if socketEntry.RandomizedPlugSetHash != 0 {
		if plugSet, ok := m.plugSetDefs[socketEntry.RandomizedPlugSetHash]; ok {
			for _, plug := range plugSet.ReusablePlugItems {
				plugHashes = append(plugHashes, plug.PlugItemHash)
			}
		}
	}

	return plugHashes
}

func extractStats(statsMap map[string]StatValue) models.WeaponStats {
	stats := models.WeaponStats{}

	// Stat hash to field mapping
	for hashStr, statVal := range statsMap {
		switch hashStr {
		case "4284893193": // RPM
			stats.RPM = statVal.Value
		case "4043523819": // Impact
			stats.Impact = statVal.Value
		case "1240592695": // Range
			stats.Range = statVal.Value
		case "155624089": // Stability
			stats.Stability = statVal.Value
		case "943549884": // Handling
			stats.Handling = statVal.Value
		case "4188031367": // Reload Speed
			stats.ReloadSpeed = statVal.Value
		case "3871231066": // Magazine
			stats.Magazine = statVal.Value
		}
	}

	return stats
}

func (m *ManifestCache) Search(query string) []models.Weapon {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if query == "" {
		return []models.Weapon{}
	}

	query = strings.ToLower(query)
	results := make([]models.Weapon, 0)

	for _, weapon := range m.weapons {
		if strings.Contains(strings.ToLower(weapon.Name), query) {
			results = append(results, weapon)
		}
	}

	// Limit results to prevent overwhelming responses
	if len(results) > 50 {
		results = results[:50]
	}

	return results
}

func (m *ManifestCache) GetVersion() string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.version
}
