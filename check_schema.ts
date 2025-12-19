
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.master
const envPath = path.resolve('.env.master')
let supabaseUrl = ''
let supabaseKey = ''

if (fs.existsSync(envPath)) {
    const fileContent = fs.readFileSync(envPath, 'utf-8')
    fileContent.split('\n').forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) {
            supabaseUrl = line.replace('VITE_SUPABASE_URL=', '').trim()
        }
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.replace('VITE_SUPABASE_ANON_KEY=', '').trim()
        }
    })
}

if (!supabaseUrl || !supabaseKey) {
    console.error(`Missing Supabase env vars from ${envPath}`)
    process.exit(1)
}

console.log(`Using Supabase URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfileSchema() {
    console.log('Checking profiles table schema...')

    // Fetch one profile
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching profile:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Profile columns found:', Object.keys(data[0]))
        console.log('First profile sample:', data[0])
    } else {
        console.log('No profiles found to inspect.')
    }
}

checkProfileSchema()
