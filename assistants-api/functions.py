import json
import requests
import os
from openai import OpenAI
from prompts import assistant_instructions
import datetime
from datetime import datetime, timedelta, date

OPENAI_API_KEY = os.environ['OPENAI_API_KEY']

# Init OpenAI Client
client = OpenAI(api_key=OPENAI_API_KEY)

def current_date():
  print("Getting today's date...")
  return { "today": date.today().strftime("%m-%d-%Y")}

def check_scheduled_events(inquiry_start_date, inquiry_end_date=None):
  print("Checking scheduled events with parameters: ", inquiry_start_date, inquiry_end_date)
  return requests.get('http://localhost:3000/events', params={
      'inquiryStartDate': inquiry_start_date,
      'inquiryEndDate': inquiry_end_date
    }).json()

def schedule_event(service_name, service_schedule_date, service_schedule_time):
  print("Scheduling event with parameters: ", service_name, service_schedule_date, service_schedule_time)
  # Parse service_schedule_date and service_schedule_time into a single datetime object
  schedule_datetime = datetime.strptime(service_schedule_date + ' ' + service_schedule_time, '%m-%d-%Y %H:%M')

  # Calculate the end time by adding 1 hour to the start time
  end_datetime = schedule_datetime + timedelta(hours=1)

  return requests.post('http://localhost:3000/events', json={
      'summary': service_name,
      'start': schedule_datetime.strftime('%Y-%m-%d %H:%M:%S'),
      'end': end_datetime.strftime('%Y-%m-%d %H:%M:%S')
    }).json()

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

