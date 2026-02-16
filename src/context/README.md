# 🎯 Context API - Documentation

## Vue d'ensemble
Le dossier `context/` gère l'état global de l'application via React Context API.

## Contextes Disponibles

### 🔐 `AuthContext.jsx`
Authentification et autorisation utilisateur
- Status authentification
- Données utilisateur
- Gestion de session
- Permissions

**Exports:**
```javascript
export { AuthContext, AuthProvider, useAuth }
```

**Usage:**
```javascript
import { useAuth } from '@/context';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

### 🎨 `ThemeContext.jsx`
Thème visuel (Dark/Light mode)
- Mode sombre/clair
- Couleurs personnalisées
- Persistance

**Exports:**
```javascript
export { ThemeContext, ThemeProvider }
```

### 📲 `PWAContext.jsx`
Progressive Web App features
- Mode offline
- Updates notifications
- Installation status

**Exports:**
```javascript
export { PWAContext, PWAProvider }
```

## Imports

```javascript
// ✅ Recommended (via index.js)
import { useAuth } from '@/context';
import { ThemeProvider } from '@/context';

// ❌ Direct (toujours possible)
import { useAuth } from '@/context/AuthContext';
```

## Architecture Pattern

### Context File Structure
```javascript
// context/MonContext.jsx
import { createContext, useContext, useState } from 'react';

const MonContext = createContext();

export function MonProvider({ children }) {
  const [state, setState] = useState();
  
  return (
    <MonContext.Provider value={{ state, setState }}>
      {children}
    </MonContext.Provider>
  );
}

export function useMon() {
  const context = useContext(MonContext);
  if (!context) {
    throw new Error('useMon must be used within MonProvider');
  }
  return context;
}

// Export default pour faciliter
export { MonContext };
```

### Usage dans App.jsx
```javascript
import { AuthProvider } from '@/context';

function App() {
  return (
    <AuthProvider>
      {/* App content */}
    </AuthProvider>
  );
}
```

## Ajouter un Nouveau Contexte

1. Créer `src/context/MonContext.jsx`
2. Implémenter le Provider et Hook
3. Ajouter à `src/context/index.js`

```javascript
// src/context/index.js
export { MonContext, MonProvider, useMon } from './MonContext.jsx';
```

## Notes
- ✅ Context pour état GLOBAL seulement
- ⚠️ Éviter les re-renders excessifs (utiliser useMemo)
- ✅ Provider doit wrapper App
- ⚠️ Ne pas mettre état local dans Context
