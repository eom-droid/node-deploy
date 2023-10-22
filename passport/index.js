const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

module.exports = () => {
  // req.session 객체에 어떤 데이터를 저장할지 선택
  passport.serializeUser((user, done) => {
    // done 함수의 첫 번째 인수는 에러 발생 시 사용
    // 두 번째 인수는 저장하고 싶은 데이터
    done(null, user.id);
  });

  // 매 요청 시 실행
  // passport.session 미들웨어가 이 메서드 호출
  // serializeUser 메서드의 done의 두 번째 인수로 넘겨준 데이터가 deserializeUser의 매개변수가 됨
  passport.deserializeUser((id, done) => {
    User.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followers",
        },
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followings",
        },
      ],
    })
      .then((user) => done(null, user)) // req.user에 저장
      .catch((err) => done(err));
  });

  local();
  kakao();
};
