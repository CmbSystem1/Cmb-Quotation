import {
  LayoutDashboard,
  Users,
  FileText,
  Package
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/"
  },
  {
    label: "Clients",
    icon: Users,
    path: "/clients"
  },
  {
    label: "Quotations",
    icon: FileText,
    path: "/quotations"
  },
  {
    label: "Inventory",
    icon: Package,
    path: "/inventory"
  }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen">

      {/* LOGO */}
      <div className="px-6 py-8 border-b border-slate-800">

        <h1 className="text-2xl font-bold">
          Dashboard
        </h1>

        <p className="text-slate-400 text-sm mt-1">
          Quotation System
        </p>

      </div>

      {/* MENU */}
      <nav className="p-3 space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}

              className={({ isActive }) =>
                `
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                transition
                font-medium

                ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
                `
              }
            >
              <Icon size={18} />

              {item.label}
            </NavLink>
          );
        })}

      </nav>

    </aside>
  );
}