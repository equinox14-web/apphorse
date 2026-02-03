/**
 * RÉFÉRENCE OBJECTS POUR MESURE BARYMÉTRIQUE
 * Liste des objets communs utilisables comme repères d'échelle
 */

export const REFERENCE_OBJECTS = [
    {
        id: 'DUCT_TAPE_50MM',
        label: 'Scotch Gris/Électricien 50mm',
        widthMm: 50,
        heightMm: 50, // Carré approximatif
        color: '#6B7280',
        description: 'Le plus courant, largeur standard',
        recommended: true
    },
    {
        id: 'DUCT_TAPE_38MM',
        label: 'Scotch Gris 38mm',
        widthMm: 38,
        heightMm: 38,
        color: '#6B7280',
        description: 'Version plus étroite',
        recommended: false
    },
    {
        id: 'MASKING_TAPE_24MM',
        label: 'Ruban de Masquage 24mm (beige)',
        widthMm: 24,
        heightMm: 24,
        color: '#D4A574',
        description: 'Scotch de peinture beige',
        recommended: false
    },
    {
        id: 'ELECTRICAL_TAPE_19MM',
        label: 'Chatterton Noir 19mm',
        widthMm: 19,
        heightMm: 19,
        color: '#000000',
        description: 'Isolant électrique noir',
        recommended: false
    },
    {
        id: 'POST_IT_76MM',
        label: 'Post-it Standard 76x76mm',
        widthMm: 76,
        heightMm: 76,
        color: '#FEF3C7',
        description: 'Carré jaune collant',
        recommended: false
    },
    {
        id: 'A4_CARD_LANDSCAPE',
        label: 'Feuille A4 à l\'horizontale (297mm)',
        widthMm: 297,
        heightMm: 210,
        color: '#FFFFFF',
        description: 'Feuille blanche standard collée',
        recommended: false
    },
    {
        id: 'CREDIT_CARD',
        label: 'Carte de crédit (85x54mm)',
        widthMm: 85.6,
        heightMm: 53.98,
        color: '#3B82F6',
        description: 'Taille standard ISO/IEC 7810',
        recommended: false
    },
    {
        id: 'RULER_30CM',
        label: 'Règle 30cm collée verticalement',
        widthMm: 30,
        heightMm: 300,
        color: '#EAB308',
        description: 'Règle d\'école standard',
        recommended: false
    }
];

/**
 * Récupère un objet de référence par son ID
 */
export function getReferenceObjectById(id) {
    return REFERENCE_OBJECTS.find(obj => obj.id === id);
}

/**
 * Récupère l'objet recommandé par défaut
 */
export function getDefaultReferenceObject() {
    return REFERENCE_OBJECTS.find(obj => obj.recommended) || REFERENCE_OBJECTS[0];
}

/**
 * Valide si un objet de référence est valide
 */
export function isValidReferenceObject(id) {
    return REFERENCE_OBJECTS.some(obj => obj.id === id);
}
