import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadTranscripts() {
  const basePath = path.join(process.cwd(), 'advisory/deals/MyTab/Meetings');

  // Load pitch practice transcript
  const pitchTranscriptPath = path.join(basePath, '_raw/2025-12-02-pitch-practice-transcript.txt');
  const pitchTranscript = fs.readFileSync(pitchTranscriptPath, 'utf-8');

  // Load discovery call transcript
  const discoveryTranscriptPath = path.join(basePath, '2025-11-10-discovery-call-transcript.txt');
  const discoveryTranscript = fs.readFileSync(discoveryTranscriptPath, 'utf-8');

  console.log(`Pitch practice transcript: ${pitchTranscript.length} characters`);
  console.log(`Discovery call transcript: ${discoveryTranscript.length} characters`);

  // Update pitch practice meeting
  const { data: pitchData, error: pitchError } = await supabase
    .from('activity_meetings')
    .update({
      transcript: pitchTranscript,
      transcript_source: 'manual'
    })
    .ilike('title', '%Pitch Practice%')
    .select('id, title');

  if (pitchError) {
    console.error('Error updating pitch practice transcript:', pitchError);
  } else {
    console.log('Updated pitch practice meeting:', pitchData);
  }

  // Update discovery call meeting
  const { data: discoveryData, error: discoveryError } = await supabase
    .from('activity_meetings')
    .update({
      transcript: discoveryTranscript,
      transcript_source: 'manual'
    })
    .ilike('title', '%Discovery Call%')
    .select('id, title');

  if (discoveryError) {
    console.error('Error updating discovery call transcript:', discoveryError);
  } else {
    console.log('Updated discovery call meeting:', discoveryData);
  }

  // Verify the updates
  const { data: verifyData, error: verifyError } = await supabase
    .from('activity_meetings')
    .select('id, title, transcript_source, source_file_path')
    .not('transcript', 'is', null);

  if (verifyError) {
    console.error('Error verifying:', verifyError);
  } else {
    console.log('\nMeetings with transcripts:');
    verifyData?.forEach(m => {
      console.log(`- ${m.title}: source=${m.transcript_source}`);
    });
  }
}

loadTranscripts().catch(console.error);
