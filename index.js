import mime from "mime-types"
import fileType from "file-type"
import fileUpload from "express-fileupload"
import bodyParser from "body-parser"
import uuid from "uuidv4"
import knex from "knex"
import path from "path"

const handleGetUpload = ({ db, tableName }) => async (req, res) => {
  let file_id = req.url
    .split("/")
    .slice(-1)[0]
    .split(".")[0]

  try {
    const fi = await db(tableName)
      .select("*")
      .where({ file_id })
      .first()

    if (!fi) return res.status(404).send("upload not found")

    res.contentType(fi.mimetype)
    res.end(fi.data, "binary")
  } catch (e) {
    if (e.toString().includes("invalid input syntax for type uuid")) {
      return res.status(400).send("invalid file id")
    } else {
      return res.status(500).send("error retrieving file")
    }
  }
}

const handlePostUpload = ({ db, tableName }) => async (req, res) => {
  const { files } = req

  const { name: filename, data } = files.file
  const mimeInfo = fileType(data)
  const mimetype = mimeInfo ? mimeInfo.mime : files.file.mimetype

  const file_id = (await db(tableName)
    .insert({ data, file_id: uuid(), mimetype, filename })
    .returning("file_id"))[0]

  const extension = filename ? filename.split(".")[1] : mime.extension(mimetype)
  const filePath = path.join(
    req.originalUrl,
    `${file_id.replace(/-/g, "")}.${extension}`
  )

  res.json({
    success: true,
    file_id,
    path: filePath,
    url: `${req.protocol}://${req.get("host")}${filePath}`
  })
}

const middlewares = [
  fileUpload(),
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json({ limit: "90mb" })
]

module.exports = handle => {
  if (!handle.tableName) handle.tableName = "posty_file"
  handle.db = knex({
    client: "pg",
    connection: handle.pgCredentials
  })

  // Create table if it doesn't exist
  handle.db.schema.hasTable(handle.tableName).then(async exists => {
    if (!exists) {
      await handle.db.schema.createTable(handle.tableName, table => {
        table.uuid("file_id").primary()
        table.specificType("data", "bytea").notNullable()
        table.text("mimetype").notNullable()
        table.text("filename")
        table.timestamp("created_at").defaultTo(handle.db.fn.now())
        table.jsonb("app_data")
      })
    }
  })

  return async (req, res) => {
    for (const middleware of middlewares) {
      await new Promise(resolve => middleware(req, res, resolve))
    }
    if (req.method === "POST") {
      return await handlePostUpload(handle)(req, res)
    } else if (req.method === "GET") {
      return await handleGetUpload(handle)(req, res)
    } else {
      res.status(404).send("Page not found")
    }
  }
}
