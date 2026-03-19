document.addEventListener('DOMContentLoaded', () => {
  // Tab element declarations
  const tabDailyNotes = document.getElementById('tab-daily-notes');
  const tabDiet = document.getElementById('tab-diet');
  const tabSettings = document.getElementById('tab-settings');
  const tabHistory = document.getElementById('tab-history');
  
  // --- NAVIGATION ---
  function switchToTab(targetId) {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.target === targetId);
    });
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === targetId);
    });
    // Re-render when switching to ensure fresh data
    if (targetId === 'tab-diet') renderDietTracking();
    if (targetId === 'tab-daily-notes') renderDailyNotes();
    if (targetId === 'tab-history') renderHistory();
  }

  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (btn) switchToTab(btn.dataset.target);
    });
  });

  // --- GESTION DES CLICS GLOBAUX ---
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('input-field')) {
      document.querySelectorAll('.autocomplete-list').forEach(list => list.innerHTML = '');
    }
  });

  // Data Setup
  const moodOptions = ["Heureuse", "Confiante", "Stressée", "Anxieuse", "Déprimée", "Irritable", "Déconcentrée"];
  const predefinedSymptoms = ["Crampes utérines", "Douleurs lombaires", "Jambes lourdes", "Nausées", "Constipation", "Diarrhée"];

  let userSettings = JSON.parse(localStorage.getItem('endocute_userSettings')) || null;
  let appData = JSON.parse(localStorage.getItem('endocuteData')) || { history: [] };
  let customSymptoms = JSON.parse(localStorage.getItem('endocuteCustomSymptoms')) || [];
  
  // Date de travail globale (par défaut aujourd'hui)
  let selectedDate = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local
  let graphTimeframe = 'day'; // 'day' ou 'month'

  function saveData() {
    localStorage.setItem('endocute_userSettings', JSON.stringify(userSettings));
    localStorage.setItem('endocuteData', JSON.stringify(appData));
    localStorage.setItem('endocuteCustomSymptoms', JSON.stringify(customSymptoms));
  }

  function getEntryForDate(dateStr) {
    let entry = appData.history.find(e => e.date === dateStr);
    
    if (!entry) {
      entry = { 
        date: dateStr, 
        mood: null, 
        symptomLevels: { fatigue: null, pelvic: null, digestive: null, discomfort: null }, 
        symptoms: [] 
      };
      appData.history.push(entry);
      saveData();
    } else if (!entry.symptomLevels) {
      entry.symptomLevels = { fatigue: null, pelvic: null, digestive: null, discomfort: null };
      saveData();
    }
    return entry;
  }

  // --- DIET DATABASE ---
  console.log('--- ENDOCUTE APP V2 LOADED ---');
const foodDatabase = [
    { name: "Ananas", type: "anti-inflammatoire" },
    { name: "Avocat", type: "anti-inflammatoire" },
    { name: "Amande", type: "anti-inflammatoire" },
    { name: "Abricot", type: "neutre" },
    { name: "Banane", type: "neutre" },
    { name: "Brocoli", type: "anti-inflammatoire" },
    { name: "Boeuf", type: "pro-inflammatoire" },
    { name: "Carotte", type: "anti-inflammatoire" },
    { name: "Citron", type: "anti-inflammatoire" },
    { name: "Courgette", type: "neutre" },
    { name: "Chou", type: "anti-inflammatoire" },
    { name: "Canard", type: "pro-inflammatoire" },
    { name: "Dinde", type: "neutre" },
    { name: "Epinard", type: "anti-inflammatoire" },
    { name: "Fraise", type: "anti-inflammatoire" },
    { name: "Haricot vert", type: "neutre" },
    { name: "Kiwi", type: "anti-inflammatoire" },
    { name: "Lentilles", type: "neutre" },
    { name: "Mangue", type: "neutre" },
    { name: "Maïs", type: "pro-inflammatoire" },
    { name: "Orange", type: "anti-inflammatoire" },
    { name: "Oignon", type: "anti-inflammatoire" },
    { name: "Oeuf", type: "neutre" },
    { name: "Pomme", type: "anti-inflammatoire" },
    { name: "Poulet", type: "neutre" },
    { name: "Porc", type: "pro-inflammatoire" },
    { name: "Poisson (Saumon)", type: "anti-inflammatoire" },
    { name: "Pâtes", type: "pro-inflammatoire" },
    { name: "Pomme de terre", type: "neutre" },
    { name: "Quinoa", type: "anti-inflammatoire" },
    { name: "Riz blanc", type: "neutre" },
    { name: "Riz complet", type: "anti-inflammatoire" },
    { name: "Tomate", type: "neutre" },
    { name: "Tofu", type: "anti-inflammatoire" },
    { name: "Yogourt", type: "pro-inflammatoire" },
    // BOISSONS
    { name: "Eau", type: "anti-inflammatoire" },
    { name: "Tisane gingembre", type: "anti-inflammatoire" },
    { name: "Tisane menthe", type: "anti-inflammatoire" },
    { name: "Tisane", type: "anti-inflammatoire" },
    { name: "Lupin", type: "anti-inflammatoire" },
    { name: "Thé vert", type: "anti-inflammatoire" },
    { name: "Thé noir", type: "neutre" },
    { name: "Jus de fruit frais", type: "neutre" },
    { name: "Café", type: "pro-inflammatoire" },
    { name: "Alcool", type: "pro-inflammatoire" },
    { name: "Vin", type: "pro-inflammatoire" },
    { name: "Bière", type: "pro-inflammatoire" },
    { name: "Soda", type: "pro-inflammatoire" },
    { name: "Jus de fruit (industriel)", type: "pro-inflammatoire" },
    // AJOUTS RÉCENTS
    { name: "Pâtes (complètes)", type: "neutre" },
    { name: "Chou-fleur", type: "pro-inflammatoire" },
    { name: "Brocoli", type: "pro-inflammatoire" },
    { name: "Champignons", type: "pro-inflammatoire" },
    { name: "Pois chiches", type: "pro-inflammatoire" },
    { name: "Gingembre", type: "anti-inflammatoire" },
    { name: "Curcuma", type: "anti-inflammatoire" }
  ];

// --- DIET UTILS (Migration ultra-robuste) ---
function getDietEntryForDate(entry) {
  const defaultGoals = { "Boire 1.5 litre": false, "Une poignée d'amandes": false, "2 c. à s. de graines de chia": false, "2 c. à s. d'huile de noix": false };
  const weeklyGoals = { "300 gr. de poisson gras": false, "Pas de café": false, "Pas d'alcool": false };
  const activityGoals = { "5 min. cohérence cardiaque": false, "Exercices kiné": false, "30 min. de marche / piscine": false };
  const activityWeeklyGoals = { "Une séance de sport (longue)": false };
  
  const defaultMealsData = {
    "Petit-déjeuner": { categories: { "Boisson": [], "Céréale": [], "Fruit": [], "Laitage": [] }, digestionScale: null },
    "Déjeuner": { categories: { "Légumes": [], "Féculents": [], "Protéines": [] }, digestionScale: null },
    "Goûter": { categories: { "Boisson": [], "Céréale": [], "Fruit": [], "Laitage": [] }, digestionScale: null },
    "Dîner": { categories: { "Légumes": [], "Féculents": [], "Protéines": [] }, digestionScale: null }
  };

  if (!entry.diet) {
    entry.diet = { goals: defaultGoals, weeklyGoals: weeklyGoals, meals: defaultMealsData };
  } else {
    // S'assurer que .meals existe
    if (!entry.diet.meals) entry.diet.meals = {};
    
    // Forcer l'existence de chaque repas
    Object.keys(defaultMealsData).forEach(m => {
       if (!entry.diet.meals[m]) {
          const noDash = m.replace('-', ' ');
          if (entry.diet.meals[noDash]) {
             entry.diet.meals[m] = entry.diet.meals[noDash];
             delete entry.diet.meals[noDash];
          } else {
             entry.diet.meals[m] = JSON.parse(JSON.stringify(defaultMealsData[m]));
          }
       }
       // S'assurer que .categories existe pour ce repas
       if (!entry.diet.meals[m].categories) {
          entry.diet.meals[m].categories = JSON.parse(JSON.stringify(defaultMealsData[m].categories));
       }
       if (entry.diet.meals[m].digestionScale === undefined) {
          entry.diet.meals[m].digestionScale = null;
       }
    });

    if (!entry.diet.weeklyGoals) entry.diet.weeklyGoals = weeklyGoals;
    if (!entry.diet.goals) entry.diet.goals = defaultGoals;
    if (!entry.diet.activityGoals) entry.diet.activityGoals = activityGoals;
    if (!entry.diet.activityWeeklyGoals) entry.diet.activityWeeklyGoals = activityWeeklyGoals;
  }
  return entry.diet;
}

function getFoodTypeColor(foodName) {
  const food = foodDatabase.find(f => f.name === foodName);
  if (!food) return { bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' };
  if (food.type === 'anti-inflammatoire') return { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' };
  if (food.type === 'pro-inflammatoire') return { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' };
  return { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' };
}

function createAutocompleteInput(mealName, categoryName) {
  const dietData = getDietEntryForDate(getEntryForDate(selectedDate));
  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'input-field'; input.placeholder = '...';
  const list = document.createElement('div'); list.className = 'autocomplete-list';
  const tagsContainer = document.createElement('div'); tagsContainer.className = 'food-tags';

  const renderTags = () => {
    tagsContainer.innerHTML = '';
    const items = dietData.meals[mealName].categories[categoryName] || [];
    items.forEach((itemName, idx) => {
      const col = getFoodTypeColor(itemName);
      const tag = document.createElement('span');
      tag.className = 'food-tag';
      tag.style.cssText = `background:${col.bg}; border-color:${col.border}; color:${col.color}`;
      tag.innerHTML = `${itemName} <span style="margin-left:8px; cursor:pointer;" data-index="${idx}">&times;</span>`;
      tag.querySelector('span').addEventListener('click', (ev) => { ev.stopPropagation(); items.splice(idx, 1); saveData(); renderTags(); });
      tagsContainer.appendChild(tag);
    });
  };

  input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    list.innerHTML = '';
    if (!val) return;
    foodDatabase.filter(f => f.name.toLowerCase().includes(val)).forEach(match => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:8px; background:${getFoodTypeColor(match.name).border};"></span>${match.name}`;
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const arr = dietData.meals[mealName].categories[categoryName];
        if (!arr.includes(match.name)) { arr.push(match.name); saveData(); }
        input.value = ''; list.innerHTML = ''; renderTags();
      });
      list.appendChild(item);
    });
  });

  wrapper.appendChild(tagsContainer); wrapper.appendChild(input); wrapper.appendChild(list);
  renderTags();
  return wrapper;
}

function createMealAccordion(mealName) {
  const dietData = getDietEntryForDate(getEntryForDate(selectedDate));
  const details = document.createElement('details');
  details.className = 'meal-accordion card';
  details.style.borderRadius = '24px';
  // Par défaut, on peut essayer de les laisser OUVERTS pour aider l'utilisateur à voir le contenu
  // details.open = true; 

  const summary = document.createElement('summary');
  summary.className = 'meal-summary';
  summary.innerHTML = `<span style="font-weight:700; font-size:1.1rem; color:var(--text-main);">${mealName}</span> <span class="accordion-icon">🔻</span>`;
  details.appendChild(summary);

  const content = document.createElement('div');
  content.className = 'meal-content';
  
  if (dietData.meals[mealName] && dietData.meals[mealName].categories) {
    Object.keys(dietData.meals[mealName].categories).forEach(cat => {
      const row = document.createElement('div');
      row.className = 'food-category-row';
      row.innerHTML = `<div class="category-label">${cat}</div>`;
      row.appendChild(createAutocompleteInput(mealName, cat));
      content.appendChild(row);
    });
  }

  const scaleLabel = document.createElement('h4');
  scaleLabel.style.margin = '20px 0 10px 0';
  scaleLabel.style.fontSize = '0.9rem';
  scaleLabel.style.fontWeight = '700';
  scaleLabel.textContent = 'Inconfort digestif';
  content.appendChild(scaleLabel);

  const scaleGrid = document.createElement('div');
  scaleGrid.className = 'options-grid';
  scaleGrid.style.justifyContent = 'space-between';
  scaleGrid.style.marginTop = '10px';
  
  const grads = ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c']; // Orange/Peach shades
  [1, 2, 3, 4, 5].forEach((v, idx) => {
    const isSel = dietData.meals[mealName].digestionScale === v;
    const btn = document.createElement('button');
    btn.style.cssText = `width:42px; height:42px; border-radius:50%; border:${isSel ? '2px solid #fb923c' : 'none'}; background:${grads[idx]}; opacity:${isSel?1:0.6}; transform:${isSel?'scale(1.1)':'scale(1)'}; cursor:pointer; font-weight:800; font-family:'Outfit';`;
    btn.textContent = v;
    btn.addEventListener('click', () => {
      dietData.meals[mealName].digestionScale = dietData.meals[mealName].digestionScale === v ? null : v;
      const entry = getEntryForDate(selectedDate);
      const scales = Object.values(entry.diet.meals).map(m => m.digestionScale).filter(s => s !== null);
      if (scales.length > 0) {
        entry.symptomLevels.discomfort = Math.max(...scales);
      }
      saveData(); renderDietTracking();
    });
    scaleGrid.appendChild(btn);
  });
  
  content.appendChild(scaleLabel);
  content.appendChild(scaleGrid);
  
  details.appendChild(content);
  return details;
}

function renderGoals(container, dataMap, label, startCollapsed = false) {
  const banner = document.createElement('div');
  banner.className = 'goals-banner';
  const title = document.createElement('h3');
  title.style.margin = '0'; title.style.color = 'var(--primary)'; title.style.fontSize = '1rem';
  banner.appendChild(title);

  const goalsList = document.createElement('div');
  goalsList.style.marginTop = '15px';
  
  const updateStatus = () => {
    const allDone = Object.values(dataMap).every(v => v === true);
    banner.classList.toggle('completed', allDone);
    title.innerHTML = `✨ ${label}${allDone ? ' (atteints)' : ''}`;
    
    const isExpanded = banner.dataset.expanded === "true";
    const isCollapsed = banner.dataset.expanded === "false";
    
    if (isExpanded) goalsList.style.display = 'block';
    else if (isCollapsed) goalsList.style.display = 'none';
    else if (allDone) goalsList.style.display = 'none';
    else goalsList.style.display = startCollapsed ? 'none' : 'block';
  };

  banner.style.cursor = 'pointer';
  banner.addEventListener('click', (e) => {
    if (e.target.closest('.goal-item')) return;
    const isHidden = goalsList.style.display === 'none';
    goalsList.style.display = isHidden ? 'block' : 'none';
    banner.dataset.expanded = isHidden ? "true" : "false";
  });

  Object.keys(dataMap).forEach(name => {
    const item = document.createElement('div');
    item.className = `goal-item ${dataMap[name] ? 'checked' : ''}`;
    item.innerHTML = `<div class="goal-checkbox">${dataMap[name] ? '✅' : ''}</div><span>${name}</span>`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      dataMap[name] = !dataMap[name];
      item.classList.toggle('checked');
      item.querySelector('.goal-checkbox').innerHTML = dataMap[name] ? '✅' : '';
      saveData(); updateStatus();
    });
    goalsList.appendChild(item);
  });

  banner.appendChild(goalsList); 
  container.appendChild(banner);
  updateStatus();
}

function renderDietTracking() {
    if (!tabDiet) return;
    try {
        const dietData = getDietEntryForDate(getEntryForDate(selectedDate));
        tabDiet.innerHTML = '<h2 class="section-title">Alimentation</h2>';
        
        renderGoals(tabDiet, dietData.goals, "Objectifs du jour", false);
        renderGoals(tabDiet, dietData.weeklyGoals, "Objectifs de la semaine", true);
        
        const meals = ["Petit-déjeuner", "Déjeuner", "Goûter", "Dîner"];
        meals.forEach(m => {
            tabDiet.appendChild(createMealAccordion(m));
        });

        // --- ACTIVITÉ PHYSIQUE ---
        const activityTitle = document.createElement('h2');
        activityTitle.className = 'section-title';
        activityTitle.style.marginTop = '40px';
        activityTitle.textContent = 'Activité physique';
        tabDiet.appendChild(activityTitle);

        renderGoals(tabDiet, dietData.activityGoals, "Objectifs du jour", false);
        renderGoals(tabDiet, dietData.activityWeeklyGoals, "Objectifs de la semaine", true);
        
    } catch (e) {
        tabDiet.innerHTML = `<div class="card" style="color:red; padding:20px;">Erreur de chargement: ${e.message}</div>`;
    }
}

function renderSettings() {
    tabSettings.innerHTML = `
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 20px; color: var(--primary);">Paramètres ✨</h2>
        <div style="text-align: left; margin-bottom: 15px;">
          <label style="font-weight: 600; font-size: 0.9rem;">Début du cycle</label>
          <input type="date" id="setup-date" value="${userSettings ? userSettings.cycleStart : new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 12px; border-radius: 15px; border: 1px solid #e2e8f0; font-family: 'Outfit';">
        </div>
        <div style="text-align: left; margin-bottom: 15px;">
          <label style="font-weight: 600; font-size: 0.9rem;">Durée du cycle (jours)</label>
          <input type="number" id="setup-cycle" value="${userSettings ? userSettings.cycleLength : 28}" min="20" max="45" style="width: 100%; padding: 12px; border-radius: 15px; border: 1px solid #e2e8f0; font-family: 'Outfit';">
        </div>
        <div style="text-align: left; margin-bottom: 15px;">
          <label style="font-weight: 600; font-size: 0.9rem;">Durée des règles (jours)</label>
          <input type="number" id="setup-period" value="${userSettings ? userSettings.periodLength : 5}" min="2" max="10" style="width: 100%; padding: 12px; border-radius: 15px; border: 1px solid #e2e8f0; font-family: 'Outfit';">
        </div>
        <button id="btn-save-setup" class="primary" style="width: 100%;">Enregistrer</button>
      </div>
    `;
    document.getElementById('btn-save-setup')?.addEventListener('click', () => {
      userSettings = { 
        cycleStart: document.getElementById('setup-date').value, 
        cycleLength: parseInt(document.getElementById('setup-cycle').value), 
        periodLength: parseInt(document.getElementById('setup-period').value) 
      };
      saveData(); switchToTab('tab-daily-notes'); renderDailyNotes();
    });
}

function renderDailyNotes() {
    if (!tabDailyNotes) return;
    tabDailyNotes.innerHTML = '';
    
    if (!userSettings) {
      tabDailyNotes.innerHTML = `<div class="card" style="text-align:center; padding: 40px 20px;"><h3>Configuration requise</h3><p>Veuillez configurer votre cycle dans l'onglet Paramètres.</p></div>`;
      return;
    }

    const todayEntry = getEntryForDate(selectedDate);
    if (!todayEntry.moods) todayEntry.moods = todayEntry.mood ? [todayEntry.mood] : [];

    // CALCUL CYCLE
    const selDateObj = new Date(selectedDate + "T00:00:00");
    const start = new Date(userSettings.cycleStart + "T00:00:00");
    const diffDays = Math.floor((selDateObj - start) / (1000 * 60 * 60 * 24));
    const currentDayOfCycle = (diffDays % userSettings.cycleLength) + 1; 

    // CALCUL PHASE
    let phase = ""; let phaseColor = "";
    const ovulationDay = userSettings.cycleLength - 14; 
    if (currentDayOfCycle <= userSettings.periodLength) { phase = "🩸 Menstruations"; phaseColor = "#f43f5e"; }
    else if (currentDayOfCycle < ovulationDay - 2) { phase = "🌱 Phase Folliculaire"; phaseColor = "#4ade80"; }
    else if (currentDayOfCycle >= ovulationDay - 2 && currentDayOfCycle <= ovulationDay + 2) { phase = "🥚 Phase Ovulatoire"; phaseColor = "#facc15"; }
    else { phase = "🍂 Phase Lutéale"; phaseColor = "#fb923c"; }

    // --- TOP ROW LAYOUT ---
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:30px; gap:10px;';

    // 1. CYCLE TRACKER (Left, Larger)
    const cycleContainer = document.createElement('div');
    cycleContainer.style.cssText = 'flex:1; cursor:pointer; position:relative; max-width:200px;';
    
    let dotsHTML = '';
    const cx = 100; const cy = 100; const r = 85;
    for(let i=1; i<=userSettings.cycleLength; i++) {
      const angle = (i-1)*(360/userSettings.cycleLength) - 90;
      const rad = angle * Math.PI / 180;
      const dotX = cx + r * Math.cos(rad); const dotY = cy + r * Math.sin(rad);
      let dotColor = i <= userSettings.periodLength ? "#f43f5e" : (i < ovulationDay - 2 ? "#4ade80" : (i >= ovulationDay - 2 && i <= ovulationDay + 2 ? "#facc15" : "#fb923c"));
      const isCurrent = (i === currentDayOfCycle);
      dotsHTML += `<circle cx="${dotX}" cy="${dotY}" r="${isCurrent ? 8 : 4}" fill="${dotColor}" stroke="${isCurrent ? '#fff' : 'transparent'}" stroke-width="2" opacity="${isCurrent ? 1 : 0.4}" />`;
    }

    cycleContainer.innerHTML = `
      <svg width="100%" height="auto" viewBox="0 0 200 200" style="overflow:visible;">
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="1" />
        ${dotsHTML}
      </svg>
      <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">
        <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600;">Jour</span>
        <span style="font-size:3rem; font-weight:800; color:#1f2937;">${currentDayOfCycle}</span>
      </div>
    `;

    // 2. MASCOT & BUTTONS (Right)
    const rightCol = document.createElement('div');
    rightCol.className = 'mascot-wrapper';
    rightCol.style.flex = '0 0 160px';

    const speechBubble = document.createElement('div');
    speechBubble.className = 'cat-speech-bubble';
    speechBubble.textContent = phase;
    rightCol.appendChild(speechBubble);

    const catImg = document.createElement('img');
    catImg.className = 'mascot-image';
    catImg.src = 'chibi_cat.png';
    catImg.style.width = '140px';
    catImg.style.transform = 'scaleX(-1)';
    catImg.onerror = () => { catImg.src = 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23fca311"/></svg>'; };
    rightCol.appendChild(catImg);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:12px; margin-top:15px;';
    
    const calendarBtn = document.createElement('button');
    calendarBtn.className = 'btn-action btn-calendar';
    calendarBtn.innerHTML = `📅`;
    calendarBtn.title = "Calendrier";
    
    const calInput = document.createElement('input');
    calInput.type = 'date'; calInput.style.display = 'none'; calInput.value = selectedDate;
    calInput.addEventListener('change', (e) => { selectedDate = e.target.value; renderDailyNotes(); });
    calendarBtn.appendChild(calInput);
    calendarBtn.addEventListener('click', () => { calInput.showPicker ? calInput.showPicker() : calInput.click(); });

    const newCycleBtn = document.createElement('button');
    newCycleBtn.className = 'btn-action btn-new-cycle';
    newCycleBtn.style.position = 'relative';
    newCycleBtn.style.padding = '10px 14px';
    newCycleBtn.innerHTML = `<span style="font-size:1.6rem; line-height:1; display:flex; align-items:center; justify-content:center; width:24px; height:24px;">+</span> <span style="font-size:0.75rem;">Cycle</span>`;
    newCycleBtn.addEventListener('click', () => {
      if(confirm("Démarrer un nouveau cycle aujourd'hui ?")) { 
        userSettings.cycleStart = new Date().toISOString().split('T')[0]; 
        saveData(); renderDailyNotes(); 
      }
    });

    btnRow.appendChild(calendarBtn);
    btnRow.appendChild(newCycleBtn);
    rightCol.appendChild(btnRow);

    topRow.appendChild(cycleContainer);
    topRow.appendChild(rightCol);
    tabDailyNotes.appendChild(topRow);

    // INTERACTION
    cycleContainer.addEventListener('click', () => {
      speechBubble.classList.toggle('visible');
      if(speechBubble.classList.contains('visible')) {
        setTimeout(() => speechBubble.classList.remove('visible'), 4000);
      }
    });

    // --- MOOD (Multi-Select & Collapsible) ---
    const moodDetails = document.createElement('details');
    moodDetails.className = 'mood-details card';
    
    const previewHTML = todayEntry.moods.length > 0 
      ? todayEntry.moods.map(m => `<span class="mood-pill">${m}</span>`).join('') 
      : '<span style="font-size:0.8rem; color:var(--text-muted);">Aucune émotion sélectionnée</span>';

    moodDetails.innerHTML = `
      <summary class="mood-summary">
        <div>
          <h4>Humeur du jour</h4>
          <div class="mood-selection-preview">${previewHTML}</div>
        </div>
      </summary>
      <div class="options-grid" style="margin-top:20px; padding-top:15px; border-top:1px dashed #e2e8f0;">
        ${moodOptions.map(m => {
          const isSel = todayEntry.moods.includes(m);
          return `<button class="option-btn ${isSel ? 'selected' : ''}" data-mood="${m}">${m}</button>`;
        }).join('')}
      </div>
    `;
    
    moodDetails.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.mood;
        if(todayEntry.moods.includes(m)) {
          todayEntry.moods = todayEntry.moods.filter(x => x !== m);
        } else {
          todayEntry.moods.push(m);
        }
        todayEntry.mood = todayEntry.moods[0] || null; // Retro-compat
        saveData(); renderDailyNotes();
      });
    });
    tabDailyNotes.appendChild(moodDetails);

    // PAIN SCALES
    const painCard = document.createElement('div'); painCard.className = 'card';
    let painHTML = ``;
    const painsConfig = [
      { key: 'fatigue', label: 'Fatigue' }, 
      { key: 'pelvic', label: 'Douleur pelvienne' }, 
      { key: 'discomfort', label: 'Inconfort digestif' }
    ];
    const grads = ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899'];
    painsConfig.forEach(p => {
      painHTML += `<div style="margin-bottom:25px;"><div style="margin-bottom:12px; font-weight:500; font-size:0.95rem;">${p.label}</div><div class="options-grid pain-scale" style="justify-content:space-between;">`;
      [1,2,3,4,5].forEach((v, idx) => {
        const isSel = todayEntry.symptomLevels[p.key] === v;
        painHTML += `<button class="pain-btn" data-type="${p.key}" data-val="${v}" style="width:45px; height:45px; border-radius:50%; border:${isSel ? '2px solid #ffb3c6' : 'none'}; background:${grads[idx]}; opacity:${isSel?1:0.6}; transform:${isSel?'scale(1.1)':'scale(1)'}; cursor:pointer; font-weight:800;">${v}</button>`;
      });
      painHTML += `</div></div>`;
    });
    painCard.innerHTML = painHTML;
    tabDailyNotes.appendChild(painCard);
    painCard.querySelectorAll('.pain-btn').forEach(b => b.addEventListener('click', (e) => { 
      const t = e.target.dataset.type; const v = parseInt(e.target.dataset.val);
      todayEntry.symptomLevels[t] = todayEntry.symptomLevels[t] === v ? null : v; saveData(); renderDailyNotes(); 
    }));

    // SPECIFIC SYMPTOMS
    const sympCard = document.createElement('div'); sympCard.className = 'card';
    const allS = [...new Set([...predefinedSymptoms, ...customSymptoms])];
    sympCard.innerHTML = `<div class="card-title">Symptômes spécifiques</div><div class="options-grid">${allS.map(s => `<button class="option-btn ${todayEntry.symptoms.includes(s) ? 'selected' : ''}" data-symptom="${s}">${s}</button>`).join('')}</div>
      <div class="custom-input-group" style="margin-top:20px;"><input type="text" id="custom-symptom-input" placeholder="Ajouter..."><button class="add-btn" id="btn-add-symptom">+</button></div>`;
    tabDailyNotes.appendChild(sympCard);
    sympCard.querySelectorAll('.option-btn').forEach(b => b.addEventListener('click', () => {
      const s = b.dataset.symptom; if(todayEntry.symptoms.includes(s)) todayEntry.symptoms = todayEntry.symptoms.filter(x => x !== s); else todayEntry.symptoms.push(s); saveData(); renderDailyNotes();
    }));
    document.getElementById('btn-add-symptom')?.addEventListener('click', () => {
      const v = document.getElementById('custom-symptom-input').value.trim();
      if(v && !allS.includes(v)) { customSymptoms.push(v); todayEntry.symptoms.push(v); saveData(); renderDailyNotes(); }
    });
  }

  function calculateDailyStreak() {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toLocaleDateString('sv-SE');
      const entry = appData.history.find(e => e.date === dateStr);
      if (entry && entry.diet) {
        const diet = entry.diet;
        const nutrMet = diet.goals && Object.values(diet.goals).every(v => v === true);
        const activityMet = diet.activityGoals ? Object.values(diet.activityGoals).every(v => v === true) : true;
        
        if (nutrMet && activityMet) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  }

  function calculateWeeklyStreak() {
    let streak = 0;
    let now = new Date();
    let checkSunday = new Date(now);
    checkSunday.setDate(now.getDate() + (7 - (now.getDay() || 7))); 
    checkSunday.setDate(checkSunday.getDate() - 7); 
    
    while (true) {
      const dateStr = checkSunday.toLocaleDateString('sv-SE');
      const entry = appData.history.find(e => e.date === dateStr);
      if (entry && entry.diet) {
        const diet = entry.diet;
        const nutrMet = diet.weeklyGoals && Object.values(diet.weeklyGoals).every(v => v === true);
        const activityMet = diet.activityWeeklyGoals ? Object.values(diet.activityWeeklyGoals).every(v => v === true) : true;
        
        if (nutrMet && activityMet) {
          streak++;
          checkSunday.setDate(checkSunday.getDate() - 7);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  }

  function getHabitScore(entry) {
    if (!entry || !entry.diet) return 0;
    let score = 0;
    if (entry.diet.goals) {
      const gVals = Object.values(entry.diet.goals);
      if (gVals.length > 0) {
        if (gVals.every(v => v === true)) score += 2;
        else if (gVals.some(v => v === true)) score += 1;
      }
    }
    if (entry.diet.activityGoals) {
      const aVals = Object.values(entry.diet.activityGoals);
      if (aVals.length > 0) {
        if (aVals.every(v => v === true)) score += 2;
        else if (aVals.some(v => v === true)) score += 1;
      }
    }
    if (entry.mood === 'Heureuse' || entry.mood === 'Confiante') score += 1;
    let hasNegDrinks = false;
    let hasOtherInfl = false;
    const badDrinks = ['Café', 'Alcool', 'Soda', 'Vin', 'Bière', 'Jus de fruit (industriel)'];
    if (entry.diet.meals) {
      Object.values(entry.diet.meals).forEach(meal => {
        if (meal.categories) {
          Object.values(meal.categories).forEach(items => {
            items.forEach(foodName => {
              if (badDrinks.includes(foodName)) hasNegDrinks = true;
              else {
                const fInfo = foodDatabase.find(f => f.name === foodName);
                if (fInfo && fInfo.type === 'pro-inflammatoire') hasOtherInfl = true;
              }
            });
          });
        }
      });
    }
    if (hasNegDrinks) score -= 1;
    if (hasOtherInfl) score -= 1;
    return Math.max(0, Math.min(5, score));
  }

  function renderHistory() {
    if (!tabHistory) return;
    tabHistory.innerHTML = '<h2 class="section-title">Historique</h2>';
    
    // --- STREAK CIRCLES (Aligned Right) ---
    const dailyStreak = calculateDailyStreak();
    const weeklyStreak = calculateWeeklyStreak();
    
    const streakContainer = document.createElement('div');
    streakContainer.className = 'streak-container';
    streakContainer.style.cssText = 'display:flex; justify-content:flex-end; gap:20px; margin-bottom:30px; padding-right:10px;';
    
    const createStreakCircle = (label, count) => {
      const circle = document.createElement('div');
      const isActive = count > 0;
      circle.style.cssText = `
        width: 70px; height: 70px; border-radius: 50%; 
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: ${isActive ? 'linear-gradient(135deg, #ff6b8b, #9d4edd)' : '#f1f5f9'};
        box-shadow: ${isActive ? '0 6px 12px rgba(255,107,139,0.2)' : 'none'};
        color: ${isActive ? 'white' : '#94a3b8'};
        transition: all 0.3s ease;
      `;
      circle.innerHTML = `
        <span style="font-size: 1.1rem; font-weight: 800;">${isActive ? '🔥' : ''}${count}</span>
        <span style="font-size: 0.6rem; font-weight: 600; text-transform: uppercase; margin-top:2px; opacity:0.9;">${label}</span>
      `;
      return circle;
    };
    
    streakContainer.appendChild(createStreakCircle('Jours', dailyStreak));
    streakContainer.appendChild(createStreakCircle('Semaines', weeklyStreak));
    tabHistory.appendChild(streakContainer);

    // --- SYMPTOM EVOLUTION GRAPH (Dots + Thin lines + Toggles) ---
    const renderSymptomGraph = () => {
      const graphCard = document.createElement('div');
      graphCard.className = 'card graph-card';
      graphCard.style.padding = '20px';
      graphCard.style.marginBottom = '25px';
      
      const labels = [];
      const data = [];
      const now = new Date();

      if (graphTimeframe === 'day') {
        const days = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          days.push(d.toLocaleDateString('sv-SE'));
        }
        days.forEach(dStr => {
          const e = appData.history.find(x => x.date === dStr);
          data.push({
            fatigue: (e && e.symptomLevels && e.symptomLevels.fatigue) || 0,
            douleur: (e && e.symptomLevels && e.symptomLevels.pelvic) || 0,
            digestion: (e && e.symptomLevels && e.symptomLevels.discomfort) || 0,
            habits: getHabitScore(e)
          });
        });
      } else {
        // MOIS
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
          
          const monthEntries = appData.history.filter(e => e.date.startsWith(monthKey));
          const avg = (key) => {
            const vals = monthEntries.map(e => (e.symptomLevels && e.symptomLevels[key]) || null).filter(v => v !== null);
            return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          };
          const habitAvg = () => {
             const vals = monthEntries.map(e => getHabitScore(e));
             return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
          };
          
          data.push({
            fatigue: avg('fatigue'),
            douleur: avg('pelvic'),
            digestion: avg('discomfort'),
            habits: habitAvg()
          });
        }
      }

      const width = 300; const height = 120; const padding = 20;
      const getX = (idx) => padding + (idx * (width - 2 * padding) / 5);
      const getY = (val) => (height - padding) - (val * (height - 2 * padding) / 5);

      const createGraphElements = (key, color) => {
        let pathD = `M ${getX(0)} ${getY(data[0][key])}`;
        let dots = '';
        for (let i = 0; i < 6; i++) {
          if (i > 0) pathD += ` L ${getX(i)} ${getY(data[i][key])}`;
          const isPale = data[i][key] === 0;
          dots += `<circle cx="${getX(i)}" cy="${getY(data[i][key])}" r="3.5" fill="${color}" opacity="${isPale ? 0.05 : 1}" />`;
        }
        return `
          <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.3" stroke-linecap="round" stroke-linejoin="round" />
          ${dots}
        `;
      };

      graphCard.innerHTML = `
        <div class="graph-header" style="justify-content:flex-start; gap:8px;">
          <h4 style="font-size:0.95rem; margin:0; color:var(--text-main); font-weight:700;">État des 6 derniers</h4>
          <div class="graph-toggles" style="background:transparent; padding:0; gap:5px;">
            <button class="graph-toggle ${graphTimeframe === 'day' ? 'active' : ''}" data-view="day" style="font-size:0.95rem; padding:0; text-decoration: ${graphTimeframe === 'day' ? 'underline' : 'none'}; opacity: ${graphTimeframe === 'day' ? '1' : '0.5'};">${graphTimeframe === 'day' ? 'jours' : 'jours'}</button>
            <span style="font-size:0.95rem; opacity:0.3; font-weight:700;">/</span>
            <button class="graph-toggle ${graphTimeframe === 'month' ? 'active' : ''}" data-view="month" style="font-size:0.95rem; padding:0; text-decoration: ${graphTimeframe === 'month' ? 'underline' : 'none'}; opacity: ${graphTimeframe === 'month' ? '1' : '0.5'};">mois</button>
          </div>
        </div>
        <div style="width:100%; overflow:hidden;">
          <svg viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="overflow:visible;">
            ${[0, 1, 2, 3, 4, 5].map(v => `<line x1="${padding}" y1="${getY(v)}" x2="${width - padding}" y2="${getY(v)}" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2" />`).join('')}
            
            <!-- HABIT BARS -->
            ${data.map((d, i) => {
              const h = getY(0) - getY(d.habits);
              return `<rect x="${getX(i) - 8}" y="${getY(d.habits)}" width="16" height="${h}" fill="var(--primary)" fill-opacity="0.1" rx="4" />`;
            }).join('')}

            ${createGraphElements('fatigue', '#3b82f6')}
            ${createGraphElements('douleur', '#ef4444')}
            ${createGraphElements('digestion', '#f97316')}
          </svg>
        </div>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:10px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:5px; font-size:0.65rem; font-weight:600; color:#3b82f6;"><span style="width:7px; height:7px; border-radius:50%; background:#3b82f6;"></span> Fatigue</div>
          <div style="display:flex; align-items:center; gap:5px; font-size:0.65rem; font-weight:600; color:#ef4444;"><span style="width:7px; height:7px; border-radius:50%; background:#ef4444;"></span> Douleur</div>
          <div style="display:flex; align-items:center; gap:5px; font-size:0.65rem; font-weight:600; color:#f97316;"><span style="width:7px; height:7px; border-radius:50%; background:#f97316;"></span> Digestion</div>
          <div style="display:flex; align-items:center; gap:5px; font-size:0.65rem; font-weight:600; color:var(--primary);"><span style="width:7px; height:7px; border-radius:1px; background:var(--primary); opacity:0.3;"></span> Habitudes</div>
        </div>
      `;
      
      graphCard.querySelectorAll('.graph-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          graphTimeframe = btn.dataset.view;
          renderHistory();
        });
      });

      return graphCard;
    };
    tabHistory.appendChild(renderSymptomGraph());

    // Trier par date décroissante
    const sortedHistory = [...appData.history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Filtrer les entrées qui ont au moins un symptôme ou une donnée diète
    const entriesWithData = sortedHistory.filter(entry => {
      const hasSymptoms = entry.symptoms && entry.symptoms.length > 0;
      const hasPain = entry.symptomLevels && Object.values(entry.symptomLevels).some(v => v !== null);
      const hasDiet = entry.diet && entry.diet.meals;
      return hasSymptoms || hasPain || hasDiet;
    });

    if (entriesWithData.length === 0) {
      tabHistory.innerHTML += `
        <div class="card" style="text-align:center; padding: 40px 20px;">
          <div style="font-size: 2.5rem; margin-bottom: 15px;">📊</div>
          <h3>Aucun historique pour le moment</h3>
          <p style="color:var(--text-muted); margin-top:10px;">Vos saisies quotidiennes apparaîtront ici chronologiquement.</p>
        </div>
      `;
      return;
    }

    // --- MASTER TOGGLE ---
    const masterToggle = document.createElement('details');
    masterToggle.className = 'master-history-toggle';
    masterToggle.innerHTML = `<summary>Voir les notes récapitulatives</summary>`;
    
    const listContainer = document.createElement('div');
    listContainer.className = 'history-items-list';

    entriesWithData.forEach(entry => {
      const [y, m, d] = entry.date.split('-');
      const formattedDate = `${d}:${m}:${y.slice(-2)}`;
      
      const historyCard = document.createElement('details');
      historyCard.className = 'history-item card';
      historyCard.style.padding = '15px 20px';
      historyCard.style.borderRadius = '20px';
      historyCard.style.marginBottom = '12px';
      historyCard.style.background = '#ffffff';
      
      const summary = document.createElement('summary');
      summary.style.listStyle = 'none';
      summary.style.outline = 'none';
      summary.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:700; color:var(--text-main); font-size:1rem;">🗓️ ${formattedDate}</span>
          <div class="btn-round-toggle">▼</div>
        </div>
      `;
      historyCard.appendChild(summary);

      const content = document.createElement('div');
      content.style.marginTop = '15px';
      content.style.paddingTop = '10px';
      content.style.borderTop = '1px dashed #e2e8f0';

      // --- SECTION DOULEURS ---
      let painSummary = '';
      if (entry.symptomLevels) {
        const pMap = { fatigue: 'Fatigue', pelvic: 'Douleur pelvienne', discomfort: 'Inconfort digestif' };
        Object.entries(entry.symptomLevels).forEach(([k, v]) => {
          if (v !== null && pMap[k]) {
            painSummary += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.85rem;">
              <span style="color:var(--text-muted);">${pMap[k]}</span>
              <span style="font-weight:600; color:var(--primary);">${v}/5</span>
            </div>`;
          }
        });
      }
      if (painSummary) {
        content.innerHTML += `<h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px; letter-spacing:0.05em;">Intensité des douleurs</h4>${painSummary}`;
      }

      // --- SECTION ALIMENTATION ---
      let inflammatoryFoods = [];
      if (entry.diet && entry.diet.meals) {
        Object.values(entry.diet.meals).forEach(meal => {
          if (meal.categories) {
            Object.values(meal.categories).forEach(items => {
              items.forEach(foodName => {
                const fInfo = foodDatabase.find(f => f.name === foodName);
                if (fInfo && fInfo.type === 'pro-inflammatoire' && !inflammatoryFoods.includes(foodName)) {
                  inflammatoryFoods.push(foodName);
                }
              });
            });
          }
        });
      }

      if (inflammatoryFoods.length > 0) {
        content.innerHTML += `<h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin:15px 0 10px 0; letter-spacing:0.05em;">Aliments inflammatoires</h4>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${inflammatoryFoods.map(f => `<span style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 10px; border-radius:15px; font-size:0.8rem; font-weight:600;">${f}</span>`).join('')}
          </div>`;
      }

      historyCard.appendChild(content);
      listContainer.appendChild(historyCard);
    });

    masterToggle.appendChild(listContainer);
    tabHistory.appendChild(masterToggle);
  }

  // --- INITIALISATION ---
  renderSettings();
  renderDailyNotes();
  renderDietTracking();
  renderHistory();
  switchToTab(userSettings ? 'tab-daily-notes' : 'tab-settings');
});
