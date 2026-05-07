import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    gst: ""
  });

  const fetchClients = async () => {
    const res = await axios.get("http://localhost:5000/api/clients");
    setClients(res.data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= ADD =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/clients", form);

      setForm({ name: "", phone: "", address: "", gst: "" });
      fetchClients();

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // ================= EDIT =================
  const startEdit = (c) => {
    setEditId(c.id);
    setForm(c);
  };

  const saveEdit = async () => {
    await axios.put(
      `http://localhost:5000/api/clients/${editId}`,
      form
    );

    setEditId(null);
    setForm({ name: "", phone: "", address: "", gst: "" });
    fetchClients();
  };

  // ================= DELETE =================
  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  // ================= FILTER =================
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

 return (
  <div className="p-6 bg-slate-50 min-h-screen">

    <PageHeader
      title="Clients"
      subtitle="Manage your clients and quotations"
    />

    {/* TOP GRID */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ADD CLIENT */}
      <Card className="lg:col-span-1">

        <h2 className="text-lg font-semibold mb-4">
          Add Client
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <Input
            name="name"
            placeholder="Client Name"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />

          <Input
            name="gst"
            placeholder="GST Number"
            value={form.gst}
            onChange={handleChange}
          />

          <Button type="submit">
            Add Client
          </Button>

        </form>
      </Card>

      {/* CLIENT TABLE */}
      <Card className="lg:col-span-2">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold">
            Client List
          </h2>

          <div className="w-72">
            <Input
              placeholder="Search client..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-sm">

                <th className="text-left py-3">
                  Client
                </th>

                <th className="text-left py-3">
                  Phone
                </th>

                <th className="text-left py-3">
                  GST
                </th>

                <th className="text-right py-3">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {filtered.map((c) => (

                <tr
                  key={c.id}
                  className="
                    border-b
                    border-slate-100
                    hover:bg-slate-50
                    transition
                  "
                >

                  {/* CLIENT */}
                  <td className="py-4">

                    <div
                      onClick={() =>
                        navigate(`/client/${c.id}`)
                      }
                      className="
                        cursor-pointer
                      "
                    >

                      <div className="font-medium text-slate-800">
                        {c.name}
                      </div>

                      <div className="text-sm text-slate-500">
                        {c.address}
                      </div>

                    </div>

                  </td>

                  {/* PHONE */}
                  <td className="py-4 text-slate-600">
                    {c.phone || "-"}
                  </td>

                  {/* GST */}
                  <td className="py-4 text-slate-600">
                    {c.gst || "-"}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-4">

                    <div className="flex justify-end gap-2">

                      <Button
                        variant="secondary"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => deleteClient(c.id)}
                      >
                        Delete
                      </Button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  </div>
);
};

export default Clients;