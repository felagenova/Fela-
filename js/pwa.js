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
            // --- NUOVO: Richiedi attivazione notifiche quando l'utente clicca su Installa ---
            window.dispatchEvent(new CustomEvent('enable-push-notifications'));

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
        
        // Rileva se è Chrome su iOS (User Agent contiene 'CriOS')
        const isChromeIOS = /CriOS/.test(navigator.userAgent);

        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'ios-install-tooltip';
            
            // Icone SVG
            const shareIcon = `<svg style="width:18px;height:18px;vertical-align:middle;fill:#007AFF;margin:0 2px;" viewBox="0 0 24 24"><path d="M12 1L8 5h3v9h2V5h3L12 1zm-5 9v10h10V10h-2v8H9v-8H7z"/></svg>`;
            const addIcon = `<svg style="width:18px;height:18px;vertical-align:middle;fill:#1a1a1a;margin:0 2px;" viewBox="0 0 24 24"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`; // Quadrato con croce
            const threeDotsIcon = `<svg style="width:18px;height:18px;vertical-align:middle;fill:#007AFF;margin:0 2px;" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`; // 3 puntini

            let instructionsHtml = '';

            if (isChromeIOS) {
                // Istruzioni specifiche per Chrome su iOS
                instructionsHtml = `
                    <p style="margin:5px 0; font-size:15px;">1. Clicca sull'icona <strong>Condividi</strong> ${shareIcon} in alto a destra.</p>
                    <p style="margin:5px 0; font-size:15px;">2. Clicca su <strong>Altro</strong> ${threeDotsIcon}.</p>
                    <p style="margin:5px 0; font-size:15px;">3. Clicca su <strong>Aggiungi alla schermata Home</strong> ${addIcon}.</p>
                `;
            } else {
                // Istruzioni specifiche per Safari su iOS
                instructionsHtml = `
                    <p style="margin:5px 0; font-size:15px;">1. Clicca sui <strong>3 puntini</strong> ${threeDotsIcon} in basso a destra.</p>
                    <p style="margin:5px 0; font-size:15px;">2. Clicca su <strong>Condividi</strong> ${shareIcon}.</p>
                    <p style="margin:5px 0; font-size:15px;">3. Clicca su <strong>Altro</strong> ${threeDotsIcon}.</p>
                    <p style="margin:5px 0; font-size:15px;">4. Clicca su <strong>Aggiungi alla schermata Home</strong> ${addIcon}.</p>
                `;
            }

            tooltip.innerHTML = `
                <h4 style="margin:0 0 10px 0; color:#ff0403; font-size:18px;">Installa Fela!</h4>
                ${instructionsHtml}
            `;
            document.body.appendChild(tooltip);
            // Forza il reflow per garantire che l'animazione di entrata parta correttamente la prima volta
            void tooltip.offsetWidth;
        }
        
        tooltip.classList.add('visible');
        
        // Nascondi automaticamente dopo 15 secondi (aumentato per dare tempo di leggere)
        setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 15000);
    }
});