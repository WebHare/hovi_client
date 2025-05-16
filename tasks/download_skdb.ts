import { run } from "@webhare/cli";
import { loadlib } from "@webhare/harescript";
import { readRegistryKey, toFSPath, WebHareBlob } from "@webhare/services";
import { sleep } from "@webhare/std";
import { deleteRecursive, storeDiskFile } from "@webhare/system-tools";
import { mkdir , rename } from "node:fs/promises";
import { isatty } from "node:tty";

const skdbApiVersions = [0];

run({
  async main() {
    if(!isatty(0)) //not running interactively
      await sleep(Math.random() * 90_000); //as we run on a schedule let's not ALL connect at 6:30AM

    const apiurl = await readRegistryKey("hovi_client:skdb20client.apiurl");
    const apikey = await readRegistryKey("hovi_client:skdb20client.apikey");
    if (!apiurl || !apikey)
      return 0; //nothing to do

    for (const api of skdbApiVersions) {
      const jsonexport = await fetch(`${apiurl}v${api}/export/json`, { headers: { "Authorization": `Bearer ${apikey}` } });
      if (!jsonexport.ok) {
        console.error("Error fetching data from SKDB 2.0 API:", jsonexport.status, jsonexport.statusText);
        return 1;
      }
      if (jsonexport.headers.get("content-type") !== "application/zip") {
        console.error("Unexpected response type from SKDB 2.0 API:", jsonexport.headers.get("content-type"));
        return 1;
      }

      //TOOD use jszip but for backwardscompat we'll invoke unpackarchive until ALL ARE 5.7

      const result = await loadlib("wh::filetypes/archiving.whlib").unpackArchive(WebHareBlob.from(Buffer.from(await jsonexport.arrayBuffer())));
      console.table(result);
      const outdir = toFSPath("storage::hovi_client/skdb20/v" + api);
      const olddir = `${outdir}.old`;
      const newdir = `${outdir}.new`;

      await deleteRecursive(newdir, { allowMissing: true, deleteSelf: true }); //delete any exisitng .new
      await mkdir(newdir, { recursive: true });
      console.log({outdir,olddir,newdir});
      for (const file of result)
        await storeDiskFile(`${newdir}/${file.name}`, file.data, { overwrite: true });

      await rename(outdir, olddir);
      await rename(newdir, outdir);
      await deleteRecursive(olddir, { allowMissing: true, deleteSelf: true });
    }
    return 0;
 }
});
