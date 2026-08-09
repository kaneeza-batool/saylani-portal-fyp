// Logistic regression implemented from scratch (batch gradient descent) —
// no ML library dependency. Small enough to read end-to-end and explain:
// z = w·x + b, prediction = sigmoid(z), weights updated by the average
// gradient of binary cross-entropy loss over the training batch.

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// X: number[][] (rows = samples, cols = features), y: number[] (0 or 1)
function train(X, y, { epochs = 3000, learningRate = 0.15, l2 = 0.001 } = {}) {
  const m = X.length;
  const n = X[0].length;
  let weights = new Array(n).fill(0);
  let bias = 0;
  const lossHistory = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(n).fill(0);
    let gradB = 0;
    let loss = 0;

    for (let i = 0; i < m; i++) {
      const pred = sigmoid(dot(X[i], weights) + bias);
      const error = pred - y[i];
      for (let j = 0; j < n; j++) gradW[j] += error * X[i][j];
      gradB += error;
      const eps = 1e-9;
      loss += -(y[i] * Math.log(pred + eps) + (1 - y[i]) * Math.log(1 - pred + eps));
    }

    for (let j = 0; j < n; j++) {
      weights[j] -= learningRate * (gradW[j] / m + l2 * weights[j]);
    }
    bias -= learningRate * (gradB / m);

    if (epoch % 200 === 0 || epoch === epochs - 1) lossHistory.push({ epoch, loss: loss / m });
  }

  return { weights, bias, lossHistory };
}

function predictProba(features, { weights, bias }) {
  return sigmoid(dot(features, weights) + bias);
}

module.exports = { sigmoid, train, predictProba };
