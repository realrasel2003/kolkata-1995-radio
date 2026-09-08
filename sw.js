const CACHE = "kolkata-1995-v19";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./station-data.js",
  "./manifest.webmanifest",

  "./desktop.png",
  "./mobile.png",

  "./icon-192.png",
  "./icon-512.png",

  "./kolkata-demo.wav",
  "./tramline-at-dusk.wav",
  "./cassette-memories.wav",

  "./Afiya ( O j mane na mana ).mpeg.wav"
];


/* -------------------------
   INSTALL
------------------------- */

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())

  );

});


/* -------------------------
   ACTIVATE
------------------------- */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>

        Promise.all(

          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))

        )

      )
      .then(() => self.clients.claim())

  );

});


/* -------------------------
   FETCH
------------------------- */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }


  /*
    Always try the network first for
    HTML + JS + station data.

    This prevents an old version of
    the radio from staying cached.
  */

  const url =
    new URL(event.request.url);


  const isAppFile =
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/script.js") ||
    url.pathname.endsWith("/station-data.js") ||
    url.pathname.endsWith("/style.css");


  if (isAppFile) {

    event.respondWith(

      fetch(event.request)
        .then(response => {

          if (response.ok) {

            const copy =
              response.clone();

            caches
              .open(CACHE)
              .then(cache =>
                cache.put(
                  event.request,
                  copy
                )
              );

          }

          return response;

        })
        .catch(() =>
          caches.match(event.request)
        )

    );

    return;
  }


  /*
    Other assets:
    cache first, then network.
  */

  event.respondWith(

    caches
      .match(event.request)
      .then(cached => {

        if (cached) {
          return cached;
        }


        return fetch(event.request)
          .then(response => {

            if (response.ok) {

              const copy =
                response.clone();

              caches
                .open(CACHE)
                .then(cache =>
                  cache.put(
                    event.request,
                    copy
                  )
                );

            }

            return response;

          });

      })

      .catch(() =>
        caches.match("./index.html")
      )

  );

});