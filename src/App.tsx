import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Upload } from '@/components/Upload';
import { Dashboard } from '@/components/Dashboard';
import { Login } from '@/components/Login';
import { AdminPage } from '@/components/AdminPage';
import { ArchivePage } from '@/components/ArchivePage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TimeoutModal } from '@/components/TimeoutModal';
import { ModelSelectionModal } from '@/components/ModelSelectionModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ContactModal } from '@/components/ContactModal';
import { ScanRetryModal } from '@/components/ScanRetryModal';
import { PricingModal } from '@/components/PricingModal';
import { ChatAssistantModal } from '@/components/ChatAssistantModal';
import { SnapshotModal } from '@/components/SnapshotModal';
import { AVAILABLE_MODELS, SECTIONS_MAP } from '@/constants';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult, UserPreferences } from '@/types';
import type { Session } from '@supabase/supabase-js';
import { countPdfPages } from '@/lib/fileUtils';


const DEFAULT_PREFERENCES: UserPreferences = {
  structured_model: 'gemini-2.5-flash',
  semantic_model: 'gemini-3-pro-preview',
  faq_questions: [
    "Descrivimi lo scenario dei sistemi tecnologici, infrastrutturale software, sistemi informatici",
    "Approfondisci il fabbisogno del personale impiegato in termini di giorni e/o ore richieste",
    "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
    "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
    "Quali sono i report e la documentazione di rendicontazione periodica da produrre nel corso del servizio a cura del fornitore?"
  ],
  owners: [],
  retention_days: 60,
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
    "faq": true,
    "0_snapshot": false
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
    "16_sla_penali": true,
    "faq": true,
    "0_snapshot": true
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
    "16_sla_penali": false,
    "faq": true,
    "0_snapshot": false
  }
};


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState('3_sintesi');
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const analysisDataRef = useRef<AnalysisResult | null>(null); // Ref to track live state for async access

  useEffect(() => {
    analysisDataRef.current = analysisData;
  }, [analysisData]);

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
  const [showScanRetryModal, setShowScanRetryModal] = useState(false);
  const [pendingRetryParams, setPendingRetryParams] = useState<{ sectionId: string, question: string } | null>(null);
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Cleanup Expired Tenders Function
  const cleanupExpiredTenders = async (userId: string, retentionDays: number) => {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - retentionDays);

      const { error, count } = await supabase
        .from('tenders')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .lt('created_at', expirationDate.toISOString());

      if (error) {
        console.error("Cleanup failed:", error);
      } else if (count && count > 0) {
        console.log(`[Retention Policy] Auto-deleted ${count} expired tenders (older than ${retentionDays} days).`);
      }
    } catch (e) {
      console.error("Cleanup exception:", e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
        // Load prefs to get retention policy for immediate cleanup
        supabase
          .from('user_profiles') // Note: Make sure table name matches your schema, usually 'user_profiles' or 'profiles'
          .select('preferences')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            const prefs = data?.preferences as UserPreferences;
            const retention = prefs?.retention_days || 60;
            cleanupExpiredTenders(session.user.id, retention);
          });
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
        .select('preferences, plan_type, credits, app_role')
        .eq('id', userId)
        .single();

      if (profile) {
        console.log("Fetched Profile:", profile); // Debug
        if (profile.plan_type) setUserPlan(profile.plan_type as 'trial' | 'pro');
        if (typeof profile.credits === 'number') {
          console.log("Setting credits to:", profile.credits); // Debug
          setUserCredits(profile.credits);
        } else {
          console.warn("Credits not found or not a number:", profile.credits);
        }

        if (profile.app_role === 'admin') {
          setIsAdmin(true);
        }

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
  // MODEL SELECTION STATE
  const [selectedStructuredModel, setSelectedStructuredModel] = useState<string>('gemini-2.5-flash');
  const [selectedSemanticModel, setSelectedSemanticModel] = useState<string>('gemini-3-pro-preview');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]); // Added for Chatbot Context

  // NEW: Resume Analysis State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSections, setResumeSections] = useState<string[]>([]);




  /* EXECUTE ANALYSIS (Moved here for scope) */
  const executeAnalysis = async (
    tenderId: string,
    isResume: boolean = false,
    sectionsToResume: string[] = [],
    currentPreferences: UserPreferences,
    existingPartialIds: string[] = []
  ) => {
    // VALIDATION: Ensure session exists for path construction
    if (!session?.user?.id) {
      console.error("Critical: Session missing in executeAnalysis");
      alert("Errore critico: Sessione utente persa. Ricarica la pagina.");
      return;
    }

    // Reconstruct storage path
    const textStoragePath = `${session.user.id}/${tenderId}/extracted_text.txt`;
    console.log("[executeAnalysis] textStoragePath:", textStoragePath);

    const preferences = currentPreferences.analysis_sections || {}; // Safety check

    // Helper to filter preferences
    const getBatchPreferences = (batch: Record<string, boolean>) => {
      const prefs: Record<string, boolean> = {};
      Object.keys(batch).forEach(key => {
        if (preferences[key]) prefs[key] = true;
      });
      return prefs;
    };

    // Local accumulator for semantic data to ensure it persists in finalJson
    const semanticAccumulator: Record<string, any> = {};

    // Define internal runBatch inside executeAnalysis (or pass args)
    const runBatch = async (batchName: string, batchPrefs: Record<string, boolean>, sModel: string, semModel: string) => {
      if (Object.keys(batchPrefs).length === 0) {
        setLoadingBatches(prev => prev.filter(b => b !== batchName));
        return {};
      }

      const processResult = (originalData: any) => {
        // --- ADAPTER ---
        const data = { ...originalData };
        Object.keys(data).forEach(key => {
          if (data[key] && typeof data[key] === 'object' && 'structured' in data[key]) {
            if (data[key].analysis) {
              if (!data.semantic_analysis_data) data.semantic_analysis_data = {};
              data.semantic_analysis_data[key] = data[key].analysis;
            }
            const geniusAnalysis = data[key].semantic_analysis;
            const geniusRisks = data[key].rischi_rilevati;
            data[key] = data[key].structured;
            if (data[key] && (geniusAnalysis || geniusRisks)) {
              if (geniusAnalysis) data[key].semantic_analysis = geniusAnalysis;
              if (geniusRisks) data[key].rischi_rilevati = geniusRisks;
            }
          }
        });
        // ----------------

        setLoadingBatches(prev => prev.filter(b => b !== batchName));

        if (data && data.error) {
          // Only alert if it's not a known "not found" that we can ignore or handled elsewhere
          // But here we alert.
          alert(`Errore batch ${batchName}: ${data.error}`);
          return data;
        }

        // --- FILTERING PROTECTION ---
        // Ensure we only accept keys that were requested in this batch.
        // This prevents "hallucinated" empty keys from other sections (e.g. Batch 3 returning empty SLA)
        // from overwriting the valid state.
        const filteredData: any = {};
        Object.keys(data).forEach(k => {
          // We accept:
          // 1. Keys explicitly in batchPrefs (e.g. "16_sla_penali")
          // 2. Metadata keys (starting with _)
          // 3. "semantic_analysis_data" (special handling below)
          if (batchPrefs[k] || k.startsWith('_') || k === 'semantic_analysis_data') {
            filteredData[k] = data[k];
          }
        });
        // -----------------------------

        if (filteredData.semantic_analysis_data) {
          // Capture semantic data for final save
          Object.assign(semanticAccumulator, filteredData.semantic_analysis_data);
        }

        setAnalysisData(prev => {
          const newData = prev ? { ...prev } : { tender_id: tenderId } as AnalysisResult;

          if (filteredData.semantic_analysis_data) {
            // Deep merge semantic analysis data
            newData.semantic_analysis_data = {
              ...(newData.semantic_analysis_data || {}),
              ...filteredData.semantic_analysis_data
            };
            // Don't modify 'filteredData' in place as it might be used elsewhere? 
            // actually we can just delete it from the merge source to avoid top-level clutter
            delete filteredData.semantic_analysis_data;
          }

          Object.assign(newData, filteredData);
          return newData;
        });
        return filteredData;
      };

      try {
        // ... invoke analyze-tender 'analyze' ...
        const { error: invokeError } = await supabase.functions.invoke('analyze-tender', {
          body: {
            tenderId: tenderId,
            filePaths: uploadedPaths, // State
            analysisPreferences: batchPrefs,
            semanticPreferences: currentPreferences.semantic_analysis_sections,
            background: true,
            saveToDb: true,
            textStoragePath: textStoragePath,
            structuredModel: sModel,
            semanticModel: semModel,
            action: 'analyze',
            batchName: batchName,
            allowDirectUpload: false
          }
        });

        if (invokeError) throw invokeError;

        // ... Polling Logic ...
        const startTime = new Date().toISOString();
        const MAX_POLL_TIME = 10 * 60 * 1000;
        const POLL_INTERVAL = 2000;
        let elapsed = 0;

        while (elapsed < MAX_POLL_TIME) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL));
          elapsed += POLL_INTERVAL;

          const { data: rows } = await supabase.from('analyses').select('*').eq('tender_id', tenderId).gt('created_at', startTime);
          if (rows && rows.length > 0) {
            const match = rows.find(r => r.result_json?._batch_name === batchName);
            if (match) {
              if (existingPartialIds) existingPartialIds.push(match.id);
              return processResult(match.result_json);
            }
          }
          // Check failure
          const { data: tCheck } = await supabase.from('tenders').select('status').eq('id', tenderId).single();
          if (tCheck?.status === 'failed') throw new Error("Analysis marked as failed");
        }
        throw new Error("Timeout polling partial result");
      } catch (e: any) {
        console.error(e);
        setLoadingBatches(prev => prev.filter(b => b !== batchName));
        return {};
      }
    }; // End runBatch (Internal)

    const BATCH_1 = { '3_sintesi': true, '3b_checklist_amministrativa': true, '5_scadenze': true };
    const BATCH_1B = { '1_requisiti_partecipazione': true, '6_importi': true, '8_ccnl': true };
    const BATCH_2 = { '4_servizi': true, '7_durata': true };
    const BATCH_2B = { '9_oneri': true, '15_remunerazione': true };
    const BATCH_2C = { '16_sla_penali': true };
    const BATCH_3 = { '12_offerta_tecnica': true };
    const BATCH_3B = { '13_offerta_economica': true, '10_punteggi': true, '11_pena_esclusione': true };
    const BATCH_4 = { '14_note_importanti': true, '17_ambiguita_punti_da_chiarire': true };

    const batchConfigs = [
      { name: 'batch_1', prefs: BATCH_1 }, { name: 'batch_1b', prefs: BATCH_1B },
      { name: 'batch_2', prefs: BATCH_2 }, { name: 'batch_2b', prefs: BATCH_2B }, { name: 'batch_2c', prefs: BATCH_2C },
      { name: 'batch_3', prefs: BATCH_3 }, { name: 'batch_3b', prefs: BATCH_3B }, { name: 'batch_4', prefs: BATCH_4 }
    ];

    const batchPromises: Promise<any>[] = [];
    const structuredModelId = userPreferences.structured_model || 'gemini-2.5-flash';
    const semanticModelId = userPreferences.semantic_model || 'gemini-3-pro-preview';

    for (const batch of batchConfigs) {
      // RESUME FILTER: Only process batches that contain missing sections
      if (isResume && sectionsToResume.length > 0) {
        const batchSectionKeys = Object.keys(batch.prefs); // e.g. ["3_sintesi", "5_scadenze"]
        const needsProcessing = batchSectionKeys.some(key => sectionsToResume.includes(key));
        if (!needsProcessing) {
          console.log(`[Analysis] Skipping ${batch.name} (Resume Mode - Not in missing sections)`);
          continue; // Skip this batch
        }
        console.log(`[Analysis] Resuming ${batch.name} for sections:`, batchSectionKeys.filter(k => sectionsToResume.includes(k)));
      }

      // Add to loading state
      // const batchId = `${batch.name}-${Date.now()}`; // Unique ID for tracking if needed, but we use name for UI
      setLoadingBatches(prev => [...prev, batch.name]);
      const hasSemantic = Object.keys(batch.prefs).some(k => currentPreferences.semantic_analysis_sections?.[k]);
      const batchStructModel = hasSemantic ? 'gemini-3-pro-preview' : structuredModelId;

      // Filter prefs logic
      let activePrefs = getBatchPreferences(batch.prefs);
      if (isResume && sectionsToResume.length > 0) {
        const filtered: Record<string, boolean> = {};
        Object.keys(activePrefs).forEach(k => { if (sectionsToResume.includes(k)) filtered[k] = true; });
        activePrefs = filtered;
      }

      if (Object.keys(activePrefs).length > 0) {
        batchPromises.push(runBatch(batch.name, activePrefs, batchStructModel, semanticModelId));
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const rawResults = await Promise.all(batchPromises);
    const results = rawResults.filter(r => r && Object.keys(r).length > 0);

    // MERGE LOGIC: Start with existing data if resuming, otherwise clean slate
    // MERGE LOGIC: Start with existing data (Ref or Resume)
    // We use a "Smart Merge" to prevent empty batches from overwriting populated ones
    const finalJson: any = analysisDataRef.current ? { ...analysisDataRef.current } : (isResume && analysisData ? { ...analysisData } : { _ragionamento: "Analisi completata" });

    // Attach accumulated semantic data
    if (!finalJson.semantic_analysis_data) finalJson.semantic_analysis_data = {};
    if (isResume && analysisData?.semantic_analysis_data) {
      Object.assign(finalJson.semantic_analysis_data, analysisData.semantic_analysis_data);
    }
    Object.assign(finalJson.semantic_analysis_data, semanticAccumulator);

    // Apply results from current run with protection
    console.log("[Final Save] Merging results into Final JSON. Results count:", results.length);
    results.forEach((r, idx) => {
      if (!r) return;
      Object.keys(r).forEach(key => {
        const existing = finalJson[key];
        const incoming = r[key];

        // PROTECTIVE MERGE:
        // 1. If we don't have it, take it.
        // 2. If incoming is populated array/object, take it (overwrite).
        // 3. If incoming is empty/null, BUT we already have data, IGNORE incoming.
        const isIncomingGood = incoming && (Array.isArray(incoming) ? incoming.length > 0 : Object.keys(incoming).length > 0);
        const isExistingGood = existing && (Array.isArray(existing) ? existing.length > 0 : Object.keys(existing).length > 0);

        if (!isExistingGood || isIncomingGood) {
          finalJson[key] = incoming;
        } else {
          console.warn(`[Final Save] Prevented overwrite of key '${key}' by empty data from batch result index ${idx}`);
        }
      });
    });

    console.log("[Final Save] Constructing final JSON from", analysisDataRef.current ? "Live Ref" : "Reconstruction");

    // SAVE FINAL
    await supabase.functions.invoke('analyze-tender', {
      body: {
        action: 'save_final_and_cleanup',
        tenderId: tenderId,
        finalJson: finalJson,
        partialRecordIds: existingPartialIds,
        modelUsed: structuredModelId
      }
    });

    await supabase.from('tenders').update({ status: 'completed' }).eq('id', tenderId);
    setIsUploading(false);

    // COMPLETION CHECK
    // Only verify if we are truly done (no other batches loading)
    if (currentPreferences.analysis_sections) {
      const req = Object.keys(currentPreferences.analysis_sections).filter(k => currentPreferences.analysis_sections[k]);
      const got = Object.keys(finalJson);
      // Exclude 'faq' as it's not a standard analysis section
      const missing = req.filter(k => k !== 'faq' && k !== '0_snapshot' && !got.includes(k) && !finalJson[k]); // Check both existence and truthiness

      if (missing.length > 0) {
        console.warn("Analysis incomplete. Missing:", missing);
        setResumeSections(missing);
        setShowResumeModal(true);
      }
    }
  };


  const handleFileSelection = async (files: File[]) => {
    // 1. Check Credits
    if (userCredits < 1) {
      setShowPricingModal(true);
      return;
    }

    // 2. CHECK FILE LIMIT
    // If resuming, files are already passed or we use current uploadedPaths
    const filesToProcess = files.length > 0 ? files : (uploadedPaths.length > 0 ? [] : []); // Logic handled below or passed arg

    // We expect files arg to be empty if resuming, but let's handle it in runAnalysis primarily.
    // Actually handleFileSelection is triggered by file input usually. 
    // Resume will call runAnalysis directly.

    // ... logic continues ...
    // But since I refactored runAnalysis OUT or modified it...
    // Wait, the previous edit CHANGED runAnalysis signature BUT it was inside handleFileSelection scope.
    // I need to be careful about where I placed runAnalysis. It seems I kept it inside?
    // Let's assume runAnalysis is still inside handleFileSelection scope? No, I likely want it accessible.
    // But handleFileSelection uses `setLoaded...` etc.

    // Let's implement the logic INSIDE runAnalysis loop first.

    if (files.length > 3) {
      alert("Puoi caricare un massimo di 3 documenti per analisi.");
      return;
    }

    // 3. CHECK PAGE LIMIT (New Requirement: Max 300 pages total)
    let totalPages = 0;
    for (const file of files) {
      if (file.type === 'application/pdf') {
        const pages = await countPdfPages(file);
        totalPages += pages;
      }
    }

    if (totalPages > 300) {
      alert(`Hai superato il limite di 300 pagine totali (Attuali: ${totalPages}). \n\nPer favore riduci il numero di documenti o dividili per procedere con l'analisi.`);
      return;
    }

    // Use user preferences or defaults
    const sModel = userPreferences.structured_model || 'gemini-2.5-flash';
    const semModel = userPreferences.semantic_model || 'gemini-3-pro-preview';

    // Verify User Preference overrides if needed? User said "Metti di default", implies forceful.
    // But then "Elimina scelta". So I imply Hardcode.
    // Proceed directly to analysis
    startAnalysis(files, sModel, semModel);
  };

  const handleModelConfirm = (structuredId: string, semanticId: string) => {
    // Legacy support for modal - unused now
    setSelectedStructuredModel(structuredId);
    setSelectedSemanticModel(semanticId);
    setShowModelModal(false);
    startAnalysis(pendingFiles, structuredId, semanticId);
  };

  const startAnalysis = async (files: File[], structuredModelId: string, semanticModelId: string) => {
    if (!session?.user) return;

    // RULE: If '0_snapshot' is active, we MUST ensure its dependencies are active.
    // Dependencies: 3_sintesi, 5_scadenze, 6_importi, 7_durata, 8_ccnl
    if (userPreferences.analysis_sections['0_snapshot']) {
      const requiredSections = ['3_sintesi', '5_scadenze', '6_importi', '7_durata', '8_ccnl'];
      const missingDeps = requiredSections.filter(k => !userPreferences.analysis_sections[k]);

      if (missingDeps.length > 0) {
        console.log("Auto-enabling dependencies for Snapshot:", missingDeps);
        setUserPreferences(prev => {
          const updated = { ...prev.analysis_sections };
          missingDeps.forEach(k => updated[k] = true);
          return { ...prev, analysis_sections: updated };
        });
        // Note: The state update above is async, but for the immediate 'startAnalysis' run
        // we need to patch the preferences object used locally or rely on the updated state if we re-read it.
        // However, userPreferences is a const in this closure. 
        // We should patch it locally for the current execution flow.
        missingDeps.forEach(k => userPreferences.analysis_sections[k] = true);
      }
    }
    setIsUploading(true);
    setElapsedTime(0);
    setProgressMessage(`Avvio analisi (Standard: ${structuredModelId})...`);
    setLoadingBatches(['batch_1', 'batch_1b', 'batch_2', 'batch_2b', 'batch_2c', 'batch_3', 'batch_3b', 'batch_4']);
    setAnalysisData(null); // Reset previous data

    try {
      const uploadedPaths: string[] = [];
      const fileNames: string[] = [];

      // 1. Upload ALL files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Math.random()}.${fileExt}`; // Ensure unique file names per user
        const filePath = `${session.user.id}/${fileName}`;

        // Retry logic for upload
        let uploadError = null;
        for (let i = 0; i < 3; i++) {
          try {
            const { error } = await supabase.storage
              .from('tenders')
              .upload(filePath, file);
            if (error) throw error;
            uploadError = null;
            break; // Success
          } catch (e: any) {
            console.warn(`Upload attempt ${i + 1} failed for ${file.name}:`, e);
            uploadError = e;
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Backoff
          }
        }

        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
        fileNames.push(file.name);
      }
      setUploadedPaths(uploadedPaths); // Store in state for UI/Chatbot

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
      // We use a dedicated file for the entire tender's text
      const textStoragePath = `${session.user.id}/${tender.id}/extracted_text.txt`;

      const { data: extractData, error: extractError } = await supabase.functions.invoke('analyze-tender', {
        body: {
          tenderId: tender.id,
          filePaths: uploadedPaths,
          action: 'extract_and_store', // FIXED: Use correct action for credits
          textStoragePath: textStoragePath
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

      console.log("Text stored at:", textStoragePath);

      console.log("Text stored at:", textStoragePath);

      // DEDUCT CREDIT (1 per Analysis) - SKIP IF RESUMING
      // DEDUCT CREDIT (1 per Analysis)
      const { error: creditError } = await supabase.rpc('deduct_user_credits', { count: 1 });
      if (creditError) {
        console.error("Credit deduction failed:", creditError);
      } else {
        setUserCredits(prev => Math.max(0, prev - 1));
      }

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

      const partialRecordIds: string[] = [];

      // CALL EXECUTE ANALYSIS
      await executeAnalysis(tender.id, false, [], userPreferences, partialRecordIds);

    } catch (error: any) {
      console.error('Error:', error);
      alert('Errore durante l\'analisi: ' + error.message);
      setIsUploading(false);
      setLoadingBatches([]);
    }
  }; // END startAnalysis



  // RESUME HANDLER
  const handleResumeAnalysis = () => {
    setShowResumeModal(false);
    if (resumeSections.length > 0) {
      console.log("Resuming analysis for:", resumeSections);
      // Get tenderId from analysisData
      // @ts-ignore
      const tId = analysisData?.tender_id || analysisData?.id;
      if (tId) {
        // Execute in Resume Mode
        executeAnalysis(tId, true, resumeSections, userPreferences, []);
      } else {
        alert("Impossibile recuperare ID gara per la ripresa.");
      }
    }
  };


  const handleAskQuestion = async (sectionId: string, question: string, forceVisualMode = false) => {
    if (!analysisData || !session?.user) return;
    setIsAsking(true);
    console.log("Asking question with forceVisualMode:", forceVisualMode);

    try {
      // Fetch file paths from tender_documents
      const tenderId = (analysisData as any).tender_id || (analysisData as any).id;

      // FALLBACK: If we have newly uploaded paths in state, use them first to avoid DB lag
      let filePaths = uploadedPaths && uploadedPaths.length > 0 ? uploadedPaths : [];

      if (filePaths.length === 0) {
        const { data: documents, error: docsError } = await supabase
          .from('tender_documents')
          .select('file_path')
          .eq('tender_id', tenderId);

        if (docsError) throw docsError;
        filePaths = documents.map(d => d.file_path);
      }

      if (filePaths.length === 0) {
        throw new Error("Nessun documento trovato per questa gara.");
      }

      // Context Injection: Pass the current analysis JSON to the chatbot
      // This allows Gemini to know what it has already extracted.
      const analysisContext = analysisData;


      let responseData;
      let usedModel = selectedSemanticModel;

      try {
        // Attempt 1: Primary Model
        const { data, error } = await supabase.functions.invoke('analyze-tender', {
          body: {
            action: 'ask_question',
            tenderId: tenderId,
            section: sectionId,
            question: question,
            filePaths: filePaths,
            analysisContext: analysisContext,
            model: selectedSemanticModel,
            forceVisualMode: forceVisualMode,
          }
        });

        if (error) throw error;
        responseData = data;

      } catch (err: any) {
        // Fallback Logic
        console.warn(`Attempt with ${selectedSemanticModel} failed:`, err);
        if (selectedSemanticModel === 'gemini-3-pro-preview') {
          console.log("Falling back to gemini-2.5-pro...");
          usedModel = 'gemini-2.5-pro';

          const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('analyze-tender', {
            body: {
              action: 'ask_question',
              tenderId: tenderId,
              section: sectionId,
              question: question,
              filePaths: filePaths,
              analysisContext: analysisContext,
              model: 'gemini-2.5-pro', // Fallback Model
              forceVisualMode: forceVisualMode,
            }
          });

          if (fallbackError) throw fallbackError;
          responseData = fallbackData;
        } else {
          throw err;
        }
      }

      const data = responseData;
      console.log("Backend response debug mode:", data._debug_mode);
      console.log("Full backend response:", data);

      // SMART RETRY LOGIC (Frontend Detection)
      if (!forceVisualMode && data && data.answer) {
        const lowerAnswer = data.answer.toLowerCase();
        // Keywords suggesting failed OCR / empty text
        const failureKeywords = [
          "[[scan_detected]]", // Strict tag from backend
          "non riesco a leggere",
          "non riesco a trovare il testo",
          "testo estratto è vuoto",
          "documento sembra vuoto",
          "impossibile leggere",
          "non vedo il testo",
          "nei documenti forniti non",
          "non contengono testo",
          "scansione",
          "immagine",
          "errore estrazione testo",
          "non è stato possibile leggere",
          "non è disponibile nei documenti",
          "non posso rispondere sulla base dei documenti",
          "non posso rispondere basandomi",
          "non è possibile rispondere",
          "non trovo informazioni",
          "non riesco a rispondere",
          "non sono in grado di rispondere",
          "purtroppo non",
          "mi dispiace ma",
          "basandomi esclusivamente sui documenti forniti non"
        ];

        // If answer is short (< 1000 chars) AND contains failure keyword
        // (Short check prevents false positives in long explanations)
        console.log("Checking for failure. Length:", data.answer.length);
        const detectedKeyword = failureKeywords.find(k => lowerAnswer.includes(k));
        if (detectedKeyword) console.log("Detected keyword:", detectedKeyword);

        // CONDITIONAL LOGIC:
        // 1. If strict tag [[scan_detected]] is found -> ALWAYS trigger (ignore length)
        // 2. If other weak keywords found -> trigger ONLY if answer is short (< 1000 chars)
        const isStrictTag = detectedKeyword === "[[scan_detected]]";
        const isShortEnough = data.answer.length < 1000;

        if ((isStrictTag || (detectedKeyword && isShortEnough))) {
          console.log("Detected potential OCR failure. Suggesting Visual Mode retry.");
          setPendingRetryParams({ sectionId, question });
          setShowScanRetryModal(true);
          setIsAsking(false); // Stop loading
          return; // Halt process, don't show the failed answer yet
        }
      }

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

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === '0_snapshot') {
      setSnapshotModalOpen(true);
    } else {
      setActiveSection(sectionId);
    }
  };

  if (!session) {
    return <Login onOpenContact={() => setContactModalOpen(true)} />;
  }

  // Admin Route Check
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  return (
    <Layout
      activeSection={activeSection}
      onSectionClick={handleSectionClick}
      data={analysisData}
      userPreferences={userPreferences}
      isAnalyzing={isUploading}
      loadingBatches={loadingBatches}
      onNewAnalysis={handleNewAnalysis}
      isAdmin={isAdmin}
      onOpenContact={() => setContactModalOpen(true)}
      onOpenChatAssistant={() => setShowChatAssistant(true)}
    >
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onOpenContact={() => { setShowUpgradeModal(false); setContactModalOpen(true); }}
      />
      <SnapshotModal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        data={analysisData}
      />
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
      <ScanRetryModal
        isOpen={showScanRetryModal}
        onClose={() => {
          setShowScanRetryModal(false);
          setPendingRetryParams(null);
        }}
        onConfirm={() => {
          if (pendingRetryParams) {
            handleAskQuestion(pendingRetryParams.sectionId, pendingRetryParams.question, true);
            setShowScanRetryModal(false);
            setPendingRetryParams(null);
          }
        }}
      />
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        userId={session?.user?.id}
      />
      <ChatAssistantModal
        isOpen={showChatAssistant}
        onClose={() => setShowChatAssistant(false)}
        tenderId={(analysisData as any)?.tender_id || (analysisData as any)?.id}
        tenderTitle={(analysisData as any)?.title || 'Analisi Gara'}
        filePaths={uploadedPaths} // Pass currently uploaded paths
        analysisContext={analysisData} // Pass the full analysis JSON
      />
      <TimeoutModal
        isOpen={showTimeoutModal}
        onClose={() => setShowTimeoutModal(false)}
        onContinue={() => handleTimeoutDecision('continue')}
        onTerminate={() => handleTimeoutDecision('terminate')}
      />

      {/* RESUME ANALYSIS MODAL */}
      <AlertDialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analisi Incompleta</AlertDialogTitle>
            <AlertDialogDescription>
              A causa del sovraccarico delle richieste o di un timeout, le seguenti sezioni non sono state completate:
              <ul className="list-disc pl-5 mt-2 mb-2 text-slate-700 font-medium">
                {resumeSections.map(sId => (
                  <li key={sId}>{SECTIONS_MAP[sId]?.label || sId}</li>
                ))}
              </ul>
              <br />
              Vuoi riavviare l'analisi <strong>limitatamente alle sezioni mancanti</strong>?
              <br />
              <span className="font-semibold text-green-600">Nota: Non verranno scalati ulteriori crediti.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResumeModal(false)}>Ignora e continua</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeAnalysis}>Prosegui Analisi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      {!analysisData && activeSection !== 'configurazioni' && activeSection !== 'archivio' ? (
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
            userCredits={userCredits}
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
          userPreferences={userPreferences}
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
