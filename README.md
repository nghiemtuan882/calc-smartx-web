# Calc SmartX – website giới thiệu

Trang giới thiệu ứng dụng **Calc SmartX** bằng 12 ngôn ngữ: Tiếng Việt, English, 中文, 日本語, 한국어, Español, Português, Français, Deutsch, Русский, ไทย, Bahasa Indonesia.

Địa chỉ: https://nghiemtuan882.github.io/calc-smartx-web/ (tiếng Việt ở trang gốc, các ngôn ngữ khác ở `/en/`, `/ja/`, …).

Giao diện dùng theme **Cobalt** của [Hallmark](https://github.com/Nutlope/hallmark) (giấy trắng xanh, chữ Familjen Grotesk / IBM Plex Sans, nút dạng phím bấm, nền ký tự số).

## Tự động xuất bản

Mỗi lần có thay đổi trên nhánh `main`, GitHub Actions (`.github/workflows/deploy.yml`) tự chạy `node tools/build.mjs`, tạo 12 trang trong `dist/` rồi đẩy lên nhánh `gh-pages`. GitHub Pages phục vụ nhánh `gh-pages`. Không cần cài gì thêm.

Nếu thiếu chữ hoặc thiếu GIF của một ngôn ngữ, bước build báo lỗi và không xuất bản.

## Cấu trúc

| Thư mục / file | Nội dung |
|---|---|
| `content/site.json` | Chữ riêng của website, 12 ngôn ngữ |
| `content/app-strings.json` | Chữ lấy từ chính ứng dụng: tên + mô tả 15 tính năng, nhãn ví dụ, dấu phân cách số |
| `tools/examples.json` | Bảng tính ví dụ cho từng ngôn ngữ (đơn giá, thuế, số đợt, tiền tệ) |
| `static/gif/<ngôn ngữ>-<tính năng>.gif` | 180 GIF (15 tính năng × 12 ngôn ngữ), quay từ hoạt cảnh có sẵn trong app |
| `static/shots/<ngôn ngữ>.webp` | Ảnh chụp app thật với bảng ví dụ của ngôn ngữ đó |
| `static/css/` | `tokens.css`, `base.css` (Hallmark Cobalt) và `site.css` |
| `static/js/site.js` | Bảng tính chạy thử ở đầu trang, nền ký tự, chọn ngôn ngữ |
| `tools/build.mjs` | Tạo trang, sitemap, hreflang |

## Sửa nội dung

- Đổi chữ: sửa `content/site.json` (hoặc `content/app-strings.json`), đẩy lên `main` là trang tự cập nhật.
- Thêm ngôn ngữ: thêm mục mới vào cả `site.json`, `app-strings.json`, `examples.json`, rồi quay GIF và ảnh cho ngôn ngữ đó.

## Quay lại GIF và ảnh chụp (khi app có bản mới)

Cần Node 18+, Google Chrome, Playwright và ffmpeg trên máy. File `index.html` của app không nằm trong kho này.

```bash
node tools/shoot.mjs  /đường/dẫn/index.html   # ảnh chụp bảng ví dụ, 12 ngôn ngữ
node tools/record.mjs /đường/dẫn/index.html   # 180 GIF tính năng
```

Xem trước trên máy: `node tools/build.mjs` rồi mở `dist/index.html`.
