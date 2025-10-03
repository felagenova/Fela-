document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAZIONE DEL POP-UP ---
    const eventDate = {
        day: 7,
        month: 9, // 9 = Ottobre (i mesi partono da 0)
        year: 2025
    };

    const popup = document.getElementById('promo-popup');
    const closeBtn = document.getElementById('promo-close-btn');

    // Se non c'è un pop-up in questa pagina, non fare nulla
    if (!popup || !closeBtn) {
        return;
    }

    // Funzione per controllare se oggi è il giorno dell'evento
    function isEventDay() {
        const today = new Date();
        return today.getDate() === eventDate.day &&
               today.getMonth() === eventDate.month &&
               today.getFullYear() === eventDate.year;
    }

    // Controlla se mostrare il pop-up
    // Lo mostra solo se è il giorno giusto E se l'utente non l'ha già chiuso in questa sessione
    if (isEventDay() && !sessionStorage.getItem('promoPopupClosed')) {
        // Mostra il pop-up dopo un breve ritardo per non essere troppo aggressivo
        setTimeout(() => {
            popup.classList.add('visible');
        }, 1500); // 1.5 secondi
    }

    // Gestisce la chiusura del pop-up
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('visible');
        // Memorizza che l'utente ha chiuso il pop-up per questa sessione
        sessionStorage.setItem('promoPopupClosed', 'true');
    });
});