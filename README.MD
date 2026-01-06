# MasterGym – Admin (Backend + UI)

Sistema de gestión de membresías para gimnasio (modo admin).  
Stack: **Java 21 + Spring Boot + PostgreSQL + Next.js (React)**.

---

## Requisitos (versiones recomendadas)

### Backend
- **Java (JDK)**: Eclipse Temurin / OpenJDK **21.0.9 LTS**
- **Gradle**: se usa **Gradle Wrapper** (incluido en el repo) → no instalar Gradle manualmente
- El instalador ajusta `JAVA_HOME` de forma permanente para el usuario si es necesario.

### Frontend (UI)
- **Node.js**: **v22.18.0 (o 20.x LTS)**
- **npm**: **10.9.3**
- **Next.js**: **16.0.10**
- **React**: **19.2.1**
- **TypeScript**: **5.9.3**

### Base de datos
- **PostgreSQL**: recomendado **18**
- **pgAdmin 4**: (opcional, para ver datos visualmente) – versión usada: 9.9

---

## Estructura del repo

Master-Gym/
├─ backend/ # Spring Boot + PostgreSQL
└─ ui/ # Next.js (Admin UI)

yaml
Copiar código

---

## 1) Base de datos (PostgreSQL)

Crear una base de datos llamada:

- `mastergym_dev`

En pgAdmin:
- Databases → Create → Database → nombre: `mastergym_dev`

> Nota: el usuario/contraseña se configuran en `backend/src/main/resources/application.properties`.

---

## 2) Instalacion manual (una sola vez)

1) Configurar variables del backend (recomendado, evita credenciales hardcodeadas):

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mastergym_dev"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="TU_PASSWORD"
```

2) Build del frontend:

```powershell
cd .\ui
npm install
npm run build
```

3) Build del backend:

```powershell
cd ..\backend
.\gradlew.bat bootJar
```

4) Crear el icono del escritorio (toggle):

```powershell
cd ..\
powershell -ExecutionPolicy Bypass -File launcher\Create-DesktopShortcut.ps1
```

## 3) Uso diario (cliente)

- Doble clic en el icono "MasterGym": enciende y abre el navegador.
- Segundo clic: apaga la app.
- Si no abre, revisar `logs/backend.log` y `logs/ui.log`.

---

## Nuevas variables de entorno (recomendado)

### UI (Next.js)
Crear `ui/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Backend (Spring Boot)
Evitar credenciales hardcodeadas en el repo y usar variables:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mastergym_dev"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="TU_PASSWORD"
$env:CORS_ALLOWED_ORIGINS="http://localhost:3000"
```

---

## Pagos (API)

Recorda enviar `Authorization: Bearer <TOKEN>` en cada request a `/api/**`.

- `POST /api/payments`
- `GET /api/payments?page=0&size=50&sort=paymentDate,desc`
- `GET /api/payments?clientId=123&page=0&size=50`
- `PUT /api/payments/{id}`
- `DELETE /api/payments/{id}`

UI: `http://localhost:3000/payments`

---

## Seguridad (local)

- Mantener `server.address=127.0.0.1` para evitar acceso en LAN.
- Usar un usuario de DB con permisos minimos (no superuser).
- Rotar credenciales periodicamente y mantener `.env` fuera de git.
