#!/usr/bin/env node

/**
 * Wake Up Check Script
 * 
 * This script checks the Mission Control board for pending tasks
 * and notifications when the agent wakes up.
 */

const https = require('https');
const http = require('http');

const MISSION_CONTROL_API = 'http://localhost:3000/api/tasks';
const API_KEY = 'dcacc13646957c02ae4657018a05c4ade8243816558c8bc72b8bd7647a32364d';

function checkMissionControl() {
  return new Promise((resolve, reject) => {
    const url = new URL(MISSION_CONTROL_API);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const tasks = JSON.parse(data);
            resolve(tasks);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🤖 Agent Developer Backend - Wake Up Check');
  console.log('⏰', new Date().toLocaleString());
  console.log('---');

  try {
    console.log('🔍 Checking Mission Control for pending tasks...');
    
    const tasks = await checkMissionControl();
    
    // Filter for pending tasks (not completed, not in testing)
    const pendingTasks = tasks.filter(task => 
      task.status !== 'done' && 
      task.status !== 'testing' &&
      task.status !== 'blocked'
    );

    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const testingTasks = tasks.filter(task => task.status === 'testing');
    const blockedTasks = tasks.filter(task => task.status === 'blocked');

    console.log(`📊 Mission Control Status:`);
    console.log(`   Total tasks: ${tasks.length}`);
    console.log(`   Pending: ${pendingTasks.length}`);
    console.log(`   In Progress: ${inProgressTasks.length}`);
    console.log(`   Testing: ${testingTasks.length}`);
    console.log(`   Blocked: ${blockedTasks.length}`);

    if (pendingTasks.length > 0) {
      console.log('\n🚨 PENDING TASKS NEED ATTENTION:');
      pendingTasks.forEach(task => {
        console.log(`   • Task #${task.id}: ${task.title || 'Untitled'} (${task.status})`);
        if (task.labels) {
          console.log(`     Labels: ${task.labels.join(', ')}`);
        }
      });
    }

    if (inProgressTasks.length > 0) {
      console.log('\n🔄 TASKS IN PROGRESS:');
      inProgressTasks.forEach(task => {
        console.log(`   • Task #${task.id}: ${task.title || 'Untitled'}`);
      });
    }

    console.log('\n✅ Wake up check completed successfully.');
    console.log('📋 Next: Review pending tasks and continue development.');

  } catch (error) {
    console.error('❌ Error checking Mission Control:', error.message);
    console.log('⚠️  Mission Control may be unavailable. Continuing with development...');
  }
}

// Run the check
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkMissionControl };