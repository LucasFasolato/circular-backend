CirculAR — Definiciones oficiales v2
1. Propósito del sistema
CirculAR es una plataforma mobile-first para Argentina orientada a la publicación, descubrimiento, compra y permuta de ropa usada entre personas.
El sistema debe permitir que un usuario publique prendas de manera simple, genere confianza mínima verificable, reciba interés estructurado de otros usuarios y concrete interacciones dentro de flujos claros, controlados y robustos.
CirculAR no debe comportarse como un marketplace caótico de mensajes abiertos. Debe operar como un producto guiado por reglas de dominio, donde el backend define estados, acciones posibles y restricciones.
2. Problema que resuelve
El proyecto busca resolver una combinación de problemas muy presentes en el mercado informal de ropa usada:
personas con ropa en buen estado que no usan y no tienen un canal simple, confiable y atractivo para moverla
experiencias caóticas en plataformas abiertas donde comprar, vender o permutar depende de chats desordenados
baja confianza entre desconocidos
publicaciones pobres, con fotos malas, datos incompletos o estados ambiguos
dificultad para concretar permutas reales con criterio y contexto
alta fricción para usuarios que quieren una experiencia simple desde el celular
3. Visión del producto
La visión de CirculAR es convertirse en la referencia argentina para mover ropa usada mediante dos caminos nativos y equivalentes en importancia:
compra directa
permuta estructurada
El diferencial no es solo permitir ambas cosas, sino modelarlas correctamente.
En CirculAR, una permuta no es una negociación improvisada por chat. Es una interacción de producto con reglas claras: interés, evaluación de catálogo, propuesta, aceptación o rechazo, y recién luego contacto contextual.
4. Posicionamiento
CirculAR se posiciona como un marketplace social de ropa usada con foco en:
experiencia mobile-first
flujos simples
confianza mínima obligatoria
backend como fuente de verdad
permuta como feature nativa, no parche
control del caos operativo desde el diseño
No buscamos copiar Marketplace ni un clasificado tradicional. Buscamos una experiencia más guiada, más clara y más segura.
5. Usuario objetivo inicial
El usuario objetivo inicial es una persona que:
usa mucho el celular
tiene ropa guardada que podría vender o permutar
valora una experiencia visual y rápida
necesita confianza mínima antes de interactuar
quiere evitar chats eternos o confusos
está dispuesta a explorar ropa de otras personas como parte de una posible transacción
En etapas tempranas, conviene pensar en un segmento inicial concentrado, por ejemplo:
jóvenes y adultos jóvenes
usuarios urbanos
personas activas en Instagram
usuarios acostumbrados a compra/venta informal pero cansados del caos
6. Alcance del MVP
El MVP debe validar que el núcleo del producto funciona.
Incluye
registro e inicio de sesión
perfil base de usuario
teléfono obligatorio como dato de confianza
Instagram opcional recomendado
publicación de prendas
carga de fotos con validaciones mínimas
catálogo propio del usuario
feed o exploración de publicaciones
interés de compra
interés de permuta
visualización del catálogo del otro usuario al evaluar permuta
aceptación o rechazo de intereses/propuestas
apertura de chat contextual solo después de aceptación
cierre manual de interacción
reputación básica posterior
reportes básicos y moderación inicial
No incluye en el MVP
pagos integrados complejos
envíos integrados nacionales
wallet interna
scoring avanzado con IA
pricing automático sofisticado
recomendaciones complejas
closet inteligente avanzado
infraestructura de live selling
7. Principios rectores
7.1 Backend-driven UI
El backend define la verdad del sistema. El frontend consume estados, permisos, capacidades y acciones disponibles, pero no infiere lógica crítica.
7.2 Estados explícitos
Toda entidad operativamente importante debe tener estados claros y transiciones válidas definidas.
7.3 Flujos guiados
La experiencia debe llevar al usuario por caminos concretos. Menos libertad caótica, más claridad.
7.4 Permuta estructurada
La permuta es parte del dominio central. No debe quedar resuelta con un simple chat abierto.
7.5 Confianza mínima obligatoria
La plataforma debe exigir señales básicas de identidad y trazabilidad para reducir interacción de baja calidad.
7.6 Calidad operacional antes que cantidad de features
Es preferible tener pocos flujos muy bien cerrados que muchas funciones flojas.
7.7 Anti-caos por diseño
El sistema debe prevenir comportamientos problemáticos con reglas de producto, no solo reaccionar después.
8. Diferenciales del producto
8.1 Compra y permuta conviven como caminos nativos
Una prenda puede publicarse con precio, con opción de permuta, o con ambas configuraciones según decisión del dueño.
8.2 Interacción tipo match
La experiencia de interés debe ser muy simple y visual. Un usuario puede indicar interés sobre una prenda con acciones guiadas y de baja fricción. El sistema prioriza botones y selección estructurada por sobre texto libre.
8.3 Evaluación de catálogo del otro usuario
Cuando alguien indica interés en una prenda, el dueño puede revisar el perfil y catálogo del interesado para decidir si hay algo que le interesa a cambio. El match surge cuando existe interés suficiente de ambos lados.
8.4 Match contextual
La interacción se habilita de forma gradual. El chat solo existe cuando ya hay contexto y aceptación.
8.5 Perfil con señales de confianza visibles
Teléfono obligatorio, Instagram recomendado, reputación visible y, a futuro, verificación adicional.
8.6 Experiencia muy pensada para mobile
Publicar, explorar, indicar interés, responder y cerrar una interacción deben ser acciones rápidas, visuales y naturales en celular.
9. Restricciones del sistema
Estas restricciones deben asumirse desde el inicio:
habrá usuarios con baja calidad de interacción
habrá intentos de spam, ghosting o publicaciones pobres
no se puede depender de buena voluntad del usuario para mantener orden
el sistema debe ser claro incluso para usuarios poco técnicos
el modelo debe tolerar crecimiento sin volverse ambiguo
10. Decisiones de producto ya fijadas
10.1 Identidad y confianza
el teléfono del usuario será obligatorio
Instagram será opcional, pero recomendado
la reputación del usuario deberá ser visible en la experiencia
la plataforma podrá escalar luego a verificación adicional
10.2 Publicación de prendas
una publicación no se considera válida si no cumple requisitos mínimos
el sistema exigirá estructura mínima de datos
la disponibilidad de una prenda debe estar gobernada por estado oficial backend
el usuario deberá indicar si acepta permuta o no
todas las imágenes serán auditadas automáticamente mediante IA antes de publicarse
10.3 Auditoría de imágenes con IA
todas las imágenes subidas por los usuarios pasarán por un sistema de validación automática
la IA deberá detectar:
contenido ilegal o inapropiado
imágenes que no correspondan a prendas
inconsistencias entre la imagen y la descripción
baja calidad (blur, mala iluminación, etc.)
el backend será responsable de aceptar o rechazar la publicación según resultado
no se permitirá publicar contenido sin validación previa
el sistema podrá evolucionar a revisiones más avanzadas en el tiempo
10.4 Interacciones
no habrá chat libre entre usuarios sin contexto previo
compra y permuta son caminos distintos pero pueden convivir en una misma publicación
el sistema debe priorizar acciones por botones y selección estructurada
el texto libre debe reducirse al mínimo posible
las acciones disponibles deben depender del estado actual
el match debe nacer desde señales de interés claras y simples
10.5 Permuta
la permuta debe apoyarse en prendas publicadas por el interesado
el dueño debe poder evaluar la propuesta con contexto suficiente
no se debe abrir conversación libre antes de una aceptación explícita
10.6 Moderación y calidad
las fotos deben pasar reglas mínimas de publicación
el sistema debe poder rechazar o frenar contenido problemático
debe existir una base para reportes y revisión
11. Resultados que el MVP debe demostrar
El MVP será considerado exitoso si demuestra que:
los usuarios entienden rápido cómo publicar prendas
la exploración de publicaciones resulta simple y atractiva
la diferencia entre compra y permuta se entiende claramente
las interacciones ocurren con menos caos que en plataformas abiertas
se puede concretar al menos un flujo completo desde publicación hasta cierre
el sistema mantiene consistencia de estados sin ambigüedad
12. Qué no debe pasar
Estas son fallas de producto que debemos evitar desde el inicio:
una prenda mostrarse como disponible y cerrada al mismo tiempo
usuarios escribiéndose libremente sin contexto
propuestas de permuta ambiguas o incompletas
frontend tomando decisiones de negocio por su cuenta
publicaciones con fotos inutilizables o datos mínimos faltantes
estados escondidos o difíciles de entender
endpoints genéricos que luego obliguen a meter parches
13. Criterio de diseño general
Cada nueva decisión del proyecto debe responder esta pregunta:
¿esto hace que CirculAR sea más claro, más robusto, más guiado, más confiable y más escalable como marketplace híbrido de ropa usada?
Si la respuesta es no, no debería entrar al núcleo del sistema.
14. Principios de arquitectura y expansión
Estas definiciones no son solo de producto. También fijan cómo debe construirse el sistema técnicamente.
14.1 Backend como fuente de verdad
el backend define estados, restricciones y acciones posibles
el frontend no infiere lógica crítica ni resuelve ambigüedades de negocio
las respuestas del backend deben ser lo suficientemente claras como para alimentar una UI guiada
14.2 Modularidad desde el inicio
El sistema debe construirse en módulos con límites claros, evitando acoplamientos innecesarios.
Cada módulo debe tener:
una responsabilidad concreta
contratos claros hacia otros módulos
bajo conocimiento del detalle interno ajeno
capacidad de evolucionar sin romper todo el sistema
14.3 Complejidad gradual
el MVP debe resolver muy bien el núcleo
toda expansión futura debe apoyarse en estados y contratos ya definidos
no deben introducirse features laterales que rompan simplicidad operativa
14.4 Expansibilidad real
La base debe permitir crecer luego hacia:
nuevas categorías comerciales
mayor sofisticación de reputación
mejores modelos de recomendación
monetización más fuerte
pagos integrados
envíos
verificación avanzada
moderación híbrida IA + humano
experiencias premium
Sin embargo, estas futuras expansiones no deben condicionar al MVP con complejidad innecesaria.
14.5 Contratos estables
los contratos request/response deben ser explícitos
los errores de negocio deben ser tipados
las capacidades futuras deben poder añadirse sin romper integraciones previas
14.6 Estados explícitos antes que lógica escondida
El sistema debe modelar el negocio con estados, no con condicionales dispersos en frontend o back.
14.7 Trazabilidad y auditabilidad
Toda decisión importante del sistema debe ser trazable:
publicaciones rechazadas por IA
reservas expiradas
propuestas enviadas
aceptaciones y rechazos
cierres de interacción
reportes y moderación
14.8 Preparado para asincronía
Aunque el MVP sea simple, la arquitectura debe estar lista para procesos asincrónicos futuros como:
auditoría de imágenes
notificaciones
scoring de calidad
reputación derivada
recordatorios de reserva
15. Bounded contexts / dominios funcionales sugeridos
A nivel conceptual, CirculAR debería dividirse en dominios claros.
15.1 Identity & Access
Responsable de:
registro
login
sesiones
identidad del usuario
permisos básicos
15.2 Profiles & Trust
Responsable de:
perfil público
señales de confianza
teléfono
Instagram
métricas de confiabilidad
15.3 Catalog & Listings
Responsable de:
prendas
fotos
publicaciones
configuración de compra/permuta
estado de disponibilidad
score de calidad de publicación
15.4 Discovery & Feed
Responsable de:
feed swipe
filtros
ordenamiento
priorización por relevancia
guardados
15.5 Interactions
Responsable de:
intención de compra
propuestas de permuta
selección de prendas ofrecidas
aceptación / rechazo
reservas
15.6 Match & Conversation
Responsable de:
contexto post-aceptación
chat interno
acciones rápidas
cierre o caída de interacción
15.7 Reputation
Responsable de:
métricas de éxito
señales de cumplimiento
historial de interacciones concluidas
15.8 Moderation & Safety
Responsable de:
validación de imágenes con IA
reportes
decisiones de revisión
bloqueos o restricciones
15.9 Notifications
Responsable de:
avisos de interés recibido
avisos de aceptación
expiración de reserva
recordatorios de acción
16. Decisiones cerradas v1
Interacción
Habrá dos acciones claras sobre una prenda: Comprar y Permutar
En permuta, será obligatorio seleccionar prendas propias para enviar una propuesta
No existe un “like vacío” sin contexto
Existirá además la acción Guardar para retención y exploración posterior
Publicación
Una prenda puede estar disponible para:
venta
permuta
ambas simultáneamente
En permuta, el usuario podrá definir:
categorías buscadas
talles buscados
La publicación tendrá un quality score visible y etiquetas de calidad derivadas
Match
No existe match doble puro estilo Tinder entre dos señales equivalentes
El flujo es estructurado: una persona expresa interés y el dueño decide
Cuando se acepta una interacción:
se abre un chat interno contextual
luego puede escalar a contacto externo para cierre
La prenda pasa a estado reservada al aceptar
Sistema
Existirá límite de propuestas activas por usuario
Existirá sistema de reputación desde el MVP
No habrá ranking complejo en MVP, pero sí señales fuertes de confiabilidad
Go To Market
Lanzamiento inicial en Rosario y CABA
Foco del producto: ambas (compra + permuta) con mayor identidad hacia permuta
17. Definiciones adicionales emergentes
Tipo de experiencia
CirculAR adopta un modelo de exploración tipo swipe (Tinder-like) combinado con navegación por categorías.
El usuario puede:
explorar por feed (swipe)
explorar por categoría
guardar publicaciones para volver después
El feed será técnicamente paginado pero percibido como infinito para el usuario.
Principio UX clave
toda interacción crítica debe resolverse con botones
mínimo uso de texto libre
máximo 1 decisión por pantalla
la interfaz debe minimizar errores humanos y decisiones ambiguas
Naturaleza del sistema
CirculAR no es un marketplace tradicional.
Es un sistema de:
descubrimiento
interés estructurado
evaluación cruzada
match contextual
resolución guiada
18. Decisiones finas cerradas
Permuta
Se permite permuta de tipo 1 a N (una prenda contra varias)
No se permite agregar dinero en MVP
Estados
Una prenda pasa a estado reservada cuando se acepta una interacción
La reserva expira automáticamente en 24 horas si no se concreta avance
Chat
Chat interno será solo texto en MVP
El chat tendrá acciones rápidas guiadas (no solo texto libre)
El contacto externo no es el paso inicial, sino una posible evolución hacia el cierre
Sistema
Habrá notificaciones en tiempo real
No habrá ranking complejo en MVP
Sí habrá indicadores de confianza en perfil:
cantidad de transacciones
tasa de éxito
comportamiento
señales de cumplimiento
Feed
Feed será paginado pero percibido como infinito
Se mezclarán prendas de compra y permuta
Cada prenda tendrá badges claros para diferenciar
El feed será priorizado por:
calidad
cercanía
relevancia (categoría/talle)
actividad
Swipe y acciones
Habrá botones visibles para:
descartar
permutar
comprar
guardar
swipe a la izquierda: descartar
swipe a la derecha: acción principal
si una prenda admite tanto compra como permuta, el swipe derecho abrirá una elección rápida
no se usarán gestos ambiguos de múltiples direcciones
19. IA y calidad de publicación
La auditoría de imágenes con IA forma parte del núcleo del sistema.
19.1 Objetivo
Garantizar que las imágenes:
no contengan contenido ilegal o inapropiado
correspondan efectivamente a prendas o elementos permitidos
mantengan una calidad mínima útil
tengan coherencia básica con la categoría declarada
19.2 Alcance inicial
En MVP, la IA debe poder ayudar a detectar:
contenido inapropiado
imágenes que no correspondan a prendas
imágenes de baja calidad
inconsistencias básicas con la categoría declarada
19.3 Decisión operativa
ninguna imagen debería publicarse sin pasar por validación
el backend decide si la publicación queda aprobada, observada o rechazada
la arquitectura debe permitir evolucionar el proveedor o estrategia de IA sin reescribir el dominio central
19.4 Score de calidad
Cada publicación podrá contar con un score de calidad construido a partir de:
evaluación automática de imágenes
completitud de datos
consistencia de información
buenas prácticas de publicación
Este score debe poder usarse para:
feedback al usuario
visibilidad en feed
futuras mejoras de priorización
20. Qué no debe pasar
Estas son fallas de producto y de arquitectura que debemos evitar desde el inicio:
una prenda mostrarse como disponible y cerrada al mismo tiempo
usuarios escribiéndose libremente sin contexto
propuestas de permuta ambiguas o incompletas
frontend tomando decisiones de negocio por su cuenta
publicaciones con fotos inutilizables o datos mínimos faltantes
estados escondidos o difíciles de entender
endpoints genéricos que luego obliguen a meter parches
módulos acoplados que hagan imposible evolucionar el sistema
lógica de moderación mezclada de forma caótica con la publicación
21. Resultado esperado de esta etapa
El resultado de este documento es fijar una base oficial para que todo el proyecto avance con claridad.
A partir de este punto, toda decisión futura debe respetar:
el enfoque mobile-first
el modelo de interacción guiado
la centralidad de compra + permuta
el backend como fuente de verdad
la modularidad
la expansibilidad
la auditabilidad
la simplicidad operacional
22. Próxima etapa
Con estas definiciones cerradas, la siguiente etapa es:
definir dominio oficial
definir agregados y entidades
definir estados y transiciones
definir invariantes de negocio
definir contratos API v1
definir arquitectura backend y roadmap técnico
