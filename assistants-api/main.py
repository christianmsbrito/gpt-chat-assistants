import json
import os
import time
from flask import Flask, request, jsonify
import openai
from openai import OpenAI
import functions

# Check OpenAI version compatibility
from packaging import version

required_version = version.parse("1.1.1")
current_version = version.parse(openai.__version__)
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']
if current_version < required_version:
  raise ValueError(
    f"Error: OpenAI version {openai.__version__} is less than the required version 1.1.1"
  )
else:
  print("OpenAI version is compatible.")

# Create Flask app
app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Create or load assistant
assistant_id = functions.create_assistant_from_config(
  client, "car-service.json")  # this function comes from "functions.py"


# Start conversation thread
@app.route('/start', methods=['GET'])
def start_conversation():
  print("Starting a new conversation...")
  thread = client.beta.threads.create()
  print(f"New thread created with ID: {thread.id}")
  return jsonify({"thread_id": thread.id})


# Generate response
@app.route('/chat', methods=['POST'])
def chat():
  """
  Handle the chat endpoint.

  This function receives a POST request with a JSON payload containing the thread ID and user input message.
  It adds the user's message to the thread, runs the Assistant, and handles any required function calls.
  Finally, it retrieves and returns the latest message from the Assistant as the response.

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
    add_user_message(thread_id, user_input)

    # Run the Assistant
    run = run_assistant(thread_id)

    # Check if the Run requires action (function call)
    while True:
      run_status = get_run_status(thread_id, run.id)
      if run_status.status == 'completed':
        break
      elif run_status.status == 'requires_action':
        handle_function_call(thread_id, run.id, run_status.required_action.submit_tool_outputs.tool_calls)

    # Retrieve and return the latest message from the assistant
    response = get_latest_message(thread_id)

    print(f"Assistant response: {response}")
    return jsonify({"response": response})

  except Exception as e:
    cancel_run(thread_id, run.id)
    print(f"Error occurred while processing chat request: {e}")
    return jsonify({"error": str(e)}), 500


def add_user_message(thread_id, user_input):
  client.beta.threads.messages.create(
    thread_id=thread_id,
    role="user",
    content=user_input
  )


def run_assistant(thread_id):
  """
  Runs the assistant on the specified thread.

  Args:
    thread_id (str): The ID of the thread to run the assistant on.

  Returns:
    object: The response object from the assistant run.
  """
  return client.beta.threads.runs.create(
    thread_id=thread_id,
    assistant_id=assistant_id
  )


def get_run_status(thread_id, run_id):
  """
  Retrieves the status of a specific run in a thread.

  Args:
    thread_id (str): The ID of the thread.
    run_id (str): The ID of the run.

  Returns:
    dict: The status of the run.
  """
  return client.beta.threads.runs.retrieve(
    thread_id=thread_id,
    run_id=run_id
  )


def handle_function_call(thread_id, run_id, tool_calls):
  """
  Handles the function calls received from the client.

  Args:
    thread_id (str): The ID of the thread.
    run_id (str): The ID of the run.
    tool_calls (list): A list of tool calls received from the client.

  Returns:
    tuple: A tuple containing the response JSON and the HTTP status code.
  """
  function_handlers = {
    "current_date": functions.current_date,
    "check_scheduled_events": functions.check_scheduled_events,
    "schedule_event": functions.schedule_event
  }

  for tool_call in tool_calls:
    try:
      function_name = tool_call.function.name
      if function_name in function_handlers:
        arguments = json.loads(tool_call.function.arguments)
        output = function_handlers[function_name](*arguments.values())
        client.beta.threads.runs.submit_tool_outputs(
          thread_id=thread_id,
          run_id=run_id,
          tool_outputs=[{
            "tool_call_id": tool_call.id,
            "output": json.dumps(output)
          }]
        )
      else:
        print(f"Error: Unknown function '{function_name}'")
        return jsonify({"error": f"Unknown function '{function_name}'"}), 400
    except Exception as e:
      print(f"Error occurred while processing function call: {e}")
      return jsonify({"error": str(e)}), 500


def get_latest_message(thread_id):
  """
  Retrieves the latest message from a given thread.

  Args:
    thread_id (str): The ID of the thread.

  Returns:
    str: The content of the latest message.
  """
  messages = client.beta.threads.messages.list(thread_id=thread_id)
  return messages.data[0].content[0].text.value


def cancel_run(thread_id, run_id):
  """
  Cancel a specific run in a thread.

  Args:
    thread_id (str): The ID of the thread.
    run_id (str): The ID of the run to cancel.
  """
  client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run_id)

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8080)
