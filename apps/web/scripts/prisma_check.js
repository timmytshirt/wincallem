require("dotenv").config({ path: ".env" });  // <-- add this line

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  try {
    console.log("DATABASE_URL present?", !!process.env.DATABASE_URL);
    const user = await p.user.findUnique({ where: { email: "test@example.com" } });
    console.log("findUnique result:", user);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await p.$disconnect();
  }
})();
