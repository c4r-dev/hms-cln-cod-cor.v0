const fs = require('fs');
const path = require('path');

function csvToJson(csvFilePath, jsonFilePath) {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Split into lines and remove empty lines
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Get headers from first line
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    // Convert each line to an object
    const jsonArray = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
      const obj = {};
      
      headers.forEach((header, index) => {
        let value = values[index] || '';
        
        // Try to convert to number if it looks like a number
        if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        
        obj[header] = value;
      });
      
      jsonArray.push(obj);
    }
    
    // Write to JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2));
    
    console.log(`✅ Successfully converted ${csvFilePath} to ${jsonFilePath}`);
    console.log(`📊 Converted ${jsonArray.length} rows`);
    
    return jsonArray;
  } catch (error) {
    console.error('❌ Error converting CSV to JSON:', error.message);
    return null;
  }
}

// Usage
const csvFile = process.argv[2];
const jsonFile = process.argv[3];

if (!csvFile || !jsonFile) {
  console.log('Usage: node scripts/convert-csv-to-json.js <input.csv> <output.json>');
  console.log('Example: node scripts/convert-csv-to-json.js data.csv public/data.json');
  process.exit(1);
}

csvToJson(csvFile, jsonFile);