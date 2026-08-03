import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { warmModel } from "./services/huggingface.service.js";
void warmModel().then((result) => console.log("HF model warm-up:", result));
createApp().listen(env.PORT, () => console.log(`ThreadMark API listening on :${env.PORT}`));
