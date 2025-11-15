Để chạy toàn bộ dự án này, bạn cần chạy đồng thời cả **Backend** và **Frontend**. Bạn sẽ cần mở 2 cửa sổ terminal riêng biệt.

---

### 1. Chạy Backend (FastAPI)

Mở một cửa sổ terminal:

**a. Di chuyển vào thư mục `backend`:**

```bash
cd backend
```

**b. Kích hoạt môi trường ảo (rất khuyến khích):**

Tạo môi trường ảo (chỉ cần làm lần đầu):
```bash
python3 -m venv venv
```
Kích hoạt môi trường ảo:
*   **Trên macOS/Linux:**
    ```bash
    source venv/bin/activate
    ```
*   **Trên Windows (Command Prompt):**
    ```bash
    .\venv\Scripts\activate
    ```
*   **Trên Windows (PowerShell):**
    ```bash
    .\venv\Scripts\Activate.ps1
    ```

**c. Cài đặt các thư viện cần thiết:**

Trong khi môi trường ảo đang hoạt động, chạy lệnh sau để cài đặt các dependency từ file `requirements.txt`:

```bash
pip install -r requirements.txt
```
(Các thư viện đã được liệt kê trong `requirements.txt` là đủ cho các chức năng hiện tại của backend: `fastapi`, `uvicorn[standard]`, `python-dotenv`, `pydantic`).

**d. Chạy server:**

Trong khi môi trường ảo đang hoạt động, chạy lệnh sau để khởi động FastAPI server:

```bash
uvicorn main:app --reload
```
Server sẽ chạy trên `http://127.0.0.1:8000` (hoặc một cổng khác nếu 8000 đã được sử dụng). Bạn sẽ thấy output tương tự như:
```
INFO:     Will watch for changes in these directories: ['/Users/lekhang/Documents/BTCK/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

### 2. Chạy Frontend (React)

Mở **một cửa sổ terminal MỚI** (không đóng terminal đang chạy backend):

**a. Di chuyển vào thư mục `frontend`:**

```bash
cd frontend
```

**b. Cài đặt các thư viện cần thiết:**

```bash
npm install
```

**c. Chạy development server:**

```bash
npm run dev
```
Server sẽ chạy trên `http://localhost:5173` (hoặc một cổng khác). Bạn sẽ thấy output tương tự như:
```
  VITE v5.0.12  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### 3. Truy cập ứng dụng

Mở trình duyệt web của bạn và truy cập vào địa chỉ mà frontend development server cung cấp (thường là `http://localhost:5173`).

Nếu bạn gặp bất kỳ lỗi nào trong quá trình chạy, hãy chụp lại toàn bộ output từ terminal và gửi cho tôi để tôi có thể hỗ trợ bạn debug.
