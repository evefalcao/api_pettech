"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/repositories/pg/user.reposititory.ts
var user_reposititory_exports = {};
__export(user_reposititory_exports, {
  UserRepository: () => UserRepository
});
module.exports = __toCommonJS(user_reposititory_exports);

// src/lib/pg/db.ts
var import_pg = require("pg");

// src/env/index.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
  PORT: import_zod.z.coerce.number().default(3030),
  DATABASE_USER: import_zod.z.string(),
  DATABASE_HOST: import_zod.z.string(),
  DATABASE_NAME: import_zod.z.string(),
  DATABASE_PASSWORD: import_zod.z.string(),
  DATABASE_PORT: import_zod.z.coerce.number(),
  JWT_SECRET: import_zod.z.string()
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}
var env = _env.data;

// src/lib/pg/db.ts
var CONFIG = {
  user: env.DATABASE_USER,
  host: env.DATABASE_HOST,
  database: env.DATABASE_NAME,
  password: env.DATABASE_PASSWORD,
  port: env.DATABASE_PORT
};
var Database = class {
  constructor() {
    this.pool = new import_pg.Pool(CONFIG);
    this.connection();
  }
  async connection() {
    try {
      this.client = await this.pool.connect();
    } catch (error) {
      console.error(`Error connecting to the database: ${error}`);
      throw new Error(`Error connecting to the database: ${error}`);
    }
  }
  get clientInstance() {
    return this.client;
  }
};
var database = new Database();

// src/repositories/pg/user.reposititory.ts
var UserRepository = class {
  async findByUsername(username) {
    const result = await database.clientInstance?.query(
      `SELECT * FROM "user" WHERE "user".username = $1`,
      [username]
    );
    return result?.rows[0];
  }
  async create({
    username,
    password
  }) {
    const result = await database.clientInstance?.query(
      `INSERT INTO "user" (username, password) VALUES ($1, $2) RETURNING *`,
      [username, password]
    );
    return result?.rows[0];
  }
  async findWithPerson(userId) {
    const result = await database.clientInstance?.query(
      `SELECT * FROM "user" 
      LEFT JOIN person ON "user".id = person.user_id
      WHERE "user".id = $1`,
      [userId]
    );
    return result?.rows[0];
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserRepository
});
