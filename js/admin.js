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
    const specialEventsList = document.getElementById('special-events-list');
    const loadBookingsBtn = document.getElementById('load-bookings-btn');
    let bookableEvents = [];
    let totalBookings = 0;
    const bookingsPerPage = 10;

    const backendBaseUrl = 'https://fela-backend.onrender.com';

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
                const option = document.createElement('option');
                // Il valore conterrà l'ID dell'evento speciale o un identificatore per il brunch
                option.value = event.id ? `special_${event.id}` : `brunch_${event.booking_date}|${event.booking_time || (event.available_slots ? event.available_slots[0] : '00:00')}`;
                option.textContent = event.display_name;
                eventFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Impossibile caricare gli eventi per il filtro:", error);
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
                paginationControls.style.display = 'block'; // Mostra i controlli
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
                    cell.textContent = data;
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
        const filterValue = eventFilter.value;
        let urlToFetch = `${backendBaseUrl}/api/bookings/pdf?limit=1000`; // URL base

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

            // Estrai il nome del file dall'header Content-Disposition
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'prenotazioni.pdf'; // Nome file di default
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
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
                    booking_time: eventTime || null // Invia null se l'ora non è specificata
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
        specialEventsList.innerHTML = ''; // Pulisce la lista
        try {
            const encodedCredentials = btoa(`admin:${document.getElementById('admin_password').value}`);
            const response = await fetch(`${backendBaseUrl}/api/admin/special-events`, {
                headers: { 'Authorization': `Basic ${encodedCredentials}` }
            });
            if (!response.ok) throw new Error('Errore nel caricamento degli eventi speciali.');
            const events = await response.json();

            if (events.length === 0) {
                specialEventsList.innerHTML = '<li>Nessun evento speciale aggiunto.</li>';
                return;
            }

            events.forEach(event => {
                const listItem = document.createElement('li');
                listItem.textContent = `${event.display_name} (${event.booking_date}${event.booking_time ? ' ' + event.booking_time.substring(0, 5) : ''})`;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Elimina';
                deleteButton.className = 'btn-delete';
                deleteButton.style.marginLeft = '10px';
                deleteButton.onclick = () => deleteSpecialEvent(event.id);
                listItem.appendChild(deleteButton);
                specialEventsList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Errore nel caricamento degli eventi speciali:', error);
            specialEventsMessageDiv.textContent = 'Errore nel caricamento degli eventi speciali.';
            specialEventsMessageDiv.style.color = 'red';
        }
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
