interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-gray-600 border-t-[#f97316] animate-spin`}
      data-ocid="loading_spinner"
    />
  );
}
