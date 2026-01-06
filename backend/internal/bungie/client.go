package bungie

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	BaseURL = "https://www.bungie.net"
	APIBase = "https://www.bungie.net/Platform"
)

type Client struct {
	httpClient *http.Client
	apiKey     string
}

func NewClient() (*Client, error) {
	apiKey := os.Getenv("BUNGIE_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("BUNGIE_API_KEY environment variable is required")
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		apiKey: apiKey,
	}, nil
}

func (c *Client) doRequest(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

type ManifestResponse struct {
	Response struct {
		JsonWorldContentPaths map[string]string `json:"jsonWorldContentPaths"`
		Version               string            `json:"version"`
	} `json:"Response"`
}

func (c *Client) GetManifest() (*ManifestResponse, error) {
	data, err := c.doRequest(APIBase + "/Destiny2/Manifest/")
	if err != nil {
		return nil, err
	}

	var manifest ManifestResponse
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, err
	}

	return &manifest, nil
}

func (c *Client) DownloadContent(path string) ([]byte, error) {
	url := BaseURL + path
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed with status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}
