# Railway Counter App

Aplicación full-stack sencilla pensada para desplegarse en Railway. El backend usa Spring Boot y expone un contador en memoria que puede incrementarse o decrementarse. El frontend está construido con React (Vite) y consume la API para mostrar un número central acompañado de una imagen y controles para modificar su valor.

## Estructura del proyecto

- `backend/`: servicio Spring Boot con los endpoints REST `GET /api/counter`, `POST /api/counter/increment` y `POST /api/counter/decrement`.
- `frontend/`: interfaz React con Vite que muestra la imagen central, el valor actual y botones para sumar o restar 1, 5 y 10.

## Puesta en marcha rápida

```bash
./start.sh
```

El script construye el frontend, copia los archivos generados al backend, compila el JAR de Spring Boot y ejecuta la aplicación en `http://localhost:8080`.

## Despliegue con Docker

Se incluye un `Dockerfile` multi-stage que combina el frontend y el backend en una sola imagen lista para producción.

```bash
# Construir la imagen
docker build -t railway-counter .

# Ejecutar el contenedor
docker run -p 8080:8080 railway-counter
```

Esto compilará el frontend, lo incluirá como recursos estáticos dentro del JAR de Spring Boot y expondrá la aplicación desde el contenedor en el puerto 8080.

## Scripts útiles durante el desarrollo

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Durante el desarrollo, la configuración de Vite redirige las peticiones a `/api` hacia el backend que corre en `http://localhost:8080`.
