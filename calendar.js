document.addEventListener('DOMContentLoaded', function() {
    const eventCells = document.querySelectorAll('.day-cell.has-event');
    const displayArea = document.getElementById('event-display-area');
    const calendars = document.querySelectorAll('.calendar-container');

    if (!displayArea || calendars.length === 0) {
        return; // Non eseguire se gli elementi necessari non sono presenti
    }

    eventCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const eventDetailsContent = this.querySelector('.event-details-content');

            if (eventDetailsContent) {
                displayArea.innerHTML = eventDetailsContent.innerHTML;
                // Rende visibile l'area
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
            cal.classList.toggle('active', i === index); // Mostra solo il calendario attivo
        });
        const activeCalendar = calendars[index];
        const fullHeaderText = activeCalendar.querySelector('.calendar-header h2').textContent;
        // Prende solo il nome del mese per il display principale
        const headerText = fullHeaderText.split(' ')[0];
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
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        let foundTodaysCalendar = false;

        // Itera per trovare il calendario e l'evento di oggi
        calendars.forEach((calendar, index) => {
            const calendarYear = parseInt(calendar.dataset.year, 10);
            const calendarMonth = parseInt(calendar.dataset.month, 10);

            calendar.querySelectorAll('.day-cell.has-event').forEach(cell => {
                const dayNumber = parseInt(cell.innerText.trim(), 10);
                let cellMonth = calendarMonth;
                let cellYear = calendarYear;

                // Gestisce i giorni che appaiono nel calendario ma appartengono al mese precedente/successivo
                if (!cell.classList.contains('in-month')) {
                    if (dayNumber > 20) { // Giorno del mese precedente
                        cellMonth = (calendarMonth === 0) ? 11 : calendarMonth - 1;
                        if (cellMonth === 11) cellYear--;
                    } else { // Giorno del mese successivo
                        cellMonth = (calendarMonth === 11) ? 0 : calendarMonth + 1;
                        if (cellMonth === 0) cellYear++;
                    }
                }

                if (dayNumber === currentDay && cellMonth === currentMonth && cellYear === currentYear) {
                    showCalendar(index); // Mostra il calendario corretto
                    foundTodaysCalendar = true;
                    // Simula un click sulla cella di oggi per mostrare subito i dettagli
                    setTimeout(() => cell.click(), 100);
                }
            });
        });

        // Se non c'è un evento per oggi o siamo in un mese senza calendario, mostra il primo disponibile
        if (!foundTodaysCalendar) {
            showCalendar(0); // Mostra il primo calendario se non troviamo quello di oggi
        }
    }
    
    showTodaysEvent(); // Esegui la funzione al caricamento della pagina
});