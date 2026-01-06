package main

import (
	"destiny-weapon-search/internal/api"
	"destiny-weapon-search/internal/bungie"
	"destiny-weapon-search/internal/manifest"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Create Bungie API client
	client, err := bungie.NewClient()
	if err != nil {
		log.Fatalf("Failed to create Bungie client: %v", err)
	}

	// Determine cache directory
	cacheDir := os.Getenv("CACHE_DIR")
	if cacheDir == "" {
		cacheDir = "./cache"
	}

	// Initialize manifest cache
	cache := manifest.NewManifestCache(cacheDir)
	log.Println("Loading Destiny 2 manifest...")
	if err := cache.Load(client); err != nil {
		log.Fatalf("Failed to load manifest: %v", err)
	}

	// Create API handler
	handler := api.NewHandler(cache)

	// Setup Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	router.Use(cors.New(config))

	// Routes
	router.GET("/api/search", handler.SearchWeapons)
	router.GET("/api/health", handler.HealthCheck)

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
