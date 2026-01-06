package models

type WeaponStats struct {
	Impact      int `json:"impact"`
	Range       int `json:"range"`
	Stability   int `json:"stability"`
	Handling    int `json:"handling"`
	ReloadSpeed int `json:"reloadSpeed"`
	RPM         int `json:"rpm"`
	Magazine    int `json:"magazine"`
}

type Perk struct {
	Name               string `json:"name"`
	Description        string `json:"description"`
	Icon               string `json:"icon"`
	ItemTypeDisplayName string `json:"itemTypeDisplayName"`
	PlugCategoryIdentifier string `json:"plugCategoryIdentifier"`
}

type PerkCategory struct {
	Category string `json:"category"`
	Perks    []Perk `json:"perks"`
}

type Weapon struct {
	Hash       uint32         `json:"hash"`
	Name       string         `json:"name"`
	Icon       string         `json:"icon"`
	Element    string         `json:"element"`
	Rarity     string         `json:"rarity"`
	Stats      WeaponStats    `json:"stats"`
	PerkGroups []PerkCategory `json:"perkGroups"`
}

var DamageTypes = map[int]string{
	0: "None",
	1: "Kinetic",
	2: "Arc",
	3: "Solar",
	4: "Void",
	5: "Raid",
	6: "Stasis",
	7: "Strand",
}

var TierTypes = map[int]string{
	0: "Unknown",
	1: "Currency",
	2: "Common",
	3: "Uncommon",
	4: "Rare",
	5: "Legendary",
	6: "Exotic",
}

// Stat hash constants from Bungie API
var StatHashes = map[uint32]string{
	4284893193: "rpm",
	4043523819: "impact",
	1240592695: "range",
	155624089:  "stability",
	943549884:  "handling",
	4188031367: "reloadSpeed",
	3871231066: "magazine",
}

// Socket category hashes for weapon perks
var SocketCategoryNames = map[uint32]string{
	3956125808: "Intrinsic",
	4241085061: "Barrel",
	1806783418: "Magazine",
	2685412949: "Perks",
	2048875504: "Perks",
	3201856887: "Origin",
	1093090108: "Masterwork",
}
