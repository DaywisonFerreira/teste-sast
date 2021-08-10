import { mocked } from 'ts-jest/utils';

import { logger } from 'ihub-framework-ts';

import HandleExportOrders from '../../../components/orders/messages/handleExportOrders';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';

jest.mock('../../../common/services/emailService', () => ({
    EmailService: {
      send: jest.fn().mockReturnValue({ message: 'email sent'}),
    },
}))

jest.mock('../../../common/services/fileService', () => ({
    FileService: {
        createXlsxLocally: jest.fn().mockReturnValue({
            path: 'local/path',
            fileName: 'filename.xlsx'
        }),
        existsLocally: jest.fn().mockReturnValue(false)
    },
}))


describe('Test Export Orders Consumer', () => {
    const MockedEmailService = mocked(EmailService, true);
    const MockedFileService = mocked(FileService, true);


    it('should call consumer of Export Orders, and handle with request - Success', async () => {
        const payload = {
            email:"caio.fugii@hotmail.com", filter: { orderCreatedAtFrom: "2021-05-01", orderCreatedAtTo: "2021-05-30" }
        };

        const spyEmailService = jest.spyOn(MockedEmailService, 'send');
        const spyFileService = jest.spyOn(MockedFileService, 'createXlsxLocally');

        const result = await new HandleExportOrders(logger).execute(payload, () => true)

        expect(spyEmailService).toHaveBeenCalled()
        expect(spyFileService).toHaveBeenCalled()
        expect(result).toBeUndefined()
    });
});
