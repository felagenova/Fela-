document.addEventListener('DOMContentLoaded', () => {
    // Variabile globale per il widget di SoundCloud
    let widget;
    let isDragging = false; // Flag per il trascinamento della barra di avanzamento
    let currentTrackDuration = 0; // Memorizza la durata della traccia corrente in ms
    let animationFrameId; // ID per il ciclo di animazione con requestAnimationFrame

    // Elementi del DOM
    const soundcloudPlayerIframe = document.getElementById('soundcloud-player');
    const episodeCards = document.querySelectorAll('.episode-card');
    const currentTitleEl = document.getElementById('current-episode-title');
    const artworkEl = document.getElementById('episode-artwork');
    // Elementi dei controlli custom
    const playPauseBtn = document.getElementById('play-pause-custom-btn');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const progressBarContainer = document.getElementById('progress-bar-container-custom');
    const progressBarFilled = document.getElementById('progress-bar-filled-custom');
    const progressBarThumb = document.getElementById('progress-bar-thumb-custom');
    const currentTimeEl = document.getElementById('current-time-custom');
    const durationEl = document.getElementById('duration-custom');

    if (!soundcloudPlayerIframe || episodeCards.length === 0) {
        console.error("Elementi del player o delle puntate non trovati.");
        return;
    }

    // Trova tutte le puntate RIPRODUCIBILI
    const playableCards = document.querySelectorAll('.episode-card:not(.not-playable)');
    // Imposta l'ultima (la più recente aggiunta in fondo) come attiva al caricamento
    let activeCardOnLoad = playableCards.length > 0 ? playableCards[playableCards.length - 1] : null;

    // Se trovata, la imposta come attiva
    if (activeCardOnLoad) {
        activeCardOnLoad.classList.add('active');
    }

    if (!activeCardOnLoad) {
        console.error("Nessuna card episodio attiva trovata al caricamento.");
        return;
    }

    // Imposta l'URL iniziale del player e il titolo
    const initialTrackUrl = activeCardOnLoad.dataset.trackUrl;
    const initialArtworkUrl = activeCardOnLoad.dataset.artworkUrl;
    const initialTitle = activeCardOnLoad.querySelector('h4').textContent;
    soundcloudPlayerIframe.src = initialTrackUrl;
    currentTitleEl.textContent = initialTitle;
    artworkEl.src = initialArtworkUrl;
    artworkEl.alt = `Copertina per ${initialTitle}`;

    // Inizializza il widget di SoundCloud
    widget = SC.Widget(soundcloudPlayerIframe);

    // Funzione di utilità per formattare il tempo
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    // Funzione per caricare una nuova traccia e aggiornare l'interfaccia
    function loadTrack(card) {
        const embedUrl = card.dataset.trackUrl;
        const title = card.querySelector('h4').textContent;
        const artworkUrl = card.dataset.artworkUrl;

        if (embedUrl && widget) {
            // FIX: L'API di SoundCloud richiede l'URL della risorsa (es. https://soundcloud.com/...),
            // non l'URL del widget di embed. Dobbiamo estrarlo.
            let soundUrl;
            try {
                // Usiamo l'oggetto URL per analizzare facilmente i parametri
                const urlObj = new URL(embedUrl);
                soundUrl = urlObj.searchParams.get('url');
            } catch (e) {
                console.error("URL di embed non valido:", embedUrl, e);
                return;
            }

            // Carica la nuova traccia usando l'URL corretto
            widget.load(soundUrl, {
                callback: () => {
                    // Una volta caricata la traccia, ne otteniamo la durata e la avviamo
                    widget.getDuration(duration => {
                        currentTrackDuration = duration;
                        durationEl.textContent = formatTime(duration);
                        widget.play();
                    });
                }
            });

            // Aggiorna il titolo della puntata corrente
            currentTitleEl.textContent = title;

            // Aggiorna la copertina
            artworkEl.src = artworkUrl;
            artworkEl.alt = `Copertina per ${title}`;

            // Aggiorna la classe 'active' per evidenziare la puntata corrente
            episodeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
    }

    // --- Gestione Controlli Personalizzati ---

    playPauseBtn.addEventListener('click', () => {
        if (widget) {
            widget.toggle();
        }
    });

    function seek(event) {
        if (!widget) return;
        const barWidth = progressBarContainer.clientWidth;
        const clickPosition = event.offsetX;
        widget.getDuration((duration) => {
            const seekTime = (clickPosition / barWidth) * duration;
            widget.seekTo(seekTime);
        });
    }

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
            
            // Aggiorna la UI in tempo reale per un trascinamento fluido
            const progressPercent = (offsetX / rect.width) * 100;
            progressBarFilled.style.width = `${progressPercent}%`;
            progressBarThumb.style.left = `${progressPercent}%`;
            
            // Aggiorna anche il tempo corrente visualizzato
            const seekTime = (offsetX / rect.width) * currentTrackDuration;
            currentTimeEl.textContent = formatTime(seekTime);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            // Ora che il trascinamento è finito, esegui il seek sull'audio
            seek(e);
        }
    });

    // --- Funzione per l'aggiornamento fluido della UI ---
    function updateProgressBar() {
        // La funzione ora si assicura che un nuovo frame sia richiesto solo dopo che il precedente è stato processato.
        const update = () => {
            if (!widget || isDragging) {
                // Se l'utente sta trascinando, non aggiorniamo la UI ma continuiamo il ciclo di animazione
                animationFrameId = requestAnimationFrame(update);
                return;
            }
            widget.getPosition((currentPosition) => {
                currentTimeEl.textContent = formatTime(currentPosition);
                const progressPercent = (currentPosition / currentTrackDuration) * 100;
                if (isFinite(progressPercent)) {
                    progressBarFilled.style.width = `${progressPercent}%`;
                    progressBarThumb.style.left = `${progressPercent}%`;
                }
                // Richiedi il prossimo frame solo dopo aver aggiornato la UI
                animationFrameId = requestAnimationFrame(update);
            });
        };
        update(); // Avvia il ciclo
    }

    // --- Binding degli eventi del Player di SoundCloud ---

    widget.bind(SC.Widget.Events.READY, () => {
        // Imposta la durata quando il player è pronto
        widget.getDuration((durationMs) => {
            currentTrackDuration = durationMs;
            durationEl.textContent = formatTime(currentTrackDuration);
        });
    });

    widget.bind(SC.Widget.Events.PLAY, () => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        // Avvia il ciclo di animazione fluido
        cancelAnimationFrame(animationFrameId); // Sicurezza: ferma cicli precedenti

        // Aggiorna l'icona sulla card attiva
        const activeCard = document.querySelector('.episode-card.active');
        if (activeCard) {
            const cardPlayBtn = activeCard.querySelector('.episode-play-btn');
            cardPlayBtn.innerHTML = `<svg class="pause-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        }

        updateProgressBar(); // Avvia il nuovo ciclo di animazione
    });

    widget.bind(SC.Widget.Events.PAUSE, () => {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        // Ferma il ciclo di animazione quando la traccia è in pausa
        cancelAnimationFrame(animationFrameId);

        // Aggiorna l'icona sulla card attiva
        const activeCard = document.querySelector('.episode-card.active');
        if (activeCard) {
            const cardPlayBtn = activeCard.querySelector('.episode-play-btn');
            cardPlayBtn.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        }
    });

    widget.bind(SC.Widget.Events.FINISH, () => {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        // Ferma il ciclo di animazione alla fine della traccia
        cancelAnimationFrame(animationFrameId);
        // Resetta la barra di avanzamento
        progressBarFilled.style.width = '0%';
        progressBarThumb.style.left = '0%';

        // Aggiorna l'icona sulla card attiva
        const activeCard = document.querySelector('.episode-card.active');
        if (activeCard) {
            const cardPlayBtn = activeCard.querySelector('.episode-play-btn');
            cardPlayBtn.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        }
    });

    // Aggiungi gli event listener a tutte le card delle puntate
    episodeCards.forEach(card => {
        const playBtn = card.querySelector('.episode-play-btn');
        const expandBtn = card.querySelector('.episode-expand-btn');

        // Gestione del click sul bottone PLAY
        if (playBtn) {
            playBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Evita che il click si propaghi alla card

                // Se la card cliccata è già attiva, esegue solo play/pausa
                if (card.classList.contains('active')) {
                    widget.toggle();
                } else {
                    // Altrimenti, carica la nuova traccia
                    loadTrack(card);
                }

                // Porta il player in vista (ora sono i controlli custom)
                playPauseBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        // Gestione del click sul bottone ESPANDI per mostrare/nascondere il testo
        if (expandBtn) {
            expandBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                card.classList.toggle('expanded');
            });
        }
    });

    // --- Gestione Modale di Dalida (logica invariata) ---
    const dalidaTrigger = document.querySelector('.tooltip-trigger');
    const dalidaModal = document.getElementById('dalida-modal-overlay');
    const dalidaCloseBtn = dalidaModal ? dalidaModal.querySelector('.modal-close-btn') : null;

    if (dalidaTrigger && dalidaModal && dalidaCloseBtn) {
        dalidaTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            dalidaModal.classList.add('visible');
        });

        dalidaCloseBtn.addEventListener('click', () => {
            dalidaModal.classList.remove('visible');
        });

        dalidaModal.addEventListener('click', (e) => {
            if (e.target === dalidaModal) {
                dalidaModal.classList.remove('visible');
            }
        });
    }
});
