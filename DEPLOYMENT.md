# Deployment

Kiến trúc, CI/CD, secret, backup/restore, troubleshooting đầy đủ nằm ở
tài liệu bên repo backend:
`https://github.com/ngocha3792/Quan-ly-blog/blob/develop/DEPLOYMENT.md`

(Container `frontend` chạy trong compose project của repo backend — cả
hai repo cùng deploy vào một VPS.)

## Riêng cho frontend

- `Dockerfile` build Angular SSR (`ng build` mode `server`), runtime chạy
  `node dist/blog-frontend/server/server.mjs` (Express + `@angular/ssr`),
  lắng nghe `PORT` (mặc định 4000).
- `src/environments/environment.prod.ts` chứa `apiUrl` trỏ về backend
  production (`http://103.72.57.142/api/v1`). File này được chọn qua
  `fileReplacements` trong `angular.json` (config `production`), không
  ảnh hưởng `environment.ts` dùng cho `ng serve` local.
- `angular.json` → `security.allowedHosts` **phải** liệt kê đúng host sẽ
  dùng để truy cập (IP hoặc domain). Để rỗng (`[]`) khiến Angular SSR từ
  chối mọi `Host` header thật, tự fallback về client-side rendering hôm
  nay và sẽ thành lỗi `400` cứng ở bản Angular sau — đây là cơ chế chống
  SSRF của `@angular/ssr`, không phải bug.
- CI: `.github/workflows/deploy-frontend.yml`, cần secret `DEPLOY_SSH_KEY`
  giống hệt bên repo backend (xem hướng dẫn setup ở tài liệu backend).
