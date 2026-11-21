/** Ilustración botánica minimalista: tres plantas en macetas. Colores desde el sistema de diseño. */
export function PlantasIlustracion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="Tres plantas en macetas">
      {/* Albahaca en maceta crema */}
      <g>
        <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-sway motion-reduce:animate-none">
          <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-grow motion-safe:[animation-delay:0ms] motion-reduce:animate-none">
            <path d="M82 92 C70 78 60 82 56 72 C66 66 78 72 84 84 Z" className="fill-leaf-light" />
            <path d="M86 90 C84 74 92 62 104 60 C106 72 98 84 86 90 Z" className="fill-leaf-light" />
            <path d="M90 94 C100 84 114 84 118 92 C110 100 98 100 90 94 Z" className="fill-leaf-light" />
            <path d="M84 96 C74 90 62 94 60 102 C70 106 80 104 84 96 Z" className="fill-leaf-light" />
            <circle cx="70" cy="70" r="6" className="fill-leaf-light" />
            <circle cx="104" cy="64" r="7" className="fill-leaf-light" />
            <path d="M87 108 L87 84" className="stroke-leaf" strokeWidth="2" fill="none" />
          </g>
        </g>
        <path d="M68 108 H108 L102 138 H74 Z" className="fill-pot-cream" />
        <rect x="64" y="104" width="48" height="8" rx="2" className="fill-pot-cream" />
      </g>
      {/* Jitomate en maceta de terracota */}
      <g>
        <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-sway motion-reduce:animate-none">
          <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-grow motion-safe:[animation-delay:130ms] motion-reduce:animate-none">
            <path d="M160 108 C160 80 158 56 160 22" className="stroke-leaf" strokeWidth="3" fill="none" />
            <path d="M160 70 C150 62 140 64 132 56" className="stroke-leaf" strokeWidth="2.5" fill="none" />
            <path d="M160 54 C172 46 180 48 188 40" className="stroke-leaf" strokeWidth="2.5" fill="none" />
            <path d="M160 86 C172 80 182 84 190 78" className="stroke-leaf" strokeWidth="2.5" fill="none" />
            <path d="M132 56 C124 46 128 36 138 38 C142 46 140 52 132 56 Z" className="fill-leaf" />
            <path d="M188 40 C196 30 206 34 204 44 C196 48 192 46 188 40 Z" className="fill-leaf" />
            <path d="M160 24 C150 14 156 4 166 8 C168 16 166 22 160 24 Z" className="fill-leaf" />
            <path d="M190 78 C200 70 210 76 206 86 C198 88 194 86 190 78 Z" className="fill-leaf" />
            <path d="M148 40 C138 34 140 26 150 26 C154 32 152 38 148 40 Z" className="fill-leaf-light" />
            <path d="M172 66 C182 60 188 66 184 74 C176 76 174 72 172 66 Z" className="fill-leaf-light" />
            <circle cx="140" cy="66" r="7" className="fill-tomato" />
            <circle cx="180" cy="52" r="6.5" className="fill-tomato" />
            <circle cx="176" cy="92" r="7" className="fill-tomato" />
            <circle cx="148" cy="88" r="5.5" className="fill-tomato" />
          </g>
        </g>
        <path d="M132 108 H188 L180 140 H140 Z" className="fill-terracotta" />
        <rect x="128" y="102" width="64" height="10" rx="2" className="fill-terracotta" />
      </g>
      {/* Planta de hoja ancha en maceta verde */}
      <g>
        <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-sway motion-reduce:animate-none">
          <g className="[transform-box:fill-box] [transform-origin:center_bottom] motion-safe:animate-grow motion-safe:[animation-delay:235ms] motion-reduce:animate-none">
            <path d="M244 104 C232 92 222 74 228 56 C240 64 246 84 244 104 Z" className="fill-leaf-light" />
            <path d="M248 104 C250 82 258 62 274 54 C278 72 266 92 248 104 Z" className="fill-leaf-light" />
            <path d="M246 104 C238 88 238 70 246 48 C254 66 254 86 246 104 Z" className="fill-leaf" />
            <path d="M250 106 C262 96 278 94 286 100 C276 108 262 110 250 106 Z" className="fill-leaf" />
          </g>
        </g>
        <path d="M226 110 H270 L264 140 H232 Z" className="fill-leaf" />
        <rect x="222" y="104" width="52" height="9" rx="2" className="fill-leaf" />
      </g>
      <rect x="40" y="140" width="260" height="2" rx="1" className="fill-border" />
    </svg>
  );
}
