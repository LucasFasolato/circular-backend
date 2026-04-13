CirculAR — Estados e invariantes v1
1. Objetivo de este documento
Definir el comportamiento operativo de los agregados principales de CirculAR mediante estados explícitos, transiciones válidas e invariantes de negocio.
Este documento existe para evitar:
ambigüedad funcional
lógica oculta en frontend
transiciones inválidas
parches futuros
Se apoya en:
CirculAR — Blueprint inicial
CirculAR — Definiciones oficiales v2
CirculAR — Dominio oficial v1
2. Principios rectores de comportamiento
todo agregado relevante debe tener estados explícitos
toda transición debe estar validada por backend
no debe existir más de una verdad para disponibilidad de una publicación
los estados deben ser fáciles de consumir por frontend
el sistema debe priorizar robustez y claridad por encima de flexibilidad caótica
cuando una interacción relevante es aceptada, el sistema debe cerrar automáticamente caminos incompatibles
3. Listing
3.1 Propósito
Representar una publicación viva de una única prenda física.
3.2 Estados oficiales
DRAFT
IN_REVIEW
OBSERVED
PUBLISHED
PAUSED
RESERVED
CLOSED
REJECTED
ARCHIVED
3.3 Significado de cada estado
DRAFT
La publicación existe pero todavía no fue enviada a validación/publicación.
IN_REVIEW
La publicación fue enviada y está siendo validada por reglas del sistema e IA.
OBSERVED
La publicación fue observada por problemas corregibles. No está visible públicamente. El dueño puede editar y reenviar.
PUBLISHED
La publicación está visible y disponible para discovery e interacciones.
PAUSED
La publicación fue pausada manualmente por el dueño. No recibe nuevas interacciones.
RESERVED
La publicación tiene una interacción aceptada activa. No recibe nuevas interacciones incompatibles. La reserva dura 24 horas y puede renovarse manualmente.
CLOSED
La publicación se considera concluida por operación exitosa confirmada por ambas partes.
REJECTED
La publicación fue rechazada por moderación o validación crítica. No puede publicarse sin corrección sustancial o nueva creación, según política posterior.
ARCHIVED
La publicación fue retirada del circuito activo mediante soft delete o archivado operativo.
3.4 Transiciones válidas
DRAFT -> IN_REVIEW
DRAFT -> ARCHIVED
IN_REVIEW -> PUBLISHED
IN_REVIEW -> OBSERVED
IN_REVIEW -> REJECTED
OBSERVED -> IN_REVIEW
OBSERVED -> ARCHIVED
PUBLISHED -> PAUSED
PUBLISHED -> RESERVED
PUBLISHED -> ARCHIVED
PAUSED -> PUBLISHED
PAUSED -> ARCHIVED
RESERVED -> PUBLISHED
RESERVED -> CLOSED
RESERVED -> ARCHIVED
CLOSED -> ARCHIVED
REJECTED -> ARCHIVED
3.5 Disparadores típicos
submit_for_review: DRAFT -> IN_REVIEW
approve_publication: IN_REVIEW -> PUBLISHED
observe_publication: IN_REVIEW -> OBSERVED
reject_publication: IN_REVIEW -> REJECTED
resubmit_after_fix: OBSERVED -> IN_REVIEW
pause_listing: PUBLISHED -> PAUSED
resume_listing: PAUSED -> PUBLISHED
accept_interaction: PUBLISHED -> RESERVED
reservation_expired: RESERVED -> PUBLISHED
reservation_renewed: RESERVED -> RESERVED
complete_successfully: RESERVED -> CLOSED
archive_listing: any active non-terminal reasonable state -> ARCHIVED
3.6 Invariantes
un listing archivado no vuelve a estados activos
un listing cerrado no recibe nuevas interacciones
un listing reservado no aparece como plenamente disponible
un listing pausado no aparece en discovery
un listing observado no aparece publicado
un listing rechazado no aparece publicado
un usuario no puede interactuar comercialmente con su propio listing
solo el dueño puede pausar, archivar o renovar una reserva
al pasar a RESERVED, deben cerrarse automáticamente interacciones activas incompatibles sobre ese listing
4. PurchaseIntent
4.1 Propósito
Representar interés estructurado de compra sobre un listing.
4.2 Estados oficiales
ACTIVE
ACCEPTED
REJECTED
CANCELLED
EXPIRED
CLOSED
4.3 Significado
ACTIVE
La intención fue creada y espera resolución del dueño.
ACCEPTED
El dueño la aceptó. Debe abrir MatchSession y reservar el listing.
REJECTED
El dueño la rechazó explícitamente.
CANCELLED
El interesado retiró su intención antes de resolución final.
EXPIRED
La intención perdió validez por vencimiento del listing, reserva por otra interacción o timeout operativo.
CLOSED
La intención formó parte de una operación concluida o quedó cerrada administrativamente tras el cierre de la MatchSession.
4.4 Transiciones válidas
ACTIVE -> ACCEPTED
ACTIVE -> REJECTED
ACTIVE -> CANCELLED
ACTIVE -> EXPIRED
ACCEPTED -> CLOSED
4.5 Invariantes
un mismo usuario no puede tener más de una PurchaseIntent activa para el mismo listing
no puede existir PurchaseIntent activa sobre listing no PUBLISHED
aceptar una PurchaseIntent obliga a reservar el listing
al aceptar una PurchaseIntent, otras PurchaseIntent activas y TradeProposal activas del mismo listing deben pasar a EXPIRED o REJECTED automáticamente
solo el interesado puede cancelar una PurchaseIntent activa
solo el dueño del listing puede aceptarla o rechazarla
5. TradeProposal
5.1 Propósito
Representar una propuesta estructurada de permuta sobre un listing.
5.2 Estados oficiales
ACTIVE
ACCEPTED
REJECTED
CANCELLED
EXPIRED
CLOSED
5.3 Significado
ACTIVE
La propuesta fue enviada y espera resolución del dueño.
ACCEPTED
El dueño aceptó la propuesta. Debe abrir MatchSession y reservar el listing.
REJECTED
El dueño rechazó explícitamente la propuesta.
CANCELLED
El proponente retiró la propuesta antes de resolución final.
EXPIRED
La propuesta perdió validez por vencimiento, cambio de estado del listing o conflicto operativo.
CLOSED
La propuesta concluyó junto con una MatchSession completada o quedó cerrada administrativamente.
5.4 Transiciones válidas
ACTIVE -> ACCEPTED
ACTIVE -> REJECTED
ACTIVE -> CANCELLED
ACTIVE -> EXPIRED
ACCEPTED -> CLOSED
5.5 Invariantes
un mismo usuario no puede tener más de una TradeProposal activa para el mismo listing objetivo
una TradeProposal debe contener al menos un ProposedItem válido
todos los ProposedItem deben pertenecer al proponente
todos los ProposedItem deben estar vigentes y compatibles con propuesta activa
no puede existir TradeProposal activa sobre listing no PUBLISHED
aceptar una TradeProposal obliga a reservar el listing objetivo
al aceptar una TradeProposal, otras PurchaseIntent activas y TradeProposal activas del mismo listing objetivo deben cerrarse automáticamente como EXPIRED o REJECTED
el sistema debe impedir comprometer simultáneamente un mismo ProposedItem en múltiples MatchSession incompatibles
6. MatchSession
6.1 Propósito
Representar el contexto operacional posterior a la aceptación de una interacción.
6.2 Estados oficiales
OPEN
ACTIVE
COMPLETED
FAILED
EXPIRED
CANCELLED
CLOSED
6.3 Significado
OPEN
La sesión acaba de abrirse a partir de una aceptación. La conversación contextual está habilitada.
ACTIVE
La sesión tiene intercambio conversacional o uso de acciones rápidas.
COMPLETED
Ambas partes confirmaron operación exitosa.
FAILED
Una o ambas partes marcaron que la operación no se concretó.
EXPIRED
La sesión venció por expiración de reserva sin renovación o sin cierre a tiempo.
CANCELLED
La sesión fue cancelada manualmente por lógica operativa permitida.
CLOSED
Estado terminal administrativo posterior a completion/failure/expiry/cancel.
6.4 Transiciones válidas
OPEN -> ACTIVE
OPEN -> COMPLETED
OPEN -> FAILED
OPEN -> EXPIRED
OPEN -> CANCELLED
ACTIVE -> COMPLETED
ACTIVE -> FAILED
ACTIVE -> EXPIRED
ACTIVE -> CANCELLED
COMPLETED -> CLOSED
FAILED -> CLOSED
EXPIRED -> CLOSED
CANCELLED -> CLOSED
6.5 Invariantes
toda MatchSession nace desde una PurchaseIntent ACCEPTED o TradeProposal ACCEPTED
una MatchSession activa implica listing en RESERVED
una MatchSession COMPLETED exige confirmación de ambas partes
si la MatchSession pasa a COMPLETED, el listing debe pasar a CLOSED
si la MatchSession pasa a EXPIRED y no se renueva reserva, el listing vuelve a PUBLISHED salvo decisión manual distinta del dueño compatible con reglas
una vez CLOSED, no admite nuevos mensajes ni acciones rápidas
una MatchSession no puede existir sin referencia clara a su interacción origen
7. ConversationThread
7.1 Propósito
Representar la conversación contextual post-aceptación.
7.2 Estados oficiales
OPEN
RESTRICTED
CLOSED
ARCHIVED
7.3 Significado
OPEN
La conversación permite mensajes y acciones rápidas.
RESTRICTED
La conversación ya no acepta mensaje libre normal, pero puede mostrar histórico y algunas acciones finales según política.
CLOSED
La conversación está terminada y no admite nuevas interacciones.
ARCHIVED
La conversación se conserva solo a nivel histórico técnico.
7.4 Transiciones válidas
OPEN -> RESTRICTED
OPEN -> CLOSED
RESTRICTED -> CLOSED
CLOSED -> ARCHIVED
7.5 Invariantes
ConversationThread no existe sin MatchSession
si la reserva expira, la conversación debe pasar al menos a CLOSED
una conversación CLOSED no recibe nuevos mensajes
una conversación ARCHIVED no reaparece como abierta
8. ModerationReview
8.1 Propósito
Representar la decisión de moderación/validación sobre una publicación.
8.2 Estados oficiales
PENDING
APPROVED
OBSERVED
REJECTED
SUPERSEDED
8.3 Significado
PENDING
La revisión está en curso.
APPROVED
La publicación cumple criterios mínimos de validación.
OBSERVED
La publicación tiene problemas corregibles y requiere cambios.
REJECTED
La publicación incumple reglas críticas o contiene material no permitido.
SUPERSEDED
La revisión quedó reemplazada por una nueva tras edición/reenvío.
8.4 Transiciones válidas
PENDING -> APPROVED
PENDING -> OBSERVED
PENDING -> REJECTED
OBSERVED -> SUPERSEDED
APPROVED -> SUPERSEDED
8.5 Invariantes
un listing no pasa a PUBLISHED sin ModerationReview APPROVED vigente
una revisión OBSERVED debe devolver motivos corregibles estructurados
una revisión REJECTED debe devolver motivos claros y trazables
una nueva re-subida o reenvío invalida la revisión previa relevante como SUPERSEDED
la moderación no debe depender de texto libre opaco como único resultado
9. Reglas cruzadas entre agregados
9.1 Reglas de disponibilidad
solo listings en PUBLISHED pueden recibir PurchaseIntent o TradeProposal nuevas
listing en RESERVED no acepta nuevas interacciones comerciales
listing en CLOSED, REJECTED o ARCHIVED no participa del circuito comercial activo
9.2 Reglas de cierre automático
aceptar una interacción cierra automáticamente las incompatibles del mismo listing
expirar la reserva cierra la conversación activa asociada
completar exitosamente la MatchSession cierra interacción origen y listing
9.3 Reglas de ownership
ningún usuario puede operar sobre recursos ajenos fuera de permisos explícitos
toda acción debe validar viewer role: owner, interested party, matched party o admin/system
9.4 Reglas de consistencia operativa
no debe existir más de una MatchSession activa para el mismo listing al mismo tiempo
no debe existir listing simultáneamente RESERVED y PUBLISHED
no debe existir TradeProposal activa con ProposedItem comprometido en MatchSession incompatible
10. Timeouts y políticas automáticas
Reserva
duración por defecto: 24 horas
al vencer: notificación + cierre conversacional + listing vuelve a PUBLISHED si no hubo cierre exitoso ni renovación manual
Intenciones y propuestas activas
pueden expirar por cambio de estado del listing, aceptación de otra interacción o política temporal futura
Conversación
luego de CLOSED puede archivarse automáticamente tras ventana técnica configurable
11. Recomendaciones de implementación
modelar estados como enums del dominio, no strings sueltos dispersos
concentrar transiciones en servicios de aplicación o domain services bien definidos
registrar razones de transición relevantes
exponer al frontend no solo estado, sino acciones disponibles por estado
preferir cierres automáticos explícitos antes que dejar residuos activos ambiguos
12. Resultado esperado
Con este documento, CirculAR ya cuenta con comportamiento operacional base suficientemente claro para pasar a:
contratos API v1
modelo relacional
arquitectura backend
roadmap de implementación por módulos

