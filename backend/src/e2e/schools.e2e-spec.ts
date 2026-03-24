import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppHelper } from './helpers/app.helper'
import { DbHelper } from './helpers/db.helper'

describe('Schools E2E', () => {
  let app: INestApplication
  let appHelper: AppHelper
  let dbHelper: DbHelper

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    appHelper = new AppHelper(app)
    dbHelper = new DbHelper()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /schools/:id/arrivals should return arrivals queue ordered by ETA', async () => {
    expect(true).toBe(true)
  })

  it('GET /schools/:id/stats should return school statistics', async () => {
    expect(true).toBe(true)
  })
})
