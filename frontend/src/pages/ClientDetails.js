import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import exportQuotationPDF from "../utils/exportPDF";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);

  // ================= LOAD =================
  const loadQuotations = async () => {
    try {
      const res = await axios.get(
        "https://quotation-backend-9i3u.onrender.com/api/client-quotations/" + id
      );
      setQuotations(res.data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    if (id) loadQuotations();
  }, [id]);

  // ================= COPY =================
  const copyQuotation = async (quotationId) => {
    try {
      await axios.post(
        "https://quotation-backend-9i3u.onrender.com/api/quotation-copy/" + quotationId
      );

      alert("Copied as new version!");
      loadQuotations();

    } catch (err) {
      console.error(err);
      alert("Copy failed");
    }
  };

  const viewQuotation = async (quotationId) => {
  try {

    const res = await axios.get(
      "https://quotation-backend-9i3u.onrender.com/api/quotation/" + quotationId
    );

    const q = res.data;

    // 🔥 Convert DB → PDF structure
    const grouped = {};

    (q.items || []).forEach(item => {

      // ✅ FIX NULL VALUES
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

      grouped[sectionName][subsectionName].push({

        productCode: item.productCode || "",

        brand: item.brand || "",

        description: item.description || "",

        qty: Number(item.qty || 1),

        discount: Number(item.discount || 0),

        discAmount: 0,

        rate: Number(item.netRate || 0),

        netRate: Number(item.netRate || 0),

        total: Number(item.total || 0),

        image: item.image || ""

      });

    });

    const sections = Object.keys(grouped).map(sec => ({
      name: sec,
      subsections: Object.keys(grouped[sec]).map(sub => ({
        name: sub,
        rows: grouped[sec][sub]
      }))
    }));

    exportQuotationPDF(
  sections,

  Number(q.total || 0),

  Number(q.pf || 0),

  Number(q.gst || 0),

  Number(q.total || 0),

  {
    name: "",
    address: ""
  },

  "quotation"
);

  } catch (err) {

    console.error(err);
    alert("Failed to open quotation");

  }
};

  // ================= UI =================
  return (
  <div className="p-6 bg-slate-50 min-h-screen">

    <div className="flex items-center justify-between mb-8">

      <PageHeader
        title="Client Quotations"
        subtitle="Manage all quotation versions"
      />

      <Button
        onClick={() =>
          navigate("/quotation/" + id)
        }
      >
        + New Quotation
      </Button>

    </div>

    {/* EMPTY STATE */}
    {quotations.length === 0 ? (

      <Card>

        <div className="text-center py-16">

          <h2 className="text-xl font-semibold text-slate-700">
            No Quotations Found
          </h2>

          <p className="text-slate-500 mt-2">
            Create your first quotation for this client.
          </p>

        </div>

      </Card>

    ) : (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {quotations.map((q) => (

          <Card key={q.id}>

            {/* TOP */}
            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm text-slate-500">
                  Version
                </div>

                <h2 className="text-2xl font-bold text-slate-800">

                  {(q.version || 1) === 1
                    ? "V1"
                    : `RV${(q.version || 1) - 1}`}

                </h2>

              </div>

              <div className="text-right">

                <div className="text-sm text-slate-500">
                  Amount
                </div>

                <div className="text-xl font-semibold text-slate-800">
                  ₹ {Number(q.total || 0).toLocaleString("en-IN")}
                </div>

              </div>

            </div>

            {/* DATE */}
            <div className="mt-6 text-sm text-slate-500">

              Created On:
              {" "}

              {q.createdAt
                ? new Date(q.createdAt).toLocaleDateString()
                : "-"}

            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3 mt-6">

              <Button
                variant="secondary"
                onClick={() => viewQuotation(q.id)}
              >
                View
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  navigate("/edit-quotation/" + q.id)
                }
              >
                Edit
              </Button>

              <Button
                variant="secondary"
                onClick={() => copyQuotation(q.id)}
              >
                Copy
              </Button>

              <Button
                variant="danger"
                onClick={async () => {

                  if (!window.confirm("Delete quotation?")) {
                    return;
                  }

                  try {

                    await axios.delete(
                      "https://quotation-backend-9i3u.onrender.com/api/quotation/" + q.id
                    );

                    loadQuotations();

                  } catch (err) {

                    console.error(err);
                    alert("Delete failed");

                  }

                }}
              >
                Delete
              </Button>

            </div>

          </Card>

        ))}

      </div>

    )}

  </div>
);
};

export default ClientDetails;