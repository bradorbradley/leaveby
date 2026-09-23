"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRing, Car, Globe, Luggage, Share2, ShieldCheck, Smartphone, Timer, TrainFront } from "lucide-react";

const FEATURES = [
  { icon: Timer, title: "A live countdown", body: "The minutes to your door, ticking, so you can stop checking the clock and doing the math." },
  { icon: Car, title: "Ride to the terminal", body: "Uber and Lyft open with your terminal pinned as the drop-off. Not the airport. Not the rental lot. No panic at the curb." },
  { icon: TrainFront, title: "Drive, ride, or transit", body: "Parking time when you drive. Curb time when you ride. Train schedules when you take the train." },
  { icon: Luggage, title: "Bag-drop cutoffs", body: "Checking a bag? The cutoff is already in the plan, so you never find out about it at the counter." },
  { icon: ShieldCheck, title: "PreCheck, CLEAR, Global Entry", body: "Tell it your lane once. Waits are looked up for that lane, at that checkpoint, today." },
  { icon: BellRing, title: "A reminder in your calendar", body: "One tap adds the leave time to your calendar with the plan attached. Then you can forget about it until it is time." },
  { icon: Share2, title: "Share the whole plan", body: "Everyone traveling with you sees the same time and the same plan. No debate, no nagging." },
  { icon: Smartphone, title: "No account. Nothing to install.", body: "Works in the browser on any phone. Your home and preferences stay on your device. Nothing to set up when you are already stressed." },
  { icon: Globe, title: "Any airline, any airport", body: "Domestic or international. Times are always shown in the airport's own timezone." },
];

export function Features() {
  const reduce = useReducedMotion();
  return (
    <motion.ul
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
    >
      {FEATURES.map((f) => (
        <motion.li
          key={f.title}
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 26 } } }}
          className="card flex gap-3.5 !p-4"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink text-paper" style={{ backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 60%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)" }}>
            <f.icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-sans text-[15.5px] font-semibold tracking-normal">{f.title}</h3>
            <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{f.body}</p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
