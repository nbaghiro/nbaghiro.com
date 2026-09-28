import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load server/.env (wherever the process was started from) before anything reads it
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3100;

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("✅ Server ready to accept requests\n");
});
