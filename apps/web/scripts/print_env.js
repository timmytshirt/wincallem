require("dotenv").config({ path: ".env", override: true, debug: true });
console.log("DATABASE_URL present?", !!process.env.DATABASE_URL);
console.log("DIRECT_DATABASE_URL present?", !!process.env.DIRECT_DATABASE_URL);
console.log("DATABASE_URL sample:", (process.env.DATABASE_URL || "").slice(0, 35));
