import { validate } from 'class-validator'
import {
  Column,
  Connection,
  createConnection,
  Entity,
  getRepository,
  PrimaryGeneratedColumn,
  Repository
} from 'typeorm'
import { IsFrozenWhenPreset } from '../src'

@Entity()
class User {
  @PrimaryGeneratedColumn()
  public id: number

  @IsFrozenWhenPreset()
  @Column({ type: 'int', nullable: true })
  public companyId?: number
}

let connection: Connection
let repo: Repository<User>

describe('IsFrozenWhenPreset', () => {
  beforeAll(async () => {
    connection = await createConnection({
      type: 'sqlite',
      database: `${__dirname}/testdb`,
      entities: [User],
      synchronize: true,
    })
    repo = getRepository(User)
  })

  afterAll(async () => {
    await connection.close()
  })

  it('passes unless values preset', async () => {
    const entityAttrs = repo.create()
    const entity = await repo.save(entityAttrs)

    entity.companyId = 1

    const validationErrors = await validate(entity)
    expect(validationErrors).toHaveLength(0)
  })

  it('fails when preset value changed', async () => {
    const entityAttrs = repo.create({ companyId: 1 })
    const entity = await repo.save(entityAttrs)

    entity.companyId = 2

    const validationErrors = await validate(entity)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0]).toEqual(
      expect.objectContaining({
        property: 'companyId',
        constraints: {
          IsFrozenWhenPreset: 'Value is not allowed to be changed'
        }
      })
    )
  })
})
