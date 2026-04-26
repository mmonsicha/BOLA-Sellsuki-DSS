# รายงานการใช้งาน Sellsuki Design System

## สรุปงาน
- งาน: ทดลองปรับโปรเจกต์ให้ใช้ `@uxuissk/design-system/styles.css` แบบตรง ๆ ตาม DSS MCP/Storybook ให้มากที่สุด และตรวจว่าทำให้ระบบ BOLA เหมือน Storybook 100% ได้หรือไม่
- วันที่: 2026-04-26 10:45
- พื้นที่ทำงานหรือรีโป: `mmonsicha/BOLA-Sellsuki-DSS`

## เวอร์ชัน Sellsuki Design System
- สถานะเวอร์ชัน: `inferred`
- เวอร์ชันที่ใช้:
  - `@uxuissk/design-system@0.8.16`
  - `@uxuissk/design-tokens@0.1.2`
  - Storybook signal: `sellsukidesignsystemv12`
- หลักฐานจาก MCP:
  - `get_quick_start` ระบุชัดว่า root ต้อง import `@uxuissk/design-system/styles.css`
  - `get_brand_rules` ระบุว่า DB HeaventRounded, semantic tokens, size `md` คือค่ามาตรฐาน
  - `list_components(layout/navigation)` ระบุ `AppShellProvider`, `Sidebar`, `TopNavbar`, `PageHeader`, `FeaturePageScaffold`
  - `npm ls` ใน repo ยืนยันเวอร์ชัน package ที่ติดตั้งจริง

## Components ที่เรียกใช้งาน
- `Sidebar`
- `TopNavbar`
- `Alert`
- `DSButton`

## Tokens ที่เรียกใช้งาน
- หมวดหมู่: `typography`
  - `--text-p`
  - `--text-label`
  - `--text-button`
  - `--text-caption`
- หมวดหมู่: `spacing`
  - `--Spacing--Spacing-3xl`
  - `--Spacing--Spacing-5xl`
  - `--Spacing--Spacing-6xl`
- หมวดหมู่: `radius`
  - `--Border-radius--radius-md`

## ผลการทดลอง
- เปลี่ยน `src/index.css` จาก `@import "@uxuissk/design-tokens/css";` เป็น `@import "@uxuissk/design-system/styles.css";`
- คง `@tailwind base; @tailwind components; @tailwind utilities;` ไว้ในไฟล์เดียวกัน
- รัน `npm run build` เพื่อพิสูจน์ว่าแนวทางนี้ใช้ได้จริงหรือไม่

## ผลลัพธ์
- `npm run type-check` ผ่าน
- `npm run lint` ผ่านระดับ error
- `npm run build` **ไม่ผ่าน** เมื่อใช้ `styles.css` ตรง ๆ

error ที่เกิดขึ้นจริง:

```text
[vite:css] [postcss] layerRule.nodes is not iterable
TypeError: layerRule.nodes is not iterable
... at node_modules/@uxuissk/design-system/dist/sellsuki-ds.css ...
... tailwindcss/lib/lib/setupContextUtils.js ...
```

หลังจาก revert กลับไปใช้ `@uxuissk/design-tokens/css`
- `npm run build` ผ่านอีกครั้ง

## สรุปตามความจริง
- **ยังทำให้ BOLA ใช้ DSS แบบ 100% ผ่าน `styles.css` ไม่ได้ในตอนนี้**
- **ยังทำให้เหมือน Storybook 100% ไม่ได้ในตอนนี้**

## มี issue เพราะอะไร

### 1. `styles.css` ของ DSS ยังชนกับ Tailwind v3 / PostCSS pipeline ของโปรเจกต์นี้
- MCP ระบุว่าต้อง import `@uxuissk/design-system/styles.css` เป็น first import
- แต่เมื่อทำตามจริงในโปรเจกต์นี้ build พังทันที
- แปลว่าแนว integration ตาม quick start ยังไม่ compatible กับ stack ปัจจุบันของ BOLA

### 2. ระบบ BOLA ยังพึ่ง Tailwind utility classes อยู่ทั่วทั้งแอป
- แม้เราจะ “ไม่อยากใช้ Tailwind v3” ตามโจทย์ แต่โค้ดทั้งระบบยังผูกกับ Tailwind จำนวนมาก
- ถ้าจะเลิกใช้จริง ต้องย้าย class usage ออกจากทุกหน้า ไม่ใช่แค่เปลี่ยน import CSS ที่ root

### 3. Shell runtime ของ DSS ยังไม่พอสำหรับ BOLA แบบ 1:1
- MCP ระบุ `AppShellProvider` แต่ runtime package ที่ใช้อยู่ยังไม่มี AppShell สำเร็จรูปให้เอามาประกอบตรง ๆ
- `Sidebar` runtime ปัจจุบันยังเป็น group/item แบบแบน ไม่รองรับเมนูย่อย expand/collapse แบบ BOLA canonical shell

## ต้องแก้ยังไง

### ฝั่ง Design System / Package
- ทำให้ `@uxuissk/design-system/styles.css` ใช้ร่วมกับ Vite + Tailwind v3 ได้จริง
- ตรวจโครงสร้าง `@layer` / PostCSS compatibility ใน package CSS
- ถ้า support Tailwind v3 ไม่ได้ ควรมี migration guide หรือ compatibility mode ชัดเจน
- เพิ่ม canonical AppShell runtime ที่ใช้งานได้จริง ไม่ใช่มีแค่ `AppShellProvider`
- เพิ่ม nested sidebar / expand menu API ให้ `Sidebar`

### ฝั่งโปรเจกต์ BOLA
- ถ้าต้องการ “ไม่ใช้ Tailwind v3” จริง ต้องทำเป็น migration project แยก
- ไล่ refactor utility classes ออกจากหน้าและ layout ทั้งระบบ
- ย้ายไปใช้ runtime components ของ DSS ให้ครบทีละกลุ่มหน้า
- ลด `ds-compat` และ custom shell logic ลงทีละส่วน

## ข้อสรุปเชิงปฏิบัติ
- ทางที่เสถียรที่สุดตอนนี้ยังเป็น:
  - ใช้ DSS runtime components เท่าที่ package export/use ได้จริง
  - ใช้ `@uxuissk/design-tokens/css`
  - ใช้ token bridge ใน `src/index.css`
- ถ้าต้องการไปถึง Storybook 100% จริง ต้องแก้ upstream ของ DSS package และทำ migration ระดับสถาปัตยกรรมใน BOLA เพิ่ม

## สถานะการส่งขึ้น GitHub
- วิธีที่ใช้: `markdown-commit + issue`
- เป้าหมาย: `mmonsicha/BOLA-Sellsuki-DSS`, `BearyCenter/Sellsukidesignsystemv12`
- ผลลัพธ์: `สำเร็จ`
- Issues:
  - BOLA repo: [#4](https://github.com/mmonsicha/BOLA-Sellsuki-DSS/issues/4)
  - DSS repo: [#14](https://github.com/BearyCenter/Sellsukidesignsystemv12/issues/14)
