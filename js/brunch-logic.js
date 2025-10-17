document.addEventListener('DOMContentLoaded', function() {
    // Link a cui il pulsante punterà quando è attivo.
    const brunchActiveLink = 'brunch.html';

    // --- ELEMENTI DEL DOM (Pulsante Home, Link Nav, Popup) ---
    const brunchHomeBtn = document.getElementById('brunch-btn');
    const brunchNavlink = document.getElementById('brunch-nav-link');

    // Rende il brunch sempre accessibile
    if (brunchHomeBtn) {
        brunchHomeBtn.href = brunchActiveLink;
        brunchHomeBtn.addEventListener('click', (event) => {
            // Non prevenire il comportamento di default, lascia che il link funzioni
        });
    }

    if (brunchNavlink) {
        brunchNavlink.href = brunchActiveLink;
        brunchNavlink.addEventListener('click', (event) => {
            // Non prevenire il comportamento di default, lascia che il link funzioni
        });
    }
});