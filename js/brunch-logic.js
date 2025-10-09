document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURAZIONE ---
    // Imposta qui la data del prossimo brunch.
    // NOTA: i mesi in JavaScript partono da 0 (Gennaio=0, Febbraio=1, ..., Ottobre=9, etc.)
    const BRUNCH_DATE = {
        day: 9,
        month: 9, // 5 = Giugno
        year: 2024
    };

    // Link a cui il pulsante punterà quando è attivo.
    const brunchActiveLink = 'brunch.html';

    // --- ELEMENTI DEL DOM (Pulsante Home, Link Nav, Popup) ---
    const brunchHomeBtn = document.getElementById('brunch-btn');
    const brunchNavlink = document.getElementById('brunch-nav-link');
    const brunchPopup = document.getElementById('brunch-popup');
    const closePopupBtn = document.getElementById('brunch-close-btn');

    // --- FUNZIONI ---

    // Funzione per controllare se oggi è il giorno del brunch
    function isBrunchDay() {
        const today = new Date();
        
        // --- MESSAGGI DI DEBUG ---
        // Questi messaggi appariranno nella console del browser (tasto F12)
        // e ci aiuteranno a capire il problema.
        console.log("--- Controllo Data Brunch ---");
        console.log(`Data di oggi (rilevata dal browser): Giorno ${today.getDate()}, Mese ${today.getMonth()}, Anno ${today.getFullYear()}`);
        console.log(`Data del brunch (impostata nel codice): Giorno ${BRUNCH_DATE.day}, Mese ${BRUNCH_DATE.month}, Anno ${BRUNCH_DATE.year}`);
        
        // Confronta semplicemente anno, mese e giorno della data odierna (basata sul dispositivo dell'utente)
        // con i valori che abbiamo impostato. Questo è il metodo più diretto e affidabile.
        const isTodayTheDay = today.getDate() === BRUNCH_DATE.day &&
               today.getMonth() === BRUNCH_DATE.month &&
               today.getFullYear() === BRUNCH_DATE.year;

        console.log(`Il brunch è oggi? ${isTodayTheDay ? 'Sì' : 'No'}`);
        console.log("-----------------------------");
        return isTodayTheDay;
    }

    // Funzione per gestire il click sul link/pulsante del brunch
    function handleBrunchClick(event) {
        if (isBrunchDay()) {
            // Se è il giorno del brunch, permetti la navigazione.
            window.location.href = brunchActiveLink;
        } else {
            // Altrimenti, previeni il comportamento di default e mostra il pop-up.
            event.preventDefault();
            if (brunchPopup) {
                brunchPopup.classList.add('visible');
            }
        }
    }

    // --- LOGICA DI INIZIALIZZAZIONE ---

    // Se non è il giorno del brunch, disabilita gli elementi
    if (!isBrunchDay()) {
        if (brunchHomeBtn) {
            brunchHomeBtn.classList.add('btn-inactive');
        }
        if (brunchNavlink) {
            brunchNavlink.classList.add('nav-link-inactive');
        }
    }

    // Aggiungi l'evento di click agli elementi del brunch, se esistono
    if (brunchHomeBtn) brunchHomeBtn.addEventListener('click', handleBrunchClick);
    if (brunchNavlink) brunchNavlink.addEventListener('click', handleBrunchClick);

    // Aggiungi l'evento per chiudere il pop-up, se esiste
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => brunchPopup.classList.remove('visible'));
    }
});