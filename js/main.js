document.addEventListener('DOMContentLoaded', function() {
    // Funzione per gestire il pulsante "Torna su"
    function handleBackToTop() {
        const backToTopButton = document.getElementById("back-to-top");
        if (!backToTopButton) return;

        window.addEventListener("scroll", () => {
            if (window.scrollY > 200) {
                backToTopButton.classList.add("show");
            } else {
                backToTopButton.classList.remove("show");
            }
        });
    }

    // Funzione per gestire il menu Hamburger
    function handleHamburgerMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-menu');
        const navMenu = document.querySelector('.main-nav');

        if (!hamburgerBtn || !navMenu) return;

        hamburgerBtn.addEventListener('click', () => {
            const isNavOpen = navMenu.classList.contains('nav-open');
            navMenu.classList.toggle('nav-open');
            hamburgerBtn.classList.toggle('nav-open');
            hamburgerBtn.setAttribute('aria-expanded', String(!isNavOpen));
        });
    }

    handleBackToTop();
    handleHamburgerMenu();
});