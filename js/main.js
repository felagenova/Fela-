document.addEventListener('DOMContentLoaded', () => {
    // Script per il menu Hamburger
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.main-nav');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('nav-open');
            hamburgerBtn.classList.toggle('nav-open');
            // Aggiungi/rimuovi classe al body per bloccare lo scroll quando il menu è aperto
            document.body.classList.toggle('no-scroll');
        });
    }

    // --- Registrazione Service Worker per PWA e supporto Offline ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registrato con successo:', registration.scope);
                })
                .catch(error => {
                    console.log('Registrazione ServiceWorker fallita:', error);
                });
        });
    }
});