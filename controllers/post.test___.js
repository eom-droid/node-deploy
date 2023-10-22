jest.mock("../models");
const { Post, Hashtag } = require("../models");
const { uploadPost } = require("./post");

describe("uploadPost", () => {
  const req = {
    body: {
      content: "test content",
      url: "test url",
    },
    user: {
      id: 1,
    },
  };
  const res = {
    redirect: jest.fn(),
  };
  const next = jest.fn();
  test("게시글을 생성하고, 해시태그가 있으면 추가하고, 응답으로 redirect('/')를 호출함", async () => {
    Post.create.mockReturnValue({
      addHashTags(hashtags) {
        return Promise.resolve(true);
      },
    });
    Hashtag.findOrCreate.mockReturnValue(["a", true]);
    await uploadPost(req, res, next);
    expect(res.redirect).toBeCalledWith(`/`);
  });

  test("DB에서 에러가 발생하면 next(error)를 호출함", async () => {
    const error = "테스트용 에러";
    Post.create.mockReturnValue(Promise.reject(error));
    await uploadPost(req, res, next);
    expect(next).toBeCalledWith(error);
  });
});
