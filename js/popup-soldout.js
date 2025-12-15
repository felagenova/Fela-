document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('book-table-soldout-btn');
    const popup = document.getElementById('sold-out-popup');
    const closeBtn = popup.querySelector('.close-btn');

    // Funzione per mostrare il popup
    function showPopup(event) {
        event.preventDefault(); // Impedisce al link di navigare
        popup.style.display = 'flex';
    }

    // Funzione per nascondere il popup
    function hidePopup() {
        popup.style.display = 'none';
    }

    // Event listener per aprire il popup
    openBtn.addEventListener('click', showPopup);

    // Event listener per chiudere il popup cliccando sulla 'x'
    closeBtn.addEventListener('click', hidePopup);

    // Event listener per chiudere il popup cliccando fuori dal contenuto
    popup.addEventListener('click', (event) => { if (event.target === popup) { hidePopup(); } });
});