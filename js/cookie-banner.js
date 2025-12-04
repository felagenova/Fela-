document.addEventListener('DOMContentLoaded', function() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');

    // Funzione per impostare un cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Funzione per leggere un cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Mostra il banner se il cookie non è impostato
    if (!getCookie('cookie_consent')) {
        cookieBanner.classList.add('show');
    }

    // Gestisce il click sul pulsante "Accetta"
    acceptBtn.addEventListener('click', function() {
        setCookie('cookie_consent', 'true', 365); // Imposta il cookie per 1 anno
        cookieBanner.classList.remove('show');
    });
});