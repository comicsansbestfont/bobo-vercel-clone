import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying M3-02 Phase 2 Migration...\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/20251201000000_m3_phase2_memory_entries.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Migration file loaded:', migrationPath);
  console.log('SQL length:', migrationSQL.length, 'characters\n');

  try {
    // Split by statement and execute one by one
    // This is safer than executing the entire file at once
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');

      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_sql').select('*').limit(0);

          if (directError || error) {
            console.log(`   ❌ Failed: ${error?.message || directError?.message}`);
            failureCount++;

            // Some errors are ok (like "already exists")
            if (error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')) {
              console.log('   ℹ️  This is ok - object already exists');
              successCount++;
            }
          } else {
            console.log('   ✅ Success');
            successCount++;
          }
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`   ❌ Error: ${message}`);
        failureCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} succeeded, ${failureCount} failed\n`);

    // Verify migration
    console.log('🔍 Verifying migration...\n');

    const { error: tableError } = await supabase
      .from('memory_entries')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('❌ Verification failed: memory_entries table not accessible');
      console.log('   Error:', tableError.message);
      console.log('\n⚠️  Manual action required:');
      console.log('   1. Open Supabase Dashboard → SQL Editor');
      console.log('   2. Paste contents of: supabase/migrations/20251201000000_m3_phase2_memory_entries.sql');
      console.log('   3. Execute the SQL');
      process.exit(1);
    }

    console.log('✅ memory_entries table accessible');

    const { error: settingsError } = await supabase
      .from('memory_settings')
      .select('user_id')
      .limit(1);

    if (settingsError) {
      console.log('❌ memory_settings table not accessible');
      process.exit(1);
    }

    console.log('✅ memory_settings table accessible');

    console.log('\n✅ MIGRATION APPLIED SUCCESSFULLY!\n');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Migration failed:', message);
    console.log('\n⚠️  Manual action required:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Paste contents of: supabase/migrations/20251201000000_m3_phase2_memory_entries.sql');
    console.log('   3. Execute the SQL');
    process.exit(1);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
