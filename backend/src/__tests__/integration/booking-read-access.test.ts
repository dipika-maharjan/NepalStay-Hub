import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Booking-related read access", () => {
  const testUser = {
    name: "Booking Access User",
    email: "booking-access@example.com",
    password: "Test@1234",
    confirmPassword: "Test@1234",
  };

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await request(app).post("/api/auth/register").send(testUser);
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  test("allows authenticated users to fetch room types", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get("/api/room-types")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("allows authenticated users to fetch optional extras", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get("/api/optional-extras")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
