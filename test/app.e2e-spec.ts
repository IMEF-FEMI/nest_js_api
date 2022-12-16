import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing"
import { PrismaService } from "../src/prisma/prisma.service";
import { AppModule } from "../src/app.module"
import * as pactum from "pactum"
import { AuthDto } from "../src/auth/dto";
import { EditUserDto } from "../src/user/dto";
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto";

describe("App e2e", () => {

  let app: INestApplication;
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )

    await app.init()
    await app.listen(3333)

    prisma = app.get(PrismaService)

    await prisma.cleanDb()
    pactum.request.setBaseUrl("http://localhost:3333")
  })

  afterAll(() => {
    app.close()
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: "femi@example.com",
      password: "123"
    }
    describe('Sign up', () => {
      it("should throw an exception if email is empty", () => {
        return pactum.spec()
          .post("/auth/signup")
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it("should throw an exception if password is empty", () => {
        return pactum.spec()
          .post("/auth/signup")
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
      })
      it("should signup", () => {
        return pactum.spec()
          .post("/auth/signup")
          .withBody(dto)
          .expectStatus(201)
      })
    })
    describe('Sign in', () => {

      it("should throw an exception if email is empty", () => {
        return pactum.spec()
          .post("/auth/signin")
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it("should throw an exception if password is empty", () => {
        return pactum.spec()
          .post("/auth/signin")
          .withBody({
            email: dto.email,
          })
          .expectStatus(400)
      })
      it("should signin", () => {
        return pactum.spec()
          .post("/auth/signin")
          .withBody(dto)
          .expectStatus(200)
          .stores("userAt", "access_token")
      })

    })
  })
  describe('Users', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum.spec()
          .get("/users/me")
          .withHeaders({
            "Authorization": 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })
    })
    describe('Edit User', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: "Femi",
          email: "femi@gmail.com",
        }
        return pactum.spec()
          .patch("/users")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email)
      })
    })
  })


  describe('Bookmarks', () => {
    describe('Get Empty Bookmark', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })
    })
    describe('Create Bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: "First bookmark",
        link: "http://github.com/imef-femi"
      };

      it("should create a bookmark", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(201)
          .stores("bookmarkId", "id")
      })
    })
    describe('Get Bookmark', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })
    describe('Get Bookmark by id', () => {
      it('should get bookmarks by id', () => {
        return pactum
          .spec()
          .get("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBodyContains("$S{bookmarkId}")
      })
    })
    describe('Edit bookmark by id', () => {

      const dto: EditBookmarkDto = {
        title: 'Bookmark Something', 
        description: 'More bookmark desc',
      }

      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200) 
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description)
          .inspect()
      })
     })
    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(204)  
      })

      it('should get empty bookmark', () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)  
          .expectJsonLength(0)
      })
     })

  })

})