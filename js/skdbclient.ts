import { loadlib } from "@webhare/harescript";
import { lockMutex, readRegistryKey, toFSPath, WebHareBlob } from "@webhare/services";
import { deleteRecursive, storeDiskFile } from "@webhare/system-tools";
import { mkdir, rename } from "node:fs/promises";

const skdbApiVersions = [0];

export async function validateCredentials(url: string, key: string) {
  const apimeta = await fetch(url + 'v0/meta', {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${key}`
    }
  });
  try {
    return await apimeta.json();
  } catch {
    return null;
  }
}

export async function downloadSkdb() {
  using mutex = await lockMutex("hovi_client:download_skdb");
  void (mutex);

  const apiurl = await readRegistryKey<string>("hovi_client.skdb20client.apiurl");
  const apikey = await readRegistryKey<string>("hovi_client.skdb20client.apikey");
  if (!apikey || !apiurl) {
    return { isError: false, isComplete: false, message: "No API key or URL found in registry, cannot download" };
  }

  for (const api of skdbApiVersions) {
    const jsonexport = await fetch(`${apiurl}v${api}/export/json`, { headers: { "Authorization": `Bearer ${apikey}` } });
    if (!jsonexport.ok)
      return { isError: true, message: `Error fetching data from SKDB 2.0 API: ${jsonexport.status} ${jsonexport.statusText}` };

    if (jsonexport.headers.get("content-type") !== "application/zip")
      return { isError: true, message: `Unexpected response type from SKDB 2.0 API: ${jsonexport.headers.get("content-type")}` };

    //TOOD use jszip but for backwardscompat we'll invoke unpackarchive until ALL ARE 5.7

    const result = await loadlib("wh::filetypes/archiving.whlib").unpackArchive(WebHareBlob.from(Buffer.from(await jsonexport.arrayBuffer())));
    const outdir = toFSPath("storage::hovi_client/skdb20/v" + api);
    const olddir = `${outdir}.old`;
    const newdir = `${outdir}.new`;

    await deleteRecursive(newdir, { allowMissing: true, deleteSelf: true }); //delete any exisitng .new
    await mkdir(newdir, { recursive: true });
    for (const file of result)
      await storeDiskFile(`${newdir}/${file.name}`, file.data, { overwrite: true });

    await rename(outdir, olddir);
    await rename(newdir, outdir);
    await deleteRecursive(olddir, { allowMissing: true, deleteSelf: true });
  }
  return { isError: false, isComplete: true, message: "Download complete" };
}
