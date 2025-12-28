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

FRONTEND_BASE = "http://localhost:8000"  # production में live frontend URL कर देना

# ================= FIREBASE INIT (SAFE FOR RENDER + LOCAL) =================
db = None  # default None

try:
    firebase_key_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if firebase_key_str:
        # Render पर env variable से load
        service_account_info = json.loads(firebase_key_str)
        cred = credentials.Certificate(service_account_info)
        print("Firebase connected from Render environment variable")
    else:
        # Local testing के लिए file से load
        cred = credentials.Certificate("serviceAccountKey.json")
        print("Firebase connected from local serviceAccountKey.json")

    firebase_admin.initialize_app(cred)
    db = firestore.client()

except Exception as e:
    print("Firebase initialization failed (normal on Render if key not set):", e)
    db = None

# ================= FLASK INIT =================
app = Flask(__name__)
CORS(app)

# ================= CREATE ORDER =================
@app.route("/api/create-order", methods=["POST"])
def create_order():
    if db is None:
        return jsonify({"status": "error", "message": "Database not available on server"}), 500

    try:
        data = request.json
        product_id = data.get("productId")
        user_id = data.get("userId")

        if not product_id or not user_id:
            return jsonify({"status": "error", "message": "Missing params"}), 400

        # Fetch product
        product_doc = db.collection("products").document(product_id).get()
        if not product_doc.exists:
            return jsonify({"status": "error", "message": "Product not found"}), 404

        product = product_doc.to_dict()
        amount = int(product.get("price", 0))
        if amount <= 0:
            return jsonify({"status": "error", "message": "Invalid amount"}), 400

        # Generate order ID
        order_id = str(int(time.time() * 1000))

        # Create PENDING order in Firebase
        db.collection("orders").document(order_id).set({
            "orderId": order_id,
            "userId": user_id,
            "productId": product_id,
            "amount": amount,
            "status": "pending",
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        # Success redirect URL
        redirect_url = f"{FRONTEND_BASE}/success.html?id={product_id}&order={order_id}"

        # ZapUPI payload
        payload = {
            "token_key": ZAPUPI_TOKEN,
            "secret_key": ZAPUPI_SECRET,
            "amount": amount,
            "order_id": order_id,
            "redirect_url": redirect_url
        }

        res = requests.post(ZAPUPI_CREATE_URL, data=payload, timeout=30)
        zapupi = res.json()
        print("ZAPUPI RESPONSE:", zapupi)

        if zapupi.get("status") != "success":
            return jsonify({"status": "error", "message": zapupi.get("message", "Payment gateway error")}), 400

        return jsonify({
            "status": "success",
            "payment_url": zapupi.get("payment_url")
        })

    except Exception as e:
        print("CREATE ORDER ERROR:", e)
        return jsonify({"status": "error", "message": "Server error"}), 500


# ================= VERIFY PAYMENT (SUCCESS PAGE CALL) =================
@app.route("/api/verify-payment", methods=["POST"])
def verify_payment():
    if db is None:
        return jsonify({"status": "error", "message": "Database not available"}), 500

    try:
        data = request.json

        order_id = data.get("order")
        txn_id = data.get("txn_id") or data.get("txnid") or data.get("payment_id")
        status = data.get("status") or data.get("payment_status")
        received_amount = data.get("amount")

        if not order_id or not txn_id:
            return jsonify({"status": "error", "message": "Missing data"}), 400

        if status != "SUCCESS":
            return jsonify({"status": "error", "message": "Payment failed"}), 400

        order_ref = db.collection("orders").document(order_id)
        order_snap = order_ref.get()

        if not order_snap.exists:
            return jsonify({"status": "error", "message": "Order not found"}), 404

        order_data = order_snap.to_dict()

        if order_data.get("status") == "paid":
            return jsonify({"status": "success", "message": "Already paid"}), 200

        if str(order_data.get("amount")) != str(received_amount):
            return jsonify({"status": "error", "message": "Amount mismatch"}), 400

        # Mark as paid
        order_ref.update({
            "status": "paid",
            "paidAt": firestore.SERVER_TIMESTAMP,
            "txnId": txn_id
        })

        return jsonify({"status": "success", "message": "Payment verified and order updated"})

    except Exception as e:
        print("VERIFY PAYMENT ERROR:", e)
        return jsonify({"status": "error", "message": "Server error"}), 500


# ================= RUN APP =================
if __name__ == "__main__":
    app.run(port=5000, debug=False)