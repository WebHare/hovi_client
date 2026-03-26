import { downloadSkdb } from "@mod-hovi_client/js/skdbclient";
import { run } from "@webhare/cli";
import { sleep } from "@webhare/std";
import { isatty } from "node:tty";


run({
  async  main() {
    if (isatty(0)) //not running interactively
      await sleep(Math.random() * 90_000); //as we run on a schedule let's not ALL connect at 6:30AM

    const result = await downloadSkdb();
    if (result.isError) {
      console.error(result.message);
      return 1;
    }
    return 0;
  }
});
