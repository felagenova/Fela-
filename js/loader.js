window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    
    // Se il loader non esiste, non fare nulla
    if (!loader) return;

    // Aggiunge una classe per avviare la transizione di dissolvenza
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
});