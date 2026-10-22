#!/usr/bin/env bash
# Exit on error
set -o errexit

echo ">>> [1/3] Installing Frontend Dependencies and Building Assets..."
cd frontend
npm install
npm run build
cd ..

echo ">>> [2/3] Installing Python Backend Dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo ">>> [3/3] Build Complete! Ready for Deployment."
