import { models } from 'ihub-framework-ts';

import { ConfigService } from '../../../components/configs/services/configService'
import { newConfig } from './utils.jest';

describe('Unit Test - Config Service', () => {
    afterAll(async () => {
        const { Configs } = models;
        await Promise.all([Configs.deleteMany({})]);
    });

    beforeEach(async () => {
        const { Configs } = models;
        await Promise.all([Configs.deleteMany({})]);
        await Configs.insertMany([
            newConfig("5bd10dd619c52b0027ad29a5", "IFC", "Infracommerce"),
            newConfig("5c92f1f7a8517900190964a2", "NIKE", "Nike"),
            newConfig("5d7baecc85014200108ea948","NESPRESSO", "Nespresso")
        ]);
    });



    describe('List Stores', () => {
        it('should return a list of stores, with icon, storeCode and name', async () => {
            const config = new ConfigService();
            const response = await config.findStoresOfUser([
                "5bd10dd619c52b0027ad29a5",
                "5c92f1f7a8517900190964a2",
                "5d7baecc85014200108ea948"
            ])

            expect(response.length).toBe(3)
            expect(response[0]).toHaveProperty("storeCode","IFC");
            expect(response[0]).toHaveProperty("name","Infracommerce");
            expect(response[0]).toHaveProperty("icon","https://assets.website-files.com/60625f8508d07c3d896ed5a1/60ad38f7ee5237e42f3094ee_infracommerce-32x32-.png");
        });
    });
});
