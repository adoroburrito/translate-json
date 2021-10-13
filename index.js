const fs = require("fs").promises;
const path = require("path");
const translate = require("@vitalets/google-translate-api");
const { createConnection } = require("typeorm");
const CacheEntity = require("./entities/cache");

const SRC = path.join(__dirname, "src");
const DIST = path.join(__dirname, "dist");
let TARGET_LANG = null;

let connection = null;

const getFromCache = async ({ original, to }) => {
  const fromCache = await connection.getRepository(CacheEntity).find({
    to_lang: to,
    original,
  });

  if (fromCache.length === 0) {
    return [false, undefined];
  }

  return [true, fromCache[0].translated];
};

const translateString = async (string) => {
  const opts = {
    from: "en",
    to: TARGET_LANG,
  };

  console.log(
    `Translating string "${string}" from "${opts.from}" to "${opts.to}"`
  );

  //is this translation in cache?
  const cacheTranslation = await getFromCache({
    original: string,
    to: opts.to,
  });

  if (cacheTranslation[0] !== false) {
    console.log(`Cache hit!: "${cacheTranslation[1]}"`);
    return cacheTranslation[1];
  }

  console.log("Nothing in cache.");

  try {
    console.log(
      `Trying to translate string with Google Translate API: "${string}"...`
    );
    const { text } = await translate(string, opts);
    const cache = {
      to_lang: opts.to,
      original: string,
      translated: text,
    };
    await connection.getRepository(CacheEntity).save(cache);
    console.log(`Received translation from Google Translate API: "${text}"`);
    return text;
  } catch (error) {
    console.log(`Error while translating:`);
    console.log({ error });
    return "FAILED_TO_TRANSLATE";
  }
};

const translateRootDoc = async (rootDoc) => {
  const keys = Object.keys(rootDoc);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (typeof rootDoc[key] !== "string") {
      rootDoc[key] = await translateRootDoc(rootDoc[key]);
    } else {
      rootDoc[key] = await translateString(rootDoc[key]);
    }
  }
  return rootDoc;
};

const main = async () => {
  const { argv } = process;
  const args = argv.slice(2);
  if (!args[0]) {
    console.log("Usage: npm run translate <target lang ISO 639-1>");
    process.exit(1);
  }

  TARGET_LANG = args[0];

  connection = await createConnection({
    type: "sqlite",
    database: "./cache.db",
    synchronize: true,
    entities: [CacheEntity],
  });

  console.log(path.join(SRC, "en-US.json"));
  let rootDoc = await fs.readFile(path.join(SRC, "en-US.json"));
  rootDoc = JSON.parse(rootDoc.toString());

  const translatedRootDoc = await translateRootDoc(rootDoc);
  console.log({ translatedRootDoc });
  const toWrite = await JSON.stringify(translatedRootDoc);
  await fs.writeFile(path.join(DIST, `${TARGET_LANG}.json`), toWrite);
};

main();
