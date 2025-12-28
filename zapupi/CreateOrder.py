import requests

class CreateOrderAPI:
    def create_order(self, token_key, secret_key, amount, order_id, customer_mobile, redirect_url, remark):
        url = "https://zapupi.com/api/create-order"
        payload = {
            'token_key': token_key,
            'secret_key': secret_key,
            'amount': amount,
            'order_id': order_id,
            'custumer_mobile': customer_mobile,
            'redirect_url': redirect_url,
            'remark': remark
        }
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        try:
            response = requests.post(url, data=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                return data
            else:
                raise Exception(data.get("message", "Unknown error"))
        except requests.exceptions.RequestException as e:
            print(f"Error creating order: {e}")
            raise e

# Usage
api = CreateOrderAPI()
try:
    order = api.create_order(
        token_key="0292e3c8b5ae1a4afc40182c51954533",
        secret_key="c5b9f4d315e6acce8a5d6493ff2edb40",
        amount="1",
        order_id="1234",
        customer_mobile="1234567890",
        redirect_url="https://zapupi.com/success",
        remark="TEST"
    )
    print("Order created:", order)
except Exception as e:
    print("Order creation failed:", str(e))
