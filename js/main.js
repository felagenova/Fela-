document.addEventListener('DOMContentLoaded', function() {
    // --- Logica per il pulsante "Torna su" ---
    const backToTopButton = document.getElementById("back-to-top");

    // Se il pulsante non esiste nella pagina, non fare nulla
    if (!backToTopButton) return;

    // Aggiunge un listener per l'evento di scroll della finestra
    window.addEventListener("scroll", () => {
        // Se l'utente ha scrollato più di 200px verso il basso
        if (window.scrollY > 200) {
            // Mostra il bottone aggiungendo la classe 'show'
            backToTopButton.classList.add("show");
        } else {
            // Altrimenti, nascondi il bottone rimuovendo la classe 'show'
            backToTopButton.classList.remove("show");
        }
    });
});