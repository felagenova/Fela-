document.addEventListener('DOMContentLoaded', () => {
    const brunchPopup = document.getElementById('promo-popup');
    const closeBtnBrunch = document.getElementById('promo-close-btn');

    // Funzione per mostrare il pop-up del brunch
    function showBrunchPopup() {
        if (!brunchPopup || !closeBtnBrunch) {
            console.warn("Elementi del pop-up del brunch non trovati.");
            return;
        }
        // Mostra il pop-up dopo un breve ritardo
        setTimeout(() => {
            brunchPopup.classList.add('visible');
        }, 1500);
    }

    // Gestisce la chiusura del pop-up
    closeBtnBrunch.addEventListener('click', () => {
        brunchPopup.classList.remove('visible');
    });

    // Mostra sempre e solo il pop-up del brunch
    showBrunchPopup();
});