// tailwind.config.ts
// กำหนดค่า Tailwind CSS — บอกว่าจะ scan ไฟล์ไหนบ้าง

import type { Config } from 'tailwindcss';

const config: Config = {
  // content — ระบุไฟล์ที่ใช้ Tailwind class (เพื่อ purge CSS ที่ไม่ใช้)
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // เพิ่ม custom colors หากต้องการ
    },
  },
  plugins: [],
};

export default config;
