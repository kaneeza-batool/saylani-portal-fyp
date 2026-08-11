// Bootstraps a synthetic, labeled training set (real historical dropout
// outcomes don't exist yet in a fresh DB) using a defined generative
// process, then trains logistic regression on it — the same pattern real
// risk-scoring systems use before enough real-world labels accumulate.
// Run with `npm run train:ml`; re-run any time to retrain with a fresh
// random draw. Output: dropoutModel.json (weights the live scorer loads).

const fs = require('fs');
const path = require('path');
const { train, sigmoid } = require('./logisticRegression');
const { FEATURE_NAMES } = require('./features');

// "Ground truth" used ONLY to label synthetic examples — the trainer never
// sees these directly, it has to recover an approximation from sampled
// (features, label) pairs, same as it would from real historical data.
const GROUND_TRUTH_WEIGHTS = {
  attendanceRate: -3.2, // higher attendance -> much lower dropout risk
  paymentOverdue: 2.4, // overdue payment -> higher risk
  paymentPending: 0.8, // pending payment -> mild risk bump
  tenureMonths: 1.1, // longer without completing -> creeping risk
  statusPending: 1.5, // stuck in "pending" enrollment -> risk
};
const GROUND_TRUTH_BIAS = -0.6;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function sampleFeatureVector() {
  return [
    randomBetween(0, 1), // attendanceRate
    Math.random() < 0.2 ? 1 : 0, // paymentOverdue (~20% of synthetic population)
    Math.random() < 0.25 ? 1 : 0, // paymentPending
    randomBetween(0, 1), // tenureMonths (pre-normalized)
    Math.random() < 0.15 ? 1 : 0, // statusPending
  ];
}

function generateDataset(size = 600) {
  const weights = FEATURE_NAMES.map((n) => GROUND_TRUTH_WEIGHTS[n]);
  const X = [];
  const y = [];
  for (let i = 0; i < size; i++) {
    const x = sampleFeatureVector();
    const z = x.reduce((sum, xi, j) => sum + xi * weights[j], GROUND_TRUTH_BIAS);
    // Irwin-Hall-ish noise (sum of uniforms) so labels aren't a deterministic
    // function of features — real outcomes never are.
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 0.6;
    const trueProb = sigmoid(z + noise);
    X.push(x);
    y.push(Math.random() < trueProb ? 1 : 0);
  }
  return { X, y };
}

function evaluateAccuracy(X, y, model) {
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    const p = sigmoid(X[i].reduce((s, xi, j) => s + xi * model.weights[j], model.bias));
    if ((p >= 0.5 ? 1 : 0) === y[i]) correct++;
  }
  return correct / X.length;
}

function run() {
  const { X, y } = generateDataset(600);
  const { weights, bias, lossHistory } = train(X, y, { epochs: 3000, learningRate: 0.15 });
  const accuracy = evaluateAccuracy(X, y, { weights, bias });

  const model = {
    featureNames: FEATURE_NAMES,
    weights,
    bias,
    trainedAt: new Date().toISOString(),
    trainingSamples: X.length,
    trainAccuracy: accuracy,
    finalLoss: lossHistory[lossHistory.length - 1]?.loss,
  };

  fs.writeFileSync(path.join(__dirname, 'dropoutModel.json'), JSON.stringify(model, null, 2));
  console.log(`Trained on ${model.trainingSamples} synthetic samples — train accuracy ${(accuracy * 100).toFixed(1)}%`);
  console.log('Learned weights:', Object.fromEntries(FEATURE_NAMES.map((n, i) => [n, weights[i].toFixed(3)])));
  console.log('Saved to server/ml/dropoutModel.json');
}

if (require.main === module) run();

module.exports = { generateDataset, run };
