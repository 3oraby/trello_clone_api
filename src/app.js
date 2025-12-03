const express = require("express");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const userRoutes = require("./routes/userRoutes.js");
const authRoutes = require("./routes/authRoutes.js");

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auths", authRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
