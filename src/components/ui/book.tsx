import React from "react";
import { useResponsive, type ResponsiveProp } from "@/components/ui/use-responsive";
import clsx from "clsx";

const DefaultIllustration = (
  <svg fill="none" height="56" viewBox="0 0 36 56" width="36" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M3.03113 28.0005C6.26017 23.1765 11.7592 20.0005 18 20.0005C24.2409 20.0005 29.7399 23.1765 32.9689 28.0005C29.7399 32.8244 24.2409 36.0005 18 36.0005C11.7592 36.0005 6.26017 32.8244 3.03113 28.0005Z"
      fill="#0070F3"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9691 28.0012C34.8835 25.1411 36 21.7017 36 18.0015C36 8.06034 27.9411 0.00146484 18 0.00146484C8.05887 0.00146484 0 8.06034 0 18.0015C0 21.7017 1.11648 25.1411 3.03094 28.0012C6.25996 23.1771 11.7591 20.001 18 20.001C24.2409 20.001 29.74 23.1771 32.9691 28.0012Z"
      fill="#45DEC4"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9692 28.0005C29.7402 32.8247 24.241 36.001 18 36.001C11.759 36.001 6.25977 32.8247 3.03077 28.0005C1.11642 30.8606 0 34.2999 0 38C0 47.9411 8.05887 56 18 56C27.9411 56 36 47.9411 36 38C36 34.2999 34.8836 30.8606 32.9692 28.0005Z"
      fill="#E5484D"
      fillRule="evenodd"
    />
  </svg>
);

export interface BookProps {
  title?: string;
  variant?: "simple" | "stripe";
  width?: number | ResponsiveProp<number>;
  color?: string;
  textColor?: string;
  illustration?: React.ReactNode;
  textured?: boolean;
  children?: React.ReactNode;
  className?: string;
  rotate?: boolean;
  pageEdgeColor?: string;
}

export const Book = ({
  title = "",
  variant = "stripe",
  width = 196,
  color,
  textColor = "var(--ds-gray-1000)",
  illustration,
  textured = false,
  children,
  className,
  rotate = true,
  pageEdgeColor,
}: BookProps) => {
  const _width = useResponsive(width) ?? 196;
  const _color = color ? color : variant === "simple" ? "var(--ds-background-200)" : "var(--ds-amber-600)";
  const _illustration = illustration ? illustration : DefaultIllustration;

  return (
    <div className={clsx("inline-block w-fit select-none", className)} style={{ perspective: 1100 }}>
      <div
        className={clsx(
          "aspect-[49/60] w-fit relative duration-[350ms]",
          rotate ? "book-rotate" : "rotate-0"
        )}
        style={{ transformStyle: "preserve-3d", minWidth: _width, containerType: "inline-size" }}
      >
        <div
          className="flex flex-col h-full rounded-l-md rounded-r overflow-hidden bg-background-200 shadow-book translate-x-0 relative after:absolute after:border after:border-gray-alpha-400 after:w-full after:h-full after:shadow-book-border after:rounded-l-md after:rounded-r after:pointer-events-none"
          style={{ width: _width }}
        >
          {children ? (
            <div className="relative w-full h-full flex flex-col z-10">
              {/* Lombada e vinco de encadernação do livro */}
              <div
                className="absolute top-0 bottom-0 left-0 w-[8.2%] pointer-events-none z-20 mix-blend-overlay"
                style={{ background: "var(--ds-book-bind)" }}
              />
              <div
                className="absolute top-0 bottom-0 left-0 w-[8.2%] pointer-events-none z-20 opacity-25"
                style={{ background: "var(--ds-book-bind)" }}
              />
              {children}
            </div>
          ) : (
            <>
              <div
                className={clsx(
                  "w-full relative overflow-hidden",
                  variant === "stripe" && "flex-1"
                )}
                style={{ background: _color }}
              >
                {variant === "stripe" && illustration && (
                  <div className="absolute h-full w-full">
                    {_illustration}
                  </div>
                )}
                <div
                  className="absolute h-full w-[8.2%] mix-blend-overlay pointer-events-none"
                  style={{ background: "var(--ds-book-bind)" }}
                />
              </div>
              <div
                className={clsx(
                  "relative flex-1",
                  (variant === "stripe" || (variant === "simple" && color === undefined)) && "bg-book-gradient"
                )}
                style={{ background: variant === "simple" && color !== undefined ? _color : undefined }}
              >
                <div
                  className="absolute h-full w-[8.2%] opacity-20 pointer-events-none"
                  style={{ background: "var(--ds-book-bind)" }}
                />
                <div
                  className={clsx(
                    "flex flex-col w-full p-[6.1%] pl-[14.3%]",
                    variant === "simple" ? "gap-4" : "justify-between"
                  )}
                  style={{ containerType: "inline-size", gap: `calc((24px / 196) * ${_width})` }}
                >
                  <span
                    className={clsx(
                      "leading-[1.25em] tracking-[-.02em] text-balance font-semibold",
                      variant === "simple" ? "text-[12cqw]" : "text-[10.5cqw]"
                    )}
                    style={{ color: textColor }}
                  >
                    {title}
                  </span>
                  {variant === "stripe" ? (
                    <svg className="scale-75 -ml-1 -mb-1" height="24" width="24" style={{ fill: textColor }}>
                      <path d="M21,21H3L12,3Z" />
                    </svg>
                  ) : _illustration}
                </div>
              </div>
            </>
          )}

          {textured && (
            <div
              className="absolute top-0 left-0 inset-0 rotate-180 rounded-l-md rounded-r mix-blend-hard-light pointer-events-none bg-cover bg-no-repeat opacity-40 brightness-110 bg-[url('https://cdn.21st.dev/assets/mirror/1a/1a2ecfcafab4d36898151e5960d2bddd8c13c8b5e3721538ce626d366810e518.avif')]"
            />
          )}
        </div>

        {/* Borda lateral 3D (espessura das páginas do livro) quando em rotação 3D */}
        {rotate && (
          <div
            className="h-[calc(100%_-_2_*_3px)] w-[calc(29cqw_-_2px)] absolute top-[3px] pointer-events-none shadow-md"
            style={{
              background: pageEdgeColor ?? "linear-gradient(90deg, #eaeaea, transparent 70%), linear-gradient(#fff, #fafafa)",
              transform: `translateX(calc(${_width} * 1px - 29cqw / 2 - 3px)) rotateY(90deg) translateX(calc(29cqw / 2))`
            }}
          />
        )}
        {/* Contracapa 3D (fundo do livro no espaço tridimensional) */}
        {rotate && (
          <div
            className="bg-[#120804] dark:bg-[#0a0503] absolute left-0 top-0 rounded-l-md rounded-r h-full pointer-events-none shadow-2xl"
            style={{ width: _width, transform: "translateZ(calc(-1 * 29cqw))" }}
          />
        )}
      </div>
    </div>
  );
};

export default Book;
