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
        // Asset specifici per la Home Page (Cartella nuoviassets)
        homeAssets: [
            'images/nuoviassets/asset1.webp',
            'images/nuoviassets/asset2.webp',
            'images/nuoviassets/asset3.webp',
            'images/nuoviassets/asset4.webp',
            'images/nuoviassets/asset5.webp',
            'images/nuoviassets/asset6.webp',
            'images/nuoviassets/asset7.webp',
            'images/nuoviassets/asset8.webp',
            'images/nuoviassets/asset9.webp',
            'images/nuoviassets/asset10.webp',
            'images/nuoviassets/asset11.webp',
            'images/nuoviassets/asset12.webp',
            'images/nuoviassets/asset13.webp',
            'images/nuoviassets/asset14.webp',
            'images/nuoviassets/asset15.webp',
            'images/nuoviassets/asset16.webp',
            'images/nuoviassets/asset17.webp',
            'images/nuoviassets/asset18.webp',
            'images/nuoviassets/asset19.webp',
            'images/nuoviassets/asset20.webp',
            'images/nuoviassets/asset21.webp',
            'images/nuoviassets/asset22.webp',
            'images/nuoviassets/asset23.webp',
            'images/nuoviassets/asset24.webp',
            'images/nuoviassets/asset25.webp',
            'images/nuoviassets/asset26.webp',
            'images/nuoviassets/asset27.webp',
            'images/nuoviassets/asset28.webp',
            'images/nuoviassets/asset29.webp',
            'images/nuoviassets/asset30.webp',
            'images/nuoviassets/asset31.webp',
            'images/nuoviassets/asset32.webp'

            // AGGIORNA QUI I NOMI DEI TUOI FILE REALI
        ],
        // --- MIGLIORAMENTO 3: Centralizzazione delle costanti ---
        size: { min: 30, max: 150 }, // px
        duration: { min: 15, max: 40 }, // secondi
        initialDelay: { main: { min: 0, max: 15 }, events: { min: 0, max: 2 } }, // secondi
        // --- NUOVA CONFIGURAZIONE PER PAGINA EVENTI ---
        eventsPage: {
            initialAssets: 4
        },
        homePage: {
            initialAssets: 8, // Numero di elementi presenti all'avvio
            newAssetInterval: 1500, // Ogni quanto ne crea uno nuovo (ms)
            size: { // Dimensioni aumentate drasticamente per la home page
                mobile: { min: 400, max: 800 },
                desktop: { min: 400, max: 800 }
            }
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
    const isHomePage = document.body.classList.contains('home-page');
    const isMobile = window.innerWidth < 768;

    // --- Logica aggiornata per il numero di asset iniziali ---
    let initialAssets;
    let newAssetInterval;

    if (isEventsPage) {
        initialAssets = CONFIG.eventsPage.initialAssets; // Usa il valore per la pagina eventi
        newAssetInterval = isMobile ? CONFIG.mobile.newAssetInterval : CONFIG.desktop.newAssetInterval;
    } else if (isHomePage) {
        // Parametri ottimizzati per evitare sovraffollamento con gli asset giganti
        initialAssets = isMobile ? 5 : 6; 
        newAssetInterval = isMobile ? 7000 : 4000; // Molto più lento (era 1500ms)
    } else {
        initialAssets = isMobile ? CONFIG.mobile.initialAssets : CONFIG.desktop.initialAssets; // Comportamento standard per la home
        newAssetInterval = isMobile ? CONFIG.mobile.newAssetInterval : CONFIG.desktop.newAssetInterval;
    }

    let lastTimestamp = 0;

    // --- VARIABILI PARALLASSE (Mobile) ---
    let deviceTilt = { x: 0, y: 0 };
    if (window.DeviceOrientationEvent && isMobile && isHomePage) {
        window.addEventListener('deviceorientation', (event) => {
            deviceTilt.x = event.gamma; // Inclinazione laterale (-90 a 90)
            deviceTilt.y = event.beta;  // Inclinazione frontale (-180 a 180)
        });
    }

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // --- NUOVA FUNZIONE: Gestione Pool Asset per evitare ripetizioni (Shuffle Bag) ---
    let homeAssetPool = [];
    function getUniqueHomeAsset() {
        if (homeAssetPool.length === 0) {
            // Riempi il pool con una copia degli asset e mescola
            homeAssetPool = [...CONFIG.homeAssets];
            // Fisher-Yates shuffle (algoritmo di mescolamento efficiente)
            for (let i = homeAssetPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [homeAssetPool[i], homeAssetPool[j]] = [homeAssetPool[j], homeAssetPool[i]];
            }
        }
        return homeAssetPool.pop();
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

    // --- NUOVA FUNZIONE: Crea asset per la Home Page (3 righe, sinistra -> destra) ---
    function createHomeAsset() {
        // Limitiamo il numero massimo di asset contemporanei per evitare crash/rallentamenti
        const currentCount = document.querySelectorAll('.animated-asset').length;
        const maxLimit = isMobile ? 10 : 18;
        if (currentCount >= maxLimit) return;

        const asset = document.createElement('img');
        asset.classList.add('animated-asset');

        // 1. Scegli un'immagine casuale (senza ripetizioni ravvicinate)
        const randomImage = getUniqueHomeAsset();
        asset.src = randomImage;

        // 2. Dimensione
        const sizeSettings = isMobile ? CONFIG.homePage.size.mobile : CONFIG.homePage.size.desktop;
        const size = getRandom(sizeSettings.min, sizeSettings.max);
        asset.style.width = `${size}px`;
        asset.style.height = 'auto';

        // 3. Posizionamento in 3 righe (Top, Middle, Bottom)
        const row = Math.floor(Math.random() * 3); // 0, 1, 2
        // Definiamo le fasce di altezza (vh) per ogni riga per evitare sovrapposizioni eccessive
        // Riga 0 (Alto): -10% - 10%
        // Riga 1 (Centro): 20% - 40%
        // Riga 2 (Basso): 50% - 70%
        const minTop = -10 + (row * 30); 
        const maxTop = 10 + (row * 30);
        const topPos = getRandom(minTop, maxTop);
        
        asset.style.top = `${topPos}vh`;
        asset.style.left = '-100vw'; // Parte molto più a sinistra per gestire asset grandi

        // 4. Animazione
        // Su mobile riduciamo la durata per aumentare la velocità (40-70s invece di 70-100s)
        const minDur = isMobile ? 55 : 70;
        const maxDur = isMobile ? 85 : 100;
        const duration = getRandom(minDur, maxDur); 
        asset.style.animation = `moveLeftToRight ${duration}s linear forwards`;

        // 5. Z-Index (dietro al contenuto principale)
        asset.style.zIndex = getRandom(1, 5);

        animationContainer.appendChild(asset);

        asset.addEventListener('animationend', () => {
            asset.remove();
        });
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

            // --- AGGIORNAMENTO PARALLASSE ---
            if (isMobile && isHomePage) {
                // Calcolo offset limitato per evitare movimenti eccessivi
                // Gamma (X): limitiamo a +/- 30 gradi per evitare scatti ai bordi
                const tiltX = Math.max(-30, Math.min(30, deviceTilt.x || 0));
                // Beta (Y): consideriamo un range attorno ai 45 gradi (posizione naturale della mano)
                const tiltY = Math.max(15, Math.min(75, deviceTilt.y || 0)) - 45;

                // Moltiplicatore per pixel (es. max ~45px di spostamento)
                const moveX = tiltX * 1.5; 
                const moveY = tiltY * 1.5;

                animationContainer.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }

            if (elapsed > newAssetInterval) {
                lastTimestamp = timestamp;
                if (isHomePage) {
                    createHomeAsset();
                } else {
                    createAsset();
                }
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
        // Seleziona l'array di immagini corretto in base alla pagina
        const imagesToPreload = isHomePage ? CONFIG.homeAssets : CONFIG.assetImages;

        preloadImages(imagesToPreload, () => {
            console.log("Immagini caricate. Avvio animazioni.");
            for (let i = 0; i < initialAssets; i++) {
                if (isHomePage) {
                    // Per la home, creiamo asset che sono GIA' sullo schermo all'avvio
                    // usando un delay negativo sull'animazione.
                    const asset = document.createElement('img');
                    asset.classList.add('animated-asset');
                    const randomImage = getUniqueHomeAsset();
                    asset.src = randomImage;
                    const sizeSettings = isMobile ? CONFIG.homePage.size.mobile : CONFIG.homePage.size.desktop;
                    const size = getRandom(sizeSettings.min, sizeSettings.max);
                    asset.style.width = `${size}px`;
                    asset.style.height = 'auto';
                    
                    const row = Math.floor(Math.random() * 3);
                    const minTop = -10 + (row * 30); 
                    const maxTop = 10 + (row * 30);
                    asset.style.top = `${getRandom(minTop, maxTop)}vh`;
                    asset.style.left = '-100vw'; // Posizione base molto più a sinistra
                    
                    const minDur = isMobile ? 55 : 70;
                    const maxDur = isMobile ? 85 : 100;
                    const duration = getRandom(minDur, maxDur);
                    // Delay negativo casuale tra 0 e la durata totale per spargerli sullo schermo
                    const negativeDelay = getRandom(0, duration);
                    
                    asset.style.animation = `moveLeftToRight ${duration}s linear -${negativeDelay}s forwards`;
                    asset.style.zIndex = getRandom(1, 5);
                    animationContainer.appendChild(asset);
                    asset.addEventListener('animationend', () => asset.remove());
                } else {
                    createAsset();
                }
            }
            requestAnimationFrame(animationLoop);
        });
    }

    startAnimations();

    // --- INTERAZIONE UTENTE: Drag & Throw (Trascina e Lancia) ---
    let draggedAsset = null;
    let dragHistory = []; // Per calcolare la velocità di lancio
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragStartRotation = 0; // Rotazione iniziale al momento della presa

    function handleInputStart(x, y, target) {
        // Ignora click su elementi interattivi (link, bottoni, player, ecc.)
        if (target && target.closest('a, button, input, .player-btn, .cookie-banner, .hamburger-menu')) return;
        
        // Funziona solo sulla Home Page
        if (!isHomePage) return;

        // --- MODIFICA: Interagisci solo con asset esistenti ---
        if (target && target.classList.contains('animated-asset')) {
            // Se l'asset sta già volando (lanciato prima), ferma il loop fisico
            if (target.dataset.throwAnimId) {
                cancelAnimationFrame(target.dataset.throwAnimId);
                delete target.dataset.throwAnimId;
            }

            draggedAsset = target;
            
            // Calcola l'offset tra il cursore e l'angolo dell'elemento per evitare "salti"
            const rect = draggedAsset.getBoundingClientRect();

            // Calcola la rotazione corrente per evitare scatti visivi
            const style = window.getComputedStyle(draggedAsset);
            const transform = style.transform;
            dragStartRotation = 0;
            if (transform !== 'none') {
                // transform è una matrice: matrix(a, b, c, d, tx, ty)
                const values = transform.split('(')[1].split(')')[0].split(',');
                const a = parseFloat(values[0]);
                const b = parseFloat(values[1]);
                dragStartRotation = Math.round(Math.atan2(b, a) * (180/Math.PI));
            }

            // Calcola la posizione corretta per centrare l'elemento (evita ingrandimenti e salti)
            // Usiamo lo stile inline originale per la larghezza invece del rect.width che include la rotazione
            const currentWidth = parseFloat(draggedAsset.style.width) || rect.width;
            const currentHeight = draggedAsset.clientHeight;
            const tx = rect.left + (rect.width - currentWidth) / 2;
            const ty = rect.top + (rect.height - currentHeight) / 2;

            dragOffsetX = x - tx;
            dragOffsetY = y - ty;

            // Ferma l'animazione CSS corrente
            draggedAsset.style.animation = 'none';
            
            // Resetta left/top e usa transform per posizionarlo esattamente dove si trova ora, mantenendo la rotazione
            draggedAsset.style.height = 'auto';
            draggedAsset.style.left = '0';
            draggedAsset.style.top = '0';
            draggedAsset.style.transform = `translate(${tx}px, ${ty}px) rotate(${dragStartRotation}deg)`;
            
            // Porta in primo piano
            draggedAsset.style.zIndex = 1000;

            // Inizializza la storia del movimento
            dragHistory = [{ x, y, time: Date.now() }];
        }
    }

    function handleInputMove(x, y) {
        if (!draggedAsset) return;

        // Aggiorna posizione mantenendo l'offset del punto di presa e la rotazione
        const newX = x - dragOffsetX;
        const newY = y - dragOffsetY;
        draggedAsset.style.transform = `translate(${newX}px, ${newY}px) rotate(${dragStartRotation}deg)`;

        // Registra posizione e tempo per calcolare la velocità
        const now = Date.now();
        dragHistory.push({ x, y, time: now });
        
        // Mantieni solo gli ultimi 150ms di storia per avere la velocità istantanea
        dragHistory = dragHistory.filter(p => now - p.time < 150);
    }

    function handleInputEnd() {
        if (!draggedAsset) return;

        // Calcola velocità (vettore) basata sugli ultimi movimenti
        let vx = 0, vy = 0;
        if (dragHistory.length >= 2) {
            const first = dragHistory[0];
            const last = dragHistory[dragHistory.length - 1];
            const dt = last.time - first.time;
            if (dt > 0) {
                vx = (last.x - first.x) / dt; // pixel/ms
                vy = (last.y - first.y) / dt;
            }
        }

        // Se la velocità è quasi zero (click statico), diamo una spinta di default
        const speed = Math.sqrt(vx*vx + vy*vy);
        if (speed < 0.2) {
            vx = 0.8; // Lancia verso destra
            vy = -0.5; // E leggermente verso l'alto
        }

        // --- FISICA DEL LANCIO (JS Loop invece di CSS) ---
        const asset = draggedAsset; // Cattura riferimento locale
        draggedAsset = null;
        dragHistory = [];

        // Recupera posizione corrente
        const rect = asset.getBoundingClientRect();
        let currentX = rect.left;
        let currentY = rect.top;
        
        let currentRotation = dragStartRotation;
        // La rotazione continua in base alla velocità del lancio
        let rotationSpeed = (vx + vy) * 0.5; 
        // Limitiamo la velocità di rotazione
        rotationSpeed = Math.max(Math.min(rotationSpeed, 15), -15);

        let isResuming = false; // Flag per indicare se ha ripreso lo scorrimento naturale

        function animateThrow() {
            if (!asset.isConnected) return; // Se rimosso dal DOM

            if (!isResuming) {
                // Applica attrito (Friction)
                vx *= 0.95; 
                vy *= 0.95;
                
                // Rallenta gradualmente la rotazione del lancio
                rotationSpeed *= 0.98;

                // Controlla se si è quasi fermato
                if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) {
                    isResuming = true;
                    
                    // Imposta velocità per lo scorrimento laterale (circa 5vw al secondo, simile agli altri)
                    const scrollSpeedPxPerSec = window.innerWidth * 0.05; 
                    vx = scrollSpeedPxPerSec / 1000; // px per ms
                    vy = 0; // Azzera movimento verticale
                    
                    // Imposta una rotazione lenta e costante per il viaggio
                    rotationSpeed = 0.1; 
                }
            }

            // Aggiorna posizione (16ms circa per frame)
            currentX += vx * 16;
            currentY += vy * 16;
            currentRotation += rotationSpeed;

            asset.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`;

            // Controlla limiti
            const r = asset.getBoundingClientRect();
            const isOutOfBounds = (r.right < 0 || r.left > window.innerWidth || r.bottom < 0 || r.top > window.innerHeight);

            if (isOutOfBounds) {
                asset.remove();
            } else {
                // Continua loop
                asset.dataset.throwAnimId = requestAnimationFrame(animateThrow);
            }
        }

        // Avvia loop
        asset.dataset.throwAnimId = requestAnimationFrame(animateThrow);
    }

    // --- Event Listeners (Mouse & Touch) ---
    document.addEventListener('mousedown', e => handleInputStart(e.clientX, e.clientY, e.target));
    document.addEventListener('mousemove', e => handleInputMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', handleInputEnd);

    document.addEventListener('touchstart', e => {
        handleInputStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, {passive: false});
    
    document.addEventListener('touchmove', e => {
        if (draggedAsset) {
            e.preventDefault(); // Impedisce lo scroll della pagina mentre trascini l'asset
            handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, {passive: false});
    
    document.addEventListener('touchend', handleInputEnd);
});