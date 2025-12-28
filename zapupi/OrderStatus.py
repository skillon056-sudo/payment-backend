import requests

class OrderStatusAPI:
    def check_order_status(self, token_key, secret_key, order_id):
        url = "https://zapupi.com/api/order-status"
        payload = {
            'token_key': token_key,
            'secret_key': secret_key,
            'order_id': order_id
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        try:
            response = requests.post(url, data=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                return data.get("data")
            else:
                raise Exception(data.get("message", "Unknown error"))
        except requests.exceptions.RequestException as e:
            print(f"Error checking order status: {e}")
            raise e

# Usage
api = OrderStatusAPI()
try:
    status = api.check_order_status(
        token_key="0292e3c8b5ae1a4afc40182c51954533",
        secret_key="c5b9f4d315e6acce8a5d6493ff2edb40",
        order_id="1234"
    )
    print("Order status:", status)
except Exception as e:
    print("Error checking order status:", str(e))
