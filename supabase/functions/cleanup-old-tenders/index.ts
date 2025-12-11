import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DURATION_DAYS = 30;

Deno.serve(async (req) => {
    // Only allow POST requests (or Scheduled events which often come as POST)
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Admin client required for deletions
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        // 1. Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DURATION_DAYS);
        const cutoffString = cutoffDate.toISOString();

        console.log(`Starting cleanup for tenders created before ${cutoffString}`);

        // 2. Find old tenders
        const { data: tenders, error: findError } = await supabase
            .from('tenders')
            .select('id, user_id')
            .lt('created_at', cutoffString);

        if (findError) throw findError;

        if (!tenders || tenders.length === 0) {
            return new Response(JSON.stringify({ message: 'No old tenders to delete.' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log(`Found ${tenders.length} old tenders to delete.`);
        const results = { deletedTenders: 0, deletedFiles: 0, errors: [] as string[] };

        for (const tender of tenders) {
            try {
                // 3. Find associated files
                const { data: docs } = await supabase
                    .from('tender_documents')
                    .select('file_path')
                    .eq('tender_id', tender.id);

                if (docs && docs.length > 0) {
                    const filePaths = docs.map(d => d.file_path);
                    // 4. Delete files from Storage
                    const { error: storageError } = await supabase
                        .storage
                        .from('tenders')
                        .remove(filePaths);

                    if (storageError) {
                        console.error(`Error deleting files for tender ${tender.id}:`, storageError);
                        results.errors.push(`Storage error tender ${tender.id}: ${storageError.message}`);
                    } else {
                        results.deletedFiles += filePaths.length;
                    }
                }

                // 5. Delete Tender Record (Cascade should handle related tables like analyses/tender_documents if configured, 
                // otherwise we delete the tender which is the parent)
                const { error: dbError } = await supabase
                    .from('tenders')
                    .delete()
                    .eq('id', tender.id);

                if (dbError) {
                    console.error(`Error deleting tender record ${tender.id}:`, dbError);
                    results.errors.push(`DB error tender ${tender.id}: ${dbError.message}`);
                } else {
                    results.deletedTenders++;
                }

            } catch (err: any) {
                console.error(`Critical error processing tender ${tender.id}:`, err);
                results.errors.push(`Critical error tender ${tender.id}: ${err.message}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Cleanup completed. Deleted ${results.deletedTenders} tenders and ${results.deletedFiles} files.`,
            details: results
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
