# 🧠 Module AI Training Coach - Documentation

## Vue d'ensemble

Le module **AI Training Coach** utilise Google Gemini (gemini-1.5-flash) pour générer des plannings d'entraînement personnalisés pour les chevaux.

---

## 🎯 Fonctionnalités

### 1. **Génération de planning personnalisé**
- Analyse du profil du cheval (âge, race, poids)
- Adaptation selon la discipline choisie
- Prise en compte du niveau
- Ajustement selon la fréquence souhaitée
- Focus personnalisé

### 2. **Wizard interactif** (4 étapes)
1. **Sélection du cheval**
2. **Choix de la discipline**
3. **Niveau et fréquence**
4. **Objectifs spécifiques**

### 3. **Planning détaillé généré**
- Planning hebdomadaire complet
- Séances divisées en phases (échauffement, travail, récupération)
- Exercices spécifiques par discipline
- Conseils nutritionnels adaptés
- Indicateurs de progression
- Points de vigilance

---

## 📂 Architecture des fichiers

```
src/
├── services/
│   └── geminiService.js          # Service API Gemini
├── hooks/
│   └── useTrainingAI.js          # Hook React pour l'IA
└── pages/
    └── AITrainingCoach.jsx       # Page principale
```

---

## 🔧 Configuration

### Clé API Gemini

La clé est déjà configurée dans `.env` :

```env
VITE_GEMINI_API_KEY=AIzaSyAf4YeqOAAoJBbqLHcnCaIS7Dk3E5_llag
```

⚠️ **Important** : Cette clé est sensible et ne doit JAMAIS être exposée publiquement

---

## 🚀 Utilisation

### Accès à la page

URL de la route : `/ai-coach`

```javascript
// Dans App.jsx
<Route path="ai-coach" element={<AITrainingCoach />} />
```

### Depuis le code

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/ai-coach');
```

---

## 💡 Exemples d'utilisation

### 1. Générer un planning

```javascript
import { useTrainingAI } from '../hooks/useTrainingAI';

function MyComponent() {
  const { generatePlan, loading, trainingPlan } = useTrainingAI();

  const handleGenerate = async () => {
    const result = await generatePlan({
      horse: {
        name: 'Tornado',
        age: 8,
        breed: 'Selle Français',
        estimatedWeight: 520
      },
      discipline: 'CSO',
      level: 'Intermédiaire',
      frequency: 4,
      focus: 'Préparer un concours dans 2 mois'
    });

    if (result.success) {
      console.log('Planning généré:', result.data);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Génération...' : 'Générer'}
    </button>
  );
}
```

### 2. Obtenir des conseils rapides

```javascript
import { generateQuickTips } from '../services/geminiService';

const getTips = async () => {
  const result = await generateQuickTips({
    discipline: 'Dressage',
    exercise: 'Travail des transitions',
    horseName: 'Bella'
  });

  if (result.success) {
    console.log(result.tips);
  }
};
```

### 3. Analyser la progression

```javascript
import { analyzeProgress } from '../services/geminiService';

const analyze = async () => {
  const result = await analyzeProgress({
    horseProfile: { name: 'Tornado', age: 8, discipline: 'CSO' },
    currentGoal: 'Améliorer la technique de saut',
    sessionHistory: [
      { date: '2024-01-15', exercises: ['Barres au sol', 'Cavalettis'], feeling: 'Bon' },
      // ... autres séances
    ]
  });

  if (result.success) {
    console.log('Analyse:', result.data);
  }
};
```

---

## 📊 Format du planning généré

```json
{
  "planningTitle": "Programme CSO - Niveau Intermédiaire",
  "objective": "Préparation concours avec renforcement technique",
  "weeklySchedule": [
    {
      "day": "Lundi",
      "sessionName": "Travail sur le plat",
      "duration": "45 min",
      "intensity": "Moyenne",
      "phases": [
        {
          "name": "Échauffement",
          "duration": "10 min",
          "exercises": ["Marche rênes longues", "Trot enlevé sur cercles"]
        },
        {
          "name": "Travail principal",
          "duration": "25 min",
          "exercises": [
            "Transitions trot-galop",
            "Cercles au galop",
            "Arrêts progressifs"
          ]
        },
        {
          "name": "Retour au calme",
          "duration": "10 min",
          "exercises": ["Étirements d'encolure", "Marche rênes longues"]
        }
      ],
      "tips": "Privilégier la qualité à la quantité. Récompenser souvent."
    }
  ],
  "nutritionAdvice": "Avec 4 séances/semaine, augmentez légèrement la ration de concentrés (+10%)",
  "warnings": "Surveiller les membres après chaque séance. Repos si boiterie.",
  "progressIndicators": [
    "Amélioration de l'équilibre au galop",
    "Réactivité aux transitions",
    "Attitude générale (oreilles, regard)"
  ]
}
```

---

## 🎨 Disciplines supportées

| Discipline | Code | Emoji |
|------------|------|-------|
| Saut d'obstacles | `CSO` | 🏇 |
| Dressage | `Dressage` | 🎭 |
| Concours complet | `Complet` / `CCE` | 🏆 |
| Attelage | `Attelage` | 🐴 |
| Pony Games | `PonyGames` | 🎯 |
| Horse Ball | `HorseBall` | ⚽ |
| Endurance | `Endurance` | 🏃 |
| Galop | `Galop` | 🏁 |
| Trot | `Trot` | 🚜 |
| Loisir/Rando | `Loisir` | 🌄 |

---

## ⚙️ Niveaux disponibles

| Niveau | Code | Description |
|--------|------|-------------|
| Jeune cheval | `Jeune` | Débourrage - 5 ans |
| Intermédiaire | `Intermédiaire` | 6-10 ans, expérience moyenne |
| Confirmé | `Confirmé` | 10+ ans, expérience avancée |
| Compétition | `Competition` | Niveau compétition régulière |

---

## 🔄 Cycle de vie d'une génération

```
1. User sélectionne un cheval
        ↓
2. User choisit discipline + niveau + fréquence
        ↓
3. User décrit son objectif (focus)
        ↓
4. Clic sur "Générer"
        ↓
5. Appel API Gemini avec prompt système
        ↓
6. Gemini génère le planning JSON
        ↓
7. Parsing et validation du JSON
        ↓
8. Affichage du planning dans l'UI
        ↓
9. User peut sauvegarder le planning
        ↓
10. Planning stocké dans localStorage
```

---

## 💾 Stockage

Les plannings générés sont sauvegardés dans `localStorage` :

```javascript
// Clé : ai_training_plans
{
  "id": 1705573200000,
  "horseName": "Tornado",
  "horseId": "abc123",
  "discipline": "CSO",
  "level": "Intermédiaire",
  "plan": { /* Planning complet */ },
  "createdAt": "2024-01-18T10:00:00.000Z"
}
```

---

## 🐛 Gestion des erreurs

Le hook `useTrainingAI` gère automatiquement les erreurs :

```javascript
const { generatePlan, error } = useTrainingAI();

const result = await generatePlan(params);

if (!result.success) {
  console.error('Erreur:', result.error);
  // Afficher un message d'erreur à l'utilisateur
}
```

---

## 🎯 Prompt système

Le prompt système est optimisé pour :
- ✅ Générer des exercices **techniques et précis**
- ✅ Adapter au **poids du cheval** (détecté par IA de pesée)
- ✅ Utiliser le **vocabulaire spécifique** de chaque discipline
- ✅ Retourner un **JSON strict et parsable**
- ✅ Inclure des **conseils de sécurité**

---

## 📈 Améliorations futures possibles

1. **Historique des plannings** : Afficher tous les plannings générés
2. **Suivi de progression** : Marquer les séances effectuées
3. **Ajustements dynamiques** : Modifier le planning en cours
4. **Export PDF** : Imprimer le planning
5. **Partage** : Envoyer à un coach
6. **Intégration calendrier** : Ajouter automatiquement au calendrier
7. **Rappels** : Notifications pour les séances

---

## 🚀 Test rapide

1. Visitez `/ai-coach`
2. Sélectionnez un cheval existant
3. Choisissez une discipline (ex: CSO)
4. Définissez le niveau (ex: Intermédiaire)
5. Réglez la fréquence (ex: 4 séances/semaine)
6. Ajoutez un focus (ex: "Préparer un concours")
7. Cliquez sur "Générer mon planning IA"
8. Admirez le résultat ! 🎉

---

## ⚠️ Limitations

- **Quota API** : Limitée par les quotas Gemini (gratuit = 15 req/min)
- **Dépendance réseau** : Nécessite une connexion internet
- **Temps de réponse** : 2-5 secondes en moyenne
- **Taille du prompt** : Limitée à ~30k caractères

---

## 💰 Coûts (Gemini 1.5 Flash)

| Métrique | Coût | Notes |
|----------|------|-------|
| Input (1M tokens) | Gratuit jusqu'à quota | Puis $0.075 |
| Output (1M tokens) | Gratuit jusqu'à quota | Puis $0.30 |
| Requêtes/min | 15 (gratuit) | 1000 (payant) |

**Estimation** : ~500 tokens par planning → **~3000 plannings gratuits/jour**

---

## 📞 Support

En cas de problème :
1. Vérifier la clé API dans `.env`
2. Consulter la console Chrome pour les erreurs
3. Vérifier les logs du service Gemini
4. Tester avec un prompt simplifié

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Auteur** : Equinox Team
