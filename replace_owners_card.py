
import os

file_path = 'src/components/Dashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end markers of the block to replace
start_marker = "{/* Owners Management - Gestione Responsabili */}"
# We look for the closing of the card which is </Card> followed by some indentation and then valid code.
# The block ends at line 2115 approx.
# We will use a regex or string find.

# Construct the NEW content
new_content_block = r"""                        {/* Helper function to render Owner Management Cards */}
                        {[
                            { title: "Responsabili Tecnici", key: 'owners_tech', dbColumn: 'owner_tech', desc: "Gestisci l'elenco dei Responsabili Tecnici." },
                            { title: "Responsabili Amministrativi", key: 'owners_admin', dbColumn: 'owner_admin', desc: "Gestisci l'elenco dei Responsabili Amministrativi." },
                            { title: "Responsabili Commerciali", key: 'owners_comm', dbColumn: 'owner_comm', desc: "Gestisci l'elenco dei Responsabili Commerciali." }
                        ].map((roleConfig) => {
                            const listKey = roleConfig.key;
                            const dbCol = roleConfig.dbColumn;
                            const ownersList = userPreferences?.[listKey] || [];

                            return (
                                <Card key={listKey}>
                                    <CardHeader>
                                        <CardTitle>{roleConfig.title}</CardTitle>
                                        <CardDescription>{roleConfig.desc}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id={`new-${listKey}`}
                                                placeholder={`Nuovo ${roleConfig.title}...`}
                                                className="flex-1 px-3 py-2 border rounded-md text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const input = e.currentTarget;
                                                        const val = input.value.trim();
                                                        if (val && onUpdatePreferences && userPreferences) {
                                                            const currentOwners = userPreferences[listKey] || [];
                                                            onUpdatePreferences({
                                                                ...userPreferences,
                                                                [listKey]: [...currentOwners, val]
                                                            });
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                                                onClick={() => {
                                                    const input = document.getElementById(`new-${listKey}`);
                                                    const val = input.value.trim();
                                                    if (val && onUpdatePreferences && userPreferences) {
                                                        const currentOwners = userPreferences[listKey] || [];
                                                        onUpdatePreferences({
                                                            ...userPreferences,
                                                            [listKey]: [...currentOwners, val]
                                                        });
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                Aggiungi
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {ownersList.length === 0 && (
                                                <p className="text-sm text-slate-500 italic">Nessun nominativo configurato.</p>
                                            )}
                                            {ownersList.map((owner, i) => (
                                                <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                                                    {(editingOwnerState?.list === listKey && editingOwnerState?.index === i) ? (
                                                        <input
                                                            type="text"
                                                            defaultValue={owner}
                                                            className="flex-1 px-2 py-1 border rounded text-sm mr-2"
                                                            autoFocus
                                                            onKeyDown={async (e) => {
                                                                if (e.key === 'Enter') {
                                                                    const newVal = e.currentTarget.value.trim();
                                                                    if (newVal && newVal !== owner && onUpdatePreferences && userPreferences) {
                                                                        // 1. Update Preferences
                                                                        const newOwners = [...(userPreferences[listKey] || [])];
                                                                        newOwners[i] = newVal;
                                                                        onUpdatePreferences({
                                                                            ...userPreferences,
                                                                            [listKey]: newOwners
                                                                        });

                                                                        // 2. Propagate to DB (Tenders)
                                                                        try {
                                                                            const { error } = await supabase
                                                                                .from('tenders')
                                                                                .update({ [dbCol]: newVal })
                                                                                .eq(dbCol, owner);

                                                                            if (error) throw error;
                                                                            console.log(`Updated ${dbCol} from '${owner}' to '${newVal}'`);
                                                                        } catch (err) {
                                                                            console.error("Failed to propagate owner rename:", err);
                                                                            alert("Attenzione: Il nome è stato aggiornato nelle impostazioni, ma potrebbe non essere stato salvato su tutte le gare in archivio.");
                                                                        }
                                                                        setEditingOwnerState(null);
                                                                    } else if (newVal === owner) {
                                                                        setEditingOwnerState(null);
                                                                    }
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingOwnerState(null);
                                                                }
                                                            }}
                                                            onBlur={() => setEditingOwnerState(null)}
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-slate-700 flex-1">{owner}</span>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            className="text-blue-500 hover:text-blue-700"
                                                            onClick={() => setEditingOwnerState({ list: listKey, index: i })}
                                                        >
                                                            <FileCode size={16} className="h-4 w-4" /> {/* Use size prop or className */}
                                                        </button>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => {
                                                                if (onUpdatePreferences && userPreferences) {
                                                                    const newOwners = [...(userPreferences[listKey] || [])];
                                                                    newOwners.splice(i, 1);
                                                                    onUpdatePreferences({
                                                                        ...userPreferences,
                                                                        [listKey]: newOwners
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Ban size={16} className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
"""

# Find start index
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Error: Start marker not found.")
    exit(1)

# Find end index (approximate, look for </Card> and closure of that specific block)
# The block ends with </Card> then some indentation and </div> (of the parent)
# We can search for the next </Card> after start_idx.
end_marker = "</Card>"
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Error: End marker not found.")
    exit(1)
end_idx += len(end_marker) # Include </Card>

# Replace
new_full_content = content[:start_idx] + new_content_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_full_content)

print("Successfully replaced content.")
