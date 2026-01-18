const express = require("express");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const boardsRoutes = require("./routes/boardsRoutes.js");
const listRoutes = require("./routes/listRoutes.js");
const cardRoutes = require("./routes/cardRoutes.js");
const checklistRoutes = require("./routes/checklistRoutes.js");
const checklistItemRoutes = require("./routes/checklistItemRoutes.js");

const path = require("path");

app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "templates"));

app.use(cors());
app.options(/.*/, cors());

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [],
  }),
);

app.use(compression());

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use(helmet());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
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
