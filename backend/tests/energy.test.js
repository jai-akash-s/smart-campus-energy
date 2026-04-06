const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

let app;
let mongoose;
let mongo;

const ADMIN_EMAIL = "akash.saravanan1797@gmail.com";

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

describe("Energy API", () => {
  const registerAdminAndGetToken = async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Admin", email: ADMIN_EMAIL, password: "admin123" })
      .expect(201);
    return res.body.token;
  };

  test("creates and lists energy readings", async () => {
    const token = await registerAdminAndGetToken();

    await request(app)
      .post("/api/energy")
      .set("Authorization", `Bearer ${token}`)
      .send({
        buildingName: "Labs",
        energy_kwh: 12.5,
        voltage: 230,
        current: 5.4,
        cost: 102
      })
      .expect(201);

    const res = await request(app)
      .get("/api/energy")
      .expect(200);

    expect(Array.isArray(res.body.readings)).toBe(true);
    expect(res.body.readings.length).toBeGreaterThan(0);
  });
});
