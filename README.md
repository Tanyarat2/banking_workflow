# คู่มือใช้งาน Workflow Merge File

---
## สิ่งที่ต้องมี
1. Node.js (v14 ขึ้นไป)  ดาวน์โหลดตัวติดตั้งจาก https://nodejs.org ▶️ เลือก LTS ▶️ ติดตั้ง
2. WinRAR/7z  ดาวน์โหลดจาก https://www.win-rar.com / https://www.7-zip.org/download.html ▶️ ติดตั้ง
3. n8n Desktop -> run in command prompt [npm install n8n -g]
4. บัญชี Gmail [ccibauto@gmail.com (pass = automatic05)]  (ใช้สำหรับเชื่อมต่อ Gmail API)
5. ไฟล์ Workflowจากgithub  (bbl_workflow.json)  และ ไฟล์ API (server.js และ merge.py)
6. ngrok(ถ้าใช้http://localhost.3000/extractไม่ได้) ดาวน์โหลดจาก https://ngrok.com/download ▶️ แตก ZIP แล้ววาง ngrok.exe ในextract_api

## Step-by-Step

1. **ติดตั้ง dependencies ของ Extractor API**
   เปิด Command Prompt พิมพ์:

   ```powershell
   cd C:\extract_api [copy จาก file pathที่save]
   npm install
   ```
   
2. **สตาร์ท Extractor API**
   ใน Command Prompt พิมพ์:

   ```powershell
   cd C:\extract_api [copy จาก file pathที่save]
   node server.js
   ```

   ถ้าถูกต้องจะเห็น “Extractor API running on port 3000”
   ใช้ url = http://localhost:3000

 **ทดสอบว่า API ทำงาน**
 *สร้างไฟล์test.zipที่มีรหัสผ่านแล้วลอง
   ```powershell
   curl http://localhost:3000/ping    # ควรตอบ pong
   curl -X POST http://localhost:3000/extract -F "file=@C:\extract_api\test.zip" -F "password=CCIB5002"
   ```

   * `/ping` ต้องขึ้น pong
   * `/extract` ต้องคืน JSON `{ "success": true, ... }` และแตกไฟล์ลง `C:\extract_api\unzipped`

3. **สตาร์ท n8n in command prompt**

   ```powershell
   n8n
   ```
   
4. **ตั้งค่าเชื่อมต่อ Gmail ใน n8n**

   1. เปิด **n8n Desktop**
   2. เข้าเมนู **Credentials ในnodegmail trigger → Gmail account**
   3. วาง **Client ID** และ **Client Secret** (ได้จาก Google Cloud[https://console.cloud.google.com/apis/credentials/oauthclient])
      `[Client ID = 93697660957-rhu9b3na3bapdeko9dd733durbo20tnu.apps.googleusercontent.com], [Client Secret = OCSPX-yaAcM0XfXIsOxhl38cqJq84ywJSu]`
   4.. กด **Connect** เลือกบัญชี `ccibauto@gmail.com` แล้วกด **Allow**

5. **ngrok(ถ้าใช้ http://localhost:3000/extract ในnode unzip with pass ไม่ได้)**

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


   * เปิดเบราว์เซอร์ไปที่ `http://localhost:5678`
   * คลิก **Import** แล้วเลือก `bbl_workflow.json`

---

## โครงสร้างโฟลเดอร์บนเครื่อง

```
C:\extract_api\
  ├ node_modules\      # เก็บ code libraries
  ├ unzipped\          # เก็บโฟลเดอร์ย่อยที่แตก
  ├ uploads\           # เก็บ ZIP ที่จะแตก
  ├ merge.py           # โค้ดสำหรับรวมไฟล์
  ├ ngrok.exe          # ไฟล์สำหรับserver ถ้าเปิดlocalhostไม่ได้
  ├ package.json       # บอกชื่อขเวอร์ชั่นม สคริปที่รัน
  ├ package-lock.json  # libraries ได้เมื่อรัน npm start
  └ server.js          # API ถอดรหัสและแตก ZIP


C:\BBL_merge\         # เก็บไฟล์ CSV รวมผลลัพธ์
bbl_workflow.json      # Workflow สำหรับนำเข้าใน n8n
README.md              # คู่มือนี้
```
## สรุปการใช้หลังการติดตั้งเหมือนโฟลเดอร์ด้านบน
1. command prompt -> cd [extract_api path]
2. new command prompt -> n8n
3. ถ้าn8n server มีปัญหาให้ใช้ ngrok -> new command promt -> ngrok http 3000 -> copy&paste forwarding in n8n[unzip with file]
4. run workflow ใน n8n
---

## ขั้นตอนการทำงานของ Workflow

1. **Gmail Trigger**  
   - รออีเมลใหม่ใน `INBOX/UNREAD` หัวข้อมีคำว่า `CCIB002`  

2. **Get Many Messages**  
   - ดึงรายการ Message IDs ของอีเมลที่ Trigger ส่งมา (Return All)  

3. **Get Message**  
   - ดึงเนื้อหาเมลฉบับเต็มและดาวน์โหลดทุก Attachment  

4. **Only Zip (Function)**  
   - กรองเฉพาะไฟล์แนบที่มีนามสกุล `.zip`  

5. **Unzip with Pass (HTTP Request)**  
   - ส่งไฟล์ ZIP พร้อมรหัสผ่านไปที่ Extractor API เพื่อแตกไฟล์  

6. **Merge File (Execute Command)**  
   - รันสคริปต์ Python รวมไฟล์ `.xls` ทั้งหมดในโฟลเดอร์ที่แตกออกมาเป็น CSV ไฟล์เดียว ต่อ 1 ZIP  

---


## แก้ไขปัญหาพื้นฐาน

* **run codeไม่ได้**: ตรวจสอบว่า `file path` ถูกรึเปล่าทั้งcommand prompt, n8n, code[ดูตรงfile path check]
* **API ไม่ตอบ ping**: ตรวจสอบว่า `node server.js` รันอยู่ และ Firewall อนุญาต
* **ไม่เห็นไฟล์ .xls**: ยืนยันว่า ZIP มีไฟล์ `.xls` และแตกถูกโฟลเดอร์ `unzipped`
* **OAuth 403 Forbidden**: รอสัก 1–2 นาทีหลังเปิด Gmail API และตรวจ Test user
* **server มีปัญหาให้ลองในcommand promptก่อน ถ้าไม่ได้จริงๆให้ลองดู urlในnode unzip with pass -> [(http://localhost:3000), (http://<YOUR_MACHINE_IP>:3000/ping (find with ipconfig)), ( (EXP)https://1e2a7aca582c.ngrok-free.app/extract)]

---
## Run แบบไม่ใช้n8n
1. command prompt -> cd C:\extract_api [copy จาก file pathที่save]
2. npm install
3. node server.js
4. new command prompt -> pip install pandas xlrd
5. python merge.py "C:\extract_api\unzipped"[copy จาก file pathที่save]
6. ตรวจสอบ dir C:\BBL_merge

---
## Run n8n ตลอด
```powershell
   npm install -g pm2
   pm2 start n8n --name n8n
   pm2 save
   pm2 startup    
```
## Run server.js ตลอด
```powershell
   cd C:\extract_api [copy จาก file pathที่save]
   pm2 start server.js --name extract_api
   pm2 save
   pm2 startup
```
```powershell
   pm2 list         # ดูสถานะ
   pm2 logs extract_api   # ดู log
   pm2 restart extract_api   # รีสตาร์ท
   pm2 stop extract_api      # หยุด
```
