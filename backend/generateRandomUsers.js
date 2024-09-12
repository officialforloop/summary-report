// /backend/generateRandomUsers.js
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");

const NUM_USERS = 50;
const OUTPUT_DIR = path.join(__dirname, "data");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Updated function to generate a random user
function generateRandomUser() {
  return {
    id: faker.number.int({ min: 1, max: 10000 }), // Use faker.number.int for random integers
    name: faker.person.fullName(), // Use faker.person.fullName for generating a full name
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 80 }), // Same fix for age
    country: faker.location.country(), // Use faker.location.country for random country
  };
}


for (let i = 0; i < NUM_USERS; i++) {
  const user = generateRandomUser();
  const filePath = path.join(OUTPUT_DIR, `user_${i + 1}.txt`);
  fs.writeFileSync(filePath, JSON.stringify(user, null, 2), "utf-8");
  console.log(`Generated: ${filePath}`);
}