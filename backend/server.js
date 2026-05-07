const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const axios = require("axios");
const XLSX = require("xlsx");

const app = express();
const PORT = 5000;

// ================= SETUP =================
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.use(cors({
  origin: "*", // allow excel fetch
}));

app.use(express.json({ limit: "20mb" }));

// 🔥 VERY IMPORTANT (serve images correctly)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= UPLOAD =================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================= DATABASE =================
const db = new sqlite3.Database("./database.db");

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    gst TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    total REAL,
    pf REAL DEFAULT 0,
    gst REAL DEFAULT 0,
    createdAt TEXT,
    version INTEGER DEFAULT 1,
    parentId INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotationId INTEGER,
    productCode TEXT,
    brand TEXT,
    description TEXT,
    qty INTEGER,
    discount REAL,
    netRate REAL,
    total REAL,
    image TEXT,
    section TEXT,
    subsection TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productCode TEXT,
    brand TEXT,
    image TEXT
  )`);
});

// ================= EXCEL =================
let excelData = [];

async function loadExcel() {
  try {
    const fileId = "1-eNUlnzxpnH_l1OmFxN3Sle3ONQqt6CA";
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios.get(url, { responseType: "arraybuffer" });
    const workbook = XLSX.read(response.data, { type: "buffer" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    excelData = XLSX.utils.sheet_to_json(sheet);
    
    console.log("FIRST PRODUCT:");
    console.log(excelData[0]);

    console.log("Excel Loaded:", excelData.length);
  } catch (err) {
    console.error("Excel load failed:", err);
  }
}

// ================= SEARCH EXCEL PRODUCT =================
app.get("/api/excel-product", (req, res) => {

  try {

    const { productCode, brand } = req.query;

    // ================= VALIDATION =================
    if (!productCode || !brand) {

      return res.status(400).send({
        message: "Product code and brand required"
      });

    }

    // ================= CLEAN INPUT =================
    const cleanCode =
      String(productCode)
        .trim()
        .toUpperCase();

    const cleanBrand =
      String(brand)
        .trim()
        .toUpperCase();

    console.log("SEARCHING PRODUCT:");
    console.log("CODE:", cleanCode);
    console.log("BRAND:", cleanBrand);

    // ================= FIND PRODUCT =================
    const product = excelData.find((p) => {

      const excelCode =
        String(p.CODE || "")
          .trim()
          .toUpperCase();

      const excelBrand =
        String(p.BRAND || "")
          .trim()
          .toUpperCase();

      return (
        excelCode === cleanCode &&
        excelBrand === cleanBrand
      );

    });

    // ================= NOT FOUND =================
    if (!product) {

      console.log("PRODUCT NOT FOUND");

      return res.status(404).send({
        message: "No product found"
      });

    }

    // ================= FIND IMAGE =================
    db.get(
      `
      SELECT image
      FROM product_images
      WHERE
        UPPER(TRIM(productCode)) = ?
        AND
        UPPER(TRIM(brand)) = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [cleanCode, cleanBrand],
      (err, imageRow) => {

        if (err) {
          console.log("IMAGE ERROR:", err);
        }

        // ================= FINAL RESPONSE =================
        res.send({

          ...product,

          image: imageRow?.image
            ? `http://localhost:5000${imageRow.image}`
            : ""

        });

      }
    );

  } catch (err) {

    console.log("PRODUCT SEARCH ERROR:", err);

    res.status(500).send({
      message: "Server error"
    });

  }

});
// ================= CLIENT =================

// GET CLIENTS
app.get("/api/clients", (req, res) => {
  db.all("SELECT * FROM clients", [], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.send(rows);
  });
});

// CREATE CLIENT (FIXED DUPLICATE ISSUE)
app.post("/api/clients", (req, res) => {
  const { name, phone, email, address, gst } = req.body;

  db.get("SELECT * FROM clients WHERE name=?", [name], (err, row) => {
    if (row) {
      return res.status(400).send({ message: "Client already exists" });
    }

    db.run(
      `INSERT INTO clients (name, phone, email, address, gst)
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email, address, gst],
      function (err) {
        if (err) return res.status(500).send(err);
        res.send({ id: this.lastID });
      }
    );
  });
});

// UPDATE CLIENT
app.put("/api/clients/:id", (req, res) => {
  const { name, phone, address, gst } = req.body;

  db.run(
    `UPDATE clients SET name=?, phone=?, address=?, gst=? WHERE id=?`,
    [name, phone, address, gst, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err);
      res.send({ message: "Updated" });
    }
  );
});

// DELETE CLIENT
app.delete("/api/clients/:id", (req, res) => {
  const clientId = req.params.id;

  // 1. Get all quotations of this client
  db.all(
    "SELECT id FROM quotations WHERE clientId=?",
    [clientId],
    (err, rows) => {
      if (err) return res.status(500).send(err);

      const quotationIds = rows.map(q => q.id);

      // 2. Delete quotation items
      if (quotationIds.length > 0) {
        const ids = quotationIds.join(",");

        db.run(
          `DELETE FROM quotation_items WHERE quotationId IN (${ids})`,
          () => {

            // 3. Delete quotations
            db.run(
              `DELETE FROM quotations WHERE clientId=?`,
              [clientId],
              () => {

                // 4. Delete client
                db.run(
                  "DELETE FROM clients WHERE id=?",
                  [clientId],
                  function () {
                    res.send({ message: "Client and all quotations deleted" });
                  }
                );
              }
            );
          }
        );
      } else {
        // No quotations → delete directly
        db.run(
          "DELETE FROM clients WHERE id=?",
          [clientId],
          function () {
            res.send({ message: "Client deleted" });
          }
        );
      }
    }
  );
});
// ================= PRODUCTS =================
app.get("/api/all-products", (req, res) => {
  res.send(excelData);
});

// ================= IMAGE =================

// UPLOAD IMAGE
app.post("/api/upload-image", upload.single("image"), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  const { productCode, brand } = req.body;

  db.run(
    `INSERT INTO product_images (productCode, brand, image)
     VALUES (?, ?, ?)`,
    [productCode, brand, filePath],
    () => res.send({ image: filePath })
  );
});

// GET IMAGE
app.get("/api/get-image", (req, res) => {
  const { productCode, brand } = req.query;

  db.get(
    `SELECT image FROM product_images
     WHERE productCode=? AND brand=?
     ORDER BY id DESC LIMIT 1`,
    [productCode, brand],
    (err, row) => {
      if (row) {
        // 🔥 return FULL URL (IMPORTANT FOR EXCEL)
        res.send({
          image: `http://localhost:5000${row.image}`
        });
      } else {
        res.send({});
      }
    }
  );
});

// ================= SAVE QUOTATION =================
app.post("/api/quotations", (req, res) => {
console.log("BODY RECEIVED:", req.body);
  const { clientId, items, total, pf, gst } = req.body;

  db.run(
    `INSERT INTO quotations (clientId, total, pf, gst, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [clientId, total, pf || 0, gst || 0, new Date().toISOString()],
    function (err) {

      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }

      const qId = this.lastID;

      items.forEach(item => {

        db.run(
          `INSERT INTO quotation_items
          (
            quotationId,
            productCode,
            brand,
            description,
            qty,
            discount,
            netRate,
            total,
            section,
            subsection,
            image
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            qId,
            item.productCode,
            item.brand,
            item.description,
            item.qty,
            item.discount,
            item.netRate,
            item.total,
            item.section,
            item.subsection,
            item.image || ""
          ],
          (err) => {
            if (err) {
              console.log("ITEM INSERT ERROR:", err);
            }
          }
        );

      });

      res.send({
        message: "Saved",
        quotationId: qId
      });

    }
  );

});
// ================= GET CLIENT QUOTATIONS =================
app.get("/api/client-quotations/:id", (req, res) => {
  const clientId = req.params.id;

  db.all(
    `SELECT * FROM quotations WHERE clientId=? ORDER BY createdAt DESC`,
    [clientId],
    (err, rows) => {
      if (err) return res.status(500).send(err);

      res.send(rows);
    }
  );
});

// ================= GET SINGLE QUOTATION =================
app.get("/api/quotation/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    `SELECT * FROM quotations WHERE id=?`,
    [id],
    (err, quotation) => {
      if (err) return res.status(500).send(err);
      if (!quotation) return res.status(404).send({ message: "Not found" });

      db.all(
        `SELECT * FROM quotation_items WHERE quotationId=?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).send(err);

          res.send({
            ...quotation,
            items
          });
        }
      );
    }
  );
});

// COPY QUOTATION (NEW VERSION)
app.post("/api/quotation-copy/:id", (req, res) => {

  const oldId = req.params.id;

  db.get(
    "SELECT * FROM quotations WHERE id=?",
    [oldId],
    (err, q) => {

      if (err) {
        console.log("COPY FETCH ERROR:", err);
        return res.status(500).send(err);
      }

      if (!q) {
        return res.status(404).send("Not found");
      }

      // ================= VERSION =================
      const newVersion = (q.version || 1) + 1;

      db.run(
        `INSERT INTO quotations
        (
          clientId,
          total,
          pf,
          gst,
          createdAt,
          version,
          parentId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          q.clientId,
          q.total,
          q.pf || 0,
          q.gst || 0,
          new Date().toISOString(),
          newVersion,
          oldId
        ],
        function (err) {

          if (err) {
            console.log("COPY INSERT ERROR:", err);
            return res.status(500).send(err);
          }

          const newId = this.lastID;

          db.all(
            "SELECT * FROM quotation_items WHERE quotationId=?",
            [oldId],
            (err, items) => {

              if (err) {
                console.log("COPY ITEMS ERROR:", err);
                return res.status(500).send(err);
              }

              items.forEach(item => {

                db.run(
                  `INSERT INTO quotation_items
                  (
                    quotationId,
                    productCode,
                    brand,
                    description,
                    qty,
                    discount,
                    netRate,
                    total,
                    section,
                    subsection,
                    image
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    newId,
                    item.productCode,
                    item.brand,
                    item.description,
                    item.qty,
                    item.discount,
                    item.netRate,
                    item.total,
                    item.section,
                    item.subsection,
                    item.image || ""
                  ]
                );

              });

              res.send({
                message: "Copied",
                newId
              });

            }
          );

        }
      );

    }
  );

});

// ================= UPDATE QUOTATION =================
app.put("/api/quotation/:id", (req, res) => {

  const quotationId = req.params.id;

  const { clientId, items, total, pf, gst } = req.body;

  db.run(
    `UPDATE quotations
     SET clientId=?, total=?, pf=?, gst=?
     WHERE id=?`,
    [
      clientId,
      total,
      pf || 0,
      gst || 0,
      quotationId
    ],
    function (err) {

      if (err) {
        return res.status(500).send(err);
      }

      db.run(
        `DELETE FROM quotation_items
         WHERE quotationId=?`,
        [quotationId],
        function (err) {

          if (err) {
            return res.status(500).send(err);
          }

          items.forEach(item => {

            db.run(
              `INSERT INTO quotation_items
              (
                quotationId,
                productCode,
                brand,
                description,
                qty,
                discount,
                netRate,
                total,
                image,
                section,
                subsection
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                quotationId,
                item.productCode,
                item.brand,
                item.description,
                item.qty,
                item.discount,
                item.netRate,
                item.total,
                item.image || "",
                item.section,
                item.subsection
              ]
            );

          });

          res.send({
            message: "Quotation updated"
          });

        }
      );

    }
  );

});

// ================= CREATE REVISION =================
app.post("/api/quotation-revision/:id", (req, res) => {

  const oldId = req.params.id;

  const {
    clientId,
    items,
    total,
    pf,
    gst
  } = req.body;

  db.get(
    "SELECT * FROM quotations WHERE id=?",
    [oldId],
    (err, oldQuotation) => {

      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }

      if (!oldQuotation) {
        return res.status(404).send({
          message: "Quotation not found"
        });
      }

      // ================= VERSION =================
      const newVersion =
        (oldQuotation.version || 1) + 1;

      const parentId =
        oldQuotation.parentId || oldQuotation.id;

      // ================= INSERT NEW QUOTATION =================
      db.run(
        `INSERT INTO quotations
        (
          clientId,
          total,
          pf,
          gst,
          createdAt,
          version,
          parentId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          total,
          pf || 0,
          gst || 0,
          new Date().toISOString(),
          newVersion,
          parentId
        ],
        function (err) {

          if (err) {
            console.log("REVISION INSERT ERROR:", err);
            return res.status(500).send(err);
          }

          const newQuotationId =
            this.lastID;

          // ================= INSERT ITEMS =================
          items.forEach(item => {

            db.run(
              `INSERT INTO quotation_items
              (
                quotationId,
                productCode,
                brand,
                description,
                qty,
                discount,
                netRate,
                total,
                image,
                section,
                subsection
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newQuotationId,
                item.productCode,
                item.brand,
                item.description,
                item.qty,
                item.discount,
                item.netRate,
                item.total,
                item.image || "",
                item.section,
                item.subsection
              ]
            );

          });

          res.send({
            message: "Revision saved",
            quotationId: newQuotationId
          });

        }
      );

    }
  );

});

// ================= DELETE QUOTATION =================
app.delete("/api/quotation/:id", (req, res) => {

  const quotationId = req.params.id;

  db.run(
    `DELETE FROM quotation_items WHERE quotationId=?`,
    [quotationId],
    function (err) {

      if (err) {
        return res.status(500).send(err);
      }

      db.run(
        `DELETE FROM quotations WHERE id=?`,
        [quotationId],
        function (err) {

          if (err) {
            return res.status(500).send(err);
          }

          res.send({
            message: "Quotation deleted"
          });

        }
      );

    }
  );

});

// ================= START =================
app.listen(PORT, async () => {
  console.log("Server running on http://localhost:5000");
  await loadExcel();
});