// ---  DONNÉES  ---
let userSettings = JSON.parse(localStorage.getItem('endoSettings')) || null;
let currentUniv = 'notes';
let currentTabIndex = 0;
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();
const menus = {
    notes: ['Quotidien', 'Repas', 'Historique'],
    recipes: ['Idées', 'Conseils'],
    settings: ['Général', 'Données']
};
let selectedDate = new Date().toISOString().split('T')[0]; // Date du jour par défaut

const moodOptions = [
    '😊 Heureuse', '😔 Triste', '😤 Irritable', '😰 Anxieuse',
    '😴 Épuisée', '🥰 Sereine', '😢 Émotive', '🤩 Energisée',
    '😶 Neutre', '🤯 Dépassée'
];
const predefinedSymptoms = [
    'Crampes', 'Ballonnements', 'Maux de tête', 'Douleurs lombaires',
    'Nausées', 'Seins sensibles', 'Acné', 'Constipation',
    'Diarrhée', 'Insomnies', 'Bouffées de chaleur'
];
let customSymptoms = [];

// --- STORE EN MÉMOIRE ---
let _entryCache = {}; // Cache des entrées par date

function getEntryForDate(date) {
    // Si déjà en cache, on retourne l'objet vivant
    if (_entryCache[date]) return _entryCache[date];

    let data = JSON.parse(localStorage.getItem('endoData')) || {};
    if (!data[date]) {
        data[date] = {
            meals: {
                "Petit-déjeuner": { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
                "Déjeuner":       { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
                "Goûter":         { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
                "Dîner":          { categories: { "Boisson": [], "Repas": [] }, digestionScale: null }
            },
            goals: {}
        };
    }
    // On met en cache ET on retourne toujours la même référence
    _entryCache[date] = data[date];
    return _entryCache[date];
}

function saveData() {
    let allData = JSON.parse(localStorage.getItem('endoData')) || {};
    // On réinjecte TOUS les objets en cache (pas juste la date courante)
    Object.keys(_entryCache).forEach(date => {
        allData[date] = _entryCache[date];
    });
    localStorage.setItem('endoData', JSON.stringify(allData));
}

// --- GESTION DU SWIPE ---
const sZone = document.getElementById('swipe-zone'); // le nom que le reste du code attend

let swipeTouchStartX = 0;
let swipeTouchStartY = 0;
let swipeLastTime = 0;

sZone.addEventListener('touchstart', (e) => {
    swipeTouchStartX = e.changedTouches[0].clientX;
    swipeTouchStartY = e.changedTouches[0].clientY;
}, { passive: true });

sZone.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - swipeTouchStartX;
    const deltaY = e.changedTouches[0].clientY - swipeTouchStartY;
    const now = Date.now();

    if (now - swipeLastTime < 500) return;
    if (Math.abs(deltaX) < 100) return;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 3) return;

    const allTabs = document.querySelectorAll('.tab-btn');
    if (!allTabs.length) return;

    let currentIndex = Array.from(allTabs).findIndex(b => b.classList.contains('active'));
    if (currentIndex === -1) return;

    if (deltaX < 0 && currentIndex < allTabs.length - 1) {
        swipeLastTime = now;
        allTabs[currentIndex + 1].click();
    } else if (deltaX > 0 && currentIndex > 0) {
        swipeLastTime = now;
        allTabs[currentIndex - 1].click();
    }
}, { passive: true });

// --- 3. NAVIGATION ---
function changerUnivers(nomUniv) {
    currentUniv = nomUniv;
    currentTabIndex = 0; // Reset à l'onglet 1 quand on change d'univers

    document.querySelectorAll('.univ-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === 'btn-' + nomUniv);
    });

    const footer = document.getElementById('barre-bas');
    footer.innerHTML = '';

    menus[nomUniv].forEach((nomOnglet, index) => {
        const btnBas = document.createElement('button');
        btnBas.className = 'tab-btn';
        btnBas.innerText = nomOnglet;
        btnBas.onclick = () => {
            currentTabIndex = index; // On synchronise l'index pour le swipe
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btnBas.classList.add('active');
            afficherPage(nomOnglet);
        };
        footer.appendChild(btnBas);
        if(index === 0) btnBas.click();
    });
}

// PAGE QUOTIDIEN //
function createCycleHeader(cycleInfo, settings) {
    const { day: currentDayOfCycle, phase, phaseColor, ovulationDay, cycleLength, periodLength } = cycleInfo;

    const container = document.createElement('div');
    container.style.cssText = 'padding: 10px 20px; display: flex; flex-direction: column; gap: 15px;';

    // 1. LIGNE PRINCIPALE (MASCOTTE + CERCLE)
    const mainRow = document.createElement('div');
    mainRow.style.cssText = 'display: flex; align-items: center; height: 210px; position: relative; width: 100%; overflow: visible;';

    // ESPACE RÉSERVÉ MASCOTTE
    const mascotSpace = document.createElement('div');
    mascotSpace.style.cssText = 'flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; margin-right: 170px;';
    mascotSpace.innerHTML = `<div style="color: #cbd5e1; font-size: 0.7rem; border: 1px dashed #e2e8f0; border-radius: 20px; padding: 15px; text-align: center;">Espace<br>Mascotte</div>`;

    // LE CERCLE DE SUIVI
    const cycleWheel = document.createElement('div');
    cycleWheel.style.cssText = 'width: 200px; height: 200px; position: absolute; right: -15px; cursor: pointer;';

    let dotsHTML = '';
    const cx = 100, cy = 100, r = 74;

    for (let i = 1; i <= cycleLength; i++) {
        const angle = (i - 1) * (360 / cycleLength) - 90;
        const rad = angle * Math.PI / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);

        let dotColor = "#e2e8f0";
        if (i <= periodLength) dotColor = "#f43f5e";
        else if (i < ovulationDay - 2) dotColor = "#4ade80";
        else if (i >= ovulationDay - 2 && i <= ovulationDay + 2) dotColor = "#facc15";
        else dotColor = "#fb923c";

        const isCurrent = (i === currentDayOfCycle);
        dotsHTML += `
            <circle cx="${x}" cy="${y}" r="${isCurrent ? 7 : 4.5}"
                fill="${dotColor}"
                ${isCurrent ? 'stroke="#fff" stroke-width="2.5"' : ''}
                style="opacity: ${isCurrent ? 1 : 0.6}" />`;
    }

    cycleWheel.innerHTML = `
        <svg viewBox="0 0 200 200" style="width: 100%; height: 100%; overflow: visible;">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="0.5" />
            ${dotsHTML}
        </svg>
        <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; pointer-events:none;">
            <div style="font-size: 1.55rem; font-weight: 900; color: #1e293b; white-space: nowrap; letter-spacing: -0.5px;">
                <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 700; margin-right: 5px;">JOUR</span>${currentDayOfCycle}
            </div>
        </div>
    `;

    cycleWheel.onclick = () => {
        const phaseName = phase.replace(/^[^\s]+\s/, '');
        let conseil = "Écoute ton corps aujourd'hui.";
        if (phase.includes("Menstruations")) conseil = "Douceur et repos recommandés.";
        if (phase.includes("Folliculaire")) conseil = "L'énergie revient doucement !";
        if (phase.includes("Ovulatoire")) conseil = "Pic de vitalité et de confiance.";
        if (phase.includes("Lutéale")) conseil = "Prends soin de toi, sois patiente.";
        if (typeof showCyclePopup === 'function') showCyclePopup(phaseName, conseil, phaseColor);
    };

    // 2. LIGNE DES BOUTONS
    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    const calendarBtn = document.createElement('button');
    calendarBtn.style.cssText = `width: 52px; height: 52px; border-radius: 16px; border: 1px solid #f1f5f9; background: white; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);`;
    calendarBtn.innerHTML = `📅`;
    calendarBtn.onclick = () => {
        if (typeof openBubblyCalendar === 'function') openBubblyCalendar();
    };

    const newCycleBtn = document.createElement('button');

    // Style cohérent avec l'esthétique "Soft & Pastel"
    newCycleBtn.style.cssText = `
        flex: 1;
        height: 52px;
        border-radius: 16px;
        border: 1px solid #f5d0fe;
        background: #fdf4ff;
        color: #9d4edd;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
    `;

    newCycleBtn.innerHTML = `<span style="font-size: 1.3rem; line-height: 0;">+</span> Nouveau Cycle`;

    newCycleBtn.onclick = () => {
        if (confirm("Démarrer un nouveau cycle aujourd'hui ?")) {
            const maintenant = new Date();
            const todayStr = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;

            // On initialise l'historique s'il n'existe pas
            if (!userSettings.cycleHistory) userSettings.cycleHistory = [];

            // On sauvegarde l'ancien cycle avant de mettre à jour le nouveau
            if (userSettings.cycleStart && userSettings.cycleStart !== todayStr) {
                userSettings.cycleHistory.push({
                    start: userSettings.cycleStart,
                    len: userSettings.cycleLength || 28
                });
            }

            userSettings.cycleStart = todayStr;
            selectedDate = todayStr;

            localStorage.setItem('endoSettings', JSON.stringify(userSettings));
            afficherPage('Quotidien');
        }
    };

    actionRow.appendChild(calendarBtn);
    actionRow.appendChild(newCycleBtn);
    mainRow.appendChild(mascotSpace);
    mainRow.appendChild(cycleWheel);
    container.appendChild(mainRow);
    container.appendChild(actionRow);

    return container;
}
function getCycleInfo(dateCible, settings) {
    const cible = new Date(dateCible + "T00:00:00");

    // On crée une liste de tous les cycles (passés + l'actuel)
    let tousLesCycles = [...(settings.cycleHistory || [])];
    if (settings.cycleStart) {
        tousLesCycles.push({ start: settings.cycleStart, len: settings.cycleLength || 28 });
    }

    // On trie du plus récent au plus ancien
    tousLesCycles.sort((a, b) => new Date(b.start) - new Date(a.start));

    // On cherche le cycle qui a commencé juste AVANT ou LE JOUR de la date cible
    let cycleCorrespondant = tousLesCycles.find(c => new Date(c.start + "T00:00:00") <= cible);

    // Si on ne trouve rien (date trop vieille), on prend le plus ancien par défaut ou on s'arrête
    if (!cycleCorrespondant) return null;

    const start = new Date(cycleCorrespondant.start + "T00:00:00");
    const cycleLength = parseInt(cycleCorrespondant.len || 28, 10);
    const periodLength = parseInt(settings.periodLength || 5, 10);

    const diffDays = Math.round((cible - start) / (1000 * 60 * 60 * 24));
    const day = (diffDays % cycleLength) + 1;
    const ovulationDay = cycleLength - 14;

    // --- COULEURS PASTELS DENSES ---
    let phase = "", phaseColor = "";
    if (day <= periodLength) { phase = "🩸 Menstruations"; phaseColor = "#FFB3C6"; }
    else if (day < ovulationDay - 2) { phase = "🌱 Phase Folliculaire"; phaseColor = "#C1F2D7"; }
    else if (day >= ovulationDay - 2 && day <= ovulationDay + 2) { phase = "🥚 Phase Ovulatoire"; phaseColor = "#FFF2C2"; }
    else { phase = "🍂 Phase Lutéale"; phaseColor = "#FFD8B8"; }

    return { day, phase, phaseColor, ovulationDay, cycleLength, periodLength, isPastCycle: cycleCorrespondant.start !== settings.cycleStart };
}
function renderCalendarContent(container) {
    const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

    // 1. Préparation des variables de date
    const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    const prevDaysInMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();
    const startingDay = (firstDay === 0) ? 6 : firstDay - 1;

    // Pour comparer avec "aujourd'hui" et gérer la transparence des prédictions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysHTML = '';

    // --- 1. GÉNÉRATION DES JOURS DU MOIS PRÉCÉDENT (Grisés) ---
    for (let i = startingDay - 1; i >= 0; i--) {
        daysHTML += `<div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:0.8rem; opacity:0.2;">${prevDaysInMonth - i}</div>`;
    }

    // --- 2. GÉNÉRATION DES JOURS DU MOIS ACTUEL ---
    for (let d = 1; d <= daysInMonth; d++) {
        const loopStr = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const loopDate = new Date(loopStr + "T00:00:00");
        const isSelected = (loopStr === selectedDate);

        // Variables de style par défaut
        let shadowEffect = "none";
        let bgColor = "transparent";
        let textColor = "#5e6a75";
        let opacity = "1";

        // Récupération des infos du cycle (cherche dans l'actuel OU l'historique)
        const info = getCycleInfo(loopStr, userSettings);

        if (info) {
            // On utilise une opacité de "90" (environ 56%) pour un halo visible mais doux
            const haloColor = info.phaseColor + "90";

            if (isSelected) {
                // Style du jour cliqué
                bgColor = info.phaseColor;
                // Texte foncé pour le jaune (ovulation), blanc pour le reste
                const isYellow = (info.day >= info.ovulationDay - 2 && info.day <= info.ovulationDay + 2);
                textColor = isYellow ? "#1e293b" : "white";
                shadowEffect = "0 4px 10px rgba(0,0,0,0.1)";
            } else {
                // Style du halo (aura lumineuse)
                shadowEffect = `0 0 8px ${haloColor}, inset 0 0 5px ${haloColor}`;
            }

            // Gestion de la transparence :
            // Si la date est dans le futur par rapport à aujourd'hui, c'est une prédiction
            if (loopDate > today) {
                opacity = "0.7";
            }
        }

        daysHTML += `
            <div onclick="selectCalendarDate('${loopStr}')"
                 style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                 border-radius: 50%; font-weight: 700; font-size: 0.9rem; cursor: pointer;
                 background: ${bgColor}; color: ${textColor}; box-shadow: ${shadowEffect};
                 opacity: ${opacity}; transition: all 0.2s ease; margin: auto;">
                 ${d}
            </div>`;
    }

    // --- 3. GÉNÉRATION DES JOURS DU MOIS SUIVANT (Grisés) ---
    const nextDaysNeeded = 42 - (startingDay + daysInMonth);
    for (let i = 1; i <= nextDaysNeeded; i++) {
        daysHTML += `<div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:0.8rem; opacity:0.2;">${i}</div>`;
    }

    // --- 4. RENDU FINAL DU CONTAINER ---
    container.innerHTML = `
        <div style="width: 350px; background: #ffffff; padding: 30px 20px 45px 20px; border-radius: 40px; box-shadow: 0 25px 60px rgba(0,0,0,0.12); position: relative; border: 1px solid #f1f5f9; box-sizing: border-box;">

            <div style="display: flex; align-items: center; margin-bottom: 30px; position: relative; height: 30px;">
                <button onclick="changeMonth(-1)" style="border:none; background:none; font-size:1.3rem; color:#dbdce0; cursor:pointer; position: absolute; left: 0;">❮</button>

                <div style="width: 100%; display: flex; justify-content: center; align-items: baseline; text-transform: uppercase; letter-spacing: 2px;">
                    <span style="font-size: 1rem; font-weight: 900; color: #1e293b;">${monthNames[currentCalMonth]}</span>
                    <span style="font-size: 1rem; font-weight: 500; color: #94a3b8; margin-left: 8px;">${currentCalYear}</span>
                </div>

                <button onclick="changeMonth(1)" style="border:none; background:none; font-size:1.3rem; color:#dbdce0; cursor:pointer; position: absolute; right: 0;">❯</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; width: 100%;">
                ${['l','m','m','j','v','s','d'].map(j => `<div style="font-size: 0.7rem; color: #cbd5e1; font-weight: 900; text-transform: uppercase; margin-bottom:12px;">${j}</div>`).join('')}
                ${daysHTML}
            </div>

            <button onclick="document.getElementById('calendar-overlay').remove()"
                    style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
                    width: 46px; height: 46px; border-radius: 50%; border: 3px solid white;
                    background: #e2e8f0; color: #475569;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                    font-size: 1.1rem; cursor: pointer; display: flex;
                    align-items: center; justify-content: center; font-weight: bold;">✕</button>
        </div>
    `;
}
function createDailyWellnessBlock(entry) {
    const container = document.createElement('div');
    // Marge négative (-10px) pour remonter le bloc, padding réduit (12px) pour le tasser
    container.style.cssText = 'background: #ffffff; padding: 12px 20px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 20px; margin-top: -10px; display: flex; flex-direction: column; gap: 6px; border: 1px solid #f1f5f9; position: relative; z-index: 10;';

    // --- Style commun pour les boutons ronds "+" ---
    const plusBtnStyle = 'width: 40px; height: 40px; border-radius: 50%; border: 2px solid #f1f5f9; background: #f8fafc; color: #94a3b8; font-size: 1.6rem; font-weight: 300; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; outline: none; padding: 0; line-height: 1;';

    // --- 1. LIGNE HUMEUR (Compacte, Emojis à droite) ---
    const moodEmojis = entry.moods.slice(0, 3).map(m => m.split(' ')[0]).join(' ');

    const moodRow = document.createElement('div');
    moodRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; height: 42px; margin: 0;';
    moodRow.innerHTML = `
        <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Humeur du jour</div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 1.6rem; letter-spacing: 2px;">${moodEmojis}</div>
            <button id="btn-mood-popup" style="${plusBtnStyle}">+</button>
        </div>
    `;

    const divider1 = document.createElement('div');
    divider1.style.cssText = 'height: 1px; border-top: 1px solid #f8fafc; margin: 0;';

    // --- 2. LIGNES DES ÉCHELLES (Boutons 38px + Contrastes nets) ---
    const scalesContainer = document.createElement('div');
    scalesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin: 2px 0;';

    const painsConfig = [
        { key: 'fatigue',    label: 'Fatigue',            colors: ['#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6'], main: '#3b82f6' },
        { key: 'pelvic',     label: 'Douleur pelvienne',  colors: ['#ffe4e6','#fecdd3','#fda4af','#fb7185','#f43f5e'], main: '#f43f5e' },
        { key: 'discomfort', label: 'Inconfort digestif', colors: ['#ffedd5','#fed7aa','#fdba74','#fb923c','#f97316'], main: '#f97316' }
    ];

    painsConfig.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; height: 40px;';

        let bubblesHTML = `<div style="font-weight: 600; font-size: 0.85rem; color: #64748b; flex: 1;">${p.label}</div><div style="display: flex; gap: 5px;">`;

        [1, 2, 3, 4, 5].forEach((v, idx) => {
            const isSel = entry.symptomLevels[p.key] === v;
            const baseColor = p.colors[idx];

            // Logique de couleur de fond (20% opacité si non-sélectionné)
            const bgColor = isSel ? baseColor : baseColor + '33';

            // Le texte reste sombre
            const textCol = '#1e293b';
            const textOpacity = isSel ? '1' : '0.5';

            // Bordure fine (1px) uniquement si sélectionné
            const borderStyle = isSel ? `1px solid ${p.main}` : '1px solid transparent';

            bubblesHTML += `<button class="pain-btn" data-type="${p.key}" data-val="${v}"
                style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease;
                background: ${bgColor}; color: ${textCol}; border: ${borderStyle}; box-sizing: border-box; outline: none; padding: 0;">
                <span style="opacity: ${textOpacity}">${v}</span>
            </button>`;
        });
        bubblesHTML += `</div>`;
        row.innerHTML = bubblesHTML;
        scalesContainer.appendChild(row);
    });

    const divider2 = document.createElement('div');
    divider2.style.cssText = 'height: 1px; border-top: 1px solid #f8fafc; margin: 0;';

    // --- 3. LIGNE SYMPTÔMES (Tassée) ---
    const sympRow = document.createElement('div');
    sympRow.style.cssText = 'display: flex; flex-direction: column; gap: 6px; margin: 0;';
    sympRow.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; height: 42px;">
            <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Symptômes</div>
            <button id="btn-symp-popup" style="${plusBtnStyle}">+</button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: -2px;">
            ${entry.symptoms.length > 0
                ? entry.symptoms.map(s => `<span style="background: #f8fafc; color: #64748b; padding: 5px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; border: 1px solid #f1f5f9;">${s}</span>`).join('')
                : `<div style="font-size: 0.8rem; color: #cbd5e1; font-style: italic;">Aucun symptôme signalé</div>`
            }
        </div>
    `;

    // Assemblage (les dividers ont des marges 0 pour tasser l'ensemble)
    container.appendChild(moodRow);
    container.appendChild(divider1);
    container.appendChild(scalesContainer);
    container.appendChild(divider2);
    container.appendChild(sympRow);

    // Événements
    container.querySelector('#btn-mood-popup').onclick = () => openSelectionPopup('mood', entry);
    container.querySelector('#btn-symp-popup').onclick = () => openSelectionPopup('symptoms', entry);
    container.querySelectorAll('.pain-btn').forEach(btn => {
        btn.onclick = () => {
            const t = btn.dataset.type;
            const v = parseInt(btn.dataset.val);
            entry.symptomLevels[t] = (entry.symptomLevels[t] === v) ? null : v;
            saveData();
            if(typeof afficherPage === 'function') afficherPage('Quotidien');
        };
    });

    return container;
} // ici

// Fonctions globales de contrôle
window.changeMonth = function(offset) {
    currentCalMonth += offset;
    if (currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
    else if (currentCalMonth < 0) { currentCalMonth = 11; currentCalYear--; }
    renderCalendarContent(document.getElementById('calendar-overlay'));
};
window.selectCalendarDate = function(dateStr) {
    selectedDate = dateStr;
    const overlay = document.getElementById('calendar-overlay');
    if (overlay) overlay.remove();
    afficherPage('Quotidien');
};
function openBubblyCalendar() {
    const old = document.getElementById('calendar-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'calendar-overlay';
    // Fond très léger et flouté
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 245, 247, 0.7); z-index: 20000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    `;

    renderCalendarContent(overlay);
    document.body.appendChild(overlay);
}
function openSelectionPopup(type, entry) {
    // 1. Création de l'overlay global
    const overlay = document.createElement('div');
    overlay.id = 'selection-popup-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(248, 250, 252, 0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    // Variables selon le type (Humeur ou Symptômes)
    const isMood = type === 'mood';
    const title = isMood ? 'Humeur du jour' : 'Symptômes';
    const optionsList = isMood ? moodOptions : [...new Set([...predefinedSymptoms, ...customSymptoms])];
    const userSelections = isMood ? entry.moods : entry.symptoms;

    // 2. Génération des boutons d'options
    let optionsHTML = optionsList.map(opt => {
        const isSel = userSelections.includes(opt);
        const styleSel = isSel
            ? 'background: #fdf4ff; border: 1px solid #e879f9; color: #c026d3; font-weight: 600;'
            : 'background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;';

        return `<button class="popup-option-btn" data-val="${opt}"
            style="padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; ${styleSel}">
            ${opt}
        </button>`;
    }).join('');

    // Input custom si c'est les symptômes
    const customInputHTML = !isMood ? `
        <div style="display: flex; gap: 8px; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            <input type="text" id="custom-popup-input" placeholder="Autre symptôme..." style="flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #e2e8f0; outline: none; font-size: 0.9rem;">
            <button id="btn-add-custom" style="width: 40px; height: 40px; border-radius: 50%; border: none; background: #e2e8f0; color: #475569; font-weight: bold; cursor: pointer;">+</button>
        </div>
    ` : '';

    // 3. Structure de la boîte façon calendrier
    overlay.innerHTML = `
        <div style="width: 320px; background: #ffffff; padding: 30px 20px 45px 20px; border-radius: 40px; box-shadow: 0 25px 60px rgba(0,0,0,0.12); position: relative; border: 1px solid #f1f5f9; box-sizing: border-box;">
            <h3 style="text-align: center; margin-top: 0; margin-bottom: 25px; color: #1e293b; font-size: 1.2rem;">${title}</h3>

            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;" id="popup-options-container">
                ${optionsHTML}
            </div>

            ${customInputHTML}

            <button id="close-popup-btn"
                    style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
                    width: 46px; height: 46px; border-radius: 50%; border: 3px solid white;
                    background: #e2e8f0; color: #475569; box-shadow: 0 10px 20px rgba(0,0,0,0.15);
                    font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ✕
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // --- LOGIQUE INTERNE DU POPUP ---
    const updateSelections = () => {
        // Optionnel: si besoin de changer l'humeur principale comme dans ton ancien code
        if (isMood) entry.mood = entry.moods[0] || null;
    };

    // Clics sur les options
    overlay.querySelectorAll('.popup-option-btn').forEach(btn => {
        btn.onclick = () => {
            const val = btn.dataset.val;
            const targetArray = isMood ? entry.moods : entry.symptoms;

            if (targetArray.includes(val)) {
                // Retirer
                targetArray.splice(targetArray.indexOf(val), 1);
                btn.style.cssText = 'padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;';
            } else {
                // Ajouter
                targetArray.push(val);
                btn.style.cssText = 'padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; background: #fdf4ff; border: 1px solid #e879f9; color: #c026d3; font-weight: 600;';
            }
            updateSelections();
        };
    });

    // Ajout d'un symptôme personnalisé
    if (!isMood) {
        overlay.querySelector('#btn-add-custom').onclick = () => {
            const input = overlay.querySelector('#custom-popup-input');
            const val = input.value.trim();
            if (val && !customSymptoms.includes(val)) {
                customSymptoms.push(val);
                entry.symptoms.push(val);
                input.value = '';
                // On ferme et rouvre le popup pour actualiser la liste des boutons
                overlay.remove();
                openSelectionPopup('symptoms', entry);
            }
        };
    }

    // Fermeture du pop-up : on sauvegarde et on rafraîchit la page
    overlay.querySelector('#close-popup-btn').onclick = () => {
        saveData();
        afficherPage('Quotidien');
        overlay.remove();
    };
}

// SUIVI ALIMENTATION //

function getDietEntryForDate(entry) {
    const defaultStructure = {
        goals: {
            "Boire 1.5 litre": false,
            "Une poignée d'amandes": false,
            "2 c. à s. de graines de chia": false,
            "2 c. à s. d'huile de noix": false
        },
        activityGoals: {
            "5 min. cohérence cardiaque": false,
            "Exercices kiné": false,
            "30 min. de marche / piscine": false
        },
        meals: {
            "Petit-déjeuner": { categories: { "Boisson": [], "Repas": [] }, quantities: {}, digestionScale: null },
            "Déjeuner":       { categories: { "Boisson": [], "Repas": [] }, quantities: {}, digestionScale: null },
            "Goûter":         { categories: { "Boisson": [], "Repas": [] }, quantities: {}, digestionScale: null },
            "Dîner":          { categories: { "Boisson": [], "Repas": [] }, quantities: {}, digestionScale: null }
        }
    };

    if (!entry.diet || !entry.diet.meals) {
        entry.diet = JSON.parse(JSON.stringify(defaultStructure));

        if (userSettings?.goalTemplates) {
            Object.keys(userSettings.goalTemplates).forEach(key => {
                entry.diet[key] = {};
                Object.keys(userSettings.goalTemplates[key]).forEach(name => {
                    entry.diet[key][name] = false;
                });
            });
        }

        saveData();
    }

    Object.keys(entry.diet.meals).forEach(mealName => {
        if (!entry.diet.meals[mealName].quantities) {
            entry.diet.meals[mealName].quantities = {};
        }
    });

    return entry.diet;
}
function getFoodTypeColor(foodName) {
    const food = foodDatabase.find(f => f.name === foodName);

    if (!food) {
      return {
        bg: '#f1f5f9',
        border: '#e2e8f0',
        color: '#64748b',
        isGradient: false
      };
    }

    const typeColors = {
      'anti-inflammatoire': { bg: '#dcfce7', border: '#16a34a', color: '#166534' },
      'neutre': { bg: '#f3f4f6', border: '#d1d5db', color: '#6b7280' },
      'pro-inflammatoire': { bg: '#ffedd5', border: '#f97316', color: '#9a3412' },
      'inflammatoire': { bg: '#fee2e2', border: '#ef4444', color: '#991b1b' }
    };

    const baseColor = typeColors[food.type] || {
      bg: '#f8fafc', border: '#e2e8f0', color: '#475569'
    };

    // --- MODIFICATION ICI ---
    // On vérifie si l'aliment a un score omega3 supérieur à 0
    const hasOmega3 = food.scores && food.scores.omega3 > 0;

    if (hasOmega3) {
      return {
        bg: `linear-gradient(135deg, ${baseColor.bg} 50%, #fef9c3 55%, #fde047 100%)`,
        dotBg: `linear-gradient(135deg, ${baseColor.border} 50%, #fef9c3 55%, #fde047 100%)`,
        border: baseColor.border,
        color: baseColor.color,
        isGradient: true
      };
    }

    return { ...baseColor, dotBg: baseColor.border, isGradient: false };
}
function createFoodGoalsTracker() {
    const trackerContainer = document.createElement('div');
    trackerContainer.id = 'food-goals-tracker';

    // Style compact et centré
    trackerContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 25px;
      padding: 10px 0;
      width: 100%;
      box-sizing: border-box;
    `;

    const circlesConfig = [
      { id: 'water',    name: 'Hydratation',      emoji: '🍵', goal: '1.5 Litres', color: '#bae6fd' },
      { id: 'vegFruit', name: 'Légumes & Fruits', emoji: '🍐', goal: '5 portions', color: '#10b981' },
      { id: 'feculent', name: 'Féculents',      emoji: '🍚', goal: '2 portions', color: '#f59e0b' },
      { id: 'proteine', name: 'Protéines',     emoji: '🍳', goal: '2 portions', color: '#ef4444' },
      { id: 'laitage',  name: 'Laitages',      emoji: '🥛', goal: '2 portions', color: '#BAE6FD' },
      { id: 'omega3',   name: 'Oméga-3',       emoji: '🐟', goal: '3 portions', color: '#facc15' }
    ];

    const updateTracker = () => {
      const entry = getEntryForDate(selectedDate);
      const dietData = getDietEntryForDate(entry);

      let dailyPoints = { water: 0, legume: 0, fruit: 0, feculent: 0, proteine: 0, laitage: 0, omega3: 0 };

      if (dietData && dietData.meals) {
        Object.values(dietData.meals).forEach(meal => {
          const quantities = meal.quantities || {};

          // Cumul temporaire des points par repas (pour appliquer le plafond de 1 portion max)
          let mealPoints = { leg: 0, fru: 0, fec: 0, pro: 0, lai: 0, ome: 0 };

          // 1. Analyse des Boissons (Hydratation + Scores laits végétaux)
          (meal.categories?.['Boisson'] || []).forEach(name => {
              const q = quantities[name] || 1;
              // Hydratation : 1 unité = 0.25L (4 verres = 1L)
              dailyPoints.water += (q * 0.25);

              const f = foodDatabase.find(i => i.name === name);
              if (f && f.scores) {
                  mealPoints.lai += (f.scores.laitage || 0) * q;
                  mealPoints.ome += (f.scores.omega3 || 0) * q;
                  mealPoints.fru += (f.scores.fruit || 0) * q;
                  mealPoints.fec += (f.scores.feculent || 0) * q;
                  mealPoints.pro += (f.scores.proteine || 0) * q;
              }
          });

          // 2. Analyse des Aliments (Repas)
          (meal.categories?.['Repas'] || []).forEach(name => {
              const f = foodDatabase.find(i => i.name === name);
              const q = quantities[name] || 1;
              if (f && f.scores) {
                  mealPoints.leg += (f.scores.legume || 0) * q;
                  mealPoints.fru += (f.scores.fruit || 0) * q;
                  mealPoints.fec += (f.scores.feculent || 0) * q;
                  mealPoints.pro += (f.scores.proteine || 0) * q;
                  mealPoints.lai += (f.scores.laitage || 0) * q;
                  mealPoints.ome += (f.scores.omega3 || 0) * q;
              }
          });

          // 3. Conversion en portions (Plafond de 1 portion complète par repas par catégorie)
          // On divise par 4 car 4 points = 1 portion dans notre foodDatabase
          dailyPoints.legume   += Math.min(1, mealPoints.leg / 3);
          dailyPoints.fruit    += Math.min(1, mealPoints.fru / 3);
          dailyPoints.feculent += Math.min(1, mealPoints.fec / 3);
          dailyPoints.proteine += Math.min(1, mealPoints.pro / 3);
          dailyPoints.laitage  += Math.min(1, mealPoints.lai / 3);
          dailyPoints.omega3   += Math.min(1, mealPoints.ome / 3);
        });
      }

      // 4. Ajout des Omega-3 manuels cochés dans les paramètres (s'ils existent)
      const omegaOptions = ["Une poignée d'amandes", "2 c. à s. de graines de chia", "2 c. à s. d'huile de noix"];
      omegaOptions.forEach(option => {
        if (dietData.goals && dietData.goals[option] === true) {
            dailyPoints.omega3 += 1;
        }
      });

      // 5. Calcul des pourcentages finaux pour l'affichage
      const finalScores = circlesConfig.map(c => {
        let percentage = 0;
        switch(c.id) {
            case 'water':    percentage = (Math.min(dailyPoints.water, 1.5) / 1.5) * 100; break;
            case 'vegFruit': percentage = (Math.min(dailyPoints.legume + dailyPoints.fruit, 5) / 5) * 100; break;
            case 'feculent': percentage = (Math.min(dailyPoints.feculent, 2) / 2) * 100; break;
            case 'proteine': percentage = (Math.min(dailyPoints.proteine, 2) / 2) * 100; break;
            case 'laitage':  percentage = (Math.min(dailyPoints.laitage, 2) / 2) * 100; break;
            case 'omega3':   percentage = (Math.min(dailyPoints.omega3, 3) / 3) * 100; break;
        }
        return { ...c, percentage };
      });

      // --- GÉNÉRATION DU VISUEL HTML ---
      trackerContainer.innerHTML = '';
      finalScores.forEach((s) => {
        const bubble = document.createElement('div');
        bubble.style.cssText = `
          position: relative; width: 42px; height: 42px; min-width: 42px;
          flex-shrink: 0; cursor: pointer; border-radius: 50%; overflow: hidden;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
        `;

        bubble.onclick = () => {
            let info = s.goal;
            if (s.id === 'water') info = `${dailyPoints.water.toFixed(1)}L / 1.5L`;
            if (typeof showBubblyPopup === 'function') showBubblyPopup(s.name, info, s.color);
        };

        const fillLevel = document.createElement('div');
        fillLevel.style.cssText = `
          position: absolute; bottom: 0; left: 0; width: 100%;
          height: ${s.percentage}%; background-color: ${s.color};
          transition: height 0.8s ease-out; z-index: 1;
        `;

        const emoji = document.createElement('div');
        emoji.style.cssText = `
          position: relative; z-index: 2; font-size: 1.1rem;
          filter: ${s.percentage > 0 ? 'none' : 'grayscale(100%) opacity(0.3)'};
        `;
        emoji.textContent = s.emoji;

        bubble.appendChild(fillLevel);
        bubble.appendChild(emoji);
        trackerContainer.appendChild(bubble);
      });
    };

    // Initialisation
    updateTracker();
    trackerContainer.update = updateTracker;
    return trackerContainer;
}
function createAutocompleteInput(mealName, categoryName, onUpdate) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; flex: 1; display: flex; align-items: center;';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = ' . . . ';
    input.style.cssText = `
      width: 60px; height: 32px; border: none; background: #ffffff;
      color: #475569; border-radius: 10px; font-size: 0.9rem;
      font-weight: 600; text-align: center; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: all 0.2s ease;
      outline: none; padding: 0 5px; margin-left: 15px;
    `;

    const list = document.createElement('div');
    list.style.cssText = `
      position: absolute; top: 38px; left: 15px; z-index: 1000;
      min-width: 200px; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      border-radius: 12px; max-height: 200px; overflow-y: auto; display: none; border: 1px solid #f1f5f9;
    `;

    const normalizeStr = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    input.addEventListener('input', (e) => {
      const val = e.target.value;
      const searchVal = normalizeStr(val.trim());

      // Ajustement dynamique de la largeur
      input.style.width = val.length > 0 ? '140px' : '60px';
      input.style.textAlign = val.length > 0 ? 'left' : 'center';

      list.innerHTML = '';
      if (searchVal.length === 0) { list.style.display = 'none'; return; }

      const matches = foodDatabase.filter(f => {
        const isBoissonInput = categoryName === 'Boisson';

        // --- LOGIQUE DE FILTRAGE CORRIGÉE ---
        // On vérifie si l'aliment appartient au tableau 'boissons' original
        const isActuallyABoisson = boissons.some(b => b.name === f.name);

        if (isBoissonInput) {
            if (!isActuallyABoisson) return false; // Si on cherche une boisson, on ignore les solides
        } else {
            if (isActuallyABoisson) return false; // Si on cherche du solide, on ignore les boissons
        }

        const n = normalizeStr(f.name);
        return n.startsWith(searchVal) || n.includes(" " + searchVal);
      });

      if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(match => {
          const item = document.createElement('div');
          item.style.cssText = `
            padding: 10px; cursor: pointer; display: flex;
            align-items: center; border-bottom: 1px solid #f1f5f9;
          `;

          const col = getFoodTypeColor(match.name);
          const dot = document.createElement('span');
          dot.style.cssText = `
            display: inline-block; width: 8px; height: 8px;
            border-radius: 50%; marginRight: 8px; flex-shrink: 0;
            background: ${col.dotBg || col.border};
          `;

          const label = document.createElement('span');
          label.textContent = match.name;
          label.style.fontSize = '0.85rem';

          item.appendChild(dot);
          item.appendChild(label);

          const selectItem = (e) => {
              e.preventDefault();
              const entry = getEntryForDate(selectedDate);
              const dietData = getDietEntryForDate(entry);

              if (!dietData.meals[mealName].categories[categoryName].includes(match.name)) {
                  dietData.meals[mealName].categories[categoryName].push(match.name);
                  saveData();
              }

              input.value = '';
              input.style.width = '60px';
              list.style.display = 'none';
              onUpdate();
          };

          item.onmousedown = selectItem;
          list.appendChild(item);
        });
      } else { list.style.display = 'none'; }
    });

    // Fermer la liste si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) list.style.display = 'none';
    });

    wrapper.appendChild(input);
    wrapper.appendChild(list);
    return wrapper;
}
function createMealAccordion(mealName) {
    const entry = getEntryForDate(selectedDate);
    const dietData = getDietEntryForDate(entry);

    const details = document.createElement('details');
    details.className = 'card meal-accordion-card';
    // On peut ajouter une condition pour garder ouvert si besoin,
    // mais en évitant le re-render global au clic, le problème disparaît.

    const summary = document.createElement('summary');
    summary.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    list-style:none; outline:none; cursor:pointer; padding: 0;
    color: #5d5a55;
  `;

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-weight:700; font-size:1.1rem;';
    titleSpan.textContent = mealName;

    const iconsWrapper = document.createElement('div');
    // Correction Alignement : align-items center et gap précis
    iconsWrapper.style.cssText = 'display:flex; align-items:center; gap:10px; height:32px;';

    // --- LOGIQUE DES COULEURS SVG (Inchangée) ---
    const getMealIconColors = () => {
      const cats = dietData.meals[mealName]?.categories || {};
      const boissons = cats['Boisson'] || [];
      const repas = cats['Repas'] || [];
      const typeRank = { 'inflammatoire': 4, 'pro-inflammatoire': 3, 'neutre': 2, 'anti-inflammatoire': 1 };
      let cupColor = null;
      if (boissons.length > 0) {
        let maxRank = 0;
        boissons.forEach(name => {
          const f = foodDatabase.find(f => f.name === name);
          if (f && typeRank[f.type] > maxRank) maxRank = typeRank[f.type];
        });
        cupColor = { 1: '#16a34a', 2: '#16a34a', 3: '#f97316', 4: '#ef4444' }[maxRank];
      }
      let plateColor = null, plateGradient = null;
      const plateId = `plate-grad-${mealName.replace(/\s/g, '')}`;
      if (repas.length > 0) {
        let hasGood = false, hasBad = false, worstType = 'anti-inflammatoire', worstRank = 0;
        repas.forEach(name => {
          const f = foodDatabase.find(f => f.name === name);
          if (!f) return;
          if (f.type === 'anti-inflammatoire' || f.type === 'neutre') hasGood = true;
          if (f.type === 'pro-inflammatoire' || f.type === 'inflammatoire') hasBad = true;
          if (typeRank[f.type] > worstRank) { worstRank = typeRank[f.type]; worstType = f.type; }
        });
        if (hasGood && hasBad) {
          const badColor = worstType === 'inflammatoire' ? '#ef4444' : '#f97316';
          plateGradient = `linear-gradient(135deg, #16a34a 50%, ${badColor} 50%)`;
        } else {
          plateColor = { 1: '#16a34a', 2: '#16a34a', 3: '#f97316', 4: '#ef4444' }[worstRank];
        }
      }
      return { cupColor, plateColor, plateGradient, plateId };
    };

    const defaultGray = '#cbd5e1';
    const cupSVG = (color) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="display:block;"><path d="M5 6h11v8a4 4 0 01-4 4H9a4 4 0 01-4-4V6z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 8h2a2 2 0 010 4h-2" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><line x1="7" y1="3" x2="7" y2="5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="2" x2="10" y2="5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="3" x2="13" y2="5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    const plateSVG = (color, gradient, plateId) => {
      const colors = gradient ? gradient.match(/#[0-9a-f]{6}/gi) : null;
      const c1 = colors?.[0] || color || defaultGray;
      const c2 = colors?.[1] || color || defaultGray;
      const gradDef = gradient ? `<defs><linearGradient id="${plateId}" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="50%" stop-color="${c1}"/><stop offset="50%" stop-color="${c2}"/></linearGradient></defs>` : '';
      const strokeColor = gradient ? `url(#${plateId})` : (color || defaultGray);
      return `<svg width="26" height="22" viewBox="0 0 28 24" fill="none" style="display:block;">${gradDef}<line x1="3" y1="3" x2="3" y2="10" stroke="${c1}" stroke-width="1.5"/><line x1="5" y1="3" x2="5" y2="10" stroke="${c1}" stroke-width="1.5"/><line x1="7" y1="3" x2="7" y2="10" stroke="${c1}" stroke-width="1.5"/><path d="M3 10 Q5 13 5 14 L5 21" stroke="${c1}" stroke-width="1.5"/><circle cx="14" cy="12" r="7" stroke="${strokeColor}" stroke-width="1.8"/><circle cx="14" cy="12" r="4" stroke="${strokeColor}" stroke-width="1.2"/><path d="M23 3 C25 3 26 5 26 8 L25 10 L23 10 Z" stroke="${c2}" stroke-width="1.3"/><line x1="24" y1="10" x2="24" y2="21" stroke="${c2}" stroke-width="1.5"/></svg>`;
    };

    const updateIcons = () => {
      const { cupColor, plateColor, plateGradient, plateId } = getMealIconColors();
      const val = dietData.meals[mealName].digestionScale;
      const orangeGrads = ['#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c'];

      let badge = '';
      if (val) {
        // Badge mieux aligné verticalement avec flex et line-height
        badge = `<div style="width:24px; height:24px; border-radius:50%; background:${orangeGrads[val - 1]}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:white; flex-shrink:0;">${val}</div>`;
      }

      iconsWrapper.innerHTML = `
      ${badge}
      <div style="display:flex; align-items:center;">${cupSVG(cupColor || defaultGray)}</div>
      <div style="display:flex; align-items:center;">${plateSVG(plateColor, plateGradient, plateId)}</div>
    `;

      const tracker = document.getElementById('food-goals-tracker');
      if (tracker && tracker.update) tracker.update();
    };

    const content = document.createElement('div');
    content.style.marginTop = '20px';

    // --- SECTION : BOISSON & REPAS) ---
    const mealCategories = ["Boisson", "Repas"];

    mealCategories.forEach(cat => {
      const categoryGroup = document.createElement('div');
      categoryGroup.style.marginBottom = '20px';

      // 1. L'EN-TÊTE : Titre à gauche, Input à droite
      const headerRow = document.createElement('div');
      headerRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8px;
  `;

      const catTitle = document.createElement('div');
      catTitle.style.cssText = `
    font-size: 0.8rem; /* Taille harmonisée */
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 800;
    letter-spacing: 0.05em;
    width: 75px; /* Aligne verticalement les inputs */
    flex-shrink: 0;
  `;
      catTitle.textContent = cat;

      // 2. ZONE DES ÉTIQUETTES : En dessous du header
      const tagsArea = document.createElement('div');
      tagsArea.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  `;

      // Fonction de rendu des tags unique pour éviter les doublons
      const refreshTags = () => {
        tagsArea.innerHTML = '';
        const items = dietData.meals[mealName].categories[cat] || [];
        if (!dietData.meals[mealName].quantities) dietData.meals[mealName].quantities = {};
        const quantities = dietData.meals[mealName].quantities;

        items.forEach((foodName, index) => {
          const food = foodDatabase.find(f => f.name.toLowerCase() === foodName.toLowerCase());
          let col;

          if (food) {
            // ALIMENT CONNU : On utilise sa couleur type (Anti-inf, etc.)
            col = getFoodTypeColor(food.name);
          } else {
            // ALIMENT INCONNU : Style ÉTIQUETTE BLANCHE
            col = {
              bg: '#ffffff',
              border: '#e2e8f0', // Gris très clair pour la bordure
              color: '#64748b',
              dotBg: '#cbd5e1'   // Point gris clair
            };
          }
          const qty = quantities[foodName] || 1;
          const tag = document.createElement('div');
          tag.className = 'food-tag';

          // Style du tag (Nouveau style compact)
          tag.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${col.bg};
        border: 1px solid ${col.border};
        color: ${col.color};
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      `;

          // Contenu HTML du tag (Point + Qty + Nom + Close)
          tag.innerHTML = `
        <span style="width:6px; height:6px; border-radius:50%; background:${col.dotBg || col.border}; flex-shrink:0;"></span>
        ${qty > 1 ? `<span style="background:${col.border}; color:white; border-radius:8px; padding:0 5px; font-size:0.7rem; font-weight:900;">${qty}</span>` : ''}
        <span style="white-space: nowrap;">${foodName}</span>
        <span class="close-btn" style="margin-left:4px; font-weight:bold; opacity:0.4; font-size:1.1rem;">×</span>
      `;

          // --- Logique Long-Press (Quantité) ---
          let timer;
          const startPress = () => {
            timer = setTimeout(() => {
              showQuantityPopup(foodName, qty, (newQty) => {
                quantities[foodName] = newQty;
                saveData();
                refreshTags();
                updateIcons();
              });
            }, 1500); // 1.5 seconde d'appui
          };
          const endPress = () => clearTimeout(timer);

          tag.onmousedown = tag.ontouchstart = startPress;
          tag.onmouseup = tag.onmouseleave = tag.ontouchend = endPress;

          // --- Bouton Supprimer ---
          tag.querySelector('.close-btn').onclick = (e) => {
            e.stopPropagation();
            items.splice(index, 1);
            delete quantities[foodName];
            saveData();
            refreshTags();
            updateIcons();
          };

          tagsArea.appendChild(tag);
        });
      };

      // 3. INITIALISATION DE L'AUTOCOMPLETE
      // On passe une fonction de rappel qui ne fait QUE rafraîchir les tags
      const autocompleteInput = createAutocompleteInput(mealName, cat, () => {
        refreshTags();
        updateIcons();
      });

      // 4. ASSEMBLAGE FINAL
      headerRow.appendChild(catTitle);
      headerRow.appendChild(autocompleteInput); // L'input "..." reste fixe à droite

      categoryGroup.appendChild(headerRow);
      categoryGroup.appendChild(tagsArea);
      content.appendChild(categoryGroup);

      refreshTags();
    });

    // --- INCONFORT DIGESTIF ---
    const digestDiv = document.createElement('div');
    digestDiv.style.marginTop = '25px';
    digestDiv.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8; margin-bottom:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">Inconfort digestif</div>`;

    const levelsRow = document.createElement('div');
    levelsRow.style.cssText = 'display:flex; justify-content:space-between; max-width:280px;';
    const orangeGrads = ['#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c'];

    const renderCircles = () => {
      levelsRow.innerHTML = '';
      [1, 2, 3, 4, 5].forEach(lvl => {
        const circle = document.createElement('div');
        const isSelected = dietData.meals[mealName].digestionScale === lvl;
        circle.textContent = lvl;
        circle.style.cssText = `
         width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center;
         cursor:pointer; font-weight:800; transition:0.2s;
         background:${isSelected ? orangeGrads[lvl - 1] : '#f8fafc'};
         color:${isSelected ? 'white' : '#cbd5e1'};
         border:2px solid ${isSelected ? orangeGrads[lvl - 1] : '#f1f5f9'};
       `;

        circle.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          // --- LOGIQUE DE DÉSÉLECTION ---
          // Si on clique sur le niveau déjà actif, on l'annule (null)
          if (dietData.meals[mealName].digestionScale === lvl) {
            dietData.meals[mealName].digestionScale = null;
          } else {
            dietData.meals[mealName].digestionScale = lvl;
          }

          saveData();
          updateIcons();
          renderCircles(); // Rafraîchit uniquement les ronds
        };
        levelsRow.appendChild(circle);
      });
    };

    renderCircles();
    digestDiv.appendChild(levelsRow);
    content.appendChild(digestDiv);

    updateIcons();
    summary.appendChild(titleSpan);
    summary.appendChild(iconsWrapper);
    details.appendChild(summary);
    details.appendChild(content);

    return details;
  }

// HISTORIQUE //
function calculateDailyStreak() {
    const allData = JSON.parse(localStorage.getItem('endoData')) || {};
    let streak = 0;
    let checkDate = new Date();

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        const entry = allData[dateStr];

        if (entry && entry.goals) {
            // On vérifie si TOUS les objectifs quotidiens sont remplis
            const goals = Object.values(entry.goals);
            const activityGoals = entry.activityGoals ? Object.values(entry.activityGoals) : [];

            const allGoalsMet = goals.length > 0 && goals.every(v => v === true);
            const allActivityMet = activityGoals.length > 0 ? activityGoals.every(v => v === true) : true;

            if (allGoalsMet && allActivityMet) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break; // Un objectif n'est pas rempli, on arrête la série
            }
        } else {
            break; // Pas d'entrée pour ce jour, on arrête
        }
    }
    return streak;
}
function calculateWeeklyStreak() {
    const allData = JSON.parse(localStorage.getItem('endoData')) || {};
    let streak = 0;
    let now = new Date();

    // On remonte au dernier dimanche
    let checkDate = new Date(now);
    checkDate.setDate(now.getDate() - (now.getDay() || 7));

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const entry = allData[dateStr];

        // Attention: Vérifie bien que tu as "diet" et "weeklyGoals" dans tes objets
        if (entry && entry.diet && entry.diet.weeklyGoals) {
            const wGoals = Object.values(entry.diet.weeklyGoals);
            const wActivity = entry.diet.activityWeeklyGoals ? Object.values(entry.diet.activityWeeklyGoals) : [];

            if (wGoals.every(v => v === true) && (wActivity.length === 0 || wActivity.every(v => v === true))) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 7);
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return streak;
}
function renderHistoryStreaks() {
    const container = document.getElementById('history-streaks-container');
    if (!container) return;
    container.innerHTML = '';
    const myStreaks = [
      { label: 'Jours', count: calculateDailyStreak() },
      { label: 'Semaines', count: calculateWeeklyStreak() }
    ];
    renderStreakCircles(container, myStreaks);
  }
function renderStreakCircles(container, streaksData) {
    const streakContainer = document.createElement('div');
    streakContainer.className = 'streak-container';
    streakContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        margin-bottom: 30px;
        padding-right: 10px;
        flex-wrap: wrap;
    `;

    const createStreakCircle = (label, count) => {
      const circle = document.createElement('div');
      const isActive = count > 0;
      const formattedLabel = count <= 1 ? label.replace(/s$/, '') : label;

      circle.style.cssText = `
            width: 70px; height: 70px; border-radius: 50%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: ${isActive ? 'linear-gradient(135deg, #ff6b8b, #9d4edd)' : '#f1f5f9'};
            box-shadow: ${isActive ? '0 6px 12px rgba(255,107,139,0.2)' : 'none'};
            color: ${isActive ? 'white' : '#94a3b8'};
            transition: all 0.3s ease;
            flex-shrink: 0;
        `;

      circle.innerHTML = `
            <span style="font-size: 1.1rem; font-weight: 800;">${isActive ? '🔥' : ''}${count}</span>
            <span style="font-size: 0.6rem; font-weight: 600; text-transform: uppercase; margin-top:2px; opacity:0.9; text-align:center;">
                ${formattedLabel}
            </span>
        `;
      return circle;
    };

    streaksData.forEach(item => {
      streakContainer.appendChild(createStreakCircle(item.label, item.count));
    });

    container.appendChild(streakContainer);
  }
function renderHistoryGraph() {
  const container = document.getElementById('history-graph-container');
  if (!container) return;

  container.innerHTML = "";
  container.style.cssText = "background:transparent; padding:0; position:relative; display:block; min-height:180px; margin: 0 5px; box-sizing: border-box;";

  const allData = JSON.parse(localStorage.getItem('endoData')) || {};

  // --- 1. EN-TÊTE ---
  const header = document.createElement('div');
  header.style.cssText = "display: flex; align-items: center; gap: 6px; margin-bottom: 5px; padding-left: 5px;";

  const title = document.createElement('h3');
  title.textContent = "État des 10 derniers jours";
  title.style.cssText = "margin: 0; font-size: 13px; color: #64748b; font-weight: 600; font-family: inherit;";

  const helpBtn = document.createElement('div');
  helpBtn.innerHTML = "?";
  helpBtn.style.cssText = `width: 16px; height: 16px; background: #f1f5f9; color: #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; cursor: pointer; border: 1px solid #e2e8f0; user-select: none;`;

  helpBtn.onclick = (e) => {
    e.stopPropagation();
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px;";
    const pop = document.createElement('div');
    pop.style.cssText = "background:white; padding:20px; border-radius:15px; width:100%; max-width:280px; box-shadow:0 10px 25px rgba(0,0,0,0.1); position:relative;";
    pop.innerHTML = `<div style="font-weight:bold; margin-bottom:15px; color:#166534; font-size:16px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">Légende</div>
      <div style="display:flex; align-items:center; margin-bottom:10px;"><div style="width:12px; height:12px; background:linear-gradient(#bef264, #166534); border-radius:3px; margin-right:12px;"></div><span style="font-size:13px;">Habitudes (0-100%)</span></div>
      <div style="display:flex; align-items:center; margin-bottom:10px;"><div style="width:10px; height:10px; border-radius:50%; background:#60a5fa; margin-right:12px;"></div><span style="font-size:13px;">Fatigue</span></div>
      <div style="display:flex; align-items:center; margin-bottom:10px;"><div style="width:10px; height:10px; border-radius:50%; background:#f43f5e; margin-right:12px;"></div><span style="font-size:13px;">Douleurs</span></div>
      <div style="display:flex; align-items:center; margin-bottom:20px;"><div style="width:10px; height:10px; border-radius:50%; background:#fb923c; margin-right:12px;"></div><span style="font-size:13px;">Inconfort digestif</span></div>
      <button style="width:100%; padding:10px; background:#166534; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Fermer</button>`;
    overlay.onclick = () => overlay.remove();
    pop.querySelector('button').onclick = () => overlay.remove();
    overlay.appendChild(pop);
    document.body.appendChild(overlay);
  };

  header.appendChild(title);
  header.appendChild(helpBtn);
  container.appendChild(header);

  // --- 2. CONFIGURATION GRAPHIQUE ---
  const nbJours = 10;
  const graphHeight = 150;
  const marginTop = 10;
  const step = (graphHeight - marginTop) / 5.5;

  const getYTicks = (val) => graphHeight - (val * step);

  const graphArea = document.createElement('div');
  graphArea.style.cssText = "position:relative; width:100%; height:150px;";
  container.appendChild(graphArea);

  // --- 3. GRILLE DE FOND ---
  for (let lvl = 1; lvl <= 5; lvl++) {
    const yPos = getYTicks(lvl);
    const gridLine = document.createElement('div');
    gridLine.style.cssText = `position: absolute; left: 0; width: 100%; top: ${yPos}px; height: 1px; background: rgba(226, 232, 240, 0.6); z-index: 0;`;
    graphArea.appendChild(gridLine);

    const label = document.createElement('span');
    label.textContent = lvl;
    label.style.cssText = `position:absolute; left:-12px; top:${yPos - 6}px; font-size:9px; color:#cbd5e1; font-weight:bold;`;
    graphArea.appendChild(label);
  }

  // --- 4. BARRES ---
  const graphInner = document.createElement('div');
  graphInner.style.cssText = `display:flex; align-items:flex-end; height:100%; width:100%; gap:4px; position:absolute; top:0; left:0; z-index:1;`;

  const svgNS = "http://www.w3.org/2000/svg";
  const svgLayer = document.createElementNS(svgNS, "svg");
  svgLayer.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5; overflow:visible;`;

  const symptomsConfig = [
    { key: 'fatigue', color: '#60a5fa' },
    { key: 'pelvic', color: '#f43f5e' },
    { key: 'discomfort', color: '#fb923c' }
  ];
  // Jitter augmenté à 7px pour un espacement bien visible
  const jitterConfig = { 'fatigue': -10, 'pelvic': -1, 'discomfort': 7 };
  const pointsData = { fatigue: [], pelvic: [], discomfort: [] };

  for (let i = (nbJours - 1); i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = allData[dateStr];

    let scoreTotal = 0;
    if (entry && entry.diet) {
        let done = 0, total = 0;
        [entry.diet.goals, entry.diet.weeklyGoals, entry.diet.activityGoals].forEach(p => { if (p) { const v = Object.values(p); done += v.filter(x=>x===true).length; total += v.length; }});
        if (total > 0) scoreTotal += (done / total) * 75;
        let veg = 0;
        if (entry.diet.meals) Object.values(entry.diet.meals).forEach(m => { if (m.categories) Object.values(m.categories).flat().forEach(it => {
            const f = (typeof foodDatabase !== 'undefined') ? foodDatabase.find(x => x.name === (typeof it === 'object' ? it.name : it)) : null;
            if (f && (f.legume || f.fruit)) veg += (typeof it === 'object' ? (parseInt(it.qty) || 1) : 1);
        });});
        scoreTotal += Math.min((veg / 5) * 25, 25);
    }

    const dayWrapper = document.createElement('div');
    dayWrapper.style.cssText = `flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; position:relative;`;

    const barFill = document.createElement('div');
    barFill.style.cssText = `width:100%; height:0%; background:linear-gradient(180deg, #bef264 0%, #166534 100%); border-radius:2px 2px 0 0; transition:height 0.8s ease-out; opacity:0.35; border-bottom: 1px solid white;`;

    const baseLine = document.createElement('div');
    baseLine.style.cssText = `width:100%; height:2px; background:${scoreTotal > 0 ? '#166534' : '#e2e8f0'}; border-radius:1px;`;

    dayWrapper.appendChild(barFill);
    dayWrapper.appendChild(baseLine);
    graphInner.appendChild(dayWrapper);

    setTimeout(() => { barFill.style.height = scoreTotal > 0 ? `${Math.max(scoreTotal, 5)}%` : '0%'; }, ((nbJours - 1) - i) * 30);

    if (entry && entry.symptomLevels) {
      symptomsConfig.forEach(s => {
        const val = entry.symptomLevels[s.key];
        if (val > 0) pointsData[s.key].push({ dayIndex: (nbJours-1)-i, y: getYTicks(val) });
      });
    }
  }

  graphArea.appendChild(graphInner);
  graphArea.appendChild(svgLayer);

  // --- 6. DESSIN SVG (LIGNES PUIS POINTS) ---
  setTimeout(() => {
    const dayCols = graphInner.children;
    if (!dayCols.length) return;
    const fullStep = dayCols[0].offsetWidth + 4;
    const centerOffset = dayCols[0].offsetWidth / 2;

    // ÉTAPE A : Dessiner TOUTES les lignes d'abord (en arrière-plan)
    symptomsConfig.forEach(s => {
      const pts = pointsData[s.key];
      if (pts.length < 2) return;

      const offsetX = jitterConfig[s.key] || 0;
      const coords = pts.map(p => ({ x: (p.dayIndex * fullStep) + centerOffset + offsetX, y: p.y }));

      let d = `M ${coords[0].x} ${coords[0].y}`;
      for (let j = 0; j < coords.length - 1; j++) {
        const midX = (coords[j].x + coords[j + 1].x) / 2;
        d += ` C ${midX} ${coords[j].y}, ${midX} ${coords[j + 1].y}, ${coords[j + 1].x} ${coords[j + 1].y}`;
      }

      // Halo blanc (derrière la ligne colorée)
      const halo = document.createElementNS(svgNS, "path");
      halo.setAttribute("d", d); halo.setAttribute("stroke", "white"); halo.setAttribute("fill", "none");
      halo.setAttribute("stroke-width", "2.5"); halo.setAttribute("opacity", "0.4");
      svgLayer.appendChild(halo);

      // Ligne colorée pointillée
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", d); path.setAttribute("stroke", s.color); path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "1.5"); path.setAttribute("stroke-dasharray", "4, 4");
      svgLayer.appendChild(path);
    });

    // ÉTAPE B : Dessiner TOUS les points (au premier plan)
    symptomsConfig.forEach(s => {
      const pts = pointsData[s.key];
      const offsetX = jitterConfig[s.key] || 0;
      pts.forEach(p => {
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", (p.dayIndex * fullStep) + centerOffset + offsetX);
        dot.setAttribute("cy", p.y);
        dot.setAttribute("r", "3.2");
        dot.setAttribute("fill", s.color);
        dot.setAttribute("stroke", "white");
        dot.setAttribute("stroke-width", "0.8");
        svgLayer.appendChild(dot);
      });
    });
  }, 300);
}
function renderHistoryNotes() {
    const container = document.getElementById('history-notes-container');
    if (!container) return;
    container.innerHTML = "";

    const rawData = localStorage.getItem('endoData');
    const allData = rawData ? JSON.parse(rawData) : {};

    const sortedHistory = Object.entries(allData)
        .map(([date, details]) => ({ date, ...details }))
        .filter(entry => (entry.moods?.length > 0 || entry.symptoms?.length > 0 || entry.symptomLevels || entry.diet?.meals))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedHistory.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:30px; font-size:0.9rem;'>Aucune note enregistrée.</p>";
        return;
    }

    // 1. TITRE FIXE (Décalé à 20px)
    const mainTitle = document.createElement('h3');
    mainTitle.style.cssText = "margin: 30px 0 15px 20px; color: #1e293b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: inherit;";
    mainTitle.textContent = "Notes quotidiennes";
    container.appendChild(mainTitle);

    const listContainer = document.createElement('div');
    listContainer.style.cssText = "background: white; border-top: 1px solid #f1f5f9; margin-bottom: 40px;";

    sortedHistory.forEach(entry => {
        const [year, month, day] = entry.date.split('-');
        const shortDate = `${day}/${month}`;

        // --- SCORES AVEC DÉGRADÉS ---
        const levels = entry.symptomLevels || {};
        let scoresHTML = '';
        const getIntensityStyle = (type, val) => {
            const opacity = 0.2 + (val * 0.16);
            const colors = { fatigue: `rgba(96, 165, 250, ${opacity})`, pelvic: `rgba(244, 63, 94, ${opacity})`, discomfort: `rgba(251, 146, 60, ${opacity})` };
            return `background: ${colors[type]}; color: ${val > 3 ? 'white' : '#1e293b'};`;
        };

        ['fatigue', 'pelvic', 'discomfort'].forEach(key => {
            const val = levels[key];
            if (val > 0) scoresHTML += `<span style="width:22px; height:22px; ${getIntensityStyle(key, val)} border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; margin-left:4px;">${val}</span>`;
        });

        // --- TRI REPAS ---
        let foodCounts = {}, drinkCounts = {};
        if (entry.diet?.meals) {
            Object.values(entry.diet.meals).forEach(meal => {
                if (meal.categories) {
                    Object.values(meal.categories).forEach(items => {
                        items.forEach(item => {
                            if (!item) return;
                            let name = typeof item === 'object' ? item.name : item;
                            let qty = typeof item === 'object' ? (parseInt(item.qty) || 1) : 1;
                            const db = (typeof foodDatabase !== 'undefined') ? foodDatabase : [];
                            const foodInfo = db.find(f => (f.name || f.title) === name);
                            if (foodInfo && (foodInfo.boisson || foodInfo.type === 'Boisson')) drinkCounts[name] = (drinkCounts[name] || 0) + qty;
                            else foodCounts[name] = (foodCounts[name] || 0) + qty;
                        });
                    });
                }
            });
        }
        const format = (obj) => Object.entries(obj).map(([n, c]) => c > 1 ? `${n} (${c})` : n).join(', ');
        const drinksText = format(drinkCounts);
        const foodsText = format(foodCounts);

        // --- RENDU SANS EFFET BUBBLE ---
        const dayDetails = document.createElement('details');
        dayDetails.style.cssText = "border-bottom: 1px solid #f1f5f9; background: white;";

        dayDetails.innerHTML = `
            <summary style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; list-style:none; cursor:pointer; outline:none;">
                <span style="font-weight:700; color:#1e293b; font-size:16px;">${shortDate}</span>
                <div style="display:flex; align-items:center;">${scoresHTML}</div>
            </summary>

            <div style="padding: 0 20px 20px 20px;">
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:15px;">
                    ${(entry.moods || []).map(m => `<span style="color:#ca8a04; font-size:12px; font-weight:600;">#${m}</span>`).join(' ')}
                    ${(entry.symptoms || []).map(s => `<span style="color:#64748b; font-size:12px; font-weight:500; border-left: 2px solid #e2e8f0; padding-left:6px; margin-left:4px;">${s}</span>`).join('')}
                </div>

                <div style="font-size:14px; color:#334155; line-height:1.6; border-top: 1px dashed #f1f5f9; padding-top:12px;">
                    ${drinksText ? `<div style="margin-bottom:6px;"><span style="opacity:0.6;">☕</span> <strong style="color:#475569;">Boissons :</strong> ${drinksText}</div>` : ''}
                    ${foodsText ? `<div><span style="opacity:0.6;">🍴</span> <strong style="color:#475569;">Aliments :</strong> ${foodsText}</div>` : ''}
                </div>
            </div>
        `;
        listContainer.appendChild(dayDetails);
    });

    container.appendChild(listContainer);
}

// ---  FONCTIONS OUTILS ---

function calculateDay() {
    const diff = Math.floor((new Date() - new Date(userSettings.start)) / 86400000);
    return (diff % userSettings.len) + 1;
}

function showSimplePopup(title, content, color) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.5); display:flex; align-items:center;
    justify-content:center; z-index:10000; padding:20px;
  `;

    const popup = document.createElement('div');
    popup.style.cssText = `
    background:white; padding:25px; border-radius:30px;
    width:100%; max-width:320px; text-align:center;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    border-top: 8px solid ${color};
  `;

    popup.innerHTML = `
    <h3 style="margin-bottom:15px; color:${color}; font-weight:800;">${title}</h3>
    <div style="margin-bottom:20px; line-height:1.6;">${content}</div>
    <button id="close-bubbly" style="
      background:${color}; color:white; border:none;
      padding:10px 25px; border-radius:20px; font-weight:700; cursor:pointer;
    ">Fermer</button>
  `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    popup.querySelector('#close-bubbly').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }
function showBubblyPopup(name, goal, color) {

     const oldPopup = document.getElementById('bubbly-popup');
     if (oldPopup) oldPopup.remove();

     const popup = document.createElement('div');
     popup.id = 'bubbly-popup';
     popup.style.cssText = `
     position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5);
     background: white; padding: 20px 30px; border-radius: 30px;
     box-shadow: 0 15px 30px rgba(0,0,0,0.1); z-index: 9999;
     text-align: center; border: 3px solid ${color};
     opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
     font-family: 'Outfit', sans-serif;
   `;

     popup.innerHTML = `
     <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 5px;">Objectif quotidien</div>
     <div style="font-size: 1.2rem; font-weight: 800; color: ${color}; margin-bottom: 10px;">${name}</div>
     <div style="font-size: 1.1rem; font-weight: 600; color: #1e293b;">${goal} recommandées</div>
     <button id="close-popup" style="margin-top: 15px; padding: 8px 15px; border: none; background: #f1f5f9; border-radius: 15px; cursor: pointer; color: #64748b; font-weight: 700;">OK</button>
   `;

     document.body.appendChild(popup);

     setTimeout(() => {
       popup.style.opacity = '1';
       popup.style.transform = 'translate(-50%, -50%) scale(1)';
     }, 10);

     const close = () => {
       popup.style.opacity = '0';
       popup.style.transform = 'translate(-50%, -50%) scale(0.5)';
       setTimeout(() => popup.remove(), 300);
     };

     popup.querySelector('#close-popup').onclick = close;
     // Ferme aussi si on clique n'importe où ailleurs
     setTimeout(() => window.addEventListener('click', function _f(e) {
       if (!popup.contains(e.target)) { close(); window.removeEventListener('click', _f); }
     }), 100);
   }
function showQuantityPopup(foodName, currentQty, onSave) {
    let qty = currentQty || 1;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:9999; display:flex; align-items:center; justify-content:center;';

    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white; padding: 25px 35px; border-radius: 30px;
      box-shadow: 0 15px 30px rgba(0,0,0,0.15); border: 3px solid var(--primary);
      text-align: center; transform: scale(0.5); opacity: 0;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: 'Outfit', sans-serif;
    `;

    popup.innerHTML = `
    <div style="font-weight:800; color:#5d5a55; text-align:center; font-size:1.1rem; margin-bottom:15px;">Nombre de ${foodName}</div>
    <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom: 20px;">
      <div class="qty-btn-inline" id="qty-minus" style="width: 45px; height: 45px; border-radius: 50%; background: #fdf2f8; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; cursor: pointer; box-shadow: 0 2px 5px rgba(255,107,139,0.2); user-select:none;">-</div>
      <div id="qty-val" style="font-size:1.8rem; font-weight:900; color:var(--primary); min-width:40px; text-align:center;">${qty}</div>
      <div class="qty-btn-inline" id="qty-plus" style="width: 45px; height: 45px; border-radius: 50%; background: #fdf2f8; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; cursor: pointer; box-shadow: 0 2px 5px rgba(255,107,139,0.2); user-select:none;">+</div>
    </div>
    <button class="primary" style="width:100%; border-radius: 15px; padding: 10px; font-size:1.1rem; border:none; background:var(--primary); color:white; font-weight:700; cursor:pointer;">Valider</button>
  `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    setTimeout(() => {
      popup.style.opacity = '1';
      popup.style.transform = 'scale(1)';
    }, 10);

    const updateDisp = () => { document.getElementById('qty-val').textContent = qty; };
    popup.querySelector('#qty-minus').onclick = () => { if (qty > 1) { qty--; updateDisp(); } };
    popup.querySelector('#qty-plus').onclick = () => { qty++; updateDisp(); };
    popup.querySelector('button').onclick = () => {
      onSave(qty);
      popup.classList.remove('visible');
      setTimeout(() => { overlay.remove(); popup.remove(); }, 200);
    };
    overlay.onclick = () => popup.querySelector('button').click();
  }
function showCyclePopup(title, advice, color) {
    const old = document.getElementById('bubbly-popup');
    if (old) old.remove();

    const popup = document.createElement('div');
    popup.id = 'bubbly-popup';
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5);
        background: white; padding: 25px; border-radius: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 10000;
        text-align: center; border: 4px solid ${color};
        opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: 80%; max-width: 300px;
    `;

    popup.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: 800; color: ${color}; margin-bottom: 10px; text-transform: uppercase;">${title}</div>
        <div style="font-size: 1.05rem; font-weight: 600; color: #475569; line-height: 1.4;">${advice}</div>
        <button id="close-popup" style="margin-top: 20px; padding: 10px 25px; border: none; background: #f1f5f9; border-radius: 15px; cursor: pointer; color: #64748b; font-weight: 700; width: 100%;">C'est compris !</button>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    const close = () => {
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -50%) scale(0.5)';
        setTimeout(() => popup.remove(), 300);
    };

    popup.querySelector('#close-popup').onclick = close;
}


function createTabbedGoalsSystem(entry) {
  const container = document.createElement('div');
  container.className = 'card';
  container.style.cssText = 'padding:0; overflow:hidden; margin-bottom:20px; border:1px solid #e2e8f0; background:#fff; border-radius:24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position:relative;';

  // --- 1. EN-TÊTE ---
  const headerTop = document.createElement('div');
  // MODIFICATION ICI : padding bas réduit à 5px (au lieu de 20px) et haut à 20px (au lieu de 25px)
  headerTop.style.cssText = 'display:flex; align-items:center; padding:20px 20px 5px 20px; gap:12px;';

  const title = document.createElement('h3');
  title.textContent = 'Objectifs';
  title.style.cssText = 'margin:0; font-size:14px; font-weight:700; color:#64748b; font-family:inherit;';

  const progressBarBg = document.createElement('div');
  progressBarBg.style.cssText = 'flex:1; height:20px; background:#f1f5f9; border-radius:10px; position:relative; overflow:visible; border:1px solid #e2e8f0;';

  const progressBarFill = document.createElement('div');
  progressBarFill.style.cssText = `
    width:0%; height:100%;
    background:linear-gradient(90deg, #bef264 0%, #166534 100%);
    border-radius:9px;
    transition: width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    position: relative;
    z-index: 1;
  `;

  const counterDisplay = document.createElement('span');
  counterDisplay.style.cssText = 'position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:10px; font-weight:800; color:#475569; z-index:3; pointer-events:none;';

  // --- 2. SYSTÈME D'ÉTOILES ---
  const milestones = [
    { pct: 30, color: 'bronze' },
    { pct: 60, color: 'silver' },
    { pct: 100, color: 'gold' }
  ];

  const starElements = milestones.map(m => {
    const star = document.createElement('div');
    star.innerHTML = '⭐';
    star.style.cssText = `
      position: absolute; left: ${m.pct}%; top: -10px;
      transform: translateX(-50%) scale(0);
      font-size: 18px; opacity: 0;
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 10;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
      cursor: default;
      pointer-events: none;
    `;

    if(m.color === 'bronze') star.style.filter += ' sepia(1) saturate(4) brightness(0.8)';
    if(m.color === 'silver') star.style.filter += ' grayscale(1) brightness(1.2)';

    progressBarBg.appendChild(star);
    return { el: star, pct: m.pct };
  });

  progressBarBg.appendChild(progressBarFill);
  progressBarBg.appendChild(counterDisplay);
  headerTop.appendChild(title);
  headerTop.appendChild(progressBarBg);

  // --- 3. LOGIQUE DE CALCUL ---
  const updateProgress = () => {
    let done = 0, total = 6;
    if (entry && entry.diet) {
      const sections = [entry.diet.goals, entry.diet.activityGoals, entry.diet.weeklyGoals];
      sections.forEach((sec, i) => {
        if (sec) {
          const vals = Object.values(sec);
          if (i > 0) total += vals.length;
          done += vals.filter(v => v === true).length;
        }
      });
    }

    const percent = total > 0 ? (done / total) * 100 : 0;
    progressBarFill.style.width = `${percent}%`;
    counterDisplay.textContent = `${done} / ${total}`;

    starElements.forEach(s => {
      if (percent >= s.pct) {
        s.el.style.opacity = '1';
        s.el.style.transform = 'translateX(-50%) scale(1)';
      } else {
        s.el.style.opacity = '0';
        s.el.style.transform = 'translateX(-50%) scale(0)';
      }
    });
  };

  // --- 4. NAVIGATION ONGLETS ---
  const tabsContainer = document.createElement('div');
  tabsContainer.style.cssText = 'display:flex; width:100%; border-bottom:1px solid #f1f5f9;';

  const tabNames = ['NUTRITION', 'JOUR', 'SEMAINE'];
  const tabIds = ['nutrition', 'day', 'week'];
  const tabButtons = [];

  const contentArea = document.createElement('div');
  // MODIFICATION ICI : Padding réduit à 10px en haut/bas au lieu de 20px partout
  contentArea.style.padding = '10px 20px';
  contentArea.onclick = () => setTimeout(updateProgress, 50);

  tabIds.forEach((id, idx) => {
    const btn = document.createElement('button');
    btn.textContent = tabNames[idx];
    // MODIFICATION ICI : Padding vertical des onglets réduit à 10px (au lieu de 15px)
    btn.style.cssText = `
      flex:1; padding:10px 0; border:none; background:transparent; cursor:pointer;
      font-size:11px; font-weight:800; letter-spacing:0.05em; transition:all 0.2s;
      color: ${idx === 0 ? '#166534' : '#94a3b8'};
      border-bottom: 2px solid ${idx === 0 ? '#166534' : 'transparent'};
    `;

    btn.onclick = () => {
      tabButtons.forEach(b => { b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent'; });
      btn.style.color = '#166534';
      btn.style.borderBottomColor = '#166534';
      renderInnerGoalTab(id, contentArea, entry);
    };
    tabButtons.push(btn);
    tabsContainer.appendChild(btn);
  });

  container.appendChild(headerTop);
  container.appendChild(tabsContainer);
  container.appendChild(contentArea);

  updateProgress();
  renderInnerGoalTab('nutrition', contentArea, entry);

  return container;
}

function renderInnerGoalTab(tabId, container, entry) {
    container.innerHTML = '';
    const dietData = getDietEntryForDate(entry);

    if (tabId === 'nutrition') {
        const tracker = createFoodGoalsTracker();
        container.appendChild(tracker);

        const helpText = document.createElement('p');
        // MODIFICATION ICI : Margin top réduit de 10px à 5px
        helpText.style.cssText = 'font-size:0.8rem; color:#94a3b8; text-align:center; margin-top:5px; margin-bottom:0;';
        container.appendChild(helpText);

    } else if (tabId === 'day') {
        const goals = dietData.activityGoals || {};
        if (Object.keys(goals).length === 0) {
            container.innerHTML = `<p style="font-size:0.85rem; color:#cbd5e1; font-style:italic; padding:10px;">
                Aucun objectif configuré.<br>Ajoutez-en dans <b>Paramètres > Général</b>.
            </p>`;
        } else {
            renderGoals(container, goals, ' Objectifs du jour', 'activityGoals', entry);
        }

    } else if (tabId === 'week') {
        const goals = dietData.activityWeeklyGoals || {};
        if (Object.keys(goals).length === 0) {
            container.innerHTML = `<p style="font-size:0.85rem; color:#cbd5e1; font-style:italic; padding:10px;">
                Aucun objectif configuré.<br>Ajoutez-en dans <b>Paramètres > Général</b>.
            </p>`;
        } else {
            renderGoals(container, goals, ' Objectifs de la semaine', 'activityWeeklyGoals', entry);
        }
    }
}

function renderGoals(container, goalsObj, title, storageKey, entry) {
    const section = document.createElement('div');
    // MODIFICATION ICI : Marge basse réduite de 20px à 10px
    section.style.marginBottom = '10px';

    const head = document.createElement('div');
    head.style.cssText = 'font-weight:800; font-size:0.75rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; padding-left:5px;';
    head.textContent = title;
    section.appendChild(head);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

    const names = Object.keys(goalsObj);

    if (names.length === 0) {
        list.innerHTML = `<div style="font-size:0.85rem; color:#cbd5e1; font-style:italic; padding:10px;">Aucun objectif configuré dans Paramètres.</div>`;
    }

    names.forEach(name => {
        const isDone = goalsObj[name] === true;

        const row = document.createElement('div');
        row.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:12px 16px; border-radius:16px; cursor:pointer; transition:all 0.2s;
            background: ${isDone ? '#f0fdf4' : '#f8fafc'};
            border: 1px solid ${isDone ? '#bbf7d0' : '#f1f5f9'};
        `;

        row.innerHTML = `
            <span style="font-size:0.9rem; font-weight:600; color:${isDone ? '#166534' : '#475569'};">${name}</span>
            <div style="width:24px; height:24px; border-radius:50%;
                 border:2px solid ${isDone ? '#22c55e' : '#cbd5e1'};
                 background:${isDone ? '#22c55e' : 'transparent'};
                 display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                ${isDone ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </div>
        `;

        row.onclick = () => {
            if (!entry.diet) entry.diet = {};
            if (!entry.diet[storageKey]) entry.diet[storageKey] = {};
            entry.diet[storageKey][name] = !entry.diet[storageKey][name];
            saveData();
            container.innerHTML = '';
            renderGoals(container, entry.diet[storageKey], title, storageKey, entry);
        };

        list.appendChild(row);
    });

    section.appendChild(list);
    container.appendChild(section);
}
function sauver() {
    userSettings = {
        cycleStart:   document.getElementById('in-start').value,
        cycleLength:  parseInt(document.getElementById('in-len').value) || 28,
        periodLength: parseInt(document.getElementById('in-period').value) || 5,
        start: document.getElementById('in-start').value,
        len:   parseInt(document.getElementById('in-len').value) || 28,
        // On préserve les modèles d'objectifs s'ils existent déjà
        goalTemplates: userSettings?.goalTemplates || {}
    };
    localStorage.setItem('endoSettings', JSON.stringify(userSettings));
    alert('Paramètres enregistrés !');
}
function cleanupData(months) {
    try {
        const rawData = localStorage.getItem('endoData');
        if (!rawData) return;
        const allData = JSON.parse(rawData);
        const now = new Date();
        if (months === null) {
            if (confirm("⚠️ Tout supprimer définitivement ?")) {
                localStorage.removeItem('endoData');
                location.reload();
            }
            return;
        }
        const limitDate = new Date();
        limitDate.setMonth(now.getMonth() - months);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const dateAffiche = limitDate.toLocaleDateString('fr-FR', options);
        const filteredData = {};
        let countRemoved = 0;
        Object.entries(allData).forEach(([dateStr, details]) => {
            const entryDate = new Date(dateStr);
            if (!isNaN(entryDate.getTime())) {
                if (entryDate >= limitDate) { filteredData[dateStr] = details; }
                else { countRemoved++; }
            } else { filteredData[dateStr] = details; }
        });
        if (countRemoved === 0) {
            alert("Aucune donnée antérieure au " + dateAffiche);
            return;
        }
        if (confirm("Supprimer " + countRemoved + " notes d'avant le " + dateAffiche + " ?")) {
            localStorage.setItem('endoData', JSON.stringify(filteredData));
            location.reload();
        }
    } catch (e) {
        console.error(e);
    }
}
function exportData() {
    try {
        // 1. Récupération des données
        const rawData = localStorage.getItem('endoData');

        // Vérification si les données existent et ne sont pas juste un objet vide
        if (!rawData || rawData === '{}' || rawData === '[]') {
            alert("Aucune donnée à exporter.");
            return;
        }

        // 2. Création du Blob avec un encodage UTF-8 explicite
        const blob = new Blob([rawData], { type: 'application/json;charset=utf-8' });

        // 3. Gestion de la compatibilité IE/Edge ancienne génération (optionnel mais sûr)
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            const dateStr = new Date().toISOString().split('T')[0];
            window.navigator.msSaveOrOpenBlob(blob, `EndoCute_Export_${dateStr}.json`);
            return;
        }

        // 4. Création du lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `EndoCute_Export_${dateStr}.json`;

        // Style pour éviter tout bug d'affichage pendant le clic
        a.style.display = 'none';
        document.body.appendChild(a);

        // 5. Déclenchement du téléchargement
        a.click();

        // 6. Nettoyage avec un délai légèrement plus long pour les navigateurs lents
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
        }, 500);

    } catch (e) {
        console.error("Détails de l'erreur d'export:", e);
        alert("Erreur lors de l'export : " + e.message);
    }
}

// --- AFFICHAGE DES PAGES ---
function afficherPage(nom) {
    const zone = document.getElementById('zone-contenu');

    if (nom === 'Quotidien') {
            if (!userSettings) {
                zone.innerHTML = `
                    <div class="card" style="text-align:center; padding:30px;">
                        <h3 style="color:#e11d48;">Configuration requise</h3>
                        <p>Veuillez configurer votre cycle dans <b>Paramètres > Général</b> pour activer le suivi.</p>
                    </div>`;
            } else {
                try {
                    const info = getCycleInfo(selectedDate, userSettings);
                    const entry = getEntryForDate(selectedDate);

                    // Sécurisation des données de l'entrée
                    if (!entry.moods) entry.moods = [];
                    if (!entry.symptoms) entry.symptoms = [];
                    if (!entry.symptomLevels) {
                        entry.symptomLevels = { fatigue: null, pelvic: null, discomfort: null };
                    }

                    // 1. On prépare seulement deux zones : l'en-tête et le bloc Bien-être
                    zone.innerHTML = `
                        <div id="header-target"></div>
                        <div id="wellness-target" style="margin-top:20px;"></div>
                    `;

                    // 2. Rendu de l'en-tête (Cercle de cycle)
                    const headerEl = createCycleHeader(info, userSettings);
                    if (headerEl) document.getElementById('header-target').appendChild(headerEl);

                    // 3. Rendu du NOUVEAU bloc unifié (Humeur + Échelles + Symptômes)
                    // Cette fonction remplace moodEl et symptomsEl
                    const wellnessEl = createDailyWellnessBlock(entry);
                    if (wellnessEl) document.getElementById('wellness-target').appendChild(wellnessEl);

                } catch (error) {
                    console.error("Erreur de rendu Quotidien:", error);
                    zone.innerHTML = `<div class="card" style="border:2px dashed #f43f5e; padding:20px;"><h4>⚠️ Erreur d'affichage</h4><p>${error.message}</p></div>`;
                }
            }
        }

    else if (nom === 'Repas') {
        zone.innerHTML = '';
        try {
            const entry = getEntryForDate(selectedDate);
            zone.appendChild(createTabbedGoalsSystem(entry));
            ["Petit-déjeuner", "Déjeuner", "Goûter", "Dîner"].forEach(meal => {
                zone.appendChild(createMealAccordion(meal));
            });
        } catch (erreur) {
            zone.innerHTML = `<div class="card" style="border:2px solid red;"><p>${erreur.message}</p></div>`;
        }
    }

    else if (nom === 'Historique') {
        zone.innerHTML = '';
        try {
            saveData();
            // Conteneur Streaks
            const streakWrapper = document.createElement('div');
            streakWrapper.id = 'history-streaks-container';
            zone.appendChild(streakWrapper);

            // Conteneur Graphique
            const graphWrapper = document.createElement('div');
            graphWrapper.id = 'history-graph-container';
            graphWrapper.style.margin = '10px 0';
            zone.appendChild(graphWrapper);

            // Conteneur Notes (Celles qu'on vient de styliser)
            const notesWrapper = document.createElement('div');
            notesWrapper.id = 'history-notes-container';
            zone.appendChild(notesWrapper);

            // Appels des fonctions de rendu
            if (typeof renderHistoryStreaks === 'function') renderHistoryStreaks();
            if (typeof renderHistoryGraph === 'function') renderHistoryGraph();
            renderHistoryNotes(); // Ta nouvelle fonction moderne

        } catch (erreur) {
            console.error("Erreur Historique:", erreur);
            zone.innerHTML = `<div class="card"><h3>Erreur Historique</h3><p>${erreur.message}</p></div>`;
        }
    }

    else if (nom === 'Général') {
        zone.innerHTML = '';
        const cycleCard = document.createElement('div');
        cycleCard.className = 'card';
        cycleCard.innerHTML = `
            <h2 style="margin-top:0;">Paramètres du cycle</h2>
            <label>Début du dernier cycle :</label>
            <input type="date" id="in-start" value="${userSettings?.cycleStart || ''}">
            <label>Durée moyenne (jours) :</label>
            <input type="number" id="in-len" value="${userSettings?.cycleLength || 28}">
            <label>Durée des règles (jours) :</label>
            <input type="number" id="in-period" value="${userSettings?.periodLength || 5}">
            <button class="btn-save" onclick="sauver()">Enregistrer</button>
        `;
        zone.appendChild(cycleCard);

        // --- SECTION GESTION DES OBJECTIFS ---
        const goalsCard = document.createElement('div');
        goalsCard.className = 'card';
        goalsCard.style.marginTop = '15px';
        zone.appendChild(goalsCard);

        const renderGoalsEditor = () => {
            goalsCard.innerHTML = '<h2 style="margin-top:0;">Gérer mes objectifs</h2>';

            // On lit depuis userSettings, pas depuis l'entrée du jour
            if (!userSettings.goalTemplates) userSettings.goalTemplates = {
                activityGoals: {},
                activityWeeklyGoals: {}
            };
            const templates = userSettings.goalTemplates;

            const groups = [
                { key: 'activityGoals',       label: '📅 Objectifs du jour' },
                { key: 'activityWeeklyGoals', label: '🔥 Objectifs de la semaine' }
            ];

            groups.forEach(group => {
                const section = document.createElement('div');
                section.style.marginBottom = '20px';
                section.innerHTML = `<div style="font-weight:800; font-size:0.75rem; color:#94a3b8; margin-bottom:10px;">${group.label}</div>`;

                const currentGoals = templates[group.key] || {};
                Object.keys(currentGoals).forEach(goalName => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:8px; margin-bottom:5px; align-items:center;';
                    row.innerHTML = `<span style="font-size:0.9rem;">${goalName}</span>`;
                    const del = document.createElement('button');
                    del.textContent = '×';
                    del.style.cssText = 'border:none; background:none; color:#cbd5e1; font-size:1.2rem; cursor:pointer;';
                    del.onclick = () => {
                        delete templates[group.key][goalName];
                        localStorage.setItem('endoSettings', JSON.stringify(userSettings));
                        renderGoalsEditor();
                    };
                    row.appendChild(del);
                    section.appendChild(row);
                });

                const addLine = document.createElement('div');
                addLine.style.display = 'flex';
                const input = document.createElement('input');
                input.placeholder = "Ajouter...";
                input.style.margin = "0";
                const addBtn = document.createElement('button');
                addBtn.textContent = "+";
                addBtn.style.cssText = "width:45px; margin-left:5px; background:#9d4edd; color:white; border:none; border-radius:8px;";
                addBtn.onclick = () => {
                    const val = input.value.trim();
                    if (!val) return;
                    if (!templates[group.key]) templates[group.key] = {};
                    templates[group.key][val] = false;
                    localStorage.setItem('endoSettings', JSON.stringify(userSettings));
                    input.value = '';
                    renderGoalsEditor();
                };
                addLine.appendChild(input);
                addLine.appendChild(addBtn);
                section.appendChild(addLine);
                goalsCard.appendChild(section);
            });
        };
        renderGoalsEditor();
    }

   else if (nom === 'Données') {
       zone.innerHTML = '';
       const card = document.createElement('div');
       card.className = 'card';
       card.innerHTML = '<h2 style="margin-top:0;">Gestion des données</h2>';
       zone.appendChild(card);

       // --- RAPPORT MÉDICAL ---
       const reportSection = document.createElement('div');
       reportSection.style.marginBottom = '25px';
       reportSection.innerHTML = `
           <div style="font-weight:800; font-size:0.75rem; color:#94a3b8; text-transform:uppercase; margin-bottom:12px;">Rapport médical</div>
           <p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">
               Génère un résumé lisible de vos données à montrer à votre médecin ou gynécologue.
           </p>
           <button id="btn-generate-report" style="width:100%; padding:14px; background:linear-gradient(135deg, #fdf4ff, #f0fdf4); border:1px solid #e2e8f0; border-radius:12px; color:#1e293b; font-weight:700; cursor:pointer; font-size:0.95rem;">
               📄 Générer le rapport
           </button>
       `;
       card.appendChild(reportSection);

       reportSection.querySelector('#btn-generate-report').onclick = () => generateMedicalReport();

       // --- SUPPRESSION ---
       const deleteSection = document.createElement('div');
       deleteSection.innerHTML = `
           <div style="font-weight:800; font-size:0.75rem; color:#94a3b8; text-transform:uppercase; margin-bottom:12px;">Supprimer des données</div>
       `;
       [
           { label: 'Données de plus de 3 mois', months: 3 },
           { label: 'Données de plus de 6 mois', months: 6 },
           { label: '⚠️ Tout effacer', months: null, danger: true }
       ].forEach(({ label, months, danger }) => {
           const btn = document.createElement('button');
           btn.textContent = label;
           btn.style.cssText = `width:100%; padding:12px; margin-bottom:8px; border-radius:12px; cursor:pointer; font-size:0.85rem; font-weight:600; text-align:left; background:${danger ? '#fff1f2' : '#f8fafc'}; border:1px solid ${danger ? '#fecdd3' : '#e2e8f0'}; color:${danger ? '#e11d48' : '#475569'};`;
           btn.onclick = () => cleanupData(months);
           deleteSection.appendChild(btn);
       });
       card.appendChild(deleteSection);
   }

    else {
        zone.innerHTML = `<div class="card"><h2>${nom}</h2><p>Contenu bientôt disponible.</p></div>`;
    }
}
function generateMedicalReport() {
    const allData = JSON.parse(localStorage.getItem('endoData')) || {};
    const dates = Object.keys(allData).sort().reverse().slice(0, 90); // 3 derniers mois

    if (dates.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }

    // --- CALCUL DES STATISTIQUES ---
    const stats = { fatigue: [], pelvic: [], discomfort: [], moods: {}, symptoms: {} };

    dates.forEach(dateStr => {
        const entry = allData[dateStr];
        if (entry?.symptomLevels) {
            ['fatigue', 'pelvic', 'discomfort'].forEach(k => {
                if (entry.symptomLevels[k] > 0) stats[k].push(entry.symptomLevels[k]);
            });
        }
        (entry?.moods || []).forEach(m => { stats.moods[m] = (stats.moods[m] || 0) + 1; });
        (entry?.symptoms || []).forEach(s => { stats.symptoms[s] = (stats.symptoms[s] || 0) + 1; });
    });

    const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
    const topEntries = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

    // --- DONNÉES CYCLE ---
    const cycleInfo = userSettings ? `
        <tr><td>Début du dernier cycle</td><td>${userSettings.cycleStart || '—'}</td></tr>
        <tr><td>Durée moyenne du cycle</td><td>${userSettings.cycleLength || userSettings.len || 28} jours</td></tr>
        <tr><td>Durée des règles</td><td>${userSettings.periodLength || 5} jours</td></tr>
    ` : '<tr><td colspan="2">Non configuré</td></tr>';

    // --- GRAPHIQUE SVG DES SYMPTÔMES (30 derniers jours) ---
    const last30 = Object.keys(allData).sort().reverse().slice(0, 30).reverse();
    const svgWidth = 600, svgHeight = 120;
    const colW = svgWidth / 30;

    const sympColors = { fatigue: '#60a5fa', pelvic: '#f43f5e', discomfort: '#fb923c' };
    const sympLabels = { fatigue: 'Fatigue', pelvic: 'Douleurs', discomfort: 'Digestif' };

    let svgLines = '';
    Object.entries(sympColors).forEach(([key, color]) => {
        const points = last30.map((dateStr, i) => {
            const val = allData[dateStr]?.symptomLevels?.[key];
            if (!val || val === 0) return null;
            const x = i * colW + colW / 2;
            const y = svgHeight - (val / 5) * svgHeight * 0.85 - 5;
            return { x, y };
        }).filter(Boolean);

        if (points.length >= 2) {
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const mx = (points[i].x + points[i+1].x) / 2;
                d += ` C ${mx} ${points[i].y}, ${mx} ${points[i+1].y}, ${points[i+1].x} ${points[i+1].y}`;
            }
            svgLines += `<path d="${d}" stroke="${color}" fill="none" stroke-width="2" stroke-dasharray="4,3" opacity="0.8"/>`;
        }
        points.forEach(p => {
            svgLines += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" stroke="white" stroke-width="1"/>`;
        });
    });

    // Légende SVG
    let legendSVG = '';
    Object.entries(sympColors).forEach(([key, color], i) => {
        legendSVG += `<circle cx="${15 + i * 130}" cy="10" r="5" fill="${color}"/>
        <text x="${25 + i * 130}" y="14" font-size="11" fill="#475569">${sympLabels[key]}</text>`;
    });

    // --- TABLEAU CHRONOLOGIQUE ---
    let tableRows = '';
    dates.slice(0, 30).forEach(dateStr => {
        const entry = allData[dateStr];
        const [y, m, d] = dateStr.split('-');
        const dateLabel = `${d}/${m}/${y}`;
        const levels = entry?.symptomLevels || {};

        const dot = (val) => val > 0
            ? `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#f1f5f9;text-align:center;line-height:18px;font-size:10px;font-weight:bold;">${val}</span>`
            : '<span style="color:#e2e8f0;">—</span>';

        const moodsStr = (entry?.moods || []).map(m => m.split(' ')[0]).join(' ') || '—';
        const sympStr = (entry?.symptoms || []).slice(0, 3).join(', ') || '—';

        let foodStr = '—';
        if (entry?.diet?.meals) {
            const foods = [];
            Object.values(entry.diet.meals).forEach(meal => {
                (meal.categories?.Repas || []).forEach(f => foods.push(f));
            });
            foodStr = foods.slice(0, 4).join(', ') || '—';
        }

        tableRows += `
            <tr>
                <td style="white-space:nowrap; font-weight:600;">${dateLabel}</td>
                <td style="text-align:center;">${dot(levels.fatigue)}</td>
                <td style="text-align:center;">${dot(levels.pelvic)}</td>
                <td style="text-align:center;">${dot(levels.discomfort)}</td>
                <td>${moodsStr}</td>
                <td style="font-size:10px;">${sympStr}</td>
                <td style="font-size:10px;">${foodStr}</td>
            </tr>`;
    });

    // --- GÉNÉRATION HTML ---
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport EndoCute — ${new Date().toLocaleDateString('fr-FR')}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }
    .page { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; color: #9d4edd; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 30px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 28px 0 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f8fafc; padding: 8px 10px; text-align: left; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    tr:hover td { background: #fafafa; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
    .stat-box { background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; }
    .stat-val { font-size: 24px; font-weight: 900; color: #9d4edd; }
    .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .top-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { background: #f1f5f9; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #475569; }
    svg { display: block; width: 100%; border: 1px solid #f1f5f9; border-radius: 8px; padding: 8px; }
    @media print {
        body { background: white; padding: 0; }
        .page { box-shadow: none; border-radius: 0; }
    }
</style>
</head>
<body>
<div class="page">

    <h1>🌸 Rapport EndoCute</h1>
    <div class="subtitle">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — ${dates.length} jours enregistrés</div>

    <h2>Informations du cycle</h2>
    <table><tbody>${cycleInfo}</tbody></table>

    <h2>Statistiques sur la période</h2>
    <div class="stat-grid">
        <div class="stat-box"><div class="stat-val">${avg(stats.fatigue)}</div><div class="stat-lbl">Fatigue moy.</div></div>
        <div class="stat-box"><div class="stat-val">${avg(stats.pelvic)}</div><div class="stat-lbl">Douleurs pelv. moy.</div></div>
        <div class="stat-box"><div class="stat-val">${avg(stats.discomfort)}</div><div class="stat-lbl">Inconfort dig. moy.</div></div>
    </div>

    <h2>Humeurs les plus fréquentes</h2>
    <div class="top-list">
        ${topEntries(stats.moods, 5).map(([m, n]) => `<span class="tag">${m} <strong>(${n}x)</strong></span>`).join('') || '<span class="tag">Aucune donnée</span>'}
    </div>

    <h2>Symptômes les plus fréquents</h2>
    <div class="top-list">
        ${topEntries(stats.symptoms, 8).map(([s, n]) => `<span class="tag">${s} <strong>(${n}x)</strong></span>`).join('') || '<span class="tag">Aucune donnée</span>'}
    </div>

    <h2>Évolution des symptômes — 30 derniers jours</h2>
    <svg viewBox="0 0 ${svgWidth} ${svgHeight + 30}" xmlns="http://www.w3.org/2000/svg">
        ${[1,2,3,4,5].map(lvl => {
            const y = svgHeight - (lvl/5) * svgHeight * 0.85 - 5;
            return `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>
                    <text x="2" y="${y - 2}" font-size="9" fill="#cbd5e1">${lvl}</text>`;
        }).join('')}
        ${svgLines}
        <g transform="translate(0, ${svgHeight + 10})">${legendSVG}</g>
    </svg>

    <h2>Journal des 30 derniers jours</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Fatigue</th>
                <th>Douleurs</th>
                <th>Digestif</th>
                <th>Humeur</th>
                <th>Symptômes</th>
                <th>Repas notables</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>

    <div style="margin-top:40px; padding-top:20px; border-top:1px solid #f1f5f9; font-size:11px; color:#94a3b8; text-align:center;">
        Rapport généré par EndoCute • Les données sont personnelles et issues de votre suivi quotidien
    </div>
</div>
</body>
</html>`;

    // Ouvrir dans un nouvel onglet
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    // Fallback si popup bloqué (fréquent sur mobile)
    if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
    }
}

document.getElementById('btn-notes').onclick = () => changerUnivers('notes');
document.getElementById('btn-recipes').onclick = () => changerUnivers('recipes');
document.getElementById('btn-settings').onclick = () => changerUnivers('settings');

window.onload = () => changerUnivers('notes');