CirculAR — Contratos API v1
1. Objetivo
Definir los contratos iniciales del backend de CirculAR como fuente de verdad para el frontend.
Este documento fija:
recursos principales
endpoints v1
request/response shapes
reglas de ownership
errores tipados
surfaces de lectura backend-driven
Se apoya en:
CirculAR — Blueprint inicial
CirculAR — Definiciones oficiales v2
CirculAR — Dominio oficial v1
CirculAR — Estados e invariantes v1
2. Principios de contrato
el frontend no deduce lógica crítica
toda response relevante debe incluir estado y acciones disponibles
los errores de negocio deben ser explícitos y tipados
los contratos deben ser estables y extensibles
las responses deben priorizar surfaces pensadas para UI, no solo CRUD plano
3. Convención general de respuesta
Success envelope
{
  "success": true,
  "data": {},
  "meta": {}
}

Error envelope
{
  "success": false,
  "error": {
    "code": "LISTING_NOT_AVAILABLE",
    "message": "The listing is not available for this action.",
    "details": {}
  },
  "meta": {}
}

4. Convención de acciones disponibles
Toda surface principal debe poder incluir una sección availableActions.
Ejemplo:
{
  "availableActions": {
    "canBuy": true,
    "canTrade": true,
    "canSave": true,
    "canPause": false,
    "canArchive": false,
    "canAccept": false,
    "canReject": false,
    "canRenewReservation": false
  }
}

5. Módulos API v1
identity-access
profiles-trust
catalog-listings
discovery-feed
interactions
matches-conversations
moderation
notifications

6. Identity & Access
6.1 POST /v1/auth/register
Registra un usuario.
Request
{
  "email": "lucas@example.com",
  "password": "strong_password",
  "firstName": "Lucas",
  "lastName": "Fasolato",
  "phone": "+5493410000000"
}

Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "lucas@example.com",
      "firstName": "Lucas",
      "lastName": "Fasolato",
      "phone": "+5493410000000",
      "isPhoneVerified": false,
      "createdAt": "2026-04-13T10:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access",
      "refreshToken": "jwt_refresh"
    }
  },
  "meta": {}
}

6.2 POST /v1/auth/login
Request
{
  "email": "lucas@example.com",
  "password": "strong_password"
}

Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "lucas@example.com"
    },
    "tokens": {
      "accessToken": "jwt_access",
      "refreshToken": "jwt_refresh"
    }
  },
  "meta": {}
}

6.3 POST /v1/auth/refresh
Request
{
  "refreshToken": "jwt_refresh"
}

6.4 POST /v1/auth/logout
Invalida sesión actual.
6.5 GET /v1/auth/me
Surface de bootstrap del usuario autenticado.
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "lucas@example.com",
      "firstName": "Lucas",
      "lastName": "Fasolato"
    },
    "profileStatus": {
      "hasPhone": true,
      "hasReachZones": true,
      "hasPublishedListings": false
    },
    "availableActions": {
      "canCreateListing": true,
      "canEditProfile": true
    }
  },
  "meta": {}
}


7. Profiles & Trust
7.1 GET /v1/profile/me
Devuelve perfil editable del usuario actual.
7.2 PATCH /v1/profile/me
Actualiza perfil del usuario.
Request
{
  "firstName": "Lucas",
  "lastName": "Fasolato",
  "instagramHandle": "lucasfaso",
  "city": "Rosario",
  "zone": "Centro"
}

7.3 PUT /v1/profile/me/reach-zones
Reemplaza zonas de alcance.
Request
{
  "reachZones": [
    {
      "city": "Rosario",
      "zone": "Centro"
    },
    {
      "city": "Rosario",
      "zone": "Fisherton"
    }
  ]
}

7.4 GET /v1/users/:userId/public-profile
Devuelve perfil público resumido.
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_456",
      "firstName": "Martina",
      "instagramHandle": "marti.style",
      "city": "Rosario",
      "zone": "Pichincha"
    },
    "trust": {
      "phoneVerified": true,
      "completedTransactions": 8,
      "successRate": 0.88,
      "avgResponseTimeHours": 3,
      "cancellations": 1
    },
    "availableActions": {
      "canViewListings": true,
      "canStartDirectChat": false
    }
  },
  "meta": {}
}

7.5 GET /v1/users/:userId/listings
Lista publicaciones visibles de un usuario.

8. Catalog & Listings
8.1 POST /v1/listings
Crea un listing en estado DRAFT.
Request
{
  "garment": {
    "category": "hoodie",
    "subcategory": "oversized",
    "size": "M",
    "condition": "USED_GOOD",
    "brand": "Nike",
    "color": "Black"
  },
  "commercialConfig": {
    "allowsPurchase": true,
    "allowsTrade": true,
    "price": 18000,
    "tradePreferences": {
      "desiredCategories": ["jacket", "sneakers"],
      "desiredSizes": ["M", "L", "42"]
    }
  },
  "description": "Buzo en muy buen estado",
  "location": {
    "city": "Rosario",
    "zone": "Centro"
  }
}

Response
{
  "success": true,
  "data": {
    "listing": {
      "id": "lst_123",
      "state": "DRAFT",
      "ownerId": "usr_123"
    },
    "availableActions": {
      "canUploadPhotos": true,
      "canSubmitForReview": false,
      "canEdit": true,
      "canArchive": true
    }
  },
  "meta": {}
}

8.2 POST /v1/listings/:listingId/photos
Sube fotos al listing.
Request
Multipart form-data.
Response
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": "pho_1",
        "url": "https://cdn.circular/photos/pho_1.jpg",
        "position": 1,
        "auditStatus": "PENDING"
      }
    ],
    "availableActions": {
      "canSubmitForReview": true
    }
  },
  "meta": {}
}

8.3 PATCH /v1/listings/:listingId
Edita draft u observed listing.
8.4 POST /v1/listings/:listingId/submit-review
Pasa el listing a IN_REVIEW.
8.5 GET /v1/listings/:listingId
Detail surface backend-driven.
Response
{
  "success": true,
  "data": {
    "listing": {
      "id": "lst_123",
      "state": "PUBLISHED",
      "qualityScore": 86,
      "qualityLabels": ["HIGH_QUALITY", "GOOD_PHOTOS"],
      "garment": {
        "category": "hoodie",
        "size": "M",
        "condition": "USED_GOOD",
        "brand": "Nike",
        "color": "Black"
      },
      "commercialConfig": {
        "allowsPurchase": true,
        "allowsTrade": true,
        "price": 18000,
        "tradePreferences": {
          "desiredCategories": ["jacket", "sneakers"],
          "desiredSizes": ["M", "L", "42"]
        }
      },
      "location": {
        "city": "Rosario",
        "zone": "Centro"
      },
      "photos": [
        {
          "id": "pho_1",
          "url": "https://cdn.circular/photos/pho_1.jpg",
          "position": 1
        }
      ],
      "owner": {
        "id": "usr_456",
        "firstName": "Martina",
        "instagramHandle": "marti.style"
      }
    },
    "viewerContext": {
      "isOwner": false,
      "isSaved": true,
      "hasActivePurchaseIntent": false,
      "hasActiveTradeProposal": false
    },
    "availableActions": {
      "canBuy": true,
      "canTrade": true,
      "canSave": false,
      "canUnsave": true,
      "canPause": false,
      "canArchive": false,
      "canEdit": false,
      "canSubmitForReview": false,
      "canRenewReservation": false
    }
  },
  "meta": {}
}

8.6 GET /v1/listings/me
Lista listings del usuario actual.
Query params
state
cursor
limit
8.7 POST /v1/listings/:listingId/pause
Solo owner, si PUBLISHED.
8.8 POST /v1/listings/:listingId/resume
Solo owner, si PAUSED.
8.9 POST /v1/listings/:listingId/archive
Soft delete / archive.
8.10 POST /v1/listings/:listingId/renew-reservation
Solo owner, si RESERVED y ventana válida.
8.11 GET /v1/listings/:listingId/moderation
Solo owner/admin. Devuelve resultado estructurado.
Response
{
  "success": true,
  "data": {
    "moderation": {
      "status": "OBSERVED",
      "reasons": [
        {
          "code": "PHOTO_BLURRY",
          "message": "Una o más fotos están borrosas."
        },
        {
          "code": "CATEGORY_MISMATCH",
          "message": "La imagen no parece coincidir con la categoría seleccionada."
        }
      ]
    },
    "availableActions": {
      "canEdit": true,
      "canResubmit": true
    }
  },
  "meta": {}
}


9. Discovery & Feed
9.1 GET /v1/feed/swipe
Feed principal paginado, percibido como infinito.
Query params
cursor
limit
category
size
city
zone
mode (purchase|trade|both)
Response
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "lst_123",
        "photo": "https://cdn.circular/photos/pho_1.jpg",
        "category": "hoodie",
        "size": "M",
        "qualityScore": 86,
        "qualityLabels": ["HIGH_QUALITY"],
        "badges": ["PURCHASE", "TRADE"],
        "location": {
          "city": "Rosario",
          "zone": "Centro"
        },
        "price": 18000,
        "availableActions": {
          "canBuy": true,
          "canTrade": true,
          "canSave": true,
          "canDismiss": true
        }
      }
    ]
  },
  "meta": {
    "nextCursor": "cursor_2"
  }
}

9.2 GET /v1/discovery/categories
Devuelve categorías y filtros disponibles.
9.3 GET /v1/saved-listings/me
Lista publicaciones guardadas.
9.4 POST /v1/listings/:listingId/save
Guarda publicación.
9.5 DELETE /v1/listings/:listingId/save
Quita guardado.
9.6 POST /v1/feed/:listingId/dismiss
Marca descarte para tuning futuro del feed.

10. Interactions
10.1 POST /v1/listings/:listingId/purchase-intents
Crea intención de compra.
Request
{
  "source": "LISTING_DETAIL"
}

Response
{
  "success": true,
  "data": {
    "purchaseIntent": {
      "id": "pi_123",
      "state": "ACTIVE",
      "listingId": "lst_123",
      "createdAt": "2026-04-13T12:00:00Z"
    },
    "availableActions": {
      "canCancel": true
    }
  },
  "meta": {}
}

10.2 DELETE /v1/purchase-intents/:purchaseIntentId
Cancela intención activa.
10.3 POST /v1/listings/:listingId/trade-proposals
Crea propuesta de permuta.
Request
{
  "proposedListingIds": ["lst_999", "lst_998"],
  "source": "LISTING_DETAIL"
}

Response
{
  "success": true,
  "data": {
    "tradeProposal": {
      "id": "tp_123",
      "state": "ACTIVE",
      "listingId": "lst_123",
      "proposedListingIds": ["lst_999", "lst_998"]
    },
    "availableActions": {
      "canCancel": true
    }
  },
  "meta": {}
}

10.4 DELETE /v1/trade-proposals/:tradeProposalId
Cancela propuesta activa.
10.5 GET /v1/interactions/incoming
Inbox del dueño de listings.
Query params
type (purchase|trade|all)
cursor
limit
Response
{
  "success": true,
  "data": {
    "items": [
      {
        "interactionType": "TRADE_PROPOSAL",
        "id": "tp_123",
        "state": "ACTIVE",
        "targetListing": {
          "id": "lst_123",
          "photo": "https://cdn.circular/photos/pho_1.jpg",
          "category": "hoodie",
          "size": "M"
        },
        "interestedUser": {
          "id": "usr_789",
          "firstName": "Sofi",
          "trust": {
            "completedTransactions": 5,
            "successRate": 0.8,
            "avgResponseTimeHours": 2
          }
        },
        "proposedItems": [
          {
            "id": "lst_999",
            "photo": "https://cdn.circular/photos/other.jpg",
            "category": "jacket",
            "size": "M"
          }
        ],
        "availableActions": {
          "canAccept": true,
          "canReject": true,
          "canViewInterestedProfile": true,
          "canViewProposedItems": true
        }
      }
    ]
  },
  "meta": {
    "nextCursor": "cursor_2"
  }
}

10.6 POST /v1/purchase-intents/:purchaseIntentId/accept
Acepta intención y abre MatchSession.
10.7 POST /v1/purchase-intents/:purchaseIntentId/reject
10.8 POST /v1/trade-proposals/:tradeProposalId/accept
Acepta propuesta y abre MatchSession.
10.9 POST /v1/trade-proposals/:tradeProposalId/reject

11. Matches & Conversations
11.1 GET /v1/matches/me
Lista sesiones activas e históricas del usuario.
11.2 GET /v1/matches/:matchSessionId
Surface principal de coordinación.
Response
{
  "success": true,
  "data": {
    "matchSession": {
      "id": "ms_123",
      "state": "OPEN",
      "type": "TRADE",
      "expiresAt": "2026-04-14T12:00:00Z",
      "listing": {
        "id": "lst_123",
        "photo": "https://cdn.circular/photos/pho_1.jpg",
        "category": "hoodie",
        "size": "M"
      },
      "counterparty": {
        "id": "usr_789",
        "firstName": "Sofi",
        "instagramHandle": "sofi.style"
      },
      "conversation": {
        "id": "conv_123",
        "state": "OPEN"
      }
    },
    "availableActions": {
      "canSendMessage": true,
      "canUseQuickAction": true,
      "canConfirmSuccess": true,
      "canMarkFailed": true,
      "canCancel": true,
      "canShareExternalContact": false
    }
  },
  "meta": {}
}

11.3 GET /v1/conversations/:conversationId/messages
Lista mensajes del thread.
11.4 POST /v1/conversations/:conversationId/messages
Manda mensaje de texto.
Request
{
  "type": "TEXT",
  "text": "¿Te queda bien mañana a la tarde?"
}

11.5 POST /v1/conversations/:conversationId/quick-actions
Acciones rápidas guiadas.
Request
{
  "action": "PROPOSE_MEETING"
}

11.6 POST /v1/matches/:matchSessionId/confirm-success
Confirmación de cierre exitoso por una parte.
11.7 POST /v1/matches/:matchSessionId/mark-failed
Marca que no se concretó.
11.8 POST /v1/matches/:matchSessionId/cancel
Cancelación permitida por política.

12. Notifications
12.1 GET /v1/notifications/me
Lista notificaciones.
12.2 POST /v1/notifications/:notificationId/read
Marca leída.
12.3 POST /v1/notifications/read-all

13. Moderation & Safety
13.1 GET /v1/moderation/me/observed-listings
Lista publicaciones observadas del usuario.
13.2 POST /v1/listings/:listingId/report
Reporte básico de publicación o conducta.
Request
{
  "reason": "INAPPROPRIATE_CONTENT",
  "details": ""
}


14. Errores de negocio tipados (catálogo inicial)
Auth / identity
INVALID_CREDENTIALS
EMAIL_ALREADY_IN_USE
PHONE_ALREADY_IN_USE
UNAUTHORIZED
FORBIDDEN
SESSION_EXPIRED
Listings
LISTING_NOT_FOUND
LISTING_NOT_EDITABLE
LISTING_NOT_AVAILABLE
LISTING_NOT_PUBLISHED
LISTING_ALREADY_RESERVED
LISTING_ALREADY_CLOSED
LISTING_CANNOT_BE_PAUSED
LISTING_CANNOT_BE_RESUMED
LISTING_CANNOT_BE_ARCHIVED
LISTING_RESERVATION_NOT_RENEWABLE
Photos / moderation
PHOTO_UPLOAD_INVALID
PHOTO_AUDIT_PENDING
PHOTO_QUALITY_NOT_SUFFICIENT
PHOTO_CONTENT_NOT_ALLOWED
CATEGORY_IMAGE_MISMATCH
LISTING_REVIEW_NOT_APPROVED
Interactions
SELF_INTERACTION_NOT_ALLOWED
PURCHASE_INTENT_ALREADY_EXISTS
TRADE_PROPOSAL_ALREADY_EXISTS
TRADE_PROPOSAL_INVALID
PROPOSED_ITEM_NOT_OWNED
PROPOSED_ITEM_NOT_AVAILABLE
PROPOSED_ITEM_ALREADY_COMMITTED
INTERACTION_NOT_ACTIVE
INTERACTION_NOT_RESOLVABLE
Match / conversation
MATCH_NOT_FOUND
MATCH_ALREADY_CLOSED
MATCH_NOT_CONFIRMABLE
CONVERSATION_NOT_FOUND
CONVERSATION_CLOSED
QUICK_ACTION_NOT_ALLOWED
Generic
VALIDATION_ERROR
CONFLICT
RATE_LIMITED
INTERNAL_ERROR

15. Ownership por endpoint (regla resumida)
Owner only
PATCH /v1/listings/:listingId
POST /v1/listings/:listingId/submit-review
POST /v1/listings/:listingId/pause
POST /v1/listings/:listingId/resume
POST /v1/listings/:listingId/archive
POST /v1/listings/:listingId/renew-reservation
GET /v1/listings/:listingId/moderation
Interested user only
POST /v1/listings/:listingId/purchase-intents
DELETE /v1/purchase-intents/:purchaseIntentId
POST /v1/listings/:listingId/trade-proposals
DELETE /v1/trade-proposals/:tradeProposalId
Listing owner resolves
POST /v1/purchase-intents/:purchaseIntentId/accept
POST /v1/purchase-intents/:purchaseIntentId/reject
POST /v1/trade-proposals/:tradeProposalId/accept
POST /v1/trade-proposals/:tradeProposalId/reject
Matched parties only
GET /v1/matches/:matchSessionId
GET /v1/conversations/:conversationId/messages
POST /v1/conversations/:conversationId/messages
POST /v1/conversations/:conversationId/quick-actions
POST /v1/matches/:matchSessionId/confirm-success
POST /v1/matches/:matchSessionId/mark-failed
POST /v1/matches/:matchSessionId/cancel

16. Read surfaces prioritarias para frontend
Home bootstrap surface futura
Sugerida para una siguiente iteración:
GET /v1/home
Debe resumir:
profile readiness
notifications summary
active matches summary
incoming interactions summary
suggested feed entry points
Listing detail surface
Ya incluida en /v1/listings/:listingId como respuesta rica en estado y acciones.
Incoming interactions surface
Ya incluida en /v1/interactions/incoming.
Match coordination surface
Ya incluida en /v1/matches/:matchSessionId.

17. Recomendaciones de implementación
separar DTOs de escritura y read models pensados para UI
no devolver entidades ORM crudas al frontend
incluir siempre state y availableActions en surfaces principales
usar paginación por cursor en feeds, inbox y matches
mantener catálogos enumerados centralizados para categorías, talles, condiciones y razones de moderación
preparar versionado desde /v1
18. Resultado esperado
Con este documento, CirculAR ya tiene una primera definición operativa de cómo debe hablar el backend con el frontend.
La siguiente etapa recomendada es:
arquitectura backend v1
modelo relacional inicial
roadmap de implementación por módulos
bootstrap real del proyecto NestJS

