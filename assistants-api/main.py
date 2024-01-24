import json
import os
from flask import Flask, request, jsonify
import openai
from openai import OpenAI
# import functions
import inspect
# Check OpenAI version compatibility
from packaging import version
import importlib

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

# Start conversation thread
@app.route('/start', methods=['GET'])
def start_conversation():
  """
  Starts a new conversation by creating a new thread and returning the thread ID.

  Returns:
    A JSON response containing the thread ID.
  """
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

    function_handlers = get_function_handlers()

    # Check if the Run requires action (function call)
    while True:
      run_status = get_run_status(thread_id, run.id)
      if run_status.status == 'completed':
        break
      elif run_status.status == 'requires_action':
        handle_function_call(thread_id, run.id, run_status.required_action.submit_tool_outputs.tool_calls, function_handlers)

    # Retrieve and return the latest message from the assistant
    response = get_latest_message(thread_id)

    print(f"Assistant response: {response}")
    return jsonify({"response": response})

  except Exception as e:
    cancel_run(thread_id, run.id)
    print(f"Error occurred while processing chat request: {e}")
    return jsonify({"error": str(e)}), 500


def add_user_message(thread_id, user_input):
  """
  Adds a user message to a thread.

  Args:
    thread_id (str): The ID of the thread.
    user_input (str): The user's input message.

  Returns:
    None
  """
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


def handle_function_call(thread_id, run_id, tool_calls, function_handlers):
  """
  Handles the function calls received from the client.

  Args:
    thread_id (str): The ID of the thread.
    run_id (str): The ID of the run.
    tool_calls (list): A list of tool calls received from the client.

  Returns:
    tuple: A tuple containing the response JSON and the HTTP status code.
  """
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

def get_function_handlers():
  """
  Retrieves a list of function handlers.
  The dictionary is generated by inspecting the functions.py file.

  Returns:
    dict: A dictionary of function handlers.
  """
  function_handlers = {}
  
  # Dynamically import functions.py
  functions_module = importlib.import_module("functions")
  
  for name, function in inspect.getmembers(functions_module):
    if inspect.isfunction(function):
      function_handlers[name] = function
  return function_handlers

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


def create_assistant_from_config(client, assistant_config_path):
  """
  Create an assistant based on the provided configuration.

  Args:
    client (object): The client object used to interact with the API.
    assistant_config_path (str): The path to the assistant configuration file.

  Returns:
    str: The ID of the created or loaded assistant.
  """
  with open(assistant_config_path, 'r') as config_file:
    assistant_config = json.load(config_file)

  assistant_file_path = assistant_config["name"] + ".json"

  # If there is an assistant.json file already, then load that assistant
  if os.path.exists(assistant_file_path):
    with open(assistant_file_path, 'r') as file:
      assistant_data = json.load(file)
      assistant_id = assistant_data['assistant_id']
      print("Loaded existing assistant ID.")
  else:
    # If no assistant.json is present, create a new assistant using the provided specifications

    # Create knowledge base file
    file = client.files.create(file=open(assistant_config['knowledge_file'], "rb"), purpose='assistants')

    # Create assistant with specified instructions, model, and tools
    assistant = client.beta.assistants.create(
      instructions=assistant_config['instructions'],
      model=assistant_config['model'],
      tools=assistant_config['tools'],
      file_ids=[file.id]
    )

    # Create a new assistant.json file to load on future runs
    with open(assistant_file_path, 'w') as file:
      json.dump({'assistant_id': assistant.id}, file)
      print("Created a new assistant and saved the ID.")

    assistant_id = assistant.id

  return assistant_id

def cancel_run(thread_id, run_id):
  """
  Cancel a specific run in a thread.

  Args:
    thread_id (str): The ID of the thread.
    run_id (str): The ID of the run to cancel.
  """
  client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run_id)

assistant_id = create_assistant_from_config(client, "car-service.json")

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8080)