document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('booking-form');
    const messageDiv = document.getElementById('form-message');
    const eventSelector = document.getElementById('event-selector');
    const brunchSlotGroup = document.getElementById('brunch-slot-group');
    const brunchSlotSelector = document.getElementById('brunch-slot-selector');
    
    let allBookableEvents = []; // Array per memorizzare TUTTI gli eventi dal backend
    let displayedEvents = [];   // Array per memorizzare gli eventi filtrati (mese corrente) e mostrati all'utente
    
    const backendBaseUrl = 'https://felabackend.onrender.com';

    // --- Carica e filtra gli eventi prenotabili ---
    try {
        const response = await fetch(`${backendBaseUrl}/api/bookable-events`);
        if (!response.ok) throw new Error('Errore nel caricamento degli eventi.');
        
        allBookableEvents = await response.json();

        // --- Logica di filtraggio per mese corrente ---
        const today = new Date();
        const currentMonth = today.getMonth(); // 0-indexed (Gennaio è 0, Dicembre è 11)
        const currentYear = today.getFullYear();

        displayedEvents = allBookableEvents.filter(event => {
            // La data dal backend è una stringa ISO (es. "2025-11-23"), la convertiamo in oggetto Date
            const eventDate = new Date(event.booking_date);
            return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        });

        // --- Popola il menu a tendina con gli eventi filtrati ---
        eventSelector.innerHTML = '<option value="" disabled selected>Seleziona un evento...</option>'; // Pulisce e aggiunge opzione di default

        if (displayedEvents.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Nessun evento disponibile per questo mese";
            option.disabled = true;
            eventSelector.appendChild(option);
        } else {
            displayedEvents.forEach((event, index) => {
                const option = document.createElement('option');
                option.value = index; // Usiamo l'indice per recuperare i dati completi dall'array `displayedEvents`
                option.textContent = event.display_name;
                eventSelector.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Impossibile caricare gli eventi:", error);
        messageDiv.textContent = 'Non è stato possibile caricare gli eventi prenotabili. Riprova più tardi.';
        messageDiv.style.color = 'red';
    }

    // --- Mostra/nasconde il selettore dei turni in base all'evento scelto ---
    eventSelector.addEventListener('change', () => {
        const selectedEventIndex = eventSelector.value;
        if (selectedEventIndex === "") {
            brunchSlotGroup.style.display = 'none';
            brunchSlotSelector.required = false;
            return;
        }

        // Recupera l'evento corretto dall'array degli eventi visualizzati
        const selectedEvent = displayedEvents[selectedEventIndex];

        if (selectedEvent.type === 'brunch' && selectedEvent.available_slots) {
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
        event.preventDefault(); // Impedisce il ricaricamento della pagina

        const selectedEventIndex = eventSelector.value;
        if (selectedEventIndex === "") return; // Non fare nulla se non è stato selezionato un evento

        // Recupera l'evento corretto dall'array degli eventi visualizzati
        const selectedEvent = displayedEvents[selectedEventIndex];

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            booking_date: selectedEvent.booking_date,
            booking_time: selectedEvent.type === 'brunch' ? brunchSlotSelector.value : selectedEvent.booking_time,
            event_id: selectedEvent.id, // Invia l'ID dell'evento se presente (sarà null per i brunch)
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
                messageDiv.textContent = 'Prenotazione confermata! Controlla la tua email.';
                messageDiv.style.color = 'green';
                form.reset();
                brunchSlotGroup.style.display = 'none'; // Nasconde di nuovo il selettore del brunch
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
