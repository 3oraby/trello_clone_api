const express = require("express");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const userRoutes = require("./routes/userRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const boardsRoutes = require("./routes/boardsRoutes.js");
const listRoutes = require("./routes/listRoutes.js");
const cardRoutes = require("./routes/cardRoutes.js");
const checklistRoutes = require("./routes/checklistRoutes.js");
const checklistItemRoutes = require("./routes/checklistItemRoutes.js");

const path = require("path");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "templates"));

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

app.get("/resetPassword/:token", (req, res) => {
  res.status(200).render("reset_password");
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auths", authRoutes);
app.use("/api/v1/boards", boardsRoutes);
app.use("/api/v1/lists", listRoutes);
app.use("/api/v1/cards", cardRoutes);
app.use("/api/v1/checklists", checklistRoutes);
app.use("/api/v1/checklistItems", checklistItemRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
