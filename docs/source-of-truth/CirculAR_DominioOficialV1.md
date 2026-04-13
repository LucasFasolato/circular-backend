CirculAR — Dominio oficial v1
1. Objetivo de este documento
Traducir las definiciones oficiales de producto a un modelo de dominio claro, consistente, expansible y apto para implementar un backend robusto.
Este documento fija:
lenguaje ubicuo
bounded contexts
agregados
entidades
value objects
ownership
eventos de dominio
decisiones estructurales del modelo
2. Principios de modelado
1 publicación = 1 prenda física
el backend es la fuente de verdad
los estados gobiernan el comportamiento
cada agregado tiene ownership claro
la interacción entre usuarios ocurre por flujos estructurados
la moderación y la auditoría de imágenes son parte del dominio operativo
la base debe permitir expansión futura sin romper el núcleo
3. Lenguaje ubicuo
User
Persona registrada en la plataforma.
PublicProfile
Representación pública del usuario frente a otros usuarios.
TrustProfile
Conjunto de señales de confianza y confiabilidad del usuario.
ReachZone
Zona general en la que el usuario está dispuesto a moverse para concretar compras o permutas.
Garment
Prenda o artículo publicable.
Listing
Publicación activa de una única prenda física dentro del marketplace.
ListingPhoto
Imagen asociada a una publicación.
ListingQuality
Resultado agregado de calidad de una publicación.
SavedListing
Relación de guardado entre usuario y publicación.
PurchaseIntent
Interés estructurado de compra sobre una publicación.
TradeProposal
Propuesta estructurada de permuta sobre una publicación.
ProposedItem
Prenda ofrecida dentro de una propuesta de permuta.
MatchSession
Contexto operativo que nace cuando una interacción es aceptada.
ConversationThread
Canal de conversación contextual asociado a una MatchSession.
ConversationMessage
Mensaje de texto o acción rápida dentro del chat contextual.
ModerationReview
Resultado operativo de la validación o revisión de una publicación.
ImageAudit
Resultado específico de auditoría sobre una imagen.
ReputationProfile
Métricas visibles de confiabilidad del usuario.
ReputationEntry
Registro derivado de una interacción concluida.
Notification
Evento visible para el usuario que requiere atención o informa un cambio.
4. Bounded contexts oficiales
4.1 Identity & Access
Responsable de:
registro
login
sesiones
identidad del usuario
permisos básicos
4.2 Profiles & Trust
Responsable de:
perfil público
teléfono obligatorio
Instagram opcional
zonas de alcance del usuario
métricas de confiabilidad visibles
4.3 Catalog & Listings
Responsable de:
prendas
publicaciones
fotos
configuración comercial (venta / permuta / ambas)
preferencias de permuta
calidad de publicación
archivado / pausa / disponibilidad
4.4 Discovery & Feed
Responsable de:
feed swipe
filtros
navegación por categorías
guardados
priorización de visibilidad
4.5 Interactions
Responsable de:
intención de compra
propuesta de permuta
prendas ofrecidas
aceptación / rechazo
reserva de publicación
4.6 Match & Conversation
Responsable de:
sesión post-aceptación
chat interno contextual
acciones rápidas
expiración / cierre conversacional
4.7 Reputation
Responsable de:
métricas visibles de perfil
historial derivado de interacciones concluidas
tasa de éxito
cancelaciones
tiempo de respuesta agregado
4.8 Moderation & Safety
Responsable de:
auditoría IA de imágenes
revisión de publicaciones observadas
decisiones de moderación
reportes
restricciones operativas
4.9 Notifications
Responsable de:
avisos al usuario
eventos de interés
aceptación / rechazo
vencimiento de reserva
recordatorios de acción
5. Agregados principales
5.1 User Aggregate
Raíz: User
Entidades internas
User
PublicProfile
TrustProfile
ReachZone
ReputationProfile
Responsabilidades
representar identidad del usuario
exponer perfil público
almacenar señales de confianza
almacenar zonas donde puede concretar encuentros
mostrar métricas visibles del perfil
Ownership
pertenece al propio usuario
ciertas señales derivadas son calculadas por el sistema

5.2 Listing Aggregate
Raíz: Listing
Entidades internas
Listing
Garment
ListingPhoto
ListingQuality
ModerationReview (referencia operativa o acoplada débilmente según implementación)
Responsabilidades
representar una única prenda publicada
mantener estado de disponibilidad
definir si admite compra, permuta o ambas
guardar preferencias de permuta
gestionar fotos y score de calidad
mantener relación con validación de IA
permitir pausa, archivo o reserva
Ownership
pertenece al usuario dueño de la publicación
ciertas decisiones derivadas dependen del sistema de moderación

5.3 PurchaseIntent Aggregate
Raíz: PurchaseIntent
Responsabilidades
expresar interés estructurado de compra sobre una publicación
impedir auto-interacción
impedir duplicidades incompatibles
permitir aceptación, rechazo, cancelación o expiración
Ownership
creado por usuario interesado
resuelto por dueño del listing

5.4 TradeProposal Aggregate
Raíz: TradeProposal
Entidades internas
TradeProposal
ProposedItem
Responsabilidades
expresar interés estructurado de permuta
obligar a seleccionar prendas propias ofrecidas
validar que las prendas ofrecidas estén vigentes y sean propias
permitir aceptación, rechazo, cancelación o expiración
Ownership
creado por usuario interesado
resuelto por dueño del listing objetivo

5.5 MatchSession Aggregate
Raíz: MatchSession
Entidades internas
MatchSession
ConversationThread
ConversationMessage
Responsabilidades
encapsular el contexto operativo posterior a una aceptación
asociar la conversación con una interacción concreta
sostener el estado de coordinación
cerrar la sesión cuando se completa, fracasa o expira
Ownership
compartido operativamente por ambas partes
el sistema gobierna expiraciones y cierres automáticos

5.6 SavedListing Aggregate
Raíz: SavedListing
Responsabilidades
permitir que un usuario guarde publicaciones
soportar retención y reexploración
Ownership
pertenece al usuario que guarda

5.7 Moderation Aggregate
Raíz: ModerationReview
Entidades internas
ModerationReview
ImageAudit
Responsabilidades
registrar evaluación automática por IA
clasificar publicación o imágenes como aprobadas, observadas o rechazadas
dejar trazabilidad de motivos
habilitar escalamiento a revisión posterior
Ownership
gobernado por el sistema
visible parcialmente al usuario dueño de la publicación
6. Entidades principales por contexto
Identity & Access
User
Session
AuthCredential
Profiles & Trust
PublicProfile
TrustProfile
ReachZone
ReputationProfile
Catalog & Listings
Garment
Listing
ListingPhoto
ListingQuality
ListingPreference
Discovery & Feed
SavedListing
FeedCandidate (proyección)
Interactions
PurchaseIntent
TradeProposal
ProposedItem
Match & Conversation
MatchSession
ConversationThread
ConversationMessage
Reputation
ReputationEntry
ReputationProfile
Moderation & Safety
ModerationReview
ImageAudit
UserReport
Notifications
Notification
7. Value Objects sugeridos
PhoneNumber
InstagramHandle
MoneyAmount
GarmentSize
GarmentCondition
CategoryId
LocationCity
LocationZone
ReachZoneDefinition
ListingQualityScore
AuditReason
ReservationWindow
SuccessRate
ResponseTimeMetric
8. Decisiones estructurales cerradas
8.1 Unidad comercial
1 listing representa 1 única prenda física
no habrá lotes o packs en MVP
8.2 Alcance del catálogo
MVP incluye ropa + calzado + accesorios
el modelo debe soportar estas categorías sin romper la unidad de publicación
8.3 Ubicación y alcance
la publicación mostrará ciudad + zona general
el usuario podrá configurar zonas de alcance o zonas donde está dispuesto a concretar cambios
estas zonas impactarán luego en discovery y relevancia
8.4 Control del dueño
el dueño del listing puede pausar manualmente una publicación
las publicaciones se archivan mediante soft delete
8.5 Reserva
cuando una interacción es aceptada, el listing pasa a estado reservado
la reserva dura 24 horas
al vencer, el sistema notifica y permite renovación manual
la renovación no es automática
8.6 Cierre
una interacción se considera concluida con confirmación de ambas partes
el sistema debe soportar cierres fallidos, expirados o cancelados
8.7 Conversación post-reserva
si la reserva expira, la conversación se cierra
luego puede eliminarse o archivarse automáticamente tras una ventana técnica definida
8.8 Moderación
la auditoría IA puede clasificar una publicación o imagen como:
aprobada
observada
rechazada
8.9 Métricas visibles del perfil
transacciones realizadas
tasa de éxito
tiempo de respuesta agregado
cancelaciones o comportamiento derivado
9. Ownership y permisos conceptuales
Listing
solo el dueño puede crear, editar, pausar, archivar o renovar reserva
otros usuarios solo pueden descubrirla o interactuar según estado
PurchaseIntent
solo el usuario interesado puede crear o cancelar su intención
solo el dueño del listing puede aceptarla o rechazarla
TradeProposal
solo el usuario interesado puede crear o cancelar la propuesta
solo el dueño del listing objetivo puede aceptarla o rechazarla
MatchSession / ConversationThread
ambas partes pueden participar mientras la sesión siga activa
el sistema puede cerrar por expiración o reglas operativas
ModerationReview
solo el sistema y superficies administrativas resuelven definitivamente
el usuario recibe feedback pero no controla el resultado
10. Eventos de dominio relevantes
Listings
ListingCreated
ListingSubmittedForReview
ListingApproved
ListingObserved
ListingRejected
ListingPublished
ListingPaused
ListingArchived
ListingReserved
ListingReservationExpired
ListingReservationRenewed
ListingClosed
Purchase
PurchaseIntentCreated
PurchaseIntentAccepted
PurchaseIntentRejected
PurchaseIntentCancelled
PurchaseIntentExpired
Trade
TradeProposalCreated
TradeProposalAccepted
TradeProposalRejected
TradeProposalCancelled
TradeProposalExpired
Match & Conversation
MatchSessionOpened
ConversationStarted
QuickActionUsed
MatchSessionCompleted
MatchSessionFailed
MatchSessionClosed
Moderation
ImageAudited
ModerationReviewCompleted
PublicationFlagged
Reputation
ReputationUpdated
SuccessMetricsRecomputed
Notifications
NotificationQueued
NotificationDelivered
11. Proyecciones / read models importantes
Para una arquitectura backend-driven UI, conviene pensar desde ya en superficies de lectura.
FeedCardView
Debe devolver:
foto dominante
categoría
talle
badges de compra / permuta
score/etiqueta de calidad
ciudad / zona general
acciones disponibles
ListingDetailView
Debe devolver:
datos completos de la prenda
preferencias de permuta
fotos
perfil resumido del dueño
estado actual
acciones disponibles para el viewer
IncomingInterestView
Debe devolver al dueño:
quién mostró interés
tipo de interacción
prendas ofrecidas en caso de permuta
métricas resumidas del interesado
acciones posibles
ProfileTrustView
Debe devolver:
señales de confianza
transacciones
tasa de éxito
tiempo de respuesta
cancelaciones o señales de cumplimiento
12. Decisiones de diseño para mantener bajo costo de IA
La auditoría IA debe diseñarse para ser útil sin disparar costos.
Estrategia recomendada
no usar LLM pesado para todas las imágenes
aplicar pipeline escalonado
Pipeline sugerido
validaciones baratas primero:
tamaño
formato
cantidad mínima
resolución
duplicados
heurísticas / visión barata:
blur
iluminación
detección básica de objeto
modelo IA solo cuando haga falta:
clasificación de contenido permitido
coherencia básica con categoría
revisión observada en vez de reintentos caros sistemáticos
Principio operativo
usar el proveedor o modelo más barato que resuelva el problema mínimo del MVP
desacoplar la capa de auditoría para poder cambiar proveedor sin tocar dominio
almacenar resultado estructurado, no texto libre costoso
13. Resultado esperado
Este dominio deja una base clara para pasar a la siguiente etapa:
estados y transiciones
invariantes de negocio
contratos API v1
arquitectura backend

