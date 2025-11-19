document.addEventListener('DOMContentLoaded', async () => {
    const messageDiv = document.getElementById('cancellation-message');
    const homeButton = document.getElementById('home-button');

    // Estrae il token dall'URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        messageDiv.textContent = 'Token di cancellazione mancante o non valido.';
        messageDiv.style.color = 'red';
        homeButton.style.display = 'inline-block';
        return;
    }

    const backendBaseUrl = 'https://felabackend.onrender.com';
    const backendUrl = `${backendBaseUrl}/api/bookings/cancel/${token}`;

    try {
        const response = await fetch(backendUrl, {
            method: 'GET', // o 'DELETE' se preferisci, ma GET è più semplice per un link
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.textContent = result.message || 'Prenotazione cancellata con successo.';
            messageDiv.style.color = 'green';
        } else {
            messageDiv.textContent = `Errore: ${result.detail || 'Impossibile cancellare la prenotazione.'}`;
            messageDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Errore di rete:', error);
        messageDiv.textContent = 'Errore di connessione con il server.';
        messageDiv.style.color = 'red';
    } finally {
        homeButton.style.display = 'inline-block'; // Mostra sempre il bottone alla fine
    }
});