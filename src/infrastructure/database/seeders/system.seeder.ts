import { Seeder } from "@mikro-orm/seeder";

export class System extends Seeder {
    public async run(entityManager: ORM.EntityManager): Promise<void> {
        await entityManager.getConnection().execute(`
            TRUNCATE TABLE
                system.
            RESTART IDENTITY CASCADE
        `);
    }
}
