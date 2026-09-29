"use client";
import { useRef } from "react";

export function OtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");
  function update(index: number, digit: string) { const next = [...digits]; next[index] = digit.replace(/\D/g, "").slice(-1); onChange(next.join("")); if (digit && index < 5) refs.current[index + 1]?.focus(); }
  return <div className="otp-boxes" onPaste={(event) => { const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (pasted) { event.preventDefault(); onChange(pasted); refs.current[Math.min(5, pasted.length - 1)]?.focus(); } }}>{digits.map((digit, index) => <input key={index} ref={element => { refs.current[index] = element; }} value={digit} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`Chiffre ${index + 1}`} onChange={event => update(index, event.target.value)} onKeyDown={event => { if (event.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus(); }} />)}<input type="hidden" name="code" value={value} /></div>;
}
