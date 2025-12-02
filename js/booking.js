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

    // const backendBaseUrl = 'https://felabackend.onrender.com'; // URL di produzione
    const backendBaseUrl = 'http://127.0.0.1:8000'; // URL per lo sviluppo locale 

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
        const emailValue = emailInput.value;
        mailingListMessage.textContent = 'Iscrizione in corso...';
        mailingListMessage.style.color = '#333';

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
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impedisce il ricaricamento della pagina

        if (!selectedEvent) {
            messageDiv.textContent = 'Nessun evento selezionato. Torna indietro e scegline uno.';
            messageDiv.style.color = 'red';
            return;
        }

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            booking_date: selectedEvent.booking_date, // La data è sempre quella dell'evento
            // Usa il valore del turno selezionato se l'evento ha available_slots, altrimenti usa booking_time dell'evento
            booking_time: (selectedEvent.available_slots && selectedEvent.available_slots.length > 0) ? brunchSlotSelector.value : selectedEvent.booking_time,
            event_id: selectedEvent.id,
            guests: parseInt(document.getElementById('guests').value, 10),
            notes: document.getElementById('notes').value,
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
});
