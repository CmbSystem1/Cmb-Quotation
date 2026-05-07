export default function Input({
  className = "",
  ...props
}) {
  return (
    <input
      {...props}
      className={`
        border
        border-slate-300
        rounded-xl
        px-3
        py-2
        text-sm
        outline-none
        focus:ring-2
        focus:ring-slate-300
        bg-white
        min-w-0
        ${className}
      `}
    />
  );
}