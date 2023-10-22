jest.mock("../models/user");
const User = require("../models/user");
const { follow } = require("./user");

describe("follow", () => {
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };
  const req = {
    user: { id: 1 },
    params: { id: 2 },
  };
  const next = jest.fn();
  test("사용자를 찾아 팔로잉을 추가하고 success를 응답해야함", async () => {
    // mockReturnValue: 특정 함수가 호출되면 반환할 값을 정함
    // 1. user.js에서의 User.findOne을 호출하면
    // 2. addFolowing이 담긴 객체를 반환함
    // 3. addFollowing은 Promise.resolve(true)를 반환함
    User.findOne.mockReturnValue({
      addFollowing(id) {
        return Promise.resolve(true);
      },
    });
    await follow(req, res, next);
    expect(res.send).toBeCalledWith("success");
  });

  test("사용자를 못 찾으면 Res.status(404).send('no user')를 호출함", async () => {
    User.findOne.mockReturnValue(null);
    await follow(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.send).toBeCalledWith("no user");
  });

  test("DB에서 에러가 발생하면 next(error)를 호출함", async () => {
    const error = "테스트용 에러";
    User.findOne.mockReturnValue(Promise.reject(error));
    await follow(req, res, next);
    expect(next).toBeCalledWith(error);
  });
});
