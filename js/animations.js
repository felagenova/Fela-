document.addEventListener('DOMContentLoaded', function() {
    const animationContainer = document.getElementById('animation-container');
    if (!animationContainer) return;

    // --- OTTIMIZZAZIONE 1: Rispetta le preferenze dell'utente per il movimento ridotto ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        console.log("Movimento ridotto richiesto, animazioni disabilitate.");
        return;
    }

    // --- CONFIGURAZIONE ---
    const CONFIG = {
        assetImages: [
            'images/vicoli_g295.webp',
            'images/bere_path1-0.webp',
            'images/bussola_g301.webp',
            'images/corde_g127.webp',
            'images/croce_g300.webp',
            'images/disco_path1-7.webp',
            'images/drago_g36.webp',
            'images/mappa_g293.webp',
            'images/pescevesc_g298.webp'
            // Aggiungi altri asset se necessario
        ],
        // --- MIGLIORAMENTO 3: Centralizzazione delle costanti ---
        size: { min: 30, max: 150 }, // px
        duration: { min: 15, max: 40 }, // secondi
        initialDelay: { main: { min: 0, max: 15 }, events: { min: 0, max: 2 } }, // secondi
        // --- NUOVA CONFIGURAZIONE PER PAGINA EVENTI ---
        eventsPage: {
            initialAssets: 4
        },
        mobile: {
            initialAssets: 5,
            newAssetInterval: 4000 // ms
        },
        desktop: {
            initialAssets: 15,
            newAssetInterval: 2000 // ms
        }
    };

    // --- OTTIMIZZAZIONE 2: Riduci il numero di asset su schermi piccoli ---
    const isEventsPage = document.body.classList.contains('inner-page-bg');
    const isMobile = window.innerWidth < 768;

    // --- Logica aggiornata per il numero di asset iniziali ---
    let initialAssets;
    if (isEventsPage) {
        initialAssets = CONFIG.eventsPage.initialAssets; // Usa il valore per la pagina eventi
    } else {
        initialAssets = isMobile ? CONFIG.mobile.initialAssets : CONFIG.desktop.initialAssets; // Comportamento standard per la home
    }
    const newAssetInterval = isMobile ? CONFIG.mobile.newAssetInterval : CONFIG.desktop.newAssetInterval;

    let lastTimestamp = 0;

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // --- NUOVA FUNZIONE: Genera una traiettoria casuale e la relativa animazione CSS ---
    function createRandomTrajectory() {
        const animId = `anim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const styleTag = document.createElement('style');
        styleTag.id = animId;

        // --- Logica migliorata per traiettorie ampie ---
        let startX, startY, endX, endY;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        if (side === 0) { // Parte dall'alto, arriva in basso
            startX = getRandom(0, 100); startY = -50;
            endX = getRandom(0, 100); endY = 150;
        } else if (side === 1) { // Parte da destra, arriva a sinistra
            startX = 150; startY = getRandom(0, 100);
            endX = -50; endY = getRandom(0, 100);
        } else if (side === 2) { // Parte dal basso, arriva in alto
            startX = getRandom(0, 100); startY = 150;
            endX = getRandom(0, 100); endY = -50;
        } else { // Parte da sinistra, arriva a destra
            startX = -50; startY = getRandom(0, 100);
            endX = 150; endY = getRandom(0, 100);
        }

        // Punto di controllo intermedio dentro lo schermo per una curva
        const midX = getRandom(10, 90); // vw
        const midY = getRandom(10, 90); // vh

        // Rotazione casuale
        const startRot = getRandom(0, 360);
        const endRot = startRot + getRandom(-360, 360);

        const keyframes = `
            @keyframes ${animId} {
                0% {
                    transform: translate(${startX}vw, ${startY}vh) rotate(${startRot}deg);
                    opacity: 1;
                }
                50% {
                    transform: translate(${midX}vw, ${midY}vh) rotate(${startRot + (endRot - startRot) / 2}deg);
                }
                100% {
                    transform: translate(${endX}vw, ${endY}vh) rotate(${endRot}deg);
                    opacity: 1;
                }
            }
        `;

        styleTag.innerHTML = keyframes;
        document.head.appendChild(styleTag);

        return {
            name: animId,
            styleTag: styleTag
        };
    }

    function createAsset() {
        const asset = document.createElement('img');
        asset.classList.add('animated-asset');

        // 1. Scegli un'immagine casuale
        const randomImage = CONFIG.assetImages[Math.floor(Math.random() * CONFIG.assetImages.length)];
        asset.src = randomImage; // Usa direttamente il percorso dall'array

        // 2. Imposta una dimensione casuale
        const size = getRandom(CONFIG.size.min, CONFIG.size.max);
        asset.style.width = `${size}px`;
        asset.style.height = 'auto';

        // Imposta l'opacità iniziale a 0 per nascondere l'asset prima che l'animazione parta
        asset.style.opacity = '0';

        // 4. Genera un'animazione casuale, durata e ritardo
        const trajectory = createRandomTrajectory();
        const duration = getRandom(CONFIG.duration.min, CONFIG.duration.max);

        // Controlla se siamo sulla pagina eventi (che ha la classe 'inner-page-bg')
        // --- MIGLIORAMENTO 2: Logica del ritardo corretta ---
        const delayConfig = isEventsPage ? CONFIG.initialDelay.events : CONFIG.initialDelay.main;
        const delay = getRandom(delayConfig.min, delayConfig.max);

        // Imposta l'animazione per essere eseguita una sola volta
        asset.style.animation = `${trajectory.name} ${duration}s linear ${delay}s`;

        // 5. Decidi se l'asset sta in primo piano o sullo sfondo
        // z-index:
        // < 0: Dietro il contenuto principale
        // > 1: Davanti al contenuto principale (ma sotto elementi con z-index più alto come il bottone "torna su")
        const zIndex = Math.random() > 0.5 ? getRandom(2, 5) : getRandom(-2, -1);
        asset.style.zIndex = Math.round(zIndex);

        // Aggiungi l'asset al contenitore
        animationContainer.appendChild(asset);

        // 7. Rimuovi l'asset dal DOM quando l'animazione è finita
        asset.addEventListener('animationend', () => {
            asset.remove();
            // Rimuovi anche lo stile dell'animazione per tenere pulito il DOM
            trajectory.styleTag.remove();
        });
    }

    // --- OTTIMIZZAZIONE 3: Usa requestAnimationFrame invece di setInterval ---
    function animationLoop(timestamp) {
        if (!document.hidden) { // OTTIMIZZAZIONE 4: Controlla se la pagina è visibile
            const elapsed = timestamp - lastTimestamp;

            if (elapsed > newAssetInterval) {
                lastTimestamp = timestamp;
                createAsset();
            }
        }
        requestAnimationFrame(animationLoop);
    }

    // --- MIGLIORAMENTO 1: Precaricamento delle immagini ---
    function preloadImages(urls, callback) {
        let loadedCount = 0;
        const totalImages = urls.length;
        if (totalImages === 0) {
            callback();
            return;
        }
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    callback();
                }
            };
        });
    }

    // --- Avvio ---
    function startAnimations() {
        console.log("Precaricamento immagini...");
        preloadImages(CONFIG.assetImages, () => {
            console.log("Immagini caricate. Avvio animazioni.");
            for (let i = 0; i < initialAssets; i++) {
                createAsset();
            }
            requestAnimationFrame(animationLoop);
        });
    }

    startAnimations();
});