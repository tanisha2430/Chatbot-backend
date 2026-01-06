import express from "express";
import cors from "cors";
import chatHandler from "../api/chat.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", chatHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
