document.addEventListener('DOMContentLoaded', function() {
    const eventCells = document.querySelectorAll('.day-cell.has-event, .day-cell.closing-day');
    const displayArea = document.getElementById('event-display-area');

    const calendars = document.querySelectorAll('.calendar-container');
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    // Se non ci sono elementi del calendario in pagina, interrompi lo script
    if (!displayArea || calendars.length === 0) {
        return;
    }

    // Funzione centralizzata per mostrare i dettagli di un evento e attivare lo scroll
    function showEventDetails(cell) {
        // Aggiunge una classe specifica se è un giorno di chiusura per lo stile
        if (cell.classList.contains('closing-day')) {
            displayArea.classList.add('is-closing-day');
        } else {
            displayArea.classList.remove('is-closing-day');
        }

        const eventDetailsContent = cell.querySelector('.event-details-content');
        if (!eventDetailsContent) return;

        // --- LOGICA PER LA DATA ---
        const calendar = cell.closest('.calendar-container');
        const dayNumber = parseInt(cell.firstChild.textContent.trim(), 10);
        
        let year = parseInt(calendar.dataset.year, 10);
        let month = parseInt(calendar.dataset.month, 10);

        // Gestisce i giorni che non appartengono al mese corrente
        if (!cell.classList.contains('in-month')) {
            if (dayNumber > 20) { // Giorno del mese precedente
                month = (month === 0) ? 11 : month - 1;
                if (month === 11) year--;
            } else { // Giorno del mese successivo
                month = (month === 11) ? 0 : month + 1;
                if (month === 0) year++;
            }
        }

        // --- LOGICA PER IL BOX DATA ---
        const monthAbbr = monthNames[month].substring(0, 3).toUpperCase();
        const dateBoxHtml = `
            <div class="date-box">
                <span class="day">${dayNumber}</span>
                <span class="month">${monthAbbr}</span>
            </div>`;

        // Assembla il nuovo layout
        displayArea.innerHTML = `
            <div class="event-header-with-date">
                ${dateBoxHtml}
                <div class="event-details-column">${eventDetailsContent.innerHTML}</div>
            </div>`;

        displayArea.classList.add('visible');
        displayArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    eventCells.forEach(cell => {
        cell.addEventListener('click', () => showEventDetails(cell));
    });

    // --- Logica di navigazione del calendario ---
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthDisplay = document.getElementById('current-month-display');
    let currentCalendarIndex = 0;

    function showCalendar(index) {
        calendars.forEach((cal, i) => {
            cal.classList.toggle('active', i === index);
        });
        const activeCalendar = calendars[index];
        const fullHeaderText = activeCalendar.querySelector('.calendar-header h2').textContent;
        const headerText = fullHeaderText.split(' ')[0]; // Prende solo il nome del mese
        monthDisplay.textContent = headerText;

        prevMonthBtn.disabled = index === 0;
        nextMonthBtn.disabled = index === calendars.length - 1;
        currentCalendarIndex = index;
    }

    prevMonthBtn.addEventListener('click', () => {
        if (currentCalendarIndex > 0) {
            showCalendar(currentCalendarIndex - 1);
        }
    });

    nextMonthBtn.addEventListener('click', () => {
        if (currentCalendarIndex < calendars.length - 1) {
            showCalendar(currentCalendarIndex + 1);
        }
    });

    // --- Funzione per mostrare l'evento del giorno ---
    function showTodaysEvent() {
        const today = new Date();
        // Per test, puoi forzare una data specifica:
        // const today = new Date('2025-10-01T12:00:00');
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const todaysEventCell = Array.from(calendars).flatMap(calendar => Array.from(calendar.querySelectorAll('.day-cell.has-event, .day-cell.closing-day'))).find(cell => {
            const dayNumber = parseInt(cell.firstChild.textContent.trim(), 10);
            const calendarYear = parseInt(cell.closest('.calendar-container').dataset.year, 10);
            let calendarMonth = parseInt(cell.closest('.calendar-container').dataset.month, 10);
            let yearToCompare = calendarYear;

            if (!cell.classList.contains('in-month')) {
                if (dayNumber > 20) { // Giorno del mese precedente
                    calendarMonth = (calendarMonth === 0) ? 11 : calendarMonth - 1;
                    if (calendarMonth === 11) yearToCompare--; // Se passiamo a Dicembre dell'anno prima
                } else { // Giorno del mese successivo
                    calendarMonth = (calendarMonth === 11) ? 0 : calendarMonth + 1;
                    if (calendarMonth === 0) yearToCompare++; // Se passiamo a Gennaio dell'anno dopo
                }
            }
            
            return dayNumber === currentDay && calendarMonth === currentMonth && yearToCompare === currentYear;
        });

        // Se viene trovata una cella con un evento per il giorno corrente
        if (todaysEventCell) {
            const calendarIndex = Array.from(calendars).indexOf(todaysEventCell.closest('.calendar-container'));
            showCalendar(calendarIndex);
            setTimeout(() => showEventDetails(todaysEventCell), 250); // Mostra i dettagli con un ritardo leggermente maggiore
        } else {
            // Se non c'è un evento per oggi, cerca il calendario del mese corrente.
            const currentMonthCalendarIndex = Array.from(calendars).findIndex(cal => {
                const calYear = parseInt(cal.dataset.year, 10);
                const calMonth = parseInt(cal.dataset.month, 10);
                return calYear === currentYear && calMonth === currentMonth;
            });

            if (currentMonthCalendarIndex !== -1) {
                // Se viene trovato il calendario per il mese corrente, mostralo.
                // Le frecce permetteranno comunque di navigare ai mesi precedenti/successivi.
                showCalendar(currentMonthCalendarIndex);
            } else {
                // Altrimenti, se il mese corrente non è tra i calendari, mostra il primo disponibile.
                showCalendar(0);
            }
        }
    }
    
    showTodaysEvent(); // Esegui la funzione al caricamento della pagina
});