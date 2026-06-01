# Toby

Repositorio toby-front-2026-1

## Cómo utilizar la API localmente

- Levantar el servidor en el backend (toby-back-2026-1) mediante el comando yarn dev

- Levantar el servidor en el frontend (toby-front-2026-1/toby) mediante el comando yarn dev

**Aclaración:** Para asegurarnos de usar la versión de nvm correcta es bueno usar nvm use 20 (para usar la versión 20)

Luego, en el navegador usar la siguiente url:

- http://localhost:5173/

### Uso a nivel de usuario

1. Crear una cuenta: presionar "Crear cuenta". En la nueva vista desplegada, deinir un nombre de usuario, contraseña y avatar a usar.
2. En "Lobby" se pueden ver las partidas creadas en la plataforma y crear una partida para jugar.
3. Seleccionar "Crear Partida", lo que permitirá ver el tablero del juego.

### Simulación de partida como usuario
Si queremos simular una partida, debemos realizar todos los pasos del apartado anterior y luego:

1. Abrir otra página del navegador web en modo incógnito.
2. Entrar a la url http://localhost:5173/
3. Crear un usuario.
4. En el Lobby unirnos a la partida que creamos antes.
5. Con el usuario que creó la partida, apretamos "Iniciar partida".
6. Alguno de los dos usuarios será asignado el primer turno de manera aleatoria. Podemos lanzar el dado con este y observar cómo se mueven los jugadores en el tablero.

### Uso a nivel de administrador

1. Iniciar sesión con el usuario "admin" y contraseña "1234".

Por ahora, no se diferencia mucho un administrador de un usuario, puesto que no se han implmentado las vistas de gestión que solo puede hacer un administrador. Sin embargo, al otorgar Tokens y las rutas protegidas, sí existe una diferencia entre usuarios y administrador.

## Roles del sistema

### Usuario

Los usuarios registrados pueden:

- Crear una cuenta.
- Iniciar sesión.
- Crear partidas.
- Unirse a partidas existentes.
- Participar en las partidas.
- Visualizar el estado del tablero y de los demás jugadores.

### Administrador

El administrador posee las mismas capacidades que un usuario normal y, adicionalmente, cuenta con permisos especiales protegidos mediante autenticación y autorización basada en tokens.

Actualmente no se encuentran implementadas vistas exclusivas de administración, pero la infraestructura de permisos y rutas protegidas ya se encuentra preparada para soportarlas.

## Correr las pruebas unitarias con Jest (en el backend)

En la consola, en la ubicación del proyecto (toby-back-2026-1), correr los siguientes comandos:

- nvm use 20 (para asegurarnos de estar usando la versión 20)
- npm test

## Usar Linter

En la consola, en la ubicación del proyecto (toby-front-2026-1/toby), correr los siguientes comandos:

- npx eslint .

Este comando no debería mostrar ningún error, puesto que ya todos fueron arreglados

## Funcionalidad y eventos gestionados por websockets.

La aplicación utiliza WebSockets mediante Socket.IO para sincronizar en tiempo real el estado de una partida entre todos los jugadores conectados.

Las principales funcionalidades gestionadas mediante WebSockets son:

### Unión a una partida

Cuando un usuario se une a una partida, el resto de los jugadores conectados reciben la actualización correspondiente, permitiendo mantener sincronizada la información de la sala y de los participantes.

### Inicio de partida

Cuando el creador de una partida inicia el juego, se envía un evento a todos los clientes conectados para actualizar el estado de la partida desde "en espera" a "en juego".

### Movimiento de jugadores

Cada vez que un jugador lanza el dado y avanza en el tablero, se envía un evento mediante WebSockets para que todos los participantes visualicen inmediatamente la nueva posición del jugador sin necesidad de recargar la página.

### Actualización de turnos

Los cambios de turno son comunicados en tiempo real a todos los clientes conectados, permitiendo que cada jugador sepa cuándo puede realizar una acción dentro de la partida.

## Sincronización del estado del juego

Los WebSockets permiten mantener sincronizados entre todos los jugadores los cambios relevantes del tablero, posiciones de los jugadores y estado general de la partida.

## Link a Render
https://fabulous-palmier-bb8083.netlify.app/

## Link a Tablero Kanban
https://www.notion.so/c9f00161e7ae837c867d81c02c89a06a?v=6c300161e7ae8366a06e882e44304f89&source=copy_link

## Uso de IA
Para esta entrega teníamos instalado Copilot y Claude en algunos computadores, por lo tanto, se usaron recomendaciones de ambas IA durante el desarrollo del proyecto.