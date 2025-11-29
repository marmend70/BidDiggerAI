import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Upload } from '@/components/Upload';
import { Dashboard } from '@/components/Dashboard';
import { Login } from '@/components/Login';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/types';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState('3_sintesi');
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [progressMessage, setProgressMessage] = useState('');

  const handleUpload = async (files: File[]) => {
    if (!session?.user) return;
    setIsUploading(true);
    setProgressMessage('Caricamento documenti...');

    try {
      const uploadedPaths: string[] = [];
      const fileNames: string[] = [];

      // 1. Upload ALL files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tenders')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
        fileNames.push(file.name);
      }

      // 2. Create tender record (using the first file name as title, or a generic one)
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

      // 3. Invoke Edge Function with ALL paths
      // This now returns immediately saying "Analysis started"
      setProgressMessage('Avvio analisi...');
      const { error: invokeError } = await supabase.functions.invoke('analyze-tender', {
        body: {
          tenderId: tender.id,
          filePaths: uploadedPaths
        }
      });

      if (invokeError) throw invokeError;

      // 4. Poll for completion
      setProgressMessage('Analisi documenti con AI in corso... Potrebbe richiedere un minuto.');
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes timeout (150 * 2s)

      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setIsUploading(false);
          alert('Tempo scaduto per l\'analisi. Riprova o contatta il supporto.');
          return;
        }

        const { data: currentTender, error: pollError } = await supabase
          .from('tenders')
          .select('status')
          .eq('id', tender.id)
          .single();

        if (pollError) {
          clearInterval(pollInterval);
          setIsUploading(false);
          alert('Errore nel controllo dello stato: ' + pollError.message);
          return;
        }

        if (currentTender.status === 'completed') {
          clearInterval(pollInterval);

          // Fetch the result
          const { data: analysis, error: analysisError } = await supabase
            .from('analyses')
            .select('result_json')
            .eq('tender_id', tender.id)
            .single();

          if (analysisError) {
            alert('Errore nel recupero dell\'analisi: ' + analysisError.message);
          } else {
            setAnalysisData(analysis.result_json);
          }
          setIsUploading(false);
        } else if (currentTender.status === 'failed') {
          clearInterval(pollInterval);
          setIsUploading(false);
          alert('Analisi fallita sul server.');
        }
        // If 'analyzing', continue polling
      }, 2000); // Poll every 2 seconds

    } catch (error: any) {
      console.error('Error:', error);
      alert('Error during analysis: ' + error.message);
      setIsUploading(false);
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
    >
      {!analysisData ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Benvenuto in Bid Digger</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Carica i documenti di gara (PDF) e lascia che la nostra AI li analizzi per te.
              Estrai requisiti, scadenze e criteri di valutazione in pochi secondi.
            </p>
          </div>
          <Upload onUpload={handleUpload} isUploading={isUploading} />
          {isUploading && (
            <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="h-2 w-64 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 animate-progress origin-left" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-slate-500 font-medium animate-pulse">{progressMessage}</p>
            </div>
          )}
        </div>
      ) : (
        <Dashboard data={analysisData} activeSection={activeSection} />
      )}
    </Layout>
  );
}

export default App;
