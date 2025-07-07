# คู่มือใช้งาน Workflow ประมวลผลไฟล์ธนาคารอัตโนมัติ (สำหรับผู้ใช้ทั่วไป)

เอกสารนี้ช่วยให้คุณติดตั้งและใช้งานระบบอัตโนมัติบน n8n ได้โดยไม่ต้องเขียนโค้ดเอง มาดูขั้นตอนกันเลย:

---

## Quick Start (ใช้งานทันที)

1. **ติดตั้งโปรแกรมหลัก**

   * ติดตั้ง **Node.js (v14+):**

     1. ดาวน์โหลดจาก [https://nodejs.org](https://nodejs.org) ▶️ เลือก LTS ▶️ กด Next → Next → Finish
     2. ติดตั้งลงใน `C:\Program Files\nodejs`
   * ติดตั้ง **WinRAR:**

     1. ดาวน์โหลดจาก [https://www.win-rar.com](https://www.win-rar.com) ▶️ กด Install
     2. ติดตั้งลงใน `C:\Program Files\WinRAR`
   * **เตรียมโฟลเดอร์ Extractor API:**

     1. สร้างโฟลเดอร์ `C:\extract_api`
     2. วางไฟล์ `server.js` (และ `extract.py` ถ้ามี) ลงในโฟลเดอร์นี้

2. **ติดตั้ง dependencies ของ Extractor API**
   เปิด Command Prompt พิมพ์:

   ```powershell
   cd C:\extract_api
   npm install
   ```

3. **ตั้งค่าเชื่อมต่อ Gmail ใน n8n**

   1. เปิด **n8n Desktop**
   2. เข้าเมนู **Credentials → Gmail OAuth2**
   3. วาง **Client ID** และ **Client Secret** (ได้จาก Google Cloud[https://console.cloud.google.com/apis/credentials/oauthclient])
   4. กด **Connect** เลือกบัญชี `ccibauto@gmail.com` แล้วกด **Allow**

4. **สตาร์ท Extractor API**
   ใน Command Prompt พิมพ์:

   ```powershell
   cd C:\extract_api
   node server.js
   ```

   ถ้าถูกต้องจะเห็น “Extractor API running on port 3000”

5. **ทดสอบว่า API ทำงาน**

   ```powershell
   curl http://localhost:3000/ping    # ควรตอบ pong
   curl -X POST http://localhost:3000/extract \
     -F file=@C:\extract_api\test.zip \
     -F password=test01
   ```

   * `/ping` ต้องขึ้น pong
   * `/extract` ต้องคืน JSON `{ "success": true, ... }` และแตกไฟล์ลง `C:\extract_api\unzipped`

6. **(ถ้าต้องการใช้งานระยะไกล) ตั้งค่า ngrok**

   1. ดาวน์โหลด ngrok จาก [https://ngrok.com/download](https://ngrok.com/download) ▶️ แตก ZIP แล้ววาง `ngrok.exe` ไว้ที่ชื่อโฟลเดอร์ เช่น `C:\Tools\ngrok`
   2. เปิด Command Prompt ไปที่โฟลเดอร์นั้น พิมพ์:

      ```powershell
      ngrok http 3000
      ```
   3. คัดลอก **Forwarding URL** ที่ได้ เช่น `https://abcd1234.ngrok.io`
   4. ใน **HTTP Request** node ของ n8n เปลี่ยน URL เป็น:

      ```text
      https://abcd1234.ngrok.io/extract
      ```

7. **ติดตั้ง n8n (Global)**

   ```powershell
   npm install n8n -g
   ```

8. **สตาร์ท n8n**

   ```powershell
   n8n start
   ```

   * เปิดเบราว์เซอร์ไปที่ `http://localhost:5678`
   * คลิก **Import** แล้วเลือก `bbl_workflow.json`

---

## โครงสร้างโฟลเดอร์บนเครื่องของคุณ

```
C:\extract_api\
  ├ server.js          # API ถอดรหัสและแตก ZIP
  ├ extract.py        # (ถ้ามี) สคริปต์ Python
  ├ uploads\          # เก็บ ZIP ชั่วคราว
  └ unzipped\         # เก็บโฟลเดอร์ย่อยที่แตก

C:\BBL_merge\         # เก็บไฟล์ CSV รวมผลลัพธ์
bbl_workflow.json      # Workflow สำหรับนำเข้าใน n8n
README.md              # คู่มือนี้
```

---

## ขั้นตอนการทำงานของ Workflow

1. **Gmail Trigger** รออีเมลจาก `@bangkokbank.com` หัวข้อมี `CCIB002`
2. **Only Zip** (Code) เลือกไฟล์ ZIP ใน Attachment
3. **HTTP Request** ส่งไฟล์ ZIP + รหัสผ่านไปที่ Extractor API
4. **Read Files from Disk** อ่านทุกไฟล์ `.xls` ในโฟลเดอร์ย่อยของ `unzipped`
5. **Spreadsheet File** แปลงแต่ละไฟล์เป็น JSON rows
6. **Merge** รวมทุกแถวเข้าด้วยกัน
7. **Convert to CSV** สร้างไฟล์ CSV เดียวจาก JSON
8. **File Name** (Code) สร้างชื่อไฟล์ใหม่ตามรูปแบบ `CCIB002_YYYY-MM-DD.csv`
9. **Write Binary File** บันทึกไฟล์ CSV ที่ `C:\BBL_merge`

---

## แก้ไขปัญหาพื้นฐาน

* **API ไม่ตอบ ping**: ตรวจสอบว่า `node server.js` รันอยู่ และ Firewall อนุญาต
* **ไม่เห็นไฟล์ .xls**: ยืนยันว่า ZIP มีไฟล์ `.xls` และแตกถูกโฟลเดอร์ `unzipped`
* **OAuth 403 Forbidden**: รอสัก 1–2 นาทีหลังเปิด Gmail API และตรวจ Test user
* **UI ค้าง**: หลีกเลี่ยงการคลิกดู JSON จำนวนมาก รอจน workflow เสร็จหรือใช้วิธี Merge บนดิสก์

---

*ปรับเส้นทางและพอร์ตตามสภาพแวดล้อมของคุณ*
