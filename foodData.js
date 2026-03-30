// --- SECTION LÉGUMES ---
// // LÉGUMES PURS (Score 4)
const legumesPurs = [
    { name: "Artichaut", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Asperge", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Aubergine", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Basilic frais", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Blettes", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Brocolis", type: "pro-inflammatoire", scores: { legume: 4 } },
    { name: "Carotte (cuite)", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Céléri", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Champignons", type: "pro-inflammatoire", scores: { legume: 4 } },
    { name: "Chou-fleur", type: "pro-inflammatoire", scores: { legume: 4 } },
    { name: "Concombre", type: "neutre", scores: { legume: 4 } },
    { name: "Courgette", type: "neutre", scores: { legume: 4 } },
    { name: "Courge butternut", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Courge spaghetti", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Épinards", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Fenouil", type: "neutre", scores: { legume: 4 } },
    { name: "Haricot vert", type: "neutre", scores: { legume: 4 } },
    { name: "Laitue", type: "neutre", scores: { legume: 4 } },
    { name: "Mâche", type: "neutre", scores: { legume: 4 } },
    { name: "Panais", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Poivron", type: "neutre", scores: { legume: 4 } },
    { name: "Potimarron", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Radis", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Roquette", type: "neutre", scores: { legume: 4 } },
    { name: "Rutabaga", type: "anti-inflammatoire", scores: { legume: 4 } },
    { name: "Tomate", type: "neutre", scores: { legume: 4 } },
    { name: "Navets", type: "neutre", scores: { legume: 4 } },
    { name: "Poireau", type: "neutre", scores: { legume: 4 } }, // Ajout
    { name: "Chou Kale", type: "neutre", scores: { legume: 4 } }  // Ajout
];

// // LÉGUMES MIXTES (Partagés avec Protéines, Féculents ou Omega3)
const legumesMixes = [
    { name: "Avocat", type: "anti-inflammatoire", scores: { legume: 3, omega3: 1 } },
    { name: "Lentilles", type: "anti-inflammatoire", scores: { legume: 2, proteine: 2 } },
    { name: "Pois chiches", type: "inflammatoire", scores: { legume: 2, proteine: 2 } },
    { name: "Lentilles corail", type: "anti-inflammatoire", scores: { legume: 2, feculent: 2 } },
    { name: "Petit pois", type: "neutre", scores: { legume: 2, feculent: 2 } }, // Ajout
    { name: "Fèves", type: "anti-inflammatoire", scores: { legume: 2, proteine: 2 } }, // Ajout
    { name: "Ail (cuit)", type: "pro-inflammatoire", scores: { legume: 1 } }, // Condiment : score faible
    { name: "Oignon (cuit)", type: "pro-inflammatoire", scores: { legume: 1 } }
];

// --- SECTION FRUITS ---
// // FRUITS PURS (Score 4)
const fruitsPurs = [
    { name: "Abricot", type: "neutre", scores: { fruit: 4 } },
    { name: "Ananas", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Clémentine", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Citron", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Fraise", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Grenade", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Kiwi", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Mandarine", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Rhubarbe", type: "neutre", scores: { fruit: 4 } },
    { name: "Banane", type: "neutre", scores: { fruit: 4 } },
    { name: "Cassis", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Cerise", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Melon", type: "neutre", scores: { fruit: 4 } },
    { name: "Myrtille", type: "anti-inflammatoire", scores: { fruit: 4 } },
    { name: "Pêche", type: "neutre", scores: { fruit: 4 } },
    { name: "Pomme", type: "neutre", scores: { fruit: 4 } },
    { name: "Poire", type: "neutre", scores: { fruit: 4 } },
    { name: "Raisin", type: "neutre", scores: { fruit: 4 } },
    { name: "Framboise", type: "anti-inflammatoire", scores: { fruit: 4 } } // Ajout
];

// // FRUITS MIXTES (Partagés avec Omega3 ou Graines)
const fruitsMixes = [
    { name: "Amande", type: "anti-inflammatoire", scores: { fruit: 2, omega3: 2 } },
    { name: "Noix", type: "anti-inflammatoire", scores: { fruit: 1, omega3: 3 } },
    { name: "Figue (sèche)", type: "anti-inflammatoire", scores: { fruit: 3, fibre: 1 } },
    { name: "Baies de Goji", type: "anti-inflammatoire", scores: { fruit: 3, omega3: 1 } }, // Ajout
    { name: "Noisette", type: "anti-inflammatoire", scores: { fruit: 1, omega3: 3 } } // Ajout
];

// --- SECTION FÉCULENTS ---

// // FÉCULENTS PURS (Score 4 - Principalement des glucides)
const feculentsPurs = [
    { name: "Baguette blanche", type: "pro-inflammatoire", scores: { feculent: 4 } },
    { name: "Pâtes blanches", type: "pro-inflammatoire", scores: { feculent: 4 } },
    { name: "Pâtes sans gluten", type: "neutre", glutenfree: true, scores: { feculent: 4 } },
    { name: "Pâtes de maïs", type: "neutre", glutenfree: true, scores: { feculent: 4 } },
    { name: "Riz basmati", type: "neutre", scores: { feculent: 4 } },
    { name: "Polenta", type: "neutre", glutenfree: true, scores: { feculent: 4 } },
    { name: "Maïs", type: "neutre", glutenfree: true, scores: { feculent: 4 } },
    { name: "Manioc", type: "neutre", glutenfree: true, scores: { feculent: 4 } },
    { name: "Igname", type: "neutre", glutenfree: true, scores: { feculent: 4 } }
];

// // FÉCULENTS MIXTES (Apports en Fibres/Légumes ou Protéines)
const feculentsMixes = [
    // Riches en Fibres / Nutriments (croisement léger avec jauge Légume)
    { name: "Patate douce", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 3, legume: 1 } },
    { name: "Pommes de terre", type: "neutre", glutenfree: true, scores: { feculent: 3, legume: 1 } },
    { name: "Potimarron (en féculent)", type: "anti-inflammatoire", scores: { feculent: 2, legume: 2 } },
    { name: "Châtaigne", type: "neutre", glutenfree: true, scores: { feculent: 3, legume: 1 } },
    { name: "Marron", type: "neutre", glutenfree: true, scores: { feculent: 3, legume: 1 } },
    { name: "Riz complet", type: "anti-inflammatoire", scores: { feculent: 3, legume: 1 } },
    { name: "Riz rouge", type: "anti-inflammatoire", scores: { feculent: 3, legume: 1 } },
    { name: "Riz sauvage", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 3, legume: 1 } },
    { name: "Pain au blé complet", type: "anti-inflammatoire", scores: { feculent: 3, legume: 1 } },
    { name: "Pain de seigle", type: "neutre", scores: { feculent: 3, legume: 1 } },
    { name: "Pain complet au levain", type: "anti-inflammatoire", scores: { feculent: 3, legume: 1 } },
    { name: "Pâtes au blé complet", type: "neutre", scores: { feculent: 3, legume: 1 } },

    // Riches en Protéines Végétales (croisement avec jauge Protéine)
    { name: "Quinoa", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 2, proteine: 2 } },
    { name: "Sarrasin", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 3, proteine: 1 } },
    { name: "Pâtes au sarrasin", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 3, proteine: 1 } },
    { name: "Amarante", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 2, proteine: 2 } },
    { name: "Millet", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 3, proteine: 1 } },
    { name: "Lentilles corail", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 2, proteine: 2 } },
    { name: "Pâtes de lentilles corail", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 2, proteine: 2 } },
    { name: "Pâtes de pois chiches", type: "anti-inflammatoire", glutenfree: true, scores: { feculent: 2, proteine: 2 } }
];

// --- SECTION PROTÉINES ---

// // PROTÉINES PURES (Score 4 - Viandes, Volailles, Soja neutre)
const proteinesPures = [
    { name: "Poulet", type: "neutre", scores: { proteine: 4 } },
    { name: "Boeuf", type: "inflammatoire", scores: { proteine: 4 } },
    { name: "Dinde", type: "neutre", scores: { proteine: 4 } }, // Ajout
    { name: "Veau", type: "neutre", scores: { proteine: 4 } }, // Ajout
    { name: "Crevettes", type: "neutre", scores: { proteine: 4 } },
    { name: "Tofu", type: "neutre", scores: { proteine: 4 } },
    { name: "Tempeh", type: "anti-inflammatoire", scores: { proteine: 4 } },
    { name: "Seitan", type: "neutre", scores: { proteine: 4 } },
    { name: "Protéines de soja texturées", type: "anti-inflammatoire", scores: { proteine: 4 } }, // Ajout
    { name: "Jambon blanc (sans nitrite)", type: "neutre", scores: { proteine: 4 } } // Ajout
];

// // PROTÉINES MIXTES (Partagées avec Oméga-3 ou Laitages)
const proteinesMixes = [
    // Poissons gras (Protéine + Oméga-3)
    { name: "Saumon", type: "anti-inflammatoire", scores: { proteine: 3, omega3: 1 } },
    { name: "Sardine", type: "anti-inflammatoire", scores: { proteine: 2, omega3: 2 } },
    { name: "Maquereau", type: "anti-inflammatoire", scores: { proteine: 2, omega3: 2 } },
    { name: "Hareng", type: "anti-inflammatoire", scores: { proteine: 2, omega3: 2 } },
    { name: "Anchois", type: "anti-inflammatoire", scores: { proteine: 3, omega3: 1 } },
    { name: "Truite", type: "anti-inflammatoire", scores: { proteine: 3, omega3: 1 } },
    { name: "Thon", type: "anti-inflammatoire", scores: { proteine: 3, omega3: 1 } },
    { name: "Dorade", type: "anti-inflammatoire", scores: { proteine: 3, omega3: 1 } },

    // Œufs (Mixte par nature)
    { name: "Oeufs (2 unités)", type: "neutre", scores: { proteine: 3, omega3: 1 } }, // Ajout

    // Croisement Protéine / Laitage (ex: Fromage blanc riche en prot)
    { name: "Skyr", type: "anti-inflammatoire", scores: { proteine: 2, laitage: 2 } }, // Ajout
    { name: "Fromage blanc 0%", type: "neutre", scores: { proteine: 2, laitage: 2 } }  // Ajout
];

// --- SECTION LAITAGES ---

// // LAITAGES PURS (Score 4 - Fromages et Yaourts classiques)
const laitagesPurs = [
    { name: "Yaourt de brebis", type: "neutre", scores: { laitage: 4 } },
    { name: "Yaourt de chèvre", type: "neutre", scores: { laitage: 4 } },
    { name: "Yaourt nature entier", type: "neutre", scores: { laitage: 4 } },
    { name: "Yaourt grec", type: "neutre", scores: { laitage: 4 } },
    { name: "Feta (brebis/chèvre)", type: "neutre", scores: { laitage: 4 } },
    { name: "Chèvre frais", type: "neutre", scores: { laitage: 4 } },
    { name: "Cabécou", type: "neutre", scores: { laitage: 4 } },
    { name: "Ricotta", type: "neutre", scores: { laitage: 4 } },
    { name: "Mozzarella di Bufala", type: "neutre", scores: { laitage: 4 } }, // Ajout

    // Pâtes dures
    { name: "Comté (fromager)", type: "neutre", scores: { laitage: 4 } },
    { name: "Cantal (fromager)", type: "neutre", scores: { laitage: 4 } },
    { name: "Gruyère (fromager)", type: "neutre", scores: { laitage: 4 } },
    { name: "Manchego", type: "neutre", scores: { laitage: 4 } },
    { name: "Pecorino", type: "neutre", scores: { laitage: 4 } },
    { name: "Roquefort (fromager)", type: "neutre", scores: { laitage: 4 } },

    // Industriels
    { name: "Comté (industriel)", type: "inflammatoire", scores: { laitage: 4 } },
    { name: "Cheddar (industriel)", type: "inflammatoire", scores: { laitage: 4 } },
    { name: "Emmental (industriel)", type: "inflammatoire", scores: { laitage: 4 } }
];

// --- SECTION GRAINES & FRUITS SECS ---

// // BOOSTERS NUTRITIONNELS (Score Oméga-3 élevé)
const grainesOmega3 = [
    { name: "Graines de lin moulues", type: "anti-inflammatoire", scores: { omega3: 4 } },
    { name: "Graines de chia", type: "anti-inflammatoire", scores: { omega3: 3 } },
    { name: "Graines de chanvre", type: "anti-inflammatoire", scores: { omega3: 3 } },
    { name: "Noix", type: "anti-inflammatoire", scores: { omega3: 3, fruit: 1 } },
    { name: "Noisette", type: "anti-inflammatoire", scores: { omega3: 2, fruit: 1 } }
];

// // GRAINES & SNACKS (Neutres ou Anti-inflammatoires)
const grainesEtSecs = [
    { name: "Graines de courge", type: "anti-inflammatoire", scores: { omega3: 1, proteine: 1 } },
    { name: "Graines de sésame", type: "anti-inflammatoire", scores: { omega3: 1 } },
    { name: "Graines de tournesol", type: "anti-inflammatoire", scores: { omega3: 1 } },
    { name: "Pistache", type: "anti-inflammatoire", scores: { fruit: 1 } },
    { name: "Noix de cajou", type: "neutre", scores: { fruit: 1 } },
    { name: "Noix de macadamia", type: "neutre", scores: { fruit: 1 } },
    { name: "Cacahuète", type: "neutre", scores: { proteine: 1 } },
    { name: "Figue sèche", type: "anti-inflammatoire", scores: { fruit: 2 } },
    { name: "Raisin sec", type: "neutre", scores: { fruit: 2 } }
];

// --- SECTION CORPS GRAS (HUILES & BEURRES) ---

const huilesEtGraisses = [
    // Riches en Oméga-3 (Boosters)
    { name: "Huile de lin", type: "anti-inflammatoire", scores: { omega3: 4 } },
    { name: "Huile de cameline", type: "anti-inflammatoire", scores: { omega3: 4 } },
    { name: "Huile de périlla", type: "anti-inflammatoire", scores: { omega3: 4 } },
    { name: "Huile de noix", type: "anti-inflammatoire", scores: { omega3: 3 } },
    { name: "Huile de colza (pression à froid)", type: "anti-inflammatoire", scores: { omega3: 3 } },
    { name: "Huile de chanvre", type: "anti-inflammatoire", scores: { omega3: 3 } },

    // Neutres ou Santé (Pas d'oméga-3 mais anti-inflammatoires via polyphénols)
    { name: "Huile d'olive (Vierge Extra)", type: "anti-inflammatoire", scores: { omega3: 0 } },
    { name: "Huile d'avocat", type: "neutre", scores: { omega3: 0 } },
    { name: "Huile de coco", type: "neutre", scores: { omega3: 0 } },
    { name: "Beurre clarifié (Ghee)", type: "neutre", scores: { omega3: 0 } },

    // Pro-inflammatoires (Riches en Oméga-6 ou Saturés)
    { name: "Huile de tournesol", type: "pro-inflammatoire", scores: { omega3: 0 } },
    { name: "Huile de maïs", type: "pro-inflammatoire", scores: { omega3: 0 } },
    { name: "Huile d'arachide", type: "pro-inflammatoire", scores: { omega3: 0 } },
    { name: "Beurre (classique)", type: "inflammatoire", scores: { omega3: 0 } },
    { name: "Huile de palme", type: "inflammatoire", scores: { omega3: 0 } }
];

// --- SECTION CONDIMENTS, SAUCES & ÉPICES ---
// Note : Scores à 0 car ce sont des exhausteurs de goût, pas des piliers de repas.

const condimentsEtSauces = [
    { name: "Guacamole (maison)", type: "anti-inflammatoire", scores: { legume: 1, omega3: 1 } },
    { name: "Hummus (huile olive)", type: "anti-inflammatoire", scores: { proteine: 1 } },
    { name: "Tzatziki", type: "anti-inflammatoire", scores: { laitage: 1 } },
    { name: "Vinaigrette (huile colza/olive)", type: "neutre", scores: { omega3: 2 } },

    // Sauces Inflammatoires (Score 0 partout)
    { name: "Ketchup", type: "pro-inflammatoire", scores: {} },
    { name: "Mayonnaise (industrielle)", type: "pro-inflammatoire", scores: {} },
    { name: "Sauce Roquefort / Fromage", type: "inflammatoire", scores: { laitage: 1 } },
    { name: "Béchamel", type: "inflammatoire", scores: {} },

    // Épices (Toutes à score 0 mais cruciales pour le calcul de l'index inflammatoire global)
    { name: "Curcuma", type: "anti-inflammatoire", scores: {} },
    { name: "Gingembre", type: "anti-inflammatoire", scores: {} },
    { name: "Cannelle", type: "anti-inflammatoire", scores: {} },
    { name: "Harissa", type: "pro-inflammatoire", scores: {} },
    { name: "Piment de Cayenne", type: "pro-inflammatoire", scores: {} },
    { name: "Sel fin raffiné", type: "pro-inflammatoire", scores: {} },
    { name: "Bouillon cube", type: "inflammatoire", scores: {} }
];

// --- SECTION BOISSONS ---

const boissons = [
    // Hydratation pure (Impactent la jauge Eau)
    { name: "Eau", type: "neutre", scores: {} },
    { name: "Chaï latte", type: "neutre", scores: {} },
    { name: "Lupin", type: "neutre", scores: {} },
    { name: "Rooibos", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane camomille", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane mélisse", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane menthe poivrée", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane oranger", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane reine-des-prés", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane tilleul", type: "anti-inflammatoire", scores: {} },
    { name: "Tisane verveine", type: "anti-inflammatoire", scores: {} },

    // Laits végétaux (Considérés comme des substituts de Laitage)
    { name: "Lait amande", type: "neutre", scores: { laitage: 2 } },
    { name: "Lait avoine", type: "neutre", scores: { laitage: 2, feculent: 1 } },
    { name: "Lait coco", type: "neutre", scores: { laitage: 2 } },
    { name: "Lait noisette", type: "anti-inflammatoire", scores: { laitage: 2, omega3: 1 } },
    { name: "Lait soja", type: "neutre", scores: { laitage: 2, proteine: 1 } },
    { name: "Lait riz", type: "neutre", scores: { laitage: 1, feculent: 2 } },

    // Plaisirs et Inflammatoires (Score 0 pour les jauges nutritionnelles)
    { name: "Café", type: "inflammatoire", scores: {} },
    { name: "Café décaféiné", type: "neutre", scores: {} },
    { name: "Thé vert", type: "pro-inflammatoire", scores: {} }, // Note: pro-inflammatoire selon ta liste
    { name: "Thé noir", type: "inflammatoire", scores: {} },
    { name: "Vin rouge", type: "pro-inflammatoire", scores: {} },
    { name: "Vin blanc", type: "inflammatoire", scores: {} },
    { name: "Vin rosé", type: "inflammatoire", scores: {} },
    { name: "Bière", type: "inflammatoire", scores: {} },
    { name: "Alcool", type: "inflammatoire", scores: {} },
    { name: "Soda", type: "inflammatoire", scores: {} },
    { name: "Soupe miso", type: "neutre", scores: { legume: 1 } }
];

// --- SECTION PLATS PRÉPARÉS & SNACKS ---

const platsEtSnacks = [
    // Plats Mixtes (Score divisé entre les catégories)
    { name: "Ratatouille", type: "neutre", scores: { legume: 4 } },
    { name: "Sushi", type: "neutre", scores: { feculent: 2, proteine: 1 } },
    { name: "Gyoza (vapeur)", type: "neutre", scores: { feculent: 2, proteine: 1 } },
    { name: "Couscous (complet)", type: "neutre", scores: { feculent: 2, legume: 2 } },
    { name: "Paella", type: "neutre", scores: { feculent: 2, proteine: 1, legume: 1 } },
    { name: "Pizza (maison)", type: "pro-inflammatoire", scores: { feculent: 2, laitage: 1, legume: 1 } },
    { name: "Quiche", type: "pro-inflammatoire", scores: { feculent: 1, laitage: 2, proteine: 1 } },

    // Plats "Plaisir" (Inflammatoires, scores faibles pour encourager les produits bruts)
    { name: "Pizza (industrielle)", type: "inflammatoire", scores: { feculent: 2 } },
    { name: "Burger (fast-food)", type: "inflammatoire", scores: { feculent: 2, proteine: 1 } },
    { name: "Frites", type: "inflammatoire", scores: { feculent: 2 } },
    { name: "Nems", type: "inflammatoire", scores: { feculent: 1 } },
    { name: "Chips", type: "inflammatoire", scores: {} },

    // Produits sucrés (Score 0 ou Fruit si pertinent)
    { name: "Chocolat noir (>70%)", type: "anti-inflammatoire", scores: { omega3: 1 } },
    { name: "Chocolat au lait", type: "pro-inflammatoire", scores: {} },
    { name: "Biscuits (industriels)", type: "inflammatoire", scores: {} },
    { name: "Viennoiseries", type: "inflammatoire", scores: {} },
    { name: "Glace (artisanale)", type: "neutre", scores: { laitage: 1 } },
    { name: "Croissant", type: "inflammatoire", scores: {} },
    { name: "Pain au chocolat", type: "inflammatoire", scores: {} },

    // Sucres
    { name: "Miel (apiculteur)", type: "anti-inflammatoire", scores: {} },
    { name: "Sirop d'érable", type: "neutre", scores: {} },
    { name: "Sucre de coco", type: "neutre", scores: {} },
    { name: "Sucre", type: "inflammatoire", scores: {} }
];

// --- FUSION DE TOUTES LES CATÉGORIES DANS LA BASE DE DONNÉES FINALE ---

const foodDatabase = [
    ...legumesPurs,
    ...legumesMixes,
    ...fruitsPurs,
    ...fruitsMixes,
    ...feculentsPurs,
    ...feculentsMixes,
    ...proteinesPures,
    ...proteinesMixes,
    ...laitagesPurs,
    ...grainesOmega3,
    ...grainesEtSecs,
    ...huilesEtGraisses,
    ...condimentsEtSauces,
    ...boissons,
    ...platsEtSnacks
];

// Optionnel : Un petit log pour vérifier que tout est bien chargé (à retirer en production)
console.log(`Base de données chargée : ${foodDatabase.length} aliments disponibles.`);