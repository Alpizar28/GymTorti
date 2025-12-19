# MasterGym – Admin (Backend + UI)

Sistema de gestión de membresías para gimnasio (modo admin).  
Stack: **Java 21 + Spring Boot + PostgreSQL + Next.js (React)**.

---

## Requisitos (versiones recomendadas)

### Backend
- **Java (JDK)**: Eclipse Temurin / OpenJDK **21.0.9 LTS**
- **Gradle**: se usa **Gradle Wrapper** (incluido en el repo) → no instalar Gradle manualmente

### Frontend (UI)
- **Node.js**: **v22.18.0**
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

## 2) Ejecutar BACKEND (Spring Boot)

Abrir terminal en:

```powershell
cd .\backend
Configurar variables (recomendado, evita credenciales hardcodeadas):

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/mastergym_dev"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="TU_PASSWORD"
```

Ejecutar:

powershell
Copiar código
.\gradlew.bat bootRun
Backend corre en:

http://localhost:8080

Prueba rápida (Thunder/Postman):

GET http://localhost:8080/api/clients?page=0&size=50
Header: X-GYM-ID: 1

3) Ejecutar UI (Next.js)
Abrir OTRA terminal en:

powershell
Copiar código
cd .\ui
Instalar dependencias (solo la primera vez):

powershell
Copiar código
npm install
Correr en modo dev:

powershell
Copiar código
npm run dev
UI corre en:

http://localhost:3000

Pantalla de clientes:

http://localhost:3000/clients

Variables de entorno (UI)
Opcional: crear archivo ui/.env.local:

env
Copiar código
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
Comandos útiles
Backend
Ejecutar:

powershell
Copiar código
.\gradlew.bat bootRun
Limpiar y ejecutar:

powershell
Copiar código
.\gradlew.bat clean bootRun
UI
Instalar:

powershell
Copiar código
npm install
Dev server:

powershell
Copiar código
npm run dev
Problemas comunes
UI no conecta con backend (Failed to fetch / CORS)
Confirmar backend corriendo en localhost:8080

Confirmar UI corriendo en localhost:3000

Confirmar que el controller del backend permite CORS (temporalmente está abierto)

Base de datos no conecta
Verificar que PostgreSQL esté corriendo

Revisar credenciales en:
backend/src/main/resources/application.properties

Versiones del ambiente (referencia)
Java: openjdk 21.0.9 2025-10-21 LTS

Gradle (wrapper): 9.2.1

Node: v22.18.0

npm: 10.9.3

next: 16.0.10

react: 19.2.1

typescript: 5.9.3

---

## Nuevas variables de entorno (recomendado)

### UI (Next.js)
Crear `ui/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GYM_ID=1
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

Recordá enviar `X-GYM-ID` en cada request a `/api/**`.

- `POST /api/payments`
- `GET /api/payments?page=0&size=50&sort=paymentDate,desc`
- `GET /api/payments?clientId=123&page=0&size=50`
- `PUT /api/payments/{id}`
- `DELETE /api/payments/{id}`

UI: `http://localhost:3000/payments`
