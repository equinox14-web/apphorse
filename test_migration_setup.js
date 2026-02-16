/**
 * Script de test pour la migration photos
 * À exécuter dans la console du navigateur pour créer des données de test
 * 
 * USAGE:
 * 1. Ouvrir console navigateur (F12)
 * 2. Copier-coller ce code puis Enter
 * 3. Aller sur /settings pour voir le résumé de migration
 * 4. Tester le flux complet
 */

console.log('🧪 Création de photos de test pour migration...');

// Image Base64 de test (1x1px rouge)
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Fonction pour générer des photos de test
function generateTestPhotos(count = 5) {
  const photos = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    photos.push({
      id: `test_photo_${now}_${i}`,
      dataUrl: testImageBase64,
      fileName: `test_horse_photo_${i + 1}.png`,
      timestamp: now + (i * 1000), // 1 seconde d'écart
      type: i % 2 === 0 ? 'profile' : 'side',
      notes: `Photo de test numéro ${i + 1}`
    });
  }
  
  return photos;
}

// Récupérer les chevaux existants
const horsesStr = localStorage.getItem('my_horses_v4');
const horses = horsesStr ? JSON.parse(horsesStr) : [];

if (horses.length === 0) {
  console.warn('⚠️ Aucun cheval trouvé. Création d\'un cheval de test...');
  
  // Créer un cheval de test
  const testHorse = {
    id: 'test_horse_' + Date.now(),
    name: 'Dragon Test',
    breed: 'Pur-Sang',
    age: 5,
    weight: 500,
    color: 'Bai',
    gender: 'Étalon'
  };
  
  horses.push(testHorse);
  localStorage.setItem('my_horses_v4', JSON.stringify(horses));
  console.log('✅ Cheval de test créé:', testHorse.name);
}

// Ajouter des photos pour chaque cheval
let totalPhotosCreated = 0;

horses.forEach((horse, index) => {
  const photoCount = Math.floor(Math.random() * 10) + 5; // Entre 5 et 15 photos
  const photos = generateTestPhotos(photoCount);
  
  // Sauvegarder dans localStorage avec la clé attendue par cloudPhotoService
  // Format: horse_<id>_photos
  const storageKey = `horse_${horse.id}_photos`;
  localStorage.setItem(storageKey, JSON.stringify(photos));
  
  totalPhotosCreated += photoCount;
  console.log(`📸 ${photoCount} photos créées pour ${horse.name} (${horse.id})`);
});

console.log('');
console.log('✅ CONFIGURATION TERMINÉE');
console.log(`   Total chevaux: ${horses.length}`);
console.log(`   Total photos: ${totalPhotosCreated}`);
console.log('');
console.log('📍 Prochaines étapes:');
console.log('   1. Aller sur /settings');
console.log('   2. Vérifier que la carte migration affiche le bon nombre');
console.log('   3. Cliquer "Commencer la migration"');
console.log('   4. Suivre le wizard 4-phases');
console.log('   5. Vérifier Firebase Storage après migration');
console.log('');
console.log('🧹 Pour nettoyer les données de test:');
console.log('   horses.forEach(h => localStorage.removeItem(`horse_${h.id}_photos`))');
