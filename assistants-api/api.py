from flask import Flask, request, jsonify
from main import start_conversation, generate_response

# Create Flask app
app = Flask(__name__)

@app.route('/start', methods=['GET'])
def start():
  """
  Handle the start endpoint.

  This function receives a GET request and starts a new conversation thread.

  Returns:
    A JSON response containing the thread ID.

  Raises:
    500: If an error occurs while processing the request.
  """
  try:
    return start_conversation()
  except Exception as e:
    print(e)
    return jsonify({"error": "Internal Server Error"}), 500

@app.route('/chat', methods=['POST'])
def chat():
  """
  Handle the chat endpoint.

  This function receives a POST request with a JSON payload containing the thread ID 
  and user input message and generate a response for that message in the thread.
  
  Returns:
    A JSON response containing the Assistant's response message.

  Raises:
    400: If the thread ID is missing in the request payload.
    500: If an error occurs while processing the chat request.
  """
  try:
    data = request.json
    thread_id = data.get('thread_id')
    user_input = data.get('message', '')

    if not thread_id:
      print("Error: Missing thread_id")
      return jsonify({"error": "Missing thread_id"}), 400

    print(f"Received message: {user_input} for thread ID: {thread_id}")

    # Add the user's message to the thread
    response = generate_response(thread_id, user_input)

    return jsonify({"response": response})

  except Exception as e:
    print(f"Error occurred while processing chat request: {e}")
    return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8080)