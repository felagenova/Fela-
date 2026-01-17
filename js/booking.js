document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('booking-form');
    const messageDiv = document.getElementById('form-message');
    const brunchSlotGroup = document.getElementById('brunch-slot-group');
    const brunchSlotSelector = document.getElementById('brunch-slot-selector');
    const eventSelectionContainer = document.getElementById('event-selection-container');
    const bookingFormWrapper = document.getElementById('booking-form-wrapper');
    const backToEventsBtn = document.getElementById('back-to-events');
    const pageSubtitle = document.getElementById('page-subtitle');
    const selectedEventTitle = document.getElementById('selected-event-title');

    // Elementi del pop-up
    const mailingListPopup = document.getElementById('mailing-list-popup-overlay');
    const mailingListForm = document.getElementById('mailing-list-form');
    const closePopupBtn = document.getElementById('close-popup-btn');
    const skipToBookingBtn = document.getElementById('skip-to-booking-btn');
    const mailingListMessage = document.getElementById('mailing-list-message');

    let allBookableEvents = []; // Array per memorizzare TUTTI gli eventi dal backend
    let selectedEvent = null; // Oggetto per l'evento attualmente selezionato

    const backendBaseUrl = 'https://felabackend.onrender.com'; // URL di produzione
    // const backendBaseUrl = 'http://127.0.0.1:8000'; // URL per lo sviluppo locale 

    // --- CONFIGURAZIONE PUSH NOTIFICATION ---
    // IMPORTANTE: Sostituisci questa stringa con la tua VAPID Public Key reale
    const VAPID_PUBLIC_KEY = "BOK07nYxyGjm-1_vsGbhmUqWM6orFC-wN3qzyZG8ljEdDtDP-o-7bsiOuqNr1efpvOzY4v5NoaZraug4Z6s1S6s"; 

    // Funzione di utilità per convertire la chiave VAPID da stringa base64 a Uint8Array
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Funzione per iscrivere l'utente alle notifiche push
    async function subscribeUserToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push messaging non supportato dal browser.');
            return null;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log('Sottoscrizione Push ottenuta con successo:', subscription);
            return subscription;
        } catch (err) {
            console.error('Impossibile iscrivere l\'utente alle notifiche:', err);
            return null;
        }
    }

    // Funzione per mostrare la selezione degli eventi e nascondere il form
    const showEventSelection = () => {
        pageSubtitle.textContent = 'Seleziona un evento per cui prenotare.';
        eventSelectionContainer.style.display = 'grid';
        bookingFormWrapper.style.display = 'none';
        selectedEvent = null;
        form.reset();
        messageDiv.innerHTML = '';
    };

    // Funzione per mostrare il pop-up della mailing list
    const showMailingListPopup = (event) => {
        selectedEvent = event;
        mailingListPopup.classList.add('visible');
    };

    // Funzione per nascondere il pop-up
    const hideMailingListPopup = () => {
        mailingListPopup.classList.remove('visible');
        if (mailingListForm) mailingListForm.reset();
        if (mailingListMessage) mailingListMessage.innerHTML = '';
    };

    // Funzione per mostrare il form di prenotazione
    const proceedToBookingForm = () => {
        pageSubtitle.textContent = 'Compila il modulo per completare la prenotazione.';
        selectedEventTitle.textContent = selectedEvent.display_name;
        
        if (selectedEvent.available_slots && selectedEvent.available_slots.length > 0) {
            brunchSlotSelector.required = true;
            brunchSlotSelector.innerHTML = '<option value="" disabled selected>Seleziona un turno...</option>';
            selectedEvent.available_slots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = `Turno ${slot.substring(0, 5)}`;
                brunchSlotSelector.appendChild(option);
            });
            brunchSlotGroup.style.display = 'block';
        } else {
            brunchSlotSelector.required = false;
            brunchSlotGroup.style.display = 'none';
        }

        eventSelectionContainer.style.display = 'none';
        bookingFormWrapper.style.display = 'block';
    };

    // --- Carica e visualizza gli eventi prenotabili come box ---
    // Eseguiamo questa parte SOLO se esiste il contenitore degli eventi (cioè siamo nella pagina Prenota)
    if (eventSelectionContainer) {
        try {
            const response = await fetch(`${backendBaseUrl}/api/bookable-events`);
            if (!response.ok) throw new Error('Errore nel caricamento degli eventi.');

            allBookableEvents = await response.json();

            eventSelectionContainer.innerHTML = ''; // Pulisce il contenitore

            if (allBookableEvents.length === 0) {
                eventSelectionContainer.innerHTML = '<p class="no-events-message">Al momento non ci sono eventi prenotabili. Torna a trovarci presto!</p>';
            } else {
                allBookableEvents.forEach(event => {
                    const eventBox = document.createElement('div');
                    eventBox.className = 'event-box';
                    eventBox.setAttribute('role', 'button');
                    eventBox.tabIndex = 0;

                    const eventDate = new Date(event.booking_date);
                    const formattedDate = eventDate.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    });

                    eventBox.innerHTML = `
                        <h3 class="event-box-title">${event.display_name}</h3>
                        <p class="event-box-date">${formattedDate}</p>
                    `;

                    // Aggiungi evento click per mostrare il form
                    eventBox.addEventListener('click', () => showMailingListPopup(event));
                    eventBox.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            showMailingListPopup(event);
                        }
                    });

                    eventSelectionContainer.appendChild(eventBox);
                });
            }

        } catch (error) {
            console.error("Impossibile caricare gli eventi:", error);
            eventSelectionContainer.innerHTML = '<p class="no-events-message">Non è stato possibile caricare gli eventi. Riprova più tardi.</p>';
        }
    }

    // --- Gestisce il click sul pulsante "Torna agli eventi" ---
    if (backToEventsBtn) backToEventsBtn.addEventListener('click', showEventSelection);

    // --- Gestione del Pop-up Mailing List ---
    if (skipToBookingBtn) skipToBookingBtn.addEventListener('click', () => {
        hideMailingListPopup();
        proceedToBookingForm();
    });

    if (closePopupBtn) closePopupBtn.addEventListener('click', hideMailingListPopup);

    if (mailingListPopup) mailingListPopup.addEventListener('click', (e) => {
        if (e.target === mailingListPopup) {
            hideMailingListPopup();
        }
    });

    if (mailingListForm) mailingListForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('popup-email');
        const nameInput = document.getElementById('popup-name');
        const surnameInput = document.getElementById('popup-surname');

        const emailValue = emailInput.value;
        const nameValue = nameInput ? nameInput.value : '';
        const surnameValue = surnameInput ? surnameInput.value : '';

        // Controllo che nome e cognome contengano solo lettere e spazi
        const lettersRegex = /^[a-zA-Z\u00C0-\u00FF\s]*$/;
        if (!lettersRegex.test(nameValue) || !lettersRegex.test(surnameValue)) {
            mailingListMessage.textContent = 'Nome e cognome devono contenere solo lettere.';
            mailingListMessage.style.color = 'red';
            return;
        }

        mailingListMessage.textContent = 'Iscrizione in corso...';
        mailingListMessage.style.color = '#333';

        // --- INTEGRAZIONE GOOGLE SHEETS ---
        // Incolla qui l'URL della tua Web App di Google Apps Script
        const googleSheetUrl = 'https://script.google.com/macros/s/AKfycbwS2TrHYapffuhYlXBgQ5B7gp7t2V7xhMWaO-FlJwZ3PsTwv5sKExzUqpIJaDbNfUzP/exec'; // Es: 'https://script.google.com/macros/s/AKfycbx.../exec'

        if (googleSheetUrl) {
            console.log('Tentativo invio a Google Sheet:', { email: emailValue, name: nameValue, surname: surnameValue });
            // Invio "fire and forget" a Google Sheets (non blocca l'esecuzione se fallisce)
            fetch(googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors', // Necessario per inviare dati a Google senza errori CORS
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ 
                    email: emailValue,
                    name: nameValue,
                    surname: surnameValue
                })
            }).catch(err => console.warn('Errore invio a Google Sheet:', err));
        }
        // ----------------------------------

        // --- INVIO AL BACKEND (Database + Email Benvenuto) ---
        try {
            const response = await fetch(`${backendBaseUrl}/api/mailing-list-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue })
            });

            const result = await response.json();

            if (!response.ok && response.status !== 201 && response.status !== 200) {
                throw new Error(result.detail || 'Risposta non valida dal server.');
            }

            mailingListMessage.textContent = result.message === "Email già iscritta!" 
                ? "Sei già dei nostri! Grazie!" 
                : "Grazie per esserti iscritto!";
                
            mailingListMessage.style.color = 'green';
            setTimeout(() => { hideMailingListPopup(); proceedToBookingForm(); }, 2000);
        } catch (error) {
            mailingListMessage.textContent = 'Si è verificato un errore. Riprova.';
            mailingListMessage.style.color = 'red';
            console.error("Errore iscrizione mailing list:", error);
        }
    });

    // --- Gestisce l'invio del form di prenotazione ---
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impedisce il ricaricamento della pagina

            if (!selectedEvent) {
                messageDiv.textContent = 'Nessun evento selezionato. Torna indietro e scegline uno.';
                messageDiv.style.color = 'red';
                return;
            }

            messageDiv.textContent = 'Elaborazione prenotazione...';
            messageDiv.style.color = '#333';

            // --- TENTATIVO DI ISCRIZIONE PUSH ---
            // Proviamo a ottenere la sottoscrizione prima di inviare i dati
            // Se l'utente rifiuta o c'è un errore, pushSubscription sarà null e la prenotazione procederà comunque.
            const pushSubscription = await subscribeUserToPush();
            // ------------------------------------

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                booking_date: selectedEvent.booking_date, // La data è sempre quella dell'evento
                // Usa il valore del turno selezionato se l'evento ha available_slots, altrimenti usa booking_time dell'evento
                booking_time: (selectedEvent.available_slots && selectedEvent.available_slots.length > 0) ? brunchSlotSelector.value : (selectedEvent.booking_time || null),
                event_id: selectedEvent.id,
                guests: parseInt(document.getElementById('guests').value, 10),
                notes: document.getElementById('notes').value,
                push_subscription: pushSubscription // Aggiungiamo l'oggetto sottoscrizione (o null)
            };

            messageDiv.textContent = 'Invio in corso...';
            messageDiv.style.color = '#333';

            try {
                const response = await fetch(`${backendBaseUrl}/api/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    const result = await response.json();
                    // Modifichiamo il messaggio di successo per includere il suggerimento sulla cartella spam
                    messageDiv.innerHTML = `
                        <p style="font-size: 1.1em; margin-bottom: 10px;">Prenotazione confermata!</p>
                    `;
                    messageDiv.style.color = 'green';

                    // --- TRACCIAMENTO GOOGLE ANALYTICS ---
                    if (typeof gtag === 'function') {
                        gtag('event', 'booking_completed', {
                            'event_category': 'Booking',
                            'event_label': selectedEvent.display_name,
                            'value': formData.guests
                        });
                    }
                    // -------------------------------------

                    form.reset();
                    setTimeout(showEventSelection, 4000); // Torna alla selezione eventi dopo 4 secondi
                } else {
                    const error = await response.json();
                    messageDiv.textContent = `Errore: ${error.detail || 'Impossibile completare la prenotazione.'}`;
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Errore di rete:', error);
                messageDiv.textContent = 'Errore di connessione con il server. Riprova più tardi.';
                messageDiv.style.color = 'red';
            }
        });
    }

    // --- NUOVO: Gestione iscrizione push all'installazione della PWA ---
    // Questo intercetta l'evento di installazione dell'app (quando l'utente la aggiunge alla Home).
    window.addEventListener('appinstalled', async (event) => {
        console.log('PWA installata con successo!');
        // Questo è un ottimo momento per chiedere il permesso per le notifiche,
        // dato che l'utente ha mostrato un forte interesse per l'app.
        const subscription = await subscribeUserToPush();
        if (subscription) {
            // Invia la sottoscrizione al backend per salvarla nella lista generale.
            // In questo modo, l'utente riceverà le notifiche broadcast (es. programma del lunedì).
            try {
                const response = await fetch(`${backendBaseUrl}/api/push-subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
                if (response.ok) {
                    console.log('Sottoscrizione push inviata al backend dopo installazione PWA.');
                }
            } catch (error) {
                console.error('Errore di rete durante l\'invio della sottoscrizione post-installazione:', error);
            }
        }
    });

    // --- NUOVO: Definiamo le icone SVG per la campanella (Nuovo Stile) ---
    // Icona Outline (Disattivo) - Più pulita e moderna
    const bellIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
    
    // Icona Filled (Attivo) - Piena per indicare che le notifiche sono accese
    const bellActiveIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="currentColor" stroke="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;

    // --- NUOVO: Stili per l'animazione della campanella ---
    const bellStyleSheet = document.createElement("style");
    bellStyleSheet.innerText = `
        @keyframes bellRing {
            0% { transform: rotate(0); }
            15% { transform: rotate(15deg); }
            30% { transform: rotate(-15deg); }
            45% { transform: rotate(10deg); }
            60% { transform: rotate(-10deg); }
            75% { transform: rotate(5deg); }
            100% { transform: rotate(0); }
        }
        .bell-ringing svg {
            animation: bellRing 0.8s ease-in-out;
            transform-origin: top center;
        }
    `;
    document.head.appendChild(bellStyleSheet);

    // --- NUOVO: Gestione Pulsante Notifiche a Campanella nella Navbar ---
    const notificationBellBtn = document.getElementById('navbar-notification-btn');

    // Funzione helper per mostrare notifiche in stile "Fela!"
    function showCustomNotification(message) {
        let notification = document.getElementById('custom-notification-toast');
        
        // Se non esiste, crealo dinamicamente
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'custom-notification-toast';
            notification.className = 'custom-notification';
            document.body.appendChild(notification);
        }
        
        // Impostiamo solo il testo del messaggio (senza icona)
        notification.textContent = message;
        
        // --- FIX ANIMAZIONE ---
        // Rimuoviamo la classe e forziamo un "reflow" (lettura offsetWidth)
        // Questo costringe il browser a calcolare lo stato iniziale (nascosto) prima di applicare l'animazione.
        notification.classList.remove('show');
        void notification.offsetWidth; 

        notification.classList.add('show');
        
        // Nascondi automaticamente dopo 4 secondi (un po' più lungo per leggere)
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    // Funzione per aggiornare l'aspetto della campanella in base allo stato reale
    async function updateBellUI() {
        if (!notificationBellBtn || !('serviceWorker' in navigator)) return;

        // --- NUOVO: Controllo se l'app è in modalità standalone (PWA installata) ---
        // window.navigator.standalone serve per iOS, matchMedia per Android/Desktop
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

        if (!isStandalone) {
            notificationBellBtn.style.display = 'none';
            return;
        }

        if (Notification.permission === 'denied') {
            notificationBellBtn.style.display = 'none';
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            notificationBellBtn.style.display = 'flex';
            notificationBellBtn.disabled = false; // Assicura che sia sempre cliccabile

            if (subscription) {
                // UTENTE ISCRITTO: Mostra campanella piena
                notificationBellBtn.innerHTML = bellActiveIconSVG;
                notificationBellBtn.setAttribute('aria-label', 'Disattiva notifiche');
                notificationBellBtn.title = 'Notifiche attive. Clicca per disattivare.';
            } else {
                // UTENTE NON ISCRITTO: Mostra campanella vuota
                notificationBellBtn.innerHTML = bellIconSVG;
                notificationBellBtn.setAttribute('aria-label', 'Attiva notifiche');
                notificationBellBtn.title = 'Clicca per attivare le notifiche.';
            }
        } catch (e) {
            console.error('Errore aggiornamento UI campanella:', e);
        }
    }

    if (notificationBellBtn && 'Notification' in window && 'serviceWorker' in navigator) {
        // 1. Controllo iniziale dello stato
        updateBellUI();

        // 2. Gestione del Click (Toggle)
        notificationBellBtn.addEventListener('click', async () => {
            notificationBellBtn.disabled = true; // Disabilita temporaneamente durante l'operazione
            
            // --- ANIMAZIONE ---
            notificationBellBtn.classList.add('bell-ringing');
            setTimeout(() => notificationBellBtn.classList.remove('bell-ringing'), 800); // Rimuovi classe dopo l'animazione

            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    // --- DISATTIVAZIONE ---
                    await subscription.unsubscribe();
                    showCustomNotification('Notifiche disattivate.');
                } else {
                    // --- ATTIVAZIONE ---
                    const newSubscription = await subscribeUserToPush();
                    if (newSubscription) {
                        const response = await fetch(`${backendBaseUrl}/api/push-subscribe`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newSubscription)
                        });
                        
                        if (response.ok) {
                            showCustomNotification('Notifiche attivate!');
                        } else {
                            throw new Error('Errore salvataggio backend');
                        }
                    }
                }
            } catch (error) {
                console.error('Errore durante il toggle notifiche:', error);
                // Non mostriamo alert se l'utente ha semplicemente annullato il prompt dei permessi
                if (Notification.permission !== 'default') {
                    showCustomNotification('Si è verificato un errore o i permessi sono stati negati.');
                }
            } finally {
                // 3. Aggiorna l'icona in base al nuovo stato
                await updateBellUI();
            }
        });
    }

    // --- NUOVO: Ascoltatore per attivazione notifiche da eventi esterni (es. Installazione App) ---
    window.addEventListener('enable-push-notifications', async () => {
        console.log('Richiesta iscrizione notifiche da evento esterno (Installa App)...');
        const subscription = await subscribeUserToPush();
        
        if (subscription) {
            try {
                await fetch(`${backendBaseUrl}/api/push-subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
                console.log('Iscrizione push completata con successo.');
                // Aggiorna l'icona della campanella se la funzione è disponibile
                if (typeof updateBellUI === 'function') {
                    await updateBellUI();
                }
            } catch (error) {
                console.error('Errore salvataggio push (evento esterno):', error);
            }
        }
    });
});
