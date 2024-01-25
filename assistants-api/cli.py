import argparse
from main import start_conversation, generate_response

def main():
    parser = argparse.ArgumentParser(description='Chat Assistant CLI')
    parser.add_argument('--message', '-m', type=str, help='The message to send to the chat assistant')
    parser.add_argument('--thread_id', '-t', type=int, help='The thread ID for the conversation')
    
    args = parser.parse_args()

    thread_id = args.thread_id if args.thread_id else start_conversation()
    
    if args.message:
        response = generate_response(thread_id, args.message)
        print(response)
    else:
        while True:
            message = input('You: ')
            if message.lower() == 'exit':
                break
            response = generate_response(thread_id, message)
            print('Chat Assistant:', response)

if __name__ == '__main__':
    main()

