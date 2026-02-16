import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader, Cloud, Trash2, Info } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { migrationService } from '../../services/migrationService';
import { useAuth } from '../../context/AuthContext';

/**
 * Photo Migration Wizard
 * Guide utilizzateurs à travers la migration des photos localStorage → Cloud
 * Phases: SUMMARY → CONFIRMATION → MIGRATION → RESULTS
 */
export default function PhotoMigrationWizard({ horses, onComplete, onClose }) {
  const { currentUser } = useAuth();

  // Phases: 'SUMMARY', 'CONFIRMATION', 'MIGRATION', 'RESULTS'
  const [phase, setPhase] = useState('SUMMARY');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [cleanupDone, setCleanupDone] = useState(false);

  // Charger le résumé des migrations
  useEffect(() => {
    try {
      if (horses && currentUser?.uid) {
        const summaryData = migrationService.getMigrationSummary(
          currentUser.uid,
          horses
        );
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('Erreur chargement résumé:', err);
    } finally {
      setIsLoading(false);
    }
  }, [horses, currentUser?.uid]);

  const handleStartMigration = async () => {
    if (!currentUser?.uid || !horses) return;

    setPhase('MIGRATION');
    setIsMigrating(true);

    try {
      const result = await migrationService.migrateAllUserPhotos(
        currentUser.uid,
        horses,
        (progress) => {
          setMigrationProgress(progress);
        }
      );

      setResults(result);
      setPhase('RESULTS');
    } catch (err) {
      console.error('Erreur migration:', err);
      setResults({
        error: err.message,
        totalPhotos: 0,
        totalMigrated: 0,
        totalFailed: 0,
      });
      setPhase('RESULTS');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCleanup = () => {
    if (!horses) return;

    try {
      let cleanedCount = 0;
      for (const horse of horses) {
        if (migrationService.deleteOldLocalStoragePhotos(horse.id)) {
          cleanedCount++;
        }
      }

      setCleanupDone(true);
      console.log(`✅ ${cleanedCount} chevaux nettoyés`);
    } catch (err) {
      console.error('Erreur cleanup:', err);
      alert('Erreur lors du nettoyage des anciennes données');
    }
  };

  const handleClose = () => {
    if (onComplete && results) {
      onComplete(results);
    }
    onClose();
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <Card style={{ width: '90%', maxWidth: '500px', textAlign: 'center', padding: '2rem' }}>
          <Loader size={48} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p>Analyse de vos photos...</p>
        </Card>
      </div>
    );
  }

  // PHASE 1: SUMMARY
  if (phase === 'SUMMARY') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'auto',
        padding: '1rem',
      }}>
        <Card style={{ width: '90%', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Cloud size={32} style={{ color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Migration vers le Cloud</h2>
          </div>

          {summary && summary.totalOldPhotos === 0 ? (
            <>
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #d1e7dd',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}>
                <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>Aucune photo à migrer</h3>
                <p style={{ color: '#047857', margin: 0 }}>
                  Toutes vos photos sont déjà dans le cloud ✨
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button onClick={onClose} variant="primary" style={{ flex: 1 }}>
                  Fermer
                </Button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
              }}>
                <Info size={20} style={{ color: '#92400e', flexShrink: 0 }} />
                <div style={{ color: '#92400e', fontSize: '0.9rem' }}>
                  <strong>Migration sécurisée:</strong> Vos photos de janvier 2024 seront copiées vers le cloud.
                  Les anciennes données resteront jusqu'à confirmation.
                </div>
              </div>

              {summary.horseDetails && summary.horseDetails.length > 0 && (
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
                    📸 Chevaux avec photos à migrer:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {summary.horseDetails.map((horse) => (
                      <div
                        key={horse.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{horse.name}</span>
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}>
                          {horse.oldPhotosCount} photo{horse.oldPhotosCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                background: '#f3f4f6',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {summary.totalOldPhotos}
                </div>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  photos à migrer vers le cloud
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button
                  onClick={() => setPhase('CONFIRMATION')}
                  variant="primary"
                  style={{ flex: 1 }}
                >
                  Commencer la migration
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  // PHASE 2: CONFIRMATION
  if (phase === 'CONFIRMATION') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}>
        <Card style={{ width: '90%', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={32} style={{ color: '#f59e0b' }} />
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Confirmer la migration?</h2>
          </div>

          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#92400e',
            lineHeight: '1.5',
          }}>
            <strong>⏱️ Durée estimée:</strong> {Math.ceil((summary?.totalOldPhotos || 0) * 0.5 / 60)} min<br />
            <strong>📡 Connexion Internet:</strong> Requise (pas d'interruption)<br />
            <strong>💾 Espace:</strong> ~{(summary?.totalOldPhotos || 0) * 0.2} MB utilisés<br />
            <strong>🔒 Sécurité:</strong> Vos photos restent chiffrées<br />
          </div>

          <div style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#0c4a6e',
            lineHeight: '1.5',
          }}>
            ℹ️ <strong>Après migration:</strong> Vos photos seront accessibles sur tous vos appareils.<br />
            Les anciennes données localStorage pourront être supprimées.
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              onClick={handleStartMigration}
              variant="primary"
              style={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Cloud size={18} style={{ marginRight: '8px' }} />
              Migrer maintenant
            </Button>
            <Button
              onClick={() => setPhase('SUMMARY')}
              variant="secondary"
              style={{ flex: 1 }}
            >
              Retour
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // PHASE 3: MIGRATION IN PROGRESS
  if (phase === 'MIGRATION') {
    const isCurrentlyMigrating = isMigrating;
    const progress = migrationProgress || {};

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}>
        <Card style={{ width: '90%', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Migration en cours...</h2>
          </div>

          {progress.horseName && (
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                {progress.horseIndex}/{progress.totalHorses}: {progress.horseName}
              </div>
              <div style={{
                background: '#e5e7eb',
                borderRadius: '4px',
                height: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  height: '100%',
                  width: `${(progress.horseIndex / progress.totalHorses) * 100}%`,
                  transition: 'width 0.3s',
                }}></div>
              </div>
            </div>
          )}

          {progress.horseProgress && (
            <div style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{progress.horseProgress.currentPhoto}</span>
                <span style={{ color: '#666' }}>
                  {progress.horseProgress.current}/{progress.horseProgress.total}
                </span>
              </div>
              <div style={{
                background: '#e5e7eb',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: progress.horseProgress.success ? '#10b981' : '#ef4444',
                  height: '100%',
                  width: `${(progress.horseProgress.current / progress.horseProgress.total) * 100}%`,
                  transition: 'width 0.3s',
                }}></div>
              </div>
            </div>
          )}

          <div style={{
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem',
          }}>
            <div style={{ color: '#666', marginBottom: '0.25rem' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {progress.overallMigrated || 0} ✅
            </div>
            {progress.overallFailed > 0 && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {progress.overallFailed} ⚠️
              </div>
            )}
          </div>

          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.85rem',
            margin: '1rem 0 0 0',
          }}>
            ⏳ Veuillez ne pas quitter cette page
          </p>
        </Card>
      </div>
    );
  }

  // PHASE 4: RESULTS
  if (phase === 'RESULTS') {
    const successPercentage = results?.successRate || 0;
    const hasFailures = (results?.totalFailed || 0) > 0;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'auto',
        padding: '1rem',
      }}>
        <Card style={{ width: '90%', maxWidth: '600px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            {hasFailures ? (
              <AlertCircle size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
            ) : (
              <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            )}
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
              Migration terminée
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Total</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{results?.totalPhotos}</div>
            </div>
            <div style={{
              background: '#ecfdf5',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '0.5rem' }}>Réussies</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
                {results?.totalMigrated}
              </div>
            </div>
            <div style={{
              background: hasFailures ? '#fef2f2' : '#ecfdf5',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: hasFailures ? '#991b1b' : '#065f46',
                marginBottom: '0.5rem',
              }}>
                Échouées
              </div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: hasFailures ? '#ef4444' : '#10b981',
              }}>
                {results?.totalFailed}
              </div>
            </div>
          </div>

          {results?.horses && results.horses.length > 0 && (
            <div style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              maxHeight: '300px',
              overflow: 'auto',
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Détails par cheval:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {results.horses.map((horse) => (
                  <div
                    key={horse.horseId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      borderLeft: `4px solid ${horse.migrated === horse.total ? '#10b981' : '#f59e0b'}`,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{horse.horseName}</span>
                    <span style={{ color: '#666' }}>
                      {horse.migrated}/{horse.total} ✅
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#0c4a6e',
            lineHeight: '1.5',
          }}>
            ✨ <strong>Succès:</strong> {successPercentage}% des photos sont maintenant dans le cloud!
          </div>

          {results?.totalMigrated > 0 && !cleanupDone && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#92400e',
            }}>
              🧹 <strong>Nettoyage:</strong> Les anciennes photos peuvent être supprimées pour libérer de l'espace.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results?.totalMigrated > 0 && !cleanupDone && (
              <Button
                onClick={handleCleanup}
                variant="secondary"
                style={{ width: '100%' }}
              >
                <Trash2 size={18} style={{ marginRight: '8px' }} />
                Supprimer les anciennes données
              </Button>
            )}
            <Button
              onClick={handleClose}
              variant="primary"
              style={{ width: '100%' }}
            >
              Fermer
            </Button>
          </div>

          {cleanupDone && (
            <p style={{
              textAlign: 'center',
              color: '#10b981',
              fontSize: '0.85rem',
              marginTop: '1rem',
            }}>
              ✅ Nettoyage complété
            </p>
          )}
        </Card>
      </div>
    );
  }

  return null;
}
