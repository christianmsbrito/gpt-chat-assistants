const yargs = require("yargs");
const google = require("googleapis").google;
const fs = require("fs");
const readline = require("readline");
const http = require("http");
const url = require("url");
require("dotenv").config();


const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  project_id: process.env.GOOGLE_PROJECT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
};

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile("token.json", (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then execute the given callback with the authorized OAuth2 client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile("token.json", JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", "token.json");
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 */
function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const events = res.data.items;
      if (events.length) {
        console.log("Upcoming 10 events:");
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
        });
      } else {
        console.log("No upcoming events found.");
      }
    }
  );
}

// ...

/**
 * Lists events within a given period.
 * @param {Object} auth - The authorized OAuth2 client.
 * @param {Date} startDate - The start date of the period.
 * @param {Date} [endDate] - The end date of the period. Defaults to 7 days from the start date.
 */
async function listEventsByDate(
  auth,
  startDate,
  endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
) {
  const calendar = google.calendar({ version: "v3", auth });
  const calendarResponse = await calendar.events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = calendarResponse.data.items;
  if (events.length) {
    console.log(
      `Events between ${startDate.toISOString()} and ${endDate.toISOString()}:`
    );
    const eventDetails = events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      return {
        name: event.summary,
        start: start,
        end: end,
        // Add more properties as needed
      };
    });
    // console.log(eventDetails); // Print the event details
    return eventDetails; // Return the event details
  } else {
    console.log("No events found in the specified period.");
    return []; // Return an empty array if no events found
  }
}

/**
 * Adds a new event to the user's primary calendar.
 * @param {Object} auth - The authorized OAuth2 client.
 * @param {string} summary - The summary or title of the event.
 * @param {Date} start - The start date and time of the event.
 * @param {Date} end - The end date and time of the event.
 * @param {string} [description] - The description of the event. Optional.
 * @param {string} [location] - The location of the event. Optional.
 */
async function addEvent(auth, summary, start, end, description = null, location = null) {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: summary,
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
    description: description,
    location: location,
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("Event added successfully:");
    console.log(response.data);
  } catch (error) {
    console.error("Error adding event:", error);
  }
}


// ...

// Define the authorize, getAccessToken, and listEvents functions here...

yargs.command({
  command: "authorize",
  describe: "Authorize the Google API client",
  handler: () => {
    authorize(credentials, (auth) => {
      console.log("Authorization successful");
    });
  },
});

yargs.command({
  command: "getAccessToken",
  describe: "Get and store new access token",
  handler: () => {
    authorize(credentials, (auth) => {
      getAccessToken(auth, () => {
        console.log("Access token stored");
      });
    });
  },
});

yargs.command({
  command: "listEvents",
  describe: "List the next 10 events on the user's primary calendar",
  handler: () => {
    authorize(credentials, (auth) => {
      listEvents(auth);
    });
  },
});

yargs.command({
  command: "listEventsByDate",
  describe: "List events within a given period",
  builder: {
    startDate: {
      describe: "The start date of the period",
      demandOption: true,
      type: "string",
    },
    endDate: {
      describe: "The end date of the period",
      type: "string",
    },
  },
  handler: (argv) => {
    authorize(credentials, (auth) => {
      const startDate = new Date(argv.startDate);
      const endDate = argv.endDate ? new Date(argv.endDate) : undefined;
      listEventsByDate(auth, startDate, endDate);
    });
  },
});

yargs.parse();
const server = http.createServer(async (req, res) => {
  try {
    console.log("req.url", req.url);
    if (req.method === "GET" && req.url.startsWith("/events")) {
      const queryObject = url.parse(req.url, true).query;
      const startDate = new Date(queryObject.inquiryStartDate);
      const endDate = queryObject.inquiryEndDate
        ? new Date(queryObject.inquiryEndDate)
        : undefined;
      console.log(
        "Request received for availability with parameters: ",
        queryObject
      );
      authorize(credentials, async (auth) => {
        const events = await listEventsByDate(auth, startDate, endDate);
        console.log({ events });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ events }));
      });
    } else if(req.method === "POST" && req.url.startsWith("/events")) {
      const body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", () => {
        const bodyString = Buffer.concat(body).toString();
        const bodyParams = JSON.parse(bodyString);
        const { summary, start, end, description, location } = bodyParams;
        authorize(credentials, async (auth) => {
          await addEvent(auth, summary, new Date(start), new Date(end), description, location);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Event added successfully" }));
        });
      });
    } else if (req.method === "GET" && req.url.startsWith("/")) {
      const queryObject = url.parse(req.url, true).query;
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");

      if (queryObject.code) {
        res.end(
          "Authorization code: " +
            queryObject.code +
            "\nCopy this code and paste it into your application."
        );
        // Here you could also programmatically use this code to get the token
      } else {
        res.end("No code found in the URL query parameters.");
      }
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
