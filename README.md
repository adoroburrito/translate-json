# translate-json
Quick script i hacked together to translate i18n json files with Google Translate API

## Usage
Script looks for file `en-US.json` in the `src` folder for what to translate. Outputs to `dist` folder with the provided *ISO 639-1* language key.

```bash
$ git clone https://github.com/andrestevao/translate-json
$ cd translate-json
$ npm install
$ npm run translate <ISO 639-1 code>
```
