const fs = require('fs');
const path = require('path');
const { predictProba } = require('./logisticRegression');

const MODEL_PATH = path.join(__dirname, 'dropoutModel.json');

let cachedModel = null;
function loadModel() {
  if (!cachedModel) {
    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error('Dropout model not found — run `npm run train:ml` in server/ first.');
    }
    cachedModel = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
  }
  return cachedModel;
}

function scoreFeatures(features) {
  const model = loadModel();
  return predictProba(features, model);
}

function riskBand(probability) {
  if (probability >= 0.6) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

module.exports = { loadModel, scoreFeatures, riskBand };
