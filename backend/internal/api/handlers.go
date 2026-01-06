package api

import (
	"destiny-weapon-search/internal/manifest"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	cache *manifest.ManifestCache
}

func NewHandler(cache *manifest.ManifestCache) *Handler {
	return &Handler{cache: cache}
}

func (h *Handler) SearchWeapons(c *gin.Context) {
	query := c.Query("q")

	weapons := h.cache.Search(query)

	c.JSON(http.StatusOK, gin.H{
		"results": weapons,
		"count":   len(weapons),
	})
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":          "ok",
		"manifestVersion": h.cache.GetVersion(),
	})
}
