"use client";

import { useState } from "react";
import { useOptions } from "../options";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const { login } = useOptions();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const email = `${name.replace(/\s+/g, '').toLowerCase()}@app.local`;
      await login(email, phone);
      router.push("/");
    } catch {
      setError('.ההתחברות נכשלה, וודא שהנתונים נכונים');
    }
  };

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen p-8">
      <motion.h1 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-2xl font-bold mb-8"
      >
        התחבר לאתר
      </motion.h1>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit} 
        className="flex flex-col space-y-4 w-full max-w-md"
      >
        <input
          type="text"
          placeholder="שם"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-2 border rounded"
          required
        />
        <input
          type="tel"
          dir="rtl"
          placeholder="מס פלאפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-4 py-2 border rounded"
          required
        />
        
        <motion.button 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 1 }}
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          התחבר
        </motion.button>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}