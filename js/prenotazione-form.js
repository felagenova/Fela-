document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('booking-form');
    const messageDiv = document.getElementById('form-message');
    const eventSelector = document.getElementById('event-selector');
    const brunchSlotGroup = document.getElementById('brunch-slot-group');
    const brunchSlotSelector = document.getElementById('brunch-slot-selector');

    let allBookableEvents = [];
    let selectedEvent = null;

    const backendBaseUrl = 'http://127.0.0.1:8000';

    // --- Carica gli eventi nel menu a tendina ---
    try {
        const response = await fetch(`${backendBaseUrl}/api/bookable-events`);
        if (!response.ok) throw new Error('Errore nel caricamento degli eventi.');

        allBookableEvents = await response.json();

        if (allBookableEvents.length === 0) {
            eventSelector.innerHTML = '<option value="">Nessun evento prenotabile</option>';
            eventSelector.disabled = true;
        } else {
            allBookableEvents.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.display_name;
                eventSelector.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Impossibile caricare gli eventi:", error);
        eventSelector.innerHTML = '<option value="">Errore caricamento eventi</option>';
        eventSelector.disabled = true;
    }

    // --- Gestisce il cambio di evento nel menu a tendina ---
    eventSelector.addEventListener('change', () => {
        const selectedEventId = eventSelector.value;
        selectedEvent = allBookableEvents.find(e => e.id == selectedEventId);

        if (selectedEvent && selectedEvent.available_slots && selectedEvent.available_slots.length > 0) {
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
    });

    // --- Gestisce l'invio del form di prenotazione ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const selectedEventId = eventSelector.value;
        selectedEvent = allBookableEvents.find(e => e.id == selectedEventId);

        if (!selectedEvent) {
            messageDiv.textContent = 'Per favore, seleziona un evento valido.';
            messageDiv.style.color = 'red';
            return;
        }

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            booking_date: selectedEvent.booking_date,
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                messageDiv.innerHTML = `
                    <p style="font-size: 1.1em; margin-bottom: 10px;">Prenotazione confermata!</p>
                    <p>Riceverai un'email di riepilogo. Controlla anche la cartella Spam.</p>
                `;
                messageDiv.style.color = 'green';
                form.reset();
                eventSelector.value = "";
                brunchSlotGroup.style.display = 'none';
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