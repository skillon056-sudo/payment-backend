from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, os, json, time

import firebase_admin
from firebase_admin import credentials, firestore

# ================= CONFIG =================
ZAPUPI_CREATE_URL = "https://api.zapupi.com/api/create-order"
ZAPUPI_STATUS_URL = "https://api.zapupi.com/api/order-status"

ZAPUPI_TOKEN = "d6a35a8e8f49bafd82ba29f01589225a"
ZAPUPI_SECRET = "8f6d1397dcf23599c528228554d79692"

FRONTEND_BASE = "https://digitalcart.space"

# ================= FIREBASE INIT =================
db = None
try:
    firebase_key_str = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if firebase_key_str:
        cred = credentials.Certificate(json.loads(firebase_key_str))
    else:
        cred = credentials.Certificate("serviceAccountKey.json")

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()

except Exception as e:
    print("Firebase init failed:", e)
    db = None

# ================= FLASK INIT =================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ================= CREATE ORDER =================
@app.route("/api/create-order", methods=["POST"])
def create_order():
    if db is None:
        return jsonify({"status": "error", "message": "DB unavailable"}), 500

    data = request.json or {}
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

    payload = {
        "token_key": ZAPUPI_TOKEN,
        "secret_key": ZAPUPI_SECRET,
        "amount": amount,
        "order_id": order_id,
        "redirect_url": f"{FRONTEND_BASE}/success.html?order={order_id}"
    }

    res = requests.post(ZAPUPI_CREATE_URL, data=payload, timeout=30)
    zapupi = res.json()

    if zapupi.get("status") != "success":
        return jsonify({"status": "error", "message": zapupi.get("message")}), 400

    db.collection("orders").document(order_id).set({
        "orderId": order_id,
        "userId": user_id,
        "productId": product_id,
        "amount": amount,
        "status": "pending",
        "payment_data": zapupi.get("payment_data"),
        "createdAt": firestore.SERVER_TIMESTAMP
    })

    return jsonify({"status": "success", "order_id": order_id})

# ================= ORDER INFO =================
@app.route("/api/order-info", methods=["POST"])
def order_info():
    data = request.json or {}
    order_id = data.get("order")

    if not order_id:
        return jsonify({"status": "error"}), 400

    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        return jsonify({"status": "error"}), 404

    order = doc.to_dict()
    return jsonify({
        "status": "success",
        "amount": order["amount"],
        "payment_data": order["payment_data"]
    })

# ================= VERIFY PAYMENT =================
@app.route("/api/verify-payment", methods=["POST"])
def verify_payment():
    data = request.json or {}
    order_id = data.get("order")

    if not order_id:
        return jsonify({"status": "error"}), 400

    ref = db.collection("orders").document(order_id)
    snap = ref.get()

    if not snap.exists:
        return jsonify({"status": "error"}), 404

    order = snap.to_dict()

    if order["status"] == "paid":
        return jsonify({"status": "success", "allowDownload": True})

    payload = {
        "token_key": ZAPUPI_TOKEN,
        "secret_key": ZAPUPI_SECRET,
        "order_id": order_id
    }

    res = requests.post(ZAPUPI_STATUS_URL, data=payload, timeout=30)
    result = res.json()

    if result.get("data", {}).get("status") == "Success":
        ref.update({"status": "paid"})
        return jsonify({"status": "success", "allowDownload": True})

    return jsonify({"status": "pending", "allowDownload": False})
