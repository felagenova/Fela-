document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAZIONE ---
    // Imposta qui la data del prossimo brunch.
    // NOTA: i mesi in JavaScript partono da 0 (Gennaio=0, Febbraio=1, ..., Ottobre=9, etc.)
    const BRUNCH_DATE = {
        day: 9,
        month: 9, // 9 = Ottobre
        year: 2025
    };

    // Link a cui il pulsante punterà quando è attivo.
    const brunchActiveLink = 'brunch.html';

    // --- ELEMENTI DEL DOM ---
    const brunchBtn = document.getElementById('brunch-btn');
    const brunchPopup = document.getElementById('brunch-popup');
    const closePopupBtn = document.getElementById('brunch-close-btn');

    // Se gli elementi non sono presenti nella pagina, interrompi lo script.
    if (!brunchBtn || !brunchPopup || !closePopupBtn) {
        return;
    }

    // --- FUNZIONI ---

    // Funzione per controllare se oggi è il giorno del brunch
    function isBrunchDay() {
        const today = new Date();
        // Confronta semplicemente anno, mese e giorno della data odierna (basata sul dispositivo dell'utente)
        // con i valori che abbiamo impostato. Questo è il metodo più diretto e affidabile.
        return today.getDate() === BRUNCH_DATE.day &&
               today.getMonth() === BRUNCH_DATE.month &&
               today.getFullYear() === BRUNCH_DATE.year;
    }

    // --- LOGICA PRINCIPALE ---

    // All'avvio, controlla se il brunch è attivo e applica lo stile corretto.
    // Rimuoviamo prima la classe per assicurarci che lo stato venga ricalcolato correttamente a ogni caricamento.
    brunchBtn.classList.remove('btn-inactive');
    
    if (!isBrunchDay()) {
        brunchBtn.classList.add('btn-inactive');
    }

    brunchBtn.addEventListener('click', (event) => {
        if (isBrunchDay()) {
            // Se è il giorno del brunch, naviga alla sezione food del menu.
            window.location.href = brunchActiveLink;
        } else {
            // Altrimenti, previeni il comportamento di default del link e mostra il pop-up.
            event.preventDefault();
            brunchPopup.classList.add('visible');
        }
    });

    // Aggiungi l'evento per chiudere il pop-up.
    closePopupBtn.addEventListener('click', () => {
        brunchPopup.classList.remove('visible');
    });
});