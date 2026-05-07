import React, { useEffect, useState } from "react";
import axios from "axios";


import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";


import exportQuotationExcel from "../utils/exportExcel";
import exportQuotationPDF from "../utils/exportPDF";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createDragManager } from "../utils/dragManager";

import { useParams } from "react-router-dom";

  const Quotations = () => {

  // ================= ROUTE PARAMS =================
  const { id, clientId: routeClientId } = useParams();

  // ================= EDIT MODE =================
  const isEditMode = !!id;

  // ================= STATES =================
  const [clients, setClients] = useState([]);

  const [clientId, setClientId] =
    useState(routeClientId || "");

  const [allProducts, setAllProducts] =
    useState([]);

  const [pdfFormat, setPdfFormat] =
    useState("quotation");

  const [pf, setPf] = useState("");

  const [gst, setGst] = useState("");

  const [clipboard, setClipboard] =
    useState(null);

  const [sections, setSections] = useState([
    {
      name: "",
      subsections: [
        {
          name: "",
          rows: [
            {
              productCode: "",
              brand: "",
              description: "",
              qty: 1,
              discount: 0,
              discAmount: 0,
              rate: 0,
              netRate: 0,
              total: 0,
              image: ""
            }
          ]
        }
      ]
    }
  ]);

  // ✅ AFTER sections is defined
const { updateSections, undo, redo, onDragEnd } =
  createDragManager(sections, setSections);

 useEffect(() => {
  const loadData = async () => {
    try {
      // ================= LOAD CLIENTS =================
      const clientsRes = await axios.get("https://quotation-backend-9i3u.onrender.com/api/clients");
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);

      // ================= LOAD PRODUCTS =================
      const productsRes = await axios.get("https://quotation-backend-9i3u.onrender.com/api/all-products");
      setAllProducts(Array.isArray(productsRes.data) ? productsRes.data : []);

      // ================= LOAD QUOTATION (EDIT MODE) =================
      if (id) {
        const res = await axios.get("https://quotation-backend-9i3u.onrender.com/api/quotation/" + id);
        const q = res.data;
        console.log("EDIT QUOTATION LOADED");
        console.log("FULL QUOTATION:", q);
        console.log("ITEMS:", q.items);
        setPf(String(q.pf || ""));
        setGst(String(q.gst || ""));

        setClientId(String(q.clientId));

        // 🔥 GROUP INTO YOUR UI STRUCTURE
const grouped = {};

q.items.forEach(item => {

  // ✅ FIX NULL SECTION
  const sectionName =
    item.section || "Main Section";

  const subsectionName =
    item.subsection || "General";

  if (!grouped[sectionName]) {
    grouped[sectionName] = {};
  }

  if (!grouped[sectionName][subsectionName]) {
    grouped[sectionName][subsectionName] = [];
  }

  // ================= FIX VALUES =================
  const netRate = Number(item.netRate || 0);

  const discount = Number(item.discount || 0);

  const rate =
    discount > 0
      ? netRate / (1 - discount / 100)
      : netRate;

  const discAmount = rate - netRate;

  grouped[sectionName][subsectionName].push({

    productCode: item.productCode || "",

    brand: item.brand || "",

    description: item.description || "",

    qty: Number(item.qty || 1),

    discount,

    discAmount,

    rate,

    netRate,

    total: Number(item.total || 0),

    image: item.image || ""

  });

});

        const newSections = Object.keys(grouped).map(secName => ({
          name: secName,
          subsections: Object.keys(grouped[secName]).map(subName => ({
            name: subName,
            rows: grouped[secName][subName]
          }))
        }));

        setSections(newSections);
      }

    } catch (err) {
      console.error("API ERROR:", err);
    }
  };

  loadData();
}, [id]);

  // ================= CALC =================
  const handleChange = (s, sub, r, field, value) => {
    const newSections = [...sections];
    const row = newSections[s].subsections[sub].rows[r];

    row[field] = value;

    const rate = Number(row.rate) || 0;
    const qty = Number(row.qty) || 0;
    const discount = Number(row.discount) || 0;

    row.discAmount = (rate * discount) / 100;
    row.netRate = rate - row.discAmount;
    row.total = row.netRate * qty;

    updateSections(newSections);
  
  };

  // ================= PRODUCT =================
  const findProduct = async (s, sub, r) => {
    const row = sections[s].subsections[sub].rows[r];

    const product = allProducts.find(
      item =>
        String(item.CODE).trim() === String(row.productCode).trim() &&
        String(item.BRAND).toLowerCase() === String(row.brand).toLowerCase()
    );

    if (product) {
      const newSections = [...sections];
      const target = newSections[s].subsections[sub].rows[r];

      target.description = product.ITEM;
      target.rate = Number(product.RATE) || 0;

      try {
        const res = await axios.get("https://quotation-backend-9i3u.onrender.com/api/get-image", {
          params: { productCode: row.productCode, brand: row.brand }
        });

        if (res.data?.image) target.image = res.data.image;
      } catch {
        console.log("Image fetch failed");
      }

      handleChange(s, sub, r, "rate", target.rate);
    }
  };

  // ================= ADD =================
  const addSection = () => {
    setSections([...sections, { name: "", subsections: [] }]);
  };

  const addSubsection = (s) => {
    const newSections = [...sections];
    newSections[s].subsections.push({ name: "", rows: [] });
    setSections(newSections);
  };

  const addRow = (s, sub) => {
    const newSections = [...sections];
    newSections[s].subsections[sub].rows.push({
      productCode: "",
      brand: "",
      description: "",
      qty: 1,
      discount: 0,
      discAmount: 0,
      rate: 0,
      netRate: 0,
      total: 0,
      image: ""
    });
    setSections(newSections);
  };

  // ================= COPY / PASTE =================
  const copySection = (s) => {
    setClipboard({ type: "section", data: JSON.parse(JSON.stringify(sections[s])) });
  };

  const pasteSection = () => {
    if (clipboard?.type === "section") {
      setSections([...sections, JSON.parse(JSON.stringify(clipboard.data))]);
    }
  };

  const deleteSection = (s) => {
    const newSections = [...sections];
    newSections.splice(s, 1);
    setSections(newSections);
  };

  const copySubsection = (s, sub) => {
    setClipboard({
      type: "subsection",
      data: JSON.parse(JSON.stringify(sections[s].subsections[sub]))
    });
  };

  const pasteSubsection = (s) => {
    if (clipboard?.type === "subsection") {
      const newSections = [...sections];
      newSections[s].subsections.push(JSON.parse(JSON.stringify(clipboard.data)));
      setSections(newSections);
    }
  };

  const deleteSubsection = (s, sub) => {
    const newSections = [...sections];
    newSections[s].subsections.splice(sub, 1);
    setSections(newSections);
  };

  const copyRow = (s, sub, r) => {
    setClipboard({
      type: "row",
      data: JSON.parse(JSON.stringify(sections[s].subsections[sub].rows[r]))
    });
  };

  const pasteRow = (s, sub) => {
    if (clipboard?.type === "row") {
      const newSections = [...sections];
      newSections[s].subsections[sub].rows.push(JSON.parse(JSON.stringify(clipboard.data)));
      setSections(newSections);
    }
  };

  const deleteRow = (s, sub, r) => {
    const newSections = [...sections];
    newSections[s].subsections[sub].rows.splice(r, 1);
    setSections(newSections);
  };

  // ================= IMAGE =================
  const uploadImage = async (file, s, sub, r) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("productCode", sections[s].subsections[sub].rows[r].productCode);
    formData.append("brand", sections[s].subsections[sub].rows[r].brand);

    const res = await axios.post("https://quotation-backend-9i3u.onrender.com/api/upload-image", formData);

    const newSections = [...sections];
    newSections[s].subsections[sub].rows[r].image = res.data.image;
    setSections(newSections);
  };

  const handlePaste = (e, s, sub, r) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.includes("image")) {
        uploadImage(item.getAsFile(), s, sub, r);
      }
    }
  };

  // ================= TOTAL =================
  const getSubTotal = (sub) =>
  (sub.rows || []).reduce(
    (sum, r) => sum + (Number(r.total) || 0),
    0
  );

  const getSectionTotal = (sec) =>
  (sec.subsections || []).reduce(
    (sum, s) => sum + getSubTotal(s),
    0
  );

  const grandTotal = sections.reduce(
    (sum, sec) => sum + getSectionTotal(sec),
    0
  );

  const pfAmount = Number(pf) || 0;
  const gstAmount = gst ? ((grandTotal + pfAmount) * Number(gst)) / 100 : 0;
  const netTotal = grandTotal + pfAmount + gstAmount;

  // ================= SAVE =================
const saveQuotation = async () => {

  const items = [];

  sections.forEach(sec => {

  (sec.subsections || []).forEach(sub => {

    (sub.rows || []).forEach(r => {

      // ✅ SKIP EMPTY ROWS
      if (!r.productCode && !r.description) {
        return;
      }

      items.push({
        productCode: r.productCode || "",
        brand: r.brand || "",
        description: r.description || "",
        qty: Number(r.qty || 1),
        discount: Number(r.discount || 0),
        netRate: Number(r.netRate || 0),
        total: Number(r.total || 0),
        image: r.image || "",
        section: sec.name || "Main Section",
        subsection: sub.name || "General"
      });

    });

  });

});

console.log("SAVING ITEMS:", items);

console.log("FULL PAYLOAD:", {
  clientId,
  items,
  total: netTotal,
  pf: pfAmount,
  gst
});

  try {

    // ================= EDIT MODE =================
    if (isEditMode) {

       // ================= CREATE REVISION =================
  await axios.post(
    "https://quotation-backend-9i3u.onrender.com/api/quotation-revision/" + id,
    {
      clientId,
      items,
      total: netTotal,
      pf: pfAmount,
      gst
    }
  );

  alert("Revision Saved Successfully");

}

    // ================= NEW MODE =================
    else {

      await axios.post(
        "https://quotation-backend-9i3u.onrender.com/api/quotations",
        {
          clientId,
          items,
          total: netTotal,
          pf: pfAmount,
          gst
        }
      );

      alert("Quotation Saved Successfully");
    }

  } catch (err) {

    console.error(err);
    alert("Save failed");

  }
};

  // ================= UI =================
return (
  <DragDropContext onDragEnd={onDragEnd}>
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Quotation Builder
          </h1>

          <p className="text-slate-500 mt-1">
            Create premium luxury quotations
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <Select
            value={pdfFormat}
            onChange={(e) => setPdfFormat(e.target.value)}
          >
            <option value="quotation">Quotation</option>
            <option value="quotation_code">Quotation + Code</option>
            <option value="mrp">MRP</option>
            <option value="mrp_code">MRP + Code</option>
            <option value="pi">Proforma Invoice</option>
            <option value="pi_code">PI + Code</option>
            <option value="plumbing">Plumbing Layout</option>
          </Select>

          <Select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select Client</option>

            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Button onClick={addSection}>
            + Add Section
          </Button>

          <Button
            variant="secondary"
            onClick={pasteSection}
          >
            Paste Section
          </Button>

        </div>
      </div>

      {/* ================= SECTION DRAG ================= */}
      <Droppable droppableId="sections" type="SECTION">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >

            {sections.map((section, sIndex) => (
              <Draggable
                key={sIndex}
                draggableId={`section-${sIndex}`}
                index={sIndex}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-6"
                  >

                    {/* SECTION HEADER */}
                    <div className="flex items-center justify-between mb-5">

                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab text-slate-400 text-sm"
                      >
                        ⠿ Drag Section
                      </div>

                      <div className="flex gap-2">

                        <Button
                          variant="secondary"
                          onClick={() => copySection(sIndex)}
                        >
                          Copy
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => deleteSection(sIndex)}
                        >
                          Delete
                        </Button>

                      </div>
                    </div>

                    {/* SECTION NAME */}
                    <Input
                      placeholder="Section Name"
                      value={section.name}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sIndex].name = e.target.value;
                        setSections(newSections);
                      }}
                    />

                    {/* SUBSECTION BUTTONS */}
                    <div className="flex gap-2 mt-4">

                      <Button onClick={() => addSubsection(sIndex)}>
                        + Add Area
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => pasteSubsection(sIndex)}
                      >
                        Paste Area
                      </Button>

                    </div>

                    {/* SUBSECTION DRAG */}
                    <Droppable
                      droppableId={`sub-${sIndex}`}
                      type="SUBSECTION"
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >

                          {section.subsections.map((sub, subIndex) => (

                            <Draggable
                              key={subIndex}
                              draggableId={`sub-${sIndex}-${subIndex}`}
                              index={subIndex}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border border-slate-200 rounded-2xl p-5 mt-5 bg-slate-50"
                                >

                                  {/* SUBSECTION HEADER */}
                                  <div className="flex items-center justify-between mb-4">

                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab text-slate-400 text-sm"
                                    >
                                      ↕ Drag Area
                                    </div>

                                    <div className="flex gap-2">

                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          copySubsection(sIndex, subIndex)
                                        }
                                      >
                                        Copy
                                      </Button>

                                      <Button
                                        variant="danger"
                                        onClick={() =>
                                          deleteSubsection(sIndex, subIndex)
                                        }
                                      >
                                        Delete
                                      </Button>

                                    </div>
                                  </div>

                                  {/* AREA NAME */}
                                  <Input
                                    placeholder="Area Name"
                                    value={sub.name}
                                    onChange={(e) => {
                                      const newSections = [...sections];
                                      newSections[sIndex]
                                        .subsections[subIndex]
                                        .name = e.target.value;

                                      setSections(newSections);
                                    }}
                                  />

                                  {/* TABLE */}
                                  <div className="overflow-x-auto mt-5">

                                    <table className="min-w-[1600px] border-separate border-spacing-0">

                                      <thead className="bg-slate-900 text-white">

<tr>

  <th className="p-3 w-10"></th>

  <th className="p-3 text-left min-w-[160px]">
    Code
  </th>

  <th className="p-3 text-left min-w-[80px]">
    Brand
  </th>

  <th className="p-3 text-left min-w-[420px]">
    Description
  </th>

  <th className="p-3 text-left min-w-[100px]">
    Qty
  </th>

  <th className="p-3 text-left min-w-[100px]">
    Disc%
  </th>

  <th className="p-3 text-left min-w-[140px]">
    Disc Amt
  </th>

  <th className="p-3 text-left min-w-[120px]">
    Rate
  </th>

  <th className="p-3 text-left min-w-[140px]">
    Total
  </th>

  <th className="p-3 text-left min-w-[220px]">
    Image
  </th>

  <th className="p-3 min-w-[140px]"></th>

</tr>

</thead>

                                       <Droppable
                                        droppableId={`${sIndex}-${subIndex}`}
                                        type="ROW"
                                      >
                                        {(provided) => (
                                          <tbody
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                          >

                                            {(sub.rows || []).map((row, rIndex) => (

                                              <Draggable
                                                key={rIndex}
                                                draggableId={`row-${sIndex}-${subIndex}-${rIndex}`}
                                                index={rIndex}
                                              >
                                                {(provided) => (

                                                  <tr
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-white border-b border-slate-100"
                                                  >

                                                    <td
                                                      {...provided.dragHandleProps}
                                                      className="p-3 cursor-grab"
                                                    >
                                                      ↕
                                                    </td>

                                                    <td className="p-3">
                                                      <Input
                                                        className="w-[140px]"
                                                        value={row.productCode}
                                                        onBlur={() =>
                                                          findProduct(sIndex, subIndex, rIndex)
                                                        }
                                                        onChange={(e) => {

  handleChange(
    sIndex,
    subIndex,
    rIndex,
    "productCode",
    e.target.value
  );

  setTimeout(() => {
    findProduct(sIndex, subIndex, rIndex);
  }, 100);

}}
                                                      />
                                                    </td>

                                                    <td className="p-3">
                                                      <Input
                                                      className="w-[70px] uppercase"

  value={row.brand}

  onBlur={() =>
    findProduct(sIndex, subIndex, rIndex)
  }

  onChange={(e) => {

    handleChange(
      sIndex,
      subIndex,
      rIndex,
      "brand",
      e.target.value.toUpperCase()
    );

    setTimeout(() => {
      findProduct(sIndex, subIndex, rIndex);
    }, 100);

  }}
/>
                                                    </td>

                                                    <td className="p-4">

  <div className="text-sm leading-6 text-slate-700 break-words min-w-[280px]">

    {row.description}

  </div>

</td>

                                                    <td className="p-3">
                                                      <Input
                                                        type="number"
                                                        value={row.qty}
                                                        onChange={(e) =>
                                                          handleChange(
                                                            sIndex,
                                                            subIndex,
                                                            rIndex,
                                                            "qty",
                                                            e.target.value
                                                          )
                                                        }
                                                      />
                                                    </td>

                                                    <td className="p-3">
                                                      <Input
                                                        type="number"
                                                        value={row.discount}
                                                        onChange={(e) =>
                                                          handleChange(
                                                            sIndex,
                                                            subIndex,
                                                            rIndex,
                                                            "discount",
                                                            e.target.value
                                                          )
                                                        }
                                                      />
                                                    </td>

                                                    <td className="p-3 text-sm">
                                                      {row.discAmount.toFixed(2)}
                                                    </td>

                                                    <td className="p-3 text-sm">
                                                      {row.rate}
                                                    </td>

                                                    <td className="p-3 font-semibold">
                                                      {row.total}
                                                    </td>

                                                    <td
  className="p-3 align-top"
  onPaste={(e) =>
    handlePaste(e, sIndex, subIndex, rIndex)
  }
>

  <div className="flex flex-col gap-2 w-[140px]">

    {/* FILE INPUT */}
    <input
      type="file"
      className="text-xs"

      onChange={(e) =>
        uploadImage(
          e.target.files[0],
          sIndex,
          subIndex,
          rIndex
        )
      }
    />

   {/* IMAGE PREVIEW */}
{row.image ? (

  <img
    src={`https://quotation-backend-9i3u.onrender.com${row.image}`}
    alt=""

    onError={(e) => {
      e.target.style.display = "none";
    }}

    className="
      w-20
      h-20
      object-cover
      rounded-xl
      border
      border-slate-200
      shadow-sm
      bg-white
    "
  />

) : (

  <div
    className="
      w-20
      h-20
      rounded-xl
      border
      border-dashed
      border-slate-300
      flex
      items-center
      justify-center
      text-xs
      text-slate-400
      bg-slate-50
    "
  >
    No Image
  </div>

)}

  </div>

</td>

                                                    <td className="p-4 align-top">

  <div className="flex flex-col gap-2 min-w-[120px]">

                                                        <Button
  className="w-full"
  variant="secondary"
  onClick={() =>
    copyRow(
      sIndex,
      subIndex,
      rIndex
    )
  }
>
  Copy
</Button>

<Button
  className="w-full"
  variant="secondary"
  onClick={() =>
    pasteRow(sIndex, subIndex)
  }
>
  Paste
</Button>

<Button
  className="w-full"
  variant="danger"
  onClick={() =>
    deleteRow(
      sIndex,
      subIndex,
      rIndex
    )
  }
>
  Delete
</Button>

                                                      </div>

                                                    </td>

                                                  </tr>
                                                )}
                                              </Draggable>
                                            ))}

                                            {provided.placeholder}

                                          </tbody>
                                        )}
                                      </Droppable>

                                    </table>

                                  </div>

                                  {/* SUB TOTAL */}
                                  <div className="flex justify-between items-center mt-5">

                                    <Button
                                      onClick={() => addRow(sIndex, subIndex)}
                                    >
                                      + Add Item
                                    </Button>

                                    <div className="text-lg font-semibold">
                                      Total: {getSubTotal(sub)}
                                    </div>

                                  </div>

                                </div>
                              )}
                            </Draggable>
                          ))}

                          {provided.placeholder}

                        </div>
                      )}
                    </Droppable>

                    {/* SECTION TOTAL */}
                    <div className="mt-5 text-right text-xl font-bold text-slate-900">
                      Section Total: {getSectionTotal(section)}
                    </div>

                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

          </div>
        )}
      </Droppable>

      {/* ================= FOOTER ================= */}
      <div className="sticky bottom-4 mt-10">

        <div className="bg-white border border-slate-200 shadow-lg rounded-3xl p-6 flex items-center justify-between">

          <div className="flex gap-4">

            <Input
              placeholder="P&F"
              value={pf}
              onChange={(e) => setPf(e.target.value)}
            />

            <Input
              placeholder="GST %"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
            />

          </div>

          <div className="text-right">

            <div className="text-sm text-slate-500">
              NET TOTAL
            </div>

            <div className="text-4xl font-bold text-slate-900">
              ₹ {netTotal.toLocaleString("en-IN")}
            </div>

          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 mt-5 flex-wrap">

          <Button onClick={saveQuotation}>
            Save
          </Button>

          <Button variant="secondary" onClick={undo}>
            Undo
          </Button>

          <Button variant="secondary" onClick={redo}>
            Redo
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              exportQuotationExcel(
                sections,
                grandTotal,
                pfAmount,
                gst,
                netTotal,
                {
                  name:
                    clients.find(c => c.id === clientId)?.name || "",
                  address:
                    clients.find(c => c.id === clientId)?.address || ""
                }
              )
            }
          >
            Export Excel
          </Button>

          <Button
            onClick={() =>
              exportQuotationPDF(
                sections,
                grandTotal,
                pfAmount,
                gst,
                netTotal,
                {
                  name:
                    clients.find(c => c.id == clientId)?.name || "",
                  address:
                    clients.find(c => c.id == clientId)?.address || ""
                },
                pdfFormat
              )
            }
          >
            Export PDF
          </Button>

        </div>

      </div>

    </div>
  </DragDropContext>
);
};
export default Quotations;