import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  BookOpen,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Video,
  CheckCircle,
} from "lucide-react";

interface ManualStep {
  title: string;
  content: string;
}

interface ManualFaq {
  q: string;
  a: string;
}

interface ManualSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  estimatedTime: string;
  prerequisites?: string[];
  steps: ManualStep[];
  commonMistakes?: string[];
  faqs?: ManualFaq[];
  nextAction?: string;
  videoPlanned?: boolean;
  infographic?: boolean;
}

const manualSections: ManualSection[] = [
  {
    id: "connect-line-oa",
    title: "วิธีเชื่อมต่อ LINE OA",
    icon: "🔌",
    summary: "คู่มือภาพแบบขั้นตอน — เชื่อมต่อ LINE OA เข้ากับ BOLA ใน 5 นาที",
    estimatedTime: "5 นาที",
    infographic: true,
    steps: [],
    faqs: [
      {
        q: "ต้องสร้าง LINE Official Account ใหม่ไหม?",
        a: "ไม่ต้อง ใช้ OA ที่มีอยู่แล้วได้เลย เพียงแค่นำ credentials มากรอกใน BOLA",
      },
      {
        q: "Access Token หมดอายุแล้วทำอย่างไร?",
        a: "ไปที่ LINE Developers Console → Messaging API → Issue new token แล้วอัปเดตใน BOLA",
      },
    ],
    nextAction: "ตั้งค่า Auto-Reply rule แรกของคุณ → /auto-reply",
  },
  {
    id: "getting-started",
    title: "เริ่มต้นใช้งาน BOLA",
    icon: "🚀",
    summary:
      "เรียนรู้วิธีเชื่อมต่อ LINE OA แรกของคุณและตั้งค่าระบบเบื้องต้นภายใน 10 นาที",
    estimatedTime: "10 นาที",
    prerequisites: [
      "มี LINE Official Account พร้อม Channel ID, Channel Secret และ Channel Access Token",
      "เข้าถึง LINE Developers Console (developers.line.biz)",
    ],
    steps: [
      {
        title: "เข้าสู่ระบบ BOLA",
        content:
          "เปิดเบราว์เซอร์และไปที่ URL ของ BOLA จากนั้นเข้าสู่ระบบด้วยบัญชีที่ได้รับ",
      },
      {
        title: "เพิ่ม LINE OA แรก",
        content:
          "คลิก 'LINE OA' ในเมนูซ้ายมือ จากนั้นคลิกปุ่ม '+ Add LINE OA' กรอก Channel ID, Channel Secret และ Access Token",
      },
      {
        title: "ยืนยันการเชื่อมต่อ",
        content:
          "หากกรอกข้อมูลถูกต้อง ระบบจะดึง Bot Basic ID อัตโนมัติ (เช่น @abc1234) และแสดง badge สีเขียว",
      },
      {
        title: "ตั้งค่า Webhook URL",
        content:
          "คัดลอก Webhook URL จากหน้า LINE OA Detail แล้วนำไปวางใน LINE Developers Console > Messaging API > Webhook URL จากนั้นคลิก Verify",
      },
      {
        title: "ทดสอบระบบ",
        content:
          "ส่งข้อความทดสอบไปยัง LINE OA ของคุณ ข้อความควรปรากฏใน Chat Inbox ภายใน 2–3 วินาที",
      },
    ],
    commonMistakes: [
      "Channel Access Token หมดอายุ — ต้องสร้างใหม่ใน LINE Developers Console แล้วอัปเดตใน BOLA",
      "Webhook URL ไม่ได้รับการ Verify — ต้องกดปุ่ม Verify ใน LINE Developers Console หลังจากวาง URL",
    ],
    faqs: [
      {
        q: "ฉันสามารถเพิ่ม LINE OA ได้กี่บัญชี?",
        a: "ไม่จำกัดจำนวน LINE OA คุณสามารถจัดการได้หลายบัญชีจาก Dashboard เดียว",
      },
      {
        q: "ถ้า Access Token ของฉันหมดอายุ ต้องทำอย่างไร?",
        a: "ไปที่ LINE Developers Console สร้าง Access Token ใหม่ แล้วอัปเดตในหน้า LINE OA Detail ของ BOLA",
      },
    ],
    nextAction: "ลองสร้าง Auto-Reply rule แรกของคุณ → /auto-reply",
    videoPlanned: true,
  },
  {
    id: "line-oa",
    title: "จัดการ LINE Official Account",
    icon: "💬",
    summary:
      "ตั้งค่าและจัดการบัญชี LINE OA หลายบัญชีจากที่เดียว รวมถึง LIFF ID และ Rich Menu",
    estimatedTime: "15 นาที",
    prerequisites: [
      "เชื่อมต่อ LINE OA อย่างน้อย 1 บัญชีแล้ว (ดูหัวข้อ เริ่มต้นใช้งาน)",
    ],
    steps: [
      {
        title: "เข้าหน้า LINE OA",
        content:
          "คลิก 'LINE OA' ในเมนูซ้ายมือ จะเห็นรายการ LINE OA ทั้งหมดที่เชื่อมต่อไว้",
      },
      {
        title: "คลิกที่ LINE OA เพื่อดูรายละเอียด",
        content:
          "หน้า Detail จะแสดง Channel ID, Bot Basic ID (badge สีเขียว), Webhook URL, และสถานะการเชื่อมต่อ",
      },
      {
        title: "ตั้งค่า LIFF ID (ถ้าต้องการ)",
        content:
          "LIFF ID จำเป็นสำหรับ LON Consent Flow และ Registration Forms เท่านั้น สร้าง LIFF App ใน LINE Developers Console แล้วนำ LIFF ID มาใส่ที่นี่",
      },
      {
        title: "อัปเดต Access Token",
        content:
          "หาก Token หมดอายุ กรอก Token ใหม่ในช่อง Channel Access Token แล้วกด Save",
      },
    ],
    commonMistakes: [
      "LIFF ID ผิดรูปแบบ — ต้องเป็น xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx (8-24 ตัวอักษร)",
      "ลืมอัปเดต Webhook ใน LINE Developer Console หลังเปลี่ยน URL",
    ],
    faqs: [
      {
        q: "Bot Basic ID คืออะไร?",
        a: "Bot Basic ID คือ ID สาธารณะของ LINE Bot (เช่น @abc1234) ใช้สำหรับสร้างลิงก์เพิ่มเพื่อน BOLA ดึงข้อมูลนี้อัตโนมัติเมื่อคุณเพิ่ม OA",
      },
      {
        q: "ทำไมฉันต้องใช้ LIFF ID?",
        a: "LIFF ID ต้องใช้เมื่อต้องการให้ผู้ใช้สมัคร LON Notifications หรือกรอก Registration Form ผ่าน LINE App",
      },
    ],
    nextAction: "ตั้งค่า Auto-Reply สำหรับ OA นี้ → /auto-reply",
    videoPlanned: true,
  },
  {
    id: "broadcasts",
    title: "ส่ง Broadcast",
    icon: "📢",
    summary:
      "ส่งข้อความถึงผู้ติดตามหลายพันคนพร้อมกัน กำหนดเวลาล่วงหน้า และติดตามผลการส่ง",
    estimatedTime: "10 นาที",
    prerequisites: [
      "มีผู้ติดตาม (Followers) อย่างน้อย 1 คนใน LINE OA",
      "สร้าง Segment แล้ว (ถ้าต้องการส่งเฉพาะกลุ่ม)",
    ],
    steps: [
      {
        title: "คลิก Broadcasts ในเมนู",
        content: "จะเห็นรายการ Broadcasts ที่ส่งไปแล้วและสถานะของแต่ละรายการ",
      },
      {
        title: "คลิก '+ Create Broadcast'",
        content:
          "Wizard จะแนะนำขั้นตอน: เลือก LINE OA → เขียนข้อความ → เลือกผู้รับ → กำหนดเวลา",
      },
      {
        title: "เลือก LINE OA และเขียนข้อความ",
        content:
          "เลือก LINE OA ที่ต้องการส่ง จากนั้นเลือกประเภทข้อความ (Text, Image, Flex Message) และเขียน/เลือก content",
      },
      {
        title: "เลือกผู้รับ",
        content:
          "เลือกระหว่าง All Followers, Segment ที่สร้างไว้, หรือ LON Subscribers",
      },
      {
        title: "กำหนดเวลาหรือส่งทันที",
        content:
          "เลือก 'Send Now' เพื่อส่งทันที หรือ 'Schedule' เพื่อกำหนดวันเวลาล่วงหน้า",
      },
      {
        title: "ติดตามผล",
        content:
          "เปิด Broadcast นั้นเพื่อดู Delivery Logs — จะเห็นสถานะการส่งของแต่ละ Follower (Success/Failed)",
      },
    ],
    commonMistakes: [
      "Broadcast ถูก throttle เมื่อมีผู้รับมากกว่า 500 คน — ระบบจะส่งแบบ Async อัตโนมัติ ไม่ต้องกังวล",
      "Flex Message ไม่แสดงถูกต้อง — ทดสอบใน Flex Message Builder ก่อนส่ง",
    ],
    faqs: [
      {
        q: "Sync vs Async Broadcast ต่างกันอย่างไร?",
        a: "Sync (< 500 คน): ส่งทันทีและรอผล | Async (≥ 500 คน): ส่งเป็น background job เร็วกว่าสำหรับรายชื่อขนาดใหญ่ ระบบเลือกให้อัตโนมัติตาม threshold",
      },
      {
        q: "ยกเลิก Broadcast ที่ Schedule ไว้ได้ไหม?",
        a: "ได้ เปิด Broadcast นั้นแล้วกด Cancel ก่อนถึงเวลาที่กำหนดไว้",
      },
    ],
    nextAction: "สร้าง Segment เพื่อส่ง Broadcast แบบ targeted → /segments",
    videoPlanned: true,
  },
  {
    id: "segments",
    title: "สร้าง Audience Segment",
    icon: "🎯",
    summary:
      "แบ่งกลุ่มผู้ติดตามด้วย Rule Engine — กำหนด tag, วันที่ follow, custom field และอื่นๆ",
    estimatedTime: "8 นาที",
    prerequisites: ["มีผู้ติดตาม (Followers) อย่างน้อย 1 คนใน LINE OA"],
    steps: [
      {
        title: "คลิก Segments → New Segment",
        content: "Segment Builder จะเปิดขึ้นมาพร้อมให้ตั้งชื่อ Segment",
      },
      {
        title: "เพิ่ม Rule แรก",
        content:
          "คลิก '+ Add Rule' เลือก Field (tag, follow_date, custom_field, follow_status) และกำหนดเงื่อนไข",
      },
      {
        title: "เพิ่ม Rules เพิ่มเติมด้วย AND/OR",
        content:
          "AND: ต้องตรงทุกเงื่อนไข | OR: ตรงเงื่อนไขใดก็ได้ คลิก '+ AND' หรือ '+ OR' เพื่อเพิ่ม rule",
      },
      {
        title: "ดู Preview Count",
        content:
          "จำนวน Followers ที่ตรงกับเงื่อนไขจะแสดงแบบ real-time ด้านขวา ช่วยให้เห็นขนาด Segment",
      },
      {
        title: "บันทึก Segment",
        content: "คลิก Save Segment — ชื่อ Segment จะพร้อมใช้ใน Broadcast Wizard",
      },
    ],
    commonMistakes: [
      "Preview Count แสดง 0 — ตรวจสอบว่า Tag หรือ Custom Field ที่อ้างอิงมีอยู่จริงใน Followers",
      "Segment ใหญ่เกินไป — ลอง AND เงื่อนไขเพิ่มเพื่อ narrow down กลุ่ม",
    ],
    faqs: [
      {
        q: "Segment อัปเดตอัตโนมัติไหม?",
        a: "ใช่ Segment ใช้ dynamic rules — เมื่อ Follower เปลี่ยนแปลง (เพิ่ม tag, เปลี่ยน custom field) สมาชิกของ Segment จะอัปเดตอัตโนมัติ",
      },
    ],
    nextAction: "ใช้ Segment นี้ส่ง Broadcast → /broadcasts",
    videoPlanned: false,
  },
  {
    id: "ai-chatbot",
    title: "ตั้งค่า AI Chatbot",
    icon: "🤖",
    summary:
      "ตั้งค่า AI Chatbot ให้ตอบลูกค้าอัตโนมัติ 24/7 และรองรับ Human Takeover เมื่อจำเป็น",
    estimatedTime: "20 นาที",
    prerequisites: [
      "มี API Key ของ LLM Provider (OpenAI หรือ Anthropic Claude)",
      "เชื่อมต่อ LINE OA แล้ว",
    ],
    steps: [
      {
        title: "ไปที่ Chatbot Settings",
        content:
          "คลิก 'Chatbot Settings' ในเมนู AI Chatbot เลือก LINE OA ที่ต้องการเปิดใช้ AI",
      },
      {
        title: "เลือก LLM Provider และกรอก API Key",
        content:
          "เลือก provider (เช่น OpenAI) เลือก Model (เช่น gpt-4o-mini) และกรอก API Key",
      },
      {
        title: "เขียน System Prompt",
        content:
          "System Prompt คือ 'บุคลิก' ของ AI เช่น: 'คุณคือ AI Assistant ของร้านกาแฟ ABC ตอบภาษาไทยสุภาพ ห้ามพูดถึงคู่แข่ง'",
      },
      {
        title: "เพิ่ม Knowledge Base",
        content:
          "ไปที่ Knowledge Base คลิก '+ Add Document' อัปโหลดหรือวาง FAQ, ข้อมูลสินค้า, และ Policy ของธุรกิจ AI จะใช้ข้อมูลนี้ตอบคำถาม",
      },
      {
        title: "ทดสอบใน Chat Inbox",
        content:
          "ส่งข้อความทดสอบไปยัง LINE OA AI จะตอบอัตโนมัติ ตรวจสอบคำตอบใน Chat Inbox",
      },
      {
        title: "Human Takeover เมื่อจำเป็น",
        content:
          "ใน Chat Sessions เมื่อต้องการตอบเอง คลิก 'Takeover' เพื่อรับการสนทนา AI จะหยุดตอบ เมื่อเสร็จแล้วคลิก 'Hand back to AI'",
      },
    ],
    commonMistakes: [
      "AI ตอบผิดหรือ hallucinate — เพิ่มข้อมูลใน Knowledge Base ให้ครบถ้วนกว่าเดิม",
      "AI ไม่ตอบเลย — ตรวจสอบ API Key และ Threshold ใน Chatbot Settings",
    ],
    faqs: [
      {
        q: "Unanswered Questions คืออะไร?",
        a: "คำถามที่ AI ตอบไม่ได้ด้วยความมั่นใจต่ำกว่า threshold จะถูกจัดเก็บใน queue นี้ Admin สามารถตอบเองและเพิ่ม FAQ ใน Knowledge Base",
      },
      {
        q: "ฉันสามารถใช้ AI กับหลาย OA ได้ไหม?",
        a: "ได้ ตั้งค่า Chatbot Settings แยกกันสำหรับแต่ละ LINE OA แต่ละ OA มี LLM config และ Knowledge Base เป็นของตัวเอง",
      },
    ],
    nextAction: "ดู Unanswered Questions และเพิ่ม FAQ → /unanswered-questions",
    videoPlanned: true,
  },
  {
    id: "auto-reply",
    title: "ตั้งค่า Auto-Reply",
    icon: "⚡",
    summary:
      "สร้างกฎตอบอัตโนมัติตาม keyword, follow event, และ postback — ทั้งข้อความและ Flex Message",
    estimatedTime: "12 นาที",
    prerequisites: ["เชื่อมต่อ LINE OA แล้ว"],
    steps: [
      {
        title: "ไปที่ Auto Reply",
        content: "คลิก 'Auto Reply' ในเมนูซ้ายมือ จะเห็นรายการ rules ทั้งหมด",
      },
      {
        title: "คลิก '+ Add Rule'",
        content:
          "เลือก Trigger Type: Keyword (เมื่อผู้ใช้พิมพ์ keyword), Follow (เมื่อ follow), Postback, หรือ Default (ไม่ตรง rule ใดเลย)",
      },
      {
        title: "ตั้งค่า Keyword (ถ้าเลือก Keyword trigger)",
        content:
          "เลือก Match Mode: Exact (ตรงทุกตัวอักษร), Contains (มีคำนี้อยู่), Prefix (ขึ้นต้นด้วย), Regex (Regular Expression)",
      },
      {
        title: "เขียนข้อความตอบกลับ",
        content:
          "เลือกประเภท Response: Text ธรรมดา หรือ Flex Message (เลือกจาก Template ที่สร้างไว้)",
      },
      {
        title: "บันทึกและทดสอบ",
        content:
          "กด Save แล้วส่งข้อความ trigger ไปยัง LINE OA เพื่อทดสอบว่า rule ทำงานถูกต้อง",
      },
    ],
    commonMistakes: [
      "Rule ไม่ทำงาน — ตรวจสอบว่า Match Mode ถูกต้อง เช่น 'สวัสดี' ด้วย Exact จะไม่ match 'สวัสดีครับ'",
      "มี rules หลายตัว conflict กัน — rules ที่อยู่บนสุดมี priority สูงกว่า ลาก-วางเพื่อเรียงลำดับ",
    ],
    faqs: [
      {
        q: "Default trigger คืออะไร?",
        a: "Default rule จะทำงานเมื่อข้อความของผู้ใช้ไม่ตรงกับ rule ใดเลย เหมาะสำหรับข้อความ 'ขอโทษ ฉันไม่เข้าใจคำถาม กรุณาพิมพ์ help เพื่อดูเมนู'",
      },
      {
        q: "ใช้ Regex ได้อย่างไร?",
        a: "เลือก Match Mode: Regex แล้วพิมพ์ pattern เช่น /สั่งซื้อ\\s*\\d+/ เพื่อ match 'สั่งซื้อ 100' — ระบบใช้ Go regex syntax",
      },
    ],
    nextAction: "สร้าง Flex Message เพื่อใช้ใน Auto-Reply → /flex-messages",
    videoPlanned: false,
  },
];

// ─── Cartoon Infographic: Connect LINE OA ───────────────────────────────────

const infographicSteps = [
  {
    num: 1,
    emoji: "🌐",
    title: "เปิด LINE Developers Console",
    desc: "ไปที่ developers.line.biz แล้วล็อกอินด้วยบัญชี LINE ของคุณ",
    tip: "ใช้บัญชี LINE เดียวกับที่สร้าง Official Account",
    bg: "from-sky-100 to-blue-100",
    border: "border-sky-200",
    num_bg: "bg-sky-500",
    tip_bg: "bg-sky-50 border-sky-200 text-sky-700",
  },
  {
    num: 2,
    emoji: "🔑",
    title: "หา 3 Credentials สำคัญ",
    desc: "Basic settings tab: Channel ID และ Channel Secret\nMessaging API tab: Channel Access Token (Long-lived)",
    tip: "ถ้ายังไม่มี Access Token ให้กด 'Issue' เพื่อสร้างใหม่",
    bg: "from-violet-100 to-purple-100",
    border: "border-violet-200",
    num_bg: "bg-violet-500",
    tip_bg: "bg-violet-50 border-violet-200 text-violet-700",
  },
  {
    num: 3,
    emoji: "🖱️",
    title: 'คลิก "+ Connect LINE OA" ใน BOLA',
    desc: 'เมนูซ้าย → LINE OA → ปุ่ม "+ Connect LINE OA" มุมขวาบน',
    bg: "from-emerald-100 to-green-100",
    border: "border-emerald-200",
    num_bg: "bg-emerald-500",
    tip_bg: "",
  },
  {
    num: 4,
    emoji: "📝",
    title: "กรอก Credentials ในฟอร์ม",
    desc: "ตั้งชื่อ OA แล้วใส่ Channel ID + Channel Secret + Access Token จากนั้นกด Connect",
    tip: 'ชื่อใช้แค่ใน BOLA เช่น "ร้านกาแฟ ABC" — ตั้งชื่ออะไรก็ได้',
    bg: "from-orange-100 to-amber-100",
    border: "border-orange-200",
    num_bg: "bg-orange-500",
    tip_bg: "bg-orange-50 border-orange-200 text-orange-700",
  },
  {
    num: 5,
    emoji: "✅",
    title: "Bot ID ปรากฏอัตโนมัติ!",
    desc: "BOLA จะดึง @botid ของคุณมาแสดงเป็น badge สีเขียวข้างชื่อ OA",
    tip: "ถ้าไม่เห็น badge สีเขียว = credentials ผิด — ลองตรวจสอบอีกครั้ง",
    bg: "from-teal-100 to-cyan-100",
    border: "border-teal-200",
    num_bg: "bg-teal-500",
    tip_bg: "bg-teal-50 border-teal-200 text-teal-700",
  },
  {
    num: 6,
    emoji: "🔗",
    title: "วาง Webhook URL ใน LINE Console",
    desc: "คัดลอก Webhook URL จาก BOLA → LINE Developers Console → Messaging API → ช่อง Webhook URL → กด Verify",
    tip: 'อย่าลืมเปิด "Use webhook" ด้วย มิฉะนั้นข้อความจะไม่ส่งมาที่ BOLA',
    bg: "from-pink-100 to-rose-100",
    border: "border-pink-200",
    num_bg: "bg-pink-500",
    tip_bg: "bg-pink-50 border-pink-200 text-pink-700",
  },
];

const infographicTroubleshooting = [
  { problem: "Bot ID ไม่ขึ้น", fix: "ตรวจสอบ Channel ID และ Channel Secret ให้ถูกต้อง" },
  { problem: "Webhook Verify ไม่ผ่าน", fix: "ตรวจสอบว่า server กำลังทำงาน และ URL ถูกต้อง" },
  { problem: "ข้อความไม่มาใน Chat Inbox", fix: 'เปิด "Use webhook" ใน LINE Console แล้วกด Verify อีกครั้ง' },
  { problem: "Access Token หมดอายุ", fix: "สร้าง Long-lived token ใหม่ใน LINE Developers Console" },
];

function ConnectLineOAInfographic() {
  return (
    <div className="space-y-0">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#06C755]/15 to-emerald-50 border-2 border-[#06C755]/30 p-5 flex items-center gap-4 mb-5">
        <div className="text-5xl select-none">🤝</div>
        <div className="flex-1">
          <p className="font-black text-lg text-gray-800">เชื่อมต่อ LINE OA เข้ากับ BOLA</p>
          <p className="text-sm text-gray-600 mt-0.5">ทำตาม 6 ขั้นตอนง่ายๆ เสร็จใน 5 นาที!</p>
        </div>
        <div className="text-3xl hidden sm:block select-none">⚡</div>
      </div>

      {/* Steps */}
      {infographicSteps.map((step, i) => (
        <div key={step.num}>
          {/* Step card */}
          <div className={`rounded-2xl bg-gradient-to-br ${step.bg} border-2 ${step.border} p-4 sm:p-5`}>
            <div className="flex items-start gap-4">
              {/* Step number */}
              <div className={`w-10 h-10 rounded-full ${step.num_bg} text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0 mt-0.5`}>
                {step.num}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl select-none">{step.emoji}</span>
                  <p className="font-bold text-gray-800 text-base leading-tight">{step.title}</p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{step.desc}</p>
                {step.tip && (
                  <div className={`mt-2.5 flex items-start gap-1.5 text-xs px-3 py-2 rounded-xl border ${step.tip_bg}`}>
                    <span className="flex-shrink-0 select-none mt-0.5">💡</span>
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connector arrow */}
          {i < infographicSteps.length - 1 && (
            <div className="flex justify-center py-0.5">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-gray-300" />
                <div className="text-gray-400 text-base leading-none select-none">▼</div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Arrow into celebration */}
      <div className="flex justify-center py-0.5">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-3 bg-gray-300" />
          <div className="text-gray-400 text-base leading-none select-none">▼</div>
        </div>
      </div>

      {/* Celebration card */}
      <div className="rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300 p-5 text-center">
        <div className="text-4xl mb-2 select-none">🎉</div>
        <p className="font-black text-xl text-gray-800">เชื่อมต่อสำเร็จแล้ว!</p>
        <p className="text-sm text-gray-600 mt-1">
          ส่งข้อความทดสอบไปยัง LINE OA ของคุณ<br />
          ข้อความจะปรากฏใน <strong>Chat Inbox</strong> ภายใน 2–3 วินาที
        </p>
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          {["✓ Webhook connected", "✓ Bot ID verified", "✓ Messages flowing"].map((tag) => (
            <span key={tag} className="bg-white border border-yellow-300 rounded-full px-3 py-1 text-xs text-yellow-700 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Troubleshooting quick ref */}
      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">🔧 ปัญหาที่พบบ่อย</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {infographicTroubleshooting.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs bg-white rounded-lg border border-gray-100 p-2.5">
              <span className="text-red-400 flex-shrink-0 mt-0.5 select-none">❌</span>
              <div>
                <p className="font-semibold text-gray-700">{item.problem}</p>
                <p className="text-gray-500 mt-0.5">→ {item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const HELPFUL_KEY = "bola_manual_helpful";

function getHelpfulState(sectionId: string): "up" | "down" | null {
  try {
    const data = JSON.parse(localStorage.getItem(HELPFUL_KEY) ?? "{}");
    return data[sectionId] ?? null;
  } catch {
    return null;
  }
}

function saveHelpfulState(sectionId: string, value: "up" | "down") {
  try {
    const data = JSON.parse(localStorage.getItem(HELPFUL_KEY) ?? "{}");
    data[sectionId] = value;
    localStorage.setItem(HELPFUL_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function UserManualPage() {
  const [activeId, setActiveId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    return s && manualSections.find((m) => m.id === s) ? s : "connect-line-oa";
  });
  const [search, setSearch] = useState("");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, "up" | "down" | null>>(() => {
    const result: Record<string, "up" | "down" | null> = {};
    manualSections.forEach((s) => {
      result[s.id] = getHelpfulState(s.id);
    });
    return result;
  });

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return manualSections;
    return manualSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.steps.some((st) => st.title.toLowerCase().includes(q) || st.content.toLowerCase().includes(q))
    );
  }, [search]);

  const activeSection = manualSections.find((s) => s.id === activeId) ?? manualSections[0];

  function vote(sectionId: string, value: "up" | "down") {
    saveHelpfulState(sectionId, value);
    setHelpfulVotes((prev) => ({ ...prev, [sectionId]: value }));
  }

  return (
    <AppLayout title="คู่มือการใช้งาน">
      <div className="flex gap-6 h-full min-h-0">
        {/* Left nav */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {/* Nav items */}
          <nav className="space-y-1">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => { setActiveId(section.id); setSearch(""); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeId === section.id
                    ? "bg-line text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{section.icon}</span>
                <span className="truncate">{section.title}</span>
                {activeId === section.id && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
              </button>
            ))}
          </nav>

          {search && filteredSections.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-4">ไม่พบหัวข้อ "{search}"</p>
          )}

          <div className="mt-auto pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <BookOpen size={12} />
              <span>{manualSections.length} หัวข้อ</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Mobile search */}
          <div className="relative mb-4 md:hidden">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาหัวข้อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Mobile nav chips */}
          <div className="flex gap-2 flex-wrap mb-4 md:hidden">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveId(s.id); setSearch(""); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeId === s.id ? "bg-line text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {s.icon} {s.title}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{activeSection.icon}</span>
                    <h1 className="text-xl font-semibold text-gray-900">{activeSection.title}</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeSection.summary}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">⏱ {activeSection.estimatedTime}</span>
                    {activeSection.videoPlanned && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Video size={10} />
                        Video tutorial planned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              {activeSection.prerequisites && activeSection.prerequisites.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-amber-800 mb-2">ก่อนเริ่มต้น</p>
                  <ul className="space-y-1">
                    {activeSection.prerequisites.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                        <span className="mt-0.5">□</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps or Infographic */}
              {activeSection.infographic ? (
                <div className="mb-6">
                  <ConnectLineOAInfographic />
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">ขั้นตอน</h2>
                  <ol className="space-y-4">
                    {activeSection.steps.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-line text-white text-sm font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div className="pt-0.5">
                          <p className="text-sm font-medium text-gray-800">{step.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{step.content}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Common mistakes */}
              {activeSection.commonMistakes && activeSection.commonMistakes.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-3">ข้อผิดพลาดที่พบบ่อย</h2>
                  <ul className="space-y-2">
                    {activeSection.commonMistakes.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              {activeSection.faqs && activeSection.faqs.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-3">คำถามที่พบบ่อย</h2>
                  <div className="space-y-3">
                    {activeSection.faqs.map((faq, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-800">❓ {faq.q}</p>
                        <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next action */}
              {activeSection.nextAction && (
                <div className="bg-line/5 border border-line/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-line flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">ขั้นตอนต่อไป: </span>
                      {activeSection.nextAction}
                    </p>
                  </div>
                </div>
              )}

              {/* Was this helpful */}
              <div className="border-t pt-5 flex items-center gap-4">
                <p className="text-sm text-muted-foreground">บทความนี้มีประโยชน์ไหม?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => vote(activeSection.id, "up")}
                    title="มีประโยชน์"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      helpfulVotes[activeSection.id] === "up"
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span>มีประโยชน์</span>
                  </button>
                  <button
                    onClick={() => vote(activeSection.id, "down")}
                    title="ไม่มีประโยชน์"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      helpfulVotes[activeSection.id] === "down"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsDown size={14} />
                    <span>ปรับปรุงได้</span>
                  </button>
                </div>
                {helpfulVotes[activeSection.id] && (
                  <span className="text-xs text-muted-foreground">ขอบคุณสำหรับ feedback!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}
