const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

let app;
let mongoose;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  ({ app, mongoose } = require("../server"));
  await mongoose.connection.asPromise();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

describe("Auth API", () => {
  test("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "testuser@example.com", password: "secret123" })
      .expect(201);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", "testuser@example.com");
  });

  test("logs in an existing user", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Login User", email: "login@example.com", password: "secret123" })
      .expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "secret123" })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", "login@example.com");
  });

  test("returns current user profile with token", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ name: "Profile User", email: "profile@example.com", password: "secret123" })
      .expect(201);

    const token = reg.body.token;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("email", "profile@example.com");
  });
});
