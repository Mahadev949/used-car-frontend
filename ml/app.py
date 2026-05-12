from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_price_and_risk
import os
import sys
import subprocess
import threading

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

# Global state for setup status
setup_status = {
    "active": False,
    "message": "Idle",
    "last_completed": None,
    "error": None
}

@app.route("/setup", methods=["GET", "POST"])
def setup():
    if setup_status["active"]:
        return jsonify({"success": False, "error": "Setup already in progress", "status": setup_status}), 400
        
    def run_setup():
        try:
            setup_status["active"] = True
            setup_status["error"] = None
            setup_status["message"] = "Starting setup..."
            
            python_exe = sys.executable or "python"
            
            # 1. Generate Dataset
            setup_status["message"] = "Step 1/3: Generating synthetic dataset..."
            res1 = subprocess.run([python_exe, "generate_dataset.py"], capture_output=True, text=True)
            if res1.returncode != 0:
                raise Exception(f"Dataset generation failed: {res1.stderr}")
            
            # 2. Train Price Model
            setup_status["message"] = "Step 2/3: Training Price Model (Random Forest)..."
            res2 = subprocess.run([python_exe, "train_model.py"], capture_output=True, text=True)
            if res2.returncode != 0:
                raise Exception(f"Price model training failed: {res2.stderr}")
            
            # 3. Train Risk Model
            setup_status["message"] = "Step 3/3: Training Risk Classifier..."
            res3 = subprocess.run([python_exe, "risk_classification.py"], capture_output=True, text=True)
            if res3.returncode != 0:
                raise Exception(f"Risk model training failed: {res3.stderr}")
            
            setup_status["message"] = "Setup completed successfully. All models generated."
            setup_status["last_completed"] = {
                "time": os.popen("date").read().strip(),
                "price_model": os.path.exists("price_model.pkl"),
                "risk_model": os.path.exists("risk_model.pkl")
            }
        except Exception as e:
            setup_status["error"] = str(e)
            setup_status["message"] = "Setup failed"
            print(f"SETUP ERROR: {e}")
        finally:
            setup_status["active"] = False

    thread = threading.Thread(target=run_setup)
    thread.start()
    
    return jsonify({
        "success": True, 
        "message": "Setup started in background. Monitor progress at /status",
        "method_used": request.method
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
