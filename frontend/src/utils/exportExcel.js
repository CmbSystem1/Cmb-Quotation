import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportQuotationExcel = async (
  sections,
  grandTotal,
  pf,
  gst,
  netTotal,
  client = { name: "", address: "" }
) => {

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quotation");

  // ================= COMPANY =================
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "Chabildas Manikdas & Bros";
  sheet.getCell("A1").font = { size: 16, bold: true };

  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = "Address | Phone | Email";

  // ================= TITLE =================
  sheet.mergeCells("A4:J4");
  sheet.getCell("A4").value = "QUOTATION";
  sheet.getCell("A4").font = { size: 18, bold: true };
  sheet.getCell("A4").alignment = { horizontal: "center" };

  // ================= CLIENT =================
  sheet.getCell("A6").value = "Client:";
  sheet.getCell("B6").value = client.name || "";

  sheet.getCell("A7").value = "Address:";
  sheet.getCell("B7").value = client.address || "";

  sheet.getCell("H6").value = "Date:";
  sheet.getCell("I6").value = new Date().toLocaleDateString();

  sheet.getCell("H7").value = "Quote No:";
  sheet.getCell("I7").value = "Q-" + Date.now();

  // ================= TABLE HEADER =================
  const headers = [
    "Code", "Brand", "Description", "Qty", "Rate",
    "Disc %", "Disc Amt", "Net Rate", "Total", "Image"
  ];

  sheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 35 },
    { width: 8 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 25 }
  ];

  const headerRow = sheet.addRow(headers);

  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    };
  });

  let rowIndex = sheet.lastRow.number + 1;

  // ================= DATA =================
  for (const sec of sections) {

    // ===== SECTION =====
    const secRow = sheet.addRow([sec.name]);
    sheet.mergeCells(`A${rowIndex}:J${rowIndex}`);
    secRow.font = { bold: true, size: 13 };
    secRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDEEFF" }
    };

    rowIndex++;

    let sectionTotal = 0;

    for (const sub of sec.subsections) {

      // ===== SUBSECTION =====
      const subRow = sheet.addRow([sub.name]);
      sheet.mergeCells(`A${rowIndex}:J${rowIndex}`);
      subRow.font = { bold: true };
      subRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" }
      };

      rowIndex++;

      let subTotal = 0;

      for (const r of sub.rows) {
        console.log("DEBUG IMAGE VALUE:", r.image);

        const row = sheet.addRow([
          r.productCode,
          r.brand,
          r.description,
          r.qty,
          r.rate,
          r.discount,
          r.discAmount,
          r.netRate,
          r.total,
          ""
        ]);

        // currency
        ["E","G","H","I"].forEach(col => {
          sheet.getCell(`${col}${rowIndex}`).numFmt = "₹#,##0.00";
        });

        // borders
        row.eachCell(cell => {
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          };
        });

        subTotal += Number(r.total || 0);
        sectionTotal += Number(r.total || 0);

        // ===== IMAGE FINAL (NO STRETCH + CENTER PERFECT) =====
if (r.image && r.image !== "") {
  try {
    const imageUrl = r.image.startsWith("http")
      ? r.image
      : `https://quotation-backend-9i3u.onrender.com${r.image}`;

    console.log("Excel Image URL:", imageUrl);

    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Image fetch failed");

    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();

    const ext = imageUrl.toLowerCase().includes(".jpg") ||
                imageUrl.toLowerCase().includes(".jpeg")
      ? "jpeg"
      : "png";

    const imageId = workbook.addImage({
      buffer,
      extension: ext
    });

    // ===== CELL SIZE =====
    const rowHeight = 80;
    const colWidth = 25;

    sheet.getRow(rowIndex).height = rowHeight;

    const cellWidthPx = colWidth * 7;
    const cellHeightPx = rowHeight;

    // ===== GET ORIGINAL IMAGE SIZE =====
    const img = await new Promise(resolve => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.src = URL.createObjectURL(blob);
    });

    // ===== SCALE (MAINTAIN RATIO) =====
    const scale = Math.min(
      cellWidthPx / img.width,
      cellHeightPx / img.height
    );

    const width = img.width * scale;
    const height = img.height * scale;

    // ===== CENTER =====
    const offsetX = (cellWidthPx - width) / 2;
    const offsetY = (cellHeightPx - height) / 2;

    sheet.addImage(imageId, {
      tl: {
        col: 9 + offsetX / cellWidthPx,
        row: rowIndex - 1 + offsetY / cellHeightPx
      },
      ext: { width, height }
    });

  } catch (err) {
    console.log("❌ Image error:", err);
  }
}
        rowIndex++;
      }

      // ===== SUBTOTAL =====
      const subTotalRow = sheet.addRow([ "", "", "", "", "", "", "", "Sub Total", subTotal ]);

      subTotalRow.font = { bold: true };
      subTotalRow.getCell(9).numFmt = "₹#,##0.00";

      rowIndex++;
    }

    // ===== SECTION TOTAL =====
    const secTotalRow = sheet.addRow([
  "", "", "", "", "", "", "", `${sec.name} Total`, sectionTotal
]);

    secTotalRow.font = { bold: true };
    secTotalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6F7FF" }
    };

    secTotalRow.getCell(9).numFmt = "₹#,##0.00";

    rowIndex += 2;
  }

  // ================= GRAND TOTAL =================
  const addTotal = (label, value, bold=false) => {
    const row = sheet.addRow(["","","","","","","",label,value]);
    row.getCell(8).font = { bold };
    row.getCell(9).font = { bold };
    row.getCell(9).numFmt = "₹#,##0.00";
  };

  addTotal("Grand Total", grandTotal, true);

  if (pf) addTotal("P&F", pf);

  if (gst) {
    const gstAmount = ((grandTotal + pf) * gst) / 100;
    addTotal(`GST (${gst}%)`, gstAmount);
  }

  addTotal("NET TOTAL", netTotal, true);

  // ================= SIGN =================
  rowIndex += 3;
  sheet.getCell(`H${rowIndex}`).value = "Authorized Signatory";

  // ================= EXPORT =================
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "Quotation.xlsx");
};

export default exportQuotationExcel;