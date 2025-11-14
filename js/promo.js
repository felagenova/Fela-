document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAZIONE DEL POP-UP ---
    // Data e ora di cutoff: 16 Novembre 2025, ore 17:00:00
    // I mesi in JavaScript sono 0-indexed (0 = Gennaio, 10 = Novembre)
    const brunchCutoffDate = new Date(2025, 10, 16, 17, 0, 0); 

    const brunchPopup = document.getElementById('promo-popup'); // Il pop-up esistente per il brunch
    const closeBtnBrunch = document.getElementById('promo-close-btn'); // Bottone chiusura per il brunch pop-up

    const afterBrunchPopup = document.getElementById('after-brunch-promo-popup'); // Il nuovo pop-up promozionale
    const closeBtnAfterBrunch = document.getElementById('after-brunch-promo-close-btn'); // Bottone chiusura per il nuovo pop-up

    const now = new Date();

    // Funzione per mostrare un pop-up specifico e configurare il suo bottone di chiusura
    function showSpecificPopup(popupElement, closeButtonElement) {
        // Controlla se gli elementi esistono prima di procedere
        if (!popupElement || !closeButtonElement) {
            console.warn("Elementi pop-up o bottone di chiusura non trovati per il pop-up da mostrare.");
            return;
        }

        // Mostra il pop-up dopo un breve ritardo per non essere troppo aggressivo
        setTimeout(() => {
            popupElement.classList.add('visible');
        }, 1500); // 1.5 secondi
        
        // Gestisce la chiusura del pop-up
        closeButtonElement.addEventListener('click', () => {
            popupElement.classList.remove('visible');
            // Non memorizziamo il timestamp, dato che il pop-up attivo deve apparire sempre.
        });
    }

    // Decide quale pop-up mostrare in base alla data e ora corrente
    if (now < brunchCutoffDate) {
        // Se siamo prima del cutoff, mostra il pop-up del brunch
        showSpecificPopup(brunchPopup, closeBtnBrunch);
        // Assicurati che l'altro pop-up non sia visibile se per qualche motivo lo fosse
        if (afterBrunchPopup) afterBrunchPopup.classList.remove('visible');
    } else {
        // Se siamo dopo o al cutoff, mostra il nuovo pop-up promozionale
        showSpecificPopup(afterBrunchPopup, closeBtnAfterBrunch);
        // Assicurati che l'altro pop-up non sia visibile se per qualche motivo lo fosse
        if (brunchPopup) brunchPopup.classList.remove('visible');
    }

    // La logica per 'promoEventBtn' è stata rimossa in quanto il bottone è commentato nell'HTML
    // e non è stata richiesta una sua gestione specifica per questo scenario.
});