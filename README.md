# banking_workflow

# คู่มือใช้งาน Workflow ประมวลผลไฟล์ธนาคารอัตโนมัติ (สำหรับผู้ใช้ทั่วไป)

เอกสารนี้สำหรับผู้เริ่มต้น ช่วยตั้งค่าและใช้งานระบบให้อัตโนมัติครบจบในที่เดียว

---

## Quick Start (ใช้งานทันที)

1. **ติดตั้งโปรแกรมหลัก**

   * ติดตั้ง **Node.js** (v14+): ดาวน์โหลดจาก [https://nodejs.org](https://nodejs.org) ▶️ เลือก LTS ▶️ ติดตั้ง (ไปที่ `C:\Program Files\nodejs`)
   * ติดตั้ง **WinRAR**: ดาวน์โหลดจาก [https://www.win-rar.com](https://www.win-rar.com) ▶️ ติดตั้ง (ไปที่ `C:\Program Files\WinRAR`)
   * สร้างโฟลเดอร์ `C:\extract_api` แล้ววางไฟล์ **server.js** (และ **extract.py** ถ้ามี) ลงในนั้น

2. **ติดตั้ง dependencies**

   ```powershell
   cd C:\extract_api
   npm install
   ```

3. **เชื่อมต่อ Gmail ใน n8n**

   * เปิด **n8n Desktop** ▶️ **Credentials → Gmail OAuth2**
   * วาง **Client ID** และ **Client Secret** (ที่ได้จาก Google Cloud)
   * กด **Connect** แล้วอนุญาตด้วยบัญชี `ccibauto@gmail.com`

4. **สตาร์ท Extractor API**

   ```powershell
   cd C:\extract_api
   node server.js
   ```

   * ถ้ามีข้อความ `Extractor API running on port 3000` แปลว่าพร้อม

5. **ทดสอบว่า API ทำงาน**

   ```powershell
   curl -X POST http://localhost:3000/ping
   curl -X POST http://localhost:3000/extract `
     -F file=@C:\extract_api\test.zip `
     -F password=test01
   ```

   * `curl /ping` ควรตอบ `pong`
   * `/extract` ควรได้ JSON `{ "success": true, ... }` และไฟล์แตกลง `C:\extract_api\unzipped`

6. **ติดตั้ง n8n Global**

   ```powershell
   npm install n8n -g
   ```

7. **สตาร์ท n8n**

   ```powershell
   n8n start
   ```

   * เปิดเบราเซอร์ไปที่ `http://localhost:5678` ▶️ **Import** ไฟล์ `bbl_workflow.json`

---

## โครงสร้างโฟลเดอร์

```
C:\extract_api\
  ├ server.js         # API ถอดรหัสและแตก ZIP
  ├ extract.py       # (ถ้ามี) สคริปต์ Python
  ├ uploads\         # เก็บ ZIP ชั่วคราว
  └ unzipped\        # เก็บโฟลเดอร์ผลลัพธ์

C:\BBL_merge\        # เก็บไฟล์ CSV รวมผลลัพธ์
bbl_workflow.json     # Workflow สำหรับนำเข้าใน n8n
README.md             # คู่มือนี้
```

---

## การใช้งาน Workflow

* **Gmail Trigger**: รออีเมลจาก `@bangkokbank.com` หัวข้อมี `CCIB002`
* **Only Zip** (Code): เลือกเฉพาะไฟล์ .zip ใน Attachment
* **HTTP Request**: ส่งไฟล์และรหัสผ่านไปที่ `http://localhost:3000/extract`
* **Read Files from Disk**: อ่านทุกไฟล์ `*.xls` ในโฟลเดอร์ย่อยของ `unzipped`
* **Spreadsheet File**: เปลี่ยนเป็น JSON, Merge, สร้าง CSV เดียว
* **Write Binary File**: บันทึก CSV ที่ `C:\BBL_merge\CCIB002_YYYY-MM-DD.csv`

---

## แก้ไขปัญหาเบื้องต้น

* **API ไม่ตอบ ping**: ตรวจสอบว่า `node server.js` รันอยู่และ Firewall อนุญาต
* **ไม่เห็นไฟล์ .xls**: ยืนยัน ZIP มีไฟล์ .xls, แตกถูกโฟลเดอร์
* **OAuth 403 Forbidden**: รอหลังเปิด Gmail API 1–2 นาที และตรวจ Test user
* **Workflow ค้าง**: อย่าเปิดดู JSON จำนวนมาก รอจนเสร็จแล้วเปิดไฟล์ผลลัพธ์

---

*ปรับตามเส้นทางและพอร์ตจริงของคุณ หากใช้ ngrok ให้เปลี่ยน URL ใน HTTP Request*
