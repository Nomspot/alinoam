"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LogIn() {
  const router = useRouter();
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-black">
      <motion.button
        onClick={() => router.push("/login")}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
        whileHover={{ scale: 1.05, filter: "brightness(1.3)" }}
      >
        לחץ כדי להתחבר
      </motion.button>
    </div>
  );
}