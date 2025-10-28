# Railway Counter App

Aplicación full-stack sencilla pensada para desplegarse en Railway. El backend usa Spring Boot y expone un contador en memoria que puede incrementarse o decrementarse. El frontend está construido con React (Vite) y consume la API para mostrar un número central acompañado de una imagen y controles para modificar su valor.

## Estructura del proyecto

- `backend/`: servicio Spring Boot con los endpoints REST `GET /api/counter`, `POST /api/counter/increment` y `POST /api/counter/decrement`.
- `frontend/`: interfaz React con Vite que muestra la imagen central, el valor actual y botones para sumar o restar 1, 5 y 10.

## Scripts útiles

### Backend

```bash
cd backend
./mvnw spring-boot:run # si el wrapper está disponible
# o usando Maven instalado
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Durante el desarrollo, la configuración de Vite redirige las peticiones a `/api` hacia el backend que corre en `http://localhost:8080`.
