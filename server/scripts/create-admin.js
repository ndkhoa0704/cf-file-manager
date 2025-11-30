#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node create-admin.js [username] [password]
 * Or run interactively: node create-admin.js
 */

const readline = require('node:readline');
const User = require('../src/models/User');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('=== Create Admin User ===\n');

    let username = process.argv[2];
    let password = process.argv[3];

    if (!username) {
        username = await question('Username: ');
    }

    if (!password) {
        password = await question('Password: ');
    }

    // Validate
    if (!username || username.length < 3) {
        console.error('Error: Username must be at least 3 characters');
        process.exit(1);
    }

    if (!password || password.length < 6) {
        console.error('Error: Password must be at least 6 characters');
        process.exit(1);
    }

    // Check if user exists
    const existing = User.findByUsername(username);
    if (existing) {
        console.error('Error: Username already exists');
        process.exit(1);
    }

    try {
        const user = await User.create(username, password, 'admin');
        console.log('\n✓ Admin user created successfully!');
        console.log(`  Username: ${user.username}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Storage: ${user.storage_path}`);
    } catch (error) {
        console.error('Error creating user:', error.message);
        process.exit(1);
    }

    rl.close();
    process.exit(0);
}

main();

