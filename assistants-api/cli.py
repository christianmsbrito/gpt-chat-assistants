import argparse
from main import start_conversation, generate_response
from api import app
def main():
  parser = argparse.ArgumentParser(description='Chat Assistant CLI')
  parser.add_argument('--mode', type=str, choices=['single', 'chat', 'api'], default='single', help='The mode to run the chat assistant')
  parser.add_argument('--message', '-m', type=str, help='The message to send to the chat assistant')
  parser.add_argument('--thread_id', '-t', type=str, help='The thread ID for the conversation')
  parser.add_argument('--port', '-p', type=int, default=8080, help='The port number for the API')

  args = parser.parse_args()

  if args.mode == 'single':
    if not args.message:
      print('Error: In single mode, you must provide a message.')
      return
    thread_id = args.thread_id if args.thread_id else start_conversation()
    response = generate_response(thread_id, args.message)
    print(response)

  elif args.mode == 'chat':
    thread_id = args.thread_id if args.thread_id else start_conversation()
    
    while True:
      message = input('You: ')
      if message.lower() == 'exit':
          break
      response = generate_response(thread_id, message)
      print('Chat Assistant:', response)

  elif args.mode == 'api':
    app.run(host='0.0.0.0', port=args.port)

if __name__ == '__main__':
  main()

