import React, { useState } from "react";

import axios from "axios";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const Inventory = () => {

  const [productCode, setProductCode] = useState("");

  const [brand, setBrand] = useState("");

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);

  // ================= SEARCH =================
  const fetchProduct = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/excel-product",
        {
          params: {
            productCode,
            brand
          }
        }
      );

      setData(res.data);

    } catch (err) {

      console.error(err);

      alert("Product not found");

      setData(null);

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <PageHeader
        title="Inventory"
        subtitle="Search and manage product inventory"
      />

      {/* SEARCH CARD */}
      <Card className="mt-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* PRODUCT CODE */}
          <Input
            placeholder="Product Code"
            value={productCode}
            onChange={(e) =>
              setProductCode(e.target.value)
            }
          />

          {/* BRAND */}
          <Input
            placeholder="Brand"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value.toUpperCase())
            }
          />

          {/* BUTTON */}
          <Button
            onClick={fetchProduct}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Product"}
          </Button>

        </div>

      </Card>

      {/* RESULT */}
      {data && (

        <Card className="mt-8">

          <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT */}
            <div className="flex-1">

              <div className="text-sm text-slate-500">
                Product Code
              </div>

              <div className="text-3xl font-bold text-slate-800 mt-1">
                {data.CODE}
              </div>

              <div className="mt-6">

                <div className="text-sm text-slate-500">
                  Brand
                </div>

                <div className="text-xl font-semibold text-slate-700 mt-1">
                  {data.BRAND}
                </div>

              </div>

              <div className="mt-6">

                <div className="text-sm text-slate-500">
                  Description
                </div>

                <div className="text-lg text-slate-700 mt-1 leading-8">
                  {data.ITEM}
                </div>

              </div>

            </div>

            {/* RIGHT */}
            <div className="lg:w-[320px]">

              <div className="bg-slate-100 rounded-3xl p-6">

                {/* IMAGE */}
                <div className="mb-6">

                  <div className="text-sm text-slate-500 mb-3">
                    Product Image
                  </div>

                  {data.image ? (

                    <img
                      src={data.image}
                      alt="product"
                      className="
                        w-60
                        h-60
                        object-cover
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                      "
                    />

                  ) : (

                    <div
                      className="
                        h-64
                        rounded-2xl
                        border-2
                        border-dashed
                        border-slate-300
                        flex
                        items-center
                        justify-center
                        text-slate-400
                        bg-white
                      "
                    >
                      No Image
                    </div>

                  )}

                </div>

                {/* MRP */}
                <div className="mb-6">

                  <div className="text-sm text-slate-500">
                    MRP
                  </div>

                  <div className="text-4xl font-bold text-slate-900 mt-2">
                    ₹ {Number(data.RATE || 0).toLocaleString("en-IN")}
                  </div>

                </div>

                {/* GROUP */}
                <div>

                  <div className="text-sm text-slate-500">
                    Group
                  </div>

                  <div className="text-lg font-semibold text-slate-700 mt-2">
                    {data.GROUP || "-"}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </Card>

      )}

    </div>
  );
};

export default Inventory;