const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const cloudinary = require("./cloudinary");
const { CloudinaryStorage } =
  require("multer-storage-cloudinary");

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

// ================= Cloudinary =================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "quotation-products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  }),
});

const upload = multer({ storage });

// ================= DATABASE =================


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
app.get("/api/excel-product", async (req, res) => {

  try {

    const { productCode, brand } = req.query;

    if (!productCode || !brand) {

      return res.status(400).send({
        message: "Product code and brand required"
      });

    }

    const cleanCode =
      String(productCode)
        .trim()
        .toUpperCase();

    const cleanBrand =
      String(brand)
        .trim()
        .toUpperCase();

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

    if (!product) {

      return res.status(404).send({
        message: "No product found"
      });

    }

    // ================= FIND IMAGE =================
    const { data: imageData, error } =
      await supabase
        .from("product_images")
        .select("*")
        .eq("productCode", cleanCode)
        .eq("brand", cleanBrand)
        .order("id", { ascending: false })
        .limit(1);

    if (error) {
      console.log(error);
    }

    const imageRow = imageData?.[0];

    res.send({
      ...product,
      image: imageRow?.image || ""
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Server error"
    });

  }

});
// ================= CLIENT =================

// GET CLIENTS
app.get("/api/clients", async (req, res) => {

  const { data, error } =
    await supabase
      .from("clients")
      .select("*")
      .order("id", { ascending: false });

  if (error) {
    return res.status(500).send(error);
  }

  res.send(data);

});

// CREATE CLIENT (FIXED DUPLICATE ISSUE)
app.post("/api/clients", async (req, res) => {

  const {
    name,
    phone,
    email,
    address,
    gst
  } = req.body;

  const { data: existing } =
    await supabase
      .from("clients")
      .select("*")
      .eq("name", name)
      .maybeSingle();

  if (existing) {

    return res.status(400).send({
      message: "Client already exists"
    });

  }

  const { data, error } =
    await supabase
      .from("clients")
      .insert([
        {
          name,
          phone,
          email,
          address,
          gst
        }
      ])
      .select();

  if (error) {
    return res.status(500).send(error);
  }

  res.send(data[0]);

});

// UPDATE CLIENT
app.put("/api/clients/:id", async (req, res) => {

  const {
    name,
    phone,
    address,
    gst
  } = req.body;

  const { error } =
    await supabase
      .from("clients")
      .update({
        name,
        phone,
        address,
        gst
      })
      .eq("id", req.params.id);

  if (error) {
    return res.status(500).send(error);
  }

  res.send({
    message: "Updated"
  });

});

// DELETE CLIENT
app.delete("/api/clients/:id", async (req, res) => {

  try {

    const clientid = req.params.id;

    const { data: quotations } =
      await supabase
        .from("quotations")
        .select("id")
        .eq("clientid",clientid);

    const quotationIds =
      quotations?.map(q => q.id) || [];

    if (quotationIds.length > 0) {

      await supabase
        .from("quotation_items")
        .delete()
        .in("quotationId", quotationIds);

    }

    await supabase
      .from("quotations")
      .delete()
      .eq("clientid",clientid);

    await supabase
      .from("clients")
      .delete()
      .eq("id", clientid);

    res.send({
      message: "Client deleted"
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Delete failed"
    });

  }

});
// ================= PRODUCTS =================
app.get("/api/all-products", (req, res) => {
  res.send(excelData);
});

// ================= IMAGE =================

// UPLOAD IMAGE
app.post(
  "/api/upload-image",
  upload.single("image"),
  async (req, res) => {

    try {

      const imageUrl = req.file.path;

      const { productCode, brand } = req.body;

      const { error } = await supabase
        .from("product_images")
        .insert([
          {
            productcode: productCode,
            brand: brand,
            image: imageUrl
          }
        ]);

      if (error) {
        console.log(error);
        return res.status(500).send(error);
      }

      res.send({
        image: imageUrl
      });

    } catch (err) {

      console.log(err);

      res.status(500).send({
        message: "Upload failed"
      });

    }

  }
);

// GET IMAGE
app.get("/api/get-image", async (req, res) => {

  try {

    const { productCode,brand}= req.query;

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("productcode", cleanCode)
      .eq("brand", brand)
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      return res.status(500).send(error);
    }

    if (!data || data.length === 0) {
      return res.send({});
    }

    res.send({
      image: data[0].image
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Failed"
    });

  }

});

// ================= SAVE QUOTATION =================
app.post("/api/quotations", async (req, res) => {

  try {

    const {
      clientid,
      items,
      total,
      pf,
      gst
    } = req.body;

    // ================= CREATE QUOTATION =================
    const {
      data: quotationData,
      error
    } = await supabase
      .from("quotations")
      .insert([
        {
          clientid,
          total,
          pf: pf || 0,
          gst: gst || 0,
          createdAt: new Date().toISOString()
        }
      ])
      .select();

    if (error) {

      console.log(error);

      return res.status(500).send(error);

    }

    const qId = quotationData[0].id;

    // ================= ITEMS =================
    const itemsToInsert = items.map(item => ({

      quotationid: qId,

      productcode:item.productCode,

      brand: item.brand,

      description: item.description,

      qty: item.qty,

      discount: item.discount,

      netRate: item.netRate,

      total: item.total,

      section: item.section,

      subsection: item.subsection,

      image: item.image || ""

    }));

    await supabase
      .from("quotation_items")
      .insert(itemsToInsert);

    res.send({
      message: "Saved",
      quotationId: qId
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Save failed"
    });

  }

});

// ================= GET CLIENT QUOTATIONS =================
app.get("/api/client-quotations/:id", async (req, res) => {

  try {

    const clientid= req.params.id;

    const { data, error } =
      await supabase
        .from("quotations")
        .select("*")
        .eq("clientid",clientid)
        .order("createdAt", {
          ascending: false
        });

    if (error) {
      return res.status(500).send(error);
    }

    res.send(data);

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Load failed"
    });

  }

});

// ================= GET SINGLE QUOTATION =================
app.get("/api/quotation/:id", async (req, res) => {

  try {

    const id = req.params.id;

    // ================= QUOTATION =================
    const {
      data: quotation,
      error: quotationError
    } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .single();

    if (quotationError || !quotation) {

      return res.status(404).send({
        message: "Quotation not found"
      });

    }

    // ================= ITEMS =================
    const {
      data: items,
      error: itemsError
    } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotationId", id);

    if (itemsError) {

      return res.status(500).send(itemsError);

    }

    res.send({
      ...quotation,
      items
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Load failed"
    });

  }

});

// COPY QUOTATION (NEW VERSION)
app.post("/api/quotation-copy/:id", async (req, res) => {

  try {

    const oldId = req.params.id;

    // ================= OLD QUOTATION =================
    const {
      data: oldQuotation,
      error
    } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", oldId)
      .single();

    if (error || !oldQuotation) {

      return res.status(404).send({
        message: "Quotation not found"
      });

    }

    // ================= NEW VERSION =================
    const newVersion =
      (oldQuotation.version || 1) + 1;

    // ================= CREATE COPY =================
    const {
      data: newQuotation,
      error: insertError
    } = await supabase
      .from("quotations")
      .insert([
        {
          clientid:oldQuotation.clientid,
          total: oldQuotation.total,
          pf: oldQuotation.pf || 0,
          gst: oldQuotation.gst || 0,
          createdAt: new Date().toISOString(),
          version: newVersion,
          parentId: oldId
        }
      ])
      .select();

    if (insertError) {

      return res.status(500).send(insertError);

    }

    const newId = newQuotation[0].id;

    // ================= GET OLD ITEMS =================
    const {
      data: oldItems
    } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotationId", oldId);

    // ================= INSERT ITEMS =================
    const copiedItems =
      oldItems.map(item => ({

        quotationId: newId,

        productCode: item.productCode,

        brand: item.brand,

        description: item.description,

        qty: item.qty,

        discount: item.discount,

        netRate: item.netRate,

        total: item.total,

        section: item.section,

        subsection: item.subsection,

        image: item.image || ""

      }));

    await supabase
      .from("quotation_items")
      .insert(copiedItems);

    res.send({
      message: "Copied",
      newId
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Copy failed"
    });

  }

});

// ================= UPDATE QUOTATION =================
app.put("/api/quotation/:id", async (req, res) => {

  try {

    const quotationId = req.params.id;

    const {
      clientid,
      items,
      total,
      pf,
      gst
    } = req.body;

    // ================= UPDATE QUOTATION =================
    const { error } =
      await supabase
        .from("quotations")
        .update({
          clientid,
          total,
          pf: pf || 0,
          gst: gst || 0
        })
        .eq("id", quotationId);

    if (error) {

      return res.status(500).send(error);

    }

    // ================= DELETE OLD ITEMS =================
    await supabase
      .from("quotation_items")
      .delete()
      .eq("quotationId", quotationId);

    // ================= INSERT NEW ITEMS =================
    const itemsToInsert =
      items.map(item => ({

        quotationId,

        productCode: item.productCode,

        brand: item.brand,

        description: item.description,

        qty: item.qty,

        discount: item.discount,

        netRate: item.netRate,

        total: item.total,

        image: item.image || "",

        section: item.section,

        subsection: item.subsection

      }));

    await supabase
      .from("quotation_items")
      .insert(itemsToInsert);

    res.send({
      message: "Quotation updated"
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Update failed"
    });

  }

});

// ================= CREATE REVISION =================
app.post("/api/quotation-revision/:id", async (req, res) => {

  try {

    const oldId = req.params.id;

    const {
      clientid,
      items,
      total,
      pf,
      gst
    } = req.body;

    // ================= OLD QUOTATION =================
    const {
      data: oldQuotation,
      error
    } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", oldId)
      .single();

    if (error || !oldQuotation) {

      return res.status(404).send({
        message: "Quotation not found"
      });

    }

    const newVersion =
      (oldQuotation.version || 1) + 1;

    const parentId =
      oldQuotation.parentId || oldQuotation.id;

    // ================= CREATE REVISION =================
    const {
      data: newQuotation,
      error: insertError
    } = await supabase
      .from("quotations")
      .insert([
        {
          clientid,
          total,
          pf: pf || 0,
          gst: gst || 0,
          createdAt: new Date().toISOString(),
          version: newVersion,
          parentId
        }
      ])
      .select();

    if (insertError) {

      return res.status(500).send(insertError);

    }

    const newQuotationId =
      newQuotation[0].id;

    // ================= INSERT ITEMS =================
    const itemsToInsert =
      items.map(item => ({

        quotationId: newQuotationId,

        productCode: item.productCode,

        brand: item.brand,

        description: item.description,

        qty: item.qty,

        discount: item.discount,

        netRate: item.netRate,

        total: item.total,

        image: item.image || "",

        section: item.section,

        subsection: item.subsection

      }));

    await supabase
      .from("quotation_items")
      .insert(itemsToInsert);

    res.send({
      message: "Revision saved",
      quotationId: newQuotationId
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Revision failed"
    });

  }

});

// ================= DELETE QUOTATION =================
app.delete("/api/quotation/:id", async (req, res) => {

  try {

    const quotationId = req.params.id;

    // ================= DELETE ITEMS =================
    await supabase
      .from("quotation_items")
      .delete()
      .eq("quotationId", quotationId);

    // ================= DELETE QUOTATION =================
    await supabase
      .from("quotations")
      .delete()
      .eq("id", quotationId);

    res.send({
      message: "Quotation deleted"
    });

  } catch (err) {

    console.log(err);

    res.status(500).send({
      message: "Delete failed"
    });

  }

});

// ================= START =================
app.listen(PORT, async () => {
  console.log("Server running on http://localhost:5000");
  await loadExcel();
});