// import { replicate, clean, fetchSession } from "./session/manage.js";
import main from "./main.js";

async function start() {
  try {
    // clean();
    // await fetchSession();
    // await replicate();
    setTimeout(() => {
      main();
    }, 2000);
  } catch (error) {
    console.error(error?.message);
  }
}
start();
