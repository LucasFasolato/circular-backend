import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { SuccessResponseInterceptor } from '../src/common/interceptors/success-response.interceptor';
import { AppConfig } from '../src/config/app.config';
import { ImageAuditStatus } from '../src/modules/listings/domain/image-audit-status.enum';
import { LocalListingPhotoStorageService } from '../src/modules/listings/infrastructure/local-listing-photo-storage.service';
import { IMAGE_MODERATION_PROVIDER } from '../src/modules/moderation/domain/image-moderation-provider.interface';

interface AuthEnvelope {
  data: {
    accessToken: string;
  };
}

interface ListingEnvelope {
  data: {
    listing: {
      id: string;
      state: string;
    };
  };
}

interface PurchaseIntentEnvelope {
  data: {
    purchaseIntent: {
      id: string;
    };
  };
}

interface AcceptInteractionEnvelope {
  data: {
    matchSessionId: string;
    conversationThreadId: string;
    listing: {
      state: string;
    };
  };
}

interface MatchesEnvelope {
  data: {
    items: Array<{
      matchSession: {
        id: string;
        state: string;
      };
    }>;
  };
}

interface MatchDetailEnvelope {
  data: {
    matchSession: {
      id: string;
      state: string;
      conversation: {
        id: string;
        state: string;
      };
    };
    availableActions: {
      canSendMessage: boolean;
    };
  };
}

interface ConversationMutationEnvelope {
  data: {
    conversation: {
      id: string;
      state: string;
    };
    message: {
      type: string;
    };
  };
}

interface ConversationMessagesEnvelope {
  data: {
    conversation: {
      id: string;
      state: string;
    };
    items: Array<{
      type: string;
    }>;
  };
}

describe('CirculAR core flow (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let emailPrefix: string;
  let photoCounter = 0;

  beforeAll(async () => {
    emailPrefix = `e2e${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LocalListingPhotoStorageService)
      .useValue({
        storePhoto: jest.fn().mockImplementation((listingId: string) => {
          photoCounter += 1;

          return Promise.resolve({
            objectKey: `listings/${listingId}/photo-${photoCounter}.jpg`,
            publicUrl: `/uploads/listings/${listingId}/photo-${photoCounter}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 200_000 + photoCounter,
            width: 1200,
            height: 1200,
          });
        }),
      })
      .overrideProvider(IMAGE_MODERATION_PROVIDER)
      .useValue({
        auditImage: jest.fn().mockResolvedValue({
          status: ImageAuditStatus.APPROVED,
          reasons: [],
          providerName: 'e2e-stub',
          providerPayload: null,
          auditedAt: new Date(),
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService);
    const appConf = configService.get<AppConfig>('app');

    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new SuccessResponseInterceptor());

    await app.init();

    dataSource = app.get(DataSource);

    expect(appConf?.name).toBeDefined();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM "users" WHERE "email" LIKE $1`, [
        `${emailPrefix}%`,
      ]);
    }

    await app?.close();
  });

  it('registers, publishes, creates purchase intent, accepts it and exposes the reserved match surface', async () => {
    const phoneSeed = `${Date.now()}`.slice(-8);
    const owner = await registerUser(
      `${emailPrefix}-owner@example.com`,
      `+54911${phoneSeed}01`,
      'Olivia',
      'Owner',
    );
    const buyer = await registerUser(
      `${emailPrefix}-buyer@example.com`,
      `+54911${phoneSeed}02`,
      'Bruno',
      'Buyer',
    );

    const createListingResponse = await request(app.getHttpServer())
      .post('/v1/listings')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        garment: {
          category: 'TOPS',
          subcategory: 'HOODIE',
          size: 'M',
          condition: 'USED_EXCELLENT',
          brand: 'CirculAR',
          color: 'Blue',
          material: 'Cotton',
        },
        commercialConfig: {
          allowsPurchase: true,
          allowsTrade: false,
          price: 18000,
        },
        description:
          'Buzo azul en excelente estado, muy cuidado y listo para seguir circulando.',
        location: {
          city: 'Rosario',
          zone: 'Centro',
        },
      })
      .expect(201);
    const createListingBody = createListingResponse.body as ListingEnvelope;

    const listingId = createListingBody.data.listing.id;

    await request(app.getHttpServer())
      .post(`/v1/listings/${listingId}/photos`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach('photos', Buffer.from('fake-photo-1'), {
        filename: 'photo-1.jpg',
        contentType: 'image/jpeg',
      })
      .attach('photos', Buffer.from('fake-photo-2'), {
        filename: 'photo-2.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    const publishResponse = await request(app.getHttpServer())
      .post(`/v1/listings/${listingId}/submit-review`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    const publishBody = publishResponse.body as ListingEnvelope;

    expect(publishBody.data.listing.state).toBe('PUBLISHED');

    const purchaseIntentResponse = await request(app.getHttpServer())
      .post(`/v1/listings/${listingId}/purchase-intents`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        source: 'LISTING_DETAIL',
      })
      .expect(201);
    const purchaseIntentBody =
      purchaseIntentResponse.body as PurchaseIntentEnvelope;

    const purchaseIntentId = purchaseIntentBody.data.purchaseIntent.id;

    const acceptResponse = await request(app.getHttpServer())
      .post(`/v1/purchase-intents/${purchaseIntentId}/accept`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    const acceptBody = acceptResponse.body as AcceptInteractionEnvelope;

    expect(acceptBody.data.matchSessionId).toBeTruthy();
    expect(acceptBody.data.listing.state).toBe('RESERVED');

    const matchDetailResponse = await request(app.getHttpServer())
      .get(`/v1/matches/${acceptBody.data.matchSessionId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    const matchDetailBody = matchDetailResponse.body as MatchDetailEnvelope;

    expect(matchDetailBody.data.matchSession.state).toBe('OPEN');
    expect(matchDetailBody.data.availableActions.canSendMessage).toBe(true);

    const messageResponse = await request(app.getHttpServer())
      .post(
        `/v1/conversations/${acceptBody.data.conversationThreadId}/messages`,
      )
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        type: 'TEXT',
        text: 'Te escribo para coordinar el encuentro.',
      })
      .expect(201);
    const messageBody = messageResponse.body as ConversationMutationEnvelope;

    expect(messageBody.data.conversation.id).toBe(
      acceptBody.data.conversationThreadId,
    );
    expect(messageBody.data.message.type).toBe('TEXT');

    const quickActionResponse = await request(app.getHttpServer())
      .post(
        `/v1/conversations/${acceptBody.data.conversationThreadId}/quick-actions`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        action: 'PROPOSE_MEETING',
      })
      .expect(201);
    const quickActionBody =
      quickActionResponse.body as ConversationMutationEnvelope;

    expect(quickActionBody.data.message.type).toBe('QUICK_ACTION');

    const conversationMessagesResponse = await request(app.getHttpServer())
      .get(`/v1/conversations/${acceptBody.data.conversationThreadId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const conversationMessagesBody =
      conversationMessagesResponse.body as ConversationMessagesEnvelope;

    expect(conversationMessagesBody.data.items).toHaveLength(2);
    expect(conversationMessagesBody.data.conversation.state).toBe('OPEN');

    const listingDetailResponse = await request(app.getHttpServer())
      .get(`/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const listingDetailBody = listingDetailResponse.body as ListingEnvelope;

    expect(listingDetailBody.data.listing.state).toBe('RESERVED');

    const matchesResponse = await request(app.getHttpServer())
      .get('/v1/matches/me')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    const matchesBody = matchesResponse.body as MatchesEnvelope;

    expect(matchesBody.data.items).toHaveLength(1);
    expect(matchesBody.data.items[0].matchSession.id).toBe(
      acceptBody.data.matchSessionId,
    );
    expect(matchesBody.data.items[0].matchSession.state).toBe('ACTIVE');

    await request(app.getHttpServer())
      .post(`/v1/matches/${acceptBody.data.matchSessionId}/confirm-success`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(201);

    const finalConfirmResponse = await request(app.getHttpServer())
      .post(`/v1/matches/${acceptBody.data.matchSessionId}/confirm-success`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);
    const finalConfirmBody = finalConfirmResponse.body as MatchDetailEnvelope;

    expect(finalConfirmBody.data.matchSession.state).toBe('COMPLETED');
    expect(finalConfirmBody.data.matchSession.conversation.state).toBe(
      'RESTRICTED',
    );

    const closedListingResponse = await request(app.getHttpServer())
      .get(`/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const closedListingBody = closedListingResponse.body as ListingEnvelope;

    expect(closedListingBody.data.listing.state).toBe('CLOSED');
  }, 60000);

  async function registerUser(
    email: string,
    phone: string,
    firstName: string,
    lastName: string,
  ): Promise<{ accessToken: string }> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        firstName,
        lastName,
        email,
        phone,
        password: 'SecurePass123!',
      })
      .expect(201);
    const body = response.body as AuthEnvelope;

    return {
      accessToken: body.data.accessToken,
    };
  }
});
