/** wh hovi_client:skdb 0/meta */

import { run } from "@webhare/cli";
import { readRegistryKey } from "@webhare/services";

run({
  arguments: [
    {
      name: "<url>",
      description: "The URL to get",
    }
  ],
  async main({ args }) {
    const apiurl = await readRegistryKey("hovi_client:skdb20client.apiurl");
    const apikey = await readRegistryKey("hovi_client:skdb20client.apikey");
    if (!apiurl || !apikey) {
      console.error("SKDB 2.0 API URL or API Key not configured. Go to https://my.webhare.dev/?app=system:dashboard(system%3Amodules) and configure the hovi_client module.");
      return 1;
    }
    const result = await fetch(apiurl + args.url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apikey}`
      }
    });
    if (!result.ok) {
      console.error("Error fetching data from SKDB 2.0 API:", result.status, result.statusText);
      return 1;
    }
    if (result.headers.get("content-type") === "application/json") {
      const json = await result.json();
      console.log(JSON.stringify(json, null, 2));
      return 0;
    }
    console.log({ "Received a response with content-type": result.headers.get("content-type") });
    return 0;
  }
});
