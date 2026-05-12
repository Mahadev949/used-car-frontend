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

@app.route("/upload-models", methods=["POST"])
def upload_models():
    try:
        if 'price_model' not in request.files and 'risk_model' not in request.files:
            return jsonify({"success": False, "error": "No model files provided"}), 400
            
        uploaded_files = []
        
        if 'price_model' in request.files:
            file = request.files['price_model']
            if file.filename != '':
                file.save("price_model.pkl")
                uploaded_files.append("price_model.pkl")
                
        if 'risk_model' in request.files:
            file = request.files['risk_model']
            if file.filename != '':
                file.save("risk_model.pkl")
                uploaded_files.append("risk_model.pkl")
                
        return jsonify({
            "success": True, 
            "message": f"Successfully uploaded: {', '.join(uploaded_files)}",
            "models": {
                "price_model": "found" if os.path.exists("price_model.pkl") else "MISSING",
                "risk_model": "found" if os.path.exists("risk_model.pkl") else "MISSING"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
