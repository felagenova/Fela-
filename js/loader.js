document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('loader-wrapper');
    if (!loader) return;

    // Funzione per nascondere il loader con l'animazione di dissolvenza.
    function hideLoader() {
        loader.style.opacity = '0';

        // Aggiunge un listener per l'evento 'transitionend' per impostare 'visibility: hidden'
        // solo dopo che l'animazione di opacità è completata.
        const handleTransitionEnd = (event) => {
            if (event.propertyName === 'opacity') {
                loader.style.visibility = 'hidden';
                loader.removeEventListener('transitionend', handleTransitionEnd);
            }
        };
        loader.addEventListener('transitionend', handleTransitionEnd);
    }

    // Controlla se l'utente ha già visitato la homepage in questa sessione.
    const hasVisited = sessionStorage.getItem('hasVisitedHomepage');

    // Se è la prima visita, gestiamo il loader con un ritardo minimo.
    // Se la pagina è già stata visitata, lo script nell'head ha già nascosto il loader.
    if (!hasVisited) {
        const MIN_DISPLAY_TIME = 500; // 500ms = mezzo secondo
        let pageLoaded = false;

        // 1. Registra quando la pagina è completamente caricata (inclusi stili e immagini).
        window.addEventListener('load', () => {
            pageLoaded = true;
        });

        // 2. Imposta un timer per il tempo minimo di visualizzazione.
        setTimeout(() => {
            // Funzione per tentare di nascondere il loader.
            const tryHideLoader = () => {
                if (pageLoaded) {
                    // Se la pagina è caricata e il tempo minimo è passato, nascondi il loader.
                    hideLoader();
                    // Imposta il flag per le visite successive in questa sessione.
                    sessionStorage.setItem('hasVisitedHomepage', 'true');
                } else {
                    // Se il tempo è passato ma la pagina non è ancora pronta,
                    // aspetta l'evento 'load' per nascondere il loader.
                    window.addEventListener('load', () => {
                        hideLoader();
                        sessionStorage.setItem('hasVisitedHomepage', 'true');
                    }, { once: true }); // { once: true } assicura che il listener venga eseguito una sola volta.
                }
            };
            tryHideLoader();
        }, MIN_DISPLAY_TIME);
    }

    // Gestisce il caso in cui la pagina venga ripristinata dalla back-forward cache (bfcache).
    window.addEventListener('pageshow', function(event) {
        // Se la pagina è stata ripristinata dalla bfcache e il loader è già stato mostrato in questa sessione,
        // assicurati che il loader sia nascosto immediatamente aggiungendo la classe all'elemento <html>.
        if (event.persisted && sessionStorage.getItem('hasVisitedHomepage')) {
            document.documentElement.classList.add('loader-hidden');
        }
    });
});