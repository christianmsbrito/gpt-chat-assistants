const fs = require("fs");
const express = require("express");
const {
  authorize,
  listEventsByDate,
  addEvent,
  updateEvent,
  deleteEvent,
} = require("../integration/google-calendar");
const router = express.Router();

async function googleAuthMiddleware(req, res, next) {
  try {
    req.auth = await authorize();
    if (req.path === "/redirect") {
      return next();
    }
    if (!fs.existsSync("token.json")) {
      return res.status(403).send({ message: "Google Calendar is not Authorized!" });
    }
    next();
  } catch (error) {
    console.error("An error occurred during authorization:", error);
    res.status(500).send("Internal Server Error");
  }
}

router.get("/events", googleAuthMiddleware, async (req, res) => {
  try {
    const queryObject = req.query;
    const startDate = new Date(queryObject.inquiryStartDate);
    let endDate = queryObject.inquiryEndDate
      ? new Date(queryObject.inquiryEndDate)
      : undefined;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999); // Set end of day
    }
    console.log(
      "Request received for availability with parameters: ",
      queryObject
    );
    const events = await listEventsByDate(req.auth, startDate, endDate);
    console.log({ events });
    res.status(200).json({ events });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/events",
  googleAuthMiddleware,
  express.json(),
  async (req, res) => {
    try {
      const { summary, start, end, description, location } = req.body;
      await addEvent(
        req.auth,
        summary,
        new Date(start),
        new Date(end),
        description,
        location
      );
      res.status(200).json({ message: "Event added successfully" });
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put(
  "/events/:eventId",
  googleAuthMiddleware,
  express.json(),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { summary, start, end, description, location } = req.body;
      await updateEvent(
        req.auth,
        eventId,
        summary,
        new Date(start),
        new Date(end),
        description,
        location
      );
      res.status(200).json({ message: "Event updated successfully" });
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.delete("/events/:eventId", googleAuthMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    await deleteEvent(req.auth, eventId);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/authorize", async (req, res) => {
  try {
    const oAuth2Client = await authorize();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/redirect", googleAuthMiddleware, (req, res) => {
  const oAuth2Client = req.auth;

  oAuth2Client.getToken(req.query.code, (err, token) => {
    if (err) return console.error("Error retrieving access token", err);
    oAuth2Client.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile("token.json", JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log("Token stored to", "token.json");
    });
  });

  res.status(200).json({ message: "Authorization successful" });
});

module.exports = router;
