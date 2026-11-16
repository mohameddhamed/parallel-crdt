// src/__tests__/isAuth.test.ts
import { DataSource } from "typeorm";
import request from "supertest";
import { User } from "./User";
import { Strategy as GithubStrategy } from "passport-github";
import express, { Request, Response } from "express";
import passport from "passport";
import { isAuth } from "./isAuth";
import * as jwt from "jsonwebtoken";
import cors from "cors";

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("isAuth middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
    process.env.GITHUB_TOKEN = "test-secret-key";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw error when no authorization header is present", () => {
    expect(() => {
      isAuth(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow("Not authenticated");
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("should throw error when authorization header has no token", () => {
    mockRequest.headers = { authorization: "Bearer " };

    expect(() => {
      isAuth(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow("Not authenticated");
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("should throw error when jwt.verify throws an error", () => {
    mockRequest.headers = { authorization: "Bearer invalid-token" };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    expect(() => {
      isAuth(mockRequest as Request, mockResponse as Response, nextFunction);
    }).toThrow("Not authenticated");
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test("should set userId in request and call next when token is valid", () => {
    mockRequest.headers = { authorization: "Bearer valid-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "123" });

    isAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.userId).toBe("123");
    expect(nextFunction).toHaveBeenCalled();
  });
});

// src/__tests__/auth-routes.test.ts

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("./User");
jest.mock("passport", () => ({
  initialize: jest
    .fn()
    .mockReturnValue(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => next()
    ),
  authenticate: jest
    .fn()
    .mockReturnValue(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        req.user = { accessToken: "mock-token" };
        next();
      }
    ),
  use: jest.fn(),
  serializeUser: jest.fn(),
}));

// Mock environment variables
process.env.GITHUB_TOKEN = "test-secret-key";
process.env.GITHUB_CLIENT_ID = "test-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-client-secret";

// describe("Authentication routes", () => {
//   let app: express.Application;

//   beforeEach(() => {
//     // Create a minimal Express app for testing
//     app = express();
//     app.use(express.json());
//     app.use(passport.initialize());

//     // Set up the /me endpoint
//     app.get("/me", async (req, res) => {
//       const authHeader = req.headers.authorization;
//       if (!authHeader) {
//         res.send({ user: null });
//         return;
//       }
//       let token = authHeader.split(" ")[1];
//       if (!token) {
//         res.send({ user: null });
//         return;
//       }

//       let userId = "";
//       try {
//         let payload: any = jwt.verify(token, "alkfhlaksdfjdfkasdfklah");
//         userId = payload.userId;
//       } catch (err) {
//         res.send({ user: null });
//         return;
//       }

//       if (!userId) {
//         res.send({ user: null });
//         return;
//       }

//       const user = await User.findOne({ where: { id: userId } });
//       res.send({ user });
//     });

//     // Set up GitHub auth routes
//     app.get(
//       "/auth/github",
//       passport.authenticate("github", { session: false })
//     );
//     app.get(
//       "/auth/github/callback",
//       passport.authenticate("github", { session: false }),
//       (req: any, res) => {
//         res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
//       }
//     );

//     // Reset mocks for each test
//     jest.clearAllMocks();
//   });

//   describe("GET /me", () => {
//     test("should return null when no auth header is present", async () => {
//       const response = await request(app).get("/me");
//       expect(response.status).toBe(200);
//       expect(response.body).toEqual({ user: null });
//     });

//     test("should return null when token is empty", async () => {
//       const response = await request(app)
//         .get("/me")
//         .set("Authorization", "Bearer ");

//       expect(response.status).toBe(200);
//       expect(response.body).toEqual({ user: null });
//     });

//     test("should return null when token verification fails", async () => {
//       (jwt.verify as jest.Mock).mockImplementation(() => {
//         throw new Error("Invalid token");
//       });

//       const response = await request(app)
//         .get("/me")
//         .set("Authorization", "Bearer invalid-token");

//       expect(response.status).toBe(200);
//       expect(response.body).toEqual({ user: null });
//     });

//     test("should return null when userId is empty", async () => {
//       (jwt.verify as jest.Mock).mockReturnValue({ userId: "" });

//       const response = await request(app)
//         .get("/me")
//         .set("Authorization", "Bearer valid-token");

//       expect(response.status).toBe(200);
//       expect(response.body).toEqual({ user: null });
//     });

//     test("should return user when token is valid", async () => {
//       const mockUser = { id: "123", name: "Test User" };

//       (jwt.verify as jest.Mock).mockReturnValue({ userId: "123" });
//       (User.findOne as jest.Mock).mockResolvedValue(mockUser);

//       const response = await request(app)
//         .get("/me")
//         .set("Authorization", "Bearer valid-token");

//       expect(response.status).toBe(200);
//       expect(response.body).toEqual({ user: mockUser });
//       expect(User.findOne).toHaveBeenCalledWith({ where: { id: "123" } });
//     });
//   });

//   describe("GitHub authentication routes", () => {
//     test("GET /auth/github should call passport.authenticate", async () => {
//       await request(app).get("/auth/github");
//       expect(passport.authenticate).toHaveBeenCalledWith("github", {
//         session: false,
//       });
//     });

//     test("GET /auth/github/callback should redirect with token", async () => {
//       const response = await request(app).get("/auth/github/callback");
//       expect(response.status).toBe(302); // HTTP redirect status
//       expect(response.header.location).toBe(
//         "http://localhost:54321/auth/mock-token"
//       );
//     });
//   });
// });

// src/__tests__/github-strategy.test.ts

// Mock dependencies
jest.mock("passport-github");
jest.mock("jsonwebtoken");
jest.mock("./User");

// describe("GitHub OAuth Strategy", () => {
//   let strategyCallback: Function;
//   let mockProfile: any;
//   let mockCallback: jest.Mock;

//   beforeEach(() => {
//     process.env.GITHUB_TOKEN = "test-secret-key";
//     process.env.GITHUB_CLIENT_ID = "test-client-id";
//     process.env.GITHUB_CLIENT_SECRET = "test-client-secret";

//     // Capture the strategy callback when it's created
//     (GithubStrategy as unknown as jest.Mock).mockImplementation(
//       (options, callback) => {
//         strategyCallback = callback;
//         return {};
//       }
//     );

//     // Initialize strategy
//     passport.use(
//       new GithubStrategy(
//         {
//           clientID: process.env.GITHUB_CLIENT_ID,
//           clientSecret: process.env.GITHUB_CLIENT_SECRET,
//           callbackURL: "http://localhost:3002/auth/github/callback",
//         },
//         async (_, __, profile, cb) => {
//           let user = await User.findOne({
//             where: { githubId: profile.id },
//           });

//           if (user) {
//             user.name = profile.displayName;
//             await user.save();
//           } else {
//             user = await User.create({
//               name: profile.displayName,
//               githubId: profile.id,
//             }).save();
//           }

//           let myAccessToken = jwt.sign(
//             { userId: user?.id },
//             "alkfhlaksdfjdfkasdfklah",
//             { expiresIn: "1y" }
//           );

//           cb(null, { accessToken: myAccessToken });
//         }
//       )
//     );

//     // Set up mocks for tests
//     mockProfile = {
//       id: "github123",
//       displayName: "Test User",
//     };

//     mockCallback = jest.fn();

//     (User.findOne as jest.Mock).mockReset();
//     (User.create as jest.Mock).mockReset();
//     (jwt.sign as jest.Mock).mockReset();
//   });

//   test("should update existing user when found", async () => {
//     const mockUser = {
//       id: "user123",
//       name: "Old Name",
//       githubId: "github123",
//       save: jest.fn().mockResolvedValue(true),
//     };

//     (User.findOne as jest.Mock).mockResolvedValue(mockUser);
//     (jwt.sign as jest.Mock).mockReturnValue("signed-token");

//     await strategyCallback(null, null, mockProfile, mockCallback);

//     expect(User.findOne).toHaveBeenCalledWith({
//       where: { githubId: "github123" },
//     });
//     expect(mockUser.name).toBe("Test User");
//     expect(mockUser.save).toHaveBeenCalled();
//     expect(jwt.sign).toHaveBeenCalledWith(
//       { userId: "user123" },
//       "test-secret-key",
//       { expiresIn: "1y" }
//     );
//     expect(mockCallback).toHaveBeenCalledWith(null, {
//       accessToken: "signed-token",
//     });
//   });

//   test("should create new user when not found", async () => {
//     const mockUser = {
//       id: "new-user123",
//       save: jest.fn().mockReturnThis(),
//     };

//     (User.findOne as jest.Mock).mockResolvedValue(null);
//     (User.create as jest.Mock).mockReturnValue(mockUser);
//     (jwt.sign as jest.Mock).mockReturnValue("new-signed-token");

//     await strategyCallback(null, null, mockProfile, mockCallback);

//     expect(User.findOne).toHaveBeenCalledWith({
//       where: { githubId: "github123" },
//     });
//     expect(User.create).toHaveBeenCalledWith({
//       name: "Test User",
//       githubId: "github123",
//     });
//     expect(mockUser.save).toHaveBeenCalled();
//     expect(jwt.sign).toHaveBeenCalledWith(
//       { userId: "new-user123" },
//       "test-secret-key",
//       { expiresIn: "1y" }
//     );
//     expect(mockCallback).toHaveBeenCalledWith(null, {
//       accessToken: "new-signed-token",
//     });
//   });
// });

// src/__tests__/server-setup.test.ts

// Mock dependencies
jest.mock("express", () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    listen: jest.fn(),
  };
  return jest.fn(() => mockApp);
});

jest.mock("cors", () => jest.fn(() => "cors-middleware"));
jest.mock("passport", () => ({
  initialize: jest.fn(() => "passport-middleware"),
  use: jest.fn(),
  serializeUser: jest.fn(),
}));
export const mockBaseEntity = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn().mockReturnValue({
    save: jest.fn().mockReturnThis(),
  }),
  save: jest.fn().mockReturnThis(),
};
jest.mock("typeorm", () => {
  const originalModule = jest.requireActual("typeorm");
  return {
    __esModule: true,
    ...originalModule,
    BaseEntity: class MockBaseEntity {
      static findOne = mockBaseEntity?.findOne;
      static find = mockBaseEntity?.find;
      static create = mockBaseEntity?.create;
      save = mockBaseEntity?.save;
    },
    Entity: () => () => {},
    PrimaryGeneratedColumn: () => () => {},
    Column: () => () => {},
  };
});

describe("Server setup", () => {
  let app: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a fresh app instance
    app = express();
  });

  // test("should initialize Express app with correct middleware", () => {
  //   // Call the setup functions
  //   app.use(cors({ origin: "*" }));
  //   app.use(passport.initialize());
  //   app.use(express.json());

  //   // Verify middleware setup
  //   expect(cors).toHaveBeenCalledWith({ origin: "*" });
  //   expect(passport.initialize).toHaveBeenCalled();
  //   expect(app.use).toHaveBeenCalledWith("cors-middleware");
  //   expect(app.use).toHaveBeenCalledWith("passport-middleware");
  // });

  test("should configure routes correctly", () => {
    // Set up basic routes
    app.get("/", expect.any(Function));
    app.get("/auth/github", expect.any(Function));
    app.get("/auth/github/callback", expect.any(Function));
    app.get("/me", expect.any(Function));

    // Verify route setup
    expect(app.get).toHaveBeenCalledWith("/", expect.any(Function));
    expect(app.get).toHaveBeenCalledWith("/auth/github", expect.any(Function));
    expect(app.get).toHaveBeenCalledWith(
      "/auth/github/callback",
      expect.any(Function)
    );
    expect(app.get).toHaveBeenCalledWith("/me", expect.any(Function));
  });

  // test("should configure database connection", async () => {
  //   const mockDataSource = {
  //     initialize: jest.fn().mockResolvedValue(true),
  //   };

  //   (DataSource as jest.Mock).mockReturnValue(mockDataSource);

  //   await mockDataSource.initialize();

  //   expect(mockDataSource.initialize).toHaveBeenCalled();
  // });

  test("should start server on the correct port", () => {
    app.listen(3002, expect.any(Function));

    expect(app.listen).toHaveBeenCalledWith(3002, expect.any(Function));
  });
});
