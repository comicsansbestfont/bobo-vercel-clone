/**
 * Seed database with test data for V1 testing
 * Run with: npx tsx tests/seed-data.ts
 */

const BASE_URL = 'http://localhost:3000';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Chat {
  id: string;
  title: string;
  model: string;
}

async function seedData() {
  console.log('🌱 Seeding Bobo AI test data...\n');
  console.log('Base URL:', BASE_URL);
  console.log('');

  try {
    // Test server connection
    const healthCheck = await fetch(BASE_URL).catch(() => null);
    if (!healthCheck) {
      console.error('❌ Error: Server not running at', BASE_URL);
      console.log('Please start the dev server: npm run dev');
      process.exit(1);
    }

    // Create 5 projects
    console.log('📁 Creating projects...');
    const projects: Project[] = [];
    const projectNames = [
      'E-Commerce Redesign',
      'ML Research Project',
      'Portfolio Rebuild',
      'API Documentation',
      'Mobile App Prototype',
    ];

    for (let i = 0; i < projectNames.length; i++) {
      const res = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectNames[i],
          description: `Test project ${i + 1} for V1 testing`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create project: ${await res.text()}`);
      }

      const data = await res.json();
      projects.push(data.project);
      console.log(`  ✓ Created: ${data.project.name}`);
    }

    // Create 15 standalone chats
    console.log('\n💬 Creating standalone chats...');
    const chats: Chat[] = [];
    const chatTitles = [
      'React Best Practices',
      'TypeScript Advanced Patterns',
      'API Design Discussion',
      'Database Optimization',
      'Authentication Flow',
      'State Management',
      'Performance Tuning',
      'Error Handling Strategies',
      'Testing Approaches',
      'Deployment Setup',
      'Docker Configuration',
      'CI/CD Pipeline',
      'Security Best Practices',
      'Code Review Process',
      'Documentation Standards',
    ];

    const models = [
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4.5',
      'google/gemini-2.5-pro',
    ];

    for (let i = 0; i < chatTitles.length; i++) {
      const res = await fetch(`${BASE_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chatTitles[i],
          model: models[i % models.length],
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create chat: ${await res.text()}`);
      }

      const data = await res.json();
      chats.push(data.chat);
      console.log(`  ✓ Created: ${data.chat.title}`);
    }

    // Distribute chats across projects
    console.log('\n🔗 Assigning chats to projects...');
    const chatsPerProject = [5, 3, 2, 4, 0]; // Leave last project empty

    let chatIndex = 0;
    for (let i = 0; i < chatsPerProject.length; i++) {
      const count = chatsPerProject[i];

      if (count === 0) {
        console.log(`  • ${projects[i].name}: No chats (empty project)`);
        continue;
      }

      for (let j = 0; j < count; j++) {
        if (chatIndex >= chats.length) break;

        await fetch(`${BASE_URL}/api/chats/${chats[chatIndex].id}/project`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projects[i].id }),
        });

        chatIndex++;
      }

      console.log(`  ✓ ${projects[i].name}: ${count} chats assigned`);
    }

    const standaloneChats = chats.length - chatIndex;
    console.log(`  • Standalone chats: ${standaloneChats}`);

    // Summary
    console.log('\n✅ Seeding complete!\n');
    console.log('Summary:');
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Total Chats: ${chats.length}`);
    console.log(`  Chats in Projects: ${chatIndex}`);
    console.log(`  Standalone Chats: ${standaloneChats}`);
    console.log('');
    console.log('You can now:');
    console.log('  1. Run automated tests: ./tests/api/run-all-tests.sh');
    console.log('  2. View app at: http://localhost:3000');
    console.log('  3. Check sidebar for projects and chats');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seeder
seedData();
