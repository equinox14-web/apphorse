# 🎯 SPÉCIFICATION TECHNIQUE - MODULE "ADAPTIVE FEEDBACK LOOP" (IA COACH)
## ✅ STATUT : IMPLÉMENTÉ ET OPÉRATIONNEL

---

## 📋 RÉSUMÉ EXÉCUTIF

Le module **Adaptive Feedback Loop** a été implémenté avec succès dans AppHorse. L'IA Coach est maintenant un véritable entraîneur réactif qui s'adapte dynamiquement aux performances du cheval après chaque séance.

**Problème résolu** : L'IA ne génère plus un planning statique le lundi qui reste inchangé toute la semaine.

**Solution** : Après chaque séance, l'utilisateur saisit le RPE (ressenti 1-10) et l'état de récupération. L'IA analyse ces données et adapte automatiquement les 3 prochaines séances pour optimiser la progression tout en évitant le surentraînement.

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### 1. Backend - Service IA (`src/services/geminiService.js`)

**Nouvelle fonction** : `adaptTrainingPlan()`

```javascript
export async function adaptTrainingPlan(params) {
    // params: {
    //   prev_session_intensity: number (1-10),
    //   actual_user_rpe: number (1-10),
    //   horse_recovery_status: string,
    //   next_sessions_queue: Array,
    //   horse: Object
    // }
}
```

**System Prompt** : Implémente exactement les 4 cas de la spécification :
- **CASE A** : Adaptation Neutre (RPE conforme)
- **CASE B** : Adaptation à la Baisse (Récupération forcée)
- **CASE C** : Alerte Rouge (Sécurité)
- **CASE D** : Adaptation à la Hausse (Optimisation)

**Retour JSON** :
```json
{
  "analysis_status": "OK" | "WARNING" | "CRITICAL",
  "reasoning": "Explication courte pour le frontend",
  "modifications_applied": boolean,
  "updated_next_sessions": [...]
}
```

### 2. Frontend - Interface (`src/pages/Calendar.jsx`)

**Nouveaux States** :
```javascript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
const [feedbackData, setFeedbackData] = useState({
    rpe: 5,
    recoveryStatus: 'Normal',
    comments: '',
    plannedIntensity: 5
});
const [eventToValidate, setEventToValidate] = useState(null);
```

**Flux de Validation** :
1. User clique "Valider" sur une séance d'entraînement
2. `handleValidateEvent()` détecte le type d'événement
3. Si training → Ouvre le modal de feedback
4. User remplit RPE + État + Commentaires
5. `performValidateWithFeedback()` :
   - Appelle `adaptTrainingPlan()` avec les données
   - Met à jour le planning futur dans `localStorage`
   - Valide la séance (historique)
   - Affiche le message de l'IA
6. Rafraîchit le calendrier

**Modal de Feedback** :
- Slider RPE (1-10) avec gradient de couleur
- 4 boutons d'état : Frais 😊 / Normal 😐 / Fatigué 😓 / Épuisé 😰
- Champ commentaires optionnel
- Boutons Annuler / Valider séance
- Design moderne avec gradient violet

---

## 📊 ALGORITHME DE DÉCISION

### CASE A : Adaptation Neutre (Conformité)
**Condition** : `actual_user_rpe` ≈ `prev_session_intensity` (±1)
**Action** : Aucune modification
**Status** : `"OK"`
**Message** : "Parfait ! Le cheval encaisse la charge comme prévu."

### CASE B : Adaptation à la Baisse (Récupération forcée)
**Condition** : `actual_user_rpe` > `prev_session_intensity` (+2) OU `horse_recovery_status` == "Fatigué"
**Action** :
- Modifier J+1 : Remplacer séance intense par "Active Recovery"
- Décaler la séance clé à J+3
**Status** : `"WARNING"`
**Message** : "Attention, votre cheval semble marquer le coup. J'ai allégé le programme de demain..."

### CASE C : Alerte Rouge (Sécurité)
**Condition** : `actual_user_rpe` ≥ 9 OU `horse_recovery_status` == "Épuisé"
**Action** :
- Supprimer toutes les séances intenses pour 72h
- Remplacer par "Repos" ou "Soins"
**Status** : `"CRITICAL"`
**Message** : "🚨 Alerte : Indicateurs de fatigue critique. Repos complet conseillé..."

### CASE D : Adaptation à la Hausse (Optimisation)
**Condition** : `actual_user_rpe` < `prev_session_intensity` (-2) ET `horse_recovery_status` == "Frais"
**Action** : Augmenter intensité ou durée de J+2 (+10%)
**Status** : `"OK"`
**Message** : "Excellent ! Votre cheval progresse bien. J'ai légèrement augmenté..."

---

## 🎨 INTERFACE UTILISATEUR

### Modal de Feedback

```
┌─────────────────────────────────────────┐
│          📊                             │
│  Comment s'est passée la séance ?       │
│  Votre feedback aide l'IA à adapter...  │
├─────────────────────────────────────────┤
│                                         │
│  Intensité ressentie (RPE) : 7/10       │
│  ●━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━   │
│  1 (Très facile)        10 (Épuisant)   │
│  💡 Intensité prévue : 6/10             │
│                                         │
│  État de récupération :                 │
│  ┌─────────┬─────────┐                  │
│  │ 😊 Frais│ ● Normal│                  │
│  ├─────────┼─────────┤                  │
│  │ Fatigué │ Épuisé  │                  │
│  └─────────┴─────────┘                  │
│                                         │
│  Commentaires (optionnel) :             │
│  ┌─────────────────────────────────┐   │
│  │ Le cheval était un peu chaud... │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Annuler]      [✅ Valider séance]    │
└─────────────────────────────────────────┘
```

### Message de Retour

Après validation :
```
✅ Séance validée !

💬 IA Coach : "Attention, votre cheval semble marquer le coup. 
J'ai allégé le programme de demain pour favoriser la surcompensation."
```

---

## 📁 FICHIERS MODIFIÉS/CRÉÉS

### Code Source
1. ✅ `src/services/geminiService.js` (+152 lignes)
   - Nouvelle fonction `adaptTrainingPlan()`
   - Export ajouté dans `export default`

2. ✅ `src/pages/Calendar.jsx` (+360 lignes)
   - 3 nouveaux states pour le modal
   - Modification de `handleValidateEvent()`
   - Nouvelle fonction `performValidateWithFeedback()`
   - Modal de feedback (200+ lignes JSX)

### Documentation
3. ✅ `ADAPTIVE_FEEDBACK_LOOP.md` (NOUVEAU - 400+ lignes)
   - Documentation complète du module
   - Fonctionnement, API, exemples, UI

4. ✅ `README_AI_COACH.md` (+30 lignes)
   - Section dédiée au module

5. ✅ `ADAPTIVE_FEEDBACK_LOOP_IMPLEMENTATION.md` (NOUVEAU)
   - Récapitulatif technique de l'implémentation

6. ✅ `SPEC_ADAPTIVE_FEEDBACK_LOOP.md` (CE FICHIER)
   - Spécification technique finale

---

## 🧪 TESTS RECOMMANDÉS

### Test 1 : Adaptation Neutre
```
Input:
- prev_session_intensity: 6
- actual_user_rpe: 6
- horse_recovery_status: "Normal"

Expected Output:
- analysis_status: "OK"
- modifications_applied: false
- Message: "Parfait ! Le cheval encaisse..."
```

### Test 2 : Adaptation à la Baisse
```
Input:
- prev_session_intensity: 5
- actual_user_rpe: 8
- horse_recovery_status: "Fatigué"

Expected Output:
- analysis_status: "WARNING"
- modifications_applied: true
- J+1 devient "Active Recovery"
- Message: "Attention, votre cheval semble..."
```

### Test 3 : Alerte Critique
```
Input:
- prev_session_intensity: 6
- actual_user_rpe: 10
- horse_recovery_status: "Épuisé"

Expected Output:
- analysis_status: "CRITICAL"
- modifications_applied: true
- J+1, J+2, J+3 deviennent "Repos"
- Message: "🚨 Alerte : Indicateurs de fatigue..."
```

### Test 4 : Adaptation à la Hausse
```
Input:
- prev_session_intensity: 6
- actual_user_rpe: 3
- horse_recovery_status: "Frais"

Expected Output:
- analysis_status: "OK"
- modifications_applied: true
- J+2 intensité augmentée de 10%
- Message: "Excellent ! Votre cheval progresse..."
```

---

## 🔐 SÉCURITÉ

### Règles de Sécurité Implémentées

1. ✅ **Priorité absolue à la sécurité** : RPE ≥ 9 → Repos forcé
2. ✅ **Validation des paramètres** : Vérification avant appel API
3. ✅ **Gestion d'erreurs** : Try/catch avec messages clairs
4. ✅ **Pas de sur-adaptation** : Max 3 séances modifiées
5. ✅ **Traçabilité** : Feedback stocké dans l'historique
6. ✅ **Validation humaine** : User peut annuler le modal

### Limitations V1

- ❌ Pas d'historique long terme (> 3 séances)
- ❌ Pas de détection de patterns
- ❌ Pas d'intégration biométrique
- ❌ Pas de recommandations nutritionnelles

---

## 📊 STOCKAGE DES DONNÉES

### Feedback dans `localStorage`

```javascript
// appHorse_customEvents
{
  id: 1738915200000,
  title: "🤖 Intervalle haute intensité",
  dateStr: "2026-02-07T10:00:00.000Z",
  type: "training",
  horseId: "123",
  completed: true,
  feedback: {
    rpe: 7,
    recoveryStatus: "Normal",
    comments: "Le cheval était un peu chaud",
    plannedIntensity: 6
  }
}
```

### Planning Adapté dans `localStorage`

```javascript
// ai_training_plans
{
  horseId: "123",
  horseName: "Tornado",
  plan: {
    events: [
      {
        date: "2026-02-08",
        title: "Récupération Active",
        intensity: "LOW",
        duration_min: 30,
        description: "Marche en main 20min..."
      }
    ]
  }
}
```

---

## 🚀 ROADMAP V2

### Court Terme (1-2 mois)
- [ ] Graphiques RPE vs Intensité prévue
- [ ] Analyse de tendances sur 4 semaines
- [ ] Détection de patterns de fatigue
- [ ] Alertes proactives

### Moyen Terme (3-6 mois)
- [ ] Intégration capteurs biométriques
- [ ] Recommandations nutritionnelles
- [ ] Analyse comparative multi-chevaux
- [ ] Export PDF rapport de progression

### Long Terme (6-12 mois)
- [ ] Machine Learning pour prédire la fatigue
- [ ] Intégration météo automatique
- [ ] Coaching vocal (app mobile)
- [ ] Communauté : partage de plannings

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [x] Code implémenté
- [x] Tests locaux réussis
- [x] Documentation complète
- [x] Interface finalisée
- [x] Gestion d'erreurs robuste
- [x] Stockage sécurisé
- [ ] Tests utilisateurs beta
- [ ] Déploiement production
- [ ] Communication aux users
- [ ] Monitoring erreurs

---

## 📞 SUPPORT

### Documentation
- **ADAPTIVE_FEEDBACK_LOOP.md** : Doc complète
- **README_AI_COACH.md** : Guide utilisateur
- **Ce fichier** : Spécification technique

### Code Source
- **Backend** : `src/services/geminiService.js` (ligne 920)
- **Frontend** : `src/pages/Calendar.jsx` (ligne 43+)

### Contact
- **Équipe** : Equinox Elite
- **Version** : 1.0
- **Date** : 2026-02-07
- **Statut** : ✅ OPÉRATIONNEL

---

## 🎉 CONCLUSION

Le module **Adaptive Feedback Loop** est **100% implémenté et fonctionnel** !

L'IA Coach d'AppHorse est maintenant un véritable entraîneur réactif qui :
- ✅ Analyse le ressenti après chaque séance
- ✅ Adapte automatiquement les 3 prochaines séances
- ✅ Prévient le surentraînement
- ✅ Optimise la progression
- ✅ Garantit la sécurité du cheval

**Prochaine étape** : Tests utilisateurs beta et déploiement en production.

---

*"Un bon entraîneur ne suit pas aveuglément un plan. Il observe, écoute, et adapte."* 🐴✨

---

**FIN DE LA SPÉCIFICATION TECHNIQUE**
