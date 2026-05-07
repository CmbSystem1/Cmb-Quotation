import React, { useEffect, useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

const Dashboard = () => {

  const [quotations, setQuotations] = useState([]);

  const navigate = useNavigate();

  // ================= LOAD =================
  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const res = await axios.get(
          "https://quotation-backend-9i3u.onrender.com/api/all-quotations"
        );

        setQuotations(res.data || []);

      } catch (err) {

        console.error(err);

      }

    };

    loadDashboard();

  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back to your quotation system"
      />

      {/* QUICK ACTIONS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

  {/* ADD CLIENT */}
  <div
    onClick={() => navigate("/clients")}
    className="cursor-pointer"
  >

    <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">
            Add Client
          </h2>

          <p className="text-slate-500 mt-2">
            Create and manage customer profiles
          </p>

        </div>

        <div className="text-5xl">
          👤
        </div>

      </div>

    </Card>

  </div>

  {/* NEW QUOTATION */}
  <div
    onClick={() => navigate("/quotations")}
    className="cursor-pointer"
  >

    <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">
            New Quotation
          </h2>

          <p className="text-slate-500 mt-2">
            Build premium luxury quotations
          </p>

        </div>

        <div className="text-5xl">
          📄
        </div>

      </div>

    </Card>

  </div>

</div>

      {/* LATEST QUOTATIONS */}
      <div className="mt-10">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Latest Quotations
          </h2>

        </div>

        {quotations.length === 0 ? (

          <Card>

            <div className="py-16 text-center">

              <h2 className="text-xl font-semibold text-slate-700">
                No Quotations Yet
              </h2>

              <p className="text-slate-500 mt-2">
                Create your first quotation to get started.
              </p>

            </div>

          </Card>

        ) : (

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {quotations
              .slice()
              .reverse()
              .slice(0, 6)
              .map((q) => (

                <Card key={q.id}>

                  <div className="flex items-start justify-between">

                    {/* LEFT */}
                    <div>

                      <div className="text-sm text-slate-500">
                        Quotation ID
                      </div>

                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        #{q.id}
                      </div>

                      <div className="mt-4">

                        <div className="text-sm text-slate-500">
                          Client
                        </div>

                        <div className="font-semibold text-slate-700 mt-1">
                          {q.clientName || "Unknown Client"}
                        </div>

                      </div>

                    </div>

                    {/* RIGHT */}
                    <div className="text-right">

                      <div className="text-sm text-slate-500">
                        Amount
                      </div>

                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        ₹ {Number(q.total || 0).toLocaleString("en-IN")}
                      </div>

                      <div className="text-sm text-slate-400 mt-4">

                        {q.createdAt
                          ? new Date(q.createdAt).toLocaleDateString()
                          : "-"}

                      </div>

                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3 mt-6">

                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate("/edit-quotation/" + q.id)
                      }
                    >
                      Open
                    </Button>

                    <Button
                      onClick={() =>
                        navigate("/client/" + q.clientId)
                      }
                    >
                      Client
                    </Button>

                  </div>

                </Card>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default Dashboard;