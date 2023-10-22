const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
// helmet은 기존의 express-session의 취약점을 보완하기 위해 사용
const helmet = require("helmet");
// hpp는 HTTP Parameter Pollution 공격을 방어하기 위해 사용
// https://www.npmjs.com/package/hpp
const hpp = require("hpp");
// redis는 세션을 메모리가 아닌 다른 서버에 저장하기 위해 사용
const redis = require("redis");
// connect-redis는 redis와 express-session을 연결하기 위해 사용
const RedisStore = require("connect-redis")(session);

dotenv.config();
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
  legacyMode: true,
});
redisClient.connect().catch(console.error);
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const { sequelize } = require("./models");
const passportConfig = require("./passport");
const logger = require("./logger");

const app = express();
passportConfig();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}

// public에 존재하는 파일들을 정적 파일로 제공
app.use(express.static(path.join(__dirname, "public")));
// uploads 폴더를 정적 폴더로 제공
app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use("/favicon.ico", express.static("favicon.ico"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }),
};

if (process.env.NODE_ENV === "production") {
  // Nodejs 교과서 680p 참고
  // https 적용을 위해 노드서버 앞에 다른 서버를 뒀을떄
  sessionOption.proxy = true;
  // https를 적용할때만 true
  // sessionOption.cookie.secure = true;
}
app.use(session(sessionOption));
// passport middleware 연결
app.use(passport.initialize());
app.use(passport.session());

app.use("/", pageRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  logger.info("hello");
  logger.error(error.message);
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
