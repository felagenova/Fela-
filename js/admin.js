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
    const loadBookingsBtn = document.getElementById('load-bookings-btn');
    let bookableEvents = [];
    let totalBookings = 0;
    const bookingsPerPage = 10;

    // const backendBaseUrl = 'https://felabackend.onrender.com'; // URL di produzione
    const backendBaseUrl = 'http://127.0.0.1:8000'; // URL per lo sviluppo locale

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
                loginForm.style.display = 'none'; // Nasconde il form di login
                bookingsListDiv.style.display = 'block'; // Mostra la lista delle prenotazioni
                await populateEventFilter(); // Popola il filtro
                loadBookings(currentPage); // Carica la prima pagina
                await loadSpecialEvents(); // Carica gli eventi speciali
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
                    option.value = event.id ? `special_${event.id}` : `brunch_${event.booking_date}|${event.booking_time || '00:00'}`;
                    option.textContent = event.display_name;
                    eventFilter.appendChild(option);
                }
            });
        } catch (error) {
            console.error("Impossibile caricare gli eventi per il filtro:", error); // Questo errore potrebbe essere causato da problemi CORS
        }
    }

    // --- Funzione per caricare le prenotazioni con paginazione ---
    async function loadBookings(page) {
        const skip = page * bookingsPerPage;
        let urlWithParams = `${backendBaseUrl}/api/admin/bookings?skip=${skip}&limit=${bookingsPerPage}`;

        const filterValue = eventFilter.value;
        if (filterValue !== 'all') {
            if (filterValue.startsWith('special_')) {
                const eventId = filterValue.substring(8); // Estrae l'ID dopo "special_"
                urlWithParams += `&event_id=${eventId}`;
            } else if (filterValue.startsWith('brunch_')) {
                const [date, time] = filterValue.substring(7).split('|');
                urlWithParams += `&event_date=${date}&event_time=${time}`;
            }
        }

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
                    booking.booking_time,
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
        // Mostra un messaggio di attesa
        adminMessageDiv.textContent = 'Creazione del PDF in corso...';
        adminMessageDiv.style.color = '#333';

        // 1. Recupera TUTTE le prenotazioni per il filtro corrente per calcolare il totale degli ospiti
        let allBookingsForFilter = [];
        let totalGuests = 0;
        let urlToFetchAll = `${backendBaseUrl}/api/admin/bookings?limit=2000`; // Limite alto per prenderle tutte
        const filterValueAll = eventFilter.value;

        if (filterValueAll !== 'all') {
            if (filterValueAll.startsWith('special_')) {
                urlToFetchAll += `&event_id=${filterValueAll.substring(8)}`;
            } else if (filterValueAll.startsWith('brunch_')) {
                const [date, time] = filterValueAll.substring(7).split('|');
                urlToFetchAll += `&event_date=${date}&event_time=${time}`;
            }
        }

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const allBookingsResponse = await fetch(urlToFetchAll, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            if (!allBookingsResponse.ok) throw new Error('Impossibile caricare i dati per il riepilogo.');
            
            const data = await allBookingsResponse.json();
            allBookingsForFilter = data.bookings;
            totalGuests = allBookingsForFilter.reduce((sum, booking) => sum + booking.guests, 0);

        } catch (error) {
            adminMessageDiv.textContent = `Errore nella preparazione del PDF: ${error.message}`;
            adminMessageDiv.style.color = 'red';
            return; // Interrompe l'esecuzione se non riesce a caricare i dati
        }

        const filterValue = eventFilter.value;
        const selectedOptionText = eventFilter.options[eventFilter.selectedIndex].text;

        // Definiamo le intestazioni corrette da inviare al backend
        const headers = ["ID", "Nome", "Email", "Telefono", "Data", "Ora", "Ospiti", "Note"];
        const encodedHeaders = encodeURIComponent(JSON.stringify(headers));

        // Definiamo il titolo del documento da inviare al backend
        const title = (filterValue === 'all' || !selectedOptionText) 
            ? 'Riepilogo di tutte le prenotazioni' 
            : selectedOptionText;
        const encodedTitle = encodeURIComponent(title);

        // 2. Crea la stringa di riepilogo
        const summaryText = `Riepilogo: ${totalBookings} prenotazioni per un totale di ${totalGuests} ospiti.`;
        const encodedSummary = encodeURIComponent(summaryText);

        // 3. Aggiungiamo intestazioni, titolo, riepilogo e limite alla URL
        let urlToFetch = `${backendBaseUrl}/api/bookings/pdf?limit=2000&headers=${encodedHeaders}&title=${encodedTitle}&summary=${encodedSummary}`;

        if (filterValue !== 'all') {
            if (filterValue.startsWith('special_')) {
                const eventId = filterValue.substring(8); // Estrae l'ID dopo "special_"
                urlToFetch += `&event_id=${eventId}`;
            } else if (filterValue.startsWith('brunch_')) {
                const [date, time] = filterValue.substring(7).split('|');
                urlToFetch += `&event_date=${date}&event_time=${time}`;
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

            // --- Logica per generare un nome file dinamico e corretto ---
            let filename;

            if (filterValue === 'all' || !selectedOptionText) {
                filename = 'prenotazioni_tutti_gli_eventi.pdf';
            } else {
                // Pulisce il nome dell'evento per creare un nome file valido
                const safeEventName = selectedOptionText
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri non alfanumerici (tranne spazi e trattini)
                    .replace(/\s+/g, '_'); // Sostituisce gli spazi con underscore
                filename = `prenotazioni_${safeEventName}.pdf`;
            }

            const pdfBlob = await response.blob();
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Crea un link temporaneo per avviare il download
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = filename; // Usa il nome del file dinamico
            document.body.appendChild(a);
            a.click();
            a.remove(); // Rimuovi il link dopo il click
            URL.revokeObjectURL(pdfUrl); // Libera la memoria

            // Messaggio di successo
            adminMessageDiv.textContent = 'PDF esportato con successo!';
            adminMessageDiv.style.color = 'green';
        } catch (error) {
            console.error('Errore durante l\'esportazione in PDF:', error);
            adminMessageDiv.textContent = 'Impossibile esportare il PDF. Controlla la console per i dettagli.';
            adminMessageDiv.style.color = 'red';
        }
    }

    // --- Gestione Eventi Speciali ---
    addSpecialEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventDisplayName = document.getElementById('event_display_name').value;
        const eventDate = document.getElementById('event_date').value;
        const eventTime = document.getElementById('event_time').value; // Può essere vuoto
        
        // Raccoglie i valori dai campi dei turni e li filtra per non includere quelli vuoti
        const eventSlots = [
            document.getElementById('event_shift_1').value,
            document.getElementById('event_shift_2').value,
            document.getElementById('event_shift_3').value
        ].filter(slot => slot !== ''); // Filtra via le stringhe vuote

        specialEventsMessageDiv.textContent = 'Aggiunta evento in corso...';
        specialEventsMessageDiv.style.color = '#333';

        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    display_name: eventDisplayName,
                    booking_date: eventDate,
                    booking_time: eventTime || null, // Invia null se l'ora non è specificata
                    available_slots: eventSlots // Invia la lista di turni raccolti
                }),
            });

            if (response.ok) {
                specialEventsMessageDiv.textContent = 'Evento aggiunto con successo!';
                specialEventsMessageDiv.style.color = 'green';
                addSpecialEventForm.reset();
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

    async function loadSpecialEvents() {
        specialEventsTableBody.innerHTML = ''; // Pulisce il corpo della tabella
        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events`, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            if (!response.ok) throw new Error('Errore nel caricamento degli eventi speciali.');
            const events = await response.json();
    
            if (events.length === 0) {
                const row = specialEventsTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6; // Occupa tutte le colonne
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

                // Formatta i turni per la visualizzazione
                const turniText = event.available_slots && event.available_slots.length > 0 ? event.available_slots.map(s => s.substring(0, 5)).join(', ') : 'N/D';
    
                row.innerHTML = `
                    <td>${event.display_name}</td>
                    <td>${new Date(event.booking_date).toLocaleDateString()}</td>
                    <td>${event.booking_time ? event.booking_time.substring(0, 5) : 'N/D'}</td>
                    <td>${turniText}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="action-btn ${toggleButtonClass}" data-event-id="${event.id}">${toggleButtonText}</button>
                        <button class="action-btn btn-delete" data-event-id="${event.id}">Elimina</button>
                    </td>
                `;
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
        // Listener per i pulsanti "Apri/Chiudi"
        document.querySelectorAll('.btn-open, .btn-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                toggleEventStatus(eventId);
            });
        });
    
        // Listener per i pulsanti "Elimina"
        document.querySelectorAll('#special-events-table .btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                deleteSpecialEvent(eventId);
            });
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
