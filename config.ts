// Add values if you are not using env vars
import dotenv from "dotenv";

dotenv.config();

const config = {
  session_key: process.env.SESSION_KEY,
  pmpermit_enabled: process.env.PMPERMIT_ENABLED || "true",
  mongodb_url: process.env.MONGODB_URL || process.env.MONGO_URL || "",
  default_tr_lang: process.env.DEFAULT_TR_LANG || "en",
  enable_delete_alert: process.env.ENABLE_DELETE_ALERT || "true",
  ocr_space_api_key: process.env.OCR_SPACE_API_KEY || "",
  cf_worker: {
    url: process.env.CF_WORKER_URL,
    username: process.env.CF_WORKER_USERNAME,
    password: process.env.CF_WORKER_PASSWORD,
  },
};

export default config;
