# Tâche : Traduction des pages IA

## Description
Ajouter les traductions complètes pour les pages :
- `/ai-coach` (AI Training Coach)
- `/ai-assistant` (Assistant IA)

## État
🔴 **À FAIRE**

## Détails
Actuellement, ces pages s'affichent uniquement en français, même quand l'utilisateur sélectionne l'anglais.

### Fichiers à modifier :
1. `src/pages/AITrainingCoach.jsx` - Remplacer les textes en dur par `t('...')`
2. `src/pages/Assistant.jsx` - Remplacer les textes en dur par `t('...')`
3. `src/locales/fr/translation.json` - Ajouter les clés de traduction françaises
4. `src/locales/en/translation.json` - Ajouter les clés de traduction anglaises
5. `src/layouts/MainLayout.jsx` - Modifier les labels du menu (lignes 211-212)

### Labels du menu sidebar à traduire :
- "AI Training Coach"
- "Assistant IA"
- "INTELLIGENCE (IA)" (section title)

## Priorité
⚠️ **Moyenne** - Les pages fonctionnent, mais uniquement en français

## Créée le
2026-01-18

## Notes
- Les pages ont été créées récemment
- Le reste de l'application est déjà traduit (FR/EN)
- Cette tâche peut être faite progressivement
