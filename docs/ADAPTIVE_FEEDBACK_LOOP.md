# 🧠 MODULE ADAPTIVE FEEDBACK LOOP - IA COACH v1.0

## 📋 Vue d'Ensemble

Le module **Adaptive Feedback Loop** transforme l'IA Coach d'un simple générateur statique de planning en un véritable entraîneur réactif qui s'adapte dynamiquement aux performances et au ressenti du cheval.

### Problématique Résolue

**AVANT (V0)** : L'IA génère un planning le lundi et ne le modifie plus jamais, même si le cheval montre des signes de fatigue ou au contraire progresse plus vite que prévu.

**APRÈS (V1)** : Après chaque séance, l'utilisateur saisit le ressenti (RPE - Rating of Perceived Exertion) et l'IA ajuste automatiquement les séances futures pour optimiser la progression tout en évitant le surentraînement.

---

## 🎯 Fonctionnement

### 1. Capture du Feedback Post-Séance

Lorsque l'utilisateur **valide une séance d'entraînement** dans le calendrier, un modal s'affiche pour capturer :

- **RPE (1-10)** : Ressenti de l'intensité réelle de la séance
- **État de récupération** : Frais / Normal / Fatigué / Épuisé
- **Commentaires optionnels** : Observations libres

### 2. Analyse Intelligente

L'IA compare :
- **Charge externe** (intensité prévue) vs **Charge interne** (RPE réel)
- État de récupération du cheval
- Historique des séances précédentes

### 3. Adaptation Automatique

Selon l'algorithme de décision, l'IA peut :

#### 🟢 CASE A : Adaptation Neutre (Conformité)
**Condition** : RPE ≈ Intensité prévue (±1 point)
**Action** : Aucune modification. Le planning est maintenu.
**Message** : "Parfait ! Le cheval encaisse la charge comme prévu."

#### 🟡 CASE B : Adaptation à la Baisse (Récupération forcée)
**Condition** : RPE > Intensité prévue (+2 points ou plus) OU État = "Fatigué"
**Action** :
- Modifier J+1 : Remplacer séance intense par "Active Recovery"
- Décaler la séance clé à J+3
**Message** : "Attention, votre cheval semble marquer le coup. J'ai allégé le programme de demain pour favoriser la surcompensation."

#### 🔴 CASE C : Alerte Rouge (Sécurité)
**Condition** : RPE ≥ 9 OU État = "Épuisé"
**Action** :
- Supprimer toutes les séances intenses pour 72h
- Remplacer par "Repos" ou "Soins"
**Message** : "🚨 Alerte : Indicateurs de fatigue critique. Repos complet conseillé. Surveillez la température et l'appétit."

#### 🔵 CASE D : Adaptation à la Hausse (Optimisation)
**Condition** : RPE < Intensité prévue (-2 points) ET État = "Frais"
**Action** : Augmenter l'intensité ou la durée de J+2 (+10%)
**Message** : "Excellent ! Votre cheval progresse bien. J'ai légèrement augmenté la difficulté pour optimiser sa progression."

---

## 🔧 Implémentation Technique

### Fichiers Modifiés/Créés

```
src/
├── services/
│   └── geminiService.js          ← Nouvelle fonction adaptTrainingPlan()
├── pages/
│   └── Calendar.jsx              ← Modal de feedback + intégration
└── docs/
    └── ADAPTIVE_FEEDBACK_LOOP.md ← Ce fichier
```

### API : `adaptTrainingPlan()`

**Localisation** : `src/services/geminiService.js`

**Signature** :
```javascript
export async function adaptTrainingPlan(params) {
    // params: {
    //   prev_session_intensity: number (1-10),
    //   actual_user_rpe: number (1-10),
    //   horse_recovery_status: string ("Frais" | "Normal" | "Fatigué" | "Épuisé"),
    //   next_sessions_queue: Array (3 prochaines séances),
    //   horse: Object (infos du cheval)
    // }
}
```

**Retour** :
```json
{
  "success": true,
  "data": {
    "analysis_status": "OK" | "WARNING" | "CRITICAL",
    "reasoning": "Explication courte pour le frontend",
    "modifications_applied": boolean,
    "updated_next_sessions": [
      // Sessions J+1, J+2, J+3 mises à jour
    ]
  },
  "generatedAt": "2026-02-07T08:00:00.000Z"
}
```

### Intégration dans Calendar.jsx

**Nouveau State** :
```javascript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [feedbackData, setFeedbackData] = useState({
    rpe: 5,
    recoveryStatus: 'Normal',
    comments: ''
});
```

**Flux de Validation** :
```
1. User clique "Valider" sur une séance
2. Modal de feedback s'affiche
3. User remplit RPE + État de récupération
4. Appel à adaptTrainingPlan() avec les données
5. Mise à jour du planning futur dans localStorage
6. Affichage du message de l'IA
7. Validation de la séance (historique)
```

---

## 📊 Exemples d'Utilisation

### Exemple 1 : Séance trop dure (Adaptation à la baisse)

**Contexte** :
- Séance prévue : Intensité 7/10 (Intervalle haute intensité)
- RPE réel : 9/10
- État : Fatigué

**Décision IA** :
```json
{
  "analysis_status": "WARNING",
  "reasoning": "Le cheval a trouvé la séance plus difficile que prévu. Allègement nécessaire.",
  "modifications_applied": true,
  "updated_next_sessions": [
    {
      "date": "2026-02-08",
      "title": "Récupération Active",
      "intensity": "LOW",
      "description": "Marche en main 20min + Trot léger 15min. Focus détente."
    },
    // J+2 et J+3 ajustés
  ]
}
```

### Exemple 2 : Cheval en forme (Adaptation à la hausse)

**Contexte** :
- Séance prévue : Intensité 6/10 (Dressage technique)
- RPE réel : 3/10
- État : Frais

**Décision IA** :
```json
{
  "analysis_status": "OK",
  "reasoning": "Le cheval est en pleine forme. Augmentation progressive de la charge.",
  "modifications_applied": true,
  "updated_next_sessions": [
    {
      "date": "2026-02-09",
      "title": "Dressage Technique +",
      "intensity": "MEDIUM",
      "duration_min": 66, // +10%
      "description": "Séance technique renforcée avec transitions..."
    }
  ]
}
```

### Exemple 3 : Alerte critique (Sécurité)

**Contexte** :
- Séance prévue : Intensité 5/10
- RPE réel : 10/10
- État : Épuisé

**Décision IA** :
```json
{
  "analysis_status": "CRITICAL",
  "reasoning": "🚨 Fatigue critique détectée. Repos immédiat obligatoire.",
  "modifications_applied": true,
  "updated_next_sessions": [
    {
      "date": "2026-02-08",
      "type": "REST",
      "title": "Repos Complet",
      "description": "Paddock ou box. Surveillance température et appétit."
    },
    {
      "date": "2026-02-09",
      "type": "CARE",
      "title": "Visite Vétérinaire Recommandée"
    }
  ]
}
```

---

## 🎨 Interface Utilisateur

### Modal de Feedback (Design)

```
┌─────────────────────────────────────────┐
│  📊 Comment s'est passée la séance ?    │
├─────────────────────────────────────────┤
│                                         │
│  Intensité ressentie (RPE) :            │
│  ●━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━━━━   │
│  1 (Très facile)        10 (Épuisant)   │
│                                         │
│  État de récupération :                 │
│  ○ Frais  ● Normal  ○ Fatigué  ○ Épuisé │
│                                         │
│  Commentaires (optionnel) :             │
│  ┌─────────────────────────────────┐   │
│  │ Le cheval était un peu chaud... │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Annuler]           [Valider séance]  │
└─────────────────────────────────────────┘
```

### Message de Retour IA

Après validation, afficher un toast/notification avec le message de l'IA :

```
✅ Séance validée !

💬 IA Coach : "Attention, votre cheval semble marquer le coup. 
J'ai allégé le programme de demain pour favoriser la surcompensation."

📅 Planning mis à jour : 2 séances modifiées
```

---

## 🔐 Sécurité et Limites

### Règles de Sécurité Implémentées

1. **Priorité absolue à la sécurité** : En cas de doute (RPE ≥ 9), l'IA impose toujours le repos
2. **Pas de sur-adaptation** : L'IA ne modifie jamais plus de 3 séances à la fois
3. **Validation humaine** : L'utilisateur peut toujours refuser les modifications proposées
4. **Historique** : Toutes les adaptations sont loguées pour traçabilité

### Limitations Actuelles (V1)

- ❌ Pas encore de prise en compte de l'historique long terme (> 7 jours)
- ❌ Pas de détection automatique de patterns (ex: fatigue récurrente le mercredi)
- ❌ Pas d'intégration avec données biométriques (fréquence cardiaque, etc.)

### Roadmap V2

- [ ] Analyse de tendances sur 4 semaines
- [ ] Détection de patterns de fatigue
- [ ] Intégration capteurs biométriques (si disponibles)
- [ ] Recommandations nutritionnelles adaptatives
- [ ] Alertes proactives ("Attention, risque de surentraînement détecté")

---

## 📖 Utilisation

### Pour l'Utilisateur Final

1. **Montez votre cheval** comme prévu dans le planning IA
2. **Après la séance**, allez dans le Calendrier
3. **Cliquez sur "Valider"** sur l'événement de la séance
4. **Remplissez le feedback** : RPE + État de récupération
5. **Validez** : L'IA analyse et adapte automatiquement
6. **Consultez le message** de l'IA pour comprendre les modifications

### Pour les Développeurs

**Appel direct à l'API** :
```javascript
import { adaptTrainingPlan } from '../services/geminiService';

const result = await adaptTrainingPlan({
    prev_session_intensity: 7,
    actual_user_rpe: 9,
    horse_recovery_status: 'Fatigué',
    next_sessions_queue: [
        { date: '2026-02-08', title: 'Intervalle', intensity: 'HIGH' },
        { date: '2026-02-09', title: 'Dressage', intensity: 'MEDIUM' },
        { date: '2026-02-10', title: 'Saut', intensity: 'HIGH' }
    ],
    horse: {
        name: 'Tornado',
        age: 8,
        breed: 'Selle Français',
        discipline: 'CSO'
    }
});

if (result.success) {
    console.log('Status:', result.data.analysis_status);
    console.log('Reasoning:', result.data.reasoning);
    console.log('Modifications:', result.data.updated_next_sessions);
}
```

---

## 🧪 Tests

### Test Manuel

1. Créer un planning IA avec 3 séances à venir
2. Valider la séance du jour avec RPE = 9 et État = "Fatigué"
3. Vérifier que la séance de demain est allégée
4. Vérifier le message de l'IA

### Test Automatisé (À implémenter)

```javascript
// test/adaptTrainingPlan.test.js
describe('Adaptive Feedback Loop', () => {
    it('should reduce intensity when RPE > planned', async () => {
        const result = await adaptTrainingPlan({
            prev_session_intensity: 5,
            actual_user_rpe: 8,
            horse_recovery_status: 'Fatigué',
            next_sessions_queue: [/* ... */],
            horse: { /* ... */ }
        });
        
        expect(result.data.analysis_status).toBe('WARNING');
        expect(result.data.modifications_applied).toBe(true);
    });
});
```

---

## 📞 Support

### Questions Fréquentes

**Q: Que se passe-t-il si je ne remplis pas le feedback ?**
R: La séance est validée normalement mais le planning futur n'est pas adapté.

**Q: Puis-je refuser les modifications de l'IA ?**
R: Oui, vous pouvez annuler le modal de feedback et valider sans adaptation.

**Q: L'IA peut-elle supprimer des séances importantes ?**
R: Non, l'IA ne supprime jamais, elle remplace par du repos ou des séances légères.

**Q: Les modifications sont-elles permanentes ?**
R: Oui, mais vous pouvez toujours régénérer un nouveau planning si besoin.

---

## 🎉 Conclusion

Le module **Adaptive Feedback Loop** représente une avancée majeure dans l'intelligence de l'IA Coach. Il transforme un outil de planification statique en un véritable partenaire d'entraînement qui apprend et s'adapte en continu.

**Version** : 1.0
**Date** : 2026-02-07
**Auteur** : Équipe Equinox Elite

---

*"Un bon entraîneur ne suit pas aveuglément un plan. Il observe, écoute, et adapte."* 🐴✨
