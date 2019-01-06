# express-pg-posty

A simple express file upload and serve middleware using postgres.

## Usage

```javascript
const express = require("express")
const pgPosty = require("express-pg-posty")

const app = express()

app.use(
  pgPosty({
    pgCredentials: {
      host: "127.0.0.1",
      user: "your_database_user",
      password: "your_database_password",
      database: "myapp_test"
    }
  })
)
```

## Advanced Usage

```javascript
const express = require("express")
const pgPosty = require("express-pg-posty")

const app = express()

app.use(
  pgPosty({
    // Required: Credentials to Postgres Database
    pgCredentials: {
      host: "127.0.0.1",
      user: "your_database_user",
      password: "your_database_password",
      database: "myapp_test"
    },

    // Optional: Specify table name
    tableName: "posty_file"
  })
)
```

## Endpoints

Posty will create the following endpoints. Note that the prefix `/posty` is based on the example `app.use("/posty", pgPosty({/* ... */}))`.

| Endpoint                | Description                                                                | Parameters                             |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `POST /posty`           | Upload a file                                                              | Supply `file` as a multipart/form file |
| `GET /posty/:file_id.*` | Returns the file uploaded to posty. The extension is optional and ignored. |                                        |

The `POST` request will return the following response:

```javascript
{
  success: true,
  file_id: "<uuid>",
  path: "/posty/<uuid>",
  url: "https://yourwebsite.com/posty/<uuid>"
}
```

## Database Table

A table (by default "posty_file") will be created to store all of your files. This is the structure of the table:

| column_name | data_type                | is_nullable | column_default | comment |
| ----------- | ------------------------ | ----------- | -------------- | ------- |
| file_id     | uuid                     | no          |                |         |
| data        | bytea                    | no          |                |         |
| mimetype    | text                     | no          |                |         |
| filename    | text                     | yes         |                |         |
| created_at  | timestamp with time zone | no          | now()          |         |
| app_data    | jsonb                    | yes         |                |         |

## FAQ

### Isn't it bad to store files in a database?

It depends. Storing files in a database often makes local development easier and the retrieval performance penalty is negligible for a lot of applications. If you're looking for high performance reads, consider using S3.

### Won't this allow anyone to upload files to my site? What about rate limiting etc.

This middleware provides the file upload/serving capabilities, you'll want to combine it with other middleware to validate requests, provide rate limiting etc.

### I'd like to provide other data alongside the file, how do I do that?

You can set `req.postyAppData` to whatever you want prior to posty processing the upload, it'll be stored alongside the file in the database in the `app_data` column.

### How do I upload files?

Depends on your framework/library. Use a regular POST request with a multipart/form upload.

You can test that posty is working with a quick curl request:

```bash
curl -F 'file=@test.txt' http://localhost:3000/posty
```
