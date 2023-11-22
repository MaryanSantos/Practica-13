const CACHE = 'CACHE-MSC';
const CACHE_DINAMICO = 'DIMANICO-MS';
const CACHE_INMUTABLE = 'INMUTABLE-MS';

self.addEventListener('install', evento => {
    const promesa = caches.open(CACHE)
        .then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/styles.css',
                '/css/icons.css',
                '/css/londinium-theme.css',
                '/css/googleapi.css',
                '/js/app.js',
                '/images/no-img.png',
                '/images/luisr.png',
                '/offline.html'
            ]);
        });

    const cacheInmutable = caches.open(CACHE_INMUTABLE)
        .then(cache => {
            cache.add('css/bootstrap.min.css');
        });

    evento.waitUntil(Promise.all([promesa, cacheInmutable]));
});

self.addEventListener('activate', evento => {
    const respuesta = caches.keys().then(keys => {
        keys.forEach(key => {
            if (key !== CACHE && key.includes('cache')) {
                return caches.delete(key);
            }
        });
    });
    evento.waitUntil(respuesta);
});

self.addEventListener('fetch', evento => {
    const respuesta = caches.match(evento.request)
        .then(res => {
            if (res) {
                return res;
            }

            console.log('No existe', evento.request.url);

            return fetch(evento.request)
                .then(resWeb => {
                    if (evento.request.url.includes('/images/luisr.png')) {
                        // Si la solicitud es para la imagen "luisr.png" (ósea la imagen que elegí) y no está en caché,
                        // se devuelve la imagen de reemplazo ("/images/no-img.jpg").
                        return caches.open(CACHE_DINAMICO)
                            .then(cache => {
                                cache.put(evento.request, resWeb.clone());
                                limpiarCache(CACHE_DINAMICO, 5);
                                return resWeb.clone();
                            })
                            .catch(error => {
                                console.error('Error al agregar la imagen de reemplazo a la caché:', error);
                                return resWeb.clone();
                            });
                    } else {
                        // Si la solicitud no es para "luisr.png" (ósea la imagen que elegí), se almacena en caché dinámico.
                        caches.open(CACHE_DINAMICO)
                            .then(cache => {
                                cache.put(evento.request, resWeb.clone());
                                limpiarCache(CACHE_DINAMICO, 5);
                            });
                        return resWeb.clone();
                    }
                })
                .catch(error => {
                    console.error('Error al obtener la respuesta de la red:', error);
                    if (evento.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    } else if (evento.request.headers.get('accept').includes('image')) {
                        return caches.match('/images/no-img.png');
                    }
                });
        });

    evento.respondWith(respuesta);
});

function limpiarCache(nombreCache, numeroItems) {
    caches.open(nombreCache)
        .then(cache => {
            return cache.keys()
                .then(keys => {
                    if (keys.length > numeroItems) {
                        cache.delete(keys[0])
                            .then(() => limpiarCache(nombreCache, numeroItems));
                    }
                });
        });
}

//La razón por la cuál se eligió la estrategia anterior fué por que es la que más se adapta a la implemetación de los 
//requerimientos que se solicitarón.

//La ventaja es que puede almacenar información para posteriormente mostrarla sin la necesidad de tener conexión a internet

//La desventaja es que tiene muy límitado la cantidad de archivos que se pueden almacenar en la memoria CACHE Dinamica.