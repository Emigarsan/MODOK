# Railway Counter App

Aplicación full-stack pensada para desplegarse en Railway. El backend usa Spring Boot y mantiene en memoria tres contadores enlazados;
el frontend en React (Vite) los muestra junto con ilustraciones asociadas.

- **M.O.D.O.K**: contador principal con controles para sumar o restar 1, 5 y 10.
- **Fases dinámicas**: contador secundario acompañado por una secuencia de 7 imágenes que avanza cada vez que el valor llega a 0.
- **Reserva vinculada**: contador terciario que se reduce automáticamente en 1 por cada decremento aplicado al contador secundario.

Los valores iniciales de los contadores son 100, 28 y 120 respectivamente.

## Estructura del proyecto

- `backend/`: servicio Spring Boot con los endpoints REST `GET /api/counter`,
  `POST /api/counter/{primary|secondary|tertiary}/increment` y `POST /api/counter/{primary|secondary|tertiary}/decrement`.
- `frontend/`: interfaz React que consume la API, renderiza la imagen correspondiente a cada contador y ofrece controles independientes.

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
## Cambios recientes de UI y assets

- El contador terciario usa ahora la imagen `frontend/src/assets/43021.png` (se elimin� `tertiary-core.svg`).
- Las im�genes del contador secundario son los JPG �Celda 1� a �Celda 7� en `frontend/src/assets/secondary/`.
- El contador 2 se bloquea cuando, en la imagen 7, el valor llega a 0; el contador 3 se bloquea cuando su valor llega a 0.
- Se elimin� el texto de sincronizaci�n del header y el refresco autom�tico del estado ocurre cada 3 segundos, pausando cuando hay un modal abierto.
