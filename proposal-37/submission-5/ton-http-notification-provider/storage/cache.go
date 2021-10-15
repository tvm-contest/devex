package storage

import (
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
)

type SingletonBaseCache struct {
	Cache *cache.Cache
	Name  string
	Once  sync.Once
	mu    sync.Mutex
}

var instanceBaseCache = make(map[string]*SingletonBaseCache)

func GetCacheInstance(cacheName string) *SingletonBaseCache {
	if _, ok := instanceBaseCache[cacheName]; !ok {
		cacheIns := &SingletonBaseCache{Cache: cache.New(5*time.Minute, 10*time.Minute), Name: cacheName}
		cacheIns.mu.Lock()
		cacheIns.Once.Do(func() {
			instanceBaseCache[cacheName] = cacheIns
		})
		cacheIns.mu.Unlock()
	}
	return instanceBaseCache[cacheName]
}
