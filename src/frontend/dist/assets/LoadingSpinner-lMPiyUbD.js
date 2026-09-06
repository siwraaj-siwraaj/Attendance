import { j as jsxRuntimeExports } from "./index-B9IM4GPI.js";
const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3"
};
function LoadingSpinner({ size = "md" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `${sizeMap[size]} rounded-full border-gray-600 border-t-[#f97316] animate-spin`,
      "data-ocid": "loading_spinner"
    }
  );
}
export {
  LoadingSpinner as L
};
