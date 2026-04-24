# รายงานการใช้งาน Sellsuki Design System MCP

## งาน
- Phase 1: Foundation, Fonts, Appshell, และ Pure UI Refactoring สำหรับ BOLA Frontend

## เวอร์ชันที่ใช้งาน
- `@uxuissk/design-system`: `0.8.16`
- `@uxuissk/design-tokens`: `0.1.2`
- สถานะเวอร์ชันจาก MCP: `inferred + explicit package verification`

## หลักฐานอ้างอิงเวอร์ชัน
- `get_contract_changelog`: ไม่สามารถใช้งานได้ เพราะ MCP ตอบกลับ `Contract not found: meta/changelog.json`
- `get_quick_start`: ยืนยันให้ใช้ `npm install @uxuissk/design-system@latest`
- `list_components`: ยืนยันชุด component ล่าสุดจาก MCP และระบุแพ็กเกจ `@latest`
- `node_modules/@uxuissk/design-system/package.json`: ยืนยันเวอร์ชันที่ติดตั้งจริงเป็น `0.8.16`
- `node_modules/@uxuissk/design-tokens/package.json`: ยืนยันเวอร์ชันที่ติดตั้งจริงเป็น `0.1.2`

## Components ที่ใช้ในงานนี้
- `TopNavbar`
- `Sidebar`
- `Alert`
- `Badge`
- `Card`
- `CardHeader`
- `CardBody`
- `DSButton`
- `DSInput`
- `EmptyState`
- `Spinner`
- `Tabs`
- `StatCard`
- `Pagination`
- `ToastContainer`
- `toast`

## Tokens ที่ใช้ในงานนี้
- Typography
  - `--font-h1`
  - `--font-h2`
  - `--font-h3`
  - `--font-h4`
  - `--font-p`
  - `--font-label`
  - `--font-caption`
  - `--font-button`
  - `--text-h1`
  - `--text-h2`
  - `--text-h3`
  - `--text-h4`
  - `--text-p`
  - `--text-label`
  - `--text-caption`
  - `--text-button`
- Colors
  - `--Colors--Background--bg-primary`
  - `--Colors--Background--bg-quaternary`
  - `--Colors--Background--bg-brand-primary`
  - `--Colors--Background--bg-brand-solid`
  - `--Colors--Background--bg-success-solid`
  - `--Colors--Background--bg-warning-solid`
  - `--Colors--Background--bg-danger-solid`
  - `--Colors--Text--text-primary`
  - `--Colors--Text--text-secondary`
  - `--Colors--Text--text-brand-primary`
  - `--Colors--Text--text-success-primary`
  - `--Colors--Text--text-warning-primary`
  - `--Colors--Text--text-danger-primary`
  - `--Colors--Stroke--stroke-primary`
  - `--Colors--Stroke--stroke-brand`
  - `--Colors--Stroke--stroke-brand-lighter`
- Spacing
  - `--Spacing--Spacing-lg`
  - `--Spacing--Spacing-xl`
  - `--Spacing--Spacing-2xl`
  - `--Spacing--Spacing-3xl`
  - `--Spacing--Spacing-5xl`
  - `--Spacing--Spacing-6xl`
- Radius
  - `--Border-radius--radius-md`
  - `--Border-radius--radius-xl`
  - `--Border-radius--radius-2xl`
  - `--Border-radius--radius-3xl`
  - `--Border-radius--radius-4xl`
- AppShell / Product
  - `--shell-nav-height`
  - `--shell-sidebar-width`
  - `--shell-sidebar-collapsed`
  - `--shell-content-padding`
  - `--shell-content-padding-sm`
  - `data-product="sellsuki"`

## สิ่งที่ปรับปรุงใน Phase นี้
- ปรับ root foundation ให้ยึด DS tokens และ typography ของ MCP
- ปรับ `tailwind.config.js` ให้ใช้ CSS variables ตรง ๆ แทน `hsl(var(...))` ที่ไม่เข้ากับ token จริงของ DS
- วาง Appshell ใหม่ด้วย `TopNavbar + Sidebar + tokenized content shell`
- ปรับ `Login`, `Choose Workspace`, `Dashboard`, `AuthStatusBar` ให้ align กับ DS typography / spacing / radius มากขึ้น
- เพิ่ม compatibility layer สำหรับ component ที่ MCP ระบุว่ามี แต่ runtime package `0.8.16` ยังไม่ export ออกมาจริง

## DS Gaps / ความคลาดเคลื่อนที่พบ
- `styles.css` จาก `@uxuissk/design-system@0.8.16` ยังชนกับ Tailwind v3/PostCSS pipeline ของโปรเจกต์นี้ ทำให้ build fail
- runtime package `0.8.16` ไม่ export หลาย component ที่ MCP และ type definitions ระบุ เช่น:
  - `AppShell`
  - `FeaturePageScaffold`
  - `PageHeader`
  - `ChoiceCard`
  - `ChoiceCardGroup`
  - `AdvancedDataTable`
  - `FilterBar`
  - `BarChart`
  - `DonutChart`
- typography ที่ได้จาก MCP กับ token CSS ที่ publish มา ยังมีค่าบางจุดไม่ตรงกัน จึงต้อง override ให้ตรง spec ที่ MCP ระบุ

## สิ่งที่ตั้งใจหลีกเลี่ยง
- ไม่ใช้สี hard-coded ใหม่ใน layer ที่รีแฟกเตอร์
- ไม่ใช้ spacing / radius ad hoc เพิ่มเติม
- ไม่แตะ logic backend flow ที่ซับซ้อนเกิน scope ของ Phase 1

## ข้อเสนอแนะสำหรับทีม Design System
- แยก publish ระหว่าง `runtime components` กับ `storybook/types` ให้ตรงกัน 100%
- แก้ `styles.css` ให้ใช้งานร่วมกับ Tailwind v3 consumer apps ได้โดยไม่ชน PostCSS
- เพิ่ม changelog contract ใน MCP ให้เรียกได้จริง เพื่อให้ version check ชัดเจนตั้งแต่ต้น
