document.addEventListener("DOMContentLoaded", function() {
    const popup = document.getElementById('image-popup-overlay');
    const closeBtn = document.getElementById('image-popup-close');

    // Funzione per mostrare il popup
    function showPopup() {
        if (popup) {
            popup.classList.add('visible');
        }
    }

    // Funzione per chiudere il popup
    function closePopup() {
        if (popup) {
            popup.classList.remove('visible');
        }
    }

    // Event listener per il bottone di chiusura
    if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
    }

    // Chiudi cliccando ovunque (sia sullo sfondo che sul contenuto)
    if (popup) {
        popup.addEventListener('click', function(e) {
            closePopup();
        });
    }

    // Logica di visualizzazione sincronizzata con il loader
    window.addEventListener('load', function() {
        // Il loader ha una transizione di 0.7s (definita nel CSS).
        // Impostiamo un ritardo per far apparire il popup subito dopo che il loader è svanito.
        // 1500ms = 1.5 secondi (tempo di caricamento medio + transizione)
        const delay = document.documentElement.classList.contains('loader-hidden') ? 500 : 2000;
        
        setTimeout(showPopup, delay);
    });
});