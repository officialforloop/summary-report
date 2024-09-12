// Backend: /backend/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); /

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");
const ERROR_LOG = path.join(__dirname, "error_log.txt");
const SUMMARY_REPORT = path.join(__dirname, "summary_report.txt");

app.use(cors());

// Helper function to parse JSON content
function parseJSON(content, filename) {
  try {
    return JSON.parse(content);
  } catch (error) {
    fs.appendFileSync(ERROR_LOG, `Invalid JSON in file: ${filename}\n`);
    return null;
  }
}

// Asynchronously process files in a directory
async function processFiles() {
  const validUsers = [];
  let totalUsers = 0;
  let totalAge = 0;
  const countryCount = {};

  const files = await fs.promises.readdir(DATA_DIR);
  const txtFiles = files.filter((file) => path.extname(file) === ".txt");

  const processFile = async (file) => {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const user = parseJSON(content, file);

    if (user) {
      validUsers.push(user);

      // Update statistics
      totalUsers++;
      totalAge += user.age;

      countryCount[user.country] = (countryCount[user.country] || 0) + 1;
    }
  };

  await Promise.all(txtFiles.map(processFile));

  return { totalUsers, totalAge, countryCount, validUsers };
}

// Generate and save summary report
async function generateSummaryReport() {
  const { totalUsers, totalAge, countryCount } = await processFiles();

  const averageAge = totalUsers > 0 ? totalAge / totalUsers : 0;

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

  await fs.promises.writeFile(
    SUMMARY_REPORT,
    JSON.stringify(summaryContent, null, 2)
  );

  return summaryContent;
}

// API endpoint to get all valid JSON objects
app.get("/summary", async (req, res) => {
  try {
    const summary = await generateSummaryReport();
    // console.log(summary)
    res.json(summary);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred during summary report generation" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
