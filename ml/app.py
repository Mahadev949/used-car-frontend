from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_price_and_risk
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route("/", methods=["GET"])
def home():
    # Check for model files
    price_model_exists = os.path.exists("price_model.pkl")
    risk_model_exists = os.path.exists("risk_model.pkl")
    
    return jsonify({
        "status": "online",
        "message": "ML API Running",
        "version": "1.0.0",
        "models": {
            "price_model": "found" if price_model_exists else "MISSING",
            "risk_model": "found" if risk_model_exists else "MISSING"
        },
        "environment": {
            "cwd": os.getcwd(),
            "files": os.listdir(".")[:20] # List first 20 files for debugging
        }
    })

@app.route("/debug", methods=["GET"])
def debug():
    return jsonify({
        "cwd": os.getcwd(),
        "all_files": os.listdir("."),
        "ml_files": os.listdir("ml") if os.path.exists("ml") else "no ml dir"
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        result = predict_price_and_risk(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

import subprocess
import threading

# Global state for setup status
setup_status = {
    "active": False,
    "message": "Idle",
    "last_completed": None,
    "error": None
}

@app.route("/setup", methods=["POST"])
def setup():
    if setup_status["active"]:
        return jsonify({"success": False, "error": "Setup already in progress"}), 400
        
    def run_setup():
        try:
            setup_status["active"] = True
            setup_status["error"] = None
            
            # 1. Generate Dataset
            setup_status["message"] = "Generating synthetic dataset..."
            subprocess.run(["python", "generate_dataset.py"], check=True, capture_output=True)
            
            # 2. Train Model
            setup_status["message"] = "Training models (this may take a few minutes)..."
            subprocess.run(["python", "train_model.py"], check=True, capture_output=True)
            
            setup_status["message"] = "Setup completed successfully"
            setup_status["last_completed"] = os.path.abspath("price_model.pkl")
        except Exception as e:
            setup_status["error"] = str(e)
            setup_status["message"] = "Setup failed"
        finally:
            setup_status["active"] = False

    thread = threading.Thread(target=run_setup)
    thread.start()
    
    return jsonify({
        "success": True, 
        "message": "Setup started in background. Check /status for progress."
    })

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": setup_status,
        "models": {
            "price_model": "found" if os.path.exists("price_model.pkl") else "MISSING",
            "risk_model": "found" if os.path.exists("risk_model.pkl") else "MISSING"
        }
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
