import fs from 'fs'
import xlsx from 'xlsx';
import { lightFormat } from 'date-fns';

import { LogService } from '@infralabs/infra-logger';


interface IExtraInfoXlsxFile{
    storeCode: string,
    filter: any
}

export class FileService {
    private static directory_path = process.env.NODE_ENV === 'production' ? `${process.cwd()}/dist/tmp` : `${process.cwd()}/src/tmp`;

    constructor(){}

	public static createXlsxLocally(data: unknown[], { storeCode, filter }: IExtraInfoXlsxFile, logger: LogService){
        try {
            if (!fs.existsSync(this.directory_path)){
                fs.mkdirSync(this.directory_path);
            }

            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(data);

            xlsx.utils.book_append_sheet(workbook, worksheet);

            const from = lightFormat(new Date(`${filter.orderCreatedAtFrom}T00:00:00`), "ddMMyyyy")
            const to = lightFormat(new Date(`${filter.orderCreatedAtTo}T23:59:59`), "ddMMyyyy")

            const fileName = `${storeCode}_Status_Entregas_${from}à${to}.xlsx`;

            xlsx.writeFile(workbook, `${this.directory_path}/${fileName}`);

            logger.add('ifc.freight.api.orders.fileService.createXlsxLocally', `Create file ${this.directory_path}/${fileName} - ${new Date().toISOString()}`);

            return {
                path: `${this.directory_path}/${fileName}`,
                fileName
            }
        } catch (error) {
            logger.error(error);
        }

	}

	public static async deleteFileLocally(path: string, logger: LogService) {
        try {
            fs.unlinkSync(path);
            logger.add('ifc.freight.api.orders.fileService.deleteFileLocally', `Delete file ${path}`);
        } catch (error) {
            logger.error(error);
        }
	}

    public static existsLocally(path:string, logger: LogService){
        try {
            logger.add('ifc.freight.api.orders.fileService.existsLocally', `Check if file exists ${path}`);
            return fs.existsSync(path)
        } catch (error) {
            logger.error(error);
        }
    }
}

