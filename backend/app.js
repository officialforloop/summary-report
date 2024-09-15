const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");
const ERROR_LOG = path.join(__dirname, "error_log.txt");
const SUMMARY_REPORT = path.join(__dirname, "summary_report.txt");

app.use(cors());

// Helper function to log errors to error_log.txt
function logError(message) {
  const logEntry = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync(ERROR_LOG, logEntry);
  console.log(logEntry);  // Debug: Log to console as well
}

// Helper function to validate each user object
function isValidUser(user) {
  return (
    typeof user.id === "number" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.age === "number" &&
    typeof user.country === "string"
  );
}

// Helper function to parse JSON content and handle errors
function parseJSON(content, filename) {
  try {
    const data = JSON.parse(content); // Attempt to parse the content as JSON

    // Ensure the file contains an array of JSON objects
    if (Array.isArray(data)) {
      const validUsers = data.filter(isValidUser); // Validate each user in the array
      if (validUsers.length === 0) {
        logError(`No valid JSON objects in array in file ${filename}`);
        return null; // If no valid users, return null
      }
      return validUsers; // Return array of valid users
    } else {
      logError(`File ${filename} does not contain an array of JSON objects`);
      return null; // Invalid structure, skip this file
    }
  } catch (error) {
    logError(`Error parsing JSON in file ${filename}: ${error.message}`);
    return null; // Return null to indicate parsing failure
  }
}

// Asynchronously process files in the data directory, ensuring only valid JSON is processed
async function processFiles() {
  const validUsers = [];
  let totalUsers = 0;
  let totalAge = 0;
  const countryCount = {};

  const files = await fs.promises.readdir(DATA_DIR);
  
  // Filter and separate files based on file extension
  const txtFiles = files.filter((file) => path.extname(file) === ".txt");
  const nonTxtFiles = files.filter((file) => path.extname(file) !== ".txt");

  // Log all non-txt files to the error log
  nonTxtFiles.forEach(file => logError(`Invalid file format: ${file}`));

  const processFile = async (file) => {
    const filePath = path.join(DATA_DIR, file);
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");

      const usersArray = parseJSON(content, file); // Attempt to parse JSON array

      if (usersArray) {
        usersArray.forEach((user) => {
          const { age, country } = user;

          validUsers.push(user);
          totalUsers++;
          totalAge += age;

          // Count country occurrences
          countryCount[country] = (countryCount[country] || 0) + 1;
        });
      } else {
        logError(`File ${file} does not contain a valid array of JSON objects.`);
      }
    } catch (readError) {
      logError(`Error reading file ${file}: ${readError.message}`);
    }
  };

  // Process all txt files concurrently
  await Promise.all(txtFiles.map(processFile));

  return { totalUsers, totalAge, countryCount, validUsers };
}

// Generate and save summary report securely
async function generateSummaryReport() {
  const { totalUsers, totalAge, countryCount } = await processFiles();

  if (totalUsers === 0) {
    logError("No valid JSON data found in the txt files.");
    return null; // Exit if no valid users
  }

  // Calculate the average age securely
  const averageAge = totalUsers > 0 ? (totalAge / totalUsers) : 0;

  const topCountries = Object.entries(countryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

     const countryLabels = topCountries.map(([country]) => country);
     const countryData = topCountries.map(([, count]) => count);

  const summaryContent = {
    totalUsers,
    averageAge,
    countryLabels,
    countryData,
  };

  // Save the summary to a file
  await fs.promises.writeFile(SUMMARY_REPORT, JSON.stringify(summaryContent, null, 2));

  return summaryContent;
}

// API endpoint to get the summary report
app.get("/summary", async (req, res) => {
  try {
    const summary = await generateSummaryReport();
    if (!summary) {
      res.status(400).json({ error: "No valid JSON data found" });
    } else {
      res.json(summary);
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred during summary report generation" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
