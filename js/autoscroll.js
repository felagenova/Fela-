document.addEventListener('DOMContentLoaded', () => {
    // Eseguiamo lo script solo se ci troviamo nella pagina "Transatlantica",
    // identificata dalla classe 'svg-flyer-page' sul body.
    if (document.body.classList.contains('svg-flyer-page')) {
        
        // Troviamo l'elemento SVG a cui vogliamo scorrere.
        // Assicurati di aver aggiunto id="flyer-svg" al tuo tag <object> o <img> dell'SVG.
        const bookingButton = document.querySelector('.btn-transatlantica-booking');
        const header = document.querySelector('.site-header-nav');

       if (bookingButton && header) {
            // Utilizziamo un piccolo ritardo per assicurarci che la pagina sia completamente renderizzata.
            setTimeout(() => {
                // Calcoliamo l'altezza della barra di navigazione.
                const headerHeight = header.offsetHeight;

                // Calcoliamo la posizione del pulsante rispetto all'inizio della pagina.
                const buttonTopPosition = bookingButton.getBoundingClientRect().top + window.scrollY;

                // Calcoliamo la destinazione dello scroll, sottraendo l'altezza della navbar
                // e aggiungendo un piccolo margine per distanziarlo.
                const scrollTarget = buttonTopPosition - headerHeight - 20; // 20px di margine

                // Eseguiamo lo scroll manuale alla posizione calcolata.
                window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            }, 200); // Ritardo di 200 millisecondi.
        }
    }
});