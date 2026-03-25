document.addEventListener('DOMContentLoaded', () => {
  const tabDailyNotes = document.getElementById('tab-daily-notes');
  const tabDiet = document.getElementById('tab-diet');
  const tabHistory = document.getElementById('tab-history');
  const tabRecipes = document.getElementById('tab-recipes');
  const tabSettings = document.getElementById('tab-settings');
  const tabsOrder = ['tab-daily-notes', 'tab-diet', 'tab-recipes', 'tab-history', 'tab-settings'];

  function switchToTab(targetId) {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.target === targetId);
    });
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === targetId);
    });
    if (targetId === 'tab-diet') renderDietTracking();
    if (targetId === 'tab-recipes') renderRecipes();
    if (targetId === 'tab-daily-notes') renderDailyNotes();
    if (targetId === 'tab-history') {
      renderHistoryStreaks();
      renderHistoryGraph();
      renderHistoryNotes();
    }
  }

  // Navigation
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (btn) { e.preventDefault(); switchToTab(btn.dataset.target); }
    });
  });

  // Swipe
  let touchstartX = 0;
  let touchstartY = 0;
  document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const deltaX = e.changedTouches[0].screenX - touchstartX;
    const deltaY = e.changedTouches[0].screenY - touchstartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      const activeTabEl = document.querySelector('.tab-content.active');
      if (!activeTabEl) return;
      const currentIndex = tabsOrder.indexOf(activeTabEl.id);
      if (deltaX > 0 && currentIndex > 0) switchToTab(tabsOrder[currentIndex - 1]);
      if (deltaX < 0 && currentIndex < tabsOrder.length - 1) switchToTab(tabsOrder[currentIndex + 1]);
    }
  }, { passive: true });

  // Clics globaux
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('input-field')) {
      document.querySelectorAll('.autocomplete-list').forEach(list => list.innerHTML = '');
    }
  });

  // Search recipes listener
  document.getElementById('main-search-bar')?.addEventListener('input', (e) => {
    renderRecipes(e.target.value);
  });
  // Data Setup
  const moodOptions = ["Heureuse", "Confiante", "Stressée", "Anxieuse", "Déprimée", "Irritable", "Déconcentrée"];
  const predefinedSymptoms = ["Crampes utérines", "Douleurs lombaires", "Jambes lourdes", "Nausées", "Constipation", "Diarrhée", "Migraine", "Jambes fantômes", "Acné"];

  let userSettings = JSON.parse(localStorage.getItem('endocute_userSettings')) || null;
  let appData = JSON.parse(localStorage.getItem('endocuteData')) || { history: [] };
  let customSymptoms = JSON.parse(localStorage.getItem('endocuteCustomSymptoms')) || [];

  // Recipes Data
  const staticRecipes = [
    { id: 1, title: "Salade de Quinoa", type: "Déjeuner", prepTime: "20 min", ingredients: ["Quinoa", "Concombre", "Tomate", "Feta"], steps: ["Rincer le quinoa.", "Cuire 12 min à l'eau bouillante salée.", "Couper les légumes en dés.", "Mélanger le tout avec une touche d'huile d'olive."], isPerfectRecipe: true, isGlutenFree: true, isVegan: false }
  ];
  let customRecipes = JSON.parse(localStorage.getItem('endocuteCustomRecipes')) || [];
  let fullRecipeDatabase = [...staticRecipes, ...customRecipes];

  // Date de travail globale (par défaut aujourd'hui)
  let selectedDate = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local
  let graphTimeframe = 'day'; // 'day' ou 'month'

  function saveData() {
    localStorage.setItem('endocute_userSettings', JSON.stringify(userSettings));
    localStorage.setItem('endocuteData', JSON.stringify(appData));
    localStorage.setItem('endocuteCustomSymptoms', JSON.stringify(customSymptoms));
    localStorage.setItem('endocuteCustomRecipes', JSON.stringify(customRecipes));
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

  // DATABASE ALIMENTATION
  const foodDatabase = [
    // Légume
    { name: "Ail (cuit)", type: "pro-inflammatoire", legume: true },
    { name: "Ail (cru)", type: "inflammatoire", legume: true },
    { name: "Artichaut", type: "anti-inflammatoire", legume: true },
    { name: "Asperge", type: "anti-inflammatoire", legume: true },
    { name: "Aubergine", type: "anti-inflammatoire", legume: true },
    { name: "Avocat", type: "anti-inflammatoire", omega3: true, legume: true },
    { name: "Basilic frais", type: "anti-inflammatoire", legume: true },
    { name: "Blettes", type: "anti-inflammatoire", legume: true },
    { name: "Brocolis", type: "pro-inflammatoire", legume: true },
    { name: "Carotte (cuite)", type: "anti-inflammatoire", legume: true },
    { name: "Céléri", type: "anti-inflammatoire", legume: true },
    { name: "Champignons", type: "pro-inflammatoire", legume: true }, // fermentescible
    { name: "Chou-fleur", type: "pro-inflammatoire", legume: true }, // fermentescible
    { name: "Concombre", type: "neutre", legume: true },
    { name: "Courgette", type: "neutre", legume: true },
    { name: "Courge butternut", type: "anti-inflammatoire", legume: true },
    { name: "Courge spaghetti", type: "anti-inflammatoire", legume: true },
    { name: "Échalote (cuite)", type: "pro-inflammatoire", legume: true },
    { name: "Échalote (crue)", type: "inflammatoire", legume: true },
    { name: "Épinards", type: "anti-inflammatoire", legume: true },
    { name: "Fenouil", type: "anti-inflammatoire", legume: true },
    { name: "Haricot vert", type: "anti-inflammatoire", legume: true },
    { name: "Laitue", type: "neutre", legume: true },
    { name: "Lentilles", type: "anti-inflammatoire", legume: true },
    { name: "Mâche", type: "anti-inflammatoire", legume: true },
    { name: "Oignon (cuit)", type: "pro-inflammatoire", legume: true },
    { name: "Oignon (cru)", type: "inflammatoire", legume: true },
    { name: "Panais", type: "anti-inflammatoire", legume: true },
    { name: "Persil", type: "anti-inflammatoire", legume: true },
    { name: "Pissenlit", type: "anti-inflammatoire", legume: true },
    { name: "Poivron rouge", type: "anti-inflammatoire", legume: true },
    { name: "Pois chiches", type: "inflammatoire", legume: true },
    { name: "Potimarron", type: "anti-inflammatoire", legume: true },
    { name: "Radis", type: "anti-inflammatoire", legume: true },
    { name: "Roquette", type: "neutre", legume: true },
    { name: "Rutabaga", type: "anti-inflammatoire", legume: true },
    { name: "Tomate", type: "neutre", legume: true },
    { name: "Topinambour", type: "pro-inflammatoire", legume: true }, // fermentescible
    { name: "Navets", type: "neutre", legume: true },

    // Fruit
    { name: "Abricot", type: "neutre", fruit: true },
    { name: "Amande", type: "anti-inflammatoire", omega3: true, fruit: true },
    { name: "Ananas", type: "anti-inflammatoire", fruit: true },
    { name: "Clémentine", type: "anti-inflammatoire", fruit: true },
    { name: "Citron", type: "anti-inflammatoire", fruit: true },
    { name: "Fraise", type: "anti-inflammatoire", fruit: true },
    { name: "Grenade", type: "anti-inflammatoire", fruit: true },
    { name: "Kiwi", type: "anti-inflammatoire", fruit: true },
    { name: "Mandarine", type: "anti-inflammatoire", fruit: true },
    { name: "Rhubarbe", type: "neutre", fruit: true },
    { name: "Banane", type: "neutre", fruit: true },
    { name: "Cassis", type: "anti-inflammatoire", fruit: true },
    { name: "Cerise", type: "anti-inflammatoire", fruit: true },
    { name: "Melon", type: "neutre", fruit: true },
    { name: "Mirabelle", type: "neutre", fruit: true },
    { name: "Mûre", type: "anti-inflammatoire", fruit: true },
    { name: "Myrtille", type: "anti-inflammatoire", fruit: true },
    { name: "Pêche", type: "neutre", fruit: true },
    { name: "Pêche de vigne", type: "neutre", fruit: true },
    { name: "Prune", type: "neutre", fruit: true },
    { name: "Coing", type: "neutre", fruit: true },
    { name: "Figue", type: "anti-inflammatoire", fruit: true },
    { name: "Kaki", type: "neutre", fruit: true },
    { name: "Pomme", type: "neutre", fruit: true },
    { name: "Poire", type: "neutre", fruit: true },
    { name: "Quetsche", type: "neutre", fruit: true },
    { name: "Raisin", type: "neutre", fruit: true },

    // Féculent
    // Pain (classique vs complet vs sans gluten)
    { name: "Baguette blanche", type: "pro-inflammatoire", feculent: true },
    { name: "Pain au blé complet", type: "anti-inflammatoire", feculent: true },
    { name: "Pain de seigle", type: "neutre", feculent: true },
    { name: "Pain sans gluten", type: "neutre", glutenfree: true, feculent: true },
    { name: "Pain complet au levain", type: "anti-inflammatoire", feculent: true },

    // Pâtes (blé moderne vs ancien vs sans gluten)
    { name: "Pâtes blanches", type: "pro-inflammatoire", feculent: true },
    { name: "Pâtes au blé complet", type: "neutre", feculent: true },
    { name: "Pâtes au sarrasin", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Pâtes de maïs", type: "neutre", glutenfree: true, feculent: true },
    { name: "Pâtes de lentilles corail", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Pâtes de pois chiches", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Pâtes sans gluten", type: "neutre", glutenfree: true, feculent: true },

    // Riz
    { name: "Riz basmati", type: "neutre", feculent: true },
    { name: "Riz complet", type: "anti-inflammatoire", feculent: true },
    { name: "Riz rouge", type: "anti-inflammatoire", feculent: true },
    { name: "Riz sauvage", type: "anti-inflammatoire", glutenfree: true, feculent: true },

    // Céréales sans gluten naturelles
    { name: "Amarante", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Sarrasin", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Maïs", type: "neutre", glutenfree: true, feculent: true },
    { name: "Millet", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Quinoa", type: "anti-inflammatoire", glutenfree: true, feculent: true },

    // Pseudocéréales et légumineuses féculentes
    { name: "Châtaigne", type: "neutre", glutenfree: true, feculent: true },
    { name: "Lentilles corail", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Polenta", type: "neutre", glutenfree: true, feculent: true },

    // Féculents racines (tous sans gluten)
    { name: "Igname", type: "neutre", glutenfree: true, feculent: true },
    { name: "Marron", type: "neutre", glutenfree: true, feculent: true },
    { name: "Patate douce", type: "anti-inflammatoire", glutenfree: true, feculent: true },
    { name: "Pommes de terre", type: "neutre", glutenfree: true, feculent: true },
    { name: "Manioc", type: "neutre", glutenfree: true, feculent: true },

    // Protéine
    { name: "Anchois", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Boeuf", type: "inflammatoire", proteine: true },
    { name: "Crevettes", type: "neutre", proteine: true },
    { name: "Dorade", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Hareng", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Maquereau", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Poulet", type: "neutre", proteine: true },
    { name: "Saumon", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Sardine", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Seitan", type: "neutre", proteine: true },
    { name: "Tempeh", type: "anti-inflammatoire", proteine: true },
    { name: "Thon", type: "anti-inflammatoire", omega3: true, proteine: true },
    { name: "Tofu", type: "neutre", proteine: true },
    { name: "Truite", type: "anti-inflammatoire", omega3: true, proteine: true },

    // Laitage
    // Yaourts (nature, entier)
    { name: "Yaourt de brebis", type: "neutre", laitage: true },
    { name: "Yaourt de chèvre", type: "neutre", laitage: true },
    { name: "Yaourt grec", type: "neutre", laitage: true },
    { name: "Yaourt nature entier", type: "neutre", laitage: true },

    // Fromages frais méditerranéens
    { name: "Cabécou", type: "neutre", laitage: true },
    { name: "Chèvre frais", type: "neutre", laitage: true },
    { name: "Feta (brebis/chèvre)", type: "neutre", laitage: true },
    { name: "Fromage frais de chèvre", type: "neutre", laitage: true },
    { name: "Ricotta", type: "neutre", laitage: true },

    // Fromages à pâte dure ARTISANAUX (neutres)
    { name: "Comté (fromager)", type: "neutre", laitage: true },
    { name: "Cantal (fromager)", type: "neutre", laitage: true },
    { name: "Gruyère (fromager)", type: "neutre", laitage: true },
    { name: "Manchego", type: "neutre", laitage: true },
    { name: "Pecorino", type: "neutre", laitage: true },
    { name: "Roquefort (fromager)", type: "neutre", laitage: true },

    // Fromages à pâte dure INDUSTRIELS (inflammatoires)
    { name: "Comté (industriel)", type: "inflammatoire", laitage: true },
    { name: "Cheddar (industriel)", type: "inflammatoire", laitage: true },
    { name: "Emmental (industriel)", type: "inflammatoire", laitage: true },

    // Graine / fruits secs
    // Graines riches en oméga-3
    { name: "Graines de chanvre", type: "anti-inflammatoire", omega3: true, graine: true },
    { name: "Graines de chia", type: "anti-inflammatoire", omega3: true, graine: true },
    { name: "Graines de courge", type: "anti-inflammatoire", graine: true },
    { name: "Graines de lin moulues", type: "anti-inflammatoire", omega3: true, graine: true },
    { name: "Graines de sésame", type: "anti-inflammatoire", graine: true },
    { name: "Graines de tournesol", type: "anti-inflammatoire", graine: true },

    // Fruits secs piliers méditerranéens
    { name: "Cacahuète", type: "neutre", graine: true },
    { name: "Figue sèche", type: "anti-inflammatoire", graine: true },
    { name: "Noisette", type: "anti-inflammatoire", omega3: true, graine: true },
    { name: "Noix", type: "anti-inflammatoire", omega3: true, graine: true },
    { name: "Noix de cajou", type: "neutre", graine: true },
    { name: "Noix de macadamia", type: "neutre", graine: true },
    { name: "Pistache", type: "anti-inflammatoire", graine: true },
    { name: "Raisin sec", type: "neutre", graine: true },


    // HUILES & GRAISSES
    // ANTI-INFLAMMATOIRES (Riches en Oméga-3 ou Polyphénols)
    { name: "Huile d'olive (Vierge Extra)", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Huile de colza (pression à froid)", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de lin", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de noix", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de chanvre", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de cameline", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de périlla", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Huile de germe de blé", type: "anti-inflammatoire", assaisonnement: true },

    // NEUTRES (Stables à la cuisson mais sans bénéfice Oméga-3)
    { name: "Huile de coco", type: "neutre", assaisonnement: true },
    { name: "Beurre clarifié (Ghee)", type: "neutre", assaisonnement: true },
    { name: "Huile d'avocat", type: "neutre", assaisonnement: true },
    { name: "Huile de noisette", type: "neutre", assaisonnement: true },

    // PRO-INFLAMMATOIRES (Trop riches en Oméga-6)
    { name: "Huile de tournesol", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Huile de maïs", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Huile de pépins de raisin", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Huile de soja", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Huile d'arachide", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Huile de sésame", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Margarine classique", type: "pro-inflammatoire", assaisonnement: true },

    // INFLAMMATOIRES (Graisses saturées de mauvaise qualité ou trans)
    { name: "Huile de palme", type: "inflammatoire", assaisonnement: true },
    { name: "Beurre (classique)", type: "inflammatoire", assaisonnement: true },
    { name: "Végétaline / Graisse de coprah", type: "inflammatoire", assaisonnement: true },
    { name: "Saindoux", type: "inflammatoire", assaisonnement: true },

    // Vinaigres
    { name: "Vinaigre balsamique", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Vinaigre de cidre", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Vinaigre de vin rouge", type: "neutre", assaisonnement: true },
    { name: "Vinaigre de xérès", type: "neutre", assaisonnement: true },

    // Moutardes
    { name: "Moutarde de Dijon", type: "neutre", assaisonnement: true },
    { name: "Moutarde à l'ancienne", type: "neutre", assaisonnement: true },

    // Sauces & Condiments

    // ANTI-INFLAMMATOIRES (Basées sur de bonnes graisses ou épices)
    { name: "Guacamole (maison)", type: "anti-inflammatoire", omega3: true, assaisonnement: true },
    { name: "Hummus (huile olive)", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Pesto basilic (maison)", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Sauce au yaourt & fines herbes", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Sauce Tahini (crème sésame)", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Tzatziki", type: "anti-inflammatoire", assaisonnement: true },

    // NEUTRES (Peu d'impact si consommées avec modération)
    { name: "Moutarde à l'ancienne", type: "neutre", assaisonnement: true },
    { name: "Sauce soja (Tamari sans gluten)", type: "neutre", glutenfree: true, assaisonnement: true },
    { name: "Sauce soja (classique)", type: "neutre", assaisonnement: true },
    { name: "Sauce tomate (maison/bio)", type: "neutre", assaisonnement: true },
    { name: "Tapenade d'olives noires", type: "neutre", assaisonnement: true },
    { name: "Vinaigrette (huile colza/olive)", type: "neutre", omega3: true, assaisonnement: true },

    // PRO-INFLAMMATOIRES (Sucre, additifs ou huiles de basse qualité)
    { name: "Ketchup", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Mayonnaise (industrielle)", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce aigre-douce", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce Barbecue (BBQ)", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce Burger", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce César", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce Curry (en pot)", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Sauce Teriyaki", type: "pro-inflammatoire", assaisonnement: true },

    // INFLAMMATOIRES (Ultra-transformées ou très riches en produits laitiers/graisses saturées)
    { name: "Béchamel", type: "inflammatoire", assaisonnement: true },
    { name: "Sauce Béarnaise", type: "inflammatoire", assaisonnement: true },
    { name: "Sauce Hollandaise", type: "inflammatoire", assaisonnement: true },
    { name: "Sauce Marchand de vin", type: "inflammatoire", assaisonnement: true },
    { name: "Sauce Nem (Nuoc-mâm sucrée)", type: "inflammatoire", assaisonnement: true },
    { name: "Sauce Roquefort / Fromage", type: "inflammatoire", assaisonnement: true },

    // Épices ANTI-INFLAMMATOIRES (top 5 + bonus)
    { name: "Ail en poudre", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Basilic séché", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Cannelle", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Curcuma", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Gingembre", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Origan", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Romarin", type: "anti-inflammatoire", assaisonnement: true },
    { name: "Thym", type: "anti-inflammatoire", assaisonnement: true },

    // Épices NEUTRES
    { name: "Ciboulette", type: "neutre", assaisonnement: true },
    { name: "Coriandre", type: "neutre", assaisonnement: true },
    { name: "Cumin", type: "neutre", assaisonnement: true },
    { name: "Estragon", type: "neutre", assaisonnement: true },
    { name: "Laurier", type: "neutre", assaisonnement: true },
    { name: "Muscade", type: "neutre", assaisonnement: true },
    { name: "Paprika doux", type: "neutre", assaisonnement: true },
    { name: "Persil séché", type: "neutre", assaisonnement: true },
    { name: "Sarriette", type: "neutre", assaisonnement: true },

    // Épices & Condiments IRRITANTS (Potentiellement Pro-inflammatoires)
    { name: "Piment de Cayenne", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Poivre noir", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Poivre blanc", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Piment oiseau / Pili-pili", type: "inflammatoire", assaisonnement: true },
    { name: "Piment d'Espelette", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Paprika fort", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Wasabi (industriel)", type: "inflammatoire", assaisonnement: true },
    { name: "Harissa", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Raifort", type: "pro-inflammatoire", assaisonnement: true },

    // Mélanges industriels (souvent riches en sel, sucre et additifs)
    { name: "Mélange d'épices Fajitas", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Mélange d'épices Tandoori", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Mélange d'épices Curry (bas de gamme)", type: "pro-inflammatoire", assaisonnement: true },
    { name: "Bouillon cube (classique)", type: "inflammatoire", assaisonnement: true },
    { name: "Sel fin raffiné", type: "pro-inflammatoire", assaisonnement: true },

    // Boisson
    { name: "Alcool", type: "inflammatoire", boisson: true },
    { name: "Bière", type: "inflammatoire", boisson: true },
    { name: "Café", type: "inflammatoire", boisson: true },
    { name: "Café décaféiné", type: "neutre", boisson: true },
    { name: "Cidre", type: "inflammatoire", boisson: true },
    { name: "Eau", type: "neutre", boisson: true },
    { name: "Lait d'amande", type: "neutre", boisson: true },
    { name: "Lait d'avoine", type: "neutre", boisson: true },
    { name: "Lait de coco", type: "neutre", boisson: true },
    { name: "Lait d'épeautre", type: "neutre", boisson: true },
    { name: "Lait de noisette", type: "anti-inflammatoire", boisson: true },
    { name: "Lait de riz", type: "neutre", boisson: true },
    { name: "Lait de soja", type: "neutre", boisson: true },
    { name: "Lait de sésame", type: "neutre", boisson: true },
    { name: "Soda", type: "inflammatoire", boisson: true },
    { name: "Soupe miso", type: "neutre", boisson: true },
    { name: "Thé noir", type: "inflammatoire", boisson: true },
    { name: "Thé vert", type: "pro-inflammatoire", boisson: true },
    { name: "Tisane à la camomille", type: "anti-inflammatoire", boisson: true },
    { name: "Tisane à la mélisse", type: "anti-inflammatoire", boisson: true },
    { name: "Tisane à la menthe poivrée", type: "neutre", boisson: true },
    { name: "Tisane à l'oranger", type: "anti-inflammatoire", boisson: true },
    { name: "Tisane à la reine-des-prés", type: "anti-inflammatoire", boisson: true },
    { name: "Rooibos", type: "anti-inflammatoire", boisson: true },
    { name: "Tisane au tilleul", type: "anti-inflammatoire", boisson: true },
    { name: "Tisane à la verveine", type: "anti-inflammatoire", boisson: true },
    { name: "Vin rouge", type: "pro-inflammatoire", boisson: true },

    // PRODUITS SUCRANTS
    { name: "Sucre blanc / roux", type: "inflammatoire", sucre: true },
    { name: "Sirop de glucose-fructose", type: "inflammatoire", sucre: true },
    { name: "Miel (apiculteur)", type: "anti-inflammatoire", sucre: true }, // Riche en enzymes et polyphénols
    { name: "Sirop d'érable", type: "neutre", sucre: true },
    { name: "Sirop d'agave", type: "pro-inflammatoire", sucre: true }, // Très riche en fructose
    { name: "Stévia (naturelle)", type: "neutre", sucre: true },
    { name: "Sucre de coco", type: "neutre", sucre: true },
    { name: "Sucre de bouleau", type: "neutre", sucre: true },

    // AUTRES (Plats cuisinés, Gâteaux & Snacks)
    { name: "Chocolat noir (>70%)", type: "anti-inflammatoire", autre: true },
    { name: "Chocolat au lait", type: "pro-inflammatoire", autre: true },
    { name: "Chocolat blanc", type: "pro-inflammatoire", autre: true },
    { name: "Glace (artisanale)", type: "neutre", autre: true },
    { name: "Glace (industrielle)", type: "pro-inflammatoire", autre: true },
    { name: "Gyoza (vapeur)", type: "neutre", autre: true },
    { name: "Sushi", type: "neutre", autre: true },
    { name: "Pizza (industrielle)", type: "inflammatoire", autre: true },
    { name: "Pizza (maison)", type: "pro-inflammatoire", autre: true },
    { name: "Burger (fast-food)", type: "inflammatoire", autre: true },
    { name: "Quiche", type: "pro-inflammatoire", autre: true },
    { name: "Biscuits (industriels)", type: "inflammatoire", autre: true },
    { name: "Gâteau (maison)", type: "neutre", autre: true },
    { name: "Viennoiseries", type: "inflammatoire", autre: true },
    { name: "Couscous (complet)", type: "neutre", autre: true },
    { name: "Paella", type: "neutre", autre: true },
    { name: "Ratatouille", type: "anti-inflammatoire", autre: true },
    { name: "Frites", type: "inflammatoire", autre: true },
    { name: "Chips", type: "inflammatoire", autre: true },
    { name: "Nems", type: "inflammatoire", autre: true }
  ];

  // Injection des aliments personnalisés par l'utilisateur
  let customFoods = JSON.parse(localStorage.getItem('endocuteCustomFoods')) || [];
  foodDatabase.push(...customFoods);

  // --- SUIVI ALIMENTAIRE ---
  function getDietEntryForDate(entry) {
    const defaultGoals = { "Boire 1.5 litre": false, "Une poignée d'amandes": false, "2 c. à s. de graines de chia": false, "2 c. à s. d'huile de noix": false };
    const weeklyGoals = { "300 gr. de poisson gras": false, "Pas de café": false, "Pas d'alcool": false };
    const activityGoals = { "5 min. cohérence cardiaque": false, "Exercices kiné": false, "30 min. de marche / piscine": false };

    const defaultMealsData = {
      "Petit-déjeuner": { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
      "Déjeuner": { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
      "Goûter": { categories: { "Boisson": [], "Repas": [] }, digestionScale: null },
      "Dîner": { categories: { "Boisson": [], "Repas": [] }, digestionScale: null }
    };

    if (!entry.diet) {
      entry.diet = {
        goals: defaultGoals,
        weeklyGoals: weeklyGoals,
        activityGoals: activityGoals,
        activityWeeklyGoals: activityWeeklyGoals,
        meals: JSON.parse(JSON.stringify(defaultMealsData))
      };
    } else {
      if (!entry.diet.meals) entry.diet.meals = {};

      Object.keys(defaultMealsData).forEach(m => {
        // Gérer l'ancien nommage avec tiret
        if (!entry.diet.meals[m]) {
          const noDash = m.replace('-', ' ');
          if (entry.diet.meals[noDash]) {
            entry.diet.meals[m] = entry.diet.meals[noDash];
            delete entry.diet.meals[noDash];
          } else {
            entry.diet.meals[m] = JSON.parse(JSON.stringify(defaultMealsData[m]));
          }
        }

        // Migrer les anciennes catégories vers Boisson / Repas si nécessaire
        const cats = entry.diet.meals[m].categories;
        if (!cats) {
          entry.diet.meals[m].categories = JSON.parse(JSON.stringify(defaultMealsData[m].categories));
        } else if (!('Repas' in cats)) {
          // Anciennes catégories détectées : tout regrouper dans Repas, Boisson reste vide
          const allItems = Object.values(cats).flat();
          entry.diet.meals[m].categories = {
            "Boisson": cats["Boisson"] || [],
            "Repas": allItems.filter(name => !((cats["Boisson"] || []).includes(name)))
          };
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

    if (food.omega3) {
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

  function createFoodGoalsTracker() {
    const trackerContainer = document.createElement('div');
    trackerContainer.id = 'food-goals-tracker';
    trackerContainer.style.cssText = 'display: flex; justify-content: space-around; gap: 10px; margin-bottom: 25px; padding: 10px 0;';

    const icons = {
      vegFruit: `<path d="M12 22s-7-1-7-8a7 7 0 0 1 14 0c0 7-7 8-7 8zM12 2v4M10 3s1 2 4 2" stroke="white" stroke-width="2" fill="none"/>`,
      feculent: `<path d="M6 20s3-1 3-8-3-10-3-10M18 20s-3-1-3-8 3-10 3-10M12 4v16M8 8h8M8 12h8M8 16h8" stroke="white" stroke-width="2" fill="none"/>`,
      proteine: `<path d="M18 10c0 6-4 10-4 10s-1 1-2 1-2-1-2-1-4-4-4-10 4-8 4-8 1-1 2-1 2 1 2 1 4 2 4 8z" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="11" r="3" fill="white"/>`,
      laitage: `<path d="M6 18h12l1-12H5l1 12zM8 22h8M9 6V2h6v4" stroke="white" stroke-width="2" fill="none"/>`
    };

    const updateTracker = () => {
      const entry = getEntryForDate(selectedDate);
      const dietData = getDietEntryForDate(entry);

      let counts = { legume: 0, fruit: 0, feculent: 0, proteine: 0, laitage: 0 };

      Object.values(dietData.meals).forEach(meal => {
        const allFoods = [...(meal.categories?.['Repas'] || []), ...(meal.categories?.['Boisson'] || [])];
        const quantities = meal.quantities || {};
        allFoods.forEach(name => {
          const f = foodDatabase.find(i => i.name === name);
          const q = quantities[name] || 1;
          if (f) {
            if (f.legume) counts.legume += q;
            if (f.fruit) counts.fruit += q;
            if (f.feculent) counts.feculent += q;
            if (f.proteine) counts.proteine += q;
            if (f.laitage) counts.laitage += q;
          }
        });
      });

      const scores = [
        { name: 'Légumes & Fruits', val: ((Math.min(counts.legume, 3) + Math.min(counts.fruit, 2)) / 5) * 100, goal: '5 portions', color: '#10b981' },
        { name: 'Féculents', val: (Math.min(counts.feculent, 2) / 2) * 100, goal: '2 portions', color: '#f59e0b' },
        { name: 'Protéines', val: (Math.min(counts.proteine, 2) / 2) * 100, goal: '2 portions', color: '#ef4444' },
        { name: 'Laitages', val: (Math.min(counts.laitage, 2) / 2) * 100, goal: '2 portions', color: '#BAE6FD' }
      ];

      trackerContainer.innerHTML = '';

      scores.forEach((s, index) => {
        const iconKey = Object.keys(icons)[index];
        const wrapper = document.createElement('div');
        // Style du conteneur circulaire
        wrapper.style.cssText = `
        position: relative;
        width: 60px;
        height: 60px;
        cursor: pointer;
        border-radius: 50%;
        overflow: hidden;
        background: #e2e8f0;
        transition: transform 0.2s ease;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
      `;

        wrapper.onclick = () => showBubblyPopup(s.name, s.goal, s.color);
        wrapper.onmousedown = () => wrapper.style.transform = 'scale(0.95)';
        wrapper.onmouseup = () => wrapper.style.transform = 'scale(1)';

        const liquid = document.createElement('div');
        liquid.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: ${s.val}%;
        background-color: ${s.color};
        transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      `;

        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 2;
        pointer-events: none;
      `;

        iconContainer.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${icons[iconKey]}</svg>`;

        wrapper.appendChild(liquid);
        wrapper.appendChild(iconContainer);
        trackerContainer.appendChild(wrapper);
      });
    };

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
      input.style.width = val.length > 0 ? '120px' : '60px';
      input.style.textAlign = val.length > 0 ? 'left' : 'center';

      list.innerHTML = '';
      if (searchVal.length === 0) { list.style.display = 'none'; return; }

      const matches = foodDatabase.filter(f => {
        const isBoisson = categoryName === 'Boisson';
        if (isBoisson ? !f.boisson : f.boisson) return false;
        const n = normalizeStr(f.name);
        return n.startsWith(searchVal) || n.includes(" " + searchVal);
      });

      if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(match => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.style.padding = '10px';
          item.style.cursor = 'pointer';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.borderBottom = '1px solid #f1f5f9';

          const col = getFoodTypeColor(match.name);
          const dot = document.createElement('span');
          dot.style.display = 'inline-block';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.marginRight = '8px';
          dot.style.flexShrink = '0';
          dot.style.background = col.dotBg || col.border;

          const label = document.createTextNode(match.name);
          item.appendChild(dot);
          item.appendChild(label);

          item.onclick = () => {
            const entry = getDietEntryForDate(getEntryForDate(selectedDate));
            if (!entry.meals[mealName].categories[categoryName].includes(match.name)) {
              entry.meals[mealName].categories[categoryName].push(match.name);
              saveData();
            }
            input.value = '';
            input.style.width = '60px'; // Reset width
            list.innerHTML = '';
            list.style.display = 'none';
            onUpdate();
          };
          list.appendChild(item);
        });
      } else { list.style.display = 'none'; }
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

    // On vide l'onglet (selectedDate est globale)
    tabDiet.innerHTML = '';

    const entry = getEntryForDate(selectedDate);

    // 1. LE BLOC OBJECTIFS (Beige, Large)
    renderTaskConsole(tabDiet, entry);

    // 2. LE TRACKER D'ICÔNES (Légumes, Protéines...)
    tabDiet.appendChild(createFoodGoalsTracker());

    // 3. LES REPAS (Appel de ta fonction complexe)
    const mealNames = ["Petit-déjeuner", "Déjeuner", "Goûter", "Dîner"];

    mealNames.forEach(mealName => {
      // On appelle TA fonction qui génère le SVG et les couleurs
      const mealElement = createMealAccordion(mealName);
      tabDiet.appendChild(mealElement);
    });
  }

  function renderRecipes(query = "") {
    if (!tabRecipes) return;
    const recipeContainer = document.getElementById('recipe-results-container');
    if (!recipeContainer) return;

    recipeContainer.innerHTML = "";
    const searchVal = query.toLowerCase().trim();

    const filteredRecipes = fullRecipeDatabase.filter(r =>
      r.title.toLowerCase().includes(searchVal) ||
      r.type.toLowerCase().includes(searchVal) ||
      r.ingredients.some(i => i.toLowerCase().includes(searchVal))
    );

    if (filteredRecipes.length === 0) {
      recipeContainer.innerHTML = "<p class='no-result'>Aucune recette trouvée...</p>";
      return;
    }

    filteredRecipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      card.innerHTML = `
        <div class="card-header">
          <span class="recipe-type">${recipe.type}</span>
          ${recipe.isPerfectRecipe ? '<span class="badge-perfect">✨ Recette Parfaite</span>' : ''}
        </div>

        <h2 class="recipe-title">${recipe.title}</h2>

        <div class="recipe-meta">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" /></svg>
            <span>${recipe.prepTime}</span>
          </div>
          <div class="recipe-icons">
            ${recipe.isGlutenFree ? '<span class="icon-tag gf" title="Sans Gluten">GF</span>' : ''}
            ${recipe.isVegan ? '<span class="icon-tag v" title="Vegan">V</span>' : ''}
          </div>
        </div>

        <div class="recipe-content">
          <div style="margin-bottom:15px;">
            <strong style="color:#1e293b; font-size:0.95rem;">Ingrédients :</strong>
            <p class="small-text">${recipe.ingredients.join(', ')}</p>
          </div>

          <button class="btn-details" data-id="${recipe.id}">Voir les étapes</button>

          <div id="steps-${recipe.id}" class="steps-hidden" style="display:none;">
            <ol>
              ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        </div>
      `;

      card.querySelector('.btn-details').onclick = (e) => {
        const id = e.target.dataset.id;
        const stepsDiv = document.getElementById(`steps-${id}`);
        const isHidden = stepsDiv.style.display === 'none';
        stepsDiv.style.display = isHidden ? 'block' : 'none';
        e.target.textContent = isHidden ? 'Masquer les étapes' : 'Voir les étapes';
      };

      recipeContainer.appendChild(card);
    });
  }

  function renderSettings() {
    tabSettings.innerHTML = '';

    // Main Settings Container
    const settingsContainer = document.createElement('div');
    settingsContainer.style.cssText = 'display:flex; flex-direction:column; gap:15px; padding-bottom:30px;';

    // --- 1. Cycle Menstruel Accordion ---
    const cycleDetails = document.createElement('details');
    cycleDetails.className = 'card meal-accordion-card';
    if (!userSettings) cycleDetails.open = true;

    const cycleSummary = document.createElement('summary');
    cycleSummary.style.cssText = 'font-weight:700; font-size:1.1rem; color:#5d5a55; display:flex; justify-content:space-between; align-items:center; outline:none; cursor:pointer; list-style:none; padding:10px 0;';
    cycleSummary.innerHTML = `<span>Cycle menstruel</span>`;

    const cycleContent = document.createElement('div');
    cycleContent.style.marginTop = '20px';
    cycleContent.innerHTML = `
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
      <button id="btn-save-setup" class="primary" style="width: 100%;">Enregistrer le cycle</button>
    `;

    cycleDetails.appendChild(cycleSummary);
    cycleDetails.appendChild(cycleContent);
    settingsContainer.appendChild(cycleDetails);

    // --- 2. Suivi Alimentaire Accordion ---
    const foodDetails = document.createElement('details');
    foodDetails.className = 'card meal-accordion-card';

    const foodSummary = document.createElement('summary');
    foodSummary.style.cssText = 'font-weight:700; font-size:1.1rem; color:#5d5a55; display:flex; justify-content:space-between; align-items:center; outline:none; cursor:pointer; list-style:none; padding:10px 0;';
    foodSummary.innerHTML = `<span>Suivi alimentaire</span>`;

    const foodContent = document.createElement('div');
    foodContent.style.marginTop = '20px';
    foodContent.innerHTML = `
      <button id="btn-show-food-form" class="primary" style="width:100%; margin-bottom:15px; background:var(--bg-card); color:var(--primary); border:2px solid var(--primary);">+ Ajouter un aliment</button>
      <div id="new-food-form-container" style="display:none; background:#f8fafc; padding:20px; border-radius:20px; border:1px solid #e2e8f0;">
        <h4 style="margin-bottom:15px; color:#475569;">Création d'aliment</h4>
        <input type="text" id="new-food-name" placeholder="Nom de l'aliment" style="width:100%; padding:12px; margin-bottom:15px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit'; font-weight:600;">
        <label style="font-size:0.85rem; font-weight:700; color:#64748b; margin-bottom:5px; display:block;">Impact inflammatoire</label>
        <select id="new-food-type" style="width:100%; padding:12px; margin-bottom:15px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit';">
          <option value="anti-inflammatoire">Anti-inflammatoire</option>
          <option value="neutre" selected>Neutre</option>
          <option value="pro-inflammatoire">Pro-inflammatoire</option>
          <option value="inflammatoire">Inflammatoire</option>
        </select>
        <label style="font-size:0.85rem; font-weight:700; color:#64748b; margin-bottom:5px; display:block;">Catégorie principale</label>
        <select id="new-food-category" style="width:100%; padding:12px; margin-bottom:15px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit';">
          <option value="legume">Légume</option>
          <option value="fruit">Fruit</option>
          <option value="feculent">Féculent</option>
          <option value="proteine">Protéine</option>
          <option value="laitage">Laitage</option>
          <option value="graine">Graine / Fruit sec</option>
          <option value="assaisonnement">Assaisonnement</option>
          <option value="boisson">Boisson</option>
          <option value="autre">Autre</option>
        </select>
        <label style="display:flex; align-items:center; gap:10px; margin-bottom:20px; font-weight:600; color:#475569;">
          <input type="checkbox" id="new-food-glutenfree" style="width:20px; height:20px; accent-color:var(--primary);">
          Sans gluten
        </label>
        <button id="btn-save-food" class="primary" style="width:100%;">Ajouter à la base de données</button>
      </div>
    `;

    foodDetails.appendChild(foodSummary);
    foodDetails.appendChild(foodContent);
    settingsContainer.appendChild(foodDetails);

    // --- 3. Mes Recettes Accordion ---
    const recipeSettingsDetails = document.createElement('details');
    recipeSettingsDetails.className = 'card meal-accordion-card';

    const recipeSettingsSummary = document.createElement('summary');
    recipeSettingsSummary.style.cssText = 'font-weight:700; font-size:1.1rem; color:#5d5a55; display:flex; justify-content:space-between; align-items:center; outline:none; cursor:pointer; list-style:none; padding:10px 0;';
    recipeSettingsSummary.innerHTML = `<span>Mes Recettes</span>`;

    const recipeSettingsContent = document.createElement('div');
    recipeSettingsContent.style.marginTop = '20px';
    recipeSettingsContent.innerHTML = `
      <button id="btn-show-recipe-form" class="primary" style="width:100%; margin-bottom:15px; background:var(--bg-card); color:var(--primary); border:2px solid var(--primary);">+ Créer une recette</button>
      <div id="new-recipe-form-container" style="display:none; background:#f8fafc; padding:20px; border-radius:20px; border:1px solid #e2e8f0;">
        <h4 style="margin-bottom:15px; color:#475569;">Nouvelle Recette</h4>
        <input type="text" id="recipe-title" placeholder="Nom de la recette" style="width:100%; padding:12px; margin-bottom:12px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit'; font-weight:600;">
        <select id="recipe-type" style="width:100%; padding:12px; margin-bottom:12px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit';">
          <option value="Petit-déjeuner">Petit-déjeuner</option>
          <option value="Déjeuner" selected>Déjeuner</option>
          <option value="Dîner">Dîner</option>
          <option value="Collation / Goûter">Collation / Goûter</option>
        </select>
        <input type="text" id="recipe-prep" placeholder="Temps (ex: 15 min)" style="width:100%; padding:12px; margin-bottom:12px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit';">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
          <label><input type="checkbox" id="recipe-gf"> GF</label>
          <label><input type="checkbox" id="recipe-vegan"> Vegan</label>
          <label><input type="checkbox" id="recipe-perfect"> Parfaite ✨</label>
        </div>
        <textarea id="recipe-ingredients" placeholder="Ingrédients (virgule)" style="width:100%; padding:12px; margin-bottom:12px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit'; min-height:80px;"></textarea>
        <textarea id="recipe-steps" placeholder="Étapes (une par ligne)" style="width:100%; padding:12px; margin-bottom:15px; border-radius:12px; border:1px solid #cbd5e1; font-family:'Outfit'; min-height:100px;"></textarea>
        <button id="btn-save-recipe" class="primary" style="width:100%;">Enregistrer la recette</button>
      </div>
    `;

    recipeSettingsDetails.appendChild(recipeSettingsSummary);
    recipeSettingsDetails.appendChild(recipeSettingsContent);
    settingsContainer.appendChild(recipeSettingsDetails);

    tabSettings.appendChild(settingsContainer);

    // --- LISTENERS (DÉLÉGATION ET ACTIONS) ---

    // 1. Sauvegarde Cycle
    cycleContent.querySelector('#btn-save-setup').addEventListener('click', () => {
      userSettings = {
        cycleStart: document.getElementById('setup-date').value,
        cycleLength: parseInt(document.getElementById('setup-cycle').value),
        periodLength: parseInt(document.getElementById('setup-period').value)
      };
      saveData();
      showSimplePopup("Succès", "Configuration du cycle enregistrée.", "#4ade80");
      switchToTab('tab-daily-notes');
      renderDailyNotes();
    });

    // 2. Gestion Aliment (Toggle Form et Save)
    const btnShowFoodForm = foodContent.querySelector('#btn-show-food-form');
    const foodFormContainer = foodContent.querySelector('#new-food-form-container');
    btnShowFoodForm.addEventListener('click', () => {
      const isHidden = foodFormContainer.style.display === 'none';
      foodFormContainer.style.display = isHidden ? 'block' : 'none';
      btnShowFoodForm.textContent = isHidden ? 'Fermer le formulaire' : '+ Ajouter un aliment';
    });

    foodContent.querySelector('#btn-save-food').addEventListener('click', () => {
      const nameInput = document.getElementById('new-food-name');
      const nameVal = nameInput.value.trim();
      if (!nameVal) {
        showSimplePopup("Erreur", "Veuillez renseigner le nom.", "#f43f5e");
        return;
      }
      const newFood = {
        name: nameVal,
        type: document.getElementById('new-food-type').value,
        glutenfree: document.getElementById('new-food-glutenfree').checked,
        [document.getElementById('new-food-category').value]: true
      };
      foodDatabase.push(newFood);
      let sysCustomFoods = JSON.parse(localStorage.getItem('endocuteCustomFoods')) || [];
      sysCustomFoods.push(newFood);
      localStorage.setItem('endocuteCustomFoods', JSON.stringify(sysCustomFoods));
      showSimplePopup("Succès", `"${nameVal}" ajouté !`, "#4ade80");
      nameInput.value = '';
      foodFormContainer.style.display = 'none';
      btnShowFoodForm.textContent = '+ Ajouter un aliment';
    });

    // 3. Gestion Recette (Toggle Form et Save)
    const btnShowRecipeForm = recipeSettingsContent.querySelector('#btn-show-recipe-form');
    const recipeFormContainer = recipeSettingsContent.querySelector('#new-recipe-form-container');
    btnShowRecipeForm.addEventListener('click', () => {
      const isHidden = recipeFormContainer.style.display === 'none';
      recipeFormContainer.style.display = isHidden ? 'block' : 'none';
      btnShowRecipeForm.textContent = isHidden ? 'Fermer le formulaire' : '+ Créer une recette';
    });

    recipeSettingsContent.querySelector('#btn-save-recipe').addEventListener('click', () => {
      const title = document.getElementById('recipe-title').value.trim();
      if (!title) {
        showSimplePopup("Erreur", "Veuillez remplir le titre.", "#f43f5e");
        return;
      }
      const newRecipe = {
        id: Date.now(),
        title,
        type: document.getElementById('recipe-type').value,
        prepTime: document.getElementById('recipe-prep').value || "N/A",
        isGlutenFree: document.getElementById('recipe-gf').checked,
        isVegan: document.getElementById('recipe-vegan').checked,
        isPerfectRecipe: document.getElementById('recipe-perfect').checked,
        ingredients: document.getElementById('recipe-ingredients').value.split(',').map(i => i.trim()).filter(i => i),
        steps: document.getElementById('recipe-steps').value.split('\n').map(s => s.trim()).filter(s => s)
      };
      customRecipes.push(newRecipe);
      fullRecipeDatabase = [...staticRecipes, ...customRecipes];
      saveData();
      showSimplePopup("Succès", `Recette "${title}" enregistrée !`, "#4ade80");
      recipeFormContainer.style.display = 'none';
      btnShowRecipeForm.textContent = '+ Créer une recette';
    });

  } // <--- C'EST CETTE ACCOLADE QUI FERME LA FONCTION PRINCIPALE

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
    for (let i = 1; i <= userSettings.cycleLength; i++) {
      const angle = (i - 1) * (360 / userSettings.cycleLength) - 90;
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
      if (confirm("Démarrer un nouveau cycle aujourd'hui ?")) {
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
      if (speechBubble.classList.contains('visible')) {
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
        if (todayEntry.moods.includes(m)) {
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
      [1, 2, 3, 4, 5].forEach((v, idx) => {
        const isSel = todayEntry.symptomLevels[p.key] === v;
        painHTML += `<button class="pain-btn" data-type="${p.key}" data-val="${v}" style="width:45px; height:45px; border-radius:50%; border:${isSel ? '2px solid #ffb3c6' : 'none'}; background:${grads[idx]}; opacity:${isSel ? 1 : 0.6}; transform:${isSel ? 'scale(1.1)' : 'scale(1)'}; cursor:pointer; font-weight:800;">${v}</button>`;
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
      const s = b.dataset.symptom; if (todayEntry.symptoms.includes(s)) todayEntry.symptoms = todayEntry.symptoms.filter(x => x !== s); else todayEntry.symptoms.push(s); saveData(); renderDailyNotes();
    }));
    document.getElementById('btn-add-symptom')?.addEventListener('click', () => {
      const v = document.getElementById('custom-symptom-input').value.trim();
      if (v && !allS.includes(v)) { customSymptoms.push(v); todayEntry.symptoms.push(v); saveData(); renderDailyNotes(); }
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
      // On s'assure que le container est en position relative pour le bouton en haut à droite
      container.style.cssText = "background:transparent; padding:0; position:relative; display:block;";

      // --- 1. BOUTON LÉGENDE (EN HAUT À DROITE) ---
      const helpBtn = document.createElement('div');
        helpBtn.innerHTML = "?";
        helpBtn.style.cssText = `
          position: absolute;
          top: -33px;
          right: 0;
              width: 22px;
              height: 22px;
              background: #f1f5f9;
              color: #94a3b8;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: bold;
              cursor: pointer;
              z-index: 10;
              transition: all 0.2s ease;
              border: 1.5px solid #e2e8f0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              outline: none;
              -webkit-tap-highlight-color: transparent;
              user-select: none;
            `;

       helpBtn.onclick = (e) => {
       e.preventDefault();
        const legendContent = `
          <div style="text-align:left; font-size:14px;">
            <div style="display:flex; align-items:center; margin-bottom:10px;">
              <div style="width:12px; height:12px; background:linear-gradient(#bef264, #166534); border-radius:3px; margin-right:10px;"></div>
              <span><b>Habitudes :</b> Score quotidien (0-100%)</span>
            </div>
            <div style="display:flex; align-items:center; margin-bottom:10px;">
              <div style="width:12px; height:2px; background:#60a5fa; margin-right:10px; border-top:2px dashed #60a5fa;"></div>
              <span><b>Fatigue</b)</span>
            </div>
            <div style="display:flex; align-items:center; margin-bottom:10px;">
              <div style="width:12px; height:2px; background:#f43f5e; margin-right:10px; border-top:2px dashed #f43f5e;"></div>
              <span><b>Douleurs</b>)</span>
            </div>
            <div style="display:flex; align-items:center; margin-bottom:10px;">
              <div style="width:12px; height:2px; background:#fb923c; margin-right:10px; border-top:2px dashed #fb923c;"></div>
              <span><b>Inconfort digestif</b)</span>
            </div>
            <p style="font-size:12px; color:#94a3b8; margin-top:15px; border-top:1px solid #f1f5f9; pt:10px;">
              Les lignes horizontales grises représentent les niveaux d'intensité de 1 à 5.
            </p>
          </div>
        `;
        showSimplePopup("Légende", legendContent, "#166534");
      };
      container.appendChild(helpBtn);

      // --- 2. SETUP DU GRAPHIQUE ---
      const graphHeight = 150;
      const graphInner = document.createElement('div');
      graphInner.style.cssText = `display:flex; align-items:flex-end; height:${graphHeight}px; width:100%; gap:6px; position:relative; z-index:1;`;

      const svgNS = "http://www.w3.org/2000/svg";
      const svgLayer = document.createElementNS(svgNS, "svg");
      svgLayer.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5; overflow:visible;`;

      // Animation de l'étoile
      const styleId = 'history-graph-styles';
      if (!document.getElementById(styleId)) {
        const styleBlock = document.createElement('style');
        styleBlock.id = styleId;
        styleBlock.textContent = `
          @keyframes starPopIn {
            0% { transform: translate(-50%, 0) scale(0); opacity: 0; }
            60% { transform: translate(-50%, -18px) scale(1.4); opacity: 1; }
            100% { transform: translate(-50%, -12px) scale(1); opacity: 1; }
          }
          .gamification-star { animation: starPopIn 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; animation-delay: 1s; }
        `;
        document.head.appendChild(styleBlock);
      }

      // LIGNES D'ÉCHELLE (Niveaux 1 à 5)
      for (let lvl = 1; lvl <= 5; lvl++) {
        const yPos = graphHeight - (((lvl - 1) / 4) * (graphHeight * 0.75) + (graphHeight * 0.12));
        const gridLine = document.createElement('div');
        gridLine.style.cssText = `position: absolute; left: 0; width: 100%; top: ${yPos}px; height: 1px; background: #f1f5f9; z-index: 0;`;
        container.appendChild(gridLine);
      }

      const symptomsConfig = [
        { key: 'fatigue', color: '#60a5fa' },
        { key: 'pelvic', color: '#f43f5e' },
        { key: 'discomfort', color: '#fb923c' }
      ];

      const pointsData = { fatigue: [], pelvic: [], discomfort: [] };

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('sv-SE');
        const entry = appData.history.find(e => e.date === dateStr);

        let scoreTotal = 0;
        // ... Calcul du scoreTotal (logique existante) ...
        if (entry && entry.diet) {
          let totalChecked = 0, totalPossible = 0;
          const taskPaths = [entry.diet.goals, entry.diet.weeklyGoals, entry.diet.activityGoals];
          taskPaths.forEach(path => { if (path) { const t = Object.values(path); totalChecked += t.filter(v=>v===true).length; totalPossible += t.length; }});
          if (totalPossible > 0) scoreTotal += (totalChecked / totalPossible) * 75;
          let veg = 0;
          if (entry.diet.meals) {
            Object.values(entry.diet.meals).forEach(m => {
              if (m.categories) Object.values(m.categories).flat().forEach(item => {
                const f = foodDatabase.find(food => food.name === (typeof item === 'object' ? item.name : item));
                if (f && (f.legume || f.fruit)) veg += (typeof item === 'object' ? (parseInt(item.qty) || 1) : 1);
              });
            });
          }
          scoreTotal += Math.min((veg / 5) * 25, 25);
        }

        const dayWrapper = document.createElement('div');
        dayWrapper.className = "graph-day-column";
        dayWrapper.style.cssText = `flex:1; height:100%; display:flex; flex-direction:column; justify-content:flex-end; position:relative; z-index:2;`;

        const barFill = document.createElement('div');
        barFill.style.cssText = `
          width:100%; height:0%; background:linear-gradient(180deg, #bef264 0%, #166534 100%);
          border-radius:2px 2px 0 0; transition:height 0.8s ease-out; opacity:0.6;
          border-bottom: 1px solid white; box-sizing: border-box; position:relative;
        `;

        // Étoile de récompense si score max
        if (scoreTotal >= 100) {
          const star = document.createElement('div');
          star.className = 'gamification-star';
          star.innerHTML = '⭐';
          star.style.cssText = "position:absolute; top:0; left:50%; font-size:16px; opacity:0; z-index:10; pointer-events:none; text-shadow:0 1px 3px rgba(0,0,0,0.2);";
          barFill.appendChild(star);
        }

        const baseLine = document.createElement('div');
        baseLine.style.cssText = `width:100%; height:2px; background:${scoreTotal > 0 ? '#166534' : '#e2e8f0'}; border-radius:1px;`;

        dayWrapper.appendChild(barFill);
        dayWrapper.appendChild(baseLine);
        graphInner.appendChild(dayWrapper);

        setTimeout(() => { barFill.style.height = scoreTotal > 0 ? `${Math.max(scoreTotal, 5)}%` : '0%'; }, (6 - i) * 60);

        if (entry && entry.symptomLevels) {
          symptomsConfig.forEach(s => {
            if (entry.symptomLevels[s.key]) {
              const val = entry.symptomLevels[s.key];
              const yPos = graphHeight - (((val - 1) / 4) * (graphHeight * 0.75) + (graphHeight * 0.12));
              pointsData[s.key].push({ dayIndex: 6-i, y: yPos });
            }
          });
        }
      }

      container.appendChild(graphInner);
      graphInner.appendChild(svgLayer);

      // --- TRACÉ DES LIGNES ET POINTS ---
      setTimeout(() => {
        const dayCols = graphInner.querySelectorAll('.graph-day-column');
        if (!dayCols.length) return;
        const colW = dayCols[0].offsetWidth;
        const gap = 6;
        const fullStep = colW + gap;

        symptomsConfig.forEach(s => {
          const pts = pointsData[s.key];
          if (pts.length < 2) return;
          const coords = pts.map(p => ({ x: p.dayIndex * fullStep + (colW / 2), y: p.y }));

          let d = `M ${coords[0].x - (colW / 2)} ${coords[0].y} L ${coords[0].x} ${coords[0].y}`;
          for (let i = 0; i < coords.length - 1; i++) {
            const midX = (coords[i].x + coords[i + 1].x) / 2;
            d += ` C ${midX} ${coords[i].y}, ${midX} ${coords[i + 1].y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
          }

          const path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", d);
          path.setAttribute("stroke", s.color);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-width", "1.5");
          path.setAttribute("opacity", "0.9");
          path.setAttribute("stroke-dasharray", "4, 4");
          svgLayer.appendChild(path);

          coords.forEach(coord => {
            const dot = document.createElementNS(svgNS, "circle");
            dot.setAttribute("cx", coord.x); dot.setAttribute("cy", coord.y); dot.setAttribute("r", "2.5");
            dot.setAttribute("fill", s.color); dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "1");
            svgLayer.appendChild(dot);
          });
        });
      }, 300);
    }

  function renderHistoryNotes() {
      const container = document.getElementById('history-notes-container');
      if (!container) return;
      container.innerHTML = "";

      const sortedHistory = [...appData.history]
          .filter(entry => {
              const hasMood = (entry.moods && entry.moods.length > 0);
              const hasSymptoms = (entry.symptoms && entry.symptoms.length > 0);
              const hasLevels = entry.symptomLevels && Object.values(entry.symptomLevels).some(v => v !== null);
              return hasMood || hasSymptoms || hasLevels;
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (sortedHistory.length === 0) {
          container.innerHTML = "<p style='text-align:center; color:gray; padding:20px;'>Aucune note enregistrée.</p>";
          return;
      }

      const masterDetails = document.createElement('details');
      masterDetails.className = 'master-history-details';
      masterDetails.innerHTML = `<summary class="master-summary">Voir les notes récapitulatives</summary>`;

      const listContainer = document.createElement('div');
      listContainer.className = 'history-list-inner';

      sortedHistory.forEach(entry => {
          const [year, month, day] = entry.date.split('-');
          const shortDate = `${day}/${month}/${year.slice(-2)}`;

          // --- SCORES (Ronds) ---
          const levels = entry.symptomLevels || {};
          let scoresHTML = '<div class="history-score-circles">';
          const configs = [{k:'fatigue',c:'fatigue'},{k:'pelvic',c:'pain'},{k:'discomfort',c:'digest'}];
          configs.forEach(conf => {
              const val = levels[conf.k];
              if (val && val > 0) scoresHTML += `<span class="score-circle circle-${conf.c}-${val}">${val}</span>`;
          });
          scoresHTML += '</div>';

          // --- TRI ALIMENTS VS BOISSONS VIA DATABASE ---
          let foodCounts = {};
          let drinkCounts = {};

          if (entry.diet && entry.diet.meals) {
              Object.values(entry.diet.meals).forEach(meal => {
                  if (meal.categories) {
                      Object.values(meal.categories).forEach(items => {
                          items.forEach(item => {
                              if (!item) return;
                              let name = typeof item === 'object' ? item.name : item;
                              let qty = typeof item === 'object' ? (parseInt(item.qty) || 1) : 1;

                              // Nettoyage si format texte ancien
                              if (typeof item === 'string') {
                                  const match = item.match(/^(.*)\s\((\d+)\)$/);
                                  if (match) { name = match[1].trim(); qty = parseInt(match[2]); }
                              }
                              name = name.trim();

                              // VERIFICATION DANS LA DATABASE
                              // On cherche l'aliment dans foodDatabase ou staticRecipes
                              const db = (typeof foodDatabase !== 'undefined') ? foodDatabase : (typeof staticRecipes !== 'undefined' ? staticRecipes : []);
                              const foodInfo = db.find(f => (f.name || f.title) === name);

                              // Est-ce une boisson ? (On vérifie la propriété boisson ou le type)
                              const isDrink = foodInfo && (foodInfo.boisson === true || foodInfo.type === 'Boisson');

                              if (isDrink) {
                                  drinkCounts[name] = (drinkCounts[name] || 0) + qty;
                              } else {
                                  foodCounts[name] = (foodCounts[name] || 0) + qty;
                              }
                          });
                      });
                  }
              });
          }

          const formatList = (obj) => Object.entries(obj)
              .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
              .join(', ');

          const drinksText = formatList(drinkCounts);
          const foodsText = formatList(foodCounts);

          let dietHTML = "";
          if (drinksText) dietHTML += `<div class="history-diet-row"><strong>☕ Boissons :</strong> ${drinksText}</div>`;
          if (foodsText) dietHTML += `<div class="history-diet-row"><strong>🍴 Aliments :</strong> ${foodsText}</div>`;

          // --- RENDU ---
          const dayDetails = document.createElement('details');
          dayDetails.className = 'history-day-item';
          dayDetails.innerHTML = `
              <summary class="day-summary">
                  <span class="history-date">${shortDate}</span>
                  ${scoresHTML}
              </summary>
              <div class="day-content">
                  <div class="tag-group">${(entry.moods || []).map(m => `<span class="tag mood">${m}</span>`).join('')}</div>
                  <div class="tag-group">${(entry.symptoms || []).map(s => `<span class="tag symp">${s}</span>`).join('')}</div>
                  <div class="history-food-list">${dietHTML}</div>
              </div>
          `;
          listContainer.appendChild(dayDetails);
      });

      masterDetails.appendChild(listContainer);
      container.appendChild(masterDetails);
  }

  function renderTaskConsole(container, entry) {
    // 1. On s'assure que la structure existe DIRECTEMENT dans l'entry (l'historique)
    if (!entry.diet) entry.diet = { meals: {}, goals: {} };
    if (!entry.goals) entry.goals = {}; // On centralise ici pour le graphique

    // On synchronise les références pour que modifier 'goals' modifie 'entry'
    const goals = {
      diet: entry.diet.goals || {},
      omega: entry.diet.weeklyGoals || {}, // Garde tes noms actuels
      sport: entry.diet.activityGoals || {}
    };

    const taskCard = document.createElement('div');
    taskCard.style.cssText = `background-color: #fdfaf5; border-radius: 25px; padding: 22px; margin: 0 -10px 25px -10px; border: 1px solid #f1ece4; box-shadow: 0 4px 12px rgba(0,0,0,0.02);`;

    const header = document.createElement('div');
    header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px;`;
    header.innerHTML = `<h3 style="margin:0; font-size:1.15rem; color:#5d5a55; font-weight:800;">Objectifs du jour</h3>`;

    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `display: flex; gap: 4px; background: #f1ece4; padding: 4px; border-radius: 14px;`;

    const tabs = [{ id: 'diet', icon: '🍽️' }, { id: 'omega', icon: '🌻' }, { id: 'sport', icon: '🏃' }];
    let currentTab = 'diet';
    const listBody = document.createElement('div');

    const renderList = (tabId) => {
      listBody.innerHTML = '';
      const currentGoals = goals[tabId];

      Object.entries(currentGoals).forEach(([taskText, isChecked]) => {
        const item = document.createElement('label');
        item.style.cssText = `display:flex; align-items:center; gap:14px; margin-bottom:14px; cursor:pointer;`;
        item.innerHTML = `
                <input type="checkbox" ${isChecked ? 'checked' : ''} style="width:22px; height:22px; accent-color:#9d4edd; cursor:pointer;">
                <span style="font-size:1rem; font-weight:500; color:#5d5a55; ${isChecked ? 'text-decoration:line-through; opacity:0.3;' : ''}">${taskText}</span>
            `;

        item.querySelector('input').onchange = (e) => {

          if (tabId === 'diet') entry.diet.goals[taskText] = e.target.checked;
          if (tabId === 'omega') entry.diet.weeklyGoals[taskText] = e.target.checked;
          if (tabId === 'sport') entry.diet.activityGoals[taskText] = e.target.checked;

          saveData(); // Sauvegarde l'état global de appData
          renderList(tabId);

          if (typeof renderHistoryGraph === 'function') renderHistoryGraph();
        };
        listBody.appendChild(item);
      });
    };
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.innerHTML = tab.icon;
        btn.style.cssText = `background: ${tab.id === currentTab ? 'white' : 'transparent'}; border: none; border-radius: 10px; cursor: pointer; padding: 8px 14px; transition: all 0.2s ease; font-size: 1.2rem;`;
        btn.onclick = () => {
          currentTab = tab.id;
          tabContainer.querySelectorAll('button').forEach((b, i) => {
            b.style.background = tabs[i].id === currentTab ? 'white' : 'transparent';
          });
          renderList(currentTab);
        };
        tabContainer.appendChild(btn);
      });

      header.appendChild(tabContainer);
      taskCard.appendChild(header);
      taskCard.appendChild(listBody);
      container.appendChild(taskCard);
      renderList(currentTab);
    }

  // --- INITIALISATION ---
  renderSettings();
  renderDailyNotes();
  renderDietTracking();
  renderRecipes();
  renderHistoryStreaks();
  renderHistoryGraph();
  renderHistoryNotes();
  switchToTab(userSettings ? 'tab-daily-notes' : 'tab-settings');
});