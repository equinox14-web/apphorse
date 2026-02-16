# 🚀 Quick Reference - AppHorse Code Organization

**Version:** 1.3.0 (16 Feb 2026)  
**Keep this handy!** 📌

---

## 🎯 Essential Imports (Use These)

```javascript
// Context - État global
import { useAuth, ThemeProvider, PWAProvider } from '@/context';

// Hooks - Logique réutilisable  
import { useDeviceOrientation, useServiceWorker, useTrainingAI } from '@/hooks';

// Services - Logique métier
import { aiNutritionService, barymetricService } from '@/services';

// Utils - Helpers et calculs
import { canAccess, getMaxHorses, calculateNutrition } from '@/utils';

// Components - UI réutilisables
import { Button, Card } from '@/components/common';
import { NotificationManager, AdBanner } from '@/components/features';
import { WeightCamera } from '@/components/camera';

// Pages
import { Dashboard, Calendar } from '@/pages';
import { Horses, HorseProfile, Nutrition } from '@/pages/horse';
import { Team, Billing } from '@/pages/management';
```

---

## 🚫 AVOID These (Ancient Pattern)

```javascript
// ❌ DON'T DO THIS
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

// ✅ DO THIS INSTEAD
import { Dashboard } from '@/pages';
import { useAuth } from '@/context';
import { Button } from '@/components/common';
```

---

## 📁 Where is Everything?

```
pages/           → Dashboard, Calendar, Support, etc.
components/
  ├── common/    → Button, Card (generic)
  ├── features/  → Notifications, Ads (business logic)
  ├── camera/    → WeightCamera, LabelScanner
  └── scanner/   → Advanced analysis
services/        → IA, Nutrition, Sync
context/         → Auth, Theme, PWA (global state)
hooks/           → useAuth, useDeviceOrientation
utils/           → Permissions, Calculations, Payments
constants/       → Reference data
```

---

## 🎨 Code Style Cheat Sheet

### Naming
```javascript
// ✅ Components: PascalCase
function MyButton() { ... }

// ✅ Functions: camelCase
const calculateWeight = () => { ... }

// ✅ Constants: UPPER_SNAKE_CASE
const MAX_HORSES = 10;
```

### Styling
```javascript
// ✅ Use Tailwind
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Click
</button>

// ❌ Avoid CSS files
import './Button.css'; // Don't do this
```

### Component Structure
```javascript
// ✅ Good
function MyComponent({ title, children }) {
  return <div>{title}{children}</div>;
}

// ❌ Avoid
function Component(props) {
  let title = props.title;
  return <div>{title}</div>;
}
```

---

## 🔐 Permissions Check

```javascript
import { canAccess, getMaxHorses, getPlanName } from '@/utils';

// Check if feature is allowed
if (canAccess('nutrition')) {
  // Show feature
}

// Get plan limits
const maxHorses = getMaxHorses();
const planName = getPlanName(); // "Free", "Pro", "Elite"
```

---

## 🌐 Translations

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('home.title')}</h1>;
}
```

---

## 🆕 Adding a Feature

### 1. Service
```javascript
// src/services/myFeature.js
export const myFunc = async () => { ... };
```

### 2. Hook (if state needed)
```javascript
// src/hooks/useMyFeature.js
export function useMyFeature() {
  const [state, setState] = useState();
  return { state, setState };
}
```

### 3. Component
```javascript
// src/components/features/MyFeature.jsx
function MyFeature() {
  const { state } = useMyFeature();
  return <div>{state}</div>;
}
export default MyFeature;
```

### 4. Update index.js
```javascript
// src/services/index.js
export * from './myFeature.js';

// src/hooks/index.js
export { useMyFeature } from './useMyFeature.js';

// src/components/features/index.js
export { default as MyFeature } from './MyFeature';
```

### 5. Use in Page
```javascript
// src/pages/Something.jsx
import { MyFeature } from '@/components/features';

function SomethingPage() {
  return <MyFeature />;
}
```

---

## 🎣 Common Patterns

### Using Context
```javascript
import { useAuth } from '@/context';

function MyComponent() {
  const { user, logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}
```

### Using Hooks
```javascript
import { useDeviceOrientation } from '@/hooks';

function Camera() {
  const { orientation } = useDeviceOrientation();
  return <div>Orientation: {orientation}</div>;
}
```

### Using Services
```javascript
import { aiNutritionService } from '@/services';

async function getNutrition() {
  const plan = await aiNutritionService.calculate();
  return plan;
}
```

### Using Utils
```javascript
import { calculateWeight, estimateFromPhoto } from '@/utils';

const weight = calculateWeight(measurements);
const estimated = await estimateFromPhoto(image);
```

---

## ⚡ Firebase Basics

```javascript
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Get data
const snapshot = await getDocs(collection(db, 'horses'));
snapshot.forEach(doc => console.log(doc.data()));

// Add data
await addDoc(collection(db, 'horses'), { name: 'Speed' });

// Update
await updateDoc(doc(db, 'horses', docId), { age: 5 });
```

---

## 🧪 Debugging

```javascript
// ✅ Good logging
console.log('[DEBUG Feature]', { state, props });
console.warn('[⚠️] Warning:', error);
console.error('[ERROR]', error);

// ❌ Avoid
console.log('test');
console.log(data);
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [INDEX_DOCUMENTATION.md](./INDEX_DOCUMENTATION.md) | Navigation hub |
| [CODE_STYLE_GUIDE.md](./CODE_STYLE_GUIDE.md) | Full style guide |
| [GUIDE_MIGRATION.md](./GUIDE_MIGRATION.md) | Import patterns |
| [ANALYSE_STRUCTURE_CODE.md](./ANALYSE_STRUCTURE_CODE.md) | Architecture deep-dive |
| src/*/README.md | Module-specific docs |

---

## ✅ Before Committing

- [ ] Used centralized imports (@/xxx)
- [ ] Named components PascalCase
- [ ] Named functions camelCase
- [ ] Used Tailwind for styling
- [ ] Added to module index.js
- [ ] Tested locally (npm run dev)
- [ ] Checked for typos

---

## 🆘 Common Issues

### "Cannot find module '@/context'"
→ Check path alias in vite.config.js

### "Duplicate exports in index.js"
→ Make sure you export each item once

### "Import from nested path still works"
→ That's fine! Direct imports are still valid

### "Not sure what to import"
→ Check [INDEX_DOCUMENTATION.md](./INDEX_DOCUMENTATION.md)

---

## 🚀 Git Workflow

```bash
# Create branch
git checkout -b feat/my-feature

# Make changes following patterns above

# Commit
git add .
git commit -m "feat: add my feature"

# Push
git push origin feat/my-feature

# Create PR
# → Link documentation if needed
```

---

## 💡 Remember

1. **Centralize your imports** - Use @/context @/services etc.
2. **Follow patterns** - Look at similar files
3. **Read the docs** - They're there for a reason
4. **Keep it simple** - One component, one file
5. **Update index.js** - When you add new exports

---

## 🎯 Decision Tree

```
Adding code?
├─ Is it a global state? → Put in context/
├─ Is it a reusable function? → Put in utils/ or services/
├─ Is it reusable component? → Put in components/
├─ Is it UI element? → Put in components/common/
├─ Is it feature logic? → Put in components/features/
├─ Is it a new page? → Put in pages/
└─ Is it special logic? → Put in services/ or hooks/

Then:
1. Create file with PascalCase/camelCase
2. Export in index.js
3. Import via @/folder
4. Done!
```

---

**Bookmark this file! 📌**

Last updated: 16 Feb 2026  
Version: 1.3.0
