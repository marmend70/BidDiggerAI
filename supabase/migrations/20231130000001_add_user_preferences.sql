-- Add preferences column to profiles table
alter table public.profiles 
add column if not exists preferences jsonb default '{
  "faq_questions": [
    "Descrivimi lo scenario dei sistemi tecnologici, infrastrutturale software, sistemi informatici",
    "Approfondisci il fabbisogno del personale impiegato in termini di giorni e/o ore richieste",
    "Quali sono le principali figure di responsabilità, gestione, coordinamento?",
    "Esegui una ricerca esterna sul servizio per trovare chi è l''attuale fornitore"
  ],
  "export_sections": {
    "1_requisiti_partecipazione": true,
    "3_sintesi": true,
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
    "15_remunerazione": true,
    "16_sla_penali": true,
    "faq": true
  },
  "menu_order": [
    "3_sintesi",
    "1_requisiti_partecipazione",
    "4_servizi",
    "5_scadenze",
    "6_importi",
    "7_durata",
    "8_ccnl",
    "9_oneri",
    "10_punteggi",
    "11_pena_esclusione",
    "12_offerta_tecnica",
    "13_offerta_economica",
    "14_note_importanti",
    "15_remunerazione",
    "16_sla_penali",
    "faq"
  ]
}'::jsonb;
