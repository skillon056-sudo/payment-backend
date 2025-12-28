# pip install Flask

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json

    customer_mobile = data.get('custumer_mobile')
    utr = data.get('utr')
    remark = data.get('remark')
    txn_id = data.get('txn_id')
    created_at = data.get('create_at')
    order_id = data.get('order_id')
    status = data.get('status')
    amount = data.get('amount')

    print("Received Webhook Data:")
    print(f"Customer Mobile: {customer_mobile}")
    print(f"UTR: {utr}")
    print(f"Remark: {remark}")
    print(f"Transaction ID: {txn_id}")
    print(f"Created At: {created_at}")
    print(f"Order ID: {order_id}")
    print(f"Status: {status}")
    print(f"Amount: {amount}")

    if status == "Success":
        return jsonify({"message": "Webhook received successfully"}), 200
    else:
        return jsonify({"message": "Invalid status received"}), 400

if __name__ == '__main__':
    app.run(port=5000)

# Run the server using `python webhook.py`
# The webhook will listen on http://localhost:5000/webhook
