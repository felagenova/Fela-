// js/menu-dynamic.js

// Importa le funzioni necessarie da Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, enableIndexedDbPersistence, setLogLevel } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig, MENU_COLLECTION } from "./config.js";

setLogLevel('error');

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

    // Abilita la persistenza offline solo quando è sicuro farlo.
    // Nei preview locali o con più tab aperte, Firestore può fallire a causa del lock di cache.
    // In quel caso usiamo automaticamente la cache in memoria senza bloccare il menu.
    try {
        if (window.location.protocol !== 'file:') {
            await enableIndexedDbPersistence(db, { forceOwnership: true });
            console.log("Persistenza offline abilitata.");
        }
    } catch (err) {
        if (err && err.code === 'failed-precondition') {
            console.info("Persistenza offline disabilitata in questo ambiente: più tab o lock di cache.");
        } else if (err && err.code === 'unimplemented') {
            console.info("Il browser non supporta la persistenza offline.");
        } else {
            console.info("Persistenza offline non disponibile; uso la cache in memoria.");
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
            'Generale', 'No/Low Alcohol', // Cocktails
            'LE SBERLE DI FELA', 'I TAGLIERI', 'Fela Fritti', 'Bonus Track' // Food
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

                // Aggiunge l'ID per l'anchor link se la sotto-categoria è Bonus Track
                if (subCat === 'Bonus Track') {
                    section.id = 'bonus-track';
                }

                // Aggiunge il titolo della sotto-categoria se non è "Generale"
                if (subCat !== 'Generale') {
                    if (category === 'Food') {
                        const isSberleSection = subCat === 'LE SBERLE DI FELA';
                        const sectionTitle = isSberleSection ? 'LE SBERLE DI FELA' : subCat;
                        const sectionSubtitle = isSberleSection ? '<p class="section-subtitle">Servite con patatine fritte & Salsa Special</p>' : '';
                        section.innerHTML = `<div class="menu-section-header"><h3>${sectionTitle}</h3>${sectionSubtitle}</div>`;
                    } else if (category === 'Cocktails' && subCat === 'No/Low Alcohol') {
                        section.innerHTML = `
                            <div class="menu-section-header cocktails-subsection-header">
                                <h3 class="cocktails-subsection-title">NO/LOW ALCOHOL</h3>
                            </div>
                        `;
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

    // Ascolta i cambiamenti in tempo reale (con cache attiva)
    onSnapshot(collection(db, MENU_COLLECTION), (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        
        renderMenuItems(items);
    }, (error) => {
        console.error("Errore caricamento menu:", error);
        for (const listId of Object.values(categoryMap)) {
            const container = document.getElementById(listId);
            if (container) container.innerHTML = '<p style="text-align:center; color:red;">Impossibile caricare il menu. Controlla la console del browser (F12).</p>';
        }
    });
});