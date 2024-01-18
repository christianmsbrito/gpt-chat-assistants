const express = require("express");
const googleCalendarRoutes = require("./routes/google-calendar");
require("dotenv").config();

const app = express();
const port = 3000;

// Import routes from google-calendar.js
// Use the routes
app.use("/", googleCalendarRoutes);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { app };
