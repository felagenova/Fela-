document.addEventListener('DOMContentLoaded', () => {
    const brunchPopup = document.getElementById('promo-popup');
    const closeBtnBrunch = document.getElementById('promo-close-btn');
    const unTavoloBtn = document.getElementById('un-tavolo-btn');
    const backendBaseUrl = 'http://127.0.0.1:8000'; // Assicurati che questo sia l'URL corretto per produzione/sviluppo

    // Funzione per mostrare il pop-up del brunch
    function showBrunchPopup() {
        if (!brunchPopup || !closeBtnBrunch) {
            console.warn("Elementi del pop-up del brunch non trovati.");
            return;
        }
        // Mostra il pop-up dopo un breve ritardo
        setTimeout(() => {
            brunchPopup.classList.add('visible');
        }, 1500);
    }

    // Gestisce la chiusura del pop-up
    if (closeBtnBrunch) {
        closeBtnBrunch.addEventListener('click', () => {
            brunchPopup.classList.remove('visible');
        });
    }

    // Mostra sempre e solo il pop-up del brunch
    showBrunchPopup();

    // --- Logica per il "risveglio" del backend di Render ---
    if (unTavoloBtn) {
        unTavoloBtn.addEventListener('click', function(event) {
            // 1. Impedisce al link di navigare immediatamente
            event.preventDefault();

            // L'URL di destinazione del link
            const destinationUrl = this.href;

            // 2. Invia una richiesta "ping" a un endpoint leggero del backend.
            //    Usiamo /api/bookable-events perché è la prima chiamata che la pagina di prenotazione farà.
            //    Non abbiamo bisogno di attendere la risposta (fire and forget).
            console.log('Invio richiesta di "wake-up" al backend...');
            fetch(`${backendBaseUrl}/api/bookable-events`).catch(err => {
                // Ignoriamo gli errori, l'importante è aver inviato la richiesta.
                console.warn('La richiesta di wake-up potrebbe essere fallita, ma la navigazione procede.', err);
            });

            // 3. Reindirizza immediatamente l'utente alla pagina di prenotazione.
            //    Il backend si "sveglierà" in background mentre il browser carica la nuova pagina.
            window.location.href = destinationUrl;
        });
    }
});