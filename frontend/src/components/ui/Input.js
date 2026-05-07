import React from "react";

const Input = ({
  placeholder,
  value,
  onChange,
  type = "text",
  name,
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="
        w-full
        px-4
        py-2.5
        rounded-xl
        border
        border-slate-200
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        bg-white
      "
    />
  );
};

export default Input;