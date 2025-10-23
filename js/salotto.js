// Variabile globale per il player di YouTube e per l'intervallo di animazione
let player;
let animationFrameRequest; // Unica variabile per gestire il ciclo di animazione

// --- Funzioni di Utilità ---
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Questa funzione viene chiamata automaticamente dall'API di YouTube quando è pronta.
window.onYouTubeIframeAPIReady = function () {
    const activeCardOnLoad = document.querySelector('.episode-card.active');
    if (!activeCardOnLoad) {
        console.error("Nessuna card episodio attiva trovata al caricamento.");
        return;
    }
    const initialVideoId = activeCardOnLoad.dataset.videoId;

    player = new YT.Player("youtube-player", {
        height: '100%',
        width: '100%',
        videoId: initialVideoId,
        playerVars: {
            'playsinline': 1,
            'controls': 1, // Abilitiamo i controlli nativi, li nasconderemo con il CSS
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'autohide': 1 // Nasconde i controlli dopo l'inizio della riproduzione
        },
        events: {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange,
        }
    });
}

// Funzione chiamata quando il player è pronto.
function onPlayerReady() {
    const episodeCards = document.querySelectorAll('.episode-card');
    const currentTitleEl = document.getElementById('current-episode-title');
    const playPauseBtn = document.getElementById('play-pause-custom-btn');
    const progressBarContainer = document.getElementById('progress-bar-container-custom');
    const currentTimeEl = document.getElementById('current-time-custom');
    const durationEl = document.getElementById('duration-custom');
    const fullscreenBtn = document.getElementById('fullscreen-btn-custom');
    
    // Nuova logica per il modale di Dalida
    const dalidaTrigger = document.querySelector('.tooltip-trigger');
    const dalidaModal = document.getElementById('dalida-modal-overlay');
    const dalidaCloseBtn = dalidaModal.querySelector('.modal-close-btn');

    // Imposta la durata totale del video iniziale
    const initialDuration = player.getDuration();
    if (initialDuration > 0) {
        durationEl.textContent = formatTime(initialDuration);
    }

    // Funzione per caricare un nuovo video e aggiornare il titolo
    function loadVideo(card) {
        const videoId = card.dataset.videoId;
        const title = card.querySelector('h4').textContent;

        if (videoId && player) {
            player.loadVideoById(videoId);
            currentTitleEl.textContent = title;

            // Aggiorna lo stato attivo
            episodeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
    }

    // Gestione stato iniziale
    const activeCardOnLoad = document.querySelector('.episode-card.active');
    if (activeCardOnLoad) {
        const title = activeCardOnLoad.querySelector('h4').textContent;
        currentTitleEl.textContent = title;
        // La prima card è già espansa tramite HTML/CSS con la classe .expanded
    }

    // Gestione click sui bottoni delle card
    episodeCards.forEach(card => {
        const playBtn = card.querySelector('.episode-play-btn');
        const expandBtn = card.querySelector('.episode-expand-btn');

        // Click sul bottone PLAY
        if (playBtn) {
            playBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Evita che il click si propaghi alla card
                loadVideo(card);
                document.getElementById('youtube-player').scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        // Click sul bottone ESPANDI
        if (expandBtn) {
            expandBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                card.classList.toggle('expanded');
            });
        }
    });

    playPauseBtn.addEventListener('click', () => {
        const playerState = player.getPlayerState();
        if (playerState === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });

    // --- Gestione Schermo Intero ---
    fullscreenBtn.addEventListener('click', () => {
        const videoWrapper = document.querySelector('.video-wrapper');

        if (!document.fullscreenElement) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.mozRequestFullScreen) { /* Firefox */
                videoWrapper.mozRequestFullScreen();
            } else if (videoWrapper.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) { /* IE/Edge */
                videoWrapper.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // --- Gestione Modale di Dalida ---
    if (dalidaTrigger && dalidaModal && dalidaCloseBtn) {
        dalidaTrigger.addEventListener('click', (e) => {
            e.preventDefault(); // Previene comportamenti strani del link
            dalidaModal.classList.add('visible');
        });

        dalidaCloseBtn.addEventListener('click', () => {
            dalidaModal.classList.remove('visible');
        });

        // Chiude il modale cliccando sullo sfondo
        dalidaModal.addEventListener('click', (e) => {
            if (e.target === dalidaModal) {
                dalidaModal.classList.remove('visible');
            }
        });
    }

    // Aggiorna l'icona quando lo stato dello schermo intero cambia
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        const playerIframe = document.getElementById('youtube-player');
        const enterIcon = fullscreenBtn.querySelector('.fullscreen-icon');
        const exitIcon = fullscreenBtn.querySelector('.exit-fullscreen-icon');

        if (isFullscreen) {
            enterIcon.style.display = 'none';
            exitIcon.style.display = 'block';
            // Quando siamo in fullscreen, rimuoviamo il "trucco" CSS per mostrare i controlli nativi
            if (playerIframe) {
                playerIframe.style.top = '0';
                playerIframe.style.height = '100%';
            }
        } else {
            enterIcon.style.display = 'block';
            exitIcon.style.display = 'none';
            // Quando usciamo dal fullscreen, riapplichiamo il "trucco" CSS per nascondere i controlli
            if (playerIframe) {
                playerIframe.style.top = '-60px';
                playerIframe.style.height = 'calc(100% + 120px)';
            }
        }
    });

    // --- Gestione Barra di Avanzamento ---

    function seek(event) {
        const barWidth = progressBarContainer.clientWidth;
        const clickPosition = event.offsetX;
        const seekTime = (clickPosition / barWidth) * player.getDuration();
        player.seekTo(seekTime, true); // true: permette il seek anche in parti non bufferizzate
    }

    progressBarContainer.addEventListener('click', seek);

    let isDragging = false;
    progressBarContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        seek(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = progressBarContainer.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            if (offsetX < 0) offsetX = 0;
            if (offsetX > rect.width) offsetX = rect.width;

            const seekTime = (offsetX / rect.width) * player.getDuration();
            player.seekTo(seekTime, true); 
        }
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // Assicura che il video riparta dopo aver rilasciato il mouse
            player.playVideo();
        }
    });
}

// Funzione per aggiornare la barra di avanzamento e il tempo
function updatePlayerUI() {
    if (!player || typeof player.getDuration !== 'function') return;

    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    const progress = (currentTime / duration) * 100;

    if (isFinite(progress)) {
        document.getElementById('progress-bar-filled-custom').style.width = `${progress}%`;
        document.getElementById('progress-bar-thumb-custom').style.left = `${progress}%`;
        document.getElementById('current-time-custom').textContent = formatTime(currentTime);
    }
    // Continua il ciclo di animazione
    animationFrameRequest = requestAnimationFrame(updatePlayerUI);
}

// Gestisce i cambi di stato del player (play, pausa, fine, ecc.)
function onPlayerStateChange(event) {
    const playPauseBtn = document.getElementById('play-pause-custom-btn');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const durationEl = document.getElementById('duration-custom');

    // Ferma sempre il ciclo di animazione precedente prima di decidere cosa fare
    cancelAnimationFrame(animationFrameRequest);

    if (event.data === YT.PlayerState.PLAYING) {
        // Stato: IN RIPRODUZIONE
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        playPauseBtn.setAttribute('aria-label', 'Pausa');
        durationEl.textContent = formatTime(player.getDuration());
        // Avvia il ciclo di animazione
        animationFrameRequest = requestAnimationFrame(updatePlayerUI);
    } else {
        // Stato: PAUSA, FINE, o altro (il ciclo è già stato fermato sopra)
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playPauseBtn.setAttribute('aria-label', 'Play');

        if (event.data === YT.PlayerState.ENDED) {
            // Quando il video finisce, lo riportiamo all'inizio e lo mettiamo in pausa per evitare la griglia di video suggeriti.
            player.seekTo(0, false);
        }
    }
}
