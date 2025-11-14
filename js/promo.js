document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAZIONE DEL POP-UP ---
    const eventDate = {
        day: 28,
        month: 10, // 10 = Novembre (i mesi partono da 0, quindi 13 Novembre)
        year: 2025 // Anno corrente
    };

    const popup = document.getElementById('promo-popup');
    const closeBtn = document.getElementById('promo-close-btn');
    const promoEventBtn = document.getElementById('promo-event-btn'); // Nuovo bottone

    // Se non c'è un pop-up in questa pagina, non fare nulla
    if (!popup || !closeBtn) {
        return;
    }

    // Funzione per controllare se la data odierna è compresa tra oggi e la data dell'evento
    function isEventDay() {
        // Per la fase di test, forziamo la visualizzazione del pop-up ignorando la data.
        // Per ripristinare il comportamento originale (mostra fino alla data dell'evento),
        // ripristina il codice commentato.
        return true;
    }

    // Funzione per controllare se il pop-up può essere mostrato di nuovo
//    function canShowPopup() {
//        const closedTimestamp = localStorage.getItem('promoPopupClosedTimestamp');
//        if (!closedTimestamp) {
//            return true; // Non è mai stato chiuso, quindi mostralo
//        }

//        const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
//        const timeSinceClosed = Date.now() - parseInt(closedTimestamp, 10);

        // Mostralo solo se sono passate più di 24 ore
//        return timeSinceClosed > twentyFourHoursInMillis;
//    }

    // Controlla se mostrare il pop-up
    // Lo mostra solo se è nel periodo giusto E se sono passate più di 24 ore dall'ultima chiusura
//    if (isEventDay() && canShowPopup()) {
        // Mostra il pop-up dopo un breve ritardo per non essere troppo aggressivo
//        setTimeout(() => {
//            popup.classList.add('visible');
//        }, 1500); // 1.5 secondi
//    }

    // Gestisce la chiusura del pop-up
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('visible');
        // Memorizza il timestamp esatto della chiusura
        localStorage.setItem('promoPopupClosedTimestamp', Date.now().toString());
    });

    // Gestisce il click sul nuovo bottone per mostrare il pop-up
    if (promoEventBtn) {
        promoEventBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Previene il comportamento di default del bottone
            popup.classList.add('visible');

            // Tracciamento evento Google Analytics per il click sul bottone dell'evento
            if (typeof gtag === 'function') {
                gtag('event', 'show_popup_bttn', {
                    'event_category': 'Promotion',
                    'event_label': 'Click su bottone Fela meets La Pesa'
                });
            }
            // Non impostiamo localStorage qui, l'utente vuole vederlo on-demand
        });
    }
});