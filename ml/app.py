from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_price_and_risk
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "ML API Running",
        "version": "1.0.0"
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
