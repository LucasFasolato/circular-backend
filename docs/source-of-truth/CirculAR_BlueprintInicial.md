CirculAR — Blueprint inicial
Norte del proyecto
Construir una plataforma mobile-first de compra y permuta de ropa usada para Argentina, con backend
como fuente de verdad, contratos explícitos, estados claros y frontend estrictamente consumidor de
capacidades ya definidas por el dominio.
Principios rectores
Backend-driven UI.
Un flujo claro por caso de uso, sin híbridos ambiguos.
Estados explícitos antes que lógica implícita.
Contratos versionables y estables.
Anti-caos desde diseño de producto, no solo desde moderación.
Complejidad gradual: MVP sólido antes que features sueltas.
Trazabilidad completa de decisiones de negocio.
Objetivo del producto
Permitir que un usuario publique prendas, reciba interés de compra o permuta, evalúe al otro usuario y
concrete una transacción dentro de un flujo controlado, confiable y fácil de usar.
Diferencial central
Marketplace  híbrido  de  ropa  usada  con  dos  caminos  nativos:  1.  Compra  directa.  2.  Permuta
estructurada.
La permuta no es un chat caótico entre usuarios: es un flujo de dominio modelado y validado por el
backend.
Riesgos que el producto debe atacar desde el inicio
Publicaciones de baja calidad.
Usuarios que ghostean, cancelan o spamean.
Negociaciones ambiguas o fuera de flujo.
Catálogo desordenado y difícil de navegar.
Chats abiertos sin contexto.
Parches funcionales por falta de definiciones previas.
Metodología de trabajo propuesta
Fase 0 — Auditoría del backend actual
Objetivo: entender qué existe, qué sirve, qué está mal, qué falta y qué conviene demoler.
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
1
Entregables: - inventario de módulos - mapa de entidades y relaciones - inventario de endpoints -
análisis de DTOs y validaciones - revisión de auth, permisos y ownership - revisión de errores, logs y
observabilidad - deudas técnicas y riesgos - decisión por componente: conservar / refactorizar / eliminar
Fase 1 — Definiciones de producto y dominio
Objetivo: congelar decisiones base antes de diseñar o programar más.
Entregables: - visión del sistema - alcance MVP - actores - objetos de dominio - reglas de negocio -
estados de cada agregado principal - eventos relevantes del sistema - decisiones explícitas de
monetización y reputación
Fase 2 — Contratos backend
Objetivo: definir el backend como fuente de verdad.
Entregables: - recursos principales - DTOs request/response - reglas de validación - errores de negocio -
ownership por endpoint - transiciones válidas de estado - OpenAPI/Swagger limpio
Fase 3 — Arquitectura y modelo de datos
Objetivo: establecer una base robusta, simple y extensible.
Entregables: - módulos del sistema - agregados y límites - modelo relacional - estrategias de
concurrencia - política de archivos/imágenes - eventos/notifications - lineamientos de performance y
seguridad
Fase 4 — Diseño funcional del frontend
Objetivo: diseñar pantallas que solo consuman contratos cerrados.
Entregables: - mapa de pantallas - flujos principales - estados de carga, vacío y error - componentes de
UI ligados a DTOs - reglas de navegación
Fase 5 — Plan de implementación
Objetivo: construir en orden correcto.
Entregables: - épicas - secuencia de desarrollo - criterios de aceptación - estrategia de test - estrategia
de despliegue
Alcance sugerido para el MVP
Incluido
registro / login
onboarding de confianza
perfil público
publicación de prendas
control de calidad mínimo de fotos
• 
• 
• 
• 
• 
2
catálogo personal
browse/feed
interés en compra
interés en permuta
evaluación del catálogo del otro usuario para permuta
aceptación / rechazo
chat contextual post-match
reputación básica
reportes y moderación básica
No incluido inicialmente
pagos integrados complejos
envíos integrados nacionales
IA de pricing avanzada
recomendaciones sofisticadas
live commerce
closet inteligente avanzado
Actores principales
Usuario comprador
Usuario vendedor
Usuario permutador
Moderador / soporte
Administrador operativo
Objetos de dominio iniciales
User
TrustProfile
PublicProfile
GarmentItem
ItemPhoto
ItemListing
InterestSignal
TradeProposal
PurchaseIntent
MatchSession
ContextChat
ReputationEntry
Report
ModerationReview
Notification
Decisiones de producto que conviene fijar ya
1. Identidad y confianza
teléfono obligatorio
Instagram recomendado, no obligatorio en MVP
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
3
verificación gradual
reputación visible
2. Publicación
una prenda no se publica si no cumple calidad mínima
fotos, categoría, talle, estado, precio y ubicación deben estar normalizados
permuta: sí/no explícito
3. Interacción
no existe chat libre pre-match
el usuario expresa intención estructurada
compra y permuta son caminos distintos desde el dominio
4. Permuta
el interesado no manda texto libre como primera acción
selecciona una o más prendas de su catálogo para ofrecer
el dueño evalúa ofertas dentro de una UI controlada
5. Match y chat
el chat se abre solo cuando hay aceptación explícita
el chat pertenece a una transacción o match session
no existe chat global entre usuarios fuera de contexto
6. Estado de la prenda
no puede estar simultáneamente disponible, reservada y cerrada de manera ambigua
una sola fuente de verdad para disponibilidad
Agregados que recomiendo modelar primero
ItemListing
Representa la publicación viva de una prenda.
Estados sugeridos: - DRAFT - IN_REVIEW - PUBLISHED - PAUSED - RESERVED - MATCH_IN_PROGRESS -
CLOSED - REJECTED
TradeProposal
Representa una propuesta de permuta.
Estados sugeridos: - PROPOSED - VIEWED - COUNTER_PROPOSED - ACCEPTED - REJECTED - EXPIRED -
CANCELLED - CLOSED
PurchaseIntent
Representa intención de compra.
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
4
Estados sugeridos: - INITIATED - ACCEPTED - REJECTED - EXPIRED - CANCELLED - CLOSED
MatchSession
Contexto operacional posterior a aceptación.
Estados sugeridos: - OPEN - AWAITING_CONTACT - IN_CONVERSATION - COMPLETED - FAILED -
DISPUTED - CLOSED
Reglas de negocio importantes
un usuario no puede ofertar sobre su propia prenda
una prenda cerrada no recibe nuevas intenciones
una prenda reservada no debe seguir mostrándose como disponible plena
una propuesta de permuta debe referenciar prendas vigentes y publicadas
una misma prenda ofrecida en permuta no puede comprometerse simultáneamente en
múltiples acuerdos incompatibles sin política explícita
cada transición de estado debe validarse en backend
el frontend no deduce estados, los consume
Módulos backend sugeridos
auth
users
trust
profiles
catalog
listings
interests
trades
purchases
matches
chat
moderation
reputation
notifications
admin
Contrato de respuesta recomendado
Formato consistente: - success - data - meta - error
Errores   de   negocio   con   códigos   explícitos,   por   ejemplo:   -   ITEM_NOT_AVAILABLE   -
SELF_INTERACTION_NOT_ALLOWED   -   TRADE_PROPOSAL_INVALID   -   MATCH_ALREADY_CLOSED   -
PHOTO_QUALITY_NOT_SUFFICIENT
Stack backend sugerido
Si seguís con TypeScript, una base sólida sería: - NestJS - PostgreSQL - TypeORM o Prisma - OpenAPI/
Swagger - storage externo para imágenes - colas/eventos para tareas asincrónicas futuras
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
5
Orden ideal de trabajo desde ahora
auditar backend actual
documentar dominio y decisiones congeladas
definir modelo de datos y estados
cerrar contratos API
recién después diseñar pantallas
implementar/refactorizar por módulos
Qué revisar primero en la auditoría
estructura de carpetas y módulos
entidades actuales
migraciones
auth y sesiones
ownership por recurso
endpoints existentes
DTOs y validaciones
manejo de errores
convenciones de nombres
pruebas existentes
archivos/imágenes
posibles acoplamientos peligrosos
Criterio general para la auditoría
Cada parte del backend debe terminar clasificada como: - conservar tal como está - conservar con
ajustes menores - refactorizar - reemplazar - eliminar
Resultado esperado del proceso
No “sumar features”. Primero: construir una base de dominio clara, consistente y escalable. Después:
hacer que el frontend sea una traducción fiel del backend y del producto.
1. 
2. 
3. 
4. 
5. 
6. 
• 
• 
• 
• 
• 
• 
• 