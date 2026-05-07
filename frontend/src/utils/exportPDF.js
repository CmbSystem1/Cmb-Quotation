// ================= IMPORTS =================
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

import heroImagePath from "../assets/hero.jpg";
import logoPath from "../assets/logo.png";

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.vfs || pdfFonts?.vfs;

// ================= HELPERS =================
const getBase64FromUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const moneyText = (n) =>
  `${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

const money = (n, extra = {}) => ({
  text: moneyText(n),
  noWrap: true,
  alignment: "right",
  ...extra,
});

const getTitle = (format) => {
  if (format === "pi" || format === "pi_code") return "PROFORMA INVOICE";
  if (format === "plumbing") return "PLUMBING LAYOUT";
  return "QUOTATION";
};

const formatDate = (date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};


// ================= MAIN FUNCTION =================
export const exportQuotationPDF = async (
  sections,
  grandTotal,
  pf,
  gst,
  netTotal,
  client,
  format = "quotation"
) => {

  const heroImage = await getBase64FromUrl(heroImagePath);
  const logo = await getBase64FromUrl(logoPath);

  const title = getTitle(format);
  const content = [];

  // ================= HERO PAGE =================
  const today = new Date();
const validityDate = new Date();
validityDate.setDate(today.getDate() + 10);

const formatDate = (d) =>
  d.toLocaleDateString("en-GB"); // DD/MM/YYYY

content.push({
  stack: [

    // ===== TOP BRAND BLOCK =====
    {
      stack: [
        {
          image: logo,
          width: 70,
          alignment: "center"
        },
        {
          text: "CHABILDAS MANIKDAS & BROS",
          alignment: "center",
          bold: true,
          fontSize: 13,
          margin: [0, 6, 0, 0]
        },
        {
          stack: [
            {
              text: "Curators of Luxury Bath Fittings",
              alignment: "center",
              fontSize: 9,
              lineHeight: 1.1
            },
            {
              text: "Since 1948",
              alignment: "center",
              fontSize: 8,
              color: "#6b7280",
              margin: [0, 1, 0, 0]
            }
          ]
        }
      ],
      margin: [0, 20, 0, 20]
    },

    // ===== TITLE =====
    {
      text: title,
      alignment: "center",
      fontSize: 15,
      letterSpacing: 1,
      margin: [0, 0, 0, 15]
    },

    // ===== MAIN GRID =====
    {
      columns: [

        // ===== LEFT IMAGE =====
        {
          width: "58%",
          stack: [
            {
              image: heroImage,
              fit: [300, 520],
              alignment: "center",
              margin: [0, 20, 0, 0]
            }
          ]
        },

        // ===== RIGHT DETAILS =====
        {
          width: "42%",
          stack: [

            {
              stack: [

                // QUOTE INFO
                {
                  columns: [
                    { text: "Quote No.", bold: true },
                    { text: `Q-${Date.now()}`, alignment: "right" }
                  ]
                },
                {
                  columns: [
                    { text: "Date", bold: true },
                    { text: formatDate(today), alignment: "right" }
                  ]
                },
                {
                  columns: [
                    { text: "Validity", bold: true },
                    { text: formatDate(validityDate), alignment: "right" }
                  ]
                },

                { text: "", margin: [0, 10] },

                // CLIENT
                {
                  columns: [
                    { text: "Client", bold: true },
                    { text: client?.name || "", alignment: "right" }
                  ]
                },
                {
                  columns: [
                    { text: "Phone", bold: true },
                    { text: client?.phone || "-", alignment: "right" }
                  ]
                },
                {
                  columns: [
                    { text: "GST", bold: true },
                    { text: client?.gst || "-", alignment: "right" }
                  ]
                },
                {
                  columns: [
                    { text: "Address", bold: true },
                    {
                      text: client?.address || "",
                      alignment: "right"
                    }
                  ]
                },

                { text: "", margin: [0, 15] },

                // FIRM INFO
                {
                  text: "Instagram",
                  bold: true
                },
                {
                  text: "@CHABILDAS_MANIKDAS",
                  margin: [0, 0, 0, 8]
                },

                {
                  text: "Location",
                  bold: true
                },
                {
                  text:
                    "Rd No.10 & 11, Kakateya Hills,\nBackside of Ratnadeep Supermarket,\nPlot No. 52, Hyderabad - 500081",
                  fontSize: 8
                }

              ],
              margin: [0, 80, 0, 0] // 👈 THIS CENTERS RIGHT BLOCK VERTICALLY
            }

          ]
        }

      ]
    }

  ],
  pageBreak: "after"
});

  // ================= DATA =================
const showCode = format.includes("code");
const showDiscount = format.includes("quotation");
const showImage = format !== "pi" && format !== "pi_code";

const TABLE_WIDTH = 540;

// ✅ BALANCED DYNAMIC WIDTHS
const tableWidths = [

  "auto", // S.No

  ...(showCode ? ["auto"] : []), // ✅ CODE ONLY WHEN NEEDED

  "*", // Description

  "auto", // Qty

  "auto", // MRP

  ...(showDiscount ? ["auto"] : []),

  "auto", // Net

  "auto", // Total

  ...(showImage ? [65] : []) // ✅ IMAGE ONLY WHEN NEEDED
];

for (const sec of sections || []) {
  let sectionTotal = 0;

  // ===== SECTION TITLE =====
  content.push({
  stack: [
    {
      text: sec.name || "SECTION",
      fontSize: 13,
      bold: true,
      color: "#0f172a",
      margin: [0, 0, 0, 0]
    },
    {
      canvas: [{
        type: "line",
        x1: 0,
        y1: 0,
        x2: 160,
        y2: 0,
        lineWidth: 1,
        color: "#0f2e63"
      }],
      margin: [0, 2, 0, 2]
    }
  ],

  // 🔥 REMOVE GAP
  margin: [0, 2, 0, 0]
});

  for (const sub of sec.subsections || []) {

    // ===== SUBSECTION (PREMIUM CLEAN) =====
    content.push({
  stack: [
    {
      text: sub.name || "",
      fontSize: 10,
      bold: true,
      color: "#1f2937",
      margin: [0, 0, 0, 0]
    },
    {
      canvas: [{
        type: "line",
        x1: 0,
        y1: 0,
        x2: 90,
        y2: 0,
        lineWidth: 0.5,
        color: "#9ca3af"
      }],
      margin: [0, 1, 0, 1]
    }
  ],

  // 🔥 NO EXTRA SPACE
  margin: [0, 0, 0, 0]
});

    const body = [];

   // ===== HEADER =====
body.push([
  {
    text: "S.No",
    style: "th",
    alignment: "center",
    noWrap: true
  },

  ...(showCode
    ? [{
        text: "CODE",
        style: "th",
        alignment: "center",
        noWrap: true
      }]
    : []),

  {
    text: "DESCRIPTION",
    style: "th",
    noWrap: true
  },

  {
    text: "QTY",
    style: "th",
    alignment: "center",
    noWrap: true
  },

  {
    text: "MRP",
    style: "th",
    alignment: "right",
    noWrap: true
  },

  ...(showDiscount
    ? [{
        text: "DISC",
        style: "th",
        alignment: "right",
        noWrap: true
      }]
    : []),

  {
    text: "NET",
    style: "th",
    alignment: "right",
    noWrap: true
  },

  {
    text: "TOTAL",
    style: "th",
    alignment: "right",
    noWrap: true
  },

  ...(showImage
    ? [{
        text: "IMAGE",
        style: "th",
        alignment: "center",
        noWrap: true
      }]
    : [])
]);

let subTotal = 0;

// ===== ROWS =====
for (let i = 0; i < (sub.rows || []).length; i++) {

  const r = sub.rows[i];

  subTotal += Number(r.total || 0);
  sectionTotal += Number(r.total || 0);

  const row = [

    // SNO
    {
      text: String(i + 1),
      alignment: "center",
      fontSize: 9
    },

    // CODE
    ...(showCode
      ? [{
          text: r.productCode || "-",
          alignment: "center",
          noWrap: true,
          fontSize: 9
        }]
      : []),

    // DESCRIPTION
    {
      text: r.description || "",
      fontSize: 9,
      lineHeight: 1,
      noWrap: false
    },

    // QTY
    {
      text: String(Number(r.qty || 0)),
      alignment: "center",
      fontSize: 9
    },

    // MRP
    {
      text: moneyText(r.rate),
      alignment: "right",
      noWrap: true,
      fontSize: 9
    },

    // DISC
    ...(showDiscount
      ? [{
          text: moneyText(r.discAmount),
          alignment: "right",
          noWrap: true,
          fontSize: 9
        }]
      : []),

    // NET
    {
      text: moneyText(r.netRate),
      alignment: "right",
      noWrap: true,
      fontSize: 9
    },

    // TOTAL
    {
      text: moneyText(r.total),
      alignment: "right",
      noWrap: true,
      fontSize: 9
    }
  ];

  // ===== IMAGE =====
  if (showImage) {

    if (r.image) {

      try {

        const url = r.image.startsWith("http")
          ? r.image
          : `https://quotation-backend-9i3u.onrender.com${r.image}`;

        const base64 = await getBase64FromUrl(url);

        row.push({
          image: base64,
          fit: [38, 38],
          alignment: "center"
        });

      } catch {

        row.push("");

      }

    } else {

      row.push("");

    }
  }

  body.push(row);
}

// ===== TABLE =====
content.push({
  table: {
    headerRows: 1,
    widths: tableWidths,
    body
  },

  layout: {

    fillColor: (rowIndex) =>
      rowIndex === 0
        ? "#1e3a5f"
        : rowIndex % 2 === 0
        ? "#f8fafc"
        : null,

    hLineWidth: (i) => (i === 0 ? 0 : 0.3),

    vLineWidth: () => 0,

    hLineColor: () => "#e5e7eb",

    // 🔥 SLIM CLEAN TABLE
    paddingLeft: (i) => {

      // description column
      if (
        (showCode && i === 2) ||
        (!showCode && i === 1)
      ) {
        return 4;
      }

      return 2;
    },

    paddingRight: () => 10,

    // 🔥 SLIM HEADER & ROWS
    paddingTop: () => 4,
    paddingBottom: () => 4
  },

  dontBreakRows: true,

  margin: [0, 0, 0, 6]
,
  dontBreakRows: true
});

    // ===== SUBTOTAL (FIXED) =====
    content.push({
  columns: [
    {
      width: "*",
      text: ""
    },

    {
      width: "auto",

      columns: [

        // LABEL
        {
          width: "auto",

          text: "Total",

          bold: true,

          fontSize: 9,// ⭐ FONT SIZE

          alignment: "center",

          margin: [0, 0, 25, 0] // ⭐ MOVE LABEL
          // [LEFT, TOP, RIGHT, BOTTOM]
        },

        // AMOUNT
        {
          width: 90,

          text: moneyText(subTotal),

          bold: true,

          fontSize: 9,// ⭐ FONT SIZE

          alignment: "center",

          margin: [-100,0,0,0] //MOVE AMOUNT
        }

      ]
    }
  ],

  margin: [0, 4, 0, 2] // ⭐ BLOCK SPACING
    });
  }

  // ===== SECTION TOTAL =====
  content.push({
  columns: [
    {
      width: "*",
      text: ""
    },

    {
      width: "auto",

      columns: [

        // LABEL
        {
          width: "auto",

          text: `${String(sec.name || "SECTION").toUpperCase()} TOTAL`,

          bold: true,

          fontSize: 9, // ⭐ FONT SIZE

          alignment: "center",

          margin: [0, 0, 25, 0] // ⭐ MOVE LABEL
        },

        // AMOUNT
        {
          width: 90,

          text: moneyText(sectionTotal),

          bold: true,

          fontSize: 9, // ⭐ FONT SIZE

          alignment: "center",

          margin: [-100,0,0,0] // VE AMOUNT
        }

      ]
    }
  ],

  margin: [0, 0, 0, 12] // ⭐ BLOCK SPACING
  });
}
  

  // ================= SUMMARY =================
let summaryBody = [
  [
    { text: "Section", bold: true },
    { text: "MRP", bold: true, alignment: "right" },
    { text: "Discount", bold: true, alignment: "right" },
    { text: "Total", bold: true, alignment: "right" }
  ]
];

sections.forEach(sec => {

  let mrp = 0;
  let disc = 0;
  let total = 0;

  sec.subsections.forEach(sub => {

    sub.rows.forEach(r => {

      mrp += Number(r.rate || 0) * Number(r.qty || 0);

      disc += Number(r.discAmount || 0) * Number(r.qty || 0);

      total += Number(r.total || 0);

    });

  });

  summaryBody.push([

    {
      text: sec.name || ""
    },

    {
      text: moneyText(mrp),
      alignment: "right"
    },

    {
      text: moneyText(disc),
      alignment: "right"
    },

    {
      text: moneyText(total),
      alignment: "right"
    }

  ]);

});

// ===== SUMMARY TITLE =====
content.push({
  text: "SUMMARY",
  bold: true,
  fontSize: 13,
  alignment: "center",
  margin: [0, 0, 0, 6]
});

// ================= GST =================
const gstAmount =
  Number(gst) > 0
    ? Math.round(((grandTotal + pf) * Number(gst)) / 100)
    : 0;

// ===== SUMMARY + TOTALS =====
content.push({

  table: {

    widths: ["*", "auto", "auto", "auto"],

    body: [

      // ===== HEADER =====
      [
        {
          text: "Section",
          bold: true
        },

        {
          text: "MRP",
          bold: true,
          alignment: "right"
        },

        {
          text: "Discount",
          bold: true,
          alignment: "right"
        },

        {
          text: "Total",
          bold: true,
          alignment: "right"
        }
      ],

      // ===== SECTION ROWS =====
      ...sections.map(sec => {

        let mrp = 0;
        let disc = 0;
        let total = 0;

        sec.subsections.forEach(sub => {

          sub.rows.forEach(r => {

            mrp += Number(r.rate || 0) * Number(r.qty || 0);

            disc += Number(r.discAmount || 0) * Number(r.qty || 0);

            total += Number(r.total || 0);

          });

        });

        return [

          {
            text: sec.name || "",
            fontSize: 10
          },

          {
            text: moneyText(mrp),
            alignment: "right",
            fontSize: 10
          },

          {
            text: moneyText(disc),
            alignment: "right",
            fontSize: 10
          },

          {
            text: moneyText(total),
            alignment: "right",
            fontSize: 10
          }

        ];

      }),

      // ===== TOTALS BLOCK =====
      [
        "",
        "",
        "",
        {
          table: {

            widths: [95, 75],

            body: [

              // ===== LINE =====
              [
                {
                  colSpan: 2,

                  canvas: [{
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 170,
                    y2: 0,
                    lineWidth: 0.5,
                    color: "#d1d5db"
                  }],

                  margin: [0, 0, 0, 5]
                },

                ""
              ],

              // ===== GRAND TOTAL =====
              [
                {
                  text: "Grand Total",
                  alignment: "right",
                  fontSize: 9,
                  color: "#444"
                },

                {
                  text: moneyText(grandTotal),
                  alignment: "right",
                  fontSize: 9
                }
              ],

              // ===== PF =====
              ...(pf ? [[

                {
                  text: "P&F",
                  alignment: "right",
                  fontSize: 9,
                  color: "#444"
                },

                {
                  text: moneyText(pf),
                  alignment: "right",
                  fontSize: 9
                }

              ]] : []),

              // ===== GST =====
              ...(Number(gst) > 0 ? [[

                {
                  text: `GST (${gst}%)`,
                  alignment: "right",
                  fontSize: 9,
                  color: "#444"
                },

                {
                  text: moneyText(gstAmount),
                  alignment: "right",
                  fontSize: 9
                }

              ]] : []),

              // ===== NET TOTAL =====
              [
                {
                  text: "NET TOTAL",
                  bold: true,
                  alignment: "right",
                  fontSize: 11,
                  margin: [0, 4, 0, 0]
                },

                {
                  text: moneyText(netTotal),
                  bold: true,
                  alignment: "right",
                  fontSize: 11,
                  margin: [0, 4, 0, 0]
                }
              ]

            ]
          },

          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,

            paddingTop: () => 2,
            paddingBottom: () => 2,

            paddingLeft: () => 0,
            paddingRight: () => 0
          },

          margin: [0, 0, 0, 0]
        }
      ]

    ]
  },

  layout: {

    // ===== TOP + HEADER LINE =====
    hLineWidth: (i) => {

      // top border
      if (i === 0) return 1;

      // line below header
      if (i === 1) return 1;

      return 0;
    },

    vLineWidth: () => 0,

    hLineColor: () => "#222",

    paddingTop: (i) => {

      // totals area tighter
      if (i >= sections.length + 2) return 1;

      return 6;
    },

    paddingBottom: (i) => {

      // totals area tighter
      if (i >= sections.length + 2) return 1;

      return 6;
    },

    paddingLeft: () => 25,
    paddingRight: () => 25
  },

  margin: [0, 6, 0, 15]
});
  // ================= TERMS =================
content.push({
  columns: [

    // ===== TERMS =====
    {
      width: "52%",

      stack: [

        {
          text: "TERMS & CONDITIONS",
          bold: true,
          fontSize: 11,
          margin: [0, 0, 0, 6]
        },

        {
          ul: [
            "Payment 100% Advance To Place The Order.",
            "Delivery Time For General Items 1 -2 Weeks & For Special Items 8 - 10 Weeks.",
            "Orders Once Placed Cannot Be Canceled Or Altered.",
            "Prices Are Ex-Godown & Transportation Will Charged Extra.",
            "Goods Once Sold Will Not Be Taken Back Under Any Circumstances.",
            "Interest At 25% Will Be Charged On Due Bills.",
            "The Above Mentioned Cost Is Valid For The Event Dates As Mentioned Above.",
            "All Disputes Subject To Hyderabad Jurisdiction.",
            "Product Warranty As Per Particular Company Terms & Conditions.",
            "Product Photos Are Indicative Only.",
            "Prices Subject To Change Without Prior Notice.",
            "Products Selected Are Subject To Availability At Time Of Placing Final Order."
          ],

          fontSize: 8,

          lineHeight: 1.15
        }

      ]
    },

    // ===== BANK =====
    {
      width: "48%",

      stack: [

        {
          text: "BANK DETAILS",
          bold: true,
          fontSize: 11,
          margin: [0, 0, 0, 6]
        },

        {
          table: {

            widths: [50, "*"],

            body: [

              ["Name", "CHABILDAS MANIKDAS & BROS"],

              ["Bank", "HDFC BANK"],

              ["A/C", "19977630000218"],

              ["IFSC", "HDFC0001997"]

            ]
          },

          layout: {

            hLineColor: () => "#cfcfcf",

            vLineColor: () => "#cfcfcf",

            hLineWidth: () => 0.6,

            vLineWidth: () => 0.6,

            paddingTop: () => 5,

            paddingBottom: () => 5,

            paddingLeft: () => 8,

            paddingRight: () => 8
          }
        }

      ]
    }

  ],

  margin: [0, 10, 0, 0]
});

// ================= THANK YOU =================
content.push({

  text: "Thank you for your business!",

  alignment: "center",

  bold: true,

  fontSize: 11,

  color: "#374151",

  margin: [0, 12, 0, 0],
    bold: true
  });

  // ================= EXPORT =================
  pdfMake.createPdf({
  content,
  pageMargins: [30, 40, 30, 50],

  styles: {
  th: {
    bold: true,
    color: "white",
    fontSize: 7.5,
    margin: [0, 0, 0, 0]
  }
}

}).download(`${title}.pdf`);
  
};
export default exportQuotationPDF;