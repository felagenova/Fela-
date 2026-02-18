// Importa le funzioni necessarie da Firebase (versione modulare)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig, MENU_COLLECTION } from "./config.js";

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    // Elementi del DOM
    const loginSection = document.getElementById('firebase-login-section');
    const loginForm = document.getElementById('firebase-login-form');
    const loginMessage = document.getElementById('firebase-login-message');
    const logoutBtn = document.getElementById('firebase-logout-btn');
    const managementSection = document.getElementById('menu-management-section');
    const itemForm = document.getElementById('menu-item-form');
    const formTitle = document.getElementById('form-title');
    const saveBtn = document.getElementById('save-item-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const formMessage = document.getElementById('form-message');
    const itemsContainer = document.getElementById('menu-items-container');
    
    // Riferimenti per la gestione dinamica delle sottocategorie
    const categorySelect = document.getElementById('item_category');
    const subCategorySelect = document.getElementById('item_sub_category');

    // Mappa delle sottocategorie disponibili per ogni categoria
    const subCategoriesMap = {
        'Vini': ['Bianchi', 'Bollicine', 'Bollicine Rosé', 'Rossi'],
        'Birre': ['Alla spina', 'In latta'],
        'Cocktails': [], // I cocktail solitamente non hanno sottocategorie nel tuo menu
        'Food': ['LE SBERLE DI FELA', 'I Taglieri', 'Fela Fritti', 'Bonus Track']
    };

    // Funzione per aggiornare le opzioni del menu a tendina
    function updateSubCategories() {
        const selectedCategory = categorySelect.value;
        const options = subCategoriesMap[selectedCategory] || [];
        
        // Pulisce le opzioni attuali
        subCategorySelect.innerHTML = '<option value="">- Nessuna / Generale -</option>';
        
        // Aggiunge le nuove opzioni
        options.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subCategorySelect.appendChild(option);
        });
    }

    // Aggiorna le sottocategorie quando l'utente cambia la categoria principale
    categorySelect.addEventListener('change', updateSubCategories);
    
    // Inizializza le sottocategorie al caricamento della pagina
    updateSubCategories();

    // Variabile locale per memorizzare i prodotti scaricati
    let menuItems = [];
    let activeCategory = 'Vini'; // Categoria attiva di default

    // Gestione Tabs
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const clickedCategory = btn.dataset.category;

            if (activeCategory === clickedCategory) {
                // Deseleziona se clicco sulla tab già attiva
                activeCategory = null;
                btn.classList.remove('active');
            } else {
                // Seleziona nuova tab
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = clickedCategory;
            }
            renderTable();
        });
    });

    // --- GESTIONE AUTENTICAZIONE FIREBASE ---
    // Controlla lo stato dell'utente (Firebase si ricorda se sei già loggato)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (loginSection) loginSection.style.display = 'none';
            if (managementSection) managementSection.style.display = 'block';
            startRealtimeListener();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (managementSection) managementSection.style.display = 'none';
            itemsContainer.innerHTML = ''; 
        }
    });

    // Gestione Login Firebase (per accesso diretto)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('fb_email').value;
            const password = document.getElementById('fb_password').value;
            
            loginMessage.textContent = "Accesso in corso...";
            loginMessage.style.color = "#333";

            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginMessage.textContent = "";
            } catch (error) {
                console.error("Errore login:", error);
                loginMessage.textContent = "Errore: Credenziali non valide.";
                loginMessage.style.color = "red";
            }
        });
    }

    // Gestione Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Rimuove il bypass e fa logout da Firebase
            signOut(auth);
        });
    }

    // Funzione per avviare l'ascolto in tempo reale
    function startRealtimeListener() {
        itemsContainer.innerHTML = '';
        itemsContainer.innerHTML = '<p>Caricamento prodotti da Firebase...</p>';

        onSnapshot(collection(db, MENU_COLLECTION), (querySnapshot) => {
            menuItems = [];
            querySnapshot.forEach((doc) => {
                // Aggiungiamo l'ID del documento ai dati
                menuItems.push({ id: doc.id, ...doc.data() });
            });

            renderTable();
        }, (error) => {
            console.error("Errore nel recupero dei prodotti: ", error);
            itemsContainer.innerHTML = `<p style="color: red;">Errore nel caricamento: ${error.message}. Controlla la console e la configurazione Firebase.</p>`;
        });
    }

    function renderTable() {
        itemsContainer.innerHTML = ''; // Pulisce il contenitore

        if (menuItems.length === 0) {
            itemsContainer.innerHTML = '<p>Nessun prodotto nel menu.</p>';
            return;
        }

        // Raggruppa per categoria
        const groupedItems = menuItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {});

        // Determina quali categorie mostrare
        const categoriesToShow = activeCategory ? [activeCategory] : ['Vini', 'Birre', 'Cocktails', 'Food'];
        let hasContent = false;

        categoriesToShow.forEach(category => {
            if (groupedItems[category]) {
                hasContent = true;
                const categoryWrapper = document.createElement('div');
                categoryWrapper.innerHTML = `<h3 style="color: #ff0403; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">${category}</h3>`;

                // Raggruppa per sotto-categoria
                const groupedBySubCategory = groupedItems[category].reduce((acc, item) => {
                    const sub = item.sub_category || 'Generale';
                    (acc[sub] = acc[sub] || []).push(item);
                    return acc;
                }, {});

                for (const subCategory in groupedBySubCategory) {
                    if (subCategory !== 'Generale') {
                         categoryWrapper.innerHTML += `<h4 style="font-style: italic; margin-top: 15px; margin-bottom: 10px;">${subCategory}</h4>`;
                    }

                    const table = document.createElement('table');
                    table.className = 'admin-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th data-label="Nome">Nome</th>
                                <th data-label="Prezzo">Prezzo</th>
                                <th data-label="Descrizione">Descrizione</th>
                                <th data-label="Allergeni">Allergeni</th>
                                <th data-label="Disponibilità">Disponibilità</th>
                                <th data-label="Azioni">Azioni</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    const tbody = table.querySelector('tbody');

                    groupedBySubCategory[subCategory].forEach(item => {
                        const isAvailable = item.available !== false; // Default true se non specificato
                        const statusBtnClass = isAvailable ? 'btn-open' : 'btn-close';
                        const statusBtnText = isAvailable ? 'Disponibile' : 'Esaurito';

                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td data-label="Nome">${item.name}</td>
                            <td data-label="Prezzo">${item.price}</td>
                            <td data-label="Descrizione">${item.description}</td>
                            <td data-label="Allergeni">${item.allergens}</td>
                            <td data-label="Disponibilità">
                                <button class="action-btn ${statusBtnClass} btn-toggle-status" data-id="${item.id}" data-status="${isAvailable}">
                                    ${statusBtnText}
                                </button>
                            </td>
                            <td data-label="Azioni">
                                <button class="action-btn btn-edit" data-id="${item.id}">Modifica</button>
                                <button class="action-btn btn-delete" data-id="${item.id}">Elimina</button>
                            </td>
                        `;
                    });
                    categoryWrapper.appendChild(table);
                }
                itemsContainer.appendChild(categoryWrapper);
            }
        });

        if (!hasContent) {
            itemsContainer.innerHTML = `<p style="text-align:center; margin-top:20px;">Nessun prodotto trovato${activeCategory ? ' nella categoria <strong>' + activeCategory + '</strong>' : ''}.</p>`;
        }

        // Aggiungi event listener ai nuovi pulsanti
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', () => startEdit(button.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', () => deleteItem(button.dataset.id));
        });
        // Listener per il cambio stato rapido
        document.querySelectorAll('.btn-toggle-status').forEach(button => {
            button.addEventListener('click', () => toggleItemStatus(button.dataset.id, button.dataset.status === 'true'));
        });
    }

    // Funzione per cambiare stato (Disponibile/Esaurito)
    async function toggleItemStatus(id, currentStatus) {
        try {
            const itemRef = doc(db, MENU_COLLECTION, id);
            await updateDoc(itemRef, { available: !currentStatus });
            // Non serve ricaricare, onSnapshot lo farà automaticamente
        } catch (e) {
            console.error("Errore cambio stato:", e);
            alert("Impossibile aggiornare lo stato. Controlla la console.");
        }
    }

    // Gestione del form per aggiungere/modificare
    itemForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = document.getElementById('item_id').value;
        const formData = {
            category: document.getElementById('item_category').value,
            sub_category: document.getElementById('item_sub_category').value,
            name: document.getElementById('item_name').value,
            price: document.getElementById('item_price').value,
            description: document.getElementById('item_description').value,
            allergens: document.getElementById('item_allergens').value,
        };

        saveBtn.disabled = true;
        saveBtn.textContent = "Salvataggio...";

        try {
            if (id) {
                // Modifica esistente su Firebase
                const itemRef = doc(db, MENU_COLLECTION, id);
                await updateDoc(itemRef, formData);
                formMessage.textContent = 'Prodotto modificato con successo!';
            } else {
                // Aggiunta nuovo su Firebase
                await addDoc(collection(db, MENU_COLLECTION), { ...formData, available: true }); // Default disponibile
                formMessage.textContent = 'Prodotto aggiunto con successo!';
            }
            
            formMessage.style.color = 'green';
            resetForm();
            // Non serve ricaricare, onSnapshot lo farà automaticamente
        } catch (e) {
            console.error("Errore salvataggio: ", e);
            formMessage.textContent = 'Errore durante il salvataggio: ' + e.message;
            formMessage.style.color = 'red';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = id ? "Aggiorna Prodotto" : "Salva Prodotto";
            setTimeout(() => formMessage.textContent = '', 3000);
        }
    });

    // Funzione per iniziare la modifica
    function startEdit(id) {
        const item = menuItems.find(item => item.id == id);
        if (!item) return;

        document.getElementById('item_id').value = item.id;
        document.getElementById('item_category').value = item.category;
        
        // Aggiorna le opzioni della sottocategoria in base alla categoria caricata
        updateSubCategories();
        
        document.getElementById('item_sub_category').value = item.sub_category || "";
        document.getElementById('item_name').value = item.name;
        document.getElementById('item_price').value = item.price;
        document.getElementById('item_description').value = item.description;
        document.getElementById('item_allergens').value = item.allergens;

        formTitle.textContent = 'Modifica Prodotto';
        saveBtn.textContent = 'Aggiorna Prodotto';
        cancelBtn.style.display = 'inline-block';

        // Scrolla al form
        itemForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Funzione per eliminare un prodotto
    async function deleteItem(id) {
        if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, MENU_COLLECTION, id));
            formMessage.textContent = 'Prodotto eliminato con successo.';
            formMessage.style.color = 'green';
            
            resetForm(); // Resetta il form se si stava modificando l'elemento eliminato
            // Non serve ricaricare, onSnapshot lo farà automaticamente
        } catch (e) {
            console.error("Errore eliminazione: ", e);
            formMessage.textContent = 'Errore durante l\'eliminazione.';
            formMessage.style.color = 'red';
        }
        
        setTimeout(() => formMessage.textContent = '', 3000);
    }

    // Funzione per resettare il form
    function resetForm() {
        itemForm.reset();
        updateSubCategories(); // Ripristina le sottocategorie per la categoria di default
        document.getElementById('item_id').value = '';
        formTitle.textContent = 'Aggiungi Prodotto';
        saveBtn.textContent = 'Salva Prodotto';
        cancelBtn.style.display = 'none';
    }

    cancelBtn.addEventListener('click', resetForm);

});