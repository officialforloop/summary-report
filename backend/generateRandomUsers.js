// /backend/generateRandomUsers.js
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");

const NUM_USERS = 50; // Number of users to generate
const OUTPUT_FILE = path.join(__dirname, "data", "users1.txt"); // Single file to store all users

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, "data");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Function to generate a random user
function generateRandomUser() {
  return {
    id: faker.number.int({ min: 1, max: 10000 }), // Generate random integer
    name: faker.person.fullName(), // Generate full name
    email: faker.internet.email(), // Generate random email
    age: faker.number.int({ min: 18, max: 80 }), // Generate random age
    country: faker.location.country(), // Generate random country
  };
}

// Generate an array of 50 users
const users = [];
for (let i = 0; i < NUM_USERS; i++) {
  const user = generateRandomUser();
  users.push(user);
}

// Write the entire array to a single text file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(users, null, 2), "utf-8");
console.log(`Generated ${NUM_USERS} users and saved to: ${OUTPUT_FILE}`);
