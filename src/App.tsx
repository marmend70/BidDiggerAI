import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Upload } from '@/components/Upload';
import { Dashboard } from '@/components/Dashboard';
import { LandingPage } from '@/components/LandingPage';
import { Login } from '@/components/Login';
import { AdminPage } from '@/components/AdminPage';
import { ArchivePage } from '@/components/ArchivePage';
import { TeamSettings } from '@/components/TeamSettings';
import { UpdatePassword } from '@/components/UpdatePassword';
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
  // Simple Routing
  const isAdminRoute = window.location.pathname === '/admin';
  if (isAdminRoute) {
    return <AdminPage />;
  }

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
  const [userRole, setUserRole] = useState<string>('user'); // Store role
  const [orgRole, setOrgRole] = useState<string | null>(null); // NEW: Store Workspace Role
  const [orgName, setOrgName] = useState<string | null>(null); // NEW: Store Workspace Name
  const [orgOwnerEmail, setOrgOwnerEmail] = useState<string | null>(null); // NEW: Store Owner Email
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(null); // NEW: Team Support
  const [myOrganizations, setMyOrganizations] = useState<any[]>([]); // NEW: List of available workspaces
  const [tenderCount, setTenderCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const MAX_TRIAL_TENDERS = 2;
  const [showScanRetryModal, setShowScanRetryModal] = useState(false);
  const [pendingRetryParams, setPendingRetryParams] = useState<{ sectionId: string, question: string } | null>(null);
  // Timeouts
  const [timeoutSettings, setTimeoutSettings] = useState<number>(240); // Default 4 minutes
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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

  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    return url.includes('type=recovery') || url.includes('update-password');
  });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
        // Load prefs to get retention policy for immediate cleanup
        supabase
          .from('profiles') // Corrected table name from user_profiles to profiles
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // 1. Fetch Preferences & Plan & Role & Organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences, plan_type, credits, role, app_role, default_organization_id')
        .eq('id', userId)
        .single();

      let currentOrgId = null;

      if (profile) {
        // Check app_role first (main source), then fallback to role
        const effectiveRole = (profile as any).app_role || profile.role;
        console.log("DEBUG: Profile roles - app_role:", (profile as any).app_role, "role:", profile.role);

        if (effectiveRole) {
          console.log("DEBUG: Setting User Role to:", effectiveRole);
          setUserRole(effectiveRole);
        }
        if (typeof profile.credits === 'number') {
          console.log("Setting credits to:", profile.credits); // Debug
          setUserCredits(profile.credits);
        } else {
          console.warn("Credits not found or not a number:", profile.credits);
        }

        // Set Organization
        if (profile.default_organization_id) {
          console.log("Setting Organization ID to:", profile.default_organization_id);
          setUserOrganizationId(profile.default_organization_id);
          setUserOrganizationId(profile.default_organization_id);
          currentOrgId = profile.default_organization_id;

          // Fetch Organization Role
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', profile.default_organization_id)
            .eq('user_id', userId)
            .single();

          if (memberData) {
            console.log("Setting Org Role to:", memberData.role);
            setOrgRole(memberData.role);
            setOrgName((memberData as any).organizations?.name);
          }
        }

        // FETCH ALL MY ORGANIZATIONS (For Switcher)
        let formattedOrgs: any[] = [];

        try {
          // Priority: Try Optimized RPC (if set up)
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_organizations');
          if (rpcError) throw rpcError;

          if (rpcData) {
            formattedOrgs = rpcData.map((item: any) => ({
              id: item.org_id,
              name: item.org_name,
              role: item.user_role,
              isPersonal: item.is_personal,
              ownerEmail: item.owner_email // NEW: Map Owner Email
            }));
          }
        } catch (err) {
          console.warn("RPC fetch failed, using fallback:", err);

          // Fallback: Standard Table Select
          const { data: fallbackData } = await supabase
            .from('organization_members')
            .select(`
                role,
                organization_id,
                organizations (
                  id,
                  name,
                  created_by
                )
              `)
            .eq('user_id', userId);

          if (fallbackData) {
            formattedOrgs = fallbackData.map((item: any) => ({
              id: item.organizations?.id,
              name: item.organizations?.name,
              role: item.role,
              isPersonal: item.organizations?.created_by === userId
            }));
          }
        }

        setMyOrganizations(formattedOrgs.filter((o: any) => o.id));

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
      // Updated to fetch based on Organization ID if available
      let countQuery = supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });

      if (currentOrgId) {
        countQuery = countQuery.eq('organization_id', currentOrgId);
      } else {
        countQuery = countQuery.eq('user_id', userId);
      }

      const { count, error: countError } = await countQuery;

      if (!countError && count !== null) {
        setTenderCount(count);
      }


      if (!countError && count !== null) {
        setTenderCount(count);
      }

      // 3. Fetch System Settings (Timeout)
      const { data: timeoutData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'analysis_timeout_seconds')
        .single();

      if (timeoutData && timeoutData.value) {
        setTimeoutSettings(Number(timeoutData.value));
      }

    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleWorkspaceSwitch = async (newOrgId: string | null) => {
    if (!session?.user || !newOrgId) return;

    // Optimistic Update
    setUserOrganizationId(newOrgId);

    // IMPORTANT: Clear current analysis state to prevent data leakage between workspaces
    setAnalysisData(null);
    setActiveSection('dashboard'); // Reset to dashboard/home

    try {
      // Persist preference
      await supabase
        .from('profiles')
        .update({ default_organization_id: newOrgId })
        .eq('id', session.user.id);

      // Reload data to reflect new workspace context (credits, tenders, role)
      await fetchUserData(session.user.id);

      // Reload window to ensure clean state if needed, or just let React handle it
      // window.location.reload(); // Optional: force reload if state is too complex
    } catch (err) {
      console.error("Error switching workspace:", err);
      alert("Errore cambio workspace");
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
  const hasWarnedTimeout = useRef(false);

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
            const geniusSuggestions = data[key].suggerimenti;

            data[key] = data[key].structured;

            // Re-attach Genius Fields to the section data
            if (data[key]) {
              // FIX: If it's an array, attach to the first element to ensure JSON persistence
              if (Array.isArray(data[key]) && data[key].length > 0) {
                if (geniusAnalysis) data[key][0].semantic_analysis = geniusAnalysis;
                if (geniusRisks) data[key][0].rischi_rilevati = geniusRisks;
                if (geniusSuggestions) data[key][0].suggerimenti = geniusSuggestions;
              } else {
                if (geniusAnalysis) data[key].semantic_analysis = geniusAnalysis;
                if (geniusRisks) data[key].rischi_rilevati = geniusRisks;
                if (geniusSuggestions) data[key].suggerimenti = geniusSuggestions;
              }
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
            allowDirectUpload: false,
            sector: currentPreferences.sector || 'Generale'
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
              // CRITICAL FIX: Inject tender_id so that subsequent updates work!
              return { ...processResult(match.result_json), tender_id: tenderId };
            }
          }
          // Check failure
          const { data: tCheck } = await supabase.from('tenders').select('status').eq('id', tenderId).single();
          if (tCheck?.status === 'failed') throw new Error("Analysis marked as failed");
          if (tCheck?.status === 'failed') throw new Error("Analysis marked as failed");

          // TIMEOUT CHECK
          // Using timeoutSettings (seconds) * 1000 = ms
          const WARNING_THRESHOLD = timeoutSettings * 1000;

          if (elapsed > WARNING_THRESHOLD && !hasWarnedTimeout.current) {
            console.warn(`[Analysis] Batch ${batchName} exceeded ${timeoutSettings}s. showing modal.`);
            hasWarnedTimeout.current = true; // Prevent multiple triggers per batch (though we have multiple batches running...)
            // Issue: if multiple batches run, they all hit this. We should only show one modal.
            // But strict mode might trigger twice.
            // We use a promise to pause.

            setShowTimeoutModal(true);
            const decision = await new Promise<'continue' | 'terminate'>((resolve) => {
              timeoutResolvers.current.push(resolve);
            });

            if (decision === 'terminate') {
              setLoadingBatches(prev => prev.filter(b => b !== batchName));
              // Return what we have or empty
              return {}; // We choose to abort this batch
            } else {
              // Reset warning to warn again after another interval? Or just let it run.
              // Let's reset elapsed relative to check? No, just let it run until MAX_POLL_TIME.
              // Typically we just want to warn once.
              // We could increase MAX_POLL_TIME if user says continue.
            }
          }
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
      } else {
        // --- ACTIVITY LOGGING: DONE ---
        // Log only if fully complete or at least "done" with this run
        supabase.from('tender_activities').insert({
          tender_id: tenderId,
          user_id: session.user.id,
          action_type: 'analysis_run',
          details: { batch_count: results.length }
        }).then(({ error }) => {
          if (error) console.error('Error logging analysis_run:', error);
        });
      }
    }

    // Inject tender_id into the local state for future updates
    setAnalysisData(prev => prev ? { ...prev, tender_id: tenderId } : { ...finalJson, tender_id: tenderId });

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

    // PREPARE PREFERENCES WITH FORCED SECTIONS
    // Requirement: "5_scadenze" must ALWAYS be analyzed (for timeline/archive), even if user disabled it.
    const forcedPreferences = {
      ...userPreferences,
      analysis_sections: {
        ...userPreferences.analysis_sections,
        "5_scadenze": true
      }
    };

    // CALCULATE ACTIVE BATCHES FOR SPINNER STATE based on FORCED preferences
    const BATCH_1 = { '3_sintesi': true, '3b_checklist_amministrativa': true, '5_scadenze': true };
    const BATCH_1B = { '1_requisiti_partecipazione': true, '6_importi': true, '8_ccnl': true };
    const BATCH_2 = { '4_servizi': true, '7_durata': true };
    const BATCH_2B = { '9_oneri': true, '15_remunerazione': true };
    const BATCH_2C = { '16_sla_penali': true };
    const BATCH_3 = { '12_offerta_tecnica': true };
    const BATCH_3B = { '13_offerta_economica': true, '10_punteggi': true, '11_pena_esclusione': true };
    const BATCH_4 = { '14_note_importanti': true, '17_ambiguita_punti_da_chiarire': true };

    const allBatches = [
      { name: 'batch_1', prefs: BATCH_1 }, { name: 'batch_1b', prefs: BATCH_1B },
      { name: 'batch_2', prefs: BATCH_2 }, { name: 'batch_2b', prefs: BATCH_2B }, { name: 'batch_2c', prefs: BATCH_2C },
      { name: 'batch_3', prefs: BATCH_3 }, { name: 'batch_3b', prefs: BATCH_3B }, { name: 'batch_4', prefs: BATCH_4 }
    ];

    const activeBatchNames = allBatches.filter(b => {
      // A batch is active if AT LEAST ONE of its sections is selected in FORCED preferences
      return Object.keys(b.prefs).some(k => forcedPreferences.analysis_sections[k]);
    }).map(b => b.name);

    setLoadingBatches(activeBatchNames);
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
          status: 'analyzing',
          organization_id: userOrganizationId // Inject Organization ID
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

      if (docsError) throw docsError;

      // --- ACTIVITY LOGGING: CREATED ---
      await supabase.from('tender_activities').insert({
        tender_id: tender.id,
        user_id: session.user.id,
        action_type: 'created',
        details: { title: title }
      });

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
      const { error: creditError } = await supabase.rpc('deduct_user_credits', {
        count: 1,
        org_id: userOrganizationId || null
      });
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

      // CALL EXECUTE ANALYSIS with FORCED PREFERENCES
      await executeAnalysis(tender.id, false, [], forcedPreferences, partialRecordIds);

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

  const handleUpdateUserNotes = async (sectionId: string, notes: string) => {
    if (!analysisData) return;

    // 1. Optimistic Update (Local State)
    const updatedData = { ...analysisData };

    // Determine how to update based on section structure
    if (sectionId === '3_sintesi') {
      const anySintesi = updatedData['3_sintesi'] as any;
      updatedData['3_sintesi'] = { ...anySintesi, user_notes: notes };
    } else {
      // Most sections are arrays where the first element holds our GeniusData
      const sectionData = updatedData[sectionId as keyof AnalysisResult] as any[];
      if (Array.isArray(sectionData) && sectionData.length > 0) {
        const newArray = [...sectionData];
        newArray[0] = { ...newArray[0], user_notes: notes };
        (updatedData as any)[sectionId] = newArray;
      } else if (updatedData[sectionId as keyof AnalysisResult]) {
        // Fallback for object-like sections if any exist besides 3_sintesi
        const objData = updatedData[sectionId as keyof AnalysisResult] as any;
        (updatedData as any)[sectionId] = { ...objData, user_notes: notes };
      }
    }

    setAnalysisData(updatedData);

    // 2. Persist to Supabase
    try {
      // Attempt to find the Analysis ID
      // It might be injected by ArchivePage (item.id) OR accessible via other context
      // If it's a new analysis, we might not have 'id' at top level of analysisData unless we injected it.
      // However, updates to 'tenders' table for 'notes' are separate.
      // Here we are updating 'analyses' -> 'result_json'.

      const analysisId = (updatedData as any).id;

      if (analysisId) {
        const { error } = await supabase
          .from('analyses')
          .update({ result_json: updatedData })
          .eq('id', analysisId);

        if (error) throw error;
      } else {
        console.warn("Analysis ID not found. User notes saved locally but persistence requires an Analysis ID.");
        // Optional: Try to fetch Analysis ID via tender_id if available?
        // Since we handle 'Archive' loading by injecting ID, this covers the main use case for persistence.
        // For fresh analyses, the record is created in backend. We might need to fetch it or wait for a reload.
        // But for now, this logic covers the requested 'Archive' persistence.
      }
    } catch (err) {
      console.error("Error saving user notes:", err);
    }

    // 3. Activity Logging (Async, don't block)
    try {
      const tId = (updatedData as any).tender_id || (updatedData as any).tenderId;
      // If we have a tender ID directly (best), use it.
      // If not, and we have analysisId, resolve it.
      let finalTenderId = tId;

      if (!finalTenderId && (updatedData as any).id) {
        const { data: aData } = await supabase.from('analyses').select('tender_id').eq('id', (updatedData as any).id).single();
        if (aData) finalTenderId = aData.tender_id;
      }

      if (finalTenderId) {
        await supabase.from('tender_activities').insert({
          tender_id: finalTenderId,
          user_id: session?.user?.id,
          action_type: 'section_update',
          details: {
            section: SECTIONS_MAP[sectionId]?.label || sectionId,
            note_snippet: notes.length > 50 ? notes.substring(0, 50) + '...' : notes
          }
        });
      }
    } catch (logErr) {
      console.warn('Failed to log section update:', logErr);
    }
  };

  const handleUpdateAnalysisField = async (section: string, path: (string | number)[], value: any) => {
    const tenderId = analysisData?.tender_id;
    if (!analysisData || !tenderId || !session?.user?.id) return;

    // 1. Deep Clone & Update Local State
    const newData = JSON.parse(JSON.stringify(analysisData));

    console.log("DEBUG: Updating Field", { section, path, value, tenderId });

    if (!tenderId) {
      console.error("CRITICAL: tenderId is missing in analysisData!", analysisData);
      alert("Errore: impossibile salvare (ID gara mancante).");
      return;
    }

    // Helper to set deep value
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === undefined) {
        current[key] = typeof path[i + 1] === 'number' ? [] : {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;

    // Optimistic Update
    setAnalysisData(newData);

    try {
      // 2. Persist to DB (Full JSON Update)
      const { error } = await supabase
        .from('analyses')
        .update({ result_json: newData })
        .eq('tender_id', tenderId);

      if (error) throw error;

      // 3. Log Activity
      const { error: logError } = await supabase.from('tender_activities').insert({
        tender_id: tenderId,
        user_id: session.user.id,
        action_type: 'section_update',
        details: {
          section,
          field: path.join('.'),
          new_value: value,
          timestamp: new Date().toISOString()
        }
      });

      if (logError) {
        console.warn("Soft Error: Failed to log activity (Constraint/RLS?):", logError);
        // We do typically NOT throw here to preserve the successful data save
      }

    } catch (err) {
      console.error("Failed to update field:", err);
      alert("Errore durante il salvataggio della modifica.");
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

  if (isRecoveryMode) {
    return <UpdatePassword />;
  }

  if (!session) {
    if (showLogin) {
      return <Login onOpenContact={() => setContactModalOpen(true)} />;
    }
    return <LandingPage onLogin={() => setShowLogin(true)} onRegister={() => setShowLogin(true)} />;
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
      onOpenContact={() => setContactModalOpen(true)}
      onOpenChatAssistant={() => setShowChatAssistant(true)}
      userRole={userRole}
      orgRole={orgRole} // PASSING THE MISSING PROP
      myOrganizations={myOrganizations} // MISSING PROP ADDED
      currentOrgId={userOrganizationId} // MISSING PROP ADDED
      onWorkspaceSwitch={handleWorkspaceSwitch} // MISSING PROP ADDED
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
            <AlertDialogDescription asChild>
              <div className="text-sm text-slate-500">
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
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResumeModal(false)}>Ignora e continua</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeAnalysis}>Prosegui Analisi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <ModelSelectionModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        onConfirm={handleModelConfirm}
        defaultStructuredModelId={userPreferences.structured_model}
        defaultSemanticModelId={userPreferences.semantic_model}
      />
      <div className="flex flex-col items-center gap-2 mb-4 shrink-0">
        <div className="inline-block px-4 py-2 bg-[#1e1e2d] text-indigo-400 rounded-full text-sm font-semibold border border-slate-700 flex items-center gap-2 shadow-sm">
          <span>{userOrganizationId ? "Crediti Workspace" : "Crediti disponibili"}: {userCredits}</span>
          <button onClick={() => setShowPricingModal(true)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 transition-colors">
            Ricarica
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            Account: {session?.user?.email}
          </span>
          {orgRole && (
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-500">
              Team: {orgRole === 'owner' ? 'Proprietario' : (orgRole === 'admin' ? 'Amministratore' : 'Membro')}
              {orgName && <span className="text-slate-500 ml-1">| {orgName}</span>}
            </span>
          )}
        </div>
      </div>

      {!analysisData && activeSection !== 'configurazioni' && activeSection !== 'archivio' && activeSection !== 'team' ? (
        <div className="flex flex-col items-center justify-start h-full pt-12 md:pt-24">
          <div className="text-center mb-8 relative">
            <h1 className="text-4xl font-bold text-slate-100 mb-4">Benvenuto in Bid Digger</h1>
            <p className="text-lg text-slate-400 max-w-4xl mx-auto leading-relaxed">
              Bid Digger è una piattaforma di analisi sintattica e semantica delle gare d’appalto, progettata per trasformare documenti complessi in informazioni strutturate, condivisibili e verificabili da team di lavoro. Dimentica le ore passate a leggere disciplinari. Bid Digger estrae requisiti, scadenze e criteri in secondi, condividendoli, modificandoli se necessario e fornendoti subito un completo quadro di fattibilità.
            </p>
          </div>
          <Upload
            onUpload={async (files) => handleFileSelection(files)}
            isUploading={isUploading}
            userTier={userPlan}
            userCredits={userCredits}
          />

          <div className="mt-8 max-w-5xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-left">
            <div className="p-4 bg-[#1e1e2d] rounded-lg border border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-400/10 text-blue-500 flex items-center justify-center text-xs font-bold border border-blue-400/20">1</span>
                Configurazioni
              </h3>
              <p className="text-sm text-slate-400">
                La sezione <strong>"Configurazioni"</strong> permette di selezionare i contenuti da analizzare o esportare, oltre ad altri parametri personalizzabili per adattare l'output alle tue esigenze.
              </p>
            </div>
            <div className="p-4 bg-[#1e1e2d] rounded-lg border border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-amber-400/10 text-amber-500 flex items-center justify-center text-xs font-bold border border-amber-400/20">2</span>
                Documenti
              </h3>
              <p className="text-sm text-slate-400">
                Si consiglia di caricare <strong>uno o due documenti</strong> (es. disciplinare e capitolato). Più documenti rendono i tempi di attesa più lunghi.
              </p>
            </div>
            <div className="p-4 bg-[#1e1e2d] rounded-lg border border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-purple-400/10 text-purple-500 flex items-center justify-center text-xs font-bold border border-purple-400/20">3</span>
                Verifica
              </h3>
              <p className="text-sm text-slate-400">
                Massimo controllo sui risultati: ogni campo rilevato dall'AI può essere facilmente <strong>modificato, corretto o integrato</strong> manualmente.
              </p>
            </div>
            <div className="p-4 bg-[#1e1e2d] rounded-lg border border-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-400/10 text-emerald-500 flex items-center justify-center text-xs font-bold border border-emerald-400/20">4</span>
                Approfondimenti
              </h3>
              <p className="text-sm text-slate-400">
                In ogni sezione e in <strong>"Approfondimenti"</strong> puoi aggiungere richieste specifiche, o chiedere supporto direttamente al <strong>ChatBOT Bid Digger Assistant</strong>.
              </p>
            </div>
          </div>
          {isUploading && (
            <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="h-2 w-64 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-amber-500 animate-progress origin-left" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-slate-300 font-medium animate-pulse">{progressMessage}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Tempo trascorso: {formatTime(elapsedTime)}</p>
            </div>
          )}
        </div>
      ) : activeSection === 'archivio' ? (
        <ArchivePage
          userId={session.user.id}
          organizationId={userOrganizationId} // Pass Organization ID
          userPreferences={userPreferences}
          onLoadAnalysis={(data, tenderId) => {
            setAnalysisData({ ...data, tender_id: tenderId });
            setActiveSection('3_sintesi');
          }}
        />
      ) : activeSection === 'team' ? (
        <TeamSettings
          currentUserId={session.user.id}
          organizationId={userOrganizationId}
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
          onUpdateUserNotes={handleUpdateUserNotes}
          onUpdateAnalysisField={handleUpdateAnalysisField}
        />
      )}
    </Layout>
  );
}

export default App;
