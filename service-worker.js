// File: service-worker.js

/**
 * Listener per l'evento 'push'.
 * Si attiva quando arriva una notifica push dal server.
 */
self.addEventListener('push', function(event) {
    // Controlla se la notifica contiene dei dati.
    if (event.data) {
        const data = event.data.json(); // Converte i dati JSON inviati dal backend.
        
        // Opzioni per la visualizzazione della notifica.
        const options = {
            body: data.body, // Il testo principale della notifica.
            icon: 'images/appletouch_favicon_fela.png', // Icona principale (Logo Fela!)
            badge: 'images/fela_favicon.svg', // Icona piccola per la barra di stato
            vibrate: [100, 50, 100], // Pattern di vibrazione: vibra, pausa, vibra.
            data: {
                url: data.url || '/' // L'URL da aprire quando si clicca sulla notifica.
            }
        };

        // Mostra la notifica all'utente.
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 * Listener per l'evento 'notificationclick'.
 * Si attiva quando l'utente clicca sulla notifica.
 */
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Chiude la notifica.

    // Apre l'URL associato alla notifica in una nuova finestra o mette in primo piano una già esistente.
    event.waitUntil(clients.openWindow(event.notification.data.url));
});