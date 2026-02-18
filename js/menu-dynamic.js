// js/menu-dynamic.js

// Importa le funzioni necessarie da Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig, MENU_COLLECTION } from "./config.js";

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    // Mappa gli ID delle categorie HTML con i nomi delle categorie nel Database
    const categoryMap = {
        'Vini': 'vini-list',
        'Birre': 'birre-list',
        'Cocktails': 'cocktails-list',
        'Food': 'food-list'
    };

    // Mostra un caricamento iniziale
    for (const listId of Object.values(categoryMap)) {
        const container = document.getElementById(listId);
        if (container) container.innerHTML = '<p style="text-align:center; color:#ff0403;">Caricamento menu...</p>';
    }

    // Abilita la persistenza offline (Cache intelligente di Firestore)
    try {
        await enableIndexedDbPersistence(db);
        console.log("Persistenza offline abilitata.");
    } catch (err) {
        if (err.code == 'failed-precondition') {
            console.warn("Persistenza fallita: più schede aperte contemporaneamente.");
        } else if (err.code == 'unimplemented') {
            console.warn("Il browser non supporta la persistenza.");
        }
    }

    // --- LOGICA TABS ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Rimuovi active da tutti i bottoni e contenuti
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Aggiungi active al bottone cliccato
            tab.classList.add('active');
            
            // Mostra il contenuto corrispondente
            const targetId = tab.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Funzione per renderizzare il menu (estratta per essere usata sia con cache che con dati freschi)
    const renderMenuItems = (items) => {
        // Pulisce i contenitori
        for (const listId of Object.values(categoryMap)) {
            const container = document.getElementById(listId);
            if (container) container.innerHTML = '';
        }

        if (items.length === 0) {
             for (const listId of Object.values(categoryMap)) {
                const container = document.getElementById(listId);
                if (container) container.innerHTML = '<p style="text-align:center;">Nessun prodotto da mostrare.</p>';
            }
            return;
        }

        // Raggruppa i prodotti per Categoria -> Sotto-categoria
        const groupedItems = items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = {};
            const sub = item.sub_category || 'Generale';
            if (!acc[item.category][sub]) acc[item.category][sub] = [];
            acc[item.category][sub].push(item);
            return acc;
        }, {});

        // Ordine di visualizzazione delle sotto-categorie (opzionale, per estetica)
        const subCategoryOrder = [
            'Bianchi', 'Bollicine', 'Bollicine Rosé', 'Rossi', // Vini
            'Alla spina', 'In latta', // Birre
            'LE SBERLE DI FELA', 'I Taglieri', 'Fela Fritti', 'Bonus Track' // Food
        ];

        // Renderizza i prodotti
        for (const [category, subCategories] of Object.entries(groupedItems)) {
            const containerId = categoryMap[category];
            const container = document.getElementById(containerId);
            
            if (!container) continue;

            // Ordina le sotto-categorie: prima quelle nella lista personalizzata, poi le altre
            const sortedSubKeys = Object.keys(subCategories).sort((a, b) => {
                const indexA = subCategoryOrder.indexOf(a);
                const indexB = subCategoryOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            });

            sortedSubKeys.forEach(subCat => {
                const section = document.createElement('section');
                section.className = 'menu-section';

                // Aggiunge il titolo della sotto-categoria se non è "Generale"
                if (subCat !== 'Generale') {
                    if (category === 'Food') {
                         section.innerHTML = `<div class="menu-section-header"><h3>${subCat}</h3></div>`;
                    } else {
                         section.innerHTML = `<h3>${subCat}</h3>`;
                    }
                }

                // Aggiunge i prodotti
                subCategories[subCat].forEach(item => {
                    const itemDiv = document.createElement('div');
                    const isAvailable = item.available !== false; // Default true
                    const soldOutClass = isAvailable ? '' : 'sold-out';
                    itemDiv.className = `menu-item ${soldOutClass}`;

                    let allergensHtml = '';
                    if (item.allergens) {
                        const allergensList = item.allergens.split(' ');
                        allergensList.forEach(num => {
                            if(num.trim()) allergensHtml += `<span class="allergen-icon">${num}</span>`;
                        });
                    }

                    const soldOutBadge = isAvailable ? '' : '<span class="sold-out-badge">ESAURITO</span>';

                    itemDiv.innerHTML = `
                        <div class="menu-item-header">
                            <h4>${item.name} ${allergensHtml} ${soldOutBadge}</h4>
                            <span class="price">${item.price}</span>
                        </div>
                        ${item.description ? `<p class="description">${item.description}</p>` : ''}
                    `;
                    section.appendChild(itemDiv);
                });

                container.appendChild(section);
            });
        }
    };

    try {
        // Logica di Caching
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const now = Date.now();
        let items = [];

        // Controlla se la cache esiste ed è valida (meno di 30 minuti)
        if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp) < CACHE_DURATION)) {
            console.log("Menu caricato dalla cache locale (risparmio letture Firebase).");
            items = JSON.parse(cachedData);
        } else {
            console.log("Cache scaduta o assente. Scaricamento menu da Firebase...");
            // Scarica tutti i prodotti (Lettura DB)
            const querySnapshot = await getDocs(collection(db, MENU_COLLECTION));
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            // Salva in cache se abbiamo dati
            if (items.length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(items));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
            }
        }

        renderMenuItems(items);

    } catch (error) {
        console.error("Errore caricamento menu:", error);
        for (const listId of Object.values(categoryMap)) {
            const container = document.getElementById(listId);
            if (container) container.innerHTML = '<p style="text-align:center; color:red;">Impossibile caricare il menu. Controlla la console del browser (F12).</p>';
        }
    }
});