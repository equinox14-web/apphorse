
export const PLANS = {
    // AMATEUR RIDING
    decouverte: {
        maxHorses: 1,
        maxMares: 1, // 1 Riding Horse AND 1 Broodmare
        features: ['basic_care', 'calendar', 'register', 'breeding', 'support']
    },
    passion: {
        maxHorses: 999,
        maxMares: 0,
        features: ['basic_care', 'calendar', 'budget', 'sharing', 'media', 'leases', 'messaging', 'competition', 'alerts', 'support', 'register']
    },

    // AMATEUR BREEDING
    eleveur_amateur_paid: {
        maxHorses: 5,
        maxMares: 5,
        features: ['breeding', 'care_advanced', 'messaging', 'breeding_advice', 'alerts', 'budget', 'support', 'register']
    },

    // PRO (Bundles)
    start: {
        maxHorses: 10,
        maxMares: 15,
        maxTeam: 2,
        features: ['clients', 'billing', 'team', 'care_advanced', 'messaging', 'alerts', 'support', 'register']
    },
    pro_trial: {
        maxHorses: 999, // Same as Elite
        maxMares: 999,
        maxTeam: 999,
        features: ['basic_care', 'calendar', 'media', 'sharing', 'leases', 'my_horses', 'clients', 'billing', 'billing_recurring', 'team', 'care_advanced', 'competition', 'stock', 'breeding', 'accounting', 'messaging', 'breeding_advice', 'alerts', 'support', 'register', 'pastures']
    },
    pro: {
        maxHorses: 30,
        maxMares: 30,
        maxTeam: 5,
        features: ['clients', 'billing', 'billing_recurring', 'team', 'care_advanced', 'competition', 'stock', 'messaging', 'alerts', 'support', 'register']
    },
    elite: {
        maxHorses: 999,
        maxMares: 999,
        maxTeam: 999,
        features: ['basic_care', 'calendar', 'media', 'sharing', 'leases', 'my_horses', 'clients', 'billing', 'billing_recurring', 'team', 'care_advanced', 'competition', 'stock', 'breeding', 'accounting', 'messaging', 'breeding_advice', 'alerts', 'support', 'register', 'pastures']
    },
    eleveur: {
        maxHorses: 30,
        maxMares: 999,
        maxTeam: 5,
        features: ['clients', 'billing', 'team', 'breeding', 'care_advanced', 'stock', 'pastures', 'messaging', 'breeding_advice', 'alerts', 'support', 'register']
    },
    // ADMIN (Dev/Superuser)
    admin: {
        maxHorses: 9999,
        maxMares: 9999,
        maxTeam: 9999,
        features: ['basic_care', 'calendar', 'budget', 'sharing', 'media', 'leases', 'messaging', 'competition', 'alerts', 'support', 'breeding', 'care_advanced', 'breeding_advice', 'clients', 'billing', 'billing_recurring', 'team', 'stock', 'pastures', 'accounting', 'register']
    }
};

export const EXTERNAL_ROLES = ['Vétérinaire', 'Maréchal', 'Dentiste', 'Ostéopathe'];

export const isExternalUser = () => {
    const role = localStorage.getItem('user_role');
    if (!role) return false;
    // Normalize string to handle accents/case (Simple approach)
    const normalizedRole = role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const externalNormalized = ['veterinaire', 'marechal', 'dentiste', 'osteopathe', 'external'];
    return externalNormalized.some(r => normalizedRole.includes(r));
};

export const getMaxTeam = () => {
    const planIds = getUserPlanIds();
    let max = 0;
    for (const planId of planIds) {
        const plan = PLANS[planId];
        if (plan) {
            max = Math.max(max, plan.maxTeam || 0);
        }
    }
    return max;
};

export const getMaxMares = () => {
    const planIds = getUserPlanIds();

    // Strict limit for Free plan
    if (planIds.length === 1 && planIds[0] === 'decouverte') {
        return 1;
    }

    let max = 0;
    for (const planId of planIds) {
        const plan = PLANS[planId];
        if (plan) {
            max = Math.max(max, plan.maxMares || 0);
        }
    }
    const extraMares = parseInt(localStorage.getItem('extraMares') || '0');
    return max + extraMares;
};


// 0. Export Whitelist for usage in SignUp
// Updated to use domain-based check instead of static list
export const isWhitelistedTester = (email) => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    // Accept all @equinox.app emails as testers and specific whitelist
    return normalizedEmail.endsWith('@equinox.app') || normalizedEmail === 'aurelie.jossic@gmail.com';
};

export const getUserPlanIds = () => {
    // Admin Override (Superuser)
    if (localStorage.getItem('user_role') === 'Admin') return ['admin'];

    // 1. TESTER WHITELIST (Backdoor for Elite Access - Priority over LocalStorage)
    const userEmail = localStorage.getItem('user_email');
    if (userEmail && isWhitelistedTester(userEmail)) {
        return ['elite'];
    }

    // 2. Check Local Storage (User's manual selection/cancellation)
    const stored = localStorage.getItem('subscriptionPlan');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
            return [stored];
        } catch (e) {
            return [stored];
        }
    }

    // Default
    return ['decouverte'];
};

export const canAccess = (feature) => {
    const role = localStorage.getItem('user_role');

    // 0. HARD SECURITY RULE: Sensitive Business Features are OWNER ONLY
    // This overrides any other logic to prevent accidental leaks (e.g. via External/Team complex logic)
    const sensitiveFeatures = ['register', 'budget', 'billing', 'leases', 'clients', 'competition', 'accounting'];
    // Default Owner Roles
    // Check for "Propriétaire" (Owner) or "Admin" or "Pro" OR explicit "user_is_admin" flag (from Team delegation)
    const normalizedRole = role ? role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
    const isOwnerRole = !role || normalizedRole.includes('proprietaire') || normalizedRole.includes('admin') || normalizedRole.includes('pro');
    const isDelegatedAdmin = localStorage.getItem('user_is_admin') === 'true';

    const isOwner = isOwnerRole || isDelegatedAdmin;

    if (sensitiveFeatures.includes(feature) && !isOwner) {
        return false;
    }

    // 1. External Users Restrictions
    if (isExternalUser()) {
        let allowedFeatures = ['messaging', 'calendar', 'basic_care']; // Base for all externals

        // Vétérinaire Specials
        if (role === 'Vétérinaire') {
            allowedFeatures.push('breeding'); // Gyneco
            allowedFeatures.push('care_advanced'); // Carnet Sanitaire View
        }

        return allowedFeatures.includes(feature);
    }

    // 2. Internal Team Restrictions (Non-Owners)
    // Block sensitive business features for Grooms, Riders, etc., AND ensure Externals really don't get them even if logic slips
    // 'isOwner' is already defined above including delegation check.

    // Explicitly block these features for non-owners (e.g. Groom during simulation)
    const restrictedForTeam = ['billing', 'clients', 'budget', 'accounting', 'register', 'leases', 'competition'];

    if (feature === 'billing') {
        console.log(`[DEBUG Access] Feature: ${feature}, Role: ${role}, isOwner: ${isOwner}, Restricted: ${restrictedForTeam.includes(feature)}`);
    }

    if (!isOwner && restrictedForTeam.includes(feature)) {
        if (feature === 'billing') console.log(`[DEBUG Access] DENIED billing for role ${role}`);
        return false;
    }

    const planIds = getUserPlanIds();

    // Admin Bypass: Full Access
    if (planIds.includes('admin')) return true;

    // Check Activities for Overrides
    const userActivitiesStr = localStorage.getItem('userActivities');
    let isBreeder = false;
    try {
        if (userActivitiesStr) {
            const activities = JSON.parse(userActivitiesStr);
            isBreeder = Array.isArray(activities) && activities.includes('Éleveur');
        }
    } catch (e) {
        console.error("Error parsing userActivities", e);
    }

    if (feature === 'breeding' && isBreeder) {
        return true;
    }

    for (const planId of planIds) {
        if (feature === 'pro_only') {
            const proPlans = ['start', 'pro', 'elite', 'eleveur'];
            if (proPlans.includes(planId)) return true;
        }

        const plan = PLANS[planId];
        if (plan && plan.features.includes(feature)) return true;
    }

    return false;
};

export const canEdit = (resource) => {
    const role = localStorage.getItem('user_role');

    // Owner/Internal Staff can edit everything (unless constrained by other permissions, but here we check Role)
    if (!EXTERNAL_ROLES.includes(role)) return true;

    // Vétérinaire Permissions
    if (role === 'Vétérinaire') {
        if (resource === 'breeding') return true; // Can enter Gyneco info
        if (resource === 'care') return true; // Can add medical acts
        if (resource === 'horse_profile') return false; // Cannot modify Identity (Livret)
        return false; // Default false for others
    }

    // Other externals (Farrier, etc.) 
    // Maybe Farrier can edit Shoeing? (resource='shoeing'?) For now default false.
    return false;
};

export const canManageHorses = () => {
    // If in simulation mode, we are viewing as a team member -> Deny unless Admin delegated
    const isDelegatedAdmin = localStorage.getItem('user_is_admin') === 'true';
    if (localStorage.getItem('is_simulation') === 'true' && !isDelegatedAdmin) return false;

    // External users cannot manage horses
    if (isExternalUser()) return false;

    // Only Owner/Propriétaire can manage horses (add/delete)
    const role = localStorage.getItem('user_role');
    // If role is undefined/null, assume Owner (legacy/default state)
    if (!isDelegatedAdmin && role && !['Propriétaire', 'Admin', 'Pro'].includes(role)) return false;

    return true;
};

export const canManageTeam = () => {
    // If in simulation mode, we are viewing as a team member -> Deny unless Admin delegated
    const isDelegatedAdmin = localStorage.getItem('user_is_admin') === 'true';
    if (localStorage.getItem('is_simulation') === 'true' && !isDelegatedAdmin) return false;

    // External users cannot manage team
    if (isExternalUser()) return false;

    // Only Owner/Propriétaire can manage team
    const role = localStorage.getItem('user_role');
    // If role is undefined/null, assume Owner (legacy/default state)
    if (!isDelegatedAdmin && role && !['Propriétaire', 'Admin', 'Pro'].includes(role)) return false;

    return true;
};

export const getMaxHorses = () => {
    const planIds = getUserPlanIds();

    // Strict limit for Free plans - no extra slots allowed
    if (planIds.length === 1 && (planIds[0] === 'decouverte' || planIds[0] === 'eleveur_amateur_free')) {
        return 1;
    }

    let max = 0;
    for (const planId of planIds) {
        const plan = PLANS[planId];
        if (plan) {
            max = Math.max(max, plan.maxHorses || 0);
        }
    }
    const extraHorses = parseInt(localStorage.getItem('extraHorses') || '0');
    return max + extraHorses;
};

export const getPlanName = () => {
    if (isExternalUser()) return 'Compte Partenaire';

    const planIds = getUserPlanIds();
    if (planIds.length === 0) return 'Aucun';
    if (planIds.length === 1) {
        const id = planIds[0];
        return id.charAt(0).toUpperCase() + id.slice(1);
    }
    return 'Multi-Pack';
};

export const canManageCompetition = () => {
    // If in simulation mode, we are viewing as a team member -> Deny unless Admin delegated
    const isDelegatedAdmin = localStorage.getItem('user_is_admin') === 'true';
    if (localStorage.getItem('is_simulation') === 'true' && !isDelegatedAdmin) return false;

    // External users cannot manage competition
    if (isExternalUser()) return false;

    // Only Owner/Propriétaire/Admin can manage competition (Add/Delete/Link to FFE)
    const role = localStorage.getItem('user_role');
    if (!isDelegatedAdmin && role && !['Cavalier', 'Propriétaire', 'Admin', 'Pro'].includes(role)) return false;

    return true;
};
