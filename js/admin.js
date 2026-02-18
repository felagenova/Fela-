document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const adminMessageDiv = document.getElementById('admin-message');
    const bookingsListDiv = document.getElementById('bookings-list');
    const bookingsTableBody = document.querySelector('#bookings-table tbody');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    const paginationControls = document.getElementById('pagination-controls');
    const eventFilter = document.getElementById('event-filter');
    const exportPdfButton = document.getElementById('export-pdf');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    let currentPage = 0; // Pagina corrente (inizia da 0)

    const addSpecialEventForm = document.getElementById('add-special-event-form');
    const specialEventsMessageDiv = document.getElementById('special-events-message');
    const specialEventsTableBody = document.getElementById('special-events-table-body');
    const saveEventBtn = document.getElementById('save-event-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // Elementi per le notifiche broadcast
    const broadcastForm = document.getElementById('broadcast-notification-form');
    const broadcastMessageDiv = document.getElementById('broadcast-message');
    const subscriberCountSpan = document.getElementById('subscriber-count');

    const loadBookingsBtn = document.getElementById('load-bookings-btn');
    let bookableEvents = [];
    let totalBookings = 0;
    const bookingsPerPage = 50; // Aumentato drasticamente per evitare che le prenotazioni finiscano in pagina 2
    const MAX_EXPORT_RECORDS = 2000; // Limite massimo di record per l'esportazione PDF
    let currentSpecialEvents = []; // Store locale per gli eventi

    const backendBaseUrl = 'https://felabackend.onrender.com'; // URL di produzione
    // const backendBaseUrl = 'http://127.0.0.1:8000'; // URL per lo sviluppo locale

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = document.getElementById('admin_password').value;
        const username = 'admin'; // Username fisso per questo esempio

        adminMessageDiv.textContent = 'Accesso in corso...';
        adminMessageDiv.style.color = '#333';

        try {
            // Codifica le credenziali per l'autenticazione Basic (Base64)
            const encodedCredentials = btoa(`${username}:${password}`);

            const response = await fetch(`${backendBaseUrl}/api/admin/bookings`, { // Test iniziale di autenticazione
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                adminMessageDiv.textContent = 'Accesso riuscito!';
                adminMessageDiv.style.color = 'green';
                
                // Salva lo stato di login per il pannello menu
                sessionStorage.setItem('fela_admin_logged_in', 'true');

                // Nasconde l'intera card di login, non solo il form
                loginForm.parentElement.style.display = 'none';
                document.querySelector('.admin-nav-links').style.display = 'block'; // Mostra il link al menu
                bookingsListDiv.style.display = 'block'; // Mostra la lista delle prenotazioni
                await populateEventFilter(); // Popola il filtro
                loadBookings(currentPage); // Carica la prima pagina
                await loadSpecialEvents(); // Carica gli eventi speciali
                loadSubscriberCount(); // Carica il conteggio iscritti

                // Scrolla dolcemente alla card di gestione eventi
                const specialEventsCard = document.getElementById('special-events-card');
                if (specialEventsCard) {
                    specialEventsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                const error = await response.json();
                adminMessageDiv.textContent = `Errore di accesso: ${error.detail || 'Credenziali non valide.'}`;
                adminMessageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Errore di rete:', error);
            adminMessageDiv.textContent = 'Errore di connessione con il server. Riprova più tardi.';
            adminMessageDiv.style.color = 'red';
        }
    });

    // --- Popola il filtro degli eventi ---
    async function populateEventFilter() {
        try {
            const response = await fetch(`${backendBaseUrl}/api/bookable-events`);
            if (!response.ok) throw new Error('Errore caricamento eventi');
            bookableEvents = await response.json();

            eventFilter.innerHTML = '<option value="all">Tutti gli eventi</option>'; // Reset del filtro

            bookableEvents.forEach(event => {
                // Se l'evento ha più turni (available_slots), crea un'opzione per ogni turno
                if (event.available_slots && event.available_slots.length > 0) {
                    event.available_slots.forEach(slot => {
                        const option = document.createElement('option');
                        // Il valore conterrà la data e lo specifico turno
                        option.value = `brunch_${event.booking_date}|${slot}`;
                        // Il testo mostrerà il nome dell'evento e l'ora del turno
                        option.textContent = `${event.display_name} - Turno ${slot.substring(0, 5)}`;
                        eventFilter.appendChild(option);
                    });
                } else {
                    // Altrimenti, crea una singola opzione per l'evento (speciale o con orario unico)
                    const option = document.createElement('option');
                    option.value = event.id ? `special_${event.id}` : `brunch_${event.booking_date}|${event.booking_time || ''}`; // Usa stringa vuota se non c'è orario
                    option.textContent = event.display_name;
                    eventFilter.appendChild(option);
                }
            });
        } catch (error) {
            console.error("Impossibile caricare gli eventi per il filtro:", error); // Questo errore potrebbe essere causato da problemi CORS
        }
    }

    // --- Helper per gestire lo stato di caricamento dei pulsanti ---
    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    // --- Funzione per caricare le prenotazioni con paginazione ---
    async function loadBookings(page) {
        const skip = page * bookingsPerPage;
        let urlWithParams = `${backendBaseUrl}/api/admin/bookings?skip=${skip}&limit=${bookingsPerPage}&_t=${Date.now()}`; // Aggiunto timestamp per evitare caching

        const filterValue = eventFilter.value;
        if (filterValue !== 'all') {
            if (filterValue.startsWith('special_')) {
                const eventId = filterValue.substring(8); // Estrae l'ID dopo "special_"
                urlWithParams += `&event_id=${eventId}`;
            } else if (filterValue.startsWith('brunch_')) {
                const [date, time] = filterValue.substring(7).split('|');
                urlWithParams += `&event_date=${date}`;
                // Aggiungi il filtro orario solo se c'è un orario specifico, altrimenti mostra tutto il giorno
                if (time) urlWithParams += `&event_time=${time}`;
            }
        }

        // Se la chiamata è stata attivata dal pulsante "Carica", mostra lo spinner
        setButtonLoading(loadBookingsBtn, true);

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(urlWithParams, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                totalBookings = data.total;
                displayBookings(data.bookings);
                paginationControls.style.display = 'flex'; // Mostra i controlli usando flex per il corretto allineamento
                prevPageButton.disabled = page === 0; // Disabilita "Precedente" se siamo alla prima pagina
                // Disabilita "Successivo" se non ci sono altre pagine
                nextPageButton.disabled = (page + 1) * bookingsPerPage >= totalBookings;
            } else {
                const error = await response.json();
                adminMessageDiv.textContent = `Errore nel caricamento: ${error.detail || 'Impossibile caricare le prenotazioni.'}`;
                adminMessageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Errore di rete:', error);
            adminMessageDiv.textContent = 'Errore di connessione con il server.';
            adminMessageDiv.style.color = 'red';
        } finally {
            setButtonLoading(loadBookingsBtn, false);
        }
    }


    function displayBookings(bookings) {
        bookingsTableBody.innerHTML = ''; // Pulisce la tabella prima di aggiungere nuovi dati

        if (bookings.length === 0) {
            noBookingsMessage.style.display = 'block';
            bookingsTableBody.style.display = 'none';
        } else {
            noBookingsMessage.style.display = 'none';
            bookingsTableBody.style.display = 'table-row-group'; // Mostra il tbody
            bookings.forEach(booking => {
                const headers = ["ID", "Nome", "Email", "Telefono", "Data", "Ora", "Ospiti", "Note", "Azioni"];
                const row = bookingsTableBody.insertRow();

                const cellsData = [
                    booking.id,
                    booking.name,
                    booking.email,
                    booking.phone,
                    booking.booking_date,
                    booking.booking_time || '', // Gestisce il caso null per evitare errori visivi
                    booking.guests,
                    booking.notes || ''
                ];

                cellsData.forEach((data, index) => {
                    const cell = row.insertCell();
                    cell.innerHTML = `<span class="cell-value">${data}</span>`; // Avvolge il dato in uno span
                    cell.setAttribute('data-label', headers[index]); // Aggiunge il data-label
                });

                // Aggiunge la cella per il pulsante di cancellazione
                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Cancella';
                deleteButton.className = 'btn-delete'; // Aggiungi una classe per lo stile
                deleteButton.onclick = () => deleteBooking(booking.cancellation_token, row);
                actionCell.setAttribute('data-label', headers[headers.length - 1]); // Aggiunge il data-label per Azioni
                actionCell.appendChild(deleteButton);
            });
        }
    }

    async function deleteBooking(token, rowElement) {
        if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
            return;
        }

        const deleteUrl = `${backendBaseUrl}/api/bookings/cancel/${token}`;
        const response = await fetch(deleteUrl, { method: 'GET' }); // Usiamo GET come definito nel backend

        if (response.ok) {
            // Rimuove la riga dalla tabella con un effetto di dissolvenza
            rowElement.style.transition = 'opacity 0.5s ease';
            rowElement.style.opacity = '0';
            setTimeout(() => rowElement.remove(), 500);
            alert('Prenotazione cancellata con successo.');
        } else {
            alert('Errore durante la cancellazione della prenotazione.');
        }
    }

    // --- Esporta in PDF ---
    async function exportToPDF() {
        adminMessageDiv.textContent = 'Creazione del PDF in corso...';
        adminMessageDiv.style.color = '#333';

        setButtonLoading(exportPdfButton, true);

        // 1. Recupera TUTTE le prenotazioni per il filtro corrente per calcolare il totale degli ospiti
        let allBookingsForFilter = [];
        let totalGuests = 0;
        let urlToFetchAll = `${backendBaseUrl}/api/admin/bookings?limit=${MAX_EXPORT_RECORDS}`; // Limite alto per prenderle tutte
        const filterValue = eventFilter.value;

        if (filterValue !== 'all') {
            if (filterValue.startsWith('special_')) {
                urlToFetchAll += `&event_id=${filterValue.substring(8)}`;
            } else if (filterValue.startsWith('brunch_')) {
                const [date, time] = filterValue.substring(7).split('|');
                urlToFetchAll += `&event_date=${date}`;
                if (time) urlToFetchAll += `&event_time=${time}`;
            }
        }

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const allBookingsResponse = await fetch(urlToFetchAll, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            if (!allBookingsResponse.ok) throw new Error('Impossibile caricare i dati per il riepilogo.');
            
            const data = await allBookingsResponse.json();
            allBookingsForFilter = data.bookings || [];
            totalGuests = allBookingsForFilter.reduce((sum, booking) => sum + (booking.guests || 0), 0);

        } catch (error) {
            adminMessageDiv.textContent = `Errore nella preparazione del PDF: ${error.message}`;
            adminMessageDiv.style.color = 'red';
            setButtonLoading(exportPdfButton, false);
            return; // Interrompe l'esecuzione se non riesce a caricare i dati
        }

        const selectedOptionText = eventFilter.options[eventFilter.selectedIndex]?.text || '';

        // Estrae il nome evento rimuovendo eventuali suffissi tipo " - Turno HH:MM"
        let eventTitle = selectedOptionText;
        if (selectedOptionText.includes(' - Turno ')) {
            eventTitle = selectedOptionText.split(' - Turno ')[0];
        } else if (selectedOptionText.includes(' - ')) {
            // fallback: rimuove parti dopo un trattino se non è un turno
            eventTitle = selectedOptionText.split(' - ')[0];
        }

        // Definiamo le intestazioni corrette da inviare al backend
        const headers = ["ID", "Nome", "Email", "Telefono", "Data", "Ora", "Ospiti", "Note"];
        const encodedHeaders = encodeURIComponent(JSON.stringify(headers));

        // Usa il conteggio effettivo delle prenotazioni caricate per il riepilogo
        const totalBookingsForPdf = allBookingsForFilter.length;

        // Definiamo il titolo del documento da inviare al backend
        const title = (filterValue === 'all' || !selectedOptionText) 
            ? 'Riepilogo di tutte le prenotazioni' 
            : `Prenotazioni di ${eventTitle}`;
        const encodedTitle = encodeURIComponent(title);

        // 2. Crea la stringa di riepilogo
        const summaryText = `Riepilogo: ${totalBookingsForPdf} prenotazioni per un totale di ${totalGuests} ospiti.`;
        const encodedSummary = encodeURIComponent(summaryText);

        // 3. Aggiungiamo intestazioni, titolo, riepilogo e limite alla URL
        let urlToFetch = `${backendBaseUrl}/api/bookings/pdf?limit=${MAX_EXPORT_RECORDS}&headers=${encodedHeaders}&title=${encodedTitle}&summary=${encodedSummary}`;

        if (filterValue !== 'all') {
            if (filterValue.startsWith('special_')) {
                const eventId = filterValue.substring(8); // Estrae l'ID dopo "special_"
                urlToFetch += `&event_id=${eventId}`;
            } else if (filterValue.startsWith('brunch_')) {
                const [date, time] = filterValue.substring(7).split('|');
                urlToFetch += `&event_date=${date}`;
                if (time) urlToFetch += `&event_time=${time}`;
            }
        }

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(urlToFetch, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Errore dal server: ${response.status} ${response.statusText}`);
            }

            // Nome file dinamico
            let filename;
            if (filterValue === 'all' || !selectedOptionText) {
                filename = 'prenotazioni_tutti_gli_eventi.pdf';
            } else {
                const safeEventName = eventTitle
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '_');
                filename = `prenotazioni_${safeEventName}.pdf`;
            }

            const pdfBlob = await response.blob();
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Crea un link temporaneo per avviare il download
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(pdfUrl);

            adminMessageDiv.textContent = 'PDF esportato con successo!';
            adminMessageDiv.style.color = 'green';
        } catch (error) {
            console.error('Errore durante l\'esportazione in PDF:', error);
            adminMessageDiv.textContent = 'Impossibile esportare il PDF. Controlla la console per i dettagli.';
            adminMessageDiv.style.color = 'red';
        } finally {
            setButtonLoading(exportPdfButton, false);
        }
    }

    // --- Gestione Invio Notifiche Broadcast ---
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!confirm('Sei sicuro di voler inviare questa notifica a TUTTI gli utenti iscritti?')) {
                return;
            }

            const title = document.getElementById('notif_title').value;
            const body = document.getElementById('notif_body').value;
            const url = document.getElementById('notif_url').value || 'https://felagenova.github.io';

            broadcastMessageDiv.textContent = 'Invio in corso...';
            broadcastMessageDiv.style.color = '#333';

            try {
                const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
                const response = await fetch(`${backendBaseUrl}/api/admin/broadcast-notification`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title, body, url }),
                });

                if (response.ok) {
                    broadcastMessageDiv.textContent = 'Notifica inviata con successo!';
                    broadcastMessageDiv.style.color = 'green';
                    broadcastForm.reset();
                    // Rimuovi il messaggio dopo qualche secondo
                    setTimeout(() => { broadcastMessageDiv.textContent = ''; }, 5000);
                } else {
                    const error = await response.json();
                    broadcastMessageDiv.textContent = `Errore: ${error.detail || 'Impossibile inviare la notifica.'}`;
                    broadcastMessageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Errore di rete:', error);
                broadcastMessageDiv.textContent = 'Errore di connessione con il server.';
                broadcastMessageDiv.style.color = 'red';
            }
        });
    }

    // --- Funzione per caricare il conteggio degli iscritti ---
    async function loadSubscriberCount() {
        if (!subscriberCountSpan) return;
        
        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/push-subscriptions/count`, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                subscriberCountSpan.textContent = data.count;
            } else {
                subscriberCountSpan.textContent = "N/D";
            }
        } catch (error) {
            console.error("Errore caricamento conteggio iscritti:", error);
            subscriberCountSpan.textContent = "Err";
        }
    }

    // --- Gestione Eventi Speciali ---
    addSpecialEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = document.getElementById('event_id').value;
        const eventDisplayName = document.getElementById('event_display_name').value;
        const eventDescription = document.getElementById('event_description').value;
        const eventDate = document.getElementById('event_date').value;
        const eventTime = document.getElementById('event_time').value; // Può essere vuoto
        const maxGuestsInput = document.getElementById('max_guests').value; // Recupera il valore max_guests
        
        // Raccoglie i turni e le relative capacità specifiche (se definite nell'HTML)
        const eventSlots = [];
        const slotCapacities = {};

        for (let i = 1; i <= 3; i++) {
            const slotInput = document.getElementById(`event_shift_${i}`);
            // Cerca un input corrispondente per il max ospiti del turno (es. id="event_shift_1_max")
            const slotMaxInput = document.getElementById(`event_shift_${i}_max`);

            if (slotInput && slotInput.value) {
                eventSlots.push(slotInput.value);
                if (slotMaxInput && slotMaxInput.value) {
                    slotCapacities[slotInput.value] = parseInt(slotMaxInput.value);
                }
            }
        }

        const isEdit = !!eventId;
        const url = isEdit ? `${backendBaseUrl}/api/admin/special-events/${eventId}` : `${backendBaseUrl}/api/admin/special-events`;
        const method = isEdit ? 'PUT' : 'POST';

        specialEventsMessageDiv.textContent = isEdit ? 'Aggiornamento evento...' : 'Aggiunta evento in corso...';
        specialEventsMessageDiv.style.color = '#333';

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    display_name: eventDisplayName,
                    description: eventDescription, // Invia la descrizione al backend
                    booking_date: eventDate,
                    booking_time: eventTime || null, // Invia null se l'ora non è specificata
                    available_slots: eventSlots, // Invia la lista di turni raccolti
                    max_guests: maxGuestsInput ? parseInt(maxGuestsInput) : null, // Invia il numero massimo di ospiti totale
                    slot_capacities: Object.keys(slotCapacities).length > 0 ? slotCapacities : null // Invia le capacità specifiche per turno
                }),
            });

            if (response.ok) {
                specialEventsMessageDiv.textContent = isEdit ? 'Evento modificato con successo!' : 'Evento aggiunto con successo!';
                specialEventsMessageDiv.style.color = 'green';
                resetEventForm();
                await loadSpecialEvents(); // Ricarica la lista degli eventi speciali
                await populateEventFilter(); // Ricarica il filtro eventi
            } else {
                const error = await response.json();
                specialEventsMessageDiv.textContent = `Errore: ${error.detail || 'Impossibile aggiungere l\'evento.'}`;
                specialEventsMessageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Errore di rete:', error);
            specialEventsMessageDiv.textContent = 'Errore di connessione con il server.';
            specialEventsMessageDiv.style.color = 'red';
        }
    });

    function resetEventForm() {
        addSpecialEventForm.reset();
        document.getElementById('event_id').value = '';
        saveEventBtn.textContent = 'Aggiungi Evento';
        cancelEditBtn.style.display = 'none';
        specialEventsMessageDiv.textContent = '';
    }

    cancelEditBtn.addEventListener('click', resetEventForm);

    function startEditEvent(eventId) {
        const event = currentSpecialEvents.find(e => e.id == eventId);
        if (!event) return;

        document.getElementById('event_id').value = event.id;
        document.getElementById('event_display_name').value = event.display_name;
        document.getElementById('event_description').value = event.description || '';
        document.getElementById('event_date').value = event.booking_date;
        document.getElementById('event_time').value = event.booking_time ? event.booking_time.substring(0, 5) : '';
        document.getElementById('max_guests').value = event.max_guests || '';

        // Reset turni
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`event_shift_${i}`).value = '';
            document.getElementById(`event_shift_${i}_max`).value = '';
        }

        // Popola turni
        let slots = event.available_slots;
        if (typeof slots === 'string') {
            try { slots = JSON.parse(slots); } catch(e) { slots = []; }
        }
        
        if (Array.isArray(slots)) {
            slots.forEach((slot, index) => {
                if (index < 3) {
                    // Assicurati che il formato sia HH:MM per l'input time
                    const timeVal = slot.length > 5 ? slot.substring(0, 5) : slot;
                    document.getElementById(`event_shift_${index + 1}`).value = timeVal;
                    
                    if (event.slot_capacities && event.slot_capacities[timeVal]) {
                        document.getElementById(`event_shift_${index + 1}_max`).value = event.slot_capacities[timeVal];
                    }
                }
            });
        }

        saveEventBtn.textContent = 'Aggiorna Evento';
        cancelEditBtn.style.display = 'inline-block';
        specialEventsMessageDiv.textContent = '';
        document.getElementById('special-events-card').scrollIntoView({ behavior: 'smooth' });
    }

    async function loadSpecialEvents() {
        specialEventsTableBody.innerHTML = ''; // Pulisce il corpo della tabella
        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events`, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            if (!response.ok) throw new Error('Errore nel caricamento degli eventi speciali.');
            const events = await response.json();
            currentSpecialEvents = events; // Salva nello store locale
    
            if (events.length === 0) {
                const row = specialEventsTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 8; // Occupa tutte le colonne (aggiornato per Posti Rim.)
                cell.textContent = 'Nessun evento speciale aggiunto.';
                cell.style.textAlign = 'center';
                return;
            }
    
            events.forEach(event => {
                const row = specialEventsTableBody.insertRow();
    
                const statusText = event.is_closed ? 'Chiuso' : 'Aperto';
                const statusClass = event.is_closed ? 'status-closed' : 'status-open';
                const toggleButtonText = event.is_closed ? 'Apri' : 'Chiudi';
                const toggleButtonClass = event.is_closed ? 'btn-open' : 'btn-close';

                // Debugging: Log the raw available_slots from the backend
                console.log(`Event ID: ${event.id}, Display Name: ${event.display_name}, Raw available_slots:`, event.available_slots);

                // Formatta i turni per la visualizzazione
                let slots = event.available_slots;
                if (typeof slots === 'string') {
                    try {
                        slots = JSON.parse(slots);
                    } catch (e) {
                        console.warn("Could not parse available_slots as JSON, treating as empty array:", event.available_slots, e);
                        slots = [];
                    }
                }
                const turniText = Array.isArray(slots) && slots.length > 0 ? slots.map(s => s.substring(0, 5)).join(', ') : 'N/D';
                const maxGuestsText = event.max_guests ? event.max_guests : '25 (Default)';
    
                row.innerHTML = `
                    <td data-label="Nome Evento">
                        <strong>${event.display_name}</strong>
                        ${event.description ? `<br><small style="font-style: italic; color: #555;">${event.description}</small>` : ''}
                    </td>
                    <td data-label="Data">${new Date(event.booking_date).toLocaleDateString()}</td>
                    <td data-label="Ora">${event.booking_time ? event.booking_time.substring(0, 5) : 'N/D'}</td>
                    <td data-label="Turni">${turniText}</td>
                    <td data-label="Max Ospiti">${maxGuestsText}</td>
                    <td data-label="Posti Rim." id="seats-remaining-${event.id}">...</td>
                    <td data-label="Stato"><span class="status ${statusClass}">${statusText}</span></td>
                    <td data-label="Azione">
                        <button class="action-btn ${toggleButtonClass}" data-event-id="${event.id}">${toggleButtonText}</button>
                        <button class="action-btn btn-edit" data-event-id="${event.id}" style="background-color: #ffc107; color: #000; margin-left: 5px;">Modifica</button>
                        <button class="action-btn btn-delete" data-event-id="${event.id}">Elimina</button>
                    </td>
                `;
            });

            // Calcola e aggiorna i posti rimanenti in modo asincrono
            events.forEach(async event => {
                const cell = document.getElementById(`seats-remaining-${event.id}`);
                if (cell) {
                    try {
                        const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
                        const res = await fetch(`${backendBaseUrl}/api/admin/bookings?event_id=${event.id}&limit=2000`, {
                             headers: { 'Authorization': `Basic ${encodedCredentials}` }
                        });
                        if(res.ok) {
                            const data = await res.json();
                            const booked = (data.bookings || []).reduce((acc, b) => acc + (b.guests || 0), 0);
                            const max = event.max_guests || 25;
                            const remaining = max - booked;
                            cell.textContent = remaining;
                            cell.style.color = remaining <= 0 ? 'red' : 'green';
                            cell.style.fontWeight = 'bold';
                        }
                    } catch(e) {
                        console.error("Errore calcolo posti rimanenti:", e);
                    }
                }
            });
    
            // Aggiungi i listener per i pulsanti dopo aver creato la tabella
            attachSpecialEventsListeners();

        } catch (error) {
            console.error('Errore nel caricamento degli eventi speciali:', error);
            specialEventsMessageDiv.textContent = 'Errore nel caricamento degli eventi speciali.';
            specialEventsMessageDiv.style.color = 'red';
        }
    }
    
    function attachSpecialEventsListeners() {
        // Aggiunge un singolo listener alla tabella per gestire tutti i click
        specialEventsTableBody.addEventListener('click', (e) => {
            const target = e.target;
            const eventId = target.dataset.eventId;

            if (!eventId) return; // Ignora i click su elementi senza data-event-id

            if (target.matches('.btn-open, .btn-close')) {
                toggleEventStatus(eventId);
            } else if (target.matches('.btn-delete')) {
                deleteSpecialEvent(eventId);
            } else if (target.matches('.btn-edit')) {
                startEditEvent(eventId);
            }
        });
    }

    async function deleteSpecialEvent(eventId) {
        if (!confirm('Sei sicuro di voler eliminare questo evento? Questa azione cancellerà anche tutte le prenotazioni associate e non può essere annullata.')) {
            return;
        }

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                },
            });

            if (response.ok) {
                specialEventsMessageDiv.textContent = 'Evento eliminato con successo!';
                specialEventsMessageDiv.style.color = 'green';
                // Ricarica la lista degli eventi e il filtro per riflettere la cancellazione
                await loadSpecialEvents();
                await populateEventFilter();
            } else {
                const error = await response.json();
                specialEventsMessageDiv.textContent = `Errore: ${error.detail || 'Impossibile eliminare l\'evento.'}`;
                specialEventsMessageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Errore di rete durante l\'eliminazione dell\'evento:', error);
            specialEventsMessageDiv.textContent = 'Errore di connessione con il server.';
            specialEventsMessageDiv.style.color = 'red';
        }
    }

    async function toggleEventStatus(eventId) {
        const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
        try {
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events/${eventId}/toggle-status`, {
                method: 'PATCH', // Usiamo PATCH come definito nel backend
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Errore durante l\'aggiornamento dello stato.');
            }

            // Se l'aggiornamento ha successo, ricarica la lista per vedere il cambiamento
            await loadSpecialEvents();
            // Ricarica anche il filtro principale per le prenotazioni, perché un evento chiuso non sarà più "bookable"
            await populateEventFilter();

            specialEventsMessageDiv.textContent = 'Stato evento aggiornato con successo.';
            specialEventsMessageDiv.style.color = 'green';

        } catch (error) {
            console.error('Errore:', error);
            specialEventsMessageDiv.textContent = `Errore: ${error.message}`;
            specialEventsMessageDiv.style.color = 'red';
        }
    }

    // --- Eventi per i pulsanti di paginazione ---
    nextPageButton.addEventListener('click', () => {
        currentPage++;
        loadBookings(currentPage);
    });

    prevPageButton.addEventListener('click', () => {
        currentPage--;
        loadBookings(currentPage);
    });

    // --- Evento per il filtro ---
    eventFilter.addEventListener('change', () => {
        currentPage = 0; // Resetta alla prima pagina quando si cambia filtro
        loadBookings(currentPage);
    });

    // --- Evento per l'esportazione in PDF ---
    exportPdfButton.addEventListener('click', exportToPDF);

    // --- Evento per il pulsante "Carica Tutte le Prenotazioni" ---
    loadBookingsBtn.addEventListener('click', () => {
        eventFilter.value = 'all'; // Resetta il filtro
        currentPage = 0;
        loadBookings(currentPage);
    });
});
