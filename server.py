from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import time

import firebase_admin
from firebase_admin import credentials, firestore

# ================= CONFIG =================
ZAPUPI_CREATE_URL = "https://api.zapupi.com/api/create-order"

ZAPUPI_TOKEN = "d6a35a8e8f49bafd82ba29f01589225a"
ZAPUPI_SECRET = "8f6d1397dcf23599c528228554d79692"

FRONTEND_BASE = "http://localhost:8000"  # production में live URL डालना

# ================= FIREBASE INIT =================
db = None

try:
    firebase_key_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if firebase_key_str:
        service_account_info = json.loads(firebase_key_str)
        cred = credentials.Certificate(service_account_info)
    else:
        cred = credentials.Certificate("serviceAccountKey.json")

    firebase_admin.initialize_app(cred)
    db = firestore.client()

except Exception as e:
    print("Firebase init failed:", e)
    db = None

# ================= FLASK INIT =================
app = Flask(__name__)
CORS(app)

# ================= CREATE ORDER =================
@app.route("/api/create-order", methods=["POST"])
def create_order():
    if db is None:
        return jsonify({"status": "error", "message": "Database not available"}), 500

    try:
        data = request.json
        product_id = data.get("productId")
        user_id = data.get("userId")

        if not product_id or not user_id:
            return jsonify({"status": "error", "message": "Missing params"}), 400

        product_doc = db.collection("products").document(product_id).get()
        if not product_doc.exists:
            return jsonify({"status": "error", "message": "Product not found"}), 404

        product = product_doc.to_dict()
        amount = int(product.get("price", 0))
        if amount <= 0:
            return jsonify({"status": "error", "message": "Invalid amount"}), 400

        order_id = str(int(time.time() * 1000))

        # Pending order create
        db.collection("orders").document(order_id).set({
            "orderId": order_id,
            "userId": user_id,
            "productId": product_id,
            "amount": amount,
            "status": "pending",
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        redirect_url = f"{FRONTEND_BASE}/success.html?id={product_id}&order={order_id}"

        payload = {
            "token_key": ZAPUPI_TOKEN,
            "secret_key": ZAPUPI_SECRET,
            "amount": amount,
            "order_id": order_id,
            "redirect_url": redirect_url
        }

        res = requests.post(ZAPUPI_CREATE_URL, data=payload, timeout=30)
        zapupi = res.json()

        if zapupi.get("status") != "success":
            db.collection("orders").document(order_id).update({
                "status": "failed",
                "failedAt": firestore.SERVER_TIMESTAMP
            })
            return jsonify({"status": "error", "message": zapupi.get("message")}), 400

        return jsonify({
            "status": "success",
            "payment_url": zapupi.get("payment_url")
        })

    except Exception as e:
        print("CREATE ORDER ERROR:", e)
        return jsonify({"status": "error", "message": "Server error"}), 500

# ================= ZAPUPI WEBHOOK =================
@app.route("/zapupi-webhook", methods=["POST"])
def zapupi_webhook():
    if db is None:
        return "DB not available", 500

    try:
        data = request.form.to_dict() or request.json or {}

        order_id = data.get("order_id")
        gateway_status = data.get("status")
        txn_id = data.get("txn_id") or "webhook"

        if not order_id:
            return "Missing order_id", 400

        order_ref = db.collection("orders").document(order_id)
        order_snap = order_ref.get()

        if not order_snap.exists:
            return "Order not found", 404

        if gateway_status == "success":
            order_ref.update({
                "status": "paid",
                "paidAt": firestore.SERVER_TIMESTAMP,
                "txnId": txn_id
            })
        else:
            order_ref.update({
                "status": "failed",
                "failedAt": firestore.SERVER_TIMESTAMP
            })

        return "OK", 200

    except Exception as e:
        print("WEBHOOK ERROR:", e)
        return "Error", 500

# ================= RUN APP =================
if __name__ == "__main__":
    app.run(port=5000, debug=False)