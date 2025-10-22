document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('soma-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const trackTitleEl = document.querySelector('#track-info .track-title');
    const trackArtistEl = document.querySelector('#track-info .track-artist');
    
    // Controlla se gli elementi del player esistono prima di procedere
    if (!player || !playPauseBtn || !volumeSlider || !trackTitleEl || !trackArtistEl) {
        return;
    }

    const SOMA_API_URL = 'https://somafm.com/songs/reggae.json';
    let trackInfoInterval;

    // Funzione per recuperare e aggiornare le info della traccia
    async function fetchTrackInfo() {
        try {
            const response = await fetch(SOMA_API_URL);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            const song = data.songs[0]; // Prende la traccia più recente

            if (song && song.title && song.artist) {
                // Aggiorna il testo solo se è cambiato per evitare sfarfallio
                if (trackTitleEl.textContent !== song.title) {
                    // Rimuovi la classe di scorrimento e lo span precedente, se esistono
                    trackTitleEl.classList.remove('scrolling');
                    trackTitleEl.innerHTML = ''; // Pulisce il contenuto

                    trackTitleEl.textContent = song.title; // Imposta il testo per misurarlo

                    // Controlla se il testo è più largo del suo contenitore
                    if (trackTitleEl.scrollWidth > trackTitleEl.clientWidth) {
                        // Se è troppo lungo, duplica il testo per un'animazione in loop
                        // e attiva l'animazione di scorrimento.
                        trackTitleEl.innerHTML = `<span>${song.title} &nbsp;&nbsp;&nbsp; ${song.title}</span>`;
                        trackTitleEl.classList.add('scrolling');
                    } else {
                        // Altrimenti, mostra il testo normalmente
                        trackTitleEl.textContent = song.title;
                    }
                }
                if (trackArtistEl.textContent !== song.artist) {
                    trackArtistEl.textContent = song.artist;
                    trackArtistEl.title = song.artist;
                }
            }
        } catch (error) {
            console.error("Errore nel recuperare le info della traccia:", error);
        }
    }
    
    // Funzione per aggiornare l'icona Play/Pausa
    function updatePlayPauseIcon() {
        if (player.paused) {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.setAttribute('aria-label', 'Play');
        } else {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.setAttribute('aria-label', 'Pause');
        }
    }

    // Gestione del click sul pulsante Play/Pausa
    playPauseBtn.addEventListener('click', () => {
        if (player.paused) {
            // Per le dirette streaming, è meglio ricaricare la sorgente
            // per evitare problemi di buffer o disconnessione.
            player.load();
            player.play().catch(error => console.error("Errore durante la riproduzione:", error));
            // Inizia a controllare le info della traccia quando parte la musica
            fetchTrackInfo(); // Chiamata immediata
            trackInfoInterval = setInterval(fetchTrackInfo, 15000); // E poi ogni 15 secondi
        } else {
            player.pause();
            // Ferma il controllo quando la musica è in pausa
            clearInterval(trackInfoInterval);
            // Ripristina il testo di default e rimuove l'animazione di scorrimento
            trackTitleEl.classList.remove('scrolling');
            trackTitleEl.innerHTML = 'Radio Fela'; // Usiamo innerHTML per rimuovere eventuali span interni
            trackArtistEl.textContent = 'Music Selection';
        }
    });

    // Aggiorna l'icona quando lo stato di riproduzione cambia
    player.addEventListener('play', updatePlayPauseIcon);
    player.addEventListener('pause', updatePlayPauseIcon);

    // Gestione del volume
    volumeSlider.addEventListener('input', (e) => {
        player.volume = parseFloat(e.target.value);
    });

    // Imposta il volume iniziale
    player.volume = parseFloat(volumeSlider.value);
});