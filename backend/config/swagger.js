import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "J26-SE-307 API",
      version: "1.0.0",
      description: "Auth and analysis endpoints",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SessionResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/PublicUser" },
          },
        },
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["general", "clinical", "admin"] },
          },
        },
        ErrorMessage: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./docs/*.js", "./routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
