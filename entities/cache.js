const EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
    name: "cache", // Will use table name `category` as default behaviour.
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        to_lang: {
            type: "varchar"
        },
        original: {
            type: "varchar"
        },
        translated: {
            type: "varchar"
        },
    }
});