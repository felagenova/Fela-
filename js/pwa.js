document.addEventListener('DOMContentLoaded', () => {
    let deferredPrompt;
    const installBtn = document.getElementById('install-app-btn');

    // Rilevamento iOS
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Rilevamento se l'app è già in modalità standalone (installata)
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    // Assicuriamoci che il bottone sia nascosto all'avvio
    if (installBtn) {
        installBtn.style.display = 'none';
    }

    // Su iOS mostriamo il bottone manualmente se non è già installata
    if (isIos && !isStandalone && installBtn) {
        installBtn.style.display = 'flex';
    }

    // Intercetta l'evento 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', (e) => {
        // Impedisce al browser di mostrare il prompt di installazione standard subito
        e.preventDefault();
        // Salva l'evento per poterlo attivare in seguito
        deferredPrompt = e;
        // Mostra il nostro pulsante personalizzato
        if (installBtn) {
            installBtn.style.display = 'flex';
            console.log('PWA install prompt intercettato e salvato');
        }
    });

    // Gestisce il click sul pulsante di installazione
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            // Modifica per il testing: Se siamo su iOS (o simulazione), diamo priorità al tooltip
            // anche se il browser supporta il prompt nativo (come succede in Chrome DevTools)
            if (isIos) {
                showIosInstallTooltip();
            } else if (deferredPrompt) {
                // ANDROID/DESKTOP: Mostra il prompt nativo
                deferredPrompt.prompt();
                // Attendi la risposta dell'utente
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Risposta utente all'installazione: ${outcome}`);
                // Resetta la variabile (il prompt può essere usato una sola volta)
                deferredPrompt = null;
                // Nascondi il bottone dopo la scelta
                installBtn.style.display = 'none';
            }
        });
    }

    // Ascolta l'evento di avvenuta installazione
    window.addEventListener('appinstalled', () => {
        // Nascondi il bottone se l'app è stata installata
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
        console.log('PWA installata con successo');
    });

    // Funzione per creare e mostrare il tooltip iOS
    function showIosInstallTooltip() {
        let tooltip = document.getElementById('ios-install-tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'ios-install-tooltip';
            // Icona Condividi (SVG inline) e Icona Aggiungi (+)
            const shareIcon = `<svg style="width:18px;height:18px;vertical-align:middle;fill:#007AFF;margin:0 2px;" viewBox="0 0 24 24"><path d="M12 1L8 5h3v9h2V5h3L12 1zm-5 9v10h10V10h-2v8H9v-8H7z"/></svg>`;
            const addIcon = `<svg style="width:18px;height:18px;vertical-align:middle;fill:#1a1a1a;margin:0 2px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;

            tooltip.innerHTML = `
                <button id="close-ios-tooltip" style="position:absolute; top:5px; right:10px; background:none; border:none; font-size:24px; color:#ff0403; cursor:pointer; line-height:1;">&times;</button>
                <h4 style="margin:0 0 10px 0; color:#ff0403; font-size:18px;">Installa Fela!</h4>
                <p style="margin:5px 0; font-size:15px;">1. Tocca l'icona <strong>Condividi</strong> ${shareIcon} qui sotto.</p>
                <p style="margin:5px 0; font-size:15px;">2. Scorri e seleziona <strong>"Aggiungi alla schermata Home"</strong> ${addIcon}</p>
            `;
            document.body.appendChild(tooltip);
            
            // Chiudi al click sulla X
            tooltip.querySelector('#close-ios-tooltip').addEventListener('click', () => {
                tooltip.classList.remove('visible');
            });
        }
        
        tooltip.classList.add('visible');
        
        // Nascondi automaticamente dopo 10 secondi
        setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 10000);
    }
});