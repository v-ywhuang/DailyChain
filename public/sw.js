// Service Worker for PWA
const CACHE_NAME = 'dailychain-v1'

// 安装事件 - 跳过预缓存,按需缓存
self.addEventListener('install', () => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch事件 - 网络优先,回退到缓存
self.addEventListener('fetch', (event) => {
  // 只缓存GET请求,跳过POST/PUT/DELETE等修改请求
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果是有效响应,克隆并缓存
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
        }
        return response
      })
      .catch(() => {
        // 网络失败,从缓存返回
        return caches.match(event.request)
      })
  )
})
