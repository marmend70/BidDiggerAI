import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Upload } from '@/components/Upload';
import { Dashboard } from '@/components/Dashboard';
import { Login } from '@/components/Login';
import { ArchivePage } from '@/components/ArchivePage';
import { TimeoutModal } from '@/components/TimeoutModal';
import { ModelSelectionModal } from '@/components/ModelSelectionModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ContactModal } from '@/components/ContactModal';
import { PricingModal } from '@/components/PricingModal';
import { AVAILABLE_MODELS } from '@/constants';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult, UserPreferences } from '@/types';
import type { Session } from '@supabase/supabase-js';

const DEFAULT_PREFERENCES: UserPreferences = {
  structured_model: 'gemini-2.5-flash',
  semantic_model: 'gpt-5-mini',
  faq_questions: [
    "Descrivimi lo scenario dei sistemi tecnologici, infrastrutturale software, sistemi informatici",
    "Approfondisci il fabbisogno del personale impiegato in termini di giorni e/o ore richieste",
    "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
    "Quali sono i report e la documentazione di rendicontazione periodica da produrre nel corso del servizio a cura del fornitore?"
  ],
  export_sections: {
    "1_requisiti_partecipazione": true,
    "3_sintesi": true,
    "3b_checklist_amministrativa": true,
    "4_servizi": true,
    "5_scadenze": true,
    "6_importi": true,
    "7_durata": true,
    "8_ccnl": true,
    "9_oneri": true,
    "10_punteggi": true,
    "11_pena_esclusione": true,
    "12_offerta_tecnica": true,
    "13_offerta_economica": true,
    "14_note_importanti": true,
    "17_ambiguita_punti_da_chiarire": true,
    "15_remunerazione": true,
    "16_sla_penali": true,
    "faq": true
  },
  analysis_sections: {
    "1_requisiti_partecipazione": true,
    "3_sintesi": true,
    "3b_checklist_amministrativa": true,
    "4_servizi": true,
    "5_scadenze": true,
    "6_importi": true,
    "7_durata": true,
    "8_ccnl": true,
    "9_oneri": true,
    "10_punteggi": true,
    "11_pena_esclusione": true,
    "12_offerta_tecnica": true,
    "13_offerta_economica": true,
    "14_note_importanti": true,
    "17_ambiguita_punti_da_chiarire": true,
    "15_remunerazione": true,
    "16_sla_penali": true
  },
  semantic_analysis_sections: {
    "1_requisiti_partecipazione": false,
    "3_sintesi": false,
    "3b_checklist_amministrativa": false,
    "4_servizi": false,
    "5_scadenze": false,
    "6_importi": false,
    "7_durata": false,
    "8_ccnl": false,
    "9_oneri": false,
    "10_punteggi": false,
    "11_pena_esclusione": false,
    "12_offerta_tecnica": false,
    "13_offerta_economica": false,
    "14_note_importanti": false,
    "17_ambiguita_punti_da_chiarire": false,
    "15_remunerazione": false,
    "16_sla_penali": false
  }
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState('3_sintesi');
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Trial & Logic State
  const [userPlan, setUserPlan] = useState<'trial' | 'pro'>('trial');
  const [userCredits, setUserCredits] = useState<number>(0); // Credits state
  const [tenderCount, setTenderCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const MAX_TRIAL_TENDERS = 2;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // 1. Fetch Preferences & Plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences, plan_type, credits')
        .eq('id', userId)
        .single();

      if (profile) {
        if (profile.plan_type) setUserPlan(profile.plan_type as 'trial' | 'pro');
        if (typeof profile.credits === 'number') setUserCredits(profile.credits);

        if (profile.preferences) {
          setUserPreferences({
            ...DEFAULT_PREFERENCES,
            ...profile.preferences,
            export_sections: {
              ...DEFAULT_PREFERENCES.export_sections,
              ...(profile.preferences.export_sections || {}),
              'faq': true
            },
            analysis_sections: {
              ...DEFAULT_PREFERENCES.analysis_sections,
              ...(profile.preferences.analysis_sections || {})
            },
            semantic_analysis_sections: {
              ...DEFAULT_PREFERENCES.semantic_analysis_sections,
              ...(profile.preferences.semantic_analysis_sections || {})
            }
          });
        }
      }

      // 2. Fetch Tender Count
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!countError && count !== null) {
        setTenderCount(count);
      }

    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleUpdatePreferences = async (newPreferences: UserPreferences) => {
    if (!session?.user) return;

    setUserPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          preferences: newPreferences
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating preferences:', err);
      alert('Errore nel salvataggio delle preferenze');
    }
  };

  const [progressMessage, setProgressMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Define Batches
  const BATCH_1_ADMIN = {
    "3_sintesi": true,
    "5_scadenze": true,
    "1_requisiti_partecipazione": true,
    "3b_checklist_amministrativa": true,
    "14_note_importanti": true,
    "11_pena_esclusione": true
  };

  const BATCH_2_TECHNICAL = {
    "4_servizi": true,
    "7_durata": true,
    "10_punteggi": true,
    "12_offerta_tecnica": true,
    "16_sla_penali": true
  };

  const BATCH_3_ECONOMIC = {
    "6_importi": true,
    "8_ccnl": true,
    "9_oneri": true,
    "13_offerta_economica": true,
    "15_remunerazione": true,
    "17_ambiguita_punti_da_chiarire": true
  };

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timeoutResolvers = useRef<((decision: 'continue' | 'terminate') => void)[]>([]);

  const handleTimeoutDecision = (decision: 'continue' | 'terminate') => {
    setShowTimeoutModal(false);
    timeoutResolvers.current.forEach(resolve => resolve(decision));
    timeoutResolvers.current = [];
  };

  const [loadingBatches, setLoadingBatches] = useState<string[]>([]);

  // Model Selection State
  const [showModelModal, setShowModelModal] = useState(false);
  const [selectedStructuredModel, setSelectedStructuredModel] = useState<string>('gemini-2.5-flash');
  const [selectedSemanticModel, setSelectedSemanticModel] = useState<string>('gpt-5-mini');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFileSelection = (files: File[]) => {
    // 1. Check Credits
    if (userCredits < 1) {
      setShowPricingModal(true);
      return;
    }

    setPendingFiles(files);
    // Use default model from preferences if available
    if (userPreferences.structured_model) setSelectedStructuredModel(userPreferences.structured_model);
    if (userPreferences.semantic_model) setSelectedSemanticModel(userPreferences.semantic_model);
    setShowModelModal(true);
  };

  const handleModelConfirm = (structuredId: string, semanticId: string) => {
    setSelectedStructuredModel(structuredId);
    setSelectedSemanticModel(semanticId);
    setShowModelModal(false);
    startAnalysis(pendingFiles, structuredId, semanticId);
  };

  const startAnalysis = async (files: File[], structuredModelId: string, semanticModelId: string) => {
    if (!session?.user) return;
    setIsUploading(true);
    setElapsedTime(0);
    setProgressMessage(`Avvio analisi (Strutturato: ${structuredModelId}, Semantico: ${semanticModelId})...`);
    setLoadingBatches(['batch_1', 'batch_2', 'batch_3', 'batch_4']);
    setAnalysisData(null); // Reset previous data

    try {
      const uploadedPaths: string[] = [];
      const fileNames: string[] = [];

      // 1. Upload ALL files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Math.random()}.${fileExt}`; // Ensure unique file names per user
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tenders')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
        fileNames.push(file.name);
      }

      // 2. Create tender record
      const title = fileNames.length === 1 ? fileNames[0] : `${fileNames[0]} + ${fileNames.length - 1} others`;

      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .insert({
          user_id: session.user.id,
          title: title,
          status: 'analyzing'
        })
        .select()
        .single();

      if (tenderError) throw tenderError;

      // 2.5 Insert into tender_documents
      const documentsToInsert = uploadedPaths.map((path, index) => ({
        tender_id: tender.id,
        file_path: path,
        file_name: fileNames[index]
      }));

      const { error: docsError } = await supabase
        .from('tender_documents')
        .insert(documentsToInsert);

      if (docsError) throw docsError;

      setProgressMessage('Estrazione e salvataggio testo...');

      // 3. Extract and Store Text (Once)
      const { data: extractData, error: extractError } = await supabase.functions.invoke('analyze-tender', {
        body: {
          tenderId: tender.id,
          filePaths: uploadedPaths,
          action: 'extract_and_store'
        }
      });

      if (extractError) {
        console.error("Extraction failed:", extractError);
        // Try to parse the error body if available
        let errorMessage = extractError.message;
        try {
          if (extractError instanceof Error && 'context' in extractError) {
            // @ts-ignore
            const body = await extractError.context.json();
            if (body && body.error) {
              errorMessage = body.error;
            }
          }
        } catch (e) {
          console.error("Error parsing error body:", e);
        }
        throw new Error("Errore durante l'estrazione del testo: " + errorMessage);
      }

      const textStoragePath = extractData.textStoragePath;
      console.log("Text stored at:", textStoragePath);

      setProgressMessage('Attendi ancora qualche secondo...');

      // 4. Launch Parallel Requests (referencing stored text)
      // Helper to filter preferences based on batch
      const getBatchPreferences = (batch: Record<string, boolean>) => {
        const prefs: Record<string, boolean> = {};
        Object.keys(batch).forEach(key => {
          if (userPreferences.analysis_sections[key]) {
            prefs[key] = true;
          }
        });
        return prefs;
      };

      const partialRecordIds: string[] = []; // Store IDs of partial records to delete later

      const runBatch = async (batchName: string, preferences: Record<string, boolean>, structuredModel: string, semanticModel: string) => {
        if (Object.keys(preferences).length === 0) {
          setLoadingBatches(prev => prev.filter(b => b !== batchName));
          return {};
        }

        const processResult = (data: any) => {
          console.log(`Batch ${batchName} completed.`);
          setLoadingBatches(prev => prev.filter(b => b !== batchName));

          if (data && data.error) {
            console.error(`Batch ${batchName} returned error:`, data.error);
            alert(`Errore nell'analisi del gruppo ${batchName}: ${data.error}`);
            return data;
          }

          setAnalysisData(prev => {
            const newData = prev ? { ...prev } : { tender_id: tender.id } as AnalysisResult;

            // Deep merge for semantic_analysis_data to avoid overwriting between batches
            if (data.semantic_analysis_data) {
              newData.semantic_analysis_data = {
                ...(newData.semantic_analysis_data || {}),
                ...data.semantic_analysis_data
              };
              // Remove semantic_analysis_data from data before merging other fields
              const { semantic_analysis_data, ...rest } = data;

              // SMART MERGE: Only merge keys that belong to this batch's preferences
              // This prevents overwriting existing data with empty/null values from other batches
              Object.keys(preferences).forEach(key => {
                if (rest[key] !== undefined) {
                  // @ts-ignore
                  newData[key] = rest[key];
                }
              });

              // Merge metadata if present
              if (rest._batch_name) newData._batch_name = rest._batch_name;
              if (rest._semantic_debug_info) newData._semantic_debug_info = rest._semantic_debug_info;
              if (rest._semantic_error) newData._semantic_error = rest._semantic_error;

            } else {
              console.warn(`[Batch ${batchName}] NO Semantic Data in result!`);
              if (data._semantic_error) console.error(`[Batch ${batchName}] Semantic Error:`, data._semantic_error);

              // SMART MERGE for non-semantic batch results too
              Object.keys(preferences).forEach(key => {
                if (data[key] !== undefined) {
                  // @ts-ignore
                  newData[key] = data[key];
                }
              });

              // Merge metadata
              if (data._batch_name) newData._batch_name = data._batch_name;
              if (data._semantic_debug_info) newData._semantic_debug_info = data._semantic_debug_info;
            }

            return newData;
          });
          return data;
        };

        const maxRetries = 3;
        let attempt = 0;

        try {
          while (attempt < maxRetries) {
            attempt++;
            console.log(`Starting batch: ${batchName} (Attempt ${attempt}/${maxRetries}) - Background Mode`);

            const startTime = new Date().toISOString();

            // Calculate semantic sections for this batch
            const batchSemanticSections = Object.keys(preferences).reduce((acc, key) => {
              // MANDATORY SEMANTIC ANALYSIS for specific sections
              if (key === '14_note_importanti' || key === '17_ambiguita_punti_da_chiarire') {
                acc[key] = true;
              } else if (userPreferences.semantic_analysis_sections?.[key]) {
                acc[key] = true;
              }
              return acc;
            }, {} as Record<string, boolean>);

            console.log(`[Batch ${batchName}] FINAL Semantic Sections to Send:`, JSON.stringify(batchSemanticSections));

            // 1. Trigger Background Job
            const { error: invokeError } = await supabase.functions.invoke('analyze-tender', {
              body: {
                tenderId: tender.id,
                filePaths: uploadedPaths,
                analysisPreferences: preferences,
                semanticAnalysisSections: batchSemanticSections,
                background: true, // ASYNC MODE
                saveToDb: true,
                textStoragePath: textStoragePath,
                structuredModel: structuredModel, // Pass structured model
                semanticModel: semanticModel,     // Pass semantic model
                action: 'analyze',
                batchName: batchName              // PASS BATCH NAME
              }
            });

            if (invokeError) {
              console.error(`Batch ${batchName} failed to start:`, invokeError);

              // Try to extract the error message from the response body
              let errorMessage = invokeError.message;
              if (invokeError.context && invokeError.context.json) {
                try {
                  const errBody = await (invokeError as any).context.json();
                  if (errBody.error) errorMessage = errBody.error;
                } catch (e) { console.error("Failed to parse error body", e); }
              }

              alert(`Errore avvio analisi (${batchName}): ${errorMessage}`);
              return {}; // Return empty object to signify failure for this batch
            }

            console.log(`Batch ${batchName} started successfully.`);

            // 2. Poll for Results
            // Polling Loop
            const POLL_INTERVAL = 2000;
            const MAX_POLL_TIME = 10 * 60 * 1000; // 10 minutes
            let elapsed = 0;

            while (elapsed < MAX_POLL_TIME) {
              await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
              elapsed += POLL_INTERVAL;

              // Check for new analysis rows
              const { data: analyses, error: pollError } = await supabase
                .from('analyses')
                .select('*')
                .eq('tender_id', tender.id)
                .gt('created_at', startTime);

              if (pollError) {
                console.warn(`Polling error for ${batchName}:`, pollError);
                continue;
              }

              if (analyses && analyses.length > 0) {
                // Find the row that matches our batch keys
                const matchingRow = analyses.find(row => {
                  // Filter by batch name if available (New Logic)
                  if (row.result_json?._batch_name) {
                    return row.result_json._batch_name === batchName;
                  }
                  // Fallback to key matching (Old Logic)
                  const resultKeys = Object.keys(row.result_json || {});
                  return Object.keys(preferences).some(k => resultKeys.includes(k));
                });

                if (matchingRow) {
                  console.log(`Batch ${batchName} result found!`, matchingRow.result_json);
                  partialRecordIds.push(matchingRow.id); // Capture ID for cleanup
                  if (matchingRow.result_json.semantic_analysis_data) {
                    console.log(`[Batch ${batchName}] Received Semantic Data:`, matchingRow.result_json.semantic_analysis_data);
                  } else {
                    console.warn(`[Batch ${batchName}] NO Semantic Data in result!`);
                  }
                  return processResult(matchingRow.result_json);
                }
              }

              // Check if tender failed
              const { data: tenderCheck } = await supabase
                .from('tenders')
                .select('status')
                .eq('id', tender.id)
                .single();

              if (tenderCheck?.status === 'failed') {
                throw new Error("Analysis marked as failed in database.");
              }
            }

            throw new Error("Polling timeout: Result not found after 10 minutes.");
          }
        } catch (error: any) {
          console.error(`Error in batch ${batchName}:`, error);
          let msg = error.message || 'Timeout';
          if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
            msg = "Il modello selezionato non è disponibile nel backend oppure non è supportato al momento.";
          }
          alert(`Errore durante l'analisi del gruppo "${batchName}": ${msg}`);
          return {};
        } finally {
          setLoadingBatches(prev => prev.filter(b => b !== batchName));
        }
      };

      const BATCH_1 = {
        '3_sintesi': true,
        '3b_checklist_amministrativa': true,
        '1_requisiti_partecipazione': true,
        '5_scadenze': true,
        '6_importi': true,
        '8_ccnl': true
      };

      const BATCH_2 = {
        '4_servizi': true,
        '7_durata': true,
        '9_oneri': true,
        '15_remunerazione': true,
        '16_sla_penali': true
      };

      const BATCH_3 = {
        '12_offerta_tecnica': true,
        '13_offerta_economica': true,
        '10_punteggi': true,
        '11_pena_esclusione': true
      };

      const BATCH_4 = {
        '14_note_importanti': true,
        '17_ambiguita_punti_da_chiarire': true
      };

      // Initialize loading state for all batches
      setLoadingBatches(['batch_1', 'batch_2', 'batch_3', 'batch_4']);

      // Parallel Execution
      const batches = [
        { name: 'batch_1', prefs: BATCH_1 },
        { name: 'batch_2', prefs: BATCH_2 },
        { name: 'batch_3', prefs: BATCH_3 },
        { name: 'batch_4', prefs: BATCH_4 }
      ];

      const batchPromises = batches.map(batch =>
        runBatch(batch.name, getBatchPreferences(batch.prefs), structuredModelId, semanticModelId)
      );

      const rawResults = await Promise.all(batchPromises);

      // Filter out null results (terminated batches)
      const results = rawResults.filter(res => res !== null);

      // Merge results manually for DB save
      const finalJson = { _ragionamento: "Analisi sequenziale completata." };
      results.forEach(res => Object.assign(finalJson, res));

      // Save to DB via Backend (to bypass RLS and handle cleanup)
      const { error: saveError } = await supabase.functions.invoke('analyze-tender', {
        body: {
          action: 'save_final_and_cleanup',
          tenderId: tender.id,
          finalJson: finalJson,
          partialRecordIds: partialRecordIds,
          modelUsed: structuredModelId
        }
      });

      if (saveError) {
        console.error("Error saving final analysis via backend:", saveError);
        // Try to extract error message
        let errMsg = saveError.message;
        try {
          const errBody = await (saveError as any).context.json();
          if (errBody.error) errMsg = errBody.error;
        } catch (e) { }
        alert(`Errore nel salvataggio dell'analisi finale: ${errMsg}`);
      } else {
        console.log("Final analysis saved and cleaned up via backend.");
      }
      // Update status
      await supabase
        .from('tenders')
        .update({ status: 'completed' })
        .eq('id', tender.id);

      setIsUploading(false);

    } catch (error: any) {
      console.error('Error:', error);
      alert('Error during analysis: ' + error.message);
      setIsUploading(false);
      setLoadingBatches([]);
    }
  };

  const handleAskQuestion = async (sectionId: string, question: string) => {
    if (!analysisData || !session?.user) return;
    setIsAsking(true);

    try {
      // Fetch file paths from tender_documents
      const tenderId = (analysisData as any).tender_id || (analysisData as any).id;
      const { data: documents, error: docsError } = await supabase
        .from('tender_documents')
        .select('file_path')
        .eq('tender_id', tenderId);

      if (docsError) throw docsError;
      const filePaths = documents.map(d => d.file_path);

      if (filePaths.length === 0) {
        throw new Error("Nessun documento trovato per questa gara.");
      }

      const { data, error } = await supabase.functions.invoke('ask-question', {
        body: {
          tenderId: tenderId,
          section: sectionId,
          question: question,
          filePaths: filePaths,
          model: selectedSemanticModel // Use semantic model for questions
        }
      });

      if (error) throw error;

      // Update local state with the new answer
      if (data && data.answer) {
        setAnalysisData(prev => {
          if (!prev) return null;
          const newDeepDives = { ...prev.deep_dives };
          const sectionDives = newDeepDives[sectionId] || [];
          newDeepDives[sectionId] = [...sectionDives, {
            question,
            answer: data.answer,
            timestamp: new Date().toISOString()
          }];
          return { ...prev, deep_dives: newDeepDives };
        });
      }

    } catch (error: any) {
      console.error('Error asking question:', error);
      alert('Errore nella richiesta di approfondimento: ' + error.message);
    } finally {
      setIsAsking(false);
    }
  };

  const handleNewAnalysis = () => {
    if (analysisData) {
      const confirmed = window.confirm(
        "Attenzione: le sezioni verranno ripulite. Se prosegui, l'analisi verrà archiviata. Vuoi procedere?"
      );
      if (confirmed) {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  if (!session) {
    return <Login />;
  }

  return (
    <Layout
      activeSection={activeSection}
      onSectionClick={setActiveSection}
      data={analysisData}
      userPreferences={userPreferences}
      isAnalyzing={isUploading}
      loadingBatches={loadingBatches}
      onNewAnalysis={handleNewAnalysis}
      onOpenContact={() => setContactModalOpen(true)}
    >
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onOpenContact={() => { setShowUpgradeModal(false); setContactModalOpen(true); }}
      />
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        userId={session?.user?.id}
      />
      <TimeoutModal
        isOpen={showTimeoutModal}
        onContinue={() => handleTimeoutDecision('continue')}
        onTerminate={() => handleTimeoutDecision('terminate')}
      />
      <ModelSelectionModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        onConfirm={handleModelConfirm}
        defaultStructuredModelId={userPreferences.structured_model}
        defaultSemanticModelId={userPreferences.semantic_model}
      />
      {activeSection !== 'configurazioni' && activeSection !== 'archivio' ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center mb-8 relative">
            <div className="inline-block mb-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 flex items-center gap-2">
              <span>Crediti disponibili: {userCredits}</span>
              <button onClick={() => setShowPricingModal(true)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                Ricarica
              </button>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Benvenuto in Bid Digger</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Carica i documenti di gara (PDF) e lascia che la nostra AI li analizzi per te.
              Estrai requisiti, scadenze e criteri di valutazione in pochi secondi.
            </p>
          </div>
          <Upload
            onUpload={async (files) => handleFileSelection(files)}
            isUploading={isUploading}
            userTier={userPlan}
          />

          <div className="mt-8 max-w-3xl mx-auto grid gap-4 md:grid-cols-3 text-left">
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">1</span>
                Documenti
              </h3>
              <p className="text-sm text-slate-600">
                Si consiglia di caricare <strong>uno o due documenti</strong> (es. disciplinare e capitolato). Più documenti rendono i tempi di attesa più lunghi.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                Configurazioni
              </h3>
              <p className="text-sm text-slate-600">
                La sezione <strong>"Configurazioni"</strong> permette di selezionare o deselezionare l'analisi e/o l'export su report per contenuti non necessari.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">3</span>
                Approfondimenti
              </h3>
              <p className="text-sm text-slate-600">
                In ogni sezione e in <strong>"Faq e Approfondimenti"</strong> si possono aggiungere ulteriori richieste specifiche all'AI.
              </p>
            </div>
          </div>
          {isUploading && (
            <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="h-2 w-64 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 animate-progress origin-left" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">{progressMessage}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">Tempo trascorso: {formatTime(elapsedTime)}</p>
            </div>
          )}
        </div>
      ) : activeSection === 'archivio' ? (
        <ArchivePage
          userId={session.user.id}
          onLoadAnalysis={(data) => {
            setAnalysisData(data);
            setActiveSection('3_sintesi');
          }}
        />
      ) : (
        <Dashboard
          data={analysisData || {} as AnalysisResult}
          activeSection={activeSection}
          onAskQuestion={handleAskQuestion}
          isGlobalLoading={isAsking}
          userPreferences={userPreferences}
          onUpdatePreferences={handleUpdatePreferences}
          loadingBatches={loadingBatches}
        />
      )}
    </Layout>
  );
}

export default App;
