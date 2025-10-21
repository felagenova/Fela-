document.addEventListener('DOMContentLoaded', function() {
    const eventCells = document.querySelectorAll('.day-cell.has-event');
    const displayArea = document.getElementById('event-display-area');

    const calendars = document.querySelectorAll('.calendar-container');
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    // Se non ci sono elementi del calendario in pagina, interrompi lo script
    if (!displayArea || calendars.length === 0) {
        return;
    }

    eventCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const eventDetailsContent = this.querySelector('.event-details-content');
            if (eventDetailsContent) {
                // --- LOGICA PER LA DATA ---
                const calendar = this.closest('.calendar-container');
                const dayNumber = parseInt(this.firstChild.textContent.trim(), 10);
                
                let year = parseInt(calendar.dataset.year, 10);
                let month = parseInt(calendar.dataset.month, 10);

                // Gestisce i giorni che non appartengono al mese corrente
                if (!this.classList.contains('in-month')) {
                    if (dayNumber > 20) { // Giorno del mese precedente
                        month = month - 1;
                        if (month < 0) {
                            month = 11;
                            year = year - 1;
                        }
                    } else { // Giorno del mese successivo
                        month = month + 1;
                        if (month > 11) {
                            month = 0;
                            year = year + 1;
                        }
                    }
                }

                // --- LOGICA PER IL BOX DATA ---
                const day = dayNumber;
                const monthAbbr = monthNames[month].substring(0, 3).toUpperCase();

                // Crea l'HTML per il quadratino della data
                const dateBoxHtml = `
                    <div class="date-box">
                        <span class="day">${day}</span>
                        <span class="month">${monthAbbr}</span>
                    </div>`;

                // Assembla il nuovo layout con il box data e una colonna per i dettagli
                displayArea.innerHTML = `
                    <div class="event-header-with-date">
                        ${dateBoxHtml}
                        <div class="event-details-column">
                            ${eventDetailsContent.innerHTML}
                        </div>
                    </div>`;

                displayArea.classList.add('visible');
                displayArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
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

        const todaysEventCell = Array.from(calendars).flatMap(calendar => Array.from(calendar.querySelectorAll('.day-cell.has-event'))).find(cell => {
            const dayNumber = parseInt(cell.firstChild.textContent.trim(), 10);
            const calendarYear = parseInt(cell.closest('.calendar-container').dataset.year, 10);
            let calendarMonth = parseInt(cell.closest('.calendar-container').dataset.month, 10);

            if (!cell.classList.contains('in-month')) {
                if (dayNumber > 20) { // Giorno del mese precedente
                    calendarMonth = (calendarMonth === 0) ? 11 : calendarMonth - 1;
                } else { // Giorno del mese successivo
                    calendarMonth = (calendarMonth === 11) ? 0 : calendarMonth + 1;
                }
            }
            // L'anno viene gestito implicitamente dal mese, non serve ricalcolarlo qui
            // perché i dati del calendario sono per un anno specifico.
            
            return dayNumber === currentDay && calendarMonth === currentMonth && calendarYear === currentYear;
        });

        if (todaysEventCell) {
            const calendarIndex = Array.from(calendars).indexOf(todaysEventCell.closest('.calendar-container'));
            showCalendar(calendarIndex);
            setTimeout(() => todaysEventCell.click(), 100); // Simula il click per mostrare i dettagli
        } else {
            showCalendar(0); // Mostra il primo calendario se non c'è un evento per oggi
        }
    }
    
    showTodaysEvent(); // Esegui la funzione al caricamento della pagina
});