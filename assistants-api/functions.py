import json
import requests
import os
from openai import OpenAI
from prompts import assistant_instructions
import datetime

OPENAI_API_KEY = os.environ['OPENAI_API_KEY']

# Init OpenAI Client
client = OpenAI(api_key=OPENAI_API_KEY)


# Create or load assistant
# def create_assistant(client, assistant_instructions, tools, file_path, model="gpt-4-1106-preview"):
#   assistant_file_path = os.path.join(os.path.dirname(file_path), 'assistant.json')

#   # If there is an assistant.json file already, then load that assistant
#   if os.path.exists(assistant_file_path):
#     with open(assistant_file_path, 'r') as file:
#       assistant_data = json.load(file)
#       assistant_id = assistant_data['assistant_id']
#       print("Loaded existing assistant ID.")
#   else:
#     # If no assistant.json is present, create a new assistant using the provided specifications

#     # Create knowledge base file
#     file = client.files.create(file=open(file_path, "rb"), purpose='assistants')

#     # Create assistant with specified instructions, model, and tools
#     assistant = client.beta.assistants.create(
#       instructions=assistant_instructions,
#       model=model,
#       tools=tools,
#       file_ids=[file.id]
#     )

#     # Create a new assistant.json file to load on future runs
#     with open(assistant_file_path, 'w') as file:
#       json.dump({'assistant_id': assistant.id}, file)
#       print("Created a new assistant and saved the ID.")

#     assistant_id = assistant.id

#   return assistant_id

def current_date():
  print("Getting today's date...")
  return { "today": datetime.date.today().strftime("%m-%d-%Y") }

def check_scheduled_events(inquiry_start_date, inquiry_end_date=None):
  return requests.get('http://localhost:3000/events', params={
      'inquiryStartDate': inquiry_start_date,
      'inquiryEndDate': inquiry_end_date
    }).json()

def create_assistant(client):
  assistant_file_path = 'assistant.json'

  # If there is an assistant.json file already, then load that assistant
  if os.path.exists(assistant_file_path):
    with open(assistant_file_path, 'r') as file:
      assistant_data = json.load(file)
      assistant_id = assistant_data['assistant_id']
      print("Loaded existing assistant ID.")
  else:
    # If no assistant.json is present, create a new assistant using the below specifications

    # To change the knowledge document, modifiy the file name below to match your document
    # If you want to add multiple files, paste this function into ChatGPT and ask for it to add support for multiple files
    file = client.files.create(file=open("knowledge.json", "rb"),
                               purpose='assistants')

    assistant = client.beta.assistants.create(
        # Getting assistant prompt from "prompts.py" file, edit on left panel if you want to change the prompt
        instructions=assistant_instructions,
        # model="gpt-4-1106-preview",
        model="gpt-3.5-turbo-1106",
        tools=[
            {
                "type": "retrieval"  # This adds the knowledge base as a tool
            },
            {
              "type": "function",
              "function": {
                "name": "current_date",
                "description": "Retrieves the current date. It can be used to get data for relative data such as tomorrow, yesterday, next week, etc.",
              }
            },
            {
              "type": "function",
              "function": {
                "name": "check_scheduled_events",
                "description": "Retrieve the scheduled events for a given date range. The assistant will determine if there are any conflicts and return the available times.",
                "parameters": {
                  "type": "object",
                  "properties": {
                    "inquiry_start_date": {
                      "type": "string",
                      "description": "A date like string for the inquiry date with format MM-DD-YYYY."
                    },
                    "inquiry_end_date": {
                      "type": "string",
                      "description": "An optional date like string for the limit date inquiry date with format MM-DD-YYYY."
                    }
                  },
                  "required": ["inquiry_start_date"]
                }
              }
            }
        ],
        file_ids=[file.id])

    # Create a new assistant.json file to load on future runs, this is good, otherwise, everything we run, we will create a new assistant 
    with open(assistant_file_path, 'w') as file:
      json.dump({'assistant_id': assistant.id}, file)
      print("Created a new assistant and saved the ID.")

    assistant_id = assistant.id

  return assistant_id