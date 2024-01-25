import requests
import datetime
from datetime import datetime, timedelta, date, timezone
import pytz

system_timezone = 'America/Sao_Paulo'

def current_date():
  print("Getting today's date...")
  return { "today": date.today().strftime("%m-%d-%Y")}

def check_scheduled_events(inquiry_start_date, inquiry_end_date=None):
  print("Checking scheduled events with parameters: ", inquiry_start_date, inquiry_end_date)
  return requests.get('http://localhost:3000/calendar/events', params={
    'inquiryStartDate': inquiry_start_date,
    'inquiryEndDate': inquiry_end_date
  }).json()

def schedule_event(service_name, service_schedule_date, service_schedule_time, working_hours_start, working_hours_end, scheduled_events):
  """
  Schedule an event based on the given parameters.

  Args:
    service_name (str): The name of the service.
    service_schedule_date (str): The date of the service schedule in the format 'mm-dd-yyyy'.
    service_schedule_time (str): The time of the service schedule in the format 'HH:MM'.
    working_hours_start (str): The start time of the working hours in the format 'HH:MM'.
    working_hours_end (str): The end time of the working hours in the format 'HH:MM'.
    scheduled_events (list): A list of dictionaries representing the scheduled events, each containing 'start' and 'end' keys with datetime strings in the format 'YYYY-MM-DDTHH:MM:SS±HH:MM'.

  Returns:
    str: A success message if the service is scheduled successfully, or an error message if there is a conflict or the requested time is outside working hours.
  """
  print("Scheduling event with parameters: ", service_name, service_schedule_date, service_schedule_time, working_hours_start, working_hours_end, scheduled_events)
  # Define the timezone
  current_timezone = pytz.timezone(system_timezone)

  # Parse service_schedule_date and service_schedule_time into a single datetime object
  schedule_datetime = datetime.strptime(service_schedule_date + ' ' + service_schedule_time, '%m-%d-%Y %H:%M')
  # Localize schedule_datetime to Brazil/Sao_Paulo timezone
  schedule_datetime = current_timezone.localize(schedule_datetime)

  # Convert working hours to the same timezone
  working_hours_start = current_timezone.localize(datetime.strptime(working_hours_start, '%H:%M').replace(year=schedule_datetime.year, month=schedule_datetime.month, day=schedule_datetime.day))
  working_hours_end = current_timezone.localize(datetime.strptime(working_hours_end, '%H:%M').replace(year=schedule_datetime.year, month=schedule_datetime.month, day=schedule_datetime.day))

  if schedule_datetime < working_hours_start:
    return "The requested time is before working hours. Ask for a different time."
  elif schedule_datetime >= working_hours_end:
    return "The requested time is after working hours. Ask for a different time."
  
  # Check if the requested date/time is available
  for event in scheduled_events:
    start_datetime = datetime.strptime(event['start'], '%Y-%m-%dT%H:%M:%S%z')
    end_datetime = datetime.strptime(event['end'], '%Y-%m-%dT%H:%M:%S%z')
    if schedule_datetime >= start_datetime and schedule_datetime < end_datetime:
      return "The requested time conflicts with another event. Ask for a different date/time."

  # Convert start and end datetime to the same timezone
  start_datetime = schedule_datetime.astimezone(current_timezone)
  end_datetime = (schedule_datetime + timedelta(hours=1)).astimezone(current_timezone)

  requests.post('http://localhost:3000/calendar/events', json={
    'summary': service_name,
    'start': start_datetime.strftime('%Y-%m-%dT%H:%M:%S%z'),
    'end': end_datetime.strftime('%Y-%m-%dT%H:%M:%S%z')
  }).json()

  return "Service scheduled successfully at " + start_datetime.strftime("%m-%d-%Y %H:%M") + "!"
